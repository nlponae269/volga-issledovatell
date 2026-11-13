// ===================== «ПОДЪЕЗД»: бесконечная лестница =====================
const FH = 2.8, PW = 2.7, PL = 2.7, WELL0 = 1.28, WELL1 = 1.42, MIDD = 1.5, LAND = 2.0, LX0 = -1.6, LX1 = 4.3;
const EX0 = 2.95, EX1 = 4.15, EXC = (EX0 + EX1) / 2, EZ1 = -LAND - 1.45;   // лифт в торце площадки
let podBase = 0;
const HOMEPOD = PODEZD && (() => { try { const v = sessionStorage.getItem('pod_home') === '1'; sessionStorage.removeItem('pod_home'); return v; } catch (e) { return false; } })();                                                               // «настоящий» номер этажа = podBase + n + 1
const PLAF_GEO = new THREE.CylinderGeometry(0.2, 0.25, 0.08, 16);
// высота поверхности в пределах этажного модуля (0..FH)
function podLocal(x, z) {
  if (z < 0) return 0; if (z > PL) return FH / 2;
  return x < (WELL0 + WELL1) / 2 ? (z / PL) * FH / 2 : FH / 2 + (1 - z / PL) * FH / 2;
}
function podSurface(x, z, y) { const s = podLocal(x, z); const n = Math.floor((y + 0.45 - s) / FH); return n * FH + s; }
// --- текстуры ---
const PAINTS = [['#4f8c9c', '#3a6f80'], ['#3f6a52', '#2d5040'], ['#3d5f7e', '#2b4660'], ['#6e5a3c', '#54432c'], ['#5d6b3a', '#47522c'], ['#7a3f36', '#5c2f29']];
const SCRIBBLES = ['Цой жив', 'ЛЁХА', 'Здесь был Вася', 'Спартак', '♥', 'КИНО', 'не курить!!!', '2007', 'Катя + Дима', 'АУ', 'выхода нет', '13'];
function podWallTex(k) {
  const [c1, c2] = PAINTS[k % PAINTS.length], r = rng(k * 17 + 3);
  return texFrom(mkCanvas(512, 512, (g, w, h) => {
    // верх — побелка, низ (до 1.55 м из 2.8) — масляная краска
    const split = h * (1 - 1.55 / 2.8);
    g.fillStyle = '#d9d7cd'; g.fillRect(0, 0, w, split);
    const gr = g.createLinearGradient(0, split, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, split, w, h - split);
    g.fillStyle = 'rgba(30,25,20,0.55)'; g.fillRect(0, split - 2, w, 4); // полоса-бордюр
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.06})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 60; const q = g.createRadialGradient(x, y, 0, x, y, s); q.addColorStop(0, `rgba(${r() < 0.5 ? '40,35,25' : '120,110,90'},${0.08 + r() * 0.12})`); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - s, y - s, s * 2, s * 2); }
    for (let i = 0; i < 3; i++) { const x = r() * w, y = split + r() * (h - split - 30), s = 5 + r() * 14; g.fillStyle = 'rgba(150,145,128,0.85)'; g.beginPath(); for (let a = 0; a < 6.28; a += 0.5) g.lineTo(x + Math.cos(a) * s * (0.6 + r() * 0.5), y + Math.sin(a) * s * (0.6 + r() * 0.5)); g.fill(); } // облупленная краска
    for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(40,35,30,0.5)'; g.lineWidth = 1; let x = r() * w, y = r() * split; g.beginPath(); g.moveTo(x, y); for (let k2 = 0; k2 < 8; k2++) { x += (r() - 0.5) * 30; y += 10 + r() * 20; g.lineTo(x, y); } g.stroke(); } // трещины
    for (let i = 0; i < 3; i++) { g.save(); g.translate(30 + r() * (w - 160), split + 30 + r() * (h - split - 70)); g.rotate((r() - 0.5) * 0.4); g.fillStyle = ['rgba(20,20,20,0.75)', 'rgba(140,20,20,0.7)', 'rgba(20,30,90,0.7)'][(r() * 3) | 0]; g.font = `${16 + (r() * 18 | 0)}px ${r() < 0.5 ? 'serif' : 'sans-serif'}`; g.fillText(SCRIBBLES[(r() * SCRIBBLES.length) | 0], 0, 0); g.restore(); }
    g.fillStyle = 'rgba(40,30,20,0.35)'; for (let i = 0; i < 40; i++) g.fillRect(r() * w, split + r() * (h - split), 1.5, 1.5);
  }));
}
TX.tile = texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(61), n = 16, s = w / n; g.fillStyle = '#7a756a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = ((x + y) % 2) ? ['#b9b2a0', '#aea793', '#c2bba8'][(r() * 3) | 0] : ['#d8d0bc', '#cfc7b2', '#e0d9c6'][(r() * 3) | 0]; g.fillStyle = r() < 0.04 ? '#5a5048' : c; g.fillRect(x * s + 0.8, y * s + 0.8, s - 1.6, s - 1.6); } }));
TX.leather = texFrom(mkCanvas(256, 512, (g, w, h) => { const r = rng(71), base = ['#4a2a22', '#3a2a2a', '#5a3a2a', '#2a2a30'][(r() * 4) | 0]; g.fillStyle = base; g.fillRect(0, 0, w, h);
  const st = 64; for (let y = -st; y < h + st; y += st) for (let x = -st; x < w + st; x += st) { const ox = (y / st) % 2 ? st / 2 : 0; g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(x + ox, y - st / 2); g.lineTo(x + ox + st / 2, y); g.lineTo(x + ox, y + st / 2); g.lineTo(x + ox - st / 2, y); g.fill(); g.fillStyle = '#c8a860'; g.beginPath(); g.arc(x + ox, y - st / 2, 3.5, 0, 6.28); g.fill(); }
  g.strokeStyle = 'rgba(200,170,100,0.7)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(r() * w, r() * h, 2 + r() * 20, 1 + r() * 4); } }));
const podRough = texFrom(mkCanvas(512, 512, (g, w, h) => { const r = rng(91), split = h * (1 - 1.55 / 2.8); g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, split); g.fillStyle = '#4c4c4c'; g.fillRect(0, split, w, h - split);
  for (let i = 0; i < 60; i++) { const x = r() * w, y = split + r() * (h - split), s2 = 8 + r() * 40; const q = g.createRadialGradient(x, y, 0, x, y, s2); q.addColorStop(0, `rgba(${r() < 0.6 ? '150,150,150' : '40,40,40'},0.5)`); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - s2, y - s2, s2 * 2, s2 * 2); } }), false);
const podBump = texFrom(normalFromHeight(mkCanvas(512, 512, (g, w, h) => { const r = rng(93), split = h * (1 - 1.55 / 2.8); g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.fillStyle = '#8c8c8c'; g.fillRect(0, split, w, h - split);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.06})`; const s2 = 2 + r() * 14; g.beginPath(); g.arc(r() * w, r() * h, s2, 0, 6.28); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(r() * w, split + r() * (h - split - 60), 2 + r() * 3, 20 + r() * 70); }      // потёки краски
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; const x = r() * w, y = r() * h, s2 = 6 + r() * 16; g.beginPath(); for (let a2 = 0; a2 < 6.28; a2 += 0.6) g.lineTo(x + Math.cos(a2) * s2 * (0.6 + r() * 0.5), y + Math.sin(a2) * s2 * (0.6 + r() * 0.5)); g.fill(); } }), 5), false);
const PWALL = PAINTS.map((_, k) => rep(std({ map: podWallTex(k), roughness: 1, roughnessMap: podRough, normalMap: podBump, normalScale: new THREE.Vector2(0.3, 0.3), vertexColors: true }), 2.4, 2.8));
const MP = {
  tile: rep(std({ map: TX.tile, roughness: 0.3, normalMap: texFrom(normalFromHeight(mkCanvas(256, 256, (g, w, h) => { const n = 16, q = w / n; g.fillStyle = '#404040'; g.fillRect(0, 0, w, h); g.fillStyle = '#b0b0b0'; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) g.fillRect(x * q + 1.2, y * q + 1.2, q - 2.4, q - 2.4); }), 3), false), normalScale: new THREE.Vector2(0.6, 0.6) }), 1.2, 1.2),
  conc: M.conc,
  leather: rep(std({ map: TX.leather, roughness: 0.6, vertexColors: true }), 0.9, 2.05),
  rail: envMat({ color: 0x4a2c1e, roughness: 0.35 }, 0.3),
  bars: envMat({ color: 0x2a2c2c, roughness: 0.5, metalness: 0.6 }, 0.3),
  radiator: envMat({ color: 0xc8c4b8, roughness: 0.5, metalness: 0.2 }, 0.3),
  dirtyGlass: std({ color: 0xb8c0b8, roughness: 0.2, transparent: true, opacity: 0.35, depthWrite: false }),
};
const floorNumMats = new Map();
function floorNumMat(n) { if (!floorNumMats.has(n)) floorNumMats.set(n, new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.9, map: texFrom(mkCanvas(String(n).length > 3 ? 64 * String(n).length : 128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(240,235,220,0.85)'; g.font = 'bold 88px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), w / 2, h / 2 + 4); })) })); return floorNumMats.get(n); }
// --- модуль этажа ---
const podMods = new Map();
function buildFloor(n) {
  const group = new THREE.Group(), b = new Batch(), y0 = n * FH, F = podBase + n + 1, FD = F | 0, r = rng(Math.imul(FD, 7919) + 31), wallM = PWALL[0], wc = shade(0.9 + r() * 0.15);
  b.push(0, y0, 0);
  // площадка этажа (плитка) и плита потолка над ней
  b.box(MP.tile, (LX0 + LX1) / 2, -0.06, -LAND / 2, LX1 - LX0, 0.12, LAND);
  b.box(MP.conc, (LX0 + LX1) / 2, FH - 0.2, -LAND / 2, LX1 - LX0, 0.16, LAND, shade(0.95));
  // межэтажная площадка
  b.box(MP.conc, PW / 2, FH / 2 - 0.1, PL + MIDD / 2, PW, 0.2, MIDD, shade(0.85));
  // марши: ступени
  const NS = 9, rise = FH / 2 / NS, tread = PL / NS;
  for (let k = 0; k < NS; k++) {
    const topA = (k + 1) * rise, zA = k * tread + tread / 2; b.box(MP.conc, WELL0 / 2, topA - 0.12, zA, WELL0, 0.24, tread + 0.01, shade(0.85 + r() * 0.12));
    const topB = FH / 2 + (k + 1) * rise, zB = PL - k * tread - tread / 2; b.box(MP.conc, (WELL1 + PW) / 2, topB - 0.12, zB, PW - WELL1, 0.24, tread + 0.01, shade(0.85 + r() * 0.12));
  }
  // наклонные плиты снизу маршей
  const slope = Math.atan2(FH / 2, PL), sl = Math.hypot(FH / 2, PL);
  b.box(MP.conc, WELL0 / 2, FH / 4 - 0.25, PL / 2, WELL0, 0.12, sl, shade(0.7), -slope);
  b.box(MP.conc, (WELL1 + PW) / 2, FH * 0.75 - 0.25, PL / 2, PW - WELL1, 0.12, sl, shade(0.7), slope);
  // стены лестничной клетки
  b.box(wallM, -0.06, FH / 2, (PL + MIDD) / 2, 0.12, FH, PL + MIDD, wc);
  b.box(wallM, PW + 0.06, FH / 2, (PL + MIDD) / 2, 0.12, FH, PL + MIDD, wc);
  // торцевая стена с окном (на межэтажной площадке)
  const WZ = PL + MIDD + 0.06, wy0 = FH / 2 + 0.9, wy1 = FH / 2 + 2.2, wx0 = PW / 2 - 0.65, wx1 = PW / 2 + 0.65;
  b.box(wallM, wx0 / 2, FH / 2, WZ, wx0, FH, 0.12, wc); b.box(wallM, (wx1 + PW) / 2, FH / 2, WZ, PW - wx1, FH, 0.12, wc);
  b.box(wallM, PW / 2, wy0 / 2, WZ, wx1 - wx0, wy0, 0.12, wc); b.box(wallM, PW / 2, (wy1 + FH) / 2 + 0.02, WZ, wx1 - wx0, FH - wy1 + 0.04, 0.12, wc);
  const fc = lin([0.72, 0.68, 0.6]);
  b.box(M.paint, PW / 2, wy0 + 0.02, WZ - 0.1, 1.45, 0.05, 0.3, fc); b.box(M.paint, wx0, (wy0 + wy1) / 2, WZ, 0.07, wy1 - wy0, 0.16, fc); b.box(M.paint, wx1, (wy0 + wy1) / 2, WZ, 0.07, wy1 - wy0, 0.16, fc); b.box(M.paint, PW / 2, wy1, WZ, 1.4, 0.07, 0.16, fc); b.box(M.paint, PW / 2, (wy0 + wy1) / 2, WZ, 0.05, wy1 - wy0, 0.12, fc);
  const openW = r() < 0.55; // створка открыта — можно выпрыгнуть
  if (!openW) b.box(MP.dirtyGlass, PW / 2, (wy0 + wy1) / 2, WZ, 1.26, wy1 - wy0 - 0.06, 0.01);
  else { b.box(MP.dirtyGlass, PW / 2 - 0.33, (wy0 + wy1) / 2, WZ, 0.6, wy1 - wy0 - 0.06, 0.01); const g2 = new THREE.BoxGeometry(0.6, wy1 - wy0 - 0.08, 0.03).translate(-0.3, 0, 0); b.add(M.paint, g2, new THREE.Matrix4().compose(new V3(wx1, (wy0 + wy1) / 2, WZ - 0.05), new THREE.Quaternion().setFromAxisAngle(UP, -1.1), new V3(1, 1, 1)), fc); }
  // батарея под окном, банка-пепельница, цветок
  for (let k = 0; k < 9; k++) b.box(MP.radiator, PW / 2 - 0.45 + k * 0.11, FH / 2 + 0.42, WZ - 0.2, 0.07, 0.55, 0.12);
  b.cyl(M.metal, PW / 2 + 0.45, wy0 + 0.1, WZ - 0.12, 0.05, 0.05, 0.12, 10, PAINT.galv); if (r() < 0.5) { b.cyl(M.paint, PW / 2 - 0.4, wy0 + 0.09, WZ - 0.12, 0.07, 0.05, 0.13, 10, lin([0.6, 0.3, 0.2])); b.geo(M.leafOlive, new THREE.IcosahedronGeometry(0.12, 0), PW / 2 - 0.4, wy0 + 0.25, WZ - 0.12, 0, r(), 0, 1, shade(0.7)); }
  // стены площадки этажа
  b.box(wallM, (LX0 + EX0) / 2, FH / 2, -LAND - 0.06, EX0 - LX0, FH, 0.12, wc); b.box(wallM, (EX1 + LX1) / 2, FH / 2, -LAND - 0.06, LX1 - EX1, FH, 0.12, wc); b.box(wallM, EXC, (2.15 + FH) / 2, -LAND - 0.06, EX1 - EX0, FH - 2.15, 0.12, wc);
  liftBuild(b, group, y0, FD, r);
  { const nm = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), MPC.notice); nm.position.set(2.7, y0 + 1.5, -LAND + 0.01); group.add(nm);
    for (let k = 0; k < 12; k++) { const t = k / 12; b.box(MPC.tinsel[k % 4], WELL0, 0.95 + t * FH / 2 + Math.sin(t * 25) * 0.03, t * PL, 0.025, 0.025, 0.2, null, 0.4 * k, 0, 0); }
    for (let k = 0; k < 2; k++) b.geo(MPC.flake, new THREE.PlaneGeometry(0.2, 0.2), PW / 2 - 0.3 + k * 0.55, FH / 2 + 1.5 + r() * 0.4, PL + MIDD, 0, 0, r(), 1); }
  b.box(wallM, LX0 - 0.06, FH / 2, -LAND / 2, 0.12, FH, LAND, wc); b.box(wallM, LX1 + 0.06, FH / 2, -LAND / 2, 0.12, FH, LAND, wc);
  b.box(wallM, LX0 / 2, FH / 2, 0.06, -LX0, FH, 0.12, wc); b.box(wallM, (PW + LX1) / 2, FH / 2, 0.06, LX1 - PW, FH, 0.12, wc);
  // номер этажа
  const num = new THREE.Mesh(new THREE.PlaneGeometry(String(FD).length > 3 ? 0.22 * String(FD).length : 0.45, 0.45), floorNumMat(FD)); num.position.set(LX0 / 2, y0 + 1.75, 0.0); num.rotation.y = Math.PI; group.add(num);
  // квартирные двери (дерматин), номера
  const pk = r() < 0.35 ? (r() * 4) | 0 : -1;
  const doors = [[0.25, -LAND, 0], [PW - 0.25 - 0.9, -LAND, 0], [LX0, -LAND / 2 - 0.45, 1], [LX1, -LAND / 2 + 0.45, -1]];
  doors.forEach(([dx, dz, side], k) => {
    const dc = shade(0.75 + r() * 0.4), metal = r() < 0.3;
    if (side === 0) { b.box(M.paint, dx + 0.45, 1.06, dz + 0.02, 1.02, 2.14, 0.05, lin([0.3, 0.25, 0.2])); b.box(metal ? M.metal : MP.leather, dx + 0.45, 1.02, dz + 0.05, 0.9, 2.04, 0.04, metal ? lin([0.35, 0.22, 0.15]) : dc); b.box(MH.chrome, dx + 0.8, 1.0, dz + 0.09, 0.03, 0.14, 0.03); b.cyl(MH.dark, dx + 0.45, 1.55, dz + 0.075, 0.012, 0.012, 0.01, 8, null, Math.PI / 2); b.box(M.paint, dx + 1.03, 1.45, dz + 0.04, 0.05, 0.08, 0.02, PAINT.white); }
    else { const xx = dx + side * 0.02; b.box(M.paint, xx, 1.06, dz, 0.05, 2.14, 1.02, lin([0.3, 0.25, 0.2])); b.box(metal ? M.metal : MP.leather, xx + side * 0.03, 1.02, dz, 0.04, 2.04, 0.9, metal ? lin([0.35, 0.22, 0.15]) : dc); b.box(MH.chrome, xx + side * 0.07, 1.0, dz - side * 0.35, 0.03, 0.14, 0.03); }
    const ax = side === 0 ? dx + 0.45 : dx + side * 0.3, az = side === 0 ? dz + 0.3 : dz;
    const apt = HOMEPOD ? 36 + (FD - 1) * 4 + k + 1 : FD * 4 + k + 1, mine = HOMEPOD && apt === 47 && F === 3;
    doorsLive.push({ knock: true, party: k === pk && !mine, home: mine, label: mine ? 'E — домой, кв. 47' : undefined, x: ax, z: az, y: y0, apt, target: 0, ang: 0, pivot: { rotation: {} }, col: {}, group });
  });
  // щиток с проводами
  b.box(M.metal, LX1 - 0.02, 1.7, -0.5, 0.06, 0.8, 0.6, lin([0.45, 0.47, 0.42])); if (r() < 0.6) { b.lines.push(new V3(LX1 - 0.05, y0 + 2.1, -0.4), new V3(LX1 - 0.4, y0 + FH - 0.3, -0.2), new V3(LX1 - 0.05, y0 + 2.1, -0.6), new V3(LX1 - 0.6, y0 + FH - 0.28, -0.9)); }
  // перила: стойки + коричневый поручень
  for (const [x, zs, ze, ys, ye] of [[WELL0, 0, PL, 0, FH / 2], [WELL1, PL, 0, FH / 2, FH]]) {
    const nb = 10; for (let k = 0; k <= nb; k++) { const t = k / nb, z = lerp(zs, ze, t), yb = lerp(ys, ye, t); b.box(MP.bars, x, yb + 0.45, z, 0.02, 0.9, 0.02); }
    b.pipe(MP.rail, new V3(x, ys + 0.92, zs), new V3(x, ye + 0.92, ze), 0.03); b.pipe(MP.bars, new V3(x, ys + 0.12, zs), new V3(x, ye + 0.12, ze), 0.01);
  }
  b.pipe(MP.rail, new V3(WELL0, FH / 2 + 0.92, PL), new V3(WELL1, FH / 2 + 0.92, PL), 0.03);
  // лампочка на площадке (некоторые не горят)
  const on = r() < 0.7, bx = (LX0 + LX1) / 2 + 0.3, bz = -LAND / 2; b.lines.push(new V3(bx, y0 + FH - 0.12, bz), new V3(bx, y0 + FH - 0.4, bz));
  const flick = on && r() < 0.3; let bulb = null; if (flick) { bulb = new THREE.Mesh(BULB_GEO, MH.bulb); bulb.position.set(bx, y0 + FH - 0.45, bz); group.add(bulb); } else b.geo(on ? MH.bulb : MH.bulbOff, BULB_GEO, bx, FH - 0.45, bz, 0, 0, 0, 1);
  if (on) bulbAnchors.push({ x: bx, y: y0 + FH - 0.55, fy: y0, z: bz, flick, ph: r() * 100, group, mesh: bulb });
  winAnchors.push({ x: PW / 2, z: WZ - 0.1, y: y0 + FH / 2, nx: 0, nz: 1, group, open: openW });
  // хлам на площадке
  if (r() < 0.35) b.box(M.paint, LX0 + 0.4, 0.25, -LAND + 0.4, 0.5, 0.5, 0.45, lin([0.12, 0.12, 0.12]), 0, r(), 0); // мешок
  if (r() < 0.25) { b.box(M.plank, LX1 - 0.5, 0.45, -LAND + 0.4, 0.42, 0.04, 0.42, shade(0.8)); b.box(M.plank, LX1 - 0.5, 0.7, -LAND + 0.2, 0.42, 0.5, 0.04, shade(0.8)); for (const [ox, oz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) b.box(M.plank, LX1 - 0.5 + ox, 0.22, -LAND + 0.4 + oz, 0.04, 0.45, 0.04, shade(0.8)); }
  b.pop();
  // мусор
  const spots = [[LX0 + 0.5 + r() * 4.5, -0.3 - r() * 1.4, 0], [0.3 + r() * 0.7, PL + 0.3 + r() * 1, FH / 2], [PW / 2 + (r() - 0.5) * 1.6, PL + 0.4 + r() * 0.9, FH / 2]];
  spots.forEach(([x, z, yy], k) => { if (r() < 0.45) { addTrash(group, x, z, `p${F},${k}`, r); const c = coinsLive[coinsLive.length - 1]; c.obj.position.y = y0 + yy; c.fy = y0 + yy; } });
  b.build(group); scene.add(group);
  return group;
}
// статические коллизии лестничной клетки (одинаковы на всех этажах)
const podCols = [
  { x: -0.12, z: (PL + MIDD) / 2, hx: 0.12, hz: (PL + MIDD) / 2 }, { x: PW + 0.12, z: (PL + MIDD) / 2, hx: 0.12, hz: (PL + MIDD) / 2 },
  { x: PW / 2, z: PL + MIDD + 0.1, hx: PW / 2, hz: 0.12 },
  { x: (WELL0 + WELL1) / 2, z: PL / 2 + 0.02, hx: (WELL1 - WELL0) / 2 + 0.02, hz: PL / 2 + 0.02 },
  { x: (LX0 + EX0) / 2, z: -LAND - 0.1, hx: (EX0 - LX0) / 2, hz: 0.12 }, { x: (EX1 + LX1) / 2, z: -LAND - 0.1, hx: (LX1 - EX1) / 2, hz: 0.12 },
  { x: EX0 - 0.08, z: (EZ1 - LAND) / 2, hx: 0.08, hz: 0.8 }, { x: EX1 + 0.08, z: (EZ1 - LAND) / 2, hx: 0.08, hz: 0.8 }, { x: EXC, z: EZ1 - 0.08, hx: 0.7, hz: 0.08 }, { x: LX0 - 0.1, z: -LAND / 2, hx: 0.12, hz: LAND / 2 + 0.1 }, { x: LX1 + 0.1, z: -LAND / 2, hx: 0.12, hz: LAND / 2 + 0.1 },
  { x: LX0 / 2, z: 0.1, hx: -LX0 / 2, hz: 0.12 }, { x: (PW + LX1) / 2, z: 0.1, hx: (LX1 - PW) / 2, hz: 0.12 },
].map((c) => Object.assign(c, { c: 1, s: 0 }));
const liftGap = { x: EXC, z: -LAND - 0.1, hx: (EX1 - EX0) / 2, hz: 0.12, c: 1, s: 0, off: false }; podCols.push(liftGap);
function podUpdate() {
  if (!colliders.has('pod')) colliders.set('pod', podCols);
  const cur = Math.floor((P.y + 0.5) / FH);
  for (let n = cur - 2; n <= cur + 2; n++) if (!podMods.has(n)) podMods.set(n, buildFloor(n));
  for (const [n, g] of podMods) if (Math.abs(n - cur) > 3) { scene.remove(g); g.traverse((o) => { if (o.geometry && o.geometry !== BULB_GEO && o.geometry !== PLAF_GEO && !Object.values(trashGeo).includes(o.geometry)) o.geometry.dispose(); }); for (let i = coinsLive.length - 1; i >= 0; i--) if (coinsLive[i].group === g) coinsLive.splice(i, 1); podMods.delete(n); }
  { let best = 99; for (const d of doorsLive) if (d.party) { const dd = Math.hypot(d.x - P.x, d.z - P.z) + Math.abs(d.y - P.y) * 5; if (dd < best) best = dd; } partyTick(clamp(1 - best / 16, 0, 1) * 0.32, 380); }
  liftUpdate(cur);
  const fe = $('f_floor'); if (fe) { const t = LIFT.st === 'ride' ? LIFT.show : String((podBase + Math.floor((P.y + 0.3) / FH) + 1) | 0); if (fe.textContent !== t) fe.textContent = t; }
}
// звуки подъезда: далёкий хлопок двери, шаги этажом выше, лай за дверью
function podSound() { if (!AC) return; const t = Math.random();
  if (t < 0.4) { burst(0.5, 'lowpass', 180, 0.7, 0.5, Math.random() - 0.5); setTimeout(() => burst(0.3, 'lowpass', 120, 0.7, 0.25), 90); }
  else if (t < 0.75) { for (let k = 0; k < 6; k++) setTimeout(() => burst(0.08, 'bandpass', 700, 1.2, 0.08, 0.3), k * 520); }
  else if (t < 0.88) { for (let k = 0; k < 3; k++) setTimeout(() => { burst(0.12, 'bandpass', 520, 3, 0.12, -0.4); }, k * 300); }
  else { burst(0.9, 'lowpass', 120, 0.8, 0.35, Math.random() - 0.5); setTimeout(() => { for (let k = 0; k < 8; k++) setTimeout(() => burst(0.03, 'lowpass', 900, 0.8, 0.05), k * 70); }, 900); } }
function podKnock(d) { if (d.home) { burst(0.3, 'lowpass', 500, 1, 0.5); goWorld('kvartira', 'Дверь квартиры не заперта.'); return; } if (d.party) { for (let k = 0; k < 3; k++) setTimeout(() => burst(0.09, 'lowpass', 300, 1, 0.6), k * 180); setTimeout(() => toast(['За дверью музыка и смех. «…С Новым годом!» — но не тебе.', 'Музыку сделали тише. Шаги к двери… и обратно.', '— Кто там? — Из-за двери пахнет мандаринами. Не открывают.'][(Math.random() * 3) | 0] + `<br><span style="font-size:13px;opacity:.6">кв. ${d.apt}</span>`), 900); return; } for (let k = 0; k < 3; k++) setTimeout(() => burst(0.09, 'lowpass', 300, 1, 0.6), k * 180); setTimeout(() => toast(['Тишина.', 'За дверью кто-то есть. Но не открывают.', 'Никого.', 'Где-то за дверью работает телевизор.', 'Шаги… и снова тишина.'][(Math.random() * 5) | 0] + `<br><span style="font-size:13px;opacity:.6">кв. ${d.apt}</span>`), 900); }
if (PODEZD) { P.x = PW / 2 + 0.3; P.z = -1.0; P.y = 0; P.yaw = Math.PI; if (HOMEPOD) setTimeout(() => toast('Твой подъезд.<br><span style="font-size:14px">Квартира 47 — на третьем этаже.</span>'), 2500); ground.visible = false; grass.mesh.visible = false; }

// --- общие материалы подъезда ---
const MPC = {
  white: lin([0.86, 0.85, 0.8]),
  flake: std({ transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, color: 0xf2f2ec, emissive: 0x303030, roughness: 1, map: texFrom(mkCanvas(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.translate(64, 64); for (let a = 0; a < 6; a++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -56); g.moveTo(0, -32); g.lineTo(-15, -46); g.moveTo(0, -32); g.lineTo(15, -46); g.moveTo(0, -15); g.lineTo(-10, -25); g.moveTo(0, -15); g.lineTo(10, -25); g.stroke(); } })) }),
  night: std({ color: 0x050608, emissive: 0x2a1a10, roughness: 0.1, metalness: 0.5 }),
  notice: std({ roughness: 0.95, map: texFrom(mkCanvas(256, 340, (g, w, h) => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.textAlign = 'center'; g.font = 'bold 26px serif'; g.fillText('ОБЪЯВЛЕНИЕ', w / 2, 44); g.font = '18px serif';
    ['Уважаемые жильцы!', '1 января с 00:24', 'до 00:25', 'будет отключено', 'время.', 'Приносим извинения', 'за неудобства.', '', 'ЖЭУ № 3'].forEach((t, i) => g.fillText(t, w / 2, 90 + i * 25)); g.fillStyle = 'rgba(120,100,60,0.25)'; g.fillRect(0, 0, w, 6); })) }),
  tinsel: [0xd8b030, 0xc02828, 0x2aa048, 0x3a6ad8].map((c) => std({ color: c, emissive: c, emissiveIntensity: 0.25, metalness: 0.8, roughness: 0.3 })),
};
// приглушённая музыка «за стеной» (подъезд и дворы)
let PARTY = null;
function partyTick(vol, cut) { if (!AC) return;
  if (!PARTY) { const g = AC.createGain(); g.gain.value = 0; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut || 380; g.connect(f).connect(master); PARTY = { g, f, t: 0, beat: 0 }; }
  PARTY.g.gain.setTargetAtTime(vol, AC.currentTime, 0.4); if (cut) PARTY.f.frequency.value = cut;
  if (vol < 0.004) { PARTY.t = AC.currentTime + 0.1; return; } if (PARTY.t < AC.currentTime) PARTY.t = AC.currentTime + 0.05;
  const CH = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [165, 208, 247]];
  while (PARTY.t < AC.currentTime + 0.6) { const t = PARTY.t, k = PARTY.beat;
    const o = AC.createOscillator(), og = AC.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16); og.gain.setValueAtTime(1, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.26); o.connect(og).connect(PARTY.g); o.start(t); o.stop(t + 0.3);
    if (k % 2 === 1) { const bo = AC.createOscillator(), bg = AC.createGain(); bo.type = 'triangle'; bo.frequency.value = CH[((k / 8) | 0) % 4][0] / 2; bg.gain.setValueAtTime(0.35, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.22); bo.connect(bg).connect(PARTY.g); bo.start(t); bo.stop(t + 0.25); }
    if (k % 8 === 0) for (const fq of CH[((k / 8) | 0) % 4]) { const q = AC.createOscillator(), qg = AC.createGain(); q.type = 'sawtooth'; q.frequency.value = fq; qg.gain.setValueAtTime(0, t); qg.gain.linearRampToValueAtTime(0.07, t + 0.06); qg.gain.setValueAtTime(0.07, t + 3.4); qg.gain.linearRampToValueAtTime(0, t + 3.8); q.connect(qg).connect(PARTY.g); q.start(t); q.stop(t + 3.9); }
    PARTY.t += 0.47; PARTY.beat++; } }

// ===================== ЛИФТ: вместо кнопок — табло, на котором можно набрать любой этаж =====================
const MPL = {
  door: std({ color: 0x6a6258, roughness: 0.5, metalness: 0.6 }),
  wood: std({ roughness: 0.7, map: texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(5); g.fillStyle = '#7a5032'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${r() < 0.5 ? '40,20,10' : '150,100,60'},${r() * 0.18})`; g.fillRect(0, y, w, 2); }
    g.fillStyle = 'rgba(20,10,5,0.7)'; g.font = '20px sans-serif'; ['ВИТЯ', 'лох', '2016', 'ДНО', 'АУ'].forEach((t, i) => { g.save(); g.translate(20 + r() * 180, 30 + i * 45); g.rotate((r() - 0.5) * 0.5); g.fillText(t, 0, 0); g.restore(); });
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(10,5,0,0.6)'; g.beginPath(); g.arc(r() * w, r() * h, 3 + r() * 5, 0, 6.28); g.fill(); } })) }),
  panel: std({ color: 0x222222, roughness: 0.4, metalness: 0.5 }),
  disp: std({ color: 0x200000, emissive: 0xff3010, emissiveIntensity: 2 }),
  btn: std({ color: 0x300000, emissive: 0xff2010, emissiveIntensity: 1.2 }),
  lamp: std({ color: 0xfff4e0, emissive: 0xfff0d0, emissiveIntensity: 2.5 }),
};
function liftBuild(b, group, y0, FD, r) {
  // проём, рама, кабина за ним
  for (const [x, y, sx, sy] of [[EX0 + 0.03, 1.07, 0.08, 2.14], [EX1 - 0.03, 1.07, 0.08, 2.14], [EXC, 2.14, EX1 - EX0, 0.08]]) b.box(M.metal, x, y, -LAND + 0.01, sx, sy, 0.04, lin([0.35, 0.33, 0.3]));
  b.box(M.paint, EXC, -0.05, (EZ1 - LAND) / 2, EX1 - EX0, 0.1, -LAND - EZ1, shade(0.25));
  b.box(MPL.wood, EX0 - 0.02, 1.2, (EZ1 - LAND) / 2 - 0.06, 0.04, 2.4, -LAND - EZ1 - 0.12); b.box(MPL.wood, EX1 + 0.02, 1.2, (EZ1 - LAND) / 2 - 0.06, 0.04, 2.4, -LAND - EZ1 - 0.12); b.box(MPL.wood, EXC, 1.2, EZ1, EX1 - EX0, 2.4, 0.04);
  b.box(M.paint, EXC, 2.38, (EZ1 - LAND) / 2, EX1 - EX0, 0.04, -LAND - EZ1, shade(0.7)); b.box(MPL.lamp, EXC, 2.35, (EZ1 - LAND) / 2, 0.5, 0.02, 0.3);
  b.box(MPL.panel, EX1 - 0.03, 1.35, -LAND - 0.45, 0.04, 0.5, 0.22); b.box(MPL.disp, EX1 - 0.055, 1.52, -LAND - 0.45, 0.01, 0.08, 0.16);
  b.box(MPL.btn, EX0 - 0.2, 1.2, -LAND + 0.02, 0.06, 0.06, 0.03);
  const dl = new THREE.Mesh(new THREE.BoxGeometry((EX1 - EX0) / 2, 2.08, 0.04), MPL.door), dr = dl.clone(); dl.position.set(EX0 + (EX1 - EX0) / 4, y0 + 1.05, -LAND - 0.08); dr.position.set(EX1 - (EX1 - EX0) / 4, y0 + 1.05, -LAND - 0.08); group.add(dl, dr); group.userData.lift = [dl, dr];
  bulbAnchors.push({ x: EXC, y: y0 + 2.2, fy: y0, z: (EZ1 - LAND) / 2, group, mesh: null, color: 0xfff0d0, dist: 4.5, int: 2.2 });
}
const LIFT = { n: 0, open: 0, tgt: 0, st: 'idle', t: 0, dur: 0, from: 0, dest: 0, show: '', snd: null, inter: false, glitch: false };
function inCabin() { return P.x > EX0 && P.x < EX1 && P.z < -LAND - 0.15 && P.z > EZ1; }
function liftHum(on) { if (!AC) return; if (!LIFT.snd) { const s = loopSrc(AC._brown, 0.5), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; const g = AC.createGain(); g.gain.value = 0; const o = AC.createOscillator(); o.frequency.value = 55; const og = AC.createGain(); og.gain.value = 0.25; o.connect(og).connect(g); s.connect(f).connect(g); g.connect(master); o.start(); LIFT.snd = g; } LIFT.snd.gain.setTargetAtTime(on ? 0.5 : 0, AC.currentTime, 0.3); }
function liftDing() { blip([988, 784], 0.7, 'sine', 0.05); }
function liftClank() { burst(0.25, 'lowpass', 400, 1, 0.5); setTimeout(() => burst(0.15, 'bandpass', 1200, 2, 0.15), 120); }
// табло ввода этажа
const liftUI = document.createElement('div'); liftUI.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#0009;z-index:30';
liftUI.innerHTML = '<div style="background:#3a2a1e;border:3px solid #8a6a40;padding:20px 24px;border-radius:6px;text-align:center;color:#e8d8b0;font-family:monospace;box-shadow:0 10px 40px #000;max-width:92vw"><div style="font-size:13px;opacity:.75;margin-bottom:10px">ЛИФТ · наберите этаж</div><input id="liftIn" inputmode="numeric" autocomplete="off" maxlength="22" style="font:26px monospace;width:min(300px,78vw);text-align:center;background:#0b0b0b;color:#ff5a3a;border:2px solid #000;padding:8px;box-sizing:border-box"><div style="margin-top:14px"><button class="b" id="liftGo">Поехать</button><button class="b b2" id="liftNo">Отмена</button></div><div id="liftMsg" style="font-size:12px;opacity:.55;margin-top:10px">грузоподъёмность 320 кг · 4 человека · не курить</div></div>';
document.body.appendChild(liftUI);
const liftIn = liftUI.querySelector('#liftIn');
['keydown', 'keyup'].forEach((ev) => liftIn.addEventListener(ev, (e) => { e.stopPropagation(); if (ev === 'keydown' && e.key === 'Enter') liftGo(); if (ev === 'keydown' && e.key === 'Escape') liftUI.style.display = 'none'; }));
liftUI.querySelector('#liftNo').onclick = () => { liftUI.style.display = 'none'; };
liftUI.querySelector('#liftGo').onclick = () => liftGo();
function liftOpenUI() { if (document.pointerLockElement) document.exitPointerLock(); liftUI.style.display = 'flex'; liftIn.value = ''; liftUI.querySelector('#liftMsg').textContent = 'грузоподъёмность 320 кг · 4 человека · не курить'; setTimeout(() => liftIn.focus(), 50); }
function liftGo() { const v = liftIn.value.trim().replace(/\s+/g, ''); if (!/^-?\d{1,22}$/.test(v)) { liftUI.querySelector('#liftMsg').textContent = 'Лифт не знает такого этажа.'; return; }
  const T = Number(v), cur = podBase + Math.floor((P.y + 0.5) / FH) + 1; liftUI.style.display = 'none'; if (T === cur) { toast('Ты и так на этом этаже.'); return; }
  LIFT.dest = T; LIFT.from = cur; LIFT.tgt = 0; LIFT.st = 'closing'; liftClank(); }
function liftUpdate(cur) {
  if (!LIFT.inter) { LIFT.inter = true;
    INTER.push({ x: EXC, z: -LAND + 0.55, r: 1.1, get y() { return Math.floor((P.y + 0.5) / FH) * FH; }, on: () => !inCabin() && LIFT.st === 'idle' && !(LIFT.n === Math.floor((P.y + 0.5) / FH) && LIFT.open > 0.5), label: 'E — вызвать лифт',
      act: () => { const c = Math.floor((P.y + 0.5) / FH); blip([660], 0.15, 'square', 0.03); if (LIFT.n === c) { LIFT.tgt = 1; liftClank(); } else { LIFT.st = 'coming'; LIFT.t = 2 + Math.min(5, Math.abs(LIFT.n - c) * 0.6); liftHum(true); } } });
    INTER.push({ x: EXC, z: (EZ1 - LAND) / 2, r: 0.9, get y() { return Math.floor((P.y + 0.5) / FH) * FH; }, on: () => inCabin() && LIFT.st === 'idle', label: 'E — набрать этаж', act: liftOpenUI }); }
  LIFT.open += (LIFT.tgt - LIFT.open) * Math.min(1, 0.03 * 60 * 0.033 * 2.2);
  for (const [n, g] of podMods) { const d = g.userData.lift; if (!d) continue; const o = n === LIFT.n ? LIFT.open : 0, w = (EX1 - EX0) / 4; d[0].position.x = EX0 + w - o * w * 1.9; d[1].position.x = EX1 - w + o * w * 1.9; }
  liftGap.off = LIFT.open > 0.75 && LIFT.n === cur;
  if (LIFT.st === 'coming') { LIFT.t -= 0.033; if (LIFT.t <= 0) { LIFT.n = cur; LIFT.st = 'idle'; LIFT.tgt = 1; liftHum(false); liftDing(); liftClank(); } }
  else if (LIFT.st === 'closing') { if (LIFT.open < 0.03) { LIFT.st = 'ride'; LIFT.dur = Math.min(9, 2 + Math.log10(Math.abs(LIFT.dest - LIFT.from) + 1) * 0.9); LIFT.t = 0; liftHum(true); } }
  else if (LIFT.st === 'ride') { LIFT.t += 0.033; const k = Math.min(1, LIFT.t / LIFT.dur), e = k * k * (3 - 2 * k), v = LIFT.from + (LIFT.dest - LIFT.from) * e; LIFT.show = String(Math.round(v)); P.vy = 0;
    if (k >= 1) { // приехали: переносим этажи к началу координат
      const ly = P.y - cur * FH; podClear(); podBase = LIFT.dest - 1; P.y = ly; LIFT.n = 0; LIFT.st = 'idle'; LIFT.tgt = 1; liftHum(false); liftDing(); liftClank();
      const disp = LIFT.dest | 0; LIFT.glitch = disp !== LIFT.dest;
      if (LIFT.glitch) toast(`<b style="color:#ff4a3a">ПЕРЕПОЛНЕНИЕ</b><br>этаж ${LIFT.dest} не помещается в int32<br><span style="font-size:14px">табло показывает ${disp}</span>`);
      else if (Math.abs(LIFT.dest) > 1e6) toast(`Этаж ${LIFT.dest}.<br><span style="font-size:14px">Здесь тоже кто-то живёт.</span>`); } }
  // переполнение: этаж ушёл за 2147483647 (на лифте или пешком)
  const real = podBase + cur + 1, gl = (real | 0) !== real;
  if (gl !== LIFT.glitch && LIFT.st !== 'ride') { LIFT.glitch = gl; if (gl) toast(`<b style="color:#ff4a3a">ЭТАЖ ${real | 0}</b><br><span style="font-size:14px">Так не бывает.</span>`); }
  if (LIFT.glitch) { for (const l of LPOOL) l.color.setRGB(1, 0.12 + Math.random() * 0.05, 0.08); post.U.expo.value = Math.random() < 0.04 ? 0.3 + Math.random() * 1.6 : 1.0 + Math.sin(clock * 7) * 0.08; }
  else if (post.U.expo.value !== 1) post.U.expo.value = 1;
}
function podClear() { for (const [n, g] of podMods) { scene.remove(g); g.traverse((o) => { if (o.geometry && o.geometry !== BULB_GEO && o.geometry !== PLAF_GEO && !Object.values(trashGeo).includes(o.geometry)) o.geometry.dispose(); }); for (let i = coinsLive.length - 1; i >= 0; i--) if (coinsLive[i].group === g) coinsLive.splice(i, 1); } podMods.clear(); }
if (TEST && PODEZD) window.__lift = { LIFT, go: (T) => { liftIn.value = String(T); liftGo(); }, get base() { return podBase; } };
