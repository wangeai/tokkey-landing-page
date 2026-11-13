// Draws one decoded frame at a time onto a <canvas>, fitted like CSS object-fit, and repaints on resize.
import type { FrameFit } from "../config/timeline";

export class FrameCanvas {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private drawn: { bitmap: ImageBitmap; fit: FrameFit } | null = null;

  constructor(
    readonly canvas: HTMLCanvasElement,
    /** Frame aspect ratio (width / height) */
    private readonly aspect: number,
    /** Called with the widest the frame is ever drawn (cover fit), in backing px, so frames decode at that size */
    private readonly onResize: (frameWidth: number) => void,
    /** Cap on devicePixelRatio to limit canvas memory on phones */
    private readonly maxDpr = 2,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Show `bitmap`; skips the draw if it's already on screen */
  draw(bitmap: ImageBitmap | null, fit: FrameFit): void {
    if (!bitmap || (this.drawn?.bitmap === bitmap && this.drawn.fit === fit)) return;
    this.drawn = { bitmap, fit };
    const { width: cw, height: ch } = this.canvas;
    // Scale from the frame's aspect, not the bitmap's size: bitmaps may be decoded smaller than the source
    const fw = fit === "cover" ? Math.max(cw, ch * this.aspect) : Math.min(cw, ch * this.aspect);
    const fh = fw / this.aspect;
    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(bitmap, (cw - fw) / 2, (ch - fh) / 2, fw, fh);
  }

  /** Set a CSS filter on the canvas (no-op when unchanged) */
  setFilter(filter: string): void {
    if (this.canvas.style.filter !== filter) this.canvas.style.filter = filter;
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    // Resizing clears the canvas: repaint what was showing, before onResize may close it for a re-decode
    const drawn = this.drawn;
    this.drawn = null;
    if (drawn) this.draw(drawn.bitmap, drawn.fit);
    this.onResize(Math.max(this.canvas.width, this.canvas.height * this.aspect));
  }
}
