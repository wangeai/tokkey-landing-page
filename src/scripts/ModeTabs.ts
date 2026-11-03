// "With Tokkey / Without Tokkey" pill toggle. Clicking a button marks it active and writes the mode to `data-mode`
// on `target` (CSS slides the white thumb behind the active button and swaps mode-specific content); listeners get the new mode.
export type TokkeyMode = "with" | "without";

export class ModeTabs {
  private readonly buttons: HTMLButtonElement[];
  private readonly listeners: ((mode: TokkeyMode) => void)[] = [];
  mode: TokkeyMode = "with";

  constructor(
    root: HTMLElement,
    /** Element that carries data-mode for CSS (defaults to the tabs themselves) */
    private readonly target: HTMLElement = root,
  ) {
    this.buttons = [...root.querySelectorAll<HTMLButtonElement>("button[data-mode]")];
    this.buttons.forEach((button) => button.addEventListener("click", () => this.set(button.dataset.mode as TokkeyMode)));
    this.set(this.mode);
  }

  /** Subscribe to mode changes */
  onChange(listener: (mode: TokkeyMode) => void): void {
    this.listeners.push(listener);
  }

  /** Activate `mode`: update the buttons and thumb, then notify listeners (unless `notify` is false) */
  set(mode: TokkeyMode, notify = true): void {
    this.mode = mode;
    this.target.dataset.mode = mode;
    this.buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    if (notify) this.listeners.forEach((listener) => listener(mode));
  }
}
