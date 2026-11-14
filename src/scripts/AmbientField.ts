// Quiet ambient character field for the software page (ported from the prototype's `heroAmb` / `fxAmb`): a low-contrast
// glyph field that drifts slowly, with soft rings that pass through it on their own every few seconds and where the
// pointer moves or clicks. Drawn only while its host is on screen; one still frame and no rings under reduced motion.
import { AsciiField } from "./AsciiField";

export interface AmbientFieldOptions {
  color: string;
  /** Glyph alpha = min(maxAlpha, baseAlpha + level * stepAlpha) */
  maxAlpha: number;
  baseAlpha: number;
  stepAlpha: number;
}

/** A ring's origin (CSS px in the canvas) and start time (s) */
interface Ring {
  x: number;
  y: number;
  time: number;
}

export class AmbientField {
  /** Rings kept alive at once, and how long one lasts (s) */
  private static readonly MAX_RINGS = 3;
  private static readonly RING_LIFE = 6;
  /** Pointer moves only add a ring after this pause (ms) and distance (px) */
  private static readonly MOVE_GAP_MS = 420;
  private static readonly MOVE_GAP_PX = 90;
  /** Interval (ms) between rings that surface on their own */
  private static readonly IDLE_RING_MS = 4200;

  private readonly rings: Ring[] = [];
  private readonly still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private visible = false;
  private lastMove = { time: 0, x: -999, y: -999 };
  private lastClick = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: AmbientFieldOptions,
  ) {
    const field = new AsciiField(canvas, {
      ...options,
      sample: ({ x, y, time }) => this.base(x, y, this.still ? 0 : time) * 0.32 + this.ring(x, y, time) * 0.9,
    });

    // Host = the section the canvas decorates: it receives the pointer and decides visibility
    const host = canvas.parentElement ?? canvas;
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      field.setVisibility(this.visible ? 1 : 0);
    }).observe(host);
    if (this.still) return;

    host.addEventListener("pointerdown", (event) => this.onClick(event), { passive: true });
    host.addEventListener("pointermove", (event) => this.onMove(event), { passive: true });
    setTimeout(() => this.addRing(canvas.clientWidth * 0.62, canvas.clientHeight * 0.5), 1500);
    setInterval(() => {
      if (this.visible && !document.hidden) {
        this.addRing(canvas.clientWidth * (0.15 + 0.7 * Math.random()), canvas.clientHeight * (0.2 + 0.6 * Math.random()));
      }
    }, AmbientField.IDLE_RING_MS);
  }

  /** Slow interference pattern that keeps the field gently moving */
  private base(x: number, y: number, t: number): number {
    const a = Math.sin(x * 0.0062 + 1.3 + t * 0.11) * Math.sin(y * 0.0081 + 0.4 - t * 0.07);
    const b = Math.sin(x * 0.0027 - y * 0.0041 + 2.1 + t * 0.09);
    const v = Math.max(0, 0.55 * a + 0.45 * b);
    return v * v;
  }

  /** Sum of the expanding, fading rings at a point */
  private ring(x: number, y: number, t: number): number {
    let sum = 0;
    for (const ring of this.rings) {
      const age = t - ring.time;
      if (age < 0 || age > AmbientField.RING_LIFE) continue;
      const d = Math.hypot(x - ring.x, (y - ring.y) * 1.15);
      const g = (d - age * 70) / 48;
      sum += Math.exp(-g * g) * Math.exp(-age / 2.4) * (0.55 + 0.45 * Math.cos(d * 0.045));
    }
    return Math.min(1, sum);
  }

  private addRing(x: number, y: number): void {
    this.rings.push({ x, y, time: performance.now() / 1000 });
    if (this.rings.length > AmbientField.MAX_RINGS) this.rings.shift();
  }

  /** Pointer position in canvas CSS px */
  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private onClick(event: PointerEvent): void {
    const now = performance.now();
    if (now - this.lastClick < 700) return;
    this.lastClick = now;
    const { x, y } = this.point(event);
    this.addRing(x, y);
  }

  private onMove(event: PointerEvent): void {
    const now = performance.now();
    const { x, y } = this.point(event);
    const last = this.lastMove;
    if (now - last.time < AmbientField.MOVE_GAP_MS || Math.hypot(x - last.x, y - last.y) < AmbientField.MOVE_GAP_PX) return;
    this.lastMove = { time: now, x, y };
    this.addRing(x, y);
  }
}
