// Helpers shared by the overlays in FrameStage's slot (AiMacScene, PrivateAgentScene): where the cover-fit frame sits
// on screen, so an overlay can pin itself to something drawn in it, and the prototype's clamped range progress.
import { gsap } from "./gsap";

/** A box in px, relative to an overlay root */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class StageOverlay {
  /** Frames are 16:9 */
  private static readonly ASPECT = 16 / 9;

  /** Progress of `p` through [a, b], clamped to 0..1 (prototype `seg`) */
  static seg(p: number, a: number, b: number): number {
    return gsap.utils.clamp(0, 1, (p - a) / (b - a));
  }

  /** Box of the frame drawn cover-fit on `canvas` (see FrameCanvas), relative to `root` */
  static frameBox(canvas: HTMLElement, root: HTMLElement): Box {
    const box = canvas.getBoundingClientRect();
    const origin = root.getBoundingClientRect();
    const width = Math.max(box.width, box.height * StageOverlay.ASPECT);
    const height = width / StageOverlay.ASPECT;
    return {
      left: box.left - origin.left + (box.width - width) / 2,
      top: box.top - origin.top + (box.height - height) / 2,
      width,
      height,
    };
  }

  /** Part of the frame given as shares of it (0..1), as a box relative to `root` */
  static inFrame(canvas: HTMLElement, root: HTMLElement, share: Box): Box {
    const frame = StageOverlay.frameBox(canvas, root);
    return {
      left: frame.left + share.left * frame.width,
      top: frame.top + share.top * frame.height,
      width: share.width * frame.width,
      height: share.height * frame.height,
    };
  }
}
