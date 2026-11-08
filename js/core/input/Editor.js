/**
 * Expression input buffer: a tree of tokens and templates with a cursor.
 *
 * A slot is an array of items:
 *   { t: 'tok', id }                         token from tokens.js
 *   { t: 'tpl', kind, slots: [[...], ...] }  template (MathI only), slot order = cursor order
 * The cursor is { path: [{ i, s }, ...], idx }: starting at the root slot, each path step
 * enters item i, slot s. idx is the position inside the innermost slot.
 */

import { TOKENS, TEMPLATES, MAX_INPUT_BYTES, INPUT_WARNING_BYTES } from './tokens.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

export class Editor {
  constructor({ math = true, maxBytes = MAX_INPUT_BYTES } = {}) {
    this.math = math;
    this.maxBytes = maxBytes;
    this.root = [];
    this.path = [];
    this.idx = 0;
    this.overwrite = false; // LineI overwrite mode (SHIFT DEL)
    this.insWrap = false; // MathI INS: next template takes the term right of the cursor
    this.undoState = null;
  }

  // ---------- state ----------

  clear() {
    this.root = [];
    this.path = [];
    this.idx = 0;
    this.insWrap = false;
    this.undoState = null;
  }

  isEmpty() {
    return this.root.length === 0;
  }

  snapshot() {
    return { root: clone(this.root), path: clone(this.path), idx: this.idx };
  }

  restore(snap) {
    this.root = clone(snap.root);
    this.path = clone(snap.path || []);
    this.idx = snap.idx ?? this.root.length;
    this.insWrap = false;
  }

  setItems(items, cursorAtEnd = true) {
    this.root = clone(items);
    this.path = [];
    this.idx = cursorAtEnd ? this.root.length : 0;
    this.insWrap = false;
  }

  _saveUndo() {
    if (this.math) this.undoState = this.snapshot();
  }

  /** ALPHA DEL (MathI): undo the last edit; pressing again redoes it. */
  undo() {
    if (!this.math || !this.undoState) return false;
    const current = this.snapshot();
    this.restore(this.undoState);
    this.undoState = current;
    return true;
  }

  // ---------- navigation helpers ----------

  slotAt(path) {
    let list = this.root;
    for (const step of path) list = list[step.i].slots[step.s];
    return list;
  }

  get slot() {
    return this.slotAt(this.path);
  }

  /** The template item that owns path step k. */
  templateAt(k) {
    return this.slotAt(this.path.slice(0, k))[this.path[k].i];
  }

  static itemBytes(item) {
    if (item.t === 'tok') return TOKENS[item.id] ? TOKENS[item.id].bytes : 1;
    if (item.t === 'tpl') {
      let b = TEMPLATES[item.kind] ? TEMPLATES[item.kind].bytes : 2;
      for (const s of item.slots) for (const it of s) b += Editor.itemBytes(it);
      return b;
    }
    return 0;
  }

  bytes() {
    let b = 0;
    for (const it of this.root) b += Editor.itemBytes(it);
    return b;
  }

  remainingBytes() {
    return this.maxBytes - this.bytes();
  }

  /** 'line' normally, 'block' when 10 bytes or less remain, 'overwrite' in LineI overwrite mode. */
  cursorShape() {
    if (this.remainingBytes() <= INPUT_WARNING_BYTES) return 'block';
    if (!this.math && this.overwrite) return 'overwrite';
    return 'line';
  }

  // ---------- editing ----------

  _isPowerItem(item) {
    if (!item) return false;
    return item.t === 'tok' && ['sq', 'cube', 'inv'].includes(item.id);
  }

