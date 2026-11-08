/**
 * How a calculation result is shown, and the toggles that change it:
 *   S⇔D (exact ⇄ decimal), SHIFT S⇔D (a b/c ⇔ d/c), ENG / ←ENG, °'" (sexagesimal).
 *
 * Rules (User's Guide "Input and Output Formats", "Toggling Calculation Results"):
 *  - MathI/MathO: fraction, √ and π forms when they fit, else decimal.
 *  - LineI/LineO: fractions only (no √/π forms); a decimal in the input → decimal result.
 *  - …/DecimalO: decimal; S⇔D shows the exact form.
 *  - ≈ (SHIFT =) forces decimal.
 */

import { ExactValue } from '../exact/ExactValue.js';
import { formatOptions } from '../setup.js';
import { decimalTree, rationalTree, surdTree, piTree, dmsTree, treeToText, txt, tok, MINUS, bigText } from './display.js';
import { ComplexValue, isZeroEV, signEV, isOneEV, cabs, carg } from '../modes/complex/ComplexValue.js';
import { PairResult } from '../eval/evaluate.js';
import { Decimal15 } from '../number/Decimal15.js';

const PI_LIMIT = Decimal15.fromString('1e6');

export class ResultView {
  /**
   * @param value ExactValue | PairResult
   * @param setup current setup
   * @param flags { forceDecimal, decimalInput, dms }
   */
  constructor(value, setup, flags = {}) {
    this.value = value;
    this.setup = setup;
    this.flags = flags;
    this.mixed = setup.fraction === 'MIXED';
    this.engOffset = null;
    const io = setup.inputOutput;
    this.lineInput = io.startsWith('LineI');
    const isMthLineO = io === 'MathI/DecimalO' || io === 'MathI/LineO';
    if (flags.dms && value instanceof ExactValue) this.form = 'dms';
    else if (flags.forceDecimal || isMthLineO || io.endsWith('DecimalO')) this.form = 'decimal';
    else if (this.lineInput) {
      if (flags.hasFrac && !flags.decimalInput && this.exactAvailable()) {
        this.form = 'exact';
      } else {
        this.form = 'decimal';
      }
    }
    else if (value instanceof ComplexValue) this.form = this.canDisplayExactComplex(value) ? 'exact' : 'decimal';
    else this.form = this.exactAvailable() ? 'exact' : 'decimal';
  }

  canDisplayExactComplex(v) {
    const isPolar = (this.flags.complexMode || v.formatOverride) &&
      (v.formatOverride ? v.formatOverride === 'polar' : this.setup.complex === 'POLAR');
    if (isPolar) {
      const r = cabs(v);
      const theta = carg(v, this.setup.angle);
      const rExact = r.type === 'rational' || r.type === 'surd' || r.type === 'pi';
      const thetaExact = theta.type === 'rational' || theta.type === 'pi';
      return rExact && thetaExact;
    }
    if (this.lineInput) {
      return v.re.type === 'rational' && v.im.type === 'rational';
    }
    const reOk = v.re.type === 'rational' || v.re.type === 'surd' || v.re.type === 'pi';
    const imOk = v.im.type === 'rational' || v.im.type === 'surd' || v.im.type === 'pi';
    return reOk && imOk;
  }

  canToggleSDComplex(v) {
    const isPolar = (this.flags.complexMode || v.formatOverride) &&
      (v.formatOverride ? v.formatOverride === 'polar' : this.setup.complex === 'POLAR');
    if (isPolar) {
      const r = cabs(v);
      const theta = carg(v, this.setup.angle);
      const rToggle = (r.type === 'rational' && r.value.d !== 1n) || r.type === 'surd' || r.type === 'pi';
      const thetaToggle = theta.type === 'pi';
      return rToggle || thetaToggle;
    }
    if (this.lineInput) {
      return (v.re.type === 'rational' && v.re.value.d !== 1n) || (v.im.type === 'rational' && v.im.value.d !== 1n);
    }
    const reToggle = v.re.type === 'surd' || v.re.type === 'pi' || (v.re.type === 'rational' && v.re.value.d !== 1n);
    const imToggle = v.im.type === 'surd' || v.im.type === 'pi' || (v.im.type === 'rational' && v.im.value.d !== 1n);
    return reToggle || imToggle;
  }

  /** Can the value be shown in an exact form under the current Input/Output setting? */
  exactAvailable(mixed = this.mixed) {
    const v = this.value;
    if (v instanceof ComplexValue) {
      return this.canToggleSDComplex(v);
    }
    if (!(v instanceof ExactValue)) return false;
    if (v.type === 'rational') {
      if (v.value.d === 1n) return false; // integers always use the number format
      return v.value.canDisplayExact(mixed && v.value.n * (v.value.n < 0n ? -1n : 1n) > v.value.d);
    }
    if (this.lineInput) return false; // LineI: fractions only
    if (this.flags.forceDecimal && v.type === 'surd') return false; // SHIFT = prevents returning to √ form via S⇔D
    if (v.type === 'surd') return v.value.canDisplayExact();
    if (v.type === 'pi') return v.toDecimal15().abs().lt(PI_LIMIT) && v.value.canDisplayExact();
    return false;
  }

