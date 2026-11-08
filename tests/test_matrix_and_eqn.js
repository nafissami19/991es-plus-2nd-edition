import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

test('Mode 5: EQN - 2-unknowns simultaneous equations (Ex 1)', () => {
  const c = new Calculator();
  c.pressSequence('MODE 5 1');
  // x + 2y = 3, 2x + 3y = 4
  c.pressSequence('1 EXE 2 EXE 3 EXE 2 EXE 3 EXE 4 EXE EXE');
  assert.equal(c.getScreen().lines[0], 'X=');
  assert.equal(c.getScreen().lines[1], '−1');
  c.press('EXE');
  assert.equal(c.getScreen().lines[0], 'Y=');
  assert.equal(c.getScreen().lines[1], '2');
});

test('Mode 5: EQN - 3-unknowns simultaneous equations (Ex 2)', () => {
  const c = new Calculator();
  c.pressSequence('MODE 5 2');
  // x - y + z = 2, x + y - z = 0, -x + y + z = 4
  c.pressSequence('1 EXE NEG 1 EXE 1 EXE 2 EXE');
  c.pressSequence('1 EXE 1 EXE NEG 1 EXE 0 EXE');
  c.pressSequence('NEG 1 EXE 1 EXE 1 EXE 4 EXE EXE');
  assert.equal(c.getScreen().lines[0], 'X=');
  assert.equal(c.getScreen().lines[1], '1');
  c.press('EXE');
  assert.equal(c.getScreen().lines[0], 'Y=');
  assert.equal(c.getScreen().lines[1], '2');
  c.press('EXE');
  assert.equal(c.getScreen().lines[0], 'Z=');
  assert.equal(c.getScreen().lines[1], '3');
});

test('Mode 5: EQN - Quadratic complex roots (Ex 3)', () => {
  const c = new Calculator();
  c.pressSequence('MODE 5 3');
  // x^2 + x + 3/4 = 0
  c.pressSequence('1 EXE 1 EXE 3 FRAC 4 EXE EXE');
  assert.equal(c.getScreen().lines[0], 'X1=');
  assert.match(c.getScreen().lines[1], /−1\/2\+√2\/2i/);
  assert.ok(c.getScreen().indicators.includes('CMPLX'));
  c.press('EXE');
  assert.equal(c.getScreen().lines[0], 'X2=');
  assert.match(c.getScreen().lines[1], /−1\/2−√2\/2i/);
});

test('Mode 5: EQN - Quadratic repeated root (Ex 4)', () => {
  const c = new Calculator();
  c.pressSequence('MODE 5 3');
  // x^2 - 2√2 x + 2 = 0 -> single repeated root X = √2
  c.pressSequence('1 EXE NEG 2 SQRT 2 RIGHT EXE 2 EXE EXE');
  assert.equal(c.getScreen().lines[0], 'X=');
  assert.equal(c.getScreen().lines[1], '√2');
});

test('Mode 5: EQN - Cubic equation roots (Ex 5)', () => {
  const c = new Calculator();
  c.pressSequence('MODE 5 4');
  // x^3 - 2x^2 - x + 2 = 0
  c.pressSequence('1 EXE NEG 2 EXE NEG 1 EXE 2 EXE EXE');
  assert.equal(c.getScreen().lines[0], 'X1=');
  assert.equal(c.getScreen().lines[1], '−1');
  c.press('EXE');
  assert.equal(c.getScreen().lines[0], 'X2=');
  assert.equal(c.getScreen().lines[1], '2');
  c.press('EXE');
  assert.equal(c.getScreen().lines[0], 'X3=');
  assert.equal(c.getScreen().lines[1], '1');
});

test('Mode 5: EQN - AC returns to editor, S<=>D toggles, and STO works', () => {
  const c = new Calculator();
  c.pressSequence('MODE 5 1');
  c.pressSequence('1 EXE 2 EXE 3 EXE 2 EXE 3 EXE 4 EXE EXE'); // X = -1
  // STO to A
  c.pressSequence('SHIFT RCL NEG');
  // AC to return to editor
  c.press('AC');
  assert.equal(c.getScreen().lines[0], 'anX+bnY=cn');

  // Verify stored variable in COMP mode
  c.pressSequence('MODE 1 RCL NEG EXE');
  assert.equal(c.getScreen().lines[1], '−1');
});

test('Mode 6: MATRIX - Complete User Guide operations suite (Ex 1 to 8)', () => {
  const c = new Calculator();
  // Ex 1 & 2 Setup: MatA 2x2 [[2, 1], [1, 1]], MatB 2x2 [[2, -1], [-1, 2]]
  c.pressSequence('MODE 6 1 5'); // MatA 2x2
  c.pressSequence('2 EXE 1 EXE 1 EXE 1 EXE AC');
  c.pressSequence('SHIFT 4 1 2 5'); // Dim MatB 2x2
  c.pressSequence('2 EXE NEG 1 EXE NEG 1 EXE 2 EXE AC');

  // Ex 1: MatA × MatB
  c.pressSequence('SHIFT 4 3 MUL SHIFT 4 4 EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // Ex 1: MatA + MatB
  c.pressSequence('AC SHIFT 4 3 ADD SHIFT 4 4 EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // Ex 3: 3 × MatA
  c.pressSequence('AC 3 MUL SHIFT 4 3 EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // Ex 4: det(MatA) = 1
  c.pressSequence('AC SHIFT 4 7 SHIFT 4 3 RPAREN EXE');
  assert.equal(c.getScreen().lines[1], '1');

  // Ex 5: Trn(MatC)
  c.pressSequence('AC SHIFT 4 1 3 4'); // Dim MatC 2x3
  c.pressSequence('1 EXE 0 EXE NEG 1 EXE 0 EXE NEG 1 EXE 1 EXE AC');
  c.pressSequence('SHIFT 4 8 SHIFT 4 5 RPAREN EXE');
  assert.match(c.getScreen().lines[0], /MatAns\(3×2\)/);

  // Ex 6: Inverse MatA⁻¹ via RECIP (x⁻¹)
  c.pressSequence('AC SHIFT 4 3 RECIP EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // Ex 7: Abs(MatB) via SHIFT HYP
  c.pressSequence('AC SHIFT HYP SHIFT 4 4 RPAREN EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // Ex 8: MatA² and MatA³
  c.pressSequence('AC SHIFT 4 3 SQUARE EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);
  c.pressSequence('AC SHIFT 4 3 SHIFT SQUARE EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // MatAns continuation: MatA × MatB then + MatA
  c.pressSequence('AC SHIFT 4 3 MUL SHIFT 4 4 EXE');
  c.pressSequence('ADD SHIFT 4 3 EXE');
  assert.match(c.getScreen().lines[0], /MatAns/);

  // STO matrix copy
  c.pressSequence('AC SHIFT 4 2 1'); // Data MatA
  c.pressSequence('SHIFT RCL HYP'); // STO MatC
  assert.match(c.getScreen().lines[0], /MatC/);
});
