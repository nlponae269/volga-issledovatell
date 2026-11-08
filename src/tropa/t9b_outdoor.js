// ===================== Остановка, Пляж, Пионерлагерь, Поле, Аномальная зима =====================
function kit(cx, cz, salt) {
  const group = new THREE.Group(), b = new Batch(), r = rng((cx * 73856093) ^ (cz * 19349663) ^ salt), x0 = cx * CS, z0 = cz * CS, x1 = x0 + CS, z1 = z0 + CS, inst = new Map(), occ = [];
  const K = { group, b, r, x0, z0, x1, z1, occ,
    inb: (x, z) => x >= x0 && x < x1 && z >= z0 && z < z1,
    free: (x, z, rad) => { if (!K.inb(x, z)) return false; if (K.block && K.block(x, z, rad)) return false; for (const o of occ) if (Math.hypot(o[0] - x, o[1] - z) < o[2] + rad) return false; return true; },
    take: (x, z, rad) => occ.push([x, z, rad]),
    plant: (key, x, z, s = 1) => { const rad = PROTO[key].col ? 1.0 : 0.6; if (!K.free(x, z, rad)) return false; K.take(x, z, rad); const m = new THREE.Matrix4().compose(new V3(x, groundH(x, z) - 0.05, z), new THREE.Quaternion().setFromAxisAngle(UP, r() * 6.283), new V3(s, s * (0.9 + r() * 0.2), s)); (inst.get(key) || inst.set(key, []).get(key)).push(m); if (PROTO[key].col) b.cols.push({ x, z, hx: PROTO[key].col * s, hz: PROTO[key].col * s, c: 1, s: 0 }); return true; },
    pick: (a) => a[(r() * a.length) | 0],
    finish: () => { keyInChunk(group, x0, z0, x1, z1); b.build(group); for (const [key, ms] of inst) for (const [mat, geo] of PROTO[key].parts) { const im = new THREE.InstancedMesh(geo, mat, ms.length); ms.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = Q.shadows; im.receiveShadow = true; im.computeBoundingSphere(); group.add(im); } scene.add(group); return { group, cols: b.cols }; } };
  return K;
}
const signMat = (text, bg = '#2a4a8a', fg = '#fff', w = 512, h = 112, font = 'bold 64px sans-serif') => new THREE.MeshStandardMaterial({ roughness: 0.7, map: texFrom(mkCanvas(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 3); for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } })) });
function signAt(group, mat, w, h, x, y, z, ry) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; group.add(m); const m2 = m.clone(); m2.rotation.y = ry + Math.PI; m2.position.add(new V3(Math.sin(ry), 0, Math.cos(ry)).multiplyScalar(-0.02)); group.add(m2); return m; }
function lampPost(b, group, x, z, color, r) { const y = groundH(x, z); b.cyl(M.metal, x, y + 2.6, z, 0.07, 0.05, 5.2, 8, PAINT.dark); b.pipe(M.metal, new V3(x, y + 5.1, z), new V3(x + 0.7, y + 5.2, z), 0.035, PAINT.dark);
  const on = !r || r() < 0.85; const lm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: on ? 0xffd8a0 : 0x555, emissive: on ? color : 0, emissiveIntensity: 5 })); lm.position.set(x + 0.75, y + 5.05, z); group.add(lm);
  if (on) bulbAnchors.push({ x: x + 0.75, y: y + 4.9, z, fy: 0, group, mesh: null, color, dist: 16, int: 14 }); b.collide(x, z, 0.12, 0.12); }

// ================= ОСТАНОВКА =================
const mosaicMat = new THREE.MeshStandardMaterial({ roughness: 0.6, map: texFrom(mkCanvas(512, 256, (g, w, h) => { const r = rng(7), cs = 8;
  for (let y = 0; y < h; y += cs) for (let x = 0; x < w; x += cs) { const dx = x - w * 0.3, dy = y - h * 0.45, d = Math.hypot(dx, dy); let c;
    if (d < 50) c = ['#e8b020', '#f0c840', '#d89818'][(r() * 3) | 0]; else if (d < 62 && (Math.atan2(dy, dx) * 8 % 1 + 1) % 1 < 0.5) c = '#e0a020';
    else if (y > h * 0.7) c = ['#1a5a9a', '#2a6aaa', '#1a4a8a', '#3a7aba'][(r() * 4) | 0]; else if (Math.abs(y - (h * 0.25 + Math.sin(x * 0.03) * 20)) < 10 && x > w * 0.5) c = '#f0f0f0';
    else c = ['#c84a3a', '#d85a3a', '#b83a2a', '#e86a4a'][(r() * 4) | 0];
    g.fillStyle = c; g.fillRect(x + 0.7, y + 0.7, cs - 1.4, cs - 1.4); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 60; i++) g.fillRect(r() * w, r() * h, cs, cs); })) });
