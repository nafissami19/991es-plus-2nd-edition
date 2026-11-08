/**
 * Calculate mode (MODE 1 COMP) — also the base class for expression-based modes.
 *
 * Phases:
 *   edit    typing an expression (cursor shown)
 *   result  result shown under the input; operators continue from Ans
 *   disp    intermediate result of a multi-statement (Disp indicator), = goes on
 *   error   error screen; AC clears, ◀/▶ go back to the error position
 */

import { Editor } from '../input/Editor.js';
import { inputAction, applyInput, isContinueKey } from '../input/keyInput.js';
import { parse, astSome } from '../parse/parser.js';
import { Evaluator, PairResult } from '../eval/evaluate.js';
import { ResultView } from '../format/ResultView.js';
import { treeToText, MINUS } from '../format/display.js';
import { CalcError, ERRORS, GOTO_ERRORS, toCalcError } from '../errors.js';
import { VARIABLE_KEYS } from '../keys.js';
import { isMathInput } from '../setup.js';
import { ExactValue } from '../exact/ExactValue.js';
import { ROW_PITCH, LCD_WIDTH, LCD_HEIGHT } from '../ui/Screen.js';
import { MenuView, HypMenuView, DrgMenuView, ConstPromptView, ConvPromptView } from '../ui/views.js';
import { RecallView } from './RecallView.js';
import { CalcVarsView, SolveVarsView } from './calcSolve.js';
import { CONSTANT_VALUES, CONSTANT_BY_INDEX } from '../data/constants.js';
import { CONVERSION_BY_INDEX } from '../data/conversions.js';
import { ComplexValue, cabs, carg, signEV, isOneEV } from '../modes/complex/ComplexValue.js';

const HISTORY_LIMIT = 30;

export class CalcApp {
  constructor(calc) {
    this.calc = calc;
    this.title = 'Calculate';
    this.history = [];
    this.reset();
  }

  get setup() {
    return this.calc.setup;
  }

  get memory() {
    return this.calc.memory;
  }

  /** Clear the input and result (AC / entering the mode). History is kept. */
  reset() {
    this.editor = new Editor({ math: isMathInput(this.calc.setup) });
    this.phase = 'edit';
    this.view = null;
    this.error = null;
    this.statements = null;
    this.stmtIndex = 0;
    this.suffix = '';
    this.histIndex = -1;
    this.scrollX = 0;
    this.stoPending = false;
    this.inCalc = false;
    this.resultScrollX = undefined;
    this.resultOverflowLeft = false;
    this.resultOverflowRight = false;
  }

  onSetupChanged() {
    const math = isMathInput(this.calc.setup);
    if (math !== this.editor.math) this.reset();
  }

  /** Mode change, ON, Input/Output change, RESET: clear history too. */
  clearHistory() {
    this.history = [];
    this.histIndex = -1;
  }

  onEnter() {
    this.reset();
  }

  // ------------------------------------------------------------ evaluation

  evaluatorContext() {
    return {
      angle: this.setup.angle,
      memory: this.memory,
      numberFormat: this.setup.numberFormat,
      rng: this.calc.rng,
      constants: CONSTANT_VALUES,
      mode: this.calc.mode
    };
  }

  makeEvaluator() {
    return new Evaluator(this.evaluatorContext());
  }

  parseOptions() {
    return {};
  }

  /** Execute the expression in the editor. */
  execute({ forceDecimal = false } = {}) {
    this.stoPending = false;
    this.suffix = '';
    this.histIndex = -1;
    if (this.editor.isEmpty()) {
      if (this.phase === 'result') return; // nothing to repeat
      return;
    }
    try {
      const ast = parse(this.editor.root, this.parseOptions());
      this.statements = ast.list;
      this.stmtIndex = 0;
      this.forceDecimal = forceDecimal;
      this.runStatement();
    } catch (err) {
      this.showError(err);
    }
  }

