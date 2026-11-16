// Plays the whole TIMELINE as one continuous strip of frames on a canvas. ScrollScrubber maps page scroll to the
// playhead, so frames follow the scroll exactly: a slow scroll plays slowly, a fast flick plays fast. Effect segments
// report their progress to handlers from onEffect().
import { gsap } from "./gsap";
import { FrameCanvas } from "./FrameCanvas";
import { FrameStore } from "./FrameStore";
import { FrameTimeline } from "./FrameTimeline";
import { ScrollScrubber, type ScrubberOptions } from "./ScrollScrubber";
import { FRAME_SIZES, type FrameSize } from "../config/frames";
import { TIMELINE } from "../config/timeline";

export interface StageProfile extends ScrubberOptions {
  size: FrameSize;
  /** Load every `step`-th frame */
  step: number;
  mobile: boolean;
}

export type EffectHandler = (progress: number) => void;

export class FrameStage {
  /** Frames are 16:9 */
  private static readonly ASPECT = 16 / 9;

  private readonly timeline: FrameTimeline;
  private readonly store: FrameStore;
  private readonly painter: FrameCanvas;
  private readonly scrubber: ScrollScrubber;
  private readonly effectHandlers = new Map<string, EffectHandler>();
  private readonly effectProgress = new Map<string, number>();
  /** Where the playhead is (source frames) */
  private position = 0;
  private direction: 1 | -1 = 1;
  private readonly tick = () => this.update();

  constructor(section: HTMLElement, canvas: HTMLCanvasElement, profile: StageProfile) {
    this.timeline = new FrameTimeline(TIMELINE, profile.size, profile.step, profile.mobile);
    this.store = new FrameStore(this.timeline.urls, FRAME_SIZES[profile.size].width);
    this.painter = new FrameCanvas(canvas, FrameStage.ASPECT, (width) => this.store.setDecodeWidth(width));
    this.scrubber = new ScrollScrubber(section, this.timeline.end, profile);
    gsap.ticker.add(this.tick);
  }

  /** Call `handler` with the effect's progress (0..1) whenever it changes; passed effects read 1, upcoming ones 0 */
  onEffect(id: string, handler: EffectHandler): this {
    this.effectHandlers.set(id, handler);
    this.effectProgress.delete(id);
    return this;
  }

  destroy(): void {
    gsap.ticker.remove(this.tick);
    this.scrubber.destroy();
    this.painter.destroy();
    this.store.destroy();
  }

  /** Move the playhead to the scroll position, then draw and report effects */
  private update(): void {
    const gap = this.scrubber.target - this.position;
    if (gap) this.direction = gap > 0 ? 1 : -1;
    this.position = this.scrubber.target;
    const point = this.timeline.at(this.position);
    this.store.setFocus(point.frame, this.direction);
    this.painter.setFilter(point.filter);
    this.painter.setLowered(point.lowered);
    this.painter.draw(this.store.get(point.frame), point.fit);
    this.reportEffects();
  }

  /** Call effect handlers whose progress changed */
  private reportEffects(): void {
    if (!this.effectHandlers.size) return;
    for (const [id, progress] of this.timeline.effects(this.position)) {
      const handler = this.effectHandlers.get(id);
      if (!handler || this.effectProgress.get(id) === progress) continue;
      this.effectProgress.set(id, progress);
      handler(progress);
    }
  }
}
