import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

describe('Prompt 26 — VECTOR Mode (Mode 8)', () => {
  function setupCheckVectors(calc) {
    // VctA = (1, 2)
    calc.pressSequence('MODE 8 1 2 1 = 2 = AC');
    // VctB = (3, 4)
    calc.pressSequence('SHIFT 5 1 2 2 3 = 4 = AC');
    // VctC = (2, -1, 2)
    calc.pressSequence('SHIFT 5 1 3 1 2 = (-) 1 = 2 = AC');
  }

  describe('1. Mode Entry and Selection Menus', () => {
    it('enters VECTOR mode via MODE 8 with VCT indicator and Linear Display', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8');
      assert.strictEqual(calc.mode, 8);
      assert.strictEqual(calc.app.title, 'Vector');
      // User's Guide capture: "Vector?" menu, no status icons
      assert.deepEqual(calc.indicators(), []);
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'Vector?');
      assert.strictEqual(scr.lines[1], '1:VctA   2:VctB');
      assert.strictEqual(scr.lines[2], '3:VctC');
      calc.pressSequence('1 2'); // VctA, 2 elements -> editor
      assert.ok(calc.indicators().includes('VCT'));
      assert.ok(!calc.indicators().includes('Math'));
    });

    it('displays dimension selection menu when selecting 1:VctA', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 1');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctA');
      assert.strictEqual(scr.lines[1], '1: 3');
      assert.strictEqual(scr.lines[2], '2: 2');
    });

    it('selects dimension 2 and enters Vector Editor for VctA', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 1 2');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctA(2)');
      assert.strictEqual(scr.lines[1], '[ 0  0 ]');
    });
  });

  describe('2. Prompt 26 Check-Yourself Suite', () => {
    it('Check-Yourself 1: VctA + VctB = [4, 6]', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 + SHIFT 5 4 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctAns(2)');
      assert.strictEqual(scr.lines[1], '[ 4  6 ]');
    });

    it('Check-Yourself 2: 3 x VctA = [3, 6], then - VctB = [0, 2]', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('3 * SHIFT 5 3 =');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctAns(2)');
      assert.strictEqual(scr.lines[1], '[ 3  6 ]');

      // Continue with - VctB
      calc.pressSequence('- SHIFT 5 4 =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctAns(2)');
      assert.strictEqual(scr.lines[1], '[ 0  2 ]');
    });

    it('Check-Yourself 3: VctA • VctB (SHIFT 5 7) = 11', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 SHIFT 5 7 SHIFT 5 4 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '11');
    });

    it('Check-Yourself 4: VctA x VctB = [0, 0, -2] (2D cross product yielding 3D vector)', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 * SHIFT 5 4 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctAns(3)');
      assert.strictEqual(scr.lines[1], '[ 0  0  -2 ]');
    });

    it('Check-Yourself 5: Abs(VctC) = 3', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('Abs SHIFT 5 5 ) =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '3');
    });

    it('Check-Yourself 6: Fix 3: cos⁻¹((VctA•VctB) ÷ (Abs(VctA) Abs(VctB))) = 10.305', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      // SETUP Fix 3: SHIFT MODE 6 3
      calc.pressSequence('SHIFT MODE 6 3');
      // cos⁻¹((VctA•VctB) ÷ (Abs(VctA) * Abs(VctB)))
      calc.pressSequence('SHIFT COS ( ( SHIFT 5 3 SHIFT 5 7 SHIFT 5 4 ) / ( Abs SHIFT 5 3 ) * Abs SHIFT 5 4 ) ) ) =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '10.305');
    });

    it('Check-Yourself 7: VctA + VctC throws Dimension ERROR', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 + SHIFT 5 5 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'Dimension ERROR');
    });
  });

  describe('3. Errors and Incompatible Operations', () => {
    it('throws Dimension ERROR on mismatched dimensions in dot product (VctA • VctC)', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 SHIFT 5 7 SHIFT 5 5 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Dimension ERROR');
    });

    it('throws Dimension ERROR on mismatched dimensions in cross product (VctA x VctC)', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 * SHIFT 5 5 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Dimension ERROR');
    });

    it('throws Dimension ERROR when referencing unassigned vector variable', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 AC SHIFT 5 3 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Dimension ERROR');
    });

    it('throws Math ERROR on division by zero scalar', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 / 0 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
    });
  });

  describe('4. SHIFT 5 VECTOR Menu Operations', () => {
    it('opens SHIFT 5 menu with 2 pages and 7 authentic options', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 AC SHIFT 5');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], '1:Dim    2:Data');
      assert.strictEqual(scr.lines[1], '3:VctA   4:VctB');
      assert.ok(calc.indicators().includes('Down'));

      calc.press('DOWN');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], '5:VctC   6:VctAns');
      assert.strictEqual(scr.lines[1], '7:Dot');
      assert.ok(calc.indicators().includes('Up'));
    });

    it('re-dimensions existing vector using 1:Dim', () => {
      const calc = new Calculator();
      setupCheckVectors(calc); // VctA was 2D
      calc.pressSequence('SHIFT 5 1 1 1'); // 1:Dim -> 1:VctA -> 1: 3D
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctA(3)');
      assert.strictEqual(scr.lines[1], '[ 0  0  0 ]');
    });

    it('views/edits existing vector using 2:Data', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 2 1'); // 2:Data -> 1:VctA
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctA(2)');
      assert.strictEqual(scr.lines[1], '[ 1  2 ]');
    });

    it('throws Dimension ERROR if 2:Data is chosen for uninitialized vector', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 AC SHIFT 5 2 2'); // VctB uninitialized
      assert.strictEqual(calc.getScreen().lines[0], 'Dimension ERROR');
    });
  });

  describe('5. Vector Editor & Navigation', () => {
    it('inputs fractions in editor and supports S<=>D decimal toggle', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 1 2 1 FRAC 2 =');
      // Cursor moved to element 1; navigate back to element 0
      calc.press('LEFT');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '1┘2');

      calc.press('SD');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '0.5');
    });

    it('navigates through elements with arrow keys', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 8 1 1 1 0 = 2 0 = 3 0 ='); // VctA 3D
      assert.strictEqual(calc.app.cellIdx, 0); // wrapped to 0
      assert.strictEqual(calc.getScreen().lines[calc.getScreen().lines.length - 1], '10');

      calc.press('RIGHT');
      assert.strictEqual(calc.app.cellIdx, 1);
      assert.strictEqual(calc.getScreen().lines[calc.getScreen().lines.length - 1], '20');

      calc.press('RIGHT');
      assert.strictEqual(calc.app.cellIdx, 2);
      assert.strictEqual(calc.getScreen().lines[calc.getScreen().lines.length - 1], '30');

      calc.press('LEFT');
      assert.strictEqual(calc.app.cellIdx, 1);
      assert.strictEqual(calc.getScreen().lines[calc.getScreen().lines.length - 1], '20');
    });
  });

  describe('6. VctAns Screen Continuation and STO Copy', () => {
    it('presses + on VctAns screen to continue with VctAns+', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 + SHIFT 5 4 ='); // VctAns = [4, 6]

      // Press + to continue
      calc.press('+');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctAns+');

      // Add VctA
      calc.pressSequence('SHIFT 5 3 =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctAns(2)');
      assert.strictEqual(scr.lines[1], '[ 5  8 ]');
    });

    it('presses dot on VctAns screen to continue with VctAns•', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 ='); // VctAns = VctA = [1, 2]

      // Press SHIFT 5 7 (Dot)
      calc.pressSequence('SHIFT 5 7');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctA•');

      // Dot with VctB
      calc.pressSequence('SHIFT 5 4 =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '11');
    });

    it('copies vector from editor to VctB using STO B', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 2 1'); // Open VctA editor [1, 2]
      calc.pressSequence('SHIFT RCL DEG'); // STO B
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctB(2)');
      assert.strictEqual(scr.lines[1], '[ 1  2 ]');
    });

    it('copies vector from VctAns to VctC using STO C', () => {
      const calc = new Calculator();
      setupCheckVectors(calc);
      calc.pressSequence('SHIFT 5 3 + SHIFT 5 4 ='); // VctAns = [4, 6]
      calc.pressSequence('SHIFT RCL hyp'); // STO C
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'VctC(2)');
      assert.strictEqual(scr.lines[1], '[ 4  6 ]');
    });
  });
});
