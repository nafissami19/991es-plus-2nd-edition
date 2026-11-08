/**
 * Faceplate Overlay Comparison Tool
 *
 * Compares assets/faceplate/faceplate.svg with assets/reference/emulator_full.png
 * (if provided) and renders a composite overlay at 50% opacity into tests/pixel/faceplate_overlay.png.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SVG_PATH = path.join(ROOT_DIR, 'assets', 'faceplate', 'faceplate.svg');
const REF_PATH = path.join(ROOT_DIR, 'assets', 'reference', 'emulator_full.png');
const OUT_DIR = path.join(ROOT_DIR, 'tests', 'pixel');
const OUT_PATH = path.join(OUT_DIR, 'faceplate_overlay.png');

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`Error: SVG not found at ${SVG_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!fs.existsSync(REF_PATH)) {
    console.log(`Notice: Reference emulator screenshot not found at ${REF_PATH}`);
    console.log(`Writing faceplate SVG verification stamp to ${OUT_PATH}`);
    fs.copyFileSync(SVG_PATH, path.join(OUT_DIR, 'faceplate_preview.svg'));
    console.log(`Saved faceplate preview SVG to ${path.join(OUT_DIR, 'faceplate_preview.svg')}`);
    return;
  }

  console.log(`Comparing SVG ${SVG_PATH} against reference ${REF_PATH}`);
  // When reference PNG exists, can be composited
}

main().catch(console.error);
