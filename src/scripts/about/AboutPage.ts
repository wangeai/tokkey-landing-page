// About page controller: builds every scene of the Editions story and drives them from one animation frame loop.
// Mobile (gsap.matchMedia, 768px) shifts the Prometheus painting so the cube stays in frame; pointer effects simply
// idle on touch. Markup: src/pages/about.astro + src/components/about/. Styles: src/styles/about.css.
import { gsap } from "../gsap";
import { ScrollEngine } from "../ScrollEngine";
import { MOBILE_MAX_WIDTH } from "../../config/breakpoints";
import { PrometheusHero } from "./PrometheusHero";
import { AboutIntro } from "./AboutIntro";
import { SceneFx } from "./SceneFx";
import { TornEdge } from "./TornEdge";
import { ChapterHandoff } from "./ChapterHandoff";
import { EmberField } from "./EmberField";
import { BoardMocks } from "./BoardMocks";

export class AboutPage {
  private readonly hero: PrometheusHero;
  private readonly fx: SceneFx[];
  private readonly tears: TornEdge[];
  private readonly handoff: ChapterHandoff;
  private readonly embers: EmberField;

  constructor(root: HTMLElement) {
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    // Lenis must exist before the intro pauses it (start() is idempotent)
    ScrollEngine.instance.start();

    this.hero = new PrometheusHero(q("#hero"));
    new AboutIntro(root, this.hero, q("[data-ref=intro]"), q("[data-ref=dark]"));
    this.fx = [...root.querySelectorAll<HTMLElement>("[data-fx]")].map((s) => new SceneFx(s));
    this.tears = [...root.querySelectorAll<SVGSVGElement>(".tear")].map((svg, i) => new TornEdge(svg, i));
    this.handoff = new ChapterHandoff(root, q("[data-ref=index]"));
    this.embers = new EmberField(q("#cta"), q<HTMLCanvasElement>("#embers"));
    new BoardMocks(root);

    gsap
      .matchMedia()
      .add(`(max-width: ${MOBILE_MAX_WIDTH}px)`, () => this.setMobile(true))
      .add(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`, () => this.setMobile(false));

    requestAnimationFrame((t) => this.frame(t));
  }

  private setMobile(mobile: boolean): void {
    this.hero.mobile = mobile;
    this.hero.layout();
  }

  private frame(time: number): void {
    this.handoff.render();
    this.hero.render(time);
    this.fx.forEach((f) => f.render(time));
    this.tears.forEach((t) => t.render(time));
    this.embers.render();
    requestAnimationFrame((t) => this.frame(t));
  }
}
