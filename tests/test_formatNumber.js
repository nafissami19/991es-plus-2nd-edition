/**
 * Comprehensive Unit Tests for Casio fx-991ES PLUS 2nd Edition Number Display Formatting
 *
 * Verifies:
 * - 10-digit display rounding from 15-digit internal mantissa
 * - Norm 1 and Norm 2 transition thresholds
 * - Fix 0-9 precision, rounding, and trailing zeros
 * - Sci 1-10 precision (Sci 0 = 10 digits)
 * - ENG and SHIFT ENG repeated exponent shifts (multiples of 3)
 * - Disp Dot / Comma formatting for results
 * - Structured LCD output fields
 * - Rnd() function behavior across Norm, Fix, and Sci
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Decimal15 } from '../js/core/number/Decimal15.js';
import { formatNumber, toSuperscript } from '../js/core/format/formatNumber.js';
import * as F from '../js/core/number/functions.js';
import { Calculator } from '../js/core/Calculator.js';

describe('Display Formatting (formatNumber.js)', () => {

  describe('1. Zero and Negative Zero Handling', () => {
    it('0 in Norm 1 is "0"', () => {
      const res = formatNumber(0);
      assert.strictEqual(res.fullString, '0');
      assert.strictEqual(res.sign, 0);
    });

    it('0 in Fix 3 is "0.000"', () => {
      const res = formatNumber(0, { format: { type: 'FIX', value: 3 } });
      assert.strictEqual(res.fullString, '0.000');
    });

    it('0 in Fix 0 is "0"', () => {
      const res = formatNumber(0, { format: { type: 'FIX', value: 0 } });
      assert.strictEqual(res.fullString, '0');
    });

    it('0 in Sci 4 is "0.000×10⁰"', () => {
      const res = formatNumber(0, { format: { type: 'SCI', value: 4 } });
      assert.strictEqual(res.fullString, '0.000×10⁰');
    });

    it('-0 rounds to "0" without negative sign', () => {
      const res = formatNumber(Decimal15.fromString('-1e-15'), { format: { type: 'FIX', value: 2 } });
      assert.strictEqual(res.fullString, '0.00');
      assert.strictEqual(res.sign, 0);
    });
  });

  describe('2. 10-Digit Display Rounding', () => {
    it('rounds 15-digit internal value to 10 display digits', () => {
      const res = formatNumber('1.23456789049999');
      assert.strictEqual(res.fullString, '1.23456789');
    });

    it('rounds half-up on the 11th digit when 5', () => {
      const res = formatNumber('1.23456789050000');
      assert.strictEqual(res.fullString, '1.234567891');
    });

    it('handles ripple carry: 0.99999999999 rounds to 1', () => {
      const res = formatNumber('0.999999999999999');
      assert.strictEqual(res.fullString, '1');
    });

    it('1 ÷ 3 is rounded to 10 digits "0.3333333333"', () => {
      const oneThird = Decimal15.ONE.div(Decimal15.fromString('3'));
      const res = formatNumber(oneThird);
      assert.strictEqual(res.fullString, '0.3333333333');
    });
  });

  describe('3. Norm 1 Mode (Default)', () => {
    it('standard decimal within range 0.01 <= x < 1e10', () => {
      assert.strictEqual(formatNumber('0.01').fullString, '0.01');
      assert.strictEqual(formatNumber('123.45').fullString, '123.45');
      assert.strictEqual(formatNumber('9999999999').fullString, '9999999999');
    });

    it('drops trailing zeros in Norm mode', () => {
      assert.strictEqual(formatNumber('1.5000').fullString, '1.5');
      assert.strictEqual(formatNumber('2.0000').fullString, '2');
    });

    it('switches to exponential when x < 0.01 (e.g. 0.001 -> 1×10⁻³)', () => {
      const res = formatNumber('0.001');
      assert.strictEqual(res.fullString, '1×10⁻³');
      assert.strictEqual(res.isExponential, true);
      assert.strictEqual(res.exponent, -3);
    });

    it('1 ÷ 200 in Norm 1 produces "5×10⁻³"', () => {
      const res = formatNumber('0.005', { format: { type: 'NORM', value: 1 } });
      assert.strictEqual(res.fullString, '5×10⁻³');
    });

    it('switches to exponential when x >= 1e10 (e.g. 12345678901 -> 1.23456789×10¹⁰)', () => {
      const res = formatNumber('12345678901');
      assert.strictEqual(res.fullString, '1.23456789×10¹⁰');
      assert.strictEqual(res.isExponential, true);
      assert.strictEqual(res.exponent, 10);
    });

    it('formats negative small number: -0.005 -> -5×10⁻³', () => {
      const res = formatNumber('-0.005');
      assert.strictEqual(res.fullString, '-5×10⁻³');
    });
  });

  describe('4. Norm 2 Mode', () => {
    const opts = { format: { type: 'NORM', value: 2 } };

    it('0.001 stays decimal in Norm 2', () => {
      assert.strictEqual(formatNumber('0.001', opts).fullString, '0.001');
    });

    it('1 ÷ 200 in Norm 2 produces "0.005"', () => {
      assert.strictEqual(formatNumber('0.005', opts).fullString, '0.005');
    });

    it('0.000000001 stays decimal in Norm 2 (1e-9)', () => {
      assert.strictEqual(formatNumber('0.000000001', opts).fullString, '0.000000001');
    });

    it('switches to exponential when x < 1e-9 (e.g. 1e-10 -> 1×10⁻¹⁰)', () => {
      assert.strictEqual(formatNumber('1e-10', opts).fullString, '1×10⁻¹⁰');
    });

    it('switches to exponential when x >= 1e10', () => {
      assert.strictEqual(formatNumber('1e10', opts).fullString, '1×10¹⁰');
    });
  });

  describe('5. Fix 0–9 Mode', () => {
    it('Fix 3 on 100/7 displays "14.286"', () => {
      const val = Decimal15.fromString('100').div(Decimal15.fromString('7'));
      const res = formatNumber(val, { format: { type: 'FIX', value: 3 } });
      assert.strictEqual(res.fullString, '14.286');
    });

    it('Fix 2 on 100/7 displays "14.29"', () => {
      const val = Decimal15.fromString('100').div(Decimal15.fromString('7'));
      const res = formatNumber(val, { format: { type: 'FIX', value: 2 } });
      assert.strictEqual(res.fullString, '14.29');
    });

    it('Fix 3 on 1/3 displays "0.333"', () => {
      const oneThird = Decimal15.ONE.div(Decimal15.fromString('3'));
      const res = formatNumber(oneThird, { format: { type: 'FIX', value: 3 } });
      assert.strictEqual(res.fullString, '0.333');
    });

    it('Fix 3 preserves trailing zeros: 1 -> "1.000"', () => {
      const res = formatNumber(1, { format: { type: 'FIX', value: 3 } });
      assert.strictEqual(res.fullString, '1.000');
    });

    it('Fix 0 on 12.5 rounds half-up to "13"', () => {
      const res = formatNumber('12.5', { format: { type: 'FIX', value: 0 } });
      assert.strictEqual(res.fullString, '13');
    });

    it('Fix 5 on 0.1234567 rounds to "0.12346"', () => {
      const res = formatNumber('0.1234567', { format: { type: 'FIX', value: 5 } });
      assert.strictEqual(res.fullString, '0.12346');
    });

    it('switches to exponential when value exceeds 10 digits', () => {
      const res = formatNumber('12345678901', { format: { type: 'FIX', value: 2 } });
      assert.ok(res.isExponential);
      assert.ok(res.fullString.includes('×10¹⁰'));
    });
  });

  describe('6. Sci 1–10 Mode', () => {
    it('Sci 5 on 1/7 displays "1.4286×10⁻¹"', () => {
      const val = Decimal15.ONE.div(Decimal15.fromString('7'));
      const res = formatNumber(val, { format: { type: 'SCI', value: 5 } });
      assert.strictEqual(res.fullString, '1.4286×10⁻¹');
    });

    it('Sci 4 on 1/7 displays "1.429×10⁻¹"', () => {
      const val = Decimal15.ONE.div(Decimal15.fromString('7'));
      const res = formatNumber(val, { format: { type: 'SCI', value: 4 } });
      assert.strictEqual(res.fullString, '1.429×10⁻¹');
    });

    it('Sci 4 on 12345 displays "1.235×10⁴"', () => {
      const res = formatNumber(12345, { format: { type: 'SCI', value: 4 } });
      assert.strictEqual(res.fullString, '1.235×10⁴');
    });

    it('Sci 1 on 9.8 displays "1×10¹"', () => {
      const res = formatNumber('9.8', { format: { type: 'SCI', value: 1 } });
      assert.strictEqual(res.fullString, '1×10¹');
    });

    it('Sci 3 on 0.005 displays "5.00×10⁻³"', () => {
      const res = formatNumber('0.005', { format: { type: 'SCI', value: 3 } });
      assert.strictEqual(res.fullString, '5.00×10⁻³');
    });

    it('Sci 0 selects 10 significant digits', () => {
      const res = formatNumber('1.234567890123', { format: { type: 'SCI', value: 0 } });
      assert.strictEqual(res.fullString, '1.234567890×10⁰');
    });

    it('Sci preserves trailing zeros on integer: 1 in Sci 3 -> "1.00×10⁰"', () => {
      const res = formatNumber(1, { format: { type: 'SCI', value: 3 } });
      assert.strictEqual(res.fullString, '1.00×10⁰');
    });
  });

  describe('7. ENG and SHIFT ENG Exponent Shifts', () => {
    it('1234 = ENG produces "1.234×10³"', () => {
      const res = formatNumber(1234, { engOffset: 0 });
      assert.strictEqual(res.fullString, '1.234×10³');
      assert.strictEqual(res.exponent, 3);
    });

    it('1234 = ENG ENG produces "1234×10⁰"', () => {
      const res = formatNumber(1234, { engOffset: -3 });
      assert.strictEqual(res.fullString, '1234×10⁰');
      assert.strictEqual(res.exponent, 0);
    });

    it('1234 = ENG ENG ENG produces "1234000×10⁻³"', () => {
      const res = formatNumber(1234, { engOffset: -6 });
      assert.strictEqual(res.fullString, '1234000×10⁻³');
      assert.strictEqual(res.exponent, -3);
    });

    it('123 = SHIFT ENG produces "0.123×10³"', () => {
      const res = formatNumber(123, { engOffset: 3 });
      assert.strictEqual(res.fullString, '0.123×10³');
      assert.strictEqual(res.exponent, 3);
    });

    it('123 = SHIFT ENG SHIFT ENG produces "0.000123×10⁶"', () => {
      const res = formatNumber(123, { engOffset: 6 });
      assert.strictEqual(res.fullString, '0.000123×10⁶');
      assert.strictEqual(res.exponent, 6);
    });

    it('ENG handles negative numbers: -123456 -> "-123.456×10³"', () => {
      const res = formatNumber(-123456, { engOffset: 0 });
      assert.strictEqual(res.fullString, '-123.456×10³');
    });
  });

  describe('8. Disp Dot / Comma', () => {
    it('Decimal mark COMMA replaces dot with comma in results: "123,45"', () => {
      const res = formatNumber('123.45', { decimalMark: 'COMMA' });
      assert.strictEqual(res.fullString, '123,45');
    });

    it('Decimal mark DOT keeps dot: "123.45"', () => {
      const res = formatNumber('123.45', { decimalMark: 'DOT' });
      assert.strictEqual(res.fullString, '123.45');
    });

    it('Fix 3 with COMMA formats as "14,286"', () => {
      const val = Decimal15.fromString('100').div(Decimal15.fromString('7'));
      const res = formatNumber(val, { format: { type: 'FIX', value: 3 }, decimalMark: 'COMMA' });
      assert.strictEqual(res.fullString, '14,286');
    });
  });

  describe('9. Rnd Function', () => {
    it('Rnd rounds to Fix decimal places', () => {
      const v = Decimal15.from(10).div(Decimal15.from(3));
      const rounded = F.rnd(v, { type: 'FIX', value: 3 });
      assert.strictEqual(rounded.toString(), '3.333');
      const mul = rounded.mul(Decimal15.from(3));
      assert.strictEqual(mul.toString(), '9.999');
    });

    it('Rnd rounds to Sci significant digits', () => {
      const v = Decimal15.from(1).div(Decimal15.from(7));
      const rounded = F.rnd(v, { type: 'SCI', value: 4 });
      const formatted = formatNumber(rounded, { format: { type: 'SCI', value: 4 } });
      assert.strictEqual(formatted.fullString, '1.429×10⁻¹');
    });

    it('Rnd rounds to 10 digits in Norm mode', () => {
      const v = Decimal15.from(1).div(Decimal15.from(3));
      const rounded = F.rnd(v, { type: 'NORM', value: 1 });
      assert.strictEqual(rounded.toString(), '0.3333333333');
    });
  });

  describe('10. End-to-End Calculator Check-Yourself Suite (Prompt 6)', () => {
    function run(setup, keys) {
      const c = new Calculator({ setup });
      c.pressSequence(keys);
      return c.getScreen().lines[1];
    }

    it('Fix 3: 100 ÷ 7 = -> 14.286', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Fix 3' }, '1 0 0 DIV 7 EXE'), '14.286');
    });

    it('Fix 2: 100 ÷ 7 = -> 14.29', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Fix 2' }, '1 0 0 DIV 7 EXE'), '14.29');
    });

    it('Sci 5: 1 ÷ 7 = -> 1.4286×10⁻¹', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Sci 5' }, '1 DIV 7 EXE'), '1.4286×10⁻¹');
    });

    it('Sci 4: 1 ÷ 7 = -> 1.429×10⁻¹', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Sci 4' }, '1 DIV 7 EXE'), '1.429×10⁻¹');
    });

    it('Norm 1: 1 ÷ 200 = -> 5×10⁻³', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Norm 1' }, '1 DIV 2 0 0 EXE'), '5×10⁻³');
    });

    it('Norm 2: 1 ÷ 200 = -> 0.005', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Norm 2' }, '1 DIV 2 0 0 EXE'), '0.005');
    });

    it('Fix 3: 10 ÷ 3 × 3 = -> 10.000', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Fix 3' }, '1 0 DIV 3 MUL 3 EXE'), '10.000');
    });

    it('Fix 3: Rnd(10 ÷ 3) × 3 = -> 9.999', () => {
      assert.strictEqual(run({ display: 'LineIO', format: 'Fix 3' }, 'SHIFT 0 1 0 DIV 3 RPAREN MUL 3 EXE'), '9.999');
    });
  });

});
