// Footer background: an ASCII field ported from the footer on main (assets/js/main.js `ftdots`): brightness-ramped
// glyphs over the scrolling luminance texture plus a drifting ripple, drawn only while the footer is on screen.
// Markup and fade-in mask: src/components/Footer.astro.
import { AsciiField } from "../AsciiField";
import { LuminanceMap } from "../LuminanceMap";

export class FooterScene {
  private readonly field: AsciiField;

  constructor(footer: HTMLElement) {
    const lum = LuminanceMap.instance;
    // Reduced motion: freeze the field at its first frame
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Glyph alpha = min(0.85, 0.14 + level * 0.1), as on main; color and grid are AsciiField's defaults (same as main)
    this.field = new AsciiField(footer.querySelector<HTMLCanvasElement>("[data-ref=field]")!, {
      baseAlpha: 0.14,
      maxAlpha: 0.85,
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
}
