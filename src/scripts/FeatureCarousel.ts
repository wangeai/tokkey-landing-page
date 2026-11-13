// Autoplaying card carousel (prototype `#c5`): the active card sits in place, neighbours slide one step aside and dim,
// a spring eases between slides. Autoplay advances every `slideMs` and fills the active pager pill as it runs; it pauses
// while the carousel is less than half on screen, while dragging and while the tab is hidden, and loops at the end.
// Drag / swipe, horizontal wheel, arrow keys (when focused), pager dots and a play / pause button also drive it.
import { gsap } from "./gsap";

export class FeatureCarousel {
  /** Spring: fraction of the gap left after one second (smaller = snappier) */
  private static readonly SPRING = 0.0006;
  /** Neighbour opacity one step away; cards further out fade to 0 */
  private static readonly NEIGHBOUR_OPACITY = 0.38;
  /** Pointer travel (px) before a press counts as a drag rather than a click */
  private static readonly DRAG_SLOP = 6;
  /** Horizontal wheel travel (px) that flips one slide, and the pause before the next flip (ms) */
  private static readonly WHEEL_STEP = 36;
  private static readonly WHEEL_COOLDOWN = 420;

  private readonly track: HTMLElement;
  private readonly cards: HTMLElement[];
  private readonly dots: HTMLButtonElement[];
  private readonly fills: HTMLElement[];
  private readonly toggle: HTMLButtonElement;
  /** Target slide */
  private current = 0;
  /** Where the strip is (slides; fractional while moving) */
  private position = 0;
  /** Autoplay progress through the current slide (0..1) */
  private progress = 0;
  private playing = true;
  private inView = false;
  private reducedMotion = false;
  private drag: { pointerId: number; startX: number; startPosition: number; moved: number; velocity: number; lastX: number; lastTime: number } | null = null;
  private wheel = { sum: 0, last: 0 };
  private readonly tick = () => this.update(gsap.ticker.deltaRatio() / 60);

  constructor(
    private readonly root: HTMLElement,
    private readonly slideMs: number,
  ) {
    this.track = root.querySelector<HTMLElement>("[data-ref=track]")!;
    this.cards = [...root.querySelectorAll<HTMLElement>("[data-ref=card]")];
    this.dots = [...root.querySelectorAll<HTMLButtonElement>("[data-ref=dot]")];
    this.fills = this.dots.map((dot) => dot.querySelector<HTMLElement>("i")!);
    this.toggle = root.querySelector<HTMLButtonElement>("[data-ref=toggle]")!;

    this.bindInput();
    // Reduced motion: no autoplay, slides jump instead of sliding
    gsap.matchMedia().add({ reduce: "(prefers-reduced-motion: reduce)" }, (context) => {
      this.reducedMotion = Boolean(context.conditions?.reduce);
      this.setPlaying(!this.reducedMotion);
    });
    new IntersectionObserver(([entry]) => (this.inView = entry.isIntersecting), { threshold: 0.5 }).observe(root);
    this.draw();
    gsap.ticker.add(this.tick);
  }

  /** Go to slide `index` (clamped) and restart its autoplay timer */
  go(index: number): void {
    this.current = gsap.utils.clamp(0, this.cards.length - 1, index);
    this.progress = 0;
    if (this.reducedMotion) this.position = this.current;
  }

  private setPlaying(playing: boolean): void {
    this.playing = playing;
    this.toggle.dataset.paused = String(!playing);
    this.toggle.setAttribute("aria-label", playing ? "Pause autoplay" : "Play autoplay");
  }

  /** Distance between two slides (px): card width plus the track's column gap */
  private step(): number {
    return this.cards[0].offsetWidth + parseFloat(getComputedStyle(this.track).columnGap || "0");
  }

