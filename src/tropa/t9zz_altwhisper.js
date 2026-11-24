// ===================== ALTERNATIVE: шёпот прямо у уха — слоги из шума, без слов =====================
if (ALT) {
  let t = 50 + Math.random() * 40;
  function whisper() { if (!AC) return; const p = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.4), n = 5 + ((Math.random() * 7) | 0); let at = 0;
    for (let k = 0; k < n; k++) { const d = 90 + Math.random() * 140; setTimeout(() => burst(d / 1000, 'bandpass', 1800 + Math.random() * 1800, 1.3, 0.035 + Math.random() * 0.02, p), at); at += d + 40 + Math.random() * 120; } }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return; t -= dt; if (t < 0) { t = 80 + Math.random() * 120; whisper(); } };
}
