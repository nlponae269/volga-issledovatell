// ===================== Дворы: где-то в доме работает перфоратор, на площадке лязгает мусорный контейнер =====================
if (DVOR && !ALT) {
  let tDrill = 70 + Math.random() * 70, tBin = 45 + Math.random() * 50;
  function drill() { const p = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.6), n = 3 + ((Math.random() * 4) | 0);
    for (let k = 0; k < n; k++) setTimeout(() => { if (!AC) return; burst(0.5 + Math.random() * 0.6, 'bandpass', 180 + Math.random() * 40, 3, 0.04, p);
      for (let j = 0; j < 14; j++) setTimeout(() => burst(0.03, 'bandpass', 900, 2, 0.02, p), j * 35); }, k * (1400 + Math.random() * 1200)); }
  function bin() { const p = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.6);
    burst(0.25, 'bandpass', 420, 2.5, 0.09, p); setTimeout(() => burst(0.5, 'bandpass', 900, 3, 0.05, p), 80); setTimeout(() => burst(0.35, 'bandpass', 600, 4, 0.04, p), 330); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return;
    tDrill -= dt; if (tDrill < 0) { tDrill = 150 + Math.random() * 150; drill(); }
    tBin -= dt; if (tBin < 0) { tBin = 70 + Math.random() * 90; bin(); } };
}
