// Fixed header that shares the hero's background: transparent while the hero is behind it, solid black (`.is-solid`)
// once the hero has scrolled out from under it, so the links stay readable over the light sections below. Sections marked
// `[data-nav-light]` turn it into the frosted paper bar (`.is-light`) while they sit under it.
import { ScrollTrigger } from "./gsap";

export class NavBackdrop {
  constructor(private readonly nav: HTMLElement, hero: HTMLElement) {
    document.querySelectorAll<HTMLElement>("[data-nav-light]").forEach((section) => this.watchLight(section));

    ScrollTrigger.create({
      trigger: hero,
      // Starts before scroll 0 so the very top counts as active (at exactly its start a trigger is inactive)
      start: "top bottom",
      // Hero bottom passes the header's bottom edge
      end: () => `bottom top+=${nav.offsetHeight}`,
      onToggle: ({ isActive }) => this.setSolid(!isActive),
      // isActive is only known after a refresh, e.g. for a page opened already scrolled past the hero
      onRefresh: ({ isActive }) => this.setSolid(!isActive),
    });
  }

  /** `.is-light` while `section` covers the header's bottom edge */
  private watchLight(section: HTMLElement): void {
    const edge = () => `top+=${this.nav.offsetHeight}`;
    ScrollTrigger.create({
      trigger: section,
      start: () => `top ${edge()}`,
      end: () => `bottom ${edge()}`,
      onToggle: ({ isActive }) => this.nav.classList.toggle("is-light", isActive),
      // isActive isn't set yet during a refresh, so derive it from the scroll position
      onRefresh: (self) => this.nav.classList.toggle("is-light", self.scroll() >= self.start && self.scroll() <= self.end),
    });
  }

  private setSolid(solid: boolean): void {
    this.nav.classList.toggle("is-solid", solid);
  }
}
