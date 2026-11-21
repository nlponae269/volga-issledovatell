// ===================== ДВОРЫ, цикл 3: курильщики, выбивание ковра, «скорая» вдалеке =====================
if (DVOR && !ALT) {
  const LMt = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
  const PUFF = texFrom(mkCanvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const pos = new Float32Array(60 * 3).fill(-9999), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const smoke = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.35, map: PUFF, color: 0xdddddd, transparent: true, opacity: 0.3, depthWrite: false })); smoke.frustumCulled = false; scene.add(smoke); REFL.hide.push(smoke);
  const life = new Float32Array(60), vel = new Float32Array(60 * 3); let si = 0;
  const SM = []; const coats = [0x2a2a30, 0x3a3228, 0x1f2a38, 0x4a4a44];
  function man(group, x, z, ry, seed) { const r = rng(seed), g = new THREE.Group(), coat = LMt(coats[(r() * 4) | 0]), pants = LMt(0x1a1b1e), skin = LMt(0xc8a488, { roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.6, 4, 10), coat); body.position.y = 1.15; body.scale.z = 0.8; const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 9), skin); head.position.y = 1.7;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 6, 0, 6.3, 0, 1.5), LMt(r() < 0.5 ? 0x1a1a1a : 0x3a3a40)); cap.position.y = 1.72;
    for (const s of [-0.09, 0.09]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.85, 8).translate(0, -0.42, 0), pants); l.position.set(s, 0.86, 0); g.add(l); }
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 3, 6).translate(0, -0.3, 0), coat); armL.position.set(-0.27, 1.42, 0.0); armL.rotation.z = 0.1;
    const armR = new THREE.Group(); armR.position.set(0.27, 1.42, 0); const aR = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 3, 6).translate(0, -0.3, 0), coat); armR.add(aR);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); ember.position.set(0, -0.62, 0.06); armR.add(ember); const cig = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 4), LMt(0xf0f0e8)); cig.rotation.x = Math.PI / 2; cig.position.set(0, -0.62, 0.03); armR.add(cig);
    g.add(body, head, cap, armL, armR); g.position.set(x, groundH(x, z), z); g.rotation.y = ry; g.traverse((o) => { o.castShadow = Q.shadows; }); group.add(g);
    SM.push({ g, armR, ember, x, z, t: r() * 8, st: 0, ry }); }
  // курильщики: у части лавок (в другом углу от бабушек)
  const prevOB = OUT_BUILD, seen = new Set();
  OUT_BUILD = (cx, cz) => { const n0 = window.__benches.length, res = prevOB(cx, cz), r = rng((cx * 40503) ^ (cz * 22381) ^ 0xc1a6);
    for (let i = n0; i < window.__benches.length; i++) { const b = window.__benches[i]; if (b.g !== res.group || r() > 0.3) continue; const a = b.ry + Math.PI / 2, x = b.x + Math.sin(a) * 1.7, z = b.z + Math.cos(a) * 1.7; if (inWorld(x, z) && dvRoadD(x, z) > 7) man(res.group, x, z, b.ry + Math.PI * (r() < 0.5 ? 0.3 : 1.2), i * 17 + 3); }
    return res; };
  // ковёр: ритмичный стук «бум…бум…бум»
  let carpetT = 35, ambT = 140;
  function beat() { if (!AC) return; const a = Math.random() * 6.28, p = Math.sin(a) * 0.8, n = 6 + ((Math.random() * 6) | 0), v = 0.12; for (let k = 0; k < n; k++) setTimeout(() => { burst(0.16, 'lowpass', 210, 1.1, v * (0.7 + Math.random() * 0.3), p); burst(0.08, 'bandpass', 900, 2, v * 0.25, p); }, k * (520 + Math.random() * 90)); }
  function ambulance() { if (!AC) return; const t0 = AC.currentTime, dur = 14, from = Math.random() < 0.5 ? -1 : 1, o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.7;
    sp.pan.setValueAtTime(from * 0.9, t0); sp.pan.linearRampToValueAtTime(-from * 0.9, t0 + dur);
    for (let k = 0; k < 24; k++) { const t = t0 + k * 0.58, hi = k % 2 === 0, dop = 1 + 0.06 * (1 - (k / 12)); o.frequency.setValueAtTime((hi ? 960 : 700) * dop, t); o2.frequency.setValueAtTime((hi ? 962 : 702) * dop, t); }
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.025, t0 + 4); g.gain.linearRampToValueAtTime(0.03, t0 + 7); g.gain.linearRampToValueAtTime(0, t0 + dur); o.connect(f); o2.connect(f); f.connect(g).connect(sp).connect(master); o.start(t0); o2.start(t0); o.stop(t0 + dur); o2.stop(t0 + dur); toast('<span style="font-size:14px;opacity:.7">далеко проехала «скорая»</span>'); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    for (let i = SM.length - 1; i >= 0; i--) { const m = SM[i]; if (!m.g.parent || !m.g.parent.parent) { SM.splice(i, 1); continue; } if (Math.hypot(m.x - P.x, m.z - P.z) > 45) continue; m.t -= dt;
      if (m.st === 0 && m.t < 0) { m.st = 1; m.t = 1.4; } else if (m.st === 1) { m.armR.rotation.x = Math.min(2.1, m.armR.rotation.x + dt * 3.2); if (m.t < 0) { m.st = 2; m.t = 1.2; for (let k = 0; k < 5; k++) { const j = si++ % 60; life[j] = 2.5 + Math.random() * 1.5; pos[j * 3] = m.x + Math.sin(m.ry) * 0.18; pos[j * 3 + 1] = groundH(m.x, m.z) + 1.62; pos[j * 3 + 2] = m.z + Math.cos(m.ry) * 0.18; vel[j * 3] = (Math.random() - 0.5) * 0.15; vel[j * 3 + 1] = 0.12 + Math.random() * 0.1; vel[j * 3 + 2] = (Math.random() - 0.5) * 0.15; } } }
      else if (m.st === 2) { m.armR.rotation.x = Math.max(0.05, m.armR.rotation.x - dt * 2.2); if (m.t < 0) { m.st = 0; m.t = 5 + Math.random() * 6; } }
      m.ember.material.color.setHex(m.st === 1 ? 0xffb050 : 0xff5a18); }
    for (let i = 0; i < 60; i++) { if (life[i] <= 0) { pos[i * 3 + 1] = -9999; continue; } life[i] -= dt; pos[i * 3] += (vel[i * 3] + 0.4) * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt; } pg.attributes.position.needsUpdate = true;
    carpetT -= dt; if (carpetT < 0) { carpetT = 50 + Math.random() * 60; beat(); }
    ambT -= dt; if (ambT < 0) { ambT = 180 + Math.random() * 180; ambulance(); } };
}
