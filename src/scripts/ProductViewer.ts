// Three.js viewer for the 3D Tokkey key (ported from the standalone "tokkey-preview" viewer): studio HDRI lighting,
// tuned metal finishes, drag to orbit, auto-rotate, clay mode, explode / assemble. Renders on a transparent
// canvas (the page's background shows through) only while active.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "./gsap";
import { ProductExplode, type ExplodeTable } from "./ProductExplode";
import {
  DEFAULT_TUNE,
  MATERIAL_TUNES,
  NO_SHADOW_MATERIALS,
  PART_TUNES,
  PRODUCT_MODEL,
  type MaterialTune,
} from "../config/productModel";

/** A material's own finish, restored when clay mode turns off */
interface SavedFinish {
  color: number;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  transmission: number;
  transparent: boolean;
  depthWrite: boolean;
  side: THREE.Side;
}

export interface ViewerOptions {
  /** Cap on devicePixelRatio (the glass transmission pass renders the scene twice) */
  maxDpr: number;
  /** Phones: orbit around the vertical axis only, so vertical swipes still scroll the page */
  turntable: boolean;
  /** Scales the framed model (1 = fits like the standalone viewer, >1 = closer) */
  zoom: number;
  /** Called when the user starts dragging (auto-rotate has just turned off) */
  onDragStart?: () => void;
}

export class ProductViewer {
  private static readonly FOV = 38;
  /** Studio three-quarter view, slightly above and in front */
  private static readonly VIEW_DIR = new THREE.Vector3(0.82, 0.4, 0.41).normalize();
  /** Look-at height as a share of the model height */
  private static readonly TARGET_Y = 0.43;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(ProductViewer.FOV, 1, 0.01, 500);
  private readonly controls: OrbitControls;
  private readonly lights = {
    key: new THREE.DirectionalLight(0xffffff, 2.4),
    fill: new THREE.DirectionalLight(0xf2f4f7, 1.1),
    rim: new THREE.DirectionalLight(0xffffff, 1.4),
  };
  /** Every tuned material with its finish, for clay mode */
  private readonly finishes = new Map<THREE.MeshStandardMaterial, SavedFinish>();
  private readonly resizeObserver: ResizeObserver;
  private readonly tick = () => this.render();
  private model: THREE.Object3D | null = null;
  private explode: ProductExplode | null = null;
  /** Current content size (grows while exploded) and the assembled height lights are placed from */
  private readonly size = new THREE.Vector3();
  private lightRefHeight = 0;
  private active = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: ViewerOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Shadows only change when parts move, so redraw the shadow map on demand
    this.renderer.shadowMap.autoUpdate = false;
    this.controls = this.createControls();
    this.addLights();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Load the HDRI, model and explode table; resolves when the model can be shown */
  async load(): Promise<void> {
    const [, gltf, table] = await Promise.all([
      this.loadEnvironment(),
      new GLTFLoader().loadAsync(PRODUCT_MODEL.modelUrl),
      fetch(PRODUCT_MODEL.explodeUrl)
        .then((r) => (r.ok ? (r.json() as Promise<ExplodeTable>) : null))
        .catch(() => null),
    ]);
    this.model = gltf.scene;
    this.applyMaterials(this.model);
    const scale = this.normalize(this.model);
    this.scene.add(this.model);
    if (table) this.explode = this.createExplode(this.model, table, scale);
    this.layout();
    this.fit(true);
  }

  /** Whether explode / assemble is available (the table loaded) */
  get canExplode(): boolean {
    return this.explode !== null;
  }

  /** Render (and auto-rotate) only while the viewer is on screen */
  setActive(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    if (active) gsap.ticker.add(this.tick);
    else gsap.ticker.remove(this.tick);
  }

  /** Explode or assemble; returns whether the model is now exploding */
  toggleExplode(): boolean {
    if (!this.explode) return false;
    this.explode.toggle(performance.now());
    // Hold still while looking at the parts
    this.controls.autoRotate = false;
    return this.explode.exploded;
  }

  /** Back to the default three-quarter view */
  resetView(): void {
    this.fit(true);
  }

  get autoRotate(): boolean {
    return this.controls.autoRotate;
  }

  set autoRotate(on: boolean) {
    this.controls.autoRotate = on;
  }

