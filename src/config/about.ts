// Content of the About page (src/pages/about.astro) that renders from data rather than hand-written markup.

/** Chapter index, bottom-left on desktop */
export const ABOUT_INDEX = [
  { label: "Prometheus", numeral: "I", href: "#ch1" },
  { label: "Archimedes", numeral: "II", href: "#ch2" },
  { label: "Arthur", numeral: "III", href: "#ch3" },
  { label: "Waitlist", numeral: "IV", href: "#cta" },
];

/** Chapter 3 mask: the five principles we build against */
export const ABOUT_PRINCIPLES = [
  {
    n: "01",
    en: "Flow",
    zh: "流动",
    body: "Intelligence follows the work. A useful system carries the right context to the right capability, and the path stays understandable to the person using it.",
  },
  {
    n: "02",
    en: "Ownership",
    zh: "拥有",
    body: "A foundation of your own. Keep useful capability on your device. Change a model without starting your relationship with intelligence from zero.",
  },
  {
    n: "03",
    en: "Possibility",
    zh: "衍生",
    body: "One foundation, many ways to work. Inference becomes valuable when it supports an application, a decision, or a finished piece of work.",
  },
  {
    n: "04",
    en: "Together",
    zh: "共生",
    body: "Local and cloud, by choice. Let routine and private work stay close. Ask for additional capability only within the boundaries you choose.",
  },
  {
    n: "05",
    en: "Privacy",
    zh: "隐私",
    body: "A boundary you can understand. Inspect the source, select what may be shared, and keep the ability to stop. Privacy is a set of controls, not a promise.",
  },
];

/** Chapter 3 board FAQ */
export const ABOUT_FAQ = [
  {
    q: "Does Tokkey ever send my data to the cloud?",
    a: "Not by default. Everything runs on the device. If you choose to route a task to a cloud model, you name the model, you see what is sent, and the choice is recorded where you can read it back.",
  },
  {
    q: "What happens if I switch models?",
    a: "Your memory, preferences, and history stay with you. The model is a part you can replace; your relationship with it does not reset.",
  },
  {
    q: "Do I need to know how to set up a model?",
    a: "No. Plug the cube in and the runtime picks a model that fits your hardware and starts a local endpoint your tools already know how to use.",
  },
  {
    q: "Can I stop it?",
    a: "Always. Turn off the cloud route and nothing is sent anywhere. Unplug the cube and the local runtime stops.",
  },
];
