// Turns scroll gestures into scene steps: while the page sits at the very top, page scrolling is locked and
// each wheel/swipe gesture moves one scene forward or back. Past the last scene the page scrolls normally;
// scrolling back to the top hands control to the stepper again.
import { Observer, ScrollTrigger } from "./gsap";
import { ScrollEngine } from "./ScrollEngine";

export class SceneStepper {
  private static readonly TOP_SLACK = 4;
  /** Scene whose last frame is showing; -1 = before the first scene (scene 0 rewound to its first frame) */
  private index = -1;
  /** True while a scene is playing; gestures are ignored so one gesture = one scene */
  private busy = false;
  private readonly observer: Observer;

  constructor(
    private readonly count: number,
    /** Called on every step with the new index (-1 = before the first scene) and the direction (1 = forward, -1 = back);
     *  the returned promise resolves when the transition has finished */
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
    // always start at the top on scene 0
    ScrollTrigger.clearScrollMemory("manual");
    ScrollEngine.instance.scrollTo(0, true);
    this.lock();
    this.goTo(0, 1);
  }

  private step(direction: 1 | -1): void {
    if (this.busy) return;
    const next = this.index + direction;
    if (next >= this.count) this.unlock();
    else if (next >= -1) this.goTo(next, direction);
  }

  private goTo(index: number, direction: 1 | -1): void {
    this.index = index;
    this.busy = true;
    this.onStep(index, direction).then(() => (this.busy = false));
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
