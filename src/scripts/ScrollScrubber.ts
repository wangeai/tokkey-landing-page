// Turns wheel / touch input into a target position on the frame timeline while the page sits at the very top.
// Input is proportional: a slight scroll moves a few frames, a big flick moves many. Page scrolling is locked meanwhile;
// scrolling forward past the end hands it back to the page, and scrolling back to the top locks it again. A hard forward
// flick (faster than `skipVelocity`) skips the rest of the timeline and scrolls the page straight away.
import { Observer, ScrollTrigger } from "./gsap";
import { ScrollEngine } from "./ScrollEngine";

export interface ScrubberOptions {
  /** Frames moved per px of wheel / swipe */
  framesPerPx: number;
  /** Touch fling: extra frames per px/s of release velocity (0 = none) */
  framesPerVelocity: number;
  /** Forward input faster than this (px/s) skips the timeline and releases the page */
  skipVelocity: number;
}

export class ScrollScrubber {
  private static readonly TOP_SLACK = 4;
  /** Where the timeline is headed (0..end) */
  target = 0;
  private readonly observer: Observer;
  private readonly topTrigger: ScrollTrigger;

  constructor(
    /** Last position on the timeline */
    private readonly end: number,
    private readonly options: ScrubberOptions,
    /** True once the playhead has caught up with the target; the page is only released then, so the last frames show */
    private readonly settled: () => boolean,
  ) {
    // wheelSpeed -1 makes wheel and touch agree: a negative deltaY means "advance"
    this.observer = Observer.create({
      target: window,
      type: "wheel,touch",
      wheelSpeed: -1,
      preventDefault: true,
      onChangeY: (self) => this.input(-self.deltaY * this.options.framesPerPx, -self.velocityY),
      onRelease: (self) => this.input(-self.velocityY * this.options.framesPerVelocity, -self.velocityY),
    });
    // Fires when the page scrolls back to the top (a few px of slack: Lenis can settle at 1px instead of 0)
    this.topTrigger = ScrollTrigger.create({ start: ScrollScrubber.TOP_SLACK, end: "max", onLeaveBack: () => this.lock() });

    // The browser restores the old scroll position on refresh, which would skip the timeline: always start at the top
    ScrollTrigger.clearScrollMemory("manual");
    ScrollEngine.instance.scrollTo(0, true);
    this.lock();
  }

  destroy(): void {
    this.observer.kill();
    this.topTrigger.kill();
    ScrollEngine.instance.unlock();
  }

  /** Handle one input: `velocity` is its speed in px/s (+ = forward). A hard forward flick skips; anything else moves */
  private input(frames: number, velocity: number): void {
    if (velocity > this.options.skipVelocity) this.unlock();
    else this.move(frames);
  }

  /** Move the target by `frames` (+ = forward); pushing forward once the last frame shows releases the page */
  private move(frames: number): void {
    if (!frames) return;
    if (frames > 0 && this.target >= this.end) {
      if (this.settled()) this.unlock();
      return;
    }
    this.target = Math.min(this.end, Math.max(0, this.target + frames));
  }

  private lock(): void {
    ScrollEngine.instance.lock();
    this.observer.enable();
  }

  private unlock(): void {
    this.observer.disable();
    ScrollEngine.instance.unlock();
  }
}
