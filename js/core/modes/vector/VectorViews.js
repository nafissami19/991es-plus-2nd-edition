/**
 * Authentic UI views for Mode 8: Vector on fx-991ES PLUS 2nd edition (96×31 LCD).
 */
import { CalcError, ERRORS } from '../../errors.js';
import { VectorValue } from './VectorValue.js';

/**
 * SHIFT 5 VECTOR Menu:
 * Page 1:
 * 1:Dim    2:Data
 * 3:VctA   4:VctB
 * Page 2:
 * 5:VctC   6:VctAns
 * 7:Dot
 */
export class VectorMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, app) {
    this.calc = calc;
    this.app = app;
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

    // Direct key execution from either page
    if (k === '1') {
      // 1: Dim
      this.calc.replaceView(new VectorVarSelectView(this.calc, this.app, 'dim'));
      return true;
    }
    if (k === '2') {
      // 2: Data
      this.calc.replaceView(new VectorVarSelectView(this.calc, this.app, 'data'));
      return true;
    }
    if (k === '3') {
      this.insertTok('VctA');
      return true;
    }
    if (k === '4') {
      this.insertTok('VctB');
      return true;
    }
    if (k === '5') {
      this.insertTok('VctC');
      return true;
    }
    if (k === '6') {
      this.insertTok('VctAns');
      return true;
    }
    if (k === '7') {
      this.insertTok('dot');
      return true;
    }
    return true;
  }

  insertTok(id) {
    this.calc.closeAllOverlays();
    if (this.app.vectorPhase === 'editor' || this.app.vectorPhase === 'result_vector') {
      this.app.vectorPhase = 'edit';
    }
    this.app.insertInput({ tok: id });
  }

  render(scr) {
    scr.clear();
    if (this.page === 0) {
      scr.text(0, 1, '1:Dim', { font: 'small', record: false });
      scr.text(48, 1, '2:Data', { font: 'small', record: false });
      scr.text(0, 9, '3:VctA', { font: 'small', record: false });
      scr.text(48, 9, '4:VctB', { font: 'small', record: false });
      scr.lines = [
        '1:Dim    2:Data',
        '3:VctA   4:VctB'
      ];
    } else {
      scr.text(0, 1, '5:VctC', { font: 'small', record: false });
      scr.text(48, 1, '6:VctAns', { font: 'small', record: false });
      scr.text(0, 9, '7:Dot', { font: 'small', record: false });
      scr.lines = [
        '5:VctC   6:VctAns',
        '7:Dot'
      ];
    }
  }
}

/**
 * Vector Variable Selection Menu (VctA, VctB, VctC)
 * Used on mode entry and for Dim/Data sub-menus.
 */
export class VectorVarSelectView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, app, action = 'dim') {
    this.calc = calc;
    this.app = app;
    this.action = action; // 'dim' | 'data'
    this.isOverlay = true;
  }

  indicators(set) {}

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    const map = { '1': 'VctA', '2': 'VctB', '3': 'VctC' };
    const name = map[k];
    if (name) {
      if (this.action === 'dim') {
        this.calc.replaceView(new VectorDimSelectView(this.calc, this.app, name));
        return true;
      }
      if (this.action === 'data') {
        const vec = this.app.getVector(name);
        if (!vec || !vec.dim) {
          this.calc.closeAllOverlays();
          this.app.showError(new CalcError(ERRORS.DIMENSION));
          return true;
        }
        this.calc.closeAllOverlays();
        this.app.openEditor(name, vec, false);
        return true;
      }
    }
    return true;
  }

  render(scr) {
    scr.clear();
    // User's Guide capture (MODE 8): "Vector?" then the three variables.
    scr.text(0, 1, 'Vector?', { font: 'small', record: false });
    scr.text(0, 9, '1:VctA', { font: 'small', record: false });
    scr.text(48, 9, '2:VctB', { font: 'small', record: false });
    scr.text(0, 17, '3:VctC', { font: 'small', record: false });
    scr.lines = [
      'Vector?',
      '1:VctA   2:VctB',
      '3:VctC'
    ];
  }
}

/**
 * Dimension Selection Menu (3 or 2)
 * 1: 3
 * 2: 2
 */
export class VectorDimSelectView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, app, targetName = 'VctA') {
    this.calc = calc;
    this.app = app;
    this.targetName = targetName;
    this.isOverlay = true;
  }

  indicators(set) {}

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === '1' || k === '2') {
      const dim = k === '1' ? 3 : 2;
      const vec = new VectorValue(Array(dim).fill(0));
      this.app.setVector(this.targetName, vec);
      this.calc.closeAllOverlays();
      this.app.openEditor(this.targetName, vec, false);
      return true;
    }
    return true;
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, this.targetName, { font: 'small', record: false });
    scr.text(0, 9, '1: 3', { font: 'small', record: false });
    scr.text(0, 17, '2: 2', { font: 'small', record: false });
    scr.lines = [
      this.targetName,
      '1: 3',
      '2: 2'
    ];
  }
}
