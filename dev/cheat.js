// DEV-сборка: полёт и скорость (только для отдельного APK)
(function () {
  const C = window.CHEAT = { fly: false, mult: 1, up: false, down: false, get flySpeed() { return 7 * C.mult; }, vert() { return (C.up ? 1 : 0) - (C.down ? 1 : 0); } };
  const STEPS = [1, 2, 3, 5, 10, 25, 50];
  try { const s = JSON.parse(localStorage.getItem('cheat') || '{}'); if (STEPS.includes(s.mult)) C.mult = s.mult; C.fly = !!s.fly; } catch (e) {}
  const save = () => { try { localStorage.setItem('cheat', JSON.stringify({ mult: C.mult, fly: C.fly })); } catch (e) {} };
  const css = 'background:#000a;color:#ffd35a;border:1px solid #ffd35a88;border-radius:8px;font:bold 13px system-ui,sans-serif;padding:6px 10px;margin:2px;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none';
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:8px;z-index:100;display:flex;align-items:center';
  const bFly = document.createElement('button'), bMinus = document.createElement('button'), bSpd = document.createElement('span'), bPlus = document.createElement('button');
  [bFly, bMinus, bPlus].forEach((b) => (b.style.cssText = css)); bSpd.style.cssText = css + ';cursor:default;min-width:44px;text-align:center';
  bMinus.textContent = '−'; bPlus.textContent = '+';
  const bKeys = document.createElement('button'); bKeys.style.cssText = css; bKeys.textContent = '🔑';  bKeys.title = 'все ключи от ворот';
  bKeys.addEventListener('click', (e) => { e.stopPropagation(); const all = ['dvory', 'garazhi', 'tishina', 'tropa', 'dom', 'podezd', 'ostanovka', 'shkola', 'bolnica', 'metro', 'magazin', 'plyazh', 'lager', 'pole', 'elektrichka', 'stroyka', 'zima']; try { localStorage.setItem('dream_keys', JSON.stringify(all)); } catch (er) {} bKeys.textContent = '🔑✓'; });
  const up = document.createElement('button'), dn = document.createElement('button');
  for (const [b, t, k] of [[up, '⬆', 'up'], [dn, '⬇', 'down']]) { b.textContent = t; b.style.cssText = css + ';position:fixed;right:110px;width:58px;height:58px;font-size:24px;border-radius:50%;display:none;z-index:100'; b.style.bottom = k === 'up' ? '170px' : '100px';
    const on = (e) => { e.preventDefault(); e.stopPropagation(); C[k] = true; }, off = (e) => { e.preventDefault(); C[k] = false; };
    b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off, { passive: false }); b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); }
  const touchy = matchMedia('(pointer:coarse)').matches;
  function draw() { bFly.textContent = (C.fly ? '✈ Полёт: ВКЛ' : '✈ Полёт: выкл') + (touchy ? '' : ' [V]'); bFly.style.background = C.fly ? '#8a6a10cc' : '#000a'; bSpd.textContent = '×' + C.mult; up.style.display = dn.style.display = C.fly && touchy ? 'block' : 'none'; }
  const tap = (b, fn) => { b.addEventListener('click', (e) => { e.stopPropagation(); fn(); draw(); save(); }); b.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true }); };
  tap(bFly, () => { C.fly = !C.fly; }); tap(bMinus, () => { C.mult = STEPS[Math.max(0, STEPS.indexOf(C.mult) - 1)]; }); tap(bPlus, () => { C.mult = STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(C.mult) + 1)]; });
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyV') { C.fly = !C.fly; draw(); save(); }
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') { C.mult = STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(C.mult) + 1)]; draw(); save(); }
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') { C.mult = STEPS[Math.max(0, STEPS.indexOf(C.mult) - 1)]; draw(); save(); }
    if (e.code === 'Space' || e.code === 'KeyE' && false) C.up = true; if (e.code === 'KeyC' || e.code === 'ControlLeft' || e.code === 'KeyQ') C.down = true;
  }, true);
  addEventListener('keyup', (e) => { if (e.code === 'Space') C.up = false; if (e.code === 'KeyC' || e.code === 'ControlLeft' || e.code === 'KeyQ') C.down = false; }, true);
  const mount = () => { if (box.parentNode) return; box.append(bFly, bMinus, bSpd, bPlus, bKeys); document.body.append(box, up, dn); draw(); };
  if (document.body) mount(); addEventListener('DOMContentLoaded', mount);
})();
