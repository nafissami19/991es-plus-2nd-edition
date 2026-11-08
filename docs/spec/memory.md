# Memory & State Specification — Casio fx-991ES PLUS 2nd edition

## 1. Variable Registers

The calculator provides 10 standard numeric variables:
`A`, `B`, `C`, `D`, `E`, `F`, `M`, `X`, `Y`, and `Ans`.
*(Note: There is no `PreAns` and no lowercase `x` or `y` on this model.)*

### Behavior and Access:
- **Assignment (`STO`)**: `SHIFT RCL` (`STO`) followed by a variable key stores the value of the currently displayed result into the specified variable.
- **Recall (`RCL`)**: `RCL` followed by a variable key displays the current value stored in that variable.
- **Expression input**: `ALPHA` followed by a variable key inserts the variable into the formula being edited.
- **Independent Memory (`M`)**:
  - `M+` evaluates the current expression (or uses the result) and adds it to $M$.
  - `SHIFT M+` (`M−`) subtracts the value from $M$.
  - The status indicator `M` appears on the LCD whenever $M \ne 0$.
  - Both `M+` and `M−` update `Ans`.

---

## 2. Answer Memory (Ans)

- **Updated by**: `=`, `SHIFT =`, `M+`, `SHIFT M−`, and `STO`.
- **Not updated by**: Errors (`Math ERROR`, `Syntax ERROR`, etc.), `AC` key, menu selections.
- **Survives**: `AC` presses, mode changes, and power off/on.

---

## 3. Mode Memories

- **Matrix mode**: MatA, MatB, MatC, and MatAns (dimensions up to $3 \times 3$).
- **Vector mode**: VctA, VctB, VctC, and VctAns (dimensions 2 or 3).
- **Table mode**: Stored function $f(X)$.
- **Statistics mode**: Data tables (X, Y, FREQ).

---

## 4. Calculation History Buffer

- Preserves approximately 200 bytes of input calculations and results.
- **Supported Modes**: COMP, CMPLX, and BASE-N only. (STAT, EQN, MATRIX, TABLE, VECTOR do not maintain calculation history).
- **Navigation**:
  - `▲`: Steps backward to older calculations.
  - `▼`: Steps forward to newer calculations.
  - `▲` and `▼` LCD indicators indicate whether there is calculation history above or below the current screen.
- **Cleared By**:
  - Pressing `ON` (runs self-check).
  - Mode change (`MODE 1..8`).
  - Display format change (`MthIO` ⇄ `LineIO` in SETUP).
  - Reset Setup (`SHIFT 9 1 =`) or Reset All (`SHIFT 9 3 =`).
  - Power off (`SHIFT AC` then `ON`).
  - *Note*: Pressing `AC` alone **does not clear** calculation history.

---

## 5. Reset Menu (CLR: SHIFT 9)

Pressing `SHIFT 9` (`CLR`) displays:
```
Clear?
1:Setup
2:Memory
3:All
```
Selecting an option displays the confirmation prompt:
`Reset: [=] Yes  [AC] Cancel`

- **1: Setup**:
  Resets calculation mode to COMP, returns SETUP to initial defaults, clears history. Keeps variable memory ($A-F, M, X, Y, Ans$).
- **2: Memory**:
  Clears all variables ($A-F, M, X, Y$), clears $Ans$, resets $M$ indicator, clears matrix, vector, and stat data. Keeps SETUP.
- **3: All**:
  Full factory reset. Resets setup, modes, clears all variables, memories, matrices, vectors, history, and table data.
