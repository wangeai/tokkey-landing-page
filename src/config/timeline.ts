// The hero's playback timeline, in order. All frames play as one continuous strip: scrolling moves through it, and a
// bigger scroll moves further. Effect segments sit between frame segments: the canvas holds the previous frame while
// the effect plays over it, driven by scroll like the frames (see FrameStage.onEffect).
import type { SequenceName } from "./frames";

export type FrameFit = "cover" | "contain";

export type TimelineSegment =
  | {
      kind: "frames";
      sequence: SequenceName;
      /** How frames fit a portrait phone screen: "cover" crops to fill, "contain" shows the whole frame */
      mobileFit: FrameFit;
      /** Optional CSS filter on the canvas while these frames show (color-matches older renders) */
      filter?: string;
    }
  | {
      kind: "effect";
      /** Name passed to FrameStage.onEffect */
      id: string;
      /** Scroll length, in frames (60 = as much scrolling as 60 frames) */
      length: number;
    };

export const TIMELINE: TimelineSegment[] = [
  { kind: "effect", id: "heroTitle", length: 20 }, // "Own Your Intelligence." fades out on the first slight scroll (HeroTitleScene)
  { kind: "frames", sequence: "001", mobileFit: "contain", filter: "hue-rotate(28deg) saturate(1.1)" }, // lid lifts, logo glows
  { kind: "frames", sequence: "002", mobileFit: "cover" }, // laptop opens, camera moves in to the plugged-in key
  // Example of an effect between scenes: { kind: "effect", id: "agentsFly", length: 60 },
  { kind: "frames", sequence: "003", mobileFit: "contain" }, // camera pulls back to the laptop's front view
  { kind: "frames", sequence: "004", mobileFit: "contain" }, // laptop rotates to show its underside
  { kind: "frames", sequence: "005", mobileFit: "contain" }, // lightning reveals the internals
  { kind: "frames", sequence: "006", mobileFit: "contain" }, // energy flows through the internals
  { kind: "frames", sequence: "007", mobileFit: "contain" }, // follows on from 006
];
