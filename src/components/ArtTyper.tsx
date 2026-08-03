import { useEffect, useRef, useState } from 'react';

// The role line made literal. "ART PRODUCER" glitches in, then the word art
// types itself across the identity card until it fills it, dimming as it
// goes, then keeps scrolling forever as a background pattern that drifts
// slightly off-angle near the end of each repeat. Clipped by the card.

const WORD = 'art ';
const TITLE = 'ART PRODUCER';
const GLITCH = '▓▒░█<>/\\|#*';
const TILT = (-3 * Math.PI) / 180; // max drift

/** The ART PRODUCER line, glitching in character by character. */
export function GlitchTitle() {
  const [text, setText] = useState(TITLE);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t = 0;
    const iv = window.setInterval(() => {
      t += 1;
      const settled = Math.floor((t / 22) * TITLE.length);
      if (settled >= TITLE.length) {
        setText(TITLE);
        window.clearInterval(iv);
        return;
      }
      setText(
        TITLE.split('')
          .map((c, i) => (c === ' ' || i < settled ? c : GLITCH[(Math.random() * GLITCH.length) | 0]))
          .join(''),
      );
    }, 50);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <div className="id-title" aria-label="art producer">
      {text}
    </div>
  );
}

/** The typing layer — a canvas behind the card's content. */
export function ArtFill() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // buffer holds the typed pattern; tmp is scratch for the row shift
    const buf = document.createElement('canvas');
    const bctx = buf.getContext('2d')!;
    const tmp = document.createElement('canvas');
    const tctx = tmp.getContext('2d')!;

    let cols = 0;
    let rows = 0;
    let cellW = 8;
    let lineH = 15;
    let font = '';
    let typed = 0;
    let filling = true;
    let scrollRow = 0;
    let angle = 0;
    let raf = 0;
    let last = 0;
    let fadeAt = 0;
    const startAt = performance.now() + 1300; // let the title glitch land first

    const ink = () => getComputedStyle(canvas).getPropertyValue('--txt').trim() || '#d9d9de';

    const putChar = (i: number) => {
      const col = i % cols;
      const row = (i / cols) | 0;
      if (row >= rows) return;
      bctx.font = font;
      bctx.fillStyle = ink();
      bctx.fillText(WORD[i % WORD.length], col * cellW, row * lineH + lineH * 0.78);
    };

    const fadeBuf = (a: number) => {
      bctx.globalCompositeOperation = 'destination-out';
      bctx.fillStyle = `rgba(0,0,0,${a})`;
      bctx.fillRect(0, 0, buf.width, buf.height);
      bctx.globalCompositeOperation = 'source-over';
    };

    const layout = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      buf.width = w;
      buf.height = h;
      tmp.width = w;
      tmp.height = h;
      const mono = getComputedStyle(canvas).getPropertyValue('--mono') || 'monospace';
      font = `500 ${Math.round(11 * dpr)}px ${mono}`;
      bctx.font = font;
      cellW = Math.max(4, Math.ceil(bctx.measureText('a').width * 1.2));
      lineH = Math.round(15 * dpr);
      cols = Math.max(4, Math.floor(w / cellW));
      rows = Math.max(1, Math.ceil(h / lineH));
      bctx.clearRect(0, 0, w, h);
      const upto = filling ? Math.min(typed, cols * rows) : cols * rows;
      for (let i = 0; i < upto; i++) putChar(i);
      if (!filling) fadeBuf(0.4); // resized mid-pattern: settle it back down
    };

    const present = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const frac = filling ? typed / (cols * rows) : 1;
      ctx.globalAlpha = 0.5 - 0.34 * frac; // bright while typing, quiet once a pattern
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle);
      ctx.drawImage(buf, -w / 2, -h / 2);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    if (reduced) {
      filling = false;
      layout();
      present();
      const ro = new ResizeObserver(() => {
        layout();
        present();
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now < startAt) return;
      if (!last) last = now;
      const dt = now - last;

      if (filling) {
        // speed ramps: readable typing at first, a rush by the end
        const frac = typed / (cols * rows);
        const speed = 30 + frac * 520; // chars per second
        if (dt >= 1000 / speed) {
          const n = Math.max(1, Math.round((dt / 1000) * speed));
          for (let k = 0; k < n && typed < cols * rows; k++) {
            putChar(typed);
            typed += 1;
          }
          last = now;
          if (typed >= cols * rows) filling = false;
        }
      } else {
        if (now - fadeAt > 700) {
          fadeBuf(0.045); // older rows sink into the glass
          fadeAt = now;
        }
        if (dt >= 400) {
          // shift everything up a row, type a fresh one at the bottom
          tctx.clearRect(0, 0, tmp.width, tmp.height);
          tctx.drawImage(buf, 0, 0);
          bctx.clearRect(0, 0, buf.width, buf.height);
          bctx.drawImage(tmp, 0, -lineH);
          const base = (scrollRow * cols) % WORD.length;
          bctx.font = font;
          bctx.fillStyle = ink();
          for (let c = 0; c < cols; c++) {
            bctx.fillText(WORD[(base + c) % WORD.length], c * cellW, (rows - 1) * lineH + lineH * 0.78);
          }
          scrollRow += 1;
          last = now;
          // the drift: straight for most of the repeat, then leans off-angle
          const cyc = scrollRow % 14;
          angle = cyc < 10 ? 0 : ((cyc - 9) / 5) * TILT;
        }
      }
      present();
    };

    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    layout();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="id-artfill" aria-hidden="true" />;
}
