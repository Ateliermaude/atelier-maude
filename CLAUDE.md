# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Static site for **Atelier MAUDÉ**, a French cashmere coat brand. No build system, no framework, no package manager — pure HTML, CSS, and vanilla JS. Deployed to GitHub Pages (`ateliermaude.github.io`) and optionally Netlify (`_headers`, `_redirects`).

To preview: open any `.html` file directly in a browser, or run a local server:

```bash
python3 -m http.server 8080
```

## Architecture

### No shared templates

Every page is a fully self-contained `.html` file. The header, nav, footer, and CSS custom properties (`:root`) are **copy-pasted** into each file. There is no templating system.

When modifying the header, nav, footer, or design tokens, the change must be applied to **every HTML file** individually.

### Shared JS files

Two files are loaded via `<script src="...">` at the bottom of each page:

- `animations.js` — IntersectionObserver-based fade-in system. Auto-tags known selectors with `.fade-in` and adds `.visible` when they enter the viewport.
- `mobile.js` — Hamburger menu: injects a close button into `.site-nav`, toggles `.nav-open`, locks scroll on open.

### Design tokens

Defined as CSS variables in each page's `:root`:

```css
--cream: #F5F0EA
--warm-white: #FAF8F5
--brown: #6B4F3A
--dark-brown: #3A2A1E
--terracotta: #8B4A3A
--gold: #C9A96E
--text: #2C2218
--muted: #8A7B6F
--border: rgba(107,79,58,0.15)
```

### Typography

- `Cormorant Garamond` (serif) — headings, logo, product names
- `Jost` (sans-serif, weight 300/400/500) — body text, nav, buttons

### Responsive breakpoints

- `@media (max-width: 1024px)` — inline in each page, adjusts grids to 2 columns
- `@media (max-width: 768px)` — in `mobile.css`, loaded by each page; triggers hamburger nav, single-column grids, reduced paddings

### Animation classes

Applied via `animations.js` or directly in HTML:

- `.fade-in` — translateY(20px) → 0, opacity 0 → 1
- `.fade-in-up`, `.fade-in-left`, `.fade-in-right` — directional variants

Add `.visible` to trigger the transition (done automatically by the observer).

## Page types

| Type | Examples |
|------|---------|
| Homepage | `index.html` |
| Collection listing | `manteaux.html`, `echarpes.html`, `ceintures.html`, `accessoires.html` |
| Product page | `hua-long.html`, `yun-court.html`, `yun-long.html`, `echarpe-wen.html`, `ceinture-sha.html`, `ceinture-ze.html` |
| Sub-collection | `manteaux-court.html`, `manteaux-long.html` |
| Journal articles | `article-*.html`, `journal.html` |
| Institutional | `notre-histoire.html`, `notre-cachemire.html`, `cgv.html`, `confidentialite.html`, `contact.html`, `guide-des-tailles.html`, `lookbook.html`, `promotions.html`, `carte-cadeau.html`, `confirmation.html` |

## Active nav link

Each page manually sets `class="active"` on its corresponding `<a>` in `.site-nav` and `.dropdown-menu`. Remember to update this when creating a new page.

## Skills disponibles

Trois skills sont disponibles pour guider les décisions de design et de frontend :

- `high-end-visual-design` — principes visuels haut de gamme, hiérarchie, typographie, espacements
- `design-taste-frontend` — goût design appliqué au code frontend, cohérence visuelle, détails qui font la différence
- `emil-design-eng` — philosophie d'Emil Kowalski sur le polish UI, les animations, et les détails invisibles qui font qu'une interface se sent juste

## Product gallery pattern

Product pages use a thumbnail + main image gallery: clicking a `.gallery-thumb` swaps `.active` on both the thumb and the corresponding `.gallery-main img`. The main image fades via `opacity` transition.
