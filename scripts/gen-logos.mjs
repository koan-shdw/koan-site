#!/usr/bin/env node
// Render "KOAN" through every figlet font → src/assets/logos.json for the
// header logo picker (picker phase — the chosen font gets baked in later).
import figlet from 'figlet';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'logos.json');

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
