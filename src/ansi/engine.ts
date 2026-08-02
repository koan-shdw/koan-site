import type { AnsiArtwork } from './types';
import { clearGlyphCache } from './glyphs';
import { coverLayout, drawCell, drawFrame, type Layout } from './renderer';
import { createTransition, type Transition, type TransitionKind } from './transitions';

export interface EngineOptions {
  dwellMs?: number;
  transitionMs?: number;
}

/** Cycles a library of ANSI artworks on a canvas: dwell → transition → dwell.
    Loops (multi-frame entries) animate during their dwell and freeze while
    being transitioned away from. Everything is driven off rAF time, so a
    hidden tab pauses the whole engine for free. */
export class AnsiEngine {
  private ctx: CanvasRenderingContext2D;
  private layouts: Layout[] = [];
  private cur = 0;
  private next = -1;
  private mode: 'dwell' | 'transition' = 'dwell';
  private modeStart = 0;
  private frame = 0;
  private frameAt = 0;
  private trans: Transition | null = null;
  private revealed: number[] = [];
  private lastKind: TransitionKind | null = null;
  private raf = 0;
  private readonly reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly dwellMs: number;
  private readonly transitionMs: number;

  constructor(
    private canvas: HTMLCanvasElement,
    private arts: AnsiArtwork[],
    opts: EngineOptions = {},
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.dwellMs = opts.dwellMs ?? 9000;
    this.transitionMs = opts.transitionMs ?? 1600;
  }

  start(): void {
    this.resize();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    clearGlyphCache();
    this.layouts = this.arts.map((a) => coverLayout(a, w, h));
    this.ctx.imageSmoothingEnabled = false;
    this.repaint();
  }

  /** Full repaint of current state — used on resize and transition end. */
  private repaint(): void {
    const { ctx } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    drawFrame(ctx, this.arts[this.cur], this.frame, this.layouts[this.cur]);
    if (this.mode === 'transition' && this.next >= 0) {
      const art = this.arts[this.next];
      const lay = this.layouts[this.next];
      for (const i of this.revealed) drawCell(ctx, art, 0, i, lay);
    }
  }

  private tick = (now: number): void => {
    this.raf = requestAnimationFrame(this.tick);
    if (this.modeStart === 0) this.modeStart = now;
    if (this.reduced) return; // static first frame; nothing cycles

    const art = this.arts[this.cur];
    if (this.mode === 'dwell') {
      if (art.fps > 0 && art.frames.length > 1) {
        if (this.frameAt === 0) this.frameAt = now;
        const step = 1000 / art.fps;
        if (now - this.frameAt >= step) {
          this.frame = (this.frame + 1) % art.frames.length;
          this.frameAt = now;
          drawFrame(this.ctx, art, this.frame, this.layouts[this.cur]);
        }
      }
      if (this.arts.length > 1 && now - this.modeStart >= this.dwellMs) {
        this.next = (this.cur + 1) % this.arts.length;
        const target = this.arts[this.next];
        this.trans = createTransition(this.pickKind(), target.cols, target.rows);
        this.revealed = [];
        this.mode = 'transition';
        this.modeStart = now;
      }
    } else {
      const p = Math.min(1, (now - this.modeStart) / this.transitionMs);
      const fresh = this.trans!.reveal(p);
      const target = this.arts[this.next];
      const lay = this.layouts[this.next];
      for (const i of fresh) {
        drawCell(this.ctx, target, 0, i, lay);
        this.revealed.push(i);
      }
      if (p >= 1) {
        this.cur = this.next;
        this.next = -1;
        this.trans = null;
        this.revealed = [];
        this.mode = 'dwell';
        this.modeStart = now;
        this.frame = 0;
        this.frameAt = now;
        this.repaint(); // clean paint — covers slivers where grid dims differ
      }
    }
  };

  private pickKind(): TransitionKind {
    const kinds: TransitionKind[] = ['mosaic', 'wipe'];
    let k = kinds[Math.floor(Math.random() * kinds.length)];
    if (k === this.lastKind) k = kinds[(kinds.indexOf(k) + 1) % kinds.length];
    this.lastKind = k;
    return k;
  }
}
