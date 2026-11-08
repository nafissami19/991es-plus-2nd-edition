/**
 * Unit and Golden Tests for Prompt 22 — BASE-N Mode (Mode 4).
 * Tests all 4 bases (DEC, HEX, BIN, OCT), 16-bit BIN, 32-bit DEC/HEX/OCT,
 * direct base switching keys, direct hex keys A–F without ALPHA,
 * SHIFT 3 menu operations (and, or, xor, xnor, Not, Neg, and prefixes d, h, b, o),
 * overflow rules, error handling, and Prompt 22 check-yourself suite.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { BaseNValue, MIN_INT32, MAX_INT32, MIN_INT16, MAX_INT16 } from '../js/core/modes/baseN/BaseNValue.js';

describe('Prompt 22 — BASE-N Mode', () => {
  describe('BaseNValue Representation and Operations', () => {
    it('constructs within 32-bit signed range for DEC/HEX/OCT', () => {
      const v1 = new BaseNValue(0n);
      assert.equal(v1.value, 0n);
      const v2 = new BaseNValue(MAX_INT32);
      assert.equal(v2.value, 2147483647n);
      const v3 = new BaseNValue(MIN_INT32);
      assert.equal(v3.value, -2147483648n);
    });

    it('enforces 16-bit range for BIN', () => {
      const v1 = new BaseNValue(MAX_INT16, 'BIN');
      assert.equal(v1.value, 32767n);
      const v2 = new BaseNValue(MIN_INT16, 'BIN');
      assert.equal(v2.value, -32768n);
      assert.throws(() => new BaseNValue(32768n, 'BIN'), /Math ERROR/);
      assert.throws(() => new BaseNValue(-32769n, 'BIN'), /Math ERROR/);
    });

    it('formats 16-bit binary as zero-padded 16 digits without spaces', () => {
      const v = new BaseNValue(4n, 'BIN');
      assert.equal(v.toBinString(), '0000000000000100');
      const vNeg = new BaseNValue(-1n, 'BIN');
      assert.equal(vNeg.toBinString(), '1111111111111111');
    });

    it('formats 32-bit hex as zero-padded 8 digits', () => {
      const v = new BaseNValue(32n, 'HEX');
      assert.equal(v.toHexString(), '00000020');
      const vNeg = new BaseNValue(-1n, 'HEX');
      assert.equal(vNeg.toHexString(), 'FFFFFFFF');
    });

    it('formats 32-bit octal as zero-padded 11 digits', () => {
      const v = new BaseNValue(8n, 'OCT');
      assert.equal(v.toOctString(), '00000000010');
      const vNeg = new BaseNValue(-1n, 'OCT');
      assert.equal(vNeg.toOctString(), '37777777777');
    });

    it('formats decimal with standard signed representation', () => {
      const v = new BaseNValue(555n, 'DEC');
      assert.equal(v.toDecString(), '555');
      const vNeg = new BaseNValue(-36n, 'DEC');
      assert.equal(vNeg.toDecString(), '-36');
    });
  });

  describe('Prompt 22 Check-Yourself Suite (MODE 4)', () => {
    it('Check 1: log(BIN) 11 + 1 = -> 0000000000000100', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG 1 1 + 1 =');
      const lines = c.renderLines();
      assert.equal(lines[1], '0000000000000100');
    });

    it('Check 2: AC x^(HEX) 1 tan(F) + 1 = -> 00000020', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 AC POWER 1 TAN + 1 =');
      const lines = c.renderLines();
      assert.equal(lines[1], '00000020');
    });

    it('Check 3: AC ln(OCT) 7 + 1 = -> 00000000010', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 AC LN 7 + 1 =');
      const lines = c.renderLines();
      assert.equal(lines[1], '00000000010');
    });

    it('Check 4: AC x²(DEC) d10 + h10 + b10 + o10 = 36', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 AC SQUARE');
      c.pressSequence('SHIFT 3 DOWN 1 1 0 +'); // d 10 +
      c.pressSequence('SHIFT 3 DOWN 2 1 0 +'); // h 10 +
      c.pressSequence('SHIFT 3 DOWN 3 1 0 +'); // b 10 +
      c.pressSequence('SHIFT 3 DOWN 4 1 0 ='); // o 10 =
      const lines = c.renderLines();
      assert.equal(lines[1], '36');
    });

    it('Check 5: AC x²(DEC) 15 * 37 = 555 then x^, log, ln converts result', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 AC SQUARE 1 5 * 3 7 =');
      assert.equal(c.renderLines()[1], '555');

      c.press('POWER'); // HEX
      assert.equal(c.renderLines()[1], '0000022B');

      c.press('LOG'); // BIN
      assert.equal(c.renderLines()[1], '0000001000101011');

      c.press('LN'); // OCT
      assert.equal(c.renderLines()[1], '00000001053');
    });

    it('Check 6: BIN: 1010 and 1100 = -> 0000000000001000', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG 1 0 1 0 SHIFT 3 1 1 1 0 0 =');
      assert.equal(c.renderLines()[1], '0000000000001000');
    });

    it('Check 7: BIN: 1011 or 11010 = -> 0000000000011011', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG 1 0 1 1 SHIFT 3 2 1 1 0 1 0 =');
      assert.equal(c.renderLines()[1], '0000000000011011');
    });

    it('Check 8: BIN: 1010 xor 1100 = -> 0000000000000110', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG 1 0 1 0 SHIFT 3 3 1 1 0 0 =');
      assert.equal(c.renderLines()[1], '0000000000000110');
    });

    it('Check 9: BIN: 1111 xnor 101 = -> 1111111111110101', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG 1 1 1 1 SHIFT 3 4 1 0 1 =');
      assert.equal(c.renderLines()[1], '1111111111110101');
    });

    it('Check 10: BIN: Not(1010) = -> 1111111111110101', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG SHIFT 3 5 1 0 1 0 ) =');
      assert.equal(c.renderLines()[1], '1111111111110101');
    });

    it('Check 11: BIN: Neg(101101) = -> 1111111111010011', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LOG SHIFT 3 6 1 0 1 1 0 1 ) =');
      assert.equal(c.renderLines()[1], '1111111111010011');
    });
  });

  describe('Direct Hex Keys and Arithmetic', () => {
    it('types all hex keys A–F directly in HEX mode', () => {
      const c = new Calculator();
      // (-) -> A, °'" -> B, hyp -> C, sin -> D, cos -> E, tan -> F
      c.pressSequence('MODE 4 POWER NEG DEG HYP SIN COS TAN =');
      assert.equal(c.renderLines()[1], '00ABCDEF');
    });

    it('adds hex numbers: 1A + 2F = 49', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 POWER 1 NEG + 2 TAN =');
      // 0x1A + 0x2F = 26 + 47 = 73 = 0x49
      assert.equal(c.renderLines()[1], '00000049');
    });

    it('multiplies octal numbers: 7 * 10 = 70 octal', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 LN 7 * 1 0 =');
      assert.equal(c.renderLines()[1], '00000000070');
    });

    it('truncates division towards zero: 7 / 2 = 3 in DEC', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 SQUARE 7 / 2 =');
      assert.equal(c.renderLines()[1], '3');
    });

    it('truncates negative division towards zero: -7 / 2 = -3 in DEC', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 SQUARE NEG 7 / 2 =');
      assert.equal(c.renderLines()[1], '-3');
    });
  });

  describe('Error Handling and Mode Boundaries', () => {
    it('throws Syntax ERROR when entering invalid digit for active base', () => {
      const c = new Calculator();
      // In BIN mode, digit 2 is invalid
      c.pressSequence('MODE 4 LOG 2 =');
      assert.equal(c.renderLines()[0], 'Syntax ERROR');

      // In OCT mode, digit 8 is invalid
      c.pressSequence('AC LN 8 =');
      assert.equal(c.renderLines()[0], 'Syntax ERROR');
    });

    it('throws Syntax ERROR on decimal point, fraction, or calculus', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 SQUARE 1 . 5 =');
      assert.equal(c.renderLines()[0], 'Syntax ERROR');

      c.pressSequence('AC 1 FRAC 2 =');
      assert.equal(c.renderLines()[0], 'Syntax ERROR');
    });

    it('throws Math ERROR on division by zero', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 SQUARE 1 0 / 0 =');
      assert.equal(c.renderLines()[0], 'Math ERROR');
    });

    it('throws Math ERROR on 32-bit DEC overflow', () => {
      const c = new Calculator();
      // 2147483647 + 1
      c.pressSequence('MODE 4 SQUARE 2 1 4 7 4 8 3 6 4 7 + 1 =');
      assert.equal(c.renderLines()[0], 'Math ERROR');
    });

    it('throws Math ERROR on 16-bit BIN overflow', () => {
      const c = new Calculator();
      // 32767 + 1 in BIN: 0111111111111111 + 1
      c.pressSequence('MODE 4 LOG 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 + 1 =');
      assert.equal(c.renderLines()[0], 'Math ERROR');
    });

    it('throws Math ERROR when converting a value exceeding 16 bits to BIN', () => {
      const c = new Calculator();
      // 40000 in DEC, then switch to BIN
      c.pressSequence('MODE 4 SQUARE 4 0 0 0 0 =');
      assert.equal(c.renderLines()[1], '40000');
      c.press('LOG');
      assert.equal(c.renderLines()[0], 'Math ERROR');
    });

    it('blocks scientific constants and metric conversions in BASE-N', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4 SQUARE SHIFT 7 SHIFT 8');
      // Screen remains on DEC mode with initial state
      assert.equal(c.app.base, 'DEC');
      assert.equal(c.renderLines()[1], '0');
    });

    it('suppresses Math indicator and displays Linear mode', () => {
      const c = new Calculator();
      c.pressSequence('MODE 4');
      const inds = c.indicators();
      assert.ok(!inds.includes('Math'));
    });
  });
});
