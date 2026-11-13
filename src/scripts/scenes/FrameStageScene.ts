// Hero frame stage (markup: src/components/FrameStage.astro). Builds a FrameStage per breakpoint: desktop loads the
// full-size frames (half-size on small or 1x screens), mobile loads every other half-size frame and moves more per px.
// Effect segments' progress is re-dispatched on the section as EFFECT_EVENT, so overlays in the slot can follow it.
import { gsap } from "../gsap";
import { FrameStage, type StageProfile } from "../FrameStage";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";
import { FRAME_SIZES } from "../../config/frames";
import { TIMELINE } from "../../config/timeline";

/** Detail of EFFECT_EVENT */
export interface StageEffect {
  /** Effect segment id from TIMELINE */
  id: string;
  /** 0..1 */
  progress: number;
}

export class FrameStageScene {
  /** CustomEvent<StageEffect> fired on the section whenever an effect's progress changes */
  static readonly EFFECT_EVENT = "stage-effect";
  private static readonly EFFECT_IDS = TIMELINE.flatMap((s) => (s.kind === "effect" ? [s.id] : []));

  constructor(section: HTMLElement) {
    const canvas = section.querySelector<HTMLCanvasElement>("[data-ref=frames]")!;
    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.build(section, canvas, FrameStageScene.desktopProfile()))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () =>
        this.build(section, canvas, { size: "sm", step: 2, mobile: true, framesPerPx: 0.5 }),
      );
  }

  /** Full-size frames only when the screen would show more than the small set's pixels */
  private static desktopProfile(): StageProfile {
    const screenPx = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    const size = screenPx > FRAME_SIZES.sm.width * 1.25 ? "lg" : "sm";
    // One mouse notch (~100px) ≈ 20 frames
    return { size, step: 1, mobile: false, framesPerPx: 0.2 };
  }

  /** Create the stage for one breakpoint; returns its cleanup for matchMedia */
  private build(section: HTMLElement, canvas: HTMLCanvasElement, profile: StageProfile): () => void {
    const stage = new FrameStage(section, canvas, profile);
    for (const id of FrameStageScene.EFFECT_IDS) {
      stage.onEffect(id, (progress) =>
        section.dispatchEvent(new CustomEvent<StageEffect>(FrameStageScene.EFFECT_EVENT, { detail: { id, progress } })),
      );
    }
    return () => stage.destroy();
  }
}
