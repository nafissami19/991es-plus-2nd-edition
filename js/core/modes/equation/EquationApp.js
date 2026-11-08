/**
 * Mode 5: EQN (Simultaneous Linear Equations & Polynomials)
 * for Casio fx-991ES PLUS 2nd edition (96×31 LCD).
 */

import { Editor } from '../../input/Editor.js';
import { inputAction, applyInput } from '../../input/keyInput.js';
import { parse } from '../../parse/parser.js';
import { Evaluator } from '../../eval/evaluate.js';
import { ResultView } from '../../format/ResultView.js';
import { treeToText } from '../../format/display.js';
import { renderError } from '../../apps/CalcApp.js';
import { toCalcError } from '../../errors.js';
import { VARIABLE_KEYS } from '../../keys.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { ComplexValue } from '../complex/ComplexValue.js';
import { LCD_WIDTH, LCD_HEIGHT } from '../../../lcd/raster.js';
import { solveSimultaneous, solvePolynomial } from './solver.js';

function formatCoeff(v, setup) {
  if (v instanceof ExactValue) {
    return treeToText(new ResultView(v, setup).tree());
  }
  return String(v ?? 0);
}

export class EquationApp {
  constructor(calc) {
    this.calc = calc;
    this.title = 'EQN';
    this.reset();
  }

  reset() {
    this.phase = 'type_select';
    this.modeType = null; // 'simul' | 'poly'
    this.numUnknowns = 2;
    this.degree = 2;
    this.coeffs = null;
    this.curRow = 0;
    this.curCol = 0;
    this.editor = null;
    this.solutionItems = [];
    this.solutionIndex = 0;
    this.stoPending = false;
    this.error = null;
  }

  onEnter() {
    this.reset();
  }

  selectType(typeNum) {
    if (typeNum === 1) {
      this.initSimul(2);
    } else if (typeNum === 2) {
      this.initSimul(3);
    } else if (typeNum === 3) {
      this.initPoly(2);
    } else if (typeNum === 4) {
      this.initPoly(3);
    }
  }

  initSimul(n) {
    this.modeType = 'simul';
    this.numUnknowns = n;
    this.coeffs = Array.from({ length: n }, () =>
      Array.from({ length: n + 1 }, () => ExactValue.fromInt(0n))
    );
    this.curRow = 0;
    this.curCol = 0;
    this.editor = null;
    this.phase = 'coef_editor';
  }

  initPoly(deg) {
    this.modeType = 'poly';
    this.degree = deg;
    this.coeffs = Array.from({ length: deg + 1 }, () => ExactValue.fromInt(0n));
    this.curCol = 0;
    this.editor = null;
    this.phase = 'coef_editor';
  }

  showError(err) {
    const e = toCalcError(err);
    this.error = { message: e.message, loc: e.loc, goto: false };
    this.phase = 'error';
  }

  commitEditor() {
    if (!this.editor || this.editor.isEmpty()) {
      this.editor = null;
      return true;
    }
    try {
      const ast = parse(this.editor.root, {});
      const ev = new Evaluator({ memory: this.calc.memory, angle: this.calc.setup.angle });
      const val = ev.run(ast.list[0]);
      this.editor = null;
      if (this.modeType === 'simul') {
        this.coeffs[this.curRow][this.curCol] = val;
      } else {
        this.coeffs[this.curCol] = val;
      }
      return true;
    } catch (err) {
      this.showError(toCalcError(err));
      return false;
    }
  }

  solve() {
    if (this.modeType === 'simul') {
      try {
        const res = solveSimultaneous(this.coeffs, this.numUnknowns);
        const varNames = ['X', 'Y', 'Z'];
        this.solutionItems = res.solutions.map((val, idx) => ({
          type: 'simul',
          name: varNames[idx],
          val,
          resultView: new ResultView(val, this.calc.setup)
        }));
        this.solutionIndex = 0;
        this.phase = 'solution';
      } catch (err) {
        this.showError(toCalcError(err));
      }
      return;
    }

    if (this.modeType === 'poly') {
      try {
        const res = solvePolynomial(this.coeffs, this.degree, this.calc.setup);
        const items = [];
        if (!res.hasRealRoots && res.roots.length === 0) {
          this.showError('Math ERROR');
          return;
        }

        if (res.roots.length === 1) {
          items.push({
            type: 'root',
            name: 'X',
            val: res.roots[0],
            resultView: new ResultView(res.roots[0], this.calc.setup, {
              complexMode: res.roots[0] instanceof ComplexValue
            })
          });
        } else {
          res.roots.forEach((val, idx) => {
            items.push({
              type: 'root',
              name: `X${idx + 1}`,
              val,
              resultView: new ResultView(val, this.calc.setup, {
                complexMode: val instanceof ComplexValue
              })
            });
          });
        }

        this.solutionItems = items;
        this.solutionIndex = 0;
        this.phase = 'solution';
      } catch (err) {
        this.showError(toCalcError(err));
      }
    }
  }

