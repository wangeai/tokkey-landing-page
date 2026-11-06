// Hero ("Own Your Intelligence." → "Turn your Mac into an AI Mac." → product walkthrough).
// The hero plays SCENES (src/config/scenes.ts) one at a time: each scroll gesture plays the next scene's
// frames like a video (SceneStepper + ScenePlayer). Each scene is a list of steps (createSteps()): the frames and the
// text/agent/ASCII animations around them. Steps play in order; rewinding plays them in reverse order, each reversed.
import { gsap } from "../gsap";
import { ScenePlayer } from "../ScenePlayer";
import { SceneStepper } from "../SceneStepper";
import { AsciiField, type AsciiCell } from "../AsciiField";
import { LuminanceMap } from "../LuminanceMap";
import { ModeTabs, type TokkeyMode } from "../ModeTabs";
import { PowerPanel } from "../PowerPanel";
import { MOBILE_MAX_WIDTH } from "../../config/frames";
import { SCENES, SCENE_TIMING_FPS, sceneFps, type SceneConfig, type SceneId } from "../../config/scenes";

/** Where the key sits in the 1600×900 plug frames (fraction of the frame, cover-fitted) */
const KEY_IN_FRAME = { x: 0.4275, y: 0.569 };
/** Ripple origin of the dot field in the 1600×900 laptop frames (px, contain-fitted) */
const RIPPLE_IN_FRAME = { x: 533, y: 592 };
/** Laptop display (inside the bezel) in the last "pullBack" frame (1600×900 px), measured from frame 003_00060
 *  with ~2px bleed onto the dark bezel so no bright edge shows */
const SCREEN_IN_FRAME = { x: 444, y: 100, width: 719, height: 460 };
/** Center of the turned-over laptop in the last "flipOver" frame (1600×900 px) */
const FLIPPED_LAPTOP_IN_FRAME = { x: 800, y: 452 };
/** The app UI is laid out 1000px wide and scaled onto the display; its height follows the display's aspect ratio */
const SCREEN_UI_WIDTH = 1000;
/** Desktop: every scene's frames are drawn this much lower (fraction of the viewport height),
 *  leaving room for the headlines and the With / Without Tokkey toggle above the laptop */
const LAPTOP_DROP = 0.15;
/** Seconds scene 0's first frame holds on page load before the scene plays */
const INTRO_HOLD = 0;
/** Interactive elements inside the hero; clicking them doesn't release the scroll lock */
const HERO_CONTROLS = "a, button, [data-power-card]";
/** Space kept free above (nav) and below the zoomed-in screen (px) */
const ZOOM_MARGIN = { top: 90, bottom: 20 };
/** Live readings in the app's task bar: value = base + amp * sin(time * speed) */
/** One step of a scene: its frames (optionally with a timeline running alongside), or a timeline on its own */
type SceneStep = { frames: true; timeline?: gsap.core.Timeline } | { frames?: false; timeline: gsap.core.Timeline };

const SCREEN_STATS = [
  { ref: "cpu", base: 19, amp: 6, speed: 1.3 },
  { ref: "mem", base: 81, amp: 2, speed: 0.7 },
  { ref: "gpu", base: 60, amp: 9, speed: 1.7 },
];

const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progress of x through [a, b], clamped to 0..1 */
const range = (x: number, a: number, b: number) => clamp((x - a) / (b - a));

/** Overlay values the scene tweens animate; render() turns them into pixels */
interface HeroState {
  introDots: number;
  dotsOut: number;
  glowIn: number;
  agents: { in: number; fly: number }[];
  /** Zoom into the laptop screen (0 = off, 1 = screen fills the viewport) */
  zoom: number;
  /** App UI on the laptop screen and the ASCII field around the laptop */
  screenIn: number;
  laptopField: number;
  /** ASCII glow around the turned-over laptop at the end of "flipOver" */
  releaseField: number;
  /** "powerFlow" overlay (cards, chips, lines) shown */
  powerIn: number;
  /** Hero panned up to show the strip below the viewport (0 = off, 1 = strip fully in view) */
  pan: number;
}

