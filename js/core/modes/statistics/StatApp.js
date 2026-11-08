/**
 * Mode 3: Statistics Controller for fx-991ES PLUS 2nd edition.
 */

import { StatModel, STAT_TYPES } from './StatModel.js';
import { StatEditorView } from './StatEditorView.js';
import { StatCalcApp } from './StatCalcApp.js';
import { toCalcError } from '../../errors.js';
import { MessageView } from '../../ui/views.js';
import './tokens.js';

export class StatTypeMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(app) {
    this.app = app;
    this.calc = app.calc;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      if (this.app.typeSelected) {
        this.app.showEditor();
        this.calc.closeAllOverlays();
        return true;
      }
      return true;
    }
    if (k >= '1' && k <= '8') {
      const type = Number(k);
      this.app.model.setType(type);
      this.app.typeSelected = true;
      this.app.showEditor();
      this.calc.closeAllOverlays();
      return true;
    }
    return true;
  }

  indicators(set) {
    // STAT indicator is active via calc.indicators()
  }

  render(scr) {
    scr.clear();
    // Regression letters are drawn as the ES's special small capitals (User's Guide capture).
    scr.text(0, 1, '1:1-VAR', { font: 'small' });
    scr.text(48, 1, '2:ᴀ+ʙX', { font: 'small' });
    scr.text(0, 9, '3:_+ᴄX²', { font: 'small' });
    scr.text(48, 9, '4:ln X', { font: 'small' });
    scr.text(0, 17, '5:ℯ^X', { font: 'small' });
    scr.text(48, 17, '6:ᴀ\u2022ʙ^X', { font: 'small' });
    scr.text(0, 25, '7:ᴀ\u2022X^ʙ', { font: 'small' });
    scr.text(48, 25, '8:1/X', { font: 'small' });
    scr.lines = [
      '1:1-VAR   2:A+BX',
      '3:_+CX²   4:ln X',
      '5:e^X     6:A•B^X',
      '7:A•X^B   8:1/X'
    ];
  }
}

export class StatApp {
  constructor(calc) {
    this.calc = calc;
    this.title = 'Statistics';
    this.model = new StatModel();
    this.model.setFreq(calc.setup.statFreq);
    this.editorView = new StatEditorView(this);
    this.calcApp = new StatCalcApp(this);
    this.modePhase = 'select_type'; // 'select_type' | 'editor' | 'calc'
    this.typeSelected = false;
    this.selectTypeView = new StatTypeMenuView(this);
  }

  showError(err) {
    const error = toCalcError(err);
    this.calc.pushView(
      new MessageView(this.calc, [error.message, null, '[AC]  :Cancel'], {
        closeKeys: ['AC'],
        onClose: () => {
          this.calc.closeView();
        }
      })
    );
  }

  onEnter() {
    this.model.clear();
    this.typeSelected = false;
    this.modePhase = 'select_type';
    this.selectTypeView = new StatTypeMenuView(this);
    this.editorView.reset();
    this.calcApp.reset();
  }

  onExit() {
    // Exiting Statistics mode deletes data
    this.model.clear();
    this.typeSelected = false;
    this.calcApp.clearHistory?.();
    this.calcApp.reset?.();
  }

  onSetupChanged() {
    this.model.setFreq(this.calc.setup.statFreq);
    this.calcApp.onSetupChanged?.();
  }

  notify(event) {
    if (event === 'powerOff' || event === 'memoryCleared') {
      this.model.clear();
      this.typeSelected = false;
      this.modePhase = 'select_type';
      this.selectTypeView = new StatTypeMenuView(this);
    }
  }

  reset() {
    // ON key resets view/input but keeps dataset
    if (this.modePhase === 'calc') {
      this.calcApp.reset();
    } else if (this.modePhase === 'editor') {
      this.editorView.reset();
    } else {
      this.selectTypeView = new StatTypeMenuView(this);
    }
  }

  showSelectType() {
    this.modePhase = 'select_type';
    this.selectTypeView = new StatTypeMenuView(this);
  }

  showEditor() {
    this.modePhase = 'editor';
  }

  showCalcScreen() {
    this.modePhase = 'calc';
  }

  selectTypeMenu() {
    return new StatTypeMenuView(this);
  }

  onKey(ev) {
    if (this.modePhase === 'select_type') {
      if (!this.selectTypeView) {
        this.selectTypeView = new StatTypeMenuView(this);
      }
      return this.selectTypeView.onKey(ev);
    }
    if (this.modePhase === 'editor') {
      return this.editorView.onKey(ev);
    }
    if (this.modePhase === 'calc') {
      return this.calcApp.onKey(ev);
    }
    return false;
  }

  isMenuScreen() {
    return this.modePhase === 'select_type'; // the STAT type menu shows no status icons
  }

  indicators(set) {
    if (this.modePhase === 'select_type') {
      if (!this.selectTypeView) this.selectTypeView = new StatTypeMenuView(this);
      this.selectTypeView.indicators(set);
    } else if (this.modePhase === 'editor') {
      this.editorView.indicators(set);
    } else if (this.modePhase === 'calc') {
      this.calcApp.indicators(set);
    }
  }

  render(scr) {
    if (this.modePhase === 'select_type') {
      if (!this.selectTypeView) this.selectTypeView = new StatTypeMenuView(this);
      this.selectTypeView.render(scr);
    } else if (this.modePhase === 'editor') {
      this.editorView.render(scr);
    } else if (this.modePhase === 'calc') {
      this.calcApp.render(scr);
    }
  }
}
