---
name: tokkey-web-pixel-implementation
description: Implement or fix Tokkey landing-page sections from Figma with measured visual and interaction fidelity using Astro, Tailwind v4, GSAP ScrollTrigger and Lenis. Use when a Figma node must be reproduced on the site, when layout, typography, assets, brand tokens, responsive behavior, scroll animation, hover, focus or accessibility must match, or when evidence is needed to verify a visual change.
---

# Tokkey Web Pixel Implementation

Turn a Figma node into a measured section of the Tokkey landing page. Treat
generated code as structural reference only; the Figma screenshot, node
properties, variable bindings, the brand guideline, and repository conventions
are the contract.

## Stack Facts

- Astro 7 static site (`astro build` → `dist/`), deployed on Cloudflare Workers
  (`wrangler.jsonc`). Node >= 22.23 per `.nvmrc`; run `nvm use` first or Astro
  refuses to start.
- Pages live in `src/pages` and compose section components from
  `src/components/*.astro`, wrapped in `src/layouts/BaseLayout.astro` (fixed
  `Nav`, fonts, the global `ScrollEngine`).
- Tailwind v4 through `@tailwindcss/vite`. Brand tokens live in the `@theme`
  block of `src/styles/global.css` (`bg-ink`, `text-h2`, `text-h2-sm`,
  `px-gutter`, `max-w-page`, ...), with shared patterns in `@layer components`
  (`.label`, `.period`, `.text-chrome`, `.btn`). Breakpoints: `md` = 768px,
  `lg` = 1200px.
- Section-specific CSS that is awkward as utilities goes in the component's
  scoped `<style>` block; section content (copy, lists, data) goes in
  `src/config/<section>.ts`.
- Behavior goes in classes under `src/scripts/` (scene controllers in
  `src/scripts/scenes/`, e.g. `HeroScene`, `FeaturesScene`, `CommentsScene`),
  instantiated from a small `<script>` at the bottom of the component. No logic
  in inline scripts.
- Import GSAP only from `src/scripts/gsap.ts` (registers ScrollTrigger and
  Observer once). Lenis is owned by the `ScrollEngine` singleton; never create a
  second Lenis instance or scroll listener.
- Every scene needs a mobile setup through `gsap.matchMedia()` using
  `MOBILE_MAX_WIDTH` (767) from `src/config/frames.ts`, and must respect
  `prefers-reduced-motion`.
- Static assets go in `public/assets/...` and are referenced by absolute path
  (`/assets/images/...`). Frame sequences are configured in `src/config/frames.ts`
  and `src/config/scenes.ts`.
- `public/legacy.html` (with `public/assets/css/main.css` and
  `public/assets/js/main.js`) is the original page kept for comparison. Read it
  for reference values and animation timing; never edit it.

## Required Sources

- Read `docs/tokkey-brand-web/SKILL.md` before editing UI, copy or assets.
  Fonts are Inter + Commit Mono only. Do not add stock or generated product
  photos.
- Load the `figma-design-to-code` skill, then use the official Figma read tools.
  Pass `clientLanguages: "typescript,html,css"` and
  `clientFrameworks: "astro,tailwind"` to `get_design_context`.
- Resolve every color, spacing, radius and type decision through the `@theme`
  tokens. Add a token only when a value is reused; a one-off value stays an
  arbitrary utility or scoped CSS, documented as a node exception.
- Verify with `npm run check` and `npm run build`, then inspect the built page
  (`npx astro preview`, or `npm run dev` for interactive work).

## 1. Freeze Scope