/** Viewport-dependent geometry, recomputed on resize */
interface HeroLayout {
  width: number;
  height: number;
  mobile: boolean;
  /** How far the frames are drawn below center (px; 0 on phones) */
  drop: number;
  key: { x: number; y: number };
  ripple: { x: number; y: number };
  agentGrid: { left: number; top: number; colGap: number; rowGap: number; chipHeight: number };
  /** Laptop screen in stage coordinates (stage untransformed) */
  screen: { x: number; y: number; width: number; height: number };
  /** Stage transform when fully zoomed into the screen (around the stage's 50% 90% origin) */
  zoomTarget: { scale: number; x: number; y: number };
  /** Center of the turned-over laptop at the end of "flipOver" */
  flippedLaptop: { x: number; y: number };
  /** How far the hero pans up to show the "powerFlow" strip (px) */
  pan: number;
}

export class HeroScene {
  private readonly ref: <T extends HTMLElement = HTMLElement>(name: string) => T;
  private readonly agentEls: HTMLElement[];
  /** Frames layer + app UI layer, transformed together */
  private readonly stageLayers: HTMLElement[];
  private readonly state: HeroState;
  private layout!: HeroLayout;
  private readonly player: ScenePlayer;
  private readonly stepper: SceneStepper;
  private readonly steps: Record<SceneId, SceneStep[]>;
  /** Scene whose end state is showing (undefined before the first scene) */
  private sceneId?: SceneId;
  /** Scene whose steps are playing or rewinding, and the index of the running step; undefined when idle */
  private transition?: { scene: SceneConfig; at: number };
  private readonly dots: AsciiField;
  private readonly glow: AsciiField;
  private readonly laptopField: AsciiField;
  private readonly releaseField: AsciiField;
  /** "With / Without Tokkey" toggle shown under "Release the True Power." */
  readonly modeTabs: ModeTabs;
  private readonly power: PowerPanel;

