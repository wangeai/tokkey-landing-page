// Plays hero scenes on two stacked canvases: each scene runs its frames like a video at SCENE_FPS,
// crossfading in over whatever scene was showing before.
import { gsap } from "./gsap";
import { FramePlayer } from "./FramePlayer";
import { FrameSequence } from "./FrameSequence";
import { FRAME_COUNTS } from "../config/frames";
import { SCENE_CROSSFADE, SCENE_FPS, type SceneConfig } from "../config/scenes";

export class ScenePlayer {
  private readonly players: FramePlayer[];
  /** Index into `players` of the canvas currently on top */
  private front = 0;
  /** Scene on the front canvas and how far it has played (0..1) */
  private current: { scene: SceneConfig; progress: number } | null = null;
  /** Mobile loads every other frame and uses each scene's mobileFit */
  private profile = { step: 1, mobile: false };

  constructor(canvases: HTMLCanvasElement[]) {
    this.players = canvases.map((canvas) => new FramePlayer(canvas));
    gsap.set(canvases, { opacity: 0 });
  }

  /** Switch desktop/mobile loading + fit; repaints the frame on screen */
  setProfile(step: number, mobile: boolean): void {
    this.profile = { step, mobile };
    this.draw();
  }

  /** Start downloading a scene's frames ahead of time */
  preload(scene: SceneConfig): void {
    this.sequence(scene).load();
  }

  /** Crossfade to `scene` and play its frames forward; resolves when the last frame is shown */
  async play(scene: SceneConfig): Promise<void> {
    await this.crossfadeTo(scene, 0);
    // The frames start running while the crossfade is still going
    await this.animateTo(1);
  }

  /** Play the current scene backward to its first frame */
  rewind(): Promise<void> {
    return this.animateTo(0);
  }

  /** Crossfade back to `previous` on its last frame (the reverse of play()'s crossfade) */
  async returnTo(previous: SceneConfig): Promise<void> {
    const fade = await this.crossfadeTo(previous, 1);
    await fade.then();
  }

  /** Show `scene` at `progress` on the back canvas and fade it over the front one; returns the running fade */
  private async crossfadeTo(scene: SceneConfig, progress: number): Promise<gsap.core.Timeline> {
    await this.sequence(scene).ready();
    const outgoing = this.players[this.front].canvas;
    this.front = 1 - this.front;
    const incoming = this.players[this.front].canvas;
    incoming.style.filter = scene.filter ?? "";

    this.current = { scene, progress };
    this.draw();
    return gsap
      .timeline()
      .to(incoming, { opacity: 1, duration: SCENE_CROSSFADE }, 0)
      .to(outgoing, { opacity: 0, duration: SCENE_CROSSFADE }, 0);
  }

  /** Run the current scene's frames from where they are to `progress` (0 = first frame, 1 = last) */
  private animateTo(progress: number): Promise<void> {
    const current = this.current!;
    // Duration comes from the full frame count, so mobile (half the frames) plays at the same speed
    const duration = (FRAME_COUNTS[current.scene.sequence] / SCENE_FPS) * Math.abs(progress - current.progress);
    return new Promise((resolve) => {
      gsap.to(current, { progress, duration, ease: "none", onUpdate: () => this.draw(), onComplete: resolve });
    });
  }

  /** Paint the current scene's frame on the front canvas */
  private draw(): void {
    if (!this.current) return;
    const { scene, progress } = this.current;
    const sequence = this.sequence(scene);
    const fit = this.profile.mobile ? scene.mobileFit : "cover";
    this.players[this.front].draw(sequence, progress * (sequence.length - 1), fit);
  }

  private sequence(scene: SceneConfig): FrameSequence {
    return FrameSequence.get(scene.sequence, this.profile.step).load();
  }
}
