// ===================== ДВОРЫ, цикл 2: следы в грязи, дети, облака =====================
if (DVOR) {
  const LIVE2 = !ALT;
  // --- следы ботинок на земле двора (до 160 штук, старые пропадают) ---
  const fpTex = texFrom(mkCanvas(64, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(25,18,12,0.75)'; g.beginPath(); g.ellipse(32, 38, 17, 30, 0, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(32, 98, 13, 18, 0, 0, 6.28); g.fill(); g.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 6; i++) g.fillRect(18, 12 + i * 11, 28, 3); }));
  const fpMat = new THREE.MeshStandardMaterial({ map: fpTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 }), fpGeo = new THREE.PlaneGeometry(0.17, 0.34).rotateX(-Math.PI / 2);
  const FP = [], FPN = MOBILE ? 80 : 160; let fpI = 0, fpLast = null, fpSide = 1;
  const muddy = (x, z) => surfaceAt(x, z) === 'mud';
  // --- дети: носятся по двору зигзагами и кричат ---
  const KIDS = []; const kc = [0xd83a3a, 0x3a6ad8, 0xe8c040, 0x3aa86a], skin = new THREE.MeshStandardMaterial({ color: 0xd8b498, roughness: 0.7 });
  function makeKid(c) { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.4, 4, 8), m); body.position.y = 0.62; const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), skin); head.position.y = 1.07;
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 6, 0, 6.3, 0, 1.4), new THREE.MeshStandardMaterial({ color: c ^ 0x303030, roughness: 0.9 })); hat.position.y = 1.1;
    const legs = []; for (const s of [-0.06, 0.06]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.4, 6).translate(0, -0.2, 0), new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.9 })); l.position.set(s, 0.4, 0); g.add(l); legs.push(l); }
    g.add(body, head, hat); scene.add(g); return { g, legs }; }
  if (LIVE2) for (let i = 0; i < 3; i++) KIDS.push(Object.assign(makeKid(kc[i]), { on: false, x: 0, z: 0, a: 0, t: 0, ph: 0, ky: 3 + i * 2 }));
  const freeK = (x, z) => { if (!inWorld(x, z) || dvRoadD(x, z) < 5.5) return false; const c = collide(x, z); return Math.abs(c[0] - x) < 1e-3 && Math.abs(c[1] - z) < 1e-3; };
  function kidShout(k) { if (!AC) return; const d = Math.hypot(k.x - P.x, k.z - P.z), v = 0.03 * Math.max(0, 1 - d / 35); if (v <= 0) return; const a = Math.atan2(k.x - P.x, k.z - P.z) - (P.yaw + Math.PI), p = Math.max(-1, Math.min(1, -Math.sin(a))), t0 = AC.currentTime, f = 520 + Math.random() * 260;
    const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t0); o.frequency.linearRampToValueAtTime(f * (Math.random() < 0.5 ? 1.4 : 0.8), t0 + 0.35); fl.type = 'bandpass'; fl.frequency.value = 1500; fl.Q.value = 0.8; sp.pan.value = p;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.45); o.connect(fl).connect(g).connect(sp).connect(master); o.start(t0); o.stop(t0 + 0.5); }
  // --- облака: свет медленно «дышит», иногда проглядывает светлое окно ---
  const hemiBase = { v: null };
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { prev(dt); if (!started) return;
    // следы
    if (muddy(P.x, P.z) && P.ground && P.speed > 0.6) { if (!fpLast || Math.hypot(P.x - fpLast[0], P.z - fpLast[1]) > 0.72) { fpLast = [P.x, P.z]; fpSide = -fpSide; const a = Math.atan2(P.dx || 0, P.dz || 1); let m = FP[fpI % FPN]; if (!m) { m = new THREE.Mesh(fpGeo, fpMat); scene.add(m); REFL.hide.push(m); FP[fpI % FPN] = m; } fpI++;
      m.position.set(P.x + Math.cos(a) * 0.12 * fpSide, groundH(P.x, P.z) + 0.018, P.z - Math.sin(a) * 0.12 * fpSide); m.rotation.y = a; m.visible = true; } }
    // дети
    for (const k of KIDS) { if (!k.on) { k.t -= dt; if (k.t < 0) { k.t = 3; for (let q = 0; q < 8; q++) { const a = Math.random() * 6.28, r = 22 + Math.random() * 25, x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (freeK(x, z)) { k.x = x; k.z = z; k.on = true; k.a = Math.random() * 6.28; k.ky = 2; break; } } } k.g.visible = k.on; continue; }
      const d = Math.hypot(k.x - P.x, k.z - P.z); k.t -= dt; k.ky -= dt;
      if (k.t < 0) { k.t = 0.8 + Math.random() * 1.8; k.a += (Math.random() - 0.5) * 3.2; }
      const sp = d < 6 ? 3.2 : 2.4; const nx = k.x + Math.sin(k.a) * sp * dt, nz = k.z + Math.cos(k.a) * sp * dt; if (freeK(nx, nz)) { k.x = nx; k.z = nz; } else k.a += 2.2;
      k.ph += dt * 11; k.legs.forEach((l, i) => { l.rotation.x = Math.sin(k.ph + i * Math.PI) * 0.8; }); k.g.position.set(k.x, groundH(k.x, k.z) + Math.abs(Math.sin(k.ph)) * 0.04, k.z); k.g.rotation.y = k.a; k.g.visible = true;
      if (k.ky < 0) { k.ky = 4 + Math.random() * 7; kidShout(k); }
      if (d > 90) k.on = false; }
    // облака
    if (hemiBase.v === null) hemiBase.v = hemi.intensity; if (!ALT) { const c = 0.5 + 0.5 * Math.sin(clock * 0.045) * Math.sin(clock * 0.11 + 1.3); hemi.intensity = hemiBase.v * (0.9 + 0.22 * c); sun.intensity = 0.32 + 0.5 * Math.max(0, c - 0.78) * 4.5; }
  };
}

