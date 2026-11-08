/**
 * Mode 6: MATRIX mode for Casio fx-991ES PLUS 2nd edition (96×31 LCD).
 */
import { CalcApp } from '../../apps/CalcApp.js';
import { Matrix } from './Matrix.js';
import { MatrixEvaluator } from './MatrixEvaluator.js';
import { MatrixMenuView, MatrixVarSelectView, MatrixDimSelectView } from './MatrixViews.js';
import { CalcError, ERRORS } from '../../errors.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { Decimal15 } from '../../number/Decimal15.js';
import { formatNumber } from '../../format/formatNumber.js';
import { VARIABLE_KEYS } from '../../keys.js';

export class MatrixApp extends CalcApp {
  constructor(calc) {
    super(calc);
    this.title = 'Matrix';
  }

  reset() {
    super.reset();
    this.editor.math = false;
    this.matrixPhase = 'edit'; // 'edit' | 'editor' | 'result_matrix'
    this.targetName = 'MatA';
    this.currentMatrix = null;
    this.currentMatrixName = 'MatA';
    this.isReadOnlyEditor = false;
    this.cellRow = 0;
    this.cellCol = 0;
    this.scrollRow = 0;
    this.scrollCol = 0;
    this.cellInputStr = '';
    this.stoPending = false;
    this.sdDecimal = false;
  }

  onEnter() {
    this.reset();
    // On entering MATRIX mode (MODE 6), display matrix variable selection: 1:MatA 2:MatB 3:MatC
    this.calc.pushView(new MatrixVarSelectView(this.calc, this, 'dim'));
  }

  evaluatorContext() {
    const ctx = super.evaluatorContext();
    ctx.getMatrix = (ref) => this.getMatrix(ref);
    return ctx;
  }

  makeEvaluator() {
    return new MatrixEvaluator(this.evaluatorContext());
  }

  getMatrix(ref) {
    const md = this.calc.memory.modeData.matrix;
    if (!md) return null;
    let m = md[ref];
    if (m && !(m instanceof Matrix) && m.type === 'matrix') {
      m = Matrix.fromJSON(m);
      md[ref] = m;
    }
    return m;
  }

  setMatrix(name, matrix) {
    if (!this.calc.memory.modeData.matrix) {
      this.calc.memory.modeData.matrix = {};
    }
    this.calc.memory.modeData.matrix[name] = matrix;
  }

  openMatrixMenu() {
    this.calc.pushView(new MatrixMenuView(this.calc, this));
  }

  openEditor(name, matrix, readOnly = false) {
    this.matrixPhase = readOnly ? 'result_matrix' : 'editor';
    this.currentMatrixName = name;
    this.currentMatrix = matrix;
    this.isReadOnlyEditor = readOnly;
    this.cellRow = 0;
    this.cellCol = 0;
    this.scrollRow = 0;
    this.scrollCol = 0;
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
    if (value instanceof Matrix) {
      this.setMatrix('MatAns', value);
      this.lastValue = value;
      this.openEditor('MatAns', value, true);
      return;
    }
    this.matrixPhase = 'edit';
    super.runStatement();
  }

  indicators(set) {
    super.indicators(set);
    set.add('MAT');
    // In Linear Display modes, Math indicator is suppressed
    set.delete('Math');

    if (this.stoPending) set.add('STO');
    if (this.matrixPhase === 'editor' || this.matrixPhase === 'result_matrix') {
      if (this.scrollRow > 0) set.add('Up');
      if (this.currentMatrix && this.scrollRow + 2 < this.currentMatrix.rows) set.add('Down');
      if (this.scrollCol > 0) set.add('Left');
      if (this.currentMatrix && this.scrollCol + 3 < this.currentMatrix.cols) set.add('Right');
    }
  }

  onKey(ev) {
    const k = ev.key;

    // SHIFT 4 opens MATRIX menu from any phase (unless an overlay is already active)
    if (ev.shift && k === '4') {
      this.openMatrixMenu();
      return true;
    }

    // Ignore OPTN on ES PLUS
    if (k === 'OPTN') {
      return true;
    }

    // Handle error phase
    if (this.phase === 'error') {
      const handled = this.onErrorKey(ev);
      if (this.phase !== 'error') this.matrixPhase = 'edit';
      return handled;
    }

    // Matrix Editor or MatAns result screen
    if (this.matrixPhase === 'editor' || this.matrixPhase === 'result_matrix') {
      // STO copy: copy currently displayed matrix to MatA, MatB, or MatC
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
          NEG: 'MatA', A: 'MatA', '(-)': 'MatA',
          DEG: 'MatB', B: 'MatB', "°'\"": 'MatB',
          INV: 'MatC', C: 'MatC', 'x⁻¹': 'MatC', hyp: 'MatC', HYP: 'MatC'
        };
        const dest = targetMap[k] || (VARIABLE_KEYS[k] ? 'Mat' + VARIABLE_KEYS[k] : null);
        if (dest && (dest === 'MatA' || dest === 'MatB' || dest === 'MatC')) {
          const copy = this.currentMatrix.clone();
          this.setMatrix(dest, copy);
          this.openEditor(dest, copy, false);
          return true;
        }
        return true;
      }