const STOP_EVERY = 300, STOP_Z = -26.6;
function busStop(b, group, x) { const z = STOP_Z, y = groundH(x, z);
  b.box(M.conc, x, y + 0.08, z - 0.4, 6.4, 0.16, 3.4, shade(0.85));
  b.box(M.conc, x, y + 1.35, z + 1.0, 6.0, 2.5, 0.2, shade(0.9)); const mm = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.3), mosaicMat); mm.position.set(x, y + 1.35, z + 0.89); mm.rotation.y = Math.PI; group.add(mm);
  for (const s of [-1, 1]) b.box(M.conc, x + s * 3.0, y + 1.35, z, 0.2, 2.5, 2.2, shade(0.9));
  b.box(M.conc, x, y + 2.7, z - 0.2, 6.6, 0.22, 3.0, shade(0.8), 0.04);
  b.box(M.plank, x, y + 0.48, z + 0.6, 4.2, 0.06, 0.4, shade(0.7)); for (const dx of [-1.8, 0, 1.8]) b.box(M.conc, x + dx, y + 0.24, z + 0.6, 0.16, 0.45, 0.35, shade(0.8));
  b.cyl(M.metal, x - 3.8, y + 1.3, z - 1.6, 0.04, 0.04, 2.6, 8, PAINT.galv); signAt(group, signMat('А', '#f0f0f0', '#1a3a8a', 128, 128, 'bold 90px sans-serif'), 0.45, 0.45, x - 3.8, y + 2.5, z - 1.6, Math.PI);
  b.cyl(M.metal, x + 3.6, y + 0.4, z - 0.6, 0.22, 0.26, 0.8, 10, PAINT.green);
  b.cols.push({ x, z: z + 1.0, hx: 3.1, hz: 0.2, c: 1, s: 0 }, { x: x - 3.0, z, hx: 0.12, hz: 1.1, c: 1, s: 0 }, { x: x + 3.0, z, hx: 0.12, hz: 1.1, c: 1, s: 0 });
  for (let k = 0; k < 4; k++) { const tx = x + (Math.random() - 0.5) * 5, tz = z - 0.5 - Math.random() * 1.8; if (Math.random() < 0.5) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.003, 0.035).translate(0, 0.002, 0), std({ color: 0xe8d8a0, roughness: 0.9 })); addItem(group, m, tx, groundH(tx, tz) + 0.01, tz, `tal${x},${k}`, 'Талон'); } } }
// ПАЗик
function makePaz() {
  const g = new THREE.Group(), body = std({ color: 0xe8dcc0, roughness: 0.45, metalness: 0.3 }), stripe = std({ color: 0xc86a2a, roughness: 0.5 });
  const sh = extrude([[-3.6, 0.45], [-3.65, 2.4], [-3.4, 2.75], [3.2, 2.75], [3.6, 2.2], [3.75, 1.3], [3.7, 0.45]], 2.35, 0.08); const bm = new THREE.Mesh(sh, body); g.add(bm);
  const st = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.25, 2.5), stripe); st.position.set(0, 1.05, 0); g.add(st);
  const win = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.8, 2.46), M.glass); win.position.set(-0.2, 1.95, 0); g.add(win);
  const ws = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 2.1), M.glass); ws.position.set(3.62, 1.8, 0); ws.rotation.z = 0.35; g.add(ws);
  const doors = []; for (const dx of [2.7, -0.6]) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 0.05), std({ color: 0x2a2a2a, roughness: 0.4 })); d.position.set(dx, 1.3, 1.24); g.add(d); doors.push(d); }
  for (const sx of [2.4, -2.2]) for (const sz of [-1.05, 1.05]) { const w = new THREE.Mesh(wheelGeo, M.rubber); w.scale.set(1.35, 1.35, 1.2); w.position.set(sx, 0.45, sz); g.add(w); }
  for (const sz of [-0.85, 0.85]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.3), lightMat); h.position.set(3.76, 0.95, sz); g.add(h); }
  const inner = new THREE.PointLight(0xffe0b0, 0, 6, 2); inner.position.set(0, 2.2, 0); g.add(inner);
  g.traverse((o) => { o.castShadow = Q.shadows; }); g.visible = false; scene.add(g); return { g, doors, inner };
}
const PAZ = BUS ? Object.assign(makePaz(), { st: 'away', t: 25, x: 0, stopX: 0, v: 0 }) : null;
const pazInter = { x: 0, z: 0, r: 2.2, label: 'E — сесть в ПАЗик', on: () => PAZ && PAZ.st === 'open', act: () => goWorld(randomWorld(), 'ПАЗик едет в тумане…<br><span style="font-size:15px;color:#999">куда — неизвестно</span>') };
function pazUpdate(dt) { const p = PAZ; if (!p) return; p.t -= dt;
  if (p.st === 'away' && p.t < 0) { p.stopX = Math.round(P.x / STOP_EVERY) * STOP_EVERY; if (Math.abs(p.stopX - P.x) < 70) { p.st = 'come'; p.x = p.stopX - 220; p.v = 14; p.g.visible = true; } else p.t = 5; }
  if (p.st === 'come') { const d = p.stopX - p.x; p.v = Math.min(14, Math.max(0.5, d * 0.35)); p.x += p.v * dt; if (d < 0.2) { p.st = 'open'; p.t = 22; blip([300, 260], 0.5, 'sawtooth', 0.04); burst(0.6, 'lowpass', 800, 0.5, 0.3); } }
  if (p.st === 'open') { for (const d of p.doors) d.position.z = Math.min(1.24 + 0.0, d.position.z); p.doors[0].visible = p.doors[1].visible = false; p.inner.intensity = 3; if (p.t < 0) { p.st = 'go'; p.doors[0].visible = p.doors[1].visible = true; p.inner.intensity = 0; burst(0.5, 'lowpass', 600, 0.5, 0.3); } }
  if (p.st === 'go') { p.v = Math.min(16, p.v + dt * 3); p.x += p.v * dt; if (p.x - p.stopX > 260) { p.st = 'away'; p.g.visible = false; p.t = 25 + Math.random() * 30; } }
  p.g.position.set(p.x, ROAD_Y, LANE_Z[1]); pazInter.x = p.x + 1; pazInter.z = LANE_Z[1] + 1.9; }
