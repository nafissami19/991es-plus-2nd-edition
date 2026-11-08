"""
Copy the real fx-991ES PLUS 2nd edition faceplate picture out of your installed official emulator
into assets/images/faceplate.png (git-ignored: it is Casio's artwork, for personal use only).

The emulator keeps the faceplate as an ordinary Windows bitmap resource (id 103) in
fxESPLUS2_P2.dll. Nothing is decrypted or patched; the DLL is only read.

Run:  python scripts/extract_faceplate.py [path-to-emulator-folder]
Needs: pefile, pillow.
"""

import io
import os
import struct
import sys

import pefile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'images', 'faceplate.png')
CANDIDATES = [
    r'C:\Program Files (x86)\CASIO\fx-ES PLUS Emulator Subscription\fx-570ES_991ES PLUS 2nd edition Emulator',
    os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'fx-570ES_991ES PLUS 2nd edition Emulator'),
    os.path.join(os.path.expanduser('~'), 'Desktop', 'fx-570ES_991ES PLUS 2nd edition Emulator'),
]


def dib_to_image(raw):
    header = struct.unpack('<I', raw[:4])[0]
    bpp = struct.unpack('<H', raw[14:16])[0]
    used = struct.unpack('<I', raw[32:36])[0]
    colours = used or (1 << bpp if bpp <= 8 else 0)
    offset = 14 + header + colours * 4
    return Image.open(io.BytesIO(b'BM' + struct.pack('<IHHI', 14 + len(raw), 0, 0, offset) + raw))


def main():
    folders = sys.argv[1:] or CANDIDATES
    dll = next((os.path.join(f, 'fxESPLUS2_P2.dll') for f in folders
                if os.path.exists(os.path.join(f, 'fxESPLUS2_P2.dll'))), None)
    if not dll:
        sys.exit('fxESPLUS2_P2.dll not found; pass the emulator folder as an argument')
    pe = pefile.PE(dll)
    for rtype in pe.DIRECTORY_ENTRY_RESOURCE.entries:
        if rtype.struct.Id != pefile.RESOURCE_TYPE['RT_BITMAP']:
            continue
        for res in rtype.directory.entries:
            if res.struct.Id != 103:
                continue
            for lang in res.directory.entries:
                data = pe.get_data(lang.data.struct.OffsetToData, lang.data.struct.Size)
                img = dib_to_image(data).convert('RGB')
                os.makedirs(os.path.dirname(OUT), exist_ok=True)
                img.save(OUT)
                print(f'faceplate {img.size[0]}x{img.size[1]} -> {os.path.relpath(OUT, ROOT)}')
                return
    sys.exit('faceplate bitmap (id 103) not found in ' + dll)


if __name__ == '__main__':
    main()