  static itemsHeight(items) {
    let maxH = 10;
    for (const it of items) {
      if (it.t === 'tpl') {
        let h = 10;
        if (it.kind === 'frac') {
          h = Editor.itemsHeight(it.slots[0]) + Editor.itemsHeight(it.slots[1]) + 5;
        } else if (it.kind === 'mixed') {
          h = Math.max(Editor.itemsHeight(it.slots[0]), Editor.itemsHeight(it.slots[1]) + Editor.itemsHeight(it.slots[2]) + 5);
        } else if (it.kind === 'sqrt' || it.kind === 'cbrt' || it.kind === 'root') {
          h = Editor.itemsHeight(it.slots[it.slots.length - 1]) + 6;
        } else if (it.kind === 'pow') {
          h = 10 + Editor.itemsHeight(it.slots[0]);
        } else if (it.kind === 'integral' || it.kind === 'sum') {
          h = 24 + Math.max(Editor.itemsHeight(it.slots[1]), Editor.itemsHeight(it.slots[2]));
        } else if (it.kind === 'diff') {
          h = 24 + Editor.itemsHeight(it.slots[1]);
        } else {
          for (const s of it.slots) h = Math.max(h, Editor.itemsHeight(s));
        }
        maxH = Math.max(maxH, h);
      }
    }
    return maxH;
  }

  formulaHeight() {
    return Editor.itemsHeight(this.root);
  }

  insertToken(id) {
    if (!TOKENS[id]) throw new Error(`Unknown token ${id}`);
    const slot = this.slot;

    // Consecutive powers rule: x², x³, x⁻¹, x^■ cannot follow each other directly
    if (['sq', 'cube', 'inv'].includes(id)) {
      if (this.idx === 0 || this._isPowerItem(slot[this.idx - 1])) {
        return false;
      }
    }

    const item = { t: 'tok', id };
    const replacing = !this.math && this.overwrite && this.idx < slot.length;
    const cost = TOKENS[id].bytes - (replacing ? Editor.itemBytes(slot[this.idx]) : 0);
    if (this.bytes() + cost > this.maxBytes) return false;
    this._saveUndo();
    if (replacing) slot[this.idx] = item;
    else slot.splice(this.idx, 0, item);
    this.idx++;
    this.insWrap = false;
    return true;
  }

  insertTokens(ids) {
    for (const id of ids) if (!this.insertToken(id)) return false;
    return true;
  }

  insertTemplate(kind) {
    const def = TEMPLATES[kind];
    if (!def) throw new Error(`Unknown template ${kind}`);
    const slot = this.slot;

    // Consecutive powers rule: x², x³, x⁻¹, x^■ cannot follow each other directly
    if (kind === 'pow') {
      if (this.idx === 0 || this._isPowerItem(slot[this.idx - 1])) {
        return false;
      }
    }

    if (this.bytes() + def.bytes > this.maxBytes) return false;
    this._saveUndo();
    const tpl = { t: 'tpl', kind, slots: def.slots.map(() => []) };

    if (this.insWrap) {
      this.insWrap = false;
      const n = this._termLengthRight(slot, this.idx);
      if (n > 0) {
        const arg = slot.splice(this.idx, n);
        const argSlot = { frac: 0, mixed: 0, root: 1, logab: 1, pow: 0, pow10: 0, expe: 0, integral: 0, diff: 0, sum: 0, abs: 0, sqrt: 0, cbrt: 0 }[kind] ?? 0;
        tpl.slots[argSlot] = arg;
        slot.splice(this.idx, 0, tpl);

        // Height check: max formula height 2 screens (62 dots)
        if (this.math && this.formulaHeight() > 62) {
          this.undo();
          return false;
        }

        const empty = tpl.slots.findIndex((s) => s.length === 0);
        if (empty >= 0) {
          this.path.push({ i: this.idx, s: empty });
          this.idx = 0;
        } else {
          this.idx++;
        }
        return true;
      }
    }

    if (!this.insWrap && kind === 'frac' && this.idx > 0) {
      const leftLen = this._termLengthLeft(slot, this.idx);
      if (leftLen > 0) {
        const arg = slot.splice(this.idx - leftLen, leftLen);
        this.idx -= leftLen;
        tpl.slots[0] = arg;
        slot.splice(this.idx, 0, tpl);

        if (this.math && this.formulaHeight() > 62) {
          this.undo();
          return false;
        }

        this.path.push({ i: this.idx, s: 1 });
        this.idx = 0;
        return true;
      }
    }

    this.insWrap = false;
    slot.splice(this.idx, 0, tpl);

    // Height check: max formula height 2 screens (62 dots)
    if (this.math && this.formulaHeight() > 62) {
      this.undo();
      return false;
    }

    this.path.push({ i: this.idx, s: 0 });
    this.idx = 0;
    return true;
  }

