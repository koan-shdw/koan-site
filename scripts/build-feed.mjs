#!/usr/bin/env node
// The site's entire "backend": builds public/feed.json (spec §5/§8, revised to
// GitHub Pages + Actions cron — no server).
//
// Sources:
//   - GitHub public events for GITHUB_USER  → releases, new repos, pushes
//   - koan-posts private repo (needs token) → claude diary posts + manual X entries
//   - the previous feed.json                → items persist beyond the events window
//
// Runs hourly in .github/workflows/site.yml and locally:
//   GITHUB_TOKEN=$(gh auth token) node scripts/build-feed.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'feed.json');
const USER = process.env.GITHUB_USER ?? 'koan-shdw';
const POSTS_REPO = process.env.POSTS_REPO ?? `${USER}/koan-posts`;
const TOKEN = process.env.GITHUB_TOKEN ?? process.env.FEED_TOKEN ?? '';

const headers = {
  'user-agent': 'koan-site-feed',
  accept: 'application/vnd.github+json',
};
if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

const truncate = (s, n = 500) => {
  const t = (s ?? '').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ---- github events ---------------------------------------------------------
async function githubItems() {
  let events = [];
  try {
    events = await gh(`/users/${USER}/events/public?per_page=100`);
  } catch (e) {
    console.error('github events failed:', e.message);
    return [];
  }
  const items = [];
  const pushes = new Map(); // "<repo>|<day>" → aggregate

  for (const ev of events) {
    const repo = ev.repo?.name ?? '';
    const short = repo.split('/')[1] ?? repo;
    if (ev.type === 'ReleaseEvent' && ev.payload?.action === 'published') {
      const r = ev.payload.release;
      items.push({
        id: `gh-rel-${r.id}`,
        source: 'github',
        date: r.published_at,
        title: `${short} ${r.tag_name}` + (r.name && r.name !== r.tag_name ? ` — ${r.name}` : ''),
        body: truncate(r.body),
        link: r.html_url,
      });
    } else if (ev.type === 'CreateEvent' && ev.payload?.ref_type === 'repository') {
      items.push({
        id: `gh-new-${repo}`,
        source: 'github',
        date: ev.created_at,
        title: `new repo — ${short}`,
        body: truncate(ev.payload.description ?? ''),
        link: `https://github.com/${repo}`,
      });
    } else if (ev.type === 'PushEvent') {
      const key = `${repo}|${ev.created_at.slice(0, 10)}`;
      const cur = pushes.get(key) ?? { date: ev.created_at, repo, short, msgs: [], count: 0 };
      cur.count += ev.payload?.commits?.length ?? 0;
      for (const c of ev.payload?.commits ?? []) cur.msgs.push(c.message.split('\n')[0]);
      if (ev.created_at > cur.date) cur.date = ev.created_at;
      pushes.set(key, cur);
    }
  }
  for (const [key, p] of pushes) {
    if (!p.count) continue;
    items.push({
      id: `gh-push-${key}`,
      source: 'github',
      date: p.date,
      title: `${p.short} — ${p.count} commit${p.count === 1 ? '' : 's'}`,
      body: truncate([...new Set(p.msgs)].slice(0, 6).join(' · ')),
      link: `https://github.com/${p.repo}`,
    });
  }
  return items;
}

// ---- koan-posts ------------------------------------------------------------
function parsePost(name, raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  if (!meta.date) return null;
  const [en, ja] = m[2].split(/^--- ?ja ?---$/m).map((s) => (s ?? '').trim());
  const item = {
    id: `post-${name.replace(/\.md$/i, '')}`,
    source: meta.source === 'x' ? 'x' : 'claude',
    date: meta.date,
    body: en ?? '',
  };
  if (meta.title) item.title = meta.title;
  if (meta['title-ja']) item.titleJa = meta['title-ja'];
  if (ja) item.bodyJa = ja;
  if (meta.link) item.link = meta.link;
  const list = (v) => v.split(',').map((t) => t.trim()).filter(Boolean);
  if (meta.tags) item.tags = list(meta.tags);
  if (meta.media) item.media = list(meta.media);
  return item;
}

async function postItems() {
  if (!TOKEN) {
    console.error('no GITHUB_TOKEN — skipping koan-posts (private)');
    return [];
  }
  let list = [];
  try {
    list = await gh(`/repos/${POSTS_REPO}/contents/posts`);
  } catch (e) {
    console.error(`koan-posts unreadable (${e.message}) — skipping`);
    return [];
  }
  const items = [];
  for (const f of list) {
    if (!f.name.endsWith('.md') || f.name.startsWith('_')) continue;
    try {
      const res = await fetch(f.download_url, { headers });
      if (!res.ok) throw new Error(String(res.status));
      const item = parsePost(f.name, await res.text());
      if (item) items.push(item);
      else console.error(`post ${f.name}: bad frontmatter — skipped`);
    } catch (e) {
      console.error(`post ${f.name}: ${e.message} — skipped`);
    }
  }
  return items;
}

// ---- merge + write ---------------------------------------------------------
const prev = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')).items ?? []) : [];
const fresh = [...(await postItems()), ...(await githubItems())];
const byId = new Map();
for (const it of prev) byId.set(it.id, it);
for (const it of fresh) byId.set(it.id, it); // fresh wins
const items = [...byId.values()]
  .filter((it) => it.date && it.source)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

// idempotent: identical items → leave the file untouched (no timestamp churn,
// so the workflow's commit step no-ops on quiet hours)
if (JSON.stringify(items) === JSON.stringify(prev)) {
  console.log(`feed.json unchanged (${items.length} items)`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), items }, null, 1));
  console.log(`feed.json: ${items.length} items (${fresh.length} fresh, ${prev.length} carried)`);
}
