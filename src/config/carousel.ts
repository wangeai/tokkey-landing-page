// Content of the homepage "Made for your daily tasks" carousel (src/components/FeatureCarousel.astro).
// Figma: 20_carousel_1 (1157:416) and cards 1169:19 / 1169:28 / 1169:31 / 1169:35.

export interface CarouselSlide {
  /** Image under /public; split cards show it on the right 774px, full cards across the whole card */
  image: string;
  /** Image's natural size (for width / height attributes) */
  width: number;
  height: number;
  /** Bold white start of the caption */
  lead: string;
  /** Dimmed rest of the caption */
  rest: string;
  /** "split": caption left, image right. "full": image fills the card, caption top-left */
  layout: "split" | "full";
  /** Optional glass panel over the image (card 2) */
  panel?: { title: string; chip: string };
}

/** Time each slide stays before autoplay moves on (ms) */
export const CAROUSEL_SLIDE_MS = 4800;

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    image: "/assets/images/carousel/card1.webp",
    width: 1100,
    height: 1057,
    lead: "Large models, a fraction of the memory.",
    rest: "35B in 5 GB, not 23.",
    layout: "split",
  },
  {
    image: "/assets/images/carousel/card2.webp",
    width: 1382,
    height: 1328,
    lead: "Build with Tokkey.",
    rest: "Games on a local model. Zero tokens.",
    layout: "split",
    panel: { title: "3D Open World", chip: "Qwen3.6 35B-A3B · local · 0 tokens" },
  },
  {
    image: "/assets/images/carousel/card3.webp",
    width: 1800,
    height: 892,
    lead: "The light shows what is happening.",
    rest: "See what your agent is doing from the key itself, without opening a window.",
    layout: "full",
  },
  {
    image: "/assets/images/carousel/card4.webp",
    width: 1382,
    height: 1328,
    lead: "Close the lid.",
    rest: "A compatible local task keeps working in the background.",
    layout: "split",
  },
  {
    image: "/assets/images/carousel/card5.webp",
    width: 1382,
    height: 1328,
    lead: "Memory that stays on the key.",
    rest: "Kept on the key and never uploaded.",
    layout: "split",
  },
];
