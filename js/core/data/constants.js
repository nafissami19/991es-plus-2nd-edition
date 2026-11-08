/**
 * Scientific constants (SHIFT 7 CONST) — 40 constants, CODATA 2014 recommended values
 * for the Casio fx-991ES PLUS 2nd edition.
 */

import { registerToken } from '../input/tokens.js';
import { ExactValue } from '../exact/ExactValue.js';
import { Decimal15 } from '../number/Decimal15.js';

export const CONSTANTS_2014 = [
  ['mp', 'mp', '1.672621898e-27'],
  ['mn', 'mn', '1.674927471e-27'],
  ['me', 'me', '9.10938356e-31'],
  ['mmu', 'mμ', '1.883531594e-28'],
  ['a0', 'a₀', '5.2917721067e-11'],
  ['h', 'h', '6.62607004e-34'],
  ['muN', 'μN', '5.050783699e-27'],
  ['muB', 'μB', '9.274009994e-24'],
  ['hbar', 'ħ', '1.054571800e-34'],
  ['alpha', 'α', '7.297352566e-3'],
  ['re', 're', '2.8179403227e-15'],
  ['lambdaC', 'λc', '2.4263102367e-12'],
  ['gammap', 'γp', '267522190.0'],
  ['lambdaCp', 'λcp', '1.32140985396e-15'],
  ['lambdaCn', 'λcn', '1.31959090481e-15'],
  ['Rinf', 'R∞', '10973731.568508'],
  ['u', 'u', '1.660539040e-27'],
  ['mup', 'μp', '1.4106067873e-26'],
  ['mue', 'μe', '-9.284764620e-24'],
  ['mun', 'μn', '-9.6623650e-27'],
  ['mumu', 'μμ', '-4.49044826e-26'],
  ['F', 'F', '96485.33289'],
  ['e', 'e', '1.6021766208e-19'],
  ['NA', 'NA', '6.022140857e23'],
  ['k', 'k', '1.38064852e-23'],
  ['Vm', 'Vm', '0.022710947'],
  ['R', 'R', '8.3144598'],
  ['c0', 'c₀', '299792458'],
  ['c1', 'c₁', '3.741771790e-16'],
  ['c2', 'c₂', '0.0143877736'],
  ['sigma', 'σ', '5.670367e-8'],
  ['eps0', 'ε₀', '8.85418781762039e-12'],
  ['mu0', 'μ₀', '1.25663706143592e-6'],
  ['Phi0', 'Φ₀', '2.067833831e-15'],
  ['g', 'g', '9.80665'],
  ['G0', 'G₀', '7.748091729e-5'],
  ['Z0', 'Z₀', '376.730313461'],
  ['t', 't', '273.15'],
  ['G', 'G', '6.67408e-11'],
  ['atm', 'atm', '101325']
];

/** token id → ExactValue */
export const CONSTANT_VALUES = {};
export const CONSTANT_BY_INDEX = {};

let idx = 1;
for (const [key, sym, value] of CONSTANTS_2014) {
  const id = 'const_' + key;
  registerToken(id, sym, 'value', 2, { name: 'const' });
  const d = Decimal15.fromString(value);
  CONSTANT_VALUES[id] = new ExactValue('decimal', d, d);
  CONSTANT_BY_INDEX[idx] = id;
  idx++;
}

export const CONSTANT_COUNT = Object.keys(CONSTANT_VALUES).length;
