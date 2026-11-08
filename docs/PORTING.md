# Porting Matrix: fx-991EX ClassWiz → fx-991ES PLUS 2nd edition

## 1. EX-Only Features Removed or Replaced

The following features present in the ClassWiz fx-991EX codebase have been omitted or marked for adaptation:

| EX-Only Feature | Location in Copied Code | Status in fx-991ES PLUS 2nd Edition |
|---|---|---|
| **192 × 63 Screen** | `js/core/ui/Screen.js`, `js/lcd/` | Replaced by 96 × 31 dot matrix + fixed status icon row |
| **MENU Icon Grid** | `js/core/apps/systemViews.js` (`MainMenuView`) | Replaced by 8-mode numbered text menu (MODE key) |
| **OPTN Key & Menus** | `js/core/Calculator.js`, `CalcApp.js`, modes | Removed entirely; replaced by dedicated menus (hyp, DRG▸, SHIFT 1..5) |
| **Spreadsheet Mode** | `modes/spreadsheet/` | Removed (not present on ES PLUS) |
| **Distribution Mode** | `modes/distribution/` | Removed (not present on ES PLUS; standard P/Q/R/t in STAT) |
| **Inequality Mode** | `modes/inequality/` | Removed (not present on ES PLUS) |
| **Ratio Mode** | `modes/ratio/` | Removed (not present on ES PLUS) |
| **MatD / 4×4 Matrices / Identity / RREF** | `modes/matrix/` | Restricted to MatA–MatC, max 3×3; det, Trn, x⁻¹, x², x³, Abs only |
| **VctD / Vector Angle / Unit Vector** | `modes/vector/` | Restricted to VctA–VctC, 2D/3D; Dot, ×, Abs only |
| **4-Unknown / Quartic Equations / Vertex** | `modes/equation/` | Restricted to 2-3 unknowns and quadratic/cubic polynomial |
| **TABLE g(x) / 45 rows** | `modes/table/` | Single f(x) only; maximum 30 rows (`Insufficient MEM`) |
| **Lowercase x, y variables / PreAns** | `js/core/memory.js`, `CalcApp.js` | Uppercase X, Y only; no PreAns variable |
| **FACT / GCD / LCM / Int / Intg / ÷R / Π** | `js/core/number/functions.js`, `parser.js` | Omitted from reachable input and menus |
| **Recurring decimals (`RecurringDecimal`)** | `js/core/exact/` | Not present on ES PLUS |
| **SETUP Items (Eng Symbol, Digit Sep, QR, etc.)** | `js/core/setup.js`, `systemViews.js` | Replaced with Casio ES 2-page SETUP (MthIO, LineIO, Deg, Rad, Gra, Fix, Sci, Norm, ab/c, d/c, CMPLX, STAT, Disp, CONT) |
| **QR Code via SHIFT OPTN** | `js/core/apps/QRView.js` | Removed; QR code only shown via MODE 0 (Calculator ID screen) |
| **1-VAR Quartiles & Median / CMPLX ReP/ImP** | `modes/statistics/`, `modes/complex/` | Not present on ES PLUS |
| **MathI / MathO naming** | `setup.js` | Renamed to `MthIO-MathO`, `MthIO-LineO`, `LineIO` |
| **Calculus without tolerance** | `eval/calculus.js` | Optional tol parameter supported in LineIO |

---

## 2. File-by-File Porting Status

