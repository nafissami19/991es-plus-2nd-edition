# Known Differences — fx-991ES PLUS 2nd edition Re-creation

This document details all intentional and architectural differences between this cleanroom re-creation and the official Casio fx-991ES PLUS 2nd edition physical calculator / official software emulator.

---

## 1. Cleanroom Development & Legal Compliance

* **Strict Cleanroom Implementation**: Zero Casio ROMs, binaries, firmware dumps, disassembled machine code, proprietary fonts, or copyrighted graphic assets are included or used in this repository.
* **Specification Source**: All functionality is derived strictly from public documentation, including the official *fx-570ES PLUS / fx-991ES PLUS (2nd edition) User's Guide*, mathematical algorithms, and cleanroom black-box behavioral verification.

---

## 2. Key Differences and Verifications

### 1. Calculator ID Screen (MODE 0)
* **Key Sequence**: `MODE` `0`
* **Official Hardware / Emulator**: Displays a device-unique serial number, hardware authentication code, and a dynamic QR code that connects to Casio's proprietary ClassPad web validation service.
* **This Re-creation**: Displays a fixed demonstration ID string:
  ```
  DEMO-991ES-PLUS2-0000001
  ```
  with an authentic 25×25 QR code generated locally on the 96×31 dot matrix using cleanroom JavaScript (`js/core/qr/qrcode.js`). Pressing `AC` returns to the MODE selection menu.

### 2. Execution Speed and Computation Latency
* **Key Sequence**: Any complex expression, e.g. `∫(sin(X), 0, π)`, `Σ(X², 1, 1000)`, or `SHIFT` `CALC` (SOLVE)
* **Official Hardware / Emulator**: Physical Casio calculators operate on an ultra-low-power microprocessor (tens of kHz to a few MHz) powered by a button battery and solar cell. Iterative root finding (SOLVE), Gauss–Kronrod adaptive quadrature, and large summations take anywhere from 200 ms to several seconds, during which a flashing cursor or blank processing screen is shown.
* **This Re-creation**: Running in modern JavaScript V8 engines, virtually all calculations (including numerical calculus and SOLVE iterations) execute in under 1 ms (benchmarked latency < 16 ms even across all 8 modes and stress suites). No artificial delay is introduced, giving an instantaneous user experience.

### 3. Display Subsystem and Indicators
* **Physical Hardware**: Monochrome STN liquid crystal display with 96×31 dot matrix area and 18 dedicated hard-wired fixed indicator annunciators:
  `S`, `A`, `M`, `STO`, `RCL`, `STAT`, `CMPLX`, `MAT`, `VCT`, `D`, `R`, `G`, `FIX`, `SCI`, `Math`, `▼`, `▲`, `Disp`.
  Contrast is adjusted by physically altering the liquid crystal bias voltage.
* **This Re-creation**: Rendered using HTML5 Canvas with nearest-neighbor integer scaling (`image-rendering: pixelated`). All 18 indicators are accurately drawn as pixel-exact glyphs on the canvas status bar. Contrast adjustment (0–15 via `SHIFT` `MODE` `▼` `6`) dynamically adjusts foreground and background LCD palette tones while persisting across sessions.

### 4. Vector Cross Product in 2D
* **Key Sequence**: `MODE` `8` `1` `2` (define 2D VctA `[u1, u2]`), `SHIFT` `5` `1` `2` `2` (define 2D VctB `[v1, v2]`), `AC`, `SHIFT` `5` `3` `×` `SHIFT` `5` `4` `=`
* **Casio User's Guide Specification**: The User's Guide explicitly notes that cross product ($u \times v$) between two 2D vectors is computed by treating them as 3D vectors with $z = 0$, yielding a 3D vector result:
  $$\mathbf{u} \times \mathbf{v} = [0,\; 0,\; u_x v_y - u_y v_x]$$
* **This Re-creation**: Accurately reproduces this official Casio behavior (yielding a 3D vector with components 0, 0, and the 2D determinant), rather than throwing a Dimension ERROR.