if (BUS) { P.x = 2; P.z = STOP_Z - 1.6; P.yaw = Math.PI / 2 + 0.3; INTER.push(pazInter); WORLD_UPDATE = pazUpdate;
  EXTRA_BUILD = (b, group, r, cx, cz, x0, z0, x1, z1) => { if (STOP_Z >= z0 && STOP_Z < z1) for (let x = Math.ceil(x0 / STOP_EVERY) * STOP_EVERY; x < x1; x += STOP_EVERY) busStop(b, group, x); }; }

// ================= ПЛЯЖ =================
const water = BEACH ? (() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(700, 400).rotateX(-Math.PI / 2), envMat({ color: 0x3a4a52, metalness: 1, roughness: 0.04 }, 1.2)); m.position.y = -0.22; scene.add(m); return m; })() : null;
const NOTES_BEACH = ['«Если ты это читаешь — значит, вода всё-таки стоит. Мы ждали лодку три дня.»', '«Не ходи в воду дальше колена. Там Волга, а за ней — та же Волга.»', '«Мама, я на пляже. Тут никого. Песок тёплый, хотя октябрь.»', '«Нашёл ключ в лодке. Не мой. Оставил в песке у вышки.»', '«Сегодня спасатель не пришёл на вышку. Вчера тоже.»', '«Грибки пронумерованы. Номера повторяются.»', '«Если бросить камень — кругов нет.»', '«Мы вернёмся летом. Если оно будет.»'];
const shellMat = std({ color: 0xe8d0c0, roughness: 0.6 }), bottleMat = envMat({ color: 0x5a7a4a, roughness: 0.08, transparent: true, opacity: 0.75 }, 0.9);
function boat(b, x, z, ry, r) { const y = groundH(x, z); const g = new THREE.CylinderGeometry(0.75, 0.75, 4.2, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.55, 1); b.push(x, y + 0.02, z, ry); b.add(M.paint, g, new THREE.Matrix4().makeRotationX(Math.PI), lin([[0.2, 0.35, 0.5], [0.55, 0.15, 0.12], [0.85, 0.85, 0.8], [0.25, 0.4, 0.25]][(r() * 4) | 0])); b.collide(0, 0, 2.1, 0.75); b.pop(); }
function umbrella(b, x, z, r) { const y = groundH(x, z), c = lin([[0.7, 0.2, 0.15], [0.2, 0.4, 0.65], [0.85, 0.7, 0.2]][(r() * 3) | 0]); b.cyl(M.metal, x, y + 1.2, z, 0.05, 0.05, 2.4, 8, PAINT.galv); b.geo(M.paint, new THREE.ConeGeometry(1.4, 0.6, 10, 1, true), x, y + 2.55, z, 0, r(), 0, 1, c); b.geo(M.paint, new THREE.ConeGeometry(1.4, 0.6, 10, 1, true).scale(1, -1, 1), x, y + 2.549, z, 0, 0, 0, 1, shade(0.4)); b.cyl(M.plank, x, y + 0.6, z, 0.5, 0.5, 0.05, 14, shade(0.75)); b.collide(x, z, 0.1, 0.1); }
function cabin(b, x, z, ry, r) { b.push(x, groundH(x, z), z, ry); const c = lin([[0.2, 0.5, 0.6], [0.8, 0.75, 0.5], [0.5, 0.25, 0.2]][(r() * 3) | 0]); b.box(M.metal, -0.6, 1.0, 0, 0.04, 2.0, 1.2, c); b.box(M.metal, 0.6, 1.0, 0, 0.04, 2.0, 1.2, c); b.box(M.metal, 0, 1.0, -0.6, 1.2, 2.0, 0.04, c); b.box(M.metal, 0, 1.0, 0.62, 0.5, 2.0, 0.04, c); for (const s of [-0.6, 0.6]) b.cyl(M.metal, s, 1.1, -0.6, 0.03, 0.03, 2.2, 6, PAINT.galv); b.collide(0, 0, 0.65, 0.65); b.pop(); }
function lifeguard(b, group, x, z) { const y = groundH(x, z); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(M.plank, x + dx, y + 1.8, z + dz, 0.08, 0.08, 3.6, 8, shade(0.75)); b.box(M.plank, x, y + 3.65, z, 2.6, 0.1, 2.6, shade(0.8)); b.box(M.paint, x, y + 4.4, z - 1.25, 2.6, 1.4, 0.06, lin([0.85, 0.85, 0.82])); b.box(M.slate, x, y + 5.2, z, 3.0, 0.06, 3.0, shade(0.6)); for (const s of [-1, 1]) b.box(M.paint, x + s * 1.3, y + 4.0, z, 0.06, 0.7, 2.6, lin([0.85, 0.85, 0.82]));
  for (let k = 0; k < 9; k++) b.box(M.plank, x, y + 0.2 + k * 0.4, z + 1.6 + k * 0.05, 0.8, 0.05, 0.25, shade(0.7)); signAt(group, signMat('СПАСАТЕЛЬНАЯ СТАНЦИЯ', '#c83a2a', '#fff', 768, 96, 'bold 52px sans-serif'), 2.4, 0.3, x, y + 4.6, z + 1.31, 0); b.collide(x, z, 1.1, 1.1); }
