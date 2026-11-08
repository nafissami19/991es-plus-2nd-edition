/**
 * Browser entry point: owns the page, not the calculator.
 * Key presses go to calc.press(); every redraw comes from calc.getScreen().
 * Add ?pattern to the URL to draw a synthetic test pattern instead of the core.
 */

import { CanvasLCD, loadLcdConfig, snapScale, makeTestPattern, STATUS_ICONS, LCD_W } from './lcd/canvas_lcd.js';
import { Keypad, loadKeyLayout, buildShortcutMap } from './keypad.js';
import { CHANNEL_NAME, openPopout } from './popout.js';

const STATE_KEY = 'fx991es.state.v1';
const PREFS_KEY = 'fx991es.prefs.v1';
const SAVE_DEBOUNCE_MS = 400;
const BLINK_MS = 500;
const AUTO_POWER_OFF_MS = 10 * 60 * 1000;
const IDLE_CHECK_MS = 15 * 1000;
const KEY_LOG_MAX = 5000;
const FACEPLATE_W = 644;
const FACEPLATE_H = 1250;
const STAGE_MARGIN = 8;
const PATTERN_MODE = new URLSearchParams(location.search).has('pattern');

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { console.warn('localStorage write failed', e); } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

function readPrefs() {
  try { return { sound: true, enlargeLcd: false, ...JSON.parse(store.get(PREFS_KEY) || '{}') }; } catch { return { sound: true, enlargeLcd: false }; }
}

/** Loads the core and restores saved state. Returns null if the core can't load. */
async function createCalculator() {
  if (PATTERN_MODE) return null;
  let Calculator;
  try {
    ({ Calculator } = await import('./core/Calculator.js'));
    const calc = new Calculator();
    const saved = store.get(STATE_KEY);
    if (saved && typeof calc.importState === 'function') {
      try {
        calc.importState(JSON.parse(saved));
      } catch (e) {
        console.warn('Saved calculator state was not usable; starting fresh.', e);
        store.remove(STATE_KEY);
        return new Calculator();
      }
    }
    return calc;
  } catch (e) {
    console.error('Calculator core failed to load; showing the test pattern instead.', e);
    return null;
  }
}

// Short synthesised click (no audio files).
class KeyClick {
  constructor(enabled) { this.enabled = enabled; this.ctx = null; }
  play() {
    if (!this.enabled) return;
    try {
      this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.015);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    } catch { /* audio is optional */ }
  }
}

class App {
  constructor({ calc, config, layout }) {
    this.calc = calc;
    this.config = config;
    this.layout = layout;
    this.keyNames = new Set(layout.map((k) => k.name));
    this.prefs = readPrefs();
    this.click = new KeyClick(this.prefs.sound);
    this.cursorOn = true;
    this.lastKeyAt = Date.now();
    this.autoOffSent = false;
    this.keyLog = [];
    this.lastError = '';
    this.pattern = makeTestPattern();

    this.chassis = document.getElementById('chassis');
    this.stage = document.getElementById('stage');

    this.placeCanvases();
    this.fit();
    this.lcd = new CanvasLCD(
      document.getElementById('lcdCanvas'),
      document.getElementById('lcdStatusCanvas'),
      config.display,
    );
    this.lcd.loadStatusIcons();
    this.detectFaceplate();

    this.keypad = new Keypad(document.getElementById('keypad'), layout, (name) => this.press(name));
    if (this.faceplateKind) this.keypad.useRects(this.faceplateKind === 'real' ? 'rect' : 'rectSvg');

    this.channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    if (this.channel) this.channel.onmessage = (e) => this.onChannel(e.data);

    this.bindUI();
    this.bindGlobalKeys();

    window.addEventListener('resize', () => { this.fit(); this.lcd.resize(); });
    if (typeof ResizeObserver !== 'undefined' && this.stage) {
      this.resizeObserver = new ResizeObserver(() => { this.fit(); this.lcd.resize(); });
      this.resizeObserver.observe(this.stage);
    }
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('pagehide', () => this.saveNow());

    this.render();
    this.startBlink();
    setInterval(() => this.checkIdle(), IDLE_CHECK_MS);
  }

