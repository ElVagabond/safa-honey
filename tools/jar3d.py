"""Turn safahoney.com's face-on jar photos into textures and a shape profile for the 3D jar.

The hexagonal jar is shot straight at one flat face, so on every row of the photo that face
is the middle half of the silhouette (a hexagon's face is half as wide as the hexagon measured
corner to corner). Each row of that strip is resampled into a flat label texture, and the
silhouette width gives the jar's profile from neck to base.

The 350 g honeys come in a second jar: a straight-sided hexagon with a label wrapped round five
of its six faces. It is shot face-on and at two corners, from slightly above, so its label is
unwrapped with a small camera model instead (see HEX_JOBS and hex_camera below).

Usage: python3 tools/jar3d.py SRC_DIR OUT_DIR
SRC_DIR holds the original photos from safahoney.com (names in JOBS and HEX_JOBS below).
Writes OUT_DIR/<slug>-front.webp, optional <slug>-back.webp, <slug>-wrap.webp for the hex jars,
and OUT_DIR/jars.json.
"""
import json, sys, pathlib
import numpy as np
from PIL import Image

# slug: front photo, back photo or None, horizontal crop (fractions) when a photo shows two jars
JOBS = {
    'raw-forest-honey': ('Forest-Honey-1.png', None, None),
    'raw-acacia-honey': ('KW500-Front.jpg', 'KW500-Back.jpg', None),
    'neem-blossom-honey': ('Neem-Honey-1kg.png', 'NM500-Back-1.png', (0.5, 1.0)),
    'raw-wild-honey': ('Wild-Honey-2.png', 'WL500-Back.png', None),
}
TEX_W, TEX_H = 512, 1024
# Honey colour seen through the glass. Sampled from the photos it reads too light (studio
# highlights) or grey (the dark wild-honey glass), so these are set by eye against the photos.
HONEY = {'raw-forest-honey': '#8a3a12', 'raw-acacia-honey': '#e8c25e',
         'neem-blossom-honey': '#6e2c12', 'raw-wild-honey': '#3a2213'}


# Hex jar. Faces are numbered clockwise seen from above, 0 = front; the label covers all but the
# back face (3). Each shot: photo, the angle the jar was turned to, and the faces to take from it.
# Lengths are in units of the hexagon's corner radius, heights measured up from the base.
HEX_JOBS = {
    'raw-borage-honey': [('IMG_0016_1.jpg', 0, [0]), ('IMG_0017_1.jpg', 90, [4, 5]), ('IMG_0018_1.jpg', -90, [1, 2])],
    'raw-white-honey': [('IMG_0021.jpg', 0, [0]), ('IMG_0025.jpg', 90, [4, 5]), ('IMG_0022.jpg', -90, [1, 2])],
    'raw-black-forest-honey': [('IMG_0032.jpg', 0, [0]), ('IMG_0034.jpg', 90, [4, 5]), ('IMG_0033.jpg', -90, [1, 2])],
    # only a front photo exists for these two: the label's three visible faces
    'raw-tulsi-honey': [('TL350-Front.jpg', 0, [5, 0, 1])],
    'premium-sidr-honey': [('SD350-Front.jpg', 0, [5, 0, 1])],
}
HEX_ORDER = [4, 5, 0, 1, 2]            # left to right along the unrolled label
HEX_BAND = (0.15, 1.64)                # bottom and top edge of the label
HEX_PITCH, HEX_DIST = np.radians(10), 12.0   # the studio camera: looking down 10 degrees from 12 radii away
HEX_FACE_PX = 320
# honey and lid colours, set by eye against the photos
HEX_LOOK = {'raw-borage-honey': ('#e3c574', 'gold'), 'raw-white-honey': ('#efe6cf', 'black'),
            'raw-black-forest-honey': ('#30130a', 'black'), 'raw-tulsi-honey': ('#5a1d08', 'black'),
            'premium-sidr-honey': ('#8a4416', 'black')}
