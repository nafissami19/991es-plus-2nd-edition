import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

describe('Prompt 23 — EQN Mode (Mode 5)', () => {
  describe('1. Mode Entry and Selection Menu', () => {
    it('enters EQN mode via MODE 5 and displays authentic 4-type menu', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5');
      assert.strictEqual(calc.mode, 5);
      const scr = calc.getScreen();
      assert.deepStrictEqual(scr.lines, [
        '1:anX+bnY=cn',
        '2:anX+bnY+cnZ=dn',
        '3:aX²+bX+c=0',
        '4:aX³+bX²+cX+d=0'
      ]);
    });

    it('selects 1:anX+bnY=cn directly with key 1 into 2-unknown editor', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'anX+bnY=cn');
      assert.strictEqual(scr.lines[1], 'a1=0');
    });

    it('selects 2:anX+bnY+cnZ=dn directly with key 2 into 3-unknown editor', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 2');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'anX+bnY+cnZ=dn');
      assert.strictEqual(scr.lines[1], 'a1=0');
    });

    it('selects 3:aX²+bX+c=0 directly with key 3 into quadratic editor', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'aX²+bX+c=0');
      assert.strictEqual(scr.lines[1], 'a=0');
    });

    it('selects 4:aX³+bX²+cX+d=0 directly with key 4 into cubic editor', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 4');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'aX³+bX²+cX+d=0');
      assert.strictEqual(scr.lines[1], 'a=0');
    });
  });

  describe('2. Simultaneous Linear Equations (2 and 3 Unknowns)', () => {
    it('Check-Yourself Case 1: 1 2 3 / 2 3 4 -> X=-1, Y=2', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 2 = 3 = 2 = 3 = 4 = =');
      const scrX = calc.getScreen();
      assert.strictEqual(scrX.lines[0], 'X=');
      assert.strictEqual(scrX.lines[1], '−1');
      assert.ok(scrX.indicators.includes('Down'));

      calc.press('DOWN');
      const scrY = calc.getScreen();
      assert.strictEqual(scrY.lines[0], 'Y=');
      assert.strictEqual(scrY.lines[1], '2');
      assert.ok(scrY.indicators.includes('Up'));
    });

    it('Check-Yourself Case 2: 1 -1 1 2 / 1 1 -1 0 / -1 1 1 4 -> X=1, Y=2, Z=3', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 2 1 = (-) 1 = 1 = 2 = 1 = 1 = (-) 1 = 0 = (-) 1 = 1 = 1 = 4 = =');
      const scrX = calc.getScreen();
      assert.strictEqual(scrX.lines[0], 'X=');
      assert.strictEqual(scrX.lines[1], '1');

      calc.press('DOWN');
      const scrY = calc.getScreen();
      assert.strictEqual(scrY.lines[0], 'Y=');
      assert.strictEqual(scrY.lines[1], '2');

      calc.press('DOWN');
      const scrZ = calc.getScreen();
      assert.strictEqual(scrZ.lines[0], 'Z=');
      assert.strictEqual(scrZ.lines[1], '3');
    });

    it('solves 2-unknown system with fractional solutions and supports S<=>D toggle', () => {
      // 2x + 4y = 5, 3x - y = 1 => x = 9/14, y = 13/14
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 2 = 4 = 5 = 3 = (-) 1 = 1 = =');
      const scrX = calc.getScreen();
      assert.strictEqual(scrX.lines[0], 'X=');
      assert.strictEqual(scrX.lines[1], '9/14');

      calc.press('SD');
      assert.ok(calc.getScreen().lines[1].startsWith('0.64285714'));

      calc.press('SD');
      assert.strictEqual(calc.getScreen().lines[1], '9/14');
    });

    it('simultaneous solutions are never in surd form', () => {
      // System produces rational fraction, never surd
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 3 = 1 = 2 = 1 = 1 = =');
      const scr = calc.getScreen();
      assert.ok(!scr.lines[1].includes('√'));
      assert.strictEqual(scr.lines[1], '2/5');
    });

    it('displays Math ERROR for inconsistent 2-unknown system', () => {
      // x + y = 1, x + y = 2
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 1 = 1 = 1 = 1 = 2 = =');
      const scr = calc.getScreen();
      assert.ok(scr.lines.some((l) => l.includes('Math ERROR')));

      // Pressing AC returns to editor
      calc.press('AC');
      assert.strictEqual(calc.getScreen().lines[0], 'anX+bnY=cn');
    });

    it('displays Math ERROR for dependent 2-unknown system (infinite solutions)', () => {
      // x + y = 1, 2x + 2y = 2
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 1 = 1 = 2 = 2 = 2 = =');
      const scr = calc.getScreen();
      assert.ok(scr.lines.some((l) => l.includes('Math ERROR')));
    });

    it('displays Math ERROR for singular 3-unknown system', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 2 1 = 1 = 1 = 1 = 1 = 1 = 1 = 2 = 1 = 1 = 1 = 3 = =');
      const scr = calc.getScreen();
      assert.ok(scr.lines.some((l) => l.includes('Math ERROR')));
    });
  });

  describe('3. Quadratic Equations (Type 3)', () => {
    it('Check-Yourself Case 6: 2 1 -3 -> X1=1, X2=-3/2 (larger root first)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 2 = 1 = (-) 3 = =');
      const scr1 = calc.getScreen();
      assert.strictEqual(scr1.lines[0], 'X1=');
      assert.strictEqual(scr1.lines[1], '1');

      calc.press('DOWN');
      const scr2 = calc.getScreen();
      assert.strictEqual(scr2.lines[0], 'X2=');
      assert.strictEqual(scr2.lines[1], '−3/2');
    });

    it('Check-Yourself Case 3: 1 1 3/4 -> X1=-1/2+√2/2 i, X2=-1/2-√2/2 i', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 1 = 1 = 3 FRAC 4 = =');
      const scr1 = calc.getScreen();
      assert.strictEqual(scr1.lines[0], 'X1=');
      assert.strictEqual(scr1.lines[1], '−1/2+√2/2i');
      assert.ok(scr1.indicators.includes('CMPLX'));

      calc.press('DOWN');
      const scr2 = calc.getScreen();
      assert.strictEqual(scr2.lines[0], 'X2=');
      assert.strictEqual(scr2.lines[1], '−1/2−√2/2i');
    });

    it('Check-Yourself Case 4: 1 -2√2 2 -> X=√2 (repeated root shows X=)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 1 = (-) 2 SQRT 2 RIGHT = 2 = =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'X=');
      assert.strictEqual(scr.lines[1], '√2');
      // No Up or Down indicators because there is only one root
      assert.ok(!scr.indicators.includes('Up'));
      assert.ok(!scr.indicators.includes('Down'));
    });

    it('pure repeated integer root 1 4 4 -> X=-2', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 1 = 4 = 4 = =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'X=');
      assert.strictEqual(scr.lines[1], '−2');
    });

    it('throws Math ERROR when coefficient a is 0 in quadratic', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 0 = 2 = 3 = =');
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Math ERROR')));
    });

    it('formats complex roots in polar form when SETUP CMPLX is POLAR', () => {
      const calc = new Calculator({ setup: { complex: 'POLAR' } });
      calc.pressSequence('MODE 5 3 1 = 0 = 1 = =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'X1=');
      // x² + 1 = 0 -> root i = 1∠90
      assert.strictEqual(scr.lines[1], '1∠90');
    });
  });

  describe('4. Cubic Equations (Type 4)', () => {
    it('Check-Yourself Case 5: 1 -2 -1 2 -> X1=-1, X2=2, X3=1', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 4 1 = (-) 2 = (-) 1 = 2 = =');
      const scr1 = calc.getScreen();
      assert.strictEqual(scr1.lines[0], 'X1=');
      assert.strictEqual(scr1.lines[1], '−1');

      calc.press('DOWN');
      const scr2 = calc.getScreen();
      assert.strictEqual(scr2.lines[0], 'X2=');
      assert.strictEqual(scr2.lines[1], '2');

      calc.press('DOWN');
      const scr3 = calc.getScreen();
      assert.strictEqual(scr3.lines[0], 'X3=');
      assert.strictEqual(scr3.lines[1], '1');
    });

    it('triple root in cubic: (x-1)³ = x³ - 3x² + 3x - 1 = 0 -> X=1', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 4 1 = (-) 3 = 3 = (-) 1 = =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'X=');
      assert.strictEqual(scr.lines[1], '1');
    });

    it('double root in cubic: (x-1)²(x-2) = x³ - 4x² + 5x - 2 = 0 -> X1=2, X2=1', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 4 1 = (-) 4 = 5 = (-) 2 = =');
      const scr1 = calc.getScreen();
      assert.strictEqual(scr1.lines[0], 'X1=');
      assert.strictEqual(scr1.lines[1], '2');

      calc.press('DOWN');
      const scr2 = calc.getScreen();
      assert.strictEqual(scr2.lines[0], 'X2=');
      assert.strictEqual(scr2.lines[1], '1');
    });

    it('cubic with 1 real and 2 complex roots: x³ - 1 = 0 -> X1=1, X2=-1/2+√3/2 i, X3=-1/2-√3/2 i', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 4 1 = 0 = 0 = (-) 1 = =');
      const scr1 = calc.getScreen();
      assert.strictEqual(scr1.lines[0], 'X1=');
      assert.strictEqual(scr1.lines[1], '1');

      calc.press('DOWN');
      const scr2 = calc.getScreen();
      assert.strictEqual(scr2.lines[0], 'X2=');
      assert.strictEqual(scr2.lines[1], '−1/2+√3/2i');

      calc.press('DOWN');
      const scr3 = calc.getScreen();
      assert.strictEqual(scr3.lines[0], 'X3=');
      assert.strictEqual(scr3.lines[1], '−1/2−√3/2i');
    });

    it('throws Math ERROR when coefficient a is 0 in cubic', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 4 0 = 1 = 2 = 3 = =');
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Math ERROR')));
    });
  });

  describe('5. Coefficient Editor Operations & Key Blocking', () => {
    it('blocks disallowed keys in editor: M+, M-, STO, RCL, Pol, Rec, colon', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('M_PLUS');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('SHIFT M_PLUS');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('SHIFT RCL');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('RCL');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('POL');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('REC');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');

      calc.pressSequence('COLON');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');
    });

    it('clears all coefficients to 0 when AC is pressed in editor', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 5 = 6 = 7 =');
      assert.strictEqual(calc.getScreen().lines[1], 'a2=0');

      calc.press('AC');
      // Cursor back to a1 and all values zeroed
      assert.strictEqual(calc.getScreen().lines[1], 'a1=0');
      calc.press('RIGHT');
      assert.strictEqual(calc.getScreen().lines[1], 'b1=0');
    });

    it('navigates grid cells with arrow keys and preserves entered values', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 0 = 2 0 =');
      assert.strictEqual(calc.getScreen().lines[1], 'c1=0');

      calc.press('LEFT');
      assert.strictEqual(calc.getScreen().lines[1], 'b1=20');

      calc.press('LEFT');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=10');

      calc.press('DOWN');
      assert.strictEqual(calc.getScreen().lines[1], 'a2=0');

      calc.press('UP');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=10');
    });

    it('changing equation type zeroes all coefficients', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 2 = 3 = 4 =');
      // Enter MODE 5 again to change type
      calc.pressSequence('MODE 5 3');
      assert.strictEqual(calc.getScreen().lines[1], 'a=0');
      calc.press('RIGHT');
      assert.strictEqual(calc.getScreen().lines[1], 'b=0');
    });
  });

  describe('6. Solution Screen Navigation, Memory & Absence of Vertex', () => {
    it('pressing = on the last solution returns to editor retaining coefficients', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 2 = 3 = 2 = 3 = 4 = =');
      assert.strictEqual(calc.getScreen().lines[0], 'X=');

      // Next solution
      calc.press('=');
      assert.strictEqual(calc.getScreen().lines[0], 'Y=');

      // On last solution, = returns to editor
      calc.press('=');
      assert.strictEqual(calc.getScreen().lines[0], 'anX+bnY=cn');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=1');
    });

    it('pressing AC on any solution returns to editor retaining coefficients', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 2 = 3 = 2 = 3 = 4 = =');
      assert.strictEqual(calc.getScreen().lines[0], 'X=');

      calc.press('AC');
      assert.strictEqual(calc.getScreen().lines[0], 'anX+bnY=cn');
      assert.strictEqual(calc.getScreen().lines[1], 'a1=1');
    });

    it('stores displayed solution to variable with STO A', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 2 = 3 = 2 = 3 = 4 = =');
      assert.strictEqual(calc.getScreen().lines[1], '−1');

      // Store to variable A
      calc.pressSequence('SHIFT RCL (-) '); // STO A
      // Return to COMP mode and recall A
      calc.pressSequence('MODE 1 ALPHA (-) =');
      assert.strictEqual(calc.getScreen().lines[1], '−1');
    });

    it('ENG key is blocked on solution screen', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 5 1 1 = 2 = 3 = 2 = 3 = 4 = =');
      assert.strictEqual(calc.getScreen().lines[1], '−1');

      calc.press('ENG');
      assert.strictEqual(calc.getScreen().lines[1], '−1');
    });

    it('does NOT have vertex min/max screens (unlike EX)', () => {
      // Quadratic: x² - 4 = 0 -> roots 2, -2
      const calc = new Calculator();
      calc.pressSequence('MODE 5 3 1 = 0 = (-) 4 = =');
      assert.strictEqual(calc.getScreen().lines[0], 'X1=');
      assert.strictEqual(calc.getScreen().lines[1], '2');

      calc.press('DOWN');
      assert.strictEqual(calc.getScreen().lines[0], 'X2=');
      assert.strictEqual(calc.getScreen().lines[1], '−2');

      // Pressing DOWN again does NOT show vertex, it stays on X2
      calc.press('DOWN');
      assert.strictEqual(calc.getScreen().lines[0], 'X2=');

      // Pressing = on X2 returns to editor
      calc.press('=');
      assert.strictEqual(calc.getScreen().lines[0], 'aX²+bX+c=0');
    });
  });
});
