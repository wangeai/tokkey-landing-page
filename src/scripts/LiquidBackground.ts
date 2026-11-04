// Slow grey "liquid metal" backdrop: a domain-warped fBm noise fragment shader on a low-res WebGL canvas
// (CSS scales it up). Renders at ~30 fps and only while `setActive(true)`. Does nothing if WebGL is unavailable.
import { gsap } from "./gsap";

const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const FRAGMENT = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;uniform float T;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=uv*vec2(R.x/R.y,1.)*.85;float t=T*.035;
vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t));
vec2 r=vec2(fbm(p+2.4*q+vec2(1.7,9.2)+t*1.2),fbm(p+2.4*q+vec2(8.3,2.8)-t));
float v=fbm(p+2.6*r);v=smoothstep(.3,.7,v);
float lo=uv.x*.55+uv.y*.45;v=clamp(v*(.5+.75*lo)-.1,0.,1.);
vec3 c=mix(vec3(0.,0.,0.),vec3(.06,.06,.07),smoothstep(.0,.3,v));
c=mix(c,vec3(.22,.23,.25),smoothstep(.22,.5,v));
c=mix(c,vec3(.58,.6,.64),smoothstep(.5,.76,v));
c=mix(c,vec3(.95,.96,.98),smoothstep(.76,.98,v));
gl_FragColor=vec4(c+(h(gl_FragCoord.xy+T)-.5)*.045,1.);}`;

/** Canvas resolution relative to the viewport */
const SCALE = 0.4;
/** Minimum time between frames (ms) */
const FRAME_INTERVAL = 33;

export class LiquidBackground {
  private readonly gl: WebGLRenderingContext | null;
  private resolution: WebGLUniformLocation | null = null;
  private timeUniform: WebGLUniformLocation | null = null;
  private active = false;
  private lastFrame = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!this.gl || !this.setup(this.gl)) return;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    gsap.ticker.add((time) => this.draw(time));
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  /** Compile the shaders and upload a full-screen quad; false if linking failed */
  private setup(gl: WebGLRenderingContext): boolean {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    this.resolution = gl.getUniformLocation(program, "R");
    this.timeUniform = gl.getUniformLocation(program, "T");
    return true;
  }

  private resize(): void {
    this.canvas.width = Math.max(2, Math.round(window.innerWidth * SCALE));
    this.canvas.height = Math.max(2, Math.round(window.innerHeight * SCALE));
    this.gl!.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private draw(time: number): void {
    const now = time * 1000;
    if (!this.active || now - this.lastFrame < FRAME_INTERVAL) return;
    this.lastFrame = now;
    const gl = this.gl!;
    gl.uniform2f(this.resolution, this.canvas.width, this.canvas.height);
    // +20 s skips the shader's uniform-looking start
    gl.uniform1f(this.timeUniform, time + 20);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
