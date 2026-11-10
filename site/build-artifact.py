"""Build site/ into one self-contained HTML page (JS, CSS and photos inlined) for publishing as a Claude artifact.

Usage: python3 build-artifact.py OUT.html
"""
import re, subprocess, sys, pathlib

root = pathlib.Path(__file__).parent
subprocess.run(['npx', 'vite', 'build', '--outDir', 'dist-artifact', '--emptyOutDir',
                '--config', 'vite.artifact.config.js'], cwd=root, check=True)
dist = root / 'dist-artifact'
html = (dist / 'index.html').read_text()
css = ''.join((dist / p).read_text() for p in re.findall(r'<link rel="stylesheet"[^>]*href="\./([^"]+)"', html))
js = ''.join((dist / p).read_text() for p in re.findall(r'<script type="module"[^>]*src="\./([^"]+)"', html))
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
head = re.sub(r'<link rel="stylesheet"[^>]*href="\./[^"]+">\s*', '', head)
head = re.sub(r'<script type="module"[^>]*></script>\s*', '', head)
head = re.sub(r'<title>.*?</title>', '<title>Safa Honey</title>', head)
head = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', '', head)
out = (head.strip() + f'\n<style>\n:root{{color-scheme:light}}\n{css}</style>\n<div id="root"></div>\n'
       f'<script type="module">\n{js.replace("</script", "<\\/script")}\n</script>\n')
pathlib.Path(sys.argv[1]).write_text(out)
print('wrote', sys.argv[1], len(out), 'bytes')
