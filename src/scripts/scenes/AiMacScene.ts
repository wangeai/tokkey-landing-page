// "Turn your Mac into an AI Mac." (markup: src/components/AiMacEffect.astro), ported from the prototype's `#t2` / `#ags`.
// Runs on the "aiMac" effect, which holds scene 002's last frame (the key plugged into the Mac): the heading rises in,
// the agent chips fade in under it in two columns, then each chip arcs into the key and shrinks away while the halo
// around the key brightens with every chip absorbed. Everything fades out before scene 003 moves the camera.
import { gsap } from "../gsap";
import { FrameStageScene, type StageEffect } from "./FrameStageScene";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";

interface ChipLayout {
  /** Left edge of the first column, px */
  left: (width: number) => number;
  /** Distance between the two columns, px */
  column: (width: number) => number;
  /** Space between the heading and the first row, px */
  top: number;
  /** Vertical gap between rows, px */
  rowGap: number;
}

export class AiMacScene {
  /** Effect segment in TIMELINE that drives the scene */
  private static readonly EFFECT_ID = "aiMac";
  /** Key center in scene 002's last frame, as a share of the frame (frames are 16:9, drawn cover-fit) */
  private static readonly KEY = { x: 0.436, y: 0.549 };
  private static readonly ASPECT = 16 / 9;
  /** Prototype spacing: chips start 6% in, columns up to 250px apart */
  private static readonly DESKTOP: ChipLayout = {
    left: (w) => w * 0.06,
    column: (w) => Math.min(250, w * 0.18),
    top: 80,
    rowGap: 30,
  };
  private static readonly MOBILE: ChipLayout = { left: () => 16, column: (w) => (w - 32) / 2, top: 32, rowGap: 16 };
  /** Prototype eases with easeInOutCubic */
  private static readonly ease = gsap.parseEase("power3.inOut");

  private readonly title: HTMLElement;
  private readonly halo: HTMLElement;
  private readonly chips: HTMLElement[];
  private readonly canvas: HTMLCanvasElement;
  private layout = AiMacScene.DESKTOP;
  private progress = 0;

  constructor(
    private readonly root: HTMLElement,
    section: HTMLElement,
  ) {
    this.title = root.querySelector<HTMLElement>("[data-ref=title]")!;
    this.halo = root.querySelector<HTMLElement>("[data-ref=halo]")!;
    this.chips = [...root.querySelectorAll<HTMLElement>("[data-ref=agents] > li")];
    this.canvas = section.querySelector<HTMLCanvasElement>("[data-ref=frames]")!;

    section.addEventListener(FrameStageScene.EFFECT_EVENT, (event) => {
      const { id, progress } = (event as CustomEvent<StageEffect>).detail;
      if (id === AiMacScene.EFFECT_ID) this.render(progress);
    });
    window.addEventListener("resize", () => this.render(this.progress));
    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.useLayout(AiMacScene.DESKTOP))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.useLayout(AiMacScene.MOBILE));
  }

  /** Progress of `p` through [a, b], clamped to 0..1 */
  private static seg(p: number, a: number, b: number): number {
    return gsap.utils.clamp(0, 1, (p - a) / (b - a));
  }

  private useLayout(layout: ChipLayout): void {
    this.layout = layout;
    this.render(this.progress);
  }

  /** Key center relative to the root, from where the canvas draws the cover-fit frame */
  private keyPoint(): { x: number; y: number } {
    const box = this.canvas.getBoundingClientRect();
    const origin = this.root.getBoundingClientRect();
    const fw = Math.max(box.width, box.height * AiMacScene.ASPECT);
    const fh = fw / AiMacScene.ASPECT;
    return {
      x: box.left - origin.left + (box.width - fw) / 2 + AiMacScene.KEY.x * fw,
      y: box.top - origin.top + (box.height - fh) / 2 + AiMacScene.KEY.y * fh,
    };
  }

  private render(progress: number): void {
    this.progress = progress;
    const { seg, ease } = AiMacScene;
    const { width, height } = this.root.getBoundingClientRect();
    const key = this.keyPoint();

    // Heading: rises 24px in at the start, rises 40px out at the end
    const rise = gsap.utils.interpolate(24, 0, ease(seg(progress, 0, 0.25)));
    const exit = seg(progress, 0.9, 1);
    const shown = seg(progress, 0, 0.19) * (1 - exit);
    this.title.style.opacity = String(shown);
    this.title.style.transform = `translateY(${rise - ease(exit) * 40}px)`;

    // Chips: two columns under the heading, staggered in, then each arcs into the key (prototype `#ags`)
    const { left, column, top, rowGap } = this.layout;
    const titleBottom = this.title.offsetTop + this.title.offsetHeight;
    let absorbed = 0;
    this.chips.forEach((chip, i) => {
      const appear = seg(progress, i * 0.0125, 0.125 + i * 0.0125);
      const fly = ease(seg(progress, 0.25 + i * 0.06, 0.45 + i * 0.06));
      absorbed += fly;
      const h = chip.offsetHeight;
      const startX = left(width) + (i % 2) * column(width);
      const startY = titleBottom + top + h / 2 + Math.floor(i / 2) * (h + rowGap);
      const x = gsap.utils.interpolate(startX, key.x, fly);
      const y = gsap.utils.interpolate(startY, key.y, fly) - Math.sin(fly * Math.PI) * height * 0.07;
      // Anchored by its left edge in the list, by its center when it reaches the key
      chip.style.transform = `translate(${x}px, ${y}px) translate(${-50 * fly}%, -50%) scale(${gsap.utils.interpolate(1, 0.12, fly)})`;
      chip.style.opacity = String(appear * (1 - seg(fly, 0.8, 1)));
    });

    // Halo: brightens and swells as chips are absorbed
    const full = absorbed / this.chips.length;
    this.halo.style.opacity = String((0.04 + full * 0.2) * shown);
    this.halo.style.transform = `translate(${key.x}px, ${key.y}px) scale(${1 + full * 0.08})`;
  }
}
