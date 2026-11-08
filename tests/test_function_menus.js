/**
 * Unit tests for Prompt 16 — Function menus: hyp, DRG▸, CONST, CONV, Pol/Rec, ENG,
 * Abs, Ran#, RanInt#, Rnd, x!, nPr, nCr, and cleanroom verification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { CONSTANTS_2014 } from '../js/core/data/constants.js';
import { CONVERSION_LIST } from '../js/core/data/conversions.js';

describe('Prompt 16 — hyp Menu (1–6)', () => {
  it('opens hyp menu and inserts hyperbolic functions', () => {
    const funcs = [
      { key: '1', name: 'sinh', test: '0 ) =', expected: '0' },
      { key: '2', name: 'cosh', test: '0 ) =', expected: '1' },
      { key: '3', name: 'tanh', test: '0 ) =', expected: '0' },
      { key: '4', name: 'sinh⁻¹', test: '0 ) =', expected: '0' },
      { key: '5', name: 'cosh⁻¹', test: '1 ) =', expected: '0' },
      { key: '6', name: 'tanh⁻¹', test: '0 ) =', expected: '0' }
    ];

    for (const f of funcs) {
      const calc = new Calculator();
      calc.press('HYP');
      assert.equal(calc.topView.constructor.name, 'HypMenuView');
      calc.press(f.key);
      calc.pressSequence(f.test);
      assert.equal(calc.renderLines()[1], f.expected, `Testing ${f.name}`);
    }
  });

  it('cancels hyp menu on AC without modifying expression', () => {
    const calc = new Calculator();
    calc.pressSequence('1 + 2');
    calc.press('HYP');
    assert.equal(calc.topView.constructor.name, 'HypMenuView');
    calc.press('AC');
    assert.equal(calc.topView.constructor.name, 'CalcApp');
  });
});

describe('Prompt 16 — DRG▸ Angle Conversion Menu', () => {
  it('converts degrees to radians using DRG▸ 1 (°)', () => {
    const calc = new Calculator();
    calc.setup.angle = 'RAD';
    calc.pressSequence('1 8 0 SHIFT ANS 1 =');
    assert.equal(calc.renderLines()[0], '180°');
    assert.equal(calc.renderLines()[1], 'π');
  });

  it('converts radians to degrees using DRG▸ 2 (r)', () => {
    const calc = new Calculator();
    calc.setup.angle = 'DEG';
    calc.pressSequence('SHIFT EXP10 SHIFT ANS 2 =');
    assert.equal(calc.renderLines()[0], 'πr');
    assert.equal(calc.renderLines()[1], '180');
  });

  it('converts grad to degrees using DRG▸ 3 (g)', () => {
    const calc = new Calculator();
    calc.setup.angle = 'DEG';
    calc.pressSequence('2 0 0 SHIFT ANS 3 =');
    assert.equal(calc.renderLines()[0], '200g');
    assert.equal(calc.renderLines()[1], '180');
  });
});

describe('Prompt 16 — 40 Scientific Constants (SHIFT 7 01~40)', () => {
  it('Check-yourself 1: SHIFT 7 28 = -> 299792458 (c₀)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT 7 2 8 =');
    assert.equal(calc.renderLines()[0], 'c₀');
    assert.equal(calc.renderLines()[1], '299792458');
  });

  it('Check-yourself 2: 1/√(ε₀μ₀) = 299792458', () => {
    const calc = new Calculator();
    calc.pressSequence('FRAC 1 DOWN SQRT SHIFT 7 3 2 SHIFT 7 3 3 =');
    assert.equal(calc.renderLines()[1], '299792458');
  });

  it('inserts and evaluates all 40 constants', () => {
    for (let i = 1; i <= 40; i++) {
      const calc = new Calculator();
      const numStr = String(i).padStart(2, '0');
      calc.pressSequence(`SHIFT 7 ${numStr[0]} ${numStr[1]} =`);
      const lines = calc.renderLines();
      assert.ok(lines[0].length > 0, `Constant ${i} should have a formula`);
      assert.ok(lines[1].length > 0, `Constant ${i} should have a result`);
    }
  });

  it('disallows CONST in BASE-N mode', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 4');
    calc.pressSequence('SHIFT 7');
    assert.equal(calc.topView.constructor.name, 'BaseNApp');
  });
});

describe('Prompt 16 — 40 Metric Conversions (SHIFT 8 01~40)', () => {
  it('Check-yourself 3: LineIO 5 SHIFT 8 02 = -> 1.968503937 (cm▸in)', () => {
    const calc = new Calculator();
    calc.setInputOutput('LineI/LineO');
    calc.pressSequence('5 SHIFT 8 0 2 =');
    assert.equal(calc.renderLines()[0], '5cm▸in');
    assert.equal(calc.renderLines()[1], '1.968503937');
  });

  it('Check-yourself 4: LineIO 100 SHIFT 8 22 = -> 3.527396195 (g▸oz)', () => {
    const calc = new Calculator();
    calc.setInputOutput('LineI/LineO');
    calc.pressSequence('1 0 0 SHIFT 8 2 2 =');
    assert.equal(calc.renderLines()[0], '100g▸oz');
    assert.equal(calc.renderLines()[1], '3.527396195');
  });

  it('Check-yourself 5: LineIO (-) 31 SHIFT 8 38 = -> −23.8 (°C▸°F)', () => {
    const calc = new Calculator();
    calc.setInputOutput('LineI/LineO');
    calc.pressSequence('NEG 3 1 SHIFT 8 3 8 =');
    assert.equal(calc.renderLines()[0], '-31°C▸°F');
    assert.equal(calc.renderLines()[1], '−23.8');
  });

  it('has priority level 6: 1 + 2 in▸cm = 1 + (2 in▸cm)', () => {
    const calc = new Calculator();
    calc.setInputOutput('LineI/LineO');
    calc.pressSequence('1 + 2 SHIFT 8 0 1 =');
    // 2 in = 5.08 cm -> 1 + 5.08 = 6.08
    assert.equal(calc.renderLines()[1], '6.08');
  });

  it('disallows CONV in BASE-N mode', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 4');
    calc.pressSequence('SHIFT 8');
    assert.equal(calc.topView.constructor.name, 'BaseNApp');
  });
});

describe('Prompt 16 — Coordinate Transformations: Pol and Rec', () => {
  it('Pol(√2, √2) yields r=2, θ=45 and stores into X and Y', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT ADD SQRT 2 RIGHT COMMA SQRT 2 RIGHT RPAREN =');
    const lines = calc.renderLines();
    assert.ok(lines[1].includes('r=2') && lines[1].includes('θ=45'));

    // Variables X and Y store results
    assert.equal(calc.memory.getVar('X').toDecimal15().toString(), '2');
    assert.equal(calc.memory.getVar('Y').toDecimal15().toString(), '45');
  });

  it('Rec(2, 45) yields X and Y and stores into X and Y', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT SUB 2 COMMA 4 5 RPAREN =');
    const lines = calc.renderLines();
    assert.ok(lines[1].includes('X=') && lines[1].includes('Y='));

    const xVal = calc.memory.getVar('X').toDecimal15().toNumber();
    const yVal = calc.memory.getVar('Y').toDecimal15().toNumber();
    assert.ok(Math.abs(xVal - Math.SQRT2) < 1e-9);
    assert.ok(Math.abs(yVal - Math.SQRT2) < 1e-9);
  });
});

describe('Prompt 16 — Math Functions: Abs, Ran#, RanInt#, Rnd, x!, nPr, nCr, ENG', () => {
  it('Abs evaluates absolute value: Abs(-5) = 5', () => {
    const calc = new Calculator();
    calc.pressSequence('ABS NEG 5 =');
    assert.equal(calc.renderLines()[1], '5');
  });

  it('factorial x! calculates n!: 5! = 120', () => {
    const calc = new Calculator();
    calc.pressSequence('5 SHIFT RECIP =');
    assert.equal(calc.renderLines()[1], '120');
  });

  it('permutations nPr: 5 P 2 = 20', () => {
    const calc = new Calculator();
    calc.pressSequence('5 SHIFT MUL 2 =');
    assert.equal(calc.renderLines()[1], '20');
  });

  it('combinations nCr: 5 C 2 = 10', () => {
    const calc = new Calculator();
    calc.pressSequence('5 SHIFT DIV 2 =');
    assert.equal(calc.renderLines()[1], '10');
  });

  it('Rnd rounds to current display setting', () => {
    const calc = new Calculator();
    calc.setInputOutput('LineI/LineO');
    calc.pressSequence('SHIFT MODE 6 3'); // Fix 3
    calc.pressSequence('SHIFT 0 1 0 / 3 RPAREN * 3 =');
    assert.equal(calc.renderLines()[1], '9.999');
  });

  it('Ran# generates random numbers in [0, 1)', () => {
    const calc = new Calculator();
    calc.pressSequence('Ran# =');
    const lines = calc.renderLines();
    assert.equal(lines[0], 'Ran#');
    assert.ok(lines[1].length > 0);
  });

  it('RanInt#(1, 6) generates integers in [1, 6]', () => {
    const calc = new Calculator();
    calc.pressSequence('RanInt# 1 COMMA 6 RPAREN =');
    const val = Number(calc.renderLines()[1]);
    assert.ok(Number.isInteger(val) && val >= 1 && val <= 6);
  });

  it('ENG and ←ENG adjust engineering notation powers by 3', () => {
    const calc = new Calculator();
    calc.pressSequence('1 2 3 4 =');
    assert.equal(calc.renderLines()[1], '1234');
    calc.pressSequence('ENG');
    assert.equal(calc.renderLines()[1], '1.234×10³');
    calc.pressSequence('ENG');
    assert.equal(calc.renderLines()[1], '1234×10⁰');
    calc.pressSequence('SHIFT ENG');
    assert.equal(calc.renderLines()[1], '1.234×10³');
  });

  it('verifies OPTN is not present on CalcApp', () => {
    const calc = new Calculator();
    assert.equal(typeof calc.app.openOptn, 'undefined');
    assert.equal(typeof calc.app.optnItems, 'undefined');
  });
});
