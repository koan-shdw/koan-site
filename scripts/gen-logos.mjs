#!/usr/bin/env node
// Render "KOAN" through every figlet font → src/assets/logos.json, and
// through every TheDraw color font → src/assets/logos-tdf.json (colored
// cells, DOS palette indices) for the header logo picker (picker phase —
// the chosen font gets baked in later).
//
// TheDraw fonts: point TDF_DIR at a .tdf collection (default: the
// cognitivegears/tdfonts clone in the session scratchpad). Format parsing
// follows tdfonts (BSD-2) / tdfiglet: color fonts only, first font per
// file, attribute byte = fg nibble | bg nibble<<4, DOS color order.
import figlet from 'figlet';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'assets', 'logos.json');
const OUT_TDF = join(ROOT, 'src', 'assets', 'logos-tdf.json');
const OUT_FAV = join(ROOT, 'src', 'assets', 'logos-fav.json');

// The user's shortlist (2026-08-11) — a fresh load draws one at random.
// td: entries get their renders baked into logos-fav.json so the header
// never needs the 1.9MB chunk; figlet ones live in logos.json already.
const FAVORITES = [
  'AMC AAA01',
  'Mono 12',
  'td:SunnyShine',
  'td:Banshee',
  'td:Burning Cyan',
  'td:CyberforceBl',
  'td:FinalDestiny',
  'td:HardwiredBC',
  'td:Nest Red',
  'td:Tronics Cyan',
];

const out = {};
let skipped = 0;
for (const font of figlet.fontsSync()) {
  try {
    const t = figlet.textSync('KOAN', { font });
    if (!t || !t.trim()) throw new Error('empty');
    out[font] = t.replace(/[ \t]+$/gm, '').replace(/\n+$/, '');
  } catch {
    skipped++;
  }
}
writeFileSync(OUT, JSON.stringify(out));
console.log(`logos.json: ${Object.keys(out).length} fonts (${skipped} skipped)`);

// ---- TheDraw ----------------------------------------------------------------
const CHARLIST =
  '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
// CP437 high glyphs the fonts actually use (blocks/shades/lines); control
// range renders as space like tdfiglet does
const CP437 = {
  176: '░', 177: '▒', 178: '▓', 179: '│', 196: '─', 205: '═', 219: '█',
  220: '▄', 221: '▌', 222: '▐', 223: '▀', 254: '■', 249: '∙', 250: '·',
  186: '║', 187: '╗', 188: '╝', 200: '╚', 201: '╔', 202: '╩', 203: '╦',
  204: '╠', 206: '╬', 185: '╣', 218: '┌', 191: '┐', 192: '└', 217: '┘',
  180: '┤', 195: '├', 193: '┴', 194: '┬', 197: '┼',
};
const cp437 = (b) => (b < 0x20 ? ' ' : b < 0x7f ? String.fromCharCode(b) : CP437[b] ?? ' ');

function parseTdf(buf) {
  const magic = '\x13TheDraw FONTS file\x1a';
  for (let i = 0; i < magic.length; i++) if (buf[i] !== magic.charCodeAt(i)) return null;
  const font = {
    // padded with NULs to 12 bytes — strip or the names carry ghosts
    name: buf.slice(25, 25 + buf[24]).toString('latin1').replace(/\0+/g, '').trim(),
    type: buf[41],
    spacing: buf[42],
    chars: [],
    data: buf.slice(233),
  };
  if (font.type !== 2) return null; // color fonts only
  for (let i = 0; i < 94; i++) font.chars[i] = buf[45 + i * 2] | (buf[45 + i * 2 + 1] << 8);
  return font;
}

function glyph(font, ch) {
  const idx = CHARLIST.indexOf(ch);
  if (idx < 0 || font.chars[idx] === 0xffff) return null;
  let o = font.chars[idx];
  const width = font.data[o++];
  const height = font.data[o++];
  const cells = Array.from({ length: width * height }, () => [' ', 0]);
  let row = 0;
  let col = 0;
  while (o < font.data.length && font.data[o] !== 0) {
    const b = font.data[o++];
    if (b === 13) {
      row++;
      col = 0;
    } else {
      const color = font.data[o++];
      if (row < height && col < width) cells[row * width + col] = [cp437(b), color];
      col++;
    }
  }
  return { width, height, cells };
}

function renderTdf(font, text) {
  const glyphs = [...text].map((c) => glyph(font, c));
  if (glyphs.some((g) => !g)) return null;
  const h = Math.max(...glyphs.map((g) => g.height));
  const rows = [];
  for (let r = 0; r < h; r++) {
    let s = '';
    const colors = [];
    glyphs.forEach((g, gi) => {
      for (let c = 0; c < g.width; c++) {
        const cell = r < g.height ? g.cells[r * g.width + c] : [' ', 0];
        s += cell[0];
        colors.push(cell[1]);
      }
      if (gi < glyphs.length - 1) {
        for (let sp = 0; sp < font.spacing; sp++) {
          s += ' ';
          colors.push(0);
        }
      }
    });
    rows.push([s, colors]);
  }
  return rows;
}

const TDF_DIR =
  process.env.TDF_DIR ??
  'C:/Users/1/AppData/Local/Temp/claude/C--Claude/60db8681-1c65-48c9-b34a-5f5e62ba7a05/scratchpad/tdfonts/fonts';
if (existsSync(TDF_DIR)) {
  const tdf = {};
  let bad = 0;
  for (const f of readdirSync(TDF_DIR).filter((f) => f.toLowerCase().endsWith('.tdf'))) {
    try {
      const font = parseTdf(readFileSync(join(TDF_DIR, f)));
      if (!font) throw new Error('not a color font');
      const rows = renderTdf(font, 'KOAN');
      if (!rows) throw new Error('missing glyphs');
      const name = font.name || f.replace(/\.tdf$/i, '');
      if (!(name in tdf)) tdf[name] = rows;
    } catch {
      bad++;
    }
  }
  writeFileSync(OUT_TDF, JSON.stringify(tdf));
  console.log(`logos-tdf.json: ${Object.keys(tdf).length} thedraw fonts (${bad} skipped)`);

  const fav = { list: FAVORITES, td: {} };
  for (const key of FAVORITES) {
    if (!key.startsWith('td:')) {
      if (!(key in out)) console.error(`favorite MISSING from figlet set: ${key}`);
      continue;
    }
    const name = key.slice(3);
    if (tdf[name]) fav.td[name] = tdf[name];
    else console.error(`favorite MISSING from thedraw set: ${name}`);
  }
  writeFileSync(OUT_FAV, JSON.stringify(fav));
  console.log(`logos-fav.json: ${fav.list.length} favorites, ${Object.keys(fav.td).length} baked td renders`);
} else {
  console.log(`TDF_DIR not found (${TDF_DIR}) — logos-tdf.json not regenerated`);
}
