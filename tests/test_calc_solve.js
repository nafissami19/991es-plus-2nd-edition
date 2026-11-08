import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Calculator } from '../js/core/Calculator.js';
import { CalcVarsView, SolveVarsView } from '../js/core/apps/calcSolve.js';
import { MINUS } from '../js/core/format/display.js';

describe('Prompt 17 — CALC Feature', () => {
  it('opens CALC prompt screen showing expression on top and variable prompt on bottom (A? 0)', () => {
    const calc = new Calculator();
    // 3 A + B
    calc.pressSequence('3 A + B CALC');
    assert(calc.topView instanceof CalcVarsView);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '3A+B');
    assert.strictEqual(scr.lines[1], 'A? 0');
    assert.ok(scr.indicators.includes('Up'));
    assert.ok(scr.indicators.includes('Down'));
  });

  it('prompts each variable and computes result (3A+B CALC 5 = 10 = -> 25)', () => {
    const calc = new Calculator();
    calc.pressSequence('3 A + B CALC');
    assert.strictEqual(calc.getScreen().lines[1], 'A? 0');

    calc.pressSequence('5 =');
    assert.strictEqual(calc.getScreen().lines[1], 'B? 0');

    calc.pressSequence('1 0 =');
    // Result screen reached
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '3A+B');
    assert.strictEqual(scr.lines[1], '25');
    assert.strictEqual(calc.memory.getVar('A').toDecimal15().toString(), '5');
    assert.strictEqual(calc.memory.getVar('B').toDecimal15().toString(), '10');
    assert.strictEqual(calc.memory.getAns().toDecimal15().toString(), '25');
  });

  it('Prompt 17 Check-yourself Case 1: 3A+B CALC 5 = 10 = -> 25, then CALC 7 = 20 = -> 41', () => {
    const calc = new Calculator();
    calc.pressSequence('3 A + B CALC 5 = 1 0 =');
    assert.strictEqual(calc.getScreen().lines[1], '25');

    // Press CALC again: prompts A with stored value 5
    calc.pressSequence('CALC');
    assert(calc.topView instanceof CalcVarsView);
    assert.strictEqual(calc.getScreen().lines[1], 'A? 5');

    calc.pressSequence('7 =');
    assert.strictEqual(calc.getScreen().lines[1], 'B? 10');

    calc.pressSequence('2 0 =');
    assert.strictEqual(calc.views.length, 0);
    assert.strictEqual(calc.getScreen().lines[1], '41');
    assert.strictEqual(calc.memory.getAns().toDecimal15().toString(), '41');
  });

  it('re-uses stored values when EXE is pressed on CALC result screen', () => {
    const calc = new Calculator();
    calc.pressSequence('3 A + B CALC 5 = 1 0 =');
    assert.strictEqual(calc.getScreen().lines[1], '25');

    // Press EXE on result screen: restarts CALC
    calc.pressSequence('=');
    assert(calc.topView instanceof CalcVarsView);
    assert.strictEqual(calc.getScreen().lines[1], 'A? 5');
  });

  it('works with equations assigning to LHS variable (Y = 2X + 1)', () => {
    const calc = new Calculator();
    calc.pressSequence('Y == 2 X + 1 CALC');
    assert(calc.topView instanceof CalcVarsView);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Y=2X+1');
    assert.strictEqual(scr.lines[1], 'X? 0');

    // Input 3 for X
    calc.pressSequence('3 =');
    assert.strictEqual(calc.views.length, 0);
    const scrRes = calc.getScreen();
    assert.strictEqual(scrRes.lines[0], 'Y=2X+1');
    assert.strictEqual(scrRes.lines[1], '7');
    assert.strictEqual(calc.memory.getVar('Y').toDecimal15().toString(), '7');
    assert.strictEqual(calc.memory.getAns().toDecimal15().toString(), '7');
  });

  it('handles multi-statements by prompting variables once then stepping through (A+B : A-B)', () => {
    const calc = new Calculator();
    calc.pressSequence('A + B : A - B CALC');
    assert(calc.topView instanceof CalcVarsView);

    // Enter A = 10, B = 4
    calc.pressSequence('1 0 = 4 =');
    assert.strictEqual(calc.views.length, 0);

    // First statement: 10 + 4 = 14 with Disp indicator
    const scr1 = calc.getScreen();
    assert.strictEqual(scr1.lines[0], 'A+B');
    assert.strictEqual(scr1.lines[1], '14');
    assert.ok(scr1.indicators.includes('Disp'));

    // Second statement: 10 - 4 = 6 without Disp indicator
    calc.pressSequence('=');
    const scr2 = calc.getScreen();
    assert.strictEqual(scr2.lines[0], `A${MINUS}B`);
    assert.strictEqual(scr2.lines[1], '6');
    assert.ok(!scr2.indicators.includes('Disp'));
  });

  it('immediately evaluates expressions without variables on CALC (2+3 -> 5)', () => {
    const calc = new Calculator();
    calc.pressSequence('2 + 3 CALC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '2+3');
    assert.strictEqual(scr.lines[1], '5');
  });

  it('allows editing values with DEL in variable editor', () => {
    const calc = new Calculator();
    calc.pressSequence('A + 1 CALC');
    calc.pressSequence('1 2 3 DEL DEL'); // leaves 1
    calc.pressSequence('=');
    assert.strictEqual(calc.getScreen().lines[1], '2');
  });

  it('cancels CALC on AC key', () => {
    const calc = new Calculator();
    calc.pressSequence('A + 1 CALC AC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'A+1');
  });

  it('throws Syntax ERROR for equation with non-variable on LHS in CALC', () => {
    const calc = new Calculator();
    calc.pressSequence('2 X == 4 CALC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Syntax ERROR');
  });
});

