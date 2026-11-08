/**
 * Authentic UI views for Mode 6: Matrix on fx-991ES PLUS 2nd edition (96×31 LCD).
 */

import { CalcError, ERRORS } from '../../errors.js';
import { Matrix } from './Matrix.js';

/**
 * SHIFT 4 MATRIX Menu:
 * All 8 authentic options displayed simultaneously across 4 rows (per 2nd edition LCD):
 * Line 1: 1:Dim    2:Data
 * Line 2: 3:MatA   4:MatB
 * Line 3: 5:MatC   6:MatAns
 * Line 4: 7:det    8:Trn
 */
export class MatrixMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, app) {
    this.calc = calc;
    this.app = app;
    this.isOverlay = true;
  }

  indicators(set) {
    // fx-991ES Plus 2nd edition displays all 8 options on a single screen without pagination
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }

    // Direct key execution for options 1 to 8
    if (k === '1') {
      // 1: Dim
      this.calc.replaceView(new MatrixVarSelectView(this.calc, this.app, 'dim'));
      return true;
    }
    if (k === '2') {
      // 2: Data
      this.calc.replaceView(new MatrixVarSelectView(this.calc, this.app, 'data'));
      return true;
    }
    if (k === '3') {
      this.insertTok('MatA');
      return true;
    }
    if (k === '4') {
      this.insertTok('MatB');
      return true;
    }
    if (k === '5') {
      this.insertTok('MatC');
      return true;
    }
    if (k === '6') {
      this.insertTok('MatAns');
      return true;
    }
    if (k === '7') {
      this.insertTok('Det');
      return true;
    }
    if (k === '8') {
      this.insertTok('Trn');
      return true;
    }
    return true;
  }

  insertTok(id) {
    this.calc.closeAllOverlays();
    if (this.app.matrixPhase === 'editor' || this.app.matrixPhase === 'result_matrix') {
      this.app.matrixPhase = 'edit';
    }
    this.app.insertInput({ tok: id });
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:Dim', { font: 'small', record: false });
    scr.text(48, 1, '2:Data', { font: 'small', record: false });
    scr.text(0, 9, '3:MatA', { font: 'small', record: false });
    scr.text(48, 9, '4:MatB', { font: 'small', record: false });
    scr.text(0, 17, '5:MatC', { font: 'small', record: false });
    scr.text(48, 17, '6:MatAns', { font: 'small', record: false });
    scr.text(0, 25, '7:det', { font: 'small', record: false });
    scr.text(48, 25, '8:Trn', { font: 'small', record: false });
    scr.lines = [
      '1:Dim    2:Data',
      '3:MatA   4:MatB',
      '5:MatC   6:MatAns',
      '7:det    8:Trn'
    ];
  }
}

/**
 * Matrix Variable Selection Menu (MatA, MatB, MatC)
 * Used on mode entry and for Dim/Data sub-menus.
 */
export class MatrixVarSelectView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, app, action = 'dim') {
    this.calc = calc;
    this.app = app;
    this.action = action; // 'dim' | 'data'
    this.isOverlay = true;
  }

  indicators(set) {
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    const map = { '1': 'MatA', '2': 'MatB', '3': 'MatC' };
    const name = map[k];
    if (name) {
      if (this.action === 'dim') {
        this.calc.replaceView(new MatrixDimSelectView(this.calc, this.app, name));
        return true;
      }
      if (this.action === 'data') {
        const mat = this.app.getMatrix(name);
        if (!mat || !mat.rows || !mat.cols) {
          this.calc.closeAllOverlays();
          this.app.showError(new CalcError(ERRORS.DIMENSION));
          return true;
        }
        this.calc.closeAllOverlays();
        this.app.openEditor(name, mat, false);
        return true;
      }
    }
    return true;
  }

  render(scr) {
    scr.clear();
    // User's Guide capture (MODE 6): "Matrix?" then the three variables.
    scr.text(0, 1, 'Matrix?', { font: 'small', record: false });
    scr.text(0, 9, '1:MatA', { font: 'small', record: false });
    scr.text(48, 9, '2:MatB', { font: 'small', record: false });
    scr.text(0, 17, '3:MatC', { font: 'small', record: false });
    scr.lines = [
      'Matrix?',
      '1:MatA   2:MatB',
      '3:MatC'
    ];
  }
}

/**
 * Dimension Selection Menu (m × n)
 * Page 1:
 * 1: 3x3   2: 3x2
 * 3: 3x1   4: 2x3
 * 5: 2x2   6: 2x1
 * Page 2:
 * 1: 1x3   2: 1x2
 * 3: 1x1
 */
export class MatrixDimSelectView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, app, targetName = 'MatA') {
    this.calc = calc;
    this.app = app;
    this.targetName = targetName;
    this.page = 0; // 0 = page 1, 1 = page 2
    this.isOverlay = true;
  }

  indicators(set) {
    if (this.page === 0) set.add('Down');
    else set.add('Up');
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

    let dims = null;
    if (this.page === 0) {
      const page1Map = {
        '1': [3, 3],
        '2': [3, 2],
        '3': [3, 1],
        '4': [2, 3],
        '5': [2, 2],
        '6': [2, 1]
      };
      dims = page1Map[k];
    } else {
      const page2Map = {
        '1': [1, 3],
        '2': [1, 2],
        '3': [1, 1]
      };
      dims = page2Map[k];
    }

    if (dims) {
      const [rows, cols] = dims;
      const matrix = new Matrix(rows, cols);
      this.app.setMatrix(this.targetName, matrix);
      this.calc.closeAllOverlays();
      this.app.openEditor(this.targetName, matrix, false);
      return true;
    }

    return true;
  }

  render(scr) {
    scr.clear();
    if (this.page === 0) {
      scr.text(0, 1, '1: 3\u00D73', { font: 'small', record: false });
      scr.text(48, 1, '2: 3\u00D72', { font: 'small', record: false });
      scr.text(0, 9, '3: 3\u00D71', { font: 'small', record: false });
      scr.text(48, 9, '4: 2\u00D73', { font: 'small', record: false });
      scr.text(0, 17, '5: 2\u00D72', { font: 'small', record: false });
      scr.text(48, 17, '6: 2\u00D71', { font: 'small', record: false });
      scr.lines = [
        '1: 3×3   2: 3×2',
        '3: 3×1   4: 2×3',
        '5: 2×2   6: 2×1'
      ];
    } else {
      scr.text(0, 1, '1: 1\u00D73', { font: 'small', record: false });
      scr.text(48, 1, '2: 1\u00D72', { font: 'small', record: false });
      scr.text(0, 9, '3: 1\u00D71', { font: 'small', record: false });
      scr.lines = [
        '1: 1×3   2: 1×2',
        '3: 1×1'
      ];
    }
  }
}
