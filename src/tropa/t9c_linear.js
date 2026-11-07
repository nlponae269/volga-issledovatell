// ===================== Метро и Электричка =====================
const TRAIN_FLOOR = 1.25;
// ---------------- МЕТРО ----------------
const ST_NAMES = ['ТИШИНСКАЯ', 'ПРОСНУВШАЯСЯ', 'ВОРОТНАЯ', 'ТУМАННАЯ', 'ПОДЪЕЗДНАЯ', 'ТРОПАРЁВО-ДАЛЬНЕЕ', 'УЛИЦА БЕЗ КОНЦА', 'СЕДЬМАЯ УТРА'];
const ST_NAME = ST_NAMES[(Math.random() * ST_NAMES.length) | 0];
TX.marble = texFrom(mkCanvas(512, 512, (g, w, h) => { const r = rng(101); g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${120 + r() * 40 | 0},${110 + r() * 30 | 0},${100 + r() * 30 | 0},${0.2 + r() * 0.3})`; g.lineWidth = 0.6 + r() * 2; let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (r() - 0.4) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = 'rgba(80,70,60,0.35)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }));
TX.granite = texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(103); g.fillStyle = '#5a4a46'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(20,15,15,0.6)' : v < 0.8 ? 'rgba(140,120,110,0.5)' : 'rgba(200,190,180,0.6)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } g.strokeStyle = 'rgba(0,0,0,0.5)'; g.strokeRect(0, 0, w, h); }));
const MM = { marble: rep(envMat({ map: TX.marble, roughness: 0.25 }, 0.6), 2, 2), granite: rep(envMat({ map: TX.granite, roughness: 0.2 }, 0.6), 1.5, 1.5), dark: std({ color: 0x1a1816, roughness: 0.9 }), rail: envMat({ color: 0x8a8a88, metalness: 1, roughness: 0.3 }, 0.8),
  gold: envMat({ color: 0xc8a050, metalness: 1, roughness: 0.3, emissive: 0x1a1000 }, 1), lamp: new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffd8a0, emissiveIntensity: 3 }) };
const SEG = 14, PLAT = 5, TRK = 7.2;
function metroMap(k) { return new THREE.MeshStandardMaterial({ roughness: 0.6, map: texFrom(mkCanvas(512, 320, (g, w, h) => { const r = rng(k * 37 + (Date.now() & 1023)); g.fillStyle = '#efeadc'; g.fillRect(0, 0, w, h); g.font = 'bold 22px sans-serif'; g.fillStyle = '#222'; g.fillText('СХЕМА ЛИНИЙ', 20, 30);
  const cols = ['#d8282a', '#2a8a3a', '#2a5ac8', '#8a4a2a', '#e88a20', '#8a2a8a']; for (let L = 0; L < 5; L++) { g.strokeStyle = cols[L]; g.lineWidth = 7; g.beginPath(); let x = 30 + r() * 60, y = 60 + r() * 220; g.moveTo(x, y); for (let k2 = 0; k2 < 6; k2++) { x += 50 + r() * 40; y += (r() - 0.5) * 120; y = Math.max(50, Math.min(h - 20, y)); g.lineTo(x, y); g.fillStyle = '#fff'; g.fillRect(x - 4, y - 4, 8, 8); if (r() < 0.4) { g.fillStyle = '#333'; g.font = '11px sans-serif'; g.fillText(ST_NAMES[(r() * ST_NAMES.length) | 0].toLowerCase(), x + 6, y - 6); } } g.stroke(); }
  g.fillStyle = '#c82020'; g.beginPath(); g.arc(w / 2, h / 2, 9, 0, 6.28); g.fill(); g.fillStyle = '#222'; g.font = 'bold 14px sans-serif'; g.fillText('вы здесь?', w / 2 + 12, h / 2 + 5); })) }); }
const stNameMat = signMat(ST_NAME, '#2a2622', '#e8c870', 1024, 128, 'bold 80px serif');
const metroSegs = new Map();
function metroSeg(n) {
  const group = new THREE.Group(), b = new Batch(), r = rng(n * 131 + 7), x0 = n * SEG, xm = x0 + SEG / 2;
  b.box(MM.granite, xm, -0.1, 0, SEG, 0.2, PLAT * 2);
  for (const s of [-1, 1]) { b.box(M.paint, xm, 0.005, s * (PLAT - 0.25), SEG, 0.01, 0.12, lin([0.85, 0.7, 0.1])); b.box(MM.marble, xm, -0.65, s * PLAT, SEG, 1.3, 0.1);
    b.box(MM.dark, xm, -1.35, s * TRK, SEG, 0.1, 4.4); for (const rz of [-0.75, 0.75]) b.box(MM.rail, xm, -1.2, s * TRK + rz, SEG, 0.12, 0.08); for (let k = 0; k < SEG; k += 0.7) b.box(MM.dark, x0 + k, -1.27, s * TRK, 0.25, 0.06, 2.4);
    b.box(MM.marble, xm, 2.0, s * (TRK + 2.4), SEG, 6.8, 0.2); }
  b.box(MM.marble, xm, 5.6, 0, SEG, 0.3, (TRK + 2.5) * 2); for (const s of [-1, 1]) b.box(MM.marble, xm, 5.2, s * 5.4, SEG, 0.6, 1.2);
  // колонны с золотыми капителями
  for (const cx of [x0 + 3.5, x0 + 10.5]) for (const s of [-1, 1]) { const z = s * 2.9; b.box(MM.marble, cx, 2.2, z, 0.9, 4.4, 0.9); b.box(MM.gold, cx, 4.5, z, 1.15, 0.25, 1.15); b.box(MM.marble, cx, 4.9, z, 1.3, 0.6, 1.3); b.cols.push({ x: cx, z, hx: 0.5, hz: 0.5, c: 1, s: 0 }); }
  // скамейки
  for (const s of [-1, 1]) { const bx = x0 + 7; b.box(M.plank, bx, 0.45, s * 2.9, 2.6, 0.08, 0.5, shade(0.7)); b.box(MM.marble, bx - 1.1, 0.22, s * 2.9, 0.3, 0.44, 0.5); b.box(MM.marble, bx + 1.1, 0.22, s * 2.9, 0.3, 0.44, 0.5); b.cols.push({ x: bx, z: s * 2.9, hx: 1.35, hz: 0.3, c: 1, s: 0 }); }
  // люстра
  { const lx = x0 + 7; b.cyl(MM.gold, lx, 4.7, 0, 0.03, 0.03, 1.6, 6); b.cyl(MM.gold, lx, 3.9, 0, 0.7, 0.5, 0.12, 12); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; b.geo(MM.lamp, new THREE.SphereGeometry(0.09, 8, 6), lx + Math.cos(a) * 0.65, 4.05, Math.sin(a) * 0.65, 0, 0, 0, 1); } if (r() < 0.85) bulbAnchors.push({ x: lx, y: 3.7, z: 0, fy: 0, group, color: 0xffd8a8, dist: 14, int: 8 }); }
  // название станции и схема линий на путевых стенах
  if (n % 2 === 0) for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.75), stNameMat); m.position.set(xm, 2.6, s * (TRK + 2.28)); m.rotation.y = s > 0 ? Math.PI : 0; group.add(m); }
  else for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), metroMap(n * 2 + s)); m.position.set(xm, 2.2, s * (TRK + 2.28)); m.rotation.y = s > 0 ? Math.PI : 0; group.add(m); }
  b.cols.push({ x: xm, z: PLAT + 0.15, hx: SEG / 2, hz: 0.1, c: 1, s: 0 }, { x: xm, z: -PLAT - 0.15, hx: SEG / 2, hz: 0.1, c: 1, s: 0 });
  for (let k = 0; k < 2; k++) if (r() < 0.4) { const x = x0 + r() * SEG, z = (r() - 0.5) * 7; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.004, 14).translate(0, 0.003, 0), envMat({ color: 0xc8b070, metalness: 1, roughness: 0.3 }, 0.9)); addItem(group, m, x, 0, z, `zh${n},${k}`, 'Жетон'); }
  const kp = KEY_POS.metro; if (kp && kp[0] >= x0 && kp[0] < x0 + SEG) placeKey(group, kp[0], 0, kp[2]);
  b.build(group); scene.add(group); return { group, cols: b.cols };
}
function metroUpdate() { const cur = Math.floor(P.x / SEG); for (let n = cur - 5; n <= cur + 5; n++) if (!metroSegs.has(n)) { const s = metroSeg(n); metroSegs.set(n, s); colliders.set('m' + n, s.cols); }
  for (const [n, s] of metroSegs) if (Math.abs(n - cur) > 7) { scene.remove(s.group); s.group.traverse((o) => { if (o.geometry && o.geometry !== keyGeo) o.geometry.dispose(); }); for (let i = coinsLive.length - 1; i >= 0; i--) if (coinsLive[i].group === s.group) coinsLive.splice(i, 1); metroSegs.delete(n); colliders.delete('m' + n); } }
// поезд метро
function makeMetroTrain() { const g = new THREE.Group(), blue = envMat({ color: 0x2a4a8a, roughness: 0.4, metalness: 0.3 }, 0.6), gray = envMat({ color: 0xb8bcc0, roughness: 0.4, metalness: 0.3 }, 0.6), doors = [];
  for (let c = 0; c < 6; c++) { const cx = c * 19.6; const lo = new THREE.Mesh(new THREE.BoxGeometry(19, 1.3, 2.7), blue); lo.position.set(cx, 0.65, 0); const hi = new THREE.Mesh(new THREE.BoxGeometry(19, 1.4, 2.7), gray); hi.position.set(cx, 2.0, 0); const wn = new THREE.Mesh(new THREE.BoxGeometry(17, 0.7, 2.72), M.glass); wn.position.set(cx, 2.1, 0); g.add(lo, hi, wn);
    for (let d = 0; d < 4; d++) { const dx = cx - 7 + d * 4.6; const dr = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.0, 2.74), gray); dr.position.set(dx, 1.4, 0); g.add(dr); doors.push({ m: dr, lx: dx }); }
    const inner = new THREE.Mesh(new THREE.BoxGeometry(18.8, 2.5, 2.6), new THREE.MeshStandardMaterial({ color: 0x8a8070, emissive: 0x3a3428, side: THREE.BackSide })); inner.position.set(cx, 1.45, 0); g.add(inner); }
  const hl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 1.4), lightMat); hl.position.set(-9.55, 1.0, 0); g.add(hl); g.traverse((o) => { o.castShadow = Q.shadows; }); g.visible = false; scene.add(g); return { g, doors }; }
const MTR = METRO ? Object.assign(makeMetroTrain(), { st: 'wait', t: 12, side: 1, x: 0, stopX: 0 }) : null;
const metroInter = { x: 0, z: 0, r: 1.6, label: 'E — войти в поезд', on: () => MTR && MTR.st === 'open' && MTR.doors.some((d) => Math.abs(MTR.x + d.lx - P.x) < 1.0) && Math.abs(Math.abs(P.z) - PLAT) < 1.5 && Math.sign(P.z) === MTR.side, act: () => goWorld(randomWorld(), 'Осторожно, двери закрываются.<br><span style="font-size:15px;color:#999">Следующая станция — неизвестно</span>') };
function metroTrainUpdate(dt) { const m = MTR; m.t -= dt;
  if (m.st === 'wait' && m.t < 0) { m.side = -m.side; m.stopX = P.x + 30; m.x = m.stopX - 400 * m.side; m.st = 'come'; m.g.visible = true; m.g.rotation.y = m.side > 0 ? 0 : Math.PI; if (AC) burst(4, 'lowpass', 200, 0.5, 0.5); }
  if (m.st === 'come') { const d = (m.stopX - m.x) * m.side; m.x += m.side * Math.min(22, Math.max(0.4, d * 0.4)) * dt; if (d < 0.15) { m.st = 'open'; m.t = 16; for (const d2 of m.doors) d2.m.visible = false; blip([880], 0.25, 'sine', 0.05); } }
  if (m.st === 'open' && m.t < 0) { m.st = 'go'; blip([660, 520], 0.5, 'sine', 0.06); for (const d2 of m.doors) d2.m.visible = true; }
  if (m.st === 'go') { m.x += m.side * 18 * dt * Math.min(1, (16 - m.t) / 3); if (Math.abs(m.x - m.stopX) > 400) { m.st = 'wait'; m.t = 20 + Math.random() * 20; m.g.visible = false; } }
  m.g.position.set(m.x, -0.75, m.side * TRK); metroInter.x = P.x; metroInter.z = P.z; }
if (METRO) { KEY_POS.metro = [196, 0, -2]; P.x = 7; P.z = 0; P.yaw = -Math.PI / 2; INTER.push(metroInter); WORLD_UPDATE = metroTrainUpdate; ground.visible = false; grass.mesh.visible = false; }

// ---------------- ЭЛЕКТРИЧКА ----------------
const CARL = 20.5, TRW = 1.5;
const TR = TRAIN ? { x: -40, v: 16, st: 'run', t: 45, station: null, next: null } : null;
const trainCars = new Map(), trainInters = [];
const STATIONS = WORLD_LIST.filter((w) => w !== 'elektrichka');
function pickStation() { return STATIONS[(Math.random() * STATIONS.length) | 0]; }
const trainGlass = std({ color: 0xc8d4d0, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false });
const seatWood = rep(std({ map: TX.plank, color: 0xc89a6a, roughness: 0.6 }), 0.6, 1.2), carWall = std({ color: 0x9aa890, roughness: 0.6 }), carFloor = rep(std({ map: TX.lino2, roughness: 0.5 }), 1.2, 1.2);
function trainCar(k) { const g = new THREE.Group(), b = new Batch(), r = rng(k * 71 + 5), F = TRAIN_FLOOR, L = CARL - 0.5;
  b.box(carFloor, L / 2, F - 0.05, 0, L, 0.1, TRW * 2);
  b.box(std({ color: 0x3a6a3a, roughness: 0.5 }), L / 2, F - 0.65, 0, L, 1.1, TRW * 2 + 0.2);
  for (const s of [-1, 1]) { b.box(carWall, L / 2, F + 0.45, s * TRW, L, 0.9, 0.06); b.box(carWall, L / 2, F + 2.25, s * TRW, L, 0.5, 0.06); for (let w = 0; w < 8; w++) { b.box(carWall, 2.4 + w * 2.0, F + 1.45, s * TRW, 0.3, 1.1, 0.06); b.box(trainGlass, 2.55 + w * 2.0 + 0.85, F + 1.45, s * TRW, 1.7, 1.1, 0.02); }
    b.box(carWall, 0.8, F + 1.2, s * TRW, 1.6, 2.4, 0.06); }
  b.box(std({ color: 0xd8d4c8, roughness: 0.8 }), L / 2, F + 2.55, 0, L, 0.1, TRW * 2);
  for (const ex of [0, L]) { b.box(carWall, ex, F + 1.25, -1.0, 0.08, 2.5, 1.0); b.box(carWall, ex, F + 1.25, 1.0, 0.08, 2.5, 1.0); b.box(carWall, ex, F + 2.3, 0, 0.08, 0.4, 1.0); }
  for (let w = 0; w < 8; w++) { const sx = 2.6 + w * 2.0; for (const s of [-1, 1]) { b.box(seatWood, sx + 0.35, F + 0.45, s * 0.95, 0.5, 0.06, 1.0); b.box(seatWood, sx + 0.05, F + 0.85, s * 0.95, 0.06, 0.8, 1.0); b.box(M.metal, sx + 0.35, F + 0.22, s * 0.95, 0.4, 0.44, 0.05, PAINT.dark); b.box(M.metal, sx + 0.9, F + 2.0, s * 1.1, 1.8, 0.03, 0.5, PAINT.galv); } }
  for (let w = 0; w < 4; w++) b.box(new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffeed0, emissiveIntensity: 2 }), 3 + w * 5, F + 2.48, 0, 1.4, 0.04, 0.3);
  b.build(g);
  const cols = []; for (let w = 0; w < 8; w++) for (const s of [-1, 1]) cols.push({ lx: 2.6 + w * 2.0 + 0.3, z: s * 0.95, hx: 0.38, hz: 0.52 });
  if (k === 7 && !keysGot().includes('elektrichka')) { const kx = 9.5; const km = new THREE.Group(); const m = new THREE.Mesh(keyGeo, keyMat); km.add(m); km.position.set(kx, F + 0.5, -0.9); g.add(km); coinsLive.push({ id: 'KEY', obj: km, type: 20, x: 0, z: -0.9, fy: F + 0.5, group: g, lx: kx }); keyObj = { obj: km, x: 0, y: F, z: -0.9, lx: kx }; }
  scene.add(g); return { g, cols }; }
function trainUpdate(dt) { const T = TR; T.t -= dt;
  if (T.st === 'run') { T.v = Math.min(16, T.v + dt * 1.5); if (T.t < 0) { T.st = 'brake'; T.next = pickStation(); const e = $('f_station'); if (e) e.textContent = WORLD_NAMES[T.next]; blip([784, 659, 523], 0.5, 'sine', 0.05); toast(`Следующая станция — <b>${WORLD_NAMES[T.next]}</b>`); T.brakeX = T.x + 90; } }
  if (T.st === 'brake') { const d = T.brakeX - T.x; T.v = Math.max(0, Math.min(T.v, Math.sqrt(Math.max(0, d) * 2 * 1.4))); if (T.v < 0.05) { T.v = 0; T.st = 'stop'; T.t = 18; buildPlatform(T.next); burst(0.8, 'lowpass', 500, 0.5, 0.4); } }
  if (T.st === 'stop' && T.t < 0) { T.st = 'run'; T.t = 50 + Math.random() * 25; const e = $('f_station'); if (e) e.textContent = '—'; burst(0.8, 'lowpass', 500, 0.5, 0.3); }
  const dx = T.v * dt; T.x += dx; if (started && !goWorld.busy) P.x += dx;
  // вагоны вокруг игрока
  const kp = Math.floor((P.x - T.x) / CARL); for (let k = kp - 3; k <= kp + 3; k++) if (!trainCars.has(k)) trainCars.set(k, trainCar(k));
  const cols = []; for (const [k, c] of trainCars) { if (Math.abs(k - kp) > 4) { scene.remove(c.g); trainCars.delete(k); continue; } c.g.position.x = T.x + k * CARL; for (const q of c.cols) cols.push({ x: c.g.position.x + q.lx, z: q.z, hx: q.hx, hz: q.hz, c: 1, s: 0 }); }
  colliders.set('train', cols);
  for (const c of coinsLive) if (c.lx !== undefined && c.group.parent) c.x = c.group.position.x + c.lx;
  if (keyObj && keyObj.lx !== undefined && keyObj.obj.parent) keyObj.x = keyObj.obj.parent.position.x + keyObj.lx;
  // стук колёс
  T.acc = (T.acc || 0) + dx; if (T.acc > 25) { T.acc = 0; if (AC && T.v > 2) { burst(0.07, 'lowpass', 300, 1, 0.25 * T.v / 16); setTimeout(() => burst(0.07, 'lowpass', 280, 1, 0.22 * T.v / 16), 140); } }
  if (humG) { humG.gain.value = 0.05 + T.v * 0.012; humF.frequency.value = 120 + T.v * 18; }
}
function buildPlatform(world) { const group = new THREE.Group(), b = new Batch(), x0 = TR.x - 20, L = 9 * CARL;
  b.box(M.conc, x0 + L / 2, 0.55, 3.6, L, 1.1, 3.4, shade(0.8)); b.box(M.paint, x0 + L / 2, 1.11, 2.05, L, 0.01, 0.18, lin([0.9, 0.85, 0.2]));
  for (let x = x0; x < x0 + L; x += 30) { b.cyl(M.metal, x, 2.6, 4.8, 0.05, 0.05, 3, 8, PAINT.galv); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.45), signMat(WORLD_NAMES[world].toUpperCase(), '#f0f0f0', '#1a3a8a', 512, 90, 'bold 56px sans-serif')); m.position.set(x, 3.6, 4.79); m.rotation.y = Math.PI; group.add(m); }
  b.box(M.slate, x0 + L / 2, 3.3, 4.6, 40, 0.06, 2.2, shade(0.7)); b.build(group); scene.add(group);
  trainInters.forEach((it) => (it.dead = true)); for (let k = -3; k <= 3; k++) { const it = { x: 0, z: TRW - 0.3, y: TRAIN_FLOOR, r: 1.3, k, label: `E — выйти: ${WORLD_NAMES[world]}`, on: () => TR.st === 'stop' && !it.dead, act: () => goWorld(world, `Станция «${WORLD_NAMES[world]}».`) }; trainInters.push(it); INTER.push(it); } }
if (TRAIN) { P.x = 6; P.z = 0; P.y = TRAIN_FLOOR; P.yaw = -Math.PI / 2;
  WORLD_UPDATE = (dt) => { trainUpdate(dt); for (const it of trainInters) { const kp = Math.floor((P.x - TR.x) / CARL) + it.k; it.x = TR.x + kp * CARL + 0.8; } };
  // двери выхода — в тамбурах; ограничение по ширине вагона
  const _c = collide; collide = function (nx, nz) { [nx, nz] = _c(nx, nz); return [nx, clamp(nz, -TRW + 0.3, TRW - 0.3)]; }; }
