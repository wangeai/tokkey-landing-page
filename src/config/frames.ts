// Frame sequences under public/assets/frames/<name>/<prefix>_NNNNN.webp (numbered from 00000) — update the count
// when frames are added/removed. Frames are 2560×1440 with a transparent background; a 1280px copy of each lives in
// <name>/sm/ (rebuild with `node scripts/resize-frames.mjs`). The page plays them as one video per sequence
// (rebuild with `python3 scripts/encode_videos.py`), so the frame files are only the videos' source.
export const FRAME_SEQUENCES = {
  "001": { prefix: "001", count: 24 },
  "002": { prefix: "002", count: 36 },
  "003": { prefix: "003", count: 31 },
  "004": { prefix: "004", count: 34 },
  "005": { prefix: "底板飘散", count: 75 },
  "006": { prefix: "006", count: 100 },
  "007": { prefix: "007", count: 79 },
} as const;

export type SequenceName = keyof typeof FRAME_SEQUENCES;

/** Video sizes, smallest first (like Apple's small / medium / large tiers): phones and small viewports, 1080p-class
 *  screens, and retina / large screens */
export const FRAME_SIZES = {
  sm: { width: 1280, suffix: "-sm" },
  md: { width: 1920, suffix: "-md" },
  lg: { width: 2560, suffix: "" },
} as const;

export type FrameSize = keyof typeof FRAME_SIZES;

/** Frame rate the videos are encoded at (FPS in scripts/encode_videos.py) */
export const FRAME_FPS = 30;

/** Video container: HEVC .mp4 (hardware-decoded on Apple devices), else VP9 .webm */
export type VideoFormat = "mp4" | "webm";

/** URL of one sequence's video */
export const videoUrl = (name: SequenceName, size: FrameSize, format: VideoFormat): string =>
  `/assets/videos/${name}${FRAME_SIZES[size].suffix}.${format}`;
