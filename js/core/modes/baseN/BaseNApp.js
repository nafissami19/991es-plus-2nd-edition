/**
 * Mode 4: Base-N Mode for fx-991ES PLUS 2nd edition.
 *
 * 32-bit (DEC, HEX, OCT) and 16-bit (BIN) two's complement integer arithmetic.
 * Base switching keys: x² (DEC), x^ (HEX), log (BIN), ln (OCT).
 * Direct hex digits A–F: (-), °'", hyp, sin, cos, tan in HEX mode.
 * SHIFT 3 menu:
 *   Page 1: 1:and 2:or 3:xor 4:xnor 5:Not( 6:Neg(
 *   Page 2: 1:d 2:h 3:b 4:o prefixes
 */

import { CalcApp, renderError } from '../../apps/CalcApp.js';
import { BaseNEvaluator } from './BaseNEvaluator.js';
import { BaseNValue } from './BaseNValue.js';
import { inputAction } from '../../input/keyInput.js';
import { CalcError, ERRORS } from '../../errors.js';

const BASE_LABELS = {
  DEC: 'Dec',
  HEX: 'Hex',
  BIN: 'Bin',
  OCT: 'Oct'
};

export class BaseNMenuView {
  constructor(baseNApp) {
    this.baseNApp = baseNApp;
    this.calc = baseNApp.calc;
    this.page = 0; // 0 = page 1, 1 = page 2
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'DOWN') {
      this.page = 1;
      return true;
    }
    if (k === 'UP') {
      this.page = 0;
      return true;
    }

    const ins = (id, continues = false) => {
      this.calc.closeAllOverlays();
      this.baseNApp.insertInput({ tok: id }, continues);
    };

    if (this.page === 0) {
      if (k === '1') { ins('and', true); return true; }
      if (k === '2') { ins('or', true); return true; }
      if (k === '3') { ins('xor', true); return true; }
      if (k === '4') { ins('xnor', true); return true; }
      if (k === '5') { ins('Not', false); return true; }
      if (k === '6') { ins('Neg', false); return true; }
    } else {
      if (k === '1') { ins('bn_d', false); return true; }
      if (k === '2') { ins('bn_h', false); return true; }
      if (k === '3') { ins('bn_b', false); return true; }
      if (k === '4') { ins('bn_o', false); return true; }
    }
    return true;
  }

  indicators(set) {
    if (this.page === 0) set.add('Down');
    else set.add('Up');
  }

  render(scr) {
    scr.clear();
    if (this.page === 0) {
      scr.text(0, 1, '1:and', { font: 'small' });
      scr.text(48, 1, '2:or', { font: 'small' });
      scr.text(0, 9, '3:xor', { font: 'small' });
      scr.text(48, 9, '4:xnor', { font: 'small' });
      scr.text(0, 17, '5:Not(', { font: 'small' });
      scr.text(48, 17, '6:Neg(', { font: 'small' });
      scr.lines = [
        '1:and     2:or',
        '3:xor     4:xnor',
        '5:Not(    6:Neg('
      ];
    } else {
      scr.text(0, 1, '1:d', { font: 'small' });
      scr.text(48, 1, '2:h', { font: 'small' });
      scr.text(0, 9, '3:b', { font: 'small' });
      scr.text(48, 9, '4:o', { font: 'small' });
      scr.lines = [
        '1:d       2:h',
        '3:b       4:o'
      ];
    }
  }
}

export class BaseNApp extends CalcApp {
  constructor(calc) {
    super(calc);
    this.title = 'Base-N';
    this.base = 'DEC';
    this.lastBaseNValue = new BaseNValue(0n, 'DEC');
  }

  get baseLabel() {
    return BASE_LABELS[this.base] || 'Dec';
  }

  reset() {
    super.reset();
    this.base = 'DEC';
    this.lastBaseNValue = new BaseNValue(0n, 'DEC');
  }

  setBase(newBase) {
    if (!BASE_LABELS[newBase]) return;
    this.base = newBase;
    if (this.phase === 'result' && this.lastBaseNValue) {
      try {
        this.lastBaseNValue.format(newBase);
      } catch (err) {
        this.showError(new CalcError(ERRORS.MATH));
        return;
      }
    }
  }

  makeEvaluator() {
    return new BaseNEvaluator({
      ...this.evaluatorContext(),
      base: this.base
    });
  }

  parseOptions() {
    return { baseN: true };
  }

  evaluateStatement(ev, node) {
    const val = ev.run(node);
    this.lastBaseNValue = val;
    return val;
  }

