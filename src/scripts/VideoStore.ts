// Holds one SceneVideo per frame sequence and keeps only the ones near the playhead loaded, like Apple's load
// keyframes (a scrub video loads from ~150vh before its section and unloads after): the sequence on screen and its
// neighbours are ready before the scroll reaches them, and sequences far away free their memory. The sequence on
// screen always downloads first, alone and at high priority, so the frame in view never shares bandwidth.
import { videoUrl, type FrameSize, type SequenceName, type VideoFormat } from "../config/frames";
import type { Clip, TimelinePoint } from "./FrameTimeline";
import { SceneVideo } from "./SceneVideo";

export class VideoStore {
  /** A sequence loads once the playhead is this many positions from it, and unloads past that */
  private static readonly MARGIN = 200;

  private readonly videos = new Map<SequenceName, SceneVideo>();

  constructor(
    private readonly clips: Clip[],
    size: FrameSize,
    container: HTMLElement,
  ) {
    const format = VideoStore.format();
    for (const { sequence } of clips) this.videos.set(sequence, new SceneVideo(videoUrl(sequence, size, format), container));
  }

  /** HEVC where the browser plays it (Safari, Chrome on Apple hardware), else VP9 */
  private static format(): VideoFormat {
    return document.createElement("video").canPlayType('video/mp4; codecs="hvc1"') ? "mp4" : "webm";
  }

  /** Move the playhead: load / unload sequences around `position` and seek the one on screen to `point.frame` */
  setFocus(position: number, point: TimelinePoint): void {
    const onScreen = this.videos.get(point.sequence)!;
    onScreen.load("high");
    for (const { sequence, start, end } of this.clips) {
      const near = position >= start - VideoStore.MARGIN && position <= end + VideoStore.MARGIN;
      // Neighbours wait until the sequence on screen has downloaded
      if (!near) this.videos.get(sequence)!.unload();
      else if (onScreen.downloaded) this.videos.get(sequence)!.load("low");
    }
    this.videos.get(point.sequence)!.show(point.frame);
  }

  /** What `sequence`'s video shows, or null until its first frame lands */
  current(sequence: SequenceName): { video: HTMLVideoElement; frame: number } | null {
    return this.videos.get(sequence)!.current();
  }

  destroy(): void {
    this.videos.forEach((video) => video.destroy());
  }
}
