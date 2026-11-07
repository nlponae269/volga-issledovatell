#!/usr/bin/env python3
"""Собирает единый offline-файл index.html: шаблон + three.js + игра."""
import sys, pathlib
root = pathlib.Path(__file__).parent
three = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / 'vendor/three.min.js').read_text(encoding='utf-8')
game = '\n'.join((root / 'src' / f).read_text(encoding='utf-8') for f in ['00_textures.js', '01_world.js', '02_builder.js', '03_game.js'])
html = (root / 'src/template.html').read_text(encoding='utf-8')
assert '</script' not in three.lower().replace('<\\/script', '')
MUSIC = '<script>' + (root / 'src/music.js').read_text(encoding='utf-8') + '</script>'
html = html.replace('<!--THREE-->', MUSIC + '<script>' + three + '</script>')
html = html.replace('<!--GAME-->', '<script>\n(function(){\n"use strict";\n' + game + '\n})();\n</script>')
(root / 'index.html').write_text(html, encoding='utf-8')
print('index.html', len(html) // 1024, 'KB')
tro = (root / 'src/tropa.html').read_text(encoding='utf-8')
tro = tro.replace('<!--THREE-->', MUSIC + '<script>' + three + '</script>')
tro = tro.replace('<!--GAME-->', '<script>\n(function(){\n"use strict";\n' + '\n'.join((root / f).read_text(encoding='utf-8') for f in ['src/00_textures.js'] + sorted(str(p.relative_to(root)) for p in (root / 'src/tropa').glob('t*.js'))) + '\n})();\n</script>')
(root / 'tropa.html').write_text(tro, encoding='utf-8')
print('tropa.html', len(tro) // 1024, 'KB')
vo = (root / 'src/vorota.html').read_text(encoding='utf-8').replace('<!--THREE-->', MUSIC + '<script>' + three + '</script>').replace('<!--GAME-->', tro[tro.index('<script>\n(function(){'):tro.rindex('</script>') + 9])
(root / 'vorota.html').write_text(vo, encoding='utf-8')
print('vorota.html', len(vo) // 1024, 'KB')
