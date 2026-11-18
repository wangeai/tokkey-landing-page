// Flips an element through a list of fonts, slowing down as it goes, then settles back on its own CSS font
// (prototype hero "Intelligence" intro). Fonts are loaded up front so no step flashes a fallback.
export interface CycleFont {
  family: string;
  style: string;
  weight: string;
  letterSpacing: string;
  /** How long this font shows (ms) */
  hold: number;
}

export class FontCycle {
  /** Wait after the fonts are ready before the first flip (ms) */
  private static readonly START_DELAY = 300;
  /** Letter-spacing ease back to the CSS value at the end */
  private static readonly SETTLE = "letter-spacing .6s cubic-bezier(.25,.46,.45,.94)";
  private timer = 0;
  /** Resolves the promise of the running play() */
  private done: () => void = () => {};

  constructor(
    private readonly el: HTMLElement,
    private readonly fonts: CycleFont[],
  ) {}

  /** Load every font, then run the cycle once; resolves when it settles (or is stopped) */
  async play(): Promise<void> {
    await Promise.all(this.fonts.map((f) => document.fonts.load(`${f.style} ${f.weight} 1em ${f.family}`))).catch(() => {});
    return new Promise((resolve) => {
      this.done = resolve;
      this.timer = window.setTimeout(() => this.step(0), FontCycle.START_DELAY);
    });
  }

  /** Stop and drop back to the CSS font */
  stop(): void {
    window.clearTimeout(this.timer);
    this.settle();
  }

  private step(i: number): void {
    const font = this.fonts[i];
    if (!font) return this.settle();
    Object.assign(this.el.style, {
      fontFamily: font.family,
      fontStyle: font.style,
      fontWeight: font.weight,
      letterSpacing: font.letterSpacing,
      whiteSpace: "nowrap",
    });
    this.timer = window.setTimeout(() => this.step(i + 1), font.hold);
  }

  /** Clear the inline font so the element's own classes apply again, easing the letter-spacing over */
  private settle(): void {
    Object.assign(this.el.style, { transition: FontCycle.SETTLE, fontFamily: "", fontStyle: "", fontWeight: "", letterSpacing: "" });
    this.done();
  }
}
