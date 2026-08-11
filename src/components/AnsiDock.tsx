import { useEffect, useState } from 'react';
import type { AnsiEngine } from '../ansi/engine';
import type { TransitionKind } from '../ansi/transitions';

// The background's player bar (desktop only) — bottom left, one glass strip:
// cycle the ANSI artworks by title, pin the transition style. Same widget
// grammar as the feed bar: pills, mono chrome, 24px controls.

const KINDS: (TransitionKind | 'auto')[] = ['auto', 'mosaic', 'wipe'];

export function AnsiDock({
  engine,
  logoChip,
}: {
  engine: AnsiEngine | null;
  /** KOAN egg: current logotype name, clicking opens the name grid */
  logoChip?: { name: string; onClick: () => void } | null;
}) {
  const [idx, setIdx] = useState(0);
  const [kind, setKind] = useState<TransitionKind | 'auto'>('auto');

  useEffect(() => {
    if (!engine) return;
    setIdx(engine.currentIndex());
    engine.onArt = setIdx;
    return () => {
      engine.onArt = undefined;
    };
  }, [engine]);

  if (!engine) return null;

  return (
    <div className="dock ansi-dock" role="group" aria-label="background player">
      <button className="dock-b" onClick={() => engine.goTo(idx - 1)} title="previous artwork">
        ‹
      </button>
      <span className="dock-title">{engine.artTitle(idx)}</span>
      <button className="dock-b" onClick={() => engine.goTo(idx + 1)} title="next artwork">
        ›
      </button>
      <span className="dock-sep" />
      {KINDS.map((k) => (
        <button
          key={k}
          className={`dock-b kind ${kind === k ? 'on' : ''}`}
          onClick={() => {
            setKind(k);
            engine.setKind(k);
          }}
          title={k === 'auto' ? 'random transition' : `always ${k}`}
        >
          {k}
        </button>
      ))}
      {logoChip && (
        <>
          <span className="dock-sep" />
          <button
            className="dock-b logo-chip"
            onClick={logoChip.onClick}
            title="the logotype font — click for the grid"
          >
            {logoChip.name}
          </button>
        </>
      )}
    </div>
  );
}
