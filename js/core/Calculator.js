/**
 * Headless fx-991ES PLUS 2nd edition core. Owns all state; runs in Node and in the browser.
 *
 *   const calc = new Calculator();
 *   calc.press('1'); calc.pressSequence('+ 2 =');
 *   calc.getScreen() → { indicators, lines, pixels: Uint8Array(96*31), contrast, poweredOn }
 *
 * Key names are the "name" field of assets/data/key_layout.json; aliases such as
 * '+', '=', 'sin', 'π' are accepted (see keys.js).
 */

import { resolveKey } from './keys.js';
import { defaultSetup, applySetupShorthand, isMathInput } from './setup.js';
import { Memory } from './memory.js';
import { Screen } from './ui/Screen.js';
import { MODES, modeById } from './modes/registry.js';
import { MainMenuView, setupMenu, resetMenu } from './apps/systemViews.js';

export const STATE_VERSION = 1;

export class Calculator {
  constructor(options = {}) {
    this.rng = options.rng || Math.random;
    this.screen = new Screen();
    this.autoPowerOffTimeoutMin = options.autoPowerOffTimeoutMin;
    this.initializeAll();
    if (options.setup) this.configureSetup(options.setup);
  }

  // ------------------------------------------------------------ state

  initializeAll() {
    const contrast = this.setup ? this.setup.contrast : undefined;
    this.setup = defaultSetup();
    if (contrast !== undefined) this.setup.contrast = contrast;
    this.memory = new Memory();
    this.mode = 1;
    this.apps = {};
    this.views = [];
    this.shift = false;
    this.alpha = false;
    this.poweredOn = true;
    this.lastActivityTime = this.currentTime || Date.now();
    this.app.onEnter?.();
  }

  /** Golden-test shorthand: { inputOutput, angle, numberFormat, fraction, ... } */
  configureSetup(o) {
    applySetupShorthand(this.setup, o);
    this.setupChanged();
    this.app.reset?.();
  }

  reset() {
    this.initializeAll();
  }

  get app() {
    if (!this.apps[this.mode]) this.apps[this.mode] = modeById(this.mode).create(this);
    return this.apps[this.mode];
  }

  get topView() {
    return this.views.length ? this.views[this.views.length - 1] : this.app;
  }

  pushView(v) {
    this.views.push(v);
  }

  replaceView(v) {
    if (this.views.length) this.views[this.views.length - 1] = v;
    else this.views.push(v);
  }

  closeView() {
    this.views.pop();
  }

  closeAllOverlays() {
    this.views = [];
  }

  setMode(id) {
    this.views = [];
    const oldMode = this.mode;
    const old = this.apps[this.mode];
    old?.onExit?.();
    for (const app of Object.values(this.apps)) {
      app.clearHistory?.();
    }
    if (oldMode === 3) {
      this.memory.clearStatData?.();
    }
    this.apps = {};
    this.mode = id;
    this.app.onEnter?.();
  }

  /** Called after any SETUP change. */
  setupChanged() {
    for (const app of Object.values(this.apps)) app.onSetupChanged?.();
  }

  setInputOutput(io) {
    if (this.setup.inputOutput === io) return;
    const wasMath = isMathInput(this.setup);
    this.setup.inputOutput = io;
    // Changing Input/Output clears calculation history and the input
    for (const app of Object.values(this.apps)) {
      app.clearHistory?.();
      app.reset?.();
      app.notify?.('inputOutputChanged', { wasMath });
    }
  }

  notifyMode(event, data) {
    for (const app of Object.values(this.apps)) app.notify?.(event, data);
  }

  resetSetup() {
    const contrast = this.setup.contrast;
    this.setup = defaultSetup();
    this.setup.contrast = contrast;
    for (const app of Object.values(this.apps)) {
      app.clearHistory?.();
      app.reset?.();
    }
  }

  resetMemory() {
    this.memory.clear();
    for (const app of Object.values(this.apps)) {
      app.clearHistory?.();
      app.reset?.();
    }
    this.notifyMode('memoryCleared');
  }

  // ------------------------------------------------------------ power

  powerOff() {
    this.poweredOn = false;
    this.views = [];
    this.shift = false;
    this.alpha = false;
    this.notifyMode('powerOff');
  }

  /** ON: turn on (or, if on, act like a fresh start of the current mode screen). */
  powerOn() {
    const wasOff = !this.poweredOn;
    this.poweredOn = true;
    this.views = [];
    this.shift = false;
    this.alpha = false;
    this.lastActivityTime = this.currentTime || Date.now();
    for (const app of Object.values(this.apps)) {
      app.clearHistory?.();
      app.reset?.();
    }
    if (wasOff) {
      this.notifyMode('powerOn');
    }
  }

  autoPowerOff() {
    if (this.poweredOn) this.powerOff();
  }

  checkIdle(currentTime = this.currentTime || Date.now()) {
    const timeoutMin = typeof this.autoPowerOffTimeoutMin === 'number'
      ? this.autoPowerOffTimeoutMin
      : (typeof this.setup?.autoPowerOff === 'number' ? this.setup.autoPowerOff : 10);
    const timeoutMs = timeoutMin * 60 * 1000;
    if (this.poweredOn && currentTime - this.lastActivityTime >= timeoutMs) {
      this.autoPowerOff();
      return true;
    }
    return false;
  }

  advanceTime(ms) {
    this.currentTime = (this.currentTime || this.lastActivityTime || Date.now()) + ms;
    this.checkIdle(this.currentTime);
    return this.currentTime;
  }

  // ------------------------------------------------------------ keys

  press(keyName) {
    for (const k of resolveKey(keyName)) this.pressKey(k);
  }

  pressSequence(seq) {
    const list = Array.isArray(seq) ? seq : String(seq).trim().split(/\s+/);
    for (const k of list) this.press(k);
  }

