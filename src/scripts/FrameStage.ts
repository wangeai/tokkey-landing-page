// Plays the whole TIMELINE as one continuous strip of frames, scrubbing one all-intra video per sequence (FrameVideos).
// ScrollScrubber maps page scroll to a target on the timeline; the playhead eases toward it each tick (Apple's
// catch-up), so even a jump in scroll (a fast touch flick, a scrollbar drag) plays through the frames in between
// instead of cutting to the end. Effect segments report their progress to handlers from onEffect().
import { gsap } from "./gsap";
import { FrameTimeline } from "./FrameTimeline";
import { FrameVideos } from "./FrameVideos";
import { ScrollScrubber, type ScrubberOptions } from "./ScrollScrubber";
import type { FrameSize } from "../config/frames";
import { TIMELINE } from "../config/timeline";

export interface StageProfile extends ScrubberOptions {
  size: FrameSize;
  mobile: boolean;
}

export type EffectHandler = (progress: number) => void;

export class FrameStage {
  /** Share of the gap to the scroll target the playhead covers per tick */
  private static readonly CATCH_UP = 0.25;

  private readonly timeline: FrameTimeline;
  private readonly videos: FrameVideos;
  private readonly scrubber: ScrollScrubber;
  private readonly effectHandlers = new Map<string, EffectHandler>();
  private readonly effectProgress = new Map<string, number>();
  /** Where the playhead is (source frames) */
  private position: number;
  private readonly tick = () => this.update();

  constructor(section: HTMLElement, host: HTMLElement, profile: StageProfile) {
    this.timeline = new FrameTimeline(TIMELINE, profile.mobile);
    this.videos = new FrameVideos(host, this.timeline.sequences, profile.size);
    this.scrubber = new ScrollScrubber(section, this.timeline.end, profile);
    // Start where the scroll already is (a refresh can restore the page mid-pin)
    this.position = this.scrubber.target;
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
    this.videos.destroy();
  }

  /** Ease the playhead toward the scroll position, then show its frame and report effects */
  private update(): void {
    const gap = this.scrubber.target - this.position;
    this.position = Math.abs(gap) < 0.05 ? this.scrubber.target : this.position + gap * FrameStage.CATCH_UP;
    const point = this.timeline.at(this.position);
    this.videos.show(point.sequence, point.frame, point.fit, point.filter);
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
