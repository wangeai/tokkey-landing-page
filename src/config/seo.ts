// Search-engine copy and JSON-LD structured data. The brief feeds the default <title>/description (BaseLayout);
// the homepage emits Organization + Product + FAQPage so Google can show brand info and FAQ rich results.
import type { FaqItem } from "./faq";

export const SITE_URL = "https://tokkey.ai";

/** Brand brief used for meta tags and structured data */
export const SEO_BRIEF = {
  title: "Tokkey — The World’s Smallest AI Hardware | Own Your Intelligence",
  description:
    "Tokkey is the world’s smallest AI hardware: a USB-C local-AI key made for your PC and Mac. 0 tokens, runs on-device. Own your intelligence.",
};

/** Builds schema.org JSON-LD objects for the page <head> */
export class StructuredData {
  /** The site itself; `name` is the site name Google shows above the result URL */
  static webSite() {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Tokkey",
      // Other names people search for, so they map to this site
      alternateName: ["Tokkey AI", "tokkey.ai"],
      url: `${SITE_URL}/`,
    };
  }

  /** The company behind the site */
  static organization() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Tokkey",
      url: SITE_URL,
      // Google does not accept SVG logos; use the 180px PNG
      logo: `${SITE_URL}/apple-touch-icon.png`,
    };
  }

  /** The Tokkey key itself, described with the brief */
  static product() {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Tokkey",
      brand: { "@type": "Brand", name: "Tokkey" },
      description: SEO_BRIEF.description,
      url: SITE_URL,
    };
  }

  /** FAQ rich result built from the same items the visible FAQ section renders */
  static faqPage(items: FaqItem[]) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    };
  }
}
