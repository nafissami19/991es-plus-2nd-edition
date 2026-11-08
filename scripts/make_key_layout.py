import json
import os

key_entries = [
  # Row 0
  {
    "name": "SHIFT",
    "rect": {"x": 99, "y": 479, "w": 49, "h": 49},
    "primary": "SHIFT",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "grey",
    "labelColor": "#F8D060",
    "shortcuts": ["F1", "s", "S"]
  },
  {
    "name": "ALPHA",
    "rect": {"x": 169, "y": 479, "w": 49, "h": 49},
    "primary": "ALPHA",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "grey",
    "labelColor": "#F87878",
    "shortcuts": ["F2", "a", "A"]
  },
  {
    "name": "UP",
    "rect": {"x": 298, "y": 450, "w": 49, "h": 45},
    "primary": "▲",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "dpad",
    "keycap": "silver",
    "shortcuts": ["ArrowUp", "Up"]
  },
  {
    "name": "LEFT",
    "rect": {"x": 236, "y": 498, "w": 45, "h": 49},
    "primary": "◀",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "dpad",
    "keycap": "silver",
    "shortcuts": ["ArrowLeft", "Left"]
  },
  {
    "name": "RIGHT",
    "rect": {"x": 366, "y": 498, "w": 45, "h": 49},
    "primary": "▶",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "dpad",
    "keycap": "silver",
    "shortcuts": ["ArrowRight", "Right"]
  },
  {
    "name": "DOWN",
    "rect": {"x": 298, "y": 546, "w": 49, "h": 45},
    "primary": "▼",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "dpad",
    "keycap": "silver",
    "shortcuts": ["ArrowDown", "Down"]
  },
  {
    "name": "MODE",
    "rect": {"x": 427, "y": 479, "w": 49, "h": 49},
    "primary": "MODE",
    "shift": "SETUP",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "grey",
    "shortcuts": ["F3", "Home", "m"]
  },
  {
    "name": "ON",
    "rect": {"x": 496, "y": 479, "w": 49, "h": 49},
    "primary": "ON",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "grey",
    "shortcuts": ["F4"]
  },

  # Row 1 (4 keys)
  {
    "name": "CALC",
    "rect": {"x": 94, "y": 575, "w": 68, "h": 40},
    "primary": "CALC",
    "shift": "SOLVE",
    "alpha": "=",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["c", "C"]
  },
  {
    "name": "INTEGRAL",
    "rect": {"x": 172, "y": 575, "w": 68, "h": 40},
    "primary": "∫dx",
    "shift": "d/dx",
    "alpha": ":",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["i", "I"]
  },
  {
    "name": "RECIP",
    "rect": {"x": 406, "y": 575, "w": 68, "h": 40},
    "primary": "x⁻¹",
    "shift": "x!",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["x", "X"]
  },
  {
    "name": "LOGBASE",
    "rect": {"x": 484, "y": 575, "w": 68, "h": 40},
    "primary": "log■□",
    "shift": "Σ",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["l"]
  },

  # Row 2 (6 keys)
  {
    "name": "FRAC",
    "rect": {"x": 94, "y": 640, "w": 68, "h": 40},
    "primary": "■/□",
    "shift": "■■/□",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["f", "F"]
  },
  {
    "name": "SQRT",
    "rect": {"x": 172, "y": 640, "w": 68, "h": 40},
    "primary": "√■",
    "shift": "∛■",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["q", "Q"]
  },
  {
    "name": "SQUARE",
    "rect": {"x": 250, "y": 640, "w": 68, "h": 40},
    "primary": "x²",
    "shift": "x³",
    "alpha": "",
    "mode": "DEC",
    "modeColor": "#70C0F8",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["@"]
  },
  {
    "name": "POWER",
    "rect": {"x": 329, "y": 640, "w": 68, "h": 40},
    "primary": "x^■",
    "shift": "■√□",
    "alpha": "",
    "mode": "HEX",
    "modeColor": "#70C0F8",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["^"]
  },
  {
    "name": "LOG",
    "rect": {"x": 406, "y": 640, "w": 68, "h": 40},
    "primary": "log",
    "shift": "10^■",
    "alpha": "",
    "mode": "BIN",
    "modeColor": "#70C0F8",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["L"]
  },
  {
    "name": "LN",
    "rect": {"x": 484, "y": 640, "w": 68, "h": 40},
    "primary": "ln",
    "shift": "e^■",
    "alpha": "",
    "mode": "OCT",
    "modeColor": "#70C0F8",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["n", "N"]
  },

  # Row 3 (6 keys)
  {
    "name": "NEG",
    "rect": {"x": 94, "y": 706, "w": 68, "h": 40},
    "primary": "(−)",
    "shift": "∠",
    "shiftColor": "#B080F0",
    "alpha": "A",
    "mode": "A",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["_"]
  },
  {
    "name": "DMS",
    "rect": {"x": 172, "y": 706, "w": 68, "h": 40},
    "primary": "° ' \"",
    "shift": "←",
    "alpha": "B",
    "mode": "B",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["'"]
  },
  {
    "name": "HYP",
    "rect": {"x": 250, "y": 706, "w": 68, "h": 40},
    "primary": "hyp",
    "shift": "Abs",
    "alpha": "C",
    "mode": "C",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["h", "H"]
  },
  {
    "name": "SIN",
    "rect": {"x": 329, "y": 706, "w": 68, "h": 40},
    "primary": "sin",
    "shift": "sin⁻¹",
    "alpha": "D",
    "mode": "D",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["s"]
  },
  {
    "name": "COS",
    "rect": {"x": 406, "y": 706, "w": 68, "h": 40},
    "primary": "cos",
    "shift": "cos⁻¹",
    "alpha": "E",
    "mode": "E",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["o", "O"]
  },
  {
    "name": "TAN",
    "rect": {"x": 484, "y": 706, "w": 68, "h": 40},
    "primary": "tan",
    "shift": "tan⁻¹",
    "alpha": "F",
    "mode": "F",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["t", "T"]
  },

  # Row 4 (6 keys)
  {
    "name": "RCL",
    "rect": {"x": 94, "y": 772, "w": 68, "h": 40},
    "primary": "RCL",
    "shift": "STO",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["r", "R"]
  },
  {
    "name": "ENG",
    "rect": {"x": 172, "y": 772, "w": 68, "h": 40},
    "primary": "ENG",
    "shift": "←",
    "alpha": "i",
    "alphaColor": "#B080F0",
    "mode": "i",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["e", "E"]
  },
  {
    "name": "LPAREN",
    "rect": {"x": 250, "y": 772, "w": 68, "h": 40},
    "primary": "(",
    "shift": "%",
    "alpha": "",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["("]
  },
  {
    "name": "RPAREN",
    "rect": {"x": 329, "y": 772, "w": 68, "h": 40},
    "primary": ")",
    "shift": ",",
    "alpha": "X",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": [")"]
  },
  {
    "name": "SD",
    "rect": {"x": 406, "y": 772, "w": 68, "h": 40},
    "primary": "S⇔D",
    "shift": "ab/c⇔d/c",
    "alpha": "Y",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["v", "V"]
  },
  {
    "name": "MPLUS",
    "rect": {"x": 484, "y": 772, "w": 68, "h": 40},
    "primary": "M+",
    "shift": "M−",
    "alpha": "M",
    "mode": "",
    "type": "function",
    "keycap": "dark",
    "shortcuts": ["m"]
  },

  # Row 5 (5 keys)
  {
    "name": "7",
    "rect": {"x": 96, "y": 841, "w": 80, "h": 56},
    "primary": "7",
    "shift": "CONST",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["7"]
  },
  {
    "name": "8",
    "rect": {"x": 189, "y": 841, "w": 80, "h": 56},
    "primary": "8",
    "shift": "CONV",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["8"]
  },
  {
    "name": "9",
    "rect": {"x": 282, "y": 841, "w": 80, "h": 56},
    "primary": "9",
    "shift": "CLR",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["9"]
  },
  {
    "name": "DEL",
    "rect": {"x": 375, "y": 841, "w": 80, "h": 56},
    "primary": "DEL",
    "shift": "INS",
    "alpha": "",
    "mode": "",
    "type": "action",
    "keycap": "lime",
    "shortcuts": ["Backspace", "Delete"]
  },
  {
    "name": "AC",
    "rect": {"x": 468, "y": 841, "w": 80, "h": 56},
    "primary": "AC",
    "shift": "OFF",
    "alpha": "",
    "mode": "",
    "type": "action",
    "keycap": "lime",
    "shortcuts": ["Tab", " ", "Escape"]
  },

  # Row 6 (5 keys)
  {
    "name": "4",
    "rect": {"x": 96, "y": 921, "w": 80, "h": 56},
    "primary": "4",
    "shift": "[MATRIX]",
    "shiftColor": "#FFFFFF",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["4"]
  },
  {
    "name": "5",
    "rect": {"x": 189, "y": 921, "w": 80, "h": 56},
    "primary": "5",
    "shift": "[VECTOR]",
    "shiftColor": "#FFFFFF",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["5"]
  },
  {
    "name": "6",
    "rect": {"x": 282, "y": 921, "w": 80, "h": 56},
    "primary": "6",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["6"]
  },
  {
    "name": "MUL",
    "rect": {"x": 375, "y": 921, "w": 80, "h": 56},
    "primary": "×",
    "shift": "nPr",
    "alpha": "",
    "mode": "",
    "type": "operator",
    "keycap": "dark",
    "shortcuts": ["*"]
  },
  {
    "name": "DIV",
    "rect": {"x": 468, "y": 921, "w": 80, "h": 56},
    "primary": "÷",
    "shift": "nCr",
    "alpha": "",
    "mode": "",
    "type": "operator",
    "keycap": "dark",
    "shortcuts": ["/"]
  },

  # Row 7 (5 keys)
  {
    "name": "1",
    "rect": {"x": 96, "y": 1001, "w": 80, "h": 56},
    "primary": "1",
    "shift": "[STAT]",
    "shiftColor": "#FFFFFF",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["1"]
  },
  {
    "name": "2",
    "rect": {"x": 189, "y": 1001, "w": 80, "h": 56},
    "primary": "2",
    "shift": "[CMPLX]",
    "shiftColor": "#FFFFFF",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["2"]
  },
  {
    "name": "3",
    "rect": {"x": 282, "y": 1001, "w": 80, "h": 56},
    "primary": "3",
    "shift": "[BASE]",
    "shiftColor": "#FFFFFF",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["3"]
  },
  {
    "name": "ADD",
    "rect": {"x": 375, "y": 1001, "w": 80, "h": 56},
    "primary": "+",
    "shift": "Pol",
    "alpha": "",
    "mode": "",
    "type": "operator",
    "keycap": "dark",
    "shortcuts": ["+"]
  },
  {
    "name": "SUB",
    "rect": {"x": 468, "y": 1001, "w": 80, "h": 56},
    "primary": "−",
    "shift": "Rec",
    "alpha": "",
    "mode": "",
    "type": "operator",
    "keycap": "dark",
    "shortcuts": ["-"]
  },

  # Row 8 (5 keys)
  {
    "name": "0",
    "rect": {"x": 96, "y": 1081, "w": 80, "h": 56},
    "primary": "0",
    "shift": "Rnd",
    "alpha": "",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["0"]
  },
  {
    "name": "DOT",
    "rect": {"x": 189, "y": 1081, "w": 80, "h": 56},
    "primary": ".",
    "shift": "Ran#",
    "alpha": "RanInt#",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["."]
  },
  {
    "name": "EXP10",
    "rect": {"x": 282, "y": 1081, "w": 80, "h": 56},
    "primary": "×10ˣ",
    "shift": "π",
    "alpha": "e",
    "mode": "",
    "type": "number",
    "keycap": "grey",
    "shortcuts": ["p", "P", "E"]
  },
  {
    "name": "ANS",
    "rect": {"x": 375, "y": 1081, "w": 80, "h": 56},
    "primary": "Ans",
    "shift": "DRG▸",
    "alpha": "",
    "mode": "",
    "type": "action",
    "keycap": "grey",
    "shortcuts": ["Ans", "ans"]
  },
  {
    "name": "EXE",
    "rect": {"x": 468, "y": 1081, "w": 80, "h": 56},
    "primary": "=",
    "shift": "",
    "alpha": "",
    "mode": "",
    "type": "action",
    "keycap": "dark",
    "shortcuts": ["Enter", "="]
  }
]

