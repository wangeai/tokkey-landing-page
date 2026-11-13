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
