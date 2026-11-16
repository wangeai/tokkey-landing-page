// End of the hero (markup: src/components/ProductViewer.astro): after scene 007's last frame, the "productViewer"
// effect crossfades into the live 3D key, which can be dragged to orbit and exploded. The model (~9 MB with the HDRI)
// and three.js load once the page is idle, and the viewer renders only while it's visible and the stage is on screen.
import { gsap } from "../gsap";
import type { ProductViewer, ViewerOptions } from "../ProductViewer";
import { FrameStageScene, type StageEffect } from "./FrameStageScene";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";

export class ProductViewerScene {
  /** Effect segment in TIMELINE that drives the crossfade */
  private static readonly EFFECT_ID = "productViewer";
  /** Share of the effect spent fading in; the rest holds the viewer before the stage unpins */
  private static readonly FADE_SHARE = 0.4;

  private readonly canvas: HTMLCanvasElement;
  private readonly explodeButton: HTMLButtonElement;
  private readonly hint: HTMLElement;
  private viewer: ProductViewer | null = null;
  private loaded = false;
  /** Crossfade amount from the scroll (0..1) */
  private fade = 0;
  private stageOnScreen = false;

  constructor(
    private readonly root: HTMLElement,
    section: HTMLElement,
  ) {
    this.canvas = root.querySelector<HTMLCanvasElement>("[data-ref=canvas]")!;
    this.explodeButton = root.querySelector<HTMLButtonElement>("[data-ref=explode]")!;
    this.hint = root.querySelector<HTMLElement>("[data-ref=hint]")!;
    root.querySelector("[data-ref=reset]")!.addEventListener("click", () => this.viewer?.reset());
    this.explodeButton.addEventListener("click", () => this.toggleExplode());

    section.addEventListener(FrameStageScene.EFFECT_EVENT, (event) => {
      const { id, progress } = (event as CustomEvent<StageEffect>).detail;
      if (id === ProductViewerScene.EFFECT_ID) this.setFade(Math.min(1, progress / ProductViewerScene.FADE_SHARE));
    });
    // The effect keeps reading 1 after the stage scrolls away: stop rendering then
    new IntersectionObserver(([entry]) => {
      this.stageOnScreen = entry.isIntersecting;
      this.update();
    }).observe(section);

    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.build({ maxDpr: 2, turntable: false }))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.build({ maxDpr: 1.5, turntable: true }));
  }

  /** Create the viewer for one breakpoint once the page is idle; returns its cleanup for matchMedia */
  private build(options: Omit<ViewerOptions, "onDragStart">): () => void {
    let viewer: ProductViewer | null = null;
    let cancelled = false;
    this.loaded = false;
    const start = async () => {
      // three.js is split out of the page bundle so it never delays the hero
      const { ProductViewer } = await import("../ProductViewer");
      if (cancelled) return;
      viewer = new ProductViewer(this.canvas, { ...options, onDragStart: () => this.hint.classList.add("is-gone") });
      this.viewer = viewer;
      try {
        await viewer.load();
      } catch (error) {
        console.error("[ProductViewer] model failed to load", error);
        return;
      }
      if (cancelled) return;
      this.loaded = true;
      this.explodeButton.disabled = !viewer.canExplode;
      this.update();
    };
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    if (document.readyState === "complete") idle(start);
    else window.addEventListener("load", () => idle(start), { once: true });
    return () => {
      cancelled = true;
      viewer?.destroy();
      if (this.viewer === viewer) this.viewer = null;
    };
  }

  private toggleExplode(): void {
    const exploded = this.viewer?.toggleExplode() ?? false;
    this.explodeButton.textContent = exploded ? "Assemble" : "Explode";
    this.explodeButton.setAttribute("aria-pressed", String(exploded));
  }

  private setFade(fade: number): void {
    if (fade === this.fade) return;
    this.fade = fade;
    this.update();
  }

  /** Show the viewer once loaded and scrolled to; interactive only when fully in */
  private update(): void {
    const shown = this.loaded ? this.fade : 0;
    this.root.style.opacity = String(shown);
    this.root.classList.toggle("is-live", shown === 1);
    this.root.inert = shown < 1;
    this.viewer?.setActive(this.loaded && shown > 0 && this.stageOnScreen);
  }
}