  onKey(ev) {
    const k = ev.key;

    if (this.phase === 'error') {
      if (k === 'AC' && !ev.shift) {
        this.phase = 'coef_editor';
        return true;
      }
      return true;
    }

    if (this.phase === 'type_select') {
      if ((k === '1' || k === '2' || k === '3' || k === '4') && !ev.shift && !ev.alpha) {
        this.selectType(Number(k));
        return true;
      }
      if (k === 'AC' && !ev.shift) {
        if (this.coeffs) {
          this.phase = 'coef_editor';
        }
        return true;
      }
      return true;
    }

    if (this.phase === 'solution') {
      return this.onSolutionKey(ev);
    }

    if (this.phase === 'coef_editor') {
      return this.onEditorKey(ev);
    }

    return false;
  }

  onEditorKey(ev) {
    const k = ev.key;

    // Block disallowed keys in coefficient editor:
    // M+, M-, STO, RCL, Pol, Rec, multi-statement (:)
    if (k === 'M_PLUS' || k === 'M+' || (ev.shift && (k === 'M_PLUS' || k === 'M+'))) return true;
    if (ev.shift && k === 'RCL') return true; // STO
    if (k === 'RCL' || k === 'POL' || k === 'Pol' || k === 'REC' || k === 'Rec') return true;
    if (k === 'COLON' || k === ':' || (ev.alpha && (k === 'INTEGRAL' || k === ':'))) return true;

    // AC clears all coefficients to 0
    if (k === 'AC' && !ev.shift) {
      this.editor = null;
      if (this.modeType === 'simul') {
        for (let r = 0; r < this.numUnknowns; r++) {
          for (let c = 0; c <= this.numUnknowns; c++) {
            this.coeffs[r][c] = ExactValue.fromInt(0n);
          }
        }
        this.curRow = 0;
        this.curCol = 0;
      } else {
        for (let c = 0; c <= this.degree; c++) {
          this.coeffs[c] = ExactValue.fromInt(0n);
        }
        this.curCol = 0;
      }
      return true;
    }

    // DEL deletes token from editor if active
    if (k === 'DEL' && !ev.shift && !ev.alpha) {
      if (this.editor && !this.editor.isEmpty()) {
        applyInput(this.editor, 'DELETE');
      }
      return true;
    }

    // Arrow navigation
    if (k === 'LEFT' && !ev.shift && !ev.alpha) {
      if (this.editor && !this.editor.isEmpty()) {
        this.editor.left();
        return true;
      }
      if (this.modeType === 'simul') {
        this.curCol--;
        if (this.curCol < 0) {
          this.curCol = this.numUnknowns;
          this.curRow = (this.curRow - 1 + this.numUnknowns) % this.numUnknowns;
        }
      } else {
        this.curCol = Math.max(0, this.curCol - 1);
      }
      return true;
    }

    if (k === 'RIGHT' && !ev.shift && !ev.alpha) {
      if (this.editor && !this.editor.isEmpty()) {
        this.editor.right();
        return true;
      }
      if (this.modeType === 'simul') {
        this.curCol++;
        if (this.curCol > this.numUnknowns) {
          this.curCol = 0;
          this.curRow = (this.curRow + 1) % this.numUnknowns;
        }
      } else {
        this.curCol = Math.min(this.degree, this.curCol + 1);
      }
      return true;
    }

    if (k === 'UP' && !ev.shift && !ev.alpha) {
      this.commitEditor();
      if (this.modeType === 'simul') {
        this.curRow = Math.max(0, this.curRow - 1);
      }
      return true;
    }

    if (k === 'DOWN' && !ev.shift && !ev.alpha) {
      this.commitEditor();
      if (this.modeType === 'simul') {
        this.curRow = Math.min(this.numUnknowns - 1, this.curRow + 1);
      }
      return true;
    }

    // EXE / = commits input and advances cell or solves
    if ((k === 'EXE' || k === 'ENTER' || k === '=') && !ev.shift) {
      const hadInput = this.editor && !this.editor.isEmpty();
      const ok = this.commitEditor();
      if (!ok) return true;

      if (this.modeType === 'simul') {
        const isLastCell =
          this.curRow === this.numUnknowns - 1 && this.curCol === this.numUnknowns;
        if (isLastCell) {
          if (!hadInput) {
            this.solve();
          }
        } else {
          this.curCol++;
          if (this.curCol > this.numUnknowns) {
            this.curCol = 0;
            this.curRow++;
          }
        }
      } else {
        const isLastCell = this.curCol === this.degree;
        if (isLastCell) {
          if (!hadInput) {
            this.solve();
          }
        } else {
          this.curCol++;
        }
      }
      return true;
    }

    const action = inputAction(ev, { math: true });
    if (action) {
      if (!this.editor) this.editor = new Editor({ math: true });
      applyInput(this.editor, action);
      return true;
    }

    return false;
  }

