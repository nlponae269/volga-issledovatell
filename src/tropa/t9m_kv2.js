// ===================== КВАРТИРА 47, цикл 2: тиканье часов, гул холодильника, капель, соседи за стеной, пылинки у окон =====================
if (KV) {
  let tick = 0, tickOdd = false, neighT = 18, dripT = 5, creakT = 40, sirenT = 90, fridge = null;
  const pan = (x) => Math.max(-1, Math.min(1, (x - P.x) / 3));
  const near = (x, z, R) => Math.max(0, 1 - Math.hypot(x - P.x, z - P.z) / R);
  function tickSnd() { if (!AC) return; const v = 0.05 * near(4.5, 2.2, 7) + 0.008; burst(0.03, 'bandpass', tickOdd ? 3400 : 2900, 6, v, pan(4.5)); }
  function fridgeHum() { if (!AC || fridge) return; const s = loopSrc(AC._brown, 1), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); f.type = 'lowpass'; f.frequency.value = 130; g.gain.value = 0; s.connect(f).connect(g).connect(sp).connect(master); fridge = { g, sp }; }
  const neigh = [
    () => { for (let k = 0; k < 14; k++) setTimeout(() => burst(0.07 + Math.random() * 0.1, 'bandpass', 300 + Math.random() * 400, 4, 0.025, -0.9), k * (100 + Math.random() * 120)); },          // бубнит телевизор
    () => { for (let k = 0; k < 6; k++) setTimeout(() => burst(0.12, 'lowpass', 140, 1.2, 0.18, 0.9), k * 650); },                                                                  // кто-то ходит
    () => { burst(2.2, 'bandpass', 260, 2.5, 0.06, -0.8); for (let k = 0; k < 4; k++) setTimeout(() => burst(0.3, 'bandpass', 420, 2, 0.05, -0.8), 800 + k * 420); },               // дрель
    () => { burst(0.35, 'lowpass', 120, 1, 0.3, 0.9); setTimeout(() => burst(0.2, 'lowpass', 100, 1, 0.22, 0.9), 300); },                                                         // хлопнула дверь
    () => { for (let k = 0; k < 3; k++) setTimeout(() => blip([392, 330, 262][k], 0.5, 'triangle', 0.012), k * 520); },                                                                   // пианино через стену
  ];
  // пылинки в луче у окон (кухня и комната)
  const dn = MOBILE ? 40 : 90, dp = new Float32Array(dn * 3), dg = new THREE.BufferGeometry(), da = new Float32Array(dn * 3); dg.setAttribute('position', new THREE.BufferAttribute(da, 3));
  for (let i = 0; i < dn; i++) { dp[i * 3] = Math.random(); dp[i * 3 + 1] = Math.random(); dp[i * 3 + 2] = Math.random(); }
  const dtex = texFrom(mkCanvas(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.02, map: dtex, color: 0xfff4dd, transparent: true, opacity: 0.55, depthWrite: false })); dust.frustumCulled = false; scene.add(dust);
  const BEAMS = [[3.2, 0.4, 1.3, 1.6], [5.4, 5.0, 1.0, 1.5], [-1.6, 0.4, 1.0, 1.4]];   // x, z центра, ширина, глубина
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    tick -= dt; if (tick < 0) { tick = 1; tickOdd = !tickOdd; tickSnd(); }
    fridgeHum(); if (fridge) { fridge.g.gain.value = 0.045 * near(4.25, 1.25, 7) + 0.004; fridge.sp.pan.value = pan(4.25); }
    neighT -= dt; if (neighT < 0) { neighT = 25 + Math.random() * 45; neigh[(Math.random() * neigh.length) | 0](); }
    dripT -= dt; if (dripT < 0) { dripT = 2.5 + Math.random() * 2; if (AC) blip([1500 + Math.random() * 300, 1000], 0.07, 'sine', 0.02 * near(0.3, 4.6, 9)); }
    creakT -= dt; if (creakT < 0) { creakT = 45 + Math.random() * 60; creak(); }
    sirenT -= dt; if (sirenT < 0) { sirenT = 120 + Math.random() * 120; if (AC) { const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 900; for (let k = 0; k < 10; k++) o.frequency.setValueAtTime(k % 2 ? 700 : 960, t + k * 0.6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.012, t + 2); g.gain.linearRampToValueAtTime(0, t + 6); o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + 6.1); } }
    const a = dg.attributes.position.array; for (let i = 0; i < dn; i++) { const bm = BEAMS[i % 3]; dp[i * 3] += (Math.sin(clock * 0.3 + i) * 0.01 + 0.004) * dt * 10; dp[i * 3 + 1] += (Math.cos(clock * 0.25 + i * 2) * 0.01 - 0.003) * dt * 10; dp[i * 3 + 2] += Math.sin(clock * 0.2 + i * 3) * 0.008 * dt * 10;
      for (let k = 0; k < 3; k++) { if (dp[i * 3 + k] > 1) dp[i * 3 + k] -= 1; if (dp[i * 3 + k] < 0) dp[i * 3 + k] += 1; }
      a[i * 3] = bm[0] + (dp[i * 3] - 0.5) * bm[2]; a[i * 3 + 1] = 0.9 + dp[i * 3 + 1] * 1.4; a[i * 3 + 2] = bm[1] + dp[i * 3 + 2] * bm[3]; } dg.attributes.position.needsUpdate = true; };
}
