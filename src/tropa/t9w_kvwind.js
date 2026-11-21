// ===================== Квартира 47: порыв ветра — дребезжит стекло, тянет в щелях рамы =====================
if (KV) {
  let t = 20 + Math.random() * 30;
  function gust() { if (!AC) return; const tt = AC.currentTime, d = 3 + Math.random() * 2.5, s = AC.createBufferSource(); s.buffer = AC._brown || AC._white; s.loop = true;
    const f = AC.createBiquadFilter(), g = AC.createGain(); f.type = 'bandpass'; f.frequency.setValueAtTime(350, tt); f.frequency.linearRampToValueAtTime(700, tt + d * 0.4); f.frequency.linearRampToValueAtTime(300, tt + d); f.Q.value = 3;
    g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.05, tt + d * 0.4); g.gain.linearRampToValueAtTime(0, tt + d); s.connect(f).connect(g).connect(master); s.start(tt); s.stop(tt + d + 0.2);
    const n = 3 + ((Math.random() * 4) | 0); for (let k = 0; k < n; k++) setTimeout(() => burst(0.04, 'bandpass', 2600 + Math.random() * 900, 5, 0.03, -0.3), d * 300 + k * (140 + Math.random() * 260)); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return; t -= dt; if (t < 0) { t = 45 + Math.random() * 70; gust(); } };
}
