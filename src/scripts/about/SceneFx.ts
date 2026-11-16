// Chapters 2 and 3 hero atmosphere: the painting tilts with the pointer, a canvas adds a glowing lever beam
// (Archimedes) or a rising blade (Arthur) with drifting motes, a focus box + label track the device, and a warm
// spotlight leans toward the pointer. Image-space points follow object-fit:cover AND the live tilt, so overlays stay
// glued to the painting.
import { AboutMath, PointerTracker } from "./PointerTracker";

type Point = [number, number];

interface Mote {
  u: number;
  life: number;
  speed: number;
  size: number;
  hue: number;
}

/** object-fit:cover mapping of the image plus its current transform */
interface CoverFit {
  ox: number;
  oy: number;
  s: number;
  w: number;
  h: number;
  iw: number;
  ih: number;
  M: DOMMatrix | null;
}

export class SceneFx {
  /** Scene perspective (px), must match .scene { perspective } */
  private static readonly PERSPECTIVE = 1600;
  /** Lever beam polyline (image fractions), from the fulcrum to the tip */
  private static readonly LEVER: Point[] = [
    [0.447, 0.843],
    [0.43, 0.79],
    [0.55, 0.69],
    [0.714, 0.478],
    [0.8, 0.3],
    [0.84, 0.19],
  ];

  private readonly kind: "lever" | "sword";
  private readonly img: HTMLImageElement;
  private readonly cv: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly spot: HTMLElement;
  private readonly hot: HTMLElement;
  private readonly box: HTMLElement;
  private readonly dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  /** Pointer for the effects (stays where it left) and for the tilt (recentres on leave) */
  private readonly pointer: PointerTracker;
  private readonly tilt: PointerTracker;
  private readonly parts: Mote[];
  private readonly motes: Mote[];

  constructor(private readonly scene: HTMLElement) {
    this.kind = scene.dataset.fx === "lever" ? "lever" : "sword";
    this.img = scene.querySelector<HTMLImageElement>(".color")!;
    this.cv = scene.querySelector<HTMLCanvasElement>(".fx-canvas")!;
    this.ctx = this.cv.getContext("2d")!;
    this.spot = scene.querySelector<HTMLElement>(".spot")!;
    this.hot = scene.querySelector<HTMLElement>(".hot")!;
    this.box = this.hot.querySelector<HTMLElement>(".box")!;
    this.pointer = new PointerTracker(scene, false);
    this.tilt = new PointerTracker(scene);
    this.parts = SceneFx.mkMotes(this.kind === "lever" ? 90 : 70);
    this.motes = SceneFx.mkMotes(26);
  }

  private static mkMotes(n: number): Mote[] {
    return Array.from({ length: n }, () => ({
      u: Math.random(),
      life: Math.random(),
      speed: 0.4 + Math.random() * 1.1,
      size: 0.6 + Math.random() * 1.6,
      hue: Math.random(),
    }));
  }

  private static leverAt(u: number): Point {
    const L = SceneFx.LEVER;
    const x = Math.min(L.length - 1.001, Math.max(0, u * (L.length - 1)));
    const i = Math.floor(x);
    const k = x - i;
    return [L[i][0] + (L[i + 1][0] - L[i][0]) * k, L[i][1] + (L[i + 1][1] - L[i][1]) * k];
  }

  private coverFit(): CoverFit {
    const img = this.img;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    const iw = img.naturalWidth || 1672;
    const ih = img.naturalHeight || 941;
    const s = Math.max(w / iw, h / ih);
    let M: DOMMatrix | null = null;
    try {
      M = img.style.transform ? new DOMMatrix(img.style.transform) : null;
    } catch {
      M = null;
    }
    return { ox: (w - iw * s) / 2, oy: (h - ih * s) / 2, s, w, h, iw, ih, M };
  }

