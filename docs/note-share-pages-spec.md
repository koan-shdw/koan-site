# note share pages — spec

2026-08-13 · status: DRAFT v2 (post adversarial review) — needs GO before build

## 1. problem

A note's only URL is a hash route (`#/note/<slug>`, convo-notes-spec.md §9). Fragments
never reach a server, and index.html carries a bare `<title>KOAN</title>` and nothing
else. Paste a note link into any chat and the preview is blank. Scrapers do not run JS.

## 2. goal

Every note gets one canonical, shareable URL:

    https://shithappensdontworry.com/note/<slug>/

- pasting it anywhere shows title + description + image (Open Graph + Twitter card)
- a human opening it lands on the existing in-app note page (name card above the
  note — already built, App.tsx:142-164)
- the canonical URL is one tap away from any note: a `share` chip copies it

## 3. non-goals

- no SSR, no router lib, no framework change
- no per-note generated imagery in v1 (see §11)
- in-app navigation stays hash routes — `page ↗` keeps its instant hash-nav;
  the canonical URL is for leaving the site, not moving inside it
- ig / x / youtube items unchanged

## 4. mechanism — prerendered shim pages

New script `scripts/prerender-notes.mjs`, wired into the build:

    "build": "tsc && vite build && node scripts/prerender-notes.mjs"

The script:
- reads `public/feed.json`, takes items with `source === 'claude'` and a `title`
- slug = `id` minus `post-` prefix; must match `/^[a-z0-9][a-z0-9-_]*$/i`, else skip + warn
- writes `dist/note/<slug>/index.html` for each

Each shim contains, in `<head>`:
- `<title>{title} · KOAN</title>`
- `<meta name="description">` = excerpt(body, 200 chars, word-safe, `…`)
- `<link rel="canonical">` = the canonical URL above
- OG: `og:title`, `og:description`, `og:type=article`, `og:site_name=KOAN`,
  `og:url` (canonical), `og:image` (absolute, §5), `article:published_time` = item date
- Twitter: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image`
- redirect for humans, **origin-proof relative path** (works on the custom domain and
  any mirror): `<script>location.replace('../../#/note/<slug>')</script>` plus
  `<noscript><meta http-equiv="refresh" content="0;url=../../#/note/<slug>"></noscript>`

Body: minimal static fallback (h1 title · p excerpt · a link to the site) so no-JS
readers and the redirect flash aren't blank. Tiny inline style block on dark ground;
no app CSS import.

All injected strings HTML-escaped (slug regex already blocks script injection).
`SITE_ORIGIN` constant `https://shithappensdontworry.com`, env-overridable — used for
canonical/og:url/og:image only, never for redirects.

## 5. og:image

- if the note has `media`, first entry — prefixed with SITE_ORIGIN **only when not
  already absolute** (`/^https?:\/\//` test; feed media comes in both shapes)
- else default share card `public/media/share-card.png` — new asset, 1200×630,
  KOAN TheDraw logotype on the dark ground, built once and checked in

## 6. app changes

- **deep-link loading fix (blocker found in review):** App boots on MOCK_FEED
  (App.tsx:33) — a shared link resolving before feed.json loads currently renders
  "no such note". App gains a `feedLoaded` flag from `loadFeed`; while unloaded, the
  note branch renders the name card + a quiet lowercase `loading…` line instead of
  the not-found state. Not-found only appears after a loaded feed genuinely misses
  the slug. Fetch failure → existing mock/error behavior.
- **share chip:** on the note page (next to `← the stream`) and on expanded feed-mode
  note cards: mono chip `share`, 1px `--line2`, radius 4 (bible 03 §chips). Click →
  `navigator.clipboard.writeText(location.origin + '/note/<slug>/')`, face flips to
  `copied` for ~1.2s, then back. No dropdown, no social buttons.
- `page ↗` (FeedCard.tsx:65-69) — **unchanged**, stays hash-nav (review: canonical
  href here would double-load the whole SPA for in-app readers).
- `index.html`: site-wide default head block — description one-liner, `og:title` KOAN,
  `og:site_name`, default `og:image` (same share card), `twitter:card`. Bare-domain
  pastes stop being blank too.
- `public/404.html`: minimal dark page, relative JS bounce to `./#/` — dead note links
  land home instead of the stock GitHub 404.

## 7. known trade-off

The address bar on the in-app note page still shows the hash URL; someone copying it
manually shares the no-preview form. Accepted for v1 — the share chip is the paved
road. (Rewriting the visible URL breaks reload/back behavior in dev and complicates
the back-link; not worth it.)

## 8. pipeline interaction

site.yml refreshes feed.json (steps 41-44) before `npm run build` (57-58), so shims
are always generated from the same-run feed. A note committed to koan-posts gets its
shim in that very run. Zero extra wiring. Deleted note → shim gone next build.

## 9. edge cases

- note without title: no shim, logged
- quotes/`<>` in title or body: escaped
- convo notes: og:description = the existing flattened-convo preview (body field);
  a frontmatter `desc` override is a §11 candidate, not v1
- JA content: shims are EN-first (`og:locale en_US`); JA lives in-app
- github.io mirror: 301s to the custom domain (verified live); shim redirects are
  relative so they'd survive even without the 301
- caches: Pages CDN serves stale shims max ~10 min after a deploy

## 10. test plan

- local build → `dist/note/<slug>/index.html` exists, meta correct, redirect fires
- `curl -A facebookexternalhit <live url>` → full meta in response
- paste into Discord / Telegram → card renders
- human click-through on a COLD tab (cache disabled) → name card + `loading…` →
  note renders; no "no such note" flash
- share chip → clipboard holds canonical URL; `copied` flip works
- `npm run dev` → `page ↗` hash-nav still instant; share chip still copies the
  canonical prod URL shape
- hit a deleted/never slug → 404.html bounces home

## 11. later

- generated per-note OG cards (ANSI-rendered title art)
- frontmatter `desc` for hand-written share descriptions
- `/notes/` index page
