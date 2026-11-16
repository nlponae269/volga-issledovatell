// ===================== Подъезд: перебой питания — свет на площадках гаснет и моргает пару секунд =====================
if (PODEZD) {
  const bulbE = MH.bulb.emissiveIntensity, lampE = MPL.lamp.emissiveIntensity, hemiI = hemi.intensity; let seq = null, t = 50 + Math.random() * 50;
  function setLvl(v) { MH.bulb.emissiveIntensity = bulbE * v; MPL.lamp.emissiveIntensity = lampE * v; hemi.intensity = hemiI * v; }
  window.__pblack = () => { seq = [1, 0, 1, 0, 0, 1, 0.3, 0, 0, 0, 1, 0.5, 1].map((v, i) => ({ v, at: i * 0.11 })); seq.t0 = clock; if (AC) burst(0.05, 'bandpass', 2200, 3, 0.1, 0); };
  window.__pblackDbg = () => ({ b: MH.bulb.emissiveIntensity, l: MPL.lamp.emissiveIntensity, h: hemi.intensity, seq: !!seq, e: seq ? clock - seq.t0 : -1 });
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    if (seq) { const e = clock - seq.t0; let v = 1; for (const s of seq) if (e >= s.at) v = s.v; setLvl(v); if (e > seq[seq.length - 1].at + 0.2) { seq = null; setLvl(1); } return; }
    t -= dt; if (t < 0) { t = 70 + Math.random() * 100; window.__pblack(); } };
}
