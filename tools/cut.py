import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, dst, maxd = sys.argv[1], sys.argv[2], int(sys.argv[3])
thr = int(sys.argv[4]) if len(sys.argv) > 4 else 236
im = Image.open(src).convert('RGB')
im.thumbnail((maxd, maxd), Image.LANCZOS)
a = np.asarray(im).astype(np.int16)
mn = a.min(2); mx = a.max(2)
near = (mn >= thr) & ((mx - mn) <= 14)
m = Image.fromarray((near * 255).astype(np.uint8)).copy()
W, H = m.size
# flood from every border pixel that is near-white
for x in range(0, W, 4):
    for y in (0, H - 1):
        if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
for y in range(0, H, 4):
    for x in (0, W - 1):
        if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
bg = np.array(m) == 128
# soft edge: pixels within 2px of bg get alpha from how far from white they are
bgimg = Image.fromarray((bg * 255).astype(np.uint8))
ring = np.asarray(bgimg.filter(ImageFilter.MaxFilter(5))) > 0
soft = np.clip((255 - mn) / (255 - thr + 30), 0, 1)
alpha = np.where(bg, 0, np.where(ring, soft, 1.0))
al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6))
out = im.convert('RGBA'); out.putalpha(al)
bbox = al.point(lambda v: 255 if v > 8 else 0).getbbox()
out = out.crop(bbox)
out.save(dst, 'WEBP', quality=82, method=6)
print(dst, out.size)