  // ---- input ----

  press(name) {
    this.lastKeyAt = Date.now();
    this.autoOffSent = false;
    this.click.play();
    this.logKey(name);
    if (this.calc) {
      try { this.calc.press(name); } catch (e) { this.reportError(`press(${name})`, e); }
    }
    this.startBlink(); // cursor shows solid right after a key
    this.render();
    this.scheduleSave();
  }

  onChannel(msg) {
    if (msg?.type === 'hello') this.render();
    else if (msg?.type === 'key' && this.keyNames.has(msg.name)) this.press(msg.name);
  }

  // ---- drawing ----

  screen() {
    if (!this.calc) {
      const pixels = this.pattern.slice();
      if (this.cursorOn) for (let y = 4; y < 14; y++) pixels[y * LCD_W + 50] = 1;
      return { pixels, indicators: STATUS_ICONS.map((i) => i.name), contrast: 8, poweredOn: true };
    }
    try {
      return this.calc.getScreen({ cursorVisible: this.cursorOn }) || {};
    } catch (e) {
      this.reportError('getScreen()', e);
      return {};
    }
  }

  render() {
    const scr = this.screen();
    this.lcd.draw(scr);
    if (!this.channel) return;
    try {
      this.channel.postMessage({
        type: 'frame',
        pixels: scr.pixels ? Uint8Array.from(scr.pixels) : null,
        indicators: Array.isArray(scr.indicators) ? [...scr.indicators] : [],
        contrast: scr.contrast,
        poweredOn: scr.poweredOn,
      });
    } catch (e) {
      this.reportError('pop-out sync', e);
    }
  }

  startBlink() {
    clearInterval(this.blinkTimer);
    this.cursorOn = true;
    this.blinkTimer = setInterval(() => {
      this.cursorOn = !this.cursorOn;
      this.render();
    }, BLINK_MS);
  }

  onVisibility() {
    if (document.hidden) {
      clearInterval(this.blinkTimer);
      this.saveNow();
    } else {
      this.checkIdle();
      this.startBlink();
      this.render();
    }
  }

  reportError(where, e) {
    const msg = `${where}: ${e?.message || e}`;
    if (msg !== this.lastError) console.error(msg, e);
    this.lastError = msg;
  }

  // ---- layout ----

  placeCanvases() {
    const d = this.config.display || {};
    const sb = this.config.statusBar || {};
    const put = (el, x, y, w, h) => {
      if (!el) return;
      el.style.left = `calc(var(--s) * ${x}px)`;
      el.style.top = `calc(var(--s) * ${y}px)`;
      el.style.width = `calc(var(--s) * ${w}px)`;
      el.style.height = `calc(var(--s) * ${h}px)`;
    };
    put(document.getElementById('lcdCanvas'), d.x ?? 130, d.y ?? 256, d.width ?? 384, d.height ?? 124);
    put(document.getElementById('lcdStatusCanvas'), sb.x ?? 130, sb.y ?? 236, sb.width ?? 384, sb.height ?? 18);
    // LCD glass of the real faceplate, repainted in the LCD background colour so no lighter rim shows
    const g = this.config.glass;
    const glass = document.getElementById('lcdGlass');
    if (glass && g) {
      put(glass, g.x, g.y, g.width, g.height);
      glass.style.borderRadius = `calc(var(--s) * ${g.radius ?? 0}px)`;
      if (d.backgroundColor) glass.style.background = d.backgroundColor;
    }
  }

  /** Fit the faceplate to the stage; snap so LCD dots are whole device pixels when close. */
  fit() {
    const r = this.stage.getBoundingClientRect();
    const fw = this.config.faceplate?.width || FACEPLATE_W;
    const fh = this.config.faceplate?.height || FACEPLATE_H;
    let s = Math.min((r.width - 2 * STAGE_MARGIN) / fw, (r.height - 2 * STAGE_MARGIN) / fh);
    const d = this.config.display || {};
    s = Math.max(0.15, snapScale(s, (d.width || 384) / (d.matrixWidth || 96)));
    this.chassis.style.setProperty('--s', s.toFixed(5));
  }

