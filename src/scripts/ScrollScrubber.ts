// Maps page scroll to a position on the frame timeline, like Apple's scroll-scrubbed videos: the section pins while
// the page scrolls through it, and the scroll position inside the pin is the timeline position. Scrolling never locks,
// so a slow scroll plays slowly and a fast flick plays fast (skipping frames); Lenis smooths the wheel.
import { ScrollTrigger } from "./gsap";

export interface ScrubberOptions {
  /** Frames moved per px of scroll (the pin lasts `end / framesPerPx` px) */
  framesPerPx: number;
}

export class ScrollScrubber {
  /** Where the timeline is (0..end) */
  target = 0;
  private readonly trigger: ScrollTrigger;

  constructor(
    /** Section to pin while the timeline plays */
    section: HTMLElement,
    /** Last position on the timeline */
    end: number,
    options: ScrubberOptions,
  ) {
    this.trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${Math.round(end / options.framesPerPx)}`,
      pin: true,
      onUpdate: (self) => (this.target = self.progress * end),
    });
    // A refresh can restore the page mid-pin: start where the scroll already is
    this.target = this.trigger.progress * end;
  }

  destroy(): void {
    this.trigger.kill();
  }
}
