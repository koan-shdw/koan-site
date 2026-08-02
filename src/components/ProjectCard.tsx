import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Project } from '../types';

// Zoom-past (spec §3.2): the card's shot flies out to fill the viewport,
// overshoots slightly while fading to black, then navigates — "diving into"
// the site. Esc backs out at any point before navigation (bible grammar).

interface FlyState {
  rect: DOMRect;
  shot: string;
  url: string;
  phase: 'from' | 'fill' | 'past';
}

export function ProjectCard({ p }: { p: Project }) {
  const shotRef = useRef<HTMLImageElement>(null);
  const [fly, setFly] = useState<FlyState | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  };

  const launch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location.assign(p.url);
      return;
    }
    const rect = (shotRef.current ?? (e.currentTarget as HTMLElement)).getBoundingClientRect();
    setFly({ rect, shot: p.shot, url: p.url, phase: 'from' });
  };

  useEffect(() => {
    if (!fly) return;
    if (fly.phase === 'from') {
      timers.current.push(window.setTimeout(() => setFly((f) => f && { ...f, phase: 'fill' }), 30));
    } else if (fly.phase === 'fill') {
      timers.current.push(window.setTimeout(() => setFly((f) => f && { ...f, phase: 'past' }), 460));
    } else {
      timers.current.push(window.setTimeout(() => window.location.assign(fly.url), 280));
    }
    return clearTimers;
  }, [fly?.phase]);

  useEffect(() => {
    if (!fly) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTimers();
        setFly(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fly !== null]);

  const style: React.CSSProperties = fly
    ? fly.phase === 'from'
      ? {
          left: fly.rect.left,
          top: fly.rect.top,
          width: fly.rect.width,
          height: fly.rect.height,
        }
      : { left: 0, top: 0, width: '100vw', height: '100vh', borderRadius: 0 }
    : {};

  return (
    <>
      <a className="proj" href={p.url} onClick={launch} title={`enter ${p.name.toLowerCase()} ↗`}>
        <img ref={shotRef} className="proj-shot" src={p.shot} alt={`${p.name} — site`} />
        <span className="proj-label">
          <span className="proj-name">{p.name}</span>
          <span className="proj-tag">{p.tagline}</span>
          <span className="proj-enter">enter ↗</span>
        </span>
      </a>
      {fly &&
        createPortal(
          <div className={`zoom-root ${fly.phase === 'past' ? 'past' : ''}`}>
            <div className="zoom-scrim" />
            <div
              className="zoom-card"
              style={{ ...style, backgroundImage: `url(${fly.shot})` }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
