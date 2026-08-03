import { useEffect, useState } from 'react';
import { EMAIL, SOCIALS } from './Header';
import { Icon } from './icons';

// Contact follows the reader (identity stays one layer, spec §3.1): once the
// identity card scrolls out of view, its email + socials fade into the bottom
// corner. Fades back out when the card returns.
export function SocialDock() {
  const [away, setAway] = useState(false);

  useEffect(() => {
    const id = document.querySelector('.id');
    if (!id) return;
    // scrolled past = the card's bottom edge has left the viewport
    const check = () => setAway(id.getBoundingClientRect().bottom < 0);
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <nav className={`dock soc-dock ${away ? 'show' : ''}`} aria-label="contact" aria-hidden={!away}>
      <a className="dock-b" href={`mailto:${EMAIL}`} title="write to koan">
        <Icon name="mail" size={15} />
      </a>
      <span className="dock-sep" />
      {SOCIALS.map((s) => (
        <a key={s.label} className="dock-b" href={s.href} title={s.hint} target="_blank" rel="noreferrer">
          <Icon name={s.icon} size={15} />
        </a>
      ))}
    </nav>
  );
}
