// Identity layer (spec §3.1) — name, real name, role, contact links.
// Contact lives HERE and only here; the feed pills below are content filters,
// never contact. Edit LINKS in one place.
const LINKS = [
  { label: 'email', href: 'mailto:alex@shdw.gallery', hint: 'write to koan' },
  { label: 'ig · koan.shdw', href: 'https://instagram.com/koan.shdw', hint: 'personal' },
  { label: 'ig · shdw.gallery', href: 'https://instagram.com/shdw.gallery', hint: 'the gallery' },
  { label: 'x', href: 'https://x.com/koan_shdw', hint: 'announcements' },
  { label: 'youtube', href: 'https://youtube.com/@koan_shdw', hint: 'video' },
  { label: 'github', href: 'https://github.com/koan-shdw', hint: 'the tools' },
];

export function Header() {
  return (
    <header className="id">
      <div className="id-name">KOAN</div>
      <div className="id-real">Alexander Mitchell</div>
      <div className="id-title">ART PRODUCER</div>
      <nav className="id-links" aria-label="contact">
        {LINKS.map((l) => (
          <a
            key={l.label}
            className="chip"
            href={l.href}
            title={l.hint}
            target={l.href.startsWith('mailto') ? undefined : '_blank'}
            rel="noreferrer"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