os.makedirs('assets/data', exist_ok=True)
with open('assets/data/key_layout.json', 'w', encoding='utf-8') as f:
    json.dump(key_entries, f, indent=2, ensure_ascii=False)

print(f"Generated assets/data/key_layout.json with exactly {len(key_entries)} entries.")

lcd_config = {
  "faceplate": {
    "width": 644,
    "height": 1250,
    "cushionColor": "#3A3D40",
    "bodyColor": "#4D4D4D"
  },
  "display": {
    "x": 130,
    "y": 256,
    "width": 384,
    "height": 124,
    "matrixWidth": 96,
    "matrixHeight": 31,
    "scale": 4,
    "backgroundColor": "#D6E3D6",
    "pixelOnColor": "#1A221A",
    "pixelOffColor": "#C8D7C8"
  },
  "statusBar": {
    "x": 130,
    "y": 236,
    "width": 384,
    "height": 18,
    "indicators": [
      "S", "A", "M", "STO", "RCL", "STAT", "CMPLX", "MAT", "VCT",
      "D", "R", "G", "FIX", "SCI", "Math", "▼", "▲", "Disp"
    ]
  },
  "modes": [
    {"id": 1, "name": "COMP", "code": "1"},
    {"id": 2, "name": "CMPLX", "code": "2"},
    {"id": 3, "name": "STAT", "code": "3"},
    {"id": 4, "name": "BASE-N", "code": "4"},
    {"id": 5, "name": "EQN", "code": "5"},
    {"id": 6, "name": "MATRIX", "code": "6"},
    {"id": 7, "name": "TABLE", "code": "7"},
    {"id": 8, "name": "VECTOR", "code": "8"}
  ]
}

with open('assets/data/lcd_config.json', 'w', encoding='utf-8') as f:
    json.dump(lcd_config, f, indent=2, ensure_ascii=False)

print("Generated assets/data/lcd_config.json.")
