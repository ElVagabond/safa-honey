# Safa Honey — storefront concept

A single-page storefront concept for Safa Honey. Open `index.html` in a browser; all images are embedded, so it works offline (fonts and three.js load from CDNs).

- `index.html` — the built page, with images inlined as data URIs
- `assets/` — product cutouts (transparent WebP), story/journal photos and the logo badge, made from safahoney.com product photography
- `tools/src.html` — the page before images were embedded
- `tools/cut.py` — removes the white background from a product shot: `python3 tools/cut.py in.png out.webp 900` (add `straight` for the 350 g hex jars, whose white labels run into the white background)
- `tools/jar3d.py` — builds the 3D jars' label textures and shapes from the original safahoney.com photos: `python3 tools/jar3d.py photos/ assets/3d`
- `tools/build.py` — applies the photo edits to `tools/src.html` and writes `index.html`

## `site/` — animated redesign (React + framer-motion + GSAP)

A redesign in the style of agrumeafarm.it: a scroll-driven jar carousel on a honeycomb cell, giant display type, product pages with a rising jar and a draggable gallery, and a wine-red footer. The home page lists the Raw Honey range from safahoney.com (ten honeys) in its own section, with everything else under The Pantry; products live in `site/src/data.js`.

```bash
cd site && npm install && npm run dev
```

`npm run build` writes a static site to `site/dist/`. `python3 build-artifact.py out.html` (from `site/`) builds one self-contained HTML page with everything inlined, for sharing as a Claude artifact. It reuses the photos in `assets/`.

- **framer-motion**: loader, page curtain, menu, masked text reveals, the scroll-driven carousel (`useScroll` → `useTransform`), parallax layers, cursor label, draggable gallery
- **GSAP + ScrollTrigger**: rim text running along the cell, scrubbed word fill, clip-path photo reveals, footer wordmark
- **three.js**: every honey except the 3 kg tub is a real 3D model that turns as you scroll, idles slowly and can be dragged round (with inertia). There are two jars. The tall 500 g jar (forest, acacia, neem, wild) has its shape measured from safahoney.com's face-on product photos and its labels unwrapped from them; acacia, neem and wild also get their real back labels. The straight-sided 350 g hex jar (borage, white, black forest, tulsi, sidr) has a label wrapped round five of its six faces, flattened from the front and two corner photos with a small camera model; tulsi and sidr only have a front photo, so their label covers the three faces it shows (`tools/jar3d.py`, output in `assets/3d/`). The same jars appear in 3D in the home carousel, where each turns as it travels along the arc and faces front in the centre slot; a jar's model is only set up once it comes near the centre. Each jar shows its photo until the page has settled (loader gone, no page curtain moving) and the browser is idle, then the model fades in over it. One WebGL renderer serves the whole page, and each jar times its draws (including the frame after, where software WebGL does most of its work) and spaces them so the 3D uses at most about a quarter of the page's time: 60 fps on a GPU, fewer frames rather than a stalled page on weak devices. The 3 kg tub and the vinegar keep their photos. Without WebGL the photo is shown instead
- **Lenis**: smooth scrolling, driven by GSAP's ticker so both libraries read the same scroll position
- Honours `prefers-reduced-motion`

Tests: `npm run test:e2e` (Playwright, desktop + Pixel 7) builds the site and checks the carousel, product pages, cart, menu, routing, the draggable gallery and horizontal overflow. CI runs them on every pull request; merges to `main` deploy `site/dist` to the `gh-pages` branch for GitHub Pages.
