/**
 * System screens: MODE menu, Calculator ID (MODE 0), SETUP, RESET, Contrast.
 */

import { MenuView, ConfirmView, MessageView, DigitPromptView } from '../ui/views.js';
import { MODES } from '../modes/registry.js';
import { defaultSetup } from '../setup.js';
import { ROW_PITCH } from '../ui/Screen.js';
import { encodeQR } from '../qr/qrcode.js';

export const DEMO_CALCULATOR_ID = 'DEMO-991ES-PLUS2-0000001';
export const DEMO_QR_TEXT = 'fx-991ES PLUS 2nd ed - DEMO';

// ------------------------------------------------------------------ MODE MENU

export class ModeMenuView {
  constructor(calc) {
    this.calc = calc;
    this.isOverlay = true;
    this.isMainMenu = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC' || k === 'MODE' || k === 'MENU') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k >= '1' && k <= '8') {
      this.calc.setMode(Number(k));
      return true;
    }
    if (k === '0') {
      this.calc.replaceView(new CalculatorIdView(this.calc, this));
      return true;
    }
    return true;
  }

  indicators(set) {
    set.clear();
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:COMP', { font: 'small' });
    scr.text(48, 1, '2:CMPLX', { font: 'small' });
    scr.text(0, 9, '3:STAT', { font: 'small' });
    scr.text(48, 9, '4:BASE-N', { font: 'small' });
    scr.text(0, 17, '5:EQN', { font: 'small' });
    scr.text(48, 17, '6:MATRIX', { font: 'small' });
    scr.text(0, 25, '7:TABLE', { font: 'small' });
    scr.text(48, 25, '8:VECTOR', { font: 'small' });
    scr.lines = [
      '1:COMP   2:CMPLX',
      '3:STAT   4:BASE-N',
      '5:EQN    6:MATRIX',
      '7:TABLE  8:VECTOR'
    ];
  }
}

export { ModeMenuView as MainMenuView };

// ------------------------------------------------------------------ CALCULATOR ID (MODE 0)

export class CalculatorIdView {
  constructor(calc, parent = null) {
    this.calc = calc;
    this.parent = parent;
    this.isOverlay = true;
    this.idText = DEMO_CALCULATOR_ID;
    this.qr = encodeQR(DEMO_QR_TEXT, { ecLevel: 'L' });
  }

  onKey(ev) {
    const k = ev.key;
    if (k === 'AC') {
      if (this.parent) {
        this.calc.replaceView(this.parent);
      } else {
        this.calc.closeAllOverlays();
      }
      return true;
    }
    if (k === 'ON') {
      this.calc.closeAllOverlays();
      return true;
    }
    return true;
  }

  indicators(set) {
    set.clear();
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, 'DEMO ID:', { font: 'small' });
    scr.text(0, 9, 'DEMO-991ES-', { font: 'small' });
    scr.text(0, 17, 'PLUS2-0000001', { font: 'small' });

    const qx = 68;
    const qy = 3;
    const size = this.qr.size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.qr.modules[r * size + c]) {
          scr.fb.set(qx + c, qy + r, 1);
        }
      }
    }
    scr.lines = [this.idText, '[QR Code]'];
  }
}

// ------------------------------------------------------------------ SETUP

export class SetupMenuView {
  constructor(calc, page = 0) {
    this.calc = calc;
    this.page = page; // 0 = Page 1, 1 = Page 2
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'DOWN') {
      this.page = (this.page + 1) % 2;
      return true;
    }
    if (k === 'UP') {
      this.page = (this.page + 1) % 2;
      return true;
    }

