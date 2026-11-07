// ===================== ТРОПА: постройки и мелочи =====================
class Batch {
  constructor() { this.bags = new Map(); this.stack = [new THREE.Matrix4()]; this.cols = []; this.lines = []; }
  get T() { return this.stack[this.stack.length - 1]; }
  push(x, y, z, ry = 0) { const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z); this.stack.push(this.T.clone().multiply(m)); }
  pop() { this.stack.pop(); }
  bag(mat) { if (!this.bags.has(mat)) this.bags.set(mat, new Bag()); return this.bags.get(mat); }
  add(mat, geo, local, color) { const m = local ? this.T.clone().multiply(local) : this.T; this.bag(mat).add(geo, m, color); }
  // коробка с uv в метрах
  box(mat, x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.BoxGeometry(sx, sy, sz), uv = g.attributes.uv;
    const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
    _e.set(rx, ry, rz); _q.setFromEuler(_e); const l = new THREE.Matrix4().compose(new V3(x, y, z), _q, new V3(1, 1, 1)); this.add(mat, g, l, color);
  }
  cyl(mat, x, y, z, r0, r1, h, seg, color, rx = 0, rz = 0) { const g = new THREE.CylinderGeometry(r1, r0, h, seg); _e.set(rx, 0, rz); _q.setFromEuler(_e); this.add(mat, g, new THREE.Matrix4().compose(new V3(x, y, z), _q, new V3(1, 1, 1)), color); }
  pipe(mat, a, b, r, color) { const d = new V3().subVectors(b, a), len = d.length(); const g = new THREE.CylinderGeometry(r, r, len, 6, 1, true); _q.setFromUnitVectors(UP, d.normalize()); this.add(mat, g, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), _q, new V3(1, 1, 1)), color); }
  // треугольный фронтон в плоскости XY (основание w, высота h), uv в метрах
  gable(mat, x, y, z, w, h, ry, color) {
    const g = new THREE.BufferGeometry(); const P = [-w / 2, 0, 0, w / 2, 0, 0, 0, h, 0]; g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([-w / 2, 0, w / 2, 0, 0, h], 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); g.setIndex([0, 1, 2]);
    this.add(mat, g, new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), color);
  }
  geo(mat, g, x, y, z, rx, ry, rz, s, color) { _e.set(rx, ry, rz); _q.setFromEuler(_e); this.add(mat, g, new THREE.Matrix4().compose(new V3(x, y, z), _q, new V3(s, s, s)), color); }
  collide(x, z, hx, hz, ry = 0) { const w = new V3(x, 0, z).applyMatrix4(this.T); const e = new THREE.Euler().setFromRotationMatrix(this.T); this.cols.push({ x: w.x, z: w.z, hx, hz, c: Math.cos(ry + e.y), s: Math.sin(ry + e.y) }); }
  world(x, y, z) { return new V3(x, y, z).applyMatrix4(this.T); }
  build(group) {
    for (const [mat, bag] of this.bags) { const g = bag.build(); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = Q.shadows && mat !== M.glass; m.receiveShadow = true; group.add(m); }
    if (this.lines.length) group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(this.lines), M.wire));
  }
}
const col = (r, g, b) => [r, g, b];
const hexc = (h, v = 1) => [((h >> 16) & 255) / 255 * v, ((h >> 8) & 255) / 255 * v, (h & 255) / 255 * v];
const lin = (c) => c.map((v) => Math.pow(v, 2.2));
const PAINT = { white: lin([0.86, 0.86, 0.84]), blue: lin([0.42, 0.62, 0.78]), green: lin([0.32, 0.52, 0.42]), brown: lin([0.36, 0.24, 0.18]), rust: lin([0.42, 0.26, 0.16]), galv: lin([0.66, 0.68, 0.7]), dark: lin([0.16, 0.16, 0.16]), cream: lin([0.85, 0.8, 0.66]), teal: lin([0.35, 0.6, 0.6]) };

