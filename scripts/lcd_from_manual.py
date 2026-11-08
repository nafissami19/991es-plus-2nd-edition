"""
Build the ES PLUS LCD fonts, status icons and pixel-test references from the official
2nd-edition User's Guide PDF (fx-570ES_991ES_9910NG_PLUS_EN.pdf in the project folder).

The guide contains ~60 screen captures of the real LCD. Each one is decoded back into dots
(96 x 31 matrix + the status strip above it), then:
  * the two LCD fonts are traced from screens whose text is listed in TEXT below
    (characters the guide never shows are drawn by hand in the same style: DESIGNED_*),
  * the status icons are cut out at 3 sub-pixels per dot (they are LCD segments, not dots),
  * selected screens become pixel-test references (tests/pixel/reference/*.json).

Outputs (all git-ignored, because they are copied from Casio's screen):
  js/lcd/fonts/lcd_main.js     main font (input and results), 5x9 dots, 6-dot advance
  js/lcd/fonts/lcd_small.js    small font (menus, fraction parts, exponents), 5x6 dots
  js/lcd/fonts/lcd_status.js   status icons (S A M STO RCL STAT CMPLX MAT VCT D R G FIX SCI Math ▼ ▲ Disp)
  tests/pixel/reference/*.json official screens for tests/pixel_reference.test.js

Run:  python scripts/lcd_from_manual.py      (needs numpy, pillow, pymupdf; takes a few minutes)
"""

import json
import os
import re
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, 'fx-570ES_991ES_9910NG_PLUS_EN.pdf')
CACHE = os.path.join(ROOT, 'docs', 'reference', 'manual_lcd')        # git-ignored
OUT_MAIN = os.path.join(ROOT, 'js', 'lcd', 'fonts', 'lcd_main.js')
OUT_SMALL = os.path.join(ROOT, 'js', 'lcd', 'fonts', 'lcd_small.js')
OUT_STATUS = os.path.join(ROOT, 'js', 'lcd', 'fonts', 'lcd_status.js')
OUT_REF = os.path.join(ROOT, 'tests', 'pixel', 'reference')
OLD_SMALL = os.path.join(ROOT, 'js', 'lcd', 'fonts', 'small.js')

W, H = 96, 31
MAIN, SMALL = 'main', 'small'
CELL = {MAIN: (6, 11, 9), SMALL: (6, 8, 6)}          # advance, cell rows, cap height
DESCENDERS = set('gjpqy,;')

# Screen captures used (page_xref as extracted from the PDF). row0 = first matrix row in the
# decoded grid (the status strip occupies the rows above it); col0 = frame column + 5.
SCREENS = {
    'p06_x21': {}, 'p16_x57': {}, 'p16_x58': {}, 'p17_x63': {}, 'p25_x97': {}, 'p25_x98': {},
    'p37_x139': {}, 'p37_x142': {}, 'p37_x143': {}, 'p38_x146': {}, 'p40_x158': {}, 'p40_x159': {},
    'p41_x162': {}, 'p41_x163': {}, 'p41_x165': {}, 'p41_x166': {}, 'p43_x173': {}, 'p43_x174': {},
    'p43_x175': {}, 'p47_x185': {}, 'p49_x193': {}, 'p49_x194': {}, 'p54_x206': {}, 'p55_x210': {},
    'p55_x211': {}, 'p55_x212': {}, 'p56_x216': {'row0': 1}, 'p56_x219': {'row0': 1},
    'p56_x220': {'row0': 1}, 'p59_x229': {}, 'p62_x240': {}, 'p63_x244': {}, 'p65_x257': {},
    'p67_x270': {}, 'p68_x274': {}, 'p69_x279': {}, 'p69_x281': {}, 'p70_x285': {}, 'p70_x286': {},
    'p71_x289': {}, 'p71_x290': {}, 'p71_x291': {},
}

