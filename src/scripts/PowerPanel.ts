// Scene "powerFlow" overlay (src/components/PowerPanel.astro): places the hotspots, chips and card columns on the
// laptop internals, cycles the highlighted "With Tokkey" card (hover picks one) and draws the elbow lines from each
// card to its hotspots.
import { POWER_LAPTOP_IN_FRAME } from "../config/power";

type Point = { x: number; y: number };

export class PowerPanel {
  /** Seconds each card stays highlighted while nothing is hovered */
  private static readonly CYCLE = 2.6;
  /** Minimum px between stacked chips, and between the lowest chip and the strip */
  private static readonly TAG_GAP = 16;
  private readonly cards: HTMLElement[];
  private readonly groups: HTMLElement[];
  private readonly paths: SVGPathElement[];
  private readonly ends: SVGCircleElement[];
  private hovered = -1;

  constructor(private readonly root: HTMLElement) {
    this.cards = [...root.querySelectorAll<HTMLElement>("[data-power-card]")];
    this.groups = [...root.querySelectorAll<HTMLElement>("[data-hotspot-group]")];
    this.paths = [...root.querySelectorAll<SVGPathElement>("[data-power-lines] path")];
    this.ends = [...root.querySelectorAll<SVGCircleElement>("[data-power-lines] circle")];
    this.cards.forEach((card, i) => {
      card.addEventListener("mouseenter", () => (this.hovered = i));
      card.addEventListener("mouseleave", () => (this.hovered = -1));
    });
  }

  /** Position everything for the current viewport; `toViewport` maps 1600×900 frame px to viewport px */
  layout(toViewport: (x: number, y: number) => Point): void {
    const rect = (x: number, y: number, width: number, height: number) => {
      const a = toViewport(x, y);
      const b = toViewport(x + width, y + height);
      return { left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y };
    };
    const place = (el: HTMLElement, box: Partial<Record<"left" | "top" | "width" | "height", number>>) =>
      Object.entries(box).forEach(([key, value]) => el.style.setProperty(key, `${value}px`));

    const L = POWER_LAPTOP_IN_FRAME;
    const laptop = rect(L.x, L.y, L.width, L.height);
    this.root.querySelectorAll<HTMLElement>("[data-hotspot]").forEach((el) => {
      const [x, y, width, height] = el.dataset.hotspot!.split(",").map(Number);
      place(el, rect(x, y, width, height));
    });
    // Chips: placed beside the laptop, then (per mode) pushed up bottom-first so none runs into the strip or the chip below
    const stripTop = this.root.querySelector<HTMLElement>("[data-ref=powerStrip]")!.offsetTop;
    this.root.querySelectorAll<HTMLElement>("[data-power-tags]").forEach((group) => {
      const tags = [...group.querySelectorAll<HTMLElement>("[data-power-tag]")].map((el) => {
        const [x, y] = el.dataset.powerTag!.split(",").map(Number);
        return { el, left: laptop.left + x * laptop.width, top: laptop.top + y * laptop.height };
      });
      let limit = stripTop - PowerPanel.TAG_GAP;
      tags
        .sort((a, b) => b.top - a.top)
        .forEach((tag) => {
          tag.top = Math.min(tag.top, limit - tag.el.offsetHeight);
          limit = tag.top - PowerPanel.TAG_GAP;
          place(tag.el, { left: tag.left, top: tag.top });
        });
    });
    // Card columns start level with the top of the laptop
    this.root.querySelectorAll<HTMLElement>("[data-power-cards]").forEach((el) => place(el, { top: laptop.top }));
  }

  /** Highlight the hovered card (or the next one every CYCLE seconds) and redraw the lines; call every frame while shown */
  tick(time: number): void {
    const active = this.hovered >= 0 ? this.hovered : Math.floor(time / PowerPanel.CYCLE) % this.cards.length;
    const origin = this.root.getBoundingClientRect();
    this.cards.forEach((card, i) => {
      const on = i === active;
      card.classList.toggle("is-active", on);
      this.groups[i].classList.toggle("is-active", on);

      // Elbow: right of the card title → across → down/up to the first hotspot's middle → into its left edge
      const c = card.getBoundingClientRect();
      const h = this.groups[i].firstElementChild!.getBoundingClientRect();
      const x0 = c.right - origin.left + 8;
      const y0 = c.top - origin.top + 12;
      const x1 = h.left - origin.left;
      const y1 = h.top - origin.top + h.height / 2;
      const xm = Math.min(x0 + 24 + i * 12, x1 - 16);
      this.paths[i].setAttribute("d", `M${x0} ${y0}H${xm}V${y1}H${x1}`);
      this.paths[i].classList.toggle("is-active", on);
      this.ends[i].setAttribute("cx", String(x1));
      this.ends[i].setAttribute("cy", String(y1));
      this.ends[i].classList.toggle("is-active", on);
    });
  }
}
