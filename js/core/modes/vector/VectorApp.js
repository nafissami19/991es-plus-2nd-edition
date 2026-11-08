/**
 * Mode 8: VECTOR mode for Casio fx-991ES PLUS 2nd edition (96×31 LCD).
 */
import { CalcApp } from '../../apps/CalcApp.js';
import { VectorValue } from './VectorValue.js';
import { VectorEvaluator } from './VectorEvaluator.js';
import { VectorMenuView, VectorVarSelectView, VectorDimSelectView } from './VectorViews.js';
import { CalcError, ERRORS } from '../../errors.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { Decimal15 } from '../../number/Decimal15.js';
import { formatNumber } from '../../format/formatNumber.js';
import { VARIABLE_KEYS } from '../../keys.js';

export class VectorApp extends CalcApp {
  constructor(calc) {
    super(calc);
    this.title = 'Vector';
  }

  reset() {
    super.reset();
    this.editor.math = false;
    this.vectorPhase = 'edit'; // 'edit' | 'editor' | 'result_vector'
    this.targetName = 'VctA';
    this.currentVector = null;
    this.currentVectorName = 'VctA';
    this.isReadOnlyEditor = false;
    this.cellIdx = 0;
    this.cellInputStr = '';
    this.stoPending = false;
    this.sdDecimal = false;
  }

  onEnter() {
    this.reset();
    // On entering VECTOR mode (MODE 8), display vector variable selection: 1:VctA 2:VctB 3:VctC
    this.calc.pushView(new VectorVarSelectView(this.calc, this, 'dim'));
  }

  evaluatorContext() {
    const ctx = super.evaluatorContext();
    ctx.getVector = (ref) => this.getVector(ref);
    return ctx;
  }

  makeEvaluator() {
    return new VectorEvaluator(this.evaluatorContext());
  }

  getVector(ref) {
    const vd = this.calc.memory.modeData.vector;
    if (!vd) return null;
    let v = vd[ref];
    if (v && !(v instanceof VectorValue) && v.type === 'vector') {
      v = VectorValue.fromJSON(v);
      vd[ref] = v;
    }
    return v;
  }

  setVector(name, vector) {
    if (!this.calc.memory.modeData.vector) {
      this.calc.memory.modeData.vector = {};
    }
    this.calc.memory.modeData.vector[name] = vector;
  }

  openVectorMenu() {
    this.calc.pushView(new VectorMenuView(this.calc, this));
  }

  openEditor(name, vector, readOnly = false) {
    this.vectorPhase = readOnly ? 'result_vector' : 'editor';
    this.currentVectorName = name;
    this.currentVector = vector;
    this.isReadOnlyEditor = readOnly;
    this.cellIdx = 0;
    this.cellInputStr = '';
    this.stoPending = false;
    this.sdDecimal = false;
  }

  runStatement() {
    const node = this.statements[this.stmtIndex];
    const ev = this.makeEvaluator();
    let value;
    try {
      value = this.evaluateStatement(ev, node);
    } catch (err) {
      this.showError(err);
      return;
    }
    if (value instanceof VectorValue) {
      this.setVector('VctAns', value);
      this.lastValue = value;
      this.openEditor('VctAns', value, true);
      return;
    }
    this.vectorPhase = 'edit';
    super.runStatement();
  }

  indicators(set) {
    super.indicators(set);
    set.add('VCT');
    // In Linear Display modes, Math indicator is suppressed
    set.delete('Math');

    if (this.stoPending) set.add('STO');
    if (this.vectorPhase === 'editor' || this.vectorPhase === 'result_vector') {
      if (this.cellIdx > 0) set.add('Left');
      if (this.currentVector && this.cellIdx < this.currentVector.dim - 1) set.add('Right');
    }
  }

