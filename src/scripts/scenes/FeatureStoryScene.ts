// Software features scroll story (prototype `#features` story): from 1200px the five previews live in the pinned right
// column and the one whose chapter is nearest the viewport centre is shown (CSS cross-fade on `.is-active`); each
// chapter's copy dims as it leaves the centre, and the chapter bar tracks the active chapter. Below 1200px every preview
// moves back under its own chapter's copy and the copy fades up as it enters. Reduced motion keeps the swap but drops
// the copy fade.
import { gsap, ScrollTrigger } from "../gsap";
import { ScrollEngine } from "../ScrollEngine";
import { ScrollReveal } from "../ScrollReveal";

export class FeatureStoryScene {
  /** Width from which the pinned story exists (the Figma layout) */
  private static readonly DESKTOP_MIN = 1200;
  /** Copy stays fully visible within this share of the viewport height around the centre, then fades */
  private static readonly COPY_HOLD = 0.16;
  private static readonly COPY_FADE = 2.1;
  private static readonly COPY_MIN = 0.08;

  private readonly chapters: HTMLElement[];
  private readonly copies: HTMLElement[];
  private readonly slots: HTMLElement[];
  private readonly stages: HTMLElement[];
  private readonly host: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly barLinks: HTMLAnchorElement[];
  private readonly count: HTMLElement;
  private active = -1;

  constructor(private readonly section: HTMLElement) {
    const all = <T extends HTMLElement>(ref: string) => [...section.querySelectorAll<T>(`[data-ref=${ref}]`)];
    this.chapters = all("chapter");
    this.copies = all("copy");
    this.slots = all("slot");
    this.stages = all("stage");
    this.host = section.querySelector<HTMLElement>("[data-ref=host]")!;
    this.bar = section.querySelector<HTMLElement>("[data-ref=bar]")!;
    this.barLinks = all<HTMLAnchorElement>("bar-link");
    this.count = section.querySelector<HTMLElement>("[data-ref=count]")!;

    // Chapter bar links scroll the chapter to the viewport centre through the shared Lenis instance
    this.barLinks.forEach((link, i) =>
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const rect = this.chapters[i].getBoundingClientRect();
        ScrollEngine.instance.scrollTo(scrollY + rect.top - (innerHeight - rect.height) / 2);
      }),
    );

    const { DESKTOP_MIN } = FeatureStoryScene;
    gsap
      .matchMedia()
      .add(`(min-width: ${DESKTOP_MIN}px)`, () => this.setupDesktop())
      .add(`(max-width: ${DESKTOP_MIN - 1}px)`, () => this.setupStacked());
  }

  /** Pinned layout: previews in the right column, one ScrollTrigger drives the active chapter, copy fade and bar */
  private setupDesktop(): () => void {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.stages.forEach((stage) => this.host.append(stage));
    this.active = -1;

    const trigger = ScrollTrigger.create({
      trigger: this.section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: () => this.update(reduced),
      onRefresh: () => this.update(reduced),
    });
    this.update(reduced);

    return () => {
      trigger.kill();
      this.copies.forEach((copy) => copy.style.removeProperty("--copy-opacity"));
      this.stages.forEach((stage) => {
        stage.classList.remove("is-active");
        stage.inert = false;
        stage.removeAttribute("aria-hidden");
      });
    };
  }

  /** Stacked layout: each preview under its chapter's copy; copy and preview fade up as they enter */
  private setupStacked(): void {
    this.stages.forEach((stage, i) => this.slots[i].append(stage));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.chapters.forEach((chapter, i) => ScrollReveal.fadeUp([this.copies[i], this.stages[i]], chapter, 0.1));
  }

  /** Recompute the chapter nearest the viewport centre, each copy's opacity, and whether the bar shows */
  private update(reduced: boolean): void {
    const centre = innerHeight / 2;
    let nearest = 0;
    let best = Infinity;
    this.chapters.forEach((chapter, i) => {
      const rect = chapter.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - centre);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
      this.copies[i].style.setProperty("--copy-opacity", reduced ? "1" : this.copyOpacity(this.copies[i], centre).toFixed(3));
    });
    this.setActive(nearest);

    const story = this.section.getBoundingClientRect();
    this.bar.classList.toggle("is-shown", story.top < innerHeight * 0.45 && story.bottom > innerHeight * 0.9);
  }

  /** 1 near the viewport centre, fading to COPY_MIN as the copy moves away */
  private copyOpacity(copy: HTMLElement, centre: number): number {
    const { COPY_HOLD, COPY_FADE, COPY_MIN } = FeatureStoryScene;
    const rect = copy.getBoundingClientRect();
    const offset = Math.abs(rect.top + rect.height / 2 - centre) / innerHeight;
    return Math.max(COPY_MIN, 1 - Math.max(0, offset - COPY_HOLD) * COPY_FADE);
  }

  /** Show chapter `index`'s preview, hide the rest from assistive tech, and move the bar's marker */
  private setActive(index: number): void {
    if (index === this.active) return;
    this.active = index;
    this.stages.forEach((stage, i) => {
      const on = i === index;
      stage.classList.toggle("is-active", on);
      stage.inert = !on;
      if (on) stage.removeAttribute("aria-hidden");
      else stage.setAttribute("aria-hidden", "true");
    });
    this.barLinks.forEach((link, i) => {
      link.classList.toggle("is-on", i === index);
      if (i === index) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    this.count.textContent = String(index + 1).padStart(2, "0");
    this.bar.classList.toggle("is-end", index === this.stages.length - 1);
  }
}
