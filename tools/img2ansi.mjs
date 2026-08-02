#!/usr/bin/env node
// image → ANSI grid converter (koan-site spec §7.1).
// Maps each character cell's quadrant colors to the best (glyph, fg, bg) combo
// from the CP437 block/shade set over the DOS 16-color palette (iCE colors).
//
// usage: node tools/img2ansi.mjs <image> [--cols N] [--rows N] [--id name] [--title t] [-o out.json]

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename, extname } from 'node:path';

// Keep in sync with src/ansi/palette.ts (same ordering).
const PALETTE = [
  [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170],
  [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
  [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255],
  [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255],
];

// fg coverage per quadrant [TL, TR, BL, BR] — keep in sync with src/ansi/types.ts GLYPHS.
const GLYPH_COV = [
  [0, 0, 0, 0],             // 0 space
  [0.25, 0.25, 0.25, 0.25], // 1 ░
  [0.5, 0.5, 0.5, 0.5],     // 2 ▒
  [0.75, 0.75, 0.75, 0.75], // 3 ▓
  [1, 1, 1, 1],             // 4 █
  [1, 1, 0, 0],             // 5 ▀
  [0, 0, 1, 1],             // 6 ▄
  [1, 0, 1, 0],             // 7 ▌
  [0, 1, 0, 1],             // 8 ▐
];

// Dither-noise penalty: a shade glyph mixing two hue-distant colors (e.g. green
// dots over blue) matches averages numerically but reads as speckle, not as the
// mean — real ANSI shading dithers hue-adjacent / luma-adjacent pairs. Penalize
// fg↔bg CHROMA distance (opponent space, luma removed) scaled by mix amount.
const NOISE_K = 0.12;
const OP = PALETTE.map(([r, g, b]) => [r - g, g - b, b - r]);
const OP_DIST2 = OP.map((a) => OP.map((b) => {
  const d0 = a[0] - b[0];
  const d1 = a[1] - b[1];
  const d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}));

const args = process.argv.slice(2);
let input = null;
let out = null;
let id = null;
let title = null;
let cols = 120;
let rows = 0;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--cols') cols = Number(args[++i]);
  else if (a === '--rows') rows = Number(args[++i]);
  else if (a === '-o' || a === '--out') out = args[++i];
  else if (a === '--id') id = args[++i];
  else if (a === '--title') title = args[++i];
  else input = a;
}

if (!input) {
  console.error('usage: node tools/img2ansi.mjs <image> [--cols N] [--rows N] [--id name] [--title t] [-o out.json]');
  process.exit(1);
}

const t0 = Date.now();
const meta = await sharp(input).metadata();
if (!rows) {
  // character cells are 1:2 (w:h), so grid rows = cols * imageAspect / 2
  rows = Math.max(1, Math.round((cols * (meta.height / meta.width)) / 2));
}
id ??= basename(input, extname(input));
out ??= `${id}.json`;

// 2×2 samples per cell → quadrant colors.
const { data } = await sharp(input)
  .resize(cols * 2, rows * 2, { fit: 'fill' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const W2 = cols * 2;
const cells = new Array(cols * rows);
const q = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; // TL TR BL BR

for (let cy = 0; cy < rows; cy++) {
  for (let cx = 0; cx < cols; cx++) {
    for (let k = 0; k < 4; k++) {
      const px = cx * 2 + (k & 1);
      const py = cy * 2 + (k >> 1);
      const o = (py * W2 + px) * 3;
      q[k][0] = data[o];
      q[k][1] = data[o + 1];
      q[k][2] = data[o + 2];
    }
    let bestErr = Infinity;
    let best = 0;
    for (let g = 0; g < GLYPH_COV.length; g++) {
      const cov = GLYPH_COV[g];
      for (let fg = 0; fg < 16; fg++) {
        if (g === 0 && fg > 0) break; // space: fg irrelevant
        const F = PALETTE[fg];
        // mix amount c(1-c) is equal in all 4 quadrants for shades, 0 for solids/halves
        const mixAmt = g >= 1 && g <= 3 ? GLYPH_COV[g][0] * (1 - GLYPH_COV[g][0]) : 0;
        for (let bg = 0; bg < 16; bg++) {
          if (g === 4 && bg > 0) break; // █: bg irrelevant
          const B = PALETTE[bg];
          let err = NOISE_K * mixAmt * 4 * OP_DIST2[fg][bg];
          for (let k = 0; k < 4; k++) {
            const c = cov[k];
            const dr = F[0] * c + B[0] * (1 - c) - q[k][0];
            const dg = F[1] * c + B[1] * (1 - c) - q[k][1];
            const db = F[2] * c + B[2] * (1 - c) - q[k][2];
            err += dr * dr * 2 + dg * dg * 4 + db * db * 3;
            if (err >= bestErr) break;
          }
          if (err < bestErr) {
            bestErr = err;
            best = (g << 8) | (fg << 4) | bg;
          }
        }
      }
    }
    cells[cy * cols + cx] = best;
  }
}

const art = { id, title: title ?? id, cols, rows, fps: 0, frames: [cells] };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(art));
console.log(`${input} → ${out}  (${cols}×${rows}, ${Date.now() - t0}ms)`);
