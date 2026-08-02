import type { FeedItem } from '../types';

/** Fetch the built feed (public/feed.json, same origin). Returns null when
    unreachable/empty so the caller can keep its fallback — the site must
    render instantly and degrade gracefully (spec §5). */
export async function loadFeed(): Promise<FeedItem[] | null> {
  try {
    const url = (import.meta.env.VITE_FEED_URL as string | undefined) ?? 'feed.json';
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    const items: unknown = Array.isArray(data) ? data : data?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    return items as FeedItem[];
  } catch {
    return null;
  }
}
