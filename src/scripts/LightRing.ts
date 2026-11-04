// "Light guidance" panel: makes the key's light ring breathe, with an occasional bright flash, by animating a blurred
// glow over the photo and the photo's own glow/brightness.
import { gsap } from "./gsap";

export class LightRing {
  private active = false;
  private readonly onTick = (time: number) => this.draw(time);

  constructor(
    private readonly glow: HTMLElement,
    private readonly plate: HTMLElement,
  ) {
    gsap.ticker.add(this.onTick);
  }

  setActive(active: boolean): void {
    this.active = active;
    if (!active) this.glow.style.opacity = "0";
  }

  private draw(time: number): void {
    if (!this.active) return;
    // Slow breathing 0..1 plus a sharp flash that peaks every ~7 s
    const breath = 0.5 + 0.5 * Math.sin(time * 2.1);
    const flash = Math.pow(Math.max(0, Math.sin(time * 0.9 + 1)), 24);
    this.glow.style.opacity = String(0.2 + 0.5 * breath + 0.3 * flash);
    this.glow.style.background = `radial-gradient(circle,rgba(255,255,255,${0.5 + 0.4 * breath}),rgba(190,215,255,${0.18 * breath}) 45%,rgba(255,255,255,0) 70%)`;
    this.plate.style.filter =
      `drop-shadow(0 30px 50px rgba(0,0,0,.6)) ` +
      `drop-shadow(0 0 ${8 + 34 * breath + 30 * flash}px rgba(255,255,255,${0.12 + 0.5 * breath + 0.35 * flash})) ` +
      `brightness(${(0.92 + 0.2 * breath + 0.35 * flash).toFixed(3)})`;
  }
}
