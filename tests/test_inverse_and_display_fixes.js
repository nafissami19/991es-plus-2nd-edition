import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { getFont, glyphFor } from '../js/lcd/raster.js';
import { buildShortcutMap } from '../js/keypad.js';
import fs from 'fs';

test('1. Inverse and superscript glyphs exist in all fonts and never fall back to ?', () => {
  const fonts = ['large', 'small'];
  const testChars = ['¹', '⁰', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁻', '₀'];
  
  for (const fontName of fonts) {
    const font = getFont(fontName);
    const qGlyph = font.glyphs['?'];
    for (const ch of testChars) {
      const g = glyphFor(font, ch);
      assert.notStrictEqual(g, qGlyph, `Font ${fontName} should have glyph for '${ch}', but got '?'`);
      assert.ok(g && g.rows && g.rows.length > 0, `Glyph for '${ch}' must have valid rows`);
    }
  }
});

test('2. sin⁻¹, cos⁻¹, tan⁻¹, and x⁻¹ display cleanly with no ? symbol on LCD', () => {
  const calc = new Calculator();
  calc.press('SHIFT');
  calc.press('SIN'); // inserts sin⁻¹(
  
  const font = getFont('large');
  const qGlyph = font.glyphs['?'];
  
  const inputLine = calc.getScreen().lines[0];
  assert.ok(inputLine.includes('sin⁻¹('), `Expected sin⁻¹(, got: ${inputLine}`);
  
  for (const ch of inputLine) {
    assert.notStrictEqual(glyphFor(font, ch), qGlyph, `Character '${ch}' in sin⁻¹ input fell back to ?`);
  }
  
  // Matrix inverse
  calc.pressSequence('AC MODE 6 1 5'); // MatA 2x2
  calc.pressSequence('1 EXE 2 EXE 3 EXE 4 EXE AC');
  calc.pressSequence('SHIFT 4 3 RECIP'); // MatA⁻¹
  const matLine = calc.getScreen().lines[0];
  assert.ok(matLine.includes('MatA⁻¹'), `Expected MatA⁻¹, got: ${matLine}`);
  for (const ch of matLine) {
    assert.notStrictEqual(glyphFor(font, ch), qGlyph, `Character '${ch}' in MatA⁻¹ fell back to ?`);
  }
});

test('3. Scientific exponents (Norm 1) and Constants display with valid superscripts/subscripts', () => {
  const calc = new Calculator();
  calc.pressSequence('1 2 3 4 5 6 7 8 9 0 1 EXE'); // 1.23456789×10¹⁰
  const resultLine = calc.getScreen().lines[1];
  assert.ok(resultLine.includes('10¹⁰'), `Expected 10¹⁰, got: ${resultLine}`);
  
  const font = getFont('large');
  const qGlyph = font.glyphs['?'];
  for (const ch of resultLine) {
    assert.notStrictEqual(glyphFor(font, ch), qGlyph, `Character '${ch}' in scientific result fell back to ?`);
  }
  
  // Speed of light constant c₀
  calc.pressSequence('AC SHIFT 7 2 8 EXE');
  const constLine = calc.getScreen().lines[0];
  assert.ok(constLine.includes('c₀'), `Expected c₀, got: ${constLine}`);
  for (const ch of constLine) {
    assert.notStrictEqual(glyphFor(font, ch), qGlyph, `Character '${ch}' in constant c₀ fell back to ?`);
  }
});

test('4. Answer continuation works for x⁻¹ (RECIP) and x! (SHIFT RECIP)', () => {
  const calc = new Calculator();
  calc.pressSequence('2 ADD 3 EXE'); // result 5
  assert.strictEqual(calc.getScreen().lines[1], '5');
  
  // Pressing RECIP (x⁻¹) immediately after result continues with Ans⁻¹
  calc.press('RECIP');
  assert.strictEqual(calc.getScreen().lines[0], 'Ans⁻¹');
  calc.press('EXE');
  // 5⁻¹ = 1/5 or 0.2
  assert.ok(['1/5', '0.2'].includes(calc.getScreen().lines[1]), `Expected 1/5 or 0.2, got: ${calc.getScreen().lines[1]}`);
  
  // Pressing SHIFT RECIP (x!) immediately after result continues with Ans!
  calc.pressSequence('AC 4 EXE'); // result 4
  calc.press('SHIFT');
  calc.press('RECIP');
  assert.strictEqual(calc.getScreen().lines[0], 'Ans!');
  calc.press('EXE');
  assert.strictEqual(calc.getScreen().lines[1], '24');
});

test('5. Keyboard shortcuts map cleanly without collisions', () => {
  const layout = JSON.parse(fs.readFileSync('assets/data/key_layout.json', 'utf8'));
  const map = buildShortcutMap(layout);
  
  assert.strictEqual(map.get('s'), 'SIN', 'Key "s" must map to SIN');
  assert.strictEqual(map.get('S'), 'SIN', 'Key "S" must map to SIN');
  assert.strictEqual(map.get('Shift'), 'SHIFT', 'Key "Shift" must map to SHIFT');
  assert.strictEqual(map.get('F1'), 'SHIFT', 'Key "F1" must map to SHIFT');
  assert.strictEqual(map.get('m'), 'MPLUS', 'Key "m" must map to MPLUS');
  assert.strictEqual(map.get('F3'), 'MODE', 'Key "F3" must map to MODE');
  assert.strictEqual(map.get('Home'), 'MODE', 'Key "Home" must map to MODE');
});
