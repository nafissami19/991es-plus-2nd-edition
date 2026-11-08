import json
import os

with open('assets/data/key_layout.json', 'r', encoding='utf-8') as f:
    keys = json.load(f)

svg_parts = []
svg_parts.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 644 1250" width="644" height="1250">')
svg_parts.append('<defs>')
svg_parts.append('''
  <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#4A4E54" />
    <stop offset="50%" stop-color="#3A3D42" />
    <stop offset="100%" stop-color="#2C2E33" />
  </linearGradient>
  <linearGradient id="lcdBezel" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#1A1C1E" />
    <stop offset="100%" stop-color="#2A2D30" />
  </linearGradient>
  <linearGradient id="solarCell" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#2D1F1D" />
    <stop offset="33%" stop-color="#4A2F2A" />
    <stop offset="66%" stop-color="#2D1F1D" />
    <stop offset="100%" stop-color="#4A2F2A" />
  </linearGradient>
  <linearGradient id="keyDark" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#2F3238" />
    <stop offset="100%" stop-color="#18191C" />
  </linearGradient>
  <linearGradient id="keyGrey" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#8E939C" />
    <stop offset="100%" stop-color="#686C74" />
  </linearGradient>
  <linearGradient id="keyLime" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#9DE024" />
    <stop offset="100%" stop-color="#76A816" />
  </linearGradient>
  <linearGradient id="dpadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#A5ACB5" />
    <stop offset="50%" stop-color="#7B818A" />
    <stop offset="100%" stop-color="#555A61" />
  </linearGradient>
  <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.4"/>
  </filter>
  <filter id="keyShadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.35"/>
  </filter>
''')
svg_parts.append('</defs>')

# Outer body
svg_parts.append('<rect x="12" y="12" width="620" height="1226" rx="42" ry="42" fill="url(#bodyGrad)" stroke="#222428" stroke-width="4" filter="url(#dropShadow)" />')
svg_parts.append('<rect x="22" y="22" width="600" height="1206" rx="36" ry="36" fill="none" stroke="#5A5F68" stroke-width="1.5" opacity="0.6"/>')

# Header branding
svg_parts.append('<text x="56" y="92" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="28" fill="#ECEFF4" letter-spacing="2">SCIENTIFIC</text>')
svg_parts.append('<text x="56" y="120" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#A0A8B4" letter-spacing="1">NATURAL-V.P.A.M.</text>')
svg_parts.append('<text x="56" y="142" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="17" fill="#F8D060">fx-991ES PLUS</text>')
svg_parts.append('<text x="186" y="142" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#D8DEE9">2nd edition</text>')
svg_parts.append('<text x="56" y="162" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#8892B0">TWO WAY POWER</text>')

# Solar Cell Graphic
svg_parts.append('<g transform="translate(420, 75)">')
svg_parts.append('<rect x="0" y="0" width="140" height="42" rx="4" fill="url(#solarCell)" stroke="#1C1E20" stroke-width="2"/>')
for sx in [35, 70, 105]:
    svg_parts.append(f'<line x1="{sx}" y1="0" x2="{sx}" y2="42" stroke="#664433" stroke-width="1"/>')
svg_parts.append('</g>')

# LCD Bezel & Display window
svg_parts.append('<rect x="110" y="200" width="424" height="200" rx="14" fill="url(#lcdBezel)" stroke="#111315" stroke-width="3" />')
svg_parts.append('<rect x="126" y="222" width="392" height="158" rx="6" fill="#D6E3D6" stroke="#9EA89E" stroke-width="1.5" />')

# LCD inner status row area indicator placeholder
svg_parts.append('<rect x="130" y="226" width="384" height="18" fill="#CDD9CD" opacity="0.6"/>')
# LCD dot matrix 96x31 area placeholder
svg_parts.append('<rect x="130" y="246" width="384" height="124" fill="#D6E3D6"/>')

