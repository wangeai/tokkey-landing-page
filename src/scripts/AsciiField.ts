// Animated ASCII glyph field on a <canvas>: each grid cell maps an intensity (0..1) to a character ramp.
// Scenes supply the intensity function; this class owns sizing, the render loop, and visibility.
import { gsap } from "./gsap";

/** Characters from dim to bright; index 0 (space) is never drawn */
const RAMP = " .·:-=+*";

export interface AsciiCell {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Seconds since page load */
  time: number;
}

export interface AsciiFieldOptions {
  /** Intensity 0..1 for a cell */
  sample: (cell: AsciiCell) => number;
  /** Optional extra alpha (0..1) per cell, e.g. to cut a hole; returning 0 skips the cell */
  mask?: (cell: AsciiCell) => number;
  /** Optional area to limit drawing to (CSS px), for fields that only cover part of the canvas */
  bounds?: (width: number, height: number) => { x1: number; y1: number; x2: number; y2: number };
  color?: string;
  /** Glyph alpha = min(maxAlpha, baseAlpha + level * stepAlpha) */
  baseAlpha?: number;
  stepAlpha?: number;
  maxAlpha?: number;
  /** Optional cell and glyph size (CSS px) for a canvas `width`; defaults to 11×17 cells with 12px glyphs (9×14 / 10px
   *  below 700px) */
  grid?: (width: number) => AsciiGrid;
}

export interface AsciiGrid {
  cellWidth: number;
  cellHeight: number;
  fontSize: number;
}

export class AsciiField {
  private readonly ctx: CanvasRenderingContext2D;
  private visibility = 0;
  private tick = 0;
  private cleared = true;
  private readonly onTick = () => this.draw();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: AsciiFieldOptions,
  ) {
    this.ctx = canvas.getContext("2d")!;
    gsap.ticker.add(this.onTick);
  }

  /** 0 hides the field (and stops drawing), 1 is full strength */
  setVisibility(value: number): void {
    this.visibility = value;
  }

  private draw(): void {
    if (this.visibility < 0.01) {
      if (!this.cleared) this.clear();
      return;
    }
    // Half frame rate is plenty for this effect and halves the cost
    if (this.tick++ & 1) return;
    this.cleared = false;

    const { width, height } = this.resize();
    const { sample, mask, bounds, grid, color = "#dbe9ff", baseAlpha = 0.16, stepAlpha = 0.1, maxAlpha = 0.9 } = this.options;
    const { cellWidth: cellW, cellHeight: cellH, fontSize } = grid?.(width) ?? AsciiField.defaultGrid(width);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px "Commit Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;

    // Grid stays aligned to the full canvas even when only a sub-area is drawn
    const area = bounds?.(width, height) ?? { x1: 0, y1: 0, x2: width, y2: height };
    const cell: AsciiCell = { x: 0, y: 0, width, height, time: performance.now() / 1000 };
    for (let y = Math.ceil(Math.max(0, area.y1) / cellH) * cellH + cellH / 2; y < Math.min(height, area.y2); y += cellH) {
      for (let x = Math.ceil(Math.max(0, area.x1) / cellW) * cellW + cellW / 2; x < Math.min(width, area.x2); x += cellW) {
        cell.x = x;
        cell.y = y;
        const cut = mask ? mask(cell) : 1;
        if (cut <= 0) continue;
        const level = Math.min(7, Math.floor(sample(cell) * 8));
        if (level < 1) continue;
        ctx.globalAlpha = Math.min(maxAlpha, baseAlpha + level * stepAlpha) * this.visibility * cut;
        ctx.fillText(RAMP[level], x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Grid used when a field doesn't pass its own: smaller cells on narrow canvases */
  private static defaultGrid(width: number): AsciiGrid {
    const small = width < 700;
    return { cellWidth: small ? 9 : 11, cellHeight: small ? 14 : 17, fontSize: small ? 10 : 12 };
  }

  /** Match the backing store to CSS size (DPR capped at 2); returns CSS-pixel size */
  private resize(): { width: number; height: number } {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(width * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  private clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cleared = true;
  }

  destroy(): void {
    gsap.ticker.remove(this.onTick);
  }
}
