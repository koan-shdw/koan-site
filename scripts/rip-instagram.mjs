#!/usr/bin/env node
// Rip Instagram posts into the feed. Post pages are fetched with a crawler
// UA (og tags only — no login, no cookies); images land in public/media/ig/.
// Shortcodes come from the profile grid (collected by hand or via Chrome):
//   node scripts/rip-instagram.mjs DbWEmCuS_jz DLmyD-ZyrZO ...
// Existing feed items win nothing: fresh rips overwrite by id, everything
// else carries. Re-run any time — it is idempotent per shortcode.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FEED = join(ROOT, 'public', 'feed.json');
const MEDIA = join(ROOT, 'public', 'media', 'ig');

const UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

const codes = process.argv.slice(2);
if (codes.length === 0) {
  console.error('usage: node scripts/rip-instagram.mjs <shortcode> [...]');
  process.exit(1);
}

const unent = (s) =>
  (s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

const meta = (html, prop) =>
  html.match(new RegExp(`property="${prop}"\\s+content="([^"]*)"`))?.[1] ??
  html.match(new RegExp(`content="([^"]*)"\\s+property="${prop}"`))?.[1];

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseDate(text) {
  const m = (text ?? '').match(/on\s+([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS[m[1].toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${String(mo).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}T12:00:00Z`;
}

function parseCaption(title) {
  // og:title: 'Name on Instagram: "the caption"'
  const m = (title ?? '').match(/on Instagram:\s*"([\s\S]*)"\s*$/);
  return (m ? m[1] : '').trim();
}

async function rip(code) {
  const link = `https://www.instagram.com/p/${code}/`;
  const res = await fetch(link, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${code}: page ${res.status}`);
  const html = await res.text();
  const img = unent(meta(html, 'og:image') ?? '');
  const title = unent(meta(html, 'og:title') ?? '');
  const desc = unent(meta(html, 'og:description') ?? '');
  const date = parseDate(desc) ?? parseDate(title);
  const caption = parseCaption(title) || parseCaption(desc);
  if (!img || !date) throw new Error(`${code}: page had no og image/date`);

  mkdirSync(MEDIA, { recursive: true });
  const file = join(MEDIA, `${code}.jpg`);
  if (!existsSync(file)) {
    const ir = await fetch(img, { headers: { 'user-agent': UA } });
    if (!ir.ok) throw new Error(`${code}: image ${ir.status}`);
    writeFileSync(file, Buffer.from(await ir.arrayBuffer()));
  }

  return {
    id: `ig-${code}`,
    source: 'instagram',
    date,
    body: caption,
    media: [`media/ig/${code}.jpg`],
    link,
  };
}

const fresh = [];
for (const code of codes) {
  try {
    fresh.push(await rip(code));
    console.log(`ripped ${code}`);
  } catch (e) {
    console.error(String(e.message ?? e));
  }
  await new Promise((r) => setTimeout(r, 1200)); // be polite
}

const prev = existsSync(FEED) ? (JSON.parse(readFileSync(FEED, 'utf8')).items ?? []) : [];
const byId = new Map();
for (const it of prev) byId.set(it.id, it);
for (const it of fresh) byId.set(it.id, it);
const items = [...byId.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
writeFileSync(FEED, JSON.stringify({ generated: new Date().toISOString(), items }, null, 1));
console.log(`feed.json: ${items.length} items (${fresh.length} instagram ripped)`);