  /** Evaluate statements[stmtIndex]; show it (Disp if more follow). */
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
    const ansValue = value instanceof PairResult ? value.values[0] : value;
    if (ansValue !== undefined && ansValue !== null) this.memory.setAns(ansValue);
    const flags = {
      forceDecimal: this.forceDecimal,
      decimalInput: ev.flags.decimalInput,
      hasFrac: ev.flags.hasFrac,
      dms: ev.flags.dms && isDmsSum(node)
    };
    this.resultView = this.makeResultView(value, flags);
    this.lastValue = value;
    if (this.stmtIndex < this.statements.length - 1) {
      this.phase = 'disp';
    } else {
      this.phase = 'result';
      this.pushHistory();
    }
  }

  evaluateStatement(ev, node) {
    if (node.type === 'eq') {
      const val = ev.run(node.r);
      const varName = node.l?.tok?.variable;
      if (varName) {
        this.memory.setVar(varName, val);
      }
      return val;
    }
    return ev.run(node);
  }

  makeResultView(value, flags) {
    return new ResultView(value, this.setup, flags);
  }

  pushHistory() {
    this.history.push({ root: this.editor.snapshot().root, resultView: this.resultView, suffix: this.suffix });
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
  }

  showError(err) {
    const e = toCalcError(err);
    this.error = { message: e.message, loc: e.loc, goto: GOTO_ERRORS.has(e.message) };
    this.phase = 'error';
  }

  // ------------------------------------------------------------ keys

  onKey(ev) {
    const k = ev.key;

    if (this.phase === 'error') return this.onErrorKey(ev);

    if (this.stoPending) {
      this.stoPending = false;
      const v = VARIABLE_KEYS[k];
      if (v && !ev.shift) {
        this.storeTo(v);
        return true;
      }
      if (k === 'AC') return true;
    }

    if (this.rclPending) {
      this.rclPending = false;
      const v = VARIABLE_KEYS[k];
      if (v && !ev.shift) {
        this.recallVariable(v);
        return true;
      }
      if (k === 'AC') return true;
    }

    // Result toggles
    if (this.phase === 'result' || this.phase === 'disp') {
      if (this.onResultKey(ev)) return true;
    }

    if (k === 'EXE') {
      if (this.inCalc && this.phase === 'result' && !ev.shift) {
        this.startCalc();
        return true;
      }
      if (this.phase === 'disp') {
        this.stmtIndex++;
        this.runStatement();
        return true;
      }
      this.execute({ forceDecimal: !!ev.shift });
      return true;
    }

    if (k === 'AC' && !ev.shift) {
      this.stoPending = false;
      this.rclPending = false;
      this.reset();
      return true;
    }

    if ((k === 'RCL' || k === 'STO' || k === 'RECALL') && !ev.alpha) {
      if (k === 'RECALL' || (k === 'STO' && ev.shift)) {
        this.calc.pushView(new RecallView(this.calc, (v) => this.insertInput({ tok: 'var_' + v })));
        return true;
      }
      const isStore = (k === 'RCL' && ev.shift) || (k === 'STO' && !ev.shift);
      if (isStore) {
        this.stoPending = true;
        this.rclPending = false;
        return true;
      }
      this.rclPending = true;
      this.stoPending = false;
      return true;
    }

    if ((k === 'M_PLUS' || k === 'MPLUS') && !ev.alpha) {
      this.memoryAdd(ev.shift ? -1 : 1);
      return true;
    }

    if (k === 'CALC' && !ev.alpha) {
      if (ev.shift) this.startSolve();
      else this.startCalc();
      return true;
    }

    // hyp menu (1:sinh 2:cosh 3:tanh 4:sinh⁻¹ 5:cosh⁻¹ 6:tanh⁻¹)
    if (k === 'HYP' && !ev.shift && !ev.alpha) {
      this.calc.pushView(new HypMenuView(this.calc, (id) => this.insertInput({ tok: id })));
      return true;
    }

    // DRG▸ menu (1:° 2:r 3:g)
    if (k === 'ANS' && ev.shift && !ev.alpha) {
      this.calc.pushView(new DrgMenuView(this.calc, (id) => this.insertInput({ tok: id }, true)));
      return true;
    }

    // Scientific constants (01~40)
    if (ev.shift && k === '7') {
      this.calc.pushView(new ConstPromptView(this.calc, (num) => {
        const id = CONSTANT_BY_INDEX[num];
        if (id) this.insertInput({ tok: id });
      }));
      return true;
    }

    // Metric conversions (01~40)
    if (ev.shift && k === '8') {
      this.calc.pushView(new ConvPromptView(this.calc, (num) => {
        const id = CONVERSION_BY_INDEX(num);
        if (id) this.insertInput({ tok: id }, true);
      }));
      return true;
    }

    // Mode menus 1-5 and CMPLX-only keys ignored in COMP mode
    if (this.calc.mode === 1) {
      if (ev.shift && ['1', '2', '3', '4', '5'].includes(k)) {
        return true;
      }
      if (ev.alpha && k === 'ENG') {
        return true;
      }
      if (ev.shift && k === 'NEG') {
        return true;
      }
    }

    if (this.onEditKey(ev)) return true;

    const action = this.inputActionFor(ev);
    if (action) {
      this.insertInput(action, isContinueKey(ev, { math: this.editor.math }));
      return true;
    }
    return false;
  }

  inputActionFor(ev) {
    return inputAction(ev, { math: this.editor.math });
  }

  /** Insert from a key or menu. continues = operator that starts with Ans after a result. */
  insertInput(action, continues = false) {
    if (this.phase === 'result' || this.phase === 'disp') {
      this.editor.clear();
      this.statements = null;
      this.inCalc = false;
      if (continues) this.editor.insertToken('Ans');
    } else if (continues && this.phase === 'edit' && this.editor.isEmpty()) {
      // An operator pressed on an empty input starts with Ans
      this.editor.insertToken('Ans');
    }
    this.phase = 'edit';
    this.histIndex = -1;
    this.suffix = '';
    applyInput(this.editor, action);
  }

  onEditKey(ev) {
    const k = ev.key;
    const e = this.editor;
    const editing = this.phase === 'edit';
    switch (k) {
      case 'DEL':
        if (ev.alpha) {
          if (editing) e.undo();
          return true;
        }
        this.enterEdit(true);
        if (ev.shift) e.toggleIns();
        else e.del();
        return true;
      case 'LEFT':
      case 'RIGHT':
        if (!editing) {
          if (this.resultOverflowLeft || this.resultOverflowRight) {
            const step = 20;
            if (k === 'LEFT' && this.resultOverflowLeft) {
              this.resultScrollX = Math.max(0, (this.resultScrollX ?? 0) - step);
              return true;
            }
            if (k === 'RIGHT' && this.resultOverflowRight) {
              this.resultScrollX = Math.min(this.resultMaxScroll || 0, (this.resultScrollX ?? 0) + step);
              return true;
            }
          }
          this.enterEdit(k === 'LEFT');
          return true;
        }
        if (ev.shift) e.exitTemplate(k === 'RIGHT');
        else if (k === 'LEFT') e.left();
        else e.right();
        return true;
      case 'UP':
      case 'DOWN':
        if (editing) {
          if (e.vertical(k === 'UP' ? 'up' : 'down')) return true;
          if (!e.math) {
            if (k === 'UP') { e.home(); return true; }
            if (k === 'DOWN') { e.end(); return true; }
          }
        }
        this.browseHistory(k === 'UP' ? -1 : 1);
        return true;
      default:
        return false;
    }
  }

  /** Leave result/history display and edit the shown expression. */
  enterEdit(cursorAtEnd = true) {
    if (this.phase === 'edit') return;
    this.phase = 'edit';
    this.inCalc = false;
    this.suffix = '';
    this.resultScrollX = undefined;
    this.resultOverflowLeft = false;
    this.resultOverflowRight = false;
    if (cursorAtEnd) this.editor.end();
    else this.editor.home();
  }

  onResultKey(ev) {
    const k = ev.key;
    const rv = this.resultView;
    if (!rv) return false;
    if (k === 'SD' && !ev.alpha) {
      if (ev.shift) rv.toggleMixed();
      else rv.toggleSD();
      return true;
    }
    if (k === 'ENG' && !ev.alpha) {
      rv.eng(ev.shift ? 1 : -1);
      return true;
    }
    if ((k === 'DEG' || k === 'DMS') && !ev.alpha && !ev.shift) {
      rv.toggleDMS();
      return true;
    }
    return false;
  }

  onErrorKey(ev) {
    const k = ev.key;
    if (k === 'AC' && !ev.shift) {
      this.reset();
      return true;
    }
    if ((k === 'LEFT' || k === 'RIGHT') && this.error.goto && !ev.shift && !ev.alpha) {
      this.phase = 'edit';
      this.editor.setLocation(this.error.loc);
      this.error = null;
      return true;
    }
    return true;
  }

  // ------------------------------------------------------------ memory keys

  /** Value to store / add: the current result, or the expression evaluated now. */
  currentValue() {
    if (this.phase === 'edit') {
      if (this.editor.isEmpty()) return this.memory.getAns();
      this.execute();
      if (this.phase === 'error') return null;
    }
    if (!this.lastValue) return this.memory.getAns();
    return this.lastValue instanceof PairResult ? this.lastValue.values[0] : this.lastValue;
  }

  storeTo(variable) {
    const wasEdit = this.phase === 'edit';
    if (wasEdit && this.editor.isEmpty()) {
      this.editor.insertToken('Ans');
    }
    const v = this.currentValue();
    if (v === null) return;
    this.memory.setVar(variable, v);
    this.resultView = this.makeResultView(v, {});
    this.lastValue = v;
    this.suffix = `→${variable}`;
    this.phase = 'result';
    if (wasEdit) {
      this.pushHistory();
    } else if (this.history.length > 0) {
      this.history[this.history.length - 1].suffix = this.suffix;
    }
  }

  recallVariable(v) {
    if (this.phase === 'edit' && !this.editor.isEmpty()) {
      this.insertInput({ tok: 'var_' + v });
      return;
    }
    const val = this.memory.getVar(v);
    this.memory.setAns(val);
    this.lastValue = val;
    this.resultView = this.makeResultView(val, {});
    this.editor.clear();
    this.editor.insertToken('var_' + v);
    this.phase = 'result';
    this.suffix = '';
  }

  memoryAdd(sign) {
    const wasEdit = this.phase === 'edit';
    if (wasEdit && this.editor.isEmpty()) {
      this.editor.insertToken('Ans');
    }
    const v = this.currentValue();
    if (v === null || !(v instanceof ExactValue)) return;
    const m = this.memory.getVar('M');
    try {
      const next = sign > 0 ? m.add(v) : m.sub(v);
      next.toDecimal15(); // range check
      this.memory.setVar('M', next);
    } catch (err) {
      this.showError(err);
      return;
    }
    this.resultView = this.makeResultView(v, {});
    this.lastValue = v;
    this.suffix = '';
    this.phase = 'result';
    if (wasEdit) {
      this.pushHistory();
    }
  }

  // ------------------------------------------------------------ history

  browseHistory(dir) {
    if (!this.history.length) return;
    let i = this.histIndex;
    if (i === -1) i = this.phase === 'result' ? this.history.length - 1 : this.history.length;
    const next = i + dir;
    if (next < 0) return;
    if (next >= this.history.length) {
      if (this.histIndex >= 0) {
        this.reset();
        this.histIndex = -1;
      }
      return;
    }
    this.histIndex = next;
    const h = this.history[next];
    this.editor.setItems(h.root);
    this.resultView = h.resultView;
    this.lastValue = h.resultView.value;
    this.suffix = h.suffix || '';
    this.phase = 'result';
    this.resultScrollX = undefined;
  }

  // ------------------------------------------------------------ CALC / SOLVE

  startCalc() {
    if (this.editor.isEmpty()) return;
    try {
      const ast = parse(this.editor.root, { allowEquals: true });
      this.phase = 'edit';
      const view = new CalcVarsView(this.calc, this, ast);
      if (view.vars.length > 0) {
        this.calc.pushView(view);
      }
    } catch (err) {
      this.showError(err);
    }
  }

  startSolve() {
    if (this.editor.isEmpty() || this.calc.mode !== 1) return;
    let ast;
    try {
      ast = parse(this.editor.root, { allowEquals: true, allowSolveComma: true });
      if (ast.list.length !== 1) throw new CalcError(ERRORS.SYNTAX);
      if (hasDisallowedSolveFunctions(ast.list[0])) throw new CalcError(ERRORS.SYNTAX);
    } catch (err) {
      this.showError(err);
      return;
    }
    const node = ast.list[0];
    const vars = collectVariables(node);
    const target = node.targetVar || (vars.includes('X') ? 'X' : (vars.includes('x') ? 'x' : null));
    if (!target || !vars.includes(target)) {
      this.showError(new CalcError(ERRORS.VARIABLE));
      return;
    }
    this.phase = 'edit';
    this.calc.pushView(new SolveVarsView(this.calc, this, node, vars, target));
  }

  // ------------------------------------------------------------ display

  currentStatementItems() {
    if ((this.phase === 'disp' || this.phase === 'result') && this.statements && this.statements.length > 1) {
      const parts = [];
      let current = [];
      for (const it of this.editor.root) {
        if (it.t === 'tok' && it.id === ':') {
          parts.push(current);
          current = [];
        } else {
          current.push(it);
        }
      }
      parts.push(current);
      if (parts[this.stmtIndex] && parts[this.stmtIndex].length > 0) {
        return parts[this.stmtIndex];
      }
    }
    return this.editor.root;
  }

  inputText() {
    return treeToText(this.currentStatementItems()) + this.suffix;
  }

  indicators(set) {
    if (this.phase === 'disp') set.add('Disp');
    if (this.stoPending) set.add('STO');
    if (this.rclPending) set.add('RCL');
    if (this.phase === 'edit' && this.history.length > 0) {
      set.add('Up');
    } else if (this.phase === 'result') {
      // User's Guide captures: a result shows ▲ (history to scroll back to); ▼ only while an
      // older entry is shown.
      if (this.histIndex === -1) {
        if (this.history.length > 0) set.add('Up');
      } else {
        if (this.histIndex > 0) set.add('Up');
        if (this.histIndex < this.history.length - 1) set.add('Down');
      }
    }
    if (this.phase === 'result' && (this.resultOverflowLeft || this.resultOverflowRight)) {
      if (this.resultOverflowLeft) set.add('Left');
      if (this.resultOverflowRight) set.add('Right');
    } else {
      if (this.overflowLeft) set.add('Left');
      if (this.overflowRight) set.add('Right');
    }
  }

  render(scr) {
    if (this.phase === 'error') {
      renderError(scr, this.error);
      return;
    }
    const editing = this.phase === 'edit';
    this.renderInput(scr, editing);
    let resultText = '';
    if (!editing && this.resultView) {
      const isLineIO = !this.editor.math;
      if (isLineIO && this.lastValue instanceof PairResult) {
        const v = this.lastValue;
        const line0 = `${v.labels[0]}=${treeToText(new ResultView(v.values[0], this.setup, { ...this.flags, dms: false, pairPart: true }).tree())}`;
        const line1 = `${v.labels[1]}=${treeToText(new ResultView(v.values[1], this.setup, { ...this.flags, dms: false, pairPart: true }).tree())}`;
        scr.text(1, 1, line0, { font: 'large', record: false });
        scr.text(1, 17, line1, { font: 'large', record: false });
        scr.lines = [line0, line1];
        return;
      }
      if (isLineIO && this.lastValue instanceof ComplexValue) {
        const v = this.lastValue;
        const flags = this.resultView?.flags || {};
        const isPolar = (flags.complexMode || v.formatOverride) &&
          (v.formatOverride ? v.formatOverride === 'polar' : this.setup.complex === 'POLAR');
        let line0, line1;
        if (isPolar) {
          const r = cabs(v);
          const theta = carg(v, this.setup.angle);
          const rText = treeToText(new ResultView(r, this.setup, { ...flags, complexMode: true }).tree());
          const thetaText = treeToText(new ResultView(theta, this.setup, { ...flags, complexMode: true }).tree());
          line0 = `r=${rText}`;
          line1 = `θ=${thetaText}`;
        } else {
          const a = v.re;
          const b = v.im;
          const aText = treeToText(new ResultView(a, this.setup, { ...flags, complexMode: true }).tree());
          const bNeg = signEV(b) < 0;
          const absB = bNeg ? b.neg() : b;
          const bText = isOneEV(absB) ? '' : treeToText(new ResultView(absB, this.setup, { ...flags, complexMode: true }).tree());
          line0 = aText;
          line1 = `${bNeg ? MINUS : '+'}${bText}i`;
        }
        scr.text(1, 1, line0, { font: 'large', record: false });
        scr.text(1, 17, line1, { font: 'large', record: false });
        scr.lines = [line0, line1];
        return;
      }
      const tree = this.resultView.tree();
      resultText = treeToText(tree);
      const box = scr.measure(tree);
      const viewWidth = LCD_WIDTH - 6;
      const maxScroll = Math.max(0, box.w - viewWidth);
      this.resultMaxScroll = maxScroll;
      if (this.resultScrollX === undefined || this.resultScrollX === null) {
        this.resultScrollX = maxScroll;
      } else {
        this.resultScrollX = Math.max(0, Math.min(maxScroll, this.resultScrollX));
      }
      this.resultOverflowLeft = this.resultScrollX > 0;
      this.resultOverflowRight = this.resultScrollX < maxScroll;

      // User's Guide captures: results sit against the bottom row (30) and the right edge (column 95).
      const baseline = LCD_HEIGHT - box.desc;
      const x = (LCD_WIDTH - box.w) + (maxScroll - this.resultScrollX);
      scr.math(tree, { x, baseline, record: false });
      if (this.resultOverflowLeft) scr.drawArrow(0, LCD_HEIGHT - 9, 'left', 'small');
      if (this.resultOverflowRight) scr.drawArrow(LCD_WIDTH - 5, LCD_HEIGHT - 9, 'right', 'small');
    }
    scr.lines = [this.inputText(), resultText];
  }

  renderInput(scr, editing) {
    const items = this.currentStatementItems();
    const math = this.editor.math;
    const shape = this.editor.cursorShape();
    // Measure first to scroll the cursor into view
    const probe = scr.measure(items, { editor: true, math });
    const width = probe.w;
    const m = probe.cursorAt(this.editor.path, this.editor.idx);
    const cursorX = m ? m.dx : width;
    // 16 cells fit exactly; while editing, keep one column free for the cursor.
    const view = editing ? LCD_WIDTH - 1 : LCD_WIDTH;
    if (!editing) this.scrollX = 0;
    else if (cursorX - this.scrollX > view) this.scrollX = cursorX - view;
    else if (cursorX - this.scrollX < 0) this.scrollX = Math.max(0, cursorX - 12);
    this.overflowLeft = this.scrollX > 0;
    this.overflowRight = width - this.scrollX > LCD_WIDTH;

    const height = probe.asc + probe.desc;
    let top = 1;
    if (editing && height > LCD_HEIGHT) {
      const cursorY = probe.asc + (m ? m.dy : 0);
      if (cursorY > LCD_HEIGHT - 4) {
        top = 1 - (cursorY - (LCD_HEIGHT - 4));
      }
    }
    const opts = {
      x: 0, // input starts at column 0 (User's Guide captures)
      top,
      editor: editing ? { path: this.editor.path, idx: this.editor.idx, shape } : null,
      math
    };
    scr.math(items, { ...opts, scrollX: this.scrollX });
    // Overflow marks (User's Guide capture "4×sin(30)×(30+1▶"): the first/last 6-dot cell of the
    // input line is replaced by a main-font ◀ / ▶.
    const lineTop = top + probe.asc - 9;
    if (this.overflowRight) {
      scr.fb.fillRect(LCD_WIDTH - 6, Math.max(0, top), 6, Math.min(LCD_HEIGHT, probe.asc + probe.desc), 0);
      scr.fb.drawTextTop(LCD_WIDTH - 6, lineTop, '▷', 'large');
    }
    if (this.overflowLeft) {
      scr.fb.fillRect(0, Math.max(0, top), 6, Math.min(LCD_HEIGHT, probe.asc + probe.desc), 0);
      scr.fb.drawTextTop(0, lineTop, '◁', 'large');
    }
    if (this.suffix) scr.text(Math.min(probe.w + 2, LCD_WIDTH - 15), top + probe.asc - 11, this.suffix, { record: false });
  }

  toJSON() {
    return {
      phase: this.phase,
      editor: this.editor.toJSON(),
      suffix: this.suffix
    };
  }

  fromJSON(o) {
    if (!o) return;
    this.phase = o.phase || 'edit';
    if (o.editor) this.editor = Editor.fromJSON(o.editor);
    this.suffix = o.suffix || '';
    if (this.phase === 'result' && this.calc.memory.getAns()) {
      const v = this.calc.memory.getAns();
      this.lastValue = v;
      this.resultView = this.makeResultView(v, {});
    }
  }
}

