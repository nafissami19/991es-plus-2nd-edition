/**
 * Tabular data editor for Mode 3: Statistics on 96×31 LCD.
 */

import { CalcError, ERRORS } from '../../errors.js';
import { formatNumber } from '../../format/formatNumber.js';
import { formatOptions } from '../../setup.js';
import { Decimal15 } from '../../number/Decimal15.js';
import { MINUS } from '../../format/display.js';

function shortCellStr(val, setup) {
  if (val === undefined || val === null) return '';
  try {
    const d = Decimal15.from(val);
    const opts = formatOptions(setup);
    return formatNumber(d, {
      format: opts.numberFormat,
      engSymbols: opts.engSymbols,
      decimalMark: opts.decimalMark,
      digitSeparator: opts.digitSeparator
    }).fullString.replace(/^-/, MINUS);
  } catch {
    return String(val);
  }
}

export class StatEditorMenu {
  constructor(editorView) {
    this.editorView = editorView;
    this.calc = editorView.calc;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === '1') {
      this.calc.closeAllOverlays();
      this.editorView.app.showSelectType();
      return true;
    }
    if (k === '2') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === '3') {
      this.calc.replaceView(new StatEditorEditMenu(this.editorView));
      return true;
    }
    return true;
  }

  indicators(set) {
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:Type', { font: 'small' });
    scr.text(48, 1, '2:Data', { font: 'small' });
    scr.text(0, 9, '3:Edit', { font: 'small' });
    scr.lines = [
      '1:Type    2:Data',
      '3:Edit'
    ];
  }
}

export class StatEditorEditMenu {
  constructor(editorView) {
    this.editorView = editorView;
    this.calc = editorView.calc;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === '1') {
      this.calc.closeAllOverlays();
      this.editorView.model.insertRow(this.editorView.row, { x: 0, y: 0, freq: 1 });
      this.editorView.ensureVisible();
      return true;
    }
    if (k === '2') {
      this.calc.closeAllOverlays();
      this.editorView.model.clear();
      this.editorView.reset();
      return true;
    }
    return true;
  }

  indicators(set) {
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:Ins', { font: 'small' });
    scr.text(48, 1, '2:Del-A', { font: 'small' });
    scr.lines = [
      '1:Ins     2:Del-A'
    ];
  }
}

export class StatEditorView {
  constructor(app) {
    this.app = app;
    this.calc = app.calc;
    this.model = app.model;
    this.row = 0; // 0-indexed row
    this.col = 0; // 0-indexed column
    this.scrollRow = 0; // top visible row
    this.isEditing = false;
    this.editBuffer = '';
  }

  reset() {
    this.row = 0;
    this.col = 0;
    this.scrollRow = 0;
    this.isEditing = false;
    this.editBuffer = '';
  }

  get columns() {
    if (!this.model.isPaired()) {
      return this.model.freqEnabled ? ['x', 'FREQ'] : ['x'];
    } else {
      return this.model.freqEnabled ? ['x', 'y', 'FREQ'] : ['x', 'y'];
    }
  }

  colKey(colIdx = this.col) {
    const cols = this.columns;
    const c = cols[colIdx];
    return c === 'FREQ' ? 'freq' : c;
  }

  activeCellValue() {
    if (this.row < this.model.rows.length) {
      const r = this.model.rows[this.row];
      const k = this.colKey();
      return r[k];
    }
    return this.colKey() === 'freq' ? 1 : 0;
  }

  commitEdit() {
    if (!this.isEditing) return;
    const text = this.editBuffer.trim();
    this.isEditing = false;
    this.editBuffer = '';
    if (text === '') return;

    let num;
    try {
      num = Number(text.replace(/−/g, '-'));
      if (!Number.isFinite(num)) throw new Error();
    } catch {
      throw new CalcError(ERRORS.SYNTAX);
    }

    this.model.setCell(this.row, this.colKey(), num);
  }

  ensureVisible() {
    const cols = this.columns;
    if (this.col >= cols.length) this.col = cols.length - 1;
    if (this.col < 0) this.col = 0;

    const maxR = this.model.maxRows() - 1;
    if (this.row > maxR) this.row = maxR;
    if (this.row < 0) this.row = 0;

    if (this.row < this.scrollRow) {
      this.scrollRow = this.row;
    } else if (this.row >= this.scrollRow + 2) {
      this.scrollRow = this.row - 1;
    }
  }

  openStatMenu() {
    this.calc.pushView(new StatEditorMenu(this));
  }

