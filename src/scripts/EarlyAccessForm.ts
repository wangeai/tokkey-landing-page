// Reserve email form (homepage #reserve). On submit it checks the email (native validation), POSTs it alone as JSON
// to EARLY_ACCESS_ENDPOINT, then redirects to the shop; failures show in the form's status line. nudge() flags the
// empty email field (shake) when a reserve CTA brings the visitor here.
import { EARLY_ACCESS_ENDPOINT, SHOP_URL } from "../config/reserve";

export class EarlyAccessForm {
  /** Class that shakes the field (styles: ReserveEmail.astro) */
  private static readonly NUDGE_CLASS = "is-nudged";
  private readonly input: HTMLInputElement;
  private readonly button: HTMLButtonElement;
  private readonly status: HTMLElement;
  private readonly idleLabel: string;

  constructor(private readonly form: HTMLFormElement) {
    this.input = form.querySelector<HTMLInputElement>("input[name=email]")!;
    // Typing clears the reminder
    this.input.addEventListener("input", () => this.input.classList.remove(EarlyAccessForm.NUDGE_CLASS));
    this.button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    this.status = form.querySelector<HTMLElement>("[data-ref=status]")!;
    this.idleLabel = this.button.textContent ?? "";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submit();
    });
  }

  /** Remind the visitor to enter their email with a shake (restarted on every call); skipped once filled */
  nudge(): void {
    if (this.input.value) return;
    this.input.classList.remove(EarlyAccessForm.NUDGE_CLASS);
    void this.input.offsetWidth; // reflow so the shake animation plays again
    this.input.classList.add(EarlyAccessForm.NUDGE_CLASS);
  }

  /** Validate, send, then go to the shop (or show an error) */
  private async submit(): Promise<void> {
    if (!this.form.reportValidity()) return;
    this.setBusy(true);
    try {
      const response = await fetch(EARLY_ACCESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: this.email() }),
      });
      if (!response.ok) throw new Error(`Early access request failed: ${response.status}`);
      window.location.href = SHOP_URL;
    } catch (error) {
      console.error(error);
      this.showStatus("Something went wrong. Please try again.");
      this.setBusy(false);
    }
  }

  private email(): string {
    return String(new FormData(this.form).get("email") ?? "").trim();
  }

  /** Lock the button while the request is in flight (and while the shop loads) */
  private setBusy(busy: boolean): void {
    this.button.disabled = busy;
    this.button.textContent = busy ? "Sending…" : this.idleLabel;
  }

  private showStatus(message: string): void {
    this.status.textContent = message;
  }
}
