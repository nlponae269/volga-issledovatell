// ===================== «ДОМ»: бесконечный тёмный дом =====================
const HC = 4.8, HH = 2.7, WT = 0.07; // клетка, высота потолка, полутолщина стены
// --- текстуры дома ---
TX.lino = texFrom(mkCanvas(512, 512, (g, w, h) => {
  const pal = ['#3a2a22', '#5a4334', '#7b6656', '#a89a8a', '#d6cdbf', '#2a201c', '#6a5a50', '#8c7a68', '#c4b6a2'], r = rng(5);
  g.fillStyle = '#1a1512'; g.fillRect(0, 0, w, h); const rh = 512 / 10;
  for (let y = 0; y < 10; y++) { let x = -r() * 60; while (x < w) { const bw = 28 + r() * 90; g.fillStyle = pal[(r() * pal.length) | 0]; g.fillRect(x + 1.5, y * rh + 1.5, bw - 3, rh - 3);
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.04 + r() * 0.06})`; g.fillRect(x + r() * bw, y * rh + r() * rh, 2 + r() * 8, 1 + r() * 2); } x += bw; } }
  for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, s = 20 + r() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(0,0,0,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
}));
TX.wall = texFrom(mkCanvas(512, 512, (g, w, h) => { const r = rng(9);
  g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.05})`; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
  for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, s = 30 + r() * 100; wrapDraw(g, w, h, x, y, s, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, s); gr.addColorStop(0, `rgba(${r() < 0.6 ? '60,55,45' : '255,250,240'},${0.06 + r() * 0.08})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - s, Y - s, s * 2, s * 2); }); }
  for (let i = 0; i < 12; i++) { const x = r() * w, l = 40 + r() * 200, y = r() * h; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(70,60,40,0.12)'); gr.addColorStop(1, 'rgba(70,60,40,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + r() * 5, l); }
}));
TX.paper = texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(13); g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const ox = (y / 64) % 2 ? 32 : 0; g.fillStyle = 'rgba(120,100,70,0.35)'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; g.ellipse(x + ox + 32 + Math.cos(a) * 9, y + 32 + Math.sin(a) * 9, 7, 4, a, 0, 6.283); } g.fill(); g.fillStyle = 'rgba(150,80,60,0.35)'; g.beginPath(); g.arc(x + ox + 32, y + 32, 4, 0, 6.283); g.fill(); }
  for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(100,90,60,0.06)'; g.fillRect(x, 0, 1, h); }
  for (let i = 0; i < 25; i++) { const x = r() * w, y = r() * h, s = 20 + r() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(90,70,40,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } }));
TX.veneer = texFrom(mkCanvas(128, 512, (g, w, h) => { const r = rng(21); g.fillStyle = '#2e1d16'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '0,0,0' : '120,80,60'},${0.15 + r() * 0.2})`; g.lineWidth = 0.6 + r() * 1.5; const x = r() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 20, h * 0.3, x + (r() - 0.5) * 20, h * 0.7, x + (r() - 0.5) * 10, h); g.stroke(); } }));
TX.towel = texFrom(mkCanvas(256, 512, (g, w, h) => { g.fillStyle = '#b89590'; g.fillRect(0, 0, w, h); const r = rng(31);
  g.strokeStyle = 'rgba(120,80,80,0.5)'; g.lineWidth = 2; for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, s = 25 + r() * 35; g.fillStyle = '#efe6d0'; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(s * 0.55, 0, s * 0.45, s * 0.13, 0, 0, 6.283); g.fill(); g.restore(); } g.fillStyle = '#d8c8a0'; g.beginPath(); g.arc(x, y, s * 0.18, 0, 6.283); g.fill(); }
  g.fillStyle = '#efe6d0'; g.fillRect(0, h - 26, w, 26); }));
