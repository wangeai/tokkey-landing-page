// Loads one frame sequence's packed-alpha video (see src/config/frames.ts) fully into memory and seeks it to a frame
// on request; shared via a cache.
import { FRAME_SEQUENCES, VIDEO_FPS, videoUrl, type SequenceName } from "../config/frames";

export class VideoSequence {
  private static readonly cache = new Map<string, VideoSequence>();
  readonly video = document.createElement("video");
  private loading?: Promise<void>;
  /** Frame the video is on, -1 until its first frame is decoded */
  private shown = -1;
  /** Frame a running seek is headed for, undefined when idle */
  private target?: number;
  /** Latest frame asked for and who to tell once it's decoded; a newer request replaces an older one */
  private request?: { index: number; onFrame: () => void };

  private constructor(
    readonly name: SequenceName,
    private readonly mobile: boolean,
  ) {
    // Muted + inline lets mobile browsers decode the video without a user gesture
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.addEventListener("seeked", () => {
      this.shown = this.target!;
      this.target = undefined;
      this.next();
    });
  }

  /** Get (and cache) a sequence; mobile uses the smaller video */
  static get(name: SequenceName, mobile = false): VideoSequence {
    const key = `${name}:${mobile}`;
    if (!VideoSequence.cache.has(key)) VideoSequence.cache.set(key, new VideoSequence(name, mobile));
    return VideoSequence.cache.get(key)!;
  }

  /** Start downloading (idempotent) */
  load(): this {
    this.loading ??= this.fetchVideo();
    return this;
  }

  /** Resolves once the first frame can be drawn */
  ready(): Promise<void> {
    return this.load().loading!;
  }

  get length(): number {
    return FRAME_SEQUENCES[this.name].count;
  }

  /** Seek to frame `index` and call `onFrame` once it's decoded. Requests made while a seek runs are merged into one
   *  seek to the latest, so fast scrubbing never queues up a backlog */
  seek(index: number, onFrame: () => void): void {
    this.request = { index, onFrame };
    this.next();
  }

  /** Download the whole file before playing, so seeks never wait on the network */
  private async fetchVideo(): Promise<void> {
    const response = await fetch(videoUrl(this.name, this.mobile));
    this.video.src = URL.createObjectURL(await response.blob());
    await new Promise((resolve) => this.video.addEventListener("loadeddata", resolve, { once: true }));
    // A paused video that has never seeked can hand WebGL no frame (the canvas then keeps its old picture), so land
    // one real seek on frame 0 before it's used; the "seeked" listener marks it shown and serves any waiting request
    const seeked = new Promise((resolve) => this.video.addEventListener("seeked", resolve, { once: true }));
    this.target = 0;
    this.video.currentTime = 0.5 / VIDEO_FPS;
    await seeked;
  }

  /** Serve the pending request: answer right away if the video is on that frame, else seek to it */
  private next(): void {
    if (!this.request || this.shown < 0 || this.target !== undefined) return;
    const { index, onFrame } = this.request;
    if (index === this.shown) {
      this.request = undefined;
      onFrame();
      return;
    }
    this.target = index;
    // Aim at the middle of the frame so rounding never lands on its neighbor
    this.video.currentTime = (index + 0.5) / VIDEO_FPS;
  }
}
