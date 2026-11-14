// Frame sequences under public/assets/frames/<name>/<prefix>_NNNNN.webp (numbered from 00000) — update the count
// when frames are added/removed. Frames are 2560×1440 with a transparent background; a 1280px copy of each lives in
// <name>/sm/ (rebuild with `node scripts/resize-frames.mjs`). The stage plays them from all-intra videos built from
// these frames (public/assets/videos/<name>[-sm].mp4, rebuild with `python3 scripts/encode_videos.py`); the webp
// frames are the videos' source and their first frame is each video's poster.
export const FRAME_SEQUENCES = {
  "001": { prefix: "001", count: 47 },
  "002": { prefix: "002", count: 70 },
  "003": { prefix: "003", count: 61 },
  "004": { prefix: "004", count: 65 },
  "005": { prefix: "底板飘散", count: 149 },
  "006": { prefix: "006", count: 199 },
} as const;

export type SequenceName = keyof typeof FRAME_SEQUENCES;

/** Frame rate the videos are encoded at (FPS in scripts/encode_videos.py) */
export const FRAME_FPS = 30;

/** Frame sets: full size, and the half-size copy for phones / small viewports */
export const FRAME_SIZES = {
  lg: { width: 2560, folder: "", suffix: "" },
  sm: { width: 1280, folder: "sm/", suffix: "-sm" },
} as const;

export type FrameSize = keyof typeof FRAME_SIZES;

/** URL of one webp frame */
export const frameUrl = (name: SequenceName, index: number, size: FrameSize): string =>
  `/assets/frames/${name}/${FRAME_SIZES[size].folder}${FRAME_SEQUENCES[name].prefix}_${String(index).padStart(5, "0")}.webp`;

/** URL of a sequence's scrub video */
export const videoUrl = (name: SequenceName, size: FrameSize): string =>
  `/assets/videos/${name}${FRAME_SIZES[size].suffix}.mp4`;