  onKey(ev) {
    const k = ev.key;

    // SHIFT 5 opens VECTOR menu from any phase (unless an overlay is active)
    if (ev.shift && k === '5') {
      this.openVectorMenu();
      return true;
    }

    // Ignore OPTN on ES PLUS
    if (k === 'OPTN') {
      return true;
    }

    // Handle error phase
    if (this.phase === 'error') {
      const handled = this.onErrorKey(ev);
      if (this.phase !== 'error') this.vectorPhase = 'edit';
      return handled;
    }

    // Vector Editor or VctAns result screen
    if (this.vectorPhase === 'editor' || this.vectorPhase === 'result_vector') {
      // STO copy: copy currently displayed vector to VctA, VctB, or VctC
      const isStore = (k === 'RCL' && ev.shift) || (k === 'STO' && !ev.shift);
      if (isStore && !ev.alpha) {
        this.commitCellInput();
        this.stoPending = true;
        return true;
      }

      if (this.stoPending && !ev.shift) {
        this.stoPending = false;
        if (k === 'AC') return true;
        const targetMap = {
          NEG: 'VctA', A: 'VctA', '(-)': 'VctA',
          DEG: 'VctB', B: 'VctB', "°'\"": 'VctB',
          INV: 'VctC', C: 'VctC', 'x⁻¹': 'VctC', hyp: 'VctC', HYP: 'VctC'
        };
        const dest = targetMap[k] || (VARIABLE_KEYS[k] ? 'Vct' + VARIABLE_KEYS[k] : null);
        if (dest && (dest === 'VctA' || dest === 'VctB' || dest === 'VctC')) {
          const copy = this.currentVector.clone();
          this.setVector(dest, copy);
          this.openEditor(dest, copy, false);
          return true;
        }
        return true;
      }

      // VctAns continuation operators (+ - × ÷ dot)
      if (this.vectorPhase === 'result_vector') {
        const continueOps = {
          ADD: '+', '+': '+',
          SUB: '-', '-': '-',
          MUL: '*', '*': '*', '×': '*',
          DIV: '/', '/': '/', '÷': '/',
          dot: 'dot', '•': 'dot'
        };
        if (continueOps[k] !== undefined && !ev.shift && !ev.alpha) {
          this.vectorPhase = 'edit';
          this.reset();
          this.insertInput({ tok: 'VctAns' });
          const op = continueOps[k];
          this.insertInput({ tok: op });
          return true;
        }
      }

      // AC key
      if (k === 'AC' && !ev.shift) {
        if (this.cellInputStr.length > 0) {
          this.cellInputStr = '';
          return true;
        }
        this.vectorPhase = 'edit';
        this.editor.clear();
        this.phase = 'edit';
        return true;
      }

      // S<=>D toggle between exact/fraction and decimal
      if (k === 'SD' && !ev.shift && !ev.alpha) {
        this.sdDecimal = !this.sdDecimal;
        return true;
      }

      // Arrow navigation
      if (k === 'RIGHT' && !ev.shift && !ev.alpha) {
        this.commitCellInput();
        this.cellIdx = Math.min(this.currentVector.dim - 1, this.cellIdx + 1);
        return true;
      }
      if (k === 'LEFT' && !ev.shift && !ev.alpha) {
        this.commitCellInput();
        this.cellIdx = Math.max(0, this.cellIdx - 1);
        return true;
      }

      // Cell input (when not readOnly)
      if (!this.isReadOnlyEditor) {
        if (/^[0-9]$/.test(k) && !ev.shift && !ev.alpha) {
          this.cellInputStr += k;
          return true;
        }
        if (k === 'DOT' && !ev.shift && !ev.alpha) {
          if (!this.cellInputStr.includes('.')) this.cellInputStr += '.';
          return true;
        }
        if ((k === 'FRAC' || k === 'DIV' || k === '/') && !ev.shift && !ev.alpha) {
          if (!this.cellInputStr.includes('┘') && !this.cellInputStr.includes('/')) {
            this.cellInputStr += '┘';
          }
          return true;
        }
        if ((k === 'NEG' || k === 'SUB' || k === '-') && !ev.shift && !ev.alpha) {
          if (this.cellInputStr === '') this.cellInputStr = '-';
          return true;
        }
        if (k === 'DEL' && !ev.shift) {
          if (this.cellInputStr.length > 0) this.cellInputStr = this.cellInputStr.slice(0, -1);
          return true;
        }
        if ((k === 'EXE' || k === 'ENTER' || k === '=') && !ev.shift) {
          this.commitCellInput();
          this.cellIdx = (this.cellIdx + 1) % this.currentVector.dim;
          return true;
        }
      }

      return true;
    }

    // Normal calculation screen
    return super.onKey(ev);
  }