  inputActionFor(ev) {
    const k = ev.key;
    if (!ev.shift && !ev.alpha) {
      if (k === 'hexA' || k === 'hexB' || k === 'hexC' || k === 'hexD' || k === 'hexE' || k === 'hexF') {
        return { tok: k };
      }
      if (k === 'A' || k === 'B' || k === 'C' || k === 'D' || k === 'E' || k === 'F') {
        return { tok: 'hex' + k };
      }

      const isHex = this.base === 'HEX';
      const lastTok = this.editor.root[this.editor.root.length - 1];
      const hasHexPrefix = lastTok && lastTok.id === 'bn_h';

      if (isHex || hasHexPrefix) {
        if (k === 'DEG' || k === 'DMS') return { tok: 'hexB' };
        if (k === 'HYP' || k === 'hyp') return { tok: 'hexC' };
        if (k === 'SIN' || k === 'sin') return { tok: 'hexD' };
        if (k === 'COS' || k === 'cos') return { tok: 'hexE' };
        if (k === 'TAN' || k === 'tan') return { tok: 'hexF' };
        if (k === 'NEG') return { tok: 'hexA' };
      } else {
        if (k === 'NEG') return { tok: 'neg' };
        // Trig/hyp keys are blocked in non-HEX modes
        if (['DEG', 'DMS', 'HYP', 'hyp', 'SIN', 'sin', 'COS', 'cos', 'TAN', 'tan'].includes(k)) {
          return null;
        }
      }
    }
    return inputAction(ev, { math: false });
  }

  openBaseNMenu() {
    this.calc.pushView(new BaseNMenuView(this));
  }

  onKey(ev) {
    const k = ev.key;

    if (this.phase === 'error') return this.onErrorKey(ev);

    // SHIFT 3 opens BASE-N menu
    if (ev.shift && k === '3') {
      this.openBaseNMenu();
      return true;
    }

    // Direct Hex digits A–F in HEX mode (intercept before CalcApp opens hyp menu or DMS)
    if (!ev.shift && !ev.alpha && this.base === 'HEX') {
      if (['NEG', 'DEG', 'DMS', 'HYP', 'hyp', 'SIN', 'sin', 'COS', 'cos', 'TAN', 'tan'].includes(k)) {
        const action = this.inputActionFor(ev);
        if (action) {
          this.insertInput(action, false);
          return true;
        }
      }
    }

    // Base switching keys (direct, no SHIFT)
    if (!ev.shift && !ev.alpha) {
      if (k === 'DEC' || k === 'SQUARE' || k === 'x²') {
        this.setBase('DEC');
        return true;
      }
      if (k === 'HEX' || k === 'POWER' || k === 'x^' || k === 'POW') {
        this.setBase('HEX');
        return true;
      }
      if (k === 'BIN' || k === 'LOG' || k === 'log' || k === 'LOG_AB') {
        this.setBase('BIN');
        return true;
      }
      if (k === 'OCT' || k === 'LN' || k === 'ln') {
        this.setBase('OCT');
        return true;
      }
    }

    // Scientific constants (SHIFT 7) and conversions (SHIFT 8) not allowed in BASE-N
    if (ev.shift && (k === '7' || k === '8')) {
      return true;
    }

    // Invalid keys in Base-N produce Syntax ERROR
    if (k === 'DOT' || k === '.' || k === 'FRAC' || k === 'SQRT' ||
        (!ev.shift && !ev.alpha && (k === 'INTEGRAL' || k === 'CALC')) ||
        k === 'M_PLUS' || k === 'M+' || (ev.shift && k === 'RCL')) {
      this.showError(new CalcError(ERRORS.SYNTAX));
      return true;
    }

    return super.onKey(ev);
  }

  render(scr) {
    if (this.phase === 'error') {
      renderError(scr, this.error);
      return;
    }

    const val = this.lastBaseNValue || new BaseNValue(0n, this.base);
    let valStr = '';
    try {
      valStr = val.format(this.base);
    } catch {
      renderError(scr, new CalcError(ERRORS.MATH));
      return;
    }

    const inputStr = this.inputText();

    // 96x31 LCD layout
    scr.clear();

    // Line 0 (y = 1): Input expression or current base label
    if (inputStr) {
      scr.text(1, 1, inputStr, { font: 'small', record: false });
      scr.record(1, 1, inputStr);
    } else {
      scr.text(1, 1, this.baseLabel, { font: 'small', record: false });
      scr.record(1, 1, this.baseLabel);
    }

    // Line 1 (y = 18): Formatted result string right-aligned
    scr.text(1, 18, valStr, { font: 'small', align: 'right', right: 94, record: false });
    scr.record(18, 1, valStr);

    scr.lines = [inputStr || this.baseLabel, valStr];
  }
}
