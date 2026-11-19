// Mobile (≤ 900px) nav menu: the toggle button opens / closes the link panel under the header. Closes again on a link
// tap, Escape, or when the viewport grows past the breakpoint (the desktop links take over there).
export class NavMenu {
  private readonly toggle: HTMLButtonElement;
  private readonly panel: HTMLElement;

  constructor(private readonly nav: HTMLElement) {
    this.toggle = nav.querySelector<HTMLButtonElement>('[data-ref="menu-toggle"]')!;
    this.panel = nav.querySelector<HTMLElement>('[data-ref="menu-panel"]')!;

    this.toggle.addEventListener("click", () => this.setOpen(!this.isOpen()));
    this.panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => this.setOpen(false)));
    document.addEventListener("keydown", (event) => event.key === "Escape" && this.setOpen(false));
    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => event.matches && this.setOpen(false));
  }

  private isOpen(): boolean {
    return this.toggle.getAttribute("aria-expanded") === "true";
  }

  private setOpen(open: boolean): void {
    this.toggle.setAttribute("aria-expanded", String(open));
    this.panel.hidden = !open;
    this.nav.classList.toggle("is-menu-open", open);
  }
}
