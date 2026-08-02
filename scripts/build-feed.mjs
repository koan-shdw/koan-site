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

// release notes arrive as markdown — the feed shows plain text
const stripMd = (s) =>
  (s ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/__([^_]*)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ---- github: releases only -------------------------------------------------
// The feed shows finished work, not process: releases, never pushes or repo
// creations (user decision 2026-08-02).
async function githubItems() {
  let events = [];
  try {
    events = await gh(`/users/${USER}/events/public?per_page=100`);
  } catch (e) {
    console.error('github events failed:', e.message);
    return [];
  }
  const items = [];
  for (const ev of events) {
    if (ev.type !== 'ReleaseEvent' || ev.payload?.action !== 'published') continue;
    const repo = ev.repo?.name ?? '';
    const short = repo.split('/')[1] ?? repo;
    const r = ev.payload.release;
    items.push({
      id: `gh-rel-${r.id}`,
      source: 'github',
      date: r.published_at,
      title: `${short} ${r.tag_name}` + (r.name && r.name !== r.tag_name ? ` — ${r.name}` : ''),
      body: truncate(stripMd(r.body)),
      // github's auto-generated repo card — every github item carries an image
      media: [`https://opengraph.githubassets.com/1/${repo}`],
      link: r.html_url,
    });
  }
  return items;
}

// ---- youtube: channel RSS (no API key) --------------------------------------
const YT_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID ?? 'UC2aWoJWpzsV2qhfJPW6F5PA'; // @koan_shdw

const XML_ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const decodeXml = (s) => (s ?? '').replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m) => XML_ENT[m]);

async function youtubeItems() {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`, {
      headers: { 'user-agent': 'koan-site-feed' },
    });
    if (!res.ok) throw new Error(String(res.status));
    const xml = await res.text();
    const items = [];
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const e = m[1];
      const vid = e.match(/<yt:videoId>([^<]+)/)?.[1];
      const date = e.match(/<published>([^<]+)/)?.[1];
      if (!vid || !date) continue;
      items.push({
        id: `yt-${vid}`,
        source: 'youtube',
        date,
        title: decodeXml(e.match(/<title>([^<]*)/)?.[1]),
        body: truncate(decodeXml(e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1])),
        media: [`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`],
        link: `https://www.youtube.com/watch?v=${vid}`,
      });
    }
    return items;
  } catch (e) {
    console.error(`youtube feed failed (${e.message}) — skipping`);
    return [];
  }
}

// ---- finished public projects (repos with >=1 release) ----------------------
const PROJ_OUT = join(ROOT, 'public', 'projects.json');

async function buildProjects() {
  let repos = [];
  try {
    repos = await gh(`/users/${USER}/repos?per_page=100&sort=updated`);
  } catch (e) {
    console.error('projects: repo list failed:', e.message);
    return;
  }
  const projects = [];
  for (const r of repos) {
    if (r.fork || r.private) continue;
    try {
      const rel = await gh(`/repos/${r.full_name}/releases/latest`);
      projects.push({
        id: r.name,
        name: r.name,
        desc: r.description ?? '',
        url: r.html_url,
        tag: rel.tag_name,
        date: rel.published_at,
      });
    } catch {
      // no releases → not a finished project → not listed
    }
  }
  projects.sort((a, b) => b.date.localeCompare(a.date));
  const prevP = existsSync(PROJ_OUT) ? (JSON.parse(readFileSync(PROJ_OUT, 'utf8')).projects ?? []) : [];
  if (JSON.stringify(projects) === JSON.stringify(prevP)) {
    console.log(`projects.json unchanged (${projects.length} projects)`);
  } else {
    writeFileSync(PROJ_OUT, JSON.stringify({ generated: new Date().toISOString(), projects }, null, 1));
    console.log(`projects.json: ${projects.length} finished projects`);
  }
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
// legacy purge: push/new-repo items no longer belong in the feed
const prev = (existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')).items ?? []) : []).filter(
  (it) => !/^gh-(push|new)-/.test(it.id),
);
const fresh = [...(await postItems()), ...(await githubItems()), ...(await youtubeItems())];
await buildProjects();
const byId = new Map();
for (const it of prev) byId.set(it.id, it);
for (const it of fresh) byId.set(it.id, it); // fresh wins
let items = [...byId.values()].filter((it) => it.date && it.source);

// one card per project: keep only the newest release per repo, and make sure
// every kept github card has its repo-card image
const newestRel = new Map(); // repo → item
for (const it of items) {
  if (!it.id.startsWith('gh-rel-')) continue;
  const repo = (it.link ?? '').split('/').slice(3, 5).join('/');
  const cur = newestRel.get(repo);
  if (!cur || String(it.date) > String(cur.date)) newestRel.set(repo, it);
}
const keepRel = new Set([...newestRel.values()].map((it) => it.id));
items = items.filter((it) => !it.id.startsWith('gh-rel-') || keepRel.has(it.id));
for (const [repo, it] of newestRel) {
  if (keepRel.has(it.id) && !it.media?.length && repo) {
    it.media = [`https://opengraph.githubassets.com/1/${repo}`];
  }
}

items.sort((a, b) => String(b.date).localeCompare(String(a.date)));

// idempotent: identical items → leave the file untouched (no timestamp churn,
// so the workflow's commit step no-ops on quiet hours)
if (JSON.stringify(items) === JSON.stringify(prev)) {
  console.log(`feed.json unchanged (${items.length} items)`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), items }, null, 1));
  console.log(`feed.json: ${items.length} items (${fresh.length} fresh, ${prev.length} carried)`);
}
