#!/usr/bin/env python3
"""DEV-сборка: те же игры + полёт и скорость. Основные файлы не меняются — патчи применяются только здесь."""
import pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'dev' / 'assets'; out.mkdir(parents=True, exist_ok=True)
cheat = '<script>' + (root / 'dev/cheat.js').read_text(encoding='utf-8') + '</script>'
def patch(s, old, new, name):
    assert s.count(old) == 1, f'{name}: патч не найден ({s.count(old)})'
    return s.replace(old, new)
# --- Тишина ---
s = (root / 'tishina.html').read_text(encoding='utf-8')
s = patch(s, 'function updatePlayer(dt) {\n', '''function updatePlayer(dt) {
  if (window.CHEAT && CHEAT.fly) { let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1; if (keys.KeyD || keys.ArrowRight) fx += 1; if (keys.KeyA || keys.ArrowLeft) fx -= 1; fx += touch.mx; fz += touch.mz;
    const v = CHEAT.flySpeed * ((keys.ShiftLeft || keys.ShiftRight || touch.run) ? 3 : 1), sy = Math.sin(P.yaw), cy = Math.cos(P.yaw), cp = Math.cos(P.pitch);
    P.x += (-sy * cp * fz + cy * fx) * v * dt; P.z += (-cy * cp * fz - sy * fx) * v * dt; P.y += (Math.sin(P.pitch) * fz + CHEAT.vert()) * v * dt;
    P.y = Math.max(P.y, Math.max(heightAt(P.x, P.z), -1.25)); P.vx = P.vz = P.vy = 0; P.ground = false; P.swim = false; P.stam = 1; return; }
''', 'tishina fly')
s = patch(s, 'let sp = (run ? 7.0 : 3.9)', 'let sp = (run ? 7.0 : 3.9) * (window.CHEAT ? CHEAT.mult : 1)', 'tishina speed')
s = patch(s, "  const run = (keys.ShiftLeft", "  if (window.CHEAT) P.stam = 1;\n  const run = (keys.ShiftLeft", 'tishina stamina')
s = s.replace('<title>', '<title>DEV ', 1).replace('<script>', cheat + '<script>', 1)
(out / 'tishina.html').write_text(s, encoding='utf-8')
(out / 'index.html').write_text((root / 'index.html').read_text(encoding='utf-8').replace('<title>', '<title>DEV ', 1), encoding='utf-8')
# --- Тропа и Ворота ---
for f in ['tropa.html', 'vorota.html', 'dom.html', 'podezd.html']:
    s = (root / f).read_text(encoding='utf-8')
    s = patch(s, '? 5.6 : 2.3) * Math.min(1, l);', '? 5.6 : 2.3) * Math.min(1, l) * (window.CHEAT ? CHEAT.mult : 1);', f + ' speed')
    s = patch(s, '    [nx, nz] = collide(nx, nz); P.x = nx; P.z = nz;\n    P.vy -= 11 * dt;', '''    if (window.CHEAT && CHEAT.fly) { const cp = Math.cos(P.pitch), v = CHEAT.flySpeed * ((keys.ShiftLeft || keys.ShiftRight || running) ? 3 : 1);
      P.x += (fwx * cp * fx - fwz * sx) * v * dt; P.z += (fwz * cp * fx + fwx * sx) * v * dt; P.y = Math.max(PODEZD ? -1e9 : 0, P.y + (Math.sin(P.pitch) * fx + CHEAT.vert()) * v * dt); P.vy = 0; P.ground = P.y < 0.01; P.speed = 0; }
    else { [nx, nz] = collide(nx, nz); P.x = nx; P.z = nz; }
    if (!(window.CHEAT && CHEAT.fly)) P.vy -= 11 * dt;''', f + ' fly')
    s = patch(s, 'P.vy = 0; P.ground = true; } else P.ground = false;', 'P.vy = 0; P.ground = true; } else if (!(window.CHEAT && CHEAT.fly)) P.ground = false;', f + ' ground')
    s = patch(s, 'if (dead || GARDEN || INDOOR) return;', 'if (dead || GARDEN || INDOOR || (window.CHEAT && CHEAT.fly && P.y > 2)) return;', f + ' road')
    s = s.replace('<title>', '<title>DEV ', 1).replace('<script>', cheat + '<script>', 1)
    (out / f).write_text(s, encoding='utf-8')
print('dev ok')
