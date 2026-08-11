import { useEffect, useRef, useState } from 'react';
import type { ConvoTurn, FeedItem } from '../types';
import { Icon } from './icons';

// The one shared card (spec §3.3) — every source renders through this, only
// the layout container around it changes (§4).

const SOURCE_NAME: Record<FeedItem['source'], string> = {
  github: 'github',
  instagram: 'instagram',
  x: 'x',
  youtube: 'youtube',
  claude: 'notes', // internal id stays 'claude' (feed.json contract); the reader sees notes
};

// format: convo — the body is a transcript; position is the speaker,
// koan left, claude right, no labels (docs/convo-notes-spec.md)
function Bubbles({ turns }: { turns: ConvoTurn[] }) {
  return (
    <div className="turns">
      {turns.map((t, i) => (
        <p key={i} className={`turn ${t.who}`}>
          {t.text}
        </p>
      ))}
    </div>
  );
}

const CONVO_CLAMP = 8; // turns shown before 'more' in feed/lane modes

export function FeedCard({ item, tile = false }: { item: FeedItem; tile?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [ja, setJa] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  const hasJa = Boolean(item.bodyJa);
  const title = ja && item.titleJa ? item.titleJa : item.title;
  const body = ja && item.bodyJa ? item.bodyJa : item.body;
  const convo = ja && item.convoJa ? item.convoJa : item.convo;

  // whole card is the click target (docs/focus-ui-spec.md §4): out to the
  // source where one exists; notes/convos toggle expansion. Inner links and
  // buttons keep priority.
  const onCard = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    if (item.link) window.open(item.link, '_blank', 'noopener');
    else setExpanded((v) => !v);
  };
  const cardHint = item.link
    ? `click = open on ${SOURCE_NAME[item.source]}`
    : expanded
      ? 'click = fold it back'
      : 'click = read the whole thing';

  // Clamp detection must track layout width (view modes reflow cards).
  // Lives above the tile branch: hooks must run on every render path.
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

  // Square tile (grid mode, spec change 2026-08-02: insta-style): media fills
  // the square; without media the text itself fills the tile.
  if (tile) {
    const hasMedia = Boolean(item.media?.length);
    const big = !hasMedia && body.length < 130;
    return (
      <article
        className={`card tile src-${item.source} ${convo ? 'convo tt' : hasMedia ? 'tm' : 'tt'} ${expanded ? 'open' : ''}`}
        onClick={onCard}
        title={cardHint}
      >
        {hasMedia && <img className="tile-img" src={item.media![0]} alt="" loading="lazy" />}
        {hasMedia && <div className="tile-scrim" />}
        <div className="tile-top">
          <span className="badge" title={SOURCE_NAME[item.source]}>
            <Icon name={item.source} size={13} />
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
          {convo ? (
            <Bubbles turns={expanded ? convo : convo.slice(0, 6)} />
          ) : (
            !hasMedia && <p className={`tile-body ${big ? 'big' : ''}`}>{body}</p>
          )}
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
                title={`open on ${SOURCE_NAME[item.source]}`}
              >
                open ↗
              </a>
            )}
          </div>
        )}
      </article>
    );
  }

  // Feed mode: insta-post format — header row, square media (or the text
  // itself filling the square), caption underneath. Short text = big type,
  // the insta text-post move.
  const hasMedia = Boolean(item.media?.length);
  const big = !hasMedia && body.length < 130;
  return (
    <article className={`card post src-${item.source}`} onClick={onCard} title={cardHint}>
      <div className="card-top">
        <span className="src-name">
          <Icon name={item.source} size={14} />
          {SOURCE_NAME[item.source]}
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

      {convo ? (
        <>
          <div className="convo-post">
            {title && <h3 className="post-sq-title">{title}</h3>}
            <Bubbles turns={expanded ? convo : convo.slice(0, CONVO_CLAMP)} />
          </div>
          {convo.length > CONVO_CLAMP && (
            <button
              className="card-more"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'collapse' : 'read the whole thing'}
            >
              {expanded ? 'less ▴' : 'more ▾'}
            </button>
          )}
        </>
      ) : hasMedia ? (
        <>
          <div className="post-media">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer" title={`open on ${SOURCE_NAME[item.source]}`}>
                <img src={item.media![0]} alt="" loading="lazy" />
              </a>
            ) : (
              <img src={item.media![0]} alt="" loading="lazy" />
            )}
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
            <p ref={bodyRef} className={`card-body ${big ? 'big' : ''} ${expanded ? '' : 'clamp sq'}`}>
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
            <a className="card-link" href={item.link} target="_blank" rel="noreferrer" title={`open on ${SOURCE_NAME[item.source]}`}>
              open ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}
