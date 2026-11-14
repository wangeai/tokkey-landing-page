// Micro-interactions inside the software features previews (prototype `#features` script): the Agent Hub tabs switch
// the selected agent, and the "Your workflow" model menu opens/closes and switches between the local and cloud model,
// updating the background API note to match.
import { WORKFLOW_MODELS } from "../config/software";

export class FeaturePreview {
  constructor(private readonly section: HTMLElement) {
    this.setupAgentTabs();
    this.setupModelMenu();
  }

  private ref<T extends HTMLElement = HTMLElement>(name: string): T {
    return this.section.querySelector<T>(`[data-ref=${name}]`)!;
  }

  /** Agent Hub: click or arrow keys pick an agent; the selection row and button follow it */
  private setupAgentTabs(): void {
    const tabs = [...this.section.querySelectorAll<HTMLButtonElement>("[data-ref=agent]")];
    const name = this.ref("agent-name");
    const open = this.ref("agent-open");

    const select = (tab: HTMLButtonElement) => {
      tabs.forEach((other) => {
        const on = other === tab;
        other.classList.toggle("is-on", on);
        other.setAttribute("aria-selected", String(on));
        other.tabIndex = on ? 0 : -1;
      });
      name.textContent = tab.dataset.agent!;
      open.textContent = `Open ${tab.dataset.agent} ↗`;
    };

    // Roving focus: ← → move between tabs, Home/End jump to the ends
    const keys: Record<string, (i: number) => number> = {
      ArrowRight: (i) => (i + 1) % tabs.length,
      ArrowLeft: (i) => (i + tabs.length - 1) % tabs.length,
      Home: () => 0,
      End: () => tabs.length - 1,
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        const next = keys[event.key]?.(i);
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next]);
        tabs[next].focus();
      });
    });
  }

  /** Your workflow: the selector toggles the menu; an option becomes the current model and rewrites the API note */
  private setupModelMenu(): void {
    const toggle = this.ref<HTMLButtonElement>("model-toggle");
    const menu = this.ref("model-menu");
    const options = [...this.section.querySelectorAll<HTMLButtonElement>("[data-ref=model]")];

    toggle.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
    });

    options.forEach((option) =>
      option.addEventListener("click", () => {
        const model = WORKFLOW_MODELS.find((m) => m.id === option.dataset.model)!;
        options.forEach((other) => {
          const on = other === option;
          other.classList.toggle("is-on", on);
          other.setAttribute("aria-pressed", String(on));
        });
        this.ref("model-current").textContent = model.name;
        this.ref("api-name").textContent = model.api;
        this.ref("api-text").textContent = model.apiText;
        this.ref("api-note").textContent = model.apiNote;
      }),
    );
  }
}
