// Content of the Software page sections (src/components/Software*.astro).

/** Memory available to local models in the inference-engine card (GB) */
export const ENGINE_MEMORY_GB = 24;

/** Models listed in the inference-engine card; the bar shows `usedGb` out of ENGINE_MEMORY_GB */
export const ENGINE_MODELS = [
  { name: "Qwen3.6 35B-A3B", usedGb: 5 },
  { name: "Llama 3.3 70B", usedGb: 10 },
  { name: "Qwen3 8B", usedGb: 1.4 },
];

/** Glowing icon tiles around the card: icon file and the tile's top-left corner inside the 921×760 panel (Figma px) */
export const ENGINE_TILES = [
  { icon: "tile-6", left: 432, top: 55 },
  { icon: "tile-2", left: 32, top: 338 },
  { icon: "tile-3", left: 844, top: 347 },
  { icon: "tile-4", left: 193, top: 659 },
  { icon: "tile-7", left: 651, top: 666 },
];

/** Sidebar of the app window in the hero: section label and its items; the first item of "Core" is selected */
export const APP_NAV = [
  { label: "Core", items: ["Tokkey", "Agent Hub", "Memory"] },
  { label: "Workspace", items: ["Chat"] },
  { label: "System", items: ["Dashboard", "Settings"] },
];

/** "Local Models" list in the app window; `running` marks the model with the Running tag and a Stop button */
export const APP_MODELS = [
  { name: "Qwen3.6 35B-A3B Q4_K_M", detail: "Recommended · 23 GB · Qwen", running: false },
  { name: "Qwen3.5 4B Q4_K_M", detail: "2.8 GB · Alibaba Qwen", running: true },
  { name: "Qwen3.5 9B Q4_K_M", detail: "5.7 GB · Qwen", running: false },
];

/** Glass chips floating around the app window: icon file and top-left corner relative to the window (Figma px) */
export const HERO_CHIPS = [
  { label: "Router", icon: "chip-router", left: 719, top: -49 },
  { label: "Agent Hub", icon: "chip-agent-hub", left: 973.5, top: 533.3 },
  { label: "Memory", icon: "chip-memory", left: 342, top: 611 },
  { label: "Models", icon: "chip-models", left: -39, top: 527 },
];

/** Feature cards under the engine panel, numbered 02–07 after "Run larger models locally." (01) */
export const FEATURES = [
  {
    icon: "feature-2",
    title: "More intelligence from the hardware you own.",
    text: "A leaner inference engine that needs less memory. Benchmarks to follow.",
  },
  { icon: "feature-3", title: "No API credits.", text: "Daily and recurring workflows stay local, with no per-token bill." },
  { icon: "feature-4", title: "A 100% local agent for private work.", text: "Prompts, files, memory and workflows stay on your hardware." },
  {
    icon: "feature-5",
    title: "Always on. Even offline.",
    text: "Once models and tools are installed, supported tasks keep running without a stable network.",
  },
  {
    icon: "feature-6",
    title: "Local when you can. Cloud when you need it.",
    text: "The router sends simple and private tasks local, hard ones to cloud, and shows you which is which.",
  },
  {
    icon: "feature-7",
    title: "Local models, where you already work.",
    text: "Use Tokkey inside Codex, Claude Code and other agents. Same workflow, local model.",
  },
];

/** The one path every use case follows (pills under the use-cases headline) */
export const USE_CASE_PATH = ["Read local files", "Run multi-step work", "Save a result you can check"];

/** Use cases listed beside the app window; the first one is highlighted until another is hovered */
export const USE_CASES = [
  {
    title: "Run your code workflows locally.",
    text: "Reads the codebase, finds the error, edits the files and runs your existing tests. Saves a change log and the test results.",
  },
  {
    title: "Automate recurring work locally.",
    text: "Reads a chosen folder on a schedule and writes the weekly report, summary or status update. No cloud credits used.",
  },
  {
    title: "A 100% local agent for private work.",
    text: "Reads contracts, financials or research documents. Pulls out what matters and returns results with sources.",
  },
];

/** Use-case cards under the app window */
export const USE_CASE_CARDS = [
  { label: "Research", title: "Ask your files.", text: "Searches local PDFs, notes and project files. Writes a research brief with citations." },
  {
    label: "Meetings & recordings",
    title: "Turn recordings into action.",
    text: "Transcribes locally. Extracts decisions, to-dos and owners. Saves a Summary, Transcript and Action list.",
  },
  { label: "Files", title: "Bring order to your files.", text: "Identifies, renames and sorts local files. Shows the change list first, then acts." },
];

/** Sidebar of the glass app window in the use-cases section (adds Router to the hero's nav) */
export const USE_CASE_APP_NAV = [
  { label: "Core", items: ["Tokkey", "Router", "Agent Hub", "Memory"] },
  { label: "Workspace", items: ["Chat"] },
  { label: "System", items: ["Dashboard", "Settings"] },
];

/** Early-access steps beside the form; the first step is the current one */
export const EARLY_ACCESS_STEPS = [
  { title: "Apply", text: "Tell us your email and Mac." },
  { title: "Review", text: "We check your Mac setup. The first wave is small." },
  { title: "Invite", text: "Download, install steps, a feedback link and a $30 Router credit." },
  { title: "Test", text: "Use it on real work. We follow up." },
  { title: "Improve", text: "Your feedback shapes the launch build." },
];
