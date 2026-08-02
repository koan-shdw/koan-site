export type TransitionKind = 'mosaic' | 'wipe';

/** A transition is a reveal order over the TARGET grid's cells. reveal(p)
    returns the cells newly uncovered at progress p∈[0,1] since the last call. */
export interface Transition {
  reveal(progress: number): number[];
}

export function createTransition(kind: TransitionKind, cols: number, rows: number): Transition {
  const n = cols * rows;
  const order = new Uint32Array(n);
  const times = new Float32Array(n);

  if (kind === 'mosaic') {
    for (let i = 0; i < n; i++) order[i] = i;
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    for (let i = 0; i < n; i++) times[i] = i / n;
  } else {
    // Wipe with a ragged edge: each cross-line gets a random offset so the
    // sweep front is jittered, not a ruler line.
    const dir = Math.floor(Math.random() * 4); // 0 L→R · 1 R→L · 2 T→B · 3 B→T
    const horiz = dir < 2;
    const main = horiz ? cols : rows;
    const cross = horiz ? rows : cols;
    const span = Math.max(2, main * 0.18);
    const jit = new Float32Array(cross);
    for (let i = 0; i < cross; i++) jit[i] = Math.random() * span;

    const raw = new Float32Array(n);
    for (let idx = 0; idx < n; idx++) {
      const cx = idx % cols;
      const cy = (idx / cols) | 0;
      let m = horiz ? cx : cy;
      if (dir === 1) m = cols - 1 - cx;
      if (dir === 3) m = rows - 1 - cy;
      raw[idx] = (m + jit[horiz ? cy : cx]) / (main + span);
    }
    const idxs = Array.from({ length: n }, (_, i) => i).sort((a, b) => raw[a] - raw[b]);
    for (let i = 0; i < n; i++) {
      order[i] = idxs[i];
      times[i] = raw[idxs[i]];
    }
  }

  let ptr = 0;
  return {
    reveal(p: number): number[] {
      const out: number[] = [];
      while (ptr < n && times[ptr] <= p) out.push(order[ptr++]);
      return out;
    },
  };
}
