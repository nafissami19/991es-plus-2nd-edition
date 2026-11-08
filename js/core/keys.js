/**
 * Physical key names (same as the "name" field in assets/data/key_layout.json)
 * and the aliases accepted by Calculator.press()/pressSequence() in tests.
 *
 * Exactly 50 keys for the Casio fx-991ES PLUS 2nd edition:
 *   Row 0: SHIFT, ALPHA, UP, DOWN, LEFT, RIGHT, MODE, ON
 *   Row 1: CALC, INTEGRAL, RECIP, LOGBASE
 *   Row 2: FRAC, SQRT, SQUARE, POWER, LOG, LN
 *   Row 3: NEG, DMS, HYP, SIN, COS, TAN
 *   Row 4: RCL, ENG, LPAREN, RPAREN, SD, MPLUS
 *   Row 5: 7, 8, 9, DEL, AC
 *   Row 6: 4, 5, 6, MUL, DIV
 *   Row 7: 1, 2, 3, ADD, SUB
 *   Row 8: 0, DOT, EXP10, ANS, EXE
 */

export const KEY_NAMES = [
  'SHIFT', 'ALPHA', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'MODE', 'ON',
  'CALC', 'INTEGRAL', 'RECIP', 'LOGBASE',
  'FRAC', 'SQRT', 'SQUARE', 'POWER', 'LOG', 'LN',
  'NEG', 'DMS', 'HYP', 'SIN', 'COS', 'TAN',
  'RCL', 'ENG', 'LPAREN', 'RPAREN', 'SD', 'MPLUS',
  '7', '8', '9', 'DEL', 'AC',
  '4', '5', '6', 'MUL', 'DIV',
  '1', '2', '3', 'ADD', 'SUB',
  '0', 'DOT', 'EXP10', 'ANS', 'EXE'
];

const KEY_SET = new Set(KEY_NAMES);

/** Aliases that map to a single physical key (SHIFT/ALPHA handled separately). */
const ALIASES = {
  '=': 'EXE', 'ENTER': 'EXE', '≈': 'EXE',
  '+': 'ADD', '-': 'SUB', '−': 'SUB', '*': 'MUL', '×': 'MUL', '/': 'DIV', '÷': 'DIV',
  '.': 'DOT', '(': 'LPAREN', ')': 'RPAREN',
  '√': 'SQRT', '√■': 'SQRT', '∛': 'SQRT',
  'x²': 'SQUARE',
  '^': 'POWER', 'x■': 'POWER', '■√□': 'POWER',
  'log■□': 'LOGBASE', 'logab': 'LOGBASE', 'LOG_AB': 'LOGBASE',
  'log': 'LOG',
  'ln': 'LN',
  '(-)': 'NEG', '(−)': 'NEG',
  "°'\"": 'DMS', "° ' \"": 'DMS', '°': 'DMS', 'DMS': 'DMS', 'DEG': 'DMS',
  'hyp': 'HYP',
  'x⁻¹': 'RECIP', 'x!': 'RECIP', 'INV': 'RECIP',
  'sin': 'SIN', 'cos': 'COS', 'tan': 'TAN', 'sin⁻¹': 'SIN', 'cos⁻¹': 'COS', 'tan⁻¹': 'TAN',
  'RECALL': 'RECALL', 'RCL': 'RCL', 'STO': 'STO',
  '←': 'ENG',
  'S<=>D': 'SD', 'S⇔D': 'SD',
  'M+': 'MPLUS', 'M-': 'MPLUS', 'M−': 'MPLUS', 'M_PLUS': 'MPLUS',
  'CONST': '7', 'CONV': '8', 'CLR': '9', 'RESET': '9',
  'BACKSPACE': 'DEL', 'INS': 'DEL',
  'ESC': 'AC', 'ESCAPE': 'AC',
  'EXP': 'EXP10', '×10ˣ': 'EXP10', '×10ⁿ': 'EXP10', 'x10^x': 'EXP10',
  'Ans': 'ANS', 'ans': 'ANS',
  'MENU': 'MODE',
  '∫': 'INTEGRAL',
  '▲': 'UP', '▼': 'DOWN', '◀': 'LEFT', '▶': 'RIGHT',
  'ARROWUP': 'UP', 'ARROWDOWN': 'DOWN', 'ARROWLEFT': 'LEFT', 'ARROWRIGHT': 'RIGHT',
  'DEC': 'SQUARE', 'HEX': 'POWER', 'BIN': 'LOG', 'OCT': 'LN',
  'hexA': 'NEG', 'hexB': 'DMS', 'hexC': 'HYP', 'hexD': 'SIN', 'hexE': 'COS', 'hexF': 'TAN'
};