function window_(b, x, y, z, w, h, frameC) {
  b.box(M.paint, x, y, z + 0.02, w + 0.12, h + 0.12, 0.08, frameC);
  b.box(M.glass, x, y, z + 0.05, w - 0.06, h - 0.06, 0.02);
  b.box(M.paint, x, y, z + 0.075, 0.05, h - 0.06, 0.03, frameC); b.box(M.paint, x, y + h * 0.18, z + 0.075, w - 0.06, 0.05, 0.03, frameC);
  b.box(M.metal, x, y - h / 2 - 0.05, z + 0.08, w + 0.2, 0.03, 0.16, PAINT.galv, -0.15);
}
// жилой дом: силикатный кирпич или старые доски, шиферная крыша
function house(b, r, x, z, ry) {
  const wood = r() < 0.45, W = 7 + r() * 3.5, D = 6 + r() * 2, H = wood ? 2.7 : 3.0 + r() * 0.4, pitch = 0.5 + r() * 0.18, G = D / 2 * Math.tan(pitch);
  const wallM = wood ? M.plank : M.brick, wc = wood ? shade(0.85 + r() * 0.3) : shade(0.92 + r() * 0.12), fc = r() < 0.5 ? PAINT.white : r() < 0.5 ? PAINT.blue : PAINT.teal;
  b.push(x, groundH(x, z) - 0.05, z, ry);
  b.box(M.conc, 0, 0.2, 0, W + 0.16, 0.5, D + 0.16, shade(0.8));
  b.box(wallM, 0, 0.45 + H / 2, 0, W, H, D, wc);
  for (const s of [-1, 1]) b.gable(wallM, s * W / 2, 0.45 + H, 0, D, G, s * Math.PI / 2, wc);
  const rl = D / 2 / Math.cos(pitch) + 0.45, sc = shade(0.75 + r() * 0.3);
  for (const s of [-1, 1]) b.box(M.slate, 0, 0.45 + H + G / 2 - 0.02 + Math.sin(pitch) * 0.2, s * (D / 4 + 0.1), W + 0.7, 0.03, rl, sc, s * pitch);
  b.box(M.slate, 0, 0.45 + H + G + 0.04, 0, W + 0.72, 0.06, 0.32, shade(0.6));
  if (!wood || r() < 0.5) { const cx = (r() - 0.5) * W * 0.5; b.box(M.brick, cx, 0.45 + H + G * 0.8, -D * 0.15, 0.5, G * 1.1, 0.5, shade(0.7)); b.box(M.conc, cx, 0.45 + H + G * 1.36, -D * 0.15, 0.62, 0.06, 0.62, shade(0.6)); }
  const nw = Math.max(2, Math.floor(W / 2.6));
  for (let i = 0; i < nw; i++) { const wx = -W / 2 + (i + 0.5) * W / nw; if (i === nw - 1 && r() < 0.7) { b.box(M.plank, wx, 0.45 + 1.05, D / 2 + 0.03, 0.95, 2.05, 0.06, shade(0.6)); b.box(M.paint, wx, 0.45 + 2.12, D / 2 + 0.04, 1.1, 0.1, 0.08, fc); b.box(M.conc, wx, 0.25, D / 2 + 0.6, 1.5, 0.3, 1.0, shade(0.75)); continue; } window_(b, wx, 0.45 + 1.6, D / 2, 1.1, 1.3, fc); }
  b.push(0, 0, -D / 2, Math.PI); for (let i = 0; i < nw; i++) window_(b, -W / 2 + (i + 0.5) * W / nw, 0.45 + 1.6, 0, 1.1, 1.3, fc); b.pop();
  b.push(W / 2, 0, 0, Math.PI / 2); window_(b, 0, 0.45 + 1.6, 0, 1.0, 1.2, fc); if (G > 1.2) window_(b, 0, 0.45 + H + G * 0.4, 0, 0.6, 0.7, fc); b.pop();
  b.push(-W / 2, 0, 0, -Math.PI / 2); window_(b, 0, 0.45 + 1.6, 0, 1.0, 1.2, fc); b.pop();
  if (!wood) { b.box(M.paint, 0, 0.45 + H - 0.05, D / 2 + 0.55, W + 0.7, 0.1, 0.12, PAINT.brown); b.cyl(M.paint, W / 2 + 0.2, (0.45 + H) / 2, D / 2 + 0.55, 0.05, 0.05, 0.45 + H, 6, PAINT.brown); }
  b.collide(0, 0, W / 2 + 0.1, D / 2 + 0.1);
  // палисадник: профнастил на кирпичных столбах + бетонная клумба
  if (r() < 0.55) { const fz = D / 2 + 3.5 + r() * 2, len = W + 4; for (let k = 0; k <= Math.round(len / 2.6); k++) { const fx = -len / 2 + k * len / Math.round(len / 2.6); b.box(M.brick, fx, 0.95, fz, 0.42, 1.9, 0.42, shade(1.05, [1.05, 1, 0.85])); b.box(M.conc, fx, 1.93, fz, 0.48, 0.06, 0.48, shade(0.8)); }
    b.box(M.prof, 0, 0.98, fz, len, 1.65, 0.03, r() < 0.5 ? PAINT.brown : PAINT.galv); b.collide(0, fz, len / 2, 0.25); }
  b.pop();
}
// магазинчик
const SIGN_TEXT = ['ПРОДУКТЫ', 'МАГАЗИН', 'ХЛЕБ', 'У ДОРОГИ', 'ХОЗТОВАРЫ', 'ПРОДУКТЫ 24'];
const SIGN_MATS = SIGN_TEXT.map((t, i) => new THREE.MeshStandardMaterial({ roughness: 0.6, map: texFrom(mkCanvas(512, 112, (g, w, h) => {
  const bgs = ['#2f6f3e', '#9c3a2c', '#2c4f86', '#b8902a', '#4a4a4a', '#2f6f3e']; g.fillStyle = bgs[i]; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = 'bold 66px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, h / 2 + 4);
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,30,20,0.35)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
})) }));
function shop(b, r, x, z, ry, group) {
  const W = 9, D = 6.5, H = 3.3;
  b.push(x, groundH(x, z) - 0.05, z, ry);
  b.box(M.conc, 0, 0.2, 0, W + 0.2, 0.45, D + 0.2, shade(0.8));
  b.box(M.brick, 0, 0.4 + H / 2, 0, W, H, D, shade(1.0));
  b.box(M.prof, 0, 0.4 + H + 0.25, 0.1, W + 0.6, 0.04, D + 0.8, PAINT.brown, -0.06);
  b.box(M.paint, 0, 0.4 + H - 0.1, D / 2 + 0.1, W + 0.2, 0.9, 0.12, PAINT.white);
  window_(b, -2.6, 0.4 + 1.55, D / 2, 2.4, 1.5, PAINT.white); window_(b, 2.6, 0.4 + 1.55, D / 2, 2.4, 1.5, PAINT.white);
  for (const wx of [-2.6, 2.6]) for (let k = -5; k <= 5; k++) b.box(M.metal, wx + k * 0.22, 0.4 + 1.55, D / 2 + 0.16, 0.02, 1.6, 0.02, PAINT.dark);
  b.box(M.metal, 0, 0.4 + 1.1, D / 2 + 0.03, 1.05, 2.15, 0.06, PAINT.brown); b.box(M.metal, 0.38, 0.4 + 1.05, D / 2 + 0.08, 0.04, 0.2, 0.04, PAINT.galv);
  b.box(M.conc, 0, 0.18, D / 2 + 1.0, 3.2, 0.36, 1.6, shade(0.85)); b.box(M.conc, 0, 0.06, D / 2 + 2.0, 3.2, 0.12, 0.6, shade(0.8));
  // козырёк
  b.box(M.prof, 0, 0.4 + 2.55, D / 2 + 0.9, 3.0, 0.03, 1.6, PAINT.galv, 0.12); b.cyl(M.metal, -1.4, 1.5, D / 2 + 1.6, 0.04, 0.04, 2.9, 6, PAINT.galv); b.cyl(M.metal, 1.4, 1.5, D / 2 + 1.6, 0.04, 0.04, 2.9, 6, PAINT.galv);
  // урна и скамейка
  b.cyl(M.metal, 2.2, 0.38, D / 2 + 1.9, 0.22, 0.26, 0.75, 10, PAINT.green);
  b.box(M.plank, -2.8, 0.45, D / 2 + 1.4, 1.8, 0.05, 0.4, shade(0.9)); b.box(M.metal, -3.5, 0.22, D / 2 + 1.4, 0.05, 0.45, 0.4, PAINT.dark); b.box(M.metal, -2.1, 0.22, D / 2 + 1.4, 0.05, 0.45, 0.4, PAINT.dark);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.78), SIGN_MATS[(r() * SIGN_MATS.length) | 0]); sign.applyMatrix4(b.T.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.4 + H - 0.1, D / 2 + 0.165))); group.add(sign);
  b.collide(0, 0, W / 2 + 0.1, D / 2 + 0.1);
  b.pop();
}
// длинный навес из шифера на трубах (как на 2-м фото)
function shed(b, r, x, z, ry) {
  const n = 14 + (r() * 12 | 0), sw = 1.1, L = n * sw, Hs = 1.75, lift = 0.55, Dr = 3.6;
  b.push(x, groundH(x, z), z, ry);
  for (let i = 0; i < n; i++) {
    const sx = -L / 2 + (i + 0.5) * sw; if (r() < 0.04) continue;
    b.box(M.slate, sx, lift + Hs / 2 + (r() - 0.5) * 0.03, (r() - 0.5) * 0.02, sw + 0.03, Hs, 0.025, shade(0.82 + r() * 0.3), 0, (r() - 0.5) * 0.02, (r() - 0.5) * 0.01);
  }
  for (let i = 0; i <= n; i += 2) { const px = -L / 2 + i * sw; b.cyl(M.metal, px, (lift + Hs + 0.4) / 2 - 0.2, 0.06, 0.045, 0.045, lift + Hs + 0.4, 6, lin([0.36 + r() * 0.1, 0.24, 0.16])); b.cyl(M.metal, px, (lift + Hs + 0.25) / 2, Dr, 0.04, 0.04, lift + Hs + 0.25, 6, lin([0.4, 0.27, 0.18])); }
  b.box(M.metal, 0, lift + Hs + 0.12, 0.05, L, 0.06, 0.06, PAINT.rust); b.box(M.metal, 0, lift + Hs + 0.02, Dr, L, 0.06, 0.06, PAINT.rust);
  for (let i = 0; i < Math.ceil(L / 1.75); i++) b.box(M.slate, -L / 2 + (i + 0.5) * 1.75, lift + Hs + 0.12 - Dr * 0.06, Dr / 2, 1.78, 0.025, Dr + 0.9, shade(0.75 + r() * 0.25), -0.07, Math.PI / 2 * 0 , 0);
  if (r() < 0.6) b.pipe(M.metal, new V3(L / 2 + 0.2, 0, 0.9), new V3(L / 2 - 0.4, lift + Hs, 0.08), 0.03, PAINT.rust);
  // мусор: битые кирпичи и куски шифера
  for (let i = 0; i < 9; i++) { const bx = (r() - 0.5) * L, bz = -0.6 - r() * 2.5; if (r() < 0.5) b.box(M.brick, bx, 0.05, bz, 0.25, 0.07, 0.12, shade(0.9), 0, r() * 3, 0); else b.box(M.slate, bx, 0.03, bz, 0.3 + r() * 0.5, 0.02, 0.2 + r() * 0.4, shade(0.8), (r() - 0.5) * 0.3, r() * 3, 0); }
  b.collide(0, 0.02, L / 2, 0.15);
  b.pop();
}
// ряд железных гаражей
function garages(b, r, x, z, ry) {
  const n = 2 + (r() * 4 | 0), gw = 3.3;
  b.push(x, groundH(x, z) - 0.03, z, ry);
  for (let i = 0; i < n; i++) {
    const gx = (i - (n - 1) / 2) * (gw + 0.06), c = r() < 0.5 ? PAINT.blue : r() < 0.5 ? PAINT.galv : r() < 0.5 ? PAINT.green : PAINT.rust;
    b.box(M.prof, gx, 1.25, 0, gw, 2.5, 5.6, c);
    b.box(M.prof, gx, 2.6, -0.1, gw + 0.15, 0.04, 6.0, PAINT.galv, 0.05);
    b.box(M.metal, gx - 0.74, 1.12, 2.82, 1.42, 2.15, 0.04, c); b.box(M.metal, gx + 0.74, 1.12, 2.82, 1.42, 2.15, 0.04, c);
    b.box(M.metal, gx, 1.12, 2.85, 0.06, 2.15, 0.03, PAINT.dark); b.box(M.metal, gx + 0.15, 1.1, 2.88, 0.05, 0.3, 0.05, PAINT.dark);
    b.box(M.conc, gx, 0.04, 3.4, gw, 0.08, 1.0, shade(0.7));
  }
  b.collide(0, 0, n * (gw + 0.06) / 2, 2.85);
  b.pop();
}
// столб: деревянный на бетонном пасынке (как на 3-м фото) или бетонный
function pole(b, r, x, z) {
  const y = groundH(x, z), wood = r() < 0.5;
  if (wood) { b.box(M.conc, x, y + 1.1, z + 0.18, 0.22, 2.2, 0.2, shade(0.85)); b.cyl(M.bark, x, y + 4.6, z, 0.13, 0.11, 9.2, 8, [0.55, 0.5, 0.45]); for (const hy of [0.5, 1.6]) b.cyl(M.metal, x, y + hy, z + 0.1, 0.17, 0.17, 0.08, 8, PAINT.dark); }
  else b.box(M.conc, x, y + 4.6, z, 0.26, 9.2, 0.26, shade(0.9));
  b.box(M.metal, x, y + 8.75, z, 0.08, 0.08, 1.7, PAINT.galv);
  for (const s of [-0.7, 0.7]) b.cyl(M.paint, x, y + 8.86, z + s, 0.05, 0.035, 0.16, 8, lin([0.75, 0.82, 0.8]));
  b.cyl(M.paint, x, y + 9.25, z, 0.04, 0.03, 0.16, 8, lin([0.75, 0.82, 0.8]));
  b.collide(x, z, 0.2, 0.2);
}
function wire(b, x0, x1, y0, y1, z0, z1, sag) { const N = 12; for (let k = 0; k < N; k++) { const t = k / N, t2 = (k + 1) / N, f = (t) => [lerp(x0, x1, t), lerp(y0, y1, t) - sag * 4 * t * (1 - t), lerp(z0, z1, t)]; b.lines.push(new V3(...f(t)), new V3(...f(t2))); } }
// фонарь вдоль трассы
function lamp(b, x, z, dir) {
  const y = groundH(x, z); b.cyl(M.metal, x, y + 4.5, z, 0.12, 0.07, 9, 8, PAINT.galv);
  b.pipe(M.metal, new V3(x, y + 8.7, z), new V3(x, y + 9.1, z + dir * 1.8), 0.05, PAINT.galv);
  b.box(M.metal, x, y + 9.05, z + dir * 2.05, 0.3, 0.12, 0.65, PAINT.galv); b.box(M.paint, x, y + 8.98, z + dir * 2.05, 0.22, 0.02, 0.5, lin([0.9, 0.9, 0.85]));
  b.collide(x, z, 0.15, 0.15);
}
// чёрно-белый сигнальный столбик
function striped(b, x, z) { const y = groundH(x, z); for (let i = 0; i < 6; i++) b.box(M.paint, x, y + 0.11 + i * 0.22, z, 0.12, 0.22, 0.12, i % 2 ? PAINT.white : PAINT.dark); }
// бордюр-клумба с камнем, покрашенные шины (1-е фото)
function yardBits(b, r, x, z) {
  const y = groundH(x, z);
  if (r() < 0.5) { const w = 3 + r() * 2, d = 2 + r() * 1.5; b.push(x, y, z, r() * 0.3); for (const [cx, cz, sx, sz] of [[0, -d / 2, w, 0.14], [0, d / 2, w, 0.14], [-w / 2, 0, 0.14, d], [w / 2, 0, 0.14, d]]) b.box(M.conc, cx, 0.12, cz, sx, 0.24, sz, shade(0.85)); b.geo(M.conc, new THREE.DodecahedronGeometry(0.5, 0), 0.4, 0.25, 0, r(), r(), r(), 1, shade(1.1, [1.05, 0.98, 0.9])); b.pop(); }
  else { const tire = new THREE.TorusGeometry(0.33, 0.12, 8, 18); for (let i = 0; i < 2 + (r() * 3 | 0); i++) b.geo(M.paint, tire, x + i * 1.4, y + 0.12, z + (r() - 0.5) * 0.6, Math.PI / 2, 0, 0, 1, r() < 0.5 ? PAINT.blue : PAINT.teal); }
  if (r() < 0.5) { const mx = x + (r() - 0.5) * 4, mz = z + 2.5; b.cyl(M.conc, mx, groundH(mx, mz) + 0.04, mz, 0.75, 0.75, 0.14, 16, shade(0.9)); b.cyl(M.metal, mx, groundH(mx, mz) + 0.12, mz, 0.33, 0.33, 0.03, 16, PAINT.rust); }
}
// ограждение трассы (решётка)
function roadFence(b, x0, x1, z) { for (let x = Math.ceil(x0 / 2.5) * 2.5; x < x1; x += 2.5) { const y = groundH(x + 1.25, z); b.add(M.lattice, new THREE.PlaneGeometry(2.5, 1.2), new THREE.Matrix4().makeTranslation(x + 1.25, y + 0.62, z)); b.box(M.metal, x, y + 0.6, z, 0.07, 1.25, 0.07, PAINT.galv); b.cyl(M.metal, x, y + 1.25, z, 0.05, 0.05, 0.06, 6, PAINT.galv); } }
