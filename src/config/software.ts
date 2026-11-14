// Content of the Software page's early access section (src/components/SoftwareEarlyAccess.astro).

/** Early-access steps beside the form; the first step is the current one */
export const EARLY_ACCESS_STEPS = [
  { title: "Apply", text: "Tell us your email and Mac." },
  { title: "Review", text: "We check your Mac setup. The first wave is small." },
  { title: "Invite", text: "Download, install steps, a feedback link and a $20 Router credit." },
  { title: "Test", text: "Use it on real work. We follow up." },
  { title: "Improve", text: "Your feedback shapes the launch build." },
];

// Early access form dropdown options (Figma: S6 form "Your Mac"); the empty-value first option is the placeholder
export const MAC_MODELS = ["MacBook Air", "MacBook Pro", "Mac mini", "iMac", "Mac Studio", "Mac Pro", "Other", "Not sure"];
export const MAC_CHIPS = [
  ...["M1", "M2", "M3", "M4", "M5", "M6"].flatMap((gen) => ["", " Pro", " Max", " Ultra"].map((tier) => `Apple ${gen}${tier}`)),
  "Intel",
  "Not sure",
].filter((chip) => !["Apple M4 Ultra", "Apple M5 Ultra"].includes(chip));
export const MAC_MEMORY = [
  ...[16, 32, 48, 64, 96, 128, 192, 256].map((gb) => `${gb}GB`),
  "Not sure",
];

/** Backend endpoint that receives early access applications (POST JSON) */
export const EARLY_ACCESS_ENDPOINT = "https://amis-wifi-backend-947027167514.us-central1.run.app/api/v1/earlyaccess";

/** Hero copy (Figma: Software · D · 01_hero, node 1166:286) */
export const SOFTWARE_HERO = {
  title: "Own your AI",
  /** "\n" marks Figma's line breaks, kept from 768px */
  text: "Run larger models on the Mac you already own.\nKeep private and routine work off your cloud\nAPI bill.",
};

/** One chapter of the features scroll story (Figma: Software · D · 02–06); `nav` is the chapter bar label */
export interface FeatureChapter {
  id: string;
  label: string;
  nav: string;
  /** Headline: first line in muted ink, second line in full ink */
  lead: string;
  emphasis: string;
  /** Body copy; "\n" marks Figma's line breaks, kept from 1200px */
  text: string;
  note?: string;
  /** Show the lock icon before the note */
  noteLock?: boolean;
}

export const FEATURE_CHAPTERS: FeatureChapter[] = [
  {
    id: "agent-hub",
    label: "Agent Hub",
    nav: "Agent Hub",
    lead: "Your agents.",
    emphasis: "Powered locally.",
    text: "Connect compatible agents to Tokkey’s local\nmodels. Pick your tool, check its connection,\nand start working.",
  },
  {
    id: "private-chat",
    label: "Private Chat",
    nav: "Private Chat",
    lead: "A conversation,",
    emphasis: "just for you.",
    text: "Think, write, and work with your files.\nAll on your Mac.",
    note: "Processed on your Mac. Tool network access off.",
    noteLock: true,
  },
  {
    id: "no-ai-credits",
    label: "No AI Credits",
    nav: "No AI Credits",
    lead: "Keep creating.",
    emphasis: "Skip the top-ups.",
    text: "Write, ask, and repeat with local AI.\nNo cloud credits needed for those tasks.",
    note: "Optional cloud use is billed separately.",
  },
  {
    id: "your-workflow",
    label: "Your existing workflow",
    nav: "Your workflow",
    lead: "Same tools.",
    emphasis: "Powered locally.",
    text: "Choose a Tokkey local model in your\ncompatible AI tool. Keep working where you\nalready are.",
    note: "Tokkey works quietly in the background.",
  },
  {
    id: "router",
    label: "Router",
    nav: "Router",
    lead: "Local power.",
    emphasis: "Cloud by choice.",
    text: "Router matches each task to local or cloud AI.\nKeep private work on your Mac, and control\nwhat cloud models receive.",
    note: "See the route. Control what leaves.",
    noteLock: true,
  },
];

/** Agent Hub preview tabs (Figma: .hub-opt); icon layers sit at Figma offsets inside a 40×40 box */
export const HUB_AGENTS = [
  { name: "Codex", text: "Code & build", icons: [{ src: "agent-codex.svg", w: 29.0039, h: 30.81, x: 5.49, y: 4.59 }] },
  { name: "Claude Code", text: "Code & debug", icons: [{ src: "agent-claude-code.svg", w: 32.57, h: 32.57, x: 3.71, y: 3.71 }] },
  {
    name: "OpenClaw",
    text: "Automate tasks",
    icons: [
      { src: "agent-openclaw-body.svg", w: 30.3, h: 20.397, x: 4.85, y: 8.6 },
      { src: "agent-openclaw-eyes.svg", w: 12.9, h: 4.8, x: 13.55, y: 16.85 },
    ],
  },
];

/** "Your workflow" model menu options; the background API note follows the selected one */
export const WORKFLOW_MODELS = [
  {
    id: "local",
    name: "Tokkey · Local model",
    text: "On your Mac · via local API",
    api: "Tokkey local API",
    apiText: "Connected in the background.",
    apiNote: "No per-token API fee for local runs.",
  },
  {
    id: "cloud",
    name: "Cloud model",
    text: "Your configured provider",
    api: "Your cloud provider",
    apiText: "Uses your configured cloud connection.",
    apiNote: "Your provider’s charges apply.",
  },
];
