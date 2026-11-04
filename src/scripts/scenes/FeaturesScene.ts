// Features section: a carousel of five cards. Also wires the cards' widgets (model
// rows, game demo, light ring) and runs their animations only while the section is on screen.
// Markup: src/components/Features.astro.
import { CardCarousel } from "../CardCarousel";
import { GameDemo } from "../GameDemo";
import { LightRing } from "../LightRing";

export class FeaturesScene {
  private readonly games: GameDemo;
  private readonly ring: LightRing;

  constructor(private readonly section: HTMLElement) {
    new CardCarousel(this.ref("carousel"), this.ref<HTMLButtonElement>("carouselPrev"), this.ref<HTMLButtonElement>("carouselNext"));
    this.games = new GameDemo(this.ref("games"));
    this.ring = new LightRing(this.ref("ringGlow"), this.ref("ringPlate"));
    this.bindModelCards();
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

  /** Clicking a model row highlights it */
  private bindModelCards(): void {
    const cards = [...this.section.querySelectorAll<HTMLElement>("[data-model-card]")];
    cards.forEach((card) =>
      card.addEventListener("click", () => cards.forEach((other) => other.setAttribute("aria-pressed", String(other === card)))),
    );
  }
}
