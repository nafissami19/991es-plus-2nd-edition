# Codebase Differences: fx-991EX Codebase vs. fx-991ES PLUS 2nd edition Spec

This document tracks every difference between the copied ClassWiz codebase and the required fx-991ES PLUS 2nd edition implementation, organized by file.

## 1. Core Engine & State

### `js/core/Calculator.js`
- **Screen dimensions**: EX used 192×63; ES PLUS uses 96×31 dot matrix + fixed status indicator icons.
- **Key dispatch**: Remove `MENU` key handling and icon grid; replace with `MODE` numbered menu (1..8) and `MODE 0` Calculator ID.
- **OPTN key**: Remove `OPTN` key processing and all `optnMenu` routing.
- **Status indicators**: Replace EX icon indicators with ES fixed row: `S, A, M, STO, RCL, STAT, CMPLX, MAT, VCT, D, R, G, FIX, SCI, Math, ▼, ▲, Disp`.
- **Modes registered**: Reduce from 12 modes to exactly 8.

### `js/core/setup.js`
- **Menu structure**: Two-page numbered menu with `▲`/`▼`.
- **Items**:
  - Page 1: 1:MthIO, 2:LineIO, 3:Deg, 4:Rad, 5:Gra, 6:Fix, 7:Sci, 8:Norm.
  - Page 2: 1:ab/c, 2:d/c, 3:CMPLX, 4:STAT, 5:Disp, 6:◀CONT▶.
- **Removed**: Engineering Symbol, Digit Separator, Multiline Font, Language, Auto Power Off menu, QR, Table function setting, Equation complex setting.
- **Naming**: `MthIO-MathO`, `MthIO-LineO`, `LineIO` instead of `MathI/MathO`.

### `js/core/memory.js`
- **Variables**: Uppercase `X` and `Y` only. Remove lowercase `x`, `y`.
- **PreAns**: Remove `PreAns` completely.
- **History clearing**: Ensure `ON` key, mode change, and display format change clear calculation history (~200 bytes).

---

## 2. Input & Parser

### `js/core/input/tokens.js` & `keyInput.js`
- **99-byte limit**: Track byte budget according to Casio ES byte weights.
- **Cursor shape**: Trigger square `■` cursor when $\le 10$ bytes remain; block input when limit reached.
- **Keys**: 50 keys matching ES faceplate. Map `hyp` to hyperbolic menu, `SHIFT Ans` to DRG▸ menu.
- **INS key**: In MathO, `SHIFT DEL` wraps argument to the right into the next pressed template function. In LineIO, toggles insert/overwrite cursor (`|` vs `_`).
- **Consecutive powers**: Disallow direct succession of postfix powers ($x^2, x^3, x^{-1}, x^\blacksquare$).

### `js/core/parse/parser.js`
- **Priority table**: Enforce Casio 13-level table.
- **Omitted multiplication**: Level 7 (higher than $\times, \div$ at Level 10).
- **Implicit `)`**: Auto-close unclosed parentheses before `=` or `:`.
- **Negative sign**: Level 5 (lower than $x^2$ at Level 3).

---

## 3. Formatting & Exact Math

### `js/core/number/functions.js`
- **Constants**:
  - $\pi = 3.14159265358980$
  - $e = 2.71828182845904$
- **Input bounds**: Strictly enforce all domain bounds listed in `ranges.md`.
- **EX-only functions**: Remove or disable reachable access to FACT, GCD, LCM, Int, Intg, ÷R, recurring decimals.

### `js/core/exact/SurdForm.js`
- Limit square root forms to at most 2 terms and coefficient bounds ($a < 100$, $b < 1000$, $c < 100$, $d < 100$, $e < 1000$, $f < 100$). Fall back to decimal otherwise.

### `js/core/exact/PiForm.js`
- Limit $\pi$ form to $|x| < 10^6$.

### `js/core/format/formatNumber.js`
- Round internal 15 digits to 10 display digits.
- Norm 1 vs Norm 2 exponential ranges.
- Disp Comma modifies results only; input always uses dot.

---

## 4. Modes

| Mode | Changes Required from EX Codebase |
|---|---|
| **COMP** | Support optional tolerance in $\int$ and $\frac{d}{dx}$ in LineIO. Newton SOLVE with `L-R=` display. |
| **CMPLX** | $a+bi$ and $r\angle\theta$. `i` on ALPHA ENG, `∠` on SHIFT (-). SHIFT 2 menu. Remove ReP/ImP. |
| **STAT** | Always Linear. 8 regression types. Row limits (80/40/26). Normal distribution $P, Q, R, \blacktriangleright t$. Remove median/quartiles. |
| **BASE-N** | Always Linear. Direct base keys DEC(x²), HEX(x^), BIN(log), OCT(ln). Direct hex keys A–F without ALPHA. 16-bit BIN, 32-bit others. |
| **EQN** | Numbered type menu (1: 2 unknowns, 2: 3 unknowns, 3: quadratic, 4: cubic). Remove 4 unknowns, quartic, vertex screens. |
| **MATRIX** | Always Linear. MatA, MatB, MatC (up to 3×3). det, Trn, x⁻¹, x², x³, Abs. Remove MatD, Identity, RREF. |
| **TABLE** | Single $f(X)$ function only. Maximum 30 rows ($\rightarrow$ `Insufficient MEM`). Remove $g(X)$. |
| **VECTOR** | Always Linear. VctA, VctB, VctC (2D/3D). Dot, $\times$, Abs. Remove VctD, angle, unit vector. |

---

## 5. Screen & LCD

### `js/lcd/`
- Framebuffer $96 \times 31$ pixels.
- Status indicator row along top: $S, A, M, STO, RCL, STAT, CMPLX, MAT, VCT, D, R, G, FIX, SCI, Math, \blacktriangledown, \blacktriangle, Disp$.
- 2D box layout engine tailored for 31-pixel vertical space and 2-line rendering.
