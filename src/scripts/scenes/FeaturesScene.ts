// Features section: a carousel of five cards. Also wires the cards' widgets (model
// rows, game demo, light ring), reveals the section on scroll, and runs the widgets' animations only while on screen.
// Markup: src/components/Features.astro.
import { MOBILE_MAX_WIDTH } from "../../config/frames";
import { CardCarousel } from "../CardCarousel";
import { GameDemo } from "../GameDemo";
import { gsap } from "../gsap";
import { LightRing } from "../LightRing";

export class FeaturesScene {
  private readonly games: GameDemo;
  private readonly ring: LightRing;

  constructor(private readonly section: HTMLElement) {
    new CardCarousel(this.ref("carousel"), this.ref<HTMLButtonElement>("carouselPrev"), this.ref<HTMLButtonElement>("carouselNext"));
    this.games = new GameDemo(this.ref("games"));
    this.ring = new LightRing(this.ref("ringGlow"), this.ref("ringPlate"));
    this.bindModelCards();
    this.bindReveal();
    new IntersectionObserver(([entry]) => this.setActive(entry.isIntersecting), { threshold: 0.3 }).observe(section);
  }

  private ref<T extends HTMLElement = HTMLElement>(name: string): T {
    return this.section.querySelector<T>(`[data-ref="${name}"]`)!;
  }

  /** Only animate while the section can be seen */
  private setActive(active: boolean): void {
    this.games.setActive(active);
    this.ring.setActive(active);
  }

  /** Each time the section is scrolled into from above it fades in from invisible while the cards slide up one by one, left to right.
   *  Mobile shows about one card at a time, so the rise and stagger are shorter. Skipped under reduced motion. */
  private bindReveal(): void {
    const slides = [...this.section.querySelectorAll<HTMLElement>(".slide")];
    const play = (rise: number, stagger: number) =>
      gsap
        .timeline({ scrollTrigger: { trigger: this.section, start: "top 80%", toggleActions: "play none none reset" } })
        .from(this.section, { opacity: 0, duration: 0.8, ease: "power1.out" })
        .from(slides, { opacity: 0, y: rise, duration: 0.9, ease: "power3.out", stagger }, 0.15);

    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px) and (prefers-reduced-motion: no-preference)`, () => {
        play(80, 0.12);
      })
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px) and (prefers-reduced-motion: no-preference)`, () => {
        play(40, 0.08);
      });
  }

  /** Clicking a model row highlights it */
  private bindModelCards(): void {
    const cards = [...this.section.querySelectorAll<HTMLElement>("[data-model-card]")];
    cards.forEach((card) =>
      card.addEventListener("click", () => cards.forEach((other) => other.setAttribute("aria-pressed", String(other === card)))),
    );
  }
}
