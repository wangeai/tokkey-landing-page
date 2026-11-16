// Pointer state over one element, shared by every About scene: target position as 0..1 of the element, an eased
// copy that chases it, a decaying speed (px of travel) and whether the pointer is inside.
export class PointerTracker {
  /** Target position, 0..1 of the element box */
  tx = 0.5;
  ty = 0.5;
  /** Eased position, follows the target in ease() */
  x = 0.5;
  y = 0.5;
  /** Last client position (px), -1 before the first move */
  clientX = -1;
  clientY = -1;
  /** Accumulated pointer travel, decays in ease() */
  speed = 0;
  inside = false;

  /** `recenter`: return the target to the middle when the pointer leaves */
  constructor(el: HTMLElement, recenter = true) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      this.tx = (e.clientX - r.left) / r.width;
      this.ty = (e.clientY - r.top) / r.height;
      if (this.clientX >= 0) this.speed += Math.hypot(e.clientX - this.clientX, e.clientY - this.clientY);
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      this.inside = true;
    });
    el.addEventListener("pointerleave", () => {
      this.inside = false;
      if (!recenter) return;
      this.tx = 0.5;
      this.ty = 0.5;
    });
  }

  /** Step the eased position toward the target and decay the speed; call once per frame */
  ease(factor: number): void {
    this.x += (this.tx - this.x) * factor;
    this.y += (this.ty - this.y) * factor;
    this.speed *= 0.9;
  }

  /** Eased position mapped to -1..1 around the centre, for tilts */
  get cx(): number {
    return this.x * 2 - 1;
  }
  get cy(): number {
    return this.y * 2 - 1;
  }
}

/** Small numeric helpers used across the About scenes */
export class AboutMath {
  static clamp01(v: number): number {
    return Math.min(1, Math.max(0, v));
  }

  /** Seeded Park–Miller generator, so torn edges and smoke puffs look the same on every load */
  static seeded(seed: number): () => number {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  /** True when the element's box overlaps the viewport (with a margin in px) */
  static onScreen(el: Element, margin = 0): boolean {
    const r = el.getBoundingClientRect();
    return r.bottom > -margin && r.top < innerHeight + margin;
  }

  static readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
