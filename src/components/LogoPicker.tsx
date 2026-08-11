import LOGOS from '../assets/logos.json';
import { TdfLine, type TdfRows } from './logo';

// The logotype picker (KOAN egg) — grows out of the ANSI controller,
// bottom-left, same chrome. Every font is a live KOAN tile; click sets it,
// Esc closes (App owns the key). Tiles are content-visibility lazy so the
// 1373-cell grid stays cheap.
export function LogoPicker({
  current,
  tdf,
  onPick,
}: {
  current: string;
  tdf: Record<string, TdfRows> | null;
  onPick: (font: string) => void;
}) {
  return (
    <div className="logo-grid" role="dialog" aria-label="logotype picker">
      <div className="lg-head">logotype — click to set · esc closes</div>
      <div className="lg-grid">
        <button
          className={`lg-cell ${current === '__random' ? 'on' : ''}`}
          onClick={() => onPick('__random')}
          title="draw from the shortlist on every load"
        >
          <span className="lg-rand">?</span>
          <span className="lg-name">random — the shortlist</span>
        </button>
        {Object.entries(LOGOS as Record<string, string>).map(([f, art]) => (
          <button
            key={f}
            className={`lg-cell ${current === f ? 'on' : ''}`}
            onClick={() => onPick(f)}
            title={f}
          >
            <pre className="lg-prev">{art}</pre>
            <span className="lg-name">{f}</span>
          </button>
        ))}
        {Object.entries(tdf ?? {}).map(([f, rows]) => (
          <button
            key={`td:${f}`}
            className={`lg-cell ${current === `td:${f}` ? 'on' : ''}`}
            onClick={() => onPick(`td:${f}`)}
            title={`${f} — thedraw, colored`}
          >
            <pre className="lg-prev td">
              {rows.map((r, i) => (
                <TdfLine key={i} row={r} />
              ))}
            </pre>
            <span className="lg-name">{f}</span>
          </button>
        ))}
      </div>
      {!tdf && <div className="lg-load">loading the colored set…</div>}
    </div>
  );
}
