# quiet git — spec

2026-08-13 · status: DRAFT v2 (post adversarial review) — needs GO before build

## 1. problem

Releases auto-enter the feed. (Pushes and repo-creations are already banned — the
event filter at build-feed.mjs:77 keeps only published ReleaseEvents, and the purge
at :277 deletes legacy push/new items — user decision 2026-08-02.) The user wants
git silence by default: a release shows on the site only when deliberately sent
there at publish time.

## 2. rule

A release enters the feed **only if its release body contains the marker `[feed]`**
(case-insensitive, anywhere in the body). The marker is stripped from the displayed
text. No marker → the release never appears on the site. It still exists normally
on GitHub's releases page and still drives the tools cards (§6).

Human side: when publishing an app update, feed appearance happens only when the
user says "put it in the feed" — then the `[feed]` tag goes into the release body.
The decision is made at publish time (§7 covers late adds).

## 3. persistence flag

Marked releases are written to feed.json with an extra field `fed: true`.
Why: the feed merge carries previous items forward (build-feed.mjs:276-282) and the
marker is stripped on entry, so without a flag a kept release would be
indistinguishable from a legacy unmarked one and the retro purge (§4) would eat it
on the next hourly run. When the event ages out of the API window, the prev copy
keeps the flag (verified in review: no flag-loss path).

`FeedItem` type gains optional `fed?: boolean` (types.ts:25-45; loadFeed does no
field validation, nothing strips it).

## 4. retroactive purge

Extend the existing legacy purge (build-feed.mjs:277): prev items are dropped when
id matches `/^gh-(push|new)-/` OR (id matches `/^gh-rel-/` AND `fed !== true`).
All four current `gh-rel-*` items lack the flag → the feed goes git-silent on the
next refresh. Safe to run every hour.

## 5. code changes — scripts/build-feed.mjs

- `githubItems()` ~line 80, after the `published` check:
  `if (!/\[feed\]/i.test(r.body ?? '')) continue;`
- item construction (:92): `body: truncate(stripMd((r.body ?? '').replace(/\[feed\]/gi, '')))`
  (null-safe even though the gate implies a string), plus `fed: true`
- :277 purge extended per §4
- release-per-repo dedupe (:287-295): unchanged in code; behavioral note in §7

## 6. UI: sources may be empty now

Feed.tsx hardcodes its source pills (:11); with zero github items the `github` pill
sits permanently dimmed and columns mode renders an empty "github / nothing yet"
lane (:100-113). Change: **a source's pill and column render only when the feed
holds ≥1 item of that source.** General rule — github disappears now, reappears the
moment a marked release lands; protects any future source the same way.

`projects.json` (build-feed.mjs:140-187) is untouched — it uses the repos/releases
endpoints, not events. Tools cards keep every koan-tool repo + latest release tag
regardless of `[feed]`. Only the stream goes quiet.

## 7. late add + known limits

Editing a release body after publish fires no new event. To feed a release after
the fact, Claude hand-adds the item to `public/feed.json` and commits. Required
shape (items lacking these die at :283 or collide at :290):

    { "id": "gh-rel-<release id>", "source": "github", "date": "<published_at>",
      "title": "...", "body": "...", "media": ["..."],
      "link": "<real release html_url>", "fed": true }

Known limits, accepted:
- one card per repo stands (dedupe keeps newest by date): hand-adding a release
  OLDER than a marked one already in the feed gets deduped away — bump nothing,
  just accept the law
- a marked release can miss the hourly events window if >100 events bury it;
  remedy = the hand-add above
- feed.json is now a datastore for fed releases + legacy ig/x items — it stays a
  committed file, never regenerate it from nothing

## 8. test plan

- local: `node scripts/build-feed.mjs` (no token needed for the purge), then
  `git diff public/feed.json` → exactly the four `gh-rel-*` items gone; then
  `git checkout -- public/feed.json public/projects.json` (the run rewrites both
  tracked files — never let this ride into an unrelated commit). Real apply happens
  on the next cron run by itself.
- publish a test release without `[feed]` → still absent after refresh
- publish one with `[feed]` → appears, marker stripped, `fed: true` in feed.json
- next cron run → it survives the purge
- pills: github pill + column gone while no github items; back after the test release
- `tsc` clean after the types change