TX.fur = texFrom(mkCanvas(256, 512, (g, w, h) => { g.clearRect(0, 0, w, h); const r = rng(41);
  for (let i = 0; i < 9000; i++) { const x = 20 + r() * (w - 40), y = 20 + r() * (h - 40), l = 8 + r() * 18, a = Math.PI / 2 + (r() - 0.5) * 1.5, v = 200 + r() * 55 | 0; g.strokeStyle = `rgba(${v},${v - 8},${v - 30},0.8)`; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }));
TX.pillow = texFrom(mkCanvas(256, 256, (g, w, h) => { g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, w, h); const r = rng(51); g.fillStyle = '#1c1a1a'; g.strokeStyle = '#1c1a1a'; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, s = 22 + r() * 22; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(s * 0.6, 0, s * 0.55, s * 0.2, 0, 0, 6.283); g.fill(); g.restore(); } g.beginPath(); g.arc(x + s, y + s, s * 0.6, 0, 4); g.stroke(); } }));
const envMat = (o, k = 0.6) => { const m = std(o); m.envMap = ENV_TEX; m.envMapIntensity = k; return m; };
const MH = {
  lino: rep(envMat({ map: TX.lino, roughness: 0.42 }, 0.25), 1.6, 1.6),
  wall: rep(std({ map: TX.wall, vertexColors: true, roughness: 0.9 }), 2.2, 2.2),
  paper: rep(std({ map: TX.paper, vertexColors: true, roughness: 0.95 }), 0.9, 0.9),
  ceil: rep(std({ map: TX.wall, color: 0x9a968c, roughness: 1 }), 3, 3),
  door: rep(envMat({ map: TX.veneer, vertexColors: true, roughness: 0.55 }, 0.25), 0.9, 2.05),
  chrome: envMat({ color: 0xd8d8d8, roughness: 0.12, metalness: 1 }, 1.0),
  dark: envMat({ color: 0x1e1410, roughness: 0.45 }, 0.3),
  towel: std({ map: TX.towel, roughness: 1, side: THREE.DoubleSide }),
  fur: std({ map: TX.fur, alphaTest: 0.4, roughness: 1, side: THREE.DoubleSide }),
  pillow: std({ map: TX.pillow, roughness: 0.9 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc070, emissiveIntensity: 5 }),
  bulbOff: std({ color: 0x8a8070, roughness: 0.2 }),
  glassB: std({ color: 0x2b4a2a, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.75 }),
};
const WALLC = [lin([0.43, 0.47, 0.3]), lin([0.72, 0.66, 0.52]), lin([0.6, 0.62, 0.5]), lin([0.55, 0.5, 0.42]), lin([0.38, 0.42, 0.36])];
// --- генерация плана ---
function cellType(i, j) {
  if (i === 0 && j === 0) return 'room';
  if ((i === 2 && j === 0) || ihash(i, j, 77) < 0.07) return 'yard';
  if (ihash(i, j, 78) < 0.05) return 'stair';
  return 'room';
}
function edgeType(i0, j0, i1, j1, salt) { // стена между двумя клетками
  const a = cellType(i0, j0), b = cellType(i1, j1);
  if (a === 'yard' && b === 'yard') return 'none';
  if (a === 'yard' || b === 'yard') return ihash(i0 + i1, j0 + j1, salt) < 0.75 ? 'window' : 'wall';
  if ((i0 === 0 && j0 === 0) || (i1 === 0 && j1 === 0)) return 'door';
  const t = ihash(i0 * 3 + i1, j0 * 5 + j1, salt);
  return t < 0.44 ? 'door' : t < 0.6 ? 'arch' : t < 0.68 ? 'none' : 'wall';
}
const roomColor = (i, j) => WALLC[(ihash(i, j, 90) * WALLC.length) | 0];
const roomPaper = (i, j) => ihash(i, j, 91) < 0.25;
const BULB_GEO = new THREE.SphereGeometry(0.045, 10, 8);
const housePrompt = { door: null, win: null };
const doorsLive = [], winAnchors = [], bulbAnchors = [];
const doorGeo = new THREE.BoxGeometry(0.88, 2.02, 0.045).translate(0.44, 1.01, 0);
{ const uv = doorGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.88, uv.getY(i) * 2.02); }
const handleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8).rotateZ(Math.PI / 2);
// стена вдоль оси: axis 'x' — стена по линии z=const, от x0 до x1; 'z' — по линии x=const
function wallRun(b, axis, c, s0, s1, y0, y1, colA, colB, matA, matB, extA, extB) {
  if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return;
  const len = s1 - s0, mid = (s0 + s1) / 2, h = y1 - y0, ym = (y0 + y1) / 2;
  if (axis === 'x') { b.box(matA, mid, ym, c - WT / 2, len, h, WT, colA); b.box(matB, mid, ym, c + WT / 2, len, h, WT, colB); b.cols.push({ x: mid, z: c, hx: len / 2, hz: WT + 0.02, c: 1, s: 0, y0, y1 }); }
  else { b.box(matA, c - WT / 2, ym, mid, WT, h, len, colA); b.box(matB, c + WT / 2, ym, mid, WT, h, len, colB); b.cols.push({ x: c, z: mid, hx: WT + 0.02, hz: len / 2, c: 1, s: 0, y0, y1 }); }
}
function buildEdge(b, group, axis, i0, j0, i1, j1, type, r) {
  // A — клетка с меньшим индексом (по оси -), B — с большим
  const cA = cellType(i0, j0), cB = cellType(i1, j1);
  const yard = cA === 'yard' || cB === 'yard';
  const colA = cA === 'yard' ? shade(0.9) : roomColor(i0, j0), colB = cB === 'yard' ? shade(0.9) : roomColor(i1, j1);
  const matA = cA === 'yard' ? M.brick : roomPaper(i0, j0) ? MH.paper : MH.wall, matB = cB === 'yard' ? M.brick : roomPaper(i1, j1) ? MH.paper : MH.wall;
  const c = axis === 'x' ? (j0 + 1) * HC : (i0 + 1) * HC, s0 = axis === 'x' ? i0 * HC : j0 * HC, s1 = s0 + HC;
  const run = (a, e, y0, y1) => wallRun(b, axis, c, a, e, y0, y1, colA, colB, matA, matB);
  if (yard) run(s0, s1, -6.2, -0.02); // фасад вниз до земли двора
  if (type === 'none') return;
  if (type === 'wall') { run(s0, s1, 0, HH); return; }
  const w = type === 'window' ? 1.2 : type === 'arch' ? 1.3 : 0.9, off = (ihash(i0 + j1, j0 + i1, 55) - 0.5) * (HC - w - 1.2), m = (s0 + s1) / 2 + off, a = m - w / 2, e = m + w / 2;
  if (type === 'window') {
    const y0 = 0.86, y1 = 2.18; run(s0, a, 0, HH); run(e, s1, 0, HH); run(a, e, 0, y0); run(a, e, y1, HH);
    // рама и створки, подоконник
    const P2 = (s, y, d, sx, sy, sz, col, mat = M.paint) => (axis === 'x' ? b.box(mat, s, y, c + d, sx, sy, sz, col) : b.box(mat, c + d, y, s, sz, sy, sx, col));
    const fc = lin([0.78, 0.76, 0.7]);
    P2(m, y0 - 0.02, 0, w + 0.12, 0.05, WT * 2 + 0.12, fc); P2(m, y1 + 0.03, 0, w + 0.12, 0.06, WT * 2 + 0.04, fc);
    P2(a + 0.03, (y0 + y1) / 2, 0, 0.06, y1 - y0, WT * 2 + 0.04, fc); P2(e - 0.03, (y0 + y1) / 2, 0, 0.06, y1 - y0, WT * 2 + 0.04, fc);
    const inA = cA !== 'yard' ? -1 : 1; // в какую сторону комната
    for (const sgn of [-1, 1]) { const hx = sgn < 0 ? a + 0.06 : e - 0.06, ang = 1.2 + ihash(i0, j0 + sgn, 3) * 0.6; const lw = w / 2 - 0.06;
      for (const [yy, hh] of [[(y0 + y1) / 2, y1 - y0 - 0.06]]) { const g = new THREE.BoxGeometry(lw, hh, 0.04).translate(-sgn * lw / 2, 0, 0); const q = new THREE.Quaternion().setFromAxisAngle(UP, (axis === 'x' ? 0 : Math.PI / 2)).multiply(new THREE.Quaternion().setFromAxisAngle(UP, sgn * inA * ang * (axis === 'x' ? 1 : -1)));
        const pos = axis === 'x' ? new V3(hx, yy, c + inA * WT) : new V3(c + inA * WT, yy, hx); b.add(M.paint, g, new THREE.Matrix4().compose(pos, q, new V3(1, 1, 1)), fc); } }
    const ax = axis === 'x' ? m : c, az = axis === 'x' ? c : m, nx = axis === 'x' ? 0 : -inA, nz = axis === 'x' ? -inA : 0;
    winAnchors.push({ x: ax, z: az, nx, nz, group });
    b.cols.push({ x: ax, z: az, hx: axis === 'x' ? w / 2 : WT + 0.05, hz: axis === 'x' ? WT + 0.05 : w / 2, c: 1, s: 0 });
    return;
  }
  const dh = type === 'arch' ? 2.2 : 2.06; run(s0, a, 0, HH); run(e, s1, 0, HH); run(a, e, dh, HH);
  if (type === 'door') { // коробка + полотно
    const P2 = (s, y, sx, sy, sz) => (axis === 'x' ? b.box(MH.door, s, y, c, sx, sy, sz, shade(0.8)) : b.box(MH.door, c, y, s, sz, sy, sx, shade(0.8)));
    P2(a - 0.035, dh / 2, 0.07, dh, WT * 2 + 0.06); P2(e + 0.035, dh / 2, 0.07, dh, WT * 2 + 0.06); P2(m, dh + 0.035, w + 0.14, 0.07, WT * 2 + 0.06);
    const st = ihash(i0 + 7, j0 + 13 * i1, 66), closed = st < 0.35, ang0 = closed ? 0 : st < 0.55 ? 0.5 + ihash(j0, i0, 3) * 0.4 : 1.45 + ihash(j0, i0, 4) * 0.25;
    const side = ihash(i1, j1, 8) < 0.5 ? 1 : -1;
    const pivot = new THREE.Group(); const base = axis === 'x' ? 0 : -Math.PI / 2;
    if (axis === 'x') pivot.position.set(a, 0, c); else pivot.position.set(c, 0, a);
    const leaf = new THREE.Mesh(doorGeo, MH.door); leaf.castShadow = leaf.receiveShadow = true; const hd = new THREE.Mesh(handleGeo, MH.chrome); hd.position.set(0.78, 1.0, 0.05); const hd2 = hd.clone(); hd2.position.z = -0.05; leaf.add(hd, hd2); pivot.add(leaf);
    pivot.rotation.y = base + side * ang0; group.add(pivot);
    const col = { x: axis === 'x' ? m : c, z: axis === 'x' ? c : m, hx: axis === 'x' ? w / 2 : 0.08, hz: axis === 'x' ? 0.08 : w / 2, c: 1, s: 0, off: !closed };
    b.cols.push(col);
    doorsLive.push({ pivot, base, side, ang: ang0, target: ang0, col, x: col.x, z: col.z, group });
  }
}
// лестничный проём с перилами (как на фото): хром + тёмные балясины, полотенце и овчина
function stairwell(b, group, i, j, r) {
  const x0 = i * HC, z0 = j * HC, px0 = x0 + 1.2, px1 = x0 + HC - 1.2, pz0 = z0 + 0.9, pz1 = z0 + HC - 0.9;
  // пол вокруг проёма
  b.box(MH.lino, (x0 + px0) / 2, -0.05, z0 + HC / 2, px0 - x0, 0.1, HC); b.box(MH.lino, (px1 + x0 + HC) / 2, -0.05, z0 + HC / 2, x0 + HC - px1, 0.1, HC);
  b.box(MH.lino, (px0 + px1) / 2, -0.05, (z0 + pz0) / 2, px1 - px0, 0.1, pz0 - z0); b.box(MH.lino, (px0 + px1) / 2, -0.05, (pz1 + z0 + HC) / 2, px1 - px0, 0.1, z0 + HC - pz1);
  // шахта вниз
  const col = roomColor(i, j);
  b.box(MH.wall, px0 - 0.05, -1.6, (pz0 + pz1) / 2, 0.1, 3.2, pz1 - pz0, col); b.box(MH.wall, px1 + 0.05, -1.6, (pz0 + pz1) / 2, 0.1, 3.2, pz1 - pz0, col);
  b.box(MH.wall, (px0 + px1) / 2, -1.6, pz0 - 0.05, px1 - px0, 3.2, 0.1, col); b.box(MH.wall, (px0 + px1) / 2, -1.6, pz1 + 0.05, px1 - px0, 3.2, 0.1, col);
  b.box(MH.lino, (px0 + px1) / 2, -3.15, (pz0 + pz1) / 2, px1 - px0, 0.1, pz1 - pz0);
  const n = 12; for (let k = 0; k < n; k++) b.box(MH.lino, (px0 + px1) / 2 - 0.55, -0.12 - k * 0.24, pz1 - 0.15 - k * 0.24, 1.1, 0.06, 0.3); // ступени вниз в темноту
  // перила
  const ry = 0.95, pts = [[px0, pz0], [px1, pz0], [px1, pz1], [px0, pz1], [px0, pz0]];
  for (let k = 0; k < 4; k++) { const [ax, az] = pts[k], [bx, bz] = pts[k + 1]; b.pipe(MH.chrome, new V3(ax, ry, az), new V3(bx, ry, bz), 0.025);
    for (const yy of [0.35, 0.6]) b.pipe(MH.dark, new V3(ax, yy, az), new V3(bx, yy, bz), 0.008);
    const L = Math.hypot(bx - ax, bz - az), nb = Math.round(L / 0.85); for (let q = 0; q <= nb; q++) { const t = q / nb, x = lerp(ax, bx, t), z = lerp(az, bz, t); b.cyl(MH.dark, x, ry / 2, z, 0.022, 0.022, ry, 8); b.cyl(MH.chrome, x, 0.02, z, 0.03, 0.03, 0.04, 8); } }
  b.cols.push({ x: (px0 + px1) / 2, z: (pz0 + pz1) / 2, hx: (px1 - px0) / 2 + 0.05, hz: (pz1 - pz0) / 2 + 0.05, c: 1, s: 0 });
  // полотенце с ромашками и овчина на перилах
  const tx = px0 + 0.7 + r() * 0.4;
  for (const sg of [-1, 1]) { const g = new THREE.PlaneGeometry(0.5, 0.75); const m = new THREE.Mesh(g, MH.towel); m.position.set(tx, ry - 0.36, pz0 + sg * 0.035); m.rotation.x = sg * 0.06; m.receiveShadow = m.castShadow = true; group.add(m); }
  for (const sg of [-1, 1]) { const g = new THREE.PlaneGeometry(0.55, 0.85); const m = new THREE.Mesh(g, MH.fur); m.position.set(tx + 0.62, ry - 0.36, pz0 + sg * 0.05); m.rotation.set(sg * 0.12, 0, (r() - 0.5) * 0.2); m.castShadow = true; group.add(m); }
  const pil = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.18), MH.pillow); pil.position.set(tx + 0.7, 0.3, pz0 - 0.3); pil.rotation.set(-0.2, 0.3, 0); pil.castShadow = true; group.add(pil);
}
// мебель и хлам
function furnish(b, group, i, j, r) {
  const x0 = i * HC, z0 = j * HC, cx = x0 + HC / 2, cz = z0 + HC / 2, t = r();
  const wc = shade(0.55 + r() * 0.3, [1, 0.85, 0.7]);
  if (t < 0.18) { const wx = x0 + 0.45, wz = z0 + 1 + r() * 2.6; b.box(MH.door, wx, 0.95, wz, 0.6, 1.9, 1.1, wc); b.box(MH.dark, wx + 0.31, 1.0, wz, 0.01, 1.6, 0.01); b.cols.push({ x: wx, z: wz, hx: 0.32, hz: 0.57, c: 1, s: 0 }); }
  else if (t < 0.32) { b.box(M.plank, cx, 0.72, cz, 1.2, 0.05, 0.7, wc); for (const [dx, dz] of [[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]]) b.box(M.plank, cx + dx, 0.36, cz + dz, 0.05, 0.72, 0.05, wc); b.cols.push({ x: cx, z: cz, hx: 0.62, hz: 0.37, c: 1, s: 0 });
    b.box(M.plank, cx + 0.2, 0.45, cz + 0.65, 0.42, 0.04, 0.42, wc); b.box(M.plank, cx + 0.2, 0.7, cz + 0.85, 0.42, 0.5, 0.04, wc); }
  else if (t < 0.42) { const bx = x0 + HC - 1.2, bz = z0 + 1.2; b.box(M.metal, bx, 0.4, bz, 0.95, 0.05, 1.9, PAINT.dark); b.box(MH.pillow, bx, 0.48, bz, 0.9, 0.1, 1.85); for (const dz of [-0.95, 0.95]) b.box(M.metal, bx, 0.45, bz + dz, 0.95, 0.9, 0.04, PAINT.dark); b.cols.push({ x: bx, z: bz, hx: 0.5, hz: 1.0, c: 1, s: 0 }); }
  else if (t < 0.6) { for (let k = 0; k < 2 + (r() * 4 | 0); k++) { const s = 0.3 + r() * 0.35, bx = x0 + 0.6 + r() * (HC - 1.2), bz = z0 + 0.6 + r() * (HC - 1.2), st = r() < 0.3 ? 2 : 1; for (let q = 0; q < st; q++) b.box(M.paint, bx, s / 2 + q * s, bz, s * 1.2, s, s, lin([0.55, 0.42, 0.28]), 0, r() * 0.5, 0); b.cols.push({ x: bx, z: bz, hx: s * 0.65, hz: s * 0.6, c: 1, s: 0 }); } }
  else if (t < 0.68) { b.box(M.paint, cx - 1, 0.25, z0 + 0.5, 0.6, 0.5, 0.4, PAINT.dark); b.box(M.paint, cx - 1, 0.72, z0 + 0.52, 0.55, 0.42, 0.42, lin([0.12, 0.12, 0.12])); b.box(M.glass, cx - 1, 0.72, z0 + 0.74, 0.42, 0.32, 0.02); }
  // газеты, тряпки
  if (r() < 0.4) for (let k = 0; k < 4; k++) b.box(TX ? MH.paper : MH.paper, x0 + 0.5 + r() * (HC - 1), 0.012 + k * 0.004, z0 + 0.5 + r() * (HC - 1), 0.45, 0.008, 0.32, shade(0.9), 0, r() * 3, 0);
  // свисающие провода
  if (r() < 0.35) { const wx = x0 + 0.8 + r() * (HC - 1.6), wz = z0 + 0.8 + r() * (HC - 1.6); let p = new V3(wx, HH, wz); for (let k = 0; k < 6; k++) { const q = p.clone().add(new V3((r() - 0.5) * 0.15, -0.1 - r() * 0.12, (r() - 0.5) * 0.15)); b.lines.push(p, q); p = q; } }
}
// мусор
const TRASH = [{ n: 'Бутылка' }, { n: 'Банка' }, { n: 'Бумажка' }, { n: 'Пакет' }, { n: 'Пачка' }];
const trashGeo = {
  7: new THREE.LatheGeometry([[0, 0], [0.035, 0], [0.037, 0.005], [0.037, 0.17], [0.028, 0.2], [0.013, 0.24], [0.013, 0.27], [0, 0.27]].map((p) => new THREE.Vector2(p[0], p[1])), 12),
  8: new THREE.CylinderGeometry(0.033, 0.033, 0.115, 12).translate(0, 0.057, 0),
  9: new THREE.IcosahedronGeometry(0.05, 1),
  10: new THREE.IcosahedronGeometry(0.13, 1),
  11: new THREE.BoxGeometry(0.055, 0.085, 0.022).translate(0, 0.011, 0),
};
{ const p = trashGeo[9].attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.75 + ihash(i, 3) * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } trashGeo[9].computeVertexNormals(); }
{ const p = trashGeo[10].attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.6 + ihash(i, 4) * 0.6; p.setXYZ(i, p.getX(i) * k * 1.2, Math.max(p.getY(i) * k, -0.02) * 0.6 + 0.04, p.getZ(i) * k); } trashGeo[10].computeVertexNormals(); }
const trashMat = { 7: envMat({ color: 0x2c5a2a, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.8 }, 0.8), 8: envMat({ color: 0xb0b4b6, roughness: 0.3, metalness: 1 }, 0.7), 9: std({ color: 0xd8d4c8, roughness: 1 }), 10: std({ color: 0xe8e8e4, roughness: 0.6, transparent: true, opacity: 0.9 }), 11: std({ color: 0xb03028, roughness: 0.7 }) };
function addTrash(group, x, z, id, r) { const type = 7 + ((r() * 5) | 0); const g = new THREE.Group(); const m = new THREE.Mesh(trashGeo[type], trashMat[type]); m.castShadow = true;
  if (type === 7 || type === 8) { if (r() < 0.6) { m.rotation.z = Math.PI / 2; m.position.y = type === 7 ? 0.037 : 0.033; m.position.x = -0.1; } } m.rotation.y = r() * 6; g.add(m); g.position.set(x, 0, z); group.add(g); coinsLive.push({ id, obj: g, type, x, z, group }); }
