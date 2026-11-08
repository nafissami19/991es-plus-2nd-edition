/**
 * Casio Official Emulator KeyLog Import Script
 *
 * Converts text copied from the official emulator's KeyLog window into our golden test
 * key format and writes a golden test JSON.
 *
 * Usage:
 *   node scripts/import_keylog.js <input-keylog.txt> [output-case.json]
 */

import fs from 'node:fs';
import path from 'node:path';

// Mapping from official emulator KeyLog labels/symbols to our canonical key names
const EMULATOR_KEY_MAP = {
  // Navigation & Control
  '[SHIFT]': 'SHIFT', 'SHIFT': 'SHIFT',
  '[ALPHA]': 'ALPHA', 'ALPHA': 'ALPHA',
  '[MODE]': 'MODE', 'MODE': 'MODE',
  '[SETUP]': 'MODE',
  '[ON]': 'ON', 'ON': 'ON',
  '[▲]': 'UP', '▲': 'UP', 'UP': 'UP',
  '[▼]': 'DOWN', '▼': 'DOWN', 'DOWN': 'DOWN',
  '[◀]': 'LEFT', '◀': 'LEFT', 'LEFT': 'LEFT',
  '[▶]': 'RIGHT', '▶': 'RIGHT', 'RIGHT': 'RIGHT',

  // Row 1
  '[CALC]': 'CALC', 'CALC': 'CALC',
  '[SOLVE]': 'CALC',
  '[∫dx]': 'INTEGRAL', '[∫]': 'INTEGRAL', '∫': 'INTEGRAL', 'INTEGRAL': 'INTEGRAL',
  '[x⁻¹]': 'RECIP', 'x⁻¹': 'RECIP', 'RECIP': 'RECIP', 'x!': 'RECIP',
  '[log■□]': 'LOGBASE', 'log■□': 'LOGBASE', 'LOGBASE': 'LOGBASE',

  // Row 2
  '[■/□]': 'FRAC', '[□/□]': 'FRAC', '■/□': 'FRAC', '□/□': 'FRAC', 'FRAC': 'FRAC',
  '[√■]': 'SQRT', '[√]': 'SQRT', '√■': 'SQRT', '√': 'SQRT', 'SQRT': 'SQRT',
  '[x²]': 'SQUARE', 'x²': 'SQUARE', 'SQUARE': 'SQUARE',
  '[x^]': 'POWER', '[x^■]': 'POWER', 'x^': 'POWER', 'x^■': 'POWER', 'POWER': 'POWER',
  '[log]': 'LOG', 'log': 'LOG', 'LOG': 'LOG',
  '[ln]': 'LN', 'ln': 'LN', 'LN': 'LN',

  // Row 3
  '[(-)]': 'NEG', '(-)': 'NEG', 'NEG': 'NEG',
  '[° \' "]': 'DMS', '[°\'"]': 'DMS', '°\'"': 'DMS', '° \' "': 'DMS', 'DMS': 'DMS',
  '[hyp]': 'HYP', 'hyp': 'HYP', 'HYP': 'HYP',
  '[sin]': 'SIN', 'sin': 'SIN', 'SIN': 'SIN',
  '[cos]': 'COS', 'cos': 'COS', 'COS': 'COS',
  '[tan]': 'TAN', 'tan': 'TAN', 'TAN': 'TAN',

  // Row 4
  '[RCL]': 'RCL', 'RCL': 'RCL',
  '[STO]': 'RCL',
  '[ENG]': 'ENG', 'ENG': 'ENG',
  '[(]': 'LPAREN', '(': 'LPAREN', 'LPAREN': 'LPAREN',
  '[)]': 'RPAREN', ')': 'RPAREN', 'RPAREN': 'RPAREN',
  '[S<=>D]': 'SD', '[S⇔D]': 'SD', 'S<=>D': 'SD', 'S⇔D': 'SD', 'SD': 'SD',
  '[M+]': 'MPLUS', 'M+': 'MPLUS', 'MPLUS': 'MPLUS',

  // Row 5
  '[7]': '7', '7': '7',
  '[8]': '8', '8': '8',
  '[9]': '9', '9': '9',
  '[DEL]': 'DEL', 'DEL': 'DEL',
  '[AC]': 'AC', 'AC': 'AC',

  // Row 6
  '[4]': '4', '4': '4',
  '[5]': '5', '5': '5',
  '[6]': '6', '6': '6',
  '[×]': 'MUL', '×': 'MUL', '*': 'MUL', 'MUL': 'MUL',
  '[÷]': 'DIV', '÷': 'DIV', '/': 'DIV', 'DIV': 'DIV',

  // Row 7
  '[1]': '1', '1': '1',
  '[2]': '2', '2': '2',
  '[3]': '3', '3': '3',
  '[+]': 'ADD', '+': 'ADD', 'ADD': 'ADD',
  '[-]': 'SUB', '[−]': 'SUB', '-': 'SUB', '−': 'SUB', 'SUB': 'SUB',

  // Row 8
  '[0]': '0', '0': '0',
  '[.]': 'DOT', '.': 'DOT', 'DOT': 'DOT',
  '[×10ˣ]': 'EXP10', '[x10^x]': 'EXP10', '×10ˣ': 'EXP10', 'EXP10': 'EXP10',
  '[Ans]': 'ANS', 'Ans': 'ANS', 'ANS': 'ANS',
  '[=]': 'EXE', '=': 'EXE', 'EXE': 'EXE'
};

export function parseKeyLog(text) {
  // Tokenize bracketed items [X] or standalone tokens
  const tokens = [];
  const regex = /\[[^\]]+\]|\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!raw) continue;
    const mapped = EMULATOR_KEY_MAP[raw] || EMULATOR_KEY_MAP[raw.toUpperCase()];
    if (mapped) {
      tokens.push(mapped);
    } else {
      console.warn(`Unmapped key token: "${raw}"`);
      tokens.push(raw);
    }
  }
  return tokens;
}

export function createGoldenJson({ name, source = 'emulator', setup = {}, keys, expect = {} }) {
  return {
    name: name || 'Imported KeyLog Test',
    source,
    setup: {
      display: setup.display || 'MthIO-MathO',
      angle: setup.angle || 'Deg',
      format: setup.format || 'Norm1',
      fraction: setup.fraction || 'd/c',
      ...setup
    },
    keys,
    expect: {
      lines: expect.lines || [],
      result: expect.result || '',
      indicators: expect.indicators || ['Math', 'D'],
      ...expect
    }
  };
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('import_keylog.js')) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.log('Usage: node scripts/import_keylog.js <input-keylog.txt> [output-case.json]');
    process.exit(0);
  }

  const raw = fs.readFileSync(inputFile, 'utf-8');
  const keys = parseKeyLog(raw);
  const golden = createGoldenJson({ keys });

  if (outputFile) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(golden, null, 2), 'utf-8');
    console.log(`Wrote golden test to ${outputFile}`);
  } else {
    console.log(JSON.stringify(golden, null, 2));
  }
}
