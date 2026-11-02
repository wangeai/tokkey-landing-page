// A pinned section whose canvas scrubs through a frame sequence as the user scrolls.
// Desktop and mobile get separate setups via gsap.matchMedia (mobile loads half the frames).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FramePlayer } from "./FramePlayer";
import { MOBILE_MAX_WIDTH, type SequenceName } from "../config/frames";

export class FrameScene {
  constructor(private readonly section: HTMLElement) {
    const canvas = section.querySelector<HTMLCanvasElement>("canvas")!;
    const sequence = section.dataset.sequence as SequenceName;
    const length = section.dataset.scrollLength ?? "200%";

    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.setup(canvas, sequence, length, 1))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.setup(canvas, sequence, length, 2));
  }

  /** Create the player and pin; the returned cleanup runs when the breakpoint flips */
  private setup(canvas: HTMLCanvasElement, sequence: SequenceName, length: string, step: number) {
    const player = new FramePlayer(canvas, sequence, { step });
    const trigger = ScrollTrigger.create({
      trigger: this.section,
      start: "top top",
      end: `+=${length}`,
      pin: true,
      scrub: true,
      onUpdate: (self) => player.render(self.progress),
    });
    player.render(0);
    return () => {
      trigger.kill();
      player.destroy();
    };
  }

  /** Mount every <FrameScene> component on the page */
  static mountAll(): void {
    document.querySelectorAll<HTMLElement>("[data-frame-scene]").forEach((el) => new FrameScene(el));
  }
}
