// End of the hero (markup: src/components/ProductViewer.astro): after scene 007's last frame, the "productViewer"
// effect crossfades into the live 3D key, with the standalone viewer's controls. Each time the viewer leaves the screen
// it goes back to its starting state, so scrolling into it always starts fresh. The model (~9 MB with the HDRI) and
// three.js load once the page is idle, and the viewer renders only while it's visible and the stage is on screen.
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
  /** Canvas and controls, faded in only once the black layer fully hides the last frame */
  private readonly content: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly buttons: Record<"spin" | "explode", HTMLButtonElement>;
  private viewer: ProductViewer | null = null;
  private loaded = false;
  /** Whether the viewer is rendering; leaving the screen resets it */
  private active = false;
  /** Crossfade amount from the scroll (0..1) */
  private fade = 0;
  private stageOnScreen = false;

  constructor(
    private readonly root: HTMLElement,
    section: HTMLElement,
  ) {
    this.canvas = root.querySelector<HTMLCanvasElement>("[data-ref=canvas]")!;
    this.content = root.querySelector<HTMLElement>("[data-ref=content]")!;
    this.hint = root.querySelector<HTMLElement>("[data-ref=hint]")!;
    const button = (ref: string) => root.querySelector<HTMLButtonElement>(`[data-ref=${ref}]`)!;
    this.buttons = { spin: button("spin"), explode: button("explode") };
    this.buttons.spin.addEventListener("click", () => this.toggleSpin());
    this.buttons.explode.addEventListener("click", () => this.toggleExplode());
    button("reset").addEventListener("click", () => this.viewer?.resetView());

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
      // Desktop zoom: the canvas starts below the nav, so frame ~9% closer to match the standalone viewer's size
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.build({ maxDpr: 2, turntable: false, zoom: 1.09 }))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.build({ maxDpr: 1.5, turntable: true, zoom: 1 }));
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
      viewer = new ProductViewer(this.canvas, {
        ...options,
        onDragStart: () => {
          this.hint.classList.add("is-gone");
          ProductViewerScene.press(this.buttons.spin, false);
        },
      });
      this.viewer = viewer;
      try {
        await viewer.load();
      } catch (error) {
        console.error("[ProductViewer] model failed to load", error);
        return;
      }
      if (cancelled) return;
      this.loaded = true;
      this.buttons.explode.disabled = !viewer.canExplode;
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

  private toggleSpin(): void {
    if (!this.viewer) return;
    this.viewer.autoRotate = !this.viewer.autoRotate;
    ProductViewerScene.press(this.buttons.spin, this.viewer.autoRotate);
  }

  private toggleExplode(): void {
    const exploded = this.viewer?.toggleExplode() ?? false;
    this.buttons.explode.textContent = exploded ? "Assemble" : "Explode";
    ProductViewerScene.press(this.buttons.explode, exploded);
    // Exploding stops the rotation so the parts hold still
    if (exploded) ProductViewerScene.press(this.buttons.spin, false);
  }

  /** Viewer and controls back to their starting state */
  private resetAll(): void {
    this.viewer?.resetAll();
    ProductViewerScene.press(this.buttons.spin, true);
    ProductViewerScene.press(this.buttons.explode, false);
    this.buttons.explode.textContent = "Explode";
    this.hint.classList.remove("is-gone");
  }

  private static press(button: HTMLButtonElement, on: boolean): void {
    button.setAttribute("aria-pressed", String(on));
  }

  private setFade(fade: number): void {
    if (fade === this.fade) return;
    this.fade = fade;
    this.update();
  }

  /**
   * Show the viewer once loaded and scrolled to, in two steps so the last frame and the model are never on screen
   * together: the first half of the fade covers the frame with black, the second fades the model in on the black.
   * Interactive only when fully in.
   */
  private update(): void {
    const fade = this.loaded ? this.fade : 0;
    const cover = Math.min(1, fade * 2);
    const model = Math.max(0, fade * 2 - 1);
    this.root.style.opacity = String(cover);
    this.content.style.opacity = String(model);
    this.root.classList.toggle("is-live", model === 1);
    this.root.inert = model < 1;
    const active = this.loaded && model > 0 && this.stageOnScreen;
    // Scrolled out (back to the frames, or on down the page): start fresh next time
    if (this.active && !active) this.resetAll();
    this.active = active;
    this.viewer?.setActive(active);
  }
}
