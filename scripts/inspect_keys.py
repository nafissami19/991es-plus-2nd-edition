import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sami6\OneDrive\Desktop\Casio 991ex duplicate\assets\data\key_layout.json', 'r', encoding='utf-8', errors='ignore') as f:
    keys = json.load(f)

print(f"Total keys in EX: {len(keys)}")
for i, k in enumerate(keys):
    name = k.get('name')
    rect = k.get('rect')
    primary = k.get('primary')
    shift = k.get('shift')
    alpha = k.get('alpha')
    print(f"{i:2d}: {name:10s} primary={primary:8s} shift={shift:8s} alpha={alpha:6s} rect={rect}")