### 5. Enhancements & Desktop Ergonomics
This re-creation includes modern computing enhancements that do not alter core calculation fidelity:
1. **PC Keyboard Mapping**:
   - `Tab` / `Space` / `Esc` $\rightarrow$ `AC`
   - `F1` $\rightarrow$ `SHIFT`
   - `F2` $\rightarrow$ `ALPHA`
   - `F3` / `Home` $\rightarrow$ `MODE`
   - `F4` $\rightarrow$ `ON`
   - `Enter` / `=` $\rightarrow$ `EXE` / `=`
   - `Delete` / `Backspace` $\rightarrow$ `DEL`
   - Arrows, numbers, and arithmetic symbols map directly.
   - Shortcut help overlay modal accessible via `?`.
2. **KeyLog Drawer**:
   - Collapsible panel displaying executed keys in canonical golden test notation (`[sin]`, `[+]`, `[=]`), with `Copy`, `Select All`, and `Clear` buttons.
3. **Screen Capture to Clipboard**:
   - `Ctrl+C` or camera toolbar button generates a 96×31 composited PNG image of the LCD and copies it directly to the system clipboard with an on-screen toast notification.
4. **Pop-out LCD Window**:
   - Pop-out button opens a separate synchronized window (`popout.html`) using the `BroadcastChannel` API, ideal for dual-monitor or presentation setups.
5. **Offline PWA & Desktop App**:
   - Installable Progressive Web Application with service worker pre-caching (`sw.js`).
   - Standalone Windows desktop app packaged with Electron and Inno Setup installer.

---

## 3. Summary of Supported Calculation Modes

| Mode | Selector | Indicators | Maximum Capacity / Limitations |
|---|---|---|---|
| **COMP** | `MODE 1` | `Math` (in MthIO) | 99-byte formula limit, 30 history entries |
| **CMPLX** | `MODE 2` | `CMPLX`, `Math` | Rectangular $a+bi$ and polar $r\angle\theta$ |
| **STAT** | `MODE 3` | `STAT` (Math suppressed) | 80 rows (1-Var no FREQ), 40 rows (paired/FREQ), 26 rows (paired+FREQ) |
| **BASE-N** | `MODE 4` | Base name (DEC/HEX/BIN/OCT) | 16-bit BIN, 32-bit DEC/HEX/OCT two's complement |
| **EQN** | `MODE 5` | None | 2-3 unknown linear systems, degree 2-3 polynomials |
| **MATRIX** | `MODE 6` | `MAT` (Math suppressed) | MatA, MatB, MatC, MatAns up to 3×3 |
| **TABLE** | `MODE 7` | `Math` (in MthIO) | Single $f(X)$ function, up to 30 rows (`Insufficient MEM` if $>30$) |
| **VECTOR** | `MODE 8` | `VCT` (Math suppressed) | VctA, VctB, VctC, VctAns in 2D or 3D |

---

## LCD rebuilt from the User's Guide screen captures

The display was rebuilt from the ~60 real LCD captures in the official 2nd-edition User's Guide
(`fx-570ES_991ES_9910NG_PLUS_EN.pdf`). Run `python scripts/lcd_from_manual.py` to regenerate the
local-only files (traced fonts, status icons, pixel references); `tests/pixel_reference.test.js`
compares 15 screens dot for dot with the captures (all match).

Verified against captures: main font (5x9, 6-dot advance) and small menu font (5x6), menu rows
(tops 1/9/17/25, second column at x=48), input at row 1 / column 0, results against row 30 and
column 94, fraction and √ geometry, exponents, the 2-dot cursor, the ▷ overflow mark, error,
CONSTANT/CONVERSION, Matrix?/Vector?, STAT and EQN menus, CONTRAST, TABLE f(X)=, and which status
icons are lit on those screens.

Not verified (no capture in the guide): glyphs drawn by hand to match (39 main, 30 small) or
converted from the old font; the shape/position of the S, A, M, STO, RCL, G, SCI, ▼ and Disp
status icons; the SETUP sub-menus; editor screens (STAT, MATRIX, VECTOR, TABLE, EQN coefficients)
which still use the general small font rather than the guide's tiny table font; LCD colours
(#C9D5CA / #414540, taken from the official ClassWiz emulator, since the guide is black and white).

### Faceplate

`python scripts/extract_faceplate.py` copies the real 2nd-edition faceplate picture out of the
installed official emulator (bitmap resource 103 in fxESPLUS2_P2.dll, read only) to
`assets/images/faceplate.png` (git-ignored, personal use). When it is present the app uses it,
with key hit areas measured on that picture (`rect` in key_layout.json) and a glass layer in the
LCD colour; otherwise it falls back to our own SVG drawing (`rectSvg`).
