import { useEffect, useMemo, useState } from 'react';
import type { FeedItem, FeedSource } from '../types';
import { FeedCard } from './FeedCard';

// Views (spec §4): desktop gets masonry / feed / columns behind a toggle;
// mobile is always one column with the pills as filters. Same card everywhere.

type Mode = 'grid' | 'feed' | 'columns';

const SOURCES: { id: FeedSource; label: string; empty: string }[] = [
  { id: 'github', label: 'github', empty: 'no releases yet — finished versions land here.' },
  { id: 'instagram', label: 'instagram', empty: 'no posts yet — instagram wires up last.' },
  { id: 'x', label: 'x', empty: 'nothing here yet — tweets get added by hand, one at a time.' },
  { id: 'youtube', label: 'youtube', empty: 'no videos yet — uploads sync from the channel.' },
  { id: 'claude', label: 'claude', empty: 'no conversations published yet — “post that” puts one here.' },
];

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'feed', label: 'feed', hint: 'one column, reading order — the default' },
  { id: 'grid', label: 'grid', hint: 'square thumbnails — the overview' },
  { id: 'columns', label: 'cols', hint: 'one lane per platform' },
];

export function Feed({ items }: { items: FeedItem[] }) {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('koan.feedmode');
    // feed is THE default; old saved 'masonry' migrates there too
    return saved === 'grid' || saved === 'columns' ? saved : 'feed';
  });
  const [filter, setFilter] = useState<FeedSource | null>(null);

  useEffect(() => {
    localStorage.setItem('koan.feedmode', mode);
  }, [mode]);

  // Esc backs out one layer: an active filter clears first (bible grammar).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFilter(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.date.localeCompare(a.date)),
    [items],
  );
  const shown = filter ? sorted.filter((i) => i.source === filter) : sorted;

  const counts = useMemo(() => {
    const c = {} as Record<FeedSource, number>;
    for (const s of SOURCES) c[s.id] = 0;
    for (const i of sorted) c[i.source] = (c[i.source] ?? 0) + 1;
    return c;
  }, [sorted]);

  const lanes = useMemo(
    () =>
      SOURCES.filter((s) => !filter || s.id === filter).map((s) => ({
        ...s,
        items: sorted.filter((i) => i.source === s.id),
      })),
    [sorted, filter],
  );

  const emptyFor = (src: FeedSource | null) =>
    src ? SOURCES.find((s) => s.id === src)!.empty : 'nothing yet — the feed fills on first sync.';

  return (
    <section className="feed">
      <div className="feed-bar">
        <div className="pills" role="group" aria-label="filter by source">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              className={`pill ${filter === s.id ? 'on' : ''} ${counts[s.id] ? '' : 'dim'}`}
              onClick={() => setFilter((f) => (f === s.id ? null : s.id))}
              title={
                filter === s.id
                  ? 'click again for everything'
                  : counts[s.id]
                    ? `show only ${s.label}`
                    : s.empty
              }
            >
              {s.label}
              {counts[s.id] > 0 && <span className="pill-n">{counts[s.id]}</span>}
            </button>
          ))}
        </div>
        <div className="modes" role="group" aria-label="view mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode-b ${mode === m.id ? 'on' : ''}`}
              onClick={() => setMode(m.id)}
              title={m.hint}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'columns' ? (
        <div className="lanes" style={{ ['--lane-n' as string]: lanes.length }}>
          {lanes.map((lane) => (
            <div key={lane.id} className="lane">
              <div className="lane-head">
                {lane.label}
                <span className="lane-n">{lane.items.length}</span>
              </div>
              {lane.items.length === 0 ? (
                <p className="empty">{lane.empty}</p>
              ) : (
                lane.items.map((i) => <FeedCard key={i.id} item={i} />)
              )}
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="empty">{emptyFor(filter)}</p>
      ) : mode === 'grid' ? (
        <div className="sqgrid">
          {shown.map((i) => (
            <FeedCard key={i.id} item={i} tile />
          ))}
        </div>
      ) : (
        <div className="feedcol">
          {shown.map((i) => (
            <div key={i.id} className="m-item">
              <FeedCard item={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
