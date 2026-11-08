import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEY_NAMES, resolveKey } from '../js/core/keys.js';
import { Calculator } from '../js/core/Calculator.js';
import { buildShortcutMap } from '../js/keypad.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Prompt 3 — Faceplate & Key Layout Validation', () => {
  const layoutPath = path.join(ROOT_DIR, 'assets', 'data', 'key_layout.json');
  const lcdPath = path.join(ROOT_DIR, 'assets', 'data', 'lcd_config.json');
  const svgPath = path.join(ROOT_DIR, 'assets', 'faceplate', 'faceplate.svg');

  it('assets/data/key_layout.json exists and contains exactly 50 entries', () => {
    assert.ok(fs.existsSync(layoutPath), 'key_layout.json must exist');
    const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    assert.strictEqual(layout.length, 50, 'Must have exactly 50 physical keys');
  });

  it('every entry has required fields: name, rect, primary, shortcuts', () => {
    const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    const names = new Set();
    for (const k of layout) {
      assert.ok(k.name, 'Each entry must have a name');
      assert.ok(k.rect, `${k.name} must have a rect`);
      assert.strictEqual(typeof k.rect.x, 'number');
      assert.strictEqual(typeof k.rect.y, 'number');
      assert.strictEqual(typeof k.rect.w, 'number');
      assert.strictEqual(typeof k.rect.h, 'number');
      assert.ok(k.rect.w > 0 && k.rect.h > 0);
      assert.ok(!names.has(k.name), `Duplicate key name: ${k.name}`);
      names.add(k.name);
    }
    assert.strictEqual(names.size, 50);
  });

  it('all 50 key names match KEY_NAMES specification', () => {
    const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    const layoutNames = layout.map(k => k.name);
    assert.deepStrictEqual(layoutNames.sort(), [...KEY_NAMES].sort());
  });

  it('every one of the 50 keys resolves cleanly in keys.js and Calculator.press()', () => {
    const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    for (const k of layout) {
      const resolved = resolveKey(k.name);
      assert.ok(resolved.length > 0, `${k.name} must resolve to at least one key`);
      assert.strictEqual(resolved[0], k.name, `${k.name} must resolve to itself as primary`);

      const calc = new Calculator();
      // Should not throw
      assert.doesNotThrow(() => {
        calc.press(k.name);
      }, `Pressing key ${k.name} should not throw`);
    }
  });

  it('assets/data/lcd_config.json specifies 96x31 dot matrix and 18 status indicators', () => {
    assert.ok(fs.existsSync(lcdPath), 'lcd_config.json must exist');
    const cfg = JSON.parse(fs.readFileSync(lcdPath, 'utf8'));
    assert.strictEqual(cfg.display.matrixWidth, 96);
    assert.strictEqual(cfg.display.matrixHeight, 31);
    assert.strictEqual(cfg.display.backgroundColor, '#C9D5CA'); // official emulator LCD colour
    assert.strictEqual(cfg.statusBar.indicators.length, 18);
    const expectedIndicators = [
      'S', 'A', 'M', 'STO', 'RCL', 'STAT', 'CMPLX', 'MAT', 'VCT',
      'D', 'R', 'G', 'FIX', 'SCI', 'Math', '▼', '▲', 'Disp'
    ];
    assert.deepStrictEqual(cfg.statusBar.indicators, expectedIndicators);
  });

  it('assets/faceplate/faceplate.svg exists with 644x1250 viewport and 50 key elements', () => {
    assert.ok(fs.existsSync(svgPath), 'faceplate.svg must exist');
    const svg = fs.readFileSync(svgPath, 'utf8');
    assert.ok(svg.includes('viewBox="0 0 644 1250"'));
    assert.ok(svg.includes('fx-991ES PLUS'));
    const matches = svg.match(/class="calc-key"/g);
    assert.strictEqual(matches?.length, 50, 'SVG must contain 50 .calc-key elements');
  });

  it('PC keyboard shortcuts map correctly to official emulator equivalents', () => {
    const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    const map = buildShortcutMap(layout);

    assert.strictEqual(map.get('Tab'), 'AC');
    assert.strictEqual(map.get(' '), 'AC');
    assert.strictEqual(map.get('F1'), 'SHIFT');
    assert.strictEqual(map.get('F2'), 'ALPHA');
    assert.strictEqual(map.get('F3'), 'MODE');
    assert.strictEqual(map.get('Home'), 'MODE');
    assert.strictEqual(map.get('F4'), 'ON');
    assert.strictEqual(map.get('Enter'), 'EXE');
    assert.strictEqual(map.get('='), 'EXE');
    assert.strictEqual(map.get('Delete'), 'DEL');
    assert.strictEqual(map.get('Backspace'), 'DEL');
    assert.strictEqual(map.get('ArrowUp'), 'UP');
    assert.strictEqual(map.get('ArrowDown'), 'DOWN');
    assert.strictEqual(map.get('ArrowLeft'), 'LEFT');
    assert.strictEqual(map.get('ArrowRight'), 'RIGHT');
    assert.strictEqual(map.get('^'), 'POWER');
  });
});
