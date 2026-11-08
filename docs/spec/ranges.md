# Calculation Ranges & Technical Limits — Casio fx-991ES PLUS 2nd edition

## 1. Number Precision & Internal Storage

- **Internal precision**: 15 significant decimal digits.
- **Display capacity**: 10-digit mantissa + 2-digit exponent.
- **Calculation range**: $\pm 1 \times 10^{-99}$ to $\pm 9.999999999 \times 10^{99}$, or zero.
- **Overflow**: Any intermediate or final result with absolute value $\ge 1 \times 10^{100}$ produces `Math ERROR`.
- **Underflow**: Values with absolute value $< 1 \times 10^{-99}$ underflow to `0`.
- **Display precision**: $\pm 1$ at the 10th digit for a single calculation.
- **Built-in constants**:
  - $\pi = 3.14159265358980$
  - $e = 2.71828182845904$

---

## 2. Input Limits

- **Input buffer capacity**: Up to 99 bytes per calculation.
- **Token size**: Most standard numerals, operators, and functions use 1 byte. Certain complex multi-character functions and templates consume 3 to 13 bytes.
- **Low memory cursor indicator**: When 10 bytes or fewer remain in the input buffer, the normal cursor changes to a solid square block `■`. Once all 99 bytes are consumed, further key input is blocked.
- **Formula height**: In Natural Display (MthIO), the maximum allowable visual height of an expression is 2 screens ($31 \text{ dots} \times 2 = 62 \text{ dots}$). Expressions exceeding this nesting height trigger an input refusal.
- **History capacity**: Approximately 200 bytes preserved across calculations in COMP, CMPLX, and BASE-N modes.

---

## 3. Exact Result Display Ranges (MathO)

