// Content of the FAQ section (src/components/Faq.astro); copy carried over from the legacy page.

/** Questions in display order; the first one starts open */
export const FAQ_ITEMS = [
  {
    question: "What is Tokkey?",
    answer: "A USB-C Local AI Key with Tokkey Runtime and a local API. It works with your Mac. It is not a new computer.",
  },
  {
    question: "Which Macs and models are supported?",
    answer:
      "Apple silicon Macs. More memory lets you run larger models; the Software page has a table to check your Mac. Not every Mac or model is guaranteed.",
  },
  { question: "Does it add a GPU, NPU, or RAM?", answer: "No. Your Mac provides compute and working memory." },
  {
    question: "Does Tokkey include a chat interface?",
    answer: "Yes, Private Chat. Compatible external tools can connect through the local API.",
  },
  {
    question: "Is Agent Hub a new Tokkey agent?",
    answer: "No. It is the entry point to connect and manage compatible agents.",
  },
  {
    question: "What is shared Memory?",
    answer: "Saved user context that you choose to share across tools. It is not RAM expansion.",
  },
  {
    question: "Does Router keep every request local?",
    answer: "No. Router lets you choose between local and cloud, and shows the model, shared excerpt and expected cost first.",
  },
  { question: "Can a task continue with the lid closed?", answer: "On supported configurations, yes. Photos are not proof." },
  {
    question: "Do I need the internet?",
    answer: "Downloads, updates and cloud tasks need a connection. Installed local models work locally.",
  },
  {
    question: "What do the performance numbers mean?",
    answer:
      "Claims in the supplied artwork are not yet matched to reports. Treat them as placeholders until evidence is published.",
  },
  {
    question: "How much will it cost?",
    answer:
      "The planned one-time launch price is $129. Final pricing, availability and terms will be confirmed before orders open.",
  },
];
