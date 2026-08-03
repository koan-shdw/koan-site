import { useEffect, useState } from 'react';

// The role line glitches in once, then sits still. (The art-repeat fill that
// used to live behind the card was cut — user decision 2026-08-03.)

const TITLE = 'ART PRODUCER';
const GLITCH = '▓▒░█<>/\\|#*';

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
