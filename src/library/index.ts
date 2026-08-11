import type { AnsiArtwork } from '../ansi/types';
import nosferatu from './nosferatu.json';
import cheech from './cheech.json';
import shoheiIppuku from './shohei-ippuku.json';
import kagoVice from './kago-vice.json';
import gateway from './gateway.json';

/** The background library — real artworks (user drop 2026-08-11). Add an
    entry: run an image through tools/img2ansi.mjs (or generate frames
    directly) and import it here.
    Video clips: C:\Claude\ansi-converter → `python -m ansiconv --video`. */
export const LIBRARY = [nosferatu, cheech, shoheiIppuku, kagoVice, gateway] as AnsiArtwork[];
