// Lays TIMELINE segments end to end on one axis measured in source frames, and maps a position on it to the frame to
// draw (a sequence and a frame in it) plus the progress of each effect segment.
import { FRAME_SEQUENCES, type SequenceName } from "../config/frames";
import type { FrameFit, TimelineSegment } from "../config/timeline";

type FramesSegment = Extract<TimelineSegment, { kind: "frames" }>;

interface Span {
  segment: TimelineSegment;
  /** Frames segment whose look (fit, filter) shows here: itself, or the one before an effect */
  look: FramesSegment;
  /** Position where the segment starts */
  start: number;
  /** Scroll length in source frames */
  length: number;
  /** Sequence on screen */
  sequence: SequenceName;
  /** Frames: its first source frame. Effects: the source frame held underneath */
  firstFrame: number;
}

export interface TimelinePoint {
  sequence: SequenceName;
  /** Source frame in `sequence` */
  frame: number;
  fit: FrameFit;
  filter: string;
  /** How far the frames are lowered (0..1 of LOWER_VH): eases in over the `lower` segment, 0 on mobile */
  lowered: number;
}

/** Positions (inclusive) over which a sequence is on screen, effects held on its frames included */
export interface Clip {
  sequence: SequenceName;
  start: number;
  end: number;
}

export class FrameTimeline {
  /** Last valid position */
  readonly end: number;
  /** One per sequence, in play order */
  readonly clips: Clip[] = [];
  private readonly spans: Span[] = [];
  /** The `lower` segment's span, if any */
  private readonly lowerSpan: Span | undefined;

  constructor(
    segments: TimelineSegment[],
    private readonly mobile: boolean,
  ) {
    // An effect before any frames holds the first frame of the first frames segment
    const opening = segments.find((s): s is FramesSegment => s.kind === "frames")!;
    let start = 0;
    // An effect before any frames also takes the opening frames' look (mobile fit, filter)
    let look: FramesSegment = opening;
    for (const segment of segments) {
      if (segment.kind === "frames") {
        look = segment;
        const first = segment.from ?? 0;
        const last = Math.min(FRAME_SEQUENCES[segment.sequence].count - 1, segment.to ?? Infinity);
        this.addSpan({ segment, look, start, length: last - first + 1, sequence: segment.sequence, firstFrame: first });
      } else {
        // Holds the last frame before it (or the opening frame, if the timeline starts with an effect)
        const held = this.spans.at(-1);
        const sequence = held?.sequence ?? opening.sequence;
        const firstFrame = held ? held.firstFrame + (held.segment.kind === "frames" ? held.length - 1 : 0) : (opening.from ?? 0);
        this.addSpan({ segment, look, start, length: segment.length, sequence, firstFrame });
      }
      start += this.spans.at(-1)!.length;
    }
    this.end = Math.max(0, start - 1);
    this.lowerSpan = this.spans.find((s) => s.segment.kind === "frames" && s.segment.lower);
  }

  /** Sequence, frame, fit and filter to show at `position` */
  at(position: number): TimelinePoint {
    const span = this.spanAt(position);
    const frame =
      span.segment.kind === "frames"
        ? span.firstFrame + Math.min(span.length - 1, Math.floor(position - span.start))
        : span.firstFrame;
    return {
      sequence: span.sequence,
      frame,
      fit: this.mobile ? span.look.mobileFit : "cover",
      filter: span.look.filter ?? "",
      lowered: this.lowered(position),
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

  /** Position where a frames segment plays `frame` of `sequence`, or null if none does */
  positionOf(sequence: SequenceName, frame: number): number | null {
    const span = this.spans.find(
      (s) => s.segment.kind === "frames" && s.sequence === sequence && frame >= s.firstFrame && frame < s.firstFrame + s.length,
    );
    return span ? span.start + frame - span.firstFrame : null;
  }

  /** Record a span and stretch its sequence's clip over it */
  private addSpan(span: Span): void {
    this.spans.push(span);
    const end = span.start + span.length - 1;
    const clip = this.clips.find((c) => c.sequence === span.sequence);
    if (clip) clip.end = end;
    else this.clips.push({ sequence: span.sequence, start: span.start, end });
  }

  private lowered(position: number): number {
    if (this.mobile || !this.lowerSpan) return 0;
    const { start, length } = this.lowerSpan;
    return Math.min(1, Math.max(0, (position - start) / length));
  }

  private spanAt(position: number): Span {
    return this.spans.findLast((s) => s.start <= position) ?? this.spans[0];
  }
}
