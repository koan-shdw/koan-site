// Identity layer (spec §3.1) — grey glass card: anchor name, real name, role,
// one primary contact action (the visible email), socials as an icon row.
// Contact lives HERE and only here; feed pills are filters, never contact.
import { Icon } from './icons';

const SOCIALS = [
  { icon: 'instagram', label: 'koan.shdw', href: 'https://instagram.com/koan.shdw', hint: '@koan.shdw — personal' },
  { icon: 'instagram', label: 'shdw.gallery', href: 'https://instagram.com/shdw.gallery', hint: '@shdw.gallery — the gallery' },
  { icon: 'x', label: 'x', href: 'https://x.com/koan_shdw', hint: '@koan_shdw' },
  { icon: 'youtube', label: 'youtube', href: 'https://youtube.com/@koan_shdw', hint: '@koan_shdw' },
  { icon: 'github', label: 'github', href: 'https://github.com/koan-shdw', hint: 'koan-shdw — the tools' },
];

export function Header() {
  return (
    <header className="id">
      <h1 className="id-name">KOAN</h1>
      <div className="id-real">Alexander Mitchell</div>
      <div className="id-title">ART PRODUCER</div>
      <div className="id-contact">
        <a className="id-mail" href="mailto:alex@shdw.gallery" title="write to koan">
          <Icon name="mail" size={14} />
          alex@shdw.gallery
        </a>
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