      // MatAns continuation operators (+ - × ÷ x⁻¹ x² x³)
      if (this.matrixPhase === 'result_matrix') {
        const continueOps = {
          ADD: '+', '+': '+',
          SUB: '-', '-': '-',
          MUL: '*', '*': '*', '×': '*',
          DIV: '/', '/': '/', '÷': '/',
          SQUARE: 'sq', 'x²': 'sq',
          CUBE: 'cube', 'x³': 'cube',
          INV: 'inv', 'x⁻¹': 'inv', RECIP: 'inv'
        };
        if (continueOps[k] !== undefined && !ev.shift && !ev.alpha) {
          this.matrixPhase = 'edit';
          this.reset();
          this.insertInput({ tok: 'MatAns' });
          const op = continueOps[k];
          if (op === 'sq' || op === 'cube' || op === 'inv') {
            this.insertInput({ tok: op }, true);
          } else {
            this.insertInput({ tok: op });
          }
          return true;
        }
      }

      // AC key
      if (k === 'AC' && !ev.shift) {
        if (this.cellInputStr.length > 0) {
          this.cellInputStr = '';
          return true;
        }
        this.matrixPhase = 'edit';
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
        this.cellCol = Math.min(this.currentMatrix.cols - 1, this.cellCol + 1);
        this.adjustScroll();
        return true;
      }
      if (k === 'LEFT' && !ev.shift && !ev.alpha) {
        this.commitCellInput();
        this.cellCol = Math.max(0, this.cellCol - 1);
        this.adjustScroll();
        return true;
      }
      if (k === 'DOWN' && !ev.shift && !ev.alpha) {
        this.commitCellInput();
        this.cellRow = Math.min(this.currentMatrix.rows - 1, this.cellRow + 1);
        this.adjustScroll();
        return true;
      }
      if (k === 'UP' && !ev.shift && !ev.alpha) {
        this.commitCellInput();
        this.cellRow = Math.max(0, this.cellRow - 1);
        this.adjustScroll();
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
          this.cellCol++;
          if (this.cellCol >= this.currentMatrix.cols) {
            this.cellCol = 0;
            this.cellRow++;
          }
          if (this.cellRow >= this.currentMatrix.rows) {
            this.cellRow = 0;
          }
          this.adjustScroll();
          return true;
        }
      }

      return true;
    }

    // Normal calculation screen
    return super.onKey(ev);
  }

  commitCellInput() {
    if (this.cellInputStr.length > 0 && this.currentMatrix) {
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
        this.currentMatrix.set(this.cellRow, this.cellCol, val);
      } catch {}
      this.cellInputStr = '';
    }
  }

  adjustScroll() {
    if (this.cellRow < this.scrollRow) this.scrollRow = this.cellRow;
    if (this.cellRow >= this.scrollRow + 2) this.scrollRow = this.cellRow - 1;
    if (this.cellCol < this.scrollCol) this.scrollCol = this.cellCol;
    if (this.cellCol >= this.scrollCol + 3) this.scrollCol = this.cellCol - 2;
  }

  formatCell(val, decimal = false) {
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

    if (this.matrixPhase === 'editor' || this.matrixPhase === 'result_matrix') {
      scr.clear();
      const m = this.currentMatrix;
      const curVal = m ? m.get(this.cellRow, this.cellCol) : null;
      const bottomVal = this.cellInputStr.length > 0 ? this.cellInputStr : this.formatCell(curVal, this.sdDecimal);

      const headerTitle = m ? `${this.currentMatrixName}(${m.rows}×${m.cols})` : this.currentMatrixName;
      scr.text(0, 1, headerTitle, { font: 'small', record: false });

      if (m) {
        // Left bracket (x = 2, y = 7..21)
        scr.fb.vline(2, 7, 21);
        scr.fb.hline(2, 4, 7);
        scr.fb.hline(2, 4, 21);

        // Right bracket (x = 93, y = 7..21)
        scr.fb.vline(93, 7, 21);
        scr.fb.hline(91, 93, 7);
        scr.fb.hline(91, 93, 21);

        const visRows = Math.min(2, m.rows - this.scrollRow);
        const visCols = Math.min(3, m.cols - this.scrollCol);
        const colW = 28;

        for (let vr = 0; vr < visRows; vr++) {
          const r = this.scrollRow + vr;
          const y = 8 + vr * 7;
          for (let vc = 0; vc < visCols; vc++) {
            const c = this.scrollCol + vc;
            const colLeft = 5 + vc * colW;
            const colRight = colLeft + colW - 2;
            const s = this.formatCell(m.get(r, c), false);
            scr.text(colLeft, y, s, { font: 'small', align: 'right', right: colRight, record: false });
            if (r === this.cellRow && c === this.cellCol) {
              scr.fb.invertRect(colLeft, y, colW - 1, 7);
            }
          }
        }

        const rowLines = [];
        for (let r = 0; r < m.rows; r++) {
          const parts = [];
          for (let c = 0; c < m.cols; c++) {
            parts.push(this.formatCell(m.get(r, c), false));
          }
          rowLines.push(`[ ${parts.join('  ')} ]`);
        }

        scr.text(1, 23, `${this.cellRow + 1},${this.cellCol + 1}=${bottomVal}`, { font: 'small', record: false });

        scr.lines = [
          headerTitle,
          ...rowLines,
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
  return new MatrixApp(calc);
}
export { Matrix } from './Matrix.js';
