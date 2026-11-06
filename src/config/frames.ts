// Hero frame sequences, encoded by scripts/encode_videos.py from assets-src/frames/<name>/*.webp into
// public/assets/videos/<name>.mp4 (desktop) and <name>-mobile.mp4: packed-alpha H.264, color on top and alpha below.
// Update the count when frames are added/removed, then re-encode.
export const FRAME_SEQUENCES = {
  "001": { count: 47 },
  "002": { count: 70 },
  "003": { count: 61 },
  "004": { count: 65 },
  "005": { count: 149 },
  "006": { count: 199 },
} as const;

export type SequenceName = keyof typeof FRAME_SEQUENCES;

/** Frame rate the videos are encoded at (FPS in scripts/encode_videos.py); used to turn a frame index into a time */
export const VIDEO_FPS = 30;

// Viewport breakpoint (px) below which the lighter mobile setup is used; matches Tailwind `md`
export const MOBILE_MAX_WIDTH = 767;
