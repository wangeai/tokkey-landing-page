// Words of the "You've been renting intelligence." statement (src/components/RentingStatement.astro), Figma 900:1933.
// Each word animates on its own, so the second line's chrome gradient is split per word: `from` / `to` are the
// gradient's colours under that word, sampled from the Figma render.

export const STATEMENT_LINE_1 = ["You've", "been", "renting", "intelligence"];

export const STATEMENT_LINE_2 = [
  { word: "What", from: "#cee2ff", to: "#b8d5ff" },
  { word: "if", from: "#b1d1ff", to: "#aed0ff" },
  { word: "you", from: "#a4caff", to: "#91c1ff" },
  { word: "could", from: "#9bc6ff", to: "#cee3ff" },
  { word: "own", from: "#dfedff", to: "#f4f8ff", glow: true },
  { word: "it?", from: "#f8fbff", to: "#ffffff", glow: true },
];
