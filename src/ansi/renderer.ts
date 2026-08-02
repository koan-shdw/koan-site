import type { AnsiArtwork } from './types';
import { glyphTile } from './glyphs';

/** Where an artwork's grid sits on the canvas, in device pixels.
    Computed per artwork (grids may differ in dims) to cover the viewport. */
export interface Layout {
  cw: number;
  ch: number;
  ox: number;
  oy: number;
}

export function coverLayout(art: AnsiArtwork, w: number, h: number): Layout {
  // Cell aspect is locked 1:2 (w:h). Pick the smallest cell that covers, center the crop.
  const cw = Math.max(2, Math.ceil(Math.max(w / art.cols, h / (art.rows * 2))));
  const ch = cw * 2;
  return {
    cw,
    ch,
    ox: Math.floor((w - art.cols * cw) / 2),
    oy: Math.floor((h - art.rows * ch) / 2),
  };
}

export function drawCell(
  ctx: CanvasRenderingContext2D,
  art: AnsiArtwork,
  frameIdx: number,
  cellIdx: number,
  lay: Layout,
): void {
  const packed = art.frames[frameIdx][cellIdx];
  const x = cellIdx % art.cols;
  const y = (cellIdx / art.cols) | 0;
  ctx.drawImage(glyphTile(packed, lay.cw, lay.ch), lay.ox + x * lay.cw, lay.oy + y * lay.ch);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  art: AnsiArtwork,
  frameIdx: number,
  lay: Layout,
): void {
  const n = art.cols * art.rows;
  for (let i = 0; i < n; i++) drawCell(ctx, art, frameIdx, i, lay);
}