  /** Clay mode: every part plain matte white, to look at the form without the finishes */
  setClay(on: boolean): void {
    for (const [material, finish] of this.finishes) {
      const clay = on ? ProductViewer.CLAY : finish;
      material.color.setHex(clay.color);
      material.metalness = clay.metalness;
      material.roughness = clay.roughness;
      material.envMapIntensity = clay.envMapIntensity;
      if (material instanceof THREE.MeshPhysicalMaterial) material.transmission = clay.transmission;
      material.transparent = clay.transparent;
      material.depthWrite = clay.depthWrite;
      material.side = clay.side;
      material.needsUpdate = true;
    }
  }

  /** Everything back to how it first appears: assembled, default view, auto-rotating, real finishes */
  resetAll(): void {
    this.explode?.reset();
    this.layout();
    this.setClay(false);
    this.controls.autoRotate = true;
    this.fit(true);
  }

  destroy(): void {
    this.setActive(false);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.85;
    // The wheel and touch drags scroll the page
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.maxPolarAngle = Math.PI * 0.92;
    if (this.options.turntable) {
      const polar = Math.acos(ProductViewer.VIEW_DIR.y);
      controls.minPolarAngle = controls.maxPolarAngle = polar;
      // OrbitControls sets "none"; let vertical swipes scroll, horizontal ones turn the model
      this.canvas.style.touchAction = "pan-y";
    }
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      this.options.onDragStart?.();
    });
    return controls;
  }

  /** Clay mode finish */
  private static readonly CLAY: SavedFinish = {
    color: 0xf2f3f5,
    metalness: 0,
    roughness: 0.85,
    envMapIntensity: 0.6,
    transmission: 0,
    transparent: false,
    depthWrite: true,
    side: THREE.FrontSide,
  };

  /** Soft studio lighting: big key light, side fill, rim from behind */
  private addLights(): void {
    const { key, fill, rim } = this.lights;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.01;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.002;
    this.scene.add(key, key.target, fill, rim, new THREE.AmbientLight(0xffffff, 0.25));
  }

  /** Metal reads from reflections: use the studio HDRI, or a generated room if it fails to load */
  private async loadEnvironment(): Promise<void> {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    try {
      const hdr = await new HDRLoader().loadAsync(PRODUCT_MODEL.hdrUrl);
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = pmrem.fromEquirectangular(hdr).texture;
      // Turns the main softbox to the camera side (picked by measuring the body's median brightness)
      this.scene.environmentRotation.set(0, 3, 0);
      hdr.dispose();
    } catch {
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environmentIntensity = 0.9;
    }
    pmrem.dispose();
  }

  /** Replace the GLB's default grey with the tuned finishes */
  private applyMaterials(root: THREE.Object3D): void {
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.frustumCulled = false;
      const materials: THREE.MeshStandardMaterial[] = Array.isArray(o.material) ? o.material : [o.material];
      const noShadow = materials.some((m) => NO_SHADOW_MATERIALS.has(m.name));
      o.castShadow = o.receiveShadow = !noShadow;
      const partTune = PART_TUNES[o.name];
      const tuned = materials.map((m) => {
        const tune = partTune ?? MATERIAL_TUNES[m.name] ?? DEFAULT_TUNE;
        // GLB materials are shared by many parts, so part overrides need their own copy
        return tune.glass ? ProductViewer.glassMaterial(tune, m.name) : ProductViewer.tune(partTune ? m.clone() : m, tune);
      });
      o.material = Array.isArray(o.material) ? tuned : tuned[0];
      for (const m of tuned) if (!this.finishes.has(m)) this.finishes.set(m, ProductViewer.finishOf(m));
    });
  }

  private static tune(material: THREE.MeshStandardMaterial, tune: MaterialTune): THREE.MeshStandardMaterial {
    material.color.setHex(tune.color);
    material.metalness = tune.metalness;
    material.roughness = tune.roughness;
    material.envMapIntensity = tune.envMapIntensity;
    material.needsUpdate = true;
    return material;
  }

  private static finishOf(m: THREE.MeshStandardMaterial): SavedFinish {
    return {
      color: m.color.getHex(),
      metalness: m.metalness,
      roughness: m.roughness,
      envMapIntensity: m.envMapIntensity,
      transmission: m instanceof THREE.MeshPhysicalMaterial ? m.transmission : 0,
      transparent: m.transparent,
      depthWrite: m.depthWrite,
      side: m.side,
    };
  }

  /** The clear top plate needs a physical material for transmission */
  private static glassMaterial(tune: MaterialTune, name: string): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color: tune.color,
      metalness: tune.metalness,
      roughness: tune.roughness,
      envMapIntensity: tune.envMapIntensity,
      transmission: 1,
      ...tune.glass,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    material.name = name;
    return material;
  }

  /**
   * Bake every node transform into the vertices and scale to display size: the FBX-exported GLB nests 0.001 scales,
   * which would otherwise stack with ours and break the bounding boxes. Returns the scale applied.
   */
  private normalize(root: THREE.Object3D): number {
    root.updateMatrixWorld(true);
    const raw = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    const scale = PRODUCT_MODEL.displaySize / Math.max(raw.x, raw.y, raw.z);
    const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.applyMatrix4(o.matrixWorld).applyMatrix4(scaleMatrix);
        o.geometry.computeBoundingBox();
        o.geometry.computeBoundingSphere();
      }
    });
    root.traverse((o) => {
      o.position.set(0, 0, 0);
      o.quaternion.identity();
      o.scale.set(1, 1, 1);
    });
    this.lightRefHeight = this.contentBox().getSize(new THREE.Vector3()).y;
    return scale;
  }

  private createExplode(root: THREE.Object3D, table: ExplodeTable, scale: number): ProductExplode | null {
    const parts: ConstructorParameters<typeof ProductExplode>[0] = [];
    root.traverse((o) => {
      const offset = (o as THREE.Mesh).isMesh ? table.objects[o.name] : undefined;
      if (offset) parts.push({ mesh: o, offset: new THREE.Vector3(...offset).multiplyScalar(scale), group: table.group_of[o.name] ?? 0 });
    });
    return parts.length ? new ProductExplode(parts) : null;
  }

  /** Model-space box of the content, from geometry boxes plus part offsets (setFromObject walks every vertex) */
  private contentBox(): THREE.Box3 {
    const box = new THREE.Box3();
    const part = new THREE.Box3();
    this.model?.traverse((o) => {
      if (o instanceof THREE.Mesh) box.union(part.copy(o.geometry.boundingBox!).translate(o.position));
    });
    return box;
  }

  /** Center the model on the origin, stand it on y = 0, and scale lights and shadows to its current height */
  private layout(): void {
    if (!this.model) return;
    const box = this.contentBox();
    const center = box.getCenter(new THREE.Vector3());
    this.model.position.set(-center.x, -box.min.y, -center.z);
    box.getSize(this.size);
    const ref = Math.max(this.size.y, this.lightRefHeight);
    const { key, fill, rim } = this.lights;
    key.position.set(ref * 1.4, -ref * 1.8, ref * 2.4);
    fill.position.set(-ref * 2, -ref * 0.8, ref * 0.6);
    rim.position.set(ref * 0.3, ref * 2.2, ref * 1.1);
    key.target.position.set(0, this.size.y * 0.35, 0);
    const ext = Math.max(this.size.y * 0.8, this.size.x * 0.9, ref * 0.8);
    const shadowCam = key.shadow.camera;
    shadowCam.left = shadowCam.bottom = -ext;
    shadowCam.right = shadowCam.top = ext;
    shadowCam.far = ref * 24;
    shadowCam.updateProjectionMatrix();
    this.renderer.shadowMap.needsUpdate = true;
  }

  /**
   * Frame the whole model for the canvas aspect. `resetDirection` returns to the default view; otherwise the user's
   * angle is kept and only distance and look-at follow the model (used while it explodes, so parts stay in frame).
   */
  private fit(resetDirection: boolean): void {
    if (!this.model) return;
    const t = this.explode?.progress ?? 0;
    const height = this.size.y;
    const radius = Math.max(this.size.x, this.size.z) * 0.5;
    // Exploded, the model is ~3x taller: fill a bit more of the frame and look a bit higher
    const fill = 0.68 + 0.1 * t;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const fitDist = Math.max(height / (2 * Math.tan(vFov / 2) * fill), radius / (Math.tan(hFov / 2) * 0.62));
    const dist = fitDist / this.options.zoom;
    const dir = resetDirection ? ProductViewer.VIEW_DIR.clone() : this.camera.position.clone().sub(this.controls.target);
    if (!Number.isFinite(dir.lengthSq()) || dir.lengthSq() < 1e-12) dir.copy(ProductViewer.VIEW_DIR);
    this.controls.target.set(0, height * (ProductViewer.TARGET_Y + 0.06 * t), 0);
    this.camera.position.copy(this.controls.target).add(dir.normalize().multiplyScalar(dist));
    this.camera.near = Math.max(dist * 0.01, 0.001);
    this.camera.far = dist * 60;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.options.maxDpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.fit(false);
    if (this.active) this.renderer.render(this.scene, this.camera);
  }

  private render(): void {
    if (this.explode?.step(performance.now())) {
      this.layout();
      this.fit(false);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
