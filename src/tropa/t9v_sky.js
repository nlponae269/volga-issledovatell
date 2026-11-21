// ===================== Дворы: высоко над облаками проходит самолёт, где-то на ветру хлопает форточка =====================
if (DVOR && !ALT) {
  let tJet = 60 + Math.random() * 60, tWin = 25 + Math.random() * 35;
  function jet() { if (!AC) return; const t = AC.currentTime, d = 26 + Math.random() * 10, dir = Math.random() < 0.5 ? -1 : 1, s = AC.createBufferSource(); s.buffer = AC._brown || AC._white; s.loop = true;
    const f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); f.type = 'bandpass'; f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(380, t + d * 0.5); f.frequency.linearRampToValueAtTime(230, t + d); f.Q.value = 0.9;
    sp.pan.setValueAtTime(-0.9 * dir, t); sp.pan.linearRampToValueAtTime(0.9 * dir, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + d * 0.45); g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(f).connect(g).connect(sp).connect(master); s.start(t); s.stop(t + d + 0.2); }
  function win() { const p = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.6), n = 1 + ((Math.random() * 3) | 0);
    for (let k = 0; k < n; k++) setTimeout(() => { burst(0.05, 'bandpass', 1800, 2, 0.05, p); setTimeout(() => burst(0.12, 'bandpass', 700, 3, 0.04, p), 40); }, k * (700 + Math.random() * 900)); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return;
    tJet -= dt; if (tJet < 0) { tJet = 150 + Math.random() * 150; jet(); }
    tWin -= dt; if (tWin < 0) { tWin = 40 + Math.random() * 80; win(); } };
}
