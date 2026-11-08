/**
 * Unit tests for fx-991ES PLUS 2nd edition SETUP Menu (Prompt 15).
 * Tests all 2 pages, 14 options, submenus, prompts, status indicators,
 * arrow pagination, back navigation, AC dismissal, contrast adjustments,
 * and Prompt 15 check-yourself verification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

describe('SETUP Menu Structure and Pagination', () => {
  it('opens SETUP menu on SHIFT MODE with Page 1 items and Down indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE');
    assert.equal(calc.topView.constructor.name, 'SetupMenuView');
    const lines = calc.renderLines();
    assert.deepEqual(lines, [
      '1:MthIO 2:LineIO',
      '3:Deg 4:Rad',
      '5:Gra 6:Fix',
      '7:Sci 8:Norm'
    ]);
    const inds = calc.indicators();
    assert.ok(inds.includes('Down') || inds.includes('▼'));
    assert.ok(!inds.includes('Up') && !inds.includes('▲'));
  });

  it('scrolls to Page 2 with Up indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN');
    assert.equal(calc.topView.constructor.name, 'SetupMenuView');
    const lines = calc.renderLines();
    assert.deepEqual(lines, [
      '1:ab/c 2:d/c',
      '3:CMPLX 4:STAT',
      '5:Disp 6:◀CONT▶'
    ]);
    const inds = calc.indicators();
    assert.ok(inds.includes('Up') || inds.includes('▲'));
    assert.ok(!inds.includes('Down') && !inds.includes('▼'));
  });

  it('scrolls back to Page 1 with UP key', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN UP');
    const lines = calc.renderLines();
    assert.equal(lines[0], '1:MthIO 2:LineIO');
    const inds = calc.indicators();
    assert.ok(inds.includes('Down') || inds.includes('▼'));
  });

  it('closes SETUP menu with AC key without changing settings', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE AC');
    assert.equal(calc.topView.constructor.name, 'CalcApp');
  });
});

describe('Page 1 Submenus & Option Execution', () => {
  it('1: MthIO - MathO (MathI/MathO) sets Math indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 1');
    assert.equal(calc.topView.constructor.name, 'MthIOSubMenuView');
    assert.deepEqual(calc.renderLines(), ['1:MathO', '2:LineO']);
    calc.press('1'); // MathO
    assert.equal(calc.topView.constructor.name, 'CalcApp');
    assert.equal(calc.setup.inputOutput, 'MathI/MathO');
    assert.ok(calc.indicators().includes('Math'));
  });

  it('1: MthIO - LineO (MathI/DecimalO) sets Math indicator and decimal output default', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 1 2');
    assert.equal(calc.topView.constructor.name, 'CalcApp');
    assert.equal(calc.setup.inputOutput, 'MathI/DecimalO');
    assert.ok(calc.indicators().includes('Math'));

    calc.pressSequence('1 / 2 =');
    assert.equal(calc.renderLines()[1], '0.5');
  });

  it('2: LineIO - sets LineI/LineO and turns Math indicator off', () => {
    const calc = new Calculator();
    assert.ok(calc.indicators().includes('Math'));
    calc.pressSequence('SHIFT MODE 2');
    assert.equal(calc.topView.constructor.name, 'CalcApp');
    assert.equal(calc.setup.inputOutput, 'LineI/LineO');
    assert.ok(!calc.indicators().includes('Math'));

    // Output formatted with ┘ symbol in LineIO
    calc.pressSequence('1 FRAC 2 =');
    assert.equal(calc.renderLines()[1], '1┘2');
  });

  it('changing input/output format clears calculation history', () => {
    const calc = new Calculator();
    calc.pressSequence('1 + 2 = AC');
    assert.ok(calc.app.history.length > 0);
    calc.pressSequence('SHIFT MODE 2'); // change to LineIO
    assert.equal(calc.app.history.length, 0);
  });

  it('3: Deg, 4: Rad, 5: Gra - updates angle unit and indicators', () => {
    const calc = new Calculator();
    assert.ok(calc.indicators().includes('D'));

    calc.pressSequence('SHIFT MODE 4'); // Radian
    assert.equal(calc.setup.angle, 'RAD');
    assert.ok(calc.indicators().includes('R'));
    assert.ok(!calc.indicators().includes('D'));

    calc.pressSequence('SHIFT MODE 5'); // Gradian
    assert.equal(calc.setup.angle, 'GRA');
    assert.ok(calc.indicators().includes('G'));
    assert.ok(!calc.indicators().includes('R'));

    calc.pressSequence('SHIFT MODE 3'); // Degree
    assert.equal(calc.setup.angle, 'DEG');
    assert.ok(calc.indicators().includes('D'));
    assert.ok(!calc.indicators().includes('G'));
  });

  it('6: Fix - Fix 0~9 sets FIX indicator and rounds decimals', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 6');
    assert.equal(calc.renderLines()[0], 'Fix 0~9?');
    calc.press('3'); // Fix 3
    assert.equal(calc.setup.numberFormat.type, 'FIX');
    assert.equal(calc.setup.numberFormat.value, 3);
    assert.ok(calc.indicators().includes('FIX'));

    calc.pressSequence('1 / 7 = S<=>D');
    assert.equal(calc.renderLines()[1], '0.143');
  });

  it('7: Sci - Sci 0~9 sets SCI indicator', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 7');
    assert.equal(calc.renderLines()[0], 'Sci 0~9?');
    calc.press('5'); // Sci 5
    assert.equal(calc.setup.numberFormat.type, 'SCI');
    assert.equal(calc.setup.numberFormat.value, 5);
    assert.ok(calc.indicators().includes('SCI'));
    assert.ok(!calc.indicators().includes('FIX'));

    calc.pressSequence('1 / 7 = S<=>D');
    assert.ok(calc.renderLines()[1].startsWith('1.4286'));
  });

  it('8: Norm - Norm 1~2 clears FIX and SCI indicators', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 6 3'); // set Fix 3
    assert.ok(calc.indicators().includes('FIX'));
    calc.pressSequence('SHIFT MODE 8');
    assert.equal(calc.renderLines()[0], 'Norm 1~2?');
    calc.press('1'); // set Norm 1
    assert.equal(calc.setup.numberFormat.type, 'NORM');
    assert.equal(calc.setup.numberFormat.value, 1);
    assert.ok(!calc.indicators().includes('FIX'));
    assert.ok(!calc.indicators().includes('SCI'));
  });
});

describe('Prompt 15 Check-Yourself Suite', () => {
  it('Check 1: SHIFT MODE 7 3 then e^5 * 2 = -> 2.97×10² (SCI on)', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 7 3');
    assert.ok(calc.indicators().includes('SCI'));
    calc.pressSequence('SHIFT LN 5 RIGHT * 2 =');
    const lines = calc.renderLines();
    assert.equal(lines[1], '2.97×10²');
  });

  it('Check 2: SHIFT MODE 7 3 then ln 90 ) = -> 4.50×10⁰', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 7 3');
    calc.pressSequence('LN 9 0 RPAREN =');
    const lines = calc.renderLines();
    assert.equal(lines[1], '4.50×10⁰');
  });
});

describe('Page 2 Submenus & Option Execution', () => {
  it('1: ab/c and 2: d/c - mixed vs improper fraction format', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN 1'); // ab/c
    assert.equal(calc.setup.fraction, 'MIXED');
    calc.pressSequence('5 / 3 =');
    assert.equal(calc.renderLines()[1], '1 2/3');

    calc.pressSequence('SHIFT MODE DOWN 2'); // d/c
    assert.equal(calc.setup.fraction, 'IMPROPER');
    calc.pressSequence('5 / 3 =');
    assert.equal(calc.renderLines()[1], '5/3');
  });

  it('3: CMPLX - 1:a+bi vs 2:r∠θ', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN 3');
    assert.equal(calc.topView.constructor.name, 'CmplxSubMenuView');
    assert.deepEqual(calc.renderLines(), ['1:a+bi', '2:r∠θ']);
    calc.press('2'); // polar
    assert.equal(calc.setup.complex, 'POLAR');

    calc.pressSequence('SHIFT MODE DOWN 3 1'); // rectangular
    assert.equal(calc.setup.complex, 'RECT');
  });

  it('4: STAT - 1:ON vs 2:OFF', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN 4');
    assert.equal(calc.topView.constructor.name, 'StatSubMenuView');
    const lines = calc.renderLines();
    assert.ok(lines.some((l) => l.includes('1:ON') && l.includes('2:OFF')));
    calc.press('1'); // ON
    assert.equal(calc.setup.statFreq, true);

    calc.pressSequence('SHIFT MODE DOWN 4 2'); // OFF
    assert.equal(calc.setup.statFreq, false);
  });

  it('5: Disp - 1:Dot vs 2:Comma', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN 5');
    assert.equal(calc.topView.constructor.name, 'DispSubMenuView');
    assert.deepEqual(calc.renderLines(), ['1:Dot', '2:Comma']);
    calc.press('2'); // Comma
    assert.equal(calc.setup.decimalMark, 'COMMA');

    calc.pressSequence('1 / 2 = S<=>D');
    assert.equal(calc.renderLines()[1], '0,5');

    calc.pressSequence('SHIFT MODE DOWN 5 1'); // Dot
    assert.equal(calc.setup.decimalMark, 'DOT');
    calc.pressSequence('1 / 2 = S<=>D');
    assert.equal(calc.renderLines()[1], '0.5');
  });

  it('6: CONT - contrast adjustment screen', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE DOWN 6');
    assert.equal(calc.topView.constructor.name, 'ContrastView');
    assert.equal(calc.setup.contrast, 8);
    assert.deepEqual(calc.renderLines(), ['Contrast', 'LIGHT 8 DARK']);

    calc.pressSequence('RIGHT RIGHT'); // contrast -> 10
    assert.equal(calc.setup.contrast, 10);
    assert.deepEqual(calc.renderLines(), ['Contrast', 'LIGHT 10 DARK']);

    calc.pressSequence('LEFT LEFT LEFT'); // contrast -> 7
    assert.equal(calc.setup.contrast, 7);

    calc.press('EXE'); // close contrast view
    assert.equal(calc.topView.constructor.name, 'CalcApp');
    assert.equal(calc.setup.contrast, 7);
  });
});

describe('Submenu Navigation & Interruption', () => {
  it('navigates back to parent menu via LEFT key', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 1'); // MthIO submenu
    assert.equal(calc.renderLines()[0], '1:MathO');
    calc.press('LEFT'); // back to Page 1
    assert.equal(calc.renderLines()[0], '1:MthIO 2:LineIO');
  });

  it('navigates back from DigitPromptView to Setup via LEFT key', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 6'); // Fix 0~9?
    assert.equal(calc.renderLines()[0], 'Fix 0~9?');
    calc.press('LEFT'); // back to main setup
    assert.equal(calc.renderLines()[0], '1:MthIO 2:LineIO');
  });

  it('dismisses submenu immediately via AC key', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE 1 AC');
    assert.equal(calc.topView.constructor.name, 'CalcApp');
  });

  it('powers off calculator from inside menu via SHIFT AC', () => {
    const calc = new Calculator();
    calc.pressSequence('SHIFT MODE SHIFT AC');
    assert.equal(calc.poweredOn, false);
    calc.press('ON');
    assert.equal(calc.poweredOn, true);
    assert.equal(calc.topView.constructor.name, 'CalcApp');
  });
});
