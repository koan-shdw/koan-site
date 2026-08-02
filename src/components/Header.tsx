// Identity layer (spec §3.1) — name, title, two-line bio, links row.
// Mono chrome chips per bible ch.02; edit LINKS in one place.
const LINKS = [
  { label: 'email', href: 'mailto:alexanderhughmitchell@gmail.com', hint: 'write to koan' },
  { label: 'instagram', href: 'https://instagram.com/koan', hint: 'art + drops' },
  { label: 'github', href: 'https://github.com/koan', hint: 'the apps' },
  { label: 'x', href: 'https://x.com/koan', hint: 'announcements' },
];

export function Header() {
  return (
    <header className="id">
      <div className="id-name">KOAN</div>
      <div className="id-title">ART PRODUCER</div>
      <p className="id-bio">
        archive fashion, original IP, and software that makes art. everything below is one
        feed — every platform, one card.
      </p>
      <nav className="id-links" aria-label="links">
        {LINKS.map((l) => (
          <a key={l.label} className="chip" href={l.href} title={l.hint} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