| Copied File | Status | Notes / Changes Made |
|---|---|---|
| `package.json` | Complete | Renamed to `casio-991es-plus-2nd`, scripts updated |
| `scripts/serve.js` | Complete | Port configured to 5174 |
| `electron-main.cjs` | Complete | Standalone desktop app wrapper configured for 991ES PLUS 2nd ed |
| `index.html` | Complete | 96×31 LCD screen element, authentic SVG faceplate, key log drawer, shortcut modal |
| `popout.html` | Complete | Pop-out LCD layout synchronized via BroadcastChannel |
| `sw.js`, `manifest.webmanifest` | Complete | PWA offline caching with cleanroom icons |
| `js/core/number/Decimal15.js` | Complete | 15-digit BCD-style decimal math engine |
| `js/core/number/functions.js` | Complete | 991ES PLUS scientific functions, constants (π, e), domain limits; EX functions removed |
| `js/core/number/Rational.js` | Complete | BigInt fraction arithmetic |
| `js/core/exact/Rational.js` | Complete | Exact fraction representations |
| `js/core/exact/SurdForm.js` | Complete | Exact 2-term limit ±a√b/c ± d√e/f and Casio display boundaries |
| `js/core/exact/PiForm.js` | Complete | Exact π form with $|x| < 10^6$ limit |
| `js/core/exact/DMSForm.js` | Complete | Sexagesimal degree/minute/second format |
| `js/core/exact/ExactValue.js` | Complete | Unified exact value wrapper |
| `js/core/format/formatNumber.js` | Complete | 10-digit display rounding, Norm 1/2, Fix 0-9, Sci 1-10, Disp Dot/Comma |
| `js/core/format/display.js` | Complete | LineIO (with `┘`) and MthIO representations |
| `js/core/format/ResultView.js` | Complete | Exact/decimal toggles via S⇔D, SHIFT =, sexagesimal |
| `js/core/input/tokens.js` | Complete | 991ES PLUS token catalog, byte lengths, 99-byte limit |
| `js/core/input/Editor.js` | Complete | INS wrap in MthIO, overwrite in LineIO, ■ cursor at ≤ 10 bytes |
| `js/core/input/keyInput.js` | Complete | Key mappings for 50-key ES PLUS layout |
| `js/core/parse/parser.js` | Complete | Casio 13-level priority table, implicit closing brackets, multi-statements |
| `js/core/eval/evaluate.js` | Complete | Evaluator hooks for 8 ES PLUS modes |
| `js/core/eval/calculus.js` | Complete | Gauss–Kronrod ∫ and d/dx with Richardson extrapolation and optional tol |
| `js/core/errors.js` | Complete | 9 ES errors, 96×31 error screen formatting with Cancel and Goto |
| `js/core/Calculator.js` | Complete | 8 modes, 96×31 screen, 18 ES indicators, MODE key routing |
| `js/core/keys.js` | Complete | 50 physical keys, ES aliases |
| `js/core/setup.js` | Complete | 2-page SETUP options, MthIO-MathO/LineO, LineIO, Deg/Rad/Gra |
| `js/core/memory.js` | Complete | A–F, M, X, Y, Ans; mode memories; history buffer |
| `js/core/ui/Screen.js` | Complete | Framebuffer 96×31, 18 status indicator flags |
| `js/core/ui/views.js` | Complete | Menu views tailored for 96×31 dot matrix |
| `js/core/apps/CalcApp.js` | Complete | COMP mode logic, history buffer, CALC/SOLVE integration |
| `js/core/apps/calcSolve.js` | Complete | Interactive CALC/SOLVE screens for 96×31 |
| `js/core/apps/systemViews.js` | Complete | MODE menu (8 items + 0 Calculator ID), 2-page SETUP, CLR menu, CONT |
| `js/core/qr/qrcode.js` | Complete | Cleanroom QR code generator for MODE 0 demo screen |
| `js/core/data/constants.js` | Complete | 40 CODATA 2014 constants (SHIFT 7) |
| `js/core/data/conversions.js` | Complete | 40 NIST SP 811 conversions (SHIFT 8) |
| `js/core/modes/registry.js` | Complete | Configured with 8 modes |
| `js/core/modes/baseN/` | Complete | 16-bit BIN, 32-bit DEC/HEX/OCT, direct A–F keys, SHIFT 3 menu |
| `js/core/modes/complex/` | Complete | Complex arithmetic, polar form, SHIFT 2 menu |
| `js/core/modes/equation/` | Complete | 2–3 unknowns, degree 2–3 polynomials, real & complex roots |
| `js/core/modes/matrix/` | Complete | MatA–C up to 3×3, Matrix Editor, SHIFT 4 menu |
| `js/core/modes/statistics/` | Complete | 1-Var + 7 regression types, Stat Editor with FREQ, SHIFT 1 menu |
| `js/core/modes/table/` | Complete | f(x) only, 30-row maximum, Insufficient MEM |
| `js/core/modes/vector/` | Complete | VctA–C (2D/3D), Vector Editor, SHIFT 5 menu |
| `js/lcd/raster.js` | Complete | Framebuffer 96×31 dot matrix |
| `js/lcd/natural_display.js` | Complete | Box layout scaled for 96×31 and 2-line display |
| `js/lcd/canvas_lcd.js` | Complete | Canvas rendering at 96×31 + 18 status bar indicators |
| `js/keypad.js` | Complete | 50 key hitboxes and PC keyboard mapping |
