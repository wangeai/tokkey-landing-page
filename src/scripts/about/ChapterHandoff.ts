// Scroll-driven handoffs between the layers of each About chapter, plus the bottom-left chapter index:
//  1. as a mask rises, the color hero under it blurs and dims
//  2. once the mask covers the screen, color swaps to charcoal; its dissolving lower edge reveals the charcoal blurred,
//     sharpening as it leaves
//  3. the next chapter's hero rises with a feathered top edge, blurred at first, while the outgoing charcoal blurs and
//     darkens underneath it
import { ScrollEngine } from "../ScrollEngine";
import { AboutMath } from "./PointerTracker";

interface Chapter {
  scene: HTMLElement;
  mask: HTMLElement;
  /** Color layer: the tilting stage (chapter 1) or the painting */
  color: HTMLElement;
  charcoal: HTMLElement;
  veil: HTMLElement;
}

export class ChapterHandoff {
  private readonly chapters: Chapter[];
  private readonly heroText: HTMLElement[];
  private readonly links: HTMLAnchorElement[];
  private readonly targets: HTMLElement[];
  /** Last written style per element, so unchanged values aren't re-set every frame */
  private readonly written = new WeakMap<HTMLElement, Record<string, string>>();

  constructor(
    private readonly root: HTMLElement,
    private readonly index: HTMLElement,
  ) {
    this.chapters = [...root.querySelectorAll<HTMLElement>(".chapter")].map((c) => {
      const scene = c.querySelector<HTMLElement>(".scene")!;
      return {
        scene,
        mask: c.querySelector<HTMLElement>(".mask")!,
        color: scene.querySelector<HTMLElement>(".stage") ?? scene.querySelector<HTMLElement>(".color")!,
        charcoal: scene.querySelector<HTMLElement>(".charcoal")!,
        veil: scene.querySelector<HTMLElement>(".veil")!,
      };
    });
    this.heroText = [...root.querySelectorAll<HTMLElement>(".copy .headline, .copy .foot")];
    this.links = [...index.querySelectorAll<HTMLAnchorElement>("a")];
    this.targets = this.links.map((a) => root.querySelector<HTMLElement>(a.getAttribute("href")!)!);

    // Smooth-scroll index jumps through Lenis
    this.links.forEach((a, i) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        ScrollEngine.instance.scrollTo(this.targets[i]);
      }),
    );
  }

  private set(el: HTMLElement, prop: "filter" | "maskImage" | "opacity", value: string): void {
    const last = this.written.get(el) ?? {};
    if (last[prop] === value) return;
    last[prop] = value;
    this.written.set(el, last);
    el.style[prop] = value;
  }

  /** One frame */
  render(): void {
    const vh = innerHeight;
    this.updateIndex(vh);
    const enter = this.chapters.map((o) => AboutMath.clamp01(o.scene.getBoundingClientRect().top / vh));

    this.chapters.forEach((o, i) => {
      const m = o.mask.getBoundingClientRect();
      // 1. color hero under the rising mask; incoming hero blurred while still rising
      const p = AboutMath.clamp01((vh - m.top) / vh);
      const e = enter[i];
      const cBlur = Math.max(p * 9, e * 10);
      const cDim = 1 - p * 0.28 - e * 0.15;
      this.set(o.color, "filter", cBlur > 0.05 ? `blur(${cBlur.toFixed(1)}px) brightness(${cDim.toFixed(3)})` : "");
      // 3a. feathered top edge on an incoming scene
      const feather =
        e > 0.001
          ? `linear-gradient(to bottom, transparent 0, rgba(0,0,0,.55) ${(e * 18).toFixed(1)}vh, #000 ${(e * 42).toFixed(1)}vh)`
          : "none";
      this.set(o.scene, "maskImage", feather);

      // 2. swap to charcoal while the mask fully covers the screen
      const covered = m.top <= 0 ? 1 : 0;
      this.set(o.charcoal, "opacity", String(covered));
      this.set(o.veil, "opacity", String(covered * 0.9));
      // charcoal sharpens as the dissolving edge clears it
      const q = AboutMath.clamp01((vh - m.bottom) / (vh * 0.55));
      // 3c. outgoing charcoal blurs and darkens while the next hero covers it
      const nx = enter[i + 1];
      const leave = nx !== undefined && nx > 0 && nx < 1 ? 1 - nx : nx === 0 ? 1 : 0;
      const kBlur = Math.max(m.top <= 0 ? (1 - q) * 12 : 0, leave * 8);
      const kDim = 0.92 - leave * 0.35;
      this.set(
        o.charcoal,
        "filter",
        `contrast(1.05) brightness(${kDim.toFixed(3)})` + (kBlur > 0.05 ? ` blur(${kBlur.toFixed(1)}px)` : ""),
      );
    });
  }

  /** Highlight the current chapter; step the index back while hero text passes its corner or the site footer is up */
  private updateIndex(vh: number): void {
    const ir = this.index.getBoundingClientRect();
    const hit = this.heroText.some((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > ir.top && r.top < ir.bottom && r.left < ir.right;
    });
    const pastPage = this.root.getBoundingClientRect().bottom < vh;
    this.set(this.index, "opacity", hit || pastPage ? "0" : "");

    let cur = this.targets[0];
    for (const el of this.targets) if (el.getBoundingClientRect().top < vh * 0.45) cur = el;
    this.links.forEach((a, i) => a.classList.toggle("on", this.targets[i] === cur));
  }
}
