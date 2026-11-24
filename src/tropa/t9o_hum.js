// ===================== Гул проводов: вблизи столбов с линиями слышно электрическое жужжание, на ветру громче =====================
if (DVOR) {
  window.__poles = window.__poles || [];
  let hum = null;
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return;
    if (!hum) { const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(), sp = AC.createStereoPanner(); o.type = 'sawtooth'; o.frequency.value = 100; o2.type = 'sine'; o2.frequency.value = 150; f.type = 'bandpass'; f.frequency.value = 220; f.Q.value = 2; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g).connect(sp).connect(master); o.start(); o2.start(); hum = { g, sp }; }
    let best = null, bd = 14; for (let i = window.__poles.length - 1; i >= 0; i--) { const p = window.__poles[i]; if (!p.g.parent) { window.__poles.splice(i, 1); continue; } const d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd) { bd = d; best = p; } }
    const v = best ? (0.016 + gust * 0.012) * Math.pow(1 - bd / 14, 1.5) : 0; hum.g.gain.value += (v - hum.g.gain.value) * Math.min(1, dt * 4); hum.sp.pan.value = best ? Math.max(-1, Math.min(1, -Math.sin(Math.atan2(best.x - P.x, best.z - P.z) - (P.yaw + Math.PI)))) : 0; };
}