if (BEACH) {
  P.x = 0; P.z = 4; P.yaw = 0.4;
  OUT_BUILD = (cx, cz) => { const K = kit(cx, cz, 0xbeac), { b, r } = K;
    K.block = (x, z, rad) => groundH(x, z) < -0.1;
    for (let i = 0; i < 6; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (z > -8 && z < 22 && K.free(x, z, 1.8)) { K.take(x, z, 1.8); umbrella(b, x, z, r); } }
    for (let i = 0; i < 3; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (z > -8 && z < 16 && K.free(x, z, 2.5)) { K.take(x, z, 2.5); boat(b, x, z, r() * 6.28, r); } }
    for (let i = 0; i < 2; i++) { const x = K.x0 + r() * CS, z = 18 + r() * 8; if (K.free(x, z, 1)) { K.take(x, z, 1); cabin(b, x, z, Math.PI + (r() - 0.5) * 0.4, r); } }
    if (r() < 0.35) { const x = K.x0 + 24, z = 6; if (K.free(x, z, 2)) { K.take(x, z, 2.2); lifeguard(b, K.group, x, z); } }
    if (r() < 0.25 && K.inb(K.x0 + 10, -6)) { const x = K.x0 + 10; for (let k = 0; k < 16; k++) { const z = -6 - k * 1.2; b.box(M.plank, x, 0.15, z, 1.6, 0.06, 1.1, shade(0.6 + r() * 0.3)); if (k % 2 === 0) for (const s of [-0.75, 0.75]) b.cyl(M.plank, x + s, -0.5, z, 0.07, 0.07, 1.4, 6, shade(0.5)); } }
    for (let i = 0; i < 7; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (z > -9 && z < 20 && K.free(x, z, 0.2) && groundH(x, z) > -0.2) { const y = groundH(x, z); if (r() < 0.75) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 1).scale(1.3, 0.45, 1), shellMat); addItem(K.group, m, x, y + 0.01, z, `sh${cx},${cz},${i}`, 'Ракушка'); } else { const m = new THREE.Mesh(trashGeo[7], bottleMat); m.rotation.z = Math.PI / 2; m.position.y = 0.035; addItem(K.group, m, x, y, z, `bt${cx},${cz},${i}`, 'Бутылка', NOTES_BEACH[(r() * NOTES_BEACH.length) | 0]); } } }
    for (let i = 0; i < 4; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (z > 26) K.plant(K.pick(['elm0', 'elm1', 'shrubY0', 'sticks0']), x, z, 0.9 + r() * 0.3); }
    return K.finish(); };
  WORLD_UPDATE = () => { water.position.x = Math.round(P.x / 10) * 10; water.position.z = -9 - 200; if (started && groundH(P.x, P.z) < -0.55 && !goWorld.busy) goWorld('tishina', 'Вода сомкнулась над головой.<br><span style="font-size:15px;color:#999">…и выпустила на другом берегу.</span>'); };
}