  constructor(private readonly section: HTMLElement) {
    this.ref = <T extends HTMLElement>(name: string) => section.querySelector<T>(`[data-ref="${name}"]`)!;
    this.agentEls = [...section.querySelectorAll<HTMLElement>("[data-agent]")];
    this.stageLayers = [...section.querySelectorAll<HTMLElement>("[data-stage]")];
    this.state = {
      introDots: 0,
      dotsOut: 0,
      glowIn: 0,
      agents: this.agentEls.map(() => ({ in: 0, fly: 0 })),
      zoom: 0,
      screenIn: 0,
      laptopField: 0,
      releaseField: 0,
      powerIn: 0,
      pan: 0,
    };
    this.dots = this.createDotField();
    this.glow = this.createGlowField();
    this.laptopField = this.createLaptopField("laptopField", () => ({
      x: this.layout.width / 2,
      y: this.layout.height * 0.58 + this.layout.drop,
    }));
    this.releaseField = this.createLaptopField("releaseField", () => this.layout.flippedLaptop);
    gsap.ticker.add((time) => this.tickStats(time));
    this.player = new ScenePlayer([...section.querySelectorAll<HTMLCanvasElement>("[data-frames]")]);
    this.power = new PowerPanel(this.ref("power"));
    // The overlay's lines follow the animated cards, so redraw them every frame while it's shown
    gsap.ticker.add((time) => {
      if (this.state.powerIn > 0.01) this.power.tick(time);
    });

    this.measure();
    const remeasure = () => {
      this.measure();
      this.render();
    };
    window.addEventListener("resize", remeasure);
    // Web fonts change text heights (e.g. the powerFlow chips stacked above the strip), so measure again once they're in
    document.fonts.ready.then(remeasure);
    gsap.set(this.ref("title1"), { y: 24, filter: "blur(10px)" });
    gsap.set(this.ref("title2"), { y: 24 });
    gsap.set(this.ref("title4"), { y: 60, filter: "blur(10px)" });
    gsap.set(this.ref("modeTabs"), { y: 40, pointerEvents: "none" });
    this.modeTabs = new ModeTabs(this.ref("modeTabs"), section);
    this.modeTabs.onChange((mode) => this.toggleMode(mode));
    // App UI panels wait hidden until the zoom into the screen finishes
    gsap.set("[data-screen-item]", { opacity: 0 });
    this.steps = this.createSteps();
    // Mobile loads the smaller videos and fits each scene per its mobileFit; agent layout adapts inside measure().
    // Set before the intro so a phone never downloads the desktop video
    gsap
      .matchMedia()
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.player.setProfile(false))
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.player.setProfile(true));
    this.playIntro();

    this.stepper = new SceneStepper(SCENES.length, (index, direction) => this.playScene(index, direction));
    // Clicking the hero (outside its own controls) lets the next scroll leave it without stepping through every scene
    section.addEventListener("click", (event) => {
      if (!(event.target as Element).closest(HERO_CONTROLS)) this.stepper.release();
    });
  }

  /** On page load: scene 0's first frame fades in and holds for INTRO_HOLD seconds, then scene 0 plays on its own;
   *  the dot field fades in alongside */
  private playIntro(): void {
    this.player.show(SCENES[0], 0).then(() => {
      gsap.delayedCall(INTRO_HOLD, () => this.stepper.autoplay());
      // Scene 0 is on screen: fetch the rest of the videos in the background, next scene first
      this.player.preloadAll(SCENES.slice(1));
    });
    gsap.to(this.state, { introDots: 1, duration: 1.6, delay: 0.2, ease: "none", onUpdate: () => this.render() });
  }

  /** Move to scene `index`. Forward plays scene `index`'s steps in order; backward plays the steps of the scene after it
   *  in reverse order, landing on scene `index`'s end state (index -1 = scene 0 rewound to its start).
   *  From "xray" on the toggle picks a branch: "With Tokkey" plays (and rewinds) the frames; "Without Tokkey" keeps the
   *  last "flipOver" frame on screen, so only the effects play.
   *  Called against a running transition, it turns that one around from its running step */
  private async playScene(index: number, direction: 1 | -1): Promise<void> {
    // Read the branch before the reset below: rewinding out of "xray" still follows the branch it was played in
    const frames = this.modeTabs.mode === "with";
    // Before "xray" the toggle is hidden; reset it quietly so the next pass through "xray" starts in "With Tokkey"
    if (index < SCENES.findIndex((scene) => scene.id === "xray")) this.modeTabs.set("with", false);
    this.sceneId = SCENES[index]?.id;
    // Forward plays scene `index`; backward rewinds the scene after it
    const scene = direction > 0 ? SCENES[index] : SCENES[index + 1];
    const steps = this.steps[scene.id];
    const running = this.transition;
    const transition = {
      scene,
      at: running?.scene === scene ? running.at : direction > 0 ? 0 : steps.length - 1,
    };
    this.transition = transition;
    for (; transition.at >= 0 && transition.at < steps.length; transition.at += direction) {
      const step = steps[transition.at];
      if (direction > 0) await this.playStep(scene, step, frames);
      else await this.rewindStep(scene, step, frames, SCENES[index]);
      // A newer gesture took over (and turned this transition around)
      if (this.transition !== transition) return;
    }
    this.transition = undefined;
  }

  /** Switch branch on "xray" / "powerFlow": "Without Tokkey" crossfades back to the last "flipOver" frame,
   *  "With Tokkey" plays the current scene's frames from there */
  private toggleMode(mode: TokkeyMode): void {
    const scene = SCENES.find((s) => s.id === this.sceneId);
    if (scene?.id !== "xray" && scene?.id !== "powerFlow") return;
    if (mode === "with") this.player.play(scene);
    else this.player.show(SCENES.find((s) => s.id === "flipOver")!, 1);
  }

  /** Forward: crossfade in and play the frames (with their timeline alongside), or play the timeline; a step turned
   *  around midway plays on from where it is. `frames` false ("Without Tokkey") skips the frames and plays only the timeline */
  private async playStep(scene: SceneConfig, step: SceneStep, frames: boolean): Promise<void> {
    const play = step.frames && frames;
    await Promise.all([step.timeline && this.runTimeline(step.timeline, 1), play && this.player.play(scene)]);
  }

  /** Backward: rewind `scene`'s frames (with their timeline alongside) and crossfade back to `previous`, or reverse the
   *  timeline, from wherever they are. `frames` false ("Without Tokkey") leaves the frames alone and only reverses the timeline */
  private async rewindStep(scene: SceneConfig, step: SceneStep, frames: boolean, previous?: SceneConfig): Promise<void> {
    const rewind = step.frames && frames;
    await Promise.all([step.timeline && this.runTimeline(step.timeline, -1), rewind && this.player.rewind(scene)]);
    if (rewind && previous) await this.player.returnTo(previous);
  }

  /** Play a timeline forward, or reverse it, from where it is; resolves when it reaches that end */
  private runTimeline(tl: gsap.core.Timeline, direction: 1 | -1): Promise<void> {
    if (tl.progress() === (direction > 0 ? 1 : 0)) return Promise.resolve();
    return new Promise((resolve) => {
      tl.eventCallback(direction > 0 ? "onComplete" : "onReverseComplete", () => resolve());
      if (direction > 0) tl.play();
      else tl.reverse();
    });
  }

  /** Per-scene steps with paused timelines. Each timeline animates from the end state of the step before it,
   *  so reversing the steps restores the previous scene's text and effects */
  private createSteps(): Record<SceneId, SceneStep[]> {
    const s = this.state;
    const timeline = () =>
      gsap.timeline({
        paused: true,
        // immediateRender off: the "from" values must not apply until the timeline actually plays
        defaults: { duration: 0.5, ease: "power2.inOut", immediateRender: false },
        onUpdate: () => this.render(),
      });

    // Scene "logoReveal": headline 1 fades in
    const logoReveal = timeline().fromTo(
      this.ref("title1"),
      { opacity: 0, y: 24, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)" },
      0.4,
    );

    // Scene "plugIn", with the frames: part A out, then shade, glow, headline 2 and the agent chips come in.
    // Kept within the frames' length so, going back, they're gone by the time the frames finish rewinding
    const plugIn = timeline()
      .fromTo(this.ref("partA"), { opacity: 1 }, { opacity: 0 }, 0)
      .fromTo(s, { dotsOut: 0 }, { dotsOut: 1 }, 0)
      .fromTo(this.ref("partB"), { opacity: 0 }, { opacity: 1 }, 0)
      .fromTo(this.ref("plugShade"), { opacity: 0 }, { opacity: 1 }, 0.6)
      .fromTo(s, { glowIn: 0 }, { glowIn: 1 }, 0.6)
      .fromTo(this.ref("title2"), { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, 0.8);
    // Scene "agentsFly", on the next scroll: the agents fly into the key one by one
    const agentsFly = timeline();
    s.agents.forEach((agent, i) => {
      plugIn.fromTo(agent, { in: 0 }, { in: 1, duration: 0.3 }, 0.9 + i * 0.05);
      agentsFly.fromTo(agent, { fly: 0 }, { fly: 1, duration: 0.7 }, i * 0.15);
    });

    // Scene "pullBack", with the frames: part B (headline 2, glow, key halo) fades away; near the end of the frames
    // "A private agent. Working on your Mac." and its glows come in
    const screenItems = this.section.querySelectorAll<HTMLElement>("[data-screen-item]");
    const pullBack = timeline()
      .fromTo(this.ref("partB"), { opacity: 1 }, { opacity: 0 }, 0)
      .fromTo(s, { glowIn: 1 }, { glowIn: 0 }, 0)
      .fromTo(this.ref("partC"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.7)
      .fromTo(s, { laptopField: 0 }, { laptopField: 1, duration: 0.6 }, 0.7)
      .fromTo(
        this.ref("title3"),
        { opacity: 0, y: 24, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)" },
        1.7,
      );
    // Scene "screenZoom", on the next scroll: the headline leaves, the camera zooms into the screen, and the app UI's backdrop fades in over it
    const screenZoom = timeline()
      .fromTo(this.ref("title3"), { opacity: 1 }, { opacity: 0, duration: 0.4 }, 0.2)
      .fromTo(s, { zoom: 0 }, { zoom: 1, duration: 1 }, 0.2)
      .fromTo(s, { screenIn: 0 }, { screenIn: 1, duration: 0.4 }, 1.2);
    // Then the panels pop in one by one
    const screenPanels = timeline().fromTo(screenItems, { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.14 }, 0);
    // Scene "flipOver" starts with the panels leaving the way screenPanels rewinds: last one first, sinking as they fade
    const panelsOut = timeline().fromTo(
      screenItems,
      { opacity: 1, y: 0 },
      { opacity: 0, y: 26, stagger: { each: 0.14, from: "end" } },
      0,
    );

    // Then the screen backdrop and glows fade away and the camera zooms back out to the laptop; then it fades over to the turning laptop
    const zoomOut = timeline()
      .fromTo(this.ref("partC"), { opacity: 1 }, { opacity: 0, duration: 0.4 }, 0)
      .fromTo(s, { screenIn: 1, laptopField: 1 }, { screenIn: 0, laptopField: 0, duration: 0.4 }, 0)
      .fromTo(s, { zoom: 1 }, { zoom: 0, duration: 0.7 }, 0.2);
    // After the turn: "Release the True Power." rises in over colored glows and an ASCII glow around the laptop
    const release = timeline()
      .fromTo(this.ref("releaseGlow"), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0)
      .fromTo(s, { releaseField: 0 }, { releaseField: 1, duration: 0.8 }, 0)
      .fromTo(
        this.ref("title4"),
        { opacity: 0, y: 60, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
        0.2,
      );

    // Scene "xray", with the frames: the With / Without Tokkey toggle rises in under the headline; it only takes clicks while shown
    const tabsIn = timeline().fromTo(
      this.ref("modeTabs"),
      { opacity: 0, y: 40, pointerEvents: "none" },
      { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.6, ease: "power3.out" },
      0,
    );

    // Scene "powerFlow", after the frames: side cards slide in, chips rise beside the laptop, then the lines,
    // hotspots and bottom strip (both modes' pieces animate; data-mode decides which are visible)
    const order = (_: number, el: HTMLElement) => Number(el.dataset.order) * 0.08;
    const powerIn = timeline()
      .fromTo(s, { powerIn: 0 }, { powerIn: 1, duration: 0.3 }, 0)
      .fromTo(
        this.section.querySelectorAll("[data-power-cards] [data-power-item]"),
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, stagger: order },
        0.6,
      )
      .fromTo(
        this.section.querySelectorAll("[data-power-tag]"),
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, stagger: order },
        0.8,
      )
      // The hero pans up as the strip comes in, so the strip below the viewport ends up fully visible
      .fromTo(s, { pan: 0 }, { pan: 1, duration: 0.7 }, 1.1)
      .fromTo(this.ref("powerCallouts"), { opacity: 0 }, { opacity: 1 }, 1.3)
      .fromTo(this.ref("powerStrip"), { opacity: 0, y: 26 }, { opacity: 1, y: 0 }, 1.3);

    const steps: Record<SceneId, SceneStep[]> = {
      logoReveal: [{ frames: true, timeline: logoReveal }],
      plugIn: [{ frames: true, timeline: plugIn }],
      agentsFly: [{ timeline: agentsFly }],
      pullBack: [{ frames: true, timeline: pullBack }],
      screenZoom: [{ timeline: screenZoom }, { timeline: screenPanels }],
      flipOver: [{ timeline: panelsOut }, { timeline: zoomOut }, { frames: true }, { timeline: release }],
      xray: [{ frames: true, timeline: tabsIn }],
      powerFlow: [{ frames: true }, { timeline: powerIn }],
    };
    // Timelines running alongside frames keep pace with their scene's frame rate
    SCENES.forEach((scene) =>
      steps[scene.id].forEach((step) => step.frames && step.timeline?.timeScale(sceneFps(scene) / SCENE_TIMING_FPS)),
    );
    return steps;
  }

  /** Apply state to chips and glow — called on every overlay/intro update */
  private render(): void {
    const s = this.state;
    const L = this.layout;

    // Agents: start in a 2-column grid under the headline, arc into the key while shrinking
    const g = L.agentGrid;
    let absorbed = 0;
    this.agentEls.forEach((el, i) => {
      const { in: shown, fly } = s.agents[i];
      absorbed += fly > 0.98 ? 1 : fly;
      const startX = g.left + (i % 2) * g.colGap;
      const startY = g.top + g.chipHeight / 2 + Math.floor(i / 2) * g.rowGap;
      const x = lerp(startX, L.key.x, fly);
      const y = lerp(startY, L.key.y, fly) - Math.sin(fly * Math.PI) * L.height * 0.07;
      el.style.opacity = String(shown * (1 - range(fly, 0.8, 1)));
      el.style.transform = `translate(${x}px, ${y}px) translate(0, -50%) scale(${lerp(1, 0.12, fly)})`;
    });

    // The key glows brighter as agents are absorbed
    const charge = clamp(absorbed / this.agentEls.length);
    this.ref("halo").style.opacity = String(0.04 + charge * 0.2);
    this.ref("key").style.transform = `scale(${1 + charge * 0.08})`;
    this.glow.setVisibility(s.glowIn * (0.55 + 0.45 * charge));
    this.dots.setVisibility(s.introDots * (1 - s.dotsOut) * 0.85);
    this.laptopField.setVisibility(s.laptopField * 0.6);
    this.releaseField.setVisibility(s.releaseField * 0.55);

    // Stage: zoom into the screen; the keyboard below the screen is clipped while zoomed
    const z = L.zoomTarget;
    const scale = lerp(1, z.scale, s.zoom);
    const transform = `translate(${z.x * s.zoom}px, ${z.y * s.zoom}px) scale(${scale})`;
    const cut = L.height - (L.screen.y + L.screen.height + (34 * L.screen.width) / SCREEN_UI_WIDTH);
    const clipPath = s.zoom > 0.001 ? `inset(-${L.height}px -${L.width}px ${cut * s.zoom}px)` : "none";
    this.stageLayers.forEach((layer) => Object.assign(layer.style, { transform, clipPath }));
    this.ref("screen").style.opacity = String(s.screenIn);
    this.ref("pan").style.transform = `translateY(${-L.pan * s.pan}px)`;
  }

  /** Animate the task bar's CPU / Memory / GPU readings while the app UI is visible */
  private tickStats(time: number): void {
    if (this.state.screenIn < 0.01) return;
    SCREEN_STATS.forEach(({ ref, base, amp, speed }) => {
      this.ref(ref).textContent = `${Math.round(base + amp * Math.sin(time * speed))}%`;
    });
  }

  /** Map 1600×900 frame pixels to viewport pixels (frames are 3840×2160, same 16:9, so positions are measured
   *  on a 1600×900 downscale) for a frame drawn full-viewport with `fit`, `drop` px below center */
  private fitFrame(width: number, height: number, fit: "cover" | "contain", drop: number): (x: number, y: number) => { x: number; y: number } {
    const k = (fit === "cover" ? Math.max : Math.min)(width / 1600, height / 900);
    return (x, y) => ({ x: (width - 1600 * k) / 2 + x * k, y: (height - 900 * k) / 2 + y * k + drop });
  }

  /** Map 1600×900 frame pixels of scene `id` to viewport pixels; frames use cover on desktop and the scene's
   *  mobileFit on phones */
  private sceneFrame(id: SceneId, width: number, height: number, mobile: boolean, drop: number): (x: number, y: number) => { x: number; y: number } {
    const scene = SCENES.find((s) => s.id === id)!;
    return this.fitFrame(width, height, mobile ? scene.mobileFit : "cover", drop);
  }

  /** Recompute viewport geometry (key position, ripple origin, agent grid) */
  private measure(): void {
    const width = this.section.clientWidth;
    const height = window.innerHeight;
    const mobile = width <= MOBILE_MAX_WIDTH;
    const drop = mobile ? 0 : height * LAPTOP_DROP;
    this.player.setOffsetY(drop);

    // Key: plug frames are drawn cover-fit, so map the frame point through the same fit
    const key = this.fitFrame(width, height, "cover", drop)(KEY_IN_FRAME.x * 1600, KEY_IN_FRAME.y * 900);
    const keyEl = this.ref("key");
    keyEl.style.left = `${key.x}px`;
    keyEl.style.top = `${key.y}px`;

    // Ripple: contain-fit mapping of the laptop frame point
    const ripple = this.fitFrame(width, height, "contain", drop)(RIPPLE_IN_FRAME.x, RIPPLE_IN_FRAME.y);

    // Screen: on the last "pullBack" frame
    const toScreen = this.sceneFrame("pullBack", width, height, mobile, drop);
    const topLeft = toScreen(SCREEN_IN_FRAME.x, SCREEN_IN_FRAME.y);
    const screenWidth = toScreen(SCREEN_IN_FRAME.x + SCREEN_IN_FRAME.width, 0).x - topLeft.x;
    const uiScale = screenWidth / SCREEN_UI_WIDTH;
    const screen = { ...topLeft, width: screenWidth, height: (SCREEN_IN_FRAME.height / SCREEN_IN_FRAME.width) * screenWidth };
    const screenEl = this.ref("screen");
    screenEl.style.height = `${screen.height / uiScale}px`;
    screenEl.style.left = `${screen.x}px`;
    screenEl.style.top = `${screen.y}px`;
    screenEl.style.transform = `scale(${uiScale})`;

    // Zoom target: scale the screen to fit between the margins, centered; solve the translate for the 50% 90% origin
    const zoomScale = Math.min(width / screen.width, (height - ZOOM_MARGIN.top - ZOOM_MARGIN.bottom) / screen.height);
    const origin = { x: width / 2, y: height * 0.9 };
    const target = { x: width / 2, y: (ZOOM_MARGIN.top + height - ZOOM_MARGIN.bottom) / 2 };
    const zoomTarget = {
      scale: zoomScale,
      x: target.x - origin.x - zoomScale * (screen.x + screen.width / 2 - origin.x),
      y: target.y - origin.y - zoomScale * (screen.y + screen.height / 2 - origin.y),
    };

    // From "flipOver" on: map frame points through the scene's fit
    const flippedLaptop = this.sceneFrame("flipOver", width, height, mobile, drop)(FLIPPED_LAPTOP_IN_FRAME.x, FLIPPED_LAPTOP_IN_FRAME.y);
    this.power.layout(this.sceneFrame("powerFlow", width, height, mobile, drop));

    // Agent grid sits 56px under the second headline (layout box, ignoring its animated offset)
    const title2 = this.ref("title2");
    const chipHeight = this.agentEls[0]?.offsetHeight || 64;
    const agentGrid = {
      left: width * 0.06,
      top: title2.offsetTop + title2.offsetHeight + (mobile ? 32 : 56),
      colGap: mobile ? width * 0.46 : Math.min(250, width * 0.18),
      rowGap: chipHeight + (mobile ? 12 : 30),
      chipHeight,
    };

    // Pan: the strip sits 16px below the viewport; leave the same gap under it once panned
    const pan = this.ref("powerStrip").offsetHeight + 32;

    this.layout = { width, height, mobile, drop, key, ripple, agentGrid, screen, zoomTarget, flippedLaptop, pan };
  }

  /** Background dots: scrolling luminance texture plus a ripple from the laptop's port */
  private createDotField(): AsciiField {
    const lum = LuminanceMap.instance;
    return new AsciiField(this.ref<HTMLCanvasElement>("dots"), {
      sample: ({ x, y, width, height, time }: AsciiCell) => {
        const { ripple } = this.layout;
        const d = Math.hypot(x - ripple.x, (y - ripple.y) * 1.25);
        const wave = (0.5 + 0.5 * Math.sin(d * 0.042 - time * 2.2)) * Math.exp(-d / 820);
        return lum.at(x / width + time * 0.005, y / height) * 1.1 + wave * 0.55;
      },
    });
  }

  /** Glow around the laptop ("pullBack" front view, "flipOver" underside): breathing radial falloff around `center`
   *  with ripples and luminance texture, drawn on canvas `name` */
  private createLaptopField(name: string, center: () => { x: number; y: number }): AsciiField {
    const lum = LuminanceMap.instance;
    return new AsciiField(this.ref<HTMLCanvasElement>(name), {
      stepAlpha: 0.09,
      maxAlpha: 0.8,
      sample: ({ x, y, width, height, time }) => {
        const c = center();
        const d = Math.hypot(x - c.x, (y - c.y) * 1.3);
        const n = d / (Math.max(width, height) * 0.7);
        const falloff = Math.exp(-n * n * 0.85);
        const breathe = 0.5 + 0.5 * Math.sin(time * 0.9);
        const wave = 0.5 + 0.5 * Math.sin(d * (width < 1100 ? 0.07 : 0.04) - time * 1.6);
        const texture = lum.at(x / width + time * 0.004, y / height);
        return falloff * (0.34 + 0.2 * breathe + wave * 0.5 + texture * 0.3);
      },
    });
  }

  /** Glow around the key: breathing radial falloff with a hole where the key itself sits */
  private createGlowField(): AsciiField {
    const center = () => ({ x: this.layout.key.x, y: this.layout.key.y + this.layout.height * 0.03 });
    const radius = (w: number, h: number) => Math.min(w, h) * 0.62;
    return new AsciiField(this.ref<HTMLCanvasElement>("glow"), {
      color: "#e6f0ff",
      baseAlpha: 0.14,
      maxAlpha: 0.85,
      bounds: (w, h) => {
        const c = center();
        const r = radius(w, h) * 1.3;
        return { x1: c.x - r, y1: c.y - r, x2: c.x + r, y2: c.y + r };
      },
      mask: ({ x, y, width }) => {
        const c = center();
        const fromKey = Math.hypot((x - c.x) / (width * 0.06), (y - c.y + 12) / (width * 0.062));
        return clamp((fromKey - 0.95) / 0.6);
      },
      sample: ({ x, y, width, height, time }) => {
        const c = center();
        const d = Math.hypot(x - c.x, (y - c.y) * 1.2);
        const n = d / radius(width, height);
        const falloff = Math.exp(-n * n * 2.6);
        if (falloff < 0.05) return 0;
        const breathe = 0.5 + 0.5 * Math.sin(time * 1.15);
        const wave = 0.5 + 0.5 * Math.sin(d * 0.048 - time * 1.7);
        return falloff * (0.28 + 0.3 * breathe) + falloff * wave * 0.5;
      },
    });
  }
}
