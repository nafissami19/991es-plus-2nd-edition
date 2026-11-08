/**
 * Equation/Func mode solver (Simultaneous Linear Equations & Polynomials)
 * for Casio fx-991ES PLUS 2nd edition.
 */

import { Rational } from '../../exact/Rational.js';
import { SurdForm } from '../../exact/SurdForm.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { ComplexValue } from '../complex/ComplexValue.js';
import { Decimal15 } from '../../number/Decimal15.js';
import { CalcError, ERRORS } from '../../errors.js';

export function toRational(v) {
  if (v instanceof Rational) return v;
  if (v instanceof ExactValue) {
    if (v.type === 'rational') return v.value;
    if (v.type === 'decimal') return Rational.from(v.value.toString());
    if (v.type === 'surd') return Rational.from(v.toDecimal15().toString());
  }
  return Rational.from(v || 0);
}

export function toSurd(v) {
  if (v instanceof SurdForm) return v;
  if (v instanceof Rational) return SurdForm.from(v);
  if (v instanceof ExactValue) {
    if (v.type === 'surd') return v.value;
    if (v.type === 'rational') return SurdForm.from(v.value);
    if (v.type === 'decimal') return SurdForm.from(Rational.from(v.value.toString()));
  }
  return SurdForm.from(v || 0);
}

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y > 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function getFactors(n) {
  const val = n < 0n ? -n : n;
  if (val === 0n) return [1n];
  const factors = [];
  for (let i = 1n; i * i <= val; i++) {
    if (val % i === 0n) {
      factors.push(i);
      if (i * i !== val) factors.push(val / i);
    }
  }
  return factors;
}

/**
 * Solve simultaneous linear equations using exact Gaussian elimination.
 * Solutions are always rational numbers or decimals, never in surd form.
 * Inconsistent or dependent systems produce Math ERROR on fx-991ES PLUS.
 * @param {Array<Array<any>>} rawCoeffs N x (N+1) coefficient matrix
 * @param {number} N Number of unknowns (2 or 3)
 * @returns {{ type: 'unique', solutions: ExactValue[] }}
 */
export function solveSimultaneous(rawCoeffs, N) {
  const M = [];
  for (let r = 0; r < N; r++) {
    const row = [];
    for (let c = 0; c <= N; c++) {
      row.push(toRational(rawCoeffs[r]?.[c] ?? 0));
    }
    M.push(row);
  }

  let pivotRow = 0;
  for (let col = 0; col < N && pivotRow < N; col++) {
    let sel = -1;
    for (let r = pivotRow; r < N; r++) {
      if (!M[r][col].isZero()) {
        sel = r;
        break;
      }
    }
    if (sel === -1) continue;

    if (sel !== pivotRow) {
      const tmp = M[pivotRow];
      M[pivotRow] = M[sel];
      M[sel] = tmp;
    }

    const p = M[pivotRow][col];
    for (let c = col; c <= N; c++) {
      M[pivotRow][c] = M[pivotRow][c].div(p);
    }

    for (let r = 0; r < N; r++) {
      if (r !== pivotRow && !M[r][col].isZero()) {
        const factor = M[r][col];
        for (let c = col; c <= N; c++) {
          M[r][c] = M[r][c].sub(factor.mul(M[pivotRow][c]));
        }
      }
    }
    pivotRow++;
  }

  // Check consistency
  for (let r = 0; r < N; r++) {
    const allZeros = M[r].slice(0, N).every((c) => c.isZero());
    if (allZeros && !M[r][N].isZero()) {
      throw new CalcError(ERRORS.MATH);
    }
  }

  // Check rank
  let rank = 0;
  for (let r = 0; r < N; r++) {
    if (M[r].slice(0, N).some((c) => !c.isZero())) rank++;
  }
  if (rank < N) {
    throw new CalcError(ERRORS.MATH);
  }

  const solutions = [];
  for (let r = 0; r < N; r++) {
    solutions.push(ExactValue.fromRational(M[r][N].n, M[r][N].d));
  }
  return { type: 'unique', solutions };
}

function approxNum(val) {
  if (val instanceof ComplexValue) {
    return approxNum(val.re);
  }
  if (val instanceof ExactValue) {
    return Number(val.toDecimal15().toString());
  }
  return Number(val);
}

/**
 * Solve quadratic equation ax^2 + bx + c = 0.
 */
