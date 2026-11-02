// Astro config: fully static build (dist/), Tailwind v4 via its Vite plugin.
// When the Stripe checkout endpoint is added, install @astrojs/cloudflare and set `adapter: cloudflare()`.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
