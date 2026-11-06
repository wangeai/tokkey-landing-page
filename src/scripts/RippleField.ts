// Luminous ASCII ripple backgrounds for the software page (ported from the software handoff `make(id, cfg)`): glyphs
// ramp with the scrolling luminance texture plus concentric sine waves from a centre point, which either sits still or
// sweeps sideways. Drawn only while the canvas's section is on screen; frozen under reduced motion.
import { AsciiField } from "./AsciiField";
import { LuminanceMap } from "./LuminanceMap";

export interface RippleFieldOptions {
  /** Ripple centre as fractions of the canvas; `mobileX` is used below 768px */
  x?: number;
  mobileX?: number;
  y: number;
  /** When true the centre drifts left and right instead of sitting at `x` */
  sweep?: boolean;
  /** Weight of the luminance texture and of the ripple */
  textureWeight: number;
  rippleWeight: number;
  /** Ripple fade-out distance (CSS px) */
  decay: number;
  color?: string;
  /** Extra alpha multiplier for every glyph */
  alpha?: number;
}

export class RippleField {
  private readonly field: AsciiField;

  constructor(canvas: HTMLCanvasElement, options: RippleFieldOptions) {
    const lum = LuminanceMap.instance;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { x = 0.5, mobileX = 0.5, y, sweep, textureWeight, rippleWeight, decay, color, alpha = 1 } = options;

    // Glyph alpha = min(0.9, 0.16 + level * 0.1) * alpha, as in the handoff
    this.field = new AsciiField(canvas, {
      color,
      baseAlpha: 0.16 * alpha,
      stepAlpha: 0.1 * alpha,
      maxAlpha: 0.9 * alpha,
      sample: ({ x: cx, y: cy, width, height, time }) => {
        // Reduced motion: a fixed, representative frame
        const t = still ? 4 : time;
        const hx = sweep ? width * (0.5 + 0.28 * Math.sin(t * 0.25)) : width * (width < 768 ? mobileX : x);
        const d = Math.hypot(cx - hx, (cy - height * y) * 1.25);
        const ripple = (0.5 + 0.5 * Math.sin(d * 0.042 - t * 2.2)) * Math.exp(-d / decay);
        return lum.at(cx / width + t * 0.005, cy / height) * textureWeight + ripple * rippleWeight;
      },
    });

    new IntersectionObserver(([entry]) => this.field.setVisibility(entry.isIntersecting ? 1 : 0)).observe(
      canvas.parentElement ?? canvas,
    );
  }

  /** Light-section variant (What it does, Use cases): dark glyphs, faint, ripple near the top */
  static light(canvas: HTMLCanvasElement): RippleField {
    return new RippleField(canvas, { y: 0.3, textureWeight: 0.55, rippleWeight: 0.45, decay: 640, color: "#16191A", alpha: 0.42 });
  }
}
