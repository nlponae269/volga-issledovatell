// ===================== Квартира 47: звонок домофона / в дверь, потом три стука — и тишина =====================
if (KV) {
  let t = 70 + Math.random() * 60;
  function ring(n) { for (let k = 0; k < n; k++) { setTimeout(() => { blip([880], 0.22, 'square', 0.02); setTimeout(() => blip([698], 0.3, 'square', 0.02), 230); }, k * 900); } }
  function knock() { for (let k = 0; k < 3; k++) setTimeout(() => burst(0.09, 'lowpass', 180 + Math.random() * 40, 1.5, 0.22, 0.3), k * 520); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return; t -= dt; if (t > 0) return; t = 180 + Math.random() * 180;
    if (Math.random() < 0.6) ring(1 + ((Math.random() * 2) | 0)); else knock(); };
}
