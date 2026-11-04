// Horizontal snap carousel: native overflow scrolling plus prev/next buttons and mouse drag (touch uses native swipe).
export class CardCarousel {
  private readonly slides: HTMLElement[];
  /** Pointer x and scroll position when a mouse drag started; null when not dragging */
  private drag: { x: number; scrollLeft: number } | null = null;

  constructor(
    private readonly track: HTMLElement,
    private readonly prev: HTMLButtonElement,
    private readonly next: HTMLButtonElement,
    /** Drags that start on elements matching this selector are left to them (e.g. clickable thumbnails) */
    private readonly noDragSelector = "button",
  ) {
    this.slides = [...track.children] as HTMLElement[];
    prev.addEventListener("click", () => this.goTo(this.index() - 1));
    next.addEventListener("click", () => this.goTo(this.index() + 1));
    track.addEventListener("scroll", () => this.updateButtons(), { passive: true });
    window.addEventListener("resize", () => this.updateButtons());
    track.addEventListener("pointerdown", (event) => this.startDrag(event));
    window.addEventListener("pointermove", (event) => this.moveDrag(event));
    window.addEventListener("pointerup", () => this.endDrag());
    this.updateButtons();
  }

  /** Distance between two slides' left edges */
  private step(): number {
    return this.slides.length > 1 ? this.slides[1].offsetLeft - this.slides[0].offsetLeft : this.track.clientWidth;
  }

  /** Slide closest to the current scroll position */
  private index(): number {
    return Math.round(this.track.scrollLeft / this.step());
  }

  goTo(index: number): void {
    const clamped = Math.max(0, Math.min(this.slides.length - 1, index));
    this.track.scrollTo({ left: clamped * this.step(), behavior: "smooth" });
  }

  private updateButtons(): void {
    const max = (this.slides.length - 1) * this.step();
    this.prev.disabled = this.track.scrollLeft < 4;
    this.next.disabled = this.track.scrollLeft > max - 4;
  }

  private startDrag(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || (event.target as Element).closest(this.noDragSelector)) return;
    this.drag = { x: event.clientX, scrollLeft: this.track.scrollLeft };
    this.track.dataset.dragging = "";
  }

  private moveDrag(event: PointerEvent): void {
    if (this.drag) this.track.scrollLeft = this.drag.scrollLeft - (event.clientX - this.drag.x);
  }

  /** Release: settle on the nearest slide */
  private endDrag(): void {
    if (!this.drag) return;
    this.drag = null;
    delete this.track.dataset.dragging;
    this.goTo(this.index());
  }
}
