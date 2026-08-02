# koan-site

KOAN personal site — single page: identity, project cards, unified feed, over a living
ANSI art background. Spec: `koan-site-spec.md` (Desktop). Design: KOAN.design bible
(`C:\Claude\koan-design`, chapters 00–01 govern tokens/geometry).

## Commands

```
npm run dev          # vite dev server (port 5173)
npm run build        # typecheck + production build
npm run art:all      # regenerate placeholder sources → convert → plasma loop
```

## ANSI background pipeline

- `tools/img2ansi.mjs <image> [--cols N] [-o out.json]` — converts any image to a grid
  entry: per cell, best (glyph, fg, bg) over the DOS 16-color palette from the CP437
  block/shade set (`░▒▓█▀▄▌▐` + space). Drop the JSON in `src/library/` and add it to
  `src/library/index.ts`.
- Loops are the same format with `frames.length > 1` and `fps > 0` (see
  `tools/gen-plasma.mjs` for generating one procedurally).
- The renderer draws glyphs **procedurally** (rects + ordered dither) — no bitmap font
  asset, no font licensing, crisp at any cell size.
- Engine: `src/ansi/engine.ts` — dwell → mosaic/wipe transition → dwell. rAF-driven
  (pauses when tab hidden), honors `prefers-reduced-motion` (static first artwork).

## Library entry format

```json
{ "id": "name", "title": "NAME", "cols": 120, "rows": 34, "fps": 0,
  "frames": [[ 1287, ... ]] }
```

Cell packing: `(glyph << 8) | (fg << 4) | bg`. Glyph indices in `src/ansi/types.ts`,
palette in `src/ansi/palette.ts` (mirrored in `tools/img2ansi.mjs`).
