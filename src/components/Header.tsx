// Identity layer (spec §3.1) — grey glass card at 50%: anchor name, real name,
// role, one primary contact action (the email, top-right corner), socials
// along the bottom. Contact lives HERE and only here; feed pills are filters,
// never contact. Behind it all, the art typer.
import { Icon } from './icons';
import { ArtFill, GlitchTitle } from './ArtTyper';

export const EMAIL = 'alex@shdw.gallery';

export const SOCIALS = [
  { icon: 'instagram', label: 'koan.shdw', href: 'https://instagram.com/koan.shdw', hint: 'personal ig' },
  { icon: 'instagram', label: 'shdw.gallery', href: 'https://instagram.com/shdw.gallery', hint: 'the gallery ig' },
  { icon: 'x', label: 'x', href: 'https://x.com/koan_shdw', hint: '@koan_shdw' },
  { icon: 'youtube', label: 'youtube', href: 'https://youtube.com/@koan_shdw', hint: '@koan_shdw' },
  { icon: 'github', label: 'github', href: 'https://github.com/koan-shdw', hint: 'the tools' },
];

export function Header() {
  return (
    <header className="id">
      <ArtFill />
      <div className="id-in">
        <a className="id-mail" href={`mailto:${EMAIL}`} title="write to koan">
          <Icon name="mail" size={14} />
          {EMAIL}
        </a>
        <h1 className="id-name">KOAN</h1>
        <div className="id-real">Alexander Mitchell</div>
        <GlitchTitle />
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
