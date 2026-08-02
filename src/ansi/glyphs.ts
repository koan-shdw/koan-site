import { PALETTE } from './palette';

/** Tile cache: one small canvas per (packed cell, cell size) actually used.
    Cleared on resize (cell size changes invalidate everything). */
const cache = new Map<string, HTMLCanvasElement>();

export function clearGlyphCache(): void {
  cache.clear();
}

/** 4×4 Bayer matrix — ordered dither for the ░▒▓ shade glyphs. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Dither threshold (out of 16) per shade glyph index 1..3 → 25% / 50% / 75%. */
const SHADE_T = [0, 4, 8, 12];

/** Render (lazily, cached) the tile for a packed cell at cw×ch device pixels.
    Glyphs are drawn procedurally — half blocks are rects, shades are ordered
    dither — which is exactly what the CP437 originals are. */
export function glyphTile(packed: number, cw: number, ch: number): HTMLCanvasElement {
  const key = `${packed}|${cw}x${ch}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const g = (packed >> 8) & 0xf;
  const fg = (packed >> 4) & 0xf;
  const bg = packed & 0xf;

  const tile = document.createElement('canvas');
  tile.width = cw;
  tile.height = ch;
  const x = tile.getContext('2d')!;

  x.fillStyle = PALETTE[bg];
  x.fillRect(0, 0, cw, ch);
  x.fillStyle = PALETTE[fg];

  const halfW = Math.round(cw / 2);
  const halfH = Math.round(ch / 2);

  switch (g) {
    case 0: // space — bg only
      break;
    case 4: // █
      x.fillRect(0, 0, cw, ch);
      break;
    case 5: // ▀
      x.fillRect(0, 0, cw, halfH);
      break;
    case 6: // ▄
      x.fillRect(0, halfH, cw, ch - halfH);
      break;
    case 7: // ▌
      x.fillRect(0, 0, halfW, ch);
      break;
    case 8: // ▐
      x.fillRect(halfW, 0, cw - halfW, ch);
      break;
    default: {
      // 1..3 — ░▒▓ ordered dither
      const t = SHADE_T[g];
      const s = Math.max(1, Math.floor(cw / 8));
      for (let py = 0, j = 0; py < ch; py += s, j++) {
        for (let px = 0, i = 0; px < cw; px += s, i++) {
          if (BAYER[j & 3][i & 3] < t) x.fillRect(px, py, s, s);
        }
      }
    }
  }

  cache.set(key, tile);
  return tile;
}