  /** Image fraction → scene pixels, through the cover fit and the perspective tilt */
  private static pt(f: CoverFit, x: number, y: number): Point {
    const lx = f.ox + x * f.iw * f.s;
    const ly = f.oy + y * f.ih * f.s;
    if (!f.M) return [lx, ly];
    const cx = f.w / 2;
    const cy = f.h / 2;
    const p = f.M.transformPoint(new DOMPoint(lx - cx, ly - cy, 0));
    const k = SceneFx.PERSPECTIVE / (SceneFx.PERSPECTIVE - p.z);
    return [cx + p.x * k, cy + p.y * k];
  }

  /** One frame; skipped while the scene is off screen */
  render(time: number): void {
    if (!AboutMath.onScreen(this.scene, 40)) return;

    // Tilt the painting first so the overlays read its new transform
    const t = this.tilt;
    t.ease(0.06);
    this.img.style.transform = `scale(1.06) rotateY(${t.cx * 3.5}deg) rotateX(${-t.cy * 2.4}deg) translate3d(${-t.cx * 12}px, ${-t.cy * 7}px, 0)`;

    const fit = this.coverFit();
    const m = this.pointer;
    m.ease(0.08);
    this.cv.width = Math.round(fit.w * this.dpr);
    this.cv.height = Math.round(fit.h * this.dpr);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, fit.w, fit.h);
    const heat = 0.55 + Math.min(0.9, m.speed * 0.012) + (m.inside ? 0.25 : 0);
    const near = (x: number, y: number) =>
      m.inside ? Math.max(0, 1 - Math.hypot(m.x * fit.w - x, m.y * fit.h - y) / 260) : 0;

    if (this.kind === "lever") this.drawLever(fit, heat, near);
    else this.drawSword(fit, heat, near, time);

