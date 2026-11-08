import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ERRORS, GOTO_ERRORS, CalcError, toCalcError } from '../js/core/errors.js';
import { STACK_LIMITS, checkTreeDepth, Evaluator } from '../js/core/eval/evaluate.js';
import { Calculator } from '../js/core/Calculator.js';
import { parse } from '../js/core/parse/parser.js';
import { Editor } from '../js/core/input/Editor.js';
import { ExactValue } from '../js/core/exact/ExactValue.js';

describe('Calculator Errors and Error Screens (Prompt 10)', () => {
  describe('1. Error definitions and aliases', () => {
    it('defines all 9 required ES PLUS error types', () => {
      assert.equal(ERRORS.MATH, 'Math ERROR');
      assert.equal(ERRORS.STACK, 'Stack ERROR');
      assert.equal(ERRORS.SYNTAX, 'Syntax ERROR');
      assert.equal(ERRORS.ARGUMENT, 'Argument ERROR');
      assert.equal(ERRORS.DIMENSION, 'Dimension ERROR');
      assert.equal(ERRORS.VARIABLE, 'Variable ERROR');
      assert.equal(ERRORS.CANT_SOLVE, "Can't Solve");
      assert.equal(ERRORS.CANNOT_SOLVE, "Can't Solve");
      assert.equal(ERRORS.INSUFFICIENT_MEM, 'Insufficient MEM');
      assert.equal(ERRORS.MEMORY, 'Insufficient MEM');
      assert.equal(ERRORS.TIME_OUT, 'Time Out');
    });

    it('GOTO_ERRORS contains only errors that offer Goto [◀][▶]', () => {
      assert.ok(GOTO_ERRORS.has(ERRORS.MATH));
      assert.ok(GOTO_ERRORS.has(ERRORS.STACK));
      assert.ok(GOTO_ERRORS.has(ERRORS.SYNTAX));
      assert.ok(GOTO_ERRORS.has(ERRORS.ARGUMENT));
      assert.ok(GOTO_ERRORS.has(ERRORS.DIMENSION));
      assert.ok(GOTO_ERRORS.has(ERRORS.VARIABLE));

      assert.ok(!GOTO_ERRORS.has(ERRORS.CANT_SOLVE));
      assert.ok(!GOTO_ERRORS.has(ERRORS.INSUFFICIENT_MEM));
      assert.ok(!GOTO_ERRORS.has(ERRORS.TIME_OUT));
    });

    it('CalcError normalizes aliases', () => {
      const e1 = new CalcError('Cannot Solve');
      assert.equal(e1.message, "Can't Solve");
      const e2 = new CalcError('Memory ERROR');
      assert.equal(e2.message, 'Insufficient MEM');
    });

    it('toCalcError maps known messages and keeps location', () => {
      const loc = { path: [], idx: 5 };
      const e1 = toCalcError(new Error('Syntax ERROR'), loc);
      assert.equal(e1.message, 'Syntax ERROR');
      assert.deepEqual(e1.loc, loc);

      const e2 = toCalcError(new RangeError('overflow'), loc);
      assert.equal(e2.message, 'Math ERROR');
      assert.deepEqual(e2.loc, loc);

      const e3 = toCalcError(new Error("Can't Solve"), loc);
      assert.equal(e3.message, "Can't Solve");

      const e4 = toCalcError(new Error('Insufficient MEM'), loc);
      assert.equal(e4.message, 'Insufficient MEM');
    });
  });

  describe('2. Stack depth checks', () => {
    it(`enforces command stack limit (${STACK_LIMITS.command}) and numeric limit (${STACK_LIMITS.numeric})`, () => {
      const ed = new Editor({ math: false });
      for (let i = 0; i < 26; i++) ed.insertToken('(');
      ed.insertToken('1');
      assert.throws(() => parse(ed.root, {}), (err) => err instanceof CalcError && err.message === 'Stack ERROR');
    });

    it('checkTreeDepth catches deeply nested operations', () => {
      let node = { type: 'num', mant: '1', decimal: false, exp: null };
      for (let i = 0; i < 12; i++) {
        node = { type: 'bin', op: '+', l: { type: 'num', mant: '1', decimal: false, exp: null }, r: node, loc: { path: [], idx: i } };
      }
      assert.throws(() => checkTreeDepth(node), (err) => err instanceof CalcError && err.message === 'Stack ERROR');
    });
  });

  describe('3. Evaluator error triggers', () => {
    it('throws Math ERROR on division by zero', () => {
      const c = new Calculator();
      c.pressSequence('1 4 DIV 0 MUL 2 =');
      assert.deepEqual(c.getScreen().lines, ['Math ERROR', '[AC]  :Cancel', '[◀][▶]:Goto']);
    });

    it('throws Syntax ERROR on invalid expression structure', () => {
      const c = new Calculator();
      c.pressSequence('1 + =');
      assert.deepEqual(c.getScreen().lines, ['Syntax ERROR', '[AC]  :Cancel', '[◀][▶]:Goto']);
    });

    it('throws Argument ERROR on invalid integral tolerance (tol <= 0 or tol >= 1)', () => {
      const c = new Calculator({ setup: { display: 'LineIO' } });
      c.pressSequence('INTEGRAL X , 0 , 1 , NEG 1 RPAREN =');
      assert.deepEqual(c.getScreen().lines, ['Argument ERROR', '[AC]  :Cancel', '[◀][▶]:Goto']);
    });

    it('throws Variable ERROR on SOLVE with no variable', () => {
      const c = new Calculator();
      c.pressSequence('1 + 2 == 3 SHIFT CALC');
      assert.deepEqual(c.getScreen().lines, ['Variable ERROR', '[AC]  :Cancel', '[◀][▶]:Goto']);
    });

    it("throws Can't Solve on SOLVE equation with no real root", () => {
      const c = new Calculator();
      c.pressSequence('X SQUARE + 1 == 0 SHIFT CALC = =');
      assert.deepEqual(c.getScreen().lines, ["Can't Solve", '[AC]  :Cancel']);
    });
  });

  describe('4. Error screen navigation (AC and ◀/▶)', () => {
    it('AC clears input and resets to blank input screen', () => {
      const c = new Calculator();
      c.pressSequence('1 DIV 0 =');
      assert.equal(c.getScreen().lines[0], 'Math ERROR');
      c.press('AC');
      assert.deepEqual(c.getScreen().lines, ['', '']);
      assert.equal(c.app.phase, 'edit');
    });

    it('◀ restores input expression and positions cursor at error location', () => {
      const c = new Calculator();
      c.pressSequence('1 + MUL 2 =');
      assert.equal(c.getScreen().lines[0], 'Syntax ERROR');
      c.press('LEFT');
      assert.equal(c.app.phase, 'edit');
      assert.equal(c.getScreen().lines[0], '1+×2');
      assert.equal(c.app.editor.idx, 2); // positioned at the '×' token
    });

    it('non-goto errors ignore ◀/▶ and only respond to AC', () => {
      const c = new Calculator();
      c.pressSequence('X SQUARE + 1 == 0 SHIFT CALC = =');
      assert.equal(c.getScreen().lines[0], "Can't Solve");
      c.press('LEFT');
      assert.equal(c.getScreen().lines[0], "Can't Solve"); // unchanged
      c.press('AC');
      assert.notEqual(c.getScreen().lines[0], "Can't Solve");
    });
  });

  describe('5. Ans is never updated by errors', () => {
    it('Ans retains prior successful value when an error occurs', () => {
      const c = new Calculator();
      c.pressSequence('4 2 =');
      assert.equal(c.getScreen().lines[1], '42');
      assert.equal(c.memory.getAns().toDecimal15().toString(), '42');

      // Now cause a Math ERROR
      c.pressSequence('1 DIV 0 =');
      assert.equal(c.getScreen().lines[0], 'Math ERROR');
      // Ans is still 42
      assert.equal(c.memory.getAns().toDecimal15().toString(), '42');

      // Clear with AC, Ans is still 42
      c.press('AC');
      assert.equal(c.memory.getAns().toDecimal15().toString(), '42');

      c.pressSequence('ANS + 8 =');
      assert.equal(c.getScreen().lines[1], '50');
    });

    it('Ans is updated by =, SHIFT =, M+, M-, and STO', () => {
      const c = new Calculator();
      // =
      c.pressSequence('1 0 =');
      assert.equal(c.memory.getAns().toDecimal15().toString(), '10');

      // SHIFT =
      c.pressSequence('1 DIV 2 SHIFT =');
      assert.equal(c.memory.getAns().toDecimal15().toString(), '0.5');

      // M+
      c.pressSequence('5 MPLUS');
      assert.equal(c.memory.getAns().toDecimal15().toString(), '5');

      // STO
      c.pressSequence('1 2 SHIFT RCL NEG'); // store 12 into A
      assert.equal(c.memory.getAns().toDecimal15().toString(), '12');
    });
  });
});
