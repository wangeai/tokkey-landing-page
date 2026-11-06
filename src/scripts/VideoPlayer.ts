// Draws frames from any VideoSequence onto one <canvas> with WebGL, fitted like CSS object-fit, and repaints on resize.
// Each video frame is packed: color in the top half, alpha as grayscale in the bottom half; the shader recombines them.
import type { VideoSequence } from "./VideoSequence";

export type FrameFit = "cover" | "contain";

const VERTEX_SHADER = `
  attribute vec2 position;
  // Frame rectangle in clip space: x, y (bottom-left corner), width, height
  uniform vec4 rect;
  varying vec2 uv;
  void main() {
    gl_Position = vec4(rect.xy + position * rect.zw, 0.0, 1.0);
    // Texture rows run top-down, clip space bottom-up
    uv = vec2(position.x, 1.0 - position.y);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D frame;
  varying vec2 uv;
  void main() {
    vec3 color = texture2D(frame, vec2(uv.x, uv.y * 0.5)).rgb;
    float alpha = texture2D(frame, vec2(uv.x, 0.5 + uv.y * 0.5)).r;
    // The canvas expects premultiplied alpha
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

export class VideoPlayer {
  private readonly gl: WebGLRenderingContext;
  private readonly rectUniform: WebGLUniformLocation;
  private readonly resizeObserver: ResizeObserver;
  private current: { sequence: VideoSequence; index: number; fit: FrameFit } | null = null;
  /** Sequence and frame in the texture, null before the first upload */
  private uploaded: { sequence: VideoSequence; index: number } | null = null;
  /** Vertical shift of the drawn frame (CSS px, + = down) */
  private offsetY = 0;
  /** Callers of whenPainted() waiting for the current sequence's first frame to be painted */
  private paintWaiters: (() => void)[] = [];

  constructor(
    readonly canvas: HTMLCanvasElement,
    /** Cap on devicePixelRatio to limit canvas memory on phones */
    private readonly maxDpr = 2,
  ) {
    this.gl = canvas.getContext("webgl", { premultipliedAlpha: true })!;
    this.rectUniform = this.createProgram();
    this.createQuad();
    this.createTexture();
    // Keep the canvas backing store in sync with its CSS size
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Shift the frame down by `y` CSS px and repaint. Done in the draw instead of a CSS transform: transforming the
   *  canvas while it redraws every frame made playback choppy */
  setOffsetY(y: number): void {
    if (y === this.offsetY) return;
    this.offsetY = y;
    this.render();
  }

  /** Show frame `index` of `sequence`; skips work if that exact frame is already on screen */
  draw(sequence: VideoSequence, index: number, fit: FrameFit = "cover"): void {
    const frame = Math.round(index);
    const fitChanged = this.current?.fit !== fit;
    this.current = { sequence, index: frame, fit };
    if (this.uploaded?.sequence === sequence && this.uploaded.index === frame) {
      if (fitChanged) this.render();
      return;
    }
    sequence.seek(frame, () => this.upload(sequence, frame));
  }

  /** Resolves once the canvas shows a frame of the sequence last passed to draw(). A seek is async, so until then
   *  the canvas still holds whatever it drew before */
  whenPainted(): Promise<void> {
    if (this.uploaded && this.uploaded.sequence === this.current?.sequence) return Promise.resolve();
    return new Promise((resolve) => this.paintWaiters.push(resolve));
  }

  /** Copy the video's decoded frame into the texture and paint it, unless another frame was asked for meanwhile */
  private upload(sequence: VideoSequence, index: number): void {
    if (this.current?.sequence !== sequence || this.current.index !== index) return;
    const { gl } = this;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sequence.video);
    this.uploaded = { sequence, index };
    this.render();
    this.paintWaiters.splice(0).forEach((resolve) => resolve());
  }

  /** Paint the texture fitted to the canvas */
  private render(): void {
    const { gl } = this;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.uploaded || !this.current) return;

    const { video } = this.uploaded.sequence;
    // The visible frame is the top half of the packed video
    const frameWidth = video.videoWidth;
    const frameHeight = video.videoHeight / 2;
    const { width: cw, height: ch } = this.canvas;
    const pick = this.current.fit === "cover" ? Math.max : Math.min;
    const scale = pick(cw / frameWidth, ch / frameHeight);
    const w = frameWidth * scale;
    const h = frameHeight * scale;
    const dy = this.offsetY * (ch / this.canvas.clientHeight || 1);
    // Top-down canvas px -> clip space
    const left = (cw - w) / 2;
    const bottom = ch - ((ch - h) / 2 + dy + h);
    gl.uniform4f(this.rectUniform, (left / cw) * 2 - 1, (bottom / ch) * 2 - 1, (w / cw) * 2, (h / ch) * 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // Resizing clears the canvas, so repaint what was showing
    this.render();
  }

  /** Compile and link the shaders; returns the `rect` uniform */
  private createProgram(): WebGLUniformLocation {
    const { gl } = this;
    const program = gl.createProgram()!;
    for (const [type, source] of [
      [gl.VERTEX_SHADER, VERTEX_SHADER],
      [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
    ] as const) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    // The quad's corners feed `position` at attribute 0
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);
    return gl.getUniformLocation(program, "rect")!;
  }

  /** A unit square, stretched onto the frame rectangle by the vertex shader */
  private createQuad(): void {
    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  /** The texture holding the current frame; video sizes aren't powers of two, so no mipmaps or repeat */
  private createTexture(): void {
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
}
