import { useEffect, useRef, useState } from 'react';

/** Scroll focus + cumulative stack (docs/focus-ui-spec.md, round 3).
    Focus: the zone under the viewport center is lit; page top lights the
    intro. Stack: every zone except the last pins at a measured cumulative
    offset — each docks under the previous and STAYS; the stream (last)
    never pins and slides beneath the assembled stack. Offsets re-measure
    on any zone resize (tools collapse, viewport). Mobile (≤880) never
    pins. `dep` re-arms observers when late zones mount (minis load). */
export function useFocusZone(count: number, dep?: unknown) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    let raf = 0;
    const root = document.documentElement;
    const px = (name: string) =>
      parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;

    // cumulative pin offsets: zone i rests at stackTop + Σ(h_j + dockGap)
    const layout = () => {
      const mobile = window.innerWidth <= 880;
      const dockGap = px('--dock-gap');
      let top = px('--stack-top');
      refs.current.slice(0, count).forEach((el, i) => {
        if (!el) return;
        if (mobile || i === count - 1) {
          el.style.top = '';
          return;
        }
        el.style.top = `${top}px`;
        top += el.getBoundingClientRect().height + dockGap;
      });
      // the stream's docked strip (feed bar) rests just under the stack
      root.style.setProperty('--stack-bottom', `${Math.round(top - dockGap + 8)}px`);
    };

    const pick = () => {
      raf = 0;
      // page top = the intro is the subject, whatever the viewport math says
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

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    const ro = new ResizeObserver(() => {
      layout();
      pick();
    });
    refs.current.slice(0, count).forEach((el) => el && ro.observe(el));
    layout();
    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [count, dep]);

  return { refs, lit };
}
