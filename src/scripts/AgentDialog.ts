// The agent UI's time-based loop (markup: src/components/PrivateAgent.astro, prototype `#p0` script): idle → summon →
// type the question → think → answer line by line → done, then again. The state is a class on the stage that the CSS
// reacts to; the two slogans take turns, and the ring around the screen turns and glows harder while the agent works.
import { gsap } from "./gsap";

type DialogState = "idle" | "summon" | "type" | "think" | "answer" | "done";

export class AgentDialog {
  private static readonly STATES: DialogState[] = ["idle", "summon", "type", "think", "answer", "done"];
  /** Ring glow (0..1) each state eases toward */
  private static readonly GLOW: Record<DialogState, number> = {
    idle: 0.45,
    summon: 0.7,
    type: 0.7,
    think: 0.9,
    answer: 0.9,
    done: 0.5,
  };
  /** Ring turn speed, degrees per second */
  private static readonly SPIN = 36;

  private readonly typed: HTMLElement;
  private readonly question: string;
  private readonly lines: HTMLElement[];
  private readonly slogans: HTMLElement[];
  /** Bumped to cancel the running loop */
  private run = 0;
  private playing = false;
  private state: DialogState = "idle";
  private glow = 0.5;
  private angle = 0;
  private readonly tick = (_time: number, deltaTime: number) => this.light(deltaTime);

  constructor(private readonly stage: HTMLElement) {
    const question = stage.querySelector<HTMLElement>("[data-ref=question]")!;
    this.typed = question.querySelector<HTMLElement>("[data-ref=typed]")!;
    this.question = question.dataset.text ?? "";
    this.lines = [...stage.querySelectorAll<HTMLElement>("[data-ref=line]")];
    this.slogans = [...stage.querySelectorAll<HTMLElement>("[data-ref=slogan]")];
  }

  /** Start looping (no-op if already playing) */
  start(): void {
    if (this.playing) return;
    this.playing = true;
    gsap.ticker.add(this.tick);
    void this.loop();
  }

  /** Stop and go back to idle, so the next start plays from the top */
  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    this.run++;
    gsap.ticker.remove(this.tick);
    this.reset();
    this.setState("idle");
    this.showSlogan(0);
  }

  /** Reduced motion: the finished answer, held still */
  showFinal(): void {
    this.typed.textContent = this.question;
    this.lines.forEach((line) => line.classList.add("in"));
    this.setState("done");
    this.showSlogan(0);
    this.stage.style.setProperty("--glow", "0.6");
  }

  private async loop(): Promise<void> {
    const id = ++this.run;
    try {
      while (id === this.run) {
        this.reset();
        this.setState("idle");
        this.showSlogan(0);
        await this.wait(1400, id);
        this.setState("summon");
        this.showSlogan(1);
        await this.wait(900, id);
        this.setState("type");
        await this.type(id);
        await this.wait(500, id);
        this.setState("think");
        await this.wait(1600, id);
        this.setState("answer");
        for (let i = 0; i < this.lines.length; i++) {
          await this.wait(i ? 420 : 650, id);
          this.lines[i].classList.add("in");
        }
        await this.wait(1300, id);
        this.setState("done");
        this.showSlogan(0);
        await this.wait(4200, id);
      }
    } catch {
      // Cancelled by stop()
    }
  }

  /** Type the question letter by letter, pausing a little longer on spaces (prototype timing) */
  private async type(id: number): Promise<void> {
    const text = this.question;
    for (let i = 1; i <= text.length; i++) {
      this.typed.textContent = text.slice(0, i);
      const space = text.charAt(i - 1) === " ";
      await this.wait(34 + (space ? 60 : 0) + ((i * 7) % 3) * 14, id);
    }
  }

  /** Resolves after `ms`, or rejects if the loop was cancelled meanwhile */
  private wait(ms: number, id: number): Promise<void> {
    return new Promise((resolve, reject) => window.setTimeout(() => (id === this.run ? resolve() : reject()), ms));
  }

  private reset(): void {
    this.typed.textContent = "";
    this.lines.forEach((line) => line.classList.remove("in"));
  }

  private setState(state: DialogState): void {
    this.state = state;
    this.stage.classList.remove(...AgentDialog.STATES.map((s) => `ag-${s}`));
    this.stage.classList.add(`ag-${state}`);
  }

  private showSlogan(index: number): void {
    this.slogans.forEach((slogan, i) => slogan.classList.toggle("off", i !== index));
  }

  /** Turn the ring and ease its glow toward the current state's */
  private light(deltaTime: number): void {
    const dt = Math.min(0.1, deltaTime / 1000);
    this.glow += (AgentDialog.GLOW[this.state] - this.glow) * Math.min(1, dt * 1.2);
    this.angle = (this.angle + AgentDialog.SPIN * dt) % 360;
    this.stage.style.setProperty("--angle", `${this.angle.toFixed(1)}deg`);
    this.stage.style.setProperty("--glow", this.glow.toFixed(3));
  }
}
