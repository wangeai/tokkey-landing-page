// Frame sequences under public/assets/frames/<name>/NNN.webp — update the count when frames are added/removed.
export const FRAME_COUNTS = {
  a: 31,
  b: 47,
  c: 41,
  d: 60,
  e: 99,
  g: 133,
} as const;

export type SequenceName = keyof typeof FRAME_COUNTS;

// Viewport breakpoint (px) below which the lighter mobile setup is used; matches Tailwind `md`
export const MOBILE_MAX_WIDTH = 767;
