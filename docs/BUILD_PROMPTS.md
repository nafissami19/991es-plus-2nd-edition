# fx-991ES PLUS 2nd edition Re-creation — Full Build Prompt Pack

A step-by-step pathway for building a calculator that **behaves, looks and responds like the Casio fx-991ES PLUS 2nd edition** (NATURAL-V.P.A.M.), written from scratch (no Casio ROM).

It is written for **Google Antigravity** (it also works with Claude Code, Cursor, Codex…). Paste **one prompt at a time**, in order. Do not move on until that prompt's **"Done when"** list is true and you have run its **"Check it yourself"** key presses.

> Personal-use project. Keep the GitHub repo **private**. Never commit or upload Casio's ROM, DLLs, fonts, faceplate bitmaps, screenshots or manuals.

---

## What's different from the fx-991EX pack (read this once)

This pack is based on `BUILD_PROMPTS.md` (the one you used for the fx-991EX). Changes:

1. **We reuse the finished fx-991EX engine.** Your EX project (`Casio 991ex duplicate`) already has a working 15-digit decimal engine, exact fractions/surds/π, parser, Gauss–Kronrod, golden-test harness, pixel diff tool, glyph tracer, keypad, pop-out and installer scripts. Prompt 1 copies the shared parts across and strips the EX-only parts. This saves weeks and avoids re-solving solved problems.
2. **Every prompt has "Check it yourself" key sequences** with expected results, taken from the official 2nd-edition User's Guide where possible. Anything marked **VERIFY** is my best expectation and must be confirmed on the official emulator before it becomes a golden test.
3. **A guardrail list of EX-only features** is in Prompt 0, so the agent doesn't copy ClassWiz behaviour (icon menu, OPTN key, spreadsheet, 192×63 screen, etc.).
4. **The official emulator's own tools are used as the answer key**: its **KeyLog** window (exact key sequences you can copy) and **Capture Screen** (pixel-exact LCD images for fonts and pixel tests).
5. **Fewer modes, smaller screen, more precise limits.** The ES PLUS has 8 modes, a 96 × 31 dot screen, 3×3 matrices, 3 variables per type (MatA–C, VctA–C), f(x)-only tables. Prompts are scoped to exactly that.

---

## How to use this pack with Antigravity

1. Open the project folder `C:\Users\sami6\OneDrive\Desktop\Casio Fx 991es plus 2nd edition` in Antigravity (it's an empty git repo you already created). After Prompt 1 has run, copy this file into the project as `docs/BUILD_PROMPTS.md` (later prompts refer to it).
2. Use **Planning** mode for each prompt so the agent shows you a plan before it writes code. Approve the plan, then let it run.
3. At the start of **every new conversation**, paste **Prompt 0 (Master Context)** first.
4. Paste the next numbered prompt you haven't finished.
5. When the agent says it's done: check its **"Done when"** list, then run the **"Check it yourself"** key presses in the app *and* in the official emulator side by side.
6. Any difference → paste the **Fix prompt template** (bottom of this file).
7. After each prompt: the agent ticks it in `docs/STATUS.md`; you commit (GitHub Desktop is fine).

**The secret to "exact":** the official emulator is the answer key. Every behaviour is decided by "what does the official emulator show for these exact key presses?", not by what the AI thinks is mathematically nice.

**Using the official emulator as a measuring tool** (`fx-570ES_991ES PLUS 2nd edition Emulator.exe`):
- **Tools → KeyLog** shows every key you pressed. Copy it (copy/select-all buttons) and paste it into a golden test or a fix prompt. No more typing key names by hand.
- **Tools → Capture Screen** (or Ctrl+C) copies the LCD image to the clipboard. **Capture Setting → ×N Zoom** sets the zoom; use **×1** for font tracing and pixel tests. Paste into Paint and save as PNG in `docs/reference/captures/` (git-ignored).
- **Window → Pop-up Display** shows the LCD alone; handy for side-by-side checks.
- Its PC keyboard shortcuts (copy them in your app): Tab/Space = AC, F1 = SHIFT, F2 = ALPHA, F3/Home = MODE, F4 = ON, Enter = `=`, Delete/Backspace = DEL, arrow keys = ◀▶▲▼, `^` = x^■, `( )` `+ - * /` `.` `,` `0–9` as printed.

---

## Part 1 — How the real fx-991ES PLUS 2nd edition works

Facts below come from the 2nd-edition English User's Guide (Casio's online manual, 2019, "fx-570ES PLUS / fx-991ES PLUS / fx-9910NG PLUS (2nd edition / NATURAL-V.P.A.M.)"), the 1st-edition PDF guide, and the official emulator's faceplate. Items marked **VERIFY** need checking on the official emulator.

### Hardware and screen
- CPU: LAPIS nX-U8 family, decimal (BCD) maths. Never shows `0.30000000000000004`.
- **LCD: 96 × 31 dot matrix** (VERIFY with a ×1 Capture Screen; the guide confirms the screen is 31 dots tall: "maximum formula height is two display screens (31 dots × 2)").
- **Status indicator row** of fixed icons above the dot matrix: `S` (SHIFT), `A` (ALPHA), `M`, `STO`, `RCL`, `STAT`, `CMPLX`, `MAT`, `VCT`, `D` / `R` / `G` (angle unit), `FIX`, `SCI`, `Math`, `▼`, `▲`, `Disp`. Plus `◀`/`▶` scroll marks drawn in the dot area when input or results continue off-screen.
- **Two-line display**: input expression on top, result on the bottom (right-aligned). In Natural Display a tall expression can use the whole screen and scroll.
- Power: fx-991ES PLUS = solar cell + LR44 button battery. ON key; SHIFT AC = OFF; **auto power-off after about 10 minutes** (fixed, not a SETUP item). Pressing ON runs a self-check and **clears calculation history**.
- Contrast: SETUP page 2 → `6:◀CONT▶`, adjust with ◀ ▶, AC to exit.

### Numbers
- Internal: **15 significant digits**. Calculation range ±1×10⁻⁹⁹ to ±9.999999999×10⁹⁹, or 0. Beyond → `Math ERROR`.
- Display: **10-digit mantissa** + 2-digit exponent; rounded for display only.
- Internal constants as stated by the guide: **π = 3.14159265358980**, **e = 2.71828182845904** (note e is *not* simply rounded — check `e − 2.718281828 =` on the emulator, VERIFY).
- Norm 1: exponent form when |x| < 10⁻² or |x| ≥ 10¹⁰. Norm 2: when |x| < 10⁻⁹ or |x| ≥ 10¹⁰.

### Display formats (SETUP 1/2)
- `1:MthIO` → then `1:MathO` (natural input, exact output) or `2:LineO` (natural input, decimal/linear output).
- `2:LineIO` → linear input and output (fractions as `7⌋6`).
- **STAT, BASE-N, MATRIX and VECTOR modes switch to Linear Display automatically.**
- In MathO, **SHIFT =** gives the decimal result directly (then S⇔D gives fraction/π form, never √ form).

### Exact results (MathO)
- Fractions reduced to lowest terms; improper `d/c` (default) or mixed `a b/c` (SETUP).
- Mixed fraction impossible if integer + numerator + denominator + separators > 10 digits.
- **√ form** (new section in the 2nd-edition guide): at most two terms (an integer counts as a term). Shapes `±a√b`, `±d ± a√b`, `±a′√b/c ± d′√e/f`, with integers 1 ≤ a < 100, 1 < b < 1000, 1 ≤ c < 100, 0 ≤ d < 100, 0 ≤ e < 1000, 1 ≤ f < 100. Outside → decimal. Example: `10√2 + 15×3√3 = 45√3 + 10√2`, but `99√999 = 3129.089165` (it would be 297√111; 297 is out of range).
- **π form**: only when |x| < 10⁶.
- Ran# shows as a fraction in Natural Display.
- EQN simultaneous-equation solutions never use √ form.

### Input
- **99 bytes** per calculation; most tokens 1 byte, some 3–13 bytes. Cursor changes to a block **■ when 10 bytes or less remain**.
- Max formula height 2 screens (62 dots); nesting too deep blocks further input.
- Natural: ▶ at the end jumps to the start, ◀ at the start jumps to the end. Linear: ▲ jumps to the start, ▼ to the end.
- **INS (SHIFT DEL)**: in Natural Display, pressing INS then a function wraps the value/expression to the right of the cursor as that function's argument (works with: fraction, √, ∛, x^■, ■√□, log■□, 10^■, e^■, ∫, d/dx, Σ, Abs). In Linear Display INS toggles insert/overwrite (cursor `|` vs `_`).
- x², x³, x⁻¹, x^■ cannot follow each other directly: `2 x² x²` ignores the second x².
- Multiplication sign may be omitted before `(`, a parenthesised function, Ran#, a variable (A–F, M, X, Y), a constant, π, e.
- Closing brackets before `=` may be omitted. **Functions that open a bracket (sin, log, Abs…) need their `)` closed**, or the rest of the line becomes the argument (`sin 30 + 15 =` → sin 45 = 0.7071067812).
- Multi-statements with `:` (ALPHA ∫). The `Disp` indicator shows during intermediate results.

