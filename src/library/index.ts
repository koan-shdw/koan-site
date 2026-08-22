import type { AnsiArtwork } from '../ansi/types';
import koan1 from './koan1.json';
import koan2 from './koan2.json';
import koan3 from './koan3.json';
import koan4 from './koan4.json';

/** The background library — real artworks (user drop 2026-08-22, made in
    KOAN.ansi). Add an entry: export a .ans from KOAN.ansi and run it through
    tools/ans2json.mjs (or an image through tools/img2ansi.mjs), then import
    it here. */
export const LIBRARY = [koan1, koan2, koan3, koan4] as AnsiArtwork[];
