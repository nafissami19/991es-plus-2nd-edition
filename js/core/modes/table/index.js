/**
 * Mode 7: TABLE for Casio fx-991ES PLUS 2nd edition (96×31 LCD).
 * Single f(X) function table generation with Start, End, Step parameters (max 30 rows).
 */
import { Editor } from '../../input/Editor.js';
import { inputAction, applyInput } from '../../input/keyInput.js';
import { parse } from '../../parse/parser.js';
import { Evaluator } from '../../eval/evaluate.js';
import { ResultView } from '../../format/ResultView.js';
import { treeToText } from '../../format/display.js';
import { CalcError, ERRORS } from '../../errors.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { rowCount, ROW_LIMIT, formatCellValue, formatFullValue } from './cells.js';
import { isMathInput } from '../../setup.js';
import { measureText } from '../../../lcd/raster.js';
import { ConstPromptView } from '../../ui/views.js';
import { CONSTANT_VALUES, CONSTANT_BY_INDEX } from '../../data/constants.js';

export class TableApp {
  constructor(calc) {
    this.calc = calc;
    this.title = 'Table';
    this.mode = 7;
    this.reset();
  }

  reset() {
    this.phase = 'fx'; // 'fx' | 'range' | 'table' | 'error'
    const math = isMathInput(this.calc.setup);
    this.editorF = new Editor({ math });
    this.rangeEditors = [
      new Editor({ math: false }),
      new Editor({ math: false }),
      new Editor({ math: false })
    ];
    this.rangeField = 0; // 0: Start, 1: End, 2: Step
    this.startVal = ExactValue.fromInt(1n);
    this.endVal = ExactValue.fromInt(5n);
    this.stepVal = ExactValue.fromInt(1n);
    this.astF = null;
    this.rows = [];
    this.selectedRow = 0;
    this.selectedCol = 0; // 0: x, 1: f(x)
    this.topRow = 0;
    this.sdDecimal = false;
    this.error = null;
  }

  onEnter() {
    this.reset();
  }

  onExit() {}

  onSetupChanged() {
    const math = isMathInput(this.calc.setup);
    // If MthIO <-> LineIO changed, clear function and reset per ES PLUS spec
    if (this.editorF.math !== math) {
      this.reset();
    }
  }

  notify(event, data) {
    if (event === 'inputOutputChanged') {
      this.reset();
    }
  }

  clearHistory() {}

  showError(err, prevPhase) {
    const msg = (err && err.message) || String(err);
    this.error = { message: msg, prevPhase: prevPhase || this.phase };
    this.phase = 'error';
  }

  enterRange() {
    this.phase = 'range';
    this.rangeField = 0;
    for (const ed of this.rangeEditors) ed.clear();
  }

  formatRangeVal(val) {
    if (val instanceof ExactValue) return val.toDecimal15().toString();
    return String(val);
  }

  commitRangeField(field) {
    const ed = this.rangeEditors[field];
    if (ed.isEmpty()) return;
    try {
      const ast = parse(ed.root, {});
      const ev = new Evaluator({
        memory: this.calc.memory,
        angle: this.calc.setup.angle,
        numberFormat: this.calc.setup.numberFormat,
        rng: this.calc.rng,
        constants: CONSTANT_VALUES
      });
      const val = ev.run(ast.list[0]);
      if (val instanceof ExactValue) {
        if (field === 0) this.startVal = val;
        else if (field === 1) this.endVal = val;
        else if (field === 2) this.stepVal = val;
      }
    } catch (err) {
      this.showError(err, 'range');
    } finally {
      ed.clear();
    }
  }

