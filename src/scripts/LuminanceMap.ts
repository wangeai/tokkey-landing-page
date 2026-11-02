// Decodes the shared luminance map and samples it with wrap-around in x.
import { LUMINANCE_BASE64, LUMINANCE_HEIGHT, LUMINANCE_WIDTH } from "../config/luminance";

export class LuminanceMap {
  private static singleton: LuminanceMap | null = null;
  private readonly data: Uint8Array;

  private constructor() {
    this.data = Uint8Array.from(atob(LUMINANCE_BASE64), (c) => c.charCodeAt(0));
  }

  /** Decode once, share everywhere */
  static get instance(): LuminanceMap {
    if (!LuminanceMap.singleton) LuminanceMap.singleton = new LuminanceMap();
    return LuminanceMap.singleton;
  }

  /** Brightness 0..1 at normalized (u, v); u wraps so the map can scroll horizontally */
  at(u: number, v: number): number {
    u = ((u % 1) + 1) % 1;
    const x = Math.min(LUMINANCE_WIDTH - 1, (u * LUMINANCE_WIDTH) | 0);
    const y = Math.min(LUMINANCE_HEIGHT - 1, Math.max(0, (v * LUMINANCE_HEIGHT) | 0));
    return this.data[y * LUMINANCE_WIDTH + x] / 255;
  }
}
