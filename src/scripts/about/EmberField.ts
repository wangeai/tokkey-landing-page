// Closing CTA background: embers rise from a warm glow at the bottom and drift toward the pointer, leaving short
// trails. Drawn only while the section is on screen.
import { AboutMath } from "./PointerTracker";

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  l: number;
  r: number;
}

export class EmberField {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly embers: Ember[] = [];
  private readonly dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  /** Attractor, 0..1 of the section */
  private readonly at = { x: 0.5, y: 0.6 };

  constructor(
    private readonly section: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.ctx = canvas.getContext("2d")!;
    section.addEventListener("pointermove", (e) => {
      const r = section.getBoundingClientRect();
      this.at.x = (e.clientX - r.left) / r.width;
      this.at.y = (e.clientY - r.top) / r.height;
    });
  }

  render(): void {
    if (!AboutMath.onScreen(this.section)) return;
    const r = this.section.getBoundingClientRect();
    const { ctx, canvas, at } = this;
    if ((canvas.width | 0) !== ((r.width * this.dpr) | 0)) {
      canvas.width = r.width * this.dpr;
      canvas.height = r.height * this.dpr;
    }
    const w = canvas.width;
    const h = canvas.height;
    // Translucent wash instead of a clear leaves trails
    ctx.fillStyle = "rgba(8,6,5,0.22)";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(at.x * w, h * 1.05, 0, at.x * w, h * 1.05, h * 0.9);
    g.addColorStop(0, "rgba(255,120,30,0.10)");
    g.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4; i++) {
      this.embers.push({ x: Math.random(), y: 1.02, vx: 0, vy: -(0.0015 + Math.random() * 0.004), l: 1, r: 1 + Math.random() * 2.5 });
    }
    ctx.globalCompositeOperation = "lighter";
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const p = this.embers[i];
      p.vx += (at.x - p.x) * 0.00006 + (Math.random() - 0.5) * 0.0004;
      p.x += p.vx;
      p.y += p.vy;
      p.l -= 0.004;
      if (p.l <= 0 || p.y < -0.05) {
        this.embers.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(255,${(150 + 90 * p.l) | 0},${(60 * p.l) | 0},${p.l})`;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.r * this.dpr, 0, 6.283);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