  /**
   * The real faceplate picture (assets/images/faceplate.png, local-only: python scripts/extract_faceplate.py)
   * is used when present; otherwise our own SVG drawing, with its own key positions.
   */
  detectFaceplate() {
    const real = new Image();
    real.onload = () => this.setFaceplate('real');
    real.onerror = () => {
      const svg = new Image();
      svg.onload = () => this.setFaceplate('svg');
      svg.onerror = () => this.setFaceplate('none');
      svg.src = 'assets/faceplate/faceplate.svg';
    };
    real.src = 'assets/images/faceplate.png';
  }

  setFaceplate(kind) {
    this.faceplateKind = kind;
    this.chassis.classList.toggle('real-faceplate', kind === 'real');
    this.chassis.classList.toggle('no-faceplate', kind === 'none');
    if (kind === 'real') this.chassis.style.backgroundImage = "url('assets/images/faceplate.png')";
    this.keypad?.useRects(kind === 'real' ? 'rect' : 'rectSvg');
  }

  // ---- persistence + power ----

  scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), SAVE_DEBOUNCE_MS);
  }

  saveNow() {
    clearTimeout(this.saveTimer);
    if (typeof this.calc?.exportState !== 'function') return;
    try {
      store.set(STATE_KEY, JSON.stringify(this.calc.exportState()));
    } catch (e) {
      this.reportError('exportState()', e);
    }
  }

  get autoPowerOffMs() {
    const min = this.calc?.setup?.autoPowerOff;
    return (typeof min === 'number' && min > 0 ? min : 10) * 60 * 1000;
  }

  checkIdle() {
    if (this.autoOffSent || Date.now() - this.lastKeyAt < this.autoPowerOffMs) return;
    this.autoOffSent = true;
    if (typeof this.calc?.autoPowerOff !== 'function') return;
    try { this.calc.autoPowerOff(); } catch (e) { this.reportError('autoPowerOff()', e); }
    this.render();
    this.saveNow();
  }

  // ---- UI: Toolbar, Shortcuts, KeyLog, Toast, Capture ----

  bindUI() {
    // Capture Screen
    const btnCapture = document.getElementById('btnCapture');
    btnCapture?.addEventListener('click', () => this.captureScreen());

    // KeyLog Panel Toggle
    const btnKeyLog = document.getElementById('btnKeyLog');
    const panel = document.getElementById('keyLogPanel');
    const btnKeyLogClose = document.getElementById('btnKeyLogClose');
    const toggleKeyLog = (show) => {
      const isVisible = show ?? panel?.hidden;
      if (panel) panel.hidden = !isVisible;
      btnKeyLog?.classList.toggle('active', isVisible);
    };
    btnKeyLog?.addEventListener('click', () => toggleKeyLog());
    btnKeyLogClose?.addEventListener('click', () => toggleKeyLog(false));

    // KeyLog Actions: Copy, Select All, Clear
    document.getElementById('btnKeyLogCopy')?.addEventListener('click', () => this.copyKeyLog());
    document.getElementById('btnKeyLogSelect')?.addEventListener('click', () => this.selectKeyLog());
    document.getElementById('btnKeyLogClear')?.addEventListener('click', () => this.clearKeyLog());

    // Pop-out LCD
    document.getElementById('btnPopout')?.addEventListener('click', () => openPopout());

    // Shortcuts Modal
    const btnHelp = document.getElementById('btnHelp');
    const modal = document.getElementById('shortcutModal');
    const btnHelpClose = document.getElementById('btnHelpClose');
    const toggleHelp = (show) => {
      const isVisible = show ?? modal?.hidden;
      if (modal) modal.hidden = !isVisible;
    };
    btnHelp?.addEventListener('click', () => toggleHelp(true));
    btnHelpClose?.addEventListener('click', () => toggleHelp(false));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) toggleHelp(false);
    });
  }

  bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('shortcutModal');
      const panel = document.getElementById('keyLogPanel');
      const isInput = e.target && (e.target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(e.target.tagName));

      // Escape closes modal or panel if open
      if (e.key === 'Escape') {
        if (modal && !modal.hidden) {
          modal.hidden = true;
          e.preventDefault();
          return;
        }
        if (panel && !panel.hidden && document.activeElement && panel.contains(document.activeElement)) {
          panel.hidden = true;
          document.getElementById('btnKeyLog')?.classList.remove('active');
          e.preventDefault();
          return;
        }
      }

      // '?' toggles shortcut modal when not typing in an input
      if (e.key === '?' && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (modal) modal.hidden = !modal.hidden;
        return;
      }

      // Ctrl+C / Cmd+C: Screen capture (unless actively selecting text in KeyLog or input)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        const sel = window.getSelection()?.toString();
        if (!sel || sel.length === 0) {
          e.preventDefault();
          this.captureScreen();
        }
      }
    });
  }

  logKey(name) {
    this.keyLog.push(name);
    const list = document.getElementById('keyLogList');
    if (!list) return;
    if (this.keyLog.length > KEY_LOG_MAX) {
      this.keyLog.shift();
      list.firstElementChild?.remove();
    }
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
    const container = document.getElementById('keyLogContainer');
    if (container && !document.getElementById('keyLogPanel')?.hidden) {
      container.scrollTop = container.scrollHeight;
    }
  }

  async copyKeyLog() {
    if (!this.keyLog.length) {
      this.showToast('KeyLog is empty');
      return;
    }
    const text = this.keyLog.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('KeyLog copied to clipboard');
    } catch {
      this.showToast('Clipboard access unavailable');
    }
  }

  selectKeyLog() {
    const list = document.getElementById('keyLogList');
    if (!list) return;
    const range = document.createRange();
    range.selectNodeContents(list);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  clearKeyLog() {
    this.keyLog = [];
    const list = document.getElementById('keyLogList');
    if (list) list.innerHTML = '';
    this.showToast('KeyLog cleared');
  }

  showToast(message, durationMs = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, durationMs);
  }

  async captureScreen({ withFrame = true } = {}) {
    const d = this.config.display || {};
    const sb = this.config.statusBar || {};
    const statusW = sb.width || 384;
    const statusH = sb.height || 18;
    const mainW = d.width || 384;
    const mainH = d.height || 124;
    const W = Math.max(statusW, mainW);
    const gap = 2;
    const H = statusH + gap + mainH;

    const pad = withFrame ? 12 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = (W + 2 * pad);
    canvas.height = (H + 2 * pad);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    if (withFrame) {
      ctx.fillStyle = '#1c1f22';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#2d3238';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    ctx.fillStyle = d.backgroundColor || '#D6E3D6';
    ctx.fillRect(pad, pad, W, H);

    const statusEl = document.getElementById('lcdStatusCanvas');
    if (statusEl && statusEl.width > 0) {
      ctx.drawImage(statusEl, pad, pad, statusW, statusH);
    }
    const mainEl = document.getElementById('lcdCanvas');
    if (mainEl && mainEl.width > 0) {
      ctx.drawImage(mainEl, pad, pad + statusH + gap, mainW, mainH);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          this.showToast('Screen capture copied to clipboard');
          resolve(true);
        } catch (err) {
          console.warn('Clipboard write failed:', err);
          this.showToast('Could not access clipboard');
          resolve(false);
        }
      }, 'image/png');
    });
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./sw.js').then(async () => {
    const reg = await navigator.serviceWorker.ready;
    const urls = performance.getEntriesByType('resource')
      .map((e) => e.name.split('#')[0])
      .filter((u) => u.startsWith(location.origin));
    reg.active?.postMessage({ type: 'cache-urls', urls: [location.href.split('#')[0], ...urls] });
  }).catch((e) => console.warn('Service worker registration failed:', e));
}

async function main() {
  performance.setResourceTimingBufferSize?.(2000);
  const [config, layout, calc] = await Promise.all([
    loadLcdConfig(),
    loadKeyLayout().catch((e) => { console.error(e); return []; }),
    createCalculator(),
  ]);
  window.app = new App({ calc, config, layout });
  if (document.readyState === 'complete') registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker);
}

main();
