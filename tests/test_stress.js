import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate2000Cases, runCases } from '../scripts/stress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CASES_FILE = path.join(ROOT, 'tests', 'stress', 'cases.json');

describe('Prompt 31 — 2,000-Case Accuracy Stress Test', () => {
  it('tests/stress/cases.json exists and contains exactly 2,000 cases', () => {
    assert.ok(fs.existsSync(CASES_FILE), 'cases.json must exist');
    const cases = JSON.parse(fs.readFileSync(CASES_FILE, 'utf8'));
    assert.strictEqual(cases.length, 2000);
  });

  it('verifies that cases contain only valid ES PLUS functions (no EX-only functions)', () => {
    const cases = JSON.parse(fs.readFileSync(CASES_FILE, 'utf8'));
    const exOnlyTokens = new Set(['FACT', 'GCD', 'LCM', 'Int', 'Intg', 'PreAns', 'QR']);
    for (const c of cases) {
      for (const k of c.keys) {
        assert.ok(!exOnlyTokens.has(k), `Case ${c.id} contains disallowed EX token: ${k}`);
      }
    }
  });

  it('runs a sampled validation batch of 200 stress cases with 100% pass rate', () => {
    const cases = JSON.parse(fs.readFileSync(CASES_FILE, 'utf8'));
    // Sample every 10th case
    const sampled = cases.filter((_, i) => i % 10 === 0);
    assert.strictEqual(sampled.length, 200);

    const result = runCases(sampled);
    assert.strictEqual(result.failed, 0, `Failed cases: ${JSON.stringify(result.errors)}`);
    assert.strictEqual(result.passed, 200);
  });
});
