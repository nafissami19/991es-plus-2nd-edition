/**
 * 96×31 monochrome framebuffer (1 = dark dot) with bitmap-font text drawing.
 * Pure JS: runs in Node and in the browser.
 */

import ORIGINAL_LARGE from './fonts/large.js';
import ORIGINAL_SMALL from './fonts/small.js';

// The ES fonts traced from the User's Guide (scripts/lcd_from_manual.py) are local-only;
// without them the original placeholder fonts are used.
async function optionalModule(path) {
  try {
    return (await import(path)).default;
  } catch {
    return null;
  }
}
const TRACED_MAIN = await optionalModule('./fonts/lcd_main.js');
const TRACED_SMALL = await optionalModule('./fonts/lcd_small.js');
const LARGE = TRACED_MAIN || ORIGINAL_LARGE;
const SMALL = TRACED_SMALL || ORIGINAL_SMALL;
export const TRACED_FONT = !!(TRACED_MAIN && TRACED_SMALL);

export const LCD_WIDTH = 96;
export const LCD_HEIGHT = 31;
export const FONTS = { large: LARGE, small: SMALL };

// Pre-parse glyph rows into bit arrays once
for (const font of Object.values(FONTS)) {
  font.height = font.ascent + font.descent;
  for (const g of Object.values(font.glyphs)) {
    if (!g.bits) g.bits = g.rows.map((r) => [...r].map((c) => (c === '#' ? 1 : 0)));
  }
}

const DESCENDERS = new Set(['g', 'j', 'p', 'q', 'y', ',', ';', 'μ', 'ρ', 'β', 'χ', 'φ', 'ψ', 'γ', 'η']);

export function getFont(name) {
  return typeof name === 'object' ? name : FONTS[name] || LARGE;
}

// Special ES glyphs and the plain characters to use when a font doesn't have them.
const ALIASES = {
  '▸': '▶', '▷': '▶', '◁': '◀',
  'ᴀ': 'A', 'ʙ': 'B', 'ᴄ': 'C', 'ℯ': 'e', 'ₙ': 'n',
  'µ': 'μ',
  '⌟': '┘',
  '–': '-', '—': '-',
  'ˣ': 'x', 'ⁿ': 'n',
  'ŷ': 'y', 'ȳ': 'y',
};

export function glyphFor(font, ch) {
  return font.glyphs[ch] || font.glyphs[ALIASES[ch]] || font.glyphs['?'] || font.glyphs[' '];
}

/** Width in pixels of a string. */
export function measureText(str, fontName = 'large') {
  const font = getFont(fontName);
  let w = 0;
  for (const ch of str) w += glyphFor(font, ch).w;
  return w;
}

/** Ink extents of a string above / below the baseline. */
export function textExtents(str, fontName = 'large') {
  const font = getFont(fontName);
  let desc = 0;
  for (const ch of str) if (DESCENDERS.has(ch)) desc = font.descent;
  return { asc: font.ascent, desc };
}

export class Framebuffer {
  constructor(width = LCD_WIDTH, height = LCD_HEIGHT) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height);
  }

  clear() {
    this.pixels.fill(0);
  }

  set(x, y, on = 1) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.pixels[y * this.width + x] = on ? 1 : 0;
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.pixels[y * this.width + x];
  }

  fillRect(x, y, w, h, on = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, on);
  }

  invertRect(x, y, w, h) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const px = x + i;
        const py = y + j;
        if (px >= 0 && py >= 0 && px < this.width && py < this.height) {
          this.pixels[py * this.width + px] ^= 1;
        }
      }
    }
  }

  hline(x1, x2, y, on = 1) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) this.set(x, y, on);
  }

  vline(x, y1, y2, on = 1) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) this.set(x, y, on);
  }

  line(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Dotted rectangle outline (empty template slot). */
  dottedRect(x, y, w, h) {
    for (let i = 0; i < w; i += 2) {
      this.set(x + i, y);
      this.set(x + i, y + h - 1);
    }
    for (let j = 0; j < h; j += 2) {
      this.set(x, y + j);
      this.set(x + w - 1, y + j);
    }
  }

  blitBits(bits, x, y, invert = false) {
    for (let j = 0; j < bits.length; j++) {
      const row = bits[j];
      for (let i = 0; i < row.length; i++) {
        if (row[i]) this.set(x + i, y + j, invert ? 0 : 1);
      }
    }
  }

  /**
   * Draw a string with its baseline at y. Returns the width drawn.
   */
  drawText(x, baselineY, str, fontName = 'large') {
    const font = getFont(fontName);
    const top = baselineY - font.ascent;
    let cx = x;
    let prevW = 8;
    for (const ch of String(str)) {
      const g = glyphFor(font, ch);
      const drawX = g.w === 0 ? cx - prevW : cx;
      this.blitBits(g.bits, drawX, top);
      if (g.w > 0) {
        cx += g.w;
        prevW = g.w;
      }
    }
    return cx - x;
  }

  /** Draw a string whose top edge is at y. */
  drawTextTop(x, topY, str, fontName = 'large') {
    const font = getFont(fontName);
    return this.drawText(x, topY + font.ascent, str, font);
  }

  /** Draw directional arrow ('up' | 'down' | 'left' | 'right'). */
  drawArrow(x, y, dir, fontName = 'small') {
    const sym = dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▶';
    return this.drawTextTop(x, y, sym, fontName);
  }

  /** Draw edge scroll arrows for scrollable menus or lists. */
  scrollArrows({ up = false, down = false, left = false, right = false } = {}, fontName = 'small') {
    if (up) this.drawArrow(90, 1, 'up', fontName);
    if (down) this.drawArrow(90, 23, 'down', fontName);
    if (left) this.drawArrow(1, 12, 'left', fontName);
    if (right) this.drawArrow(90, 12, 'right', fontName);
  }
}
