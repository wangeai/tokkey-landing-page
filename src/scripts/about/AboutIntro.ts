// Opening sequence of the About page: darkness and brackets with the edition title, the golden-ratio lines draw in,
// then a spark at the cube and the light spreads outward. Any click, key or wheel skips ahead. Scrolling is held
// until the light has spread.
import { ScrollEngine } from "../ScrollEngine";
import { AboutMath } from "./PointerTracker";
import type { PrometheusHero } from "./PrometheusHero";

export class AboutIntro {
  private readonly timers: number[] = [];
  private lighting = false;
  private done = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly hero: PrometheusHero,
    private readonly ui: HTMLElement,
    private readonly dark: HTMLElement,
  ) {
    if (AboutMath.reducedMotion) {
      root.classList.add("drawn");
      this.finish();
      return;
    }
    document.documentElement.classList.add("about-intro");
    ScrollEngine.instance.setPaused(true);
    this.later(250, () => {
      ui.classList.add("stage-1");
      root.classList.add("drawn");
    });
    this.later(2300, () => this.ignite(2400));
    const skip = () => this.skip();
    addEventListener("pointerdown", skip, { once: true });
    addEventListener("keydown", skip, { once: true });
    addEventListener("wheel", skip, { once: true, passive: true });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private static easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /** Spark at the cube, then open the darkness over `dur` ms */
  private ignite(dur: number): void {
    if (this.lighting) return;
    this.lighting = true;
    this.ui.classList.add("stage-2");
    this.hero.ignite();
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      this.dark.style.setProperty("--r", (-30 + AboutIntro.easeInOut(k) * 170).toFixed(2));
      this.hero.light = Math.min(1, k * 1.4);
      if (k > 0.35 && !this.root.classList.contains("lit")) {
        this.root.classList.add("lit");
        this.ui.classList.add("stage-3");
      }
      if (k < 1) requestAnimationFrame(step);
      else this.finish();
    };
    requestAnimationFrame(step);
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.dark.style.display = "none";
    this.hero.light = 1;
    this.root.classList.add("lit");
    this.ui.classList.add("gone");
    document.documentElement.classList.remove("about-intro");
    ScrollEngine.instance.setPaused(false);
  }

  private skip(): void {
    if (this.done) return;
    this.timers.forEach(clearTimeout);
    this.root.classList.add("drawn");
    if (!this.lighting) this.ignite(700);
  }
}