# Text shown in the captures: (screen, cap-top row, font, 'segment|segment'); '~' = skip that cell.
TEXT = [
    ('p16_x57', 1, MAIN, '4×sin(30)×(30+1▷'), ('p16_x57', 22, MAIN, '120'),
    ('p16_x58', 1, MAIN, '4sin(30)(30+10×3'), ('p16_x58', 22, MAIN, '120'),
    ('p25_x97', 1, MAIN, '789−Ans'), ('p25_x97', 22, MAIN, '210'),
    ('p25_x98', 1, MAIN, 'Ans÷30'), ('p25_x98', 22, MAIN, '0.4'),
    ('p37_x139', 1, MAIN, '3A+B'), ('p37_x139', 22, MAIN, '41'),
    ('p37_x142', 1, MAIN, '3A+B'), ('p37_x142', 22, MAIN, '25'),
    ('p37_x143', 1, MAIN, 'A?'), ('p37_x143', 22, MAIN, '5'),
    ('p38_x146', 1, MAIN, 'A+Bⅈ▶r∠θ~'),
    ('p55_x210', 1, MAIN, '3▶t'), ('p55_x210', 22, MAIN, '-0.762'),
    ('p55_x211', 1, MAIN, 'P(Ans)'), ('p55_x211', 22, MAIN, '0.223'),
    ('p55_x212', 12, MAIN, 'Dec'), ('p55_x212', 22, MAIN, '0'),
    ('p56_x216', 1, MAIN, 'Bin'), ('p56_x216', 11, MAIN, '0000000000000100'),
    ('p56_x219', 1, MAIN, 'Hex'), ('p56_x219', 11, MAIN, '00000020'),
    ('p56_x220', 1, MAIN, 'Oct'), ('p56_x220', 11, MAIN, '00000000010'),
    ('p69_x279', 1, MAIN, 'VctA·VctB'), ('p69_x279', 22, MAIN, '11'),
    ('p69_x281', 1, MAIN, 'Abs(VctC)'), ('p69_x281', 22, MAIN, '3'),
    ('p70_x285', 1, MAIN, '(VctA·VctB)÷(Ab~'), ('p70_x285', 22, MAIN, '0.984'),
    ('p70_x286', 1, MAIN, 'cos~(Ans)'), ('p70_x286', 22, MAIN, '10.305'),
    ('p71_x290', 1, MAIN, '14÷0~2'), ('p71_x291', 1, MAIN, '14÷10×2'),
    ('p43_x174', 1, MAIN, '5cm▶in'), ('p43_x174', 22, MAIN, '1.968503937'),
    ('p43_x175', 1, MAIN, '100g▶oz'), ('p43_x175', 22, MAIN, '3.527396584'),
    ('p40_x158', 1, MAIN, 'Solve|for|X'), ('p40_x158', 22, MAIN, '0'),
    ('p40_x159', 12, MAIN, 'X=|2'), ('p40_x159', 22, MAIN, 'L−R=|0'),
    ('p41_x162', 12, MAIN, 'X=|3'), ('p41_x162', 22, MAIN, 'L−R=|0'),
    ('p41_x163', 22, MAIN, '299792458'), ('p41_x166', 22, MAIN, '299792458'),
    ('p71_x291', 16, SMALL, '14'), ('p71_x291', 25, SMALL, '5'),
    ('p06_x21', 1, SMALL, 'CONTRAST'), ('p06_x21', 17, SMALL, 'LIGHT|DARK'),
    ('p41_x165', 2, SMALL, 'CONSTANT'), ('p41_x165', 10, SMALL, 'Number|01~40?'), ('p41_x165', 22, MAIN, '[__]'),
    ('p43_x173', 2, SMALL, 'CONVERSION'), ('p43_x173', 10, SMALL, 'Number|01~40?'), ('p43_x173', 22, MAIN, '[__]'),
    # regression-coefficient letters in the STAT type menu are special small capitals (ᴀ ʙ ᴄ) and ℯ
    ('p47_x185', 1, SMALL, '1:1-VAR|2:ᴀ+ʙX'), ('p47_x185', 9, SMALL, '3:_+ᴄX²|4:ln|X'),
    ('p47_x185', 17, SMALL, '5:ℯ^X|6:ᴀ•ʙ^X'), ('p47_x185', 25, SMALL, '7:ᴀ•X^ʙ|8:1/X'),
    ('p59_x229', 1, SMALL, '1:aₙX+bₙY=cₙ'), ('p59_x229', 9, SMALL, '2:aₙX+bₙY+cₙZ=dₙ'),
    ('p59_x229', 17, SMALL, '3:aX²+bX+c=0'), ('p59_x229', 25, SMALL, '4:aX³+bX²+cX+d=0'),
    ('p49_x193', 1, SMALL, '1:Type|2:Data'), ('p49_x193', 9, SMALL, '3:Sum|4:Var'),
    ('p49_x193', 17, SMALL, '5:Distr|6:MinMax'),
    ('p49_x194', 1, SMALL, '1:Type|2:Data'), ('p49_x194', 9, SMALL, '3:Sum|4:Var'),
    ('p49_x194', 17, SMALL, '5:Reg|6:MinMax'),
    ('p62_x240', 1, SMALL, 'Matrix?'), ('p62_x240', 9, SMALL, '1:MatA|2:MatB'), ('p62_x240', 17, SMALL, '3:MatC'),
    ('p67_x270', 1, SMALL, 'Vector?'), ('p67_x270', 9, SMALL, '1:VctA|2:VctB'), ('p67_x270', 17, SMALL, '3:VctC'),
    ('p71_x289', 1, SMALL, 'Math|ERROR'), ('p71_x289', 17, SMALL, '[AC]|:Cancel'),
    ('p71_x289', 25, SMALL, '[◀][▶]:Goto'),
]

