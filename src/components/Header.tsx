// Identity layer (spec §3.1) — grey glass card at 50%: anchor name, real name,
// role, one primary contact action (the email, top-right corner), socials
// along the bottom. Contact lives HERE and only here; feed pills are filters,
// never contact. Behind it all, the art typer.
//
// The KOAN logotype is figlet ASCII pasted over the card edge. Picker phase:
// every TAAG font in a dropdown (user hand-selects, choice persists) — the
// winner gets baked in and the dropdown stripped.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons';
import { PALETTE } from '../ansi/palette';
import LOGOS from '../assets/logos.json';

const LOGO_KEY = 'koan.logoFont';
const LOGO_DEFAULT = 'ANSI Shadow';

// TheDraw logos: [rowText, colorPerCell[]][] — attribute nibbles index the
// DOS palette. 1.9MB of picker candy, lazy-loaded, dies at bake time.
type TdfRows = [string, number[]][];

function TdfLine({ row }: { row: TdfRows[number] }) {
  const [s, colors] = row;
  const runs: { text: string; c: number }[] = [];
  for (let i = 0; i < s.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.c === colors[i]) last.text += s[i];
    else runs.push({ text: s[i], c: colors[i] });
  }
  return (
    <div>
      {runs.map((r, i) => {
        const fg = r.c & 15;
        const bg = (r.c >> 4) & 7;
        const blank = bg === 0 && r.text.trim() === '';
        return (
          <span
            key={i}
            style={blank ? undefined : { color: PALETTE[fg], background: bg ? PALETTE[bg] : undefined }}
          >
            {r.text}
          </span>
        );
      })}
    </div>
  );
}

export const EMAIL = 'alex@shdw.gallery';

export const SOCIALS = [
  { icon: 'instagram', label: 'koan.shdw', href: 'https://instagram.com/koan.shdw', hint: 'personal ig' },
  { icon: 'instagram', label: 'shdw.gallery', href: 'https://instagram.com/shdw.gallery', hint: 'the gallery ig' },
  { icon: 'x', label: 'x', href: 'https://x.com/koan_shdw', hint: '@koan_shdw' },
  { icon: 'youtube', label: 'youtube', href: 'https://youtube.com/@koan_shdw', hint: '@koan_shdw' },
  { icon: 'github', label: 'github', href: 'https://github.com/koan-shdw', hint: 'the tools' },
];

export function Header() {
  const [tdf, setTdf] = useState<Record<string, TdfRows> | null>(null);
  const [font, setFont] = useState(() => localStorage.getItem(LOGO_KEY) ?? LOGO_DEFAULT);
  useEffect(() => {
    void import('../assets/logos-tdf.json').then((m) =>
      setTdf(m.default as unknown as Record<string, TdfRows>),
    );
  }, []);
  const pick = (f: string) => {
    setFont(f);
    localStorage.setItem(LOGO_KEY, f);
  };
  const tdRows = font.startsWith('td:') ? tdf?.[font.slice(3)] : undefined;
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
          <pre className="id-ascii td" aria-hidden="true">
            {tdRows.map((r, i) => (
              <TdfLine key={i} row={r} />
            ))}
          </pre>
        ) : (
          <pre className="id-ascii" aria-hidden="true">
            {figlet}
          </pre>
        )}
        {createPortal(
          // portaled: the intro's transforms would trap fixed positioning
          <select
            className="logo-pick"
            value={font}
            onChange={(e) => pick(e.target.value)}
            title="pick the logotype font — your choice sticks"
          >
            <optgroup label="figlet">
              {Object.keys(LOGOS).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </optgroup>
            <optgroup label="thedraw (colored)">
              {Object.keys(tdf ?? {}).map((f) => (
                <option key={f} value={`td:${f}`}>
                  {f}
                </option>
              ))}
            </optgroup>
          </select>,
          document.body,
        )}
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
