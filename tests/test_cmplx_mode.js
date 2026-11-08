import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Calculator } from '../js/core/Calculator.js';
import { CmplxMenuView } from '../js/core/modes/complex/ComplexApp.js';
import { MINUS } from '../js/core/format/display.js';

describe('Prompt 20 — CMPLX Mode (Mode 2)', () => {
  it('switches to CMPLX mode via MODE 2 with CMPLX and Math indicators', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    assert.strictEqual(calc.mode, 2);
    const scr = calc.getScreen();
    assert.ok(scr.indicators.includes('CMPLX'));
    assert.ok(scr.indicators.includes('Math'));
  });

  it('Prompt 20 Check-yourself 1: (2 + 6i) ÷ (2i) = 3 - i', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 2 + 6 i ) / ( 2 i ) =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], `3${MINUS}i`);
  });

  it('Prompt 20 Check-yourself 2: 2 ∠ 45 = √2 + √2i', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('2 ∠ 4 5 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '2∠45');
    assert.strictEqual(scr.lines[1], '√2+√2i');
  });

  it('Prompt 20 Check-yourself 3: r∠θ setup converts √2 + √2i = 2∠45', () => {
    const calc = new Calculator();
    // SETUP Page 2 -> 3:CMPLX -> 2:r∠θ
    calc.pressSequence('MODE 2 SHIFT MODE DOWN 3 2');
    calc.pressSequence('SQRT 2 RIGHT + SQRT 2 RIGHT i =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '√2+√2i');
    assert.strictEqual(scr.lines[1], '2∠45');
  });

  it('Prompt 20 Check-yourself 4: (1 - i)⁻¹ = 1/2 + 1/2 i', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 1 - i ) RECIP =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '1/2+1/2i');
  });

  it('Prompt 20 Check-yourself 5: (1 + i)² + (1 - i)² = 0', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 1 + i ) x² + ( 1 - i ) x² =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '0');
  });

  it('Prompt 20 Check-yourself 6: Conjg(2 + 3i) = 2 - 3i via SHIFT 2 2', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('SHIFT 2 2 2 + 3 i ) =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Conjg(2+3i)');
    assert.strictEqual(scr.lines[1], `2${MINUS}3i`);
  });

  it('Prompt 20 Check-yourself 7: Abs(1 + i) = √2 and arg(1 + i) = 45', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    // Abs
    calc.pressSequence('SHIFT HYP 1 + i RIGHT =');
    assert.strictEqual(calc.getScreen().lines[1], '√2');

    // arg via SHIFT 2 1
    calc.pressSequence('AC SHIFT 2 1 1 + i ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'arg(1+i)');
    assert.strictEqual(calc.getScreen().lines[1], '45');
  });

  it('Prompt 20 Check-yourself 8: override ▸r∠θ via SHIFT 2 3 displays 2∠45', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('SQRT 2 RIGHT + SQRT 2 RIGHT i SHIFT 2 3 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '2∠45');
  });

  it('override ▸a+bi via SHIFT 2 4 displays rectangular form in polar setup', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2 SHIFT MODE DOWN 3 2'); // Polar setup
    calc.pressSequence('2 ∠ 4 5 SHIFT 2 4 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '√2+√2i');
  });

  it('opens SHIFT 2 CMPLX menu displaying 4 options', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2 SHIFT 2');
    assert(calc.topView instanceof CmplxMenuView);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '1:arg    2:Conjg');
    assert.strictEqual(scr.lines[1], '3:▸r∠θ   4:▸a+bi');

    calc.press('AC');
    assert.strictEqual(calc.views.length, 0);
  });

  it('displays rectangular result on separate lines in LineIO', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2 MODE 2'); // LineIO + CMPLX
    calc.pressSequence('( 2 + 6 i ) / ( 2 i ) =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '3');
    assert.strictEqual(scr.lines[1], `${MINUS}i`);
  });

  it('displays polar result on separate lines in LineIO (r=... and θ=...)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2 MODE 2 SHIFT MODE DOWN 3 2'); // LineIO + CMPLX + Polar
    calc.pressSequence('SQRT 2 ) + SQRT 2 ) i =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'r=2');
    assert.strictEqual(scr.lines[1], 'θ=45');
  });

  it('toggles exact and decimal forms with S<=>D key', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('1 / 3 + 1 / 4 i =');
    assert.strictEqual(calc.getScreen().lines[1], `1/3${MINUS}1/4i`);

    calc.press('SD');
    const decText = calc.getScreen().lines[1];
    assert.ok(decText.includes('0.3333333333'));
    assert.ok(decText.includes('0.25i'));

    calc.press('SD');
    assert.strictEqual(calc.getScreen().lines[1], `1/3${MINUS}1/4i`);
  });

  it('supports integer powers (1 + i)^4 = -4', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 1 + i ) POWER 4 =');
    assert.strictEqual(calc.getScreen().lines[1], `${MINUS}4`);
  });

  it('computes cube of complex number (1 + i)³ = -2 + 2i', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 1 + i ) SHIFT x² =');
    assert.strictEqual(calc.getScreen().lines[1], `${MINUS}2+2i`);
  });

  it('supports CALC with complex variables in CMPLX mode', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('A x² + 1 CALC');
    calc.pressSequence('2 =');
    assert.strictEqual(calc.getScreen().lines[1], '5');
  });

  it('prohibits calculus operations in CMPLX mode throwing Syntax ERROR', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('INTEGRAL X RIGHT 0 RIGHT 1 =');
    assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
  });

  it('prohibits SOLVE in CMPLX mode (SHIFT CALC ignored)', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('X x² + 1 == 0 SHIFT CALC');
    // Views should remain 0 (SOLVE overlay not opened)
    assert.strictEqual(calc.views.length, 0);
  });

  it('throws Math ERROR on complex division by zero', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 1 + i ) / 0 =');
    assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
  });

  it('throws Math ERROR on non-integer complex power (1+i)^0.5', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    calc.pressSequence('( 1 + i ) POWER 0 . 5 =');
    assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
  });

  it('computes arg in Rad and Gra units correctly', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2 SHIFT MODE 4'); // Rad
    calc.pressSequence('SHIFT 2 1 i ) =');
    assert.strictEqual(calc.getScreen().lines[1], '1/2π');

    calc.pressSequence('SHIFT MODE 5'); // Gra
    calc.pressSequence('SHIFT 2 1 i ) =');
    assert.strictEqual(calc.getScreen().lines[1], '100');
  });
});
