"""Turn safahoney.com's face-on jar photos into textures and a shape profile for the 3D jar.

The hexagonal jar is shot straight at one flat face, so on every row of the photo that face
is the middle half of the silhouette (a hexagon's face is half as wide as the hexagon measured
corner to corner). Each row of that strip is resampled into a flat label texture, and the
silhouette width gives the jar's profile from neck to base.

Usage: python3 tools/jar3d.py SRC_DIR OUT_DIR
SRC_DIR holds the original photos from safahoney.com (names in JOBS below).
Writes OUT_DIR/<slug>-front.webp, optional <slug>-back.webp, and OUT_DIR/jars.json.
"""
import json, sys, pathlib
import numpy as np
from PIL import Image

# slug: front photo, back photo or None, horizontal crop (fractions) when a photo shows two jars
JOBS = {
    'raw-forest-honey': ('Forest-Honey-1.png', None, None),
    'raw-acacia-honey': ('KW500-Front.jpg', 'KW500-Back.jpg', None),
    'neem-blossom-honey': ('Neem-Honey-1kg.png', None, (0.5, 1.0)),
    'raw-wild-honey': ('Wild-Honey-2.png', 'WL500-Back.png', None),
}
TEX_W, TEX_H = 512, 1024
# Honey colour seen through the glass. Sampled from the photos it reads too light (studio
# highlights) or grey (the dark wild-honey glass), so these are set by eye against the photos.
HONEY = {'raw-forest-honey': '#8a3a12', 'raw-acacia-honey': '#e8c25e',
         'neem-blossom-honey': '#6e2c12', 'raw-wild-honey': '#3a2213'}


def load(path, crop):
    im = Image.open(path).convert('RGB')
    if crop:
        im = im.crop((int(im.width * crop[0]), 0, int(im.width * crop[1]), im.height))
    if max(im.size) > 1600:
        im.thumbnail((1600, 1600), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def extents(a):
    """Per-row left/right edge of the jar (white background, soft grey shadow ignored)."""
    mx, mn = a.max(2), a.min(2)
    jar = ((mx - mn) > 22) | (mn < 185)
    H, W = jar.shape
    L, R = np.full(H, -1), np.full(H, -1)
    for y in range(H):
        xs = np.flatnonzero(jar[y])
        if len(xs) > W * 0.05:
            L[y], R[y] = xs[0], xs[-1]
    return L, R


def smooth(v, k=9):
    pad = np.pad(v, k, mode='edge')
    return np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(v))])


def analyse(a):
    L, R = extents(a)
    rows = np.flatnonzero(L >= 0)
    top, bot = rows[0], rows[-1]
    w = smooth((R - L).astype(float))
    # lid: the first ~20% of the jar; it ends where the width falls off to the neck
    lid_w = np.median(w[top + int((bot - top) * 0.03): top + int((bot - top) * 0.08)])
    y = top + int((bot - top) * 0.08)
    while y < bot and w[y] > lid_w * 0.985:
        y += 1
    neck = y + np.argmin(w[y: y + int((bot - top) * 0.06)])
    # base: trim the last rows where the rounded bottom and its shadow pinch in
    body = np.arange(neck, bot + 1)
    return dict(L=L, R=R, w=w, top=top, lid_bottom=y, neck=neck, bot=bot, lid_w=lid_w, body=body)


def unwrap(a, g):
    """Resample the middle half of each body row into a TEX_W x TEX_H texture."""
    out = np.zeros((TEX_H, TEX_W, 3), np.float32)
    ys = np.linspace(g['neck'], g['bot'], TEX_H)
    for i, yf in enumerate(ys):
        y = int(round(yf))
        c = (g['L'][y] + g['R'][y]) / 2
        half = g['w'][y] / 4
        xs = np.linspace(c - half, c + half, TEX_W)
        x0 = np.clip(np.floor(xs).astype(int), 0, a.shape[1] - 2)
        t = (xs - x0)[:, None]
        out[i] = a[y, x0] * (1 - t) + a[y, x0 + 1] * t
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def side_colour(a, g):
    """Median colour of the angled side faces around mid-height: the honey seen through glass."""
    px = []
    for y in range(int(g['neck'] + (g['bot'] - g['neck']) * 0.3), int(g['neck'] + (g['bot'] - g['neck']) * 0.7), 4):
        c, R = (g['L'][y] + g['R'][y]) / 2, g['w'][y] / 2
        for f in (-0.75, -0.62, 0.62, 0.75):
            px.append(a[y, int(c + f * R)])
    return '#%02x%02x%02x' % tuple(int(v) for v in np.median(np.array(px), 0))


def main(src, out):
    src, out = pathlib.Path(src), pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    meta, profiles = {}, []
    for slug, (front, back, crop) in JOBS.items():
        a = load(src / front, crop)
        g = analyse(a)
        unwrap(a, g).save(out / f'{slug}-front.webp', 'WEBP', quality=86, method=6)
        h = g['bot'] - g['neck']
        rmax = g['w'][g['body']].max() / 2
        prof = [(float((g['bot'] - y) / h), float(g['w'][y] / 2 / rmax)) for y in np.linspace(g['neck'], g['bot'], 41).astype(int)]
        profiles.append(prof)
        meta[slug] = {'honey': HONEY.get(slug) or side_colour(a, g), 'back': bool(back),
                      'lid': {'h': float((g['lid_bottom'] - g['top']) / h), 'r': float(g['lid_w'] / 2 / rmax)},
                      'aspect': float(h / (2 * rmax))}
        if back:
            b = load(src / back, None)
            unwrap(b, analyse(b)).save(out / f'{slug}-back.webp', 'WEBP', quality=86, method=6)
        print(slug, meta[slug])
    # the four jars are the same mould: average their profiles into one shape
    prof = np.mean(np.array(profiles), 0)
    shape = {'profile': [[round(y, 4), round(r, 4)] for y, r in prof],
             'aspect': round(float(np.mean([m['aspect'] for m in meta.values()])), 4),
             'lid': {k: round(float(np.mean([m['lid'][k] for m in meta.values()])), 4) for k in ('h', 'r')}}
    json.dump({'shape': shape, 'jars': {s: {'honey': m['honey'], 'back': m['back']} for s, m in meta.items()}},
              open(out / 'jars.json', 'w'), indent=1)
    print(shape)


if __name__ == '__main__':
    main(*sys.argv[1:3])
