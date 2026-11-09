# Safa Honey — storefront concept

A single-page storefront concept for Safa Honey. Open `index.html` in a browser; all images are embedded, so it works offline (fonts and three.js load from CDNs).

- `index.html` — the built page, with images inlined as data URIs
- `assets/` — product cutouts (transparent WebP), story/journal photos and the logo badge, made from safahoney.com product photography
- `tools/src.html` — the page before images were embedded
- `tools/cut.py` — removes the white background from a product shot: `python3 tools/cut.py in.png out.webp 900`
- `tools/build.py` — applies the photo edits to `tools/src.html` and writes `index.html`

## `site/` — animated redesign (React + framer-motion + GSAP)

A redesign in the style of agrumeafarm.it: a scroll-driven jar carousel on a honeycomb cell, giant display type, product pages with a rising jar and a draggable gallery, and a wine-red footer.

```bash
cd site && npm install && npm run dev
```

`npm run build` writes a static site to `site/dist/`. `python3 build-artifact.py out.html` (from `site/`) builds one self-contained HTML page with everything inlined, for sharing as a Claude artifact. It reuses the photos in `assets/`.

- **framer-motion**: loader, page curtain, menu, masked text reveals, the scroll-driven carousel (`useScroll` → `useTransform`), parallax layers, cursor label, draggable gallery
- **GSAP + ScrollTrigger**: rim text running along the cell, scrubbed word fill, clip-path photo reveals, footer wordmark
- **Lenis**: smooth scrolling, driven by GSAP's ticker so both libraries read the same scroll position
- Honours `prefers-reduced-motion`

Tests: `npm run test:e2e` (Playwright, desktop + Pixel 7) builds the site and checks the carousel, product pages, cart, menu, routing, the draggable gallery and horizontal overflow. CI runs them on every pull request; merges to `main` deploy `site/dist` to the `gh-pages` branch for GitHub Pages.