  pressKey(k) {
    this.lastActivityTime = this.currentTime || Date.now();
    if (!this.poweredOn) {
      if (k === 'ON') {
        this.powerOn();
      }
      return;
    }
    if (k === 'SHIFT') {
      this.shift = !this.shift;
      this.alpha = false;
      return;
    }
    if (k === 'ALPHA') {
      this.alpha = !this.alpha;
      this.shift = false;
      return;
    }
    const ev = { key: k, shift: this.shift, alpha: this.alpha };
    this.shift = false;
    this.alpha = false;

    if (k === 'ON') {
      this.powerOn();
      return;
    }
    if (k === 'AC' && ev.shift) {
      this.powerOff();
      return;
    }
    const top = this.topView;
    if (top.captureAll) {
      top.onKey(ev);
      return;
    }
    if ((k === 'MODE' || k === 'MENU') && !ev.alpha) {
      if (ev.shift) {
        this.views = [setupMenu(this)];
      } else if (top && top.isMainMenu) {
        this.closeAllOverlays();
      } else {
        this.views = [new MainMenuView(this)];
      }
      return;
    }
    if (ev.shift && k === '9' && !top.isOverlay) {
      this.pushView(resetMenu(this));
      return;
    }
    top.onKey(ev);
  }

  qrText() {
    const lines = this.renderLines();
    return ['fx-991ES PLUS', modeById(this.mode).name, ...lines.filter((l) => l)].join('\n');
  }

  // ------------------------------------------------------------ screen

  reset() {
    this.initializeAll();
  }

  indicators() {
    const set = new Set();
    if (!this.poweredOn) return [];
    if (this.shift) set.add('S');
    if (this.alpha) set.add('A');
    if (this.memory.isMNonZero()) set.add('M');
    const linearModes = [3, 4, 6, 8];
    if (isMathInput(this.setup) && !linearModes.includes(this.mode)) set.add('Math');
    set.add(this.setup.angle === 'RAD' ? 'R' : this.setup.angle === 'GRA' ? 'G' : 'D');
    if (this.setup.numberFormat.type === 'FIX') set.add('FIX');
    if (this.setup.numberFormat.type === 'SCI') set.add('SCI');

    // Mode-specific status flags
    if (this.mode === 2) set.add('CMPLX');
    else if (this.mode === 3) set.add('STAT');
    else if (this.mode === 6) set.add('MAT');
    else if (this.mode === 8) set.add('VCT');

    // User's Guide captures: mode/variable selection menus, the SHIFT 1 STAT menus and the
    // CONSTANT/CONVERSION prompts show no status icons (only their own page arrows).
    const top = this.views.length ? this.topView : this.app;
    if (top?.menuScreen || top?.isMenuScreen?.()) set.clear();
    if (this.views.length) {
      this.topView.indicators?.(set, this);
    } else {
      this.app.indicators?.(set, this);
    }
    if (top?.menuScreen || top?.isMenuScreen?.()) {
      for (const n of [...set]) if (!['Up', 'Down', '▲', '▼'].includes(n)) set.delete(n);
    }
    if (set.has('Up')) set.add('▲');
    if (set.has('Down')) set.add('▼');
    if (set.has('▲')) set.add('Up');
    if (set.has('▼')) set.add('Down');
    const ORDER = [
      'S', 'A', 'M', 'STO', 'RCL', 'STAT', 'CMPLX', 'MAT', 'VCT',
      'D', 'R', 'G', 'FIX', 'SCI', 'Math', '▼', '▲', 'Disp',
      'Left', 'Right', 'Up', 'Down'
    ];
    return ORDER.filter((n) => set.has(n));
  }

  render(cursorVisible = true) {
    const scr = this.screen;
    scr.clear();
    scr.cursorVisible = cursorVisible;
    if (!this.poweredOn) return scr;
    this.topView.render(scr);
    scr.finalizeLines();
    return scr;
  }

  renderLines() {
    return [...this.render(false).lines];
  }

  getScreen(opts = {}) {
    const scr = this.render(opts.cursorVisible !== false);
    const ind = this.indicators();
    const indSet = new Set(ind);
    const statusIcons = {};
    for (const name of [
      'S', 'A', 'M', 'STO', 'RCL', 'STAT', 'CMPLX', 'MAT', 'VCT',
      'D', 'R', 'G', 'FIX', 'SCI', 'Math', '▼', '▲', 'Disp'
    ]) {
      statusIcons[name] = indSet.has(name);
    }
    return {
      indicators: ind,
      statusIcons,
      lines: [...scr.lines],
      pixels: scr.pixels,
      contrast: this.setup.contrast,
      poweredOn: this.poweredOn
    };
  }

  // ------------------------------------------------------------ persistence

  exportState() {
    return {
      version: STATE_VERSION,
      setup: this.setup,
      memory: this.memory.toJSON(),
      mode: this.mode,
      poweredOn: this.poweredOn,
      modeState: this.app.toJSON ? this.app.toJSON() : null
    };
  }

  importState(o) {
    if (!o || o.version !== STATE_VERSION || typeof o.setup !== 'object') throw new Error('Unsupported state');
    if (!MODES.some((m) => m.id === o.mode)) throw new Error('Unsupported state');
    this.setup = { ...defaultSetup(), ...o.setup };
    this.memory = Memory.fromJSON(o.memory);
    this.apps = {};
    this.views = [];
    this.mode = o.mode;
    this.poweredOn = o.poweredOn !== false;
    this.app.onEnter?.();
    if (o.modeState && this.app.fromJSON) {
      try {
        this.app.fromJSON(o.modeState);
      } catch {
        /* keep a fresh mode screen */
      }
    }
  }
}

export default Calculator;
