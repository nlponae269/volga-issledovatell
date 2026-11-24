// ===================== FAR LANDS: перенос к самому краю мира (во всех мирах) =====================
{
  const lim = WLIM - 0.5; let edgeToast = 0;
  if (FAR && !KV) {
    const fx = WLIM - 150;
    if (PODEZD) { podBase = 2147483639; }                                   // этаж 2147483640: до переполнения int32 — семь этажей
    else if (TRAIN) { TR.x = fx - 300; P.x = TR.x + 46; }
    else if (GRID) { const i0 = Math.floor(fx / HC); let done = false; for (let r = 0; r < 14 && !done; r++) for (let i = i0 - r; i <= i0 && !done; i++) for (let j = -r; j <= r; j++) { const t = cellType(i, j); if (t === 'room' || t === 'aisle') { P.x = (i + 0.5) * HC; P.z = (j + 0.5) * HC; done = true; break; } } if (!done) { P.x = (i0 + 0.5) * HC; P.z = HC / 2; } }
    else if (STROY) { let i = Math.floor(fx / SC); while (stroyHole(i, 0)) i--; P.x = (i + 0.5) * SC; P.z = SC / 2; }
    else if (DVOR) { P.x = Math.floor(fx / 96) * 96 + 4; P.z = 4; SPAWN = { x: P.x, z: P.z, yaw: -Math.PI / 2 }; P.yaw = -Math.PI / 2; }
    else { P.x = fx; if (PATH_ON) P.z = pathC(fx); }
    const hud = $('hud'); if (hud) { const d = document.createElement('div'); d.className = 'k'; d.id = 'f_far'; d.style.cssText = 'color:#ff9a7a;opacity:1;font-variant-numeric:tabular-nums'; hud.appendChild(d); }
    const st = $('start'); if (st) { const p = document.createElement('p'); p.style.cssText = 'color:#ff9a7a;font-size:14px'; p.innerHTML = PODEZD ? '<b>FAR LANDS.</b> Этаж 2 147 483 640. Выше 2 147 483 647 этажей не бывает.' : '<b>FAR LANDS.</b> Ты у самого края мира: X ≈ 16 777 066. Дальше 16 777 216 мир не создаётся — в числах больше нет места.'; st.insertBefore(p, st.querySelector('div')); }
  }
  const wu = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (wu) wu(dt);
    if (!PODEZD && (Math.abs(P.x) > lim || Math.abs(P.z) > lim)) { P.x = clamp(P.x, -lim, lim); P.z = clamp(P.z, -lim, lim); if (TRAIN) { TR.v = 0; TR.st = 'stop'; TR.t = 1e9; }
      if (clock - edgeToast > 6 || !edgeToast) { edgeToast = clock || 0.01; toast('<b style="color:#ff9a7a">Край мира.</b><br><span style="font-size:14px">Дальше нет места для координат.</span>'); } }
    if (FAR) { const e = $('f_far'); if (e) { const t = PODEZD ? 'FAR LANDS' : `X ${Math.round(P.x)} · Z ${Math.round(P.z)}`; if (e.textContent !== t) e.textContent = t; } } };
}
