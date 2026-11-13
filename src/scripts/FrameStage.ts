// Plays the whole TIMELINE as one continuous strip of frames on a canvas. ScrollScrubber sets where the playhead is
// headed; each tick the playhead eases toward it, capped at a max speed, so a slight scroll plays a few frames and a
// big flick plays many, in order, like a video. Effect segments report their progress to handlers from onEffect().
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
  /** How quickly the playhead closes the gap to the target (per second; higher = snappier) */
  private static readonly EASE = 6;
  /** Fastest the playhead moves, in source frames per second; a big flick plays at this speed instead of skipping */
  private static readonly MAX_FPS = 90;

  private readonly timeline: FrameTimeline;
  private readonly store: FrameStore;
  private readonly painter: FrameCanvas;
  private readonly scrubber: ScrollScrubber;
  private readonly effectHandlers = new Map<string, EffectHandler>();
  private readonly effectProgress = new Map<string, number>();
  /** Where the playhead is (source frames) */
  private position = 0;
  private direction: 1 | -1 = 1;
  private readonly tick = () => this.update(gsap.ticker.deltaRatio() / 60);

  constructor(canvas: HTMLCanvasElement, profile: StageProfile) {
    this.timeline = new FrameTimeline(TIMELINE, profile.size, profile.step, profile.mobile);
    this.store = new FrameStore(this.timeline.urls, FRAME_SIZES[profile.size].width);
    this.painter = new FrameCanvas(canvas, FrameStage.ASPECT, (width) => this.store.setDecodeWidth(width));
    this.scrubber = new ScrollScrubber(this.timeline.end, profile, () => Math.abs(this.position - this.timeline.end) < 0.5);
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

  /** Advance the playhead by `dt` seconds of motion, then draw and report effects */
  private update(dt: number): void {
    const gap = this.scrubber.target - this.position;
    if (Math.abs(gap) > 0.01) {
      const eased = gap * (1 - Math.exp(-dt * FrameStage.EASE));
      const capped = FrameStage.MAX_FPS * dt;
      this.position += Math.sign(gap) * Math.min(Math.abs(eased), capped);
      this.direction = gap > 0 ? 1 : -1;
    }
    const point = this.timeline.at(this.position);
    this.store.setFocus(point.frame, this.direction);
    this.painter.setFilter(point.filter);
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
