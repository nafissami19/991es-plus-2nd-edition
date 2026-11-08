/**
 * Complex mode unit tests (authentic fx-991ES PLUS 2nd edition).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { ComplexValue, cadd, csub, cmul, cdiv, cneg, cabs, carg } from '../js/core/modes/complex/ComplexValue.js';
import { ExactValue } from '../js/core/exact/ExactValue.js';
import { Decimal15 } from '../js/core/number/Decimal15.js';

function lines(calc) {
  return calc.getScreen().lines;
}

test('ComplexValue arithmetic & exact forms', () => {
  const z1 = new ComplexValue(ExactValue.from(1), ExactValue.from(1)); // 1 + i
  const z2 = new ComplexValue(ExactValue.from(2), ExactValue.from(-3)); // 2 - 3i

  // Add: 3 - 2i
  const sum = cadd(z1, z2);
  assert.equal(sum.re.toDecimal15().toString(), '3');
  assert.equal(sum.im.toDecimal15().toString(), '-2');

  // Sub: -1 + 4i
  const diff = csub(z1, z2);
  assert.equal(diff.re.toDecimal15().toString(), '-1');
  assert.equal(diff.im.toDecimal15().toString(), '4');

  // Mul: (1+i)(2-3i) = 2 - 3i + 2i + 3 = 5 - i
  const prod = cmul(z1, z2);
  assert.equal(prod.re.toDecimal15().toString(), '5');
  assert.equal(prod.im.toDecimal15().toString(), '-1');

  // Div: (1+i)/(1-i) = i
  const z3 = new ComplexValue(ExactValue.from(1), ExactValue.from(-1));
  const quot = cdiv(z1, z3);
  assert.equal(quot.re.toDecimal15().toString(), '0');
  assert.equal(quot.im.toDecimal15().toString(), '1');

  // Abs: |1+i| = √2
  const absVal = cabs(z1);
  assert.equal(absVal.type, 'surd');
  assert.equal(absVal.format(), '√2');

  // Arg: Arg(1+i) = 45 in DEG, π/4 in RAD
  const argDeg = carg(z1, 'DEG');
  assert.equal(argDeg.toDecimal15().toString(), '45');
  const argRad = carg(z1, 'RAD');
  assert.equal(argRad.type, 'pi');
  assert.equal(argRad.value.q.toString(), '1/4');
});

test('Complex mode entry and indicators', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  assert.equal(calc.mode, 2);
  assert.ok(calc.indicators().includes('CMPLX'));

  // Switch setup to r∠θ (SHIFT MODE DOWN 3 2)
  calc.pressSequence(['SHIFT', 'MODE', 'DOWN', '3', '2']);
  assert.ok(calc.indicators().includes('CMPLX'));

  // Switch back to a+bi (SHIFT MODE DOWN 3 1)
  calc.pressSequence(['SHIFT', 'MODE', 'DOWN', '3', '1']);
  assert.ok(calc.indicators().includes('CMPLX'));
});

test('Complex mode basic calculation and i input', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);

  // 1 + i via ENG
  calc.pressSequence(['1', '+', 'ENG', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '1+i');

  // Ans^2 = 2i
  calc.pressSequence(['x²', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '2i');
});

test('Manual Example 1: (1+i)⁴ + (1-i)² = -4-2i', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  calc.pressSequence(['(', '1', '+', 'ENG', ')', '^', '4', 'RIGHT', '+', '(', '1', '-', 'ENG', ')', 'x²', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '−4−2i');
});

test('Manual Example 2: 2∠45 = √2 + √2i (Deg, a+bi)', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  calc.pressSequence(['2', 'SHIFT', '(-)', '4', '5', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '√2+√2i');
});

test('Manual Example 3: √2 + √2i = 2∠45 (Deg, r∠θ)', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  calc.pressSequence(['SHIFT', 'MODE', 'DOWN', '3', '2']); // Set r∠θ
  calc.pressSequence(['SQRT', '2', 'RIGHT', '+', 'SQRT', '2', 'RIGHT', 'ENG', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '2∠45');
});

test('Manual Example 4: Conjg(2+3i) = 2-3i', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  calc.pressSequence(['SHIFT', '2', '2', '2', '+', '3', 'ENG', ')', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '2−3i');
});

test('Manual Example 5: Abs(1+i) = √2, Arg(1+i) = 45', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  calc.pressSequence(['SHIFT', 'hyp', '1', '+', 'ENG', 'EXE']); // Abs(1+i)
  assert.equal(lines(calc)[1].trim(), '√2');

  calc.pressSequence(['SHIFT', '2', '1', '1', '+', 'ENG', ')', 'EXE']); // Arg(1+i)
  assert.equal(lines(calc)[1].trim(), '45');
});

test('Manual Example 7 & 8: ▸r∠θ and ▸a+bi conversions', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);

  // 2 + 3i ▸r∠θ EXE
  calc.pressSequence(['2', '+', '3', 'ENG', 'SHIFT', '2', '3', 'EXE']);
  assert.ok(lines(calc)[1].includes('∠'));
  assert.ok(lines(calc)[1].startsWith('3.605551275'));

  // 2∠45 ▸a+bi EXE
  calc.pressSequence(['2', 'SHIFT', '(-)', '4', '5', 'SHIFT', '2', '4', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '√2+√2i');
});

test('S<=>D toggles exact surds to decimal form', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);
  calc.pressSequence(['SQRT', '2', 'RIGHT', '+', 'ENG', 'EXE']);
  assert.equal(lines(calc)[1].trim(), '√2+i');

  calc.press('SD');
  assert.ok(lines(calc)[1].startsWith('1.414213562'));

  calc.press('SD');
  assert.equal(lines(calc)[1].trim(), '√2+i');
});

test('Errors on unsupported functions on complex numbers', () => {
  const calc = new Calculator();
  calc.pressSequence(['MODE', '2']);

  // Calculus templates prohibited
  calc.pressSequence(['INTEGRAL', 'ENG', 'EXE']);
  assert.ok(lines(calc).some((l) => l.includes('Syntax ERROR')));
});
