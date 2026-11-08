/**
 * Reusable overlay views. A view has onKey(ev) → boolean and render(screen).
 * Overlays are pushed on Calculator's view stack and popped with calc.closeView().
 *
 * Menu layout: up to 4 numbered items per page ("1:Hyperbolic Func"), numbering restarts
 * on each page, ▲/▼ change page, a scroll bar shows when there is more than one page,
 * ◀ goes back from a sub-menu, AC closes. (VERIFY ON EMULATOR: exact spacing/marker.)
 */

import { ROW_PITCH } from './Screen.js';

const DIGIT = (k) => (/^[1-9]$/.test(k) ? Number(k) : null);

export class MenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  /**
   * @param calc Calculator
   * @param items [{ label, run(calc) → any, current?: boolean }]
   * @param o { perPage = 4, parent (MenuView to return to with ◀), title, columns }
   */
  constructor(calc, items, o = {}) {
    this.calc = calc;
    this.items = items || [];
    this.customPages = o.pages || null;
    this.perPage = o.perPage || (o.title ? 3 : 4);
    this.columns = o.columns || 1;
    this.title = o.title || null;
    this.parent = o.parent || null;
    this.page = 0;
    this.isOverlay = true;
    if (!this.customPages) {
      const cur = this.items.findIndex((it) => it.current);
      if (cur >= 0) this.page = Math.floor(cur / (this.perPage * this.columns));
    }
  }

  get pageSize() {
    return this.perPage * this.columns;
  }

  get pages() {
    if (this.customPages) return Math.max(1, this.customPages.length);
    return Math.max(1, Math.ceil(this.items.length / this.pageSize));
  }

  pageItems() {
    if (this.customPages) return this.customPages[this.page] || [];
    const start = this.page * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
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
    if (k === 'DOWN') {
      this.page = (this.page + 1) % this.pages;
      return true;
    }
    if (k === 'UP') {
      this.page = (this.page - 1 + this.pages) % this.pages;
      return true;
    }
    const n = DIGIT(k);
    if (n !== null) {
      const cur = this.pageItems();
      const idx = n - 1;
      if (idx >= 0 && idx < cur.length) {
        cur[idx].run(this.calc, this);
      }
      return true;
    }
    return true; // other keys are ignored while a menu is open
  }

  indicators(set) {
    if (this.pages > 1) {
      if (this.page > 0) set.add('Up');
      if (this.page < this.pages - 1) set.add('Down');
    }
  }

  render(scr) {
    let row = 0;
    if (this.title) {
      scr.row(0, this.title);
      row = 1;
    }
    const list = this.pageItems();
    // ES PLUS menus (User's Guide captures): "1:Type  2:Data" in the small font, rows 8 dots apart,
    // first column at x=0, second column at x=48; extra pages are shown by the ▲/▼ status icons.
    const colW = this.columns === 1 ? 96 : 48;
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (!it) break;
      const r = row + (this.columns === 1 ? i : Math.floor(i / this.columns));
      const c = this.columns === 1 ? 0 : i % this.columns;
      const label = `${i + 1}:${it.label}`;
      scr.text(c * colW, 1 + r * ROW_PITCH, label, { font: 'small', record: false });
      scr.record(1 + r * ROW_PITCH, c * colW, label);
      if (it.current) scr.text(90, 1 + r * ROW_PITCH, '◀', { font: 'small', record: false });
    }
  }
}

export function drawScrollBar(scr, page, pages, firstRow = 0) {
  const top = firstRow * ROW_PITCH + 2;
  const h = 30 - top;
  const x = 93;
  const thumbH = Math.max(8, Math.floor(h / pages));
  const y = top + Math.floor((h - thumbH) * (pages === 1 ? 0 : page / (pages - 1)));
  // Authentic rounded pill scrollbar thumb without full-height vertical line
  scr.fb.fillRect(x, y + 1, 3, thumbH - 2, 1);
  scr.fb.hline(x + 1, x + 1, y);
  scr.fb.hline(x + 1, x + 1, y + thumbH - 1);
}

/** "Reset Setup Data?" style confirmation: [=]:Yes [AC]:Cancel */
export class ConfirmView {
  constructor(calc, question, onYes, o = {}) {
    this.calc = calc;
    this.question = question;
    this.onYes = onYes;
    this.isOverlay = true;
    this.o = o;
  }

  onKey(ev) {
    if (ev.key === 'EXE' && !ev.shift && !ev.alpha) {
      this.onYes(this.calc);
      return true;
    }
    if (ev.key === 'AC' && !ev.shift) {
      this.calc.closeAllOverlays();
      return true;
    }
    return true;
  }

  render(scr) {
    const lines = Array.isArray(this.question) ? this.question : [this.question];
    lines.forEach((l, i) => scr.row(i, l));
    scr.row(2, '[=]  :Yes');
    scr.row(3, '[AC] :Cancel');
  }
}