### Square Root ($\sqrt{}$) Form Range
Square root results are permitted only if they can be expressed in at most two terms (where an integer counts as one term), matching one of these forms:
$$\pm a\sqrt{b}, \quad \pm d \pm a\sqrt{b}, \quad \frac{\pm a'\sqrt{b} \pm d'\sqrt{e}}{c'}$$
Where the coefficients must fall strictly within these integer limits:
- $1 \le a < 100$
- $1 < b < 1000$
- $1 \le c < 100$
- $0 \le d < 100$
- $0 \le e < 1000$
- $1 \le f < 100$

Any result falling outside these coefficient ranges or requiring 3 or more terms automatically falls back to **decimal format**.
- Example: $10\sqrt{2} + 15 \times 3\sqrt{3} = 45\sqrt{3} + 10\sqrt{2}$ ($\sqrt{}$ form).
- Example: $99\sqrt{999} = 297\sqrt{111}$, but $a = 297 \ge 100$, so it displays in decimal: `3129.089165`.

### $\pi$ Form Range
A calculation result is permitted to display in $\pi$ form only when:
$$|x| < 10^6$$
Outside this range, it displays in decimal format.

### Fraction Digit Limits
Fractions are reduced to lowest terms. In mixed fraction display (`ab/c`), if the total number of digits across integer part, numerator, denominator, and separator symbols exceeds 10 digits, the display automatically reverts to improper fraction (`d/c`) or decimal.

---

## 4. Function Input Domains & Singularities

| Function | Domain / Input Range | Singularities / Restrictions |
|---|---|---|
| $\sin x, \cos x$ | Deg: $0 \le \|x\| < 9 \times 10^9$<br>Rad: $0 \le \|x\| < 157079632.7$<br>Gra: $0 \le \|x\| < 1 \times 10^{10}$ | |
| $\tan x$ | Deg: Same as $\sin x$, except $\|x\| = (2n-1) \times 90$<br>Rad: Same as $\sin x$, except $\|x\| = (2n-1) \times \frac{\pi}{2}$<br>Gra: Same as $\sin x$, except $\|x\| = (2n-1) \times 100$ | Odd multiples of $90^\circ, \frac{\pi}{2}, 100\text{g} \rightarrow \text{Math ERROR}$ |
| $\sin^{-1} x, \cos^{-1} x$ | $0 \le \|x\| \le 1$ | $\|x\| > 1 \rightarrow \text{Math ERROR}$ |
| $\tan^{-1} x$ | $0 \le \|x\| \le 9.999999999 \times 10^{99}$ | |
| $\sinh x, \cosh x$ | $0 \le \|x\| \le 230.2585092$ | Exceeding bound $\rightarrow \text{Math ERROR}$ |
| $\sinh^{-1} x$ | $0 \le \|x\| \le 4.999999999 \times 10^{99}$ | |
| $\cosh^{-1} x$ | $1 \le x \le 4.999999999 \times 10^{99}$ | $x < 1 \rightarrow \text{Math ERROR}$ |
| $\tanh x$ | $0 \le \|x\| \le 9.999999999 \times 10^{99}$ | |
| $\tanh^{-1} x$ | $0 \le \|x\| \le 9.999999999 \times 10^{-1}$ | $\|x\| \ge 1 \rightarrow \text{Math ERROR}$ |
| $\log x, \ln x$ | $0 < x \le 9.999999999 \times 10^{99}$ | $x \le 0 \rightarrow \text{Math ERROR}$ |
| $10^x$ | $-9.999999999 \times 10^{99} \le x \le 99.99999999$ | $x \ge 100 \rightarrow \text{Math ERROR}$ |
| $e^x$ | $-9.999999999 \times 10^{99} \le x \le 230.2585092$ | Exceeding bound $\rightarrow \text{Math ERROR}$ |
| $\sqrt{x}$ | $0 \le x < 1 \times 10^{100}$ | $x < 0 \rightarrow \text{Math ERROR}$ |
| $x^2$ | $\|x\| < 1 \times 10^{50}$ | |
| $x^{-1}$ | $\|x\| < 1 \times 10^{100}, \quad x \ne 0$ | $x = 0 \rightarrow \text{Math ERROR}$ |
| $\sqrt[3]{x}$ | $\|x\| < 1 \times 10^{100}$ | Supports negative reals (e.g. $\sqrt[3]{-8} = -2$) |
| $x!$ | $0 \le x \le 69$ ($x$ is an integer) | Non-integer, $x < 0$, or $x \ge 70 \rightarrow \text{Math ERROR}$ |
| $n\text{Pr}, n\text{Cr}$ | $0 \le n < 1 \times 10^{10}$, $0 \le r \le n$ (integers)<br>$n!/(n-r)! < 1 \times 10^{100}$, $n!/(r!(n-r)!) < 1 \times 10^{100}$ | $r > n$ or fractional $\rightarrow \text{Math ERROR}$ |
| $\text{Pol}(x, y)$ | $\|x\|, \|y\| \le 9.999999999 \times 10^{99}$, $\sqrt{x^2+y^2} < 1 \times 10^{100}$ | |
| $\text{Rec}(r, \theta)$ | $0 \le r \le 9.999999999 \times 10^{99}$, $\theta$: same as $\sin x$ | $r < 0 \rightarrow \text{Math ERROR}$ |
| $°'""$ | $\|a\|, b, c < 1 \times 10^{100}$; $0 \le b, c$; display $|x| \le 9999999^\circ 59' 59''$ | |
| $x^y$ | $x > 0$: $-1 \times 10^{100} < y\log x < 100$<br>$x = 0$: $y > 0$<br>$x < 0$: $y = n$ or $m/(2n+1)$ ($m, n$ integers) | $0^0 \rightarrow \text{Math ERROR}$ |
| $\sqrt[x]{y}$ | Same as $y^{1/x}$ | |
| $\text{RanInt\#}(a, b)$ | $a < b$; $\|a\|, \|b\| < 1 \times 10^{10}$; $b - a < 1 \times 10^{10}$ | $a \ge b \rightarrow \text{Math ERROR}$ |
| $\text{Ran\#}$ | Generates 3 decimal places in range $[0.000, 0.999]$ | Shown as fraction in MathO |

---

## 5. Calculus Limits

- $\int$: Adaptive Gauss–Kronrod quadrature. COMP mode only. Default tolerance in LineIO is $1 \times 10^{-5}$; user tol bound $\ge 1 \times 10^{-14}$. If non-converging within maximum iterations $\rightarrow \text{Time Out}$.
- $\frac{d}{dx}$: Central difference with auto-adjusting step. Optional tol default $1 \times 10^{-10}$.
- $\Sigma$: Integer index range $-1 \times 10^{10} < a \le b < 1 \times 10^{10}$. Non-integers or $a > b \rightarrow \text{Math ERROR}$.
- Prohibited nesting: $\text{Pol}$, $\text{Rec}$, $\int$, $\frac{d}{dx}$, $\Sigma$ cannot be used inside $f(x)$, $a$, $b$, or $tol$.

---

## 6. Mode Capacity Limits

- **STAT**: Maximum rows: 80 (X only), 40 (X + FREQ or X + Y), 26 (X + Y + FREQ).
- **TABLE**: Maximum 30 generated $X$-values ($Start + k \times Step \le End$). Exceeding 30 $\rightarrow \text{Insufficient MEM}$.
- **MATRIX**: Up to 3 matrices (MatA, MatB, MatC) plus MatAns, each up to $3 \times 3$.
- **VECTOR**: Up to 3 vectors (VctA, VctB, VctC) plus VctAns, dimension 2 or 3.
- **BASE-N ranges**:
  - `BIN`: 16-bit two's complement: positive $0000000000000000 \dots 0111111111111111$ ($0 \dots 32767$), negative $1000000000000000 \dots 1111111111111111$ ($-32768 \dots -1$).
  - `OCT`: 32-bit: positive $0 \dots 17777777777$, negative $20000000000 \dots 37777777777$.
  - `DEC`: 32-bit signed: $-2147483648 \dots 2147483647$.
  - `HEX`: 32-bit: positive $00000000 \dots 7FFFFFFF$, negative $80000000 \dots FFFFFFFF$.
