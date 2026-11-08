# Calculator ID & Authenticity Screen (MODE 0)

In the Casio fx-991ES PLUS 2nd edition, pressing `MODE` then `0` opens the **Calculator Authenticity Verification Screen**.

## 1. Official Behavior

1. **Trigger**:
   From normal calculation mode:
   - Press `MODE` (displays the 8-mode selection menu).
   - Press `0`.
2. **Display Elements**:
   - A 24-character alphanumeric Calculator ID string.
   - A QR Code for scanning to access the authentication service.
3. **Exit**:
   - Pressing `AC` returns to the `MODE` selection menu.
   - Pressing `ON` returns to normal calculation mode.

---

## 2. Re-creation Implementation Rules

To adhere strictly to project safety, cleanroom, and authenticity guidelines:

1. **Synthetic Demo ID**:
   - The 24-character ID displayed **must never** be a genuine Casio serial number or copy of a hardware ID.
   - It will use a fixed, clearly marked demonstration string, e.g.:
     `DEMO-991ES-PLUS2-000001` (exactly 24 characters).
2. **QR Code Payload**:
   - The QR code **must never** encode a Casio validation URL (`https://wes.casio.com/...`) to prevent confusion with genuine hardware verification.
   - The QR payload will be a plain text indicator:
     `Casio fx-991ES PLUS 2nd edition Web Re-creation (Educational Demo - Not an authentic Casio device)`.
3. **QR Rendering**:
   - Rendered using our clean JS QR encoder (`js/core/qr/qrcode.js`).
   - Sized and positioned accurately within the 96×31 dot matrix display.
4. **Key handling**:
   - `AC` exits back to the MODE menu view.
