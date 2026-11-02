// Draws a pre-rendered webp frame sequence onto a <canvas>, picking the frame for a 0..1 progress value.
import { FRAME_COUNTS, type SequenceName } from "../config/frames";

export interface FramePlayerOptions {
  /** Load every Nth frame (2 = half the downloads, used on mobile) */
  step?: number;
  /** Cap on devicePixelRatio to limit canvas memory on phones */
  maxDpr?: number;
}

export class FramePlayer {
  private readonly frames: HTMLImageElement[] = [];
  private readonly ctx: CanvasRenderingContext2D;
  private readonly maxDpr: number;
  private lastDrawn = -1;
  private progress = 0;
  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    sequence: SequenceName,
    { step = 1, maxDpr = 2 }: FramePlayerOptions = {},
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.maxDpr = maxDpr;
    this.preload(sequence, step);
    // Keep the canvas backing store in sync with its CSS size
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Start downloading frames; the first frame paints as soon as it arrives */
  private preload(sequence: SequenceName, step: number): void {
    for (let i = 1; i <= FRAME_COUNTS[sequence]; i += step) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/assets/frames/${sequence}/${String(i).padStart(3, "0")}.webp`;
      if (this.frames.length === 0) img.onload = () => this.redraw();
      this.frames.push(img);
    }
  }

  /** Paint the frame matching progress (0..1); skips work if that frame is already shown */
  render(progress: number): void {
    this.progress = Math.min(1, Math.max(0, progress));
    const target = Math.round(this.progress * (this.frames.length - 1));
    const index = this.nearestLoaded(target);
    if (index < 0 || index === this.lastDrawn) return;
    this.lastDrawn = index;
    this.drawCover(this.frames[index]);
  }

  /** Force a repaint at the current progress (after resize or first load) */
  private redraw(): void {
    this.lastDrawn = -1;
    this.render(this.progress);
  }

  /** Closest already-decoded frame, searching backwards first so motion never jumps ahead */
  private nearestLoaded(target: number): number {
    const ready = (i: number) => this.frames[i]?.complete && this.frames[i].naturalWidth > 0;
    for (let i = target; i >= 0; i--) if (ready(i)) return i;
    for (let i = target + 1; i < this.frames.length; i++) if (ready(i)) return i;
    return -1;
  }

  /** Draw like CSS `object-fit: cover` so frames fill any aspect ratio (phones are portrait) */
  private drawCover(img: HTMLImageElement): void {
    const { width: cw, height: ch } = this.canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    this.redraw();
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.frames.length = 0;
  }
}
