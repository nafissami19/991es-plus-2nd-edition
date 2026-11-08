# Calculation Priority Sequence — Casio fx-991ES PLUS 2nd edition

The calculation engine evaluates expressions strictly according to the official 13-level priority hierarchy. When two operations have identical priority, they are evaluated strictly from left to right.

## 1. The 13 Priority Levels

| Level | Category | Operations / Tokens |
|---|---|---|
| **1** | Parenthetical expressions | `( ... )`, template content blocks |
| **2** | Functions with mandatory argument & `)` | `sin(`, `cos(`, `tan(`, `sin⁻¹(`, `cos⁻¹(`, `tan⁻¹(`, `sinh(`, `cosh(`, `tanh(`, `sinh⁻¹(`, `cosh⁻¹(`, `tanh⁻¹(`, `log(`, `ln(`, `10^(`, `e^(`, `√(`, `∛(`, `Abs(`, `Rnd(`, `RanInt#(`, `Pol(`, `Rec(`, `∫(`, `d/dx(`, `Σ(`, `arg(`, `Conjg(`, `Not(`, `Neg(` |
| **3** | Postfix operations, powers, roots | $x^2$, $x^3$, $x^{-1}$, $x!$, $°'""$, $°$, $r$, $g$, $\%$, $\blacktriangleright t$, $x^{\blacksquare}$, $\sqrt[\blacksquare]{\square}$ |
| **4** | Fractions | Fractions $\frac{a}{b}$ |
| **5** | Negative prefix & base-n prefixes | Unary minus $(-)x$, base prefixes $d$, $h$, $b$, $o$ |
| **6** | Metric conversions & STAT estimators | Metric conversion commands (e.g. $\text{cm}\blacktriangleright\text{in}$), $\hat{x}$, $\hat{y}$, $\hat{x}_1$, $\hat{x}_2$ |
| **7** | **Omitted multiplication** | Multiplication where the $\times$ sign is omitted: $2\pi$, $2A$, $2(3+4)$, $2\sin(30)$, $(1+2)(3+4)$, $2X$ |
| **8** | Combinatorics & Polar coordinate | $n\text{Pr}$, $n\text{Cr}$, angle symbol $\angle$ |
| **9** | Dot product | Dot product ($\cdot$) |
| **10** | Explicit multiplication & division | $\times$, $\div$ |
| **11** | Addition & subtraction | $+$, $-$ |
| **12** | Logical AND | `and` |
| **13** | Logical OR, XOR, XNOR | `or`, `xor`, `xnor` |

---

## 2. Omitted Multiplication Rules

Multiplication sign ($\times$) may be omitted in the following specific contexts:
1. Immediately before an opening parenthesis: `2(3+4)` $\rightarrow 2 \times (3+4)$
2. Immediately before a parenthesized function: `2sin(30)` $\rightarrow 2 \times \sin(30)$
3. Immediately before the random number function: `2Ran#`
4. Immediately before a variable: `2A`, `2B`, `2C`, `2D`, `2E`, `2F`, `2M`, `2X`, `2Y`
5. Immediately before scientific constants: `2C0`, `2h`
6. Immediately before constants $\pi$ and $e$: `2π`, `3e`

**Priority implication**:
Because omitted multiplication is at **Level 7**, while explicit multiplication and division are at **Level 10**:
- `1 ÷ 2π` is evaluated as `1 ÷ (2 × π)` = $\frac{1}{2\pi} \approx 0.1591549431$.
- `1 ÷ 2 × π` is evaluated left-to-right as `(1 ÷ 2) × π` = $\frac{\pi}{2} \approx 1.570796327$.
- `6 ÷ 2(1+2)`: Level 7 binds `2(1+2)` as `(2 × 3) = 6`, giving `6 ÷ 6 = 1`. (VERIFY ON EMULATOR).

---

## 3. Negative Sign vs. Power Priority

Unary minus `(-)` is at **Level 5**, whereas $x^2$ is at **Level 3**.
- `(-) 2 x² =` evaluates as `-(2²) = -4`.
- To square a negative number, parentheses are required: `( (-) 2 ) x² = 4`.

---

## 4. Closing Bracket Rules

- All closing parentheses immediately before the final `=` or `:` can be omitted:
  `sin( 30 =` automatically closes `)` and evaluates $\sin(30)$.
- In functions that require an argument, failing to close `)` before an operator includes the rest of the expression in the argument:
  `sin 30 + 15 =` in LineIO evaluates $\sin(30 + 15) = \sin(45) \approx 0.7071067812$,
  whereas `sin 30 ) + 15 =` evaluates $(\sin 30) + 15 = 15.5$.
