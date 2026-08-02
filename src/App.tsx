import { useEffect, useState } from 'react';
import { AnsiBackground } from './ansi/AnsiBackground';
import { LIBRARY } from './library';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { Feed } from './components/Feed';
import { MOCK_FEED, PROJECTS } from './mock/feed';
import { loadFeed, loadProjects } from './lib/loadFeed';
import type { FeedItem, SmallProject } from './types';

export default function App() {
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

  return (
    <>
      <AnsiBackground arts={LIBRARY} />
      <div className="site">
        <Header />
        <main>
          <section className="projects" aria-label="main projects">
            {PROJECTS.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </section>
          {minis && (
            <section className="minis" aria-label="finished public projects">
              <button
                className="minis-head"
                onClick={toggleMinis}
                title={minisOpen ? 'collapse the grid' : 'expand the grid'}
                aria-expanded={minisOpen}
              >
                <span className="minis-caret">{minisOpen ? '▾' : '▸'}</span>
                public tools · finished builds
                <span className="minis-n">{minis.length}</span>
              </button>
              {minisOpen && (
                <div className="minis-grid">
                  {minis.map((p) => (
                    <a
                      key={p.id}
                      className="mini"
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${p.tag} · open on github`}
                    >
                      <span className="mini-name">{p.name}</span>
                      {p.desc && <span className="mini-desc">{p.desc}</span>}
                      <span className="mini-meta">
                        <span className="mini-tag">{p.tag}</span>
                        <span>{p.date.slice(0, 10)}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
          <Feed items={items} />
        </main>
        <footer className="foot">
          KOAN · 2026 · background is its own ANSI engine — original art only
        </footer>
      </div>
    </>
  );
}