// ================= ПИОНЕРЛАГЕРЬ =================
const pioneerMat = std({ color: 0xd8d6cc, roughness: 0.9 });
function pioneer(b, x, z, ry) { const y = groundH(x, z); b.push(x, y, z, ry); b.box(M.conc, 0, 0.6, 0, 1.2, 1.2, 1.2, shade(0.7));
  const W = (geo, px, py, pz, rx = 0, rz = 0) => b.geo(pioneerMat, geo, px, py, pz, rx, 0, rz, 1);
  W(new THREE.CylinderGeometry(0.11, 0.09, 0.85, 8), -0.13, 1.65, 0); W(new THREE.CylinderGeometry(0.11, 0.09, 0.85, 8), 0.13, 1.65, 0);
  W(new THREE.CylinderGeometry(0.24, 0.2, 0.75, 10), 0, 2.45, 0); W(new THREE.SphereGeometry(0.17, 12, 10), 0, 3.0, 0);
  W(new THREE.CylinderGeometry(0.06, 0.05, 0.6, 6), -0.3, 2.45, 0, 0, 0.3); W(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6), 0.22, 2.8, 0.2, -1.3, -0.4);
  W(new THREE.ConeGeometry(0.1, 0.55, 10), 0.18, 2.95, 0.55, Math.PI / 2 + 0.3, 0); b.collide(0, 0, 0.65, 0.65); b.pop(); }
function korpus(b, group, x, z, ry, r, label) { b.push(x, groundH(x, z), z, ry); const W = 14, D = 6, H = 3; const wc = lin([[0.55, 0.62, 0.45], [0.7, 0.62, 0.4], [0.45, 0.55, 0.65]][(r() * 3) | 0]);
  b.box(M.conc, 0, 0.2, 0, W + 0.3, 0.4, D + 0.3, shade(0.6)); b.box(M.plank, 0, 0.4 + H / 2, 0, W, H, D, wc);
  for (const s of [-1, 1]) b.box(M.slate, 0, 0.4 + H + 0.75, s * D / 4, W + 0.8, 0.05, D / 2 * 1.2, shade(0.5), s * 0.5);
  for (let k = 0; k < 5; k++) window_(b, -W / 2 + 1.4 + k * 2.8, 1.9, D / 2, 1.2, 1.2, PAINT.white);
  b.box(M.plank, 0, 1.4, D / 2 + 0.04, 1.0, 2.0, 0.05, shade(0.5)); b.box(M.plank, 0, 0.25, D / 2 + 1.0, 2.4, 0.15, 1.6, shade(0.6));
  const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), signMat(label, '#a82a2a', '#f0e8d0', 512, 100, 'bold 54px sans-serif')); s.applyMatrix4(b.T.clone().multiply(new THREE.Matrix4().makeTranslation(0, 3.0, D / 2 + 0.06))); group.add(s);
  b.collide(0, 0, W / 2 + 0.1, D / 2 + 0.1); b.pop(); }
const BADGE_MAT = std({ color: 0xc8202a, roughness: 0.35, metalness: 0.5, emissive: 0x200000 });
const starGeo = (() => { const s = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 0.018 : 0.042; k ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, 0.01, 0); })();
if (NIGHT) {
  P.x = -48; P.z = 0.5; P.yaw = -Math.PI / 2;
  OUT_BUILD = (cx, cz) => { const K = kit(cx, cz, 0x1a9e), { b, r, group } = K; K.block = (x, z, rad) => Math.abs(z - pathC(x)) < 2.4 + rad;
    // фонари вдоль аллеи
    for (let x = Math.ceil(K.x0 / 28) * 28; x < K.x1; x += 28) { const z = pathC(x) + 2.8; if (K.inb(x, z)) lampPost(b, group, x, z, 0xffa040, r); }
    // ворота лагеря (выход) на x = -60
    if (K.inb(-60, pathC(-60))) { const z = pathC(-60), y = groundH(-60, z); for (const s of [-1, 1]) b.box(M.brick, -60, y + 2, z + s * 2.6, 0.5, 4, 0.5, shade(0.9)); b.pipe(M.metal, new V3(-60, y + 4.0, z - 2.6), new V3(-60, y + 4.6, z), 0.06, PAINT.rust); b.pipe(M.metal, new V3(-60, y + 4.6, z), new V3(-60, y + 4.0, z + 2.6), 0.06, PAINT.rust);
      signAt(group, signMat('ДОБРО ПОЖАЛОВАТЬ', '#c8a020', '#a01818', 768, 110, 'bold 70px sans-serif'), 4.4, 0.6, -60.05, y + 4.0, z, Math.PI / 2);
      INTER.push({ x: -60, z, r: 2.6, group, label: 'E — выйти за ворота', act: () => goWorld('shkola', 'За воротами лагеря — школьный коридор.') }); bulbAnchors.push({ x: -59, y: y + 3.5, z, fy: 0, group, color: 0xffa040, dist: 14, int: 10 }); }
    // линейка с флагштоком и пионером
    if (cx === 0 && cz === 0) { const lx = 20, lz = 16; b.box(M.conc, lx, 0.03, lz, 16, 0.06, 12, shade(0.55)); b.cyl(M.metal, lx, 5, lz + 4, 0.06, 0.04, 10, 8, PAINT.galv); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), std({ color: 0x8a1a1a, roughness: 0.9, side: THREE.DoubleSide })); fl.position.set(lx + 0.8, 9.3, lz + 4); group.add(fl); pioneer(b, lx - 5, lz + 3, Math.PI); K.take(lx, lz, 9); bulbAnchors.push({ x: lx, y: 4, z: lz, fy: 0, group, color: 0xffb060, dist: 18, int: 12 }); }
    // корпуса
    const names = ['ОТРЯД 1', 'ОТРЯД 2', 'ОТРЯД 3', 'ОТРЯД 4', 'СТОЛОВАЯ', 'КЛУБ', 'МЕДПУНКТ', 'ОТРЯД 5'];
    for (let k = 0; k < 2; k++) { const side = k ? -1 : 1, x = K.x0 + 10 + r() * 28, z = pathC(x) + side * (14 + r() * 8); if (K.free(x, z, 8)) { K.take(x, z, 8.5); korpus(b, group, x, z, side > 0 ? Math.PI : 0, r, names[(ihash(cx, cz * 2 + k, 3) * names.length) | 0]); } }
    for (let i = 0; i < 9; i++) K.plant(K.pick(['poplar0', 'poplar1', 'elm0', 'elm1']), K.x0 + r() * CS, K.z0 + r() * CS, 0.9 + r() * 0.3);
    for (let i = 0; i < 5; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (K.free(x, z, 0.3)) { const m = new THREE.Mesh(starGeo, BADGE_MAT); m.rotation.y = r() * 6; addItem(group, m, x, groundH(x, z), z, `bd${cx},${cz},${i}`, 'Значок'); } }
    return K.finish(); };
  // горн из громкоговорителя
  WORLD_UPDATE = (dt) => { lagerT -= dt; if (lagerT < 0 && AC && started) { lagerT = 50 + Math.random() * 40; const notes = [392, 392, 523, 392, 659, 523, 392, 523]; notes.forEach((f, i) => { const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime + i * 0.32; o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'bandpass'; fl.frequency.value = 1200; fl.Q.value = 1.5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.04); g.gain.linearRampToValueAtTime(0, t + 0.3); o.connect(fl).connect(g).connect(master); o.start(t); o.stop(t + 0.32); }); } };
}
let lagerT = 15;

