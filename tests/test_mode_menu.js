import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Calculator } from '../js/core/Calculator.js';
import { ModeMenuView, CalculatorIdView, DEMO_CALCULATOR_ID } from '../js/core/apps/systemViews.js';

describe('Prompt 19 — MODE Menu and Calculator ID', () => {
  it('opens MODE menu on MODE key displaying 8 modes in 4 rows', () => {
    const calc = new Calculator();
    calc.press('MODE');
    assert(calc.topView instanceof ModeMenuView);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '1:COMP   2:CMPLX');
    assert.strictEqual(scr.lines[1], '3:STAT   4:BASE-N');
    assert.strictEqual(scr.lines[2], '5:EQN    6:MATRIX');
    assert.strictEqual(scr.lines[3], '7:TABLE  8:VECTOR');
  });

  it('closes MODE menu on AC without changing mode', () => {
    const calc = new Calculator();
    calc.press('MODE');
    assert(calc.topView instanceof ModeMenuView);
    calc.press('AC');
    assert.strictEqual(calc.views.length, 0);
    assert.strictEqual(calc.mode, 1);
  });

  it('toggles MODE menu off when MODE is pressed while in MODE menu', () => {
    const calc = new Calculator();
    calc.press('MODE');
    assert(calc.topView instanceof ModeMenuView);
    calc.press('MODE');
    assert.strictEqual(calc.views.length, 0);
  });

  it('switches to mode 1 (COMP) via key 1', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2'); // First switch to CMPLX
    assert.strictEqual(calc.mode, 2);
    calc.pressSequence('MODE 1');
    assert.strictEqual(calc.mode, 1);
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.ok(!scr.indicators.includes('CMPLX'));
  });

  it('switches to mode 2 (CMPLX) via key 2 and activates CMPLX indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 2');
    assert.strictEqual(calc.mode, 2);
    assert.strictEqual(calc.views.length, 0);
    const scr = calc.getScreen();
    assert.ok(scr.indicators.includes('CMPLX'));
    assert.ok(scr.indicators.includes('Math'));
  });

  it('switches to mode 3 (STAT) via key 3, sets STAT indicator, and suppresses Math indicator (Linear)', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 3');
    assert.strictEqual(calc.mode, 3);
    // the selection menu shows no status icons (User's Guide captures); past it, STAT lights up
    assert.deepStrictEqual(calc.getScreen().indicators, []);
    calc.pressSequence('1');
    const scr = calc.getScreen();
    assert.ok(scr.indicators.includes('STAT'));
    assert.ok(!scr.indicators.includes('Math'));
  });

  it('switches to mode 4 (BASE-N) via key 4 and suppresses Math indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 4');
    assert.strictEqual(calc.mode, 4);
    const scr = calc.getScreen();
    assert.ok(!scr.indicators.includes('Math'));
  });

  it('switches to mode 5 (EQN) via key 5', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 5');
    assert.strictEqual(calc.mode, 5);
  });

  it('switches to mode 6 (MATRIX) via key 6 and activates MAT indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 6');
    assert.strictEqual(calc.mode, 6);
    // the selection menu shows no status icons (User's Guide captures); past it, MAT lights up
    assert.deepStrictEqual(calc.getScreen().indicators, []);
    calc.pressSequence('1 5');
    const scr = calc.getScreen();
    assert.ok(scr.indicators.includes('MAT'));
    assert.ok(!scr.indicators.includes('Math'));
  });

  it('switches to mode 7 (TABLE) via key 7', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 7');
    assert.strictEqual(calc.mode, 7);
  });

  it('switches to mode 8 (VECTOR) via key 8 and activates VCT indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 8');
    assert.strictEqual(calc.mode, 8);
    // the selection menu shows no status icons (User's Guide captures); past it, VCT lights up
    assert.deepStrictEqual(calc.getScreen().indicators, []);
    calc.pressSequence('1 2');
    const scr = calc.getScreen();
    assert.ok(scr.indicators.includes('VCT'));
    assert.ok(!scr.indicators.includes('Math'));
  });

  it('clears calculation history on mode change', () => {
    const calc = new Calculator();
    calc.pressSequence('1 + 2 =');
    assert.strictEqual(calc.app.history.length, 1);
    calc.pressSequence('MODE 2'); // Switch to CMPLX
    assert.strictEqual(calc.app.history.length, 0);
  });

  it('opens Calculator ID screen on MODE 0 displaying 24-character demo ID and QR code', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 0');
    assert(calc.topView instanceof CalculatorIdView);
    assert.strictEqual(calc.topView.idText, DEMO_CALCULATOR_ID);
    assert.strictEqual(DEMO_CALCULATOR_ID.length, 24);
    assert.ok(DEMO_CALCULATOR_ID.startsWith('DEMO'));

    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], DEMO_CALCULATOR_ID);
    assert.strictEqual(scr.lines[1], '[QR Code]');
  });

  it('returns to MODE menu when AC is pressed on Calculator ID screen', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 0');
    assert(calc.topView instanceof CalculatorIdView);
    calc.press('AC');
    assert(calc.topView instanceof ModeMenuView);
    const scr = calc.getScreen();
    assert.strictEqual(scr.lines[0], '1:COMP   2:CMPLX');
  });

  it('closes all overlays when ON is pressed on Calculator ID screen', () => {
    const calc = new Calculator();
    calc.pressSequence('MODE 0');
    assert(calc.topView instanceof CalculatorIdView);
    calc.press('ON');
    assert.strictEqual(calc.views.length, 0);
  });
});
