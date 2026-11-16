// "Release the True Power." (markup: src/components/TruePower.astro). Runs on the "truePower" effect, which holds scene 006's
// last frame right before scene 007: the heading rises 24px in, holds, then rises 40px out. Same layout on desktop
// and phones (sizes come from the component's responsive classes), so there's no per-breakpoint setup here.
import { gsap } from "../gsap";
import { StageOverlay } from "../StageOverlay";
import { FrameStageScene, type StageEffect } from "./FrameStageScene";

export class TruePowerScene {
  /** Effect segment in TIMELINE that drives the scene */
  private static readonly EFFECT_ID = "truePower";
  private static readonly ease = gsap.parseEase("power3.inOut");

  private readonly title: HTMLElement;

  constructor(root: HTMLElement, section: HTMLElement) {
    this.title = root.querySelector<HTMLElement>("[data-ref=title]")!;
    section.addEventListener(FrameStageScene.EFFECT_EVENT, (event) => {
      const { id, progress } = (event as CustomEvent<StageEffect>).detail;
      if (id === TruePowerScene.EFFECT_ID) this.render(progress);
    });
  }

  private render(progress: number): void {
    const { seg } = StageOverlay;
    const { ease } = TruePowerScene;
    const exit = seg(progress, 0.8, 1);
    const rise = gsap.utils.interpolate(24, 0, ease(seg(progress, 0, 0.3)));
    this.title.style.opacity = String(seg(progress, 0, 0.25) * (1 - exit));
    this.title.style.transform = `translateY(${rise - ease(exit) * 40}px)`;
  }
}
