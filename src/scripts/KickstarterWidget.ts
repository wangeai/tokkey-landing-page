// Floating "Sign up for Kickstarter" button (prototype `#kkw`): opens a small email card; the Kickstarter sticker pops
// in beside the button after 10 s and leaves after 30 s. The form is front-end only for now: a valid email just
// switches the card to its success message.
export class KickstarterWidget {
  /** Delay before the sticker pops in, and how long it stays (ms) */
  private static readonly POP_DELAY = 10_000;
  private static readonly POP_TIME = 30_000;
  private static readonly EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  private readonly toggle: HTMLButtonElement;
  private readonly card: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly error: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    const ref = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-ref=${name}]`)!;
    this.toggle = ref<HTMLButtonElement>("toggle");
    this.card = ref("card");
    this.input = ref<HTMLInputElement>("email");
    this.error = ref("error");

    this.toggle.addEventListener("click", () => this.setOpen(true));
    ref("close").addEventListener("click", () => this.setOpen(false));
    addEventListener("keydown", (event) => event.key === "Escape" && this.setOpen(false));
    ref<HTMLFormElement>("form").addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit();
    });

    const { POP_DELAY, POP_TIME } = KickstarterWidget;
    setTimeout(() => {
      root.classList.add("is-pop");
      setTimeout(() => root.classList.remove("is-pop"), POP_TIME);
    }, POP_DELAY);
  }

  /** Show or hide the card; opening focuses the email field once the card has faded in */
  private setOpen(open: boolean): void {
    this.root.classList.toggle("is-open", open);
    this.toggle.setAttribute("aria-expanded", String(open));
    this.card.inert = !open;
    if (open) setTimeout(() => this.input.focus(), 250);
  }

  private submit(): void {
    if (!KickstarterWidget.EMAIL.test(this.input.value.trim())) {
      this.error.textContent = "Please enter a valid email.";
      return;
    }
    this.error.textContent = "";
    this.card.classList.add("is-done");
  }
}
