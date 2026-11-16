// Chapter 1 hero: Prometheus reaching for the cube. A 3D-tilting stage (painting + figure) under two canvases: drifting
// smoke puffs that part around the pointer, and a fire stream that flows along two curves into the cube and bends
// toward the pointer. A focus box tracks the cube. `light` (0..1) is raised by AboutIntro as the darkness opens.
import { AboutMath, PointerTracker } from "./PointerTracker";

type Point = [number, number];
type Rgb = [number, number, number];

interface FlowParticle {
  t: number;
  v: number;
  off: number;
  wob: number;
  size: number;
  hue: number;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  r: number;
}
interface Cloud {
  x: number;
  y: number;
  depth: number;
  s: number;
  vx: number;
  img: HTMLCanvasElement;
  a: number;
  ox: number;
  oy: number;
  rot: number;
}

export class PrometheusHero {
  /** Source painting size; the stage covers the hero at this aspect, slightly overscanned for the tilt */
  private static readonly IMG_W = 1672;
  private static readonly IMG_H = 941;
  private static readonly OVERSCAN = 1.04;
  /** Fire stream: two cubic curves (image fractions) from the sky into the cube, then out to the ground */
  private static readonly PATHS: Point[][] = [
    [
      [0.852, 0.272],
      [0.8, 0.395],
      [0.718, 0.4],
      [0.676, 0.536],
    ],
    [
      [0.676, 0.54],
      [0.705, 0.615],
      [0.765, 0.64],
      [0.825, 0.7],
    ],
  ];
  /** Glowing nodes: source, cube (index 1, kept clear so the cube stays visible), sink */
  static readonly NODES: { p: Point; r: number; c: Rgb }[] = [
    { p: [0.852, 0.272], r: 0.08, c: [255, 196, 120] },
    { p: [0.676, 0.536], r: 0.045, c: [255, 240, 205] },
    { p: [0.825, 0.7], r: 0.075, c: [255, 186, 96] },
  ];
  private static readonly CLEAR_R = 0.042;
  /** Smoke spawn zones [x, y, w, h], away from the figure */
  private static readonly ZONES = [
    [0.55, 0.0, 0.45, 0.3],
    [0.86, 0.22, 0.14, 0.55],
    [0.0, 0.62, 0.55, 0.38],
    [0.35, 0.0, 0.3, 0.22],
    [0.7, 0.75, 0.3, 0.25],
  ];

  /** Intro progress: 0 = dark, 1 = fully lit */
  light = 0;
  /** Mobile shifts the painting left so the cube stays in frame (set by AboutPage's matchMedia) */
  mobile = false;

  private readonly stage: HTMLElement;
  private readonly fig: HTMLElement;
  private readonly fireC: HTMLCanvasElement;
  private readonly fogC: HTMLCanvasElement;
  private readonly fx: CanvasRenderingContext2D;
  private readonly gx: CanvasRenderingContext2D;
  private readonly hot: HTMLElement;
  private readonly hotBox: HTMLElement;
  private readonly anchor: HTMLElement;
  private readonly pointer: PointerTracker;
  private readonly dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  private readonly parts: FlowParticle[] = [];
  private readonly sparks: Spark[] = [];
  private readonly clouds: Cloud[] = [];
  private W = 0;
  private shift = 0;

  constructor(private readonly hero: HTMLElement) {
    const q = <T extends HTMLElement>(sel: string) => hero.querySelector<T>(sel)!;
    this.stage = q("[data-ref=stage]");
    this.fig = q("#fig");
    this.fireC = q<HTMLCanvasElement>("#fire");
    this.fogC = q<HTMLCanvasElement>("#fog");
    this.fx = this.fireC.getContext("2d")!;
    this.gx = this.fogC.getContext("2d")!;
    this.hot = q("[data-ref=hot]");
    this.hotBox = this.hot.querySelector<HTMLElement>(".box")!;
    this.anchor = q("#anchor");
    this.pointer = new PointerTracker(hero);

    for (let i = 0; i < 260; i++) this.spawn(Math.random());
    this.seedClouds();

    addEventListener("resize", () => this.layout());
    const bg = q<HTMLImageElement>("#bg");
    if (!bg.complete) bg.addEventListener("load", () => this.layout());
    this.layout();
  }

  /** Burst of sparks at the cube (intro ignition) */
  ignite(): void {
    const [x, y] = PrometheusHero.NODES[1].p;
    for (let i = 0; i < 40; i++) this.sparks.push(this.mkSpark(x, y, 1.4));
  }

