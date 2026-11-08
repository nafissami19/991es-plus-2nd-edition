/**
 * Canvas LCD: draws the core's 96x31 framebuffer and the 96x8 status bar.
 * Browser only. Dots are mapped onto whole device pixels, so nothing is ever blurred.
 */

export const LCD_W = 96;
export const LCD_H = 31;
export const STATUS_W = 96;
export const STATUS_H = 8;
export const DEFAULT_CONTRAST = 8;

// Fixed 18 status indicator icons on Casio fx-991ES PLUS LCD
// Positions measured from the User's Guide captures (D, R, STAT, CMPLX, MAT, VCT, FIX, Math, ▲);
// the others are placed in the gaps (not verified).
export const STATUS_ICONS = [
  ['S', 0, 2],
  ['A', 3, 5],
  ['M', 7, 9],
  ['STO', 10, 15],
  ['RCL', 10, 15],
  ['STAT', 18, 25],
  ['CMPLX', 26, 38],
  ['MAT', 39, 44],
  ['VCT', 46, 51],
  ['D', 52, 55],
  ['R', 56, 58],
  ['G', 59, 61],
  ['FIX', 63, 67],
  ['SCI', 63, 67],
  ['Math', 75, 84],
  ['▼', 82, 86],
  ['▲', 86, 89],
  ['Disp', 90, 95],
].map(([name, x0, x1]) => ({ name, x0, x1 }));

