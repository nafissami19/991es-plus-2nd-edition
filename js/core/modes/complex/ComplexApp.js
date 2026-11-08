/**
 * Mode 2: Complex Mode (CMPLX)
 *
 * Casio fx-991ES PLUS 2nd edition:
 * - Status indicator: CMPLX
 * - Keys: i = ENG / ALPHA ENG, ∠ = SHIFT (-)
 * - Menu (SHIFT 2): 1:arg  2:Conjg  3:▸r∠θ  4:▸a+bi
 * - SETUP Complex: a+bi (rectangular) vs r∠θ (polar)
 * - Supported: +, -, *, /, x², x³, x⁻¹, Abs, arg, Conjg, powers with integer exponents
 * - CALC works with complex variables
 * - Prohibited: ∫, d/dx, Σ, SOLVE (prohibited/syntax error)
 */
import { CalcApp, isPostfixId } from '../../apps/CalcApp.js';
import { ComplexEvaluator } from './ComplexEvaluator.js';
import { inputAction } from '../../input/keyInput.js';
import { ResultView } from '../../format/ResultView.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { ComplexValue } from './ComplexValue.js';

const ZERO = () => ExactValue.fromInt(0n);

export class ComplexApp extends CalcApp {
  constructor(calc) {
    super(calc);
    this.title = 'Complex';
  }

  makeEvaluator() {
    return new ComplexEvaluator(this.evaluatorContext());
  }

  makeResultView(value, flags) {
    let v = value;
    if (this.setup.complex === 'POLAR' && v instanceof ExactValue) {
      v = new ComplexValue(v, ZERO(), 'polar');
    }
    return new ResultView(v, this.setup, { ...flags, complexMode: true });
  }

  inputActionFor(ev) {
    const overrides = {
      normal: { ENG: { tok: 'i' } },
      alpha: { ENG: { tok: 'i' } },
      shift: { NEG: { tok: 'angle' } }
    };
    return inputAction(ev, { math: this.editor.math, overrides });
  }

  onKey(ev) {
    const k = ev.key;
    if (ev.shift && k === '2' && !ev.alpha) {
      this.calc.pushView(new CmplxMenuView(this.calc, this));
      return true;
    }
    return super.onKey(ev);
  }
}

export class CmplxMenuView {
  constructor(calc, app) {
    this.calc = calc;
    this.app = app;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    switch (k) {
      case '1':
        this.calc.closeAllOverlays();
        this.app.insertInput({ tok: 'arg' });
        return true;
      case '2':
        this.calc.closeAllOverlays();
        this.app.insertInput({ tok: 'Conjg' });
        return true;
      case '3':
        this.calc.closeAllOverlays();
        this.app.insertInput({ tok: 'toPolar' }, true);
        return true;
      case '4':
        this.calc.closeAllOverlays();
        this.app.insertInput({ tok: 'toRect' }, true);
        return true;
    }
    return true;
  }

  indicators(set) {
    set.clear();
  }

  render(scr) {
    scr.clear();
    scr.text(1, 4, '1:arg', { font: 'small' });
    scr.text(50, 4, '2:Conjg', { font: 'small' });
    scr.text(1, 18, '3:▸r∠θ', { font: 'small' });
    scr.text(50, 18, '4:▸a+bi', { font: 'small' });
    scr.lines = ['1:arg    2:Conjg', '3:▸r∠θ   4:▸a+bi'];
  }
}