  /** Size the stage and canvases to cover the hero */
  layout(): void {
    const vw = this.hero.clientWidth;
    const vh = this.hero.clientHeight;
    const s = Math.max(vw / PrometheusHero.IMG_W, vh / PrometheusHero.IMG_H) * PrometheusHero.OVERSCAN;
    const W = PrometheusHero.IMG_W * s;
    const H = PrometheusHero.IMG_H * s;
    this.W = W;
    this.stage.style.width = `${W}px`;
    this.stage.style.height = `${H}px`;
    this.shift = this.mobile ? (W - vw) * 0.28 : 0;
    this.fireC.width = W * this.dpr;
    this.fireC.height = H * this.dpr;
    this.fogC.width = W * 0.5;
    this.fogC.height = H * 0.5;
  }

  /** One frame: tilt the stage, sway the figure, track the cube, and draw smoke + fire while on screen */
  render(time: number): void {
    const m = this.pointer;
    m.ease(0.06);
    this.stage.style.left = "50%";
    this.stage.style.top = "50%";
    this.stage.style.transform =
      `translate(calc(-50% - ${this.shift}px), -50%) ` +
      `rotateY(${m.cx * 4.5}deg) rotateX(${-m.cy * 3}deg) ` +
      `translate3d(${-m.cx * 14}px, ${-m.cy * 8}px, 0)`;
    const sw = Math.sin(time * 0.0006);
    const sw2 = Math.sin(time * 0.00037 + 1.3);
    this.fig.style.transform = `translate3d(${sw2 * 2.5 - m.cx * 6}px, ${Math.sin(time * 0.0009) * 1.5}px, 0) rotate(${sw * 0.35 + m.cx * 0.25}deg)`;
    this.fogC.style.transform = `translate3d(${m.cx * 18}px, ${m.cy * 8}px, 0) scale(1.04)`;

    // Focus box follows the cube's anchor through the tilt
    const ar = this.anchor.getBoundingClientRect();
    const hr = this.hero.getBoundingClientRect();
    const bs = Math.max(34, this.W * 0.036);
    this.hot.style.transform = `translate3d(${ar.left - hr.left}px, ${ar.top - hr.top}px, 0)`;
    this.hotBox.style.width = this.hotBox.style.height = `${bs}px`;
    this.hot.style.setProperty("--gap", `${bs * 0.5 + 8}px`);

    if (-hr.top < innerHeight) {
      this.renderFog(time);
      this.renderFire(time);
    }
  }

  /** Pointer position as a fraction of the stage (the painting), for pulling fire and smoke */
  private pointerOnStage(): Point {
    const r = this.stage.getBoundingClientRect();
    return [(this.pointer.clientX - r.left) / r.width, (this.pointer.clientY - r.top) / r.height];
  }

