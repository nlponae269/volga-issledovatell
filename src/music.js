// Фоновая музыка для всех миров: оригинал / slowed + reverb / выкл. Файлы лежат в music/ (только в APK).
(function () {
  const LISTS = { slowed: ['music/s1.mp3', 'music/s2.mp3'], orig: ['music/o1.mp3', 'music/o2.mp3'] };
  const NAMES = { slowed: '♪ slowed + reverb', orig: '♪ оригинал', off: '♪ выкл' };
  const ORDER = ['slowed', 'orig', 'off'];
  let mode = 'slowed'; try { mode = localStorage.getItem('music_mode') || 'slowed'; } catch (e) {}
  if (!ORDER.includes(mode)) mode = 'slowed';
  let idx = 0; try { idx = +(localStorage.getItem('music_idx') || 0) % 2; } catch (e) {}
  let a = new Audio(); a.preload = 'auto'; let ok = true, unlocked = false, fadeT = null, VOL = 0.42;
  const btn = document.createElement('button');
  btn.style.cssText = 'position:fixed;left:10px;top:10px;z-index:99;background:#0006;color:#ddd;border:1px solid #fff3;border-radius:14px;padding:5px 11px;font:12px system-ui,sans-serif;cursor:pointer;opacity:.8';
  const label = () => { btn.textContent = NAMES[mode]; };
  function fade(to, ms, cb) { clearInterval(fadeT); const from = a.volume, t0 = performance.now(); fadeT = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (to - from) * k; if (k >= 1) { clearInterval(fadeT); cb && cb(); } }, 40); }
  function onEnded() { idx = (idx + 1) % 2; try { localStorage.setItem('music_idx', idx); } catch (e) {} load(); play(); }
  function onErr() { ok = false; btn.style.display = 'none'; }
  // для каждого трека — новый элемент (переиспользование src в WebView иногда «зависает» на загрузке)
  function load() { if (mode === 'off') return; try { a.pause(); a.removeEventListener('ended', onEnded); a.removeEventListener('error', onErr); a.removeAttribute('src'); a.load(); } catch (e) {}
    a = new Audio(LISTS[mode][idx]); a.preload = 'auto'; a.addEventListener('ended', onEnded); a.addEventListener('error', onErr); }
  function play() { if (mode === 'off' || !ok || !unlocked) return; if (!a.src) load(); a.volume = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); fade(VOL, 2500); }
  function cycle() { mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]; try { localStorage.setItem('music_mode', mode); } catch (e) {} label();
    fade(0, 400, () => { a.pause(); if (mode === 'off') return; load(); play(); }); }
  btn.addEventListener('click', (e) => { e.stopPropagation(); unlocked = true; cycle(); });
  btn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  const unlock = () => { if (unlocked) return; unlocked = true; play(); };
  addEventListener('pointerdown', unlock, true); addEventListener('keydown', (e) => { if (e.code === 'KeyN') { unlocked = true; cycle(); } else unlock(); }, true); addEventListener('touchend', unlock, true);
  window.__musicState = () => ({ rs: a.readyState, ns: a.networkState, err: a.error && a.error.code, paused: a.paused, t: a.currentTime, src: a.src.split("/").pop(), vol: a.volume, mode });
  window.__musicPause = () => a.pause(); window.__musicResume = () => { if (unlocked && mode !== 'off' && ok) a.play().catch(() => {}); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) a.pause(); else window.__musicResume(); });
  addEventListener('DOMContentLoaded', () => { document.body.appendChild(btn); label(); });
  if (document.body) { document.body.appendChild(btn); label(); }
  load();
})();
