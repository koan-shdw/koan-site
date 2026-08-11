import { useEffect, useState } from 'react';
import { AnsiBackground } from './ansi/AnsiBackground';
import type { AnsiEngine } from './ansi/engine';
import { LIBRARY } from './library';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { Feed } from './components/Feed';
import { AnsiDock } from './components/AnsiDock';
import { SocialDock } from './components/SocialDock';
import { MOCK_FEED, PROJECTS } from './mock/feed';
import { loadFeed, loadProjects } from './lib/loadFeed';
import { useFocusZone } from './lib/useFocusZone';
import type { FeedItem, SmallProject } from './types';

export default function App() {
  const [engine, setEngine] = useState<AnsiEngine | null>(null);
  // mock renders instantly; the real feed swaps in when feed.json answers
  const [items, setItems] = useState<FeedItem[]>(MOCK_FEED);
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

  // scroll focus (docs/focus-ui-spec.md §2): identity 0, projects 1, tools 2, stream 3
  const { refs, lit } = useFocusZone(4);
  const zone = (i: number, base = '') => ({
    className: `${base} zone ${lit === i ? 'lit' : 'dim'}`.trim(),
    ref: (el: HTMLElement | null) => {
      refs.current[i] = el;
    },
  });

  return (
    <>
      <AnsiBackground arts={LIBRARY} onEngine={setEngine} />
      <div className="site">
        {/* stick-and-dock: each hold's padding is the next zone's runway */}
        <div className="hold hold-first">
          <div {...zone(0)}>
            <Header />
          </div>
        </div>
        <main>
          <div className="hold">
            <section aria-label="main projects" {...zone(1, 'sec')}>
            <h2 className="sec-head">main projects</h2>
            <div className="projects">
              {PROJECTS.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
            </div>
          </section>
          </div>
          {minis && (
            <div className="hold">
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
            </div>
          )}
          <div className="hold hold-last">
            <div {...zone(3, 'zone-stream')}>
              <Feed items={items} />
            </div>
          </div>
        </main>
        <footer className="foot">KOAN · 2026 · original ANSI art, own engine</footer>
      </div>
      <AnsiDock engine={engine} />
      <SocialDock />
    </>
  );
}
