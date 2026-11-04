# Tokkey Web Figma Contract Checklist

Use this ledger before editing and update it with verification evidence.

## Design Ledger

| Area | Figma node and fact | Site surface | Token or asset | State | Verification |
| --- | --- | --- | --- | --- | --- |
| Section | node, frame size, padding, background | `src/components/<Section>.astro` | `bg-black` / theme token | desktop/tablet/mobile | section screenshot at 1920 / 1280 / 390 |
| Heading | eyebrow, H2, lead: size, weight, line breaks | heading elements | `text-h2`, `.period`, `.text-chrome` | all widths | wrapping and box height |
| Content | columns, cards, gaps, radius, border, effects | component markup + scoped CSS | theme token or node exception | default/hover/focus | `getBoundingClientRect()` |
| Asset | node, file, natural size, slot | `<img>` / inline SVG | `public/assets/...` | all widths | natural vs rendered size |
| Motion | trigger, distance, duration, stagger | `src/scripts/scenes/<Scene>.ts` | n/a | desktop/mobile/reduced motion | scroll through in browser |
| Exception | Figma vs brand-guideline conflict | owning component | n/a | n/a | listed in the report |

## Figma Extraction

- [ ] URL, file key, node ID, state and frame size recorded.
- [ ] `figma-design-to-code` skill loaded; `get_design_context` read with Astro/Tailwind client metadata.
- [ ] Concrete frame found through `get_metadata` when the response was sparse or a page.
- [ ] `get_variable_defs` read for the concrete target.
- [ ] Screenshot inspected in addition to generated code.
- [ ] Dimensions, padding, spacing, alignment and responsive intent recorded.
- [ ] Typography, assets, effects, opacity, radius, borders and shadows recorded.
- [ ] Matching legacy section in `public/legacy.html` checked for behavior and timing.
- [ ] Brand-guideline conflicts listed explicitly.

## Implementation Review

- [ ] `docs/tokkey-brand-web/SKILL.md` read; Inter + Commit Mono only; no stock or generated product photos.
- [ ] Neighbouring components, `global.css`, `src/config` and scene classes inspected and reused.
- [ ] Content lives in `src/config/<section>.ts`; behavior in a class under `src/scripts/`.
- [ ] Layout is flow-based (flex/grid); absolute positioning only for decoration.
- [ ] Mobile-first classes with `md:` (768) and `lg:` (1200); no horizontal overflow at 390px.
- [ ] Colors, type and spacing come from `@theme` tokens; one-off values documented.
- [ ] Every asset downloaded to `public/assets/...`; no temporary Figma URLs; SVG `width`/`height` kept.
- [ ] GSAP imported from `src/scripts/gsap.ts`; `gsap.matchMedia()` desktop and mobile branches; reduced motion respected.
- [ ] Semantic elements, `alt` text, `focus-visible` styles and `data-*` hooks present.
- [ ] Comments added on new code, matching surrounding style.

## Verification Route

```bash
nvm use
npm run check
npm run build
npx astro preview   # then screenshot the section at 1920, 1280 and 390 wide
```

Screenshot the section element (not the full page) with Playwright using the
system Chrome (`channel: "chrome"`) or a browser automation skill, compare it
with the Figma screenshot, and measure disputed nodes with
`getBoundingClientRect()`. There is no screenshot-diff harness, so a screenshot
is diagnostic evidence, not an automatic pixel-golden assertion.

## Evidence Review

- [ ] `check` reports 0 errors; `build` completes.
- [ ] Section screenshots at 1920, 1280 and 390 inspected against Figma.
- [ ] Box-model values checked against the ledger for disputed nodes.
- [ ] Assets load with expected natural and rendered sizes.
- [ ] Scroll-in motion and reduced-motion final state both checked.
- [ ] Console clean; no horizontal page scroll on mobile.
- [ ] Remaining differences and brand conflicts listed with their Figma fact and rationale.
