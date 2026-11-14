// "You've been renting intelligence" statement (prototype #s12): every time the section is mostly on screen its words
// fade up out of a 12px blur, 80ms apart; leaving plays it back so it replays on return. `data-active` on the section
// starts the "own it?" glow (CSS). Reduced motion shows the words still.
import { gsap, ScrollTrigger } from "../gsap";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";

export class StatementScene {
  /** Gap between words (s) */
  private static readonly STAGGER = 0.08;

  constructor(private readonly section: HTMLElement) {
    const words = [...section.querySelectorAll<HTMLElement>("[data-ref=word]")];
    const motion = "(prefers-reduced-motion: no-preference)";
    gsap
      .matchMedia()
      // Desktop: the section fills the screen, so play once it is 55% in (prototype threshold)
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px) and ${motion}`, () => this.play(words, "top 45%", "bottom 55%"))
      // Mobile: a short block, play as soon as it is well into view
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px) and ${motion}`, () => this.play(words, "top 75%", "bottom 25%"))
      .add("(prefers-reduced-motion: reduce)", () => {
        section.dataset.active = "";
      });
  }

  /** Word reveal that plays while the section is between `start` and `end`, and reverses outside */
  private play(words: HTMLElement[], start: string, end: string): void {
    const reveal = gsap.from(words, {
      opacity: 0,
      y: "0.45em",
      filter: "blur(12px)",
      duration: 0.9,
      ease: "power3.out",
      stagger: StatementScene.STAGGER,
      paused: true,
    });
    ScrollTrigger.create({
      trigger: this.section,
      start,
      end,
      onToggle: ({ isActive }) => {
        if (isActive) reveal.play();
        else reveal.reverse();
        this.section.toggleAttribute("data-active", isActive);
      },
    });
  }
}
