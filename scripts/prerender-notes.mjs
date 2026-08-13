// prerender-notes: one static shim page per note, so pasted links unfurl.
// Runs after `vite build` (docs/note-share-pages-spec.md). Scrapers read the
// meta; humans get bounced into the SPA's hash route. dist only — nothing here
// is committed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FEED = join(ROOT, 'public', 'feed.json');
const DIST = join(ROOT, 'dist');
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://shithappensdontworry.com';
const DEFAULT_CARD = 'media/share-card.png';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const excerpt = (s, n = 200) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30))}…`;
};

const absolutize = (u) => (/^https?:\/\//.test(u) ? u : `${SITE_ORIGIN}/${u.replace(/^\/+/, '')}`);

if (!existsSync(DIST)) {
  console.error('prerender-notes: no dist/ — run vite build first');
  process.exit(1);
}

const { items = [] } = JSON.parse(readFileSync(FEED, 'utf8'));
const notes = items.filter((it) => it.source === 'claude' && it.title);

let written = 0;
for (const it of notes) {
  const slug = it.id.replace(/^post-/, '');
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(slug)) {
    console.warn(`prerender-notes: skipped unsafe slug "${slug}"`);
    continue;
  }
  const url = `${SITE_ORIGIN}/note/${slug}/`;
  const title = esc(it.title);
  const desc = esc(excerpt(it.body));
  const img = esc(absolutize(it.media?.[0] ?? DEFAULT_CARD));
  // relative bounce: works on the custom domain and any mirror alike
  const app = `../../#/note/${encodeURIComponent(slug)}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>${title} · KOAN</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="KOAN">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="article:published_time" content="${esc(it.date)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
<script>location.replace('${app}');</script>
<noscript><meta http-equiv="refresh" content="0;url=${app}"></noscript>
<style>body{background:#0b0b0d;color:#c8c8cc;font:13px/1.6 Consolas,Menlo,monospace;max-width:680px;margin:48px auto;padding:0 16px}a{color:#c8c8cc}</style>
</head>
<body>
<h1>${title}</h1>
<p>${desc}</p>
<p><a href="${app}">read it on KOAN →</a></p>
</body>
</html>
`;

  const dir = join(DIST, 'note', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  written++;
}

console.log(`prerender-notes: ${written} shim${written === 1 ? '' : 's'} written`);
