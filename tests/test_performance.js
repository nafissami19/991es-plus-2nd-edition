/**
 * Performance and Key-Press Latency Benchmark Tests (Prompt 32).
 *
 * Verifies that key presses across all 8 calculator modes on fx-991ES PLUS 2nd edition
 * process and render well under the 16 ms budget (60 FPS responsiveness).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Calculator } from '../js/core/Calculator.js';

describe('Prompt 32 — Performance and Key Latency (< 16 ms)', () => {
  const modesBenchmark = [
    { name: 'Mode 1: COMP', keys: '1 + 2 * 3 = sin 3 0 ) = FRAC 1 DOWN 2 RIGHT + 3 = SQRT 8 =' },
    { name: 'Mode 2: CMPLX', keys: 'MODE 2 1 + 2 ENG + 3 - 4 ENG = 2 SHIFT (-) 4 5 =' },
    { name: 'Mode 3: STAT', keys: 'MODE 3 1 1 = 2 = 3 = AC SHIFT 1 3 1 =' },
    { name: 'Mode 4: BASE-N', keys: 'MODE 4 x^ 1 A + B = x² 1 0 0 =' },
    { name: 'Mode 5: EQN', keys: 'MODE 5 3 1 = 2 = 1 = =' },
    { name: 'Mode 6: MATRIX', keys: 'MODE 6 1 5 1 = 2 = 3 = 4 = AC SHIFT 4 3 =' },
    { name: 'Mode 7: TABLE', keys: 'MODE 7 ALPHA ) x² = = = =' },
    { name: 'Mode 8: VECTOR', keys: 'MODE 8 1 2 1 = 2 = AC SHIFT 5 3 =' }
  ];

  it('updates screen within 16 ms for every key press across all 8 modes', () => {
    let totalTime = 0;
    let totalKeys = 0;
    let maxLatency = 0;

    for (const b of modesBenchmark) {
      const calc = new Calculator();
      const keys = b.keys.split(' ');
      for (const k of keys) {
        const start = performance.now();
        calc.press(k);
        calc.getScreen();
        const duration = performance.now() - start;

        if (duration > maxLatency) {
          maxLatency = duration;
        }
        totalTime += duration;
        totalKeys++;

        assert.ok(
          duration < 16,
          `Key "${k}" in "${b.name}" took ${duration.toFixed(2)} ms (> 16 ms threshold)`
        );
      }
    }

    const avgLatency = totalTime / totalKeys;
    assert.ok(avgLatency < 2, `Average latency ${avgLatency.toFixed(2)} ms should be < 2 ms`);
    assert.ok(maxLatency < 16, `Max latency ${maxLatency.toFixed(2)} ms should be < 16 ms`);
  });
});
