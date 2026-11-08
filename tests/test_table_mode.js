import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

describe('Prompt 25 — TABLE Mode (Mode 7)', () => {
  describe('1. Mode Entry and Display Indicators', () => {
    it('enters TABLE mode via MODE 7 with Math indicator in MthIO', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7');
      assert.strictEqual(calc.mode, 7);
      assert.strictEqual(calc.app.title, 'Table');
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=');
      assert.ok(calc.indicators().includes('Math'));
    });

    it('suppresses Math indicator in LineIO mode', () => {
      const calc = new Calculator({ setup: { display: 'LineIO' } });
      calc.pressSequence('MODE 7');
      assert.strictEqual(calc.mode, 7);
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=');
      assert.ok(!calc.indicators().includes('Math'));
    });
  });

  describe('2. Prompt 25 Check-Yourself Suite', () => {
    it('Check-Yourself 1: f(X) = X² + 1/2 from -1 to 1 step 0.5', () => {
      const calc = new Calculator();
      // MODE 7 -> f(X)=
      calc.pressSequence('MODE 7');
      // ALPHA )(X) x² + 1 / 2 =
      calc.pressSequence('ALPHA RPAREN x² + 1 / 2 =');
      // Prompts Start?
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'Start?');

      // Start (-) 1 =
      calc.pressSequence('(-) 1 =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'End?');

      // End 1 =
      calc.pressSequence('1 =');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'Step?');

      // Step 0.5 =
      calc.pressSequence('0 . 5 =');
      scr = calc.getScreen();

      // Check table rows:
      // Row 1: X = -1, F(X) = 1.5
      // Row 2: X = -0.5, F(X) = 0.75
      assert.strictEqual(calc.app.rows.length, 5);
      assert.strictEqual(calc.app.rows[0].x.toDecimal15().toString(), '-1');
      assert.strictEqual(calc.app.rows[0].f.toDecimal15().toString(), '1.5');

      assert.strictEqual(calc.app.rows[1].x.toDecimal15().toString(), '-0.5');
      assert.strictEqual(calc.app.rows[1].f.toDecimal15().toString(), '0.75');

      assert.strictEqual(calc.app.rows[2].x.toDecimal15().toString(), '0');
      assert.strictEqual(calc.app.rows[2].f.toDecimal15().toString(), '0.5');

      assert.strictEqual(calc.app.rows[3].x.toDecimal15().toString(), '0.5');
      assert.strictEqual(calc.app.rows[3].f.toDecimal15().toString(), '0.75');

      assert.strictEqual(calc.app.rows[4].x.toDecimal15().toString(), '1');
      assert.strictEqual(calc.app.rows[4].f.toDecimal15().toString(), '1.5');
    });

    it('Check-Yourself 2: AC =, Start 1, End 40, Step 1 -> Insufficient MEM', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN x² + 1 / 2 = (-) 1 = 1 = 0 . 5 =');
      assert.strictEqual(calc.app.phase, 'table');

      // AC returns to f(X)= with formula preserved
      calc.press('AC');
      assert.strictEqual(calc.app.phase, 'fx');
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=X²+1÷2');

      // Press = to keep formula and enter range prompts
      calc.press('=');
      assert.strictEqual(calc.getScreen().lines[0], 'Start?');

      // Start 1 =, End 40 =, Step 1 =
      calc.pressSequence('1 = 4 0 = 1 =');
      const scr = calc.getScreen();
      assert.strictEqual(scr.lines[0], 'Insufficient MEM');
      assert.strictEqual(scr.lines[1], '[AC]  :Cancel');
    });
  });

  describe('3. Range Prompts, Navigation & Defaults', () => {
    it('uses default Start 1, End 5, Step 1 when pressing = without input', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN =');
      assert.strictEqual(calc.getScreen().lines[0], 'Start?');
      calc.press('='); // keeps 1
      assert.strictEqual(calc.getScreen().lines[0], 'End?');
      calc.press('='); // keeps 5
      assert.strictEqual(calc.getScreen().lines[0], 'Step?');
      calc.press('='); // keeps 1 -> generates table (5 rows)

      assert.strictEqual(calc.app.phase, 'table');
      assert.strictEqual(calc.app.rows.length, 5);
      assert.strictEqual(calc.app.rows[0].x.toDecimal15().toString(), '1');
      assert.strictEqual(calc.app.rows[4].x.toDecimal15().toString(), '5');
    });

    it('navigates range prompts with UP and DOWN keys', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN =');
      assert.strictEqual(calc.getScreen().lines[0], 'Start?');

      calc.press('DOWN');
      assert.strictEqual(calc.getScreen().lines[0], 'End?');

      calc.press('DOWN');
      assert.strictEqual(calc.getScreen().lines[0], 'Step?');

      calc.press('UP');
      assert.strictEqual(calc.getScreen().lines[0], 'End?');

      calc.press('UP');
      assert.strictEqual(calc.getScreen().lines[0], 'Start?');
    });

    it('cancels range prompt and returns to f(X) with AC', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN =');
      assert.strictEqual(calc.getScreen().lines[0], 'Start?');

      calc.press('AC');
      assert.strictEqual(calc.app.phase, 'fx');
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=X');
    });
  });

  describe('4. Table Grid Navigation and Memory Updates', () => {
    it('scrolls table rows with DOWN and UP keys', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN = 1 = 1 0 = 1 ='); // 10 rows
      assert.strictEqual(calc.app.rows.length, 10);
      assert.strictEqual(calc.app.selectedRow, 0);

      calc.press('DOWN');
      assert.strictEqual(calc.app.selectedRow, 1);

      calc.press('DOWN');
      assert.strictEqual(calc.app.selectedRow, 2);
      assert.strictEqual(calc.app.topRow, 1); // scrolled

      calc.press('UP');
      assert.strictEqual(calc.app.selectedRow, 1);
    });

    it('switches between X and F(X) columns with LEFT and RIGHT', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN = 1 = 5 = 1 =');
      assert.strictEqual(calc.app.selectedCol, 0);

      calc.press('RIGHT');
      assert.strictEqual(calc.app.selectedCol, 1);

      calc.press('LEFT');
      assert.strictEqual(calc.app.selectedCol, 0);
    });

    it('updates variable X in calculator memory to the active row', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN x² = 1 = 5 = 1 =');
      // Initially row 0: X = 1
      assert.strictEqual(calc.memory.getVar('X').toDecimal15().toString(), '1');

      calc.press('DOWN');
      // Row 1: X = 2
      assert.strictEqual(calc.memory.getVar('X').toDecimal15().toString(), '2');

      calc.press('DOWN');
      // Row 2: X = 3
      assert.strictEqual(calc.memory.getVar('X').toDecimal15().toString(), '3');
    });

    it('is view-only and ignores editing keys on table screen', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN = 1 = 5 = 1 =');
      calc.pressSequence('9 9 9');
      // Selected row's value is still 1
      assert.strictEqual(calc.app.rows[0].x.toDecimal15().toString(), '1');
    });
  });

  describe('5. Exact vs Decimal Values and S<=>D Key', () => {
    it('toggles exact fraction and decimal on bottom status line with SD key', () => {
      const calc = new Calculator();
      // f(X) = 1/X from 2 to 2 step 1 -> F(2) = 1/2
      calc.pressSequence('MODE 7 1 / ALPHA RPAREN = 2 = 2 = 1 =');
      // Navigate to F(X) column
      calc.press('RIGHT');
      let scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '1/2');

      calc.press('SD');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '0.5');

      calc.press('SD');
      scr = calc.getScreen();
      assert.strictEqual(scr.lines[scr.lines.length - 1], '1/2');
    });
  });

  describe('6. Variables as Constants and Scientific Constants', () => {
    it('treats other variables (A, B, etc.) as constants in f(X)', () => {
      const calc = new Calculator();
      // Store 3 in A: 3 STO A
      calc.pressSequence('3 SHIFT RCL NEG');
      // MODE 7, f(X) = X + A
      calc.pressSequence('MODE 7 ALPHA RPAREN + ALPHA NEG = 1 = 3 = 1 =');
      // X: 1, 2, 3 -> F(X): 4, 5, 6
      assert.strictEqual(calc.app.rows[0].f.toDecimal15().toString(), '4');
      assert.strictEqual(calc.app.rows[1].f.toDecimal15().toString(), '5');
      assert.strictEqual(calc.app.rows[2].f.toDecimal15().toString(), '6');
    });

    it('allows scientific constants in f(X)', () => {
      const calc = new Calculator();
      // f(X) = X * c0 (CONST 28 = 299792458)
      calc.pressSequence('MODE 7 ALPHA RPAREN * CONST 2 8 = 1 = 2 = 1 =');
      assert.strictEqual(calc.app.rows[0].f.toDecimal15().toString(), '299792458');
      assert.strictEqual(calc.app.rows[1].f.toDecimal15().toString(), '599584916');
    });
  });

  describe('7. Disallowed Functions & Error Handling', () => {
    it('throws Syntax ERROR on empty f(X)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Syntax ERROR');
    });

    it('blocks Pol, Rec, ∫, d/dx, Σ in f(X)', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7');
      // Try entering integral
      calc.press('INTEGRAL');
      // Should remain empty
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=');

      // Try entering Pol (SHIFT +)
      calc.pressSequence('SHIFT +');
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=');

      // Try entering Rec (SHIFT -)
      calc.pressSequence('SHIFT -');
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=');
    });

    it('handles division by zero in table cells as ERROR', () => {
      const calc = new Calculator();
      // f(X) = 1/X, Start -1, End 1, Step 1
      calc.pressSequence('MODE 7 1 / ALPHA RPAREN = (-) 1 = 1 = 1 =');
      assert.strictEqual(calc.app.rows.length, 3);
      assert.strictEqual(calc.app.rows[0].f.toDecimal15().toString(), '-1');
      assert.strictEqual(calc.app.rows[1].f, 'ERROR');
      assert.strictEqual(calc.app.rows[2].f.toDecimal15().toString(), '1');
    });

    it('throws Math ERROR when Step is 0', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN = 1 = 5 = 0 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
    });

    it('throws Math ERROR when End < Start with positive Step', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN = 5 = 1 = 1 =');
      assert.strictEqual(calc.getScreen().lines[0], 'Math ERROR');
    });
  });

  describe('8. SETUP MthIO <-> LineIO Side Effect', () => {
    it('deletes f(X) formula when switching MthIO to LineIO', () => {
      const calc = new Calculator();
      calc.pressSequence('MODE 7 ALPHA RPAREN x²');
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=X²');

      // Switch to LineIO: SHIFT MODE 2
      calc.pressSequence('SHIFT MODE 2');
      // Formula was deleted
      assert.strictEqual(calc.getScreen().lines[0], 'f(X)=');
    });
  });
});
