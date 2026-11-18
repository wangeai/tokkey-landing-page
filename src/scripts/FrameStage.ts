// Plays the whole TIMELINE as one continuous strip of frames on a canvas. ScrollScrubber maps page scroll to the
// playhead, so frames follow the scroll exactly: a slow scroll plays slowly, a fast flick plays fast. Each sequence is
// a video (VideoStore) seeked to the playhead's frame and drawn onto the canvas. Effect segments report their progress
// to handlers from onEffect().
import { gsap } from "./gsap";
import { FrameCanvas } from "./FrameCanvas";
import { FrameTimeline } from "./FrameTimeline";
import { ScrollScrubber, type ScrubberOptions } from "./ScrollScrubber";
import { VideoStore } from "./VideoStore";
import { ScrollEngine } from "./ScrollEngine";
import type { FrameSize, SequenceName } from "../config/frames";
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
  /** Position of the frame on the canvas; lags `position` while a video downloads or seeks */
  private shownPosition = 0;
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

  /** Scroll the page so the timeline plays to the end of the opening sequence (title exit + 001) over `duration` s */
  playOpening(duration: number): void {
    ScrollEngine.instance.scrollTo(this.scrubber.scrollYAt(this.timeline.clips[0].end + 1), false, duration);
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
    // The latest frame a seek has landed on; until a sequence's video is ready the previous frame stays up
    const shown = this.store.current(point.sequence);
    if (shown) {
      this.painter.draw(shown.video, point.fit, `${point.sequence}:${shown.frame}`);
      this.trackShown(point.sequence, shown.frame, point.frame);
    }
    // Look and effects follow the frame on screen, not the scroll, so a slow download can't make them run early
    const look = this.timeline.at(this.shownPosition);
    this.painter.setFilter(look.filter);
    this.painter.setLowered(look.lowered);
    this.reportEffects();
  }

  /** Update shownPosition from the frame just drawn; on the wanted frame it is the playhead (effects hold that frame) */
  private trackShown(sequence: SequenceName, shownFrame: number, wantedFrame: number): void {
    if (shownFrame === wantedFrame) this.shownPosition = this.position;
    else this.shownPosition = this.timeline.positionOf(sequence, shownFrame) ?? this.shownPosition;
  }

  /** Call effect handlers whose progress changed */
  private reportEffects(): void {
    if (!this.effectHandlers.size) return;
    for (const [id, progress] of this.timeline.effects(this.shownPosition)) {
      const handler = this.effectHandlers.get(id);
      if (!handler || this.effectProgress.get(id) === progress) continue;
      this.effectProgress.set(id, progress);
      handler(progress);
    }
  }
}
