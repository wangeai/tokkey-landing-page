// Shows the frame stage from one all-intra <video> per sequence, the way Apple's scroll pages scrub video:
// - each video is downloaded whole and played from a blob: URL, so a seek never waits on the network;
// - every frame is a keyframe (scripts/encode_videos.py), so a seek decodes one frame, forwards or backwards;
// - a new seek starts only after the previous one lands, so fast scrolling never queues up stale frames.
// Videos download one at a time in play order (the one on screen jumps the queue); until a video arrives its poster
// (first frame) shows.
import { FRAME_FPS, frameUrl, videoUrl, type FrameSize, type SequenceName } from "../config/frames";
import type { FrameFit } from "../config/timeline";

interface SequenceVideo {
  sequence: SequenceName;
  video: HTMLVideoElement;
  /** Download started (it isn't retried if it fails; the poster stays) */
  requested: boolean;
  /** Ready to seek (blob loaded and first frame decoded) */
  ready: boolean;
  /** Frame last asked of the video; -1 = none */
  seekedFrame: number;
}

export class FrameVideos {
  private readonly items: SequenceVideo[];
  private readonly abort = new AbortController();
  private readonly blobUrls: string[] = [];
  private active: SequenceVideo | null = null;
  private loading = false;

  constructor(
    /** Element the videos fill */
    private readonly host: HTMLElement,
    sequences: SequenceName[],
    private readonly size: FrameSize,
  ) {
    this.items = sequences.map((sequence) => ({ sequence, video: this.createVideo(sequence), requested: false, ready: false, seekedFrame: -1 }));
    this.loadNext();
  }

  /** Show `frame` of `sequence` with the given fit and CSS filter */
  show(sequence: SequenceName, frame: number, fit: FrameFit, filter: string): void {
    const item = this.items.find((i) => i.sequence === sequence)!;
    if (item !== this.active) {
      if (this.active) this.active.video.hidden = true;
      item.video.hidden = false;
      this.active = item;
      this.loadNext();
    }
    const { video } = item;
    video.style.objectFit = fit;
    if (video.style.filter !== filter) video.style.filter = filter;
    // One seek in flight at a time; the next tick asks again for wherever the playhead is by then
    if (!item.ready || video.seeking || frame === item.seekedFrame) return;
    item.seekedFrame = frame;
    // Aim at the middle of the frame so rounding can't land on its neighbour
    video.currentTime = (frame + 0.5) / FRAME_FPS;
  }

  /** Stop downloads and release the videos */
  destroy(): void {
    this.abort.abort();
    this.items.forEach(({ video }) => video.remove());
    this.blobUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  private createVideo(sequence: SequenceName): HTMLVideoElement {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.poster = frameUrl(sequence, 0, this.size);
    video.hidden = this.host.childElementCount > 0;
    video.setAttribute("aria-hidden", "true");
    video.className = "absolute inset-0 size-full object-cover";
    this.host.append(video);
    return video;
  }

  /** Download the next missing video (the one on screen first, then play order), one at a time */
  private async loadNext(): Promise<void> {
    if (this.loading) return;
    const item = this.active?.requested === false ? this.active : this.items.find((i) => !i.requested);
    if (!item) return;
    item.requested = true;
    this.loading = true;
    try {
      const response = await fetch(videoUrl(item.sequence, this.size), { signal: this.abort.signal });
      if (!response.ok) throw new Error(`Frame video ${item.sequence}: ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      this.blobUrls.push(url);
      item.video.src = url;
      item.video.addEventListener("loadeddata", () => this.prime(item), { once: true });
    } catch (error) {
      if (this.abort.signal.aborted) return;
      console.error(error);
    }
    this.loading = false;
    this.loadNext();
  }

  /** iOS Safari paints seeked frames only once a video has played; a muted play + pause unlocks that */
  private prime(item: SequenceVideo): void {
    const done = () => {
      item.video.pause();
      item.ready = true;
    };
    item.video.play().then(done, done);
  }
}
