// Floating "Sign up for Kickstarter" link (prototype `#kkw`): the Kickstarter sticker pops in beside the button after
// 10 s and leaves after 30 s. The link itself jumps to the homepage email box (plain markup, no JS needed).
export class KickstarterWidget {
  /** Delay before the sticker pops in, and how long it stays (ms) */
  private static readonly POP_DELAY = 10_000;
  private static readonly POP_TIME = 30_000;

  constructor(root: HTMLElement) {
    const { POP_DELAY, POP_TIME } = KickstarterWidget;
    setTimeout(() => {
      root.classList.add("is-pop");
      setTimeout(() => root.classList.remove("is-pop"), POP_TIME);
    }, POP_DELAY);
  }
}
