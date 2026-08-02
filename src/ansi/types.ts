/** One library entry — a still (1 frame) or a pre-rendered loop (n frames @ fps). */
export interface AnsiArtwork {
  id: string;
  title?: string;
  cols: number;
  rows: number;
  /** frames per second when frames.length > 1; 0 for stills */
  fps: number;
  /** each frame is cols*rows packed cells: (glyph << 8) | (fg << 4) | bg */
  frames: number[][];
}

/** Glyph index → CP437 character. The renderer draws these procedurally
    (they are pure geometry: rects + ordered dither), so no font asset is needed.
    Keep in sync with tools/img2ansi.mjs. */
export const GLYPHS = [' ', '░', '▒', '▓', '█', '▀', '▄', '▌', '▐'] as const;
