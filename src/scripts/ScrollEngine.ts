// Global scroll setup: Lenis smooth scroll driving GSAP ScrollTrigger from one shared ticker.
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

export class ScrollEngine {
  private static singleton: ScrollEngine | null = null;
  private lenis: Lenis | null = null;

  /** One engine per page; scenes and layout share it */
  static get instance(): ScrollEngine {
    if (!ScrollEngine.singleton) ScrollEngine.singleton = new ScrollEngine();
    return ScrollEngine.singleton;
  }

  start(): void {
    if (this.lenis) return;
    // iOS address bar show/hide resizes the viewport; don't recalculate pins on that
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Respect reduced-motion: keep native scrolling, ScrollTrigger still works
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Lenis smooths wheel input only; touch scrolling stays native on mobile
    this.lenis = new Lenis({ autoRaf: false });
    this.lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => this.lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /** Hold or release smooth scrolling (e.g. while an intro plays); no-op when Lenis is off */
  setPaused(paused: boolean): void {
    if (paused) this.lenis?.stop();
    else this.lenis?.start();
  }

  /** Smooth-scroll (or jump, with `immediate`) to an element or y position; falls back to native when Lenis is off */
  scrollTo(target: string | HTMLElement | number, immediate = false): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, { immediate, force: true });
      return;
    }
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (typeof el === "number") window.scrollTo({ top: el });
    else el?.scrollIntoView();
  }
}