// ===== цикл 7: небо дрейфует, стаи птиц пролетают и перекликаются =====
if (DVOR) {
  const birdG = new THREE.BufferGeometry(), NB = 18, bp = new Float32Array(NB * 3).fill(-9999); birdG.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const dot = texFrom(mkCanvas(32, 32, (g) => { g.fillStyle = '#000'; g.beginPath(); g.moveTo(2, 14); g.quadraticCurveTo(16, 4, 30, 14); g.quadraticCurveTo(16, 10, 2, 14); g.fill(); }));
  const birds = new THREE.Points(birdG, new THREE.PointsMaterial({ size: 1.9, map: dot, color: ALT ? 0x300000 : 0x1c1c20, transparent: true, depthWrite: false, alphaTest: 0.1 })); birds.frustumCulled = false; scene.add(birds); REFL.hide.push(birds);
  const off = [], r0 = rng(9); for (let i = 0; i < NB; i++) { const k = i % 9, row = Math.floor(i / 9); off.push([-Math.abs(k - 4) * 3.2 - row * 1.5, (k - 4) * 2.4 + (r0() - 0.5) * 3, r0() * 6]); }
  let flock = null, flockT = 20;
  function caw(x, z) { if (!AC) return; const d = Math.hypot(x - P.x, z - P.z), v = 0.035 * Math.max(0, 1 - d / 200); if (v <= 0) return; const a = Math.atan2(x - P.x, z - P.z) - (P.yaw + Math.PI), p = Math.max(-1, Math.min(1, -Math.sin(a)));
    for (let k = 0; k < 2 + ((Math.random() * 3) | 0); k++) setTimeout(() => { const t = AC.currentTime, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); o.type = 'sawtooth'; o.frequency.setValueAtTime(560, t); o.frequency.exponentialRampToValueAtTime(320, t + 0.28); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2.5; sp.pan.value = p; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.3); o.connect(f).connect(g).connect(sp).connect(master); o.start(t); o.stop(t + 0.35); }, k * 380); }
  const prevB = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { prevB(dt); if (!started) return;
    if (scene.background && scene.background.isTexture && 'backgroundRotation' in scene) { scene.backgroundRotation.y += dt * 0.0025; scene.environmentRotation.y = scene.backgroundRotation.y; }
    flockT -= dt; if (!flock && flockT < 0) { const a = Math.random() * 6.28; flock = { x: P.x - Math.sin(a) * 260, z: P.z - Math.cos(a) * 260, vx: Math.sin(a) * (14 + Math.random() * 6), vz: Math.cos(a) * (14 + Math.random() * 6), y: 38 + Math.random() * 30, ph: 0, cawT: 4 }; }
    if (flock) { const f = flock; f.x += f.vx * dt; f.z += f.vz * dt; f.ph += dt * 9; f.cawT -= dt; const sp = Math.hypot(f.vx, f.vz), ux = f.vx / sp, uz = f.vz / sp;
      for (let i = 0; i < NB; i++) { const o = off[i]; bp[i * 3] = f.x + ux * o[0] - uz * o[1]; bp[i * 3 + 2] = f.z + uz * o[0] + ux * o[1]; bp[i * 3 + 1] = f.y + Math.sin(f.ph + o[2]) * 0.9; } birdG.attributes.position.needsUpdate = true;
      if (f.cawT < 0) { f.cawT = 4 + Math.random() * 5; caw(f.x, f.z); }
      if (Math.hypot(f.x - P.x, f.z - P.z) > 290 && (f.x - P.x) * f.vx + (f.z - P.z) * f.vz > 0) { flock = null; flockT = 70 + Math.random() * 90; bp.fill(-9999); birdG.attributes.position.needsUpdate = true; } } };
}
