// Content of the site footer (src/components/Footer.astro). Targets follow the nav and the legacy footer;
// "#" marks pages and accounts that don't exist yet.

export interface FooterLink {
  label: string;
  href: string;
}

/** Link columns, left to right */
export const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Software", href: "/software" },
      { label: "Models", href: "/models" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dev Doc", href: "/devdoc" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Reserve your spot", href: "/software#early" },
    ],
  },
];

/** Social accounts; icons live in public/assets/icons/social */
export const SOCIAL_LINKS: (FooterLink & { icon: string })[] = [
  { label: "X", href: "https://x.com/tokkeyai?s=11", icon: "/assets/icons/social/x.svg" },
  { label: "Discord", href: "https://discord.gg/cBNX8hmtAw", icon: "/assets/icons/social/discord.svg" },
];
