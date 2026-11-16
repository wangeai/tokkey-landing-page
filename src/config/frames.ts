// Frame sequences under public/assets/frames/<name>/<prefix>_NNNNN.webp (numbered from 00000) — update the count
// when frames are added/removed. Frames are 2560×1440 with a transparent background; a 1280px copy of each lives in
// <name>/sm/ (rebuild with `node scripts/resize-frames.mjs`).
export const FRAME_SEQUENCES = {
  "001": { prefix: "001", count: 24 },
  "002": { prefix: "002", count: 36 },
  "003": { prefix: "003", count: 31 },
  "004": { prefix: "004", count: 34 },
  "005": { prefix: "底板飘散", count: 75 },
  "006": { prefix: "006", count: 100 },
  "007": { prefix: "007", count: 87 },
} as const;

export type SequenceName = keyof typeof FRAME_SEQUENCES;

/** Frame sets: full size, and the half-size copy for phones / small viewports */
export const FRAME_SIZES = {
  lg: { width: 2560, folder: "" },
  sm: { width: 1280, folder: "sm/" },
} as const;

export type FrameSize = keyof typeof FRAME_SIZES;

/** URL of one frame (source index, before any mobile step) */
export const frameUrl = (name: SequenceName, index: number, size: FrameSize): string =>
  `/assets/frames/${name}/${FRAME_SIZES[size].folder}${FRAME_SEQUENCES[name].prefix}_${String(index).padStart(5, "0")}.webp`;
