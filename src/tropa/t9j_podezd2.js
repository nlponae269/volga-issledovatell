// ===================== ПОДЪЕЗД, цикл 2: новогодняя ночь — салюты за окном, куранты, телевизоры, шаги этажом выше =====================
if (PODEZD) {
  // цветные вспышки салюта в окне межэтажной площадки (один PointLight следует за этажом игрока)
  const fw = new THREE.PointLight(0xff4040, 0, 9, 2); scene.add(fw); let fwT = 0, fwCol = 0xff4040, fwBase = 0; const FW = [0xff3a3a, 0x3aff7a, 0x3a8aff, 0xffd03a, 0xd03aff];
  const lastSnd = { fire: 8, tv: 20, step: 35, chime: 60, glass: 50, cough: 90 };
  const pan = () => Math.random() * 1.6 - 0.8;
  function salute() { if (!AC) return; const p = pan(); burst(0.12, 'lowpass', 160, 0.8, 0.5, p); setTimeout(() => { burst(1.4, 'bandpass', 3200, 0.7, 0.06, p); burst(0.9, 'highpass', 5200, 0.4, 0.03, p); }, 160 + Math.random() * 120); if (Math.random() < 0.5) setTimeout(() => burst(0.12, 'lowpass', 150, 0.8, 0.35, p), 420); }
  function chimes() { if (!AC) return; const t0 = AC.currentTime; for (let k = 0; k < 12; k++) { const t = t0 + k * 1.25, o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(), sp = AC.createStereoPanner(); sp.pan.value = -0.3;
      o.type = 'sine'; o.frequency.value = 196; o2.type = 'sine'; o2.frequency.value = 196 * 2.76; f.type = 'lowpass'; f.frequency.value = 1500; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0003, t + 2.6); o.connect(f); o2.connect(f); f.connect(g).connect(sp).connect(master); o.start(t); o2.start(t); o.stop(t + 2.7); o2.stop(t + 2.7); } }
  function tvMurmur() { if (!AC) return; const p = pan(), n = 14 + ((Math.random() * 10) | 0); for (let k = 0; k < n; k++) setTimeout(() => burst(0.05 + Math.random() * 0.12, 'bandpass', 350 + Math.random() * 700, 5, 0.03, p), k * (90 + Math.random() * 140)); if (Math.random() < 0.6) setTimeout(() => { for (let k = 0; k < 6; k++) setTimeout(() => burst(0.2, 'lowpass', 320, 1, 0.02, p), k * 70); }, n * 120); }
  function stepsAbove() { if (!AC) return; const p = pan(), n = 6 + ((Math.random() * 6) | 0); for (let k = 0; k < n; k++) setTimeout(() => burst(0.07, 'lowpass', 260 + Math.random() * 120, 1.2, 0.09, p), k * (430 + Math.random() * 80)); }
  function glasses() { if (!AC) return; const p = pan(); [1320, 1760, 1480].forEach((f, i) => setTimeout(() => blip([f * (0.98 + Math.random() * 0.04)], 0.35, 'sine', 0.01), i * 120)); for (let k = 0; k < 5; k++) setTimeout(() => burst(0.15, 'bandpass', 420 + Math.random() * 200, 4, 0.03, p), 600 + k * 130); }
  function cough() { if (!AC) return; const p = pan(); burst(0.22, 'bandpass', 700, 2, 0.08, p); setTimeout(() => burst(0.18, 'bandpass', 620, 2, 0.06, p), 260); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    fwT -= dt; if (fwT > 0) { fw.intensity = fwBase * Math.max(0, fwT / 0.9) * (0.7 + 0.3 * Math.sin(clock * 40)); } else fw.intensity = 0;
    const fy = Math.floor((P.y + 0.3) / FH) * FH + FH / 2 + 1.5; fw.position.set(PW / 2, fy, PL + MIDD + 0.4);
    for (const k in lastSnd) { lastSnd[k] -= dt; if (lastSnd[k] > 0) continue;
      if (k === 'fire') { lastSnd.fire = 6 + Math.random() * 18; salute(); fwCol = FW[(Math.random() * FW.length) | 0]; fw.color.setHex(fwCol); fwBase = 14; fwT = 0.9; }
      else if (k === 'tv') { lastSnd.tv = 25 + Math.random() * 30; tvMurmur(); }
      else if (k === 'step') { lastSnd.step = 40 + Math.random() * 50; stepsAbove(); }
      else if (k === 'chime') { lastSnd.chime = 150 + Math.random() * 120; chimes(); toast('<span style="font-size:14px;opacity:.75">где-то бьют куранты…</span>'); }
      else if (k === 'glass') { lastSnd.glass = 60 + Math.random() * 60; glasses(); }
      else if (k === 'cough') { lastSnd.cough = 80 + Math.random() * 90; cough(); } } };
}
