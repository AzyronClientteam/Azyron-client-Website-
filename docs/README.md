# AZYRON CLIENT — Website

The official marketing site for **AZYRON CLIENT**, a premium Minecraft: Java Edition client
created by **JIGNESH GAMING**.

Hand-built static site: **no framework, no build step, no dependencies.** Just HTML, one
stylesheet, one script, self-hosted fonts and optimised artwork.

---

## Run it locally

Any static server works. From the repository root:

```bash
python3 -m http.server 5173 --directory website
# open http://localhost:5173
```

Or with Node:

```bash
npx serve website
```

Deploy by uploading the `docs/` folder to GitHub Pages, Netlify, Vercel, Cloudflare Pages
or any bucket. There is nothing to compile.

---

## What's inside

```
docs/
├── index.html                  → single page, all sections
├── robots.txt · sitemap.xml
├── site.webmanifest            → PWA-ish icon + theme metadata
└── assets/
    ├── css/style.css           → design tokens + every component + responsive rules
    ├── js/main.js              → loader, particles, reveals, chart, HUD, lightbox…
    ├── fonts/                  → self-hosted woff2 (Chakra Petch · Inter · JetBrains Mono)
    └── img/                    → hero, 7 in-world shots, OG card, icons
```

### Sections
`Home` · `Features` · `HUD showcase` · `Performance` · `Screenshots` · `Download` · `FAQ` · `Discord`

### Signature interactions
| Interaction | Where |
|---|---|
| Logo draw intro + progress boot screen | `#loader`, skipped after `window.load` (max 6s) |
| Glowing particle field w/ cursor parallax | `#particles` canvas, DPR-capped, pauses when hidden |
| Scroll reveals with sibling stagger | `[data-reveal]` + IntersectionObserver |
| 3D tilt with light that follows the cursor | `[data-tilt]` feature cards |
| Parallax hero art, floating amethyst/obsidian/quartz blocks | `[data-parallax]`, CSS 3D cubes |
| Live FPS benchmark graph + profile switching | `#perfChart` canvas, 3 profiles |
| In-game HUD demo (keys, CPS, FPS, hotbar) | `.hud` mock, pauses off-screen |
| Gallery lightbox (keyboard + swipe) | `.shot` → `#lightbox` |
| Curtain page transitions between sections | `#curtain` |
| Magnetic buttons, custom cursor glow | `[data-magnetic]`, `#cursor` |

Everything heavy is disabled or reduced under `prefers-reduced-motion: reduce`.

---

## Customise in 60 seconds

**Discord invite** — search and replace `https://discord.gg/azyron` in `index.html`.

**Download links** — the buttons currently point at the GitHub organisation
(`https://github.com/AzyronClientteam`). Replace with your release URLs:

```html
<!-- primary APK -->
<a class="btn btn--primary ..." href="https://github.com/…/releases/latest/download/azyron.apk">
<!-- Java core -->
<a class="btn btn--ghost ..." href="https://github.com/…/releases/latest">
```

**Version / size / checksum** — edit the `.dl-specs`, `.dl-card__ver`, `.dl-checksum` and
`.timeline` blocks inside `#download`. The checksum `#checksum` text is what the copy button
copies.

**Brand colours** — every colour is a token in `:root` (`--purple`, `--silver`, `--void`…).
Change them once and the whole site follows.

**Copy** — all text is plain markup inside `index.html`; there is no CMS or data layer.

---

## Performance notes

- ~70 KB of CSS, ~22 KB of JS, ~160 KB of fonts (only latin subsets, `font-display: swap`).
- Hero artwork preloaded and served as WebP with a JPEG fallback; gallery is lazy-loaded WebP.
- Animations are `transform`/`opacity` only; particles stop when the tab is hidden and the
  marquee pauses off-screen.
- No third-party requests at runtime — no Google Fonts, no analytics, no trackers.

---

## Credits

- Design & build: for **JIGNESH GAMING**
- Typography: [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) and
  [Inter](https://rsms.me/inter/) under the SIL Open Font License,
  [JetBrains Mono](https://www.jetbrains.com/lp/mono/) under the OFL.
- In-world artwork generated for this project.

AZYRON CLIENT is an independent project. It is not affiliated with Mojang Studios or Microsoft.
Minecraft is a trademark of Mojang Synergies AB.
