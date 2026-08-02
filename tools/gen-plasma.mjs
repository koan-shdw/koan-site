#!/usr/bin/env node
// Generates a looping ANSI animation entry directly as grid data (spec §7.2 —
// pre-rendered loops, stored as per-frame grid instructions, not video).
// Classic plasma, seamless: every time term is an integer multiple of the
// loop phase, so frame N wraps perfectly to frame 0.
//
// Run from the repo root: node tools/gen-plasma.mjs

import { writeFileSync, mkdirSync } from 'node:fs';

const COLS = 64;
const ROWS = 36;
const FRAMES = 24;
const FPS = 12;

// Color ramp: black → blue → magenta → light magenta → light cyan → white,
// each pair bridged by ░▒▓ shades (fg = next color over bg = previous).
const SEQ = [0, 1, 5, 13, 11, 15];
const steps = [{ g: 0, fg: 0, bg: SEQ[0] }];
for (let i = 0; i < SEQ.length - 1; i++) {
  const a = SEQ[i];
  const b = SEQ[i + 1];
  steps.push({ g: 1, fg: b, bg: a }, { g: 2, fg: b, bg: a }, { g: 3, fg: b, bg: a }, { g: 4, fg: b, bg: 0 });
}

const frames = [];
for (let f = 0; f < FRAMES; f++) {
  const t = (f / FRAMES) * Math.PI * 2;
  const cells = new Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v =
        Math.sin(x * 0.3 + t) +
        Math.sin(y * 0.45 - t) +
        Math.sin((x + y) * 0.18 + 2 * t) +
        Math.sin(Math.hypot(x - COLS / 2, y - ROWS / 2) * 0.35 - t);
      const n = Math.min(1, Math.max(0, (v + 4) / 8));
      const s = steps[Math.round(n * (steps.length - 1))];
      cells[y * COLS + x] = (s.g << 8) | (s.fg << 4) | s.bg;
    }
  }
  frames.push(cells);
}

const art = { id: 'plasma-loop', title: 'PLASMA//LOOP', cols: COLS, rows: ROWS, fps: FPS, frames };
mkdirSync('src/library', { recursive: true });
writeFileSync('src/library/plasma-loop.json', JSON.stringify(art));
console.log(`src/library/plasma-loop.json  (${COLS}×${ROWS}, ${FRAMES} frames @ ${FPS}fps)`);
