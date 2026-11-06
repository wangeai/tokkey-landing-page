// The hero's scene list, in play order. One scroll gesture plays one scene's frames like a video.
import type { SequenceName } from "./frames";

export type SceneId = "logoReveal" | "plugIn" | "agentsFly" | "pullBack" | "screenZoom" | "flipOver" | "xray" | "powerFlow";

export interface SceneConfig {
  id: SceneId;
  /** Frame folder under public/assets/frames */
  sequence: SequenceName;
  /** How frames fit a portrait phone screen: "cover" crops to fill, "contain" shows the whole frame */
  mobileFit: "cover" | "contain";
  /** Optional CSS filter on the canvas while this scene shows (color-matches older renders) */
  filter?: string;
  /** Optional playback speed for this scene's frames; defaults to SCENE_FPS */
  fps?: number;
  /** Fade the previous scene out, then this one in (and back the same way), instead of cutting */
  fadeIn?: boolean;
}

export const SCENES: SceneConfig[] = [
  { id: "logoReveal", sequence: "001", mobileFit: "contain", fps: 30, filter: "hue-rotate(28deg) saturate(1.1)" }, // lid lifts, TOKKEY glows behind it
  { id: "plugIn", sequence: "002", mobileFit: "cover" }, // laptop opens, camera moves in to the plugged-in key
  // No frames of its own: holds plugIn's last frame while the agents fly into the key on their own scroll gesture
  { id: "agentsFly", sequence: "002", mobileFit: "cover" },
  { id: "pullBack", sequence: "003", mobileFit: "contain" }, // camera pulls back to the laptop's front view
  // No frames of its own: holds pullBack's last frame while the camera zooms into the screen on its own scroll gesture
  { id: "screenZoom", sequence: "003", mobileFit: "contain" },
  // The app panels leave and the camera zooms back out of the screen, then the laptop rotates to show its underside
  { id: "flipOver", sequence: "004", mobileFit: "contain", fps: 45 },
  { id: "xray", sequence: "005", mobileFit: "contain" }, // lightning reveals the internals
  { id: "powerFlow", sequence: "006", mobileFit: "contain", fps: 45 }, // blue energy flows through the internals
];

/** Default playback speed (scenes can override it with `fps`) */
export const SCENE_FPS = 60;
/** Playback speed of a scene's frames */
export const sceneFps = (scene: SceneConfig): number => scene.fps ?? SCENE_FPS;

/** Frame rate the frame-synced timelines' timings were authored at; they're sped up by the scene's fps / SCENE_TIMING_FPS */
export const SCENE_TIMING_FPS = 30;
/** Crossfade between two scenes' canvases (seconds) */
export const SCENE_CROSSFADE = 0.35;
/** Each half of a `fadeIn` scene's fade-out-then-in (seconds) */
export const SCENE_FADE = 0.8;
