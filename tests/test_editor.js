/**
 * Unit tests for Prompt 8 — Input buffer and key mapping for the ES keyboard
 *
 * 1. 99-byte limit, token byte costs, and ■ block cursor at <= 10 bytes.
 * 2. Consecutive powers rule (x², x³, x⁻¹, x^■ ignored on immediate repetition).
 * 3. INS in Natural Display (wrapping expression to the right of cursor into template).
 * 4. INS in Linear Display (toggle insert / overwrite mode, '_' cursor, DEL under cursor).
 * 5. Cursor navigation (Natural wrap ▶ at end -> 0, ◀ at 0 -> end; Linear ▲ -> start, ▼ -> end).
 * 6. Max formula height (2 screens / 62 dots limit).
 * 7. SHIFT and ALPHA single-key latching.
 * 8. 50-key mapping and menus in COMP mode (hyp, DRG▸, CONST 01~40, CONV 01~40, SHIFT 1..5 ignored).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';
import { Editor } from '../js/core/input/Editor.js';
import { MAX_INPUT_BYTES, INPUT_WARNING_BYTES } from '../js/core/input/tokens.js';

describe('Prompt 8 — Input buffer and ES keyboard', () => {

  describe('1. 99-byte limit and ■ cursor shape', () => {
    it('normal cursor shape is line when > 10 bytes remain', () => {
      const ed = new Editor({ math: true });
      ed.insertToken('1');
      assert.equal(ed.cursorShape(), 'line');
      assert.equal(ed.bytes(), 1);
      assert.equal(ed.remainingBytes(), 98);
    });

    it('cursor changes to block ■ when remaining bytes <= 10', () => {
      const ed = new Editor({ math: true });
      // Insert 89 single-byte digits: bytes() = 89, remaining = 10 -> block
      for (let i = 0; i < 89; i++) {
        assert.ok(ed.insertToken('1'));
      }
      assert.equal(ed.bytes(), 89);
      assert.equal(ed.remainingBytes(), 10);
      assert.equal(ed.cursorShape(), 'block');

      // Insert up to 99 bytes
      for (let i = 0; i < 10; i++) {
        assert.ok(ed.insertToken('2'));
        assert.equal(ed.cursorShape(), 'block');
      }
      assert.equal(ed.bytes(), 99);
      assert.equal(ed.remainingBytes(), 0);

      // 100th byte is refused
      assert.equal(ed.insertToken('3'), false);
      assert.equal(ed.bytes(), 99);
    });

    it('calculator app displays input until 99-byte limit', () => {
      const calc = new Calculator();
      // Type 1+ repeatedly
      for (let i = 0; i < 49; i++) {
        calc.press('1');
        calc.press('+');
      }
      calc.press('1'); // 49 * 2 + 1 = 99 bytes
      assert.equal(calc.app.editor.bytes(), 99);
      assert.equal(calc.app.editor.cursorShape(), 'block');

      // Next key refused
      calc.press('+');
      assert.equal(calc.app.editor.bytes(), 99);
    });
  });

  describe('2. Consecutive powers rule', () => {
    it('ignores second x² press directly following x²', () => {
      const calc = new Calculator();
      calc.pressSequence('2 SQUARE SQUARE');
      const lines = calc.getScreen().lines;
      assert.equal(lines[0], '2²');
      assert.equal(calc.app.editor.slot.length, 2);
    });

    it('ignores x³ directly following x²', () => {
      const calc = new Calculator();
      calc.pressSequence('5 SQUARE SHIFT SQUARE'); // 5, x², x³
      assert.equal(calc.getScreen().lines[0], '5²');
      assert.equal(calc.app.editor.slot.length, 2);
    });

    it('ignores x⁻¹ directly following x²', () => {
      const calc = new Calculator();
      calc.pressSequence('3 SQUARE RECIP'); // 3, x², x⁻¹
      assert.equal(calc.getScreen().lines[0], '3²');
      assert.equal(calc.app.editor.slot.length, 2);
    });

    it('ignores x^■ directly following x⁻¹', () => {
      const calc = new Calculator();
      calc.pressSequence('4 RECIP POWER'); // 4, x⁻¹, x^■
      assert.equal(calc.getScreen().lines[0], '4⁻¹');
      assert.equal(calc.app.editor.slot.length, 2);
    });

    it('allows powers after exiting a power template with navigation', () => {
      const calc = new Calculator();
      calc.pressSequence('2 POWER 3 RIGHT'); // 2^3, then RIGHT exits exponent
      calc.press('SQUARE');
      assert.equal(calc.app.editor.slot.length, 3); // 2, pow(3), sq
      calc.press('EXE');
      assert.equal(calc.getScreen().lines[1], '64');
    });
  });

  describe('3. INS wrapping in Natural Display', () => {
    it('guide example: 1 + 7/6 then ◀ ◀ ◀ ◀ SHIFT DEL √ becomes 1 + √(7/6)', () => {
      const calc = new Calculator();
      // 1 + 7/6: 1, +, FRAC, 7, DOWN, 6
      calc.pressSequence('1 + FRAC 7 DOWN 6');
      assert.equal(calc.getScreen().lines[0], '1+7/6');

      // 4 left arrows move cursor before fraction
      calc.pressSequence('LEFT LEFT LEFT LEFT');
      // SHIFT DEL (INS) then SQRT (√)
      calc.press('SHIFT');
      calc.press('DEL');
      assert.equal(calc.app.editor.insWrap, true);

      calc.press('SQRT');
      // Now sqrt wraps 7/6
      const root = calc.app.editor.root;
      assert.equal(root[0].id, '1');
      assert.equal(root[1].id, '+');
      assert.equal(root[2].t, 'tpl');
      assert.equal(root[2].kind, 'sqrt');
      assert.equal(root[2].slots[0][0].kind, 'frac');
      assert.equal(root[2].slots[0][0].slots[0][0].id, '7');
      assert.equal(root[2].slots[0][0].slots[1][0].id, '6');
    });

    it('INS wraps digit sequence into fraction numerator', () => {
      const calc = new Calculator();
      calc.pressSequence('1 + 2 5');
      calc.pressSequence('LEFT LEFT'); // cursor before 25
      calc.pressSequence('SHIFT DEL FRAC'); // INS then fraction
      const root = calc.app.editor.root;
      assert.equal(root[2].t, 'tpl');
      assert.equal(root[2].kind, 'frac');
      // Numerator has 25
      assert.equal(root[2].slots[0].map(t => t.id).join(''), '25');
      // Cursor in denominator
      assert.equal(calc.app.editor.path.length, 1);
      assert.equal(calc.app.editor.path[0].s, 1);
    });

    it('INS wraps expression with trailing power', () => {
      const calc = new Calculator();
      calc.pressSequence('1 + 2 SQUARE');
      calc.pressSequence('LEFT LEFT'); // cursor before 2
      calc.pressSequence('SHIFT DEL SQRT'); // wrap 2² in √
      const root = calc.app.editor.root;
      assert.equal(root[2].kind, 'sqrt');
      const inner = root[2].slots[0];
      assert.equal(inner[0].id, '2');
      assert.equal(inner[1].id, 'sq');
    });
  });

  describe('4. INS in Linear Display (LineIO)', () => {
    it('SHIFT DEL toggles overwrite mode with _ cursor', () => {
      const calc = new Calculator({ setup: { display: 'LineIO' } });
      assert.equal(calc.app.editor.overwrite, false);
      assert.equal(calc.app.editor.cursorShape(), 'line');

      calc.pressSequence('SHIFT DEL');
      assert.equal(calc.app.editor.overwrite, true);
      assert.equal(calc.app.editor.cursorShape(), 'overwrite');

      calc.pressSequence('SHIFT DEL');
      assert.equal(calc.app.editor.overwrite, false);
      assert.equal(calc.app.editor.cursorShape(), 'line');
    });

    it('typing in overwrite mode replaces characters', () => {
      const calc = new Calculator({ setup: { display: 'LineIO' } });
      calc.pressSequence('1 2 3 4');
      calc.pressSequence('LEFT LEFT'); // cursor at '3'
      calc.pressSequence('SHIFT DEL'); // switch to overwrite
      calc.pressSequence('9');
      // Replaced '3' with '9'
      assert.equal(calc.getScreen().lines[0], '1294');
    });

    it('DEL in overwrite mode deletes character under cursor', () => {
      const calc = new Calculator({ setup: { display: 'LineIO' } });
      calc.pressSequence('1 2 3 4');
      calc.pressSequence('LEFT LEFT'); // cursor at '3'
      calc.pressSequence('SHIFT DEL'); // overwrite mode
      calc.press('DEL'); // deletes '3' under cursor
      assert.equal(calc.getScreen().lines[0], '124');
    });
  });

  describe('5. Cursor navigation and wrapping', () => {
    it('Natural ▶ at end wraps to start (0)', () => {
      const ed = new Editor({ math: true });
      ed.insertToken('1');
      ed.insertToken('+');
      ed.insertToken('2');
      assert.equal(ed.idx, 3);
      ed.right();
      assert.equal(ed.idx, 0);
    });

    it('Natural ◀ at start wraps to end (length)', () => {
      const ed = new Editor({ math: true });
      ed.insertToken('1');
      ed.insertToken('+');
      ed.insertToken('2');
      ed.idx = 0;
      ed.left();
      assert.equal(ed.idx, 3);
    });

    it('Linear ▲ jumps to start and ▼ jumps to end', () => {
      const calc = new Calculator({ setup: { display: 'LineIO' } });
      calc.pressSequence('1 + 2 + 3 + 4');
      assert.equal(calc.app.editor.idx, 7);

      calc.press('UP');
      assert.equal(calc.app.editor.idx, 0);

      calc.press('DOWN');
      assert.equal(calc.app.editor.idx, 7);
    });
  });

  describe('6. Max formula height limit (62 dots)', () => {
    it('rejects nesting fractions beyond 62 dots visual height', () => {
      const ed = new Editor({ math: true });
      // Nest fractions inside denominators
      let count = 0;
      while (count < 10) {
        if (!ed.insertTemplate('frac')) break;
        ed.insertToken('1');
        ed.vertical('down'); // go to denominator
        count++;
      }
      assert.ok(count >= 3);
      assert.ok(count < 8); // stops before exceeding 62 dots
      assert.ok(ed.formulaHeight() <= 62);
    });
  });

  describe('7. SHIFT and ALPHA single-key latching', () => {
    it('SHIFT latches S indicator for exactly one key press', () => {
      const calc = new Calculator();
      assert.ok(!calc.getScreen().indicators.includes('S'));

      calc.press('SHIFT');
      assert.ok(calc.getScreen().indicators.includes('S'));

      calc.press('1'); // Consumes SHIFT (in COMP mode, SHIFT 1 is ignored, but SHIFT unlatches)
      assert.ok(!calc.getScreen().indicators.includes('S'));
    });

    it('pressing SHIFT twice unlatches S', () => {
      const calc = new Calculator();
      calc.press('SHIFT');
      assert.ok(calc.getScreen().indicators.includes('S'));
      calc.press('SHIFT');
      assert.ok(!calc.getScreen().indicators.includes('S'));
    });

    it('pressing SHIFT then ALPHA switches latch from S to A', () => {
      const calc = new Calculator();
      calc.press('SHIFT');
      assert.ok(calc.getScreen().indicators.includes('S'));
      assert.ok(!calc.getScreen().indicators.includes('A'));

      calc.press('ALPHA');
      assert.ok(!calc.getScreen().indicators.includes('S'));
      assert.ok(calc.getScreen().indicators.includes('A'));

      calc.press('RPAREN'); // ALPHA ) -> X
      assert.ok(!calc.getScreen().indicators.includes('A'));
      assert.equal(calc.getScreen().lines[0], 'X');
    });
  });

  describe('8. 50-key mapping and menus in COMP mode', () => {
    it('hyp key opens hyperbolic menu (1:sinh..6:tanh⁻¹)', () => {
      const calc = new Calculator();
      calc.press('HYP');
      const scr = calc.getScreen();
      assert.ok(scr.lines.some(l => l.includes('1:sinh')));
      assert.ok(scr.lines.some(l => l.includes('4:sinh⁻¹')));

      calc.press('1'); // Select sinh
      assert.equal(calc.getScreen().lines[0], 'sinh(');
    });

    it('SHIFT ANS opens DRG▸ menu (1:° 2:r 3:g)', () => {
      const calc = new Calculator();
      calc.pressSequence('9 0');
      calc.pressSequence('SHIFT ANS'); // DRG▸ menu
      const scr = calc.getScreen();
      assert.ok(scr.lines.some(l => l.includes('1:°')));

      calc.press('1'); // Select °
      assert.equal(calc.getScreen().lines[0], '90°');
    });

    it('SHIFT 7 prompts CONST 01~40 and inserts constant', () => {
      const calc = new Calculator();
      calc.pressSequence('SHIFT 7');
      // User's Guide capture: CONSTANT / Number 01~40? / [__]
      assert.ok(calc.getScreen().lines.includes('CONSTANT'));
      assert.ok(calc.getScreen().lines.some(l => l.includes('Number 01~40?')));

      calc.pressSequence('2 8'); // c0 (speed of light)
      assert.equal(calc.getScreen().lines[0], 'c₀');
      calc.press('EXE');
      assert.equal(calc.getScreen().lines[1], '299792458');
    });

    it('SHIFT 8 prompts CONV 01~40 and inserts conversion', () => {
      const calc = new Calculator({ setup: { display: 'LineIO' } });
      calc.pressSequence('5 SHIFT 8');
      // User's Guide capture: CONVERSION / Number 01~40? / [__]
      assert.ok(calc.getScreen().lines.includes('CONVERSION'));
      assert.ok(calc.getScreen().lines.some(l => l.includes('Number 01~40?')));

      calc.pressSequence('0 2'); // cm▸in
      assert.equal(calc.getScreen().lines[0], '5cm▸in');
      calc.press('EXE');
      assert.equal(calc.getScreen().lines[1], '1.968503937');
    });

    it('SHIFT 1..5 are ignored in COMP mode', () => {
      const calc = new Calculator();
      for (const k of ['1', '2', '3', '4', '5']) {
        calc.press('SHIFT');
        calc.press(k);
        // Expression remains empty, no overlay opened
        assert.equal(calc.views.length, 0);
        assert.equal(calc.app.editor.isEmpty(), true);
      }
    });

    it('ALPHA ENG (i) and SHIFT NEG (∠) are ignored in COMP mode', () => {
      const calc = new Calculator();
      calc.pressSequence('ALPHA ENG');
      assert.equal(calc.app.editor.isEmpty(), true);

      calc.pressSequence('SHIFT NEG');
      assert.equal(calc.app.editor.isEmpty(), true);
    });

    it('ALPHA keys insert variables A..F, M, X, Y and = and :', () => {
      const calc = new Calculator();
      calc.pressSequence('ALPHA NEG'); // A
      calc.pressSequence('ALPHA DMS'); // B
      calc.pressSequence('ALPHA HYP'); // C
      calc.pressSequence('ALPHA SIN'); // D
      calc.pressSequence('ALPHA COS'); // E
      calc.pressSequence('ALPHA TAN'); // F
      calc.pressSequence('ALPHA MPLUS'); // M
      calc.pressSequence('ALPHA RPAREN'); // X
      calc.pressSequence('ALPHA SD'); // Y
      assert.equal(calc.getScreen().lines[0], 'ABCDEFMXY');

      calc.press('AC');
      calc.pressSequence('ALPHA CALC'); // =
      calc.pressSequence('ALPHA INTEGRAL'); // :
      assert.equal(calc.getScreen().lines[0], '=:');
    });
  });
});
