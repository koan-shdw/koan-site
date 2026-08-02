#!/usr/bin/env node
// Generates two original placeholder source images for the background library
// (until the real artwork batch exists — spec open item 4). Pure math, no
// third-party art. Output: tools/samples/*.png, then fed to img2ansi.
//
// Run from the repo root: node tools/gen-placeholders.mjs

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('tools/samples', { recursive: true });

// Seeded LCG so the placeholders are reproducible.
let seed = 1337;
const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const lerp = (a, b, t) => a + (b - a) * t;

async function sunsetGrid() {
  const W = 480;
  const H = 240;
  const HZ = 150; // horizon row
  const buf = Buffer.alloc(W * H * 3);
  const put = (x, y, r, g, b) => {
    const o = (y * W + x) * 3;
    buf[o] = r;
    buf[o + 1] = g;
    buf[o + 2] = b;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r;
      let g;
      let b;
      if (y < HZ) {
        const t = y / HZ;
        if (t < 0.55) {
          const u = t / 0.55; // deep purple → magenta
          r = lerp(24, 200, u);
          g = lerp(0, 30, u);
          b = lerp(48, 140, u);
        } else {
          const u = (t - 0.55) / 0.45; // magenta → orange
          r = lerp(200, 255, u);
          g = lerp(30, 150, u);
          b = lerp(140, 50, u);
        }
        if (t < 0.35 && rand() < 0.0012) {
          r = g = b = 255; // stars
        }
      } else {
        const t = (y - HZ) / (H - HZ);
        r = 6;
        g = 4;
        b = 18 + 10 * t;
      }
      put(x, y, r | 0, g | 0, b | 0);
    }
  }

  // sun disc with the classic synthwave gap stripes in its lower half
  const cx = 240;
  const cy = 132;
  const R = 64;
  for (let y = Math.max(0, cy - R); y <= Math.min(HZ - 1, cy + R); y++) {
    for (let x = cx - R; x <= cx + R; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R) continue;
      const bandY = y - (cy - R);
      if (y > cy - 10 && bandY % 14 >= 10) continue;
      const u = bandY / (2 * R);
      put(x, y, 255, lerp(240, 90, u) | 0, lerp(180, 120, u) | 0);
    }
  }

  // perspective grid floor
  for (let k = 1; k < 10; k++) {
    const gy = HZ + Math.round(k * k * 1.05);
    if (gy >= H) break;
    const glow = 1 - k / 12;
    for (let x = 0; x < W; x++) put(x, gy, 0, (230 * glow) | 0, (210 * glow) | 0);
  }
  for (const m of [-2.6, -1.6, -1, -0.62, -0.36, -0.16, 0, 0.16, 0.36, 0.62, 1, 1.6, 2.6]) {
    for (let y = HZ; y < H; y++) {
      const x = Math.round(240 + m * (y - HZ) * 2.4);
      const glow = Math.min(1, (y - HZ) / 40 + 0.25);
      if (x >= 0 && x < W) put(x, y, 0, (230 * glow) | 0, (210 * glow) | 0);
      if (x + 1 >= 0 && x + 1 < W) put(x + 1, y, 0, (150 * glow) | 0, (140 * glow) | 0);
    }
  }

  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toFile('tools/samples/sunset-grid.png');
  console.log('tools/samples/sunset-grid.png');
}

async function ionwave() {
  const W = 400;
  const H = 250;
  const buf = Buffer.alloc(W * H * 3);
  const sources = [
    [90, 70, 0],
    [300, 60, 2],
    [200, 210, 4],
  ];
  const stops = [
    [2, 4, 16],
    [8, 18, 90],
    [20, 80, 200],
    [60, 200, 255],
    [235, 255, 255],
  ];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 0.6 * Math.sin(x / 23) + 0.4 * Math.sin(y / 17);
      for (const [sx, sy, ph] of sources) v += Math.sin(Math.hypot(x - sx, y - sy) / 7 - ph);
      let n = Math.min(1, Math.max(0, (v + 3) / 6));
      n = n ** 1.15;
      const seg = Math.min(stops.length - 2, Math.floor(n * (stops.length - 1)));
      const u = n * (stops.length - 1) - seg;
      const o = (y * W + x) * 3;
      buf[o] = lerp(stops[seg][0], stops[seg + 1][0], u) | 0;
      buf[o + 1] = lerp(stops[seg][1], stops[seg + 1][1], u) | 0;
      buf[o + 2] = lerp(stops[seg][2], stops[seg + 1][2], u) | 0;
      if (rand() < 0.001) {
        buf[o] = buf[o + 1] = buf[o + 2] = 255;
      }
    }
  }

  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toFile('tools/samples/ionwave.png');
  console.log('tools/samples/ionwave.png');
}

await sunsetGrid();
await ionwave();
