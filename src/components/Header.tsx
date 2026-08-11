// Identity layer (spec §3.1) — grey glass card at 50%: anchor name, real name,
// role, one primary contact action (the email, top-right corner), socials
// along the bottom. Contact lives HERE and only here; feed pills are filters,
// never contact. Behind it all, the art typer.
//
// The KOAN logotype is figlet ASCII pasted over the card edge. Picker phase:
// every TAAG font in a dropdown (user hand-selects, choice persists) — the
// winner gets baked in and the dropdown stripped.
import { useState } from 'react';
import { Icon } from './icons';
import LOGOS from '../assets/logos.json';

const LOGO_KEY = 'koan.logoFont';
const LOGO_DEFAULT = 'ANSI Shadow';

export const EMAIL = 'alex@shdw.gallery';

export const SOCIALS = [
  { icon: 'instagram', label: 'koan.shdw', href: 'https://instagram.com/koan.shdw', hint: 'personal ig' },
  { icon: 'instagram', label: 'shdw.gallery', href: 'https://instagram.com/shdw.gallery', hint: 'the gallery ig' },
  { icon: 'x', label: 'x', href: 'https://x.com/koan_shdw', hint: '@koan_shdw' },
  { icon: 'youtube', label: 'youtube', href: 'https://youtube.com/@koan_shdw', hint: '@koan_shdw' },
  { icon: 'github', label: 'github', href: 'https://github.com/koan-shdw', hint: 'the tools' },
];

export function Header() {
  const [font, setFont] = useState(() => {
    const saved = localStorage.getItem(LOGO_KEY);
    return saved && saved in LOGOS ? saved : LOGO_DEFAULT;
  });
  const pick = (f: string) => {
    setFont(f);
    localStorage.setItem(LOGO_KEY, f);
  };
  return (
    <header className="id">
      <div className="id-in">
        <a className="id-mail" href={`mailto:${EMAIL}`} title="write to koan">
          <Icon name="mail" size={14} />
          {EMAIL}
        </a>
        <h1 className="id-name sr-only">KOAN</h1>
        <pre className="id-ascii" aria-hidden="true">
          {(LOGOS as Record<string, string>)[font]}
        </pre>
        <select
          className="logo-pick"
          value={font}
          onChange={(e) => pick(e.target.value)}
          title="pick the logotype font — your choice sticks"
        >
          {Object.keys(LOGOS).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <div className="id-real">Alexander Mitchell</div>
        <div className="id-title">ART PRODUCER</div>
        <nav className="id-social" aria-label="social links">
          {SOCIALS.map((s) => (
            <a key={s.label} className="soc" href={s.href} title={s.hint} target="_blank" rel="noreferrer">
              <Icon name={s.icon} size={18} />
              <span className="soc-l">{s.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