for (let i = 0; i < 5; i++) COIN_TYPES[7 + i] = { n: TRASH[i].n, k: 'trash' };

// --- чанк дома ---
function buildHouseChunk(cx, cz) {
  const group = new THREE.Group(), b = new Batch(), x0 = cx * CS, z0 = cz * CS, n = CS / HC;
  for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) {
    const i = Math.round(x0 / HC) + a, j = Math.round(z0 / HC) + c, t = cellType(i, j), r = rng(i * 7919 + j * 104729 + 3), X = i * HC, Z = j * HC;
    if (t === 'room') { b.box(MH.lino, X + HC / 2, -0.05, Z + HC / 2, HC, 0.1, HC); furnish(b, group, i, j, r);
      for (let k = 0; k < (r() < 0.45 ? 1 + (r() < 0.3 ? 1 : 0) : 0); k++) addTrash(group, X + 0.5 + r() * (HC - 1), Z + 0.5 + r() * (HC - 1), `t${i},${j},${k}`, r);
      if (r() < 0.38) { const bx = X + HC / 2 + (r() - 0.5), bz = Z + HC / 2 + (r() - 0.5), on = r() < 0.75; b.lines.push(new V3(bx, HH, bz), new V3(bx, HH - 0.55, bz)); const flick = on && r() < 0.25; let bulb = null; if (flick) { bulb = new THREE.Mesh(BULB_GEO, MH.bulb); bulb.position.set(bx, HH - 0.6, bz); group.add(bulb); } else b.geo(on ? MH.bulb : MH.bulbOff, BULB_GEO, bx, HH - 0.6, bz, 0, 0, 0, 1); if (on) bulbAnchors.push({ x: bx, y: HH - 0.7, z: bz, flick, ph: r() * 100, group, mesh: bulb }); } }
    if (t === 'stair') stairwell(b, group, i, j, r);
    if (t !== 'yard') b.box(MH.ceil, X + HC / 2, HH + 0.06, Z + HC / 2, HC, 0.12, HC);
    else { // двор-колодец: немного хлама внизу
      for (let k = 0; k < 3; k++) b.box(M.brick, X + 0.5 + r() * (HC - 1), GROUND_Y + 0.04, Z + 0.5 + r() * (HC - 1), 0.25, 0.07, 0.12, shade(0.9), 0, r() * 3, 0); }
    buildEdge(b, group, 'z', i, j, i + 1, j, edgeType(i, j, i + 1, j, 1), r);
    buildEdge(b, group, 'x', i, j, i, j + 1, edgeType(i, j, i, j + 1, 2), r);
  }
  b.build(group); scene.add(group);
  return { group, cols: b.cols };
}
// --- свет: фонарик + пул ламп ---
const torch = new THREE.SpotLight(0xfff0d6, HOUSE ? 32 : 0, 24, 0.6, 0.55, 2);
torch.castShadow = !MOBILE && HOUSE; torch.shadow.mapSize.set(1024, 1024); torch.shadow.bias = -0.0005; torch.shadow.camera.near = 0.2;
const torchTarget = new THREE.Object3D(); torchTarget.position.set(0, -0.15, -1); camera.add(torch, torchTarget); torch.position.set(0.15, -0.12, 0.05); torch.target = torchTarget;
if (HOUSE) scene.add(camera);
let torchOn = HOUSE;
const LPOOL = []; if (HOUSE) for (let k = 0; k < 4; k++) { const l = new THREE.PointLight(0xffc27a, 0, 8, 2); scene.add(l); LPOOL.push(l); }
function houseUpdate(dt) {
  // чистим якоря выгруженных чанков
  for (const arr of [doorsLive, winAnchors, bulbAnchors]) for (let k = arr.length - 1; k >= 0; k--) if (!arr[k].group.parent) arr.splice(k, 1);
  torch.intensity = torchOn ? 32 * (0.97 + Math.sin(clock * 13) * 0.01 + Math.sin(clock * 3.1) * 0.02) : 0;
  // лампы: ближайшие 4 якоря (лампы и окна)
  const cand = [];
  for (const a of bulbAnchors) { const d = Math.hypot(a.x - P.x, a.z - P.z); if (d < 20) cand.push([d, a, 0]); }
  for (const a of winAnchors) { const d = Math.hypot(a.x - P.x, a.z - P.z); if (d < 14) cand.push([d + 2, a, 1]); }
  cand.sort((u, v) => u[0] - v[0]);
  for (let k = 0; k < LPOOL.length; k++) { const l = LPOOL[k], c = cand[k]; if (!c) { l.intensity = 0; continue; } const a = c[1];
    if (c[2] === 0) { let f = 1; if (a.flick) { f = Math.sin(clock * 23 + a.ph) > -0.6 ? 1 : 0.1; if (Math.sin(clock * 0.7 + a.ph) > 0.85) f *= Math.random() < 0.5 ? 0.2 : 1; a.mesh.material = f > 0.5 ? MH.bulb : MH.bulbOff; }
      l.color.setHex(0xffc27a); l.intensity = 2.6 * f; l.distance = 7.5; l.position.set(a.x, a.y, a.z); }
    else { l.color.setHex(0xb4c2d0); l.intensity = 4.5; l.distance = 6.5; l.position.set(a.x - a.nx * 0.6, 1.6, a.z - a.nz * 0.6); } }
  // двери анимируются
  for (const d of doorsLive) if (Math.abs(d.ang - d.target) > 0.001) { d.ang += (d.target - d.ang) * Math.min(1, dt * 5); d.pivot.rotation.y = d.base + d.side * d.ang; d.col.off = d.ang > 0.25; }
  // подсказка
  let best = null, bd = 1.7;
  for (const d of doorsLive) { const dd = Math.hypot(d.x - P.x, d.z - P.z); if (dd < bd) { bd = dd; best = { door: d }; } }
  for (const w of winAnchors) { const dd = Math.hypot(w.x - P.x, w.z - P.z); if (dd < Math.min(bd, 1.5)) { bd = dd; best = { win: w }; } }
  housePrompt.door = best && best.door; housePrompt.win = best && best.win;
  const pe = $('prompt'); if (pe) { const t = jumping ? '' : housePrompt.win ? 'E — выпрыгнуть в окно' : housePrompt.door ? (housePrompt.door.target > 0.3 ? 'E — закрыть дверь' : 'E — открыть дверь') : ''; if (pe.textContent !== t) pe.textContent = t; pe.style.opacity = t ? 1 : 0; const te = $('tE'); if (te) te.style.display = t ? 'block' : 'none'; }
  if (jumping) jumpStep(dt);
}
let jumping = null;
function houseInteract() {
  if (!HOUSE || !started || jumping) return;
  if (housePrompt.win) { const w = housePrompt.win; jumping = { t: 0, w, sx: P.x, sz: P.z }; if (document.pointerLockElement) document.exitPointerLock(); burst(0.4, 'highpass', 900, 0.4, 0.4); return; }
  if (housePrompt.door) { const d = housePrompt.door; d.target = d.target > 0.3 ? 0 : 1.55; creak(); }
}
function jumpStep(dt) {
  const j = jumping; j.t += dt; const w = j.w;
  const k1 = Math.min(1, j.t / 0.7);
  P.x = lerp(j.sx, w.x + w.nx * 1.4, k1); P.z = lerp(j.sz, w.z + w.nz * 1.4, k1); P.yaw = lerp(P.yaw, Math.atan2(-w.nx, -w.nz), 0.1);
  P.y = j.t < 0.7 ? Math.sin(k1 * Math.PI) * 0.6 + k1 * 0.3 : 0.9 - 9.8 * (j.t - 0.7) * (j.t - 0.7) * 1.2;
  P.pitch = lerp(P.pitch, j.t < 0.7 ? 0 : -0.9, 0.05);
  const f = $('fade'); if (j.t > 0.9) { f.style.transition = 'opacity 0.5s'; f.style.background = '#000'; f.style.opacity = 1; }
  if (j.t > 1.5 && !j.done) { j.done = true; try { localStorage.setItem('dom_trash', TRASHN); } catch (e) {} location.href = 'vorota.html'; }
}
let TRASHN = 0; try { TRASHN = +localStorage.getItem('dom_trash') || 0; } catch (e) {}
if (HOUSE) {
  P.x = HC / 2; P.z = HC / 2; P.yaw = 0.6;
  addEventListener('keydown', (e) => { if (!started) return; if (e.code === 'KeyE') houseInteract(); if (e.code === 'KeyF') torchOn = !torchOn; });
  if ($('tE')) $('tE').addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); houseInteract(); }, { passive: false });
  if ($('tLight')) $('tLight').addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); torchOn = !torchOn; }, { passive: false });
  if ($('f_trash')) $('f_trash').textContent = TRASHN;
}
if (TEST) window.__house = { cellType, winAnchors, doorsLive, interact: houseInteract, get jumping() { return jumping; } };
