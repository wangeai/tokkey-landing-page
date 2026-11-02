// Global scroll setup: Lenis smooth scroll driving GSAP ScrollTrigger from one shared ticker.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

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

  /** Smooth-scroll to an element or y position (falls back to native when Lenis is off) */
  scrollTo(target: string | HTMLElement | number): void {
    if (this.lenis) {
      this.lenis.scrollTo(target);
      return;
    }
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (typeof el === "number") window.scrollTo({ top: el });
    else el?.scrollIntoView();
  }
}