// ================= ПОЛЕ =================
const LEP_Z = -14, LEP_STEP = 70;
function lepTower(b, x, z) { const y = groundH(x, z), H = 22; const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [a, c] of legs) b.pipe(M.metal, new V3(x + a * 2.2, y, z + c * 2.2), new V3(x + a * 0.5, y + H, z + c * 0.5), 0.07, PAINT.galv);
  for (let lv = 0; lv < 6; lv++) { const t0 = lv / 6, t1 = (lv + 1) / 6, w0 = lerp(2.2, 0.5, t0), w1 = lerp(2.2, 0.5, t1); for (let k = 0; k < 4; k++) { const [a, c] = legs[k], [a2, c2] = legs[(k + 1) % 4]; b.pipe(M.metal, new V3(x + a * w0, y + H * t0, z + c * w0), new V3(x + a2 * w1, y + H * t1, z + c2 * w1), 0.03, PAINT.galv); b.pipe(M.metal, new V3(x + a2 * w0, y + H * t0, z + c2 * w0), new V3(x + a * w1, y + H * t1, z + c * w1), 0.03, PAINT.galv); } }
  for (const hy of [H - 4, H - 0.5]) b.box(M.metal, x, y + hy, z, 0.2, 0.2, hy > H - 1 ? 6 : 9, PAINT.galv);
  for (const dz of [-4.2, 0, 4.2]) b.cyl(M.paint, x, y + H - 4.6, z + dz, 0.08, 0.06, 0.9, 8, lin([0.6, 0.75, 0.7])); b.collide(x, z, 2.3, 2.3); }
const BOOTH_EVERY = 350;
function booth(b, group, x, z) { const y = groundH(x, z); b.box(M.prof, x, y + 1.3, z, 2.4, 2.6, 2.0, lin([0.6, 0.62, 0.6])); b.box(M.prof, x, y + 2.65, z, 2.6, 0.08, 2.2, PAINT.galv, 0.05);
  const dg = new THREE.BoxGeometry(0.9, 1.9, 0.04).translate(0.45, 0, 0); b.add(M.metal, dg, new THREE.Matrix4().compose(new V3(x - 0.45, y + 1.05, z + 1.02), new THREE.Quaternion().setFromAxisAngle(UP, -1.9), new V3(1, 1, 1)), lin([0.55, 0.57, 0.55]));
  b.box(M.paint, x, y + 1.05, z + 0.99, 0.9, 1.9, 0.02, lin([0.02, 0.02, 0.02])); signAt(group, signMat('⚡ НЕ ВЛЕЗАЙ — УБЬЁТ', '#f0d020', '#111', 512, 100, 'bold 40px sans-serif'), 0.6, 0.12, x + 0.8, y + 1.8, z + 1.02, 0);
  b.collide(x, z, 1.25, 1.05); INTER.push({ x, z: z + 1.6, r: 1.6, group, label: 'E — зайти в будку', act: () => goWorld('stroyka', 'Внутри будки — лестница вверх.<br><span style="font-size:15px;color:#999">очень высоко вверх</span>') });
  bulbAnchors.push({ x, y: y + 2, z: z + 1.4, fy: 0, group, color: 0xc0d8ff, dist: 6, int: 2 }); }
