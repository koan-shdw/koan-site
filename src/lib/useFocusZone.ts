import { useEffect, useRef, useState } from 'react';

/** Scroll focus (docs/focus-ui-spec.md §2) — exactly one zone is lit: the
    one under the focal line 38% down the viewport. Nearest zone wins at the
    page edges so something is always lit. rAF-throttled; a null ref (hidden
    zone) is skipped. */
export function useFocusZone(count: number) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      // page top = the intro is the subject, whatever the viewport math says
      if (window.scrollY < 48) {
        const first = refs.current.findIndex(Boolean);
        setLit(first < 0 ? 0 : first);
        return;
      }
      const y = window.innerHeight * 0.5; // snap centers zones — lit follows center
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
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [count]);

  return { refs, lit };
}
