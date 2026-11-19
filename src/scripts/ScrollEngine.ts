// Global scroll setup: Lenis smooth scroll driving GSAP ScrollTrigger from one shared ticker.
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

export class ScrollEngine {
  /** Inputs that mean the visitor is scrolling on their own */
  private static readonly USER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
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
    this.holdHashTarget();

    // Respect reduced-motion: keep native scrolling, ScrollTrigger still works
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Lenis smooths wheel input only; touch scrolling stays native on mobile. Same-page #links go through Lenis too,
    // as an instant jump: otherwise its still-easing wheel scroll overrides the browser's hash jump, and a smooth
    // scroll would scrub through the whole hero video on the way
    this.lenis = new Lenis({ autoRaf: false, anchors: { immediate: true, force: true } });
    this.lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => this.lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /** Landing on a page with a #section: pins (the hero stage) and late layout grow the page after the browser's hash
   *  jump, so jump to the section again on load and after every ScrollTrigger refresh, until the visitor scrolls */
  private holdHashTarget(): void {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (!target) return;
    const jump = () => this.scrollTo(target, true);
    const release = () => {
      ScrollTrigger.removeEventListener("refresh", jump);
      window.removeEventListener("load", jump);
      for (const type of ScrollEngine.USER_INPUT) window.removeEventListener(type, release);
    };
    ScrollTrigger.addEventListener("refresh", jump);
    window.addEventListener("load", jump, { once: true });
    for (const type of ScrollEngine.USER_INPUT) window.addEventListener(type, release, { passive: true });
  }

  /** Hold or release smooth scrolling (e.g. while an intro plays); no-op when Lenis is off */
  setPaused(paused: boolean): void {
    if (paused) this.lenis?.stop();
    else this.lenis?.start();
  }

  /** Smooth-scroll (or jump, with `immediate`) to an element or y position, over `duration` s if given; falls back to
   *  native when Lenis is off */
  scrollTo(target: string | HTMLElement | number, immediate = false, duration?: number): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, { immediate, force: true, duration });
      return;
    }
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (typeof el === "number") window.scrollTo({ top: el });
    else el?.scrollIntoView();
  }
}
