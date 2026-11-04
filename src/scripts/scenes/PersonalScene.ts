// "Personal intelligence" section: the photo and the text column fade up as they scroll into view.
// Markup: src/components/Personal.astro.
import { ScrollReveal } from "../ScrollReveal";

export class PersonalScene {
  constructor(section: HTMLElement) {
    ScrollReveal.section(section);
  }
}