# Screens that become pixel tests: keys (js/core/keys.js names), setup, status icons shown.
REFERENCES = {
    'p71_x289': {'keys': '1 4 ÷ 0 × 2 =', 'indicators': ['D', 'Math'], 'what': 'Math ERROR screen'},
    'p71_x291': {'keys': '1 4 ÷ 0 × 2 = RIGHT LEFT 1 =', 'indicators': ['D', 'Math', '▲'], 'what': '14÷10×2 = 14/5'},
    'p16_x57': {'keys': '4 × SIN 3 0 ) × ( 3 0 + 1 0 × 3 ) =', 'indicators': ['D', 'Math', '▲'], 'what': 'long input, result 120'},
    'p16_x58': {'keys': '4 SIN 3 0 ) ( 3 0 + 1 0 × 3 =', 'indicators': ['D', 'Math', '▲'], 'what': 'omitted ×, result 120'},
    'p17_x63': {'keys': 'FRAC 2 + SQRT 2 RIGHT DOWN 1 + SQRT 2 =', 'indicators': ['D', 'Math', '▲'], 'what': '(2+√2)/(1+√2) = √2'},
    'p62_x240': {'keys': 'MODE 6', 'indicators': [], 'what': 'Matrix? menu'},
    'p67_x270': {'keys': 'MODE 8', 'indicators': [], 'what': 'Vector? menu'},
    'p47_x185': {'keys': 'MODE 3', 'indicators': [], 'what': 'STAT type menu'},
    'p59_x229': {'keys': 'MODE 5', 'indicators': [], 'what': 'EQN type menu'},
    'p49_x193': {'keys': 'MODE 3 1 AC SHIFT 1', 'indicators': [], 'what': 'STAT 1-VAR menu'},
    'p49_x194': {'keys': 'MODE 3 2 AC SHIFT 1', 'indicators': [], 'what': 'STAT A+BX menu'},
    'p41_x165': {'keys': 'SHIFT 7', 'indicators': [], 'what': 'CONSTANT prompt'},
    'p43_x173': {'keys': 'SHIFT 8', 'indicators': [], 'what': 'CONVERSION prompt'},
    'p65_x257': {'keys': 'MODE 7', 'indicators': ['D', 'Math'], 'what': 'TABLE f(X)=', 'cursor': True},
    'p06_x21': {'keys': 'SHIFT MODE DOWN 6', 'indicators': [], 'what': 'CONTRAST screen'},
}

# Status icons: where to cut each one (screen, sub-pixel column range) and where it sits on the
# LCD (sub-pixel column, 3 per dot). Positions are measured relative to the D icon, which is in
# almost every capture. Icons never shown in the guide are drawn by hand (unverified position).
R = 3
STATUS_ROWS = 12                       # sub-pixel rows of the status strip (icons are 10 tall)
ICON_CUTS = {   # generous windows (relative to the D icon); the ink inside is trimmed and placed exactly
    'STAT': ('p54_x206', -106, -78), 'FIX': ('p54_x206', 28, 52), 'MAT': ('p63_x244', -46, -23),
    'VCT': ('p68_x274', -24, -2), 'CMPLX': ('p38_x146', -84, -44), 'D': ('p16_x57', 0, 8),
    'Math': ('p16_x57', 64, 96), '▲': ('p16_x57', 98, 116),
}
D_POS = 158                            # sub-pixel column of the D icon (dot 52.7)
ICON_POS = {                           # sub-pixel x of each icon; * = not shown in the guide
    'S': 0, 'A': 10, 'M': 20, 'STO': 30, 'RCL': 30, 'STAT': D_POS - 102, 'CMPLX': D_POS - 80,
    'MAT': D_POS - 42, 'VCT': D_POS - 21, 'D': D_POS, 'R': D_POS + 10, 'G': D_POS + 20,
    'FIX': D_POS + 31, 'SCI': D_POS + 31, 'Math': D_POS + 69, '▼': D_POS + 90, '▲': D_POS + 102,
    'Disp': D_POS + 114,
}
MEASURED_ICONS = {'STAT', 'CMPLX', 'MAT', 'VCT', 'D', 'R', 'FIX', 'Math', '▲'}


# ------------------------------------------------------------------ PDF images -> dot grids

def extract_images():
    import pymupdf
    os.makedirs(CACHE, exist_ok=True)
    doc = pymupdf.open(PDF)
    for name in SCREENS:
        path = os.path.join(CACHE, name + '.png')
        if os.path.exists(path):
            continue
        xref = int(name.split('_x')[1])
        pix = pymupdf.Pixmap(doc, xref)
        if pix.n - pix.alpha >= 4:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        pix.save(path)


def gray(path):
    return 1 - np.asarray(Image.open(path).convert('L')).astype(float) / 255.0


def inner_box(d):
    light = d < 0.5
    rows = np.where(light.mean(1) > 0.6)[0]
    cols = np.where(light.mean(0) > 0.6)[0]
    return cols.min(), rows.min(), cols.max() + 1, rows.max() + 1


