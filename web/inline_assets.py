"""Embed ../assets into dist-single/index.html as window.__ASSETS so the page works as one file."""
import base64, os, sys
LITE = "--lite" in sys.argv  # leave the film out (poster only) for viewers with a size limit
D = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(D, '..', 'assets')
mime = {'webp': 'image/webp', 'png': 'image/png', 'jpg': 'image/jpeg', 'mp4': 'video/mp4'}
files = ['logo.png', 'forest.webp', 'acacia.webp', 'sidr.webp', 'neem.webp', 'wild.webp', 'wild3k.webp', 'acv.webp',
         'lifestyle.webp', 'story.webp', 'ginger.webp', 'film.mp4', 'film-poster.jpg']
files = [f for f in files if not (LITE and f == 'film.mp4')]
entries = ','.join(f'"{f}":"data:{mime[f.rsplit(".", 1)[1]]};base64,{base64.b64encode(open(os.path.join(A, f), "rb").read()).decode()}"' for f in files)
out = os.path.join(D, 'dist-single', 'index.html')
html = open(out, encoding='utf-8').read()
html = html.replace('<head>', '<head>\n<script>window.__ASSETS={' + entries + '}</script>', 1)
dst = os.path.join(D, 'dist-single', 'safa-honey-lite.html' if LITE else 'safa-honey-live.html')
open(dst, 'w', encoding='utf-8').write(html)
print('wrote', dst, round(len(html) / 1e6, 1), 'MB')