    // Ambient motes rising through the lower half
    for (const p of this.motes) {
      p.life += 0.0016 * p.speed;
      if (p.life > 1) {
        p.life = 0;
        p.u = Math.random();
      }
      ctx.fillStyle = `rgba(255,220,160,${(0.35 * Math.sin(Math.PI * p.life)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.u * fit.w, fit.h * (1 - p.life) * 0.6 + fit.h * 0.35, p.size, 0, 6.283);
      ctx.fill();
    }

    this.trackDevice(fit, near);
  }

  private drawLever(fit: CoverFit, heat: number, near: (x: number, y: number) => number): void {
    const ctx = this.ctx;
    const L = SceneFx.LEVER;
    ctx.lineCap = "round";
    for (let i = 1; i < L.length; i++) {
      const [x1, y1] = SceneFx.pt(fit, L[i - 1][0], L[i - 1][1]);
      const [x2, y2] = SceneFx.pt(fit, L[i][0], L[i][1]);
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, "rgba(255,176,70,.05)");
      g.addColorStop(1, "rgba(255,214,140,.55)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 7;
      ctx.globalAlpha = 0.5 * heat;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const [tx, ty] = SceneFx.pt(fit, 0.84, 0.19);
    const tip = ctx.createRadialGradient(tx, ty, 0, tx, ty, 150);
    tip.addColorStop(0, `rgba(255,236,190,${0.55 * heat})`);
    tip.addColorStop(1, "rgba(255,180,70,0)");
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.arc(tx, ty, 150, 0, 6.283);
    ctx.fill();
    // Embers lifting off the beam
    for (const p of this.parts) {
      p.life += 0.004 * p.speed;
      if (p.life > 1) {
        p.life = 0;
        p.u = Math.random();
      }
      const [ux, uy] = SceneFx.leverAt(Math.min(0.999, p.u));
      const [x, y] = SceneFx.pt(fit, ux, uy);
      const lift = p.life * (26 + p.speed * 30);
      const nx = near(x, y);
      const rad = p.size * (1.1 + nx * 1.4);
      const gg = ctx.createRadialGradient(x, y - lift, 0, x, y - lift, rad * 3.2);
      gg.addColorStop(0, `rgba(255,${p.hue < 0.5 ? 230 : 176},120,${(0.85 * Math.sin(Math.PI * p.life) * (0.6 + nx)).toFixed(3)})`);
      gg.addColorStop(1, "rgba(255,160,60,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x, y - lift, rad * 3.2, 0, 6.283);
      ctx.fill();
    }
  }

  private drawSword(fit: CoverFit, heat: number, near: (x: number, y: number) => number, time: number): void {
    const ctx = this.ctx;
    const [bx, by] = SceneFx.pt(fit, 0.504, 0.855);
    const [hx, hy] = SceneFx.pt(fit, 0.504, 0.497);
    const pulse = 0.75 + 0.25 * Math.sin(time * 0.003);
    const blade = ctx.createLinearGradient(bx, by, hx, hy);
    blade.addColorStop(0, "rgba(255,236,190,0)");
    blade.addColorStop(0.35, `rgba(255,220,150,${(0.55 * heat * pulse).toFixed(3)})`);
    blade.addColorStop(1, `rgba(255,244,214,${(0.9 * heat).toFixed(3)})`);
    ctx.strokeStyle = blade;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 90);
    halo.addColorStop(0, `rgba(255,236,190,${0.5 * heat})`);
    halo.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hx, hy, 90, 0, 6.283);
    ctx.fill();
    // Light climbing the blade
    for (const p of this.parts) {
      p.life += 0.0032 * p.speed;
      if (p.life > 1) p.life = 0;
      const k = p.life;
      const x = bx + (hx - bx) * k + Math.sin(time * 0.002 + p.u * 12) * 5;
      const y = by + (hy - by) * k;
      const nx = near(x, y);
      const rad = p.size * (1.2 + nx);
      const gg = ctx.createRadialGradient(x, y, 0, x, y, rad * 3);
      gg.addColorStop(0, `rgba(255,240,200,${(0.8 * (1 - Math.abs(k * 2 - 1)) * (0.55 + nx)).toFixed(3)})`);
      gg.addColorStop(1, "rgba(255,210,140,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x, y, rad * 3, 0, 6.283);
      ctx.fill();
    }
  }

  /** Brackets + label on the device; data-px/py = its centre, data-pw/ph = its size, as image fractions */
  private trackDevice(fit: CoverFit, near: (x: number, y: number) => number): void {
    const d = this.hot.dataset;
    const px = Number(d.px);
    const py = Number(d.py);
    const pw = Number(d.pw) || 0.05;
    const ph = Number(d.ph) || 0.05;
    const [ax, ay] = SceneFx.pt(fit, px, py);
    const [lx] = SceneFx.pt(fit, px - pw / 2, py);
    const [rx] = SceneFx.pt(fit, px + pw / 2, py);
    const [, ty] = SceneFx.pt(fit, px, py - ph / 2);
    const [, by] = SceneFx.pt(fit, px, py + ph / 2);
    const pad = 10;
    const bw = Math.max(28, rx - lx + pad * 2);
    const bh = Math.max(22, by - ty + pad * 2);
    this.hot.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
    this.box.style.width = `${bw.toFixed(1)}px`;
    this.box.style.height = `${bh.toFixed(1)}px`;
    this.hot.style.setProperty("--gap", `${bh * 0.5 + 8}px`);
    this.hot.style.opacity = (0.82 + near(ax, ay) * 0.18).toFixed(3);

    // Spotlight sits on the device and leans toward the pointer
    const m = this.pointer;
    const ex = ax / fit.w;
    const ey = ay / fit.h;
    this.spot.style.setProperty("--sx", `${((m.inside ? m.x * 0.35 + ex * 0.65 : ex) * 100).toFixed(1)}%`);
    this.spot.style.setProperty("--sy", `${((m.inside ? m.y * 0.35 + ey * 0.65 : ey) * 100).toFixed(1)}%`);
  }
}
