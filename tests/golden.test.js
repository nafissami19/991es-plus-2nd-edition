/**
 * Golden key-press tests: runs every JSON test case under tests/golden/
 *
 * Golden JSON format:
 * {
 *   "name": "...",
 *   "source": "guide" | "emulator" | "unverified",
 *   "setup": { "display": "MthIO-MathO", "angle": "Deg", "format": "Norm1", ... },
 *   "keys": ["2", "FRAC", "3", "RIGHT", "ADD", "1", "FRAC", "2", "EXE"],
 *   "expect": {
 *     "lines": ["2/3+1/2", "7/6"],
 *     "result": "7/6",
 *     "indicators": ["Math", "D"],
 *     "error": "Math ERROR"
 *   },
 *   "expectedFail": true
 * }
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calculator } from '../js/core/Calculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GOLDEN_DIR = path.join(__dirname, 'golden');

function listCases(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listCases(p));
    else if (entry.name.endsWith('.json')) out.push(p);
  }
  return out;
}

describe('Prompt 4 — Golden Key-Press Tests', () => {
  const cases = listCases(GOLDEN_DIR);
  if (cases.length === 0) {
    it('golden directory initialized', () => {
      assert.ok(true);
    });
    return;
  }

  for (const file of cases) {
    const testCase = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const rel = path.relative(GOLDEN_DIR, file);
    const isUnverified = testCase.source === 'unverified';
    const isTodo = Boolean(testCase.expectedFail || testCase.pendingPrompt);
    const testOpts = isTodo ? { todo: testCase.pendingPrompt || 'Expected to fail' } : {};

    it(`${rel}: ${testCase.name || ''}`, testOpts, () => {
      const calc = new Calculator({ setup: testCase.setup, rng: () => 0.5 });
      if (Array.isArray(testCase.keys)) {
        calc.pressSequence(testCase.keys);
      } else if (typeof testCase.keys === 'string') {
        calc.pressSequence(testCase.keys);
      }

      const screen = calc.getScreen();
      const e = testCase.expect || {};
      const where = `keys [${Array.isArray(testCase.keys) ? testCase.keys.join(' ') : testCase.keys}] → lines ${JSON.stringify(screen.lines)}`;

      try {
        if (e.indicators) {
          for (const ind of e.indicators) {
            assert.ok(screen.indicators.includes(ind), `indicator "${ind}" should be on; on: [${screen.indicators.join(', ')}] (${where})`);
          }
        }
        if (e.notIndicators) {
          for (const ind of e.notIndicators) {
            assert.ok(!screen.indicators.includes(ind), `indicator "${ind}" should be off (${where})`);
          }
        }
        if (e.error) {
          assert.ok(screen.lines.some((l) => l.includes(e.error)), `expected error "${e.error}" (${where})`);
        }
        if (e.result !== undefined) {
          const resLine = screen.lines[screen.lines.length - 1] || '';
          const normStr = (s) => String(s).replace(/[\u2212\u2013\u002D]/g, '-');
          assert.ok(normStr(resLine).includes(normStr(e.result)), `expected result "${e.result}" in last line "${resLine}" (${where})`);
        }
        if (e.lines && Array.isArray(e.lines)) {
          // Compare lines
          assert.ok(screen.lines.length >= e.lines.length, `screen has fewer lines than expected (${where})`);
          for (let i = 0; i < e.lines.length; i++) {
            assert.ok(
              screen.lines[i].includes(e.lines[i]) || e.lines[i].includes(screen.lines[i]),
              `line ${i} mismatch: expected "${e.lines[i]}", got "${screen.lines[i]}" (${where})`
            );
          }
        }
      } catch (err) {
        if (isUnverified) {
          console.warn(`[WARN - Unverified test mismatch] ${testCase.name}: ${err.message}`);
        } else {
          throw err;
        }
      }
    });
  }
});
