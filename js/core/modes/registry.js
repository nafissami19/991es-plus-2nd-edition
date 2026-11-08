/**
 * The 8 calculation modes for Casio fx-991ES PLUS 2nd edition in MODE menu order:
 * 1:COMP  2:CMPLX  3:STAT  4:BASE-N  5:EQN  6:MATRIX  7:TABLE  8:VECTOR
 *
 * Each mode folder exports createApp(calc).
 */

import { CalcApp } from '../apps/CalcApp.js';
import * as complex from './complex/index.js';
import * as statistics from './statistics/index.js';
import * as baseN from './baseN/index.js';
import * as equation from './equation/index.js';
import * as matrix from './matrix/index.js';
import * as table from './table/index.js';
import * as vector from './vector/index.js';

export const MODES = [
  { id: 1, key: '1', name: 'COMP', create: (c) => new CalcApp(c) },
  { id: 2, key: '2', name: 'CMPLX', create: complex.createApp },
  { id: 3, key: '3', name: 'STAT', create: statistics.createApp },
  { id: 4, key: '4', name: 'BASE-N', create: baseN.createApp },
  { id: 5, key: '5', name: 'EQN', create: equation.createApp },
  { id: 6, key: '6', name: 'MATRIX', create: matrix.createApp },
  { id: 7, key: '7', name: 'TABLE', create: table.createApp },
  { id: 8, key: '8', name: 'VECTOR', create: vector.createApp }
];

export function modeById(id) {
  return MODES.find((m) => m.id === id) || MODES[0];
}
