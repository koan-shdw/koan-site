import { useEffect, useRef, useState } from 'react';

/** Scroll focus + assembly intro (docs/focus-ui-spec.md, round 4).

    Intro: the page is frozen (sticky .site inside .track, runway =
    track::after). The id card rests mid-screen; projects, tools, then the
    stream each glide up from --arrive-from below their resting places into
    position, eased, one per --assembly-step of scroll. When the last lands
    the runway is spent, the pin releases, and the page scrolls 1:1 like
    normal. Transforms are cleared on landing so sticky children work.

    Focus: the zone under the viewport center is lit; page top lights the
    intro card. Phones (≤880) and reduced-motion skip the show — the
    runway collapses via CSS, transforms are never applied. */
export function useFocusZone(count: number, dep?: unknown) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const num = (name: string, fallback: number) => {
      const v = parseFloat(getComputedStyle(root).getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const easeOut = (t: number) => 1 - (1 - t) ** 3;

    const assemble = () => {
      const active = window.innerWidth > 880 && !reduced;
      const arrivals = count - 1; // zone 0 (the card) never moves
      const step = num('--assembly-step', 0.7) * window.innerHeight;
      const from = num('--arrive-from', 0.5) * window.innerHeight;
      const p = step > 0 ? window.scrollY / (step * arrivals) : 1;
      for (let i = 1; i < count; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const k = i - 1;
        const q = Math.min(1, Math.max(0, p * arrivals - k));
        if (!active || q >= 1) {
          el.style.transform = '';
          el.style.willChange = '';
        } else {
          el.style.transform = `translateY(${Math.round((1 - easeOut(q)) * from)}px)`;
          el.style.willChange = 'transform';
        }
      }
    };

    const pick = () => {
      assemble();
      // page top = the intro card is the subject
      if (window.scrollY < 48) {
        const first = refs.current.findIndex(Boolean);
        setLit(first < 0 ? 0 : first);
        return;
      }
      const y = window.innerHeight * 0.5;
      let best = 0;
      let bestD = Infinity;
      refs.current.slice(0, count).forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = r.top > y ? r.top - y : r.bottom < y ? y - r.bottom : -1;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setLit(best);
    };

    // no rAF wrapper: scroll events are already frame-aligned, and queued
    // frames never run in a hidden pane (koan-site gotcha #3) — pick is a
    // handful of rect reads, cheap enough to run inline
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
    return () => {
      window.removeEventListener('scroll', pick);
      window.removeEventListener('resize', pick);
    };
  }, [count, dep]);

  return { refs, lit };
}
