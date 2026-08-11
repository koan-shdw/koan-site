import LOGOS from '../assets/logos.json';
import type { TdfRows } from './logo';

// The logotype name grid (KOAN egg) — opened from the dock chip. Names
// only, no previews: hovering a name live-updates the KOAN in the id card,
// clicking commits it. Esc backs out (App owns the key).
export function LogoPicker({
  current,
  tdf,
  onPick,
  onHover,
}: {
  current: string;
  tdf: Record<string, TdfRows> | null;
  onPick: (font: string) => void;
  onHover: (font: string | null) => void;
}) {
  const cell = (value: string, label: string) => (
    <button
      key={value}
      className={`lg-name ${current === value ? 'on' : ''}`}
      onMouseEnter={() => onHover(value)}
      onFocus={() => onHover(value)}
      onClick={() => onPick(value)}
      title="hover = try it | click = keep it"
    >
      {label}
    </button>
  );
  return (
    <div className="logo-grid" role="dialog" aria-label="logotype picker" onMouseLeave={() => onHover(null)}>
      <div className="lg-head">logotype — hover tries, click keeps · esc closes</div>
      <div className="lg-grid">
        {cell('__random', '? random')}
        {Object.keys(LOGOS).map((f) => cell(f, f))}
        {tdf && <div className="lg-sect">thedraw — colored</div>}
        {Object.keys(tdf ?? {}).map((f) => cell(`td:${f}`, f))}
      </div>
      {!tdf && <div className="lg-load">loading the colored set…</div>}
    </div>
  );
}
