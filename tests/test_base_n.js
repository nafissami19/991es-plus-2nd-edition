/**
 * Unit tests for Mode 4: Base-N Mode (fx-991ES PLUS 2nd edition).
 *
 * Verifies:
 * - BaseNValue: 32-bit (DEC, HEX, OCT) & 16-bit (BIN) two's complement integer arithmetic & bitwise logic
 * - BaseNEvaluator: multi-base number evaluation, base prefixes d, h, b, o
 * - BaseNApp: base switching keys, hex keys A–F, result conversions, SHIFT 3 menu
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { BaseNValue, MIN_INT32, MAX_INT32, MIN_INT16, MAX_INT16, MASK32 } from '../js/core/modes/baseN/BaseNValue.js';
import { BaseNEvaluator } from '../js/core/modes/baseN/BaseNEvaluator.js';
import { parse } from '../js/core/parse/parser.js';

describe('BaseNValue', () => {
  it('constructs within 32-bit signed range', () => {
    const v1 = new BaseNValue(0n);
    assert.equal(v1.value, 0n);
    const v2 = new BaseNValue(MAX_INT32);
    assert.equal(v2.value, 2147483647n);
    const v3 = new BaseNValue(MIN_INT32);
    assert.equal(v3.value, -2147483648n);
  });

  it('throws Math ERROR on overflow during construction', () => {
    assert.throws(() => new BaseNValue(MAX_INT32 + 1n), /Math ERROR/);
    assert.throws(() => new BaseNValue(MIN_INT32 - 1n), /Math ERROR/);
  });

  it('formats correctly across all 4 bases for positive value (555)', () => {
    const v = new BaseNValue(555n);
    assert.equal(v.toDecString(), '555');
    assert.equal(v.toHexString(), '0000022B');
    assert.equal(v.toOctString(), '00000001053');
    assert.equal(v.toBinString(), '0000001000101011');
  });

  it('formats correctly across all 4 bases for negative value (-1)', () => {
    const v = new BaseNValue(-1n);
    assert.equal(v.toDecString(), '-1');
    assert.equal(v.toHexString(), 'FFFFFFFF');
    assert.equal(v.toOctString(), '37777777777');
    assert.equal(v.toBinString(), '1111111111111111');
  });

  it('formats zero correctly across all 4 bases', () => {
    const v = new BaseNValue(0n);
    assert.equal(v.toDecString(), '0');
    assert.equal(v.toHexString(), '00000000');
    assert.equal(v.toOctString(), '00000000000');
    assert.equal(v.toBinString(), '0000000000000000');
  });

  it('performs basic arithmetic (+, -, *, /) with truncation towards zero', () => {
    const a = new BaseNValue(7n);
    const b = new BaseNValue(2n);
    assert.equal(a.add(b).value, 9n);
    assert.equal(a.sub(b).value, 5n);
    assert.equal(a.mul(b).value, 14n);
    assert.equal(a.div(b).value, 3n); // integer truncation 7/2 = 3

    const negA = new BaseNValue(-7n);
    assert.equal(negA.div(b).value, -3n); // -7/2 = -3
  });

  it('throws Math ERROR on division by zero', () => {
    const a = new BaseNValue(10n);
    const zero = new BaseNValue(0n);
    assert.throws(() => a.div(zero), /Math ERROR/);
  });

  it('throws Math ERROR on overflow in +, -, *, /', () => {
    const max = new BaseNValue(MAX_INT32);
    const one = new BaseNValue(1n);
    assert.throws(() => max.add(one), /Math ERROR/);

    const min = new BaseNValue(MIN_INT32);
    assert.throws(() => min.sub(one), /Math ERROR/);

    const negOne = new BaseNValue(-1n);
    assert.throws(() => min.div(negOne), /Math ERROR/); // -2147483648 / -1 = 2147483648
    assert.throws(() => min.neg(), /Math ERROR/);
  });

  it('performs bitwise logic (and, or, xor, xnor, not)', () => {
    // 1010_2 = 10, 1100_2 = 12
    const v10 = new BaseNValue(10n);
    const v12 = new BaseNValue(12n);

    // 10 & 12 = 8 (1000_2)
    assert.equal(v10.and(v12).value, 8n);
    assert.equal(v10.and(v12).toBinString(), '0000000000001000');

    // 10 | 12 = 14 (1110_2)
    assert.equal(v10.or(v12).value, 14n);

    // 10 ^ 12 = 6 (0110_2)
    assert.equal(v10.xor(v12).value, 6n);

    // xnor(10, 12) = not(6) = -7
    assert.equal(v10.xnor(v12).value, -7n);

    // not(10) in 32-bit = -11 (FFFFFFF5)
    assert.equal(v10.not().value, -11n);
    assert.equal(v10.not().toHexString(), 'FFFFFFF5');
  });
});

describe('BaseNEvaluator', () => {
  it('evaluates base prefixes d, h, b, o', () => {
    // d10 + h10 + b10 + o10 = 10 + 16 + 2 + 8 = 36
    const ast = parse([
      { t: 'tok', id: 'bn_d' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' },
      { t: 'tok', id: '+' },
      { t: 'tok', id: 'bn_h' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' },
      { t: 'tok', id: '+' },
      { t: 'tok', id: 'bn_b' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' },
      { t: 'tok', id: '+' },
      { t: 'tok', id: 'bn_o' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' }
    ], { baseN: true });

    const ev = new BaseNEvaluator({ base: 'DEC' });
    const res = ev.run(ast.list[0]);
    assert.equal(res.value, 36n);
  });

  it('rejects digits invalid for the base with Syntax ERROR', () => {
    const evDec = new BaseNEvaluator({ base: 'DEC' });
    // In DEC mode, hex digit A is syntax error
    const astDec = parse([{ t: 'tok', id: 'hexA' }], { baseN: true });
    assert.throws(() => evDec.run(astDec.list[0]), /Syntax ERROR/);

    const evBin = new BaseNEvaluator({ base: 'BIN' });
    // In BIN mode, digit 2 is syntax error
    const astBin = parse([{ t: 'tok', id: '2' }], { baseN: true });
    assert.throws(() => evBin.run(astBin.list[0]), /Syntax ERROR/);

    const evOct = new BaseNEvaluator({ base: 'OCT' });
    // In OCT mode, digit 8 is syntax error
    const astOct = parse([{ t: 'tok', id: '8' }], { baseN: true });
    assert.throws(() => evOct.run(astOct.list[0]), /Syntax ERROR/);
  });

  it('evaluates Not() and Neg() functions', () => {
    const ev = new BaseNEvaluator({ base: 'BIN' });
    const astNot = parse([{ t: 'tok', id: 'Not' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' }, { t: 'tok', id: ')' }], { baseN: true });
    const resNot = ev.run(astNot.list[0]);
    // 16-bit Not(10) = 0xFFF5 = -11
    assert.equal(resNot.value, -11n);
    assert.equal(resNot.toBinString(), '1111111111110101');

    const astNeg = parse([{ t: 'tok', id: 'Neg' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' }, { t: 'tok', id: '1' }, { t: 'tok', id: '0' }, { t: 'tok', id: ')' }], { baseN: true });
    const resNeg = ev.run(astNeg.list[0]);
    assert.equal(resNeg.value, -10n);
  });
});

describe('BaseNApp via Calculator', () => {
  it('enters Base-N mode via MODE 4 with default base DEC and initial 0', () => {
    const c = new Calculator();
    c.pressSequence('MODE 4');
    const scr = c.getScreen();
    assert.equal(c.mode, 4);
    assert.ok(scr.lines.some((l) => l.includes('Dec')));
    assert.equal(scr.lines[1], '0');
  });

  it('switches base using physical keys DEC(x²), HEX(x^), BIN(log), OCT(ln)', () => {
    const c = new Calculator();
    c.pressSequence('MODE 4');
    assert.equal(c.app.base, 'DEC');

    c.press('POWER'); // HEX (x^)
    assert.equal(c.app.base, 'HEX');
    assert.equal(c.getScreen().lines[1], '00000000');

    c.press('LOG'); // BIN (log)
    assert.equal(c.app.base, 'BIN');
    assert.equal(c.getScreen().lines[1], '0000000000000000');

    c.press('LN'); // OCT (ln)
    assert.equal(c.app.base, 'OCT');
    assert.equal(c.getScreen().lines[1], '00000000000');

    c.press('SQUARE'); // DEC (x²)
    assert.equal(c.app.base, 'DEC');
    assert.equal(c.getScreen().lines[1], '0');
  });

  it('converts displayed result to another base upon pressing base keys', () => {
    const c = new Calculator();
    c.pressSequence('MODE 4 1 5 * 3 7 =');
    assert.equal(c.getScreen().lines[1], '555');

    c.press('POWER'); // HEX
    assert.equal(c.getScreen().lines[1], '0000022B');

    c.press('LOG'); // BIN
    assert.equal(c.getScreen().lines[1], '0000001000101011');

    c.press('LN'); // OCT
    assert.equal(c.getScreen().lines[1], '00000001053');

    c.press('SQUARE'); // DEC
    assert.equal(c.getScreen().lines[1], '555');
  });

  it('supports direct input of hex digits A–F without pressing ALPHA', () => {
    const c = new Calculator();
    c.pressSequence('MODE 4 POWER NEG + DEG =');
    // NEG is A (10), DEG is B (11) -> 10 + 11 = 21 = 0x15
    assert.equal(c.getScreen().lines[1], '00000015');
  });

  it('throws Syntax ERROR on decimal point . or fraction in Base-N', () => {
    const c = new Calculator();
    c.pressSequence('MODE 4 1 . 5 =');
    assert.ok(c.getScreen().lines.some((l) => l.includes('Syntax ERROR')));

    c.pressSequence('AC 1 FRAC 2 =');
    assert.ok(c.getScreen().lines.some((l) => l.includes('Syntax ERROR')));
  });
});
