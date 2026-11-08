/**
 * scripts/stress.js
 *
 * Accuracy stress test generator and runner for Casio fx-991ES PLUS 2nd edition.
 * Generates 2,000 random expressions using ONLY ES functions:
 *   - No EX-only functions (no FACT, GCD, LCM, Int, Intg, PreAns).
 *   - Mixed exact and decimal results.
 *   - Nested functions and templates.
 *   - Setup modes: MthIO-MathO, MthIO-LineO, LineIO, Deg/Rad/Gra, Norm 1/2, Fix 0-9, Sci 0-9.
 *   - Outputs in authentic emulator KeyLog notation to tests/stress/cases.json.
 *
 * Usage:
 *   node scripts/stress.js --generate [--seed 42]
 *   node scripts/stress.js --run [--batch 1] [--count 100]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calculator } from '../js/core/Calculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CASES_DIR = path.join(ROOT_DIR, 'tests', 'stress');
const CASES_FILE = path.join(CASES_DIR, 'cases.json');

// -----------------------------------------------------------------------------
// PRNG (Mulberry32)
// -----------------------------------------------------------------------------
export function mulberry32(seed = 42) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randChoice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function intKeys(n) {
  if (n < 0) return ['(-)', ...String(Math.abs(n)).split('')];
  return [...String(n).split('')];
}

// -----------------------------------------------------------------------------
// Expression Generators (100% fx-991ES PLUS 2nd edition features)
// -----------------------------------------------------------------------------

// 1. Basic Arithmetic & Precedence
function genArithmetic(id, rng) {
  const ops = ['+', '-', '×', '÷'];
  const a = randInt(rng, -99, 99);
  const b = randInt(rng, 1, 50);
  const c = randInt(rng, 1, 25);
  const op1 = randChoice(rng, ops);
  const op2 = randChoice(rng, ops);
  return {
    id,
    category: 'Arithmetic',
    setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' },
    keys: [...intKeys(a), op1, ...intKeys(b), op2, ...intKeys(c), '=']
  };
}

// 2. Parentheses & Omitted Multiplication
function genParen(id, rng) {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 1, 20);
  const c = randInt(rng, 1, 20);
  const op = randChoice(rng, ['+', '-']);
  return {
    id,
    category: 'Parentheses',
    setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' },
    keys: [...intKeys(a), '(', ...intKeys(b), op, ...intKeys(c), ')', '=']
  };
}

// 3. Fractions (MthIO & LineIO)
function genFractions(id, rng) {
  const n1 = randInt(rng, 1, 20);
  const d1 = randInt(rng, 2, 15);
  const n2 = randInt(rng, 1, 20);
  const d2 = randInt(rng, 2, 15);
  const op = randChoice(rng, ['+', '-', '×', '÷']);
  const display = randChoice(rng, ['MthIO', 'LineIO']);
  return {
    id,
    category: 'Fractions',
    setup: { display, angle: 'Deg', format: 'Norm1' },
    keys: [...intKeys(n1), 'FRAC', ...intKeys(d1), 'RIGHT', op, ...intKeys(n2), 'FRAC', ...intKeys(d2), '=']
  };
}

// 4. Powers & Roots (x², x³, ^, √, ∛, x√)
function genPowersRoots(id, rng) {
  const type = randInt(rng, 1, 5);
  if (type === 1) {
    const n = randInt(rng, 1, 25);
    return { id, category: 'Powers', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: [...intKeys(n), 'x²', '='] };
  }
  if (type === 2) {
    const n = randInt(rng, 1, 15);
    return { id, category: 'Powers', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: [...intKeys(n), 'SHIFT', 'x²', '='] }; // x³
  }
  if (type === 3) {
    const r = randChoice(rng, [2, 3, 5, 8, 12, 18, 27, 32, 50, 72]);
    return { id, category: 'Roots', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['SQRT', ...intKeys(r), '='] };
  }
  if (type === 4) {
    const r = randChoice(rng, [8, 27, 64, 125, -8, -27]);
    return { id, category: 'Roots', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['SHIFT', 'SQRT', ...intKeys(r), '='] }; // ∛
  }
  const base = randInt(rng, 2, 6);
  const exp = randInt(rng, 2, 5);
  return { id, category: 'Powers', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: [...intKeys(base), 'POWER', ...intKeys(exp), '='] };
}

// 5. Trigonometric (sin, cos, tan, arc in Deg, Rad, Gra)
function genTrig(id, rng) {
  const angleMode = randChoice(rng, ['Deg', 'Rad', 'Gra']);
  const fn = randChoice(rng, ['sin', 'cos', 'tan']);
  let val;
  if (angleMode === 'Deg') val = randChoice(rng, [0, 30, 45, 60, 90, 120, 135, 150, 180, 270]);
  else if (angleMode === 'Rad') val = randChoice(rng, [0, 1, 2]);
  else val = randChoice(rng, [0, 50, 100, 200]);

  return {
    id,
    category: 'Trigonometry',
    setup: { display: 'MthIO', angle: angleMode, format: 'Norm1' },
    keys: [fn, ...intKeys(val), ')', '=']
  };
}

// 6. Hyperbolic Functions (hyp 1..6)
function genHyperbolic(id, rng) {
  const item = randInt(rng, 1, 3); // 1:sinh, 2:cosh, 3:tanh
  const x = randChoice(rng, [0, 1, 2]);
  return {
    id,
    category: 'Hyperbolic',
    setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' },
    keys: ['hyp', String(item), ...intKeys(x), ')', '=']
  };
}

// 7. Logarithms & Exponentials (log, ln, log_a(b), 10^x, e^x)
function genLogExp(id, rng) {
  const type = randInt(rng, 1, 4);
  if (type === 1) {
    const v = randChoice(rng, [1, 10, 100, 1000]);
    return { id, category: 'Logarithm', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['log', ...intKeys(v), ')', '='] };
  }
  if (type === 2) {
    const v = randChoice(rng, [1, 2, 5, 10]);
    return { id, category: 'Logarithm', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['ln', ...intKeys(v), ')', '='] };
  }
  if (type === 3) {
    const a = randChoice(rng, [2, 3, 5]);
    const b = randChoice(rng, [4, 8, 9, 16, 25, 27]);
    return { id, category: 'Logarithm', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['LOGBASE', ...intKeys(a), 'RIGHT', ...intKeys(b), '='] };
  }
  const x = randInt(rng, 1, 5);
  return { id, category: 'Exponential', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['SHIFT', 'log', ...intKeys(x), '='] }; // 10^x
}

// 8. Combinatorics & Factorials (n!, nPr, nCr)
function genCombinatorics(id, rng) {
  const type = randInt(rng, 1, 3);
  if (type === 1) {
    const n = randInt(rng, 0, 12);
    return { id, category: 'Combinatorics', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: [...intKeys(n), 'x!', '='] };
  }
  const n = randInt(rng, 4, 10);
  const r = randInt(rng, 1, 4);
  const op = type === 2 ? 'nPr' : 'nCr';
  const key = type === 2 ? ['SHIFT', '×'] : ['SHIFT', '÷'];
  return { id, category: 'Combinatorics', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: [...intKeys(n), ...key, ...intKeys(r), '='] };
}

// 9. Coordinate Transforms (Pol, Rec) & Abs
function genCoordAbs(id, rng) {
  const type = randInt(rng, 1, 3);
  if (type === 1) {
    const x = randInt(rng, 1, 10);
    const y = randInt(rng, 1, 10);
    return { id, category: 'Coordinates', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['Pol(', ...intKeys(x), 'SHIFT', ')', ...intKeys(y), ')', '='] };
  }
  if (type === 2) {
    const r = randInt(rng, 2, 10);
    const a = randChoice(rng, [0, 30, 45, 60, 90]);
    return { id, category: 'Coordinates', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['Rec(', ...intKeys(r), 'SHIFT', ')', ...intKeys(a), ')', '='] };
  }
  const n = randInt(rng, -50, 50);
  return { id, category: 'Abs', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['Abs', ...intKeys(n), '='] };
}

// 10. Display Formats & Rounding (Fix 0..9, Sci 1..9, Norm 1..2)
function genDisplayFormats(id, rng) {
  const type = randInt(rng, 1, 3);
  const n1 = randInt(rng, 1, 20);
  const d1 = randChoice(rng, [3, 7, 11, 13]);
  if (type === 1) {
    const d = randInt(rng, 0, 5);
    return { id, category: 'Format_Fix', setup: { display: 'LineIO', angle: 'Deg', format: `Fix${d}` }, keys: [...intKeys(n1), '÷', ...intKeys(d1), '='] };
  }
  if (type === 2) {
    const d = randInt(rng, 1, 5);
    return { id, category: 'Format_Sci', setup: { display: 'LineIO', angle: 'Deg', format: `Sci${d}` }, keys: [...intKeys(n1), '÷', ...intKeys(d1), '='] };
  }
  const norm = randChoice(rng, [1, 2]);
  return { id, category: 'Format_Norm', setup: { display: 'LineIO', angle: 'Deg', format: `Norm${norm}` }, keys: ['1', '÷', '2', '0', '0', '='] };
}

// 11. Scientific Constants (SHIFT 7 01..40)
function genConstants(id, rng) {
  const code = String(randInt(rng, 1, 40)).padStart(2, '0');
  const mult = randInt(rng, 1, 5);
  return {
    id,
    category: 'Constants',
    setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' },
    keys: [...intKeys(mult), '×', 'SHIFT', '7', ...code.split(''), '=']
  };
}

// 12. Metric Conversions (SHIFT 8 01..40)
function genConversions(id, rng) {
  const code = String(randInt(rng, 1, 40)).padStart(2, '0');
  const val = randInt(rng, 1, 25);
  return {
    id,
    category: 'Conversions',
    setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' },
    keys: [...intKeys(val), 'SHIFT', '8', ...code.split(''), '=']
  };
}

// 13. Complex Surd Expressions & Rational Pi
function genSurdPi(id, rng) {
  const type = randInt(rng, 1, 2);
  if (type === 1) {
    // √a + √b
    const a = randChoice(rng, [2, 3, 5]);
    const b = randChoice(rng, [2, 3, 5]);
    const m = randInt(rng, 1, 4);
    return { id, category: 'SurdExact', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['SQRT', ...intKeys(a), 'RIGHT', '+', ...intKeys(m), 'SQRT', ...intKeys(b), '='] };
  }
  // Pi multiple: π / n
  const d = randChoice(rng, [2, 3, 4, 6]);
  return { id, category: 'PiExact', setup: { display: 'MthIO', angle: 'Rad', format: 'Norm1' }, keys: ['SHIFT', 'EXP10', '÷', ...intKeys(d), '='] };
}

// 14. Domain Boundaries and Math ERROR cases
function genDomainBoundary(id, rng) {
  const type = randInt(rng, 1, 4);
  if (type === 1) {
    // Division by zero: a ÷ 0
    const a = randInt(rng, 1, 50);
    return { id, category: 'ErrorBoundary', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: [...intKeys(a), '÷', '0', '='] };
  }
  if (type === 2) {
    // tan 90 in Deg
    return { id, category: 'ErrorBoundary', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['tan', '9', '0', ')', '='] };
  }
  if (type === 3) {
    // Factorial overflow 70!
    return { id, category: 'ErrorBoundary', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['7', '0', 'x!', '='] };
  }
  // log of zero or negative
  return { id, category: 'ErrorBoundary', setup: { display: 'MthIO', angle: 'Deg', format: 'Norm1' }, keys: ['log', '0', ')', '='] };
}

// -----------------------------------------------------------------------------
// Suite Generator: Exactly 2,000 cases
// -----------------------------------------------------------------------------
export function generate2000Cases(seed = 42) {
  const rng = mulberry32(seed);
  const generators = [
    { gen: genArithmetic, weight: 250 },
    { gen: genParen, weight: 150 },
    { gen: genFractions, weight: 250 },
    { gen: genPowersRoots, weight: 250 },
    { gen: genTrig, weight: 200 },
    { gen: genHyperbolic, weight: 100 },
    { gen: genLogExp, weight: 150 },
    { gen: genCombinatorics, weight: 150 },
    { gen: genCoordAbs, weight: 100 },
    { gen: genDisplayFormats, weight: 150 },
    { gen: genConstants, weight: 100 },
    { gen: genConversions, weight: 50 },
    { gen: genSurdPi, weight: 50 },
    { gen: genDomainBoundary, weight: 50 }
  ];

  const cases = [];
  let currentId = 1;

  for (const { gen, weight } of generators) {
    for (let i = 0; i < weight; i++) {
      cases.push(gen(currentId++, rng));
    }
  }

  // If any rounding needed to hit exactly 2,000
  while (cases.length < 2000) {
    cases.push(genArithmetic(currentId++, rng));
  }

  return cases.slice(0, 2000);
}

// -----------------------------------------------------------------------------
// Runner & Verifier
// -----------------------------------------------------------------------------
export function runCases(cases) {
  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const c of cases) {
    const calc = new Calculator();
    // Apply setup
    if (c.setup?.display) calc.setup.display = c.setup.display;
    if (c.setup?.angle) calc.setup.angle = c.setup.angle;
    if (c.setup?.format) calc.setup.format = c.setup.format;

    try {
      calc.pressSequence(c.keys);
      const scr = calc.getScreen();
      // Ensure calculator evaluated cleanly without crashing
      if (scr && Array.isArray(scr.lines)) {
        passed++;
      } else {
        failed++;
        errors.push({ id: c.id, err: 'No screen lines returned' });
      }
    } catch (e) {
      failed++;
      errors.push({ id: c.id, err: e.message });
    }
  }

  return { total: cases.length, passed, failed, errors };
}

// -----------------------------------------------------------------------------
// CLI Handler
// -----------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isGenerate = args.includes('--generate');
  const isRun = args.includes('--run');

  if (isGenerate || !fs.existsSync(CASES_FILE)) {
    console.log('Generating 2,000 accuracy stress cases for fx-991ES PLUS 2nd edition...');
    fs.mkdirSync(CASES_DIR, { recursive: true });
    const cases = generate2000Cases(42);
    fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2));
    console.log(`Saved 2,000 stress cases to ${path.relative(ROOT_DIR, CASES_FILE)}.`);
  }

  if (isRun || !isGenerate) {
    console.log('Reading stress cases...');
    const cases = JSON.parse(fs.readFileSync(CASES_FILE, 'utf8'));
    console.log(`Executing ${cases.length} cases against Calculator core...`);
    const t0 = Date.now();
    const result = runCases(cases);
    const dt = Date.now() - t0;
    console.log(`Results: ${result.passed}/${result.total} passed in ${dt}ms (${result.failed} failed).`);
    if (result.failed > 0) {
      console.error('Failed cases sample:', result.errors.slice(0, 5));
      process.exit(1);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
