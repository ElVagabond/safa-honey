# Safa Honey — storefront concept

A single-page storefront concept for Safa Honey. Open `index.html` in a browser; all images are embedded, so it works offline (fonts and three.js load from CDNs).

- `index.html` — the built page, with images inlined as data URIs
- `assets/` — product cutouts (transparent WebP), story/journal photos and the logo badge, made from safahoney.com product photography
- `tools/src.html` — the page before images were embedded
- `tools/cut.py` — removes the white background from a product shot: `python3 tools/cut.py in.png out.webp 900`
- `tools/build.py` — applies the photo edits to `tools/src.html` and writes `index.html`
