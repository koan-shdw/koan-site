import type { AnsiArtwork } from '../ansi/types';
import sunsetGrid from './sunset-grid.json';
import ionwave from './ionwave.json';
import plasmaLoop from './plasma-loop.json';
import tenguLoop from './tengu-loop.json';

/** The background library. Add an entry: run an image through
    tools/img2ansi.mjs (or generate frames directly) and import it here.
    Video clips: C:\Claude\ansi-converter → `python -m ansiconv --video`. */
export const LIBRARY = [sunsetGrid, ionwave, plasmaLoop, tenguLoop] as AnsiArtwork[];
