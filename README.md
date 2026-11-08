# Casio fx-991ES PLUS 2nd edition Web Re-creation

A clean-room, pixel-accurate web re-creation of the **Casio fx-991ES PLUS 2nd edition** scientific calculator (NATURAL-V.P.A.M.).

> **Disclaimer**: This is a personal-use educational and preservation project. It is not affiliated with, endorsed by, or associated with Casio Computer Co., Ltd. Casio and NATURAL-V.P.A.M. are registered trademarks of Casio Computer Co., Ltd. No Casio ROMs, binaries, or proprietary assets are included or used in this codebase.

## Key Features

- **Custom 15-Digit Decimal Engine (`Decimal15`)**: True BCD-style decimal mathematics avoiding standard IEEE-754 floating-point inaccuracies.
- **Natural Textbook Display (NATURAL-V.P.A.M.)**: 2D formatting for stacked fractions, radicals, powers, integrals, summations, derivatives, and matrices.
- **Exact Calculation Engine**: Fractions, radicals ($\pm a\sqrt{b}/c \pm d\sqrt{e}/f$), $\pi$ forms, sexagesimal degrees/minutes/seconds, and exact/decimal toggling via $S\Leftrightarrow D$.
- **96 × 31 Dot-Matrix LCD**: Faithful monochrome display with persistent status indicator row (`S`, `A`, `M`, `STO`, `RCL`, `STAT`, `CMPLX`, `MAT`, `VCT`, `D`, `R`, `G`, `FIX`, `SCI`, `Math`, `▼`, `▲`, `Disp`).
- **All 8 Operation Modes**:
  1. `COMP` (Basic & Scientific Calculation, Calculus, CALC, SOLVE)
  2. `CMPLX` (Complex Number Arithmetic & Polar/Rectangular Form)
  3. `STAT` (1-Variable & 7 Regression Types with FREQ weighting)
  4. `BASE-N` (32-bit Dec/Hex/Oct and 16-bit Bin Logic & Conversions)
  5. `EQN` (2/3-Unknown Linear Systems & Quadratic/Cubic Solvers)
  6. `MATRIX` (3×3 Matrix Operations, Determinant, Transpose, Inverse)
  7. `TABLE` (Function Table Generation up to 30 rows)
  8. `VECTOR` (2D/3D Vector Operations, Dot & Cross Product)
- **Zero Build Step**: Native ECMAScript (ES) modules running cleanly in modern browsers and headless Node.js environments.
- **Offline Progressive Web App (PWA)**: Installable with service worker caching.

## How to Run

Start the local static HTTP server:

```bash
npm start
```

Open your browser to `http://localhost:5174`.

## Running the Automated Tests

Run the full test suite in Node.js (Node 20+ required):

```bash
npm test
```
