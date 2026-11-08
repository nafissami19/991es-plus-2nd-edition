# Modes Specification — Casio fx-991ES PLUS 2nd edition

The calculator provides exactly 8 calculation modes accessed via the `MODE` key.

## 1. MODE Selection Menu

Pressing `MODE` displays the numbered text menu on the 96×31 LCD:
```
1:COMP       2:CMPLX
3:STAT       4:BASE-N
5:EQN        6:MATRIX
7:TABLE      8:VECTOR
```
- Numeric keys `1` through `8` switch directly to the chosen mode.
- Pressing `0` displays the **Calculator ID Screen** (MODE 0).
- Pressing `AC` exits the MODE menu without changing the current mode.

---

## 2. Mode Specifications

### 1: COMP (Basic & Scientific Calculation)
- **Status Indicator**: None (or `Math`, `D`/`R`/`G`, `FIX`, `SCI`, `Disp`).
- **Features**: Full scientific calculation, exact fractions/surds/$\pi$, CALC, SOLVE, $\int$, $\frac{d}{dx}$, $\Sigma$, constants (`SHIFT 7`), conversions (`SHIFT 8`), sexagesimal degrees.
- **History**: Keeps ~200 bytes of calculation history navigable via `▲` and `▼`.

### 2: CMPLX (Complex Number Calculations)
- **Status Indicator**: `CMPLX`.
- **Display Format**: Natural or Linear. In LineIO, rectangular form displays $a$ and $bi$ on separate lines; polar displays $r$ and $\theta$ on separate lines.
- **Keys**:
  - `i` = `ALPHA ENG`
  - `∠` = `SHIFT (-)`
- **SHIFT 2 Menu**:
  `1:arg  2:Conjg  3:▸r∠θ  4:▸a+bi`
- **Supported Functions**: $+$, $-$, $\times$, $\div$, $x^2$, $x^3$, $x^{-1}$, $\text{Abs}$, `CALC`.
- **Restrictions**: $\int$, $\frac{d}{dx}$, $\Sigma$, `SOLVE` are prohibited (`Syntax ERROR`).

### 3: STAT (Statistical Calculations)
- **Status Indicator**: `STAT`.
- **Display Format**: Always forces **Linear Display**.
- **Entry Sub-Menu (Type)**:
  `1:1-VAR  2:A+BX  3:_+CX²  4:ln X  5:e^X  6:A•B^X  7:A•X^B  8:1/X`
- **Stat Editor**:
  - Columns: $X$, $(Y)$, $(FREQ)$ based on type and SETUP STAT setting.
  - Row capacity: 80 (1-VAR no FREQ), 40 (1-VAR FREQ or Paired no FREQ), 26 (Paired FREQ).
  - Navigation: Arrows navigate cells; `=` commits cell entry; `DEL` deletes current row.
  - `AC` exits editor to the Stat Calculation Screen.
- **SHIFT 1 Menu**:
  - 1-VAR: `1:Type  2:Data  3:Sum  4:Var  5:Distr  6:MinMax`
  - Paired: `1:Type  2:Data  3:Sum  4:Var  5:Reg  6:MinMax`
  - In Editor: Item 3 becomes `3:Edit` (`1:Ins  2:Del-A`).
- **Data Lifecycle**: Stat data is deleted when leaving STAT mode, switching regression type, or toggling SETUP STAT FREQ.

### 4: BASE-N (Binary, Octal, Decimal, Hexadecimal Calculations)
- **Status Indicator**: Base indicator on display (`Dec`, `Hex`, `Bin`, `Oct`).
- **Display Format**: Always forces **Linear Display**.
- **Direct Base Keys**:
  - `x²`: `DEC`
  - `x^■`: `HEX`
  - `log`: `BIN`
  - `ln`: `OCT`
- **Direct Hex Keys (in HEX mode)**:
  `(-)` $\rightarrow$ A, `°′″` $\rightarrow$ B, `hyp` $\rightarrow$ C, `sin` $\rightarrow$ D, `cos` $\rightarrow$ E, `tan` $\rightarrow$ F.
- **SHIFT 3 Menu**:
  - Page 1: `1:and  2:or  3:xor  4:xnor  5:Not  6:Neg`
  - Page 2: `1:d  2:h  3:b  4:o` (base override prefixes)
- **Restrictions**: Fractions and decimals are prohibited (`Syntax ERROR`). Constants and conversions not permitted.

### 5: EQN (Equation Solutions)
- **Type Menu**:
  `1:anX + bnY = cn` (Simultaneous 2 unknowns)
  `2:anX + bnY + cnZ = dn` (Simultaneous 3 unknowns)
  `3:aX² + bX + c = 0` (Quadratic equation)
  `4:aX³ + bX² + cX + d = 0` (Cubic equation)
- **Coefficient Editor**: Grid of coefficients ($a, b, c, d$), arrow keys, `=` to store. `AC` zeroes all coefficients.
- **Solutions**:
  - Simultaneous: Linear or fractional solutions ($X=$, $Y=$, $Z=$). Never in $\sqrt{}$ form.
  - Quadratic & Cubic: Exact $\sqrt{}$ forms or complex roots ($X_1=$, $X_2=$, $X_3=$) formatted per SETUP CMPLX setting.
  - `▲` / `▼` scroll through roots; `AC` returns to coefficient editor.

### 6: MATRIX (Matrix Calculations)
- **Status Indicator**: `MAT`.
- **Display Format**: Always forces **Linear Display**.
- **Variables**: MatA, MatB, MatC, MatAns (dimensions up to $3 \times 3$).
- **SHIFT 4 Menu**:
  `1:Dim  2:Data  3:MatA  4:MatB  5:MatC  6:MatAns  7:det  8:Trn`
- **Operations**: $+$, $-$, $\times$, scalar multiplication, $\text{det}$, $\text{Trn}$, $x^{-1}$ (inverse), $x^2$, $x^3$, $\text{Abs}$.
- **MatAns Screen**: Pressing an operator key (+, −, ×, etc.) immediately initiates a new expression starting with `MatAns`.

### 7: TABLE (Function Table Generation)
- **Formula Input**: Prompts `f(X)=`.
- **Parameters**: Prompts `Start?` (default 1), `End?` (default 5), `Step?` (default 1).
- **Table Display**: View-only 2-column grid ($X$ and $F(X)$).
- **Row Limit**: Maximum 30 generated values. Generating $>30$ rows raises `Insufficient MEM`.
- **Side Effects**: Changing MthIO ⇄ LineIO in SETUP deletes the stored $f(X)$ formula.

### 8: VECTOR (Vector Calculations)
- **Status Indicator**: `VCT`.
- **Display Format**: Always forces **Linear Display**.
- **Variables**: VctA, VctB, VctC, VctAns (dimension 2 or 3).
- **SHIFT 5 Menu**:
  `1:Dim  2:Data  3:VctA  4:VctB  5:VctC  6:VctAns  7:Dot`
- **Operations**: $+$, $-$, scalar multiplication, Dot product (`SHIFT 5 7`), cross product (`×`), $\text{Abs}$ (magnitude).
- **VctAns Screen**: Pressing an operator key continues with `VctAns`.