  checkDisallowedAst(node) {
    if (!node) return;
    if (node.type === 'call') {
      const fn = String(node.fn || '').toLowerCase();
      if (['pol', 'rec', 'integ', 'diff', 'sum'].includes(fn)) {
        throw new CalcError(ERRORS.SYNTAX);
      }
    }
    if (node.type === 'prefix') {
      const fn = String(node.fn || '').toLowerCase();
      if (['pol', 'rec'].includes(fn)) {
        throw new CalcError(ERRORS.SYNTAX);
      }
    }
    if (node.type === 'tpl') {
      const k = node.item?.kind;
      if (['integral', 'diff', 'sum'].includes(k)) {
        throw new CalcError(ERRORS.SYNTAX);
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          for (const item of v) this.checkDisallowedAst(item);
        } else {
          this.checkDisallowedAst(v);
        }
      }
    }
  }

  generateTable() {
    try {
      const count = rowCount(this.startVal, this.endVal, this.stepVal, ROW_LIMIT);
      this.rows = [];
      const ev = new Evaluator({
        memory: this.calc.memory,
        angle: this.calc.setup.angle,
        numberFormat: this.calc.setup.numberFormat,
        rng: this.calc.rng,
        constants: CONSTANT_VALUES
      });

      let curX = this.startVal;
      for (let i = 0; i < count; i++) {
        ev.local.x = curX;
        ev.local.X = curX;
        let fVal = 'ERROR';
        try {
          fVal = ev.run(this.astF.list[0]);
        } catch {
          fVal = 'ERROR';
        }

        this.rows.push({
          x: curX,
          f: fVal
        });

        if (i < count - 1) {
          curX = curX.add(this.stepVal);
        }
      }

      this.selectedRow = 0;
      this.selectedCol = 0;
      this.topRow = 0;
      this.sdDecimal = false;
      this.phase = 'table';
      if (this.rows.length > 0) {
        this.calc.memory.setVar('X', this.rows[0].x);
      }
    } catch (err) {
      this.showError(err, 'range');
    }
  }

  onKey(ev) {
    const k = ev.key;

    if (this.phase === 'error') {
      if (k === 'AC' && !ev.shift) {
        if (this.error && this.error.prevPhase === 'range') {
          this.phase = 'range';
        } else {
          this.phase = (this.error && this.error.prevPhase) || 'fx';
        }
        return true;
      }
      return true;
    }

    if (this.phase === 'fx') {
      // Disallowed operations in Table mode: Pol, Rec, ∫, d/dx, Σ, conversions, multi-statement
      if (ev.shift && (k === 'ADD' || k === 'SUB' || k === 'INTEGRAL' || k === 'LOG_AB' || k === '8')) {
        return true;
      }
      if (k === 'INTEGRAL') return true;
      if (ev.alpha && k === 'INTEGRAL') return true; // :

      // Scientific constants (01~40)
      if (ev.shift && k === '7') {
        this.calc.pushView(new ConstPromptView(this.calc, (num) => {
          const id = CONSTANT_BY_INDEX[num];
          if (id) applyInput(this.editorF, { tok: id });
        }));
        return true;
      }

      if (k === 'AC' && !ev.shift) {
        this.editorF.clear();
        return true;
      }

      if (k === 'DEL' && !ev.shift) {
        this.editorF.del();
        return true;
      }
      if (k === 'LEFT' && !ev.shift) {
        this.editorF.left();
        return true;
      }
      if (k === 'RIGHT' && !ev.shift) {
        this.editorF.right();
        return true;
      }

      if (k === 'EXE' || k === '=') {
        if (this.editorF.isEmpty()) {
          this.showError(new CalcError(ERRORS.SYNTAX), 'fx');
          return true;
        }
        try {
          this.astF = parse(this.editorF.root, {});
          this.checkDisallowedAst(this.astF.list[0]);
        } catch (err) {
          this.showError(err, 'fx');
          return true;
        }
        this.enterRange();
        return true;
      }

      const action = inputAction(ev, { math: this.editorF.math });
      if (action) {
        applyInput(this.editorF, action);
        return true;
      }
      return false;
    }

    if (this.phase === 'range') {
      if (k === 'AC' && !ev.shift) {
        if (this.rangeEditors[this.rangeField].isEmpty()) {
          this.phase = 'fx';
        } else {
          this.rangeEditors[this.rangeField].clear();
        }
        return true;
      }
      if (k === 'DEL' && !ev.shift) {
        this.rangeEditors[this.rangeField].del();
        return true;
      }
      if (k === 'LEFT' && !ev.shift) {
        this.rangeEditors[this.rangeField].left();
        return true;
      }
      if (k === 'RIGHT' && !ev.shift) {
        this.rangeEditors[this.rangeField].right();
        return true;
      }
      if (k === 'UP' && !ev.shift && !ev.alpha) {
        this.commitRangeField(this.rangeField);
        this.rangeField = Math.max(0, this.rangeField - 1);
        return true;
      }
      if (k === 'DOWN' && !ev.shift && !ev.alpha) {
        this.commitRangeField(this.rangeField);
        this.rangeField = Math.min(2, this.rangeField + 1);
        return true;
      }
      if (k === 'EXE' || k === '=') {
        this.commitRangeField(this.rangeField);
        if (this.rangeField === 0) {
          this.rangeField = 1;
        } else if (this.rangeField === 1) {
          this.rangeField = 2;
        } else if (this.rangeField === 2) {
          this.generateTable();
        }
        return true;
      }
      const action = inputAction(ev, { math: false });
      if (action) {
        applyInput(this.rangeEditors[this.rangeField], action);
        return true;
      }
      return false;
    }

    if (this.phase === 'table') {
      if (k === 'AC' && !ev.shift) {
        this.phase = 'fx';
        return true;
      }
      if (k === 'DOWN' && !ev.shift && !ev.alpha) {
        if (this.selectedRow < this.rows.length - 1) {
          this.selectedRow++;
          if (this.selectedRow >= this.topRow + 2) {
            this.topRow = this.selectedRow - 1;
          }
          this.calc.memory.setVar('X', this.rows[this.selectedRow].x);
        }
        return true;
      }
      if (k === 'UP' && !ev.shift && !ev.alpha) {
        if (this.selectedRow > 0) {
          this.selectedRow--;
          if (this.selectedRow < this.topRow) {
            this.topRow = this.selectedRow;
          }
          this.calc.memory.setVar('X', this.rows[this.selectedRow].x);
        }
        return true;
      }
      if (k === 'RIGHT' && !ev.shift && !ev.alpha) {
        this.selectedCol = 1;
        return true;
      }
      if (k === 'LEFT' && !ev.shift && !ev.alpha) {
        this.selectedCol = 0;
        return true;
      }
      if (k === 'SD' && !ev.shift && !ev.alpha) {
        this.sdDecimal = !this.sdDecimal;
        return true;
      }
      return true; // View-only: ignore other keys
    }

    return false;
  }

  indicators(set) {
    if (this.phase === 'fx') {
      if (this.editorF.math) set.add('Math');
      else set.delete('Math');
    } else if (this.phase === 'range') {
      set.delete('Math');
      if (this.rangeField > 0) set.add('Up');
      if (this.rangeField < 2) set.add('Down');
    } else if (this.phase === 'table' && this.rows && this.rows.length > 0) {
      if (this.editorF.math) set.add('Math');
      else set.delete('Math');
      if (this.selectedRow > 0) set.add('Up');
      if (this.selectedRow < this.rows.length - 1) set.add('Down');
      if (this.selectedCol > 0) set.add('Left');
      if (this.selectedCol < 1) set.add('Right');
    }
  }

  render(scr) {
    scr.clear();
    if (this.phase === 'error') {
      scr.row(0, this.error.message);
      scr.row(2, '[AC]  :Cancel');
      scr.lines = [this.error.message, '[AC]  :Cancel'];
      return;
    }

    if (this.phase === 'fx') {
      // User's Guide captures ("f(X)=▮", "f(X)=X²+1/2"): the prompt and the formula share one
      // baseline; the formula starts right after "f(X)=" and the cursor shows even when empty.
      const pW = measureText('f(X)=', 'large');
      const editor = { path: this.editorF.path, idx: this.editorF.idx, shape: this.editorF.cursorShape() };
      const box = scr.measure(this.editorF.root, { editor: true, math: this.editorF.math });
      const baseline = 1 + Math.max(9, box.asc);
      scr.fb.drawText(0, baseline, 'f(X)=', 'large');
      scr.math(this.editorF.root, { x: pW, baseline, editor, math: this.editorF.math, record: false });
      scr.lines = ['f(X)=' + (this.editorF.isEmpty() ? '' : treeToText(this.editorF.root))];
      return;
    }

    if (this.phase === 'range') {
      const labels = ['Start?', 'End?', 'Step?'];
      const values = [this.startVal, this.endVal, this.stepVal];
      const curPrompt = labels[this.rangeField];
      const curEditor = this.rangeEditors[this.rangeField];
      const curValStr = curEditor.isEmpty() ? this.formatRangeVal(values[this.rangeField]) : treeToText(curEditor.root);

      scr.text(1, 1, curPrompt, { font: 'large' });
      scr.text(1, 16, curValStr, { font: 'large', align: 'right', right: 94 });

      scr.lines = [
        curPrompt,
        curValStr
      ];
      return;
    }

    if (this.phase === 'table') {
      this.renderTable(scr);
    }
  }

  renderTable(scr) {
    // Header row (y = 0): "        X     F(X)"
    scr.text(26, 0, 'X', { font: 'small', record: false });
    scr.text(66, 0, 'F(X)', { font: 'small', record: false });

    // Grid dividers
    scr.fb.hline(0, 95, 7);
    scr.fb.vline(14, 0, 22);
    scr.fb.vline(50, 0, 22);
    scr.fb.hline(0, 95, 22);

    const visibleCount = Math.min(2, this.rows.length - this.topRow);
    const visibleLines = [];

    for (let i = 0; i < visibleCount; i++) {
      const rIdx = this.topRow + i;
      const row = this.rows[rIdx];
      const y = 8 + i * 7;
      const numStr = String(rIdx + 1);

      const xStr = formatCellValue(row.x, this.calc.setup, 33);
      const fStr = formatCellValue(row.f, this.calc.setup, 43);

      // Row number
      scr.text(1, y, numStr, { font: 'small', record: false });
      // X value
      scr.text(16, y, xStr, { font: 'small', align: 'right', right: 48, record: false });
      // F(X) value
      scr.text(52, y, fStr, { font: 'small', align: 'right', right: 94, record: false });

      if (rIdx === this.selectedRow) {
        if (this.selectedCol === 0) {
          scr.fb.invertRect(15, y, 35, 7);
        } else {
          scr.fb.invertRect(51, y, 44, 7);
        }
      }

      visibleLines.push(`${rIdx + 1}: ${xStr} ${fStr}`);
    }

    // Bottom row (y = 23): active cell full exact value
    let bottomText = '';
    const currentRow = this.rows[this.selectedRow];
    if (currentRow) {
      const cellVal = this.selectedCol === 0 ? currentRow.x : currentRow.f;
      if (cellVal === 'ERROR' || typeof cellVal === 'string') {
        bottomText = 'ERROR';
        scr.text(1, 23, bottomText, { font: 'small', record: false });
      } else if (cellVal instanceof ExactValue) {
        bottomText = formatFullValue(cellVal, this.calc.setup, this.sdDecimal);
        scr.text(1, 23, bottomText, { font: 'small', record: false });
      }
    }

    scr.lines = [
      '    X    F(X)',
      ...visibleLines,
      bottomText
    ];
  }

  toJSON() {
    return {
      phase: this.phase,
      editorF: this.editorF.snapshot(),
      startVal: this.startVal ? this.startVal.toJSON?.() || this.startVal : null,
      endVal: this.endVal ? this.endVal.toJSON?.() || this.endVal : null,
      stepVal: this.stepVal ? this.stepVal.toJSON?.() || this.stepVal : null,
      rangeField: this.rangeField,
      selectedRow: this.selectedRow,
      selectedCol: this.selectedCol,
      topRow: this.topRow,
      sdDecimal: this.sdDecimal
    };
  }

  fromJSON(o) {
    if (!o) return;
    this.phase = o.phase || 'fx';
    if (o.editorF) this.editorF.restore(o.editorF);
    if (o.startVal) this.startVal = ExactValue.fromJSON ? ExactValue.fromJSON(o.startVal) : o.startVal;
    if (o.endVal) this.endVal = ExactValue.fromJSON ? ExactValue.fromJSON(o.endVal) : o.endVal;
    if (o.stepVal) this.stepVal = ExactValue.fromJSON ? ExactValue.fromJSON(o.stepVal) : o.stepVal;
    this.rangeField = o.rangeField || 0;
    this.selectedRow = o.selectedRow || 0;
    this.selectedCol = o.selectedCol || 0;
    this.topRow = o.topRow || 0;
    this.sdDecimal = !!o.sdDecimal;
    if (this.phase === 'table') {
      try {
        this.astF = parse(this.editorF.root, {});
        this.generateTable();
      } catch {}
    }
  }
}

export function createApp(calc) {
  return new TableApp(calc);
}
