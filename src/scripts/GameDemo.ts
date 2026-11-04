// Game demo in the features section: a big canvas plays the picked game, a row of thumbnail buttons plays all of them.
// Only draws while `setActive(true)` (the section is on screen and its first panel is showing).
import { GAME_THUMB, GAME_VIEW, GAMES } from "../config/games";
import { gsap } from "./gsap";

export class GameDemo {
  private readonly view: CanvasRenderingContext2D;
  private readonly thumbs: { button: HTMLButtonElement; ctx: CanvasRenderingContext2D }[];
  private readonly titles: HTMLElement[];
  private current = 0;
  private active = false;
  private readonly onTick = (time: number) => this.draw(time);

  constructor(root: HTMLElement) {
    this.view = root.querySelector<HTMLCanvasElement>("[data-game-view]")!.getContext("2d")!;
    this.titles = [...root.querySelectorAll<HTMLElement>("[data-game-title]")];
    this.thumbs = [...root.querySelectorAll<HTMLButtonElement>("[data-game]")].map((button) => ({
      button,
      ctx: button.querySelector("canvas")!.getContext("2d")!,
    }));
    this.thumbs.forEach(({ button }, i) => button.addEventListener("click", () => this.pick(i)));
    this.pick(0);
    gsap.ticker.add(this.onTick);
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  /** Play game `index` in the big view and highlight its thumbnail */
  pick(index: number): void {
    this.current = index;
    this.thumbs.forEach(({ button }, i) => button.setAttribute("aria-pressed", String(i === index)));
    this.titles.forEach((title) => (title.textContent = GAMES[index].name));
  }

  private draw(time: number): void {
    if (!this.active) return;
    GAMES[this.current].draw(this.view, GAME_VIEW.width, GAME_VIEW.height, time);
    // Offset each thumbnail in time so they don't all show the same moment of their loop
    this.thumbs.forEach(({ ctx }, i) => GAMES[i].draw(ctx, GAME_THUMB.width, GAME_THUMB.height, time + i * 3));
  }
}