export function solveQuadratic(aRaw, bRaw, cRaw, setup) {
  const a = toSurd(aRaw);
  const b = toSurd(bRaw);
  const c = toSurd(cRaw);

  if (a.isZero()) {
    throw new CalcError(ERRORS.MATH);
  }

  const twoA = a.mul(SurdForm.from(2n));
  const b2 = b.mul(b);
  const fourAc = a.mul(c).mul(SurdForm.from(4n));
  const disc = b2.sub(fourAc);

  let roots = [];
  let hasRealRoots = true;

  if (disc.isZero()) {
    // Repeated root
    const xv = b.neg().div(twoA);
    const r = xv.isRational()
      ? ExactValue.fromRational(xv.constant.n, xv.constant.d)
      : ExactValue.fromSurd(xv);
    roots = [r];
  } else if (disc.isRational()) {
    if (disc.constant.n > 0n) {
      const sDisc = SurdForm.sqrt(disc.constant);
      const r1Surd = b.neg().add(sDisc).div(twoA);
      const r2Surd = b.neg().sub(sDisc).div(twoA);
      const r1 = r1Surd.isRational()
        ? ExactValue.fromRational(r1Surd.constant.n, r1Surd.constant.d)
        : ExactValue.fromSurd(r1Surd);
      const r2 = r2Surd.isRational()
        ? ExactValue.fromRational(r2Surd.constant.n, r2Surd.constant.d)
        : ExactValue.fromSurd(r2Surd);
      // Sort real roots descending (larger root first)
      roots = [r1, r2].sort((x, y) => approxNum(y) - approxNum(x));
    } else {
      if (!setup.eqComplex) {
        hasRealRoots = false;
      } else {
        const posDisc = disc.constant.neg();
        const sDisc = SurdForm.sqrt(posDisc);
        const reSurd = b.neg().div(twoA);
        const imSurd = sDisc.div(twoA);
        const re = reSurd.isRational()
          ? ExactValue.fromRational(reSurd.constant.n, reSurd.constant.d)
          : ExactValue.fromSurd(reSurd);
        const im = imSurd.isRational()
          ? ExactValue.fromRational(imSurd.constant.n, imSurd.constant.d)
          : ExactValue.fromSurd(imSurd);
        roots = [new ComplexValue(re, im), new ComplexValue(re, im.neg())];
      }
    }
  } else {
    // Non-rational discriminant (decimal fallback)
    const discDec = disc.toDecimal15 ? disc.toDecimal15() : Decimal15.from(disc.toDecimal15().toString());
    const isPos = discDec.isPositive();
    if (isPos) {
      const sDiscDec = discDec.sqrt();
      const bDec = b.toDecimal15();
      const twoADec = twoA.toDecimal15();
      const r1Dec = bDec.neg().add(sDiscDec).div(twoADec);
      const r2Dec = bDec.neg().sub(sDiscDec).div(twoADec);
      const r1 = ExactValue.fromDecimal(r1Dec);
      const r2 = ExactValue.fromDecimal(r2Dec);
      roots = [r1, r2].sort((x, y) => approxNum(y) - approxNum(x));
    } else {
      if (!setup.eqComplex) {
        hasRealRoots = false;
      } else {
        const sDiscDec = discDec.neg().sqrt();
        const bDec = b.toDecimal15();
        const twoADec = twoA.toDecimal15();
        const re = ExactValue.fromDecimal(bDec.neg().div(twoADec));
        const im = ExactValue.fromDecimal(sDiscDec.div(twoADec));
        roots = [new ComplexValue(re, im), new ComplexValue(re, im.neg())];
      }
    }
  }

  return {
    roots,
    hasRealRoots
  };
}

/**
 * Search for an exact rational root of a polynomial.
 * @param {Rational[]} coeffs [a_n, ..., a_0]
 * @returns {Rational|null}
 */
function findRationalRoot(coeffs) {
  let lcmD = 1n;
  for (const c of coeffs) {
    lcmD = (lcmD * c.d) / gcd(lcmD, c.d);
  }
  const intCoeffs = coeffs.map((c) => (c.n * lcmD) / c.d);
  const n = intCoeffs.length - 1;
  const lead = intCoeffs[0];
  const tail = intCoeffs[n];

  if (tail === 0n) {
    return new Rational(0n, 1n);
  }

  const pFactors = getFactors(tail);
  const qFactors = getFactors(lead);

  for (const p of pFactors) {
    for (const q of qFactors) {
      for (const sign of [1n, -1n]) {
        const r = new Rational(sign * p, q);
        let sum = new Rational(0n, 1n);
        let cur = new Rational(1n, 1n);
        for (let i = n; i >= 0; i--) {
          sum = sum.add(cur.mul(new Rational(intCoeffs[i], 1n)));
          cur = cur.mul(r);
        }
        if (sum.isZero()) {
          return r;
        }
      }
    }
  }
  return null;
}

/**
 * Synthetic division of polynomial by (x - r).
 * @param {Rational[]} coeffs
 * @param {Rational} r
 * @returns {Rational[]}
 */
function deflatePoly(coeffs, r) {
  const n = coeffs.length - 1;
  const res = [coeffs[0]];
  for (let i = 1; i < n; i++) {
    res.push(coeffs[i].add(res[i - 1].mul(r)));
  }
  return res;
}

/**
 * Numerical Durand-Kerner root finder for degree n polynomial.
 */