const flowerMat = std({ color: 0x3a5ad8, roughness: 0.6, emissive: 0x0a1030 });
if (FIELD) {
  P.x = 0; P.z = 0; P.yaw = -Math.PI / 2;
  OUT_BUILD = (cx, cz) => { const K = kit(cx, cz, 0xf1e1), { b, r, group } = K;
    if (K.inb(K.x0, LEP_Z) || (LEP_Z >= K.z0 && LEP_Z < K.z1)) { for (let x = Math.ceil(K.x0 / LEP_STEP) * LEP_STEP; x < K.x1; x += LEP_STEP) { lepTower(b, x, LEP_Z); const y0 = groundH(x, LEP_Z), y1 = groundH(x + LEP_STEP, LEP_Z); for (const [dz, h] of [[-4.2, 17.4], [0, 17.4], [4.2, 17.4], [0, 22]]) wire(b, x, x + LEP_STEP, y0 + h - 0.45, y1 + h - 0.45, LEP_Z + dz, LEP_Z + dz, 2.2); } }
    for (let x = Math.ceil(K.x0 / BOOTH_EVERY) * BOOTH_EVERY + 20; x < K.x1; x += BOOTH_EVERY) if (K.inb(x, LEP_Z + 7)) booth(b, group, x, LEP_Z + 7);
    if (r() < 0.25) K.plant(K.pick(['elm0', 'elm1', 'shrubY0']), K.x0 + r() * CS, K.z0 + r() * CS, 1.0 + r() * 0.3);
    for (let i = 0; i < 4; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (Math.abs(z - LEP_Z) > 4) { const m = new THREE.Group(); for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), flowerMat); f.position.set((k - 1) * 0.05, 0.9 + k * 0.06, (k % 2) * 0.04); m.add(f); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.9).translate(0, 0.45, 0), std({ color: 0x4a6a2a })); st.position.x = (k - 1) * 0.05; m.add(st); } addItem(group, m, x, groundH(x, z), z, `vs${cx},${cz},${i}`, 'Василёк'); } }
    return K.finish(); };
  // гул ЛЭП
  let hum = null; WORLD_UPDATE = () => { if (AC && !hum) { hum = AC.createGain(); hum.gain.value = 0; for (const [f, v] of [[100, 0.5], [150, 0.25], [200, 0.2], [300, 0.08]]) { const o = AC.createOscillator(); o.frequency.value = f; const g = AC.createGain(); g.gain.value = v; o.connect(g).connect(hum); o.start(); } hum.connect(master); } if (hum) hum.gain.value = 0.05 * Math.exp(-Math.abs(P.z - LEP_Z) / 18); };
}

