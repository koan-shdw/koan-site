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
    const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

    // The growing composition stays centered: shifts[k] centers zones 0..k
    // as one card (floor 24px from the top). Measured transform-free —
    // valid while frozen, where natural rects are scroll-independent.
    let marks: { shifts: number[] } | null = null;
    const measure = (els: HTMLElement[]) => {
      els.forEach((el) => {
        el.style.transform = '';
      });
      const base = els[0].getBoundingClientRect().top;
      const shifts = els.slice(0, -1).map((_, k) => {
        const h = els[k].getBoundingClientRect().bottom - base;
        return Math.max(24, (window.innerHeight - h) / 2) - base;
      });
      marks = { shifts };
    };

    const assemble = () => {
      const els = refs.current.slice(0, count).filter((el): el is HTMLElement => Boolean(el));
      if (els.length < 2) return;
      const active = window.innerWidth > 880 && !reduced;
      const arrivals = els.length - 1; // zone 0 (the card) never arrives
      const step = num('--assembly-step', 0.7) * window.innerHeight;
      const from = num('--arrive-from', 0.5) * window.innerHeight;
      const p = step > 0 ? window.scrollY / (step * arrivals) : 1;
      if (!active || p >= 1) {
        els.forEach((el) => {
          el.style.transform = '';
          el.style.willChange = '';
        });
        return;
      }
      if (!marks) measure(els);
      // shift eases from "card alone centered" through each grown
      // composition, and back to 0 while the stream lands — so the release
      // into normal scroll is seamless
      const t = [...marks!.shifts, 0];
      let shift = t[0];
      for (let k = 1; k <= arrivals; k++) {
        shift += (t[Math.min(k, t.length - 1)] - t[k - 1]) * easeOut(clamp01(p * arrivals - (k - 1)));
      }
      els.forEach((el, i) => {
        const q = i === 0 ? 1 : clamp01(p * arrivals - (i - 1));
        el.style.transform = `translateY(${Math.round(shift + (1 - easeOut(q)) * from)}px)`;
        el.style.willChange = 'transform';
      });
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
    const onResize = () => {
      marks = null; // heights and viewport moved — re-center from scratch
      pick();
    };
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', pick);
      window.removeEventListener('resize', onResize);
    };
  }, [count, dep]);

  return { refs, lit };
}
