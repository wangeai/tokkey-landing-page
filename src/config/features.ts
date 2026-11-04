// Content of the features carousel (src/components/Features.astro): the caption under each card and the data inside them.

/** Caption under a card: `lead` is shown in white, `text` follows in grey */
export interface SlideCaption {
  lead: string;
  text: string;
}

/** Captions in card order: models, game demo, light ring, lid closed, private memory */
export const SLIDE_CAPTIONS: SlideCaption[] = [
  {
    lead: "Large models, a fraction of the memory.",
    text: "Qwen3.6 35B needs about 5 GB with Tokkey instead of 23 GB, so bigger models fit the Mac you already have.",
  },
  { lead: "Build with Tokkey.", text: "Games like 3D Open World run on a local model, with no tokens leaving your Mac." },
  { lead: "The light shows what is happening.", text: "See what your agent is doing from the key itself, without opening a window." },
  { lead: "Close the lid.", text: "A compatible local task keeps working in the background." },
  { lead: "Memory that stays on the key.", text: "Kept on the key and never uploaded." },
];

/** Card 1: memory a model needs with and without Tokkey */
export interface ModelFootprint {
  params: string;
  name: string;
  /** 24px icon tile in public/assets/icons/models */
  icon: string;
  withTokkey: string;
  without: string;
  /** Top color of the figure's vertical gradient (fades to white) */
  tint: string;
}

export const MODEL_FOOTPRINTS: ModelFootprint[] = [
  { params: "35B parameters", name: "Qwen3.6 35B-A3B", icon: "qwen", withTokkey: "~5 GB", without: "~23 GB", tint: "#8fb8ff" },
  { params: "70B parameters", name: "Llama 3.3 70B", icon: "llama", withTokkey: "~10 GB", without: "~46 GB", tint: "#9db4d6" },
  { params: "120B parameters", name: "gpt-oss 120B", icon: "gpt-oss", withTokkey: "~17 GB", without: "~79 GB", tint: "#9aa6c4" },
];

/** Card 2: how many games get a thumbnail (the first N of GAMES in src/config/games.ts) */
export const DEMO_GAME_COUNT = 4;
