#!/usr/bin/env node
// Merge a JSON array of feed items into public/feed.json (fresh wins by id,
// everything else carries, newest first). Used by the social rips:
//   node scripts/merge-items.mjs path/to/items.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FEED = join(ROOT, 'public', 'feed.json');
const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/merge-items.mjs <items.json>');
  process.exit(1);
}
const fresh = JSON.parse(readFileSync(src, 'utf8'));
const prev = existsSync(FEED) ? (JSON.parse(readFileSync(FEED, 'utf8')).items ?? []) : [];
const byId = new Map();
for (const it of prev) byId.set(it.id, it);
for (const it of fresh) byId.set(it.id, it);
const items = [...byId.values()]
  .filter((it) => it.date && it.source)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));
writeFileSync(FEED, JSON.stringify({ generated: new Date().toISOString(), items }, null, 1));
console.log(`feed.json: ${items.length} items (${fresh.length} merged)`);
