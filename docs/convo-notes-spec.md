# Convo notes — voice conversations in the stream

2026-08-11. Status: approved pending GO.

Voice conversations with Claude become posts in the notes lane. The transcript
renders as back and forth chat, not a wall of text. Convo cards stand two tiles
high in the square grid. Publishing is one typed line at the end of a voice
chat on claude.ai.

## 1. Post format (koan-posts)

Same file shape as every note. One new frontmatter key, one convention.

```markdown
---
title: cybernetics, two readings
date: 2026-08-11T12:00:00Z
source: claude
format: convo          # NEW — marks the body as a transcript
first: claude          # NEW — who speaks paragraph 1 (default: koan)
tags: ccru, cybernetics
---

Paragraph one.

Paragraph two.
```

Rules:

- Body is the verbatim transcript. Paragraphs separated by blank lines.
- Paragraphs strictly alternate speakers, starting from `first`.
- No speaker labels in the file. The alternation IS the markup.
- JA section (`--- ja ---`) is **required**, same as every note. The posting
  Claude generates the full 日本語 automatically at post time — faithful to
  the raw spoken feel, no asking. Free in-app; the pipeline stays $0. The
  builder warns (never blocks) when a convo lands without it.
- Consecutive same-speaker paragraphs merge into ONE turn at assembly,
  joined by single line breaks. Blank lines separate turns; single newlines
  stay inside a turn and render as line breaks (covers the interrupted-turn
  case and multi-paragraph answers like a roster).
- Only permitted edit when assembling: obvious voice-transcription fixes,
  same as the existing README rule.

## 2. Builder (`scripts/build-feed.mjs`)

`parsePost()` gains a convo branch when `meta.format === 'convo'`:

1. Strip the app footer: any paragraph starting with `Claude is AI and can
   make mistakes` is dropped, wherever it appears.
2. Split body on blank lines into paragraphs.
3. Drop consecutive duplicate paragraphs (voice app sometimes emits the same
   paragraph twice — seen in the first real transcript).
4. Assign speakers by alternation from `meta.first` (`claude` or `koan`,
   default `koan`).
5. Emit `item.convo = [{ who: 'koan' | 'claude', text }, ...]`.
6. `item.body` still gets the plain joined text (truncated to 500 like release
   notes) — it feeds tile previews, search, and old clients. Feed contract
   stays backward compatible: `convo` is additive, optional.

Same parsing for the JA side: `item.convoJa`. A convo without a JA section
logs a warning and still ships (EN-only beats lost).

## 3. Types (`src/types.ts`)

```ts
export interface ConvoTurn { who: 'koan' | 'claude'; text: string }
// FeedItem gains:
convo?: ConvoTurn[];
convoJa?: ConvoTurn[];
```

## 4. Card rendering (`src/components/FeedCard.tsx`)

When `item.convo` exists the body area renders bubbles instead of `<p>`:

- `koan` turns: left-aligned bubble, `--field` background.
- `claude` turns: right-aligned bubble, tinted (`--title-glass` over field),
  1px `--line` border both. Radius 4px, same as every card element. No
  avatars, no names — position is the speaker.
- Bubble text: 13px/1.55 (tile), 14px/1.6 (feed), `--body` color.

Modes:

- **Grid (tile)**: convo tiles get class `convo` →
  `grid-row: span 2; aspect-ratio: auto;` — two squares tall plus the gap.
  `.sqgrid` gains `grid-auto-flow: dense` so span-2 tiles never punch holes.
  Preview shows title + first bubbles, overflow fades out at the bottom
  (mask-image gradient, no clamp jump). Whole tile still opens nothing —
  reading happens in feed mode or via expand in place? No: tile keeps the
  grid contract (overview only). Footer keeps tags.
- **Feed / columns**: bubbles clamp at ~8 turns with the existing
  `more ▾ / less ▴` control. Expanded = full convo, every turn.
- **Mobile**: single column already; convo tile drops the span (rows are
  content-sized), natural height with the same fade.

JA toggle works unchanged — `ja && item.convoJa` swaps the turn list.

## 5. Pill

No new pill. Convos are notes (`source: claude`, label "notes"). The
`format` key only changes rendering.

## 6. Publish flow — "post this to notes"

Voice mode cannot run tools. The flow is: talk → convo ends as text in the
Claude app → type one line in that same chat.

Claude-side setup (user, once, on claude.ai):

1. Settings → Connectors → add the GitHub MCP connector
   (`https://api.githubcopilot.com/mcp/`), sign in as koan-shdw. Scope:
   koan-posts (and koan-site if workflow dispatch is wanted).
2. Add to personal preferences (Settings → Profile):

   > When I say "post this to notes": fetch the README of
   > koan-shdw/koan-posts and follow its publish flow. For a voice
   > transcript, use format: convo per docs/convo-notes-spec.md in
   > koan-shdw/koan-site.

3. Then in any chat: "post this to notes" → Claude commits
   `posts/YYYY-MM-DD-slug.md` → triggers the site workflow (or the hourly
   cron catches it).

Site-side setup (user, once — token stays with the user, never through me):

4. GitHub → Settings → Developer settings → fine-grained PAT: read-only
   Contents on koan-posts.
5. koan-site → Settings → Secrets and variables → Actions → new secret
   `FEED_TOKEN` = that PAT. **Currently missing** — until it exists the
   feed builder skips koan-posts entirely.

koan-posts README gets a short convo section pointing here.

## 7. First post

The 2026-08-11 cybernetics conversation (Plant / Land / CCRU) ships as the
first convo post, committed to koan-posts by the build session:

- File: `posts/2026-08-11-cybernetics-two-readings.md`
- `first: claude`, tags: `ccru, cybernetics`
- Transcript verbatim from the user's paste, duplicate paragraph left in
  place (builder dedupes at parse time — file stays true to what the app
  produced). Same-speaker paragraphs merged per §1.
- Full JA translation included (rule §1).

## 8. Test plan

- Unit-of-one: run `build-feed.mjs` locally with a token, confirm feed.json
  carries `convo[]` with correct speaker alternation and the footer gone.
- Dev server: grid shows the convo tile two-high, dense packing, no holes;
  feed mode clamps at ~8 turns, `more` reveals all; mobile single column
  sane; JA toggle absent (no JA section).
- Lanes mode: convo card in the notes lane, bubbles intact.
- Live: after FEED_TOKEN lands, dispatch the workflow, confirm the post on
  koan-shdw.github.io/koan-site.

## 9. Note pages (added 2026-08-11, GO'd)

Notes have no external home — each gets its own shareable page:

- URL: `#/note/<slug>` (hash — GitHub Pages has no server routing). Slug =
  feed id minus the `post-` prefix.
- The page renders the same ANSI background, the ID header, a "← the
  stream" link, then the one note full-width in a 680px column, fully
  expanded (`FeedCard full`), en/日本語 toggle intact. `document.title`
  carries the note title.
- Note/convo cards grow a `page ↗` link in the foot; sourced cards keep
  `open ↗` out to their platform.
- Unknown slug: "no such note — back to the stream" (law 9).

## Out of scope

- Audio playback of convos (text only — voice mode exports no audio).
- Speaker labels or avatars on bubbles.
- Auto-posting from voice mode itself (no tools there; one typed line is
  the contract).
