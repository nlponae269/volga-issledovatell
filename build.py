#!/usr/bin/env python3
"""Собирает единый offline-файл index.html: шаблон + three.js + игра."""
import sys, pathlib
root = pathlib.Path(__file__).parent
three = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / 'vendor/three.min.js').read_text(encoding='utf-8')
game = '\n'.join((root / 'src' / f).read_text(encoding='utf-8') for f in ['00_textures.js', '01_world.js', '02_builder.js', '03_game.js'])
html = (root / 'src/template.html').read_text(encoding='utf-8')
assert '</script' not in three.lower().replace('<\\/script', '')
html = html.replace('<!--THREE-->', '<script>' + three + '</script>')
html = html.replace('<!--GAME-->', '<script>\n(function(){\n"use strict";\n' + game + '\n})();\n</script>')
(root / 'index.html').write_text(html, encoding='utf-8')
print('index.html', len(html) // 1024, 'KB')