  /** S⇔D. Returns false if nothing changed. */
  toggleSD() {
    this.engOffset = null;
    this.factor = null;
    if (this.value instanceof ComplexValue) {
      if (this.form === 'exact') {
        if (this.canToggleSDComplex(this.value)) {
          this.form = 'decimal';
          return true;
        }
        return false;
      }
      if (this.canDisplayExactComplex(this.value)) {
        this.form = 'exact';
        return true;
      }
      return false;
    }
    if (this.form === 'exact') {
      this.form = 'decimal';
      return true;
    }
    if (this.exactAvailable()) {
      this.form = 'exact';
      return true;
    }
    if (this.form === 'dms') {
      this.form = 'decimal';
      return true;
    }
    return false;
  }

  /** SHIFT S⇔D: improper ⇔ mixed fraction (switches to fraction form). */
  toggleMixed() {
    const v = this.value;
    if (!(v instanceof ExactValue) || v.type !== 'rational' || v.value.d === 1n) return false;
    const next = !this.mixed;
    if (!this.exactAvailable(next)) return false;
    this.mixed = next;
    this.form = 'exact';
    this.engOffset = null;
    return true;
  }

  /** ENG (dir = -1 moves the decimal point right, ←ENG dir = +1). */
  eng(dir) {
    if (!(this.value instanceof ExactValue)) return false;
    this.form = 'decimal';
    this.factor = null;
    // With Engineer Symbol On the result already shows in engineering form (offset 0)
    let base = this.engOffset;
    if (base === null && this.setup.engSymbol) base = 0;
    this.engOffset = base === null ? (dir > 0 ? 3 : 0) : base + (dir > 0 ? 3 : -3);
    return true;
  }

  /** °'" key on a result: decimal ⇄ sexagesimal. */
  toggleDMS() {
    if (!(this.value instanceof ExactValue)) return false;
    this.engOffset = null;
    this.form = this.form === 'dms' ? 'decimal' : 'dms';
    return true;
  }

  tree() {
    const v = this.value;
    if (v instanceof PairResult) {
      const items = [];
      v.values.forEach((val, i) => {
        if (i > 0) items.push(txt(this.setup.decimalMark === 'COMMA' ? '; ' : ', '));
        items.push(txt(`${v.labels[i]}=`));
        items.push(...new ResultView(val, this.setup, { ...this.flags, dms: false, pairPart: true }).tree());
      });
      return items;
    }
    if (v instanceof ComplexValue) {
      return this.complexTree(v);
    }
    if (!(v instanceof ExactValue)) return [txt(String(v))];
    const engOffset = this.engOffset ?? (this.setup.engSymbol ? 0 : null);
    const opts = formatOptions(this.setup, { engOffset });
    if (this.form === 'dms') return dmsTree(v.toDecimal15());
    const lineOut = this.setup.inputOutput.endsWith('LineO');
    if (this.form === 'exact' && !this.flags.pairPart) {
      if (v.type === 'rational') return rationalTree(v.value, this.mixed, lineOut);
      if (v.type === 'surd') return surdTree(v.value);
      if (v.type === 'pi') return piTree(v.value);
    }
    if (this.flags.pairPart && this.form === 'exact' && v.type === 'rational' && v.value.d !== 1n) {
      return rationalTree(v.value, this.mixed, lineOut);
    }
    return decimalTree(v.toDecimal15(), opts);
  }

  complexTree(v) {
    const isPolar = (this.flags.complexMode || v.formatOverride) &&
      (v.formatOverride ? v.formatOverride === 'polar' : this.setup.complex === 'POLAR');
    const opts = formatOptions(this.setup, { engOffset: this.engOffset });
    const lineOut = this.setup.inputOutput.endsWith('LineO');

    if (isPolar) {
      const r = cabs(v);
      const theta = carg(v, this.setup.angle);
      const rTree = this.formatComplexPart(r, opts, lineOut);
      const thetaTree = this.formatComplexPart(theta, opts, lineOut);
      return [...rTree, tok('angle'), ...thetaTree];
    }

    // Rectangular: a + bi
    const a = v.re;
    const b = v.im;
    const aZero = isZeroEV(a);
    const bNeg = signEV(b) < 0;
    const absB = bNeg ? b.neg() : b;
    const bIsOne = isOneEV(absB);

    if (aZero) {
      const bTree = (bIsOne && this.form === 'exact') ? [] : this.formatComplexPart(absB, opts, lineOut);
      return [
        ...(bNeg ? [txt(MINUS)] : []),
        ...bTree,
        tok('i')
      ];
    }

    const aTree = this.formatComplexPart(a, opts, lineOut);
    const bTree = (bIsOne && this.form === 'exact') ? [] : this.formatComplexPart(absB, opts, lineOut);
    return [
      ...aTree,
      txt(bNeg ? MINUS : '+'),
      ...bTree,
      tok('i')
    ];
  }

  formatComplexPart(part, opts, lineOut) {
    if (this.form === 'exact') {
      if (part.type === 'rational') {
        if (part.value.d === 1n) return [txt(bigText(part.value.n))];
        return rationalTree(part.value, this.mixed, lineOut);
      }
      if (part.type === 'surd' && !this.lineInput) return surdTree(part.value);
      if (part.type === 'pi' && !this.lineInput) return piTree(part.value);
    }
    return decimalTree(part.toDecimal15(), opts);
  }

  text() {
    return treeToText(this.tree());
  }
}

export { MINUS };