describe('Prompt 17 — SOLVE Feature', () => {
  it('opens SOLVE prompt screen with equation and initial variable value (X? 0)', () => {
    const calc = new Calculator();
    calc.pressSequence('2 X - 6 == 0 SHIFT CALC');
    assert(calc.topView instanceof SolveVarsView);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], `2X${MINUS}6=0`);
    assert.strictEqual(scr.lines[1], 'X? 0');
  });

  it('solves linear equation 2X - 6 = 0 for X -> X = 3, L-R = 0', () => {
    const calc = new Calculator();
    calc.pressSequence('2 X - 6 == 0 SHIFT CALC =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], `2X${MINUS}6=0`);
    assert.strictEqual(scr.lines[1], 'X=3');
    assert.strictEqual(scr.lines[2], `L${MINUS}R=0`);
    assert.strictEqual(calc.memory.getVar('X').toDecimal15().toString(), '3');
    assert.strictEqual(calc.memory.getAns().toDecimal15().toString(), '3');
  });

  it('solves quadratic equation X² - 4 = 0 finding positive root from initial X = 1', () => {
    const calc = new Calculator();
    calc.pressSequence('X x² - 4 == 0 SHIFT CALC 1 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], `X²${MINUS}4=0`);
    assert.strictEqual(scr.lines[1], 'X=2');
    assert.strictEqual(scr.lines[2], `L${MINUS}R=0`);
  });

  it('solves quadratic equation X² - 4 = 0 finding negative root from initial X = -1', () => {
    const calc = new Calculator();
    calc.pressSequence('X x² - 4 == 0 SHIFT CALC (-) 1 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], `X²${MINUS}4=0`);
    assert.strictEqual(scr.lines[1], `X=${MINUS}2`);
    assert.strictEqual(scr.lines[2], `L${MINUS}R=0`);
  });

  it('Prompt 17 Check-yourself Case 2: Y = A X² + B, SOLVE, 0 = 1 = (-) 2 = 1 = -> X=1.414213562, L-R=0', () => {
    const calc = new Calculator();
    calc.pressSequence('Y == A X x² + B SHIFT CALC');
    assert(calc.topView instanceof SolveVarsView);
    // Variables other than target X are prompted first: Y, A, B, then target X last
    assert.strictEqual(calc.getScreen().lines[1], 'Y? 0');

    calc.pressSequence('0 =');
    assert.strictEqual(calc.getScreen().lines[1], 'A? 0');

    calc.pressSequence('1 =');
    assert.strictEqual(calc.getScreen().lines[1], 'B? 0');

    calc.pressSequence('(-) 2 =');
    assert.strictEqual(calc.getScreen().lines[1], 'X? 0');

    calc.pressSequence('1 =');
    // Solves!
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Y=AX²+B');
    assert.strictEqual(scr.lines[1], 'X=1.414213562');
    assert.strictEqual(scr.lines[2], `L${MINUS}R=0`);
  });

  it('Prompt 17 Check-yourself Case 3: Y = X² - X + 1, SOLVE, Y = 3, X0 = 1 -> X=2; then = with Y=7 -> X=3; then = with Y=13 -> X=4', () => {
    const calc = new Calculator();
    calc.pressSequence('Y == X x² - X + 1 SHIFT CALC');
    assert.strictEqual(calc.getScreen().lines[1], 'Y? 0');

    calc.pressSequence('3 =');
    assert.strictEqual(calc.getScreen().lines[1], 'X? 0');

    calc.pressSequence('1 =');
    assert.strictEqual(calc.getScreen().lines[1], 'X=2');
    assert.strictEqual(calc.getScreen().lines[2], `L${MINUS}R=0`);

    // Press = to re-prompt variables
    calc.pressSequence('=');
    assert.strictEqual(calc.getScreen().lines[1], 'Y? 3');

    calc.pressSequence('7 =');
    assert.strictEqual(calc.getScreen().lines[1], 'X? 2');

    calc.pressSequence('=');
    assert.strictEqual(calc.getScreen().lines[1], 'X=3');
    assert.strictEqual(calc.getScreen().lines[2], `L${MINUS}R=0`);

    // Press = to re-prompt variables again
    calc.pressSequence('=');
    assert.strictEqual(calc.getScreen().lines[1], 'Y? 7');

    calc.pressSequence('1 3 =');
    assert.strictEqual(calc.getScreen().lines[1], 'X? 3');

    calc.pressSequence('=');
    assert.strictEqual(calc.getScreen().lines[1], 'X=4');
    assert.strictEqual(calc.getScreen().lines[2], `L${MINUS}R=0`);
  });

  it('solves for specified variable using comma syntax: Y = 2X + 1, Y solves for Y', () => {
    const calc = new Calculator();
    calc.pressSequence('0 SHIFT RCL X'); // X = 0
    // Y = 2X + 1, Y
    calc.pressSequence('Y == 2 X + 1 , Y SHIFT CALC');
    assert(calc.topView instanceof SolveVarsView);
    // Other var X is prompted first, target Y is prompted last
    assert.strictEqual(calc.getScreen().lines[1], 'X? 0');

    calc.pressSequence('3 ='); // X = 3
    assert.strictEqual(calc.getScreen().lines[1], 'Y? 0'); // Target Y initial guess

    calc.pressSequence('1 ='); // initial guess Y = 1 -> solves!
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[1], 'Y=7');
    assert.strictEqual(scr.lines[2], `L${MINUS}R=0`);
  });

  it('treats expression without equals sign as expr = 0 (X² - 9 treated as X² - 9 = 0)', () => {
    const calc = new Calculator();
    calc.pressSequence('X x² - 9 SHIFT CALC 1 =');
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], `X²${MINUS}9`);
    assert.strictEqual(scr.lines[1], 'X=3');
    assert.strictEqual(scr.lines[2], `L${MINUS}R=0`);
  });

  it('exits SOLVE and returns to Calculate mode on AC key from result screen', () => {
    const calc = new Calculator();
    calc.pressSequence('2 X - 6 == 0 SHIFT CALC = AC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], `2X${MINUS}6=0`);
  });

  it('throws Variable ERROR when equation contains no variables (1+2=3)', () => {
    const calc = new Calculator();
    calc.pressSequence('1 + 2 == 3 SHIFT CALC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Variable ERROR');
    assert.strictEqual(scr.lines[1], '[AC]  :Cancel');
  });

  it('throws Variable ERROR when equation contains variables but no X and no target specified (A+1)', () => {
    const calc = new Calculator();
    calc.pressSequence('A + 1 SHIFT CALC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Variable ERROR');
    assert.strictEqual(scr.lines[1], '[AC]  :Cancel');
  });

  it('throws Syntax ERROR when SOLVE is called on multi-statement', () => {
    const calc = new Calculator();
    calc.pressSequence('X == 1 : X + 2 SHIFT CALC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Syntax ERROR');
  });

  it('throws Syntax ERROR when disallowed function (Pol, Rec) is inside equation', () => {
    const calc = new Calculator();
    calc.pressSequence('Pol( 1 , X ) SHIFT CALC');
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Syntax ERROR');
  });

  it('displays Continue: [=] then Can\'t Solve for non-converging equation (X³ - 2X + 2 = 0)', () => {
    const calc = new Calculator();
    calc.pressSequence('X SHIFT x² - 2 X + 2 == 0 SHIFT CALC 0 =');
    // First 30 iterations: Continue: [=]
    let scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], 'Continue: [=]');
    assert.strictEqual(scr.lines[1], '[AC] :Cancel');

    // Press = to continue another 30 iterations -> Can't Solve
    calc.pressSequence('=');
    scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], "Can't Solve");
    assert.strictEqual(scr.lines[1], '[AC]  :Cancel');
  });
});