// ================= АНОМАЛЬНАЯ ЗИМА =================
const footTex = texFrom(mkCanvas(64, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(70,40,70,0.55)'; g.beginPath(); g.ellipse(32, 42, 18, 30, 0, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(32, 100, 14, 18, 0, 0, 6.28); g.fill(); }));
const footMat = new THREE.MeshStandardMaterial({ map: footTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 });
const footGeo = new THREE.PlaneGeometry(0.16, 0.32).rotateX(-Math.PI / 2);
const mittenMats = [0xc82a2a, 0x2a4ac8, 0xe8e0d0, 0x2a8a4a].map((c) => std({ color: c, roughness: 1 }));
function strangerPath(t) { const kp = KEY_POS.zima; return [lerp(2, kp[0], t) + Math.sin(t * 17) * 6, lerp(3, kp[2], t) + Math.sin(t * 11 + 1) * 9]; }
function railFence(b, x0, x1, z) { for (let x = Math.ceil(x0 / 2.2) * 2.2; x < x1; x += 2.2) { const y = groundH(x, z); b.box(M.plank, x, y + 0.5, z, 0.1, 1.0, 0.1, shade(0.45)); b.box(M.plank, x + 1.1, y + 0.95, z, 2.2, 0.08, 0.06, shade(0.5)); b.box(M.plank, x + 1.1, y + 1.0, z, 2.2, 0.03, 0.08, shade(1.6, [1, 0.95, 1])); b.box(M.plank, x + 1.1, y + 0.55, z, 2.2, 0.06, 0.05, shade(0.5)); } b.cols.push({ x: (x0 + x1) / 2, z, hx: (x1 - x0) / 2, hz: 0.15, c: 1, s: 0 }); }
if (ZIMA) {
  KEY_POS.zima = [148, 0, -46];
  P.x = 0; P.z = 1.5; P.yaw = -Math.PI / 2 - 0.15;
  M.slate.color.setHex(0xf0eef4); M.glass.emissive.setHex(0xffa050); M.glass.emissiveIntensity = 0.9; M.lattice.color.setHex(0x6a6a6a);
  OUT_BUILD = (cx, cz) => { const K = kit(cx, cz, 0x5e0e), { b, r, group } = K; K.block = (x, z, rad) => Math.abs(z - pathC(x)) < 2.4 + rad;
    if (pathC(K.x0) + 2.4 >= K.z0 && pathC(K.x0) + 2.4 < K.z1) railFence(b, K.x0, K.x1, 2.6);
    for (let x = Math.ceil(K.x0 / 26) * 26; x < K.x1; x += 26) { const z = -2.8; if (K.inb(x, z)) lampPost(b, group, x, z, 0xff9a40, r); }
    for (let k = 0; k < 2; k++) { const x = K.x0 + 8 + k * 24 + r() * 8, z = k ? 16 + r() * 8 : -16 - r() * 10; if (K.free(x, z, 7) && K.inb(x, z)) { K.take(x, z, 7.5); house(b, r, x, z, z > 0 ? Math.PI : 0); } }
    for (let i = 0; i < 6; i++) K.plant(K.pick(['elm1', 'elm1', 'sticks0', 'sticks1']), K.x0 + r() * CS, K.z0 + r() * CS, 0.9 + r() * 0.4);
    if (K.inb(K.x0, -70) || (-70 >= K.z0 && -70 < K.z1)) for (let x = Math.ceil(K.x0 / 80) * 80; x < K.x1; x += 80) { const bm = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.2), new THREE.MeshStandardMaterial({ color: 0x20f0e0, emissive: 0x20e8e0, emissiveIntensity: 3 })); bm.position.set(x, 7, -70); group.add(bm); b.cyl(M.metal, x, 3, -70, 0.15, 0.15, 6, 8, PAINT.dark); }
    // чужие следы к ключу
    for (let t = 0; t <= 1; t += 1 / 420) { const [fx, fz] = strangerPath(t); if (!K.inb(fx, fz)) continue; const [nx, nz] = strangerPath(t + 0.002); const a = Math.atan2(nx - fx, nz - fz), side = ((t * 420) | 0) % 2 ? 1 : -1; b.add(footMat, footGeo, new THREE.Matrix4().compose(new V3(fx + Math.cos(a) * 0.12 * side, groundH(fx, fz) + 0.02, fz - Math.sin(a) * 0.12 * side), new THREE.Quaternion().setFromAxisAngle(UP, a), new V3(1, 1, 1))); }
    for (let i = 0; i < 4; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (K.free(x, z, 0.3) && r() < 0.6) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.08, 4, 8).rotateZ(Math.PI / 2).translate(0, 0.04, 0), mittenMats[(r() * 4) | 0]); m.rotation.y = r() * 6; addItem(group, m, x, groundH(x, z), z, `mt${cx},${cz},${i}`, 'Варежка'); } }
    return K.finish(); };
  // снегопад
  const N = MOBILE ? 2500 : 7000, sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { sp[i * 3] = (Math.random() - 0.5) * 40; sp[i * 3 + 1] = Math.random() * 16; sp[i * 3 + 2] = (Math.random() - 0.5) * 40; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const flake = texFrom(mkCanvas(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.07, map: flake, transparent: true, depthWrite: false, color: 0xffe8f4 })); snow.frustumCulled = false; scene.add(snow);
  // свои следы
  const myFeet = []; let lastFoot = null, footSide = 1;
  WORLD_UPDATE = (dt) => { const p = sg.attributes.position; for (let i = 0; i < N; i++) { let y = p.getY(i) - dt * (1.6 + (i % 7) * 0.15), x = p.getX(i) + dt * (1.2 + Math.sin(clock * 0.5 + i) * 0.6); if (y < 0) { y += 16; } if (x > 20) x -= 40; p.setXY(i, x, y); } p.needsUpdate = true; snow.position.set(Math.floor(P.x / 40) * 40 + ((P.x % 40) + 40) % 40 * 0, 0, 0); snow.position.set(P.x, groundH(P.x, P.z), P.z);
    if (P.ground && P.speed > 0.4 && (!lastFoot || Math.hypot(P.x - lastFoot[0], P.z - lastFoot[1]) > 0.7)) { lastFoot = [P.x, P.z]; footSide = -footSide; const a = Math.atan2(P.dx || 0, P.dz || 1); const m = myFeet.length > 300 ? myFeet.shift() : new THREE.Mesh(footGeo, footMat); m.position.set(P.x + Math.cos(a) * 0.12 * footSide, groundH(P.x, P.z) + 0.02, P.z - Math.sin(a) * 0.12 * footSide); m.rotation.y = a; if (!m.parent) scene.add(m); myFeet.push(m); } };
}