  onSolutionKey(ev) {
    const k = ev.key;
    const item = this.solutionItems[this.solutionIndex];

    // ENG key is blocked on solution screens
    if (k === 'ENG' || (ev.shift && k === 'ENG')) {
      return true;
    }

    const isStore = (k === 'RCL' && ev.shift) || (k === 'STO' && !ev.shift);
    if (isStore && !ev.alpha) {
      this.stoPending = true;
      return true;
    }

    if (this.stoPending && !ev.shift) {
      this.stoPending = false;
      const v = VARIABLE_KEYS[k] || (k.length === 1 && 'ABCDEFxyM'.includes(k) ? k : null);
      if (v && item?.val) {
        this.calc.memory.setVar(v, item.val);
        this.calc.memory.setAns(item.val);
      }
      return true;
    }

    if (k === 'M_PLUS' && !ev.alpha) {
      if (item?.val) {
        if (ev.shift) {
          this.calc.memory.addM(item.val.neg ? item.val.neg() : item.val);
        } else {
          this.calc.memory.addM(item.val);
        }
      }
      return true;
    }

    // AC returns to coefficient editor
    if (k === 'AC' && !ev.shift) {
      this.stoPending = false;
      this.curRow = 0;
      this.curCol = 0;
      this.phase = 'coef_editor';
      return true;
    }

    // EXE / = advances to next solution; if last, returns to coefficient editor
    if ((k === 'EXE' || k === 'ENTER' || k === '=') && !ev.shift) {
      this.stoPending = false;
      if (this.solutionIndex < this.solutionItems.length - 1) {
        this.solutionIndex++;
      } else {
        this.curRow = 0;
        this.curCol = 0;
        this.phase = 'coef_editor';
      }
      return true;
    }

    if (k === 'DOWN' && !ev.shift && !ev.alpha) {
      this.stoPending = false;
      if (this.solutionIndex < this.solutionItems.length - 1) {
        this.solutionIndex++;
      }
      return true;
    }

    if (k === 'UP' && !ev.shift && !ev.alpha) {
      this.stoPending = false;
      if (this.solutionIndex > 0) {
        this.solutionIndex--;
      }
      return true;
    }

    if (k === 'SD' && !ev.shift && !ev.alpha) {
      if (item?.resultView) {
        item.resultView.toggleSD();
      }
      return true;
    }

    return false;
  }

  isMenuScreen() {
    return this.phase === 'type_select'; // the EQN type menu shows no status icons
  }

  indicators(set) {
    if (this.calc.setup.inputOutput.startsWith('MathI')) {
      set.add('Math');
    }
    set.add(this.calc.setup.angle === 'RAD' ? 'R' : this.calc.setup.angle === 'GRA' ? 'G' : 'D');

    if (this.phase === 'solution') {
      if (this.solutionIndex > 0) {
        set.add('Up');
      }
      if (this.solutionIndex < this.solutionItems.length - 1) {
        set.add('Down');
      }
      if (this.stoPending) {
        set.add('STO');
      }
      const item = this.solutionItems[this.solutionIndex];
      if (item?.val instanceof ComplexValue) {
        set.add('CMPLX');
      }
    }
  }

  render(scr) {
    if (this.phase === 'error') {
      renderError(scr, this.error);
      return;
    }
    if (this.phase === 'type_select') {
      this.renderTypeMenu(scr);
      return;
    }
    if (this.phase === 'coef_editor') {
      this.renderEditor(scr);
      return;
    }
    if (this.phase === 'solution') {
      this.renderSolution(scr);
      return;
    }
  }