  private static bez(P: Point[], t: number): Point {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [
      a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0],
      a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1],
    ];
  }

  /** Point along the whole stream, t in 0..1 across both curves */
  private static pathAt(t: number): Point {
    const P = PrometheusHero.PATHS;
    return t < 0.5 ? PrometheusHero.bez(P[0], t * 2) : PrometheusHero.bez(P[1], (t - 0.5) * 2);
  }

  private spawn(t0?: number): void {
    this.parts.push({
      t: t0 ?? Math.random() * 0.04,
      v: 0.0016 + Math.random() * 0.0022,
      off: (Math.random() - 0.5) * 2,
      wob: Math.random() * 6.28,
      size: 0.6 + Math.random() * 1.8,
      hue: Math.random(),
    });
  }

  private mkSpark(x: number, y: number, power: number): Spark {
    const a = Math.random() * 6.283;
    const sp = (0.0006 + Math.random() * 0.0024) * power;
    return {
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 0.0008 * power,
      life: 1,
      decay: 0.008 + Math.random() * 0.02,
      r: 0.8 + Math.random() * 1.8,
    };
  }

  private static drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: Rgb, a: number): void {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,240,${a})`);
    g.addColorStop(0.18, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.7})`);
    g.addColorStop(1, `rgba(${c[0]},${(c[1] * 0.5) | 0},0,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
  }

  private renderFire(time: number): void {
    const { fx, pointer: m } = this;
    const w = this.fireC.width;
    const h = this.fireC.height;
    const k = w;
    fx.clearRect(0, 0, w, h);
    fx.globalCompositeOperation = "lighter";
    const [mx, my] = this.pointerOnStage();
    const heat = (0.55 + 0.45 * Math.min(1, m.speed * 0.04) + (m.inside ? 0.15 : 0)) * (0.25 + 0.75 * this.light);
    const flowBoost = 1 + m.cx * 0.6 + Math.min(1.5, m.speed * 0.02);

    // Layered strokes along the curves, bent toward the pointer
    const pull = (q: Point): Point => {
      if (!m.inside) return q;
      const dx = mx - q[0];
      const dy = my - q[1];
      const f = Math.max(0, 0.18 - Math.hypot(dx, dy)) * 0.35;
      return [q[0] + dx * f, q[1] + dy * f];
    };
    for (const [lw, a] of [
      [0.03, 0.05],
      [0.014, 0.1],
      [0.005, 0.32],
      [0.0018, 0.8],
    ]) {
      fx.lineWidth = lw * k * (0.85 + 0.15 * Math.sin(time * 0.004)) * heat;
      fx.strokeStyle = `rgba(255,${lw < 0.003 ? 236 : 160},${lw < 0.003 ? 190 : 70},${a})`;
      fx.lineCap = "round";
      for (const P of PrometheusHero.PATHS) {
        const c1 = pull(P[1]);
        const c2 = pull(P[2]);
        fx.beginPath();
        fx.moveTo(P[0][0] * w, P[0][1] * h);
        fx.bezierCurveTo(c1[0] * w, c1[1] * h, c2[0] * w, c2[1] * h, P[3][0] * w, P[3][1] * h);
        fx.stroke();
      }
    }
    PrometheusHero.NODES.forEach((n, i) => {
      if (i === 1) return;
      const pulse = 0.75 + 0.25 * Math.sin(time * 0.003 + i * 2.1);
      const near = m.inside ? Math.max(0, 1 - Math.hypot(mx - n.p[0], my - n.p[1]) / 0.25) : 0;
      PrometheusHero.drawGlow(fx, n.p[0] * w, n.p[1] * h, n.r * k * (pulse + near * 0.6) * heat, n.c, 0.5 + near * 0.4);
    });

    // Particles flowing along the stream
    for (let i = 0; i < Math.round(3 * flowBoost); i++) if (this.parts.length < 900) this.spawn();
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += p.v * flowBoost;
      p.wob += 0.08;
      if (p.t >= 1) {
        if (Math.random() < 0.35) this.sparks.push(this.mkSpark(...PrometheusHero.pathAt(1), 1));
        this.parts.splice(i, 1);
        continue;
      }
      let [x, y] = PrometheusHero.pathAt(p.t);
      const [x2, y2] = PrometheusHero.pathAt(Math.min(1, p.t + 0.01));
      let nx = -(y2 - y);
      let ny = x2 - x;
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl;
      ny /= nl;
      const spread = 0.006 + 0.01 * Math.sin(p.t * Math.PI);
      x += nx * (p.off * spread + Math.sin(p.wob) * 0.003);
      y += ny * (p.off * spread + Math.sin(p.wob) * 0.003);
      if (m.inside) {
        const dx = mx - x;
        const dy = my - y;
        const d = Math.hypot(dx, dy);
        if (d < 0.16) {
          const f = (0.16 - d) * 0.5;
          x += dx * f;
          y += dy * f;
          if (Math.random() < 0.004 * (1 + m.speed * 0.05)) this.sparks.push(this.mkSpark(x, y, 0.8));
        }
      }
      const r = p.size * k * 0.0011 * heat;
      const col = p.hue < 0.5 ? "255,214,140" : p.hue < 0.85 ? "255,150,60" : "255,250,230";
      const g = fx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * 2.8);
      g.addColorStop(0, "rgba(255,252,236,0.95)");
      g.addColorStop(0.3, `rgba(${col},0.7)`);
      g.addColorStop(1, `rgba(${col},0)`);
      fx.fillStyle = g;
      fx.beginPath();
      fx.arc(x * w, y * h, r * 2.8, 0, 6.283);
      fx.fill();
    }

    // Sparks thrown off by a moving pointer
    if (m.inside && m.speed > 2 && this.sparks.length < 400) {
      for (let i = 0; i < Math.min(4, m.speed * 0.1); i++) this.sparks.push(this.mkSpark(mx, my, 0.5));
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy -= 0.00004;
      s.vx *= 0.985;
      s.vy *= 0.985;
      s.life -= s.decay;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      fx.fillStyle = `rgba(255,${(180 + 60 * s.life) | 0},${(90 * s.life) | 0},${s.life})`;
      fx.beginPath();
      fx.arc(s.x * w, s.y * h, s.r * k * 0.001 * (0.4 + s.life), 0, 6.283);
      fx.fill();
    }

    // Keep the cube itself clear, with a faint cool rim once lit
    const [cxF, cyF] = PrometheusHero.NODES[1].p;
    const cx = cxF * w;
    const cy = cyF * h;
    const cr = PrometheusHero.CLEAR_R * k;
    fx.globalCompositeOperation = "destination-out";
    const clr = fx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    clr.addColorStop(0, "rgba(0,0,0,0.97)");
    clr.addColorStop(0.55, "rgba(0,0,0,0.9)");
    clr.addColorStop(1, "rgba(0,0,0,0)");
    fx.fillStyle = clr;
    fx.beginPath();
    fx.arc(cx, cy, cr, 0, 6.283);
    fx.fill();
    fx.globalCompositeOperation = "lighter";
    const rim = fx.createRadialGradient(cx, cy, cr * 0.42, cx, cy, cr * 0.95);
    const ra = (0.16 + 0.08 * Math.sin(time * 0.003)) * this.light;
    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(0.35, `rgba(235,242,255,${ra})`);
    rim.addColorStop(1, "rgba(255,255,255,0)");
    fx.fillStyle = rim;
    fx.beginPath();
    fx.arc(cx, cy, cr, 0, 6.283);
    fx.fill();
    fx.globalCompositeOperation = "source-over";
  }

  /** Pre-render a soft smoke puff sprite */
  private static makePuff(seed: number, tint: string): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    const rnd = AboutMath.seeded(seed);
    for (let i = 0; i < 46; i++) {
      const px = 128 + (rnd() - 0.5) * 150;
      const py = 128 + (rnd() - 0.5) * 80 - rnd() * 20;
      const r = 26 + rnd() * 54;
      const g = x.createRadialGradient(px, py - r * 0.25, 0, px, py, r);
      g.addColorStop(0, `rgba(${tint},${0.1 + rnd() * 0.08})`);
      g.addColorStop(1, `rgba(${tint},0)`);
      x.fillStyle = g;
      x.beginPath();
      x.arc(px, py, r, 0, 6.283);
      x.fill();
    }
    return c;
  }

  private seedClouds(): void {
    const puffs = [
      PrometheusHero.makePuff(7, "236,214,190"),
      PrometheusHero.makePuff(91, "255,196,140"),
      PrometheusHero.makePuff(313, "200,190,185"),
      PrometheusHero.makePuff(555, "255,226,190"),
    ];
    for (let i = 0; i < 46; i++) {
      const z = PrometheusHero.ZONES[i % PrometheusHero.ZONES.length];
      const depth = 0.3 + Math.random() * 0.7;
      this.clouds.push({
        x: z[0] + Math.random() * z[2],
        y: z[1] + Math.random() * z[3],
        depth,
        s: 0.18 + Math.random() * 0.28 * depth,
        vx: (0.00004 + Math.random() * 0.0001) * depth,
        img: puffs[i % 4],
        a: 0.28 + Math.random() * 0.37,
        ox: 0,
        oy: 0,
        rot: Math.random() * 6.28,
      });
    }
  }

  private renderFog(time: number): void {
    const { gx, pointer: m } = this;
    const w = this.fogC.width;
    const h = this.fogC.height;
    gx.clearRect(0, 0, w, h);
    const [mx, my] = this.pointerOnStage();
    const wind = 1 + m.cx * 1.4 + Math.min(3, m.speed * 0.03);
    for (const c of this.clouds) {
      c.x += c.vx * wind;
      if (c.x > 1.15) c.x = -0.25;
      if (c.x < -0.3) c.x = 1.1;
      // Puffs near the pointer drift away from it
      let tx = 0;
      let ty = 0;
      if (m.inside) {
        const dx = c.x - mx;
        const dy = c.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 0.22) {
          const f = (0.22 - d) / 0.22;
          tx = (dx / (d || 1)) * f * 0.09 * c.depth;
          ty = (dy / (d || 1)) * f * 0.07 * c.depth;
        }
      }
      c.ox += (tx - c.ox) * 0.05;
      c.oy += (ty - c.oy) * 0.05;
      const px = c.x + c.ox - m.cx * 0.03 * c.depth;
      const py = c.y + c.oy + Math.sin(time * 0.0004 + c.rot) * 0.006 - m.cy * 0.02 * c.depth;
      const size = c.s * w;
      gx.globalAlpha = c.a * (0.8 + 0.2 * Math.sin(time * 0.0007 + c.rot));
      gx.drawImage(c.img, px * w - size / 2, py * h - size * 0.3, size, size * 0.6);
    }
    gx.globalAlpha = 1;
  }
}
