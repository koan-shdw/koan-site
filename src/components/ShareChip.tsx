import { useEffect, useRef, useState } from 'react';

// Copies a note's canonical share URL — /note/<slug>/, the only form that
// unfurls a preview when pasted (docs/note-share-pages-spec.md §6). In-app
// navigation stays on hash routes; this chip is for leaving the site.
export function ShareChip({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flip = () => {
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1200);
  };

  // textarea + execCommand fallback: clipboard API needs a permission some
  // embedded webviews never grant; the chip must never fail silently
  const copyLegacy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) flip();
  };

  const copy = () => {
    const text = `${window.location.origin}/note/${slug}/`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(flip, () => copyLegacy(text));
    } else {
      copyLegacy(text);
    }
  };

  return (
    <button
      className={`share-chip ${copied ? 'ok' : ''}`}
      onClick={copy}
      title="copy this note's link — pastes with a preview"
    >
      {copied ? 'copied' : 'share'}
    </button>
  );
}