  /** Number of items forming the term that starts at slot[idx] (for INS wrapping). */
  _termLengthRight(slot, idx) {
    const first = slot[idx];
    if (!first) return 0;
    let len = 0;
    if (first.t === 'tpl') {
      len = 1;
    } else {
      const tok = TOKENS[first.id];
      if (!tok) return 0;
      if (tok.kind === 'digit' || tok.kind === 'dot') {
        let n = 0;
        while (idx + n < slot.length) {
          const it = slot[idx + n];
          if (it.t !== 'tok') break;
          const k = TOKENS[it.id].kind;
          if (k === 'digit' || k === 'dot' || k === 'exp10') n++;
          else if (k === 'neg' && n > 0 && TOKENS[slot[idx + n - 1].id].kind === 'exp10') n++;
          else break;
        }
        len = n;
      } else if (tok.kind === 'open' || tok.kind === 'func') {
        let depth = 0;
        for (let n = 0; idx + n < slot.length; n++) {
          const it = slot[idx + n];
          if (it.t !== 'tok') continue;
          const k = TOKENS[it.id].kind;
          if (k === 'open' || k === 'func' || k === 'pow' || k === 'xroot') depth++;
          else if (k === 'close') {
            depth--;
            if (depth === 0) {
              len = n + 1;
              break;
            }
          }
        }
        if (len === 0) len = slot.length - idx;
      } else if (tok.kind === 'value') {
        len = 1;
      }
    }

    if (len === 0) return 0;

    // Include any trailing postfix operators (e.g. ², ³, ⁻¹, !, %, pow template)
    while (idx + len < slot.length) {
      const next = slot[idx + len];
      if (next.t === 'tok' && TOKENS[next.id]?.kind === 'post') {
        len++;
      } else if (next.t === 'tpl' && next.kind === 'pow') {
        len++;
      } else {
        break;
      }
    }
    return len;
  }

  /** Number of items forming the term ending at slot[idx - 1] (for fraction auto-wrapping). */
  _termLengthLeft(slot, idx) {
    if (idx <= 0) return 0;
    const last = slot[idx - 1];
    if (!last) return 0;
    if (last.t === 'tpl') {
      return 1;
    }
    const tok = TOKENS[last.id];
    if (!tok) return 0;

    // Digits or dot
    if (tok.kind === 'digit' || tok.kind === 'dot' || tok.kind === 'exp10') {
      let n = 0;
      while (idx - 1 - n >= 0) {
        const it = slot[idx - 1 - n];
        if (it.t !== 'tok') break;
        const k = TOKENS[it.id]?.kind;
        if (k === 'digit' || k === 'dot' || k === 'exp10') n++;
        else if (k === 'neg' && idx - 1 - n > 0 && TOKENS[slot[idx - 2 - n]?.id]?.kind === 'exp10') n++;
        else break;
      }
      return n;
    }

    // Closing parenthesis
    if (tok.kind === 'close') {
      let depth = 0;
      for (let n = 1; idx - n >= 0; n++) {
        const it = slot[idx - n];
        if (it.t !== 'tok') continue;
        const k = TOKENS[it.id]?.kind;
        if (k === 'close') depth++;
        else if (k === 'open' || k === 'func' || k === 'pow' || k === 'xroot') {
          depth--;
          if (depth === 0) return n;
        }
      }
      return 0;
    }

    // Value token (pi, e, var, Ans)
    if (tok.kind === 'value') {
      return 1;
    }

    return 0;
  }

  /** SHIFT DEL: MathI → wrap next template around the term; LineI → toggle overwrite. */
  toggleIns() {
    if (this.math) this.insWrap = !this.insWrap;
    else this.overwrite = !this.overwrite;
  }

