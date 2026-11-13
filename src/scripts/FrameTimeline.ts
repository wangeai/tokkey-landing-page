// Lays TIMELINE segments end to end on one axis measured in source frames, and maps a position on it to the frame to
// draw (an index into one flat list of every frame URL) plus the progress of each effect segment.
import { FRAME_SEQUENCES, frameUrl, type FrameSize } from "../config/frames";
import type { FrameFit, TimelineSegment } from "../config/timeline";

type FramesSegment = Extract<TimelineSegment, { kind: "frames" }>;

interface Span {
  segment: TimelineSegment;
  /** Frames segment whose look (fit, filter) shows here: itself, or the one before an effect */
  look: FramesSegment | null;
  /** Position where the segment starts */
  start: number;
  /** Scroll length in source frames */
  length: number;
  /** Frames: flat index of its first frame. Effects: flat index of the frame held underneath */
  firstFrame: number;
  /** Frames: number of frames loaded (fewer than the source count when `step` > 1) */
  frameCount: number;
}

export interface TimelinePoint {
  /** Flat index into `urls` */
  frame: number;
  fit: FrameFit;
  filter: string;
}

export class FrameTimeline {
  /** Every frame URL, in play order */
  readonly urls: string[] = [];
  /** Last valid position */
  readonly end: number;
  private readonly spans: Span[] = [];

  constructor(
    segments: TimelineSegment[],
    size: FrameSize,
    /** Load every `step`-th frame (mobile uses 2) */
    private readonly step: number,
    private readonly mobile: boolean,
  ) {
    let start = 0;
    let look: FramesSegment | null = null;
    for (const segment of segments) {
      if (segment.kind === "frames") {
        look = segment;
        const { count } = FRAME_SEQUENCES[segment.sequence];
        const firstFrame = this.urls.length;
        for (let i = 0; i < count; i += step) this.urls.push(frameUrl(segment.sequence, i, size));
        this.spans.push({ segment, look, start, length: count, firstFrame, frameCount: this.urls.length - firstFrame });
        start += count;
      } else {
        // Holds the last frame before it (or the first frame, if the timeline opens with an effect)
        this.spans.push({ segment, look, start, length: segment.length, firstFrame: Math.max(0, this.urls.length - 1), frameCount: 0 });
        start += segment.length;
      }
    }
    this.end = Math.max(0, start - 1);
  }

  /** Frame, fit and filter to show at `position` */
  at(position: number): TimelinePoint {
    const span = this.spanAt(position);
    const frame =
      span.segment.kind === "frames"
        ? span.firstFrame + Math.min(span.frameCount - 1, Math.floor((position - span.start) / this.step))
        : span.firstFrame;
    return {
      frame,
      fit: this.mobile && span.look ? span.look.mobileFit : "cover",
      filter: span.look?.filter ?? "",
    };
  }

  /** Progress (0..1, clamped) of every effect segment at `position`; effects already passed read 1, upcoming read 0 */
  effects(position: number): Map<string, number> {
    const progress = new Map<string, number>();
    for (const { segment, start, length } of this.spans) {
      if (segment.kind === "effect") progress.set(segment.id, Math.min(1, Math.max(0, (position - start) / length)));
    }
    return progress;
  }

  private spanAt(position: number): Span {
    return this.spans.findLast((s) => s.start <= position) ?? this.spans[0];
  }
}
