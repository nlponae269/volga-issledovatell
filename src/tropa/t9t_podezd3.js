// ===================== Подъезд, цикл 3: собака лает за дверью, шумит вода в стояке, лифт гудит на других этажах =====================
if (PODEZD) {
  let tDog = 30 + Math.random() * 40, tPipe = 20 + Math.random() * 30, tLift = 45 + Math.random() * 40;
  const pan = () => (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.5);
  function dog() { const p = pan(), n = 2 + ((Math.random() * 4) | 0), f0 = 260 + Math.random() * 120;
    for (let k = 0; k < n; k++) setTimeout(() => { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.18); f.type = 'lowpass'; f.frequency.value = 520; sp.pan.value = p; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22); o.connect(f).connect(g).connect(sp).connect(master); o.start(t); o.stop(t + 0.25); }, k * (300 + Math.random() * 150));
    setTimeout(() => { const q = pan(); for (let k = 0; k < 5; k++) setTimeout(() => burst(0.08, 'bandpass', 2200, 1.5, 0.02, p), k * 110); }, n * 400 + 400); }
  function pipe() { const p = pan(); burst(2.5 + Math.random() * 2, 'bandpass', 380 + Math.random() * 200, 1.8, 0.035, p); setTimeout(() => burst(1.5, 'lowpass', 140, 1, 0.07, p), 900); }
  function lift() { const p = pan(); burst(3.5, 'lowpass', 110, 1.4, 0.08, p); setTimeout(() => blip([330], 0.5, 'triangle', 0.012), 3600); setTimeout(() => burst(0.4, 'lowpass', 90, 1, 0.14, p), 3800); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started || !AC) return;
    tDog -= dt; if (tDog < 0) { tDog = 50 + Math.random() * 80; dog(); }
    tPipe -= dt; if (tPipe < 0) { tPipe = 40 + Math.random() * 70; pipe(); }
    tLift -= dt; if (tLift < 0) { tLift = 70 + Math.random() * 90; lift(); } };
}
