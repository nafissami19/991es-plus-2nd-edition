import fs from 'node:fs';
import path from 'node:path';
import { encodePNG } from '../tests/pixel/png.js';

function drawIcon(size) {
  const buf = new Uint8ClampedArray(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    // Simple alpha blending
    if (a < 255) {
      const srcA = a / 255;
      const dstA = buf[idx + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA > 0) {
        buf[idx] = Math.round((r * srcA + buf[idx] * dstA * (1 - srcA)) / outA);
        buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * dstA * (1 - srcA)) / outA);
        buf[idx + 2] = Math.round((b * srcA + buf[idx + 2] * dstA * (1 - srcA)) / outA);
        buf[idx + 3] = Math.round(outA * 255);
      }
    } else {
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  function fillRect(x0, y0, w, h, r, g, b, a = 255) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function fillRoundRect(x0, y0, w, h, radius, r, g, b, a = 255) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        let inside = true;
        if (x < x0 + radius && y < y0 + radius) {
          const dx = x - (x0 + radius);
          const dy = y - (y0 + radius);
          inside = (dx * dx + dy * dy) <= radius * radius;
        } else if (x >= x0 + w - radius && y < y0 + radius) {
          const dx = x - (x0 + w - radius - 1);
          const dy = y - (y0 + radius);
          inside = (dx * dx + dy * dy) <= radius * radius;
        } else if (x < x0 + radius && y >= y0 + h - radius) {
          const dx = x - (x0 + radius);
          const dy = y - (y0 + h - radius - 1);
          inside = (dx * dx + dy * dy) <= radius * radius;
        } else if (x >= x0 + w - radius && y >= y0 + h - radius) {
          const dx = x - (x0 + w - radius - 1);
          const dy = y - (y0 + h - radius - 1);
          inside = (dx * dx + dy * dy) <= radius * radius;
        }
        if (inside) setPixel(x, y, r, g, b, a);
      }
    }
  }

  // Transparent outer background
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
  }

  const s = size / 512;

  // Outer calculator chassis (dark charcoal with rounded corners)
  const chassisW = Math.round(440 * s);
  const chassisH = Math.round(480 * s);
  const chassisX = Math.round((size - chassisW) / 2);
  const chassisY = Math.round((size - chassisH) / 2);
  const cornerR = Math.round(52 * s);

  // Subtle drop shadow / border
  fillRoundRect(chassisX - 2, chassisY - 2, chassisW + 4, chassisH + 4, cornerR + 2, 20, 22, 26, 255);
  // Chassis body gradient (simulated vertically)
  for (let y = chassisY; y < chassisY + chassisH; y++) {
    const t = (y - chassisY) / chassisH;
    const r = Math.round(58 - 25 * t);
    const g = Math.round(62 - 25 * t);
    const b = Math.round(68 - 25 * t);
    for (let x = chassisX; x < chassisX + chassisW; x++) {
      let inside = true;
      if (x < chassisX + cornerR && y < chassisY + cornerR) {
        const dx = x - (chassisX + cornerR);
        const dy = y - (chassisY + cornerR);
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      } else if (x >= chassisX + chassisW - cornerR && y < chassisY + cornerR) {
        const dx = x - (chassisX + chassisW - cornerR - 1);
        const dy = y - (chassisY + cornerR);
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      } else if (x < chassisX + cornerR && y >= chassisY + chassisH - cornerR) {
        const dx = x - (chassisX + cornerR);
        const dy = y - (chassisY + cornerR);
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      } else if (x >= chassisX + chassisW - cornerR && y >= chassisY + chassisH - cornerR) {
        const dx = x - (chassisX + chassisW - cornerR - 1);
        const dy = y - (chassisY + chassisH - cornerR - 1);
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      }
      if (inside) setPixel(x, y, r, g, b, 255);
    }
  }

  // Inner decorative border
  fillRoundRect(chassisX + Math.round(8 * s), chassisY + Math.round(8 * s), chassisW - Math.round(16 * s), chassisH - Math.round(16 * s), cornerR - Math.round(6 * s), 70, 75, 82, 60);

  // Brand / model text area: gold '991ES+' accent bar
  fillRect(chassisX + Math.round(36 * s), chassisY + Math.round(24 * s), Math.round(80 * s), Math.round(6 * s), 248, 208, 96, 220);

  // LCD Bezel
  const lcdBezelX = chassisX + Math.round(28 * s);
  const lcdBezelY = chassisY + Math.round(42 * s);
  const lcdBezelW = chassisW - Math.round(56 * s);
  const lcdBezelH = Math.round(140 * s);
  fillRoundRect(lcdBezelX, lcdBezelY, lcdBezelW, lcdBezelH, Math.round(12 * s), 22, 25, 28, 255);

  // LCD Screen (pale greenish-grey)
  const lcdX = lcdBezelX + Math.round(10 * s);
  const lcdY = lcdBezelY + Math.round(10 * s);
  const lcdW = lcdBezelW - Math.round(20 * s);
  const lcdH = lcdBezelH - Math.round(20 * s);
  fillRoundRect(lcdX, lcdY, lcdW, lcdH, Math.round(6 * s), 214, 227, 214, 255);

  // Draw simulated LCD pixels (e.g. math expression: √2 ≈ 1.4142 or 991ES+ NATURAL)
  // Let's draw dark LCD dots (#1A221A)
  const dotScale = Math.max(1, Math.round(3 * s));
  function drawPixel(px, py) {
    fillRect(lcdX + Math.round(16 * s) + px * dotScale, lcdY + Math.round(16 * s) + py * dotScale, dotScale - 1, dotScale - 1, 26, 34, 26, 240);
  }

  // Draw status indicator dots at top of LCD
  for (let i = 0; i < 6; i++) {
    fillRect(lcdX + Math.round(16 * s) + i * Math.round(14 * s), lcdY + Math.round(6 * s), Math.round(8 * s), Math.round(3 * s), 26, 34, 26, 180);
  }

  // Draw "991 ES+" in 5x7 dot matrix
  const digits = [
    // 9
    ['####', '#..#', '####', '...#', '####'],
    // 9
    ['####', '#..#', '####', '...#', '####'],
    // 1
    ['.##.', '..#.', '..#.', '..#.', '.###'],
    // space
    ['....', '....', '....', '....', '....'],
    // E
    ['####', '#...', '###.', '#...', '####'],
    // S
    ['.###', '#...', '.##.', '...#', '###.'],
    // +
    ['..#..', '..#..', '#####', '..#..', '..#..']
  ];

  let curX = 2;
  for (const glyph of digits) {
    for (let r = 0; r < glyph.length; r++) {
      for (let c = 0; c < glyph[r].length; c++) {
        if (glyph[r][c] === '#') {
          drawPixel(curX + c, 6 + r * 2);
        }
      }
    }
    curX += glyph[0].length + 2;
  }

  // Solar cell strip next to brand or top right
  const solarX = chassisX + chassisW - Math.round(130 * s);
  const solarY = chassisY + Math.round(20 * s);
  const solarW = Math.round(95 * s);
  const solarH = Math.round(16 * s);
  fillRoundRect(solarX, solarY, solarW, solarH, Math.round(3 * s), 45, 31, 29, 255);
  // Grid dividers on solar cell
  for (let i = 1; i <= 3; i++) {
    fillRect(solarX + Math.round((solarW / 4) * i), solarY, Math.round(2 * s), solarH, 70, 48, 42, 255);
  }

  // Keypad area below LCD
  const keysStartY = lcdBezelY + lcdBezelH + Math.round(16 * s);
  const gridW = chassisW - Math.round(56 * s);
  const gridX = chassisX + Math.round(28 * s);

  // Top function row: SHIFT (gold), ALPHA (salmon), DPAD (silver circle), MODE (grey), ON (lime)
  const keyH = Math.round(32 * s);
  const keyR = Math.round(6 * s);
  const gap = Math.round(8 * s);
  const colW = Math.round((gridW - 4 * gap) / 5);

  // SHIFT
  fillRoundRect(gridX, keysStartY, colW, keyH, keyR, 130, 135, 142, 255);
  fillRect(gridX + Math.round(6 * s), keysStartY + Math.round(4 * s), colW - Math.round(12 * s), Math.round(3 * s), 248, 208, 96, 255);

  // ALPHA
  fillRoundRect(gridX + colW + gap, keysStartY, colW, keyH, keyR, 130, 135, 142, 255);
  fillRect(gridX + colW + gap + Math.round(6 * s), keysStartY + Math.round(4 * s), colW - Math.round(12 * s), Math.round(3 * s), 248, 120, 120, 255);

  // D-PAD in middle
  const dpadSize = Math.round(68 * s);
  const dpadX = Math.round(gridX + 2 * (colW + gap) + (colW - dpadSize) / 2);
  const dpadY = keysStartY - Math.round(4 * s);
  fillRoundRect(dpadX, dpadY, dpadSize, dpadSize, Math.round(dpadSize / 2), 150, 155, 162, 255);
  fillRoundRect(dpadX + Math.round(14 * s), dpadY + Math.round(14 * s), dpadSize - Math.round(28 * s), dpadSize - Math.round(28 * s), Math.round((dpadSize - 28 * s) / 2), 100, 105, 112, 255);

  // MODE
  fillRoundRect(gridX + 3 * (colW + gap), keysStartY, colW, keyH, keyR, 130, 135, 142, 255);

  // ON (Lime)
  fillRoundRect(gridX + 4 * (colW + gap), keysStartY, colW, keyH, keyR, 140, 185, 35, 255);

  // Number / operation keys grid below
  const numRows = 4;
  const numCols = 5;
  const numGridY = keysStartY + Math.round(68 * s);
  const numKeyH = Math.round(34 * s);
  const numKeyGap = Math.round(10 * s);

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const kx = gridX + c * (colW + gap);
      const ky = numGridY + r * (numKeyH + numKeyGap);
      if (ky + numKeyH > chassisY + chassisH - Math.round(16 * s)) continue;

      let kr = 45, kg = 48, kb = 54; // dark keys
      if (r === 0 && (c === 3 || c === 4)) {
        // DEL / AC buttons (accent blue)
        kr = 40; kg = 110; kb = 180;
      } else if (r === 3 && c === 4) {
        // EXE button
        kr = 60; kg = 65; kb = 72;
      }
      fillRoundRect(kx, ky, colW, numKeyH, keyR, kr, kg, kb, 255);
    }
  }

  return encodePNG(size, size, buf);
}

// Generate both 192x192 and 512x512
const outDir = path.resolve('assets/icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), drawIcon(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), drawIcon(512));
console.log('Icons generated successfully in assets/icons/');
