/**
 * Memory system: Ans and variables A, B, C, D, E, F, M, X, Y (case-insensitive in input,
 * stored upper-case). M is independent memory (M+, M-, RCL M).
 *
 * The fx-991ES PLUS has no PreAns.
 *
 * Mode data (matrices, vectors, statistics, table functions) lives in
 * `modeData`, keyed by mode, and follows the clearing rules in docs/spec/memory.md.
 */

import { ExactValue } from './exact/ExactValue.js';
import { Rational } from './exact/Rational.js';
import { SurdForm } from './exact/SurdForm.js';
import { PiForm } from './exact/PiForm.js';
import { Decimal15 } from './number/Decimal15.js';

export const VARIABLES = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'X', 'Y'];

export class Memory {
  constructor() {
    this.clear();
  }

  clear() {
    this.ans = ExactValue.fromInt(0n);
    this.vars = {};
    for (const v of VARIABLES) this.vars[v] = ExactValue.fromInt(0n);
    this.modeData = {};
  }

  getAns() {
    return this.ans;
  }

  setAns(v) {
    this.ans = v;
  }

  get(name) {
    if (name === 'Ans') return this.getAns();
    return this.getVar(name);
  }

  set(name, v) {
    if (name === 'Ans') return this.setAns(v);
    return this.setVar(name, v);
  }

  getVar(name) {
    const k = String(name).toUpperCase();
    if (k in this.vars) return this.vars[k];
    throw new Error(`Unknown variable: ${name}`);
  }

  setVar(name, v) {
    const k = String(name).toUpperCase();
    if (k in this.vars) {
      this.vars[k] = v;
      return;
    }
    throw new Error(`Unknown variable: ${name}`);
  }

  clearVars() {
    for (const v of VARIABLES) this.vars[v] = ExactValue.fromInt(0n);
  }

  isMNonZero() {
    const m = this.vars.M;
    if (!m) return false;
    return !m.toDecimal15().isZero();
  }

  exportState() {
    const vars = {};
    for (const v of VARIABLES) vars[v] = serialize(this.vars[v]);
    return { ans: serialize(this.ans), vars, modeData: this.modeData };
  }

  toJSON() {
    return this.exportState();
  }

  static fromJSON(o) {
    return Memory.importState(o);
  }

  static importState(o) {
    const m = new Memory();
    m.ans = deserialize(o.ans) ?? m.ans;
    for (const v of VARIABLES) {
      const val = deserialize(o.vars && o.vars[v]);
      if (val) m.vars[v] = val;
    }
    m.modeData = o.modeData || {};
    return m;
  }
}

export function serialize(v) {
  if (!v || !(v instanceof ExactValue)) return null;
  switch (v.type) {
    case 'rational': return { type: 'rational', n: v.value.n.toString(), d: v.value.d.toString() };
    case 'surd': {
      const terms = [];
      if (v.value.terms) {
        for (const [rad, coeff] of v.value.terms.entries()) {
          terms.push([rad.toString(), coeff.n.toString(), coeff.d.toString()]);
        }
      }
      return {
        type: 'surd',
        constant: [v.value.constant.n.toString(), v.value.constant.d.toString()],
        terms,
      };
    }
    case 'pi': return { type: 'pi', n: v.value.q.n.toString(), d: v.value.q.d.toString(), p: v.value.pow };
    case 'decimal': return { type: 'decimal', s: v.toDecimal15().toString() };
    default: return null;
  }
}

export function deserialize(o) {
  if (!o || !o.type) return null;
  switch (o.type) {
    case 'rational': return ExactValue.fromRational(BigInt(o.n), BigInt(o.d));
    case 'surd': {
      const c = new Rational(BigInt(o.constant[0]), BigInt(o.constant[1]));
      const terms = (o.terms || []).map(([s, n, d]) => ({
        radicand: BigInt(s),
        coeff: new Rational(BigInt(n), BigInt(d)),
      }));
      return ExactValue.fromSurd(new SurdForm(c, terms));
    }
    case 'pi': return ExactValue.fromPi(new PiForm(new Rational(BigInt(o.n), BigInt(o.d)), o.p));
    case 'decimal': {
      const d = Decimal15.fromString(o.s);
      return new ExactValue('decimal', d, d);
    }
    default: return null;
  }
}
