// Feed contract — this shape IS the backend's normalized JSON schema (spec §5).
// Milestone 3's Railway service must serve exactly this; the UI never learns
// platform-specific shapes.

export type FeedSource = 'github' | 'instagram' | 'x' | 'youtube' | 'claude';

/** A finished public repo (has at least one release) — the small projects grid. */
export interface SmallProject {
  id: string;
  name: string;
  desc: string;
  url: string;
  tag: string;
  date: string;
}

export interface FeedItem {
  id: string;
  source: FeedSource;
  /** ISO 8601 — sole sort key, newest first (spec §3.3: no algorithmic weighting) */
  date: string;
  /** Claude posts + manual entries always have one; derived for others */
  title?: string;
  body: string;
  /** Japanese body — claude posts only (spec §6: every post carries a JA version) */
  bodyJa?: string;
  titleJa?: string;
  /** absolute URLs (backend) or bundled assets (mock) */
  media?: string[];
  /** out to the original post where one exists */
  link?: string;
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  url: string;
  /** screenshot of the live site (spec §3.2) — mock renders until capture pipeline lands */
  shot: string;
}