  renderTypeMenu(scr) {
    scr.clear();
    // Coefficient subscripts are the ES's small subscript n (User's Guide capture).
    scr.text(0, 1, '1:aₙX+bₙY=cₙ', { font: 'small', record: false });
    scr.text(0, 9, '2:aₙX+bₙY+cₙZ=dₙ', { font: 'small', record: false });
    scr.text(0, 17, '3:aX\u00B2+bX+c=0', { font: 'small', record: false });
    scr.text(0, 25, '4:aX\u00B3+bX\u00B2+cX+d=0', { font: 'small', record: false });
    scr.lines = [
      '1:anX+bnY=cn',
      '2:anX+bnY+cnZ=dn',
      '3:aX²+bX+c=0',
      '4:aX³+bX²+cX+d=0'
    ];
  }

  renderEditor(scr) {
    scr.clear();
    const isSimul = this.modeType === 'simul';
    const numCols = isSimul ? this.numUnknowns + 1 : this.degree + 1;
    const numRows = isSimul ? this.numUnknowns : 1;
    const colLetters = ['a', 'b', 'c', 'd'];

    // Header / grid layout on 96x31 LCD
    const rowNumW = isSimul ? 10 : 0;
    const availW = 96 - rowNumW;
    const colW = Math.floor(availW / numCols);

    // Row 0: Column headers (y = 0..6)
    for (let c = 0; c < numCols; c++) {
      const colX = rowNumW + c * colW;
      const title = colLetters[c];
      scr.text(colX + Math.floor((colW - 5) / 2), 0, title, { font: 'small', record: false });
    }

    // Horizontal line under headers (y = 7)
    scr.fb.hline(0, 95, 7);

    // Vertical line after row numbers if simul
    if (isSimul) {
      scr.fb.vline(rowNumW, 0, 22);
    }
    // Vertical lines between columns
    for (let c = 1; c < numCols; c++) {
      scr.fb.vline(rowNumW + c * colW, 0, 22);
    }
    // Horizontal line before bottom status row (y = 22)
    scr.fb.hline(0, 95, 22);

    // Visible data rows
    const visibleRows = Math.min(2, numRows);
    const scrollRow = isSimul && this.curRow >= 2 ? this.curRow - 1 : 0;

    for (let rIdx = 0; rIdx < visibleRows; rIdx++) {
      const dataRow = scrollRow + rIdx;
      const y = 8 + rIdx * 7;
      if (isSimul) {
        scr.text(1, y, String(dataRow + 1), { font: 'small', record: false });
      }

      for (let c = 0; c < numCols; c++) {
        const val = isSimul ? this.coeffs[dataRow][c] : this.coeffs[c];
        const valStr = formatCoeff(val, this.calc.setup);
        const colLeft = rowNumW + c * colW;
        const colRight = (c === numCols - 1) ? 94 : colLeft + colW - 2;

        scr.text(colLeft + 2, y, valStr, { font: 'small', align: 'right', right: colRight, record: false });

        // Highlight active cell
        const isActive = isSimul ? (dataRow === this.curRow && c === this.curCol) : (c === this.curCol);
        if (isActive) {
          scr.fb.invertRect(colLeft + 1, y, colW - 1, 7);
        }
      }
    }

    // Bottom line (y = 23): active cell label + value/editor
    const cellLabel = isSimul ? `${colLetters[this.curCol]}${this.curRow + 1}=` : `${colLetters[this.curCol]}=`;
    let valText = '';
    if (this.editor && !this.editor.isEmpty()) {
      valText = treeToText(this.editor.root);
    } else {
      const curVal = isSimul ? this.coeffs[this.curRow][this.curCol] : this.coeffs[this.curCol];
      valText = formatCoeff(curVal, this.calc.setup);
    }
    scr.text(1, 23, `${cellLabel}${valText}`, { font: 'small', record: false });

    const header = isSimul
      ? (this.numUnknowns === 2 ? 'anX+bnY=cn' : 'anX+bnY+cnZ=dn')
      : (this.degree === 2 ? 'aX²+bX+c=0' : 'aX³+bX²+cX+d=0');
    scr.lines = [header, `${cellLabel}${valText}`];
  }

  renderSolution(scr) {
    scr.clear();
    const item = this.solutionItems[this.solutionIndex];
    if (!item) return;

    const label = `${item.name}=`;
    scr.text(1, 1, label, { font: 'large', record: false });

    const rv = item.resultView;
    const tree = rv.tree();
    const resultText = treeToText(tree);

    const box = scr.measure(tree);
    const baseline = Math.min(29, 30 - box.desc);
    const x = Math.max(1, (LCD_WIDTH - 2) - box.w);
    scr.math(tree, { x, baseline, record: false });
    scr.lines = [label, resultText];
  }
}
