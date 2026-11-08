# SETUP Specification — Casio fx-991ES PLUS 2nd edition

Accessed via `SHIFT MODE` (`SETUP`). Contains exactly two pages navigated with `▲` and `▼`. Selecting an option immediately applies the setting and returns to the active calculation screen. Pressing `AC` exits the setup menu without changing settings.

## 1. Menu Layout

### Page 1
```
1:MthIO      2:LineIO
3:Deg        4:Rad
5:Gra        6:Fix
7:Sci        8:Norm
```

### Page 2 (press ▼ from Page 1)
```
1:ab/c       2:d/c
3:CMPLX      4:STAT
5:Disp       6:◀CONT▶
```

---

## 2. Setting Descriptions & Sub-Menus

| Menu Item | Key Sequence | Options / Sub-Menu | Initial Default | Description & Side Effects |
|---|---|---|---|---|
| **1:MthIO** | `SHIFT MODE 1` | `1:MathO`<br>`2:LineO` | **MathO** | `MathO`: Natural input and exact output (fractions, roots, $\pi$).<br>`LineO`: Natural input, linear/decimal output.<br>*Side effect*: Changing display format clears calculation history and TABLE function. |
| **2:LineIO** | `SHIFT MODE 2` | — | — | Full linear input and output (fractions as `7⌋6`).<br>*Side effect*: Clears calculation history and TABLE function. |
| **3:Deg** | `SHIFT MODE 3` | — | **Deg** (Active) | Sets angle unit to Degrees (status indicator `D`). |
| **4:Rad** | `SHIFT MODE 4` | — | — | Sets angle unit to Radians (status indicator `R`). |
| **5:Gra** | `SHIFT MODE 5` | — | — | Sets angle unit to Grads (status indicator `G`). |
| **6:Fix** | `SHIFT MODE 6` | `Fix 0~9?` (keys 0–9) | Off | Fixed decimal places (0 to 9). Displays `FIX` indicator. Rounds display value. |
| **7:Sci** | `SHIFT MODE 7` | `Sci 0~9?` (keys 0–9) | Off | Significant digits (1 to 10; key 0 specifies 10). Displays `SCI` indicator. |
| **8:Norm** | `SHIFT MODE 8` | `Norm 1~2?` (keys 1–2) | **Norm 1** | Exponential format range:<br>`Norm 1`: $|x| < 10^{-2}$ or $|x| \ge 10^{10}$<br>`Norm 2`: $|x| < 10^{-9}$ or $|x| \ge 10^{10}$ |
| **1:ab/c** | `SHIFT MODE ▼ 1` | — | — | Mixed fraction display (`a b/c`). Fallback to improper if $>10$ digits total. |
| **2:d/c** | `SHIFT MODE ▼ 2` | — | **d/c** (Active) | Improper fraction display (`d/c`). |
| **3:CMPLX** | `SHIFT MODE ▼ 3` | `1:a+bi`<br>`2:r∠θ` | **a+bi** | Complex result coordinate format. Overridden on individual calculations by `▸r∠θ` or `▸a+bi`. |
| **4:STAT** | `SHIFT MODE ▼ 4` | `1:ON`<br>`2:OFF` | **OFF** | `ON`: Adds FREQ (frequency) column to Stat Editor.<br>`OFF`: Hides FREQ column.<br>*Side effect*: Changing this setting deletes all current statistical data. |
| **5:Disp** | `SHIFT MODE ▼ 5` | `1:Dot`<br>`2:Comma` | **Dot** | Decimal point character for displayed results. Input always uses dot `.`. Multi-result separator is `,` with Dot, `;` with Comma. |
| **6:◀CONT▶** | `SHIFT MODE ▼ 6` | Contrast adjustment screen | Contrast level 8 | Adjusts LCD dark pixel shade using `◀` (lighter) and `▶` (darker). `AC` exits. Preserved across power off/on. |

---

## 3. Clearing & Side-Effect Matrix

| Trigger / Action | Calculation History | Variables (A–F, M, X, Y, Ans) | Stat Data | Mode Memories (MatA–C, VctA–C) | TABLE Function |
|---|---|---|---|---|---|
| Change Input/Output (`MthIO` ⇄ `LineIO`) | **Cleared** | Retained | Retained | Retained | **Cleared** |
| Change STAT Format (`FREQ ON` ⇄ `OFF`) | Retained | Retained | **Cleared** | Retained | Retained |
| Mode Change (`MODE <n>`) | **Cleared** | Retained | **Cleared** (if leaving STAT) | Retained | Retained |
| `ON` Key Press | **Cleared** | Retained | Retained | Retained | Retained |
| Power Off / On (`SHIFT AC` then `ON`) | **Cleared** | Retained | Retained | Retained | Retained |
| `SHIFT 9 1 =` (CLR Setup) | **Cleared** | Retained | **Cleared** | Retained | **Cleared** |
| `SHIFT 9 2 =` (CLR Memory) | Retained | **Cleared** | Retained | **Cleared** | Retained |
| `SHIFT 9 3 =` (CLR All) | **Cleared** | **Cleared** | **Cleared** | **Cleared** | **Cleared** |
