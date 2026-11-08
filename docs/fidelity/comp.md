# COMP Mode (Mode 1) — Fidelity Sweep Checklist

This document specifies the complete fidelity checklist for **COMP Mode (Mode 1)** on the Casio fx-991ES PLUS 2nd edition, verifying every screen state, key behavior, and result formatting against the official user manual and emulator.

---

## 1. Mode Overview & Specifications

- **Mode Index**: `MODE 1` (COMP)
- **Display Framebuffer**: 96 × 31 dot matrix monochrome LCD with 18 fixed status indicators
- **Input/Output Formats**:
  - `MthIO / MathO`: Natural textbook 2D entry, exact 2D textbook result (fractions, surds, π forms).
  - `MthIO / LineO`: Natural textbook 2D entry, rounded 10-digit decimal result.
  - `LineIO`: Single/double line linear entry (`┘` for fractions, `√(` for roots, `^` for powers).
- **Active Indicators**: `S`, `A`, `M`, `STO`, `RCL`, `D`/`R`/`G`, `FIX`, `SCI`, `Math`, `▲`, `▼`, `Disp`.
- **Memory Capacity**: 99 bytes formula buffer; solid block cursor (■) appears when $\le 10$ bytes remain.

---

## 2. Interactive Screen States & Keys

### Screen 1: Primary Natural Expression Entry (Empty Screen)
- **Visuals**: Line cursor blinking at $(1, 1)$, status icons `D` and `Math` active.
- **Allowed Keys**:
  - Digits `0`–`9`, decimal point `.`.
  - Constants: `EXP10` ($\times 10^x$), `SHIFT 7 [01-40]` ($CONST$).
  - Templates: `FRAC` ($\frac{\blacksquare}{\blacksquare}$), `SQRT` ($\sqrt{\blacksquare}$), `SQUARE` ($x^2$), `POWER` ($x^{\blacksquare}$), `LOG` ($\log$), `LN` ($\ln$), `INTEGRAL` ($\int$), `d/dx` (`SHIFT INTEGRAL`), `Σ` (`SHIFT LOG`), `LOGBASE` ($\log_{\blacksquare}\blacksquare$).
  - Functions: `SIN`, `COS`, `TAN`, `HYP` (1–6), `SHIFT SIN` ($\sin^{-1}$), etc.
  - Coordinate: `Pol(` (`SHIFT +`), `Rec(` (`SHIFT -`).
  - Variables: `Ans`, `ALPHA [A-F, X, Y, M]`.
  - Independent memory: `RCL M`, `M+` (treated as $0 + \text{expr}$).
- **Ignored / Inactive Keys**:
  - `▲` / `▼` (no history yet).
  - `LEFT` / `RIGHT` (cursor already at origin).
  - `=` (evaluates empty line to empty screen).

### Screen 2: Expression Editing & Template Navigation
- **Navigation**:
  - `LEFT` / `RIGHT` traverses tokens and slotted template arguments.
  - Fraction: `DOWN` jumps from numerator to denominator; `RIGHT` exits fraction.
  - Exponent: `RIGHT` exits exponent back to base line.
  - Nested expressions: Vertical stacking supported up to 62 dots (2 virtual screens) with auto vertical scroll.
- **Editing**:
  - `DEL`: Deletes token behind cursor; deletes empty template box.
  - `SHIFT DEL` (INS): In Natural Display, wraps the following expression in parentheses/box; in Linear Display, toggles insert/overwrite mode (`_` cursor).
  - `AC`: Clears entire input line, restores empty Screen 1.

### Screen 3: Calculation Result Screen (MathO)
- **Visuals**:
  - Expression at line 0; result right-aligned at bottom line.
  - Exact fraction ($\frac{a}{b}$), exact surd ($a\sqrt{b} + c\sqrt{d}$), rational $\pi$ multiple ($\frac{a}{b}\pi$).
  - If surd integer coefficient $\ge 1000$ or radicand $\ge 100$, automatically falls back to 10-digit decimal.
- **Result Transformation Keys**:
  - `SD`: Toggles exact $\leftrightarrow$ decimal form.
  - `SHIFT SD` ($a\frac{b}{c}\Leftrightarrow \frac{d}{c}$): Toggles improper fraction $\leftrightarrow$ mixed fraction.
  - `°'"` ($D^\circ M' S''$): Converts decimal value to degrees, minutes, seconds.
  - `ENG` / `SHIFT ENG`: Decrements / increments exponent by 3 ($\times 10^3, \times 10^6, \dots$).
  - `Rnd` (`SHIFT 0`): Rounds internal 15-digit precision to current display digits.

### Screen 4: Calculation Result Screen (LineIO)
- **Visuals**: Linear display without `Math` indicator.
- **Fractions**: Displayed with integer and fraction separator `┘` (e.g. `1┘2` or `1┘2┘3`).
- **Surds**: Displayed as decimals directly unless converted.

### Screen 5: Operator Continuation & History Navigation
- **Auto-Ans**: Pressing `+`, `-`, `*`, `/`, `^`, `x²`, `x⁻¹` appends `Ans` automatically.
- **Fresh Input**: Pressing digit `0`–`9`, `.`, or prefix function clears screen and starts new calculation.
- **Replay**: `LEFT` places cursor at end of formula; `RIGHT` places cursor at start (home).
- **History**: `▲` steps to previous calculations (up to 30); `▼` steps forward.

### Screen 6: Multi-Statement Execution (`:`)
- **Key Sequence**: `ALPHA :` (`ALPHA 3`) separates statements (`3 + 3 : 3 * 3`).
- **Execution**: Evaluates statement 1, shows `Disp` indicator in status bar. Pressing `=` evaluates statement 2. Ans updates at each statement.

### Screen 7: CALC Variable Evaluation (`CALC`)
- **Key Sequence**: Enter formula with variables $A–F, X, Y$, press `CALC`.
- **Prompts**: `A? <val>`, press `=` to confirm value, prompts next variable.
- **Assignment**: Equations like `Y = 2X + 1` update target variable upon evaluation.

### Screen 8: SOLVE Equation Solving (`SHIFT CALC`)
- **Key Sequence**: Enter equation `f(X) = 0` via `ALPHA =`, press `SHIFT CALC`.
- **Execution**: Prompts initial guess `X? 0`, press `=` to run Newton's method.
- **Result**: Displays `X = <root>` and residual error `L - R = 0`.
- **Failure**: Non-convergence shows `Can't Solve`. Disallowed functions ($\int$, $\frac{d}{dx}$, $\Sigma$, `Pol`, `Rec`) throw `Syntax ERROR`.

### Screen 9: Error Screens
- **Display**: Error title on line 0 (`Math ERROR`, `Syntax ERROR`, `Stack ERROR`, etc.), followed by `[AC] :Cancel` and `[◀][▶]:Goto` (if goto enabled).
- **Navigation**: `AC` cancels; `LEFT` or `RIGHT` returns to formula with cursor at error position. Ans is preserved across errors.
