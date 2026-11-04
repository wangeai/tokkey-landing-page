// Turns scroll gestures into scene steps: while the page sits at the very top, page scrolling is locked and
// each wheel/swipe gesture moves one scene forward or back. Past the last scene (or after release()) the page scrolls
// normally; scrolling back to the top hands control to the stepper again.
import { Observer, ScrollTrigger } from "./gsap";
import { ScrollEngine } from "./ScrollEngine";

export class SceneStepper {
  private static readonly TOP_SLACK = 4;
  /** Scene whose last frame is showing; -1 = before the first scene (scene 0 rewound to its first frame) */
  private index = -1;
  /** True while a scene is playing; gestures the same way are ignored so one gesture = one scene,
   *  a gesture the other way turns the scene around */
  private busy = false;
  /** Direction of the latest transition */
  private direction: 1 | -1 = 1;
  /** Bumped per transition, so a turned-around one doesn't clear `busy` for the one that took over */
  private run = 0;
  private readonly observer: Observer;

  constructor(
    private readonly count: number,
    /** Called on every step with the new index (-1 = before the first scene) and the direction (1 = forward, -1 = back);
     *  the returned promise resolves when the transition has finished. A call the other way can come in while one is
     *  running: it should turn that transition around */
    private readonly onStep: (index: number, direction: 1 | -1) => Promise<void>,
  ) {
    // wheelSpeed -1 makes wheel and touch agree: "up" means the content should advance
    this.observer = Observer.create({
      target: window,
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 10,
      preventDefault: true,
      onUp: () => this.step(1),
      onDown: () => this.step(-1),
    });
    // Fires when the page scrolls back to the top (a few px of slack: Lenis can settle at 1px instead of 0)
    ScrollTrigger.create({ start: SceneStepper.TOP_SLACK, end: "max", onLeaveBack: () => this.lock() });

    // The browser (and ScrollTrigger) restore the old scroll position on refresh, which would skip the stepper;
    // always start at the top, before scene 0 (the first gesture plays it)
    ScrollTrigger.clearScrollMemory("manual");
    ScrollEngine.instance.scrollTo(0, true);
    this.lock();
  }

  /** Play scene 0 without a gesture; does nothing once a gesture has already moved off the start */
  autoplay(): void {
    if (this.index === -1) this.goTo(0, 1);
  }

  /** Skip the remaining scenes: the page scrolls normally until it returns to the top */
  release(): void {
    this.unlock();
  }

  private step(direction: 1 | -1): void {
    if (this.busy && direction === this.direction) return;
    const next = this.index + direction;
    if (next >= this.count) this.unlock();
    else if (next >= -1) this.goTo(next, direction);
  }

  private goTo(index: number, direction: 1 | -1): void {
    const run = ++this.run;
    this.index = index;
    this.direction = direction;
    this.busy = true;
    this.onStep(index, direction).then(() => {
      if (run === this.run) this.busy = false;
    });
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
