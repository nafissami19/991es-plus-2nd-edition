# Error Handling Specification — Casio fx-991ES PLUS 2nd edition

The fx-991ES PLUS 2nd edition defines an exact set of 9 distinct error messages.

## 1. The 9 Error Types & Causes

| Error Name | Display Text (Line 1) | Allowed Modes | Typical Causes | Recovery Navigation |
|---|---|---|---|---|
| **Math ERROR** | `Math ERROR` | All Modes | Result $\ge 1 \times 10^{100}$, division by zero, function domain violation (e.g. $\sqrt{-1}$, $70!$, $\tan 90^\circ$), complex roots with eqComplex Off | `[AC] :Cancel`<br>`[◀][▶]:Goto` |
| **Stack ERROR** | `Stack ERROR` | All Modes | Numeric or command stack exceeded by deeply nested parentheses or complex expressions; Matrix/Vector calculation stack exceeded | `[AC] :Cancel`<br>`[◀][▶]:Goto` |
| **Syntax ERROR** | `Syntax ERROR` | All Modes | Illegal formula structure, unmatched operator, consecutive operators (`++`), missing template arguments | `[AC] :Cancel`<br>`[◀][▶]:Goto` |
| **Argument ERROR** | `Argument ERROR` | COMP, CMPLX | Invalid function argument (e.g. integral or derivative tolerance $< 1 \times 10^{-14}$) | `[AC] :Cancel`<br>`[◀][▶]:Goto` |
| **Dimension ERROR** | `Dimension ERROR` | MATRIX, VECTOR | Matrix/vector variable used without specifying dimension; incompatible dimensions in addition, multiplication, or cross product | `[AC] :Cancel`<br>`[◀][▶]:Goto` |
| **Variable ERROR** | `Variable ERROR` | COMP (SOLVE only) | SOLVE executed on an equation containing no $X$ variable when no other target variable was specified | `[AC] :Cancel`<br>`[◀][▶]:Goto` |
| **Can't Solve** | `Can't Solve` | COMP (SOLVE only) | Newton's method fails to converge within iteration limit; equation has no real solution (e.g. $X^2 + 1 = 0$) | `[AC] :Cancel` |
| **Insufficient MEM** | `Insufficient MEM` | TABLE | Table generation parameters produce more than 30 row items ($Start + k \times Step \le End$) | `[AC] :Cancel` |
| **Time Out** | `Time Out` | COMP (∫, d/dx) | Numerical integration or differentiation iteration limit exceeded without fulfilling tolerance | `[AC] :Cancel` |

---

## 2. LCD Error Screen Layout (96 × 31)

### Standard Error Screen (with Goto)
```
┌────────────────────────────────┐
│Math ERROR                      │
│[AC] :Cancel                    │
│[◀][▶]:Goto                     │
└────────────────────────────────┘
```
Line 1: Exact error message left-aligned.
Line 2: `[AC] :Cancel`
Line 3: `[◀][▶]:Goto`

### Error Screen without Goto (`Can't Solve`, `Insufficient MEM`, `Time Out`)
```
┌────────────────────────────────┐
│Can't Solve                     │
│[AC] :Cancel                    │
│                                │
└────────────────────────────────┘
```

---

## 3. Error Exit & Cursor Recovery Behavior

1. **Pressing `AC`**:
   - Clears the error screen.
   - Clears the entire current calculation buffer, resetting to an empty input line with phase = `edit`.
   - `Ans` is **never updated** by an error.

2. **Pressing `◀` or `▶` (Goto)**:
   - Returns immediately to the active input expression.
   - Positions the blinking cursor directly at the character or template slot that caused the error (e.g. on `0` in `14 ÷ 0 × 2`).
   - If the error does not provide a Goto option (`Can't Solve`, `Insufficient MEM`), pressing `◀` or `▶` is ignored (only `AC` exits).
