// "With Tokkey." / "Without Tokkey." (markup: src/components/TokkeyCompare.astro), ported from the prototype's `#sr`.
// Two effects inside scene 007 drive it:
// - "withTokkey" (key plugged in, energy flowing): the heading rises in, the With items slide in one by one, and they
//   slide out at its end. The heading stays while the frames between the effects unplug the key.
// - "withoutTokkey" (key unplugged): "out" grows into the heading, the Without items slide in, then everything fades
//   out before the key flies toward the viewer.
// Same motion on desktop and phones (layout comes from the component's responsive classes).
import { gsap } from "../gsap";
import { StageOverlay } from "../StageOverlay";
import { FrameStageScene, type StageEffect } from "./FrameStageScene";

export class TokkeyCompareScene {
  private static readonly WITH_ID = "withTokkey";
  private static readonly WITHOUT_ID = "withoutTokkey";
  /** Prototype items slide 18px in from the left */
  private static readonly SLIDE = 18;
  private static readonly ease = gsap.parseEase("power3.inOut");

  private readonly title: HTMLElement;
  private readonly out: HTMLElement;
  private readonly withItems: HTMLElement[];
  private readonly withoutItems: HTMLElement[];
  /** Progress of each effect (0 before, 1 after) */
  private withProgress = 0;
  private withoutProgress = 0;

  constructor(root: HTMLElement, section: HTMLElement) {
    this.title = root.querySelector<HTMLElement>("[data-ref=title]")!;
    this.out = root.querySelector<HTMLElement>("[data-ref=out]")!;
    const items = (ref: string) => [...root.querySelectorAll<HTMLElement>(`[data-ref=${ref}] > li`)];
    this.withItems = items("with");
    this.withoutItems = items("without");

    section.addEventListener(FrameStageScene.EFFECT_EVENT, (event) => {
      const { id, progress } = (event as CustomEvent<StageEffect>).detail;
      if (id === TokkeyCompareScene.WITH_ID) this.withProgress = progress;
      else if (id === TokkeyCompareScene.WITHOUT_ID) this.withoutProgress = progress;
      else return;
      this.render();
    });
  }

  /** Slide items in one after another from 0.1 of `progress`, and all out over its last 15% */
  private static showItems(items: HTMLElement[], progress: number): void {
    const { seg } = StageOverlay;
    const exit = seg(progress, 0.85, 1);
    items.forEach((item, i) => {
      const shown = TokkeyCompareScene.ease(seg(progress, 0.1 + i * 0.08, 0.25 + i * 0.08)) * (1 - exit);
      item.style.opacity = String(shown);
      item.style.transform = `translateX(${(shown - 1) * TokkeyCompareScene.SLIDE}px)`;
    });
  }

  private render(): void {
    const { seg } = StageOverlay;
    const { ease } = TokkeyCompareScene;
    const w = this.withProgress;
    const wo = this.withoutProgress;

    // Heading: rises in with the With list, holds through the unplug, rises out at the very end
    const exit = seg(wo, 0.85, 1);
    const rise = gsap.utils.interpolate(24, 0, ease(seg(w, 0, 0.2)));
    this.title.style.opacity = String(seg(w, 0, 0.15) * (1 - exit));
    this.title.style.transform = `translateY(${rise - ease(exit) * 40}px)`;
    this.title.setAttribute("aria-label", wo > 0 ? "Without Tokkey" : "With Tokkey");
    this.out.style.setProperty("--grow", ease(seg(wo, 0, 0.15)).toFixed(3));

    TokkeyCompareScene.showItems(this.withItems, w);
    TokkeyCompareScene.showItems(this.withoutItems, wo);
  }
}
