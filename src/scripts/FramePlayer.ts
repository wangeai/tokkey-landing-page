// Draws frames from any FrameSequence onto one <canvas>, fitted like CSS object-fit, and repaints on resize.
import type { FrameSequence } from "./FrameSequence";

export type FrameFit = "cover" | "contain";

export class FramePlayer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private current: { sequence: FrameSequence; index: number; fit: FrameFit } | null = null;
  private lastDrawn: HTMLImageElement | null = null;

  constructor(
    readonly canvas: HTMLCanvasElement,
    /** Cap on devicePixelRatio to limit canvas memory on phones */
    private readonly maxDpr = 2,
  ) {
    this.ctx = canvas.getContext("2d")!;
    // Keep the canvas backing store in sync with its CSS size
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Show frame `index` of `sequence`; skips work if that exact image is already on screen */
  draw(sequence: FrameSequence, index: number, fit: FrameFit = "cover"): void {
    const changed = this.current?.fit !== fit;
    this.current = { sequence, index, fit };
    const img = sequence.nearestLoaded(Math.round(index));
    if (!img || (img === this.lastDrawn && !changed)) return;
    this.lastDrawn = img;

    const { width: cw, height: ch } = this.canvas;
    const pick = fit === "cover" ? Math.max : Math.min;
    const scale = pick(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    // Resizing clears the canvas, so repaint what was showing
    this.lastDrawn = null;
    if (this.current) this.draw(this.current.sequence, this.current.index, this.current.fit);
  }
}