def _var(a, centres, p, o):
    owner = np.floor((centres - o) / p).astype(int)
    owner -= owner.min()
    cnt = np.bincount(owner).astype(float)
    sums = np.zeros((cnt.size, a.shape[1]))
    np.add.at(sums, owner, a)
    sq = np.zeros((cnt.size, a.shape[1]))
    np.add.at(sq, owner, a * a)
    return (sq - sums * sums / np.maximum(cnt, 1)[:, None]).sum()


def fit_axis(a, prange=(2.9, 3.4)):
    """Captures are nearest-neighbour scaled: every pixel line copies one dot line."""
    centres = np.arange(a.shape[0]) + 0.5
    coarse = min(((_var(a, centres, p, o), p, o) for p in np.arange(prange[0], prange[1], 0.02)
                  for o in np.arange(-p, p, 0.1)), key=lambda t: t[0])
    best = None
    for p in np.arange(coarse[1] - 0.025, coarse[1] + 0.025, 0.002):
        for o in np.arange(-p, p, 0.04):
            v = _var(a, centres, p, o)
            if best is None or v < best[0] - 1e-9:
                best = (v, p, o)
    return best[1], best[2]


def cells(a, p, o):
    centres = np.arange(a.shape[0]) + 0.5
    owner = np.floor((centres - o) / p).astype(int)
    kmin = owner.min()
    owner -= kmin
    out = np.zeros((owner.max() + 1, a.shape[1]))
    for k in range(out.shape[0]):
        m = owner == k
        out[k] = a[m].mean(0) if m.any() else 0
    return out, kmin


def decode(name):
    d = gray(os.path.join(CACHE, name + '.png'))
    x0, y0, x1, y1 = inner_box(d)
    s = d[y0:y1, x0:x1]
    py, oy = fit_axis(s)
    rows, kminy = cells(s, py, oy)
    px, ox = fit_axis(rows.T)
    grid, kminx = cells(rows.T, px, ox)
    geo = dict(x0=x0, y0=y0, px=px, py=py, ox=ox, oy=oy, kminx=kminx, kminy=kminy)
    return grid.T > 0.5, geo, d


def frame_col(g):
    for c in range(min(6, g.shape[1])):
        if g[:, c].mean() > 0.9:
            return c
    return None


def to_matrix(g, name):
    fc = frame_col(g)
    if fc is None:
        raise ValueError(f'{name}: no frame line found')
    col0 = fc + 5
    row0 = SCREENS[name].get('row0', 7)
    M = np.zeros((H, W), bool)
    for r in range(H):
        for c in range(W):
            y, x = row0 + r, col0 + c
            if 0 <= y < g.shape[0] and 0 <= x < g.shape[1]:
                M[r, c] = g[y, x]
    return M, col0, row0


# ------------------------------------------------------------------ font tracing

def segments(M, r0, r1, gap=7):
    cols = M[r0:r1 + 1].any(0)
    segs, start, blank, last = [], None, 0, None
    for c, v in enumerate(list(cols) + [False] * (gap + 1)):
        if v:
            if start is None:
                start = c
            blank, last = 0, c
        elif start is not None:
            blank += 1
            if blank >= gap:
                segs.append((start, last))
                start = None
    return segs


