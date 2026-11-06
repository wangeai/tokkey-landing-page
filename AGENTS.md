# Instructions for AI coding tools
Before editing UI, styles, copy or assets, read `docs/tokkey-brand-web/SKILL.md` (the Tokkey branding design guideline)
and follow it for any new section or page. Fonts are Inter + Commit Mono only; do not substitute (see README for downloads).
Do not add stock or generated product photos.

Stack: Astro + Tailwind v4 + GSAP ScrollTrigger + Lenis, deployed as a static site on Cloudflare Workers (Node >= 22.23, see `.nvmrc`).
- Brand tokens live in `src/styles/global.css` (`@theme`); use them (`text-h2`, `bg-ink`, `px-gutter`) instead of raw values.
- Scroll/canvas logic goes in classes under `src/scripts/` (see `VideoPlayer`, `FrameScene`, `ScrollEngine`), not in inline scripts.
- Every scene needs a mobile setup (`gsap.matchMedia`, breakpoint 768px).
- `public/legacy.html` is the original page kept for visual comparison while porting; don't edit it.