# Shape, read off the corner-on photos: [height, radius, roundness] from the base up. Roundness
# blends the hexagon (0) into the round neck (1).
HEX_PROFILE = [[0, 0.93, 0], [0.05, 1, 0], [HEX_BAND[0], 1, 0], [HEX_BAND[1], 1, 0], [1.84, 1, 0], [1.93, 0.97, 0.3],
               [2.0, 0.88, 0.65], [2.06, 0.76, 1], [2.19, 0.72, 1]]
HEX_LID = {'h': 0.25, 'r': 0.83}


def hex_project(P, cam):
    """Jar coordinates (x right, y up from the base, z towards the camera) to photo pixels."""
    yaw, s, cx, cy = cam
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    c, n = np.cos(yaw), np.sin(yaw)
    x, z = x * c + z * n, -x * n + z * c
    c, n = np.cos(HEX_PITCH), np.sin(HEX_PITCH)
    y, z = y * c - z * n, y * n + z * c
    k = HEX_DIST / (HEX_DIST - z)
    return np.stack([cx + s * x * k, cy - s * y * k], -1)


def hex_corner(k):
    a = np.radians(-30 + 60 * k)
    return np.array([np.sin(a), 0.0, np.cos(a)])


def hex_camera(a, yaw):
    """Scale and position of the jar in a photo, from its silhouette: the straight body gives the
    width (corner to corner face-on, flat to flat at a corner) and the lowest row is the nearest
    point of the base."""
    L, R = extents(a)
    rows = np.flatnonzero(L >= 0)
    top, bot = rows[0], rows[-1]
    body = slice(int(top + (bot - top) * 0.45), int(top + (bot - top) * 0.8))
    l, r = np.median(L[body]), np.median(R[body])
    s = (r - l) / (np.sqrt(3) if yaw else 2)
    near = np.array([0.0, 0.0, 1.0 if yaw else np.sqrt(3) / 2])
    return np.radians(yaw), s, (l + r) / 2, bot - hex_project(near, (0.0, s, 0.0, 0.0))[1]


def hex_face(a, cam, k):
    """One face of the label, flattened: every texel is a point on the jar, looked up in the photo."""
    y0, y1 = HEX_BAND
    h = int(round(HEX_FACE_PX * (y1 - y0)))
    u = ((np.arange(HEX_FACE_PX) + 0.5) / HEX_FACE_PX)[None, :, None]
    v = (y1 - (np.arange(h) + 0.5) / h * (y1 - y0))[:, None, None]
    P = hex_corner(k) * (1 - u) + hex_corner(k + 1) * u + np.array([0.0, 1.0, 0.0]) * v
    p = hex_project(P, cam)
    x, y = p[..., 0], p[..., 1]
    x0 = np.clip(np.floor(x).astype(int), 0, a.shape[1] - 2)
    y0 = np.clip(np.floor(y).astype(int), 0, a.shape[0] - 2)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    return (a[y0, x0] * (1 - fx) + a[y0, x0 + 1] * fx) * (1 - fy) + (a[y0 + 1, x0] * (1 - fx) + a[y0 + 1, x0 + 1] * fx) * fy


def hex_jars(src, out):
    jars = {}
    for slug, shots in HEX_JOBS.items():
        faces = {}
        for photo, yaw, ks in shots:
            a = np.asarray(Image.open(src / photo).convert('RGB')).astype(np.float32)
            cam = hex_camera(a, yaw)
            for k in ks:
                faces[k] = hex_face(a, cam, k)
        order = [k for k in HEX_ORDER if k in faces]
        tex = np.concatenate([faces[k] for k in order], 1)
        Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).save(out / f'{slug}-wrap.webp', 'WEBP', quality=86, method=6)
        honey, lid = HEX_LOOK[slug]
        jars[slug] = {'mould': 'hex', 'honey': honey, 'lid': lid, 'faces': order}
        print(slug, jars[slug])
    return jars


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
    jars = {s: {'honey': m['honey'], 'back': m['back']} for s, m in meta.items()}
    jars.update(hex_jars(src, out))
    hexa = {'profile': HEX_PROFILE, 'band': list(HEX_BAND), 'lid': HEX_LID}
    json.dump({'shape': shape, 'hex': hexa, 'jars': jars}, open(out / 'jars.json', 'w'), indent=1)
    print(shape)


if __name__ == '__main__':
    main(*sys.argv[1:3])
