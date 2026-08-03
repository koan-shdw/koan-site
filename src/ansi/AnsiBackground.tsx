import { useEffect, useRef } from 'react';
import type { AnsiArtwork } from './types';
import { AnsiEngine } from './engine';

/** Full-viewport ANSI art layer. Sits behind everything; the UI layer above
    is fully independent of it (koan-site spec §7b). */
export function AnsiBackground({
  arts,
  onEngine,
}: {
  arts: AnsiArtwork[];
  /** hands the live engine to the player bar; called with null on teardown */
  onEngine?: (engine: AnsiEngine | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || arts.length === 0) return;
    const engine = new AnsiEngine(canvas, arts);
    engine.start();
    onEngine?.(engine);
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__ansiDebug = { AnsiEngine, arts, engine };
    }
    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      engine.stop();
      onEngine?.(null);
    };
  }, [arts]);

  return (
    <div className="ansi-bg" aria-hidden="true">
      <canvas ref={ref} />
      <div className="ansi-dim" />
    </div>
  );
}