def trace(mats):
    samples = {MAIN: {}, SMALL: {}}
    problems = []
    for screen, top, font, text in TEXT:
        M = mats.get(screen)
        if M is None:
            problems.append('missing ' + screen)
            continue
        adv, rows, cap = CELL[font]
        r1 = min(H - 1, top + cap - 1)
        segs = segments(M, top, r1)
        parts = text.split('|')
        if len(segs) != len(parts):
            problems.append(f'{screen} r{top}: {len(segs)} segments vs {parts}')
            continue
        for (a, b), part in zip(segs, parts):
            colsink = M[top:r1 + 1].any(0)
            phase = min(range(6), key=lambda ph: sum(colsink[c] for c in range(a, b + 1) if (c - ph) % 6 == 5))
            start = a - ((a - phase) % 6)
            chars = list(part)
            ci = 0
            for k in range((b - start) // adv + 1):
                x = start + k * adv
                cell = np.zeros((rows, adv), bool)
                for r in range(rows):
                    for c in range(adv):
                        y, xx = top + r, x + c
                        if 0 <= y < H and 0 <= xx < W:
                            cell[r, c] = M[y, xx]
                if not cell[:cap].any():
                    continue                          # empty cell = a space
                if ci >= len(chars):
                    problems.append(f'{screen} r{top} "{part}": more cells than characters')
                    break
                ch = chars[ci]
                ci += 1
                if ch == '~':
                    continue
                if ch not in DESCENDERS:
                    cell[cap:] = False                # ink below the baseline belongs to the next line
                samples[font].setdefault(ch, []).append(cell)
            if ci != len(chars):
                problems.append(f'{screen} r{top} "{part}": matched {ci}/{len(chars)} characters')
    traced = {f: {ch: np.mean(np.array(v, float), 0) >= 0.5 for ch, v in d.items()} for f, d in samples.items()}
    return traced, problems


# ------------------------------------------------------------------ hand-made glyphs

def glyph(rows_, font, top=0):
    adv, rows, cap = CELL[font]
    g = np.zeros((rows, adv), bool)
    for i, r in enumerate(rows_):
        for j, ch in enumerate(r[:adv]):
            g[top + i, j] = ch == '#'
    return g


def M_(*r, top=0):
    return glyph(r, MAIN, top)


def S_(*r, top=0):
    return glyph(r, SMALL, top)


# Main font: 5x9 capitals, x-height 7 (rows 2-8), 1-dot strokes - same construction as the traced glyphs.
DESIGNED_MAIN = {
    'E': M_('#####', '#....', '#....', '#....', '####.', '#....', '#....', '#....', '#####'),
    'F': M_('#####', '#....', '#....', '#....', '####.', '#....', '#....', '#....', '#....'),
    'G': M_('.###.', '#...#', '#....', '#....', '#.###', '#...#', '#...#', '#...#', '.####'),
    'H': M_('#...#', '#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#', '#...#'),
    'I': M_('.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'),
    'J': M_('..###', '...#.', '...#.', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'),
    'K': M_('#...#', '#..#.', '#.#..', '##...', '##...', '#.#..', '#..#.', '#...#', '#...#'),
    'M': M_('#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#', '#...#', '#...#'),
    'N': M_('#...#', '#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#', '#...#'),
    'O': M_('.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
    'Q': M_('.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'),
    'T': M_('#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'),
    'U': M_('#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
    'W': M_('#...#', '#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '##.##', '#...#'),
    'Y': M_('#...#', '#...#', '.#.#.', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..'),
    'Z': M_('#####', '....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....', '#####'),
    'a': M_('.###.', '....#', '.####', '#...#', '#...#', '#..##', '.##.#', top=2),
    'd': M_('....#', '....#', '.##.#', '#..##', '#...#', '#...#', '#...#', '#..##', '.##.#'),
    'h': M_('#....', '#....', '#.##.', '##..#', '#...#', '#...#', '#...#', '#...#', '#...#'),
    'j': M_('...#.', '.....', '..##.', '...#.', '...#.', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'),
    'k': M_('#....', '#....', '#..#.', '#.#..', '##...', '##...', '#.#..', '#..#.', '#...#'),
    'p': M_('#.##.', '##..#', '#...#', '#...#', '#...#', '##..#', '#.##.', '#....', '#....', top=2),
    'q': M_('.##.#', '#..##', '#...#', '#...#', '#...#', '#..##', '.##.#', '....#', '....#', top=2),
    'u': M_('#...#', '#...#', '#...#', '#...#', '#...#', '#..##', '.##.#', top=2),
    'w': M_('#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.', top=2),
    'x': M_('#...#', '.#.#.', '..#..', '..#..', '..#..', '.#.#.', '#...#', top=2),
    'y': M_('#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..', '.#...', '#....', top=2),
    ':': M_('.##..', '.##..', '.....', '.....', '.....', '.##..', '.##..', top=2),
    ',': M_('.##..', '.##..', '..#..', '.#...', top=7),
    '!': M_('..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '.....', '.....', '..#..'),
    '%': M_('##...', '##..#', '...#.', '...#.', '..#..', '.#...', '.#...', '#..##', '...##'),
    '^': M_('..#..', '.#.#.', '#...#'),
    '°': M_('.##..', '#..#.', '#..#.', '.##..'),
    '[': M_('###..', '#....', '#....', '#....', '#....', '#....', '#....', '#....', '###..'),
    ']': M_('..###', '....#', '....#', '....#', '....#', '....#', '....#', '....#', '..###'),
    'π': M_('#####', '.#.#.', '.#.#.', '.#.#.', '.#.#.', '.#.#.', '.#..#', top=2),
    '²': M_('##...', '..#..', '.#...', '###..'),
    '³': M_('##...', '..#..', '.#...', '..#..', '##...'),
    '⁻': M_('###..', top=2),
    '◀': M_('...#.', '..##.', '.###.', '####.', '.###.', '..##.', '...#.', top=1),
    '▲': M_('..#..', '.###.', '#####', top=3),
    '▼': M_('#####', '.###.', '..#..', top=3),
    '_': M_('#####', top=8),
    '/': M_('....#', '....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....', '#....'),
    '#': M_('.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.', top=1),
}

# Small font: 5x6 capitals, x-height 5 (rows 1-5), no descenders - same construction as the traced glyphs.
DESIGNED_SMALL = {
    '9': S_('.###.', '#...#', '#...#', '.####', '...#.', '.##..'),
    '0': S_('.###.', '#...#', '#..##', '##..#', '#...#', '.###.'),
    'F': S_('#####', '#....', '####.', '#....', '#....', '#....'),
    'J': S_('..###', '...#.', '...#.', '...#.', '#..#.', '.##..'),
    'P': S_('####.', '#...#', '#...#', '####.', '#....', '#....'),
    'Q': S_('.###.', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'),
    'U': S_('#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
    'W': S_('#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'),
    'f': S_('..##.', '.#...', '####.', '.#...', '.#...', '.#...'),
    'j': S_('...#.', '.....', '..##.', '...#.', '#..#.', '.##..'),
    'k': S_('#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'),
    'q': S_('.####', '#...#', '.####', '....#', '....#', top=1),
    'v': S_('#...#', '#...#', '.#.#.', '.#.#.', '..#..', top=1),
    'w': S_('#...#', '#...#', '#.#.#', '#.#.#', '.#.#.', top=1),
    'z': S_('#####', '...#.', '..#..', '.#...', '#####', top=1),
    '(': S_('..#..', '.#...', '.#...', '.#...', '.#...', '..#..'),
    ')': S_('..#..', '...#.', '...#.', '...#.', '...#.', '..#..'),
    '.': S_('.##..', '.##..', top=4),
    ',': S_('.##..', '..#..', '.#...', top=4),
    '−': S_('#####', top=3),
    '×': S_('#...#', '.#.#.', '..#..', '.#.#.', '#...#', top=1),
    '÷': S_('..#..', '.....', '#####', '.....', '..#..', top=1),
    '!': S_('..#..', '..#..', '..#..', '..#..', '.....', '..#..'),
    '%': S_('##..#', '##.#.', '..#..', '.#...', '#.##.', '..##.'),
    '°': S_('.##..', '#..#.', '.##..'),
    '▲': S_('..#..', '.###.', '#####', top=2),
    '▼': S_('#####', '.###.', '..#..', top=2),
    'π': S_('#####', '.#.#.', '.#.#.', '.#.#.', '.#..#', top=1),
    'ⅈ': S_('..#..', '.....', '.##..', '..#..', '..#..', '.###.'),
    '⁻': S_('###..', top=1),
    '~': S_('.#...', '#.#.#', '...#.', top=2),   # shape from the CONSTANT capture (it straddles two cells there)
}


def parse_font(path):
    src = open(path, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"^    ('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"): \{ w: (\d+), rows: \[(.*?)\] \}", src, re.S | re.M):
        k = m.group(1)
        key = json.loads('"' + k[1:-1].replace("\\'", "'").replace('"', '\\"') + '"') if k[0] == "'" else json.loads(k)
        out[key] = (int(m.group(2)), re.findall(r"'([.#]+)'", m.group(3)))
    return out


def convert_small(w, rows, font):
    """Fallback for characters neither traced nor designed: the old 7-row small glyph."""
    adv, nrows, cap = CELL[font]
    src = [[c == '#' for c in r] for r in rows]
    while len(src) < 9:
        src.append([False] * (len(src[0]) if src else 1))
    if font == MAIN:            # 7 rows -> 9 rows (repeat rows 1 and 4)
        body = src[0:2] + [src[1]] + src[2:5] + [src[4]] + src[5:7]
        body += src[7:9]
    else:                       # 7 rows -> 6 rows (drop row 3)
        body = src[0:3] + src[4:7] + src[7:9]
    g = np.zeros((nrows, adv), bool)
    arr = np.array(body[:nrows], bool)
    if w == 0:
        g[:arr.shape[0], :min(adv, arr.shape[1])] = arr[:, :adv]
        return g
    cols = np.where(arr.any(0))[0]
    if len(cols):
        ink = arr[:, cols.min():cols.max() + 1][:, :5]
        g[:ink.shape[0], 0 + max(0, (5 - ink.shape[1]) // 2):][:, :ink.shape[1]] = ink
    return g


def write_font(path, font, glyphs, sources):
    adv, rows, cap = CELL[font]
    lines = [f'// ES PLUS LCD {font} font: traced from the official User\'s Guide screen captures.',
             '// GENERATED by scripts/lcd_from_manual.py - do not edit, do not commit (Casio-derived).',
             f'// Cells are {adv} dots wide and {rows} rows tall; rows 0-{cap - 1} sit above the baseline.',
             'export default {', f"  name: '{'large' if font == MAIN else 'small'}',",
             f'  ascent: {cap},', f'  descent: {rows - cap},', f'  lineHeight: {rows},', '  glyphs: {']
    for ch in sorted(glyphs, key=lambda c: [ord(x) for x in c]):
        g = glyphs[ch]
        w = 0 if ch in ('̄', '̂') else adv
        lines.append(f'    {json.dumps(ch, ensure_ascii=False)}: {{ w: {w}, src: {json.dumps(sources[ch])}, rows: [')
        lines += ["      '" + ''.join('#' if v else '.' for v in r) + "'," for r in g]
        lines.append('    ] },')
    lines += ['  },', '};', '']
    open(path, 'w', encoding='utf-8').write('\n'.join(lines))


# ------------------------------------------------------------------ status icons

def status_strip(name, geo, d, col0, row0):
    """Area-sample the strip above the matrix at R sub-pixels per dot (rows 0..STATUS_ROWS-1)."""
    top = geo['y0'] + geo['oy'] + (row0 + geo['kminy']) * geo['py'] - 0.5 - STATUS_ROWS * geo['py'] / R
    left = geo['x0'] + geo['ox'] + (col0 + geo['kminx']) * geo['px'] - 0.5
    out = np.zeros((STATUS_ROWS, W * R))
    for j in range(STATUS_ROWS):
        ya, yb = top + j * geo['py'] / R, top + (j + 1) * geo['py'] / R
        for i in range(W * R):
            xa, xb = left + i * geo['px'] / R, left + (i + 1) * geo['px'] / R
            acc = ws = 0.0
            for yy in range(int(np.floor(ya)), int(np.ceil(yb))):
                for xx in range(int(np.floor(xa)), int(np.ceil(xb))):
                    if 0 <= yy < d.shape[0] and 0 <= xx < d.shape[1]:
                        w_ = max(0, min(yb, yy + 1) - max(ya, yy)) * max(0, min(xb, xx + 1) - max(xa, xx))
                        acc += d[yy, xx] * w_
                        ws += w_
            out[j, i] = acc / ws if ws else 0
    return out > 0.5


def find_d(strip):
    """Column of the D icon: a 9-wide box whose top and bottom rows are solid."""
    best = None
    for x in range(D_POS - 12, D_POS + 12):
        if x < 1 or x + 10 > strip.shape[1]:
            continue
        rows = np.where(strip[:, x:x + 9].any(1))[0]
        if len(rows) < 8:
            continue
        t, bt = rows.min(), rows.max()
        score = strip[t, x:x + 9].sum() + strip[bt, x:x + 9].sum() - strip[t, x - 1] - strip[t, x + 9]             + strip[t:bt + 1, x].sum() * 0.5
        if best is None or score > best[0]:
            best = (score, x)
    return best[1]


def text_icon(word, letters):
    """Compose a text icon from letters cut out of measured icons (1 sub-pixel gap)."""
    parts = [letters[ch] for ch in word]
    width = sum(p.shape[1] for p in parts) + len(parts) - 1
    out = np.zeros((STATUS_ROWS, width), bool)
    x = 0
    for p in parts:
        out[:, x:x + p.shape[1]] = p
        x += p.shape[1] + 1
    return out


def boxed(letter_rows, d_icon):
    """S/A/R/G boxes: the D icon's box with another white letter inside."""
    icon = d_icon.copy()
    rows = np.where(icon.any(1))[0]
    t, b = rows.min(), rows.max()
    icon[t + 1:b, 1:8] = True
    for i, r in enumerate(letter_rows):
        for j, ch in enumerate(r):
            if ch == '#':
                icon[t + 1 + i, 2 + j] = False
    return icon


def build_icons(strips):
    icons = {}
    for name, (screen, a, b) in ICON_CUTS.items():
        strip, dx = strips[screen]
        win = strip[:, max(0, dx + a):dx + b + 1]
        cols = np.where(win.any(0))[0]
        if len(cols) == 0:
            continue
        icons[name] = win[:, cols.min():cols.max() + 1].copy()
        ICON_POS[name] = D_POS + (max(0, dx + a) + cols.min()) - dx   # same offset from D as in the capture
    d = icons['D']
    # white letters (5 wide x 8 tall sub-pixels) for the boxed icons
    L = {
        'S': ['.###.', '#...#', '#....', '.###.', '....#', '....#', '#...#', '.###.'],
        'A': ['..#..', '.#.#.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
        'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#', '#...#'],
        'G': ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '#...#', '.###.'],
    }
    for ch, rows in L.items():
        icons[ch] = boxed(rows, d)
    icons['▼'] = icons['▲'][::-1].copy()
    # letters cut from measured text icons, for the text icons the guide never shows
    def cut(icon, a, b):
        return icons[icon][:, a:b + 1]
    letters = {}
    for word, src in (('STAT', 'STAT'), ('CMPLX', 'CMPLX'), ('MAT', 'MAT'), ('VCT', 'VCT'), ('FIX', 'FIX')):
        ic = icons[src]
        cols = ic.any(0)
        runs, s = [], None
        for x, v in enumerate(list(cols) + [False]):
            if v and s is None:
                s = x
            if not v and s is not None:
                runs.append((s, x - 1))
                s = None
        if len(runs) == len(word):
            for ch, (a, b) in zip(word, runs):
                letters.setdefault(ch, ic[:, a:b + 1])
    def letter_from_rows(rows):
        g = np.zeros((STATUS_ROWS, len(rows[0])), bool)
        off = STATUS_ROWS - 10
        for i, r in enumerate(rows):
            for j, ch in enumerate(r):
                g[off + i, j] = ch == '#'
        return g
    extra = {
        'S': ['.###.', '##.##', '##...', '##...', '.###.', '...##', '...##', '...##', '##.##', '.###.'],
        'I': ['##', '##', '##', '##', '##', '##', '##', '##', '##', '##'],
        'O': ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
        'R': ['#####.', '##..##', '##..##', '##..##', '#####.', '####..', '##.##.', '##..##', '##..##', '##..##'],
        'D': ['####..', '##.##.', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##.##.', '####..'],
        'i': ['##', '..', '##', '##', '##', '##', '##', '##', '##', '##'],
        's': ['.....', '.....', '.###.', '##.##', '##...', '.###.', '...##', '...##', '##.##', '.###.'],
        'p': ['.....', '.....', '####.', '##.##', '##.##', '##.##', '####.', '##...', '##...', '##...'],
    }
    for ch, rows in extra.items():
        letters.setdefault(ch, letter_from_rows(rows))
    for word in ('STO', 'RCL', 'SCI', 'Disp'):
        try:
            icons[word] = text_icon(word, letters)
        except KeyError as e:
            print('icon', word, 'missing letter', e)
    if 'M' in letters:
        icons['M'] = letters['M']
    return icons


def write_icons(icons):
    lines = ['// ES PLUS status icons, cut from the official User\'s Guide screen captures.',
             '// GENERATED by scripts/lcd_from_manual.py - do not edit, do not commit (Casio-derived).',
             f'// The strip is {W * R} x {STATUS_ROWS} sub-pixels ({R} per LCD dot) and sits directly above the dot matrix.',
             f'// "measured": position and shape taken from the guide; otherwise drawn to match (position not verified).',
             'export default {', f'  scale: {R},', f'  width: {W * R},', f'  height: {STATUS_ROWS},', '  icons: {']
    for name in ICON_POS:
        if name not in icons:
            continue
        ic = icons[name]
        lines.append(f'    {json.dumps(name, ensure_ascii=False)}: {{ x: {ICON_POS[name]}, measured: {"true" if name in MEASURED_ICONS else "false"}, rows: [')
        lines += ["      '" + ''.join('#' if v else '.' for v in r) + "'," for r in ic]
        lines.append('    ] },')
    lines += ['  },', '};', '']
    open(OUT_STATUS, 'w', encoding='utf-8').write('\n'.join(lines))


# ------------------------------------------------------------------ main

def main():
    if not os.path.exists(PDF):
        sys.exit(f'Put the User\'s Guide PDF at {PDF}')
    extract_images()
    mats, strips = {}, {}
    needed_strips = {s for s, _, _ in ICON_CUTS.values()}
    for name in SCREENS:
        g, geo, d = decode(name)
        M, col0, row0 = to_matrix(g, name)
        mats[name] = M
        if name in needed_strips:
            st = status_strip(name, geo, d, col0, row0)
            strips[name] = (st, find_d(st))
        print(f'{name}: grid {g.shape}, pitch {geo["px"]:.3f}/{geo["py"]:.3f}, matrix at ({col0},{row0})', flush=True)

    traced, problems = trace(mats)
    for p in problems:
        print('PROBLEM', p)
    for f in (MAIN, SMALL):
        print('traced', f, ''.join(sorted(traced[f])))
    old = parse_font(OLD_SMALL)
    for font, designed, out in ((MAIN, DESIGNED_MAIN, OUT_MAIN), (SMALL, DESIGNED_SMALL, OUT_SMALL)):
        glyphs, sources = {}, {}
        for ch, (w, rows) in old.items():
            glyphs[ch], sources[ch] = convert_small(w, rows, font), 'converted'
        for ch, g in designed.items():
            glyphs[ch], sources[ch] = g, 'designed'
        for ch, g in traced[font].items():
            glyphs[ch], sources[ch] = g, 'traced'
        if font == MAIN and '-' in traced[MAIN] and '−' not in traced[MAIN]:
            glyphs['−'], sources['−'] = traced[MAIN]['-'], 'traced'
        glyphs[' '], sources[' '] = np.zeros((CELL[font][1], CELL[font][0]), bool), 'traced'
        write_font(out, font, glyphs, sources)
        counts = {k: list(sources.values()).count(k) for k in ('traced', 'designed', 'converted')}
        print(font, 'font:', counts, '->', os.path.relpath(out, ROOT))

    icons = build_icons(strips)
    write_icons(icons)
    print('status icons:', sorted(icons), '->', os.path.relpath(OUT_STATUS, ROOT))

    os.makedirs(OUT_REF, exist_ok=True)
    for name, spec in REFERENCES.items():
        ref = {'name': name, 'source': f'User\'s Guide capture {name}', 'what': spec['what'],
               'keys': spec['keys'], 'cursorVisible': bool(spec.get('cursor')),
               'indicators': spec['indicators'],
               'matrix': [''.join('#' if v else '.' for v in row) for row in mats[name]]}
        json.dump(ref, open(os.path.join(OUT_REF, name + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('references:', len(REFERENCES), '->', os.path.relpath(OUT_REF, ROOT))


if __name__ == '__main__':
    main()
