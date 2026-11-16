// ===================== ЖИЗНЬ ДВОРА: бабушки, собаки, коты, ветер, пар, ТЭЦ, глаза, «Волга» на прогреве, быт, звуки =====================
// Только для «Дворов» (в ALTERNATIVE — без живых, но с паром и трубой). Подключается поверх t9e: оборачивает OUT_BUILD и WORLD_UPDATE.
if (DVOR) {
  const LIVE = !ALT;
  window.__benches = [];
  const LM = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
  const cap = (r, h, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, 10), m);
  const sph = (r, m, ws = 12, hs = 9) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);
  const box = (x, y, z, m) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
  const cyl = (r0, r1, h, m, s = 10) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, s), m);
  const T = (f, rx = 1, ry = rx) => PBR_ON ? pbrT('tex/ai/' + f, true, rx, ry) : null;
  const SKIN = LM(0xc9a48c, { roughness: 0.7 });
  // мягкое пятно для частиц (пар, дым, дыхание)
  const PUFF = texFrom(mkCanvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  function particles(n, size, color, opacity) {
    const pos = new Float32Array(n * 3).fill(-9999), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: PUFF, color, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }));
    pts.frustumCulled = false; scene.add(pts); REFL.hide.push(pts); return { pts, pos, g, n, life: new Float32Array(n), vel: new Float32Array(n * 3) };
  }
  const near = (o, R) => Math.hypot(o.x - P.x, o.z - P.z) < R;
  const freeAt = (x, z) => { if (!inWorld(x, z) || dvRoadD(x, z) < 4.6) return false; const c = collide(x, z); return Math.abs(c[0] - x) < 1e-3 && Math.abs(c[1] - z) < 1e-3; };
  const pan = (x, z) => { const a = Math.atan2(x - P.x, z - P.z) - (P.yaw + Math.PI); return Math.max(-1, Math.min(1, -Math.sin(a))); };
  const vol = (x, z, R) => Math.max(0, 1 - Math.hypot(x - P.x, z - P.z) / R);

  // ---------- 1. БАБУШКИ на лавочках у подъездов ----------
  const COATS = [0x3a2a26, 0x2a3040, 0x4a3a2a, 0x3a3a3a, 0x5a2a2a], SCARF = [0x8a2a3a, 0x3a5a8a, 0xb8a060, 0x6a3a6a, 0xd8d0c0, 0x2a5a3a];
  const GRANNIES = [];
  function granny(group, bx, bz, ry, sx, seed) { const r = rng(seed), g = new THREE.Group(), coat = LM(COATS[(r() * 5) | 0]), scarf = LM(SCARF[(r() * 6) | 0]);
    const body = cap(0.22, 0.42, coat); body.position.set(0, 0.78, 0); body.scale.set(1.1, 1, 0.95);
    const lap = box(0.42, 0.14, 0.42, coat); lap.position.set(0, 0.52, 0.16);
    for (const s of [-0.1, 0.1]) { const l = cyl(0.06, 0.055, 0.45, LM(0x2a2622)); l.position.set(s, 0.24, 0.34); g.add(l); const sh = box(0.1, 0.07, 0.18, LM(0x1a1614)); sh.position.set(s, 0.035, 0.4); g.add(sh); }
    const head = new THREE.Group(); head.position.set(0, 1.22, 0.02); const face = sph(0.11, SKIN); face.scale.set(0.95, 1.08, 0.95); const kerchief = sph(0.125, scarf, 12, 8); kerchief.scale.set(1.02, 1.1, 1.05); kerchief.position.set(0, 0.025, -0.025);
    const knot = box(0.08, 0.05, 0.05, scarf); knot.position.set(0, -0.1, 0.06); head.add(face, kerchief, knot);
    for (const s of [-1, 1]) { const a = cap(0.055, 0.32, coat); a.position.set(s * 0.25, 0.85, 0.07); a.rotation.x = -0.7; g.add(a); }
    if (r() < 0.5) { const bag = box(0.3, 0.26, 0.12, LM([0x6a2a20, 0x2a2a2a, 0xd0c8b0][(r() * 3) | 0])); bag.position.set(0.42 * (sx > 0 ? -1 : 1), 0.6, 0.05); g.add(bag); }
    g.add(body, lap, head); g.traverse((o) => { o.castShadow = Q.shadows; });
    const c = Math.cos(ry), s = Math.sin(ry), lx = sx, lz = 0.06; g.position.set(bx + lx * c + lz * s, groundH(bx, bz), bz - lx * s + lz * c); g.rotation.y = ry;
    group.add(g); GRANNIES.push({ g, head, ry, x: g.position.x, z: g.position.z, t: r() * 5 }); }
  function grannyTalk(x, z) { if (!AC) return; const p = pan(x, z), v = 0.05 * vol(x, z, 14); if (v <= 0) return;
    for (let k = 0; k < 5 + ((Math.random() * 6) | 0); k++) setTimeout(() => burst(0.07 + Math.random() * 0.1, 'bandpass', 500 + Math.random() * 600, 6, v, p), k * (110 + Math.random() * 120)); }

  // ---------- 9. БЫТ ДВОРА: бельё, выбивалка с ковром, песочница, диван и холодильник ----------
  const CLOTH = []; const clothCols = [0xe8e4dc, 0x6a8ab8, 0xb83a3a, 0xe8d070, 0x5a8a5a, 0xd890b0, 0x3a3a48];
  const carpetTex = texFrom(mkCanvas(128, 192, (g, w, h) => { g.fillStyle = '#7a1a1a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8b060'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16); g.strokeStyle = '#1a2a5a'; g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36);
    g.fillStyle = '#d8b060'; for (let i = 0; i < 5; i++) { g.save(); g.translate(w / 2, 40 + i * 28); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore(); } g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 200; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }));
  const metal = LM(0x4a5a5a, { metalness: 0.4, roughness: 0.6 }), wood = LM(0x7a6a50);
  function laundry(group, x, z, ry, r) { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry;
    for (const s of [-2.2, 2.2]) { const p = cyl(0.04, 0.04, 2.0, metal, 6); p.position.set(s, 1.0, 0); g.add(p); }
    const rope = cyl(0.006, 0.006, 4.4, LM(0xd8d0c0), 4); rope.rotation.z = Math.PI / 2; rope.position.y = 1.9; g.add(rope);
    for (let k = 0; k < 4 + ((r() * 4) | 0); k++) { const w = 0.35 + r() * 0.5, h = 0.4 + r() * 0.5, m = LM(clothCols[(r() * 7) | 0], { side: THREE.DoubleSide }), c = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0), m);
      c.position.set(-1.9 + k * 0.6 + r() * 0.15, 1.9, 0); g.add(c); CLOTH.push({ m: c, ph: r() * 6, g: group }); }
    group.add(g); }
  function carpetRack(group, x, z, ry, r) { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = ry;
    for (const s of [-1.3, 1.3]) { const p = cyl(0.05, 0.05, 2.2, metal, 6); p.position.set(s, 1.1, 0); g.add(p); } const bar = cyl(0.04, 0.04, 2.7, metal, 6); bar.rotation.z = Math.PI / 2; bar.position.y = 2.1; g.add(bar);
    if (r() < 0.7) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4).translate(0, -1.2, 0), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 1, side: THREE.DoubleSide })); c.position.set(0, 2.12, 0.03); c.rotation.x = 0.05; g.add(c); CLOTH.push({ m: c, ph: r() * 6, g: group, k: 0.3 }); }
    group.add(g); }
  function sandbox(group, x, z, ry, r) { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = r() * 6;
    for (const [px, pz, sx, sz] of [[0, -1.3, 2.7, 0.1], [0, 1.3, 2.7, 0.1], [-1.3, 0, 0.1, 2.6], [1.3, 0, 0.1, 2.6]]) { const b = box(sx, 0.28, sz, LM([0xb83a2a, 0x3a6ab8, 0xe8c040][(r() * 3) | 0])); b.position.set(px, 0.14, pz); g.add(b); }
    const sand = box(2.5, 0.1, 2.5, LM(0x9a8a6a)); sand.position.y = 0.06; g.add(sand); if (r() < 0.6) { const bk = cyl(0.07, 0.09, 0.14, LM(0xd83a3a)); bk.position.set(0.6, 0.18, -0.3); g.add(bk); } group.add(g); }
  function junk(group, x, z, ry, r) { const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = r() * 6;
    if (r() < 0.5) { const sofa = new THREE.Group(), m = LM([0x5a3a2a, 0x3a4a3a, 0x6a5a4a][(r() * 3) | 0]); const seat = box(1.9, 0.4, 0.8, m); seat.position.y = 0.3; const back = box(1.9, 0.6, 0.2, m); back.position.set(0, 0.7, -0.3); back.rotation.x = -0.15;
      for (const s of [-1, 1]) { const arm = box(0.18, 0.5, 0.8, m); arm.position.set(s * 0.95, 0.45, 0); sofa.add(arm); } sofa.add(seat, back); sofa.rotation.z = 0.04; g.add(sofa); }
    else { const fr = box(0.6, 1.5, 0.6, LM(0xd8d8d0, { roughness: 0.4 })); fr.position.y = 0.75; fr.rotation.z = r() < 0.4 ? 1.45 : 0.06; if (fr.rotation.z > 1) fr.position.y = 0.3; g.add(fr); const lg = box(0.04, 0.3, 0.04, LM(0x888888)); lg.position.set(0.25, fr.rotation.z > 1 ? 0.55 : 1.0, 0.31); g.add(lg); }
    group.add(g); }

  // ---------- обёртка генерации чанка: бабушки к новым лавкам + быт ----------
  const ob = OUT_BUILD;
  OUT_BUILD = (cx, cz) => { const n0 = window.__benches.length, res = ob(cx, cz), r = rng((cx * 92821) ^ (cz * 68917) ^ 0x51fe);
    const cols = res.cols || [];
    const ok = (x, z, rad) => { if (!inWorld(x, z) || dvRoadD(x, z) < 6.8 + rad) return false; for (const c of cols) if (Math.abs(x - c.x) < c.hx + c.hz + rad + 0.3 && Math.abs(z - c.z) < c.hx + c.hz + rad + 0.3) { const lx = (x - c.x) * c.c - (z - c.z) * c.s, lz = (x - c.x) * c.s + (z - c.z) * c.c; if (Math.abs(lx) < c.hx + rad && Math.abs(lz) < c.hz + rad) return false; } return true; };
    if (LIVE) for (let i = n0; i < window.__benches.length; i++) { const bn = window.__benches[i]; if (bn.g !== res.group) continue; const k = r(); if (k < 0.55) granny(res.group, bn.x, bn.z, bn.ry, -0.45, i * 31 + 7); if (k < 0.25) granny(res.group, bn.x, bn.z, bn.ry, 0.45, i * 31 + 11); }
    const x0 = cx * CS, z0 = cz * CS, rp = () => [x0 + 4 + r() * (CS - 8), z0 + 4 + r() * (CS - 8)];
    for (const [f, p, rad] of [[laundry, 0.45, 2.6], [carpetRack, 0.35, 1.6], [sandbox, 0.3, 1.6], [junk, 0.3, 1.2]]) if (r() < p) for (let t = 0; t < 6; t++) { const [x, z] = rp(); if (ok(x, z, rad)) { f(res.group, x, z, r() * 6.28, r); res.cols.push({ x, z, hx: rad * 0.6, hz: rad * 0.35, c: 1, s: 0 }); break; } }
    return res; };

  // ---------- 2. БРОДЯЧИЕ СОБАКИ ----------
  const DOGS = []; const DOGC = [0x5a4030, 0x2a2420, 0x9a7040, 0x6a6058, 0xc8b090];
  function makeDog(c) { const g = new THREE.Group(), m = LM(c), dark = LM(0x1a1612);
    const body = cap(0.15, 0.5, m); body.rotation.z = Math.PI / 2; body.position.y = 0.48; const head = new THREE.Group(); head.position.set(0.42, 0.62, 0);
    const skull = sph(0.12, m); const snout = box(0.14, 0.08, 0.09, m); snout.position.set(0.12, -0.03, 0); const nose = sph(0.025, dark); nose.position.set(0.2, -0.02, 0);
    for (const s of [-0.06, 0.06]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), m); ear.position.set(-0.02, 0.11, s); head.add(ear); }
    head.add(skull, snout, nose); const tail = cyl(0.03, 0.015, 0.3, m, 5); tail.position.set(-0.42, 0.6, 0); tail.rotation.z = 0.9;
    const legs = []; for (const [lx, lz] of [[0.25, -0.09], [0.25, 0.09], [-0.25, -0.09], [-0.25, 0.09]]) { const l = cyl(0.035, 0.03, 0.38, m, 5); l.geometry.translate(0, -0.19, 0); l.position.set(lx, 0.4, lz); g.add(l); legs.push(l); }
    g.add(body, head, tail); g.traverse((o) => { o.castShadow = Q.shadows; }); scene.add(g); return { g, head, tail, legs }; }
  if (LIVE) for (let i = 0; i < 3; i++) DOGS.push(Object.assign(makeDog(DOGC[i % 5]), { x: 0, z: 0, a: 0, sp: 0, t: 0, ph: Math.random() * 6, barkT: 2, on: false }));
  let dogCx = 0, dogCz = 0, dogT = 0;
  function dogBark(d) { if (!AC) return; const p = pan(d.x, d.z), v = 0.07 * vol(d.x, d.z, 40); if (v <= 0) return; const t0 = AC.currentTime, f0 = 330 + Math.random() * 180;
    for (let k = 0; k < 1 + ((Math.random() * 3) | 0); k++) { const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(), t = t0 + k * 0.25; o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * 1.3, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.7, t + 0.12); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.4; sp.pan.value = p;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.16); o.connect(f).connect(g).connect(sp).connect(master); o.start(t); o.stop(t + 0.2); } }

  // ---------- 3. КОТЫ ----------
  const CATS = []; const CATC = [0x2a2622, 0xb07040, 0x8a8a88, 0xe8e0d0];
  function makeCat(c) { const g = new THREE.Group(), m = LM(c); const body = cap(0.08, 0.16, m); body.position.set(0, 0.16, 0); body.rotation.x = -0.4; const head = sph(0.075, m); head.position.set(0, 0.32, 0.06);
    for (const s of [-0.035, 0.035]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 4), m); ear.position.set(s, 0.39, 0.06); g.add(ear); const e = sph(0.011, LM(0xc8d040, { emissive: 0x303000 })); e.position.set(s * 0.7, 0.33, 0.125); g.add(e); }
    const tail = cyl(0.015, 0.012, 0.3, m, 5); tail.position.set(0, 0.06, -0.15); tail.rotation.x = 1.4; g.add(body, head, tail); scene.add(g); return { g }; }
  if (LIVE) for (let i = 0; i < 3; i++) CATS.push(Object.assign(makeCat(CATC[i]), { on: false, t: i * 3, run: 0, x: 0, z: 0, a: 0 }));

  // ---------- 4. ВЕТЕР: пакеты и газеты катятся по двору ----------
  const BAGS = []; const bagM = [LM(0xf0f0ec, { transparent: true, opacity: 0.85, side: THREE.DoubleSide, roughness: 0.4 }), LM(0x3a5aa8, { transparent: true, opacity: 0.85, side: THREE.DoubleSide, roughness: 0.4 }), LM(0xd8d0b8, { side: THREE.DoubleSide })];
  for (let i = 0; i < (MOBILE ? 3 : 6); i++) { const k = i % 3, geo = k < 2 ? new THREE.SphereGeometry(0.16, 8, 6).scale(1, 0.55, 0.8) : new THREE.PlaneGeometry(0.4, 0.3); const m = new THREE.Mesh(geo, bagM[k]); m.castShadow = false; scene.add(m); BAGS.push({ m, x: 0, z: 0, y: 0, vy: 0, on: false, ph: Math.random() * 6 }); }

  // ---------- 5. ПАР ИЗ ЛЮКОВ ----------
  const mhM = PBR_ON ? new THREE.MeshStandardMaterial({ map: T('dv_manhole.png'), transparent: true, roughness: 0.5, metalness: 0.4 }) : LM(0x2a2826);
  const STEAMS = []; const steam = particles(MOBILE ? 90 : 160, 1.6, 0xeeeeee, 0.22);
  for (let i = 0; i < 3; i++) { const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 20), mhM); scene.add(lid); STEAMS.push({ lid, x: 0, z: 0, on: false }); }

  // ---------- 6. ТРУБА ТЭЦ НА ГОРИЗОНТЕ ----------
  const stackTex = texFrom(mkCanvas(64, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#d8d4cc' : '#a8382a'; g.fillRect(0, i * h / 8, w, h / 8); } g.fillStyle = 'rgba(30,25,20,0.35)'; g.fillRect(0, 0, w, 40); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 8); } }));
  const STACK = { x: 330, z: -470, h: 150 }; { const m = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5.5, STACK.h, 24, 1, true), new THREE.MeshStandardMaterial({ map: stackTex, roughness: 0.9, side: THREE.DoubleSide })); m.position.set(STACK.x, STACK.h / 2 - 2, STACK.z); scene.add(m);
    for (const [dx, dz, hh] of [[24, 10, 110], [-30, 18, 95]]) { const s2 = m.clone(); s2.scale.set(0.8, hh / STACK.h, 0.8); s2.position.set(STACK.x + dx, hh / 2 - 2, STACK.z + dz); scene.add(s2); } }
  const smoke = particles(90, 22, ALT ? 0x6a2a20 : 0xc8c4c0, 0.32);

  // ---------- 7. ГЛАЗА: экспозиция + пар изо рта ----------
  const breath = particles(24, 0.25, 0xffffff, 0.22); let breathT = 2;

  // ---------- 8. «ВОЛГА» НА ПРОГРЕВЕ ----------
  const IDLE = LIVE ? Object.assign(makeCar(), { on: false, hum: null }) : null; const exhaust = particles(40, 0.6, 0xd8d8d8, 0.25);
  if (IDLE) { IDLE.g.traverse((o) => { if (o.material && o.material.color && o.material !== lightMat && o.material !== tailMat && o.material.metalness > 0.3) o.material = o.material.clone(), o.material.color.setHex(0xe4e2da); }); IDLE.g.visible = false; scene.add(IDLE.g); }

  // ---------- 10. ЗВУКИ: радио из окна, трамвай, порывы ветра; гаражи ----------
  if (PBR_ON) { window.__garDoor = std({ map: T('dv_garage_door.jpg', 1 / 2.9, 1 / 2.15), roughness: 0.7, metalness: 0.3 }); window.__garWall = std({ map: T('dv_graffiti.jpg', 1 / 3, 1 / 3), roughness: 0.9 }); }
  if (PBR_ON && typeof mosaicMat !== 'undefined') { mosaicMat.map = T('dv_mosaic.jpg'); mosaicMat.needsUpdate = true; }
  let radioT = 25, tramT = 40, windT = 6;
  function radio() { if (!AC) return; let best = null, bd = 60; for (const list of colliders.values()) for (const c of list) if (c.hx > 12 || c.hz > 12) { const d = Math.hypot(c.x - P.x, c.z - P.z); if (d < bd) { bd = d; best = c; } } if (!best) return;
    const p = pan(best.x, best.z), v = 0.022 * Math.max(0.2, 1 - bd / 60), t0 = AC.currentTime, mel = [57, 60, 64, 62, 60, 59, 57, 52, 57, 60, 64, 65, 64, 62, 60, 59], dur = 0.42;
    const sp = AC.createStereoPanner(); sp.pan.value = p; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.9; f.connect(sp).connect(master);
    for (let rep2 = 0; rep2 < 2; rep2++) mel.forEach((n, i) => { const t = t0 + (rep2 * mel.length + i) * dur, o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (n - 69) / 12); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.95); o.connect(g).connect(f); o.start(t); o.stop(t + dur);
      if (i % 2 === 0) { const b2 = AC.createOscillator(), g2 = AC.createGain(); b2.type = 'sine'; b2.frequency.value = 440 * Math.pow(2, (n - 81) / 12); g2.gain.setValueAtTime(v * 0.8, t); g2.gain.exponentialRampToValueAtTime(0.0005, t + dur * 1.8); b2.connect(g2).connect(f); b2.start(t); b2.stop(t + dur * 2); } }); }
  function tram() { if (!AC) return; const p = Math.random() < 0.5 ? -0.8 : 0.8; for (const [k, f0] of [[0, 1180], [0.32, 1180]]) setTimeout(() => blip([f0, f0 * 1.5], 0.6, 'sine', 0.012), k * 1000); burst(4, 'lowpass', 160, 0.5, 0.2, p); setTimeout(() => burst(2.5, 'bandpass', 2400, 3, 0.01, p), 900); }
  function windGust() { if (!AC) return; burst(2.4 + Math.random() * 2, 'bandpass', 420 + Math.random() * 300, 0.6, 0.06 + gust * 0.06, Math.random() * 2 - 1); }

  const camDir = new V3();
  const prevUpd = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { prevUpd(dt); if (!started) return; camera.getWorldDirection(camDir);
    const wx = 0.8 + gust * 1.8, wz = 0.35;   // ветер с запада
    // 1. бабушки поворачивают голову к тебе и бубнят
    for (let i = GRANNIES.length - 1; i >= 0; i--) { const b = GRANNIES[i]; if (!b.g.parent || !b.g.parent.parent) { GRANNIES.splice(i, 1); continue; } const d = Math.hypot(b.x - P.x, b.z - P.z); if (d > 30) continue;
      const want = d < 12 ? Math.atan2(P.x - b.x, P.z - b.z) - b.ry : Math.sin(clock * 0.3 + i) * 0.4; const cur = b.head.rotation.y; let df = ((want - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; df = Math.max(-1.1, Math.min(1.1, cur + df * dt * 2)) - cur; b.head.rotation.y += df;
      b.t -= dt; if (b.t < 0) { b.t = 4 + Math.random() * 8; if (d < 14) grannyTalk(b.x, b.z); } }
    // 2. собаки
    if (DOGS.length) { dogT -= dt; if (dogT < 0 || Math.hypot(dogCx - P.x, dogCz - P.z) > 90) { dogT = 40 + Math.random() * 30; for (let k = 0; k < 8; k++) { const a = Math.random() * 6.28, r2 = 25 + Math.random() * 30, x = P.x + Math.sin(a) * r2, z = P.z + Math.cos(a) * r2; if (freeAt(x, z)) { dogCx = x; dogCz = z; DOGS.forEach((d, i) => { d.x = x + i; d.z = z + (i % 2); d.on = true; d.g.visible = true; }); break; } } }
      for (const d of DOGS) { if (!d.on) { d.g.visible = false; continue; } const dp = Math.hypot(d.x - P.x, d.z - P.z); d.t -= dt; d.barkT -= dt;
        if (dp < 9) { d.a = Math.atan2(P.x - d.x, P.z - d.z); d.sp = dp < 3.5 ? -1.2 : 0; if (d.barkT < 0) { d.barkT = 0.8 + Math.random() * 2.2; dogBark(d); } }
        else if (d.t < 0) { d.t = 1.5 + Math.random() * 4; const toC = Math.atan2(dogCx - d.x, dogCz - d.z); d.a = Math.hypot(dogCx - d.x, dogCz - d.z) > 8 ? toC : d.a + (Math.random() - 0.5) * 2.5; d.sp = Math.random() < 0.6 ? 0.9 + Math.random() * 0.8 : 0; if (Math.random() < 0.08) dogBark(d); }
        if (d.sp) { const nx = d.x + Math.sin(d.a) * d.sp * dt, nz = d.z + Math.cos(d.a) * d.sp * dt; if (freeAt(nx, nz)) { d.x = nx; d.z = nz; } else d.a += 2; }
        d.ph += dt * Math.abs(d.sp) * 7; d.legs.forEach((l, k) => { l.rotation.z = d.sp ? Math.sin(d.ph + (k % 2 ? Math.PI : 0) + (k > 1 ? Math.PI / 2 : 0)) * 0.5 : 0; });
        d.tail.rotation.x = Math.sin(clock * (dp < 9 ? 14 : 4)) * 0.4; d.g.position.set(d.x, groundH(d.x, d.z), d.z); d.g.rotation.y = d.a - Math.PI / 2; } }
    // 3. коты: сидят на лавках/у подъездов, убегают
    for (const c of CATS) { c.t -= dt; if (!c.on) { if (c.t < 0) { const bs = window.__benches.filter((b) => b.g.parent && Math.hypot(b.x - P.x, b.z - P.z) > 14 && Math.hypot(b.x - P.x, b.z - P.z) < 50); if (bs.length) { const b = bs[(Math.random() * bs.length) | 0]; c.x = b.x + (Math.random() - 0.5) * 1.2; c.z = b.z; c.y = groundH(b.x, b.z) + 0.47; c.on = true; c.run = 0; c.a = b.ry + Math.PI; } else c.t = 3; } c.g.visible = c.on; continue; }
      const dp = Math.hypot(c.x - P.x, c.z - P.z); if (dp < 4 && !c.run) { c.run = 1; c.a = Math.atan2(c.x - P.x, c.z - P.z); if (AC) blip([780, 560], 0.25, 'sawtooth', 0.01 * vol(c.x, c.z, 20)); }
      if (c.run) { c.x += Math.sin(c.a) * 5 * dt; c.z += Math.cos(c.a) * 5 * dt; c.y = groundH(c.x, c.z); if (dp > 35) { c.on = false; c.t = 8 + Math.random() * 10; } } else if (dp > 70) { c.on = false; c.t = 2; }
      c.g.position.set(c.x, c.y + (c.run ? Math.abs(Math.sin(clock * 18)) * 0.06 : 0), c.z); c.g.rotation.y = c.a; c.g.visible = true; }
    // 4. пакеты и газеты по ветру
    for (const b of BAGS) { if (!b.on || Math.hypot(b.x - P.x, b.z - P.z) > 40) { const a = Math.random() * 6.28, r2 = 10 + Math.random() * 25; b.x = P.x - wx * 6 + Math.sin(a) * r2; b.z = P.z + Math.cos(a) * r2; b.y = 0.15; b.vy = 0; b.on = true; }
      b.ph += dt; const lift = gust > 0.6 ? (gust - 0.6) * 6 : 0; b.vy += (lift - 3) * dt; b.y = Math.max(0.12, b.y + b.vy * dt); if (b.y <= 0.12) b.vy = 0;
      const nx = b.x + (wx + Math.sin(b.ph * 1.7) * 0.6) * dt * (0.6 + gust), nz = b.z + (wz + Math.cos(b.ph * 1.3) * 0.6) * dt; const c = collide(nx, nz); b.x = c[0]; b.z = c[1];
      b.m.position.set(b.x, groundH(b.x, b.z) + b.y, b.z); b.m.rotation.set(b.ph * 3, b.ph * 1.3, b.ph * 2.1); }
    // 5. пар из люков
    for (const s of STEAMS) if (!s.on || !near(s, 75)) { s.on = false; for (let k = 0; k < 6 && !s.on; k++) { const a = Math.random() * 6.28, r2 = 18 + Math.random() * 40, x = P.x + Math.sin(a) * r2, z = P.z + Math.cos(a) * r2; if (freeAt(x, z)) { s.x = x; s.z = z; s.on = true; s.lid.position.set(x, groundH(x, z) + 0.016, z); } } }
    { const p = steam; for (let i = 0; i < p.n; i++) { p.life[i] -= dt; if (p.life[i] <= 0) { const s = STEAMS[i % STEAMS.length]; if (!s.on) continue; p.life[i] = 2 + Math.random() * 2.5; p.pos[i * 3] = s.x + (Math.random() - 0.5) * 0.5; p.pos[i * 3 + 1] = groundH(s.x, s.z) + 0.05; p.pos[i * 3 + 2] = s.z + (Math.random() - 0.5) * 0.5; p.vel[i * 3] = (Math.random() - 0.5) * 0.2; p.vel[i * 3 + 1] = 0.5 + Math.random() * 0.5; p.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.2; }
      p.pos[i * 3] += (p.vel[i * 3] + wx * 0.35) * dt; p.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt; p.pos[i * 3 + 2] += (p.vel[i * 3 + 2] + wz * 0.3) * dt; } p.g.attributes.position.needsUpdate = true; }
    // 6. дым ТЭЦ
    { const p = smoke; for (let i = 0; i < p.n; i++) { p.life[i] -= dt; if (p.life[i] <= 0) { p.life[i] = 18 + Math.random() * 14; p.pos[i * 3] = STACK.x + (Math.random() - 0.5) * 4; p.pos[i * 3 + 1] = STACK.h; p.pos[i * 3 + 2] = STACK.z + (Math.random() - 0.5) * 4; }
      p.pos[i * 3] += (3 + gust * 4) * dt; p.pos[i * 3 + 1] += 1.6 * dt; p.pos[i * 3 + 2] += 0.6 * dt; } p.g.attributes.position.needsUpdate = true; }
    // 7. экспозиция «глаза» и дыхание
    { const t = Math.max(0, Math.min(1, (P.pitch + 0.05) / 0.65)); post.U.expo.value += ((1.08 - 0.26 * t) - post.U.expo.value) * Math.min(1, dt * 1.5);
      breathT -= dt; const p = breath; if (breathT < 0) { breathT = 3.2 + Math.random() * 1.5 - Math.min(1.5, P.speed * 0.3); for (let k = 0; k < 8; k++) { const i = ((Math.random() * p.n) | 0); p.life[i] = 0.9 + Math.random() * 0.5; p.pos[i * 3] = camera.position.x + camDir.x * 0.32; p.pos[i * 3 + 1] = camera.position.y - 0.12; p.pos[i * 3 + 2] = camera.position.z + camDir.z * 0.32; p.vel[i * 3] = camDir.x * 0.5 + (Math.random() - 0.5) * 0.15; p.vel[i * 3 + 1] = 0.08 + Math.random() * 0.08; p.vel[i * 3 + 2] = camDir.z * 0.5 + (Math.random() - 0.5) * 0.15; } }
      for (let i = 0; i < p.n; i++) { if (p.life[i] <= 0) { p.pos[i * 3 + 1] = -9999; continue; } p.life[i] -= dt; p.pos[i * 3] += p.vel[i * 3] * dt + (P.dx || 0) * P.speed * dt; p.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt; p.pos[i * 3 + 2] += p.vel[i * 3 + 2] * dt + (P.dz || 0) * P.speed * dt; } p.g.attributes.position.needsUpdate = true; }
    // 8. машина на прогреве
    if (IDLE) { if (!IDLE.on || Math.hypot(IDLE.x - P.x, IDLE.z - P.z) > 110) { for (let k = 0; k < 8; k++) { const a = Math.random() * 6.28, r2 = 25 + Math.random() * 35, x = P.x + Math.sin(a) * r2, z = P.z + Math.cos(a) * r2; if (freeAt(x, z) && freeAt(x + 2.4, z) && freeAt(x - 2.4, z)) { IDLE.x = x; IDLE.z = z; IDLE.on = true; IDLE.g.position.set(x, groundH(x, z), z); IDLE.g.rotation.y = Math.random() < 0.5 ? 0 : Math.PI; IDLE.g.visible = true; break; } } }
      if (IDLE.on) { const back = IDLE.g.rotation.y === 0 ? -2.3 : 2.3, p = exhaust; for (let i = 0; i < p.n; i++) { p.life[i] -= dt; if (p.life[i] <= 0) { p.life[i] = 1.2 + Math.random(); p.pos[i * 3] = IDLE.x + back; p.pos[i * 3 + 1] = groundH(IDLE.x, IDLE.z) + 0.3; p.pos[i * 3 + 2] = IDLE.z + 0.5; p.vel[i * 3] = Math.sign(back) * (0.4 + Math.random() * 0.3); p.vel[i * 3 + 1] = 0.25 + Math.random() * 0.2; }
          p.pos[i * 3] += (p.vel[i * 3] + wx * 0.4) * dt; p.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt; p.pos[i * 3 + 2] += wz * 0.3 * dt; } p.g.attributes.position.needsUpdate = true;
        if (AC) { if (!IDLE.hum) { const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(), lfo = AC.createOscillator(), lg = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = 34; lfo.frequency.value = 9; lg.gain.value = 3; lfo.connect(lg).connect(o.frequency); f.type = 'lowpass'; f.frequency.value = 180; g.gain.value = 0; o.connect(f).connect(g).connect(sp).connect(master); o.start(); lfo.start(); IDLE.hum = { g, sp }; }
          IDLE.hum.g.gain.value = 0.06 * vol(IDLE.x, IDLE.z, 30); IDLE.hum.sp.pan.value = pan(IDLE.x, IDLE.z); } } }
    // 9. бельё и ковры качаются на ветру
    for (let i = CLOTH.length - 1; i >= 0; i--) { const c = CLOTH[i]; if (!c.g.parent) { CLOTH.splice(i, 1); continue; } if (!near(c.m.parent.position, 60)) continue; c.ph += dt * (1.5 + gust * 3); c.m.rotation.x = -(0.15 + gust * 0.5) * (c.k || 1) - Math.sin(c.ph) * 0.12 * (c.k || 1); c.m.rotation.y = Math.sin(c.ph * 0.7) * 0.1; }
    // 10. звуки района
    radioT -= dt; if (radioT < 0) { radioT = 45 + Math.random() * 40; if (LIVE) radio(); }
    tramT -= dt; if (tramT < 0) { tramT = 50 + Math.random() * 60; if (LIVE) tram(); }
    windT -= dt; if (windT < 0) { windT = 6 + Math.random() * 10; if (gust > 0.45) windGust(); }
  };
}
