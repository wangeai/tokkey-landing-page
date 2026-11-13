// Hero headline over the frame stage (prototype `#sx .t1`): fades and un-blurs in on load while "Intelligence" dances
// through a run of fonts, then rises and blurs out as the first segment of the frame timeline (effect "heroTitle"), so
// scroll drives it exactly like the frames that follow. The intro animates the inner span and the exit the heading, so
// the two never fight over the same properties.
import { gsap } from "../gsap";
import { FontCycle, type CycleFont } from "../FontCycle";
import { FrameStageScene, type StageEffect } from "./FrameStageScene";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";

interface TitleMotion {
  /** Intro: px the text rises while fading in */
  introRise: number;
  /** Exit: px the text rises while fading out */
  exitRise: number;
}

export class HeroTitleScene {
  /** Effect segment in TIMELINE that drives the exit */
  private static readonly EFFECT_ID = "heroTitle";
  private static readonly DESKTOP: TitleMotion = { introRise: 24, exitRise: 70 };
  /** The prototype hides this hero on phones; shorter moves for the smaller screen */
  private static readonly MOBILE: TitleMotion = { introRise: 16, exitRise: 40 };
  /** Prototype eases both intro and exit with easeInOutCubic */
  private static readonly EASE = "power3.inOut";
  /** The prototype's font run for "Intelligence" (fonts load via the <link> in index.astro) */
  private static readonly DANCE: CycleFont[] = [
    { family: "'Playfair Display', serif", style: "italic", weight: "400", letterSpacing: "-0.01em", hold: 130 },
    { family: "'Cormorant Garamond', serif", style: "normal", weight: "300", letterSpacing: "0.03em", hold: 120 },
    { family: "'EB Garamond', serif", style: "italic", weight: "400", letterSpacing: "0.01em", hold: 110 },
    { family: "'Bodoni Moda', serif", style: "normal", weight: "400", letterSpacing: "-0.02em", hold: 110 },
    { family: "'DM Serif Display', serif", style: "italic", weight: "400", letterSpacing: "-0.005em", hold: 120 },
    { family: "'Josefin Slab', serif", style: "normal", weight: "300", letterSpacing: "0.06em", hold: 145 },
    { family: "'Space Grotesk', sans-serif", style: "normal", weight: "300", letterSpacing: "0.015em", hold: 180 },
    { family: "'Bebas Neue', sans-serif", style: "normal", weight: "400", letterSpacing: "0.08em", hold: 240 },
    { family: "'Courier Prime', monospace", style: "normal", weight: "400", letterSpacing: "0.02em", hold: 340 },
    { family: "'Playfair Display', serif", style: "normal", weight: "400", letterSpacing: "-0.015em", hold: 480 },
  ];

  /** Paused exit tween for the current breakpoint; the effect's progress seeks it */
  private exitTween: gsap.core.Tween | null = null;

  constructor(title: HTMLElement, section: HTMLElement) {
    const inner = title.querySelector<HTMLElement>("[data-ref=inner]")!;
    const word = title.querySelector<HTMLElement>("[data-ref=dance]")!;
    const motion = "(prefers-reduced-motion: no-preference)";
    section.addEventListener(FrameStageScene.EFFECT_EVENT, (event) => {
      const { id, progress } = (event as CustomEvent<StageEffect>).detail;
      if (id === HeroTitleScene.EFFECT_ID) this.exitTween?.progress(progress);
    });
    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px) and ${motion}`, () => this.play(title, inner, word, HeroTitleScene.DESKTOP))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px) and ${motion}`, () => this.play(title, inner, word, HeroTitleScene.MOBILE))
      // Reduced motion: no intro or dance, just fade out with the scroll
      .add("(prefers-reduced-motion: reduce)", () => this.exit(title, { ...HeroTitleScene.MOBILE, exitRise: 0 }, false));
  }

  /** Intro and font dance on load, plus the exit; returns the cleanup for matchMedia */
  private play(title: HTMLElement, inner: HTMLElement, word: HTMLElement, motion: TitleMotion): () => void {
    gsap.from(inner, { opacity: 0, y: motion.introRise, filter: "blur(10px)", duration: 1.6, delay: 0.2, ease: HeroTitleScene.EASE });
    const dance = new FontCycle(word, HeroTitleScene.DANCE);
    dance.play();
    const cleanupExit = this.exit(title, motion, true);
    return () => {
      dance.stop();
      cleanupExit();
    };
  }

  /** Build the paused exit tween that the "heroTitle" effect seeks; returns its cleanup */
  private exit(title: HTMLElement, motion: TitleMotion, blur: boolean): () => void {
    this.exitTween = gsap.to(title, {
      opacity: 0,
      y: -motion.exitRise,
      filter: blur ? "blur(12px)" : "none",
      ease: HeroTitleScene.EASE,
      paused: true,
    });
    return () => (this.exitTween = null);
  }
}
