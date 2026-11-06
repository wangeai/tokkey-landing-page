// Fixed header that shares the hero's background: transparent while the hero is behind it, solid black (`.is-solid`)
// once the hero has scrolled out from under it, so the links stay readable over the light sections below.
import { ScrollTrigger } from "./gsap";

export class NavBackdrop {
  constructor(private readonly nav: HTMLElement, hero: HTMLElement) {
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

  private setSolid(solid: boolean): void {
    this.nav.classList.toggle("is-solid", solid);
  }
}
