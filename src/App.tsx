import { useEffect, useState } from 'react';
import { AnsiBackground } from './ansi/AnsiBackground';
import type { AnsiEngine } from './ansi/engine';
import { LIBRARY } from './library';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { Feed } from './components/Feed';
import { FeedCard } from './components/FeedCard';
import { AnsiDock } from './components/AnsiDock';
import { SocialDock } from './components/SocialDock';
import { MOCK_FEED, PROJECTS } from './mock/feed';
import { loadFeed, loadProjects } from './lib/loadFeed';
import { useFocusZone } from './lib/useFocusZone';
import type { FeedItem, SmallProject } from './types';

// #/note/<slug> — a note's own shareable page (docs/convo-notes-spec.md §9)
const parseNoteHash = () =>
  decodeURIComponent(window.location.hash.match(/^#\/note\/(.+)$/)?.[1] ?? '') || null;

export default function App() {
  const [engine, setEngine] = useState<AnsiEngine | null>(null);
  // mock renders instantly; the real feed swaps in when feed.json answers
  const [items, setItems] = useState<FeedItem[]>(MOCK_FEED);
  const [noteSlug, setNoteSlug] = useState<string | null>(parseNoteHash);
  // finished public repos (>=1 release) — section hidden until data exists
  const [minis, setMinis] = useState<SmallProject[] | null>(null);
  const [minisOpen, setMinisOpen] = useState(() => localStorage.getItem('koan.minis') !== '0');
  const toggleMinis = () => {
    setMinisOpen((v) => {
      localStorage.setItem('koan.minis', v ? '0' : '1');
      return !v;
    });
  };
  useEffect(() => {
    let live = true;
    void loadFeed().then((f) => {
      if (live && f) setItems(f);
    });
    void loadProjects().then((p) => {
      if (live && p) setMinis(p);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onHash = () => {
      setNoteSlug(parseNoteHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const note = noteSlug
    ? items.find((i) => i.id === `post-${noteSlug}` || i.id === noteSlug) ?? null
    : null;

  useEffect(() => {
    document.title = note?.title ? `${note.title} · KOAN` : 'KOAN';
  }, [note?.title]);

  // scroll focus + stack (docs/focus-ui-spec.md): identity 0, projects 1,
  // tools 2, stream 3; dep re-arms measurement when the tools zone mounts
  // late or folds
  const { refs, lit } = useFocusZone(4, `${minis?.length ?? -1}:${minisOpen}`);
  const zone = (i: number, base = '') => ({
    className: `${base} zone ${lit === i ? 'lit' : 'dim'}`.trim(),
    ref: (el: HTMLElement | null) => {
      refs.current[i] = el;
    },
  });

  // a note's own page: same background, same identity, one note, full
  if (noteSlug) {
    return (
      <>
        <AnsiBackground arts={LIBRARY} onEngine={setEngine} />
        <div className="site note-page">
          <Header />
          <main className="note-main">
            <a className="note-back" href="#/">
              ← the stream
            </a>
            {note ? (
              <FeedCard item={note} full />
            ) : (
              <p className="empty">
                no such note — <a href="#/">back to the stream</a>
              </p>
            )}
          </main>
          <footer className="foot">KOAN · 2026 · original ANSI art, own engine</footer>
        </div>
      </>
    );
  }

  return (
    <>
      <AnsiBackground arts={LIBRARY} onEngine={setEngine} />
      {/* assembly intro: .track's tail is the runway, .site pins inside it
          while the sections glide into place (docs/focus-ui-spec.md §2) */}
      <div className="track">
        <div className="site">
          <main>
            <div {...zone(0)}>
              <Header />
            </div>
            <section aria-label="main projects" {...zone(1, 'sec')}>
            <h2 className="sec-head">main projects</h2>
            <div className="projects">
              {PROJECTS.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
            </div>
          </section>
          {minis && (
            <>
              <section aria-label="tools in development" {...zone(2, 'sec')}>
              <h2 className="sec-head as-btn">
                <button
                  className="sec-toggle"
                  onClick={toggleMinis}
                  title={minisOpen ? 'collapse the grid' : 'expand the grid'}
                  aria-expanded={minisOpen}
                >
                  <span className="sec-caret">{minisOpen ? '▾' : '▸'}</span>
                  tools in development
                  <span className="sec-n">{minis.length}</span>
                </button>
              </h2>
              {minisOpen && (
                <div className="minis-grid">
                  {minis.map((p) => (
                    <a
                      key={p.id}
                      className="mini"
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      title={
                        (p.tag ? `${p.tag} · ` : '') +
                        (p.url.includes('github.com') ? 'open on github' : 'open the tool')
                      }
                    >
                      {p.img && <img className="mini-img" src={p.img} alt="" loading="lazy" />}
                      <span className="mini-body">
                        <span className="mini-name">{p.name}</span>
                        {p.desc && <span className="mini-desc">{p.desc}</span>}
                        <span className="mini-meta">
                          {p.tag && <span className="mini-tag">{p.tag}</span>}
                          <span>{p.date.slice(0, 10)}</span>
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </section>
            </>
          )}
          <div {...zone(3, 'zone-stream')}>
            <Feed items={items} />
          </div>
        </main>
          <footer className="foot">KOAN · 2026 · original ANSI art, own engine</footer>
        </div>
      </div>
      <AnsiDock engine={engine} />
      <SocialDock />
    </>
  );
}
