# SETUP & CLR — Fidelity Sweep Checklist

This document details the fidelity checklist for **SETUP (SHIFT MODE)** and **CLR / Reset (SHIFT 9)** on the Casio fx-991ES PLUS 2nd edition.

---

## 1. SETUP Menu (`SHIFT MODE`)

The authentic fx-991ES PLUS 2nd edition SETUP menu is a 2-page numbered menu rendered in small font with 2 columns on the 96×31 screen:

### Page 1 (Indicator `▼`)
```
1:MthIO   2:LineIO
3:Deg     4:Rad
5:Gra     6:Fix
7:Sci     8:Norm
```

- **1:MthIO Submenu**:
  - `1:MathO` (Textbook Natural output: fractions, surds, π)
  - `2:LineO` (Linear decimal output with Math input)
- **2:LineIO**: Linear input and output (fractions formatted as `┘`). Side-effect: Clears calculation history and $f(X)$ table formula.
- **3:Deg**: Sets angle unit to Degrees (`D` indicator).
- **4:Rad**: Sets angle unit to Radians (`R` indicator).
- **5:Gra**: Sets angle unit to Gradians (`G` indicator).
- **6:Fix**: Prompts `Fix 0~9?`. Formats result with fixed number of decimal digits (`FIX` indicator).
- **7:Sci**: Prompts `Sci 0~9?`. Formats result in scientific notation with specified significant digits (`SCI` indicator).
- **8:Norm**: Prompts `Norm 1~2?`.
  - `Norm 1`: Exponential display for $|x| < 10^{-2}$ or $|x| \ge 10^{10}$.
  - `Norm 2`: Exponential display for $|x| < 10^{-9}$ or $|x| \ge 10^{10}$.
- **Navigation**: `▼` advances to Page 2; `AC` closes setup without changes.

### Page 2 (Indicator `▲`)
```
1:ab/c    2:d/c
3:CMPLX   4:STAT
5:Disp    6:◀CONT▶
```

- **1:ab/c**: Sets default fraction display to mixed fraction $a\frac{b}{c}$.
- **2:d/c**: Sets default fraction display to improper fraction $\frac{d}{c}$.
- **3:CMPLX Submenu**:
  - `1:a+bi` (Rectangular coordinates)
  - `2:r∠θ` (Polar coordinates)
- **4:STAT Submenu**:
  - `1:ON` (Enables FREQ frequency column in Stat Editor)
  - `2:OFF` (Disables FREQ column)
  - *Side-effect*: Changing STAT frequency clears current statistical sample data.
- **5:Disp Submenu**:
  - `1:Dot` (Uses dot `.` for decimal point)
  - `2:Comma` (Uses comma `,` for decimal point)
- **6:◀CONT▶ (Contrast Screen)**:
  - Displays `CONTRAST`, `LIGHT ◀  ▶ DARK`, and a 0..15 bar slider.
  - `LEFT` decrements contrast; `RIGHT` increments contrast. Setting is persistent across power off and Reset.

---

## 2. RESET Menu (`SHIFT 9` `CLR`)

The authentic reset menu features:
```
Clear?
1:Setup   2:Memory
3:All
```

### Option 1: Setup Data
- **Sequence**: `SHIFT 9 1`
- **Confirmation Prompt**: `Reset: Setup? [=] :Yes  [AC]:Cancel`
- **Action**: Pressing `=` resets setup to defaults (MthIO-MathO, Deg, Norm 1, d/c, CMPLX a+bi, STAT OFF, Disp Dot) and shows `Press [AC] Key`. Contrast is preserved.

### Option 2: Memory
- **Sequence**: `SHIFT 9 2`
- **Confirmation Prompt**: `Reset: Memory? [=] :Yes  [AC]:Cancel`
- **Action**: Pressing `=` clears all variables ($A-F, M, X, Y$), $Ans$, calculation history, matrices, and vectors to 0. Shows `Press [AC] Key`. Contrast and setup are preserved.

### Option 3: Initialize All
- **Sequence**: `SHIFT 9 3`
- **Confirmation Prompt**: `Reset: All? [=] :Yes  [AC]:Cancel`
- **Action**: Pressing `=` resets setup to factory defaults, clears all memories, matrices, vectors, history, and switches to COMP mode. Shows `Reset All` splash followed by `Press [AC] Key`. Contrast is preserved.
