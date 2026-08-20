// Identity layer (spec §3.1) — grey glass card at 50%: anchor name, real name,
// role, one primary contact action (the email, top-right corner), quote +
// socials along the bottom. Contact lives HERE and only here; feed pills are
// filters, never contact. Behind it all, the art typer.
//
// The KOAN logotype is ASCII pasted over the card edge — figlet in the frame
// grey, TheDraw in true DOS color. Selection state lives in App (the KOAN
// egg opens the picker grid by the ANSI controller).
import { useLayoutEffect, useRef } from 'react';
import { Icon } from './icons';
import { TdfLine, type TdfRows } from './logo';
import LOGOS from '../assets/logos.json';
import FAV from '../assets/logos-fav.json';

// favorite td renders ride in the tiny baked file — the header only waits
// on the 1.9MB chunk for non-shortlist colored picks
const FAV_TD = FAV.td as unknown as Record<string, TdfRows>;

export const EMAIL = 'alex@shdw.gallery';
export const LOGO_DEFAULT = 'ANSI Shadow';

export const SOCIALS = [
  { icon: 'instagram', label: 'koan.shdw', href: 'https://instagram.com/koan.shdw', hint: 'personal ig' },
  { icon: 'instagram', label: 'shdw.gallery', href: 'https://instagram.com/shdw.gallery', hint: 'the gallery ig' },
  { icon: 'x', label: 'x', href: 'https://x.com/koan_shdw', hint: '@koan_shdw' },
  { icon: 'youtube', label: 'youtube', href: 'https://youtube.com/@koan_shdw', hint: '@koan_shdw' },
  { icon: 'github', label: 'github', href: 'https://github.com/koan-shdw', hint: 'the tools' },
];

export function Header({ font, tdf }: { font: string; tdf: Record<string, TdfRows> | null }) {
  const tdRows = font.startsWith('td:')
    ? FAV_TD[font.slice(3)] ?? tdf?.[font.slice(3)]
    : undefined;
  // Oversize logos keep their size and their overlap — but a logo wider than
  // the screen fills off BOTH edges evenly instead of dumping the whole
  // overhang off the right (user rule 2026-08-20). Fits → untouched.
  //
  // The script only answers yes/no (wider than the screen?); the even fill is
  // pure CSS (.bleed → left 50% / translateX(-50%)), so it stays exact no
  // matter when fonts or the td chunk land — percentages track the glyphs.
  const asciiRef = useRef<HTMLPreElement>(null);
  useLayoutEffect(() => {
    const el = asciiRef.current;
    if (!el) return;
    const judge = () =>
      el.classList.toggle('bleed', el.offsetWidth > document.documentElement.clientWidth);
    judge();
    const ro = new ResizeObserver(judge); // width: max-content — the box tracks the glyphs
    ro.observe(el);
    window.addEventListener('resize', judge);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', judge);
    };
  }, [font, tdf]);
  const figlet =
    !font.startsWith('td:') && font in LOGOS
      ? (LOGOS as Record<string, string>)[font]
      : (LOGOS as Record<string, string>)[LOGO_DEFAULT];
  return (
    <header className="id">
      <div className="id-in">
        <a className="id-mail" href={`mailto:${EMAIL}`} title="write to koan">
          <Icon name="mail" size={14} />
          {EMAIL}
        </a>
        <h1 className="id-name sr-only">KOAN</h1>
        {tdRows ? (
          <pre ref={asciiRef} className="id-ascii td" aria-hidden="true">
            {tdRows.map((r, i) => (
              <TdfLine key={i} row={r} />
            ))}
          </pre>
        ) : (
          <pre ref={asciiRef} className="id-ascii" aria-hidden="true">
            {figlet}
          </pre>
        )}
        <div className="id-real">Alexander Mitchell</div>
        <div className="id-title">ART PRODUCER</div>
        <div className="id-foot">
          <p className="id-quote">working with the world's best artists to make good art</p>
          <nav className="id-social" aria-label="social links">
            {SOCIALS.map((s) => (
              <a key={s.label} className="soc" href={s.href} title={s.hint} target="_blank" rel="noreferrer">
                <Icon name={s.icon} size={18} />
                <span className="soc-l">{s.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