    if (this.page === 0) {
      switch (k) {
        case '1':
          this.calc.replaceView(new MthIOSubMenuView(this.calc, this));
          return true;
        case '2':
          this.calc.setInputOutput('LineI/LineO');
          this.calc.closeAllOverlays();
          this.calc.setupChanged();
          return true;
        case '3':
          this.calc.setup.angle = 'DEG';
          this.calc.closeAllOverlays();
          this.calc.setupChanged();
          return true;
        case '4':
          this.calc.setup.angle = 'RAD';
          this.calc.closeAllOverlays();
          this.calc.setupChanged();
          return true;
        case '5':
          this.calc.setup.angle = 'GRA';
          this.calc.closeAllOverlays();
          this.calc.setupChanged();
          return true;
        case '6':
          this.calc.replaceView(new DigitPromptView(this.calc, 'Fix 0~9?', 0, 9, (n, c) => {
            c.setup.numberFormat = { type: 'FIX', value: n };
            c.closeAllOverlays();
            c.setupChanged();
          }, { parent: this }));
          return true;
        case '7':
          this.calc.replaceView(new DigitPromptView(this.calc, 'Sci 0~9?', 0, 9, (n, c) => {
            c.setup.numberFormat = { type: 'SCI', value: n };
            c.closeAllOverlays();
            c.setupChanged();
          }, { parent: this }));
          return true;
        case '8':
          this.calc.replaceView(new DigitPromptView(this.calc, 'Norm 1~2?', 1, 2, (n, c) => {
            c.setup.numberFormat = { type: 'NORM', value: n };
            c.closeAllOverlays();
            c.setupChanged();
          }, { parent: this }));
          return true;
      }
    } else {
      switch (k) {
        case '1':
          this.calc.setup.fraction = 'MIXED';
          this.calc.closeAllOverlays();
          this.calc.setupChanged();
          return true;
        case '2':
          this.calc.setup.fraction = 'IMPROPER';
          this.calc.closeAllOverlays();
          this.calc.setupChanged();
          return true;
        case '3':
          this.calc.replaceView(new CmplxSubMenuView(this.calc, this));
          return true;
        case '4':
          this.calc.replaceView(new StatSubMenuView(this.calc, this));
          return true;
        case '5':
          this.calc.replaceView(new DispSubMenuView(this.calc, this));
          return true;
        case '6':
          this.calc.replaceView(new ContrastView(this.calc, this));
          return true;
      }
    }
    return true;
  }

  indicators(set) {
    if (this.page === 0) {
      set.add('▼');
      set.add('Down');
    } else {
      set.add('▲');
      set.add('Up');
    }
  }

  render(scr) {
    scr.clear();
    if (this.page === 0) {
      scr.text(0, 1, '1:MthIO', { font: 'small' });
      scr.text(48, 1, '2:LineIO', { font: 'small' });
      scr.text(0, 9, '3:Deg', { font: 'small' });
      scr.text(48, 9, '4:Rad', { font: 'small' });
      scr.text(0, 17, '5:Gra', { font: 'small' });
      scr.text(48, 17, '6:Fix', { font: 'small' });
      scr.text(0, 25, '7:Sci', { font: 'small' });
      scr.text(48, 25, '8:Norm', { font: 'small' });
      scr.lines = [
        '1:MthIO 2:LineIO',
        '3:Deg 4:Rad',
        '5:Gra 6:Fix',
        '7:Sci 8:Norm'
      ];
    } else {
      scr.text(0, 1, '1:ab/c', { font: 'small' });
      scr.text(48, 1, '2:d/c', { font: 'small' });
      scr.text(0, 9, '3:CMPLX', { font: 'small' });
      scr.text(48, 9, '4:STAT', { font: 'small' });
      scr.text(0, 17, '5:Disp', { font: 'small' });
      scr.text(48, 17, '6:◀CONT▶', { font: 'small' });
      scr.lines = [
        '1:ab/c 2:d/c',
        '3:CMPLX 4:STAT',
        '5:Disp 6:◀CONT▶'
      ];
    }
  }
}

export class MthIOSubMenuView {
  constructor(calc, parent) {
    this.calc = calc;
    this.parent = parent;
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'LEFT' && this.parent) {
      this.calc.replaceView(this.parent);
      return true;
    }
    if (k === '1') {
      this.calc.setInputOutput('MathI/MathO');
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    if (k === '2') {
      this.calc.setInputOutput('MathI/DecimalO');
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    return true;
  }
  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:MathO', { font: 'small' });
    scr.text(48, 1, '2:LineO', { font: 'small' });
    scr.lines = ['1:MathO', '2:LineO'];
  }
}

