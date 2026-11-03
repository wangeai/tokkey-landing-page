// Plays hero scenes on two stacked canvases: each scene runs its frames like a video at its fps,
// crossfading in over whatever scene was showing before.
import { gsap } from "./gsap";
import { FramePlayer } from "./FramePlayer";
import { FrameSequence } from "./FrameSequence";
import { FRAME_SEQUENCES } from "../config/frames";
import { SCENE_CROSSFADE, sceneFps, type SceneConfig } from "../config/scenes";

export class ScenePlayer {
  private readonly players: FramePlayer[];
  /** Index into `players` of the canvas currently on top */
  private front = 0;
  /** Scene on the front canvas and how far it has played (0..1) */
  private current: { scene: SceneConfig; progress: number } | null = null;
  /** Mobile loads every other frame and uses each scene's mobileFit */
  private profile = { step: 1, mobile: false };
  /** Running crossfade; a newer one takes over from it */
  private fade?: gsap.core.Timeline;
  /** Bumped by every play / rewind / show, so a call that was taken over doesn't carry on after its awaits */
  private epoch = 0;

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

  /** Crossfade to `scene` and play its frames forward; resolves when the last frame is shown.
   *  If `scene` is already on screen (a rewind turned around midway), play on from the frame showing */
  async play(scene: SceneConfig): Promise<void> {
    const epoch = ++this.epoch;
    if (!this.isShowing(scene)) {
      await this.sequence(scene).ready();
      if (epoch !== this.epoch) return;
      // The frames start running while the crossfade is still going
      this.crossfadeTo(scene, 0);
    }
    await this.animateTo(1);
  }

  /** Play `scene` backward from the frame showing to its first frame. Does nothing if `scene` isn't on screen
   *  (its play was turned around before the crossfade) */
  rewind(scene: SceneConfig): Promise<void> {
    ++this.epoch;
    if (!this.isShowing(scene)) return Promise.resolve();
    return this.animateTo(0);
  }

  /** Crossfade back to `previous` on its last frame (the reverse of play()'s crossfade) */
  returnTo(previous: SceneConfig): Promise<void> {
    return this.show(previous, 1);
  }

  /** Crossfade to `scene` held at `progress` (0 = first frame, 1 = last); resolves when the fade ends */
  async show(scene: SceneConfig, progress: number): Promise<void> {
    const epoch = ++this.epoch;
    await this.sequence(scene).ready();
    if (epoch !== this.epoch) return;
    await this.crossfadeTo(scene, progress).then();
  }

  /** True when the front canvas shows `scene`'s frames (scenes sharing a sequence count, e.g. plugIn / agentsFly) */
  private isShowing(scene: SceneConfig): boolean {
    return this.current?.scene.sequence === scene.sequence;
  }

  /** Show `scene` at `progress` on the back canvas, bring it on top and hide the front one. The first scene fades in;
   *  later ones cut straight over (a fade would show the outgoing frame through the transparent WebP background).
   *  Returns the running fade. The scene's frames must be loaded */
  private crossfadeTo(scene: SceneConfig, progress: number): gsap.core.Timeline {
    const outgoing = this.players[this.front].canvas;
    this.front = 1 - this.front;
    const incoming = this.players[this.front].canvas;
    incoming.style.filter = scene.filter ?? "";
    // Only the very first scene fades in; later ones cut, since transparent WebP frames would show the old scene through
    const duration = this.current ? 0 : SCENE_CROSSFADE;

    this.current = { scene, progress };
    this.draw();
    // A newer crossfade (e.g. a quick mode toggle) takes over: finish the running one first (which also resolves
    // anything awaiting it), so the canvas it brought in is fully opaque underneath the new one
    this.fade?.progress(1);
    gsap.set(incoming, { zIndex: 1 });
    gsap.set(outgoing, { zIndex: 0 });
    this.fade = gsap
      .timeline()
      .to(incoming, { opacity: 1, duration })
      .set(outgoing, { opacity: 0 });
    return this.fade;
  }

  /** Run the current scene's frames from where they are to `progress` (0 = first frame, 1 = last). A newer run takes
   *  over a running one (e.g. a mode toggle mid-play); the interrupted promise resolves so nothing waits forever */
  private animateTo(progress: number): Promise<void> {
    const current = this.current!;
    // Duration comes from the full frame count, so mobile (half the frames) plays at the same speed
    const duration = (FRAME_SEQUENCES[current.scene.sequence].count / sceneFps(current.scene)) * Math.abs(progress - current.progress);
    return new Promise((resolve) => {
      gsap.to(current, {
        progress,
        duration,
        ease: "none",
        overwrite: true,
        onUpdate: () => this.draw(),
        onComplete: resolve,
        onInterrupt: resolve,
      });
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
