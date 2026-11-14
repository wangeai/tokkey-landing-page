// "Personal intelligence. Personal privacy." scene: each block fades up as it enters; on desktop the spine segments draw
// down with the scroll (dot last) and the diagram's two connectors draw in once it is on screen. Reduced motion shows
// everything in its final state.
import { gsap } from "../gsap";
import { ScrollReveal } from "../ScrollReveal";

export class PersonalScene {
  /** Width from which the spine and diagram connectors exist (the Figma layout) */
  private static readonly DESKTOP_MIN = 1200;

  constructor(section: HTMLElement) {
    const blocks = [...section.querySelectorAll<HTMLElement>("[data-reveal]")];
    const spines = [...section.querySelectorAll<HTMLElement>("[data-ref=spine]")];
    const diagram = section.querySelector<HTMLElement>("[data-ref=diagram]")!;
    const links = [...diagram.querySelectorAll<SVGPathElement>("[data-ref=link]")];
    const motion = "(prefers-reduced-motion: no-preference)";

    gsap
      .matchMedia()
      .add(`(min-width: ${PersonalScene.DESKTOP_MIN}px) and ${motion}`, () => {
        this.revealBlocks(blocks);
        spines.forEach((spine) => this.drawSpine(spine));
        this.drawLinks(links, diagram);
      })
      // Mobile and tablet (below the Figma layout, so this covers the 768px mobile breakpoint too): blocks reveal one by one
      .add(`(max-width: ${PersonalScene.DESKTOP_MIN - 1}px) and ${motion}`, () => this.revealBlocks(blocks));
  }

  /** Each block fades up on its own as it reaches 80% of the viewport */
  private revealBlocks(blocks: HTMLElement[]): void {
    blocks.forEach((block) => ScrollReveal.fadeUp([block], block, 0));
  }

  /** Grow the spine line from its top as the page scrolls past it; the dot pops in at the end */
  private drawSpine(spine: HTMLElement): void {
    gsap
      .timeline({ scrollTrigger: { trigger: spine, start: "top 75%", end: "bottom 75%", scrub: true } })
      .from(spine.querySelector("u"), { scaleY: 0, ease: "none", duration: 1 })
      .from(spine.querySelector("b"), { scale: 0, duration: 0.08 });
  }

  /** Draw the connector paths (pathLength = 1) once the diagram is in view */
  private drawLinks(links: SVGPathElement[], diagram: HTMLElement): void {
    gsap.fromTo(
      links,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.6, delay: 0.4, ease: "power2.inOut", scrollTrigger: { trigger: diagram, start: "top 70%", once: true } },
    );
  }
}