  commitCellInput() {
    if (this.cellInputStr.length > 0 && this.currentVector) {
      try {
        const s = this.cellInputStr.trim();
        let val;
        if (s === '-' || s === '') {
          val = ExactValue.fromInt(0n);
        } else {
          const fracMatch = s.match(/^(-?\d+)\s*[\/┘]\s*(\d+)$/);
          if (fracMatch) {
            const n = BigInt(fracMatch[1]);
            const d = BigInt(fracMatch[2]);
            if (d === 0n) throw new CalcError(ERRORS.MATH);
            val = ExactValue.fromRational(n, d);
          } else if (s.includes('.')) {
            val = ExactValue.fromDecimal15(Decimal15.fromString(s));
          } else {
            val = ExactValue.fromInt(BigInt(s));
          }
        }
        this.currentVector.set(this.cellIdx, val);
      } catch {}
      this.cellInputStr = '';
    }
  }

  formatElement(val, decimal = false) {
    if (!val) return '0';
    if (decimal) {
      return formatNumber(val.toDecimal15(), { format: this.calc.setup.numberFormat }).fullString;
    }
    if (val.type === 'rational') {
      if (val.value.d === 1n) return val.value.n.toString();
      return `${val.value.n}┘${val.value.d}`;
    }
    return formatNumber(val.toDecimal15(), { format: this.calc.setup.numberFormat }).fullString;
  }

  render(scr) {
    if (this.phase === 'error') {
      super.render(scr);
      return;
    }

    if (this.vectorPhase === 'editor' || this.vectorPhase === 'result_vector') {
      scr.clear();
      const v = this.currentVector;
      const curVal = v ? v.get(this.cellIdx) : null;
      const bottomVal = this.cellInputStr.length > 0 ? this.cellInputStr : this.formatElement(curVal, this.sdDecimal);

      const headerTitle = v ? `${this.currentVectorName}(${v.dim})` : this.currentVectorName;
      scr.text(0, 1, headerTitle, { font: 'small', record: false });

      if (v) {
        // Left bracket (x = 2, y = 8..20)
        scr.fb.vline(2, 8, 20);
        scr.fb.hline(2, 4, 8);
        scr.fb.hline(2, 4, 20);

        // Right bracket (x = 93, y = 8..20)
        scr.fb.vline(93, 8, 20);
        scr.fb.hline(91, 93, 8);
        scr.fb.hline(91, 93, 20);

        const y = 10;
        const els = [];

        if (v.dim === 2) {
          // 2D vector elements
          const e0 = this.formatElement(v.get(0), false);
          const e1 = this.formatElement(v.get(1), false);
          els.push(e0, e1);

          scr.text(12, y, e0, { font: 'small', align: 'right', right: 46, record: false });
          scr.text(52, y, e1, { font: 'small', align: 'right', right: 86, record: false });

          if (this.cellIdx === 0) scr.fb.invertRect(12, y - 1, 36, 9);
          else if (this.cellIdx === 1) scr.fb.invertRect(52, y - 1, 36, 9);
        } else {
          // 3D vector elements
          const e0 = this.formatElement(v.get(0), false);
          const e1 = this.formatElement(v.get(1), false);
          const e2 = this.formatElement(v.get(2), false);
          els.push(e0, e1, e2);

          scr.text(6, y, e0, { font: 'small', align: 'right', right: 30, record: false });
          scr.text(36, y, e1, { font: 'small', align: 'right', right: 60, record: false });
          scr.text(66, y, e2, { font: 'small', align: 'right', right: 90, record: false });

          if (this.cellIdx === 0) scr.fb.invertRect(6, y - 1, 26, 9);
          else if (this.cellIdx === 1) scr.fb.invertRect(36, y - 1, 26, 9);
          else if (this.cellIdx === 2) scr.fb.invertRect(66, y - 1, 26, 9);
        }

        const gridStr = `[ ${els.join('  ')} ]`;
        scr.text(1, 23, `${this.cellIdx + 1}=${bottomVal}`, { font: 'small', record: false });

        scr.lines = [
          headerTitle,
          gridStr,
          bottomVal
        ];
      }
      return;
    }

    // Default: Calculation screen
    super.render(scr);
  }
}

export function createApp(calc) {
  return new VectorApp(calc);
}
export { VectorValue } from './VectorValue.js';
