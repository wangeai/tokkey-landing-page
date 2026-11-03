// Content of the features section (src/components/Features.astro): the tab list on the left and the data in each panel.

export interface Feature {
  title: string;
  text: string;
  /** Headline shown at the top of the panel */
  caption: string;
  /** Show the PRO badge after the title */
  pro?: boolean;
}

/** Tabs in display order; tab i shows panel i */
export const FEATURES: Feature[] = [
  {
    title: "Run large AI models",
    text: "Large models need only a fraction of your Mac's memory with Tokkey.",
    caption: "Large models. A fraction of the memory.",
  },
  {
    title: "Light guidance",
    text: "The key's light shows what your agent is doing, without opening a window.",
    caption: "The light tells you what is happening.",
  },
  {
    title: "Lid closed",
    text: "Close the Mac. A compatible local task keeps working in the background.",
    caption: "Close the lid. It keeps going.",
  },
  {
    title: "Private memory",
    text: "Memory that belongs to you, kept on the key and never uploaded.",
    caption: "Memory that stays on the key.",
    pro: true,
  },
];

/** Panel 1, first slide: memory a model needs with and without Tokkey */
export interface ModelFootprint {
  params: string;
  name: string;
  withTokkey: string;
  without: string;
}

export const MODEL_FOOTPRINTS: ModelFootprint[] = [
  { params: "35B parameters", name: "Qwen3.6 35B-A3B", withTokkey: "~5 GB", without: "~23 GB" },
  { params: "70B parameters", name: "Llama 3.3 70B", withTokkey: "~10 GB", without: "~46 GB" },
  { params: "120B parameters", name: "gpt-oss 120B", withTokkey: "~17 GB", without: "~79 GB" },
];

/** Panel 1, second slide: caption above the game demo */
export const GAME_DEMO_CAPTION = "Game demo: Build with Tokkey.";

/** Panel 4: what the private memory holds */
export const MEMORY_ROWS: { label: string; value: string }[] = [
  { label: "Projects", value: "38 notes" },
  { label: "Preferences", value: "Writing style" },
  { label: "People", value: "24 contacts" },
];
