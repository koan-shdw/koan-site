# Focus round — width, scroll focus, phosphor glow, live cards

2026-08-11. Status: GO given. Governed by koan-design ch. 00–01.

Four moves against noise: tighter shell, one lit zone while scrolling,
phosphor green as the focus voice, and cards that click through.

## 1. Width

`.site` max-width 1500 → **1280px** (user decision 2026-08-11). Done in the
convo round; recorded here.

## 2. Scroll focus — one zone lit

The page is four zones: identity card, main projects, tools in development,
stream. Exactly one is lit at a time — the one under the viewport center.
The rest sink, 350ms ease. Clamped at the page edges so something is always
lit. `prefers-reduced-motion`: no transition, still lit/dim.

Tweak round 1 (2026-08-11 — opacity was noise):

- **Dim is never opacity.** Transparent zones let the ANSI art combine with
  content — noisier, not calmer. Dim = `brightness(.6) saturate(.45)
  blur(1px)`: depth of field, content stays solid.

Tweak round 2 (2026-08-11 — snap felt janky; user wants stick-and-dock):

- **Stick-and-dock replaces snap.** Each zone is `position: sticky` at
  `--stack-top` inside a `.hold` wrapper; the hold's bottom padding
  (`--stack-gap`) is the runway the next section climbs while the current
  one stays pinned. Runway spent = docked = the pair scrolls as one,
  stacked like the normal page. Pure CSS, two dials in `:root`.
- **The stream never holds.** It's longer than the screen — it docks under
  tools and scrolls free immediately (`position: static`).
- **Opening air**: `.hold-first` pads the top 22vh so the card sits low.
- Easing on the climb would need CSS scroll-driven animations — parked as a
  later dial.

- `src/lib/useFocusZone.ts` — rAF-throttled scroll listener, returns the lit
  index. No IntersectionObserver (the focal-line rule needs one winner,
  observers give many).
- `App.tsx` wraps each zone in `div.zone.lit|dim` with a ref. Tools zone can
  be absent (no minis) — null refs skip.

## 3. Phosphor focus voice

Green = `--ok` per the contract (never aliased to accent). 1px stays 1px —
emphasis is color and glow, not thickness (ch. 01 border rule).

- Lit zone's `.sec-head`: border-bottom shifts to
  `color-mix(--ok 45%, --line)`, faint outer glow
  `0 0 16px color-mix(--ok 15%, transparent)`, text to `--txt-hi`.
- Lit identity card (`.id-in`): same treatment, glow 20px at 12%.
- Section headings dock: `.sec-head` goes `position: sticky, top 8px, z 4`
  (below the feed bar at 5) — the lit label stays on screen while you're
  inside its zone.

## 4. Live cards

Every feed card is a click target, whole surface:

- Sourced items (github / instagram / x / youtube — anything with `link`):
  click opens the source post, new tab. Inner links/buttons keep priority
  (clicks on them don't double-fire).
- Notes and convos (no external home): click toggles expansion in place —
  same action as the `more` button. Grid tiles expand too: `.open` releases
  the square (aspect auto, span auto, clamps and fade lifted).
- Cursor pointer on every card; tooltip carries the gesture per law 13.

## 5. Seam fix (carried from convo round)

The two-high convo tile must end flush with its second row (was 8px short).
Fixed alongside this round; the exact mechanism recorded in styles.css next
to `.card.tile.convo`.

## Out of scope

Theme switcher (DECK etc.), nav/jump rail, zone sounds. Tweak round follows
live on the dev build.
