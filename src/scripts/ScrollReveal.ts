// Fade-up reveal shared by the sections below the hero (legacy `.rvv`: rise 26px, 0.9s, staggered).
import { gsap } from "./gsap";
import { MOBILE_MAX_WIDTH } from "../config/frames";

export class ScrollReveal {
  /** Distance (px) each element rises while fading in */
  static readonly RISE = 26;
  /** Delay between consecutive elements (s) */
  static readonly STAGGER = 0.05;

  /** Fade `targets` up from below once `trigger` is 80% down the viewport */
  static fadeUp(targets: HTMLElement[], trigger: HTMLElement, stagger = ScrollReveal.STAGGER): void {
    gsap.from(targets, {
      opacity: 0,
      y: ScrollReveal.RISE,
      duration: 0.9,
      ease: "power3.out",
      stagger,
      scrollTrigger: { trigger, start: "top 80%", once: true },
    });
  }

  /** Reveal every `[data-reveal]` in `section`: one staggered sequence on desktop, where the pieces sit side by side,
   *  and piece by piece on mobile, where they stack into one tall column. Skipped under reduced motion. */
  static section(section: HTMLElement): void {
    const items = [...section.querySelectorAll<HTMLElement>("[data-reveal]")];

    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px) and (prefers-reduced-motion: no-preference)`, () => {
        ScrollReveal.fadeUp(items, section);
      })
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px) and (prefers-reduced-motion: no-preference)`, () => {
        items.forEach((item) => ScrollReveal.fadeUp([item], item, 0));
      });
  }
}
