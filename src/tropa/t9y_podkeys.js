// ===================== Подъезд: за стеной звякают ключи, поворачивается замок, хлопает дверь — и всё стихает =====================
if (PODEZD) {
  let t = 35 + Math.random() * 40;
  function keys() { const p = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.6), n = 4 + ((Math.random() * 4) | 0);
    for (let k = 0; k < n; k++) setTimeout(() => burst(0.05 + Math.random() * 0.05, 'bandpass', 3800 + Math.random() * 1500, 7, 0.03, p), k * (90 + Math.random() * 120));
    const t1 = n * 150 + 500; for (let k = 0; k < 2; k++) setTimeout(() => burst(0.04, 'bandpass', 1400, 4, 0.06, p), t1 + k * 220);
    setTimeout(() => { burst(0.3, 'lowpass', 150, 1.2, 0.2, p); setTimeout(() => burst(0.5, 'lowpass', 90, 1, 0.12, p), 250); }, t1 + 1200); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return; t -= dt; if (t < 0) { t = 60 + Math.random() * 90; keys(); } };
}
