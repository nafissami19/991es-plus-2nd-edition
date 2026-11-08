import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

describe('Prompt 24 — MATRIX Mode (Mode 6)', () => {
  describe('1. Mode Entry and Selection Menus', () => {
    it('enters MATRIX mode via MODE 6 with MAT indicator and Linear Display', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6');
      assert.strictEqual(calc.mode, 6);
      const scr = calc.getScreen();
      // User's Guide capture: "Matrix?" menu, no status icons
      assert.deepStrictEqual(scr.indicators, []);
      assert.deepStrictEqual(scr.lines, [
        'Matrix?',
        '1:MatA   2:MatB',
        '3:MatC'
      ]);
      calc.pressSequence('1 5'); // MatA, 2x2 -> editor
      const ed = calc.getScreen();
      assert.ok(ed.indicators.includes('MAT'));
      assert.ok(!ed.indicators.includes('Math'), 'Math indicator must be suppressed in Linear Display');
    });

    it('displays dimension selection menu when selecting 1:MatA', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1');
      const scr = calc.getScreen();
      assert.deepStrictEqual(scr.lines, [
        '1: 3×3   2: 3×2',
        '3: 3×1   4: 2×3',
        '5: 2×2   6: 2×1'
      ]);
      assert.ok(scr.indicators.includes('Down'));
    });

    it('scrolls dimension selection menu with DOWN and UP arrows', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 DOWN');
      let scr = calc.getScreen();
      assert.deepStrictEqual(scr.lines, [
        '1: 1×3   2: 1×2',
        '3: 1×1'
      ]);
      assert.ok(scr.indicators.includes('Up'));

      calc.press('UP');
      scr = calc.getScreen();
      assert.deepStrictEqual(scr.lines, [
        '1: 3×3   2: 3×2',
        '3: 3×1   4: 2×3',
        '5: 2×2   6: 2×1'
      ]);
    });

    it('selects 5: 2x2 dimension and enters Matrix Editor for MatA', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatA(2×2)');
      assert.strictEqual(scr.lines[scr.lines.length - 1], '0');
    });
  });

  describe('2. Prompt 24 Check-Yourself Suite', () => {
    // MatA = [[2,1],[1,1]], MatB = [[2,-1],[-1,2]], MatC = [[1,0,-1],[0,-1,1]]
    function setupCheckMatrices(calc) {
      // Define MatA (2x2)
      calc.pressSequence('MODE 6 1 5 2 = 1 = 1 = 1 = AC');
      // Define MatB (2x2)
      calc.pressSequence('SHIFT 4 1 2 5 2 = (-) 1 = (-) 1 = 2 = AC');
      // Define MatC (2x3: choice 4)
      calc.pressSequence('SHIFT 4 1 3 4 1 = 0 = (-) 1 = 0 = (-) 1 = 1 = AC');
    }

    it('Check-Yourself 1: MatA × MatB = [[3,0],[1,1]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 3 × SHIFT 4 4 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 3  0 ]');
      assert.strictEqual(scr.lines[2], '[ 1  1 ]');
    });

    it('Check-Yourself 2: MatA + MatB = [[4,0],[0,3]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 3 + SHIFT 4 4 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 4  0 ]');
      assert.strictEqual(scr.lines[2], '[ 0  3 ]');
    });

    it('Check-Yourself 3: 3 × MatA = [[6,3],[3,3]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('3 × SHIFT 4 3 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 6  3 ]');
      assert.strictEqual(scr.lines[2], '[ 3  3 ]');
    });

    it('Check-Yourself 4: det(MatA) = 1 (scalar result on calc screen)', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 7 SHIFT 4 3 ) =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '1');
    });

    it('Check-Yourself 5: Trn(MatC) = [[1,0],[0,-1],[-1,1]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 8 SHIFT 4 5 ) =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(3×2)');
      assert.strictEqual(scr.lines[1], '[ 1  0 ]');
      assert.strictEqual(scr.lines[2], '[ 0  -1 ]');
      assert.strictEqual(scr.lines[3], '[ -1  1 ]');
    });

    it('Check-Yourself 6: MatA x⁻¹ = [[1,-1],[-1,2]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 3 x⁻¹ =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 1  -1 ]');
      assert.strictEqual(scr.lines[2], '[ -1  2 ]');
    });

    it('Check-Yourself 7: Abs(MatB) = [[2,1],[1,2]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('Abs SHIFT 4 4 ) =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 2  1 ]');
      assert.strictEqual(scr.lines[2], '[ 1  2 ]');
    });

    it('Check-Yourself 8: MatA x² = [[5,3],[3,2]] and MatA x³ = [[13,8],[8,5]]', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 3 x² =');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 5  3 ]');
      assert.strictEqual(scr.lines[2], '[ 3  2 ]');

      calc.press('AC');
      calc.pressSequence('SHIFT 4 3 x³ =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 13  8 ]');
      assert.strictEqual(scr.lines[2], '[ 8  5 ]');
    });

    it('Check-Yourself 9: MatA + MatC throws Dimension ERROR', () => {
      const calc = new Calculator();
      setupCheckMatrices(calc);
      calc.pressSequence('SHIFT 4 3 + SHIFT 4 5 =');
      const scr = calc.getScreen();
      assert.ok(scr.lines.some((l) => l.includes('Dimension ERROR')));
    });
  });

  describe('3. Errors and Incompatible Operations', () => {
    it('throws Dimension ERROR on non-square determinant det(MatC)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 3 4 1 = 0 = (-) 1 = 0 = (-) 1 = 1 = AC');
      calc.pressSequence('SHIFT 4 7 SHIFT 4 5 ) =');
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Dimension ERROR')));
    });

    it('throws Dimension ERROR on non-square inverse MatC x⁻¹', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 3 4 1 = 0 = (-) 1 = 0 = (-) 1 = 1 = AC');
      calc.pressSequence('SHIFT 4 5 x⁻¹ =');
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Dimension ERROR')));
    });

    it('throws Math ERROR on singular matrix inversion (det = 0)', () => {
      const calc = new Calculator();
      // [[1, 2], [2, 4]] has det = 0
      calc.pressSequence('MODE 6 1 5 1 = 2 = 2 = 4 = AC');
      calc.pressSequence('SHIFT 4 3 x⁻¹ =');
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Math ERROR')));
    });

    it('throws Dimension ERROR when referencing unassigned matrix in calculation', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 AC');
      calc.pressSequence('SHIFT 4 3 + SHIFT 4 4 =');
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Dimension ERROR')));
    });
  });

  describe('4. SHIFT 4 MATRIX Menu Operations', () => {
    it('opens SHIFT 4 menu with all 8 authentic options on screen', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 AC SHIFT 4');
      const scr = calc.getScreen();
      assert.deepStrictEqual(scr.lines, [
        '1:Dim    2:Data',
        '3:MatA   4:MatB',
        '5:MatC   6:MatAns',
        '7:det    8:Trn'
      ]);
    });

    it('re-dimensions existing matrix using 1:Dim', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 1 = 2 = 3 = 4 = AC'); // 2x2
      // Re-dimension MatA to 3x3 (choice 1)
      calc.pressSequence('SHIFT 4 1 1 1');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatA(3×3)');
    });

    it('views/edits existing matrix using 2:Data', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 5 = 6 = 7 = 8 = AC');
      calc.pressSequence('SHIFT 4 2 1'); // Data MatA
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatA(2×2)');
      assert.strictEqual(scr.lines[1], '[ 5  6 ]');
      assert.strictEqual(scr.lines[2], '[ 7  8 ]');
    });

    it('throws Dimension ERROR if 2:Data is chosen for uninitialized matrix', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 AC SHIFT 4 2 2'); // MatB uninitialized
      assert.ok(calc.getScreen().lines.some((l) => l.includes('Dimension ERROR')));
    });
  });

  describe('5. Matrix Editor & Navigation', () => {
    it('inputs fractions in editor and supports S<=>D decimal toggle', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 1 FRAC 2 =');
      // Cursor moved to (0, 1); navigate back to (0, 0)
      calc.press('LEFT');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '1┘2');

      calc.press('SD');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '0.5');
    });

    it('navigates through cells with arrow keys', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 1 0 = 2 0 = 3 0 = 4 0 =');
      assert.strictEqual(calc.getScreen().lines[scrBottom(calc)], '10');

      calc.press('RIGHT');
      assert.strictEqual(calc.getScreen().lines[scrBottom(calc)], '20');

      calc.press('DOWN');
      assert.strictEqual(calc.getScreen().lines[scrBottom(calc)], '40');

      calc.press('LEFT');
      assert.strictEqual(calc.getScreen().lines[scrBottom(calc)], '30');
    });

    it('scrolls 3x3 matrix columns and rows', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 1'); // MatA 3x3
      // Fill 1..9
      for (let i = 1; i <= 9; i++) {
        calc.pressSequence(`${i} =`);
      }
      // Cursor wraps to (0, 0)
      assert.strictEqual(calc.getScreen().lines[scrBottom(calc)], '1');

      // Scroll to bottom-right cell (2, 2)
      calc.pressSequence('DOWN DOWN RIGHT RIGHT');
      assert.strictEqual(calc.getScreen().lines[scrBottom(calc)], '9');
    });
  });

  describe('6. MatAns Screen Continuation and STO Copy', () => {
    it('presses + on MatAns screen to continue with MatAns+', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 2 = 1 = 1 = 1 = AC');
      calc.pressSequence('SHIFT 4 3 x² ='); // MatAns = [[5, 3], [3, 2]]

      // Pressing + jumps to calc screen with MatAns+
      calc.press('+');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns+');

      // Add MatA
      calc.pressSequence('SHIFT 4 3 =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 7  4 ]');
      assert.strictEqual(scr.lines[2], '[ 4  3 ]');
    });

    it('presses x⁻¹ on MatAns screen to continue with MatAns⁻¹', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 2 = 1 = 1 = 1 = AC');
      calc.pressSequence('SHIFT 4 3 ='); // MatAns = MatA
      calc.press('x⁻¹');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns⁻¹');

      calc.press('=');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatAns(2×2)');
      assert.strictEqual(scr.lines[1], '[ 1  -1 ]');
      assert.strictEqual(scr.lines[2], '[ -1  2 ]');
    });

    it('copies current matrix in editor to MatB using STO B', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 2 = 1 = 1 = 1 = AC');
      calc.pressSequence('SHIFT 4 3 x² ='); // MatAns = [[5, 3], [3, 2]]

      // Copy MatAns to MatB using STO B (SHIFT RCL DEG / B)
      calc.pressSequence('SHIFT RCL DEG');
      // Should now be editing MatB
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatB(2×2)');
      assert.strictEqual(scr.lines[1], '[ 5  3 ]');
      assert.strictEqual(scr.lines[2], '[ 3  2 ]');
    });

    it('copies in editor to MatC using STO C', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 6 1 5 9 = 8 = 7 = 6 = AC');
      calc.pressSequence('SHIFT 4 2 1'); // Open MatA editor
      calc.pressSequence('SHIFT RCL hyp'); // STO C
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'MatC(2×2)');
      assert.strictEqual(scr.lines[1], '[ 9  8 ]');
      assert.strictEqual(scr.lines[2], '[ 7  6 ]');
    });
  });
});

function scrBottom(calc) {
  return calc.getScreen().lines.length - 1;
}
