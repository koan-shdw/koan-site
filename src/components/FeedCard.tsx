import { useEffect, useRef, useState } from 'react';
import type { FeedItem } from '../types';

// The one shared card (spec §3.3) — every source renders through this, only
// the layout container around it changes (§4).

const BADGE: Record<FeedItem['source'], { tag: string; name: string }> = {
  github: { tag: 'GH', name: 'github' },
  instagram: { tag: 'IG', name: 'instagram' },
  x: { tag: 'X', name: 'x' },
  youtube: { tag: 'YT', name: 'youtube' },
  claude: { tag: 'CL', name: 'claude' },
};

export function FeedCard({ item, tile = false }: { item: FeedItem; tile?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [ja, setJa] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  const hasJa = Boolean(item.bodyJa);
  const title = ja && item.titleJa ? item.titleJa : item.title;
  const body = ja && item.bodyJa ? item.bodyJa : item.body;

  // Square tile (grid mode, spec change 2026-08-02: insta-style): media fills
  // the square; without media the text itself fills the tile.
  if (tile) {
    const hasMedia = Boolean(item.media?.length);
    return (
      <article className={`card tile ${hasMedia ? 'tm' : 'tt'}`}>
        {hasMedia && <img className="tile-img" src={item.media![0]} alt="" loading="lazy" />}
        {hasMedia && <div className="tile-scrim" />}
        <div className="tile-top">
          <span className="badge" title={BADGE[item.source].name}>
            {BADGE[item.source].tag}
          </span>
          <span className="card-date">{item.date.slice(0, 10)}</span>
          {hasJa && (
            <span className="lang" role="group" aria-label="language">
              <button className={`lang-b ${ja ? '' : 'on'}`} onClick={() => setJa(false)} title="read in english">
                en
              </button>
              <button className={`lang-b ${ja ? 'on' : ''}`} onClick={() => setJa(true)} title="日本語で読む">
                日本語
              </button>
            </span>
          )}
        </div>
        <div className="tile-main">
          {title && <h3 className="tile-title">{title}</h3>}
          {!hasMedia && <p className="tile-body">{body}</p>}
        </div>
        {(item.tags?.length || item.link) && (
          <div className="tile-foot">
            {item.tags?.slice(0, 3).map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
            {item.link && (
              <a
                className="card-link"
                href={item.link}
                target="_blank"
                rel="noreferrer"
                title={`open on ${BADGE[item.source].name}`}
              >
                open ↗
              </a>
            )}
          </div>
        )}
      </article>
    );
  }

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

  // Feed mode: insta-post format — header row, square media (or the text
  // itself filling the square), caption underneath.
  const hasMedia = Boolean(item.media?.length);
  return (
    <article className="card post">
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

      {hasMedia ? (
        <>
          <div className="post-media">
            <img src={item.media![0]} alt="" loading="lazy" />
          </div>
          {title && <h3 className="card-title">{title}</h3>}
          {body && (
            <>
              <p ref={bodyRef} className={`card-body ${expanded ? '' : 'clamp cap'}`}>
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
            </>
          )}
        </>
      ) : (
        <>
          <div className={`post-square ${expanded ? 'open' : ''}`}>
            {title && <h3 className="post-sq-title">{title}</h3>}
            <p ref={bodyRef} className={`card-body ${expanded ? '' : 'clamp sq'}`}>
              {body}
            </p>
          </div>
          {(overflows || expanded) && (
            <button
              className="card-more"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'collapse' : 'read the whole thing'}
            >
              {expanded ? 'less ▴' : 'more ▾'}
            </button>
          )}
        </>
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
