import { useEffect, useRef, useState } from 'react';
import type { FeedItem } from '../types';

// The one shared card (spec §3.3) — every source renders through this, only
// the layout container around it changes (§4).

const BADGE: Record<FeedItem['source'], { tag: string; name: string }> = {
  github: { tag: 'GH', name: 'github' },
  instagram: { tag: 'IG', name: 'instagram' },
  x: { tag: 'X', name: 'x' },
  claude: { tag: 'CL', name: 'claude' },
};

export function FeedCard({ item }: { item: FeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [ja, setJa] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  const hasJa = Boolean(item.bodyJa);
  const title = ja && item.titleJa ? item.titleJa : item.title;
  const body = ja && item.bodyJa ? item.bodyJa : item.body;

  // Clamp detection must track layout width (view modes reflow cards).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, body]);

  return (
    <article className="card">
      <div className="card-top">
        <span className="badge" title={BADGE[item.source].name}>
          {BADGE[item.source].tag}
        </span>
        <span className="card-date">{item.date.slice(0, 10)}</span>
        {hasJa && (
          <span className="lang" role="group" aria-label="language">
            <button
              className={`lang-b ${ja ? '' : 'on'}`}
              onClick={() => setJa(false)}
              title="read in english"
            >
              en
            </button>
            <button
              className={`lang-b ${ja ? 'on' : ''}`}
              onClick={() => setJa(true)}
              title="日本語で読む"
            >
              日本語
            </button>
          </span>
        )}
      </div>

      {title && <h3 className="card-title">{title}</h3>}

      <p ref={bodyRef} className={`card-body ${expanded ? '' : 'clamp'}`}>
        {body}
      </p>
      {(overflows || expanded) && (
        <button
          className="card-more"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? 'collapse' : 'read the whole thing'}
        >
          {expanded ? 'less ▴' : 'more ▾'}
        </button>
      )}

      {item.media && item.media.length > 0 && (
        <div className={`card-media ${item.media.length > 1 ? 'multi' : ''}`}>
          {item.media.map((m, i) => (
            <img key={i} src={m} alt="" loading="lazy" />
          ))}
        </div>
      )}

      {(item.tags?.length || item.link) && (
        <div className="card-foot">
          {item.tags?.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
          {item.link && (
            <a className="card-link" href={item.link} target="_blank" rel="noreferrer" title={`open on ${BADGE[item.source].name}`}>
              open ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}
