import { useEffect, useState } from 'react';
import { AnsiBackground } from './ansi/AnsiBackground';
import { LIBRARY } from './library';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { Feed } from './components/Feed';
import { MOCK_FEED, PROJECTS } from './mock/feed';
import { loadFeed } from './lib/loadFeed';
import type { FeedItem } from './types';

export default function App() {
  // mock renders instantly; the real feed swaps in when feed.json answers
  const [items, setItems] = useState<FeedItem[]>(MOCK_FEED);
  useEffect(() => {
    let live = true;
    void loadFeed().then((f) => {
      if (live && f) setItems(f);
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
          <section className="projects" aria-label="projects">
            {PROJECTS.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </section>
          <Feed items={items} />
        </main>
        <footer className="foot">
          KOAN · 2026 · background is its own ANSI engine — original art only
        </footer>
      </div>
    </>
  );
}
