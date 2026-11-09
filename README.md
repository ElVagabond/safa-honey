# Safa Honey — storefront concept

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
