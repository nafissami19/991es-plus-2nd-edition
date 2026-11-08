import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Calculator } from '../js/core/Calculator.js';
import { MINUS } from '../js/core/format/display.js';

describe('Prompt 18 — Calculus: Numerical Integration (∫)', () => {
  it('Check-yourself 1: MathO ∫ ln X ) from 1 to e = 1', () => {
    const calc = new Calculator();
    calc.pressSequence('INTEGRAL ln X ) RIGHT 1 RIGHT e =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '∫(ln(X),1,e)');
    assert.strictEqual(scr.lines[1], '1');
  });

  it('Check-yourself 2: LineIO ∫ 1 ÷ X² , 1 , 5 , 1×10⁻⁷ ) = 0.8', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2'); // LineIO
    calc.pressSequence('INTEGRAL 1 / X x² , 1 , 5 , 1 ×10ˣ (-) 7 ) =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '∫(1÷X²,1,5,1×10-7)');
    assert.strictEqual(scr.lines[1], '0.8');
  });

  it('Check-yourself 3: Rad ∫ (sin X + cos X)² from 0 to π = π (3.141592654)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 4'); // Rad
    calc.pressSequence('INTEGRAL ( sin X ) + cos X ) ) x² RIGHT 0 RIGHT π =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '∫((sin(X)+cos(X))²,0,π)');
    assert.strictEqual(scr.lines[1], '3.141592654');
  });

  it('computes polynomial integral with negative area where f(x) < 0', () => {
    const calc = new Calculator();
    // ∫(X, -2, 0) = -2
    calc.pressSequence('INTEGRAL X RIGHT (-) 2 RIGHT 0 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], `${MINUS}2`);
  });

  it('computes integral where upper limit is less than lower limit: ∫(X, 1, 0) = -1/2', () => {
    const calc = new Calculator();
    calc.pressSequence('INTEGRAL X RIGHT 1 RIGHT 0 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], `${MINUS}1/2`);
  });

  it('returns 0 when limits are equal: ∫(sin X, 2, 2) = 0', () => {
    const calc = new Calculator();
    calc.pressSequence('INTEGRAL sin X ) RIGHT 2 RIGHT 2 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '0');
  });

  it('throws Argument ERROR on invalid tolerance (tol <= 0 or tol >= 1)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2'); // LineIO
    calc.pressSequence('INTEGRAL X , 0 , 1 , 0 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Argument ERROR');

    calc.pressSequence('AC');
    calc.pressSequence('INTEGRAL X , 0 , 1 , 1 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Argument ERROR');
  });
});

describe('Prompt 18 — Calculus: Derivative (d/dx)', () => {
  it('Check-yourself 4: Rad d/dx(sin X)|_π/2 = 0', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 4'); // Rad
    calc.pressSequence('SHIFT INTEGRAL sin X ) RIGHT π / 2 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'd/dx(sin(X),π÷2)');
    assert.strictEqual(scr.lines[1], '0');
  });

  it('Check-yourself 5: LineIO d/dx(3X²−5X+2, 2, 1×10⁻¹²) = 7', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2'); // LineIO
    calc.pressSequence('SHIFT INTEGRAL 3 X x² - 5 X + 2 , 2 , 1 ×10ˣ (-) 1 2 ) =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'd/dx(3X²−5X+2,2,1×10-12)');
    assert.strictEqual(scr.lines[1], '7');
  });

  it('computes derivative of polynomial d/dx(X³)|_3 = 27', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT INTEGRAL X SHIFT x² RIGHT 3 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '27');
  });

  it('computes derivative at negative coordinate: d/dx(X²)|_(-4) = -8', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT INTEGRAL X x² RIGHT (-) 4 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], `${MINUS}8`);
  });

  it('throws Argument ERROR on invalid tolerance for d/dx', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2'); // LineIO
    calc.pressSequence('SHIFT INTEGRAL X x² , 2 , 0 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Argument ERROR');
  });
});

describe('Prompt 18 — Calculus: Summation (Σ)', () => {
  it('Check-yourself 6: Σ(X + 1, 1, 5) = 20', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT LOGBASE X + 1 RIGHT 1 RIGHT 5 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Σ(X+1,1,5)');
    assert.strictEqual(scr.lines[1], '20');
  });

  it('computes sum of squares Σ(X², 1, 10) = 385', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT LOGBASE X x² RIGHT 1 RIGHT 1 0 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '385');
  });

  it('computes sum with negative bounds: Σ(X, -3, 3) = 0', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT LOGBASE X RIGHT (-) 3 RIGHT 3 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], '0');
  });

  it('throws Math ERROR when lower limit > upper limit: Σ(X, 5, 1)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT LOGBASE X RIGHT 5 RIGHT 1 =');
    assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
  });

  it('throws Math ERROR when limits are not integers: Σ(X, 1.5, 5)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT LOGBASE X RIGHT 1 . 5 RIGHT 5 =');
    assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
  });

  it('throws Math ERROR when limits exceed 1e10 bound: Σ(X, 1, 1e10)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT LOGBASE X RIGHT 1 RIGHT 1 ×10ˣ 1 0 =');
    assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
  });
});

describe('Prompt 18 — Calculus: Disallowed Nested Functions & Restrictions', () => {
  it('throws Syntax ERROR when Pol is nested inside integral f(x)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2'); // LineIO
    calc.pressSequence('INTEGRAL Pol( 1 , X ) , 0 , 1 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
  });

  it('throws Syntax ERROR when integral is nested inside another integral', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2');
    calc.pressSequence('INTEGRAL INTEGRAL X , 0 , 1 ) , 0 , 1 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
  });

  it('throws Syntax ERROR when d/dx is nested inside summation', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2');
    calc.pressSequence('sum( diff( X , 1 ) , 1 , 5 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
  });

  it('throws Syntax ERROR when integral is used inside Pol coordinates', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 2');
    calc.pressSequence('Pol( INTEGRAL X , 0 , 1 ) , 1 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
  });

  it('disallows calculus in non-COMP mode (e.g. BASE-N)', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 4'); // BASE-N mode
    calc.pressSequence('INTEGRAL 1 , 0 , 1 ) =');
    assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
  });
});
