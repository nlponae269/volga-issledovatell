// ===================== «ПОДЪЕЗД»: бесконечная лестница =====================
const FH = 2.8, PW = 2.7, PL = 2.7, WELL0 = 1.28, WELL1 = 1.42, MIDD = 1.5, LAND = 2.0, LX0 = -1.6, LX1 = 4.3;
// высота поверхности в пределах этажного модуля (0..FH)
function podLocal(x, z) {
  if (z < 0) return 0; if (z > PL) return FH / 2;
  return x < (WELL0 + WELL1) / 2 ? (z / PL) * FH / 2 : FH / 2 + (1 - z / PL) * FH / 2;
}
function podSurface(x, z, y) { const s = podLocal(x, z); const n = Math.floor((y + 0.45 - s) / FH); return n * FH + s; }
// --- текстуры ---
const PAINTS = [['#3f6a52', '#2d5040'], ['#3d5f7e', '#2b4660'], ['#6e5a3c', '#54432c'], ['#5d6b3a', '#47522c'], ['#7a3f36', '#5c2f29']];
const SCRIBBLES = ['Цой жив', 'ЛЁХА', 'Здесь был Вася', 'Спартак', '♥', 'КИНО', 'не курить!!!', '2007', 'Катя + Дима', 'АУ', 'выхода нет', '13'];
function podWallTex(k) {
  const [c1, c2] = PAINTS[k % PAINTS.length], r = rng(k * 17 + 3);
  return texFrom(mkCanvas(512, 512, (g, w, h) => {
    // верх — побелка, низ (до 1.55 м из 2.8) — масляная краска
    const split = h * (1 - 1.55 / 2.8);
    g.fillStyle = '#c9c4b4'; g.fillRect(0, 0, w, split);
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
TX.tile = texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(61), n = 16, s = w / n; g.fillStyle = '#2a201a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = ((x + y) % 2) ? ['#8a5a40', '#7a4e38', '#94654a'][(r() * 3) | 0] : ['#c4b294', '#b8a688', '#cfbf9f'][(r() * 3) | 0]; g.fillStyle = r() < 0.04 ? '#5a5048' : c; g.fillRect(x * s + 0.8, y * s + 0.8, s - 1.6, s - 1.6); } }));
TX.leather = texFrom(mkCanvas(256, 512, (g, w, h) => { const r = rng(71), base = ['#4a2a22', '#3a2a2a', '#5a3a2a', '#2a2a30'][(r() * 4) | 0]; g.fillStyle = base; g.fillRect(0, 0, w, h);
  const st = 64; for (let y = -st; y < h + st; y += st) for (let x = -st; x < w + st; x += st) { const ox = (y / st) % 2 ? st / 2 : 0; g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(x + ox, y - st / 2); g.lineTo(x + ox + st / 2, y); g.lineTo(x + ox, y + st / 2); g.lineTo(x + ox - st / 2, y); g.fill(); g.fillStyle = '#c8a860'; g.beginPath(); g.arc(x + ox, y - st / 2, 3.5, 0, 6.28); g.fill(); }
  g.strokeStyle = 'rgba(200,170,100,0.7)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(r() * w, r() * h, 2 + r() * 20, 1 + r() * 4); } }));
const PWALL = PAINTS.map((_, k) => rep(std({ map: podWallTex(k), roughness: 0.75, vertexColors: true }), 2.4, 2.8));
const MP = {
  tile: rep(std({ map: TX.tile, roughness: 0.6 }), 1.2, 1.2),
  conc: M.conc,
  leather: rep(std({ map: TX.leather, roughness: 0.6, vertexColors: true }), 0.9, 2.05),
  rail: envMat({ color: 0x4a2c1e, roughness: 0.35 }, 0.3),
  bars: envMat({ color: 0x2a2c2c, roughness: 0.5, metalness: 0.6 }, 0.3),
  radiator: envMat({ color: 0xc8c4b8, roughness: 0.5, metalness: 0.2 }, 0.3),
  dirtyGlass: std({ color: 0xb8c0b8, roughness: 0.2, transparent: true, opacity: 0.35, depthWrite: false }),
};
const floorNumMats = new Map();
function floorNumMat(n) { if (!floorNumMats.has(n)) floorNumMats.set(n, new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.9, map: texFrom(mkCanvas(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(240,235,220,0.85)'; g.font = 'bold 88px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), w / 2, h / 2 + 4); })) })); return floorNumMats.get(n); }
// --- модуль этажа ---
const podMods = new Map();
function buildFloor(n) {
  const group = new THREE.Group(), b = new Batch(), y0 = n * FH, r = rng(n * 7919 + 31), wallM = PWALL[(((n % 5) + 5) % 5)], wc = shade(0.9 + r() * 0.15);
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
  b.box(wallM, (LX0 + LX1) / 2, FH / 2, -LAND - 0.06, LX1 - LX0, FH, 0.12, wc);
  b.box(wallM, LX0 - 0.06, FH / 2, -LAND / 2, 0.12, FH, LAND, wc); b.box(wallM, LX1 + 0.06, FH / 2, -LAND / 2, 0.12, FH, LAND, wc);
  b.box(wallM, LX0 / 2, FH / 2, 0.06, -LX0, FH, 0.12, wc); b.box(wallM, (PW + LX1) / 2, FH / 2, 0.06, LX1 - PW, FH, 0.12, wc);
  // номер этажа
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), floorNumMat(n + 1)); num.position.set(LX0 / 2, y0 + 1.75, 0.0); num.rotation.y = Math.PI; group.add(num);
  // квартирные двери (дерматин), номера
  const doors = [[0.25, -LAND, 0], [PW - 0.25 - 0.9, -LAND, 0], [LX0, -LAND / 2 - 0.45, 1], [LX1, -LAND / 2 + 0.45, -1]];
  doors.forEach(([dx, dz, side], k) => {
    const dc = shade(0.75 + r() * 0.4), metal = r() < 0.3;
    if (side === 0) { b.box(M.paint, dx + 0.45, 1.06, dz + 0.02, 1.02, 2.14, 0.05, lin([0.3, 0.25, 0.2])); b.box(metal ? M.metal : MP.leather, dx + 0.45, 1.02, dz + 0.05, 0.9, 2.04, 0.04, metal ? lin([0.35, 0.22, 0.15]) : dc); b.box(MH.chrome, dx + 0.8, 1.0, dz + 0.09, 0.03, 0.14, 0.03); b.cyl(MH.dark, dx + 0.45, 1.55, dz + 0.075, 0.012, 0.012, 0.01, 8, null, Math.PI / 2); b.box(M.paint, dx + 1.03, 1.45, dz + 0.04, 0.05, 0.08, 0.02, PAINT.white); }
    else { const xx = dx + side * 0.02; b.box(M.paint, xx, 1.06, dz, 0.05, 2.14, 1.02, lin([0.3, 0.25, 0.2])); b.box(metal ? M.metal : MP.leather, xx + side * 0.03, 1.02, dz, 0.04, 2.04, 0.9, metal ? lin([0.35, 0.22, 0.15]) : dc); b.box(MH.chrome, xx + side * 0.07, 1.0, dz - side * 0.35, 0.03, 0.14, 0.03); }
    const ax = side === 0 ? dx + 0.45 : dx + side * 0.3, az = side === 0 ? dz + 0.3 : dz;
    doorsLive.push({ knock: true, x: ax, z: az, y: y0, apt: n * 4 + k + 1, target: 0, ang: 0, pivot: { rotation: {} }, col: {}, group });
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
  spots.forEach(([x, z, yy], k) => { if (r() < 0.45) { addTrash(group, x, z, `p${n},${k}`, r); const c = coinsLive[coinsLive.length - 1]; c.obj.position.y = y0 + yy; c.fy = y0 + yy; } });
  b.build(group); scene.add(group);
  return group;
}
// статические коллизии лестничной клетки (одинаковы на всех этажах)
const podCols = [
  { x: -0.12, z: (PL + MIDD) / 2, hx: 0.12, hz: (PL + MIDD) / 2 }, { x: PW + 0.12, z: (PL + MIDD) / 2, hx: 0.12, hz: (PL + MIDD) / 2 },
  { x: PW / 2, z: PL + MIDD + 0.1, hx: PW / 2, hz: 0.12 },
  { x: (WELL0 + WELL1) / 2, z: PL / 2 + 0.02, hx: (WELL1 - WELL0) / 2 + 0.02, hz: PL / 2 + 0.02 },
  { x: (LX0 + LX1) / 2, z: -LAND - 0.1, hx: (LX1 - LX0) / 2, hz: 0.12 }, { x: LX0 - 0.1, z: -LAND / 2, hx: 0.12, hz: LAND / 2 + 0.1 }, { x: LX1 + 0.1, z: -LAND / 2, hx: 0.12, hz: LAND / 2 + 0.1 },
  { x: LX0 / 2, z: 0.1, hx: -LX0 / 2, hz: 0.12 }, { x: (PW + LX1) / 2, z: 0.1, hx: (LX1 - PW) / 2, hz: 0.12 },
].map((c) => Object.assign(c, { c: 1, s: 0 }));
function podUpdate() {
  if (!colliders.has('pod')) colliders.set('pod', podCols);
  const cur = Math.floor((P.y + 0.5) / FH);
  for (let n = cur - 2; n <= cur + 2; n++) if (!podMods.has(n)) podMods.set(n, buildFloor(n));
  for (const [n, g] of podMods) if (Math.abs(n - cur) > 3) { scene.remove(g); g.traverse((o) => { if (o.geometry && o.geometry !== BULB_GEO && !Object.values(trashGeo).includes(o.geometry)) o.geometry.dispose(); }); for (let i = coinsLive.length - 1; i >= 0; i--) if (coinsLive[i].group === g) coinsLive.splice(i, 1); podMods.delete(n); }
  const fe = $('f_floor'); if (fe) { const t = String(Math.floor((P.y + 0.3) / FH) + 1); if (fe.textContent !== t) fe.textContent = t; }
}
// звуки подъезда: далёкий хлопок двери, шаги этажом выше, лай за дверью
function podSound() { if (!AC) return; const t = Math.random();
  if (t < 0.4) { burst(0.5, 'lowpass', 180, 0.7, 0.5, Math.random() - 0.5); setTimeout(() => burst(0.3, 'lowpass', 120, 0.7, 0.25), 90); }
  else if (t < 0.75) { for (let k = 0; k < 6; k++) setTimeout(() => burst(0.08, 'bandpass', 700, 1.2, 0.08, 0.3), k * 520); }
  else { for (let k = 0; k < 3; k++) setTimeout(() => { burst(0.12, 'bandpass', 520, 3, 0.12, -0.4); }, k * 300); } }
function podKnock(d) { for (let k = 0; k < 3; k++) setTimeout(() => burst(0.09, 'lowpass', 300, 1, 0.6), k * 180); setTimeout(() => toast(['Тишина.', 'За дверью кто-то есть. Но не открывают.', 'Никого.', 'Где-то за дверью работает телевизор.', 'Шаги… и снова тишина.'][(Math.random() * 5) | 0] + `<br><span style="font-size:13px;opacity:.6">кв. ${d.apt}</span>`), 900); }
if (PODEZD) { P.x = PW / 2 + 0.3; P.z = -1.0; P.y = 0; P.yaw = Math.PI; ground.visible = false; grass.mesh.visible = false; }