/** Full-screen message; any listed key closes it. */
export class MessageView {
  constructor(calc, lines, o = {}) {
    this.calc = calc;
    this.lines = lines;
    this.isOverlay = true;
    this.closeKeys = o.closeKeys || ['AC'];
    this.onClose = o.onClose || null;
  }

  onKey(ev) {
    if (this.closeKeys.includes(ev.key) && !ev.shift) {
      if (this.onClose) this.onClose(this.calc, ev);
      else this.calc.closeAllOverlays();
    }
    return true;
  }

  render(scr) {
    this.lines.forEach((l, i) => {
      if (l === null) return;
      if (typeof l === 'object') scr.text(l.x ?? 0, 1 + i * ROW_PITCH, l.s, { font: 'small', ...l });
      else scr.row(i, l);
    });
  }
}

/** One-digit prompt such as "Fix 0~9?" — calls onDigit(n) for n in [min, max]. */
export class DigitPromptView {
  constructor(calc, prompt, min, max, onDigit, o = {}) {
    this.calc = calc;
    this.prompt = prompt;
    this.min = min;
    this.max = max;
    this.onDigit = onDigit;
    this.parent = o.parent || null;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.key === 'AC' && !ev.shift) {
      this.calc.closeAllOverlays();
      return true;
    }
    if (ev.key === 'LEFT' && this.parent && !ev.shift && !ev.alpha) {
      this.calc.replaceView(this.parent);
      return true;
    }
    if (/^[0-9]$/.test(ev.key) && !ev.shift && !ev.alpha) {
      const n = Number(ev.key);
      if (n >= this.min && n <= this.max) this.onDigit(n, this.calc);
    }
    return true;
  }

  render(scr) {
    scr.row(0, this.prompt);
  }
}

export class HypMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, onSelect) {
    this.calc = calc;
    this.onSelect = onSelect;
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeView();
      return true;
    }
    const map = {
      '1': 'sinh',
      '2': 'cosh',
      '3': 'tanh',
      '4': 'asinh',
      '5': 'acosh',
      '6': 'atanh'
    };
    if (map[k]) {
      this.calc.closeView();
      this.onSelect(map[k]);
      return true;
    }
    return true;
  }
  render(scr) {
    scr.row(0, '1:sinh  2:cosh  3:tanh');
    scr.row(1, '4:sinh⁻¹ 5:cosh⁻¹ 6:tanh⁻¹');
  }
}

export class DrgMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, onSelect) {
    this.calc = calc;
    this.onSelect = onSelect;
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeView();
      return true;
    }
    const map = {
      '1': 'deg',
      '2': 'rad',
      '3': 'grad'
    };
    if (map[k]) {
      this.calc.closeView();
      this.onSelect(map[k]);
      return true;
    }
    return true;
  }
  render(scr) {
    scr.row(0, '1:°  2:r  3:g');
  }
}

/**
 * CONSTANT / CONVERSION number prompt (User's Guide captures): title on row 2, "Number 01~40?" on
 * row 10 (small font), and "[__]" in the main font at the bottom right, filled as digits are typed.
 */
function renderNumberPrompt(scr, title, digits) {
  scr.text(0, 2, title, { font: 'small' });
  scr.text(0, 10, 'Number 01~40?', { font: 'small' });
  const slots = (digits + '__').slice(0, 2);
  scr.text(72, 22, `[${slots}]`, { font: 'large' });
}

export class ConstPromptView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, onSelect) {
    this.calc = calc;
    this.onSelect = onSelect;
    this.digits = '';
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeView();
      return true;
    }
    if (k === 'DEL') {
      this.digits = this.digits.slice(0, -1);
      return true;
    }
    if (/^[0-9]$/.test(k)) {
      this.digits += k;
      if (this.digits.length === 2) {
        const num = parseInt(this.digits, 10);
        this.calc.closeView();
        if (num >= 1 && num <= 40) {
          this.onSelect(num);
        }
      }
      return true;
    }
    return true;
  }
  render(scr) {
    renderNumberPrompt(scr, 'CONSTANT', this.digits);
  }
}

export class ConvPromptView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calc, onSelect) {
    this.calc = calc;
    this.onSelect = onSelect;
    this.digits = '';
    this.isOverlay = true;
  }
  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeView();
      return true;
    }
    if (k === 'DEL') {
      this.digits = this.digits.slice(0, -1);
      return true;
    }
    if (/^[0-9]$/.test(k)) {
      this.digits += k;
      if (this.digits.length === 2) {
        const num = parseInt(this.digits, 10);
        this.calc.closeView();
        if (num >= 1 && num <= 40) {
          this.onSelect(num);
        }
      }
      return true;
    }
    return true;
  }
  render(scr) {
    renderNumberPrompt(scr, 'CONVERSION', this.digits);
  }
}