  onKey(ev) {
    const k = ev.key;

    // SHIFT 1 opens STAT editor menu
    if (ev.shift && k === '1') {
      this.commitEdit();
      this.openStatMenu();
      return true;
    }

    // AC exits editor to statistical calculation screen
    if (k === 'AC' && !ev.shift) {
      this.isEditing = false;
      this.editBuffer = '';
      this.app.showCalcScreen();
      return true;
    }

    // Blocked keys in editor: M+, M-, STO, RCL, Pol, Rec, multi-statement (:)
    if (k === 'M_PLUS' || k === 'M+' || (ev.shift && (k === 'M_PLUS' || k === 'M+'))) return true;
    if (ev.shift && k === 'RCL') return true; // STO
    if (k === 'RCL' || k === 'POL' || k === 'REC' || k === 'COLON') return true;

    // Enter / EXE / =
    if ((k === 'EXE' || k === 'ENTER' || k === '=') && !ev.shift) {
      if (this.isEditing) {
        this.commitEdit();
      } else {
        if (this.row >= this.model.rowCount()) {
          this.model.setCell(this.row, this.colKey(), this.activeCellValue());
        }
      }
      if (this.row < this.model.maxRows() - 1) {
        this.row++;
      }
      this.ensureVisible();
      return true;
    }

    if (k === 'UP') {
      this.commitEdit();
      if (this.row > 0) this.row--;
      this.ensureVisible();
      return true;
    }

    if (k === 'DOWN') {
      this.commitEdit();
      if (this.row < this.model.maxRows() - 1) this.row++;
      this.ensureVisible();
      return true;
    }

    if (k === 'LEFT') {
      this.commitEdit();
      if (this.col > 0) this.col--;
      this.ensureVisible();
      return true;
    }

    if (k === 'RIGHT') {
      this.commitEdit();
      if (this.col < this.columns.length - 1) this.col++;
      this.ensureVisible();
      return true;
    }

    if (k === 'DEL' && !ev.shift) {
      if (this.isEditing) {
        this.editBuffer = this.editBuffer.slice(0, -1);
        if (this.editBuffer.length === 0) this.isEditing = false;
      } else {
        this.model.deleteRow(this.row);
        if (this.row >= this.model.rowCount() && this.row > 0) {
          this.row--;
        }
        this.ensureVisible();
      }
      return true;
    }

    // Digit / decimal / minus input
    let char = null;
    if (/^[0-9]$/.test(k)) char = k;
    else if (k === 'DOT' || k === '.') char = '.';
    else if (k === 'NEG' || k === 'SUB' || k === '-') char = '-';
    else if (k === 'EXP') char = 'e';

    if (char !== null) {
      if (!this.isEditing) {
        this.isEditing = true;
        this.editBuffer = char;
      } else {
        this.editBuffer += char;
      }
      return true;
    }

    return false;
  }

  indicators(set) {
    if (this.scrollRow > 0) set.add('Up');
    if (this.scrollRow + 2 < this.model.rowCount()) set.add('Down');
  }

  render(scr) {
    this.ensureVisible();
    const cols = this.columns;
    const numCols = cols.length;

    // 96x31 layout
    const rowNumW = 14;
    const availW = 96 - rowNumW;
    const colW = Math.floor(availW / numCols);

    scr.clear();

    // Row 0: Column headers (y = 0..6)
    for (let c = 0; c < numCols; c++) {
      const colX = rowNumW + c * colW;
      const title = cols[c];
      scr.text(colX + Math.floor((colW - title.length * 5) / 2), 0, title, { font: 'small', record: false });
    }

    // Horizontal line under headers (y = 7)
    scr.fb.hline(0, 95, 7);
    // Vertical line after row numbers (x = rowNumW)
    scr.fb.vline(rowNumW, 0, 22);
    // Vertical lines between columns
    for (let c = 1; c < numCols; c++) {
      scr.fb.vline(rowNumW + c * colW, 0, 22);
    }
    // Horizontal line before bottom status row (y = 22)
    scr.fb.hline(0, 95, 22);

    const lines = [];
    const headerStr = '   ' + cols.join('   ');
    lines.push(headerStr);
    scr.record(0, 1, headerStr);

    // Visible data rows: 2 rows (y = 8 and y = 15)
    for (let rIdx = 0; rIdx < 2; rIdx++) {
      const dataRow = this.scrollRow + rIdx;
      const y = 8 + rIdx * 7;
      const displayRowNum = dataRow + 1;

      // Draw row number
      scr.text(1, y, String(displayRowNum), { font: 'small', record: false });

      const rowData = dataRow < this.model.rows.length ? this.model.rows[dataRow] : null;
      const rowParts = [`${displayRowNum}:`];

      for (let c = 0; c < numCols; c++) {
        const key = cols[c] === 'FREQ' ? 'freq' : cols[c];
        const val = rowData ? rowData[key] : (dataRow === this.row && c === this.col ? '' : '');
        const valStr = val !== '' && val !== undefined ? shortCellStr(val, this.calc.setup) : '';
        const colLeft = rowNumW + c * colW;
        const colRight = (c === numCols - 1) ? 94 : colLeft + colW - 2;

        scr.text(colLeft + 2, y, valStr, { font: 'small', align: 'right', right: colRight, record: false });
        if (valStr) rowParts.push(valStr);

        // Invert cell cursor if active
        if (dataRow === this.row && c === this.col) {
          scr.fb.invertRect(colLeft + 1, y, colW - 1, 7);
        }
      }

      const rowLine = rowParts.join(' ');
      scr.record(y, 1, rowLine);
      lines.push(rowLine);
    }

    // Bottom line (y = 23): active cell edit buffer or value
    const bottomVal = this.isEditing ? this.editBuffer : shortCellStr(this.activeCellValue(), this.calc.setup);
    scr.text(1, 23, bottomVal, { font: 'small', record: false });
    scr.record(23, 1, bottomVal);
    lines.push(bottomVal);

    scr.lines = lines;
  }
}
