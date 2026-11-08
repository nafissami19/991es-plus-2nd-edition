# Keypad Specification — Casio fx-991ES PLUS 2nd edition

The keypad consists of exactly 50 physical keys arranged across 9 functional rows.

## 1. Master Key Matrix (50 Keys)

| Key Code | Primary Face | SHIFT (Yellow) | ALPHA (Red/Pink) | Mode-Specific Legend / Menu | PC Keyboard Shortcut |
|---|---|---|---|---|---|
| `SHIFT` | SHIFT | — | — | Latch `S` indicator | `F1` |
| `ALPHA` | ALPHA | — | — | Latch `A` indicator | `F2` |
| `UP` | ▲ (Up) | — | — | History up / Editor row up / Page up | `Up` |
| `DOWN` | ▼ (Down) | — | — | History down / Editor row down / Page down | `Down` |
| `LEFT` | ◀ (Left) | — | — | Cursor left / Goto error / CONT adjust | `Left` |
| `RIGHT` | ▶ (Right) | — | — | Cursor right / Goto error / CONT adjust | `Right` |
| `MODE` | MODE | SETUP | — | MODE 1–8 text menu; MODE 0 ID | `F3`, `Home` |
| `ON` | ON | — | — | Power on, clear history, self-test | `F4` |
| `CALC` | CALC | SOLVE | = | Linear CALC / Newton SOLVE / `=` equality | `c` |
| `INTEGRAL` | ∫□□ | d/dx■ | : | Multi-statement separator `:` | `i` |
| `RECIP` | x⁻¹ | x! | — | Matrix/Vector inverse x⁻¹, factorial x! | `x` |
| `LOGBASE` | log■□ | Σ■ | — | Arbitrary base log / Summation Σ | `l` |
| `FRAC` | □/□ | ■□/□ | — | Fraction template / Mixed fraction | `/`, `f` |
| `SQRT` | √■ | ∛■ | — | Square root / Cube root | `q` |
| `SQUARE` | x² | x³ | — | BASE-N: DEC | `@` |
| `POWER` | x^■ | ■√□ | — | BASE-N: HEX | `^` |
| `LOG` | log | 10^■ | — | BASE-N: BIN | `L` |
| `LN` | ln | e^■ | — | BASE-N: OCT | `n` |
| `NEG` | (−) | ∠ (CMPLX) | A (HEX/Var) | Polar angle ∠ in CMPLX, hex digit A | `_` |
| `DMS` | °′″ | ← (DMS conv) | B (HEX/Var) | Sexagesimal input/conv, hex digit B | `'` |
| `HYP` | hyp | Abs | C (HEX/Var) | Hyperbolic menu (1–6), Abs, hex digit C | `h` |
| `SIN` | sin | sin⁻¹ | D (HEX/Var) | Sine / Inverse sine, hex digit D | `s` |
| `COS` | cos | cos⁻¹ | E (HEX/Var) | Cosine / Inverse cosine, hex digit E | `o` |
| `TAN` | tan | tan⁻¹ | F (HEX/Var) | Tangent / Inverse tangent, hex digit F | `t` |
| `RCL` | RCL | STO | — | Variable recall / Variable store | `r` |
| `ENG` | ENG | ←ENG | i (CMPLX) | Engineering shift / Imaginary unit `i` | `e` |
| `LPAREN` | ( | % | — | Parenthesis open / Percent % | `(` |
| `RPAREN` | ) | , | X (Var) | Parenthesis close / Comma `,` / Variable X | `)` |
| `SD` | S⇔D | a b/c ⇔ d/c | Y (Var) | Result toggle (Exact ⇄ Dec) / Variable Y | `v` |
| `MPLUS` | M+ | M− | M (Var) | Add to memory / Subtract from M / Variable M | `m` |
| `7` | 7 | CONST | — | Scientific constants (01–40) | `7` |
| `8` | 8 | CONV | — | Metric conversions (01–40) | `8` |
| `9` | 9 | CLR | — | Reset menu (1:Setup 2:Memory 3:All) | `9` |
| `DEL` | DEL | INS | — | Delete / INS wrap (Natural) / Overwrite toggle | `Backspace`, `Delete` |
| `AC` | AC | OFF | — | Clear / Power off (SHIFT AC) | `Escape`, `Space`, `Tab` |
| `4` | 4 | MATRIX | — | SHIFT 4: MATRIX menu (in MATRIX mode) | `4` |
| `5` | 5 | VECTOR | — | SHIFT 5: VECTOR menu (in VECTOR mode) | `5` |
| `6` | 6 | — | — | Number 6 | `6` |
| `MUL` | × | nPr | — | Multiplication / Permutation / Vector cross | `*` |
| `DIV` | ÷ | nCr | — | Division / Combination | `/` |
| `1` | 1 | STAT | — | SHIFT 1: STAT menu (in STAT mode) | `1` |
| `2` | 2 | CMPLX | — | SHIFT 2: CMPLX menu (in CMPLX mode) | `2` |
| `3` | 3 | BASE | — | SHIFT 3: BASE-N menu (in BASE-N mode) | `3` |
| `ADD` | + | Pol( | — | Addition / Pol( coordinate conversion | `+` |
| `SUB` | − | Rec( | — | Subtraction / Rec( coordinate conversion | `-` |
| `0` | 0 | Rnd | — | Number 0 / Rounding function Rnd | `0` |
| `DOT` | . | Ran# | RanInt# | Decimal dot / Random decimal / Random integer | `.` |
| `EXP10` | ×10ˣ | π | e | Powers of 10 / Constant π / Constant e | `E`, `p` |
| `ANS` | Ans | DRG▸ | — | Last answer memory / Angle menu (1:° 2:r 3:g) | `a` |
| `EXE` | = | — | — | Evaluate / Execute calculation | `Enter`, `=` |

## 2. Mode-Specific Key Behaviors

### Mode 1: COMP
- `hyp` opens Hyperbolic Menu (1:sinh, 2:cosh, 3:tanh, 4:sinh⁻¹, 5:cosh⁻¹, 6:tanh⁻¹).
- `SHIFT Ans` opens DRG▸ Menu (1:°, 2:r, 3:g).
- `SHIFT 7` prompts for 2-digit constant (01–40).
- `SHIFT 8` prompts for 2-digit conversion (01–40).
- `SHIFT 1..5` mode menus: Disabled or ignore (VERIFY ON EMULATOR: `SHIFT 1` in COMP mode).
- `ALPHA ENG` (i) and `SHIFT (-)` (∠): Syntax ERROR or ignored (VERIFY ON EMULATOR).

### Mode 2: CMPLX
- `ALPHA ENG` inserts imaginary unit `i`.
- `SHIFT (-)` inserts angle symbol `∠`.
- `SHIFT 2` opens CMPLX Menu (1:arg, 2:Conjg, 3:▸r∠θ, 4:▸a+bi).
- `CALC` is supported; `SOLVE`, `∫`, `d/dx`, `Σ` are not allowed (Syntax ERROR).

### Mode 3: STAT
- Automatically forces Linear Display.
- In Stat Editor: Data entry cells, `DEL` deletes row, `SHIFT 1 3 (Edit)` allows inserting/deleting all.
- In Stat Calc Screen: `SHIFT 1` opens STAT Menu:
  - 1-VAR: `1:Type  2:Data  3:Sum  4:Var  5:Distr  6:MinMax`
  - Paired-VAR: `1:Type  2:Data  3:Sum  4:Var  5:Reg  6:MinMax`

### Mode 4: BASE-N
- Automatically forces Linear Display.
- `x²`, `x^`, `log`, `ln` act directly as `DEC`, `HEX`, `BIN`, `OCT` base switch/display keys.
- In HEX mode: `(-) `, `°′″`, `hyp`, `sin`, `cos`, `tan` type `A`, `B`, `C`, `D`, `E`, `F` directly without pressing ALPHA.
- `.` (dot) and `□/□` (fraction) produce `Syntax ERROR`.
- Scientific constants (`SHIFT 7`) and metric conversions (`SHIFT 8`) are not allowed.
- `SHIFT 3` opens BASE Menu:
  - Page 1: `1:and  2:or  3:xor  4:xnor  5:Not  6:Neg`
  - Page 2: `1:d  2:h  3:b  4:o`

### Mode 5: EQN
- Matrix-style coefficient editor: `=` inputs value, arrow keys navigate cells, `AC` zeroes all coefficients.
- Solution screen: `=` steps through variables ($X, Y, Z$ or $X_1, X_2, X_3$).

### Mode 6: MATRIX
- Automatically forces Linear Display.
- `SHIFT 4` opens MATRIX Menu: `1:Dim  2:Data  3:MatA  4:MatB  5:MatC  6:MatAns  7:det  8:Trn`.
- `x⁻¹` computes inverse matrix, `x²` and `x³` compute powers.

### Mode 7: TABLE
- Inputs $f(X)$, then prompts `Start?`, `End?`, `Step?`.
- Table display is view-only, navigating with ▲/▼.

### Mode 8: VECTOR
- Automatically forces Linear Display.
- `SHIFT 5` opens VECTOR Menu: `1:Dim  2:Data  3:VctA  4:VctB  5:VctC  6:VctAns  7:Dot`.
- `×` computes cross product, `SHIFT 5 7` (Dot) computes dot product, `Abs` computes magnitude.
