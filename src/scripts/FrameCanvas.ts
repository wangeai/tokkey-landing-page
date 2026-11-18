// Draws one video frame at a time onto a <canvas>, fitted like CSS object-fit, and repaints on resize.
import { LOWER_VH, type FrameFit } from "../config/timeline";

export class FrameCanvas {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  /** What is on the canvas; `key` names the frame, since a video element stays the same object as it seeks */
  private drawn: { source: CanvasImageSource; fit: FrameFit; key: string } | null = null;
  /** Last share passed to setLowered (the browser may rewrite the style string, so don't compare against it) */
  private lowered = 0;

  constructor(
    readonly canvas: HTMLCanvasElement,
    /** Frame aspect ratio (width / height) */
    private readonly aspect: number,
    /** Cap on devicePixelRatio to limit canvas memory on phones */
    private readonly maxDpr = 2,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Show `source` (frame `key`); skips the draw if that frame is already on screen */
  draw(source: CanvasImageSource | null, fit: FrameFit, key: string): void {
    if (!source || (this.drawn?.key === key && this.drawn.fit === fit)) return;
    this.drawn = { source, fit, key };
    const { width: cw, height: ch } = this.canvas;
    // Scale from the frame's aspect: the small and full-size videos fit the same way
    const fw = fit === "cover" ? Math.max(cw, ch * this.aspect) : Math.min(cw, ch * this.aspect);
    const fh = fw / this.aspect;
    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(source, (cw - fw) / 2, (ch - fh) / 2, fw, fh);
  }

  /** Set a CSS filter on the canvas (no-op when unchanged) */
  setFilter(filter: string): void {
    if (this.canvas.style.filter !== filter) this.canvas.style.filter = filter;
  }

  /** Move the canvas down by `share` of LOWER_VH (no-op when unchanged) */
  setLowered(share: number): void {
    if (share === this.lowered) return;
    this.lowered = share;
    this.canvas.style.translate = share ? `0 ${share * LOWER_VH}vh` : "";
  }

  destroy(): void {
    this.resizeObserver.disconnect();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    // Resizing clears the canvas: repaint what was showing
    const drawn = this.drawn;
    this.drawn = null;
    if (drawn) this.draw(drawn.source, drawn.fit, drawn.key);
  }
}
