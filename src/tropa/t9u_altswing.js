// ===================== ALTERNATIVE: где-то раскачиваются пустые качели, скрип обрывается, когда подходишь =====================
if (ALT) {
  let t = 25 + Math.random() * 20, sw = null;
  function creak(side, dist) { if (!AC) return; const tt = AC.currentTime, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(), n = 5 + ((Math.random() * 4) | 0), per = 1.5 + Math.random() * 0.4, vol = 0.045 * Math.max(0.15, 1 - dist / 90);
    o.type = 'sawtooth'; f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 9; sp.pan.value = side; g.gain.setValueAtTime(0, tt);
    for (let k = 0; k < n; k++) { const a = tt + k * per; o.frequency.setValueAtTime(520, a); o.frequency.linearRampToValueAtTime(760 + Math.random() * 120, a + per * 0.45); o.frequency.linearRampToValueAtTime(480, a + per * 0.9); g.gain.linearRampToValueAtTime(vol, a + per * 0.2); g.gain.linearRampToValueAtTime(vol * 0.2, a + per * 0.5); g.gain.linearRampToValueAtTime(vol, a + per * 0.7); g.gain.linearRampToValueAtTime(0, a + per * 0.98); }
    o.connect(f).connect(g).connect(sp).connect(master); o.start(tt); o.stop(tt + n * per + 0.1); sw = { g, end: tt + n * per }; }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return;
    if (sw && AC.currentTime > sw.end) sw = null;
    t -= dt; if (t < 0) { t = 35 + Math.random() * 50; if (!sw) creak((Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5), 20 + Math.random() * 60); } };
}
