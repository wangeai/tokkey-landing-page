// The 3D Tokkey key shown at the end of the hero (ProductViewer). Ported from the standalone "tokkey-preview" viewer:
// the GLB exports every material as the same default grey, so the real finishes are set here by material name, with
// per-part overrides for the board parts that only show once the model is exploded.

/** Model, studio HDRI and per-part explode offsets (written by the preview's tools/build_explode_table.py) */
export const PRODUCT_MODEL = {
  modelUrl: "/assets/model/product.glb",
  hdrUrl: "/assets/model/studio_small_08_1k.hdr",
  explodeUrl: "/assets/model/explode.json",
  /** The model is scaled so its largest side is this many metres */
  displaySize: 0.075,
} as const;

export interface MaterialTune {
  color: number;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  /** Set only on the clear top plate: switches it to a transmissive physical material */
  glass?: { thickness: number; ior: number; specularIntensity: number };
}

const TUNE = {
  /** Body shell: bead-blasted aluminium, rough enough to read as solid metal */
  body: { color: 0xc2c6cb, metalness: 1, roughness: 0.44, envMapIntensity: 1.3 },
  /** USB insert at the bottom */
  usb: { color: 0x6f7378, metalness: 1, roughness: 0.38, envMapIntensity: 1.35 },
  /** Black lens panel on top */
  lensPanel: { color: 0x0d0f12, metalness: 0.35, roughness: 0.3, envMapIntensity: 1 },
  /** Light print on the top cover (rings / triangle) */
  lensArt: { color: 0xd8dade, metalness: 0.55, roughness: 0.38, envMapIntensity: 1.2 },
  /** TOKKEY lettering */
  text: { color: 0xe8eaed, metalness: 0.6, roughness: 0.3, envMapIntensity: 1.3 },
  /** Internals, hidden by the shell when assembled */
  inner: { color: 0x2a2d31, metalness: 0.2, roughness: 0.75, envMapIntensity: 0.5 },
  /** Matte black PCB; low reflection so flat boards don't wash out to grey at grazing angles */
  pcb: { color: 0x101214, metalness: 0, roughness: 0.88, envMapIntensity: 0.18 },
  /** Anodised black metal (base plate, frames, posts, brackets) */
  blackMetal: { color: 0x3c4147, metalness: 1, roughness: 0.38, envMapIntensity: 1.15 },
  /** Dark print on the silver panel (TOKKEY, FC / CE / RoHS) */
  silkDark: { color: 0x1a1c1f, metalness: 0.2, roughness: 0.55, envMapIntensity: 0.6 },
  /** Rings on the silver panel, one step darker than the panel */
  ringOnSilver: { color: 0x4a4e54, metalness: 0.8, roughness: 0.42, envMapIntensity: 0.9 },
  /** Chips and SMD parts */
  chip: { color: 0xd2d7de, metalness: 0.98, roughness: 0.24, envMapIntensity: 1.5 },
  /** Clear top plate: thin, so refraction doesn't distort the print underneath */
  glass: {
    color: 0xffffff,
    metalness: 0,
    roughness: 0.02,
    envMapIntensity: 0.45,
    glass: { thickness: 0.0012, ior: 1.48, specularIntensity: 0.6 },
  },
} satisfies Record<string, MaterialTune>;

/** Fallback when neither a part nor its material has a preset */
export const DEFAULT_TUNE: MaterialTune = TUNE.body;

/** Material name in the GLB → finish */
export const MATERIAL_TUNES: Record<string, MaterialTune> = {
  金属2: TUNE.body,
  金属1: TUNE.usb,
  OctMetal2: TUNE.lensPanel,
  OctMetal2_0: TUNE.lensArt,
  OctGlossy1: TUNE.text,
  OctDiffuse1: TUNE.inner,
  OctSpecular1: TUNE.glass,
};

/** Mesh name → finish, overriding its material (parts exposed by the explode) */
export const PART_TUNES: Record<string, MaterialTune> = {
  ...Object.fromEntries(["brep_1_55", "brep_1_54", "brep_1_58"].map((n) => [n, TUNE.pcb])),
  ...Object.fromEntries(["brep_1_57", "brep_32", "brep_33"].map((n) => [n, TUNE.chip])),
  ...Object.fromEntries(Array.from({ length: 22 }, (_, i) => [`brep_${34 + i}`, TUNE.chip])),
  // Panel under the top cover goes silver; its rings and print go dark so they stay visible
  brep_1_56: TUNE.body,
  ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`brep_${2 + i}`, TUNE.ringOnSilver])),
  ...Object.fromEntries(["物件_1", "物件_4", "物件_5", "物件_6", "物件_7", "物件_8", "物件_9"].map((n) => [n, TUNE.silkDark])),
  // Base plate, outer / middle frames, posts, connector block, brackets (brep_1_22 stays silver)
  ...Object.fromEntries(
    [
      "brep_1_59",
      "brep_1_20",
      "brep_1_50",
      "brep_1_24",
      "brep_1_12",
      "brep_1_15",
      "brep_1_16",
      "brep_1_19",
      "brep_1_9",
      "brep_1_13",
      "brep_1_18",
      "brep_1_14",
      "brep_1_17",
    ].map((n) => [n, TUNE.blackMetal]),
  ),
};

/** Materials that neither cast nor receive shadows: self-shadow turns the USB recess solid black */
export const NO_SHADOW_MATERIALS = new Set(["金属1"]);
