// Astro config: fully static build (dist/), Tailwind v4 via its Vite plugin, sitemap-index.xml for search engines.
// When the Stripe checkout endpoint is added, install @astrojs/cloudflare and set `adapter: cloudflare()`.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Production origin: used for the sitemap and canonical URLs
  site: "https://tokkey.ai",
  vite: { plugins: [tailwindcss()] },
  integrations: [sitemap()],
});
