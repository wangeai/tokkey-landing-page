// Lays TIMELINE segments end to end on one axis measured in source frames, and maps a position on it to the frame to
// draw (a sequence and a frame inside it) plus the progress of each effect segment.
import { FRAME_SEQUENCES, type SequenceName } from "../config/frames";
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
  /** Frames: its own sequence. Effects: the sequence of the frame held underneath */
  sequence: SequenceName;
  /** Effects: the frame held underneath (the last one before it, or the first frame if the timeline opens with it) */
  heldFrame: number;
}

export interface TimelinePoint {
  sequence: SequenceName;
  /** Frame index inside the sequence */
  frame: number;
  fit: FrameFit;
  filter: string;
}

export class FrameTimeline {
  /** Sequences in play order, each once */
  readonly sequences: SequenceName[];
  /** Last valid position */
  readonly end: number;
  private readonly spans: Span[] = [];

  constructor(
    segments: TimelineSegment[],
    private readonly mobile: boolean,
  ) {
    const frameSegments = segments.filter((s): s is FramesSegment => s.kind === "frames");
    this.sequences = [...new Set(frameSegments.map((s) => s.sequence))];

    let start = 0;
    let look: FramesSegment | null = null;
    for (const segment of segments) {
      if (segment.kind === "frames") {
        look = segment;
        const length = FRAME_SEQUENCES[segment.sequence].count;
        this.spans.push({ segment, look, start, length, sequence: segment.sequence, heldFrame: 0 });
        start += length;
      } else {
        const sequence = look?.sequence ?? frameSegments[0].sequence;
        const heldFrame = look ? FRAME_SEQUENCES[look.sequence].count - 1 : 0;
        this.spans.push({ segment, look, start, length: segment.length, sequence, heldFrame });
        start += segment.length;
      }
    }
    this.end = Math.max(0, start - 1);
  }

  /** Sequence, frame, fit and filter to show at `position` */
  at(position: number): TimelinePoint {
    const span = this.spanAt(position);
    const frame =
      span.segment.kind === "frames" ? Math.min(span.length - 1, Math.floor(position - span.start)) : span.heldFrame;
    return {
      sequence: span.sequence,
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
