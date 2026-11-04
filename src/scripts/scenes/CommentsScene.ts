// User comments section ("Real people. Local AI."): the heading and the glass cards fade up as they scroll into view.
// Markup: src/components/Comments.astro.
import { gsap } from "../gsap";
import { MOBILE_MAX_WIDTH } from "../../config/frames";
import { ScrollReveal } from "../ScrollReveal";

export class CommentsScene {
  constructor(section: HTMLElement) {
    const heading = [...section.querySelectorAll<HTMLElement>("[data-reveal]")];
    const cards = [...section.querySelectorAll<HTMLElement>("[data-comment]")];

    gsap
      .matchMedia()
      // Desktop: the whole wall is on screen at once, so heading and cards reveal as one staggered sequence
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px) and (prefers-reduced-motion: no-preference)`, () => {
        ScrollReveal.fadeUp([...heading, ...cards], section);
      })
      // Mobile: cards stack into one tall column, so each one reveals as it reaches the viewport
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px) and (prefers-reduced-motion: no-preference)`, () => {
        ScrollReveal.fadeUp(heading, section);
        cards.forEach((card) => ScrollReveal.fadeUp([card], card, 0));
      });
  }
}
