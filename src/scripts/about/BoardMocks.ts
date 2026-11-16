// Live UI mocks inside the About boards' tiles. Each `.slot[data-ui=name]` is self-contained (so a real product UI
// can replace any one later) and starts the first time it scrolls into view.
import { AboutMath } from "./PointerTracker";

type Mock = (el: HTMLElement) => void;

export class BoardMocks {
  private static wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
  private static $<T extends Element = HTMLElement>(root: ParentNode, sel: string): T {
    return root.querySelector<T>(sel) as T;
  }
  private static $$<T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] {
    return [...root.querySelectorAll<T>(sel)];
  }

  /** Make `on` the only `.on` button among `buttons` */
  private static select(buttons: Element[], on: Element): void {
    buttons.forEach((x) => x.classList.toggle("on", x === on));
  }

  /** Mock implementations, keyed by data-ui */
  private readonly mocks: Record<string, Mock> = {
    // Assistant types a question and answers on device; caption alternates; menu-bar panel tabs
    "ai-mac": (el) => {
      const { $, $$, wait } = BoardMocks;
      const q = $(el, "[data-q]");
      const a = $(el, "[data-a]");
      const list = $(el, "[data-list]");
      const cap = $(el, "[data-cap]");
      const SCRIPT = [
        {
          q: "“Summarize this week’s meeting notes and list the open actions.”",
          a: "Three actions are still open:",
          items: ["Confirm launch date with retail", "Send pricing draft to finance", "Book the CES booth walkthrough"],
        },
        {
          q: "“Draft a reply to Lena about the Q1 roadmap.”",
          a: "Draft ready, kept on this Mac:",
          items: ["Thanks for the notes on Q1", "Router ships in February", "Happy to walk through it Thursday"],
        },
      ];
      const CAPS = ["Own your <b>intelligence</b>", "Turn your Mac into an <b>AI Mac</b>"];
      const loop = async (k: number): Promise<void> => {
        const s = SCRIPT[k % SCRIPT.length];
        cap.style.opacity = "0";
        await wait(400);
        cap.innerHTML = CAPS[k % CAPS.length];
        cap.style.opacity = "1";
        q.textContent = "";
        a.textContent = "";
        list.innerHTML = "";
        a.parentElement!.hidden = true;
        for (const ch of s.q) {
          q.textContent += ch;
          await wait(AboutMath.reducedMotion ? 0 : 22);
        }
        await wait(500);
        a.parentElement!.hidden = false;
        a.textContent = s.a;
        for (const it of s.items) {
          const li = document.createElement("li");
          li.textContent = it;
          list.appendChild(li);
          await wait(60);
          li.classList.add("in");
          await wait(380);
        }
        await wait(3200);
        void loop(k + 1);
      };
      loop(0);
      const tabs = $$(el, "[data-tab]");
      tabs.forEach((b) =>
        b.addEventListener("click", () => {
          BoardMocks.select(tabs, b);
          $$(el, "[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.tab));
        }),
      );
    },

    // Weights load from disk into memory, then stay
    weights: (el) => {
      const { $, wait } = BoardMocks;
      const bar = $(el, "[data-wbar]");
      const st = $(el, "[data-wstate]");
      const pill = $(el, "[data-wpill]");
      const loop = async (): Promise<void> => {
        bar.style.transition = "none";
        bar.style.width = "0%";
        st.textContent = "Loading into memory…";
        pill.textContent = "On disk";
        pill.className = "pill";
        await wait(60);
        bar.style.transition = "";
        bar.style.width = "100%";
        await wait(1400);
        st.textContent = "Ready · loaded once, stays";
        pill.textContent = "In memory";
        pill.className = "pill ok";
        await wait(4200);
        void loop();
      };
      loop();
    },

    // Setup checklist ticks through
    setup: (el) => {
      const items = BoardMocks.$$(el, "[data-steps] li");
      const loop = async (): Promise<void> => {
        items.forEach((x) => (x.className = ""));
        for (const x of items) {
          x.className = "run";
          await BoardMocks.wait(900);
          x.className = "done";
        }
        await BoardMocks.wait(3600);
        void loop();
      };
      loop();
    },

    // Terminal calls the local endpoint
    endpoint: (el) => {
      const pre = BoardMocks.$(el, "[data-term]");
      const LINES = [
        '<span class="k">$</span> curl localhost:8080/v1/chat/completions \\',
        "    -d '{\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}'",
        "",
        '<span class="ok">200 OK</span> · answered on device · 0 bytes sent out',
      ];
      const loop = async (): Promise<void> => {
        pre.innerHTML = "";
        for (const l of LINES) {
          pre.innerHTML += `${l}\n`;
          await BoardMocks.wait(650);
        }
        await BoardMocks.wait(3800);
        void loop();
      };
      loop();
    },

    // Cloud route switch
    privacy: (el) => {
      const { $ } = BoardMocks;
      const sw = $(el, "[data-sw]");
      const note = $(el, "[data-privnote]");
      const ask = $(el, "[data-ask]");
      $(el, ".sw-row").addEventListener("click", (e) => {
        e.preventDefault();
        const on = sw.getAttribute("aria-checked") !== "true";
        sw.setAttribute("aria-checked", String(on));
        note.textContent = on ? "On, for tasks you approve. Each one is logged." : "Off. Everything stays on this Mac.";
        ask.hidden = !on;
      });
    },

    // Cloud vs Tokkey columns
    compare: (el) => {
      const { $, $$ } = BoardMocks;
      const rows = $(el, "[data-cmp]");
      const cells = $$(rows, "b");
      const sides = $$(el, "[data-side]");
      const show = (side: string) => {
        rows.classList.add("fade");
        setTimeout(() => {
          cells.forEach((b) => (b.textContent = side === "cloud" ? b.dataset.c! : b.dataset.l!));
          rows.classList.remove("fade");
        }, 220);
        BoardMocks.select(sides, sides.find((x) => x.dataset.side === side)!);
      };
      sides.forEach((b) => b.addEventListener("click", () => show(b.dataset.side!)));
      cells.forEach((b) => (b.textContent = b.dataset.c!));
    },

    scorecard: (el) => BoardMocks.$(el, ".score").classList.add("in"),

    density: (el) => {
      BoardMocks.$(el, ".dens").classList.add("in");
      const v = BoardMocks.$(el, "[data-dens]");
      let n = 0;
      const t = setInterval(() => {
        n += 3;
        v.textContent = `${Math.min(n, 72)}%`;
        if (n >= 72) clearInterval(t);
      }, 30);
    },

    // Layers stream from SSD into RAM
    offload: (el) => {
      const { $, wait } = BoardMocks;
      $(el, ".offl").classList.add("in");
      const layers = $(el, "[data-layers]");
      const ready = $(el, "[data-ready]");
      const loop = async (): Promise<void> => {
        for (let i = 0; i <= 36; i += 4) {
          layers.textContent = `${i} / 36`;
          ready.textContent = i < 8 ? "…" : "Yes, streaming the rest";
          await wait(260);
        }
        await wait(2600);
        void loop();
      };
      loop();
    },

    // Tasks pick a route
    route: (el) => {
      const { $, $$ } = BoardMocks;
      const task = $(el, "[data-rtask]");
      const why = $(el, "[data-rwhy]");
      const routes = $$(el, "[data-rt]");
      const T = [
        ["Summarize my meeting notes", "local", "Private file. Kept local."],
        ["Translate a public press release", "cloud", "Public text, and you allowed this model."],
        ["Search my inbox for invoices", "local", "Personal data. Kept local."],
      ];
      let k = 0;
      setInterval(() => {
        k = (k + 1) % T.length;
        task.style.opacity = "0";
        setTimeout(() => {
          task.textContent = T[k][0];
          why.textContent = T[k][2];
          task.style.opacity = "1";
          BoardMocks.select(routes, routes.find((r) => r.dataset.rt === T[k][1])!);
        }, 300);
      }, 3200);
    },

    // A metered bill ticking up
    rent: (el) => {
      const r = BoardMocks.$(el, "[data-rent]");
      const t = BoardMocks.$(el, "[data-renttot]");
      let c = 0;
      setInterval(() => {
        c = c > 38 ? 0 : c + 0.37 + Math.random() * 0.4;
        r.textContent = `$${c.toFixed(2)}`;
        t.textContent = `$${(20 + c).toFixed(2)}`;
      }, 900);
    },

    // Swap models, keep memory
    swap: (el) => {
      const note = BoardMocks.$(el, "[data-swapnote]");
      const buttons = BoardMocks.$$(el, "[data-swap] button");
      buttons.forEach((b) =>
        b.addEventListener("click", () => {
          BoardMocks.select(buttons, b);
          note.textContent = `Switched to ${b.textContent}. Memory and preferences kept.`;
        }),
      );
    },

    // Local / cloud per task
    choose: (el) => {
      const m = BoardMocks.$(el, "[data-chmodel]");
      const buttons = BoardMocks.$$(el, "[data-choose] button");
      buttons.forEach((b, i) =>
        b.addEventListener("click", () => {
          BoardMocks.select(buttons, b);
          m.textContent = i ? "A cloud model you named" : "Qwen 3.5 9B · on device";
        }),
      );
    },

    // What may leave, and a stop button
    boundary: (el) => {
      const btn = BoardMocks.$(el, "[data-stop]");
      const inputs = BoardMocks.$$<HTMLInputElement>(el, "input");
      const reset = () => {
        btn.textContent = "Stop all sharing";
        btn.classList.remove("done");
      };
      btn.addEventListener("click", () => {
        inputs.forEach((x) => (x.checked = false));
        btn.textContent = "Sharing stopped";
        btn.classList.add("done");
        setTimeout(reset, 2400);
      });
      inputs.forEach((x) => x.addEventListener("change", reset));
    },

    // Forget remembered facts
    remember: (el) => {
      const note = BoardMocks.$(el, "[data-memnote]");
      BoardMocks.$$(el, "[data-memlist] button").forEach((b) =>
        b.addEventListener("click", () => {
          const li = b.closest("li")!;
          li.classList.add("gone");
          setTimeout(() => {
            li.remove();
            note.textContent = "Forgotten on this device. Nothing kept elsewhere.";
          }, 300);
        }),
      );
    },
  };

  constructor(root: HTMLElement) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          this.mocks[el.dataset.ui!]?.(el);
        }),
      { threshold: 0.25 },
    );
    root.querySelectorAll(".slot[data-ui]").forEach((s) => io.observe(s));
  }
}
