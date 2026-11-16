// Downloads and decodes a flat list of frame URLs the way Apple's scroll pages do:
// - keyframes first (every 16th frame, then 8th, 4th, 2nd, all), so scrubbing works early and sharpens as more arrive;
// - frames just ahead of the playhead jump the queue;
// - downloads stay as compressed Blobs; only a small window around the playhead is decoded to ImageBitmaps (off the
//   main thread, at canvas size), and bitmaps that leave the window are closed to free memory.
export class FrameStore {
  private static readonly STRIDES = [16, 8, 4, 2, 1];
  private static readonly MAX_FETCHES = 6;
  private static readonly MAX_DECODES = 3;
  /** Frames past the playhead (in the play direction) that jump the download queue */
  private static readonly LOOKAHEAD = 48;

  private readonly blobs: (Blob | undefined)[];
  private readonly bitmaps = new Map<number, ImageBitmap>();
  private readonly fetching = new Set<number>();
  private readonly decoding = new Set<number>();
  /** Background download order (keyframes first) and how far through it we are */
  private readonly order: number[];
  private cursor = 0;
  private focus = 0;
  private direction: 1 | -1 = 1;
  /** Width frames are decoded at; 0 = their own size */
  private decodeWidth = 0;
  private readonly abort = new AbortController();

  constructor(
    private readonly urls: string[],
    /** Width of the frame files */
    private readonly sourceWidth: number,
    /** Decoded frames kept ahead of / behind the playhead */
    private readonly window = { ahead: 16, behind: 4 },
  ) {
    this.blobs = new Array(urls.length);
    this.order = FrameStore.keyframeOrder(urls.length);
    this.pump();
  }

  /** 0, then every 16th frame, every 8th, ... every frame; each index once */
  private static keyframeOrder(count: number): number[] {
    const seen = new Set<number>();
    for (const stride of FrameStore.STRIDES) for (let i = 0; i < count; i += stride) seen.add(i);
    return [...seen];
  }

  /** Move the playhead: re-aims downloads and decodes, and frees bitmaps that fell out of the window */
  setFocus(index: number, direction: 1 | -1): void {
    // Called every tick; downloads and decodes pump themselves as they finish, so only a move needs work
    if (index === this.focus && direction === this.direction) return;
    this.focus = index;
    this.direction = direction;
    for (const [i, bitmap] of this.bitmaps) {
      if (this.inWindow(i)) continue;
      bitmap.close();
      this.bitmaps.delete(i);
    }
    this.pump();
  }

  /** Decode at most `width` px wide (the canvas width); clears decoded frames when it changes */
  setDecodeWidth(width: number): void {
    const next = width >= this.sourceWidth ? 0 : Math.ceil(width);
    if (next === this.decodeWidth) return;
    this.decodeWidth = next;
    this.bitmaps.forEach((bitmap) => bitmap.close());
    this.bitmaps.clear();
    this.pump();
  }

  /** Decoded frame `index`, or the closest decoded one (behind it first, so motion never jumps ahead) */
  get(index: number): ImageBitmap | null {
    const { ahead, behind } = this.window;
    const reach = Math.max(ahead, behind) * 2;
    for (let d = 0; d <= reach; d++) {
      const bitmap = this.bitmaps.get(index - d * this.direction) ?? this.bitmaps.get(index + d * this.direction);
      if (bitmap) return bitmap;
    }
    return null;
  }

  /** Stop downloads and free every decoded frame */
  destroy(): void {
    this.abort.abort();
    this.bitmaps.forEach((bitmap) => bitmap.close());
    this.bitmaps.clear();
  }

  private inWindow(index: number): boolean {
    const offset = (index - this.focus) * this.direction;
    return offset >= -this.window.behind && offset <= this.window.ahead;
  }

  /** Start as many downloads and decodes as the limits allow */
  private pump(): void {
    if (this.abort.signal.aborted) return;
    while (this.fetching.size < FrameStore.MAX_FETCHES) {
      const index = this.nextDownload();
      if (index === undefined) break;
      this.download(index);
    }
    for (const index of this.decodeQueue()) {
      if (this.decoding.size >= FrameStore.MAX_DECODES) break;
      this.decode(index);
    }
  }

  /** Frames right ahead of the playhead first, then the keyframe-first order */
  private nextDownload(): number | undefined {
    const wanted = (i: number) => i >= 0 && i < this.urls.length && !this.blobs[i] && !this.fetching.has(i);
    for (let d = 0; d <= FrameStore.LOOKAHEAD; d++) {
      const i = this.focus + d * this.direction;
      if (wanted(i)) return i;
    }
    while (this.cursor < this.order.length) {
      const i = this.order[this.cursor++];
      if (wanted(i)) return i;
    }
    return undefined;
  }

  /** Downloaded frames in the window that still need decoding, nearest the playhead first */
  private decodeQueue(): number[] {
    const queue: number[] = [];
    for (let d = 0; d <= this.window.ahead; d++) queue.push(this.focus + d * this.direction);
    for (let d = 1; d <= this.window.behind; d++) queue.push(this.focus - d * this.direction);
    return queue.filter((i) => this.blobs[i] && !this.bitmaps.has(i) && !this.decoding.has(i));
  }

  private async download(index: number): Promise<void> {
    this.fetching.add(index);
    try {
      // The first frame is on screen at load; the rest download behind it
      const response = await fetch(this.urls[index], { signal: this.abort.signal, priority: index === 0 ? "high" : "low" });
      if (response.ok) this.blobs[index] = await response.blob();
    } catch {
      // Aborted, or a network error: a later pump retries from the lookahead
    }
    this.fetching.delete(index);
    this.pump();
  }

  private async decode(index: number): Promise<void> {
    this.decoding.add(index);
    const width = this.decodeWidth;
    try {
      const options: ImageBitmapOptions = width ? { resizeWidth: width, resizeQuality: "high" } : {};
      const bitmap = await createImageBitmap(this.blobs[index]!, options);
      // Keep it only if it's still wanted at the current size
      if (this.abort.signal.aborted || width !== this.decodeWidth || !this.inWindow(index)) bitmap.close();
      else this.bitmaps.set(index, bitmap);
    } catch {
      // Corrupt frame: drop it so it's downloaded again
      this.blobs[index] = undefined;
    }
    this.decoding.delete(index);
    this.pump();
  }
}
