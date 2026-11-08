# Golden Tests & KeyLog Import Guide — Casio fx-991ES PLUS 2nd edition

## 1. Overview

Golden tests verify that a sequence of physical key presses on the calculator produces the exact expected display lines, result values, and status indicators matching the official Casio emulator.

Golden test definitions reside in `tests/golden/` as `.json` files.

---

## 2. Golden Test JSON Format

```json
{
  "name": "Fraction Addition: 2/3 + 1/2 = 7/6",
  "source": "guide",
  "setup": {
    "display": "MthIO-MathO",
    "angle": "Deg",
    "format": "Norm1",
    "fraction": "d/c"
  },
  "keys": ["2", "FRAC", "3", "RIGHT", "ADD", "1", "FRAC", "2", "EXE"],
  "expect": {
    "lines": ["2/3+1/2", "7/6"],
    "result": "7/6",
    "indicators": ["Math", "D"]
  }
}
```

### Fields:
- `name`: Descriptive test title.
- `source`: `"guide"` (published in Casio manual), `"emulator"` (confirmed on official software), or `"unverified"` (candidate case).
  - Unverified cases run and report warnings on difference without breaking the test run.
- `setup`: Calculator initial state (`display`, `angle`, `format`, `fraction`, `complex`, `statFreq`).
- `keys`: Array of canonical key names to simulate in sequence.
- `expect`:
  - `lines`: Array of displayed text lines.
  - `result`: Expected text in the bottom right result line.
  - `indicators`: Status indicator names that must be active (`Math`, `D`, `R`, `G`, `S`, `A`, `M`, `STO`, `STAT`, `CMPLX`, `MAT`, `VCT`, `FIX`, `SCI`, `Disp`).
  - `notIndicators`: Status indicator names that must be inactive.
  - `error`: Error message if calculation is expected to fail (`Math ERROR`, `Syntax ERROR`, etc.).
- `expectedFail`: Boolean. If `true`, the test is tracked as a pending todo rather than a test failure.

---

## 3. Importing from the Official Emulator (`KeyLog`)

The official Casio emulator (`fx-570ES_991ES PLUS 2nd edition Emulator.exe`) has a built-in KeyLog window (`Tools` $\rightarrow$ `KeyLog`).

### How to use `scripts/import_keylog.js`:

1. In the official emulator, execute your calculation (e.g. `2 □/□ 3 ▶ + 1 □/□ 2 =`).
2. Open `Tools` $\rightarrow$ `KeyLog`, copy the text, and save it to a file (e.g. `keylog.txt`).
3. Run the import script:
   ```bash
   node scripts/import_keylog.js keylog.txt tests/golden/calculate/case_01.json
   ```
4. The script maps emulator symbols (`[■/□]`, `[▲]`, `[×10ˣ]`, etc.) directly into our canonical key names (`FRAC`, `UP`, `EXP10`, etc.) and outputs a ready-to-run golden test case JSON!