  /** Advance autoplay and the spring by `dt` seconds, then draw */
  private update(dt: number): void {
    if (this.playing && this.inView && !this.drag && !document.hidden) {
      this.progress += (dt * 1000) / this.slideMs;
      if (this.progress >= 1) this.go(this.current >= this.cards.length - 1 ? 0 : this.current + 1);
    }
    if (!this.drag) {
      this.position += (this.current - this.position) * (1 - Math.pow(FeatureCarousel.SPRING, dt));
      if (Math.abs(this.current - this.position) < 0.0006) this.position = this.current;
    }
    this.draw();
  }

  /** Place, dim and stack every card around `position`; update the pager */
  private draw(): void {
    const step = this.step();
    this.cards.forEach((card, i) => {
      const offset = i - this.position;
      const distance = Math.abs(offset);
      const near = FeatureCarousel.NEIGHBOUR_OPACITY;
      const opacity = distance <= 1 ? 1 - (1 - near) * distance : Math.max(0, near - near * (distance - 1));
      card.style.transform = `translate3d(${(offset * step).toFixed(1)}px,0,0)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(20 - Math.round(distance * 3));
      card.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
      card.setAttribute("aria-hidden", String(distance > 0.5));
    });
    this.dots.forEach((dot, i) => {
      const active = i === this.current;
      dot.dataset.active = String(active);
      dot.setAttribute("aria-current", String(active));
      this.fills[i].style.transform = `scaleX(${active ? (this.playing ? Math.min(1, this.progress) : 1) : 0})`;
    });
  }

  private bindInput(): void {
    this.dots.forEach((dot, i) => dot.addEventListener("click", () => this.go(i)));
    this.toggle.addEventListener("click", () => this.setPlaying(!this.playing));

    // Drag / swipe the strip; a press without movement on a side card selects it
    this.track.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      this.drag = { pointerId: e.pointerId, startX: e.clientX, startPosition: this.position, moved: 0, velocity: 0, lastX: e.clientX, lastTime: performance.now() };
    });
    window.addEventListener("pointermove", (e) => this.onDrag(e));
    window.addEventListener("pointerup", (e) => this.onRelease(e));
    window.addEventListener("pointercancel", (e) => this.onRelease(e));

    // Horizontal wheel / trackpad swipe flips one slide at a time; vertical scrolling passes through
    this.root.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        const now = performance.now();
        if (now - this.wheel.last < FeatureCarousel.WHEEL_COOLDOWN) return;
        this.wheel.sum += e.deltaX;
        if (Math.abs(this.wheel.sum) > FeatureCarousel.WHEEL_STEP) {
          this.go(this.current + Math.sign(this.wheel.sum));
          this.wheel = { sum: 0, last: now };
        }
      },
      { passive: false },
    );

    this.root.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      this.go(this.current + (e.key === "ArrowRight" ? 1 : -1));
    });
  }

  private onDrag(e: PointerEvent): void {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved > FeatureCarousel.DRAG_SLOP) {
      this.root.dataset.dragging = "true";
      this.track.setPointerCapture(drag.pointerId);
    }
    // Rubber-band a little past either end
    this.position = gsap.utils.clamp(-0.35, this.cards.length - 1 + 0.35, drag.startPosition - dx / this.step());
    const now = performance.now();
    drag.velocity = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastTime);
    drag.lastX = e.clientX;
    drag.lastTime = now;
  }

  /** Settle on the nearest slide, nudged one step by a fast flick */
  private onRelease(e: PointerEvent): void {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.drag = null;
    delete this.root.dataset.dragging;
    if (drag.moved <= FeatureCarousel.DRAG_SLOP) {
      const card = (e.target as Element).closest<HTMLElement>("[data-ref=card]");
      const index = card ? this.cards.indexOf(card) : -1;
      if (index >= 0 && index !== this.current) this.go(index);
      return;
    }
    let target = Math.round(gsap.utils.clamp(0, this.cards.length - 1, this.position - (drag.velocity * 160) / this.step()));
    if (Math.abs(target - this.current) > 1) target = this.current + Math.sign(target - this.current);
    this.go(target);
  }
}