  del() {
    const slot = this.slot;
    if (!this.math && this.overwrite && this.idx < slot.length) {
      this._saveUndo();
      slot.splice(this.idx, 1);
      return true;
    }
    if (this.idx > 0) {
      this._saveUndo();
      slot.splice(this.idx - 1, 1);
      this.idx--;
      return true;
    }
    if (this.path.length === 0) return false;
    // At the start of a slot
    const k = this.path.length - 1;
    const step = this.path[k];
    const tpl = this.templateAt(k);
    const parentSlot = this.slotAt(this.path.slice(0, k));
    const others = tpl.slots.filter((s, j) => j !== step.s);
    if (tpl.slots.every((s) => s.length === 0)) {
      this._saveUndo();
      parentSlot.splice(step.i, 1);
      this.path.pop();
      this.idx = step.i;
      return true;
    }
    if (step.s === 0 && others.every((s) => s.length === 0)) {
      // Remove the template, keep the contents of its first slot
      this._saveUndo();
      const contents = tpl.slots[0];
      parentSlot.splice(step.i, 1, ...contents);
      this.path.pop();
      this.idx = step.i;
      return true;
    }
    return false;
  }

  // ---------- cursor movement ----------

  right() {
    const slot = this.slot;
    if (this.idx < slot.length) {
      const item = slot[this.idx];
      if (item.t === 'tpl') {
        this.path.push({ i: this.idx, s: 0 });
        this.idx = 0;
      } else {
        this.idx++;
      }
      return;
    }
    if (this.path.length === 0) {
      this.idx = 0; // wrap to the start
      return;
    }
    const k = this.path.length - 1;
    const step = this.path[k];
    const tpl = this.templateAt(k);
    if (step.s + 1 < tpl.slots.length) {
      step.s++;
      this.idx = 0;
    } else {
      this.path.pop();
      this.idx = step.i + 1;
    }
  }

  left() {
    const slot = this.slot;
    if (this.idx > 0) {
      const item = slot[this.idx - 1];
      if (item.t === 'tpl') {
        const s = item.slots.length - 1;
        this.path.push({ i: this.idx - 1, s });
        this.idx = item.slots[s].length;
      } else {
        this.idx--;
      }
      return;
    }
    if (this.path.length === 0) {
      this.idx = this.root.length; // wrap to the end
      return;
    }
    const k = this.path.length - 1;
    const step = this.path[k];
    if (step.s > 0) {
      step.s--;
      this.idx = this.slot.length;
    } else {
      this.path.pop();
      this.idx = step.i;
    }
  }

  /** Jump out of the innermost template (to the right or left). */
  exitTemplate(toRight = true) {
    if (this.path.length === 0) {
      this.idx = toRight ? this.root.length : 0;
      return;
    }
    const step = this.path.pop();
    this.idx = toRight ? step.i + 1 : step.i;
  }

  home() {
    this.path = [];
    this.idx = 0;
  }

  end() {
    this.path = [];
    this.idx = this.root.length;
  }

  /** Vertical move between slots. Returns false when no template allows it. */
  vertical(dir) {
    const MOVES = {
      frac: { up: { 1: 0 }, down: { 0: 1 } },
      mixed: { up: { 2: 1 }, down: { 0: 2, 1: 2 } },
      integral: { up: { 0: 2, 1: 0 }, down: { 0: 1, 2: 0 } },
      sum: { up: { 0: 2, 1: 0 }, down: { 0: 1, 2: 0 } }
    };
    for (let k = this.path.length - 1; k >= 0; k--) {
      const tpl = this.templateAt(k);
      const table = MOVES[tpl.kind];
      if (!table) continue;
      const target = table[dir][this.path[k].s];
      if (target === undefined) continue;
      this.path = this.path.slice(0, k + 1);
      this.path[k].s = target;
      this.idx = Math.min(this.idx, this.slot.length);
      return true;
    }
    return false;
  }

  /** Cursor location object (for error positions). */
  location() {
    return { path: clone(this.path), idx: this.idx };
  }

  setLocation(loc) {
    if (!loc) {
      this.end();
      return;
    }
    try {
      this.path = clone(loc.path || []);
      const slot = this.slotAt(this.path);
      this.idx = Math.max(0, Math.min(loc.idx ?? slot.length, slot.length));
    } catch {
      this.end();
    }
  }

  toJSON() {
    return { math: this.math, root: this.root, path: this.path, idx: this.idx, overwrite: this.overwrite };
  }

  static fromJSON(o) {
    const e = new Editor({ math: o.math !== false });
    e.root = o.root || [];
    e.path = o.path || [];
    e.idx = o.idx ?? e.root.length;
    e.overwrite = !!o.overwrite;
    try {
      e.slotAt(e.path);
    } catch {
      e.end();
    }
    return e;
  }
}
