// Torn top edge of a paper mask: a jagged midpoint-displacement profile that climbs and spreads as the sheet rises,
// with a slow ripple, layered strokes (shadow, fibres, glow, rim) and glowing motes lifting off the edge.
import { AboutMath } from "./PointerTracker";

interface EdgeMote {
  u: number;
  life: number;
  speed: number;
  drift: number;
  size: number;
}

export class TornEdge {
  /** Profile resolution (points across the width) */
  private static readonly N = 512;

  private readonly prof: Float32Array;
  private readonly fill: SVGPathElement;
  private readonly lines: SVGPathElement[];
  private readonly motesEl: SVGGElement;
  private readonly motes: EdgeMote[];

  /** `index` seeds the profile, so every sheet tears differently */
  constructor(
    private readonly svg: SVGSVGElement,
    index: number,
  ) {
    this.prof = TornEdge.profile(TornEdge.N, 9173 + index * 31);
    this.fill = svg.querySelector<SVGPathElement>(".tfill")!;
    this.lines = [".trim", ".thalo", ".tglow", ".tshadow"].map((s) => svg.querySelector<SVGPathElement>(s)!);
    this.motesEl = svg.querySelector<SVGGElement>(".motes")!;
    this.motes = Array.from({ length: 40 }, () => ({
      u: Math.random(),
      life: Math.random(),
      speed: 0.12 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.6,
      size: 1.2 + Math.random() * 2.6,
    }));
  }

  /** Normalised 0..1 torn profile from midpoint displacement plus a few sharp nicks */
  private static profile(n: number, seed: number): Float32Array {
    const r = AboutMath.seeded(seed);
    const y = new Float32Array(n + 1);
    y[0] = r();
    y[n] = r();
    let step = n;
    let amp = 1;
    while (step > 1) {
      const half = step >> 1;
      for (let i = half; i < n; i += step) y[i] = (y[i - half] + y[i + half]) / 2 + (r() - 0.5) * amp;
      step = half;
      amp *= 0.62;
    }
    for (let i = 1; i < n; i++) if (r() < 0.22) y[i] += (r() - 0.3) * 0.16;
    let mn = Infinity;
    let mx = -Infinity;
    for (const v of y) {
      mn = Math.min(mn, v);
      mx = Math.max(mx, v);
    }
    for (let i = 0; i <= n; i++) y[i] = (y[i] - mn) / (mx - mn);
    return y;
  }

  /** Edge height at u (0..1), interpolated */
  private edgeAt(u: number): number {
    const x = Math.min(TornEdge.N - 0.001, Math.max(0, u * TornEdge.N));
    const i = Math.floor(x);
    return this.prof[i] + (this.prof[i + 1] - this.prof[i]) * (x - i);
  }

  /** Centre bulge so the tear climbs higher mid-page */
  private static bulge(u: number): number {
    return 0.22 * Math.sin(Math.PI * AboutMath.clamp01(u * 1.15 - 0.05));
  }

  render(time: number): void {
    const vh = innerHeight;
    const r = this.svg.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    if (!w || !h || r.top > vh || r.bottom < -h) return;

    // The tear deepens as the sheet rises into view
    const depth = h * (0.34 + 0.62 * AboutMath.clamp01((vh - (r.top + h)) / vh));
    const flow = time * 0.00035;
    let d = "";
    for (let i = 0; i <= TornEdge.N; i++) {
      const u = i / TornEdge.N;
      const wave = 0.045 * Math.sin(u * 9 - flow * 6) + 0.02 * Math.sin(u * 23 + flow * 4);
      const y = h - 6 - (this.prof[i] + TornEdge.bulge(u) + wave) * depth;
      d += `${i ? "L" : "M"}${(u * w).toFixed(1)},${y.toFixed(1)}`;
    }
    this.fill.setAttribute("d", `${d}L${w},${h + 4}L0,${h + 4}Z`);
    this.lines.forEach((p) => p.setAttribute("d", d));

    // Motes lifting off the edge, brighter as the sheet arrives
    const live = AboutMath.clamp01((vh - r.top) / vh);
    let md = "";
    for (const s of this.motes) {
      s.life += 0.004 * s.speed;
      if (s.life > 1) {
        s.life = 0;
        s.u = Math.random();
      }
      const u = Math.min(0.999, Math.max(0, s.u + s.drift * s.life * 0.05));
      const ev = this.edgeAt(u) + TornEdge.bulge(u);
      const x = u * w + Math.sin(time * 0.001 * s.speed + s.u * 20) * 6;
      const y = h - 6 - ev * depth - s.life * (10 + s.speed * 34);
      md += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.size.toFixed(1)}" opacity="${(Math.sin(Math.PI * s.life) * (0.35 + 0.65 * live)).toFixed(2)}"/>`;
    }
    this.motesEl.innerHTML = md;
  }
}
