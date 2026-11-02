// Loads one frame folder (public/assets/frames/<name>/NNN.webp) as Image objects; shared via a cache.
import { FRAME_COUNTS, type SequenceName } from "../config/frames";

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
    for (let i = 1; i <= FRAME_COUNTS[this.name]; i += this.step) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/assets/frames/${this.name}/${String(i).padStart(3, "0")}.webp`;
      this.frames.push(img);
    }
    return this;
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