- Record the Figma URL, file key, node ID, visual state, and frame size (the
  site's desktop frames are 1920 wide; the content container is 1200).
- Record the target component, its config file, and its scene class if any.
- Find the matching legacy section in `public/legacy.html` and note its
  behavior (reveal timing, hover, carousel, etc.) that the Figma static frame
  does not show.
- List required states: default, hover, focus, active, scroll-in/out, mobile,
  reduced motion.
- Do not widen a visual task into unrelated sections or scroll architecture.

## 2. Build A Figma Ledger

Call `get_design_context` first. If it is sparse or the node is a page, use
`get_metadata` to find the concrete frame and request its visible children. Call
`get_variable_defs` on the concrete target.

Record before editing:

- section padding, container width, column structure, gaps, alignment, and how
  the layout should collapse at 1200 / 768 / mobile;
- colors, opacity, border, radius, blur, backdrop filter, blend mode, gradient,
  and shadow;
- font family, size, weight, line height, letter spacing, explicit line breaks,
  and alignment, mapped to the brand type scale (Hero, Display, H2, H3, Lead,
  Body, Label);
- every image/SVG node, its size and slot;
- hover/focus/active differences and scroll-driven motion;
- accessibility names and semantic roles;
- conflicts between Figma and the brand guideline (report them; follow Figma
  unless told otherwise).

Use [references/figma-contract-checklist.md](references/figma-contract-checklist.md)
as the ledger and evidence format.

## 3. Inspect The Existing Site

- Read the neighbouring components, `global.css`, the relevant `src/config`
  file, and existing scene classes before editing. Reuse `.text-chrome`,
  `.period`, `.label`, `.btn` and existing scene patterns.
- Do not create one wrapper component per Figma frame.
- Check how the section sits in `src/pages/index.astro` and against the black
  sections around it (alternating dark/light rhythm per the brand guideline).

## 4. Implement With Astro And Tailwind

### Layout

- Translate Figma's absolute positioning into flow layout: flex/grid, `gap-*`,
  `p-*`, `max-w-*`, `mx-auto`. Keep exact pixel values for fixed-size elements
  the design defines.
- Design mobile-first: base classes for < 768, `md:` for tablet, `lg:` for
  desktop. Use `contents` / grid reflow rather than duplicating markup per
  breakpoint.
- Keep designed line breaks only at widths where the element has its designed
  width (e.g. `white-space: pre-line` or `<br class="max-md:hidden">`).
- Reserve `absolute` and negative margins for decoration (glows, depth effects).
  Full-bleed sections use `overflow-hidden` so decoration never causes
  horizontal scroll.

### Tokens And Effects

- Map Figma bindings to `@theme` tokens. Preserve opacity, blur, backdrop
  filter and shadow as explicit node facts in scoped CSS.
- Accent `#4ABE18` stays within the brand's 5% rule (dots, periods, signals).
- Black brand sections stay black in both themes; theme-following colors use
  `bg-bg`, `text-text`, `border-hair`.

### Typography

- Use the token scale (`text-h2-sm md:text-h2`, `text-lead`, `text-body`).
  Headlines end with `<span class="period">.</span>`; chrome gradient headlines
  use `.text-chrome`.
- Verify rendered wrapping and box height in the browser, especially for
  `background-clip: text` headings.

### Images And Assets

- Download every Figma asset into `public/assets/...`; never leave temporary
  Figma asset URLs. Keep SVG root `width`/`height`; set them as `<img>`
  attributes.
- Check exported files for size, content and stray whitespace.
- Use `<img>` with `alt` (empty plus `aria-hidden` for decoration).

### Motion

- Scroll reveals, pinning and scene steps go in a class under
  `src/scripts/scenes/` using ScrollTrigger from `src/scripts/gsap.ts`.
- Provide desktop and mobile branches with `gsap.matchMedia()`; skip motion
  under `prefers-reduced-motion: reduce`.
- Match the legacy page's timing and easing when it defines the behavior.
- Do not fight the hero's `SceneStepper` scroll lock; sections below the hero
  scroll normally once it releases.

### Interaction And Accessibility

- Use semantic elements (`section`, `h2`, `figure`, `blockquote`, `button`,
  `a`). Add `focus-visible` styles for anything clickable.
- Mark interactive regions with `data-*` hooks (`data-ref`, `data-<section>`)
  for scene classes; never select by visible copy.

## 5. Verify In The Browser

- Run `npm run check` (0 errors) and `npm run build`.
- Serve the build (`npx astro preview`) and screenshot the section element at
  the Figma frame width (1920), a laptop width (1280–1440), and a phone width
  (390). Use Playwright with the system Chrome (`channel: "chrome"`) from the
  scratchpad, or the browser automation skill.
- Compare each screenshot against the Figma screenshot; measure disputed boxes
  with `getBoundingClientRect()` rather than eyeballing.
- Confirm every asset loads with its natural size and expected rendered size.
- Exercise the motion: scroll into and out of the section, and check reduced
  motion shows final state.
- Check the console for errors and the page for horizontal overflow at 390px.
- Re-run after every visual change; fix the implementation or record why a
  Figma fact does not apply.

## Stop Conditions

Stop and report rather than guess when the target node is ambiguous, an asset is
unavailable, a required state is missing from Figma, the design conflicts with
the brand guideline in a way that needs a decision, or the design requires a
product photo the project does not have.

## Completion

Before reporting, confirm the ledger is resolved, tokens and assets trace to
Figma, desktop/tablet/mobile and reduced-motion all render correctly, `check`
and `build` pass, the section was inspected in the browser, and any remaining
difference or brand-guideline conflict is listed with its rationale.
