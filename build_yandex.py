#!/usr/bin/env python3
"""Сборка для Яндекс Игр: dist/yandex/ + dist/Tishina-yandex.zip (index.html в корне архива).
Подключает SDK (/sdk.js), вызывает LoadingAPI.ready(), добавляет пропуски за яны (src/yandex.js).
Музыка не входит (чужие треки), исходники-PNG сгенерированных текстур тоже."""
import pathlib, shutil, subprocess, sys, zipfile
root = pathlib.Path(__file__).parent
subprocess.run([sys.executable, str(root / 'build.py')], check=True, stdout=subprocess.DEVNULL)
out = root / 'dist/yandex'
shutil.rmtree(out, ignore_errors=True); out.mkdir(parents=True)
SDK = '<script src="/sdk.js"></script>'
YJS = '<script>' + (root / 'src/yandex.js').read_text(encoding='utf-8') + '</script>'
READY = '<script>if(window.YaGames)YaGames.init().then(function(s){try{s.features.LoadingAPI.ready()}catch(e){}}).catch(function(){});</script>'

def inject(html, body):
    i = html.find('<head>')
    html = html[:i + 6] + SDK + html[i + 6:] if i >= 0 else SDK + html
    j = html.rfind('</body>')
    return html[:j] + body + html[j:] if j >= 0 else html + body

pages = ['index.html', 'tishina.html'] + [p.name for p in root.glob('*.html') if p.name not in ('index.html', 'tishina.html')]
# общие скрипты выносим в файлы (иначе three.js + движок дублируются в 19 страницах и архив > 100 МБ)
three = (root / 'vendor/three.min.js').read_text(encoding='utf-8')
music = '<script>' + (root / 'src/music.js').read_text(encoding='utf-8') + '</script>'
game = '<script>\n(function(){\n"use strict";\n' + '\n'.join((root / f).read_text(encoding='utf-8') for f in ['src/00_textures.js'] + sorted(str(p.relative_to(root)) for p in (root / 'src/tropa').glob('t*.js'))) + '\n})();\n</script>'
(out / 'three.min.js').write_text(three, encoding='utf-8')
(out / 'game.js').write_text(game[len('<script>'):-len('</script>')], encoding='utf-8')
for name in pages:
    h = (root / name).read_text(encoding='utf-8')
    h = h.replace(music + '<script>' + three + '</script>', '<script src="three.min.js"></script>').replace(game, '<script src="game.js"></script>').replace(music, '')
    (out / name).write_text(inject(h, YJS), encoding='utf-8')
# ресурсы (без исходников-PNG генерации)
shutil.copytree(root / 'res', out / 'res', ignore=shutil.ignore_patterns('*_raw*.png', 'README.md'))
# гаражи (отдельная игра автора) — только SDK + ready
shutil.copytree(root / 'garages', out / 'garages')
g = out / 'garages/index.html'; g.write_text(inject(g.read_text(encoding='utf-8'), READY), encoding='utf-8')
# проверка имён: без пробелов и кириллицы
bad = [str(p.relative_to(out)) for p in out.rglob('*') if any(c == ' ' or ord(c) > 127 for c in p.name)]
assert not bad, bad
z = root / 'dist/Tishina-yandex.zip'
z.unlink(missing_ok=True)
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for p in sorted(out.rglob('*')):
        if p.is_file(): zf.write(p, p.relative_to(out).as_posix())
raw = sum(p.stat().st_size for p in out.rglob('*') if p.is_file())
print(f'{z.name}: {z.stat().st_size / 1e6:.1f} МБ (распаковано {raw / 1e6:.1f} МБ), страниц {len(pages)}')
