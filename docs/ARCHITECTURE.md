# Architecture — fx-991ES PLUS 2nd edition Re-creation

Plain ES modules, no build step, no framework, no runtime dependencies. Everything under `js/core/` and `js/lcd/` (except `canvas_lcd.js`) runs in Node with no DOM, so automated tests drive the calculator with simulated key presses and inspect the screen state.

## 1. Key press → screen pipeline

```
browser: js/keypad.js (faceplate hit boxes, PC keyboard shortcuts, hold-to-repeat)
            │ key name from assets/data/key_layout.json ("SIN", "7", "EXE", …)
            ▼
js/core/Calculator.js  press(name) → resolveKey() (keys.js: physical keys and aliases)
            │ SHIFT / ALPHA latch → ev = { key, shift, alpha }
            │ global keys: ON, SHIFT AC (OFF), MODE, SHIFT MODE (SETUP), SHIFT 9 (CLR)
            ▼
top view .onKey(ev)          overlay stack (menus, prompts) on top of current mode app
            ▼
getScreen() → view.render(Screen) → { indicators, lines, pixels(96×31), statusIcons, contrast, poweredOn }
            ▼
browser: js/lcd/canvas_lcd.js draws 96×31 dot matrix + status indicator row (S, A, M, STO, RCL, STAT, CMPLX, MAT, VCT, D, R, G, FIX, SCI, Math, ▼, ▲, Disp)
```

## 2. Directory Layout & Module Responsibilities