function durandKerner(coeffs) {
  const n = coeffs.length - 1;
  const a_n = coeffs[0];
  const p = coeffs.map((c) => c / a_n);

  function evalPoly(z) {
    let re = p[0];
    let im = 0;
    for (let i = 1; i <= n; i++) {
      const nre = re * z.re - im * z.im + p[i];
      const nim = re * z.im + im * z.re;
      re = nre;
      im = nim;
    }
    return { re, im };
  }

  const roots = [];
  const R = 0.4;
  const theta = 0.9;
  for (let i = 0; i < n; i++) {
    roots.push({
      re: Math.pow(R, i) * Math.cos(theta * i),
      im: Math.pow(R, i) * Math.sin(theta * i)
    });
  }

  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < n; i++) {
      const f = evalPoly(roots[i]);
      let denomRe = 1;
      let denomIm = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const diffRe = roots[i].re - roots[j].re;
        const diffIm = roots[i].im - roots[j].im;
        const nRe = denomRe * diffRe - denomIm * diffIm;
        const nIm = denomRe * diffIm + denomIm * diffRe;
        denomRe = nRe;
        denomIm = nIm;
      }
      const mag2 = denomRe * denomRe + denomIm * denomIm;
      if (mag2 === 0) continue;
      const stepRe = (f.re * denomRe + f.im * denomIm) / mag2;
      const stepIm = (f.im * denomRe - f.re * denomIm) / mag2;
      roots[i].re -= stepRe;
      roots[i].im -= stepIm;
    }
  }

  for (const r of roots) {
    if (Math.abs(r.im) < 1e-9) r.im = 0;
    if (Math.abs(r.re) < 1e-9) r.re = 0;
  }
  return roots;
}

function deduplicateRoots(roots) {
  const out = [];
  for (const r of roots) {
    const isDup = out.some((existing) => {
      if (r instanceof ComplexValue && existing instanceof ComplexValue) {
        return Math.abs(approxNum(r.re) - approxNum(existing.re)) < 1e-9 &&
               Math.abs(approxNum(r.im) - approxNum(existing.im)) < 1e-9;
      }
      if (!(r instanceof ComplexValue) && !(existing instanceof ComplexValue)) {
        return Math.abs(approxNum(r) - approxNum(existing)) < 1e-9;
      }
      return false;
    });
    if (!isDup) out.push(r);
  }
  return out;
}

/**
 * Solve cubic equation ax^3 + bx^2 + cx + d = 0.
 */
export function solveCubic(aRaw, bRaw, cRaw, dRaw, setup) {
  const a = toRational(aRaw);
  const b = toRational(bRaw);
  const c = toRational(cRaw);
  const d = toRational(dRaw);

  if (a.isZero()) throw new CalcError(ERRORS.MATH);

  const coeffs = [a, b, c, d];
  const r1 = findRationalRoot(coeffs);
  let roots = [];

  if (r1 !== null) {
    const qCoeffs = deflatePoly(coeffs, r1);
    const qRes = solveQuadratic(qCoeffs[0], qCoeffs[1], qCoeffs[2], { eqComplex: true });
    roots = [ExactValue.fromRational(r1.n, r1.d), ...qRes.roots];
  } else {
    // Durand-Kerner fallback
    const numericCoeffs = [a, b, c, d].map((x) => Number(x.n) / Number(x.d));
    const dRoots = durandKerner(numericCoeffs);
    for (const dr of dRoots) {
      if (dr.im === 0) {
        roots.push(ExactValue.fromDecimal(Decimal15.fromString(dr.re.toFixed(10))));
      } else {
        const re = ExactValue.fromDecimal(Decimal15.fromString(dr.re.toFixed(10)));
        const im = ExactValue.fromDecimal(Decimal15.fromString(dr.im.toFixed(10)));
        roots.push(new ComplexValue(re, im));
      }
    }
  }

  // Filter if eqComplex is false
  if (!setup.eqComplex) {
    roots = roots.filter((r) => !(r instanceof ComplexValue));
  }

  // Check unique roots (repeated roots handling)
  const uniqueRoots = deduplicateRoots(roots);
  if (uniqueRoots.length === 1) {
    return { roots: uniqueRoots, hasRealRoots: true };
  }
  if (uniqueRoots.length === 2) {
    // Two distinct roots (one is double root)
    return {
      roots: uniqueRoots.sort((x, y) => approxNum(y) - approxNum(x)),
      hasRealRoots: true
    };
  }

  // 3 roots
  const real = [];
  const complex = [];
  for (const r of roots) {
    if (r instanceof ComplexValue) complex.push(r);
    else real.push(r);
  }

  if (real.length === 3) {
    // 3 distinct real roots: Casio trigonometric cubic formula outputs [min, max, mid]
    real.sort((x, y) => approxNum(x) - approxNum(y)); // ascending: min, mid, max
    roots = [real[0], real[2], real[1]]; // [min, max, mid]
  } else {
    // 1 real root, 2 complex roots (conjugate pair with +im before -im)
    complex.sort((x, y) => approxNum(y.im) - approxNum(x.im));
    roots = [...real, ...complex];
  }

  return {
    roots,
    hasRealRoots: roots.length > 0
  };
}

/**
 * Master polynomial solver dispatcher.
 */
export function solvePolynomial(coeffs, degree, setup) {
  if (degree === 2) {
    return solveQuadratic(coeffs[0], coeffs[1], coeffs[2], setup);
  }
  if (degree === 3) {
    return solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3], setup);
  }
  throw new Error(`Unsupported polynomial degree: ${degree}`);
}