// ------------------------------------------------------------ helpers

export function renderError(scr, error) {
  scr.row(0, error.message);
  scr.row(2, '[AC]  :Cancel'); // two spaces: ":" lines up with the Goto row (User's Guide capture)
  if (error.goto) scr.row(3, '[◀][▶]:Goto');
  scr.lines = [error.message, '[AC]  :Cancel', ...(error.goto ? ['[◀][▶]:Goto'] : [])];
}

export function isPostfixId(id) {
  return ['deg', 'rad', 'grad', 'toPolar', 'toRect'].includes(id) || id.startsWith('eng_') || id.startsWith('conv_');
}

/** A sexagesimal result is shown when the expression only adds/subtracts/scales DMS values. */
function isDmsSum(node) {
  if (!node) return false;
  const ok = (n) => {
    switch (n.type) {
      case 'dms': return true;
      case 'num': case 'value': return true;
      case 'paren': case 'neg': return ok(n.arg);
      case 'bin': return ['+', '-', '*', '/'].includes(n.op) && ok(n.l) && ok(n.r);
      default: return false;
    }
  };
  return ok(node) && astSome(node, (n) => n.type === 'dms');
}

/** Variables used in an expression, in order of appearance. */
export function collectVariables(node) {
  const out = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    const v = n.tok?.variable || n.variable;
    if (n.type === 'value' && n.name === 'var' && v && !out.includes(v)) out.push(v);
    for (const key of ['l', 'r', 'arg', 'num', 'den', 'whole', 'd', 'm', 's', 'index']) if (n[key]) walk(n[key]);
    if (n.args) n.args.forEach(walk);
  };
  walk(node);
  return out;
}

export function hasDisallowedSolveFunctions(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'call' && ['integral', 'diff', 'sum', 'Pol', 'Rec'].includes(node.fn)) return true;
  for (const key of ['l', 'r', 'arg', 'num', 'den', 'whole', 'd', 'm', 's', 'index']) {
    if (node[key] && hasDisallowedSolveFunctions(node[key])) return true;
  }
  if (node.args) {
    for (const a of node.args) {
      if (hasDisallowedSolveFunctions(a)) return true;
    }
  }
  return false;
}

export { ROW_PITCH };
