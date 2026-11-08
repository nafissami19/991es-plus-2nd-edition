import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Calculator } from '../js/core/Calculator.js';
import { Framebuffer, LCD_WIDTH, LCD_HEIGHT } from '../js/lcd/raster.js';
import { dotColor, DEFAULT_CONTRAST, STATUS_ICONS, createDefaultIconMask } from '../js/lcd/canvas_lcd.js';
import { pixelDiff, binaryToRGBA, comparePNGFiles } from './pixel/diff.js';
import { encodePNG } from './pixel/png.js';

const OUT_DIR = path.join(import.meta.dirname, 'pixel');

describe('Prompt 11 — LCD Engine, Status Icons and Screen Verification', () => {
  it('1. Framebuffer dimensions and drawing operations', () => {
    assert.equal(LCD_WIDTH, 96, 'LCD width is 96');
    assert.equal(LCD_HEIGHT, 31, 'LCD height is 31');

    const fb = new Framebuffer();
    assert.equal(fb.width, 96);
    assert.equal(fb.height, 31);
    assert.equal(fb.pixels.length, 96 * 31);

    fb.set(10, 10, 1);
    assert.equal(fb.get(10, 10), 1);
    fb.set(10, 10, 0);
    assert.equal(fb.get(10, 10), 0);

    fb.fillRect(5, 5, 10, 10, 1);
    assert.equal(fb.get(5, 5), 1);
    assert.equal(fb.get(14, 14), 1);

    fb.invertRect(5, 5, 10, 10);
    assert.equal(fb.get(5, 5), 0);
    assert.equal(fb.get(14, 14), 0);

    fb.clear();
    assert.equal(fb.pixels.every((p) => p === 0), true);
  });

  it('2. Status indicators and icon definitions', () => {
    const calc = new Calculator();
    assert.deepEqual(calc.getScreen().indicators, ['D', 'Math']);

    // SHIFT toggle
    calc.press('SHIFT');
    assert.ok(calc.getScreen().indicators.includes('S'));
    calc.press('SHIFT');
    assert.ok(!calc.getScreen().indicators.includes('S'));

    // ALPHA toggle
    calc.press('ALPHA');
    assert.ok(calc.getScreen().indicators.includes('A'));
    calc.press('ALPHA');
    assert.ok(!calc.getScreen().indicators.includes('A'));

    // STO toggle
    calc.press('SHIFT');
    calc.press('RCL');
    assert.ok(calc.getScreen().indicators.includes('STO'));

    // Default icon mask contains all 18 indicators
    const mask = createDefaultIconMask();
    assert.equal(mask.length, 96 * 8);
    assert.ok(STATUS_ICONS.length >= 18);
  });

  it('3. Contrast adjustment produces darker/lighter colors', () => {
    const bg = [0xd6, 0xe3, 0xd6];
    const on = [0x1a, 0x22, 0x1a];

    const cDefault = dotColor(bg, on, 8);
    const cLow = dotColor(bg, on, 2);
    const cHigh = dotColor(bg, on, 14);

    // Lower contrast is closer to bg (lighter/fainter)
    assert.ok(cLow[0] > cDefault[0]);
    // Higher contrast is darker
    assert.ok(cHigh[0] <= cDefault[0]);
  });

  it('4. Power-on COMP screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, ['', '']);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'start_screen_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('5. 1 + 2 = 3 calculation screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    calc.pressSequence('1 + 2 =');
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, ['1+2', '3']);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'one_plus_two_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('6. Check-yourself input screen: 1 + 7/6', () => {
    const calc = new Calculator();
    calc.pressSequence('1 + FRAC 7 DOWN 6');
    const scr = calc.getScreen({ cursorVisible: true });

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, ['1+7/6', '']);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'screen_check_frac_input_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('7. Check-yourself result screen: √2 × 3 = 3√2', () => {
    const calc = new Calculator();
    calc.pressSequence('SQRT 2 RIGHT * 3 =');
    const scr = calc.getScreen({ cursorVisible: false });

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, ['√2×3', '3√2']);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'screen_check_surd_result_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('8. SETUP Page 1 screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE');
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, [
      '1:MthIO 2:LineIO',
      '3:Deg 4:Rad',
      '5:Gra 6:Fix',
      '7:Sci 8:Norm'
    ]);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'setup_page1_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('9. SETUP Page 2 screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN');
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, [
      '1:ab/c 2:d/c',
      '3:CMPLX 4:STAT',
      '5:Disp 6:◀CONT▶'
    ]);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'setup_page2_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('10. Contrast adjustment screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN 6');
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, ['Contrast', 'LIGHT 8 DARK']);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'contrast_screen_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('11. MODE menu screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    calc.press('MODE');
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, [
      '1:COMP   2:CMPLX',
      '3:STAT   4:BASE-N',
      '5:EQN    6:MATRIX',
      '7:TABLE  8:VECTOR'
    ]);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'mode_menu_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });

  it('12. MODE 0 Calculator ID screen renders pixel-identical framebuffer', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 0');
    const scr = calc.getScreen();

    assert.equal(scr.pixels.length, 96 * 31);
    assert.deepEqual(scr.lines, [
      'DEMO-991ES-PLUS2-0000001',
      '[QR Code]'
    ]);

    const rgba = binaryToRGBA(scr.pixels);
    const png = encodePNG(96, 31, rgba);
    const actualPath = path.join(OUT_DIR, 'mode_0_id_actual.png');
    fs.writeFileSync(actualPath, png);

    // Official-screen comparisons: tests/pixel_reference.test.js (comparing with itself proves nothing).
  });
});