### Calculation priority (13 levels, identical in 1st and 2nd edition)
1. Parentheses
2. Prefix functions with brackets (sin(, log(, Abs(, Pol(, ∫(…)
3. Postfix and powers/roots: x², x³, x⁻¹, x!, °′″, °, r, g, %, ▸t, x^, ■√□
4. Fractions
5. Negative sign (−), base-n prefixes d h b o
6. Metric conversion commands (cm▸in…), STAT estimates x̂ ŷ x̂1 x̂2
7. **Omitted multiplication** (2π, 2A, 2(3+4))
8. nPr, nCr, ∠
9. Dot product (·)
10. × ÷
11. + −
12. and
13. or, xor, xnor

### Errors
`Math ERROR`, `Stack ERROR`, `Syntax ERROR`, `Argument ERROR`, `Dimension ERROR` (MATRIX/VECTOR only), `Variable ERROR` (SOLVE only), `Can't Solve` (SOLVE only), `Insufficient MEM` (TABLE with more than 30 x-values), `Time Out` (∫ / d/dx). ◀ or ▶ jumps to the error position; AC clears the calculation. Stack sizes are not published: measure them on the emulator. Error screen layout (VERIFY): message on line 1, `[AC] :Cancel` and `[◀][▶]:Goto` below.

### Modes (MODE key)
`1:COMP  2:CMPLX  3:STAT  4:BASE-N  5:EQN  6:MATRIX  7:TABLE  8:VECTOR`. **MODE then 0** shows the 2nd-edition **Calculator ID** screen (24-character ID + QR code). AC returns to the mode menu.

### SETUP (SHIFT MODE), two pages, ▲▼ to switch
- Page 1: `1:MthIO  2:LineIO  3:Deg  4:Rad  5:Gra  6:Fix  7:Sci  8:Norm`
- Page 2: `1:ab/c  2:d/c  3:CMPLX (1:a+bi 2:r∠θ)  4:STAT (1:ON 2:OFF — FREQ column)  5:Disp (1:Dot 2:Comma)  6:◀CONT▶`
- Defaults: MthIO-MathO, Deg, Norm 1, d/c, a+bi, STAT OFF, Dot.
- Fix: 0–9 decimal places. Sci: 1–10 significant digits (key 0 = 10, VERIFY). Norm: 1 or 2. Exact prompt texts: VERIFY.
- Disp Comma affects results only (input always uses a dot). Multiple-result separator becomes `;`.

### Memory
- Variables **A, B, C, D, E, F, M, X, Y** (uppercase X and Y), **Ans**. **No PreAns.**
- Ans is updated by `=`, `SHIFT =`, `M+`, `SHIFT M−`, `STO`. Ans, M and variables survive AC, mode change and power off.
- M+ / M− add/subtract to M; `M` indicator when M ≠ 0.
- **CLR (SHIFT 9)**: `1:Setup  2:Memory  3:All`, each followed by a `=` (Yes) / AC (Cancel) confirmation.
- **History (▲/▼)**: COMP, CMPLX and BASE-N only, about 200 bytes. Cleared by ON, mode change, display-format change, CLR Setup/All.
- **Replay**: ◀/▶ after a result edits the previous expression.

### Calculus and solving
- ∫: Gauss–Kronrod, **COMP only**. Linear syntax `∫(f(x), a, b, tol)`, default tol 1×10⁻⁵; use tol ≥ 1×10⁻¹⁴. `Time Out` when it can't meet tol.
- d/dx: central difference, linear `d/dx(f(x), a, tol)`, default tol 1×10⁻¹⁰ (auto-adjusted if it fails).
- Σ: integers −1×10¹⁰ < a ≤ b < 1×10¹⁰. (No Π product on this model.)
- Pol, Rec, ∫, d/dx, Σ cannot be used inside f(x), a, b or tol.
- CALC: COMP and CMPLX. SOLVE: COMP only, Newton's method, solution screen shows the variable and `L−R=`; `Continue: [=]` screen if it hasn't converged.

### Other functions
- hyp key opens a menu: `1:sinh 2:cosh 3:tanh 4:sinh⁻¹ 5:cosh⁻¹ 6:tanh⁻¹`.
- SHIFT Ans = DRG▸ menu: `1:°  2:r  3:g`.
- **40 scientific constants** (SHIFT 7, two-digit number), **CODATA 2014** values in the 2nd edition (the 1st edition used CODATA 2007 — values differ!).
- **40 metric conversions** (SHIFT 8, two-digit number), NIST SP 811 (2008). Not usable in BASE-N or TABLE.
- ENG / SHIFT ENG (←), °′″ input and conversion, %, Pol/Rec (results also stored in X and Y), x!, Abs, Ran# (0.000–0.999), RanInt#(a,b), nPr, nCr, Rnd.

### Mode details
- **CMPLX**: `i` = ALPHA ENG; `∠` = SHIFT (−). SHIFT 2 menu: `1:arg 2:Conjg 3:▸r∠θ 4:▸a+bi`. θ in −180° < θ ≤ 180°. Linear Display shows a and bi on separate lines.
- **STAT**: 8 types `1:1-VAR 2:A+BX 3:_+CX² 4:ln X 5:e^X 6:A•B^X 7:A•X^B 8:1/X`. Editor rows: 80 (X), 40 (X+FREQ or X+Y), 26 (X+Y+FREQ). SHIFT 1 menu: `1:Type 2:Data 3:Sum 4:Var 5:Distr` (1-VAR) or `5:Reg` (paired) `6:MinMax`; in the editor `3:Edit` → `1:Ins 2:Del-A`. Distr: `1:P( 2:Q( 3:R( 4:▸t`. No median/quartiles. Data is deleted when you leave STAT, change between 1-VAR and paired, or change the STAT (FREQ) setting.
- **BASE-N**: x² = DEC, x^ = HEX, log = BIN, ln = OCT. Hex digits A–F typed directly with (−) °′″ hyp sin cos tan. Binary 16 bits, others 32 bits (ranges in Prompt 22). SHIFT 3 menu: `1:and 2:or 3:xor 4:xnor 5:Not( 6:Neg(`, page 2: `1:d 2:h 3:b 4:o`. Integers only (fractions cut off).
- **EQN**: `1:anX+bnY=cn  2:anX+bnY+cnZ=dn  3:aX²+bX+c=0  4:aX³+bX²+cX+d=0`. `=` steps through solutions, ▲▼ scroll, AC back to the coefficient editor.
- **MATRIX**: up to **3×3**, MatA, MatB, MatC, MatAns. SHIFT 4: `1:Dim 2:Data 3:MatA 4:MatB 5:MatC 6:MatAns 7:det 8:Trn`. Inverse via x⁻¹, square x², cube x³, Abs.
- **TABLE**: **f(x) only**, prompts `Start?` (1), `End?` (5), `Step?` (1), **max 30 rows** → else `Insufficient MEM`. Table is view-only.
- **VECTOR**: 2D/3D, VctA, VctB, VctC, VctAns. SHIFT 5: `1:Dim 2:Data 3:VctA 4:VctB 5:VctC 6:VctAns 7:Dot`. Cross product with ×; Abs = length. No angle or unit-vector command.

### Key layout (50 keys) — from the official emulator faceplate

Colours: SHIFT legends **yellow** (~#F8D060), ALPHA legends **red/pink** (~#F87878), BASE-N legends and brackets **light blue** (~#70C0F8; the 1st-ed guide calls it green), CMPLX legends and brackets **purple**, STAT/MATRIX/VECTOR menus in **white brackets**. Body ~#4D4D4D, top-row keys and number keys grey (~#999999), function keys near-black (~#121212), **DEL and AC lime green** (~#8DC11F), LCD background ~#D6E3D6. Sample exact colours from a screenshot of the emulator.

| Row | Key | SHIFT (yellow) | ALPHA (red) | Mode legend |
|---|---|---|---|---|
| 0 | SHIFT, ALPHA, ◀▶▲▼ (round pad), MODE, ON | MODE → SETUP | | |
| 1 | CALC | SOLVE | = | |
| 1 | ∫□□ | d/dx■ | : | |
| 1 | x⁻¹ | x! | | |
| 1 | log■□ | Σ■ | | |
| 2 | □/□ (fraction) | ■□/□ (mixed) | | |
| 2 | √■ | ∛■ | | |
| 2 | x² | x³ | | DEC (blue) |
| 2 | x^■ | ■√□ | | HEX (blue) |
| 2 | log | 10^■ | | BIN (blue) |
| 2 | ln | e^■ | | OCT (blue) |
| 3 | (−) | ∠ (purple bracket) | A (blue bracket) | |
| 3 | °′″ | ← (VERIFY what it does) | B | |
| 3 | hyp | Abs | C | |
| 3 | sin | sin⁻¹ | D | |
| 3 | cos | cos⁻¹ | E | |
| 3 | tan | tan⁻¹ | F | |
| 4 | RCL | STO | | |
| 4 | ENG | ← (ENG left) | | i (purple) |
| 4 | ( | % | | |
| 4 | ) | , | X | |
| 4 | S⇔D | a b/c ⇔ d/c | Y | |
| 4 | M+ | M− | M | |
| 5 | 7 / 8 / 9 / DEL / AC | CONST / CONV / CLR / INS / OFF | | |
| 6 | 4 / 5 / 6 / × / ÷ | MATRIX / VECTOR / — / nPr / nCr | | |
| 7 | 1 / 2 / 3 / + / − | STAT / CMPLX / BASE / Pol / Rec | | |
| 8 | 0 / . / ×10ˣ / Ans / = | Rnd / Ran# / π / DRG▸ / — | — / RanInt / e / — / — | |

There is **no OPTN key, no MENU key, no x (variable) key, no FACT, no PreAns, no QR key** on this model.

### EX-only features — do NOT build these

| fx-991EX ClassWiz | fx-991ES PLUS 2nd edition |
|---|---|
| 192 × 63 LCD, multi-line, icon status bar | 96 × 31 LCD, 2-line display, fixed icon row |
| MENU key with 12-icon grid | MODE key with a numbered text menu (8 modes) |
| OPTN key and OPTN menus | none — hyp key menu, DRG▸ menu, SHIFT 1–5 mode menus |
| Spreadsheet, Distribution, Inequality, Ratio modes | not present (STAT 1-VAR has only P( Q( R( ▸t) |
| MatA–MatD up to 4×4, Identity, RREF | MatA–MatC up to 3×3; det, Trn, x⁻¹, x², x³, Abs only |
| VctA–VctD, angle, unit vector | VctA–VctC; Dot, ×, Abs only |
| 4 unknowns, quartic, quadratic vertex screens | 2–3 unknowns, quadratic, cubic only |
| TABLE f(x) and g(x), up to 45 rows | f(x) only, 30 rows |
| Variables x, y (lowercase), PreAns | X, Y (uppercase), no PreAns |
| FACT, GCD, LCM, Int, Intg, ÷R, Π, recurring decimals | not present |
| SETUP: Engineering Symbol, Digit Separator, Multiline Font, Language, Auto Power Off, QR, Table, Equation/Func | not present |
| QR code via SHIFT OPTN | Calculator ID + QR only via MODE 0 |
| 1-VAR median/quartiles, CMPLX ReP/ImP | not present |
| `MathI/MathO` naming | `MthIO-MathO` / `MthIO-LineO` / `LineIO` |
| ∫ / d/dx without tol | ∫ and d/dx take an optional tol argument |

### Where the real truth is
- **Spec:** 2nd-edition User's Guide, Casio's online manual:
  `https://support.casio.com/global/en/calc/manual/fx-570ESPLUS_991ESPLUS_en/` (start at `before_using_calculator/about.html`). Save the pages you need as PDF/HTML into `docs/reference/` (not committed).
- **Answer key:** `C:\Users\sami6\OneDrive\Desktop\fx-570ES_991ES PLUS 2nd edition Emulator\fx-570ES_991ES PLUS 2nd edition Emulator.exe` (its `EmulatorUsersGuide.pdf` only covers the Windows app, not the calculator).
- **Code to reuse:** `C:\Users\sami6\OneDrive\Desktop\Casio 991ex duplicate`.

---

## Part 2 — The prompts

---

### Prompt 0 — Master Context (paste at the start of EVERY session)

```
You are working on my personal project: a web-based re-creation of the Casio fx-991ES PLUS 2nd edition scientific calculator (NATURAL-V.P.A.M.).
Project folder: C:\Users\sami6\OneDrive\Desktop\Casio Fx 991es plus 2nd edition

GOAL: Behave, look and respond like the real fx-991ES PLUS 2nd edition, key press for key press: the same screens, results, rounding, error messages and menus.
- Answer key: the official Casio emulator at C:\Users\sami6\OneDrive\Desktop\fx-570ES_991ES PLUS 2nd edition Emulator\ (I run it and report what it shows; its KeyLog window gives exact key sequences and Capture Screen gives exact LCD pixels).
- Written spec: the 2nd-edition User's Guide, online at https://support.casio.com/global/en/calc/manual/fx-570ESPLUS_991ESPLUS_en/ and our summaries in docs/spec/.
- Code we reuse: my finished fx-991EX re-creation at C:\Users\sami6\OneDrive\Desktop\Casio 991ex duplicate (same architecture, different calculator). Read it, copy what fits, never edit it.

HARD RULES:
1. No Casio ROM, no decrypting, extracting or patching Casio files (DLL/EXE), no cracking activation. We write every line of logic ourselves.
2. Never commit Casio-derived files: anything in docs/reference/, emulator captures, screenshots, manuals, fonts. The repo stays private.
3. Plain HTML + CSS + JavaScript ES modules. No framework. No build step needed to run it.
4. All maths uses our own decimal number type (15 significant digits), never raw JS floating point for results.
5. The calculator logic (engine, parser, modes, screen layout) runs in Node with NO browser, so tests drive it with key presses. The browser layer only draws pixels and sends key presses.
6. Every feature gets tests. Run `npm test` before saying you're done, and paste the summary.
7. Don't rewrite working parts unless the prompt asks. Keep changes focused on the current prompt.
8. When the guide and the official emulator disagree, the emulator wins. When you are not sure what the real calculator does, STOP and ask me to check on the emulator, giving me the exact key sequence to press. Do not guess.
9. Read docs/STATUS.md, docs/ARCHITECTURE.md and docs/spec/differences_from_ex.md first (when they exist). Update STATUS.md at the end of each prompt.

THIS IS NOT THE fx-991EX. Do not add or keep any of these EX-only things:
192×63 screen; MENU icon grid; OPTN key/menus; Spreadsheet, Distribution, Inequality, Ratio modes; MatD, 4×4 matrices, Identity, RREF; VctD, vector angle/unit vector; 4-unknown or quartic equations; quadratic vertex screens; TABLE g(x) or 45 rows; lowercase x/y variables; PreAns; FACT, GCD, LCM, Int, Intg, ÷R, Π, recurring decimals; SETUP items Engineering Symbol, Digit Separator, Multiline Font, Language, Auto Power Off, QR, Table, Equation/Func; SHIFT OPTN QR; median/quartiles; ReP/ImP; "MathI/MathO" naming.
The ES PLUS has: 96×31 LCD + fixed status icons, MODE text menu with 8 modes (COMP, CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE, VECTOR), MODE 0 Calculator ID screen, hyp menu, DRG▸ menu, SHIFT 1–5 mode menus, MatA–MatC (3×3), VctA–VctC, variables A–F, M, X, Y, Ans, CLR menu (Setup/Memory/All), ∫ and d/dx with optional tol.

Structure (target):
- index.html, popout.html, css/calculator.css, js/app.js, js/keypad.js, js/popout.js
- js/core/ (Calculator.js, keys.js, setup.js, memory.js, number/, exact/, format/, input/, parse/, eval/, modes/<mode>/, ui/)
- js/lcd/ (raster, fonts, natural_display.js, canvas_lcd.js)
- assets/data/key_layout.json, assets/data/lcd_config.json, assets/faceplate/ (our own SVG faceplate)
- tests/ (unit, tests/golden/<area>/*.json, tests/pixel/)
- docs/ (STATUS.md, ARCHITECTURE.md, GOLDEN_TESTS.md, spec/, reference/ (git-ignored), fidelity/)

Before writing code for any prompt: give me a short plan (files you'll touch, approach, risks). Then do it. At the end: list what changed, test results, and anything you were unsure about (as a list of key sequences for me to check on the emulator).
```

---

### PHASE A — Foundation

---

### Prompt 1 — Bootstrap: port the shared engine from the fx-991EX project

```
The project folder is an empty git repo. My finished fx-991EX re-creation is at C:\Users\sami6\OneDrive\Desktop\Casio 991ex duplicate. Read its docs/ARCHITECTURE.md, docs/STATUS.md and docs/KNOWN_DIFFERENCES.md first. Do NOT modify that folder.

1. Copy into this project the parts that are not ClassWiz-specific, keeping the same folder layout:
   - package.json (rename to "casio-991es-plus-2nd", keep "type": "module", scripts start/test), scripts/serve.js (port 5174 so both projects can run at once)
   - js/core/number/ (Decimal15, functions, Rational), js/core/exact/, js/core/format/formatNumber.js
   - js/core/input/ (tokens, Editor, keyInput), js/core/parse/, js/core/eval/ (evaluate, calculus), js/core/errors.js
   - js/core/Calculator.js, keys.js, setup.js, memory.js, ui/ (Screen, views) — these WILL need ES changes later; copy them as a starting point
   - js/core/modes/ for complex, baseN, statistics, equation, matrix, table, vector, plus registry.js
   - js/lcd/ (raster, natural_display, layout, canvas_lcd, fonts as placeholders), js/keypad.js, js/app.js, popout files, sw.js, manifest
   - tests/ helpers, golden runner, pixel diff tool, scripts/trace_glyphs.py, and the unit tests for the copied modules
2. Do NOT copy: modes/spreadsheet, modes/distribution, modes/inequality, modes/ratio, apps/QRView (keep js/core/qr/qrcode.js — we reuse it for the Calculator ID screen), EX golden test JSON files, EX assets (fonts, faceplate.png, status bar images), docs/reference, dist/, electron build output.
3. Create .gitignore: node_modules, dist/, docs/reference/, docs/reference/captures/, assets/reference/, *.rom, *.bin, *.dll, *.exe, *.pdf, .env.
4. Run npm test. Unit tests for number/exact/format/parser should pass unchanged. Mark tests that depend on EX behaviour (192×63 screen, MENU grid, OPTN, PreAns, MatD, etc.) with { todo: 'ES port' } rather than deleting them, and list them.
5. Write docs/ARCHITECTURE.md for this project (adapted from the EX one), and docs/STATUS.md with a checklist of every prompt in this pack (Prompts 1–33), each Not started / Partial / Done with one line on why.
6. Write docs/PORTING.md: a table of every copied file → "reuse as is" / "needs ES changes (what)" / "EX-only, removed". Include the EX-only list from Prompt 0 and where each one lives in the copied code (e.g. PreAns in memory.js, OPTN handling in Calculator.js).
7. Add README.md (what it is, how to run, how to test, "personal project, not affiliated with Casio").

Done when: `npm start` serves the app at http://localhost:5174 (it may still look like the EX), `npm test` runs with 0 failures (todos allowed), PORTING.md lists every EX-only spot, and `git status` shows no Casio files.
```

**Check it yourself:** `npm test` summary shows 0 failing. Open http://localhost:5174 — it loads. Open `docs/PORTING.md` and confirm it mentions PreAns, OPTN, MENU, MatD, spreadsheet, QR.

---

### Prompt 2 — Write the ES spec from the 2nd-edition User's Guide

```
Read the fx-991ES PLUS 2nd-edition User's Guide (online: https://support.casio.com/global/en/calc/manual/fx-570ESPLUS_991ESPLUS_en/ — follow its table of contents; any pages I saved in docs/reference/ too). Also read "Part 1" of docs/BUILD_PROMPTS.md (I'll copy this pack there). Write our own summary spec files in docs/spec/ (our own words and tables, not copied paragraphs):

- keys.md — all 50 keys: normal, SHIFT, ALPHA, and the mode-only meanings (CMPLX i and ∠, BASE-N DEC/HEX/BIN/OCT and A–F, STAT/MATRIX/VECTOR SHIFT menus). Per mode, which keys do nothing or give an error.
- setup.md — both SETUP pages, every item and option, defaults, the Fix/Sci/Norm digit prompts, CONT screen, what each changes, which settings clear what (e.g. STAT setting clears stat data; display-format change clears history and TABLE function).
- priority.md — the 13-level priority table, omitted-multiplication rules, which functions need ")".
- ranges.md — calculation range, 15/10 digits, 99-byte input, ■ cursor at ≤10 bytes, 2-screen height limit, √ form rules (two terms, a/b/c/d/e/f ranges), π form |x|<10⁶, fraction 10-digit limit, every function input range, ∫/d/dx tol defaults, Σ limits, RanInt# rules, BASE-N ranges, STAT row limits, TABLE 30 rows.
- errors.md — every error message, causes, screen text, ◀/▶ Goto and AC behaviour.
- modes.md — for each of the 8 modes: entry screen, editors, result screens, SHIFT menus, what AC/MODE/SETUP do, what is cleared on entering/leaving.
- constants.md — the 40 constants (number, symbol, name; values to be filled from the emulator, CODATA 2014) and the 40 conversions (number, from▸to).
- memory.md — A–F, M, X, Y, Ans; what updates Ans; history (200 bytes, which modes, what clears it); CLR Setup/Memory/All; what survives OFF/ON; MatAns/VctAns.
- differences_from_ex.md — every difference between the EX code we copied and the ES PLUS 2nd edition, grouped by file, so later prompts can fix them.
- calculator_id.md — the MODE 0 screen (24-char ID + QR), how to leave it.

Mark anything unclear with "VERIFY ON EMULATOR" plus the exact key sequence to check.

Done when: all 10 files exist and cover every section of the guide. Give me the full list of VERIFY items as a numbered checklist of key sequences.
```

**Check it yourself:** Run the VERIFY list on the emulator and paste the answers back in one message ("VERIFY answers: 1 = …, 2 = …"). Ask the agent to update the spec files.

---

### Prompt 3 — Faceplate, key map and LCD config for the ES PLUS

```
Build the ES PLUS faceplate data and our own faceplate drawing.

1. assets/data/key_layout.json: exactly 50 entries (SHIFT, ALPHA, UP, DOWN, LEFT, RIGHT, MODE, ON, CALC, INTEGRAL, RECIP, LOGBASE, FRAC, SQRT, SQUARE, POWER, LOG, LN, NEG, DMS, HYP, SIN, COS, TAN, RCL, ENG, LPAREN, RPAREN, SD, MPLUS, 7, 8, 9, DEL, AC, 4, 5, 6, MUL, DIV, 1, 2, 3, ADD, SUB, 0, DOT, EXP10, ANS, EXE). Each entry: name, rect on the faceplate, primary label, shift label, alpha label, mode label (blue BASE-N / purple CMPLX / bracketed menu), label colours, and PC keyboard shortcuts. Use the key table in Part 1 of docs/BUILD_PROMPTS.md (copy of this pack) as the source; cross-check with docs/spec/keys.md and list differences.
2. Keyboard shortcuts: include the official emulator's ones (Tab/Space = AC, F1 = SHIFT, F2 = ALPHA, F3/Home = MODE, F4 = ON, Enter = EXE, Delete/Backspace = DEL, arrows, ^ = POWER, ( ) + - * / . , 0–9) plus sensible extras that don't clash.
3. assets/faceplate/faceplate.svg: our OWN vector drawing of the calculator (no Casio bitmap): dark grey body, rounded corners, "CASIO"-style wordmark replaced by our own neutral text, the LCD window, round top-row keys, the round 4-way pad, black function keys, grey number keys, lime-green DEL/AC, and all legends in the right colours and positions. Overall proportions 644×1250 so rects in key_layout.json line up.
   I will put a screenshot of the official emulator window at assets/reference/emulator_full.png (git-ignored). Write scripts/overlay_faceplate.js that renders our SVG over that screenshot at 50% opacity into tests/pixel/faceplate_overlay.png so we can see misalignment.
4. assets/data/lcd_config.json: dot matrix 96×31 (VERIFY with a ×1 Capture Screen I'll provide), status icon row position, scale, pixel on/off colours, LCD background (~#D6E3D6), the list of status indicators in left-to-right order: S, A, M, STO, RCL, STAT, CMPLX, MAT, VCT, D, R, G, FIX, SCI, Math, ▼, ▲, Disp (VERIFY positions from a capture).
5. Update js/keypad.js to use the new layout: hit boxes, pressed look, hold-to-repeat on arrows and DEL.

Done when: the app shows our ES faceplate, every key click sends the right key name to Calculator.press() (add a test that every one of the 50 keys resolves), and the overlay image shows keys lined up with the emulator screenshot.
```

**Check it yourself:** open the overlay image — every key outline sits on top of the emulator's key. Hover/click each key in the app; the key-log panel (or console) shows the right name.

---

### Prompt 4 — Golden test harness for the ES (with KeyLog import)

```
Adapt the copied golden-test system to the ES PLUS.

1. js/core/Calculator.js API stays: press(keyName), pressSequence('...'), getScreen() → { indicators, lines, pixels: Uint8Array(96*31), statusIcons }, reset(). Change the screen size to 96×31 and the indicator list to the ES set.
2. Golden JSON format:
   { "name": "...", "source": "guide" | "emulator" | "unverified",
     "setup": {"display":"MthIO-MathO","angle":"Deg","format":"Norm1"},
     "keys": ["2","FRAC","3","RIGHT","ADD","1","FRAC","2","EXE"],
     "expect": {"lines":["2/3+1/2","7/6"], "result":"7/6", "indicators":["Math","D"]} }
   "unverified" tests run but only warn on failure.
3. scripts/import_keylog.js: I paste the text copied from the official emulator's KeyLog window into a file; the script converts it into our key names (make a mapping table; ask me for any key label you can't map) and writes the "keys" array of a new golden JSON. Document it in docs/GOLDEN_TESTS.md with an example.
4. Text form of the screen: getScreen().lines gives the two display lines as text (fractions as "7/6", roots as "√2", powers as "2^3" or a documented notation), so tests can compare text before fonts are traced.
5. Delete the copied EX golden runner fixtures; seed tests/golden/ with the cases in Part 3 of docs/BUILD_PROMPTS.md (source guide or unverified as marked). Mark failing ones expected-fail; never delete them.

Done when: npm test runs the golden tests; the browser app still works through Calculator; import_keylog.js converts a sample KeyLog text I give you.
```

**Check it yourself:** On the emulator press `2 □/□ 3 ▶ + 1 □/□ 2 =`, copy the KeyLog text, run the import script on it, and confirm the generated keys match.

---

### PHASE B — The number engine (reuse, then prove it matches the ES)

---

### Prompt 5 — Decimal engine and functions: ES ranges and constants

```
Decimal15 and functions.js came from the EX project. Make them match the ES PLUS 2nd edition exactly.

1. Internal constants: π = 3.14159265358980 and e = 2.71828182845904 as stated in the guide (check what the EX code used and record the difference). Add golden tests "π − 3.141592653 =" and "e − 2.718281828 =" as unverified, and tell me to check them on the emulator — they reveal the true internal values.
2. Apply every input range from docs/spec/ranges.md: sin/cos/tan (Deg |x|<9×10⁹, Rad <157079632.7, Gra <1×10¹⁰, tan errors at odd multiples of 90°/π/2/100g), asin/acos |x|≤1, sinh/cosh |x|≤230.2585092, asinh ≤4.999999999×10⁹⁹, acosh 1≤x≤4.999999999×10⁹⁹, atanh |x|≤9.999999999×10⁻¹, log/ln 0<x, 10^x ≤99.99999999, e^x ≤230.2585092, √x 0≤x<10¹⁰⁰, x² |x|<10⁵⁰, x⁻¹ x≠0, x! integer 0..69, nPr/nCr 0≤r≤n<10¹⁰ with result <10¹⁰⁰, Pol/Rec, °′″ up to 9999999°59′59″, x^y and x√y rules for negative bases, RanInt#(a,b) a<b and b−a<10¹⁰.
3. Remove EX-only functions from the reachable set (GCD, LCM, Int, Intg, ÷R, FACT, Π, recurring decimal) — keep the code only if another function needs it.
4. Ran#: 3-digit result 0.000–0.999. RanInt#(a,b): integer in [a,b].
5. Pol(x,y) and Rec(r,θ) store their two results in X and Y (not x,y).

Tests: at least 5 values per function, plus every range edge (just inside → value, just outside → Math ERROR).

Done when: all function tests pass and the Part 3 function cases pass.
```

**Check it yourself:**
| Keys | Expected |
|---|---|
| `69 SHIFT x⁻¹(x!) =` | `1.711224524×10⁹⁸` |
| `70 SHIFT x⁻¹(x!) =` | `Math ERROR` |
| `tan 90 ) =` (Deg) | `Math ERROR` |
| `hyp 1 (sinh) 1 ) =` | `1.175201194` |
| `hyp 5 (cosh⁻¹) 1 ) =` | `0` |
| `( 5 + 3 ) SHIFT x⁻¹(x!) =` | `40320` |
| `10 SHIFT ×(nPr) 4 =` / `10 SHIFT ÷(nCr) 4 =` | `5040` / `210` |
| `π − 3.141592653 =` | VERIFY (5.898×10⁻¹⁰ if π internal is 3.14159265358980) |

---

### Prompt 6 — Display formatting: Norm / Fix / Sci / ENG / Disp

```
Adapt js/core/format/formatNumber.js to the ES PLUS.

- 10-digit display rounding of the 15-digit value.
- Norm 1 (exponent when |x|<10⁻² or ≥10¹⁰) and Norm 2 (|x|<10⁻⁹ or ≥10¹⁰). Default Norm 1.
- Fix 0–9 and Sci 1–10 (how the Sci digit prompt maps key 0 → VERIFY). FIX / SCI indicators.
- ENG and SHIFT ENG (←): exponent to multiples of 3, repeated presses keep shifting.
- Disp Dot / Comma: comma only in results; input keeps a dot. Multi-result separator becomes ";" with Comma.
- Remove EX-only options: engineering symbols (k, M, G…), digit separator.
- Exponent drawn as ×10 with a raised small exponent (return a structured result for the screen).
- Rnd( rounds the stored value to the current format (Norm → 10 digits).

Golden tests: at least 30, including all the format cases in Part 3.

Done when: COMP results use this formatter and all formatting tests pass.
```

**Check it yourself (Linear display: SHIFT MODE 2):**
| Setup | Keys | Expected |
|---|---|---|
| Fix 3 | `100 ÷ 7 =` | `14.286` |
| Fix 2 | `100 ÷ 7 =` | `14.29` |
| Sci 5 | `1 ÷ 7 =` | `1.4286×10⁻¹` |
| Sci 4 | `1 ÷ 7 =` | `1.429×10⁻¹` |
| Norm 1 / Norm 2 | `1 ÷ 200 =` | `5×10⁻³` / `0.005` |
| Norm 1 | `1234 = ENG ENG` | `1.234×10³` then `1234×10⁰` |
| Norm 1 | `123 = SHIFT ENG SHIFT ENG` | `0.123×10³` then `0.000123×10⁶` |
| Fix 3 | `10 ÷ 3 × 3 =` | `10.000` |
| Fix 3 | `SHIFT 0(Rnd) 10 ÷ 3 ) × 3 =` | `9.999` |

---

### Prompt 7 — Exact results: fractions, √ form, π form, S⇔D

```
Adapt js/core/exact/ to the ES PLUS 2nd-edition rules (docs/spec/ranges.md):

1. √ form: at most two terms (an integer counts as one term). Allowed shapes ±a√b, ±d±a√b, ±a′√b/c ± d′√e/f with integers 1≤a<100, 1<b<1000, 1≤c<100, 0≤d<100, 0≤e<1000, 1≤f<100. Anything else → decimal. Check the EX code's limits and change them to these.
2. π form only for |x| < 10⁶ (e.g. π/6 shown as "1/6 π" — VERIFY how the ES draws it).
3. Fractions: reduce; d/c default, a b/c via SETUP; SHIFT S⇔D (a b/c ⇔ d/c) converts; mixed fraction not possible if total digits > 10.
4. S⇔D toggles exact ⇄ decimal. SHIFT = gives decimal straight away; after that S⇔D only reaches fraction or π form, never √ form.
5. LineIO: results are decimals; S⇔D toggles decimal ⇄ fraction (shown "1⌋5"). Mixing fractions and decimals in LineIO gives a decimal.
6. Trig special angles in MathO give exact forms where the emulator does (VERIFY: sin 30 → 1/2, sin 60 → √3/2).
7. Sexagesimal: °′″ input (degrees and minutes must be entered), add/subtract, °′″ key toggles decimal ⇄ sexagesimal.
8. Ran# shows as a fraction in MathO.

Golden tests: at least 40, including the cases where the result falls back to decimal.

Done when: COMP shows exact answers like the emulator and S⇔D / SHIFT = work.
```

**Check it yourself (MathO, Deg):**
| Keys | Expected |
|---|---|
| `□/□ 2 ▼ 3 ▶ + □/□ 1 ▼ 2 =` | `7/6` |
| `4 − SHIFT □/□ 3 ▶ 1 ▼ 2 =` | `1/2` |
| `SHIFT ×10ˣ(π) ÷ 6 =` then `S⇔D` | `1/6 π` (VERIFY drawing) then `0.5235987756` |
| `( √2 ▶ + 2 ) × √3 =` then `S⇔D` | `√6 + 2√3` then `5.913591358` |
| `10 √2 ▶ + 15 × 3 √3 =` | `45√3 + 10√2` |
| `99 √999 =` | `3129.089165` |
| Fix 3: `√2 ▶ × 3 =` then `SHIFT =` | `3√2` then `4.243` |
| `2 °′″ 20 °′″ 30 °′″ + 0 °′″ 39 °′″ 30 °′″ =` | `3°0′0″` |
| `2 °′″ 15 °′″ 18 °′″ =` then `°′″` then `°′″` | `2°15′18″` → `2.255` → `2°15′18″` |
| LineIO: `1 ÷ 5 =` then `S⇔D` | `0.2` then `1⌋5` |
| `sin 30 ) =` | VERIFY (`1/2` expected) |

---

### PHASE C — Input, parsing, errors

---

### Prompt 8 — Input buffer and key mapping for the ES keyboard

```
Adapt js/core/input/ (tokens, Editor, keyInput) and keys.js to the ES PLUS keyboard in key_layout.json.

1. Every key in every shift state inserts the right token or opens the right menu: hyp → hyperbolic menu (1:sinh 2:cosh 3:tanh 4:sinh⁻¹ 5:cosh⁻¹ 6:tanh⁻¹); SHIFT Ans → DRG▸ menu (1:° 2:r 3:g); SHIFT 7 CONST and SHIFT 8 CONV → two-digit number entry; SHIFT 1–5 → mode menus (error or nothing outside their modes: VERIFY each); ALPHA CALC → "="; ALPHA ∫ → ":"; ALPHA ) → X; ALPHA S⇔D → Y; ALPHA M+ → M; ALPHA (−)…tan → A–F; ALPHA ENG → i only in CMPLX; SHIFT (−) → ∠ only in CMPLX.
2. SHIFT and ALPHA indicators (S, A) latch for one key; SHIFT then ALPHA etc. behave like the emulator (VERIFY).
3. 99-byte limit with per-token byte sizes (find the 3–13 byte tokens from the guide), block cursor ■ when ≤10 bytes left, input refused beyond.
4. Templates: fraction, mixed fraction, √, ∛, x², x³, x⁻¹, x^■, ■√□, log■□, 10^■, e^■, Abs, ∫ (with tol only in LineIO), d/dx, Σ.
5. x², x³, x⁻¹, x^■ can't follow each other directly (second press ignored).
6. INS in Natural Display: SHIFT DEL then one of (fraction, √, ∛, x^■, ■√□, log■□, 10^■, e^■, ∫, d/dx, Σ, Abs) wraps the expression to the right of the cursor, up to the first "(" or function, as the guide describes. INS in Linear Display toggles insert/overwrite (cursor shape changes).
7. Cursor movement: Natural ▶ at end → start, ◀ at start → end; Linear ▲ → start, ▼ → end. Max formula height 2 screens (62 dots): further input refused.
8. DEL deletes before the cursor (under the cursor in overwrite mode). AC clears input.
9. Remove EX-only keys/tokens: OPTN, MENU, x key, PreAns, FACT, etc.

Golden tests: editing cases (insert in the middle, INS wrap, overwrite, templates, cursor moves, byte limit and ■ cursor, consecutive x²).

Done when: every one of the 50 keys does the right thing in COMP, and editing tests pass.
```

**Check it yourself (MathO):**
- `1 + □/□ 7 ▼ 6` then `◀ ◀ ◀ ◀ SHIFT DEL(INS) √` → input becomes `1 + √(7/6)` (guide example).
- `2 x² x²` → only one ² appears.
- Type `1+` repeatedly until the cursor turns into ■; count the remaining presses before input stops (compare with the emulator).
- LineIO: `SHIFT DEL` → cursor changes to `_` (overwrite mode).

---

### Prompt 9 — Parser with the ES priority rules

```
Check js/core/parse/parser.js against the ES 13-level table in docs/spec/priority.md and fix any difference (the EX table may have extra levels for EX-only operators: remove them).

Must handle: omitted multiplication (2π, 2A, 2(3+4), 2sin(30), (1+2)(3+4), 2X), (−) below x² ((−)2² = −4), postfix x² x³ x⁻¹ x! °′″ ° r g % ▸t, metric conversion and x̂/ŷ at level 6, nPr/nCr/∠ at level 8, dot product at level 9, BASE-N and/or/xor/xnor at 12–13, d h b o prefixes at level 5, missing closing brackets at the end, comma-argument functions (Pol, Rec, RanInt#, log(a,b), ∫, d/dx, Σ, P( Q( R( ), multi-statements with ":", STO assignment, and Syntax ERROR with the cursor position.

Golden tests (check each on the emulator; mark unverified until then): 1÷2π, 2^3^2, (−)2², 2√3√3, 3!², 150×20%, 660÷880%, sin 30+15 (no ")"), 1÷2(3), 6÷2(1+2), 2X with X=3, 4 sin 30)(30+10×3).

Done when: the parser passes all priority tests and is used by COMP.
```

**Check it yourself:**
| Keys | Expected |
|---|---|
| `4 sin 30 ) ( 30 + 10 × 3 =` | `120` |
| LineIO: `sin 30 ) + 15 =` | `15.5` |
| LineIO: `sin 30 + 15 =` | `0.7071067812` |
| `150 × 20 SHIFT ( (%) =` | `30` |
| `660 ÷ 880 SHIFT ( (%) =` | `75` |
| `2500 + 2500 × 15 SHIFT ( (%) =` | `2875` |
| `( − ) 2 x² =` | `−4` |
| `6 ÷ 2 ( 1 + 2 ) =` | VERIFY |

---

### Prompt 10 — Evaluator, errors and error screens

```
Adapt js/core/eval/ and js/core/errors.js to the ES PLUS.

1. ES error set only: Math ERROR, Stack ERROR, Syntax ERROR, Argument ERROR, Dimension ERROR, Variable ERROR, Can't Solve, Insufficient MEM, Time Out (exact spellings and capitals as the emulator shows — VERIFY). Remove EX-only errors (Range, Circular, Memory ERROR etc.) unless the emulator can show them.
2. Stack ERROR: the guide gives no sizes. Write a probe list of key sequences that find the numeric and command stack limits (e.g. many nested "(" with numbers), ask me to run them on the emulator, then set the limits from my answers.
3. Error screen: exact layout on 96×31 (VERIFY: message, "[AC] :Cancel", "[◀][▶]:Goto"). AC → empty input (expression cleared). ◀ or ▶ → back to the input with the cursor at the error.
4. Ans is updated by =, SHIFT =, M+, M−, STO; never by an error. No PreAns.

Golden tests: one per error type plus the screens after AC and after ◀.

Done when: every error can be produced from key presses and its screen text matches the emulator.
```

**Check it yourself:**
| Keys | Expected |
|---|---|
| `14 ÷ 0 × 2 =` | `Math ERROR`; then `▶` → cursor next to the `0`; type `1` before it, `=` → `2.8` |
| `1 + =` | `Syntax ERROR` |
| TABLE: f(x)=X, Start 1, End 40, Step 1 | `Insufficient MEM` |
| SOLVE on `A+1` with no X | `Variable ERROR` |

---

### PHASE D — The screen (pixel-perfect on 96 × 31)

---

### Prompt 11 — LCD engine, status icons and fonts

```
Rebuild js/lcd/ for the ES PLUS screen.

1. Framebuffer 96 × 31 (1 = dark) plus the fixed status icon row (S A M STO RCL STAT CMPLX MAT VCT D R G FIX SCI Math ▼ ▲ Disp). Draw on a canvas scaled up without blur (image-rendering: pixelated), colours from lcd_config.json.
2. Fonts: our own bitmap font data files (js/lcd/fonts/*.js), traced from emulator captures. I'll save ×1 captures (Tools → Capture Screen, Capture Setting ×1 Zoom) into docs/reference/captures/ with a text file saying what each shows. Tell me exactly which captures you need (e.g. "0123456789", every letter used in menus, every symbol, a fraction, a root, an exponent, every menu screen). Adapt scripts/trace_glyphs.py from the EX project.
3. Status icons: our own small drawings matched to a capture of the icon row (positions from lcd_config.json).
4. drawText, invert (for highlighted items if the ES uses any), clear, ◀ ▶ scroll marks in the dot area.
5. Contrast (CONT) changes the dark pixel colour in steps like the emulator.
6. Pixel diff helper (tests/pixel/) for 96×31 captures, outputting a diff PNG.

Done when: the power-on COMP screen and "1+2=3" are pixel-identical to my captures (show me the diff images).
```

**Check it yourself:** compare the diff images for the start screen and `1 + 2 =`. Toggle SHIFT, ALPHA, STO and check the icons.

---

### Prompt 12 — Natural Display and Linear Display layout

```
Adapt js/lcd/natural_display.js to the 96×31 screen.

1. MthIO: 2D boxes (fractions stacked with a bar, √ sized to content, small raised exponents if the ES uses them — VERIFY from captures, log■□, ∫ with limits, d/dx with x=, Σ with limits, Abs bars). Empty slots drawn as the ES dotted box.
2. Input can be up to 2 screens tall; the view scrolls vertically to keep the cursor visible (VERIFY how the emulator scrolls a tall fraction).
3. Cursor: blinking bar at the right height in the current slot; ■ block when ≤10 bytes remain; "_" in Linear overwrite mode. Arrow order through nested templates matches the emulator.
4. Horizontal scrolling with ◀/▶ marks for long input and for long results (results scroll with ◀▶ when the result has the ▶ mark; if both input and result overflow, AC first then scroll input — as in the guide).
5. Result line right-aligned at the bottom; exact results (fractions, √, π) drawn with the same layout engine.
6. LineIO: two lines of text, line-mode symbols (⌋ for fractions, ^( for powers, etc.); CMPLX results in LineIO show a and bi on separate lines; Pol/Rec show r= / θ= on separate lines.
7. After = in MthIO, part of a long input may be cut off (as the guide says) — match the emulator.

Golden pixel tests: at least 15 screens (simple fraction, nested fraction, √ of a fraction, power of a power, ∫ template, Σ template, long input scrolled, result with ×10ⁿ, mixed fraction, Pol result, LineIO fraction).

Done when: all 15 pixel diffs pass.
```

**Check it yourself:** capture `1 + □/□ 7 ▼ 6` (input) and `√2 ▶ × 3 =` (result) on the emulator at ×1, and compare with the app's diff images.

---

### PHASE E — COMP mode, menus, memory

---

### Prompt 13 — COMP mode, history and replay

```
Make COMP behave exactly like the emulator.

1. = shows the result. A digit after a result starts a new calculation; an operator (+ − × ÷ x² x^ x⁻¹ etc.) starts with "Ans" (VERIFY which keys).
2. Replay: ◀ or ▶ after a result goes back to editing the previous expression.
3. History: ▲/▼ step through previous calculations (input + result), about 200 bytes kept, ▲▼ indicators when there is more. Only COMP, CMPLX and BASE-N keep history. Cleared by ON, mode change, display-format change, CLR Setup/All.
4. Multi-statements with ":": each = shows the next part with "Disp", the last one without.
5. SHIFT = gives the decimal result in MathO.
6. Long calculations show only the indicators while computing (as the guide says) and AC interrupts.

Done when: 25 golden tests of everyday use pass, including history and replay.
```

**Check it yourself (LineIO for the first two):**
| Keys | Expected |
|---|---|
| `4 × 3 + 2.5 =` then `◀ DEL DEL DEL DEL − 7.1 =` | `14.5` then `4.9` |
| `1 + 1 = 2 + 2 = 3 + 3 =` then `▲ ▲` | `6`, then shows `4`, then `2` |
| `3 + 3 ALPHA ∫(:) 3 × 3 =` then `=` | `6` (Disp on) then `9` |
| `123 + 456 =` then `789 − Ans =` | `579` then `210` |
| `3 × 4 =` then `÷ 30 =` | `12` then `Ans÷30` → `2/5` (MathO) |

---

### Prompt 14 — Variables, memory and CLR

```
Implement docs/spec/memory.md.

- STO (SHIFT RCL) then a variable key stores the result into A–F, M, X, Y; show the emulator's STO screen (VERIFY layout, e.g. "Ans→A").
- RCL then a variable key shows that variable's value (VERIFY screen).
- ALPHA + variable key inserts it into the expression.
- M+ / SHIFT M+ (M−) add/subtract the result (or the current expression's value) to M; M indicator when M ≠ 0. M+ and M− update Ans.
- CLR (SHIFT 9): 1:Setup 2:Memory 3:All, each with the emulator's confirmation screen (= Yes, AC Cancel). Setup → COMP + default setup; Memory → clears Ans, M, variables (and Mat/Vct/stat data? VERIFY); All → both.
- Ans, M and variables survive AC, mode change and OFF/ON. Save all state to localStorage so it survives a page reload.
- Remove PreAns and lowercase x/y from memory.js.

Done when: golden tests for STO/RCL/M+/M−/CLR pass.
```

**Check it yourself:**
| Keys | Expected |
|---|---|
| `3 + 5 SHIFT RCL(STO) (−)(A)` | `8` (stored in A) |
| `ALPHA (−)(A) × 10 =` | `80` |
| `RCL (−)(A)` | `8` |
| `0 SHIFT RCL(STO) M+(M)` then `10 × 5 M+` then `10 + 5 SHIFT M+(M−)` then `RCL M+(M)` | `0`, `50`, `15`, `35` (M indicator on) |
| `SHIFT 9 3 =` | everything reset, COMP, Math indicator |

---

### Prompt 15 — SETUP menu and contrast

```
Rebuild the SETUP menu (SHIFT MODE) exactly like the emulator.

- Page 1: 1:MthIO 2:LineIO 3:Deg 4:Rad 5:Gra 6:Fix 7:Sci 8:Norm. Page 2: 1:ab/c 2:d/c 3:CMPLX 4:STAT 5:Disp 6:◀CONT▶. ▲/▼ switch pages (▼▲ indicators).
- 1:MthIO asks 1:MathO 2:LineO. 6:Fix, 7:Sci, 8:Norm ask for the digit with the emulator's prompt text (VERIFY). 3:CMPLX asks 1:a+bi 2:r∠θ. 4:STAT asks 1:ON 2:OFF. 5:Disp asks 1:Dot 2:Comma.
- CONT screen: ◀▶ adjust, AC exit; contrast changes the LCD.
- Selecting an option returns to the calculation screen (VERIFY) and takes effect at once (Math, D/R/G, FIX, SCI indicators).
- Side effects: changing display format clears history and the TABLE function; changing STAT setting clears stat data.
- AC closes the menu without change.
- Remove every EX-only SETUP item.

Done when: every SETUP screen matches my ×1 captures (pixel diff) and every setting works.
```

**Check it yourself:** step through `SHIFT MODE`, `▼`, each option, and compare captures. `SHIFT MODE 7 3` then `SHIFT ln(e^) 5 ▶ × 2 =` → `2.97×10²` (SCI on). `SHIFT MODE 7 3` then `ln 90 ) =` → `4.50×10⁰`.

---

### Prompt 16 — Function menus: hyp, DRG▸, CONST, CONV, Pol/Rec, ENG

```
1. hyp menu (1–6) inserting sinh( cosh( tanh( sinh⁻¹( cosh⁻¹( tanh⁻¹(.
2. DRG▸ menu (SHIFT Ans): 1:° 2:r 3:g — postfix angle-unit symbols converting to the current unit.
3. CONST (SHIFT 7) + two digits 01–40 inserting the constant symbol (mp, mn, me, mμ, a0, h, μN, μB, ħ, α, re, λC, γp, λCp, λCn, R∞, u, μp, μe, μn, μμ, F, e, NA, k, Vm, R, C0, C1, C2, σ, ε0, μ0, Φ0, g, G0, Z0, t, G, atm). Values are CODATA 2014 in the 2nd edition: I will read each value off the emulator (give me a list: "SHIFT 7 01 =" … "SHIFT 7 40 ="), then put the exact 10-digit displayed values into the data file and tests. Not usable in BASE-N.
4. CONV (SHIFT 8) + two digits 01–40 (in▸cm … cal▸J, NIST SP 811 2008; J▸cal at 15 °C). Priority level 6. Not usable in BASE-N or TABLE.
5. Pol( / Rec(: results shown as r=, θ= (or X=, Y=) and stored in X and Y.
6. ENG / ←ENG from the keys (formatting is done in Prompt 6).
7. Abs, Ran#, RanInt#, Rnd, x!, nPr, nCr reachable from their keys.
8. Remove OPTN, FACT and any EX menu code.

Done when: every menu screen matches captures and these golden tests pass.
```

**Check it yourself:**
| Keys | Expected |
|---|---|
| `SHIFT 7 28 =` | `299792458` (C0) |
| `□/□ 1 ▼ √ SHIFT 7 32 SHIFT 7 33 =` | `299792458` (1/√(ε0μ0) = C0, VERIFY display) |
| LineIO: `5 SHIFT 8 02 =` | `1.968503937` |
| LineIO: `100 SHIFT 8 22 =` | `3.527396195` |
| LineIO: `(−) 31 SHIFT 8 38 =` | `−23.8` |
| `( SHIFT ×10ˣ(π) ÷ 2 ) SHIFT Ans(DRG▸) 2(r) =` (Deg) | `90` |
| `50 SHIFT Ans(DRG▸) 3(g) =` (Deg) | `45` |
| `SHIFT +(Pol) √2 ▶ SHIFT )(,) √2 ▶ ) =` (Deg) | `r=2, θ=45` |
| `SHIFT −(Rec) √2 ▶ SHIFT )(,) 45 ) =` (Deg) | `X=1, Y=1` |
| `SHIFT hyp(Abs) 2 − 7 ▶ × 2 =` | `10` |

---

### Prompt 17 — CALC and SOLVE

```
1. CALC (COMP and CMPLX): expressions with variables, multi-statements, and equalities like "Y = X² + X + 3" (ALPHA CALC for "="). CALC prompts each variable in turn with its current value (VERIFY screen "A?" + value). = runs it; CALC again re-prompts with the last values. AC exits. While in CALC, input uses Linear rules.
2. SOLVE (SHIFT CALC, COMP only): Newton's method. Solves for X by default, or "{equation}, {variable}" for another variable. Prompts for the other variables, then the initial value of the solution variable. Solution screen: the equation, the variable = value, and "L−R=" value (VERIFY exact layout). If no convergence after the preset iterations: "Continue: [=]" screen (= continues, AC cancels). Can't Solve and Variable ERROR as in the guide. ∫, d/dx, Σ, Pol, Rec not allowed inside the equation.
3. Solutions always decimal.

Done when: 15 golden tests for CALC and SOLVE pass, including Can't Solve, Variable ERROR and Continue.
```

**Check it yourself:**
| Keys | Expected |
|---|---|
| `3 ALPHA (−)(A) + ALPHA °′″(B) CALC 5 = 10 =` | `25` |
| then `CALC 7 = 20 =` | `41` |
| `ALPHA S⇔D(Y) ALPHA CALC(=) ALPHA (−)(A) ALPHA )(X) x² + ALPHA °′″(B)` `SHIFT CALC(SOLVE)` `0 = 1 = (−) 2 =` then initial X `1 =` | `X=1.414213562`, `L−R=0` |
| `Y = X² − X + 1`, SOLVE, Y = `3`, X₀ = `1` | `X=2` |
| then `=` with Y = `7` | `X=3` |
| then `=` with Y = `13` | `X=4` |

---

### Prompt 18 — ∫, d/dx and Σ

```
1. ∫: Gauss–Kronrod (reuse js/core/eval/calculus.js) to match the emulator's 10 displayed digits. Optional tol (LineIO 4th argument), default 1×10⁻⁵. COMP only. Time Out when it can't meet tol. Negative area where f<0.
2. d/dx: central difference, optional tol, default 1×10⁻¹⁰, auto-adjust when it fails.
3. Σ: integer limits −1×10¹⁰ < a ≤ b < 1×10¹⁰. No Π on this model.
4. Pol, Rec, ∫, d/dx, Σ not allowed inside f(x), a, b, tol (Syntax ERROR or what the emulator shows — VERIFY).
5. Templates draw correctly (Prompt 12) and LineIO forms work.
6. Show only the indicators while computing, AC interrupts. Run long work without freezing the browser.

Done when: 20 golden tests pass, including Time Out.
```

**Check it yourself (Rad for trig):**
| Keys | Expected |
|---|---|
| MathO: `∫ ln ALPHA )(X) ) ▶ 1 ▶ ALPHA ×10ˣ(e) =` | `1` |
| LineIO: `∫ 1 ÷ ALPHA )(X) x² SHIFT )(,) 1 SHIFT )(,) 5 SHIFT )(,) 1 ×10ˣ (−) 7 ) =` | `0.8` |
| Rad: `∫ ( sin X ) + cos X ) ) x²` from `0` to `π` | `3.141592654` (π) |
| Rad: `SHIFT ∫(d/dx) sin ALPHA )(X) ) ▶ SHIFT ×10ˣ(π) ÷ 2 =` | `0` |
| LineIO: `d/dx(3X²−5X+2, 2, 1×10⁻¹²)` | `7` |
| `SHIFT log■□(Σ) ALPHA )(X) + 1 ▶ 1 ▶ 5 =` | `20` |

---

### PHASE F — The other 7 modes (one prompt each)

For every mode prompt, follow `docs/spec/modes.md` and match the emulator **screen by screen**: entry menu, editors, results, SHIFT menus, and what AC / MODE / SETUP do. STAT, BASE-N, MATRIX and VECTOR switch to Linear Display automatically.

---

### Prompt 19 — MODE menu and Calculator ID screen

```
1. MODE shows the text menu 1:COMP 2:CMPLX 3:STAT 4:BASE-N 5:EQN 6:MATRIX 7:TABLE 8:VECTOR exactly as on the emulator (layout over the 96×31 screen and any paging — VERIFY with captures). Number keys pick; AC closes. Delete the EX MENU icon grid code.
2. Entering a mode: mode indicator (CMPLX, STAT, MAT, VCT), auto Linear Display where required, and what gets cleared (history always; stat data when leaving STAT; etc. per docs/spec/memory.md). Entering the same mode again: VERIFY.
3. MODE then 0: Calculator ID screen. Show a 24-character ID string and a QR code drawn with our own js/core/qr/qrcode.js. IMPORTANT: our ID must be a clearly fake, fixed demo string (e.g. starting "DEMO"), and the QR must encode our own text (e.g. "fx-991ES PLUS 2nd ed re-creation — not a genuine calculator"), never a Casio URL, so the app can't be mistaken for a genuine calculator's authenticity check. Match the emulator's layout (where the ID text and QR sit, how the QR is scaled on 96×31 — VERIFY with a capture). AC returns to the MODE menu.

Done when: the MODE menu and ID screen layouts match captures, and mode switching clears the right things.
```

**Check it yourself:** `MODE` (capture), `MODE 0` (capture), `AC` → back to the menu. `MODE 3` → STAT indicator, Linear Display. `MODE 1` → STAT data gone.

---

### Prompt 20 — CMPLX mode

```
CMPLX (MODE 2): i (ALPHA ENG), ∠ (SHIFT (−)), a+bi and r∠θ results (SETUP setting, overridden by ▸r∠θ / ▸a+bi), SHIFT 2 menu 1:arg 2:Conjg 3:▸r∠θ 4:▸a+bi, Abs, x² x³ x⁻¹, the four operations, θ in −180° < θ ≤ 180°, exact √ forms in MathO, LineIO shows a and bi (or r and θ) on separate lines, CALC works, ∫/d/dx/Σ/SOLVE not available (VERIFY what happens). Use Decimal15 for both parts.

Done when: 25 golden tests pass.
```

**Check it yourself (MathO, Deg, a+bi):**
| Keys | Expected |
|---|---|
| `( 2 + 6 ALPHA ENG(i) ) ÷ ( 2 ALPHA ENG(i) ) =` | `3−i` |
| `2 SHIFT (−)(∠) 45 =` | `√2+√2i` |
| r∠θ setting: `√2 ▶ + √2 ▶ ALPHA ENG(i) =` | `2∠45` |
| `( 1 − ALPHA ENG(i) ) x⁻¹ =` | `1/2 + 1/2 i` |
| `( 1 + i ) x² + ( 1 − i ) x² =` | `0` |
| `SHIFT 2 2(Conjg) 2 + 3 i ) =` | `2−3i` |
| `SHIFT hyp(Abs) 1 + i =` / `SHIFT 2 1(arg) 1 + i ) =` | `√2` / `45` |
| `√2 ▶ + √2 ▶ i SHIFT 2 3(▸r∠θ) =` | `2∠45` |

---

### Prompt 21 — STAT mode

```
STAT (MODE 3), always Linear Display:
1. Type menu: 1:1-VAR 2:A+BX 3:_+CX² 4:ln X 5:e^X 6:A•B^X 7:A•X^B 8:1/X (exact screen text: VERIFY).
2. Stat Editor: X, (Y), (FREQ when SETUP STAT = ON). Max rows 80 / 40 / 26. Cell cursor, entering values with =, DEL deletes a row, SHIFT 1 3(Edit) 1:Ins 2:Del-A. Row numbers. M+, M−, STO, Pol, Rec, multi-statements not allowed in the editor.
3. AC from the editor → calculation screen. SHIFT 1 menu: 1:Type 2:Data 3:Sum 4:Var 5:Distr (1-VAR) / 5:Reg (paired) 6:MinMax, with the sub-menus: Sum Σx² Σx (+ Σy² Σy Σxy Σx³ Σx²y Σx⁴), Var n x̄ σx sx (+ ȳ σy sy), Reg A B r x̂ ŷ (quadratic: A B C x̂1 x̂2 ŷ), MinMax minX maxX (+ minY maxY), Distr P( Q( R( ▸t.
4. x̂, ŷ etc. are postfix commands (priority level 6).
5. Data deleted when leaving STAT, switching 1-VAR ⇄ paired, or changing the STAT setting.
6. All values to 10 displayed digits like the emulator.

Done when: 30 golden tests pass, at least 3 per regression type.
```

**Check it yourself:**
- SETUP STAT ON, `MODE 3 1`, X: `1 = 2 = 3 = 4 = 5 =`, move to the first FREQ cell (the guide prints `▼ ▶` here — VERIFY), FREQ: `1 = 2 = 3 = 2 =` (5th stays 1), `AC SHIFT 1 4 2 =` → `3`; `AC SHIFT 1 4 3 =` → `1.154700538`.
- SETUP STAT OFF, Fix 3, `MODE 3 2`, X: `20 110 200 290`, Y: `3150 7310 8800 9310`; `AC SHIFT 1 5 3 =` → `0.923`; `AC SHIFT 1 1 4` (ln X) then `AC SHIFT 1 5 3 =` → `0.998`; `SHIFT 1 5 1 =` → `−3857.984`; `SHIFT 1 5 2 =` → `2357.532`; `AC 160 SHIFT 1 5 5 =` → `8106.898`.
- STAT ON, Fix 3, 1-VAR data x: 0 1 2 3 4 5 6 7 9 10 with FREQ 1 2 1 2 2 2 3 4 2 1; `AC 3 SHIFT 1 5 4 =` → `−0.762`; `SHIFT 1 5 1 Ans ) =` → `0.223`.

---

### Prompt 22 — BASE-N mode

```
BASE-N (MODE 4), Linear Display: DEC (x²), HEX (x^), BIN (log), OCT (ln) keys switch mode and convert the displayed result; A–F typed directly with (−) °′″ hyp sin cos tan in HEX; ranges: BIN 16-bit (0000000000000000–0111111111111111 positive, 1000000000000000–1111111111111111 negative), OCT 00000000000–17777777777 / 20000000000–37777777777, DEC −2147483648…2147483647, HEX 00000000–7FFFFFFF / 80000000–FFFFFFFF; zero-padded display; base indicator on screen (VERIFY how the ES shows Dec/Hex/Bin/Oct); fractions cut off; no exponents; Math ERROR on overflow; SHIFT 3 menu: 1:and 2:or 3:xor 4:xnor 5:Not( 6:Neg(, page 2: 1:d 2:h 3:b 4:o prefixes; negative non-decimal values via two's complement; history works; constants/conversions not allowed.

Done when: 25 golden tests pass.
```

**Check it yourself (`MODE 4`):**
| Keys | Expected |
|---|---|
| `log(BIN) 11 + 1 =` | `0000000000000100` |
| `AC x^(HEX) 1 tan(F) + 1 =` | `00000020` |
| `AC ln(OCT) 7 + 1 =` | `00000000010` |
| `AC x²(DEC) SHIFT 3 ▼ 1(d) 10 + SHIFT 3 ▼ 2(h) 10 + SHIFT 3 ▼ 3(b) 10 + SHIFT 3 ▼ 4(o) 10 =` | `36` |
| `AC x²(DEC) 15 × 37 =` then `x^` `log` `ln` | `555`, `0000022B`, `0000001000101011`, `00000001053` |
| BIN: `1010 SHIFT 3 1(and) 1100 =` | `0000000000001000` |
| BIN: `1011 SHIFT 3 2(or) 11010 =` | `0000000000011011` |
| BIN: `1010 SHIFT 3 3(xor) 1100 =` | `0000000000000110` |
| BIN: `1111 SHIFT 3 4(xnor) 101 =` | `1111111111110101` |
| BIN: `SHIFT 3 5(Not) 1010 ) =` | `1111111111110101` |
| BIN: `SHIFT 3 6(Neg) 101101 ) =` | `1111111111010011` |

---

### Prompt 23 — EQN mode

```
EQN (MODE 5): type menu 1:anX+bnY=cn 2:anX+bnY+cnZ=dn 3:aX²+bX+c=0 4:aX³+bX²+cX+d=0 (screen text VERIFY). Coefficient editor (grid, cursor, = to enter, AC clears all coefficients to 0, changing type zeroes them, M+/M−/STO/Pol/Rec/multi-statement not allowed). = shows solutions one by one (X=, Y=, Z= / X1=, X2= / X1=, X2=, X3=), ▲▼ scroll, = after the last returns to the editor, AC returns to the editor. Simultaneous solutions never in √ form; quadratic/cubic may show √ form and complex roots per SETUP CMPLX a+bi / r∠θ (and Math mode). No ENG on solution screens. Results to 10 digits. No 4-unknown, quartic or vertex screens.

Done when: 25 golden tests pass.
```

**Check it yourself (MathO):**
| Type / coefficients | Expected |
|---|---|
| 1: `1 2 3` / `2 3 4` | `X=−1`, `Y=2` |
| 2: `1 −1 1 2` / `1 1 −1 0` / `−1 1 1 4` | `X=1`, `Y=2`, `Z=3` |
| 3: `1 1 3/4` | `X1=−1/2+√2/2 i`, `X2=−1/2−√2/2 i` |
| 3: `1 −2√2 2` | `X=√2` |
| 4: `1 −2 −1 2` | `X1=−1`, `X2=2`, `X3=1` |
| 3: `2 1 −3` | `X1=1`, `X2=−3/2` (root order VERIFY) |

---

### Prompt 24 — MATRIX mode

```
MATRIX (MODE 6), Linear Display: MatA, MatB, MatC up to 3×3, dimension menu (m×n choices as on the emulator — VERIFY the list and order), Matrix Editor (cell cursor, =, scrolling for 3 columns on 96 px), MatAns screen with scrolling, SHIFT 4 menu 1:Dim 2:Data 3:MatA 4:MatB 5:MatC 6:MatAns 7:det 8:Trn. Operations: + − ×, scalar ×, det, Trn, inverse with x⁻¹ (not x^), x², x³ (not x^), Abs. On the MatAns screen, + − × ÷ x⁻¹ x² x³ jump to the calculation screen with "MatAns" typed. Copy: show a matrix in the editor, STO, then A/B/C. Dimension ERROR rules; Math ERROR for singular inverse; Stack ERROR for the matrix stack. No MatD, Identity or RREF.

Done when: 25 golden tests pass.
```

**Check it yourself** (MatA = [[2,1],[1,1]], MatB = [[2,−1],[−1,2]], MatC = [[1,0,−1],[0,−1,1]]):
| Calculation | Expected |
|---|---|
| MatA × MatB | `[[3,0],[1,1]]` |
| MatA + MatB | `[[4,0],[0,3]]` |
| 3 × MatA | `[[6,3],[3,3]]` |
| det(MatA) | `1` |
| Trn(MatC) | `[[1,0],[0,−1],[−1,1]]` |
| MatA x⁻¹ | `[[1,−1],[−1,2]]` |
| Abs(MatB) | `[[2,1],[1,2]]` |
| MatA x² / MatA x³ | `[[5,3],[3,2]]` / `[[13,8],[8,5]]` |
| MatA + MatC | `Dimension ERROR` |

---

### Prompt 25 — TABLE mode

```
TABLE (MODE 7): f(X)= input (Natural or Linear per SETUP; any variable other than X is a constant; Pol/Rec/∫/d/dx/Σ not allowed), then Start? (default 1), End? (default 5), Step? (default 1) prompts showing the last values; table screen with X and F(X) columns, row numbers, ▲▼ scrolling, view-only; max 30 rows → Insufficient MEM; AC returns to the f(X) input; the table changes variable X; the function is deleted when switching MthIO ⇄ LineIO in SETUP; constants allowed, conversions not. How values are drawn in MathO (fractions or decimals) — VERIFY. No g(x).

Done when: 15 golden tests pass.
```

**Check it yourself (MathO):** `MODE 7`, `ALPHA )(X) x² ▶ + □/□ 1 ▼ 2 =`, Start `(−) 1 =`, End `1 =`, Step `0.5 =` → X: −1, −0.5, 0, 0.5, 1; F(X): 1.5, 0.75, 0.5, 0.75, 1.5 (format VERIFY). Then `AC =`, Start `1`, End `40`, Step `1` → `Insufficient MEM`.

---

### Prompt 26 — VECTOR mode

```
VECTOR (MODE 8), Linear Display: VctA, VctB, VctC with dimension 3 or 2 (menu order VERIFY), Vector Editor, VctAns screen, SHIFT 5 menu 1:Dim 2:Data 3:VctA 4:VctB 5:VctC 6:VctAns 7:Dot. Operations: + −, scalar ×, Dot (·, priority level 9), cross product with ×, Abs (length). On the VctAns screen + − × ÷ jump to the calculation screen with "VctAns". Copy with STO. Dimension ERROR rules. No VctD, angle or unit-vector command.

Done when: 20 golden tests pass.
```

**Check it yourself** (VctA = (1,2), VctB = (3,4), VctC = (2,−1,2)):
| Calculation | Expected |
|---|---|
| VctA + VctB | `[4,6]` |
| 3 × VctA, then `− VctB =` | `[3,6]`, then `[0,2]` |
| VctA · VctB (SHIFT 5 7) | `11` |
| VctA × VctB | `[0,0,−2]` |
| Abs(VctC) | `3` |
| Fix 3: `cos⁻¹((VctA·VctB) ÷ (Abs(VctA) Abs(VctB)))` | `10.305` |
| VctA + VctC | `Dimension ERROR` |

---

### PHASE G — The whole device

---

### Prompt 27 — Power, start-up, contrast, reset

```
- ON turns on and shows the emulator's power-on screen (VERIFY: same mode, empty input). ON also clears history (it runs the self-check described in the guide).
- SHIFT AC turns off (blank screen; nothing but ON works while off).
- Auto power-off after about 10 minutes without a key press (make the timeout configurable in code for testing, not in SETUP).
- Contrast steps (Prompt 15) persist across OFF/ON.
- What is kept and lost on OFF/ON per docs/spec/memory.md (Ans, M, variables, matrices, vectors, setup kept; history lost).
- CLR 3 (All) gives the same screens as a brand-new calculator.

Done when: golden tests for power and reset pass.
```

**Check it yourself:** `1 + 1 =`, `SHIFT AC`, `ON`, `▲` → no history. `5 SHIFT RCL(STO) (−)(A)`, `SHIFT AC`, `ON`, `RCL (−)(A)` → `5`.

---

### Prompt 28 — Faceplate interaction, keyboard, pop-out, offline

```
1. Faceplate: mouse and touch with a pressed look; hold-to-repeat on arrows and DEL (timing like the emulator).
2. PC keyboard: the official emulator's shortcuts (Tab/Space AC, F1 SHIFT, F2 ALPHA, F3/Home MODE, F4 ON, Enter =, Delete/Backspace DEL, arrows, ^, ( ), + - * /, . , 0–9) plus non-clashing extras; show a shortcut help overlay on "?".
3. Screen capture: Ctrl+C copies the LCD image (×1 or a chosen zoom, with or without a frame) to the clipboard, like the emulator's Capture Screen.
4. Key log panel like the emulator's KeyLog (copy, select all, clear), in the same key notation our golden tests use.
5. Scale to any window without blurring the LCD; works at phone width.
6. Pop-out LCD window (popout.html) mirrors the same Calculator state.
7. Installable offline web app (manifest + service worker) with our own icon (not Casio's).

Done when: it works with mouse, touch and keyboard, scales cleanly, copies screen captures, and runs with the network off.
```

---

### Prompt 29 — Desktop app (optional)

```
Package the app as a Windows desktop app the same way my EX project does (look at its electron-main.cjs and scripts/build_exe.js / build_installer.js). Our own name ("fx-991ES PLUS 2nd ed re-creation"), our own icon, no Casio files inside the package. Output in dist/ (git-ignored).

Done when: the installer builds, installs, and the app runs offline.
```

---

### PHASE H — Matching the real one exactly

---

### Prompt 30 — Fidelity sweep, mode by mode

```
Do a full side-by-side comparison against the official emulator, one mode at a time.

For the mode I name: list every screen and every key in every screen (from docs/spec/modes.md and keys.md), including keys that should do nothing. Make docs/fidelity/<mode>.md with a key sequence for each item. I'll run each on the emulator and paste the KeyLog text plus what I see (or ×1 captures). Fix every difference, add each as a golden test (source "emulator"), and mark it done.

Start with: COMP. (Next: SETUP & CLR, CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE, VECTOR, MODE/ID screen.)

Done when: every item in the mode's checklist matches and is a golden test.
```

---

### Prompt 31 — Accuracy stress test

```
Adapt the EX project's scripts/stress.js to the ES PLUS: 2,000 random expressions using only ES functions (no FACT, GCD, Int, PreAns…), mixing exact and decimal, nesting, Norm/Fix/Sci, written as key sequences to tests/stress/cases.json in the emulator's KeyLog notation so I can replay them.

I'll run batches of 100 on the emulator and fill in the results. Compare, group differences by cause (rounding, function accuracy, √/π form choice, priority, error type), fix the causes, add each as a golden test.

Done when: the first 100 match 100%; then repeat with the next batch.
```

---

### Prompt 32 — Performance and code health

```
1. Any key press updates the screen in under 16 ms (∫/d/dx/SOLVE run in the background).
2. Remove dead code, leftover EX-only code (search for: PreAns, OPTN, MENU, MatD, VctD, spreadsheet, distribution, inequality, ratio, FACT, GCD, LCM, Intg, QRView, 192, 63) and duplicate logic between modes.
3. Every mode uses the shared Calculator core, number type, formatter, input buffer and layout engine.
4. Update docs/ARCHITECTURE.md and docs/PORTING.md to match the final code.
5. All tests pass: unit, golden and pixel.

Done when: tests pass, the EX-only search finds nothing (or only explained comments), and the docs are current.
```

---

### Prompt 33 — Final check

```
1. Go through docs/STATUS.md: every prompt Done with its golden tests.
2. List anything still different from the official emulator, with the key presses to see it.
3. Check git history: no Casio ROM, DLL, fonts, bitmaps, captures, screenshots or PDFs were ever committed. If they were, tell me (don't rewrite history without asking).
4. Write docs/KNOWN_DIFFERENCES.md (include the Calculator ID screen being a demo, and the emulator speed difference).

Done when: STATUS.md is all Done and KNOWN_DIFFERENCES.md is written.
```

---

## Fix prompt template (use this whenever something is different)

```
Mismatch with the official emulator.

Mode: <COMP / CMPLX / STAT / ...>
Setup: <e.g. MthIO-MathO, Deg, Norm 1, d/c>
Keys pressed (KeyLog text from the emulator): <paste>
Official emulator shows: <exact text, or attach a ×1 capture>
Our app shows: <exact text, or attach a screenshot>

1. Add this as a failing golden test first (source "emulator").
2. Find the cause (say which file and why).
3. Fix it without breaking other golden tests.
4. Run npm test and show the summary.
```

## Session-start template (when coming back after a break)

```
(Paste Prompt 0 first.)

We are continuing. Read docs/STATUS.md, docs/ARCHITECTURE.md and docs/spec/differences_from_ex.md, run npm test, and tell me:
1. Which prompt we are on and what's left in it.
2. Which tests fail right now.
Then continue with Prompt <number>.
```

## VERIFY answers template (after the agent gives you a VERIFY list)

```
Here are the official emulator results for your VERIFY list:
1. <key sequence> → <what it shows> (capture attached if layout matters)
2. ...
Update docs/spec/ and turn each one into a golden test with source "emulator".
```

---

## Part 3 — First golden test cases

Default setup unless stated: MthIO-MathO, Deg, Norm 1, d/c, a+bi, STAT OFF, Dot. **Source "guide"** = printed in the official User's Guide. **"check"** = my expectation; confirm on the emulator before trusting it.

| # | Setup | Keys | Expected | Source |
|---|---|---|---|---|
| 1 | | `2 □/□ 3 ▶ + 1 □/□ 2 =` (or `□/□ 2 ▼ 3 ▶ + □/□ 1 ▼ 2 =`) | `7/6` | guide |
| 2 | | then `S⇔D` | `1.166666667` | check |
| 3 | LineIO | `1 ÷ 5 =` then `S⇔D` | `0.2` → `1⌋5` | guide |
| 4 | | `SHIFT ×10ˣ(π) ÷ 6 =` then `S⇔D` | `1/6 π` → `0.5235987756` | guide |
| 5 | | `( √2 ▶ + 2 ) × √3 =` | `√6+2√3` (S⇔D `5.913591358`) | guide |
| 6 | | `10 √2 ▶ + 15 × 3 √3 =` | `45√3+10√2` | guide |
| 7 | | `99 √999 =` | `3129.089165` | guide |
| 8 | | `√ 8 =` | `2√2` | check |
| 9 | | `sin 30 ) =` | `1/2` | check |
| 10 | LineIO | `sin 30 ) =` / `SHIFT sin 0.5 ) =` | `0.5` / `30` | guide |
| 11 | | `0.1 + 0.2 =` | `3/10` (S⇔D `0.3`) | check |
| 12 | | `( − ) 2 x² =` | `−4` | guide (priority note) |
| 13 | | `12345678901 =` | `1.23456789×10¹⁰` | check |
| 14 | Norm 1 / 2 | `1 ÷ 200 =` | `5×10⁻³` / `0.005` | guide |
| 15 | | `69 SHIFT x⁻¹ =` | `1.711224524×10⁹⁸` | check |
| 16 | | `70 SHIFT x⁻¹ =` | `Math ERROR` | guide (range) |
| 17 | | `14 ÷ 0 × 2 =` | `Math ERROR` | guide |
| 18 | | `tan 90 ) =` | `Math ERROR` | guide (range) |
| 19 | | `log 1000 ) =` | `3` | guide |
| 20 | | `log■□ 2 ▶ 16 =` | `4` | guide |
| 21 | | `1.2 × 10 x^ 3 =` | `1200` | guide |
| 22 | | `( 5 x² ) SHIFT x²(x³) =` | `15625` | guide |
| 23 | | `SHIFT x^(■√□) 5 ▶ 32 =` | `2` | guide |
| 24 | | `SHIFT √(∛) 5 ▶ + SHIFT √(∛) (−) 27 =` | `−1.290024053` | guide (2nd ed) |
| 25 | | `150 × 20 SHIFT ( =` | `30` | guide |
| 26 | | `2 °′″ 20 °′″ 30 °′″ + 0 °′″ 39 °′″ 30 °′″ =` | `3°0′0″` | guide |
| 27 | LineIO | `4 × 3 + 2.5 =`, `◀ DEL×4 − 7.1 =` | `14.5`, `4.9` | guide |
| 28 | | `3 + 3 ALPHA ∫ 3 × 3 = =` | `6` then `9` | guide |
| 29 | | `1234 = ENG ENG` | `1.234×10³`, `1234×10⁰` | guide |
| 30 | Fix 3 | `10 ÷ 3 × 3 =` / `SHIFT 0 10 ÷ 3 ) × 3 =` | `10.000` / `9.999` | guide |
| 31 | | `10 SHIFT × 4 =` / `10 SHIFT ÷ 4 =` | `5040` / `210` | guide |
| 32 | | `SHIFT + √2 ▶ SHIFT ) √2 ▶ ) =` | `r=2, θ=45` | guide |
| 33 | Rad | `SHIFT ∫ sin ALPHA ) ) ▶ SHIFT ×10ˣ ÷ 2 =` | `0` | guide |
| 34 | | `SHIFT log■□ ALPHA ) + 1 ▶ 1 ▶ 5 =` | `20` | guide |
| 35 | | `∫ ln ALPHA ) ) ▶ 1 ▶ ALPHA ×10ˣ =` | `1` | guide |
| 36 | | `SHIFT 7 28 =` | `299792458` | guide |
| 37 | LineIO | `5 SHIFT 8 02 =` | `1.968503937` | check (computed) |
| 38 | | `π − 3.141592653 =` | `5.898×10⁻¹⁰` if internal π is as the guide states | check |
| 39 | CMPLX | `( 2 + 6 i ) ÷ ( 2 i ) =` | `3−i` | guide |
| 40 | BASE-N | `15 × 37 =` then `HEX` | `555` → `0000022B` | guide |
| 41 | EQN 1 | `1 2 3` / `2 3 4` | `X=−1, Y=2` | guide |
| 42 | EQN 4 | `1 −2 −1 2` | `X1=−1, X2=2, X3=1` | guide |
| 43 | MATRIX | det([[2,1],[1,1]]) | `1` | guide |
| 44 | VECTOR | (1,2)·(3,4) | `11` | guide |
| 45 | TABLE | f(X)=X, Start 1, End 40, Step 1 | `Insufficient MEM` | guide |
| 46 | | `MODE 0` | Calculator ID screen; `AC` → MODE menu | guide (2nd ed) |
| 47 | | `1 ÷ 2 SHIFT ×10ˣ =` | check (omitted multiplication: 1/(2π) expected) | check |
| 48 | | `6 ÷ 2 ( 1 + 2 ) =` | check | check |

---

## Part 4 — Progress checklist

- [ ] 1 Bootstrap: port EX engine
- [ ] 2 ES spec from the User's Guide
- [ ] 3 Faceplate, key map, LCD config
- [ ] 4 Golden harness + KeyLog import
- [ ] 5 Decimal engine & functions (ES ranges)
- [ ] 6 Display formatting
- [ ] 7 Exact results (√ form, π form, S⇔D)
- [ ] 8 Input buffer & key mapping
- [ ] 9 Parser & priority
- [ ] 10 Evaluator & errors
- [ ] 11 LCD engine, icons & fonts (96×31)
- [ ] 12 Natural / Linear layout
- [ ] 13 COMP, history & replay
- [ ] 14 Variables, memory & CLR
- [ ] 15 SETUP & contrast
- [ ] 16 hyp, DRG▸, CONST, CONV, Pol/Rec
- [ ] 17 CALC & SOLVE
- [ ] 18 ∫ d/dx Σ
- [ ] 19 MODE menu & Calculator ID
- [ ] 20 CMPLX
- [ ] 21 STAT
- [ ] 22 BASE-N
- [ ] 23 EQN
- [ ] 24 MATRIX
- [ ] 25 TABLE
- [ ] 26 VECTOR
- [ ] 27 Power & reset
- [ ] 28 Faceplate, keyboard, pop-out, offline
- [ ] 29 Desktop app (optional)
- [ ] 30 Fidelity sweep (per mode)
- [ ] 31 Accuracy stress test
- [ ] 32 Performance & cleanup
- [ ] 33 Final check

**Order matters:** Phases A–C (Prompts 1–10) are the foundation. Because the engine is ported from the EX, the risk is not "does it work" but "does it still behave like the EX where the ES is different". Prompts 2 and 5–10 exist to catch exactly that. Don't skip ahead to the modes.
