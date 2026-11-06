// Early access application form. On submit it checks every required field (native validation), then POSTs the
// email and Mac details as JSON to EARLY_ACCESS_ENDPOINT and reports the result in the form's status line.
import { EARLY_ACCESS_ENDPOINT } from "../config/software";

export class EarlyAccessForm {
  private readonly button: HTMLButtonElement;
  private readonly status: HTMLElement;
  private readonly idleLabel: string;

  constructor(private readonly form: HTMLFormElement) {
    this.button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    this.status = form.querySelector<HTMLElement>("[data-ref=status]")!;
    this.idleLabel = this.button.textContent ?? "";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submit();
    });
  }

  /** Validate, send, then show success (and clear the form) or an error */
  private async submit(): Promise<void> {
    if (!this.form.reportValidity()) return;
    this.setBusy(true);
    try {
      const response = await fetch(EARLY_ACCESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.payload()),
      });
      if (!response.ok) throw new Error(`Early access request failed: ${response.status}`);
      this.form.reset();
      this.showStatus("Thanks! We'll email you if you're selected.", false);
    } catch (error) {
      console.error(error);
      this.showStatus("Something went wrong. Please try again.", true);
    } finally {
      this.setBusy(false);
    }
  }

  /** Map form fields to the backend's field names */
  private payload(): Record<string, string> {
    const data = new FormData(this.form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    return {
      user_email: field("email"),
      user_mac_model: field("model"),
      user_mac_chip: field("chip"),
      user_mac_memory: field("memory"),
    };
  }

  /** Lock the button while the request is in flight */
  private setBusy(busy: boolean): void {
    this.button.disabled = busy;
    this.button.textContent = busy ? "Sending…" : this.idleLabel;
  }

  private showStatus(message: string, isError: boolean): void {
    this.status.textContent = message;
    this.status.classList.toggle("error", isError);
  }
}
