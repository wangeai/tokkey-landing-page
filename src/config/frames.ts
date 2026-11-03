// Frame sequences under public/assets/frames/<name>/<prefix>_NNNNN.<jpg|webp> (numbered from 00000) — update the count
// when frames are added/removed. The format is detected at load time: jpg if present, otherwise webp.
// "webp" frames have a transparent background; "jpg" frames have a black one.
export const FRAME_SEQUENCES = {
  "001": { prefix: "001", count: 47 },
  "002": { prefix: "002", count: 70 },
  "003": { prefix: "003", count: 61 },
  "004": { prefix: "004", count: 65 },
  "005": { prefix: "底板飘散", count: 149 },
  "006": { prefix: "006", count: 199 },
} as const;

export type SequenceName = keyof typeof FRAME_SEQUENCES;

// Viewport breakpoint (px) below which the lighter mobile setup is used; matches Tailwind `md`
export const MOBILE_MAX_WIDTH = 767;