# Decorative D-pad circular outer ring
svg_parts.append('<circle cx="322.5" cy="520.5" r="70" fill="#2A2D32" stroke="#1A1C1E" stroke-width="2"/>')
svg_parts.append('<circle cx="322.5" cy="520.5" r="64" fill="url(#dpadGrad)" filter="url(#dropShadow)"/>')
svg_parts.append('<circle cx="322.5" cy="520.5" r="28" fill="#35383E"/>')

# Render keys from key_layout.json
for k in keys:
    name = k['name']
    rect = k['rect']
    x, y, w, h = rect['x'], rect['y'], rect['w'], rect['h']
    keycap = k.get('keycap', 'dark')
    primary = k.get('primary', '')
    shift = k.get('shift', '')
    alpha = k.get('alpha', '')
    mode = k.get('mode', '')

    # Printed legends above key
    if shift:
        sc = k.get('shiftColor', '#F8D060')
        svg_parts.append(f'<text x="{x + 2}" y="{y - 6}" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="{sc}">{shift}</text>')
    if alpha:
        ac = k.get('alphaColor', '#F87878')
        svg_parts.append(f'<text x="{x + w - 4}" y="{y - 6}" text-anchor="end" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="{ac}">{alpha}</text>')
    if mode and not shift and not alpha:
        mc = k.get('modeColor', '#70C0F8')
        svg_parts.append(f'<text x="{x + w//2}" y="{y - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="{mc}">{mode}</text>')
    elif mode and mode in ['DEC', 'HEX', 'BIN', 'OCT']:
        mc = k.get('modeColor', '#70C0F8')
        svg_parts.append(f'<text x="{x + w - 2}" y="{y + h + 14}" text-anchor="end" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="{mc}">{mode}</text>')

    # Key body
    fill_grad = "url(#keyDark)"
    text_color = "#FFFFFF"
    if keycap == 'lime':
        fill_grad = "url(#keyLime)"
        text_color = "#FFFFFF"
    elif keycap == 'grey':
        fill_grad = "url(#keyGrey)"
        text_color = "#FFFFFF"
    elif keycap == 'silver':
        fill_grad = "url(#dpadGrad)"
        text_color = "#111111"

    if k['type'] == 'dpad':
        # D-pad segment buttons
        svg_parts.append(f'<g class="calc-key" data-key="{name}">')
        svg_parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="transparent"/>')
        svg_parts.append(f'<text x="{x + w/2}" y="{y + h/2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#1C1E20">{primary}</text>')
        svg_parts.append('</g>')
    elif k['name'] in ['SHIFT', 'ALPHA', 'MODE', 'ON']:
        # Round keys
        r = w / 2
        svg_parts.append(f'<g class="calc-key" data-key="{name}" filter="url(#keyShadow)">')
        svg_parts.append(f'<circle cx="{x + r}" cy="{y + r}" r="{r}" fill="{fill_grad}" stroke="#1E2024" stroke-width="1.5"/>')
        label_color = k.get('labelColor', text_color)
        font_size = "11" if len(primary) > 3 else "13"
        svg_parts.append(f'<text x="{x + r}" y="{y + r + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="{font_size}" fill="{label_color}">{primary}</text>')
        svg_parts.append('</g>')
    else:
        # Standard rectangular keys
        rx = 10 if h > 50 else 6
        svg_parts.append(f'<g class="calc-key" data-key="{name}" filter="url(#keyShadow)">')
        svg_parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill_grad}" stroke="#1C1E22" stroke-width="1.5"/>')
        font_size = "20" if k['type'] == 'number' else ("14" if len(primary) <= 4 else "12")
        svg_parts.append(f'<text x="{x + w/2}" y="{y + h/2 + (7 if k["type"]=="number" else 4)}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="{font_size}" fill="{text_color}">{primary}</text>')
        svg_parts.append('</g>')

svg_parts.append('</svg>')

os.makedirs('assets/faceplate', exist_ok=True)
with open('assets/faceplate/faceplate.svg', 'w', encoding='utf-8') as f:
    f.write('\n'.join(svg_parts))

print("Generated assets/faceplate/faceplate.svg successfully.")
