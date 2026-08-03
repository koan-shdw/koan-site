import { useEffect, useMemo, useState } from 'react';
import type { FeedItem, FeedSource } from '../types';
import { FeedCard } from './FeedCard';

// Views (spec §4): desktop gets masonry / feed / columns behind a toggle;
// mobile is always one column with the pills as filters. Same card everywhere.

type Mode = 'grid' | 'feed' | 'columns';

const SOURCES: { id: FeedSource; label: string }[] = [
  { id: 'github', label: 'github' },
  { id: 'instagram', label: 'instagram' },
  { id: 'x', label: 'x' },
  { id: 'youtube', label: 'youtube' },
  { id: 'claude', label: 'notes' },
];

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'grid', label: 'grid', hint: 'square grid' },
  { id: 'feed', label: 'feed', hint: 'one column' },
  { id: 'columns', label: 'cols', hint: 'one lane per platform' },
];

export function Feed({ items }: { items: FeedItem[] }) {
  // grid always opens first (user decision 2026-08-02); the toggle is per-visit
  const [mode, setMode] = useState<Mode>('grid');
  const [filter, setFilter] = useState<FeedSource | null>(null);

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

  return (
    <section className="feed sec">
      <h2 className="sec-head">stream</h2>
      <div className="feed-bar">
        <div className="pills" role="group" aria-label="filter by source">
          <button
            className={`pill ${filter === null ? 'on' : ''}`}
            onClick={() => setFilter(null)}
            title="everything"
          >
            all
            {sorted.length > 0 && <span className="pill-n">{sorted.length}</span>}
          </button>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              className={`pill ${filter === s.id ? 'on' : ''} ${counts[s.id] ? '' : 'dim'}`}
              onClick={() => setFilter((f) => (f === s.id ? null : s.id))}
              title={filter === s.id ? 'back to all' : `only ${s.label}`}
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
                <p className="empty">nothing yet</p>
              ) : (
                lane.items.map((i) => <FeedCard key={i.id} item={i} />)
              )}
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        // bare "nothing yet" is a sanctioned law-9 exception (user decision
        // 2026-08-02: no flavor text on empty states)
        <p className="empty">nothing yet</p>
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
