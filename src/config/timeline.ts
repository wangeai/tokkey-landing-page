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
      /** Desktop: the frames slide down LOWER_VH while this segment plays and stay down after it, giving the overlay
       *  headings room above the laptop. Set it on a segment whose frames have a black background, so no edge shows */
      lower?: boolean;
    }
  | {
      kind: "effect";
      /** Name passed to FrameStage.onEffect */
      id: string;
      /** Scroll length, in frames (30 = as much scrolling as 30 frames) */
      length: number;
    };

/** How far `lower` moves the frames down, in vh */
export const LOWER_VH = 8;

export const TIMELINE: TimelineSegment[] = [
  { kind: "effect", id: "heroTitle", length: 10 }, // "Own Your Intelligence." fades out on the first slight scroll (HeroTitleScene)
  { kind: "frames", sequence: "001", mobileFit: "contain" }, // lid lifts, logo glows
  { kind: "frames", sequence: "002", mobileFit: "cover" }, // laptop opens, camera moves in to the plugged-in key
  { kind: "effect", id: "aiMac", length: 120 }, // "Turn your Mac into an AI Mac.": agent chips fly into the key (AiMacScene)
  { kind: "frames", sequence: "003", mobileFit: "contain", lower: true }, // camera pulls back to the laptop's front view
  { kind: "effect", id: "privateAgent", length: 200 }, // "A private agent on your Mac.": agent UI plays on the screen (PrivateAgentScene)
  { kind: "frames", sequence: "004", mobileFit: "contain" }, // laptop rotates to show its underside
  { kind: "frames", sequence: "005", mobileFit: "contain" }, // lightning reveals the internals
  { kind: "frames", sequence: "006", mobileFit: "contain" }, // energy flows through the internals
  { kind: "frames", sequence: "007", mobileFit: "contain" }, // follows on from 006
  { kind: "effect", id: "productViewer", length: 100 }, // last frame crossfades into the live 3D key (ProductViewerScene)
];