| Path | Description |
|---|---|
| `js/core/Calculator.js` | Top-level headless calculator engine. Owns `setup`, `memory`, `mode`, active mode app, overlay `views`, power state. Provides `press(name)`, `pressSequence(seq)`, `getScreen()`, `exportState()`, `importState()`. |
| `js/core/keys.js` | 50 physical keys, label aliases ('+', '=', 'sin', 'π'), variable key mappings (STO/RCL/ALPHA). |
| `js/core/setup.js` | Two-page SETUP defaults (MthIO/LineIO, Deg/Rad/Gra, Fix/Sci/Norm, ab/c, d/c, CMPLX, STAT, Disp Dot/Comma, CONT) and formatting options. |
| `js/core/memory.js` | Variables A–F, M, X, Y, Ans (ExactValue); mode memories (`modeData` for MatA–C, VctA–C, statData); calculation history (~200 bytes for COMP, CMPLX, BASE-N). No PreAns. |
| `js/core/input/tokens.js` | Token definitions (id, display glyphs, byte sizes for 99-byte limit), template slot metadata. |
| `js/core/input/Editor.js` | Input buffer: AST-like template tree + cursor path, 99-byte tracking, ■ block cursor at ≤10 bytes, INS (Natural wrap / Linear overwrite), DEL, AC. |
| `js/core/input/keyInput.js` | Maps physical keys (+SHIFT/ALPHA) to token insertion or template actions based on active mode. |
| `js/core/parse/parser.js` | Parses Editor tree into syntax tree following the exact 13-level Casio priority table, omitted multiplication, implicit bracket closing, multi-statements (`:`), syntax error tracking. |
| `js/core/eval/evaluate.js` | Evaluator: AST → `ExactValue` (rational / surd / π / sexagesimal / decimal) or mode-specific values. |
| `js/core/eval/calculus.js` | Numerical calculus: ∫ (Gauss–Kronrod 7/15 adaptive quadrature with optional tol, default 1×10⁻⁵), d/dx (central difference with Richardson extrapolation and optional tol, default 1×10⁻¹⁰), Σ (exact integer summation). |
| `js/core/number/` | `Decimal15` (15-digit BCD-style decimal arithmetic, exponent -99..99), `functions.js` (Casio scientific function library with exact domain limits), `Rational.js` (arbitrary-precision exact integer rationals). |
| `js/core/exact/` | Exact result representation classes: `Rational`, `SurdForm` (two-term limits ±a√b/c ± d√e/f), `PiForm`, `DMSForm`, `ExactValue`. |
| `js/core/format/` | `formatNumber.js` (Norm 1/2, Fix 0–9, Sci 1–10, ENG/←ENG), `display.js`, `ResultView.js` (exact/decimal toggles via S⇔D, SHIFT =, sexagesimal). |
| `js/core/errors.js` | Error catalog: `Math ERROR`, `Stack ERROR`, `Syntax ERROR`, `Argument ERROR`, `Dimension ERROR`, `Variable ERROR`, `Can't Solve`, `Insufficient MEM`, `Time Out`. Error screens with `[AC] :Cancel` and `[◀][▶]:Goto`. |
| `js/core/ui/Screen.js` | Headless 96×31 screen model: framebuffer dot matrix + text `lines`. Supports pixel plotting, text drawing, line drawing, natural box layout rendering, and status icon flags. |
| `js/core/ui/views.js` | Overlay views: `MenuView`, `ConfirmView`, `MessageView`, `DigitPromptView`. |
| `js/core/apps/CalcApp.js` | Mode 1 (COMP) application: calculation lifecycle, edit/result/disp/error phases, history navigation, STO/RCL, M+/M−, CALC, SOLVE, multi-statement evaluation. |
| `js/core/apps/calcSolve.js` | CALC interactive variable prompt screen and SOLVE (Newton's method root finder with `L-R=` display). |
| `js/core/apps/systemViews.js` | MODE numbered menu, two-page SETUP menu, Contrast adjustment view, CLR (Setup/Memory/All) confirmation views. |
| `js/core/qr/qrcode.js` | QR Code generator for MODE 0 Calculator ID screen. |
| `js/core/data/` | Scientific constants (40 constants, CODATA 2014) and metric conversions (40 conversions, NIST SP 811). |
| `js/core/modes/` | The 8 calculation modes: COMP (`CalcApp`), CMPLX (`complex`), STAT (`statistics`), BASE-N (`baseN`), EQN (`equation`), MATRIX (`matrix`), TABLE (`table`), VECTOR (`vector`). |
| `js/lcd/` | LCD rendering engine: `raster.js`, `natural_display.js`, `layout.js`, `canvas_lcd.js`, bitmap fonts in `fonts/`. |
| `js/keypad.js` | Faceplate hit detection, mouse/touch event handling, button press visual states, hold-to-repeat, keyboard shortcut router. |
| `index.html`, `css/calculator.css` | Main responsive single-page application. |
| `popout.html`, `js/popout.js` | Detachable LCD pop-out window synchronized with main calculator state. |
| `sw.js`, `manifest.webmanifest` | Offline-capable Progressive Web Application. |

## 3. The 8 Modes of the fx-991ES PLUS 2nd edition

1. **COMP** (Mode 1, `CalcApp`): Standard arithmetic, calculus (∫, d/dx, Σ), scientific constants (SHIFT 7), metric conversions (SHIFT 8), CALC, SOLVE.
2. **CMPLX** (Mode 2, `modes/complex`): Complex numbers $a+bi$ and polar $r\angle\theta$, `i` (ALPHA ENG), `∠` (SHIFT (−)), SHIFT 2 menu (arg, Conjg, ▸r∠θ, ▸a+bi).
3. **STAT** (Mode 3, `modes/statistics`): 1-Variable and 7 paired-variable regression models (A+BX, _+CX², ln X, e^X, A•B^X, A•X^B, 1/X), FREQ column, data editor, SHIFT 1 menus (Sum, Var, Reg, MinMax, Distr P/Q/R/▸t). Automatically in Linear Display.
4. **BASE-N** (Mode 4, `modes/baseN`): 32-bit (BIN 16-bit) two's complement integer logic and arithmetic. DEC, HEX, BIN, OCT modes; direct hex keys A–F; SHIFT 3 menu (and, or, xor, xnor, Not, Neg; prefixes d, h, b, o). Automatically in Linear Display.
5. **EQN** (Mode 5, `modes/equation`): 2-unknown and 3-unknown simultaneous linear equations, quadratic and cubic polynomial equations. Real and complex solutions.
6. **MATRIX** (Mode 6, `modes/matrix`): Up to 3×3 matrices MatA, MatB, MatC, MatAns. Operations +, −, ×, scalar ×, det, Trn, x⁻¹, x², x³, Abs. SHIFT 4 menu. Automatically in Linear Display.
7. **TABLE** (Mode 7, `modes/table`): Generates table of values for a single function $f(x)$ with Start, End, Step parameters (up to 30 rows).
8. **VECTOR** (Mode 8, `modes/vector`): 2D and 3D vectors VctA, VctB, VctC, VctAns. Operations +, −, scalar ×, Dot product (·), cross product (×), Abs (magnitude). SHIFT 5 menu. Automatically in Linear Display.

## 4. State Persistence and Lifecycle

- Variables A–F, M, X, Y, Ans, matrices MatA–C, vectors VctA–C, and setup preferences persist across power off/on cycles and page reloads via `localStorage`.
- Calculation history (~200 bytes) is cleared by power-on (ON key self-test), mode changes, display format changes (MthIO ⇄ LineIO), and CLR Setup/All.
- Stat data is cleared when switching modes or toggling the FREQ setting in SETUP.
