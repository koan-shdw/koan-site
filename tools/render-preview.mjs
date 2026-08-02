#!/usr/bin/env node
// Renders library JSON entries to PNG previews (frame 0) — same cell geometry
// as src/ansi/glyphs.ts, so what you see is what the engine draws.
//
// usage: node tools/render-preview.mjs src/library/foo.json [...more]

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

// Keep in sync with src/ansi/palette.ts.
const PALETTE = [
  [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170],
  [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
  [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255],
  [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255],
];
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const SHADE_T = [0, 4, 8, 12];
const CW = 8;
const CH = 16;

for (const file of process.argv.slice(2)) {
  const art = JSON.parse(readFileSync(file, 'utf8'));
  const W = art.cols * CW;
  const H = art.rows * CH;
  const buf = Buffer.alloc(W * H * 3);
  const cells = art.frames[0];

  for (let cy = 0; cy < art.rows; cy++) {
    for (let cx = 0; cx < art.cols; cx++) {
      const packed = cells[cy * art.cols + cx];
      const g = (packed >> 8) & 0xf;
      const F = PALETTE[(packed >> 4) & 0xf];
      const B = PALETTE[packed & 0xf];
      for (let py = 0; py < CH; py++) {
        for (let px = 0; px < CW; px++) {
          let useFg = false;
          switch (g) {
            case 0: break;
            case 4: useFg = true; break;
            case 5: useFg = py < CH / 2; break;
            case 6: useFg = py >= CH / 2; break;
            case 7: useFg = px < CW / 2; break;
            case 8: useFg = px >= CW / 2; break;
            default: useFg = BAYER[py & 3][px & 3] < SHADE_T[g];
          }
          const c = useFg ? F : B;
          const o = ((cy * CH + py) * W + (cx * CW + px)) * 3;
          buf[o] = c[0];
          buf[o + 1] = c[1];
          buf[o + 2] = c[2];
        }
      }
    }
  }

  const out = `tools/samples/${basename(file, '.json')}.preview.png`;
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(out);
  // Half-scale with a real filter — averages the dither like distance viewing
  // does. Judge color by THIS one; 1:1 dither aliases in most image viewers.
  const far = `tools/samples/${basename(file, '.json')}.preview-far.png`;
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .resize(Math.round(W / 2), Math.round(H / 2), { kernel: 'lanczos3' })
    .png()
    .toFile(far);
  console.log(out, '+', far);
}
