// Plays the whole TIMELINE as one continuous strip of frames on a canvas. ScrollScrubber maps page scroll to the
// playhead, so frames follow the scroll exactly: a slow scroll plays slowly, a fast flick plays fast. Each sequence is
// a video (VideoStore) seeked to the playhead's frame and drawn onto the canvas. Effect segments report their progress
// to handlers from onEffect().
import { gsap } from "./gsap";
import { FrameCanvas } from "./FrameCanvas";
import { FrameTimeline } from "./FrameTimeline";
import { ScrollScrubber, type ScrubberOptions } from "./ScrollScrubber";
import { VideoStore } from "./VideoStore";
import type { FrameSize } from "../config/frames";
import { TIMELINE } from "../config/timeline";

export interface StageProfile extends ScrubberOptions {
  size: FrameSize;
  mobile: boolean;
}

export type EffectHandler = (progress: number) => void;

export class FrameStage {
  /** Frames are 16:9 */
  private static readonly ASPECT = 16 / 9;

  private readonly timeline: FrameTimeline;
  private readonly store: VideoStore;
  private readonly painter: FrameCanvas;
  private readonly scrubber: ScrollScrubber;
  private readonly effectHandlers = new Map<string, EffectHandler>();
  private readonly effectProgress = new Map<string, number>();
  /** Where the playhead is (source frames) */
  private position = 0;
  private readonly tick = () => this.update();

  constructor(section: HTMLElement, canvas: HTMLCanvasElement, videos: HTMLElement, profile: StageProfile) {
    this.timeline = new FrameTimeline(TIMELINE, profile.mobile);
    this.store = new VideoStore(this.timeline.clips, profile.size, videos);
    this.painter = new FrameCanvas(canvas, FrameStage.ASPECT);
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
    this.position = this.scrubber.target;
    const point = this.timeline.at(this.position);
    this.store.setFocus(this.position, point);
    this.painter.setFilter(point.filter);
    this.painter.setLowered(point.lowered);
    // The latest frame a seek has landed on; until a sequence's video is ready the previous frame stays up
    const shown = this.store.current(point.sequence);
    if (shown) this.painter.draw(shown.video, point.fit, `${point.sequence}:${shown.frame}`);
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
