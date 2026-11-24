// ===================== ALTERNATIVE: из ниоткуда пробивается «станция чисел» — ровные тоны и шипение, потом обрыв =====================
if (ALT) {
  let t = 40 + Math.random() * 40;
  function station() { if (!AC) return; const p = (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.5), n = 8 + ((Math.random() * 8) | 0), base = 420 + Math.random() * 200;
    burst(n * 0.75 + 1, 'bandpass', 2400, 0.6, 0.012, p);
    for (let k = 0; k < n; k++) setTimeout(() => { if (!AC) return; const f = base * (1 + ((Math.random() * 5) | 0) * 0.125), t0 = AC.currentTime, o = AC.createOscillator(), f1 = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner();
      o.type = 'sine'; o.frequency.value = f; f1.type = 'bandpass'; f1.frequency.value = 1100; f1.Q.value = 0.7; sp.pan.value = p; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.03, t0 + 0.03); g.gain.setValueAtTime(0.03, t0 + 0.4); g.gain.linearRampToValueAtTime(0, t0 + 0.45); o.connect(f1).connect(g).connect(sp).connect(master); o.start(t0); o.stop(t0 + 0.5); }, 600 + k * 750); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return; t -= dt; if (t < 0) { t = 90 + Math.random() * 120; station(); } };
}
