// "Show all models" toggle of the compatibility table (src/components/SoftwareCompatibility.astro): rows past the
// visible count render with `hidden`; the button reveals or hides them again.

export class CompatibilityTable {
  private expanded = false;
  private readonly button: HTMLButtonElement;
  private readonly extraRows: HTMLElement[];

  constructor(root: HTMLElement) {
    this.button = root.querySelector<HTMLButtonElement>("[data-ref=show-all]")!;
    this.extraRows = [...root.querySelectorAll<HTMLElement>("[data-extra]")];
    this.button.addEventListener("click", () => this.toggle());
  }

  /** Flip between the short list and every model */
  private toggle(): void {
    this.expanded = !this.expanded;
    this.extraRows.forEach((row) => (row.hidden = !this.expanded));
    this.button.setAttribute("aria-expanded", String(this.expanded));
    this.button.querySelector("[data-ref=label]")!.textContent = this.expanded ? "Show fewer models" : "Show all models";
  }
}
