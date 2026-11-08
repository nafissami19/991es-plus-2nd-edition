/**
 * Unit and Golden Tests for Prompt 21 — STAT Mode (Mode 3).
 * Tests all 8 regression types, 1-VAR and paired, FREQ column ON/OFF,
 * editor row capacity limits (80/40/26), cell navigation, row deletion,
 * row insertion, Del-A, SHIFT 1 menus and submenus, postfix estimation,
 * normal distribution P/Q/R/▸t, data clearing rules, and Prompt 21 check-yourself cases.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { StatModel, STAT_TYPES } from '../js/core/modes/statistics/StatModel.js';

describe('Prompt 21 — STAT Mode', () => {
  describe('StatModel Limits and Retention Rules', () => {
    it('enforces row capacities: 80 (1-VAR no FREQ), 40 (1-VAR FREQ or Paired no FREQ), 26 (Paired FREQ)', () => {
      const m = new StatModel();
      m.setType(STAT_TYPES.ONE_VAR);
      m.setFreq(false);
      assert.equal(m.maxRows(), 80);

      m.setFreq(true);
      assert.equal(m.maxRows(), 40);

      m.setType(STAT_TYPES.LINEAR);
      m.setFreq(false);
      assert.equal(m.maxRows(), 40);

      m.setFreq(true);
      assert.equal(m.maxRows(), 26);
    });

    it('clears data when switching 1-VAR <-> paired, but retains data when switching among paired types', () => {
      const m = new StatModel();
      m.setType(STAT_TYPES.LINEAR);
      m.setCell(0, 'x', 10);
      m.setCell(0, 'y', 20);
      assert.equal(m.rowCount(), 1);

      // Switching among paired types retains data
      m.setType(STAT_TYPES.LOG);
      assert.equal(m.rowCount(), 1);
      assert.equal(m.rows[0].x, 10);
      assert.equal(m.rows[0].y, 20);

      // Switching to 1-VAR clears data
      m.setType(STAT_TYPES.ONE_VAR);
      assert.equal(m.rowCount(), 0);

      // Switching from 1-VAR to paired clears data
      m.setCell(0, 'x', 5);
      m.setType(STAT_TYPES.LINEAR);
      assert.equal(m.rowCount(), 0);
    });

    it('clears data when changing STAT FREQ setting', () => {
      const m = new StatModel();
      m.setType(STAT_TYPES.ONE_VAR);
      m.setFreq(false);
      m.setCell(0, 'x', 10);
      assert.equal(m.rowCount(), 1);

      m.setFreq(true);
      assert.equal(m.rowCount(), 0);
    });
  });

  describe('MODE 3 Menu and Status Indicators', () => {
    it('displays authentic 8-type numbered menu on entering MODE 3', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3');
      const lines = calc.renderLines();
      assert.deepEqual(lines, [
        '1:1-VAR   2:A+BX',
        '3:_+CX²   4:ln X',
        '5:e^X     6:A•B^X',
        '7:A•X^B   8:1/X'
      ]);
      // User's Guide capture: the type menu itself shows no status icons
      assert.deepEqual(calc.indicators(), []);
      calc.press('1');
      const inds = calc.indicators();
      assert.ok(inds.includes('STAT'));
      assert.ok(!inds.includes('Math'), 'Linear mode suppresses Math indicator');
    });

    it('clears data and resets when exiting STAT mode', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3 1 1 = 2 = 3 =');
      assert.equal(calc.app.model.rowCount(), 3);
      // Exit to COMP mode
      calc.pressSequence('MODE 1');
      assert.equal(calc.mode, 1);
      // Re-enter STAT mode
      calc.pressSequence('MODE 3 1');
      assert.equal(calc.app.model.rowCount(), 0);
    });
  });

  describe('Stat Editor Operations', () => {
    it('enters values with =, advances row, and navigates with arrow keys', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3 1 1 0 = 2 0 = 3 0 =');
      assert.equal(calc.app.model.rowCount(), 3);
      assert.equal(calc.app.model.rows[0].x, 10);
      assert.equal(calc.app.model.rows[1].x, 20);
      assert.equal(calc.app.model.rows[2].x, 30);
    });

    it('deletes a row with DEL key', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3 1 1 0 = 2 0 = 3 0 = UP UP DEL');
      assert.equal(calc.app.model.rowCount(), 2);
      assert.equal(calc.app.model.rows[0].x, 10);
      assert.equal(calc.app.model.rows[1].x, 30);
    });

    it('inserts a row with SHIFT 1 3 (Edit) 1 (Ins)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3 1 1 0 = 2 0 = UP SHIFT 1 3 1');
      assert.equal(calc.app.model.rowCount(), 3);
      assert.equal(calc.app.model.rows[0].x, 10);
      assert.equal(calc.app.model.rows[1].x, 0);
      assert.equal(calc.app.model.rows[2].x, 20);
    });

    it('deletes all data with SHIFT 1 3 (Edit) 2 (Del-A)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3 1 1 0 = 2 0 = SHIFT 1 3 2');
      assert.equal(calc.app.model.rowCount(), 0);
    });

    it('blocks M+, STO, Pol, Rec, and colon in the editor', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 3 1 1 0 = M_PLUS SHIFT RCL POL REC');
      assert.equal(calc.app.model.rowCount(), 1);
      assert.equal(calc.memory.isMNonZero(), false);
    });
  });

  describe('Prompt 21 Check-Yourself Cases', () => {
    it('Case 1: SETUP STAT ON, 1-VAR with FREQ -> mean=3, sdPopX=1.154700538', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: true });
      calc.pressSequence('MODE 3 1');
      // Enter X: 1= 2= 3= 4= 5=
      calc.pressSequence('1 = 2 = 3 = 4 = 5 =');
      // Navigate to first FREQ cell: cursor is at row 5 X; move RIGHT then UP to row 0
      calc.pressSequence('RIGHT UP UP UP UP UP');
      // FREQ: 1= 2= 3= 2= (5th stays 1)
      calc.pressSequence('1 = 2 = 3 = 2 =');
      // AC to calc screen
      calc.pressSequence('AC');
      // Mean: SHIFT 1 4 2 = -> 3
      calc.pressSequence('SHIFT 1 4 2 =');
      let lines = calc.renderLines();
      assert.equal(lines[1], '3');

      // sdPopX: AC SHIFT 1 4 3 = -> 1.154700538
      calc.pressSequence('AC SHIFT 1 4 3 =');
      lines = calc.renderLines();
      assert.equal(lines[1], '1.154700538');
    });

    it('Case 2: SETUP STAT OFF, Fix 3, Linear -> Log regression type change, r, A, B, and 160ŷ', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false, format: 'Fix 3' });
      calc.pressSequence('MODE 3 2'); // Linear A+BX
      // X: 20 110 200 290
      calc.pressSequence('2 0 = 1 1 0 = 2 0 0 = 2 9 0 =');
      // Move to top of Y column
      calc.pressSequence('RIGHT UP UP UP UP');
      // Y: 3150 7310 8800 9310
      calc.pressSequence('3 1 5 0 = 7 3 1 0 = 8 8 0 0 = 9 3 1 0 =');
      // AC to calc screen
      calc.pressSequence('AC');

      // r: SHIFT 1 5 3 = -> 0.923
      calc.pressSequence('SHIFT 1 5 3 =');
      let lines = calc.renderLines();
      assert.equal(lines[1], '0.923');

      // Switch to ln X: AC SHIFT 1 1 4
      calc.pressSequence('AC SHIFT 1 1 4');
      // AC SHIFT 1 5 3 = -> 0.998
      calc.pressSequence('AC SHIFT 1 5 3 =');
      lines = calc.renderLines();
      assert.equal(lines[1], '0.998');

      // A: SHIFT 1 5 1 = -> -3857.984
      calc.pressSequence('SHIFT 1 5 1 =');
      lines = calc.renderLines();
      assert.equal(lines[1], '−3857.984');

      // B: SHIFT 1 5 2 = -> 2357.532
      calc.pressSequence('SHIFT 1 5 2 =');
      lines = calc.renderLines();
      assert.equal(lines[1], '2357.532');

      // 160ŷ: AC 160 SHIFT 1 5 5 = -> 8106.898
      calc.pressSequence('AC 1 6 0 SHIFT 1 5 5 =');
      lines = calc.renderLines();
      assert.equal(lines[1], '8106.898');
    });

    it('Case 3: STAT ON, Fix 3, 1-VAR with FREQ, 3▸t and P(Ans)', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: true, format: 'Fix 3' });
      calc.pressSequence('MODE 3 1');
      // x: 0 1 2 3 4 5 6 7 9 10
      calc.pressSequence('0 = 1 = 2 = 3 = 4 = 5 = 6 = 7 = 9 = 1 0 =');
      // move to FREQ row 0
      calc.pressSequence('RIGHT UP UP UP UP UP UP UP UP UP UP');
      // freq: 1 2 1 2 2 2 3 4 2 1
      calc.pressSequence('1 = 2 = 1 = 2 = 2 = 2 = 3 = 4 = 2 = 1 =');
      calc.pressSequence('AC');

      // 3 SHIFT 1 5 4 = -> -0.762 (3▸t)
      calc.pressSequence('3 SHIFT 1 5 4 =');
      let lines = calc.renderLines();
      assert.equal(lines[1], '−0.762');

      // SHIFT 1 5 1 Ans ) = -> 0.223 (P(Ans))
      calc.pressSequence('SHIFT 1 5 1 ANS ) =');
      lines = calc.renderLines();
      assert.equal(lines[1], '0.223');
    });
  });

  describe('All 8 Regression Models Verification', () => {
    it('Model 1: 1-VAR summary statistics', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      calc.pressSequence('MODE 3 1 2 = 4 = 6 = 8 = AC');
      // n = 4
      calc.pressSequence('SHIFT 1 4 1 =');
      assert.equal(calc.renderLines()[1], '4');
      // x̄ = 5
      calc.pressSequence('AC SHIFT 1 4 2 =');
      assert.equal(calc.renderLines()[1], '5');
      // Σx = 20
      calc.pressSequence('AC SHIFT 1 3 2 =');
      assert.equal(calc.renderLines()[1], '20');
      // minX = 2, maxX = 8
      calc.pressSequence('AC SHIFT 1 6 1 =');
      assert.equal(calc.renderLines()[1], '2');
      calc.pressSequence('AC SHIFT 1 6 2 =');
      assert.equal(calc.renderLines()[1], '8');
    });

    it('Model 2: Linear A+BX and x̂ estimation', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      calc.pressSequence('MODE 3 2 1 = 2 = 3 = RIGHT UP UP UP 3 = 5 = 7 = AC');
      // y = 1 + 2x -> A=1, B=2, r=1
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '1');
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '2');
      calc.pressSequence('AC SHIFT 1 5 3 =');
      assert.equal(calc.renderLines()[1], '1');
      // 9 x̂ = (9-1)/2 = 4
      calc.pressSequence('AC 9 SHIFT 1 5 4 =');
      assert.equal(calc.renderLines()[1], '4');
    });

    it('Model 3: Quadratic _+CX² (A, B, C, x̂₁, x̂₂)', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      // Points on y = x² + 2x + 1: (0, 1), (1, 4), (2, 9)
      calc.pressSequence('MODE 3 3 0 = 1 = 2 = RIGHT UP UP UP 1 = 4 = 9 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '1'); // A
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '2'); // B
      calc.pressSequence('AC SHIFT 1 5 3 =');
      assert.equal(calc.renderLines()[1], '1'); // C
      // 4 x̂₁ and 4 x̂₂
      calc.pressSequence('AC 4 SHIFT 1 5 4 =');
      assert.equal(calc.renderLines()[1], '1'); // x = 1 gives 4
      calc.pressSequence('AC 4 SHIFT 1 5 DOWN 1 =');
      assert.equal(calc.renderLines()[1], '−3'); // x = -3 gives 9 - 6 + 1 = 4
    });

    it('Model 4: Logarithmic ln X', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false, format: 'Fix 4' });
      // Points: (1, 5), (10, 5 + 2*ln(10) = 9.6052) -> A=5, B=2
      calc.pressSequence('MODE 3 4 1 = 1 0 = RIGHT UP UP 5 = 9 . 6 0 5 2 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '5.0000');
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '2.0000');
    });

    it('Model 5: Exponential e^X (y = a•e^(bx))', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false, format: 'Fix 4' });
      // y = 2 • e^(3x): (0, 2), (1, 2•e^3 = 40.1711)
      calc.pressSequence('MODE 3 5 0 = 1 = RIGHT UP UP 2 = 4 0 . 1 7 1 1 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '2.0000');
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '3.0000');
    });

    it('Model 6: Exponential A•B^X', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      // y = 3 • 2^x: (0, 3), (1, 6), (2, 12)
      calc.pressSequence('MODE 3 6 0 = 1 = 2 = RIGHT UP UP UP 3 = 6 = 1 2 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '3');
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '2');
      calc.pressSequence('AC SHIFT 1 5 3 =');
      assert.equal(calc.renderLines()[1], '1');
    });

    it('Model 7: Power A•X^B', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      // y = 2 • x^3: (1, 2), (2, 16)
      calc.pressSequence('MODE 3 7 1 = 2 = RIGHT UP UP 2 = 1 6 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '2');
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '3');
      calc.pressSequence('AC SHIFT 1 5 3 =');
      assert.equal(calc.renderLines()[1], '1');
    });

    it('Model 8: Inverse 1/X (y = a + b/x)', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      // y = 1 + 6/x: (1, 7), (2, 4), (3, 3)
      calc.pressSequence('MODE 3 8 1 = 2 = 3 = RIGHT UP UP UP 7 = 4 = 3 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      assert.equal(calc.renderLines()[1], '1');
      calc.pressSequence('AC SHIFT 1 5 2 =');
      assert.equal(calc.renderLines()[1], '6');
      calc.pressSequence('AC SHIFT 1 5 3 =');
      assert.equal(calc.renderLines()[1], '1');
    });
  });

  describe('Statistical Functions in Expressions and Calculation Priority', () => {
    it('uses statistical variables in arithmetic expressions (x̄ + 5)', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      calc.pressSequence('MODE 3 1 1 0 = 2 0 = 3 0 = AC');
      calc.pressSequence('SHIFT 1 4 2 + 5 =');
      assert.equal(calc.renderLines()[1], '25');
    });

    it('postfix estimator 4ŷ respects level 6 priority (2 * 4ŷ)', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      // y = 2x: (1, 2), (2, 4), (3, 6)
      calc.pressSequence('MODE 3 2 1 = 2 = 3 = RIGHT UP UP UP 2 = 4 = 6 = AC');
      // 4ŷ = 8. 2 * 4ŷ = 16.
      calc.pressSequence('2 * 4 SHIFT 1 5 5 =');
      assert.equal(calc.renderLines()[1], '16');
    });

    it('evaluates normal distribution Q(0) and R(0)', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      calc.pressSequence('MODE 3 1 1 = 2 = 3 = AC');
      calc.pressSequence('SHIFT 1 5 2 0 ) ='); // Q(0) = 0
      assert.equal(calc.renderLines()[1], '0');
      calc.pressSequence('AC SHIFT 1 5 3 0 ) ='); // R(0) = 0.5
      assert.equal(calc.renderLines()[1], '0.5');
    });

    it('returns Math ERROR when regression domain is violated', () => {
      const calc = new Calculator();
      calc.configureSetup({ statFreq: false });
      // ln X with non-positive x
      calc.pressSequence('MODE 3 4 0 = 1 = RIGHT UP UP 2 = 3 = AC');
      calc.pressSequence('SHIFT 1 5 1 =');
      const lines = calc.renderLines();
      assert.equal(lines[0], 'Math ERROR');
    });
  });
});
