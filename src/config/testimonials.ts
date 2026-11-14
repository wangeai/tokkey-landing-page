// Content of the homepage "Real people. Local AI." section (src/components/Testimonials.astro). Figma: 24_carousel_5
// (1161:192). Quotes are illustrative example profiles; `lines` are the designed line breaks (desktop only).

export interface Testimonial {
  /** Two-letter avatar initials */
  initials: string;
  role: string;
  lines: string[];
}

/** In grid order: row 1 then row 2 of the 3-column desktop layout */
export const TESTIMONIALS: Testimonial[] = [
  { initials: "RE", role: "Researcher", lines: ["“My prompts. My files.", "My machine. That’s how", "I want to work.”"] },
  { initials: "DE", role: "Independent developer", lines: ["“My work lives on", "my Mac. My AI", "should, too.”"] },
  { initials: "FO", role: "Independent founder", lines: ["“Let the everyday work", "stay local. I’ll choose", "when to use the cloud.”"] },
  { initials: "CR", role: "Creative technologist", lines: ["“A bigger model shouldn’t", "mean buying a new Mac.”"] },
  { initials: "PB", role: "Product builder", lines: ["“Less setup. More making.", "That’s what I want from", "local AI.”"] },
  { initials: "AI", role: "AI enthusiast", lines: ["“One place for my models.", "One less step before I", "start building.”"] },
];
