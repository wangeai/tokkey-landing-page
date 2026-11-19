// One frame sequence as a scroll-scrubbed video, the way Apple's scrub sections work: the whole file is downloaded
// into a Blob first (so seeks never wait on the network), then each requested frame is a seek on a paused <video>,
// with at most one seek in flight; requests made meanwhile collapse into the latest one, so a fast scroll skips frames
// instead of queueing them. iOS Safari decodes nothing until a video has played (and never fires `loadeddata` for a
// paused one), so like Apple's VideoScrub the video is primed with a muted play() → pause() once its metadata is in.
import { FRAME_FPS } from "../config/frames";

export class SceneVideo {
  /** Source frame the video is showing, once a seek has landed; -1 before */
  private shownFrame = -1;
  /** Frame the playhead wants */
  private wantedFrame = -1;
  /** Frame of the seek in flight; -1 when idle */
  private seekingFrame = -1;
  private ready = false;
  private abort: AbortController | null = null;
  private blobUrl = "";
  private readonly video: HTMLVideoElement;

  constructor(
    private readonly url: string,
    /** Where the (invisible) <video> lives; some browsers only decode videos that are in the document */
    container: HTMLElement,
  ) {
    this.video = document.createElement("video");
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.addEventListener("seeked", () => this.onSeeked());
    this.video.addEventListener("loadedmetadata", () => this.prime());
    container.append(this.video);
  }

  /** Whether the whole file has downloaded */
  get downloaded(): boolean {
    return this.blobUrl !== "";
  }

  /** Start downloading (no-op if already loading or loaded) */
  load(priority: RequestPriority): void {
    if (this.abort) return;
    const abort = (this.abort = new AbortController());
    fetch(this.url, { signal: abort.signal, priority })
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(`${response.status} ${this.url}`))))
      .then((blob) => {
        if (this.abort !== abort) return;
        this.blobUrl = URL.createObjectURL(blob);
        this.video.src = this.blobUrl;
        this.video.load();
      })
      .catch(() => {
        // Aborted, or a network error: the next load() retries
        if (this.abort === abort) this.abort = null;
      });
  }

  /** Drop the download and the decoder, freeing their memory */
  unload(): void {
    if (!this.abort) return;
    this.abort.abort();
    this.abort = null;
    this.ready = false;
    this.shownFrame = this.seekingFrame = -1;
    this.video.removeAttribute("src");
    this.video.load();
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = "";
  }

  /** Show `frame` as soon as the video can */
  show(frame: number): void {
    this.wantedFrame = frame;
    this.seekNext();
  }

  /** The video and the frame it shows, or null until the first seek lands */
  current(): { video: HTMLVideoElement; frame: number } | null {
    return this.shownFrame >= 0 ? { video: this.video, frame: this.shownFrame } : null;
  }

  destroy(): void {
    this.unload();
    this.video.remove();
  }

  /** Play then pause at once so iOS starts decoding; seeks begin after, whether or not play() was allowed */
  private prime(): void {
    const src = this.video.src;
    const done = () => {
      // An unload() meanwhile cleared the source
      if (this.video.src !== src || !this.blobUrl) return;
      this.video.pause();
      this.ready = true;
      this.seekNext();
    };
    this.video.play().then(done, done);
  }

  /** Seek to the wanted frame unless a seek is already running (onSeeked comes back here) */
  private seekNext(): void {
    if (!this.ready || this.seekingFrame >= 0 || this.wantedFrame < 0 || this.wantedFrame === this.shownFrame) return;
    // Aim at the middle of the frame so rounding never lands on its neighbour
    const time = (this.wantedFrame + 0.5) / FRAME_FPS;
    if (this.video.currentTime === time) {
      this.shownFrame = this.wantedFrame;
      return;
    }
    this.seekingFrame = this.wantedFrame;
    this.video.currentTime = time;
  }

  private onSeeked(): void {
    // A seek cancelled by unload()
    if (this.seekingFrame < 0) return;
    this.shownFrame = this.seekingFrame;
    this.seekingFrame = -1;
    this.seekNext();
  }
}
