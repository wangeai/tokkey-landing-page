// Footer background: a faint ASCII field (luminance texture plus a drifting ripple, as on the legacy footer),
// drawn only while the footer is on screen. Markup: src/components/Footer.astro.
import { AsciiField } from "../AsciiField";
import { LuminanceMap } from "../LuminanceMap";
import { MOBILE_MAX_WIDTH } from "../../config/frames";

/** Figma grid: 13px mono glyphs on 7.8 × 16 px cells, at the 1920 design width */
const FIGMA_GRID = { cellWidth: 7.8, cellHeight: 16, fontSize: 13 };
/** Figma glyph color: white at 14% */
const GLYPH_ALPHA = 0.14;

export class FooterScene {
  private readonly field: AsciiField;

  constructor(footer: HTMLElement) {
    const lum = LuminanceMap.instance;
    // Reduced motion: freeze the field at its first frame
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.field = new AsciiField(footer.querySelector<HTMLCanvasElement>("[data-ref=field]")!, {
      color: "#ffffff",
      baseAlpha: GLYPH_ALPHA,
      stepAlpha: 0,
      maxAlpha: GLYPH_ALPHA,
      grid: (width) => FooterScene.grid(width),
      sample: ({ x, y, width, height, time }) => {
        const t = still ? 0 : time;
        const hx = width * (0.5 + 0.28 * Math.sin(t * 0.25));
        const d = Math.hypot(x - hx, (y - height * 0.62) * 1.25);
        const ripple = (0.5 + 0.5 * Math.sin(d * 0.042 - t * 2.2)) * Math.exp(-d / 900);
        return lum.at(x / width + t * 0.004, y / height) * 0.9 + ripple * 0.7;
      },
    });

    new IntersectionObserver(([entry]) => this.field.setVisibility(entry.isIntersecting ? 1 : 0)).observe(footer);
  }

  /** Figma grid scaled like --fx: by viewport width / 1920 (floored at 0.6) on desktop, real px on mobile */
  private static grid(width: number) {
    const fx = width > MOBILE_MAX_WIDTH ? Math.max(width / 1920, 0.6) : 1;
    return {
      cellWidth: FIGMA_GRID.cellWidth * fx,
      cellHeight: FIGMA_GRID.cellHeight * fx,
      fontSize: FIGMA_GRID.fontSize * fx,
    };
  }
}
