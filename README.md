# Tokkey — Homepage (static build)

Scroll-driven marketing homepage for **Tokkey**, a USB-C local-AI key for Mac (0 tokens, runs on-device).
Design: Heather · for amis / cpilot.net. This repo is the hand-off for development.
**The root of this repo is the latest version. `v1/` is the old version — do not build from it.**

> 中文简述：这是 Tokkey 官网首页的静态成品（纯 HTML/CSS/JS，无构建步骤）。`index.html` 是页面本体，样式和脚本在 `assets/css`、`assets/js`，`assets/frames/` 是滚动动画的帧序列，`assets/fonts/` 是 Commit Mono。品牌规范见下方 **Brand design spec**（完整中文原版在 `docs/`）。

---

## 1. Run it

Requires Node >= 22.23 (`nvm use` picks it up from `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npx wrangler deploy  # deploy dist/ to Cloudflare Workers (static assets, see wrangler.jsonc)
```

Migration status: the site is being rewritten in Astro + Tailwind + GSAP. Ported sections live in `src/`; the original
page is still served at `/legacy.html` (from `public/`) for side-by-side comparison until every section is moved.

## 2. What's in the folder

```
index.html                 page markup (links the CSS/JS below)
assets/
  css/main.css             all page styles
  js/main.js               scroll scenes, frame players, interactions
  images/                  tokkey.png product render · lid.png lid render · bg4–bg7.webp backgrounds
                           flow.webp hero flow bg · k4_plate/k4_close laptop plates · cl.webp overlay · s7_photo.webp
  icons/                   s3_*.svg  s7_*.svg  small UI icons
  frames/a … g/            7 scroll-scrubbed frame sequences (webp, NNN.webp), 411 frames total
  fonts/                   Commit Mono (4 files, OFL) + its licence
docs/tokkey-brand-web/SKILL.md   full brand skill (Chinese original)
AGENTS.md                  tells AI coding tools to read the brand skill first
v1/                        previous version (Home through screen 4), kept for reference only
```

How the frames work: `assets/js/main.js` builds URLs as `assets/frames/<seq>/<NNN>.webp` (`String(i).padStart(3,'0')`), preloads them into `Image` objects and paints the frame that matches scroll progress onto a `<canvas>`. If you add/remove frames, change the count for that sequence in the script; do not rename files.

Page structure (top → bottom, tall `.pin` wrappers with a `position:sticky` child drive each scroll scene):
`#sx` hero + "idea" scene · `#s3` laptop UI scene · `#s4` feature list + showcase card · `#sr` "Release the True Power" tabs scene · `#s6` compare scene · `#s7` quote wall · `#s8` rent-vs-own · `#s9`/`#s10` privacy, waitlist, memory compare · `#faq` · `#end` CTA + footer.

## 3. Notes for developers

- Desktop-first design at **1440 px** wide. Breakpoint rules exist at 900 px but mobile is **not fully designed** yet — treat as TODO.
- Fonts: **Inter** (Google Fonts `<link>` in `<head>`) and **Commit Mono** (local `@font-face`, `assets/fonts/`). **Nothing else.** See §5.
- Performance: ~38 MB of frames/images. Before launch: serve behind a CDN with long cache headers, keep `webp`, lazy-load later sequences, and consider halving frame counts on mobile.
- Several scenes are pure CSS "renders" (laptop, glass cards). Real product photography is **not** generated — product images come from the design team (see Photography rule below).
- Copy is placeholder where marked (performance numbers, testimonials). Do not ship claims without the test report.

## 4. Repo hygiene (replacing the old upload)

You don't need to delete the repo. Replace the contents in one commit so history stays intact:

```bash
git rm -r -q .                      # stage removal of old files
cp -r /path/to/tokkey-homepage/. .  # copy this folder in
git add -A && git commit -m "Replace with Tokkey homepage v2" && git push
```

Large files: each file is well under GitHub's 100 MB limit; total ≈ 38 MB is fine.

---

# Brand design spec (Tokkey — web)

*Condensed from the `tokkey-brand-web` skill. Full original: `docs/tokkey-brand-web/SKILL.md`.*

**Positioning:** Tokkey is a tool, not a toy — think YubiKey, Framework, Teenage Engineering, Rams-era Braun. **Restraint is not blandness:** decoration is minimal, scale contrast is maximal. Words: own, local, control, connect, hardware, inference, context. Headlines are short sentences ended with a period, and the period is the accent green.

## Colors

| Token | Hex | Use |
|---|---|---|
| Ink | `#111110` | Main text, dark theme bg |
| Black | `#000000` | Full-bleed hero / quote / CTA bands |
| White | `#FFFFFF` | Main bg |
| Fog | `#F2F2F2` | Secondary sections, cards |
| Silver | `#DADAD6` | 1 px hairlines only |
| Ash | `#B0B0AC` | Disabled, secondary text on dark |
| Graphite | `#5C5C58` | Secondary text, captions |
| **Accent** | `#4ABE18` | Status dots and title periods only, ≤ 5 % of area |
| Studio | `#F4F4F2` | Product-plate bg (light theme) |
| Negative | `#F83830` | Misuse / "harmful side" in comparisons only |

Dark theme (re-specified, not inverted): bg `#111110` · card `#1A1A18` · hairline `#2E2E2B` · text `#F2F2F2` · secondary `#B0B0AC`.

> Known deviation in this build: the homepage also uses a lighter lime `#C6F24E` (`--gl`) for glow dots and a blue-white gradient on hero headlines. Keep `#4ABE18` for periods; confirm with design before adding more lime.

## Typography — only two typefaces

| | Role | Weights |
|---|---|---|
| **Inter** | Everything by default: headings, body, nav, buttons | 400 / 600 / 700 (page also loads 300 / 500 — avoid new uses) |
| **Commit Mono** | ~10 % of text, machine output only: eyebrow labels (UPPERCASE, +3 % tracking), data readouts, table values, CLI, chart axes | 400 / 700 |

Never use Commit Mono for nav, buttons, captions, paragraphs or footer. **Do not introduce any other font.**

**Download**
- Inter — https://fonts.google.com/specimen/Inter · or releases at https://github.com/rsms/inter/releases (SIL OFL)
- Commit Mono — https://commitmono.com · or https://github.com/eigilnikolajsen/commit-mono/releases (SIL OFL; the 4 `.otf` files used here are already in `assets/fonts/`)

```html
<!-- Inter -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```
```css
/* Commit Mono (local) */
@font-face{font-family:'Commit Mono';src:url('../fonts/CommitMono-400-Regular.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Commit Mono';src:url('../fonts/CommitMono-700-Regular.otf') format('opentype');font-weight:700;font-style:normal;font-display:swap}
--mono:'Commit Mono','Courier New',monospace;
.mono-text{font-family:var(--mono);font-feature-settings:'ss03','ss04','ss05'}
```

| Style | Size / line | Font |
|---|---|---|
| Hero | 160 / 152 (mobile 48 / 56) | Inter Bold, −2 % |
| Display | 96 / 104 | Inter Bold, −2 % |
| H2 | 64 / 72 (mobile 40 / 48) | Inter Bold, −2 % |
| Figure | 64 / 64 | Inter Bold |
| H3 | 32 / 40 | Inter Semibold |
| Lead | 24 / 32 | Inter Regular |
| Body / Caption | 16 / 24 (caption in Graphite) | Inter Regular |
| Label / Data | 16 / 24 | Commit Mono, labels UPPERCASE +3 % |

## Layout & spacing

- Container 1200 px, side margin 40 px (mobile 16), 12 columns, 24 px gutter. Product plates and black bands are full-bleed.
- Breakpoints: Mobile < 768 · Tablet 768–1199 · Desktop ≥ 1200.
- **Everything is a multiple of 8** (only exception: 1 / 1.5 px strokes). Spacing scale: 8 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160.
- Padding shrinks from outside to inside: page 40 → section 128 (black/quote bands 160) → product plate 64 (48 / 32 compact) → spec strip 96 / 32, cell 48 × 32 → dark card 24 → table row 24 → chart frame 32. Header 72, footer 48.
- Inner gaps: icon→title 32 · title→subtitle 8 · title→body 24 · body→next group 48 · image→caption 16.

## Visual rhythm

- **Scale jumps must be brutal** — headline vs. body at least 6× (160 vs 16). No gentle 32/24/20 ladders.
- Alternate full-bleed black bands and light sections. Black bands stay black in both themes.
- Big product plates: full-width, ≥ 480 px high. A small product image in a column makes hardware look like SaaS.
- Every section: **eyebrow (Commit Mono, uppercase, Graphite) → H2 with green period → 2–3 sentence body.** Never skip the eyebrow.
- Only the hero and quote band may be centred; everything else is left-aligned.
- Spec content = 64 px figure + 16 px explanation, hairline-separated. Never paragraphs of specs.

## Components

- **Button** — height 48, padding 0 24, radius 16, Inter 600 16 px. Use tokens, never hard-coded colours: `background:var(--text);color:var(--bg)`. Ghost = transparent + 1 px hairline. On black bands: `#fff` bg, `#000` text. Small = 40 high, 0 16 padding.
- **Chip / capsule** — height 48, padding 0 24, radius 24, 1 px `rgba(242,242,242,.24)` border, bg `rgba(0,0,0,.56)`. Max 3 per image, scattered asymmetrically, never in a neat column.
- **Input** — height 48, padding 0 16, radius 0, 1 px hairline.
- **Card** — radius 16 or 24 (never 20), padding 24, Fog (light) / `#1A1A18` (dark), hairline dividers instead of boxes.
- **Spec strip** — cells `48px 32px`, first cell left 0, last cell right 0, 1 px Silver vertical dividers; number = Figure, label = Label.
- **Comparison cards** — two cards side by side with a 1 px hairline; weak side in Graphite, Tokkey side in Ink with a green period. **Never use red/green to separate sides**; use weight and size.
- **Floating capsule annotations** — radius 24, height 48, green 8 px dot + mono label, 1 px stroke, no shadow, sits at ~⅓ of the image without covering the device core.
- **Connection-line diagrams** — 1.5 px strokes, 4 px green end-dots, captions next to the line, pure SVG on an empty background.

## Logo

Copy the SVG **verbatim** from `docs/tokkey-brand-web/SKILL.md` (§ Logo). Do not redraw, recolour, stretch, add shadow/glow, reorder, or typeset "TOKKEY" in Inter.

- Full logo (≈ 5.2 : 1) for header/footer; wordmark only when an icon is already present; symbol (1 : 1) for favicon / avatar / loading.
- Heights: header 32 px · footer 24 px · hero 64–72 px · minimum 24 px.
- Symbol tile is always black with a white glyph. Wordmark uses `fill="currentColor"` — so `.brand{color:var(--text)}` is **required**, otherwise links turn browser-blue.
- On pure black / near-black, give a standalone symbol a 1 px `#2E2E2B` stroke.

## Photography & icons

- Backgrounds are either seamless pure white or pure black dramatic light. White-background shots sit on a white plate even in dark theme. Narrative shots use the **silver** unit; four colours only in a "finishes" section. Device fills ¼–⅓ of the frame. One image per screen, no collage walls. A hand appears at most once (scale reference). Label renders "Concept renders".
- **Never generate or stock-source product images** — they come from the design team.
- Icons: pixelarticons style, inline SVG, `fill="currentColor"`, 24 px grid (scale in multiples of 24; 48 in spec strips). One icon family per section. No skeuomorphic icons (lock, key, shield, cloud, gear). Green only for status, never filling an icon.

## Do / Don't

**Do:** multiples of 8 everywhere · hierarchy by weight and scale, not colour · alternate black and light bands · eyebrow on every section · short headline + green period · 1 px Silver hairlines · say the assumptions under any chart (estimates, not promises) · `<script>document.documentElement.setAttribute('data-theme','dark')</script>` first thing in `<head>` · theme check `=== 'dark'`.

**Don't:** use more than the two typefaces · exceed 10 % mono · exceed 5 % green or use green as the theme-switch "on" colour · use 20 px radius · centre non-hero sections · add shadows or gradients to product-image backgrounds · put Negative red in positive content · hard-code button colours · tile identical-looking sections.

## CSS tokens (dark-first)

```css
:root{
  --ink:#111110; --silver:#DADAD6; --ash:#B0B0AC; --graphite:#5C5C58;
  --accent:#4ABE18; --negative:#F83830; --studio:#F4F4F2;
  --sans:'Inter',sans-serif; --mono:'Commit Mono','Courier New',monospace;
  --bg:#111110; --bg-2:#1A1A18; --card:#1A1A18; --hair:#2E2E2B; --text:#F2F2F2;
  color-scheme:dark;
}
:root[data-theme="light"]{
  --bg:#FFFFFF; --bg-2:#F2F2F2; --card:#F2F2F2; --hair:#DADAD6; --text:#111110; color-scheme:light;
}
:root[data-theme="dark"]{
  --bg:#111110; --bg-2:#1A1A18; --card:#1A1A18; --hair:#2E2E2B; --text:#F2F2F2; color-scheme:dark;
}
```

## Review checklist

- [ ] All spacing / padding / font sizes / line heights / radii divisible by 8
- [ ] Padding decreases outside → inside; same-level elements identical
- [ ] Headline ≥ 6× body size
- [ ] Black and light bands alternate
- [ ] Accent ≤ 5 % area; not used as switch-on colour
- [ ] Commit Mono ≤ 10 % of text; never in nav / caption / paragraph / footer
- [ ] Only Inter + Commit Mono
- [ ] Non-hero sections left-aligned
- [ ] Icons: pixelarticons style, multiples of 24, one family per section
- [ ] Dividers are 1 px hairlines
- [ ] Logo SVG copied verbatim; `.brand{color:var(--text)}` set
- [ ] Buttons use tokens; CTA on black = white bg / black text
- [ ] Negative red only in comparison / misuse
- [ ] Chart assumptions written under the chart
- [ ] Checked in both dark and light theme (default dark)

---

© Tokkey / amis. Commit Mono © Eigil Nikolajsen (SIL OFL 1.1, `assets/fonts/LICENSE-CommitMono-OFL.txt`). Inter © The Inter Project Authors (SIL OFL 1.1).