export const STATUS_ICON_BITMAPS = {
  S: ['###', '#..', '###', '..#', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  M: ['#...#', '##.##', '#.###', '#.#.#', '#...#'],
  STO: ['###.###.###', '#....#..#.#', '###..#..#.#', '..#..#..#.#', '###..#..###'],
  RCL: ['##..###.#..', '#.#.#...#..', '##..#...#..', '#.#.#...#..', '#.#.###.###'],
  STAT: ['###.###..#..###', '#....#..#.#..#.', '###..#..###..#.', '..#..#..#.#..#.', '###..#..#.#..#.'],
  CMPLX: ['###.#...#.#.#.#.#', '#...##.##.#.#.#.#', '#...#.###.###..#.', '#...#.#.#.#...#.#', '###.#...#.#...#.#' ],
  MAT: ['#...#..#..###', '##.##.#.#..#.', '#.###.###..#.', '#.#.#.#.#..#.', '#...#.#.#..#.'],
  VCT: ['#...#.###.###', '#...#.#....#.', '#.#.#.#....#.', '#.#.#.#....#.', '.#.#..###..#.'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  G: ['###', '#..', '#.#', '#.#', '###'],
  FIX: ['###.#.#.#', '#...#.#.#', '##..#..#.', '#...#.#.#', '#...#.#.#'],
  SCI: ['###.###.#', '#...#...#', '###.#...#', '..#.#...#', '###.###.#'],
  Math: ['#...#.........#.#.', '##.##..#..###.#.#.', '#.###.#.#..#..###.', '#.#.#.###..#..#.#.', '#...#.#.#..#..#.#.'],
  '▼': ['#####', '.###.', '..#..'],
  '▲': ['..#..', '.###.', '#####'],
  Disp: ['##..........', '#.#.#.##.###', '#.#.#.#..#.#', '#.#.#..#.#.#', '##..#.#..###']
};

export function createDefaultIconMask() {
  const mask = new Float32Array(STATUS_W * STATUS_H);
  STATUS_ICONS.forEach((ic) => {
    const bmp = STATUS_ICON_BITMAPS[ic.name];
    if (!bmp) return;
    const top = Math.max(0, Math.floor((STATUS_H - bmp.length) / 2));
    for (let r = 0; r < bmp.length; r++) {
      const row = bmp[r];
      const y = top + r;
      if (y >= STATUS_H) break;
      for (let c = 0; c < row.length; c++) {
        const x = ic.x0 + c;
        if (x <= ic.x1 && x < STATUS_W) {
          mask[y * STATUS_W + x] = row[c] === '#' ? 1.0 : 0.0;
        }
      }
    }
  });
  return mask;
}

// Status icons cut from the User's Guide at 3 sub-pixels per dot (scripts/lcd_from_manual.py,
// local-only). The icons are LCD segments, so they are drawn finer than the dot matrix.
let TRACED_STRIP = null;
try {
  TRACED_STRIP = (await import('./fonts/lcd_status.js')).default;
} catch {
  TRACED_STRIP = null;
}

/** The status strip as { width, height, icons: { name: { x0, x1, mask(Float32Array) } } }. */
export function buildStatusStrip(traced = TRACED_STRIP) {
  if (traced) {
    const { width, height } = traced;
    const icons = {};
    for (const [name, ic] of Object.entries(traced.icons)) {
      const mask = new Float32Array(width * height);
      const w = ic.rows[0].length;
      ic.rows.forEach((row, y) => [...row].forEach((c, dx) => {
        const x = ic.x + dx;
        if (c === '#' && x < width && y < height) mask[y * width + x] = 1;
      }));
      icons[name] = { x0: ic.x, x1: ic.x + w - 1, mask };
    }
    return { width, height, icons };
  }
  // Fallback: the simple drawings above, at the same places (1 dot = 1 strip pixel).
  const icons = {};
  for (const ic of STATUS_ICONS) {
    const bmp = STATUS_ICON_BITMAPS[ic.name];
    const mask = new Float32Array(STATUS_W * STATUS_H);
    if (bmp) {
      const top = Math.max(0, STATUS_H - bmp.length - 1);
      bmp.forEach((row, r) => [...row].forEach((c, dx) => {
        const x = ic.x0 + dx;
        if (c === '#' && x < STATUS_W) mask[(top + r) * STATUS_W + x] = 1;
      }));
    }
    icons[ic.name] = { x0: ic.x0, x1: ic.x1, mask };
  }
  return { width: STATUS_W, height: STATUS_H, icons };
}

const FALLBACK_DISPLAY = {
  matrixWidth: LCD_W, matrixHeight: LCD_H,
  // Same family as the official ClassWiz emulator LCD (#C9D5CA background, #414540 dots).
  backgroundColor: '#C9D5CA', pixelOnColor: '#414540',
};

export async function loadLcdConfig(url = 'assets/data/lcd_config.json') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.warn('lcd_config.json not loaded, using defaults', e);
    return { display: FALLBACK_DISPLAY };
  }
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
// Little-endian RGBA packed into one Uint32 (every browser we target is little-endian).
const pack = ([r, g, b]) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;

/** Dot colour for a contrast level 0..15: 8 = the configured colour, lower = fainter, higher = darker. */
export function dotColor(bg, on, contrast = DEFAULT_CONTRAST) {
  const c = Math.max(0, Math.min(15, Number.isFinite(contrast) ? contrast : DEFAULT_CONTRAST));
  if (c <= DEFAULT_CONTRAST) return mix(bg, on, 0.25 + 0.75 * (c / DEFAULT_CONTRAST));
  return mix(on, [0, 0, 0], 0.6 * (c - DEFAULT_CONTRAST) / (15 - DEFAULT_CONTRAST));
}

/**
 * Largest scale <= s whose dot size (unitPx * scale * dpr) is a whole number of device pixels,
 * if that is within `tolerance` of s; otherwise s itself.
 */
export function snapScale(s, unitPx, dpr = window.devicePixelRatio || 1, tolerance = 0.1) {
  const dot = unitPx * s * dpr;
  const whole = Math.floor(dot);
  if (whole >= 1 && whole / dot >= 1 - tolerance) return whole / (unitPx * dpr);
  return s;
}

/** Synthetic test pattern for checking the drawing path without a working core. */
export function makeTestPattern() {
  const p = new Uint8Array(LCD_W * LCD_H);
  for (let y = 0; y < LCD_H; y++) {
    for (let x = 0; x < LCD_W; x++) {
      const border = x === 0 || y === 0 || x === LCD_W - 1 || y === LCD_H - 1;
      const diag = x - 64 === y || 190 - x === y;
      const checker = x >= 4 && x < 36 && y >= 4 && y < 20 && ((x + y) & 1);
      const bars = y >= 40 && y < 58 && x >= 4 && x < 60 && x % 4 < 2;
      p[y * LCD_W + x] = border || diag || checker || bars ? 1 : 0;
    }
  }
  return p;
}

// Which source dot each device pixel falls in (rounded boundaries: integer scale when possible).
function buildMap(devicePx, dots) {
  const map = new Uint16Array(devicePx);
  for (let i = 0; i < devicePx; i++) map[i] = Math.min(dots - 1, Math.floor(((i + 0.5) * dots) / devicePx));
  return map;
}

class Surface {
  constructor(canvas, w, h) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = w;
    this.h = h;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.getBoundingClientRect();
    const W = Math.max(this.w, Math.round(r.width * dpr) || this.w);
    const H = Math.max(this.h, Math.round(r.height * dpr) || this.h);
    if (this.canvas.width !== W || this.canvas.height !== H || !this.img) {
      this.canvas.width = W;
      this.canvas.height = H;
      this.img = this.ctx.createImageData(W, H);
      this.buf = new Uint32Array(this.img.data.buffer);
      this.colMap = buildMap(W, this.w);
      this.rowMap = buildMap(H, this.h);
    }
  }

  // intensityAt(x, y) -> 0..1 for each source dot; device rows sharing a source row are copied.
  paint(intensityAt, bgRgb, dotRgb) {
    const { buf, colMap, rowMap, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const bg = pack(bgRgb);
    const full = pack(dotRgb);
    const rowCache = new Uint32Array(W);
    let lastRow = -1;
    for (let y = 0; y < H; y++) {
      const sy = rowMap[y];
      if (sy !== lastRow) {
        for (let x = 0; x < W; x++) {
          const v = intensityAt(colMap[x], sy);
          rowCache[x] = v <= 0 ? bg : v >= 1 ? full : pack(mix(bgRgb, dotRgb, v));
        }
        lastRow = sy;
      }
      buf.set(rowCache, y * W);
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}

export class CanvasLCD {
  /**
   * @param {HTMLCanvasElement} mainCanvas  192x63 dot matrix
   * @param {HTMLCanvasElement} statusCanvas 192x8 status bar (optional)
   * @param {object} display lcd_config.json "display" section
   */
  constructor(mainCanvas, statusCanvas, display = FALLBACK_DISPLAY) {
    this.bg = hexToRgb(display.backgroundColor || FALLBACK_DISPLAY.backgroundColor);
    this.on = hexToRgb(display.pixelOnColor || FALLBACK_DISPLAY.pixelOnColor);
    this.main = new Surface(mainCanvas, LCD_W, LCD_H);
    this.strip = buildStatusStrip();
    this.status = statusCanvas ? new Surface(statusCanvas, this.strip.width, this.strip.height) : null;
    this.last = null;
  }

  /** Kept for callers; the icons are built in (traced from the User's Guide when available). */
  async loadStatusIcons() {
    if (this.last) this.draw(this.last);
  }

  /** Call after the canvases' CSS size changes. */
  resize() {
    this.main.resize();
    this.status?.resize();
    if (this.last) this.draw(this.last);
  }

  /** scr: { pixels, indicators, contrast, poweredOn } (any field may be missing). */
  draw(scr = {}) {
    this.last = scr;
    const on = scr.poweredOn !== false;
    const dot = dotColor(this.bg, this.on, scr.contrast);
    const px = on && scr.pixels && scr.pixels.length >= LCD_W * LCD_H ? scr.pixels : null;
    this.main.paint(px ? (x, y) => px[y * LCD_W + x] : () => 0, this.bg, dot);

    if (!this.status) return;
    const names = on && Array.isArray(scr.indicators) ? scr.indicators : [];
    const lit = Object.entries(this.strip.icons).filter(([name]) => names.includes(name)).map(([, ic]) => ic);
    const width = this.strip.width;
    this.status.paint(
      (x, y) => {
        for (const ic of lit) if (x >= ic.x0 && x <= ic.x1 && ic.mask[y * width + x]) return 1;
        return 0;
      },
      this.bg, dot,
    );
  }
}
