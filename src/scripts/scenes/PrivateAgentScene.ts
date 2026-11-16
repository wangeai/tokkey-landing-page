// "A private agent on your Mac." (markup: src/components/PrivateAgent.astro), ported from the prototype's `#s3`.
// Runs on the "privateAgent" effect, which holds scene 003's last frame (the laptop from the front): the heading rises
// in above the laptop and the agent UI fades in on its screen, then plays its loop (AgentDialog) while shown. Both
// fade out before scene 004 turns the laptop over. Desktop pins the UI onto the screen in the frame; phones, where the
// contained frame is too small to read, show it as a card under the heading (layout in the component's CSS).
import { gsap } from "../gsap";
import { AgentDialog } from "../AgentDialog";
import { StageOverlay, type Box } from "../StageOverlay";
import { FrameStageScene, type StageEffect } from "./FrameStageScene";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";

export class PrivateAgentScene {
  /** Effect segment in TIMELINE that drives the scene */
  private static readonly EFFECT_ID = "privateAgent";
  /** Laptop screen in scene 003's last frame, as shares of the frame */
  private static readonly SCREEN: Box = { left: 0.2797, top: 0.1111, width: 0.4406, height: 0.5083 };
  /** Width of the UI's design box (px), scaled to the screen */
  private static readonly DESIGN_WIDTH = 1000;
  /** Space between the heading and the laptop, px */
  private static readonly TITLE_GAP = 24;
  private static readonly ease = gsap.parseEase("power3.inOut");

  private readonly title: HTMLElement;
  private readonly screen: HTMLElement;
  private readonly canvas: HTMLElement;
  private readonly dialog: AgentDialog;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  /** Desktop: the UI is pinned onto the laptop screen; phones: it's a card in the flow */
  private onScreen = true;
  private progress = 0;

  constructor(
    private readonly root: HTMLElement,
    section: HTMLElement,
  ) {
    this.title = root.querySelector<HTMLElement>("[data-ref=title]")!;
    this.screen = root.querySelector<HTMLElement>("[data-ref=screen]")!;
    this.canvas = section.querySelector<HTMLElement>("[data-ref=frames]")!;
    this.dialog = new AgentDialog(root.querySelector<HTMLElement>("[data-ref=stage]")!);
    if (this.reducedMotion.matches) this.dialog.showFinal();

    section.addEventListener(FrameStageScene.EFFECT_EVENT, (event) => {
      const { id, progress } = (event as CustomEvent<StageEffect>).detail;
      if (id === PrivateAgentScene.EFFECT_ID) this.render(progress);
    });
    window.addEventListener("resize", () => this.render(this.progress));
    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.useLayout(true))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.useLayout(false));
  }

  private useLayout(onScreen: boolean): () => void {
    this.onScreen = onScreen;
    this.render(this.progress);
    // Leave no desktop placement behind for the phone card
    return () => {
      this.screen.style.removeProperty("transform");
      this.screen.style.removeProperty("height");
      this.title.style.removeProperty("top");
    };
  }

  private render(progress: number): void {
    this.progress = progress;
    const { seg } = StageOverlay;
    const { ease } = PrivateAgentScene;
    const exit = seg(progress, 0.9, 1);
    const title = seg(progress, 0, 0.1) * (1 - exit);
    const ui = seg(progress, 0.04, 0.14) * (1 - exit);
    if (this.onScreen) this.place();
    this.title.style.opacity = String(title);
    this.title.style.translate = `0 ${gsap.utils.interpolate(24, 0, ease(seg(progress, 0, 0.15))) - ease(exit) * 40}px`;
    this.screen.style.opacity = String(ui);
    // The loop plays only while the UI is mostly visible, and restarts each time it comes back
    if (this.reducedMotion.matches) return;
    if (ui > 0.5) this.dialog.start();
    else this.dialog.stop();
  }

  /** Scale the design box onto the laptop screen, and sit the heading just above the laptop */
  private place(): void {
    const screen = StageOverlay.inFrame(this.canvas, this.root, PrivateAgentScene.SCREEN);
    const scale = screen.width / PrivateAgentScene.DESIGN_WIDTH;
    this.screen.style.transform = `translate(${screen.left}px, ${screen.top}px) scale(${scale})`;
    this.screen.style.height = `${screen.height / scale}px`;
    const canvasTop = this.canvas.offsetTop;
    this.title.style.top = `${Math.max(canvasTop, screen.top - this.title.offsetHeight - PrivateAgentScene.TITLE_GAP)}px`;
  }
}
