#!/usr/bin/env node
// .ans (CP437 + ANSI SGR) → library JSON — the drop-in path for art made in
// KOAN.ansi. The site draws 9 glyphs over the DOS 16 (src/ansi/types.ts), so
// a file only converts losslessly if it stays inside that set; anything else
// is reported and refused rather than silently flattened.
//
// usage: node tools/ans2json.mjs <file.ans> [--id name] [--title t] [-o out.json]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename, extname } from 'node:path';

// CP437 byte → GLYPHS index. Keep in sync with src/ansi/types.ts.
const GLYPH = { 0x20: 0, 0xb0: 1, 0xb1: 2, 0xb2: 3, 0xdb: 4, 0xdf: 5, 0xdc: 6, 0xdd: 7, 0xde: 8 };

const args = process.argv.slice(2);
let input = null;
let out = null;
let id = null;
let title = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-o' || a === '--out') out = args[++i];
  else if (a === '--id') id = args[++i];
  else if (a === '--title') title = args[++i];
  else input = a;
}

if (!input) {
  console.error('usage: node tools/ans2json.mjs <file.ans> [--id name] [--title t] [-o out.json]');
  process.exit(1);
}

id ??= basename(input, extname(input));
out ??= `${id}.json`;

let buf = readFileSync(input);
// SAUCE record: everything from the DOS EOF marker on is metadata, not art.
const eof = buf.indexOf(0x1a);
if (eof >= 0) buf = buf.subarray(0, eof);

// iCE colors: SGR 1 is a bright fg, SGR 5 (blink in a terminal) is a bright bg.
let fg = 7;
let bg = 0;
let bold = 0;
let blink = 0;

const lines = [];
let line = [];
const unknown = new Map();

for (let i = 0; i < buf.length; ) {
  const b = buf[i];
  if (b === 0x1b && buf[i + 1] === 0x5b) {
    let j = i + 2;
    while (j < buf.length && buf[j] < 0x40) j++; // params/intermediates
    if (buf[j] === 0x6d) {
      for (const p of buf.subarray(i + 2, j).toString('ascii').split(';').map(Number)) {
        if (p === 0) (fg = 7), (bg = 0), (bold = 0), (blink = 0);
        else if (p === 1) bold = 1;
        else if (p === 5) blink = 1;
        else if (p >= 30 && p <= 37) fg = p - 30;
        else if (p >= 40 && p <= 47) bg = p - 40;
      }
    }
    i = j + 1;
    continue;
  }
  if (b === 0x0a) {
    lines.push(line);
    line = [];
    i++;
    continue;
  }
  if (b === 0x0d) {
    i++;
    continue;
  }
  const g = GLYPH[b];
  if (g === undefined) unknown.set(b, (unknown.get(b) ?? 0) + 1);
  line.push(((g ?? 0) << 8) | ((fg + bold * 8) << 4) | (bg + blink * 8));
  i++;
}
if (line.length) lines.push(line);

if (unknown.size) {
  const list = [...unknown.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([b, n]) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}×${n}`)
    .join(' ');
  console.error(`${input}: ${unknown.size} glyph(s) outside the site's set — ${list}`);
  console.error('The renderer draws only  ░▒▓█▀▄▌▐ . Re-export with a block/shade charset.');
  process.exit(1);
}

const cols = Math.max(...lines.map((l) => l.length));
const rows = lines.length;
const blank = (7 << 4) | 0; // space, light gray on black
const cells = new Array(cols * rows);
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) cells[y * cols + x] = lines[y][x] ?? blank;
}

const art = { id, title: title ?? id, cols, rows, fps: 0, frames: [cells] };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(art));
console.log(`${input} → ${out}  (${cols}×${rows})`);
