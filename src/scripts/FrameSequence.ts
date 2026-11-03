// Loads one frame folder (public/assets/frames/<name>/<prefix>_NNNNN.<jpg|webp>) as Image objects; shared via a cache.
import { FRAME_SEQUENCES, type SequenceName } from "../config/frames";

export class FrameSequence {
  private static readonly cache = new Map<string, FrameSequence>();
  private readonly frames: HTMLImageElement[] = [];
  private loaded = false;

  private constructor(
    readonly name: SequenceName,
    private readonly step: number,
  ) {}

  /** Get (and cache) a sequence; step 2 keeps every other frame, used on mobile */
  static get(name: SequenceName, step = 1): FrameSequence {
    const key = `${name}:${step}`;
    if (!FrameSequence.cache.has(key)) FrameSequence.cache.set(key, new FrameSequence(name, step));
    return FrameSequence.cache.get(key)!;
  }

  /** Start downloading (idempotent) */
  load(): this {
    if (this.loaded) return this;
    this.loaded = true;
    const { count } = FRAME_SEQUENCES[this.name];
    for (let i = 0; i < count; i += this.step) {
      const img = new Image();
      img.decoding = "async";
      this.frames.push(img);
    }
    // Probe the first frame as jpg; if it's missing, fall back to webp. The rest follow the detected format.
    const first = this.frames[0];
    const loadRest = (ext: string) => this.frames.slice(1).forEach((img, i) => (img.src = this.url((i + 1) * this.step, ext)));
    // Remove both listeners once either fires, so the webp fallback's own "load" doesn't re-trigger the jpg path
    const onLoad = () => {
      first.removeEventListener("error", onError);
      loadRest("jpg");
    };
    const onError = () => {
      first.removeEventListener("load", onLoad);
      first.src = this.url(0, "webp");
      loadRest("webp");
    };
    first.addEventListener("load", onLoad, { once: true });
    first.addEventListener("error", onError, { once: true });
    first.src = this.url(0, "jpg");
    return this;
  }

  /** URL of the frame with the given source index and extension */
  private url(index: number, ext: string): string {
    const { prefix } = FRAME_SEQUENCES[this.name];
    return `/assets/frames/${this.name}/${prefix}_${String(index).padStart(5, "0")}.${ext}`;
  }

  get length(): number {
    return this.frames.length;
  }

  /** Resolves once the first frame can be drawn */
  ready(): Promise<void> {
    this.load();
    const first = this.frames[0];
    if (first.complete) return Promise.resolve();
    return new Promise((resolve) => first.addEventListener("load", () => resolve(), { once: true }));
  }

  /** Closest decoded frame to `index`, searching backwards first so motion never jumps ahead */
  nearestLoaded(index: number): HTMLImageElement | null {
    const ready = (i: number) => this.frames[i]?.complete && this.frames[i].naturalWidth > 0;
    for (let i = index; i >= 0; i--) if (ready(i)) return this.frames[i];
    for (let i = index + 1; i < this.frames.length; i++) if (ready(i)) return this.frames[i];
    return null;
  }
}