export class CmplxSubMenuView {
  constructor(calc, parent) {
    this.calc = calc;
    this.parent = parent;
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'LEFT' && this.parent) {
      this.calc.replaceView(this.parent);
      return true;
    }
    if (k === '1') {
      this.calc.setup.complex = 'RECT';
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    if (k === '2') {
      this.calc.setup.complex = 'POLAR';
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    return true;
  }
  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:a+bi', { font: 'small' });
    scr.text(48, 1, '2:r∠θ', { font: 'small' });
    scr.lines = ['1:a+bi', '2:r∠θ'];
  }
}

export class StatSubMenuView {
  constructor(calc, parent) {
    this.calc = calc;
    this.parent = parent;
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'LEFT' && this.parent) {
      this.calc.replaceView(this.parent);
      return true;
    }
    if (k === '1') {
      if (!this.calc.setup.statFreq) {
        this.calc.setup.statFreq = true;
        this.calc.notifyMode('statFreqChanged');
      }
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    if (k === '2') {
      if (this.calc.setup.statFreq) {
        this.calc.setup.statFreq = false;
        this.calc.notifyMode('statFreqChanged');
      }
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    return true;
  }
  render(scr) {
    scr.clear();
    scr.text(0, 1, 'Stat Format', { font: 'small' });
    scr.text(0, 9, '1:ON', { font: 'small' });
    scr.text(48, 9, '2:OFF', { font: 'small' });
    scr.lines = ['Stat Format', '1:ON 2:OFF'];
  }
}

export class DispSubMenuView {
  constructor(calc, parent) {
    this.calc = calc;
    this.parent = parent;
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'LEFT' && this.parent) {
      this.calc.replaceView(this.parent);
      return true;
    }
    if (k === '1') {
      this.calc.setup.decimalMark = 'DOT';
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    if (k === '2') {
      this.calc.setup.decimalMark = 'COMMA';
      this.calc.closeAllOverlays();
      this.calc.setupChanged();
      return true;
    }
    return true;
  }
  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:Dot', { font: 'small' });
    scr.text(48, 1, '2:Comma', { font: 'small' });
    scr.lines = ['1:Dot', '2:Comma'];
  }
}

/** Contrast: ◀ lighter, ▶ darker, AC/EXE closes. */
export class ContrastView {
  constructor(calc, parent = null) {
    this.calc = calc;
    this.parent = parent;
    this.isOverlay = true;
  }

  onKey(ev) {
    const s = this.calc.setup;
    if (ev.key === 'LEFT') s.contrast = Math.max(0, s.contrast - 1);
    else if (ev.key === 'RIGHT') s.contrast = Math.min(15, s.contrast + 1);
    else if ((ev.key === 'AC' || ev.key === 'EXE' || ev.key === '=') && !ev.shift) {
      this.calc.closeAllOverlays();
    }
    return true;
  }

  indicators(set) {
    set.clear(); // the official CONTRAST screen shows no status icons
  }

  render(scr) {
    scr.clear();
    // Official CONTRAST screen (User's Guide capture): labels only, no slider.
    scr.text(0, 1, 'CONTRAST', { font: 'small' });
    scr.text(0, 17, 'LIGHT', { font: 'small' });
    scr.text(72, 17, 'DARK', { font: 'small' });
    scr.text(6, 25, '[◀]', { font: 'small' });
    scr.text(72, 25, '[▶]', { font: 'small' });
    scr.lines = ['Contrast', `LIGHT ${this.calc.setup.contrast} DARK`];
  }
}

export function setupMenu(calc) {
  return new SetupMenuView(calc);
}

// ------------------------------------------------------------------ RESET

export function resetMenu(calc) {
  const confirm = (question, action, done) => (c) => c.replaceView(new ConfirmView(c, question, (cc) => {
    action(cc);
    cc.replaceView(new MessageView(cc, [done, null, 'Press [AC] Key'], {
      onClose: (c3) => c3.closeAllOverlays()
    }));
  }));
  return new MenuView(calc, [
    { label: 'Setup Data', run: confirm('Reset Setup Data?', (c) => c.resetSetup(), 'Reset Setup Data') },
    { label: 'Memory', run: confirm('Clear All Memory?', (c) => c.resetMemory(), 'Clear Memory') },
    { label: 'Initialize All', run: confirm('Initialize All?', (c) => c.initializeAll(), 'Reset All') }
  ]);
}

export { defaultSetup };
