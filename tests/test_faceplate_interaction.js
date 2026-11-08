import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPEAT_KEYS,
  REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
  EXTRA_SHORTCUTS,
  buildShortcutMap,
  startPress,
} from '../js/keypad.js';
import { CHANNEL_NAME } from '../js/popout.js';
import { decodePNG } from './pixel/png.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Prompt 28 — Faceplate Interaction, Keyboard, Pop-out, Offline', () => {
  const layoutPath = path.join(ROOT, 'assets/data/key_layout.json');
  const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
  const shortcutMap = buildShortcutMap(layout);

  describe('1. Faceplate & Repeat Timing', () => {
    it('repeat keys are strictly LEFT, RIGHT, UP, DOWN, DEL', () => {
      const expected = new Set(['LEFT', 'RIGHT', 'UP', 'DOWN', 'DEL']);
      assert.deepStrictEqual(REPEAT_KEYS, expected);
    });

    it('hold-to-repeat timing matches emulator (500ms delay, 100ms period)', () => {
      assert.strictEqual(REPEAT_DELAY_MS, 500);
      assert.strictEqual(REPEAT_INTERVAL_MS, 100);
    });

    it('startPress fires immediately on key down', () => {
      let fires = 0;
      const stop = startPress('1', () => fires++);
      assert.strictEqual(fires, 1);
      stop();
    });

    it('startPress for repeatable key initiates repeat timer', async () => {
      let fires = 0;
      const stop = startPress('DEL', () => fires++);
      assert.strictEqual(fires, 1);
      // Wait past repeat delay (550ms) to ensure repeat fires
      await new Promise((r) => setTimeout(r, 650));
      stop();
      assert.ok(fires >= 2, `Expected fires >= 2, got ${fires}`);
    });
  });

  describe('2. PC Keyboard Shortcuts', () => {
    it('official emulator shortcuts map accurately', () => {
      // Tab / Space / Esc: AC
      assert.strictEqual(shortcutMap.get('Tab'), 'AC');
      assert.strictEqual(shortcutMap.get(' '), 'AC');
      assert.strictEqual(shortcutMap.get('Escape'), 'AC');

      // F1: SHIFT, F2: ALPHA, F3/Home: MODE, F4: ON
      assert.strictEqual(shortcutMap.get('F1'), 'SHIFT');
      assert.strictEqual(shortcutMap.get('F2'), 'ALPHA');
      assert.strictEqual(shortcutMap.get('F3'), 'MODE');
      assert.strictEqual(shortcutMap.get('Home'), 'MODE');
      assert.strictEqual(shortcutMap.get('F4'), 'ON');

      // Enter / =: EXE (=)
      assert.strictEqual(shortcutMap.get('Enter'), 'EXE');
      assert.strictEqual(shortcutMap.get('='), 'EXE');

      // Delete / Backspace: DEL
      assert.strictEqual(shortcutMap.get('Delete'), 'DEL');
      assert.strictEqual(shortcutMap.get('Backspace'), 'DEL');

      // Arrow keys
      assert.strictEqual(shortcutMap.get('ArrowUp'), 'UP');
      assert.strictEqual(shortcutMap.get('ArrowDown'), 'DOWN');
      assert.strictEqual(shortcutMap.get('ArrowLeft'), 'LEFT');
      assert.strictEqual(shortcutMap.get('ArrowRight'), 'RIGHT');

      // Digits
      for (let i = 0; i <= 9; i++) {
        assert.strictEqual(shortcutMap.get(String(i)), String(i));
      }

      // Operators & symbols
      assert.strictEqual(shortcutMap.get('+'), 'ADD');
      assert.strictEqual(shortcutMap.get('-'), 'SUB');
      assert.strictEqual(shortcutMap.get('*'), 'MUL');
      assert.strictEqual(shortcutMap.get('/'), 'DIV');
      assert.strictEqual(shortcutMap.get('.'), 'DOT');
      assert.strictEqual(shortcutMap.get('^'), 'POWER');
      assert.strictEqual(shortcutMap.get('('), 'LPAREN');
      assert.strictEqual(shortcutMap.get(')'), 'RPAREN');
    });
  });

  describe('3. Pop-out Mirroring', () => {
    it('BroadcastChannel name is fx991es-lcd', () => {
      assert.strictEqual(CHANNEL_NAME, 'fx991es-lcd');
    });

    it('popout.html exists and imports startPopoutPage', () => {
      const html = fs.readFileSync(path.join(ROOT, 'popout.html'), 'utf8');
      assert.ok(html.includes('fx-991ES PLUS LCD'));
      assert.ok(html.includes('startPopoutPage'));
      assert.ok(html.includes('manifest.webmanifest'));
    });
  });

  describe('4. PWA Manifest & Custom Icons', () => {
    const manifestPath = path.join(ROOT, 'manifest.webmanifest');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    it('manifest.webmanifest contains authentic ES PLUS names', () => {
      assert.strictEqual(manifest.name, 'fx-991ES PLUS 2nd edition web re-creation');
      assert.strictEqual(manifest.short_name, '991ES PLUS');
      assert.strictEqual(manifest.display, 'standalone');
    });

    it('assets/icons/icon-192.png exists and decodes to 192x192', () => {
      const p = path.join(ROOT, 'assets/icons/icon-192.png');
      assert.ok(fs.existsSync(p));
      const buf = fs.readFileSync(p);
      const decoded = decodePNG(buf);
      assert.strictEqual(decoded.width, 192);
      assert.strictEqual(decoded.height, 192);
      assert.strictEqual(decoded.rgba.length, 192 * 192 * 4);
    });

    it('assets/icons/icon-512.png exists and decodes to 512x512', () => {
      const p = path.join(ROOT, 'assets/icons/icon-512.png');
      assert.ok(fs.existsSync(p));
      const buf = fs.readFileSync(p);
      const decoded = decodePNG(buf);
      assert.strictEqual(decoded.width, 512);
      assert.strictEqual(decoded.height, 512);
      assert.strictEqual(decoded.rgba.length, 512 * 512 * 4);
    });
  });

  describe('5. Offline Service Worker', () => {
    it('sw.js exists, defines fx991es cache and pre-caches all shell assets', () => {
      const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
      assert.ok(sw.includes('fx991es-'));

      // Extract SHELL array items
      const match = sw.match(/const SHELL = \[([\s\S]*?)\];/);
      assert.ok(match, 'sw.js must define SHELL array');
      const items = match[1]
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter((s) => s.length > 0 && s !== './');

      for (const item of items) {
        const full = path.join(ROOT, item);
        assert.ok(fs.existsSync(full), `Pre-cached asset must exist on disk: ${item}`);
      }
    });
  });

  describe('6. HTML UI Elements', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

    it('contains Screen Capture button and shortcut', () => {
      assert.ok(html.includes('id="btnCapture"'));
      assert.ok(html.includes('Capture Screen'));
    });

    it('contains KeyLog drawer panel with copy, select and clear buttons', () => {
      assert.ok(html.includes('id="keyLogPanel"'));
      assert.ok(html.includes('id="btnKeyLog"'));
      assert.ok(html.includes('id="btnKeyLogCopy"'));
      assert.ok(html.includes('id="btnKeyLogSelect"'));
      assert.ok(html.includes('id="btnKeyLogClear"'));
      assert.ok(html.includes('id="keyLogList"'));
    });

    it('contains Shortcut Help Modal overlay for "?"', () => {
      assert.ok(html.includes('id="shortcutModal"'));
      assert.ok(html.includes('PC Keyboard Shortcuts'));
      assert.ok(html.includes('id="btnHelp"'));
    });

    it('contains toast notification container', () => {
      assert.ok(html.includes('id="toast"'));
    });
  });

  describe('7. CSS Styling & LCD Crispness', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css/calculator.css'), 'utf8');

    it('chassis points to faceplate.svg', () => {
      assert.ok(css.includes("assets/faceplate/faceplate.svg"));
    });

    it('LCD canvases use pixelated rendering to avoid blur', () => {
      assert.ok(css.includes('image-rendering: crisp-edges'));
      assert.ok(css.includes('image-rendering: pixelated'));
    });

    it('defines pressed key states with tactile feedback', () => {
      assert.ok(css.includes('.calc-key.pressed'));
      assert.ok(css.includes('box-shadow: inset'));
    });

    it('has responsive mobile styles for phone screens', () => {
      assert.ok(css.includes('@media (max-width: 600px)'));
    });
  });
});
