// Content of the user comments section (src/components/Comments.astro). Quotes and profiles are illustrative,
// pending replacement with approved user feedback.

export interface Comment {
  /** Two-letter avatar placeholder */
  initials: string;
  role: string;
  /** "\n" marks the designed line breaks (desktop only; smaller screens wrap freely) */
  quote: string;
  /** The larger, darker card in the middle column */
  featured?: boolean;
}

/** Desktop columns, left to right; each column lists its cards top to bottom */
export const COMMENT_COLUMNS: Comment[][] = [
  [
    { initials: "RE", role: "Researcher", quote: "“My prompts. My files.\nMy machine. That’s how\nI want to work.”" },
    { initials: "CR", role: "Creative technologist", quote: "“A bigger model shouldn’t\nmean buying a new Mac.”" },
  ],
  [
    { initials: "DE", role: "Independent developer", quote: "“My work lives\non my Mac.\nMy AI should, too.”", featured: true },
    { initials: "PB", role: "Product builder", quote: "“Less setup. More making.\nThat’s what I want from\nlocal AI.”" },
  ],
  [
    { initials: "FO", role: "Independent founder", quote: "“Let the everyday work\nstay local. I’ll choose\nwhen to use the cloud.”" },
    { initials: "AI", role: "AI enthusiast", quote: "“One place for my models.\nOne less thing between\nan idea and getting started.”" },
  ],
];

/** Top offset of each desktop column (Figma px, scaled by --fx), staggering the wall */
export const COLUMN_OFFSETS = [40, 0, 64];
