#!/usr/bin/env python3
"""Собирает единый offline-файл index.html: шаблон + three.js + игра."""
import sys, pathlib
root = pathlib.Path(__file__).parent
three = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / 'vendor/three.min.js').read_text(encoding='utf-8')
game = '\n'.join((root / 'src' / f).read_text(encoding='utf-8') for f in ['00_textures.js', '01_world.js', '02_builder.js', '03_game.js'])
html = (root / 'src/template.html').read_text(encoding='utf-8')
assert '</script' not in three.lower().replace('<\\/script', '')
MUSIC = '<script>' + (root / 'src/music.js').read_text(encoding='utf-8') + '</script>'
MOTION = (root / 'src/motion.html').read_text(encoding='utf-8')
def motion(h, wid=None):
    import base64 as _b, json as _j
    bf = root / 'src/menu/blur' / ((wid or 'tishina') + '.jpg')
    m = MOTION.replace("/*WBG*/''", _j.dumps('data:image/jpeg;base64,' + _b.b64encode(bf.read_bytes()).decode()) if wid != 'menu' and bf.exists() else "''")
    i = h.rfind('</body>')
    return h[:i] + m + h[i:] if i >= 0 else h + m
html = html.replace('<!--THREE-->', MUSIC + '<script>' + three + '</script>')
html = html.replace('<!--GAME-->', '<script>\n(function(){\n"use strict";\n' + game + '\n})();\n</script>')
(root / 'tishina.html').write_text(motion(html), encoding='utf-8')
print('tishina.html', len(html) // 1024, 'KB')
GAME = '<script>\n(function(){\n"use strict";\n' + '\n'.join((root / f).read_text(encoding='utf-8') for f in ['src/00_textures.js'] + sorted(str(p.relative_to(root)) for p in (root / 'src/tropa').glob('t*.js'))) + '\n})();\n</script>'
sys.path.insert(0, str(root / 'src')); from worlds import WORLDS
tpl = (root / 'src/world.html').read_text(encoding='utf-8')
for wid, w in WORLDS.items():
    page = (tpl.replace('%TITLE%', w['h1'].capitalize()).replace('%H1%', w['h1']).replace('%BG%', w['bg']).replace('%HUD%', w['hud']).replace('%TEXT%', w['text'])
            .replace('%WORLD%', wid).replace('%LIGHT%', '' if w.get('light') else 'display:none').replace('%KEYS%', ', F — фонарик' if w.get('light') else ''))
    page = page.replace('<!--THREE-->', MUSIC + '<script>' + three + '</script>').replace('<!--GAME-->', GAME)
    if wid == 'kvartira':
        import base64 as _b, json as _j
        page = page.replace('/*KVIMG*/{}', _j.dumps({'o%d' % i: 'data:image/jpeg;base64,' + _b.b64encode((root / ('src/kv/okno%d.jpg' % i)).read_bytes()).decode() for i in (1, 2)}))
    (root / (wid + '.html')).write_text(motion(page, wid), encoding='utf-8')
print('миры:', len(WORLDS), 'по', len(page) // 1024, 'KB')
import base64, json
thumbs = {p.stem: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode() for p in (root / 'src/menu').glob('*.jpg')}
blur = {p.stem: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode() for p in (root / 'src/menu/blur').glob('*.jpg')}
menu = (root / 'src/menu.html').read_text(encoding='utf-8').replace('/*THUMBS*/{}', json.dumps(thumbs)).replace('/*BLUR*/{}', json.dumps(blur)).replace('<!--MUSIC-->', MUSIC)
(root / 'index.html').write_text(motion(menu, 'menu'), encoding='utf-8')
print('index.html (меню)', len(menu) // 1024, 'KB')