/** Aliases that expand to a key sequence (convenience for tests). */
const SEQUENCE_ALIASES = {
  ',': ['SHIFT', 'RPAREN'],
  'COMMA': ['SHIFT', 'RPAREN'],
  '==': ['ALPHA', 'CALC'],
  ':': ['ALPHA', 'INTEGRAL'],
  'OFF': ['SHIFT', 'AC'],
  'x³': ['SHIFT', 'SQUARE'],
  'x3': ['SHIFT', 'SQUARE'],
  'cube': ['SHIFT', 'SQUARE'],
  'SOLVE': ['SHIFT', 'CALC'],
  'Abs': ['SHIFT', 'HYP'],
  'ABS': ['SHIFT', 'HYP'],
  'abs': ['SHIFT', 'HYP'],
  'Ran#': ['SHIFT', 'DOT'],
  'RanInt#': ['ALPHA', 'DOT'],
  'RanInt': ['ALPHA', 'DOT'],
  'Rnd': ['SHIFT', '0'],
  'Pol': ['SHIFT', 'ADD'],
  'Rec': ['SHIFT', 'SUB'],
  'nPr': ['SHIFT', 'MUL'],
  'nCr': ['SHIFT', 'DIV'],
  '←ENG': ['SHIFT', 'ENG'],
  'CONST': ['SHIFT', '7'],
  'CONV': ['SHIFT', '8'],
  'CLR': ['SHIFT', '9'],
  'RESET': ['SHIFT', '9'],
  'SETUP': ['SHIFT', 'MODE'],
  'd/dx': ['SHIFT', 'INTEGRAL'],
  'Σ': ['SHIFT', 'LOGBASE'],
  '10^■': ['SHIFT', 'LOG'],
  'e^■': ['SHIFT', 'LN'],
  'x!': ['SHIFT', 'RECIP'],
  '∠': ['SHIFT', 'NEG'], 'angle': ['SHIFT', 'NEG'],
  'i': ['ALPHA', 'ENG'],
  'arg': ['SHIFT', '2', '1'],
  'Conjg': ['SHIFT', '2', '2'],
  '▸r∠θ': ['SHIFT', '2', '3'],
  '▸a+bi': ['SHIFT', '2', '4'],
  'DRG▸': ['SHIFT', 'ANS'],
  'π': ['SHIFT', 'EXP10'],
  'e': ['ALPHA', 'EXP10'],
  'X': ['ALPHA', 'RPAREN'],
  'Y': ['ALPHA', 'SD'],
  'M': ['ALPHA', 'MPLUS'],
  'A': ['ALPHA', 'NEG'],
  'B': ['ALPHA', 'DMS'],
  'C': ['ALPHA', 'HYP'],
  'D': ['ALPHA', 'SIN'],
  'E': ['ALPHA', 'COS'],
  'F': ['ALPHA', 'TAN']
};

/**
 * Resolves a key name or alias to a sequence of physical key names.
 * Accepts exact key names, case-insensitive aliases, and sequence macros.
 * Returns an array of physical key names (e.g. ['SHIFT', 'AC'] for 'OFF').
 */
export function resolveKey(name) {
  if (typeof name !== 'string') return [];
  const trimmed = name.trim();
  if (KEY_SET.has(trimmed)) return [trimmed];
  if (SEQUENCE_ALIASES[trimmed]) return SEQUENCE_ALIASES[trimmed];
  if (ALIASES[trimmed]) return [ALIASES[trimmed]];
  const upper = trimmed.toUpperCase();
  if (KEY_SET.has(upper)) return [upper];
  if (SEQUENCE_ALIASES[upper]) return SEQUENCE_ALIASES[upper];
  if (ALIASES[upper]) return [ALIASES[upper]];
  return [trimmed];
}

export const VARIABLE_KEYS = {
  NEG: 'A', A: 'A',
  DMS: 'B', DEG: 'B', B: 'B',
  HYP: 'C', INV: 'C', RECIP: 'C', C: 'C',
  SIN: 'D', D: 'D',
  COS: 'E', E: 'E',
  TAN: 'F', F: 'F',
  MPLUS: 'M', M_PLUS: 'M', M: 'M',
  RPAREN: 'X', X: 'X', x: 'X',
  SD: 'Y', Y: 'Y', y: 'Y'
};

export const DIGIT_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

export function isVariableKey(name) {
  const norm = ALIASES[name] || name;
  return norm === 'NEG' || norm === 'DMS' || norm === 'HYP' ||
         norm === 'SIN' || norm === 'COS' || norm === 'TAN' ||
         norm === 'RPAREN' || norm === 'SD' || norm === 'MPLUS';
}

export function variableNameForKey(name) {
  const norm = ALIASES[name] || name;
  switch (norm) {
    case 'NEG': return 'A';
    case 'DMS': return 'B';
    case 'HYP': return 'C';
    case 'SIN': return 'D';
    case 'COS': return 'E';
    case 'TAN': return 'F';
    case 'RPAREN': return 'X';
    case 'SD': return 'Y';
    case 'MPLUS': return 'M';
    default: return null;
  }
}
