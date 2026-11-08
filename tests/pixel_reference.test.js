/**
 * Pixel tests against REAL fx-991ES PLUS 2nd edition screens.
 *
 * tests/pixel/reference/*.json are made by scripts/lcd_from_manual.py from the screen captures in
 * the official 2nd-edition User's Guide PDF. They are local-only (Casio-derived), so this test is
 * skipped when they or the traced fonts are missing. Our output is never compared with itself.
 *
 * On a mismatch, tests/pixel/out/<name>.png shows official | ours | diff
 * (red = dark only in ours, blue = dark only in the official screen).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calculator } from '../js/core/Calculator.js';
import { TRACED_FONT } from '../js/lcd/raster.js';
import { encodePNG } from './pixel/png.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REF_DIR = path.join(HERE, 'pixel', 'reference');
const OUT_DIR = path.join(HERE, 'pixel', 'out');
const W = 96;
const H = 31;
const STATUS_NAMES = ['S', 'A', 'M', 'STO', 'RCL', 'STAT', 'CMPLX', 'MAT', 'VCT', 'D', 'R', 'G', 'FIX', 'SCI',
  'Math', '▼', '▲', 'Disp'];

// Dots that differ on purpose or because a capture is ambiguous. Keep short; explain every entry.
const ALLOWED = {};

const refs = fs.existsSync(REF_DIR)
  ? fs.readdirSync(REF_DIR).filter((f) => f.endsWith('.json')).sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(REF_DIR, f), 'utf8')))
  : [];

export function writeReport(name, want, got) {
  const S = 5;
  const gap = 4;
  const PW = (W * 3 + gap * 2) * S;
  const PH = H * S;
  const rgba = new Uint8Array(PW * PH * 4);
  const put = (x, y, [r, g, b]) => {
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const o = ((y * S + j) * PW + (x * S + i)) * 4;
        rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = 255;
      }
    }
  };
  const BG = [0xc9, 0xd5, 0xca];
  const ON = [0x41, 0x45, 0x40];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W * 3 + gap * 2; x++) put(x, y, [40, 40, 40]);
    for (let x = 0; x < W; x++) {
      const a = want[y * W + x];
      const b = got[y * W + x];
      put(x, y, a ? ON : BG);
      put(W + gap + x, y, b ? ON : BG);
      put(2 * (W + gap) + x, y, a && b ? ON : a ? [40, 80, 220] : b ? [220, 40, 40] : BG);
    }
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), encodePNG(PW, PH, rgba));
}

describe('LCD matches the User\'s Guide screen captures', { skip: refs.length === 0 || !TRACED_FONT }, () => {
  for (const ref of refs) {
    it(`${ref.name}: ${ref.what} (${ref.keys})`, () => {
      const calc = new Calculator();
      if (ref.keys) calc.pressSequence(ref.keys);
      const scr = calc.getScreen({ cursorVisible: ref.cursorVisible });
      const want = new Uint8Array(W * H);
      ref.matrix.forEach((row, y) => [...row].forEach((c, x) => { want[y * W + x] = c === '#' ? 1 : 0; }));
      const got = scr.pixels;
      let wrong = 0;
      for (let i = 0; i < W * H; i++) if (want[i] !== got[i]) wrong++;
      const allowed = ALLOWED[ref.name] || 0;
      if (wrong) writeReport(ref.name, want, got);
      assert.ok(wrong <= allowed,
        `${wrong} dots differ from the official screen (allowed ${allowed}); see tests/pixel/out/${ref.name}.png`);
      if (ref.indicators) {
        const ours = (scr.indicators || []).filter((n) => STATUS_NAMES.includes(n)).sort();
        assert.deepEqual(ours, [...ref.indicators].sort(), 'status bar icons');
      }
    });
  }
});
