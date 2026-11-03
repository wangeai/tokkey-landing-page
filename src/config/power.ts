// Scene "powerFlow" content: what the laptop internals mean With Tokkey vs Without Tokkey.
// Positions are in the 1600×900 frame space used by HeroScene (frames are 3840×2160, same 16:9).
// Icons are the legacy page's 24×24 line icons (inner SVG markup, stroked at 1.6px with round caps).
// "With Tokkey" cards and strip items carry a `tone`: their icon is stroked with that gradient (colors from the legacy page).

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Icon gradients as [offset, color] stops, running bottom-left → top-right across the 24×24 icon */
export const ICON_GRADIENTS = {
  orange: [[0, "#FF6A00"], [1, "#FFB63D"]],
  ai: [[0, "#FFB49A"], [0.3, "#E8D58A"], [0.55, "#9FE0A8"], [0.8, "#8CC4FF"], [1, "#D3A8FF"]],
  green: [[0, "#6FE08A"], [1, "#D2F58C"]],
  pink: [[0, "#FF3D8F"], [1, "#C645FF"]],
} as const;

export type IconTone = keyof typeof ICON_GRADIENTS;

export interface PowerItem {
  title: string;
  text: string;
  /** Inner SVG markup of a 24×24 line icon */
  icon: string;
  /** Gradient stroke for the icon; without one the icon uses currentColor */
  tone?: IconTone;
}

/** A side card; "With Tokkey" cards point at the parts they describe */
export interface PowerCard extends PowerItem {
  hotspots?: Box[];
}

/** A glass chip beside the laptop; `at` is its top-left as a fraction of the laptop box; `live` adds a green status dot */
export interface PowerTag extends PowerItem {
  at: { x: number; y: number };
  live?: boolean;
}

/** The laptop (internals, without the key) in the "powerFlow" frames */
export const POWER_LAPTOP_IN_FRAME: Box = { x: 410, y: 192, width: 761, height: 523 };

const ICONS = {
  flash: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M13 7l-3.5 5.5H14L11 17"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  memory: '<rect x="3" y="6" width="18" height="9" rx="1.8"/><path d="M7 10.5h.01M11 10.5h.01M15 10.5h.01M6.5 15v3M10.5 15v3M14.5 15v3M18 15v3"/>',
  /** Memory stick without the dots: "memory full" */
  memoryFull: '<rect x="3" y="6" width="18" height="9" rx="1.8"/><path d="M6.5 15v3M10.5 15v3M14.5 15v3M18 15v3"/>',
  storage: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 12h5"/><circle cx="17" cy="12" r="1.2"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 3.8 3.8 0 0 1 17.5 18H7z"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M14.5 9.6c-.6-.9-1.4-1.2-2.5-1.2-1.3 0-2.4.6-2.4 1.7 0 2.3 5 1.1 5 3.6 0 1.1-1.1 1.8-2.6 1.8-1.1 0-2-.4-2.6-1.3"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8z"/><path d="M12 17v4"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.8"/><path d="M3 19h18"/>',
};

export const POWER = {
  with: {
    cards: [
      {
        title: "Tokkey Flash",
        text: "Built-in flash storage extends your Mac’s working memory.",
        icon: ICONS.flash,
        tone: "orange",
        hotspots: [{ x: 394, y: 309, width: 50, height: 56 }],
      },
      {
        title: "Schedule Compute",
        text: "Coordinates CPU, GPU and Neural Engine for local AI workloads.",
        icon: ICONS.chip,
        tone: "ai",
        hotspots: [{ x: 765, y: 310, width: 62, height: 62 }],
      },
      {
        title: "Unified Memory",
        text: "Smart memory management fits bigger local models.",
        icon: ICONS.memory,
        tone: "green",
        hotspots: [
          { x: 688, y: 334, width: 41, height: 92 },
          { x: 867, y: 334, width: 41, height: 92 },
        ],
      },
      {
        title: "SSD / Storage",
        text: "Local storage speeds up model loading and inference.",
        icon: ICONS.storage,
        tone: "pink",
        hotspots: [
          { x: 460, y: 390, width: 50, height: 101 },
          { x: 1106, y: 390, width: 41, height: 101 },
        ],
      },
    ] as PowerCard[],
    tags: [
      { title: "Qwen3.6 35B-A3B", text: "23 GB · fits locally", icon: ICONS.chip, at: { x: 0.75, y: 0.15 } },
      { title: "Nothing leaves this Mac", text: "0 B sent", icon: ICONS.lock, at: { x: 0.88, y: 0.57 }, live: true },
      { title: "Private task → Local", text: "on-device", icon: ICONS.bolt, at: { x: 0.75, y: 0.85 } },
    ] as PowerTag[],
    strip: [
      { title: "Plug in", text: "Get started in seconds", icon: ICONS.plug, tone: "green" },
      { title: "Run bigger models", text: "Up to 35B parameters locally", icon: ICONS.cube, tone: "ai" },
      { title: "No precision loss", text: "Full model quality", icon: ICONS.shield, tone: "orange" },
      { title: "No new computer", text: "Works with your existing Mac", icon: ICONS.laptop, tone: "pink" },
    ] as PowerItem[],
  },
  without: {
    cards: [
      { title: "Limited by memory", text: "Bigger models don’t fit in your Mac’s memory.", icon: ICONS.memory },
      { title: "Paying per token", text: "Cloud AI is metered on every prompt.", icon: ICONS.coin },
    ] as PowerCard[],
    tags: [
      { title: "Model won’t fit", text: "memory full", icon: ICONS.memoryFull, at: { x: 0.82, y: 0.14 } },
      { title: "Prompt → Cloud", text: "billed per token", icon: ICONS.cloud, at: { x: 0.87, y: 0.44 } },
    ] as PowerTag[],
    strip: [
      { title: "Memory-bound", text: "Bigger models don’t fit", icon: ICONS.memory },
      { title: "Pay per token", text: "Cloud usage is metered", icon: ICONS.coin },
      { title: "Cloud-first", text: "Prompts leave your Mac", icon: ICONS.cloud },
      { title: "New hardware", text: "More memory, new Mac", icon: ICONS.laptop },
    ] as PowerItem[],
  },
};
