# Safa Honey — storefront concept

## React version (`web/`)

The page rebuilt as a React app with Vite:

- **Framer Motion** handles state and entrance animation: the loader count-up and exit, the hero slider (jar swap, word swap, background tint, slide progress), the menu's circular reveal, word-by-word headings, fade-up reveals, the spring 3D card tilt, the animated product filter (shared-layout pill, cards re-flowing), the clip-path story reveal, the counters, the cursor and the toast.
- **GSAP ScrollTrigger** handles everything tied to scroll position (`web/src/useParallax.ts`): the hero's depth layers, floating jars, staggered production steps, the pinned film reveal, the story photo pan, journal photos, the bee, the footer wordmark and the marquee lean.
- three.js draws the floating honeycomb cells in the hero, loaded as a separate chunk.

Each element is driven by only one library: GSAP moves an outer wrapper or a CSS variable wherever Framer Motion already animates the element. Both are turned off for visitors who prefer reduced motion.

```
cd web
npm install
npm run dev      # local dev server
npm run build    # static site in web/dist
```

Photos, the logo and the film come from `assets/` (Vite's public folder).

## Static version

A single-page storefront concept for Safa Honey. Open `index.html` in a browser; all images are embedded, so it works offline (fonts, three.js and GSAP load from CDNs; the brand film loads from `assets/film.mp4`).

- `index.html` — the built page, with images inlined as data URIs
- `assets/` — product cutouts (transparent WebP), story/journal photos and the logo badge, made from safahoney.com product photography
- `tools/src.html` — the page before images were embedded
- `tools/cut.py` — removes the white background from a product shot: `python3 tools/cut.py in.png out.webp 900`
- `tools/build.py` — applies the photo edits to `tools/src.html`, injects the motion layer and writes `index.html`
- `tools/motion.js` / `tools/motion.css` — GSAP + ScrollTrigger parallax (hero depth layers, floating product jars, story photo pan, pinned film reveal, velocity-skewed marquee, newsletter bee, footer wordmark). Everything is off under `prefers-reduced-motion`.
- `remotion/` — Remotion project that renders the parallax brand film `assets/film.mp4` and its poster `assets/film-poster.jpg` from the photos in `assets/`

## Brand film (Remotion)

```
cd remotion
npm install
npm run studio   # preview and tweak in the browser
npm run render   # writes ../assets/film.mp4
npm run poster   # writes ../assets/film-poster.jpg
cd .. && python3 tools/build.py
```

The film is referenced as `assets/film.mp4` (not inlined), so keep `index.html` next to the `assets/` folder. The `render` and `poster` scripts point Remotion at `/opt/pw-browsers/chromium`; drop `--browser-executable` to let Remotion download its own headless Chrome.
