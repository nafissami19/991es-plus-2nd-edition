# Modes Fidelity Sweep & Audit (Modes 2–8 & Calculator ID)

This document records the comprehensive side-by-side audit of all modes against the official Casio fx-991ES PLUS 2nd edition emulator.

---

## 1. CMPLX Mode (MODE 2)

- **Status Indicators**: `CMPLX` indicator active; `Math` indicator active in MathO.
- **Imaginary Unit**: Direct `i` input via `ENG` or `ALPHA ENG`.
- **Polar Angle**: Angle symbol `∠` via `SHIFT (-)`.
- **CMPLX Menu (`SHIFT 2`)**:
  - `1:arg`: Argument of complex number. Exact rational multiples of $\pi$ in RAD; exact degrees for multiples of $15^\circ$ in DEG.
  - `2:Conjg`: Complex conjugate $\overline{a+bi} = a - bi$.
  - `3:▸r∠θ`: Postfix command converting result to polar form.
  - `4:▸a+bi`: Postfix command converting result to rectangular form.
- **Restrictions**: Calculus ($\int$, $\frac{d}{dx}$, $\Sigma$) and `SOLVE` are strictly prohibited (throw `Syntax ERROR` or ignored).
- **Golden Test**: `case_39_cmplx_div.json` (Golden test #39).

---

## 2. STAT Mode (MODE 3)

- **Status Indicators**: `STAT` indicator active; `Math` indicator suppressed (Linear Display only).
- **Type Selection Menu**:
  - `1: 1-VAR`, `2: A+BX`, `3: _+CX²`, `4: ln X`, `5: e^X`, `6: A•B^X`, `7: A•X^B`, `8: 1/X`.
- **Stat Editor**:
  - Columns: $X$, $(Y)$, and optional $FREQ$.
  - Maximum row capacities: 80 rows (1-VAR without FREQ), 40 rows (1-VAR with FREQ or Paired without FREQ), 26 rows (Paired with FREQ).
  - Cell editing: In-cell formula evaluation with `=`, row deletion with `DEL`, row insertion with `SHIFT 1 3 1 (Ins)`.
- **Stat Menu (`SHIFT 1`)**:
  - `1:Type`, `2:Data`, `3:Sum`, `4:Var`, `5:Distr/Reg`, `6:MinMax`.
  - Normal distribution functions: $P(t)$, $Q(t)$, $R(t)$, and postfix $\blacktriangleright t$.
  - Regression estimators: $\hat{x}$, $\hat{y}$, $\hat{x}_1$, $\hat{x}_2$ at priority level 6.

---

## 3. BASE-N Mode (MODE 4)

- **Status Indicators**: Linear Display mode, Math indicator suppressed.
- **Direct Base Keys**: `DEC` ($x^2$), `HEX` ($x^\blacksquare$), `BIN` ($\log$), `OCT` ($\ln$).
- **Direct Hex Digits**: `A` (`(-)`), `B` (`°'"`), `C` (`hyp`), `D` (`sin`), `E` (`cos`), `F` (`tan`) without pressing ALPHA.
- **Word Sizes & Overflow**:
  - Binary: 16-bit signed ($-32768 \dots 32767$, zero-padded to 16 digits).
  - Decimal: 32-bit signed ($-2147483648 \dots 2147483647$).
  - Hex: 32-bit (zero-padded to 8 hex digits).
  - Octal: 32-bit (zero-padded to 11 octal digits).
- **Logical Operations (`SHIFT 3`)**:
  - Page 1: `1:and`, `2:or`, `3:xor`, `4:xnor`, `5:Not(`, `6:Neg(`.
  - Page 2: `1:d`, `2:h`, `3:b`, `4:o` base prefixes.
- **Golden Test**: `case_40_basen_convert.json` (Golden test #40).

---

## 4. EQN Mode (MODE 5)

- **Status Indicators**: Linear Display mode.
- **Type Selection Menu**:
  - `1: anX + bnY = cn` (2-unknown simultaneous linear)
  - `2: anX + bnY + cnZ = dn` (3-unknown simultaneous linear)
  - `3: aX² + bX + c = 0` (Quadratic equation)
  - `4: aX³ + bX² + cX + d = 0` (Cubic equation)
- **Coefficient Editor**:
  - Matrix layout with column headers (`a`, `b`, `c`, `d`) and row indicators. Invert highlight on active cell.
  - In-cell formula evaluation on `=`. `AC` zeroes all coefficients.
- **Solution Screens**:
  - Simultaneous: `X=`, `Y=`, `Z=` formatted in 10-digit decimal or fraction. `Math ERROR` on singular or inconsistent systems.
  - Quadratic & Cubic: Descending order roots (`X1=`, `X2=`, `X3=`), repeated root collapses to single `X=`, complex roots displayed in rectangular or polar format per SETUP.
- **Golden Tests**: `case_41_eqn_2unknown.json`, `case_42_eqn_cubic.json`.

---

## 5. MATRIX Mode (MODE 6)

- **Status Indicators**: `MAT` indicator active; Linear Display mode.
- **Matrix Variables**: `MatA`, `MatB`, `MatC` up to $3 \times 3$ dimensions.
- **Dimension Menu**: 2-page menu (Page 1: 3×3..2×1, Page 2: 1×3..1×1).
- **Matrix Editor**: 3 columns visible on 96×31 LCD, invert highlight on active cell, bottom status line.
- **MATRIX Menu (`SHIFT 4`)**:
  - Page 1: `1:Dim`, `2:Data`, `3:MatA`, `4:MatB`.
  - Page 2: `5:MatC`, `6:MatAns`, `7:det`, `8:Trn`.
- **Operations**: Addition, subtraction, matrix multiplication, scalar multiplication, inverse ($x^{-1}$), square ($x^2$), cube ($x^3$).
- **Golden Test**: `case_43_mat_det.json`.

---

## 6. TABLE Mode (MODE 7)

- **Formula Editor**: Single $f(X)$ formula (no $g(X)$ on fx-991ES PLUS 2nd edition).
- **Variable**: Variable $X$ via `ALPHA )`. Other variables treated as constants.
- **Prompts**: `Start?` (default 1), `End?` (default 5), `Step?` (default 1).
- **Capacity**: Strictly maximum 30 rows; exceeding 30 rows raises `Insufficient MEM`. Step = 0 raises `Math ERROR`.
- **Table Grid**: 2-column view ($X$ and $F(X)$) with row index, active row updates calculator memory variable $X$.
- **Golden Test**: `case_45_table_insufficient_mem.json`.

---

## 7. VECTOR Mode (MODE 8)

- **Status Indicators**: `VCT` indicator active; Linear Display mode.
- **Vector Variables**: `VctA`, `VctB`, `VctC` with dimension 2 or 3.
- **VECTOR Menu (`SHIFT 5`)**:
  - Page 1: `1:Dim`, `2:Data`, `3:VctA`, `4:VctB`.
  - Page 2: `5:VctC`, `6:VctAns`, `7:Dot`.
- **Operations**: Vector addition, subtraction, scalar multiplication, scalar division, dot product (`•`), cross product ($\times$).
- **Golden Test**: `case_44_vct_dot.json`.

---

## 8. Calculator ID & QR Code Screen (MODE 0)

- **Access**: Press `MODE 0`.
- **Display**: 24-character demonstration ID (`DEMO-991ES-PLUS2-0000001`) with self-contained $25 \times 25$ QR code (Version 2-M).
- **Navigation**: `AC` returns to MODE menu.
- **Golden Test**: `case_46_mode_0_id.json`.
