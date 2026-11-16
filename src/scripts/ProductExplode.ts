// Explode / assemble animation for the 3D key. Parts move along their offsets from the explode table, grouped by
// rigid assembly (parts with the same offset share a group). One clock drives every group, each starting at a small
// phase offset: exploding starts at the top group, assembling at the bottom, so parts "move together, land in turn".
import type { Object3D, Vector3 } from "three";

/** explode.json: offset per mesh name (metres, glTF space) and its group */
export interface ExplodeTable {
  objects: Record<string, [number, number, number]>;
  group_of: Record<string, number>;
}

interface ExplodePart {
  mesh: Object3D;
  offset: Vector3;
  group: number;
}

export class ProductExplode {
  /** One-way duration */
  private static readonly DURATION_MS = 1400;
  /** When the last group starts, as a share of the clock */
  private static readonly PHASE_SPREAD = 0.16;

  /** Average progress of all groups (0 assembled … 1 exploded), used for camera framing */
  progress = 0;
  private readonly parts: ExplodePart[];
  private readonly groupCount: number;
  /** Per-group progress now, and where the current run started from (so a run can be interrupted) */
  private groupP: number[];
  private fromP: number[];
  private goal = 0;
  private startTime = 0;
  private running = false;

  constructor(parts: ExplodePart[]) {
    // Group ids may have gaps; renumber them 0..n-1
    const used = [...new Set(parts.map((p) => p.group))].sort((a, b) => a - b);
    const remap = new Map(used.map((g, i) => [g, i]));
    this.parts = parts.map((p) => ({ ...p, group: remap.get(p.group)! }));
    this.groupCount = used.length;
    this.groupP = new Array(this.groupCount).fill(0);
    this.fromP = this.groupP.slice();
  }

  /** Whether the model is (heading) exploded */
  get exploded(): boolean {
    return this.goal === 1;
  }

  get animating(): boolean {
    return this.running;
  }

  /** Start exploding or assembling from wherever the parts are now */
  toggle(now: number): void {
    this.goal = this.goal === 1 ? 0 : 1;
    this.fromP = this.groupP.slice();
    this.startTime = now;
    this.running = true;
  }

  /** Advance the animation; returns true when parts moved */
  step(now: number): boolean {
    if (!this.running || !this.groupCount) return false;
    const { DURATION_MS, PHASE_SPREAD } = ProductExplode;
    const clock = Math.min(1, Math.max(0, (now - this.startTime) / DURATION_MS));
    const gap = this.groupCount > 1 ? PHASE_SPREAD / (this.groupCount - 1) : 0;
    for (let k = 0; k < this.groupCount; k++) {
      const order = this.goal === 1 ? k : this.groupCount - 1 - k;
      const local = Math.min(1, Math.max(0, (clock - order * gap) / (1 - PHASE_SPREAD)));
      this.groupP[k] = this.fromP[k] + (this.goal - this.fromP[k]) * ProductExplode.smootherStep(local);
    }
    if (clock >= 1) {
      this.groupP.fill(this.goal);
      this.running = false;
    }
    this.apply();
    return true;
  }

  /** Move each part to its offset × its group's progress */
  private apply(): void {
    for (const p of this.parts) p.mesh.position.copy(p.offset).multiplyScalar(this.groupP[p.group]);
    this.progress = this.groupP.reduce((sum, v) => sum + v, 0) / this.groupCount;
  }

  /** 6t⁵ − 15t⁴ + 10t³: zero velocity and acceleration at both ends, so groups start and stop without a jolt */
  private static smootherStep(x: number): number {
    return x * x * x * (x * (x * 6 - 15) + 10);
  }
}
