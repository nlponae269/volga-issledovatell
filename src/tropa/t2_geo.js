// ===================== ТРОПА: геометрия, прототипы растительности =====================
const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _nm = new THREE.Matrix3();
// Мешок геометрий -> одна BufferGeometry (позиции, нормали, uv, цвет)
class Bag {
  constructor() { this.items = []; this.verts = 0; }
  add(geo, matrix, color, nrm) { this.items.push({ geo, m: matrix.clone(), c: color, n: nrm }); this.verts += geo.attributes.position.count; }
  build() {
    if (!this.items.length) return null;
    let nv = 0, ni = 0; for (const it of this.items) { nv += it.geo.attributes.position.count; ni += it.geo.index ? it.geo.index.count : it.geo.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), C = new Float32Array(nv * 3), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0; const p = new V3(), n = new V3(), t = new V3();
    for (const it of this.items) {
      const g = it.geo, gp = g.attributes.position, gn = g.attributes.normal, gu = g.attributes.uv, cnt = gp.count; _nm.getNormalMatrix(it.m);
      for (let i = 0; i < cnt; i++) {
        p.fromBufferAttribute(gp, i).applyMatrix4(it.m); P.set([p.x, p.y, p.z], (vo + i) * 3);
        if (gn) n.fromBufferAttribute(gn, i).applyMatrix3(_nm).normalize(); else n.set(0, 1, 0);
        if (it.n) { // «объёмная» нормаль кроны
          t.set(p.x - it.n.c.x, (p.y - it.n.c.y) * (it.n.ys ?? 1), p.z - it.n.c.z); if (it.n.axis) t.y = (p.y - it.n.c.y) * 0.25; t.normalize(); t.y += it.n.up ?? 0.25; t.normalize(); n.lerp(t, it.n.k).normalize();
        }
        N.set([n.x, n.y, n.z], (vo + i) * 3);
        if (gu) { U[(vo + i) * 2] = gu.getX(i); U[(vo + i) * 2 + 1] = gu.getY(i); }
        const c = typeof it.c === 'function' ? it.c(p) : (it.c || [1, 1, 1]); C[(vo + i) * 3] = c[0]; C[(vo + i) * 3 + 1] = c[1]; C[(vo + i) * 3 + 2] = c[2];
      }
      if (g.index) { const gi = g.index.array; for (let k = 0; k < gi.length; k++) I[io + k] = gi[k] + vo; io += gi.length; }
      else { for (let k = 0; k < cnt; k++) I[io + k] = vo + k; io += cnt; }
      vo += cnt;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(U, 2)); out.setAttribute('color', new THREE.BufferAttribute(C, 3)); out.setIndex(new THREE.BufferAttribute(I, 1));
    out.computeBoundingSphere(); return out;
  }
}
// ветка: конус между точками, uv в метрах
const _cylCache = new Map();
function cylGeo(seg) { if (!_cylCache.has(seg)) _cylCache.set(seg, new THREE.CylinderGeometry(1, 1, 1, seg, 1, true)); return _cylCache.get(seg); }
function limb(bag, a, b, r0, r1, seg, color) {
  const d = new V3().subVectors(b, a), len = d.length(); if (len < 1e-4) return;
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, true);
  const uv = g.attributes.uv, circ = Math.PI * (r0 + r1); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(0.3, circ), uv.getY(i) * len);
  _q.setFromUnitVectors(UP, d.normalize()); _m.compose(new V3().addVectors(a, b).multiplyScalar(0.5), _q, new V3(1, 1, 1));
  bag.add(g, _m, color);
}
const CARD = new THREE.PlaneGeometry(1, 1).translate(0, 0.35, 0);
function card(bag, pos, size, r, color, nrm, outward) {
  // карточка смотрит примерно наружу от ствола, со случайным наклоном
  const yaw = outward !== undefined ? outward + (r() - 0.5) * 1.6 : r() * 6.283;
  _e.set((r() - 0.5) * 1.2, yaw, (r() - 0.5) * 1.4, 'YXZ'); _q.setFromEuler(_e);
  _m.compose(pos, _q, new V3(size, size * (0.85 + r() * 0.3), size)); bag.add(CARD, _m, color, nrm);
}
const shade = (v, tint = [1, 1, 1]) => [v * tint[0], v * tint[1], v * tint[2]];

// ---------- тополь пирамидальный (с побелкой) ----------
function makePoplar(seed) {
  const r = rng(seed), bark = new Bag(), leaf = new Bag();
  const H = 15 + r() * 6, TH = H * 0.93, R = 1.35 + r() * 0.6;
  const wash = 1.2 + r() * 0.35, bt = [0.82 + r() * 0.1, 0.8 + r() * 0.08, 0.76];
  const barkCol = (p) => { const w = p.y < wash + Math.sin(Math.atan2(p.z, p.x) * 5) * 0.06 ? 1 : 0; return w ? [3.1, 3.1, 2.95] : bt; };
  const pts = [new V3(0, 0, 0)]; let dir = new V3((r() - 0.5) * 0.05, 1, (r() - 0.5) * 0.05).normalize();
  for (let i = 1; i <= 8; i++) { dir.add(new V3((r() - 0.5) * 0.05, 0, (r() - 0.5) * 0.05)).normalize(); pts.push(pts[i - 1].clone().addScaledVector(dir, TH / 8)); }
  const rad = (t) => 0.34 * Math.pow(1 - t, 0.85) + 0.035;
  limb(bark, new V3(0, -0.3, 0), new V3(0, 0.35, 0), 0.5, rad(0) * 1.05, 9, barkCol); // корневой наплыв
  for (let i = 0; i < 8; i++) limb(bark, pts[i], pts[i + 1], rad(i / 8), rad((i + 1) / 8), i < 3 ? 9 : 6, barkCol);
  const trunkAt = (t) => { const f = clamp(t, 0, 0.999) * 8, i = Math.floor(f); return pts[i].clone().lerp(pts[i + 1], f - i); };
  const env = (t) => R * Math.pow(Math.sin(Math.PI * clamp(t * 1.02, 0, 1)), 0.65) * (1 - 0.25 * t) + 0.15;
  const nb = 55;
  for (let i = 0; i < nb; i++) {
    const t = 0.16 + 0.8 * (i / nb) + (r() - 0.5) * 0.03, a = trunkAt(t), az = r() * 6.283, el = 0.22 + r() * 0.3;
    const L = env(t) * (0.9 + r() * 0.5) / Math.sin(el) * 0.85; const d = new V3(Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az));
    const b = a.clone().addScaledVector(d, Math.min(L, 4)); limb(bark, a, b, 0.05 * (1 - t) + 0.018, 0.008, 4, bt);
  }
  const NL = 420;
  for (let i = 0; i < NL; i++) {
    const t = 0.14 + Math.pow(r(), 0.85) * 0.86, c = trunkAt(t), e = env(t), az = r() * 6.283, dd = e * (0.35 + 0.65 * Math.sqrt(r()));
    const p = new V3(c.x + Math.cos(az) * dd, c.y + (r() - 0.5) * 0.6, c.z + Math.sin(az) * dd);
    const v = (0.5 + 0.5 * dd / e) * (0.75 + 0.35 * t);
    card(leaf, p, (1.25 + r() * 0.6) * (1 - 0.3 * t), r, shade(v), { c: new V3(c.x, 0, c.z), axis: true, k: 0.82, up: 0.3 }, Math.PI / 2 - az);
  }
  return { parts: [[M.bark, bark.build()], [M.leafPoplar, leaf.build()]], col: 0.3, h: H };
}
// ---------- лиственное полуголое дерево (вяз/ива) ----------
function makeTree(seed, leafMat, leafAmt, o = {}) {
  const r = rng(seed), bark = new Bag(), leaf = new Bag(), bt0 = o.bt || [0.75, 0.72, 0.68], wash = o.wash || 0;
  const bt = wash ? (p) => (p.y < wash + Math.sin(Math.atan2(p.z, p.x) * 4) * 0.05 ? [3.0, 3.0, 2.85] : bt0) : bt0;
  const tips = [];
  function grow(p, d, len, rad, depth) {
    let cur = p.clone(), dd = d.clone(); const segs = depth > 2 ? 3 : 2;
    for (let s = 0; s < segs; s++) {
      dd.add(new V3((r() - 0.5) * 0.35, (r() - 0.35) * 0.2 - (depth < 2 ? 0.08 : 0), (r() - 0.5) * 0.35)).normalize();
      const nx = cur.clone().addScaledVector(dd, len / segs); limb(bark, cur, nx, rad * (1 - s / segs * 0.35), rad * (1 - (s + 1) / segs * 0.35), depth > 3 ? 8 : depth > 1 ? 5 : 3, bt); cur = nx;
    }
    if (depth === 0 || rad < 0.012) { tips.push([cur, dd]); return; }
    const n = depth > 3 ? 2 + (r() < 0.5 ? 1 : 0) : 2 + (r() < 0.6 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const ax = new V3().crossVectors(dd, new V3(r() - 0.5, r() - 0.5, r() - 0.5)).normalize(), ang = 0.35 + r() * 0.55;
      const nd = dd.clone().applyAxisAngle(ax, ang * (o.spread || 1)); nd.y = lerp(nd.y, Math.abs(nd.y), o.upk ?? 0.5); nd.normalize();
      grow(cur, nd, len * (0.66 + r() * 0.16), rad * (0.6 + r() * 0.08), depth - 1);
    }
  }
  const R0r = o.rad || (0.26 + r() * 0.08);
  grow(new V3(0, 0, 0), new V3((r() - 0.5) * 0.15, 1, (r() - 0.5) * 0.15).normalize(), o.len || (2.6 + r() * 1.4), R0r, o.depth || 5);
  limb(bark, new V3(0, -0.3, 0), new V3(0, 0.4, 0), R0r * 1.5, R0r, 8, bt);
  let top = 0; for (const [p] of tips) top = Math.max(top, p.y);
  const cen = new V3(0, top * 0.62, 0);
  for (const [p, d] of tips) { // тонкие прутья на концах
    limb(bark, p, p.clone().addScaledVector(d, 0.6 + r() * 0.6).add(new V3(0, -0.15, 0)), 0.01, 0.003, 3, bt);
    if (r() < leafAmt) for (let k = 0; k < (o.cards || 1) + (r() * 3 | 0); k++) card(leaf, p.clone().add(new V3((r() - 0.5) * 0.9, (r() - 0.6) * 0.8, (r() - 0.5) * 0.9)), (o.cs || 1) * (0.9 + r() * 0.6), r, shade(0.6 + r() * 0.45), { c: cen, k: 0.7, up: 0.2, ys: 0.7 });
  }
  if (o.fruit) { // плоды прямо в кроне (декор)
    const fb = new Bag(), sp = new THREE.SphereGeometry(1, 8, 6);
    for (const [p] of tips) if (r() < o.fruit) { _m.compose(p.clone().add(new V3((r() - 0.5) * 0.6, -0.2 - r() * 0.3, (r() - 0.5) * 0.6)), _q.identity(), new V3(o.fr, o.fr * 1.05, o.fr)); fb.add(sp, _m, o.fc(r)); }
    const g = fb.build(); if (g) return { parts: [[M.bark, bark.build()], [leafMat, leaf.build()], [M.fruit, g]].filter((x) => x[1]), col: 0.22, h: top };
  }
  return { parts: [[M.bark, bark.build()], [leafMat, leaf.build()]].filter((x) => x[1]), col: 0.28, h: top };
}
// ---------- малинник: пучок тонких дуговых стеблей с листьями ----------
function makeRasp(seed) {
  const r = rng(seed), bark = new Bag(), leaf = new Bag(), bt = [0.62, 0.45, 0.38], cen = new V3(0, 0.8, 0);
  for (let i = 0; i < 34; i++) {
    const a = new V3((r() - 0.5) * 1.6, 0, (r() - 0.5) * 1.2), az = r() * 6.28, el = 0.05 + r() * 0.35, L = 1.1 + r() * 0.8;
    let p = a, d = new V3(Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az));
    for (let s = 0; s < 4; s++) { d.add(new V3(Math.cos(az) * 0.12, -0.09 * s, Math.sin(az) * 0.12)).normalize(); const nx = p.clone().addScaledVector(d, L / 4); limb(bark, p, nx, 0.009, 0.006, 3, bt);
      if (s >= 1 && r() < 0.8) card(leaf, nx.clone().add(new V3((r() - 0.5) * 0.2, -0.05, (r() - 0.5) * 0.2)), 0.38 + r() * 0.2, r, shade(0.5 + 0.35 * r()), { c: cen, k: 0.6, up: 0.4 }); p = nx; }
  }
  return { parts: [[M.bark, bark.build()], [M.leafOlive, leaf.build()]], col: 0, h: 1.6 };
}
// ---------- большой осенний куст (как на фото) ----------
function makeShrub(seed, leafMat, size) {
  const r = rng(seed), bark = new Bag(), leaf = new Bag(), bt = [0.7, 0.66, 0.6];
  const S = size * (0.85 + r() * 0.35), ns = 16 + (r() * 10 | 0), cen = new V3(0, S * 0.55, 0);
  for (let i = 0; i < ns; i++) {
    const az = r() * 6.283, el = 0.15 + r() * 0.75, L = S * (0.7 + r() * 0.5);
    let p = new V3(Math.cos(az) * r() * 0.35, -0.05, Math.sin(az) * r() * 0.35), d = new V3(Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az));
    const rad0 = 0.03 + r() * 0.02;
    for (let s = 0; s < 4; s++) {
      d.add(new V3(Math.cos(az) * 0.12, -0.05 * s, Math.sin(az) * 0.12)).add(new V3((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2)).normalize();
      const nx = p.clone().addScaledVector(d, L / 4); limb(bark, p, nx, rad0 * (1 - s * 0.22), rad0 * (1 - (s + 1) * 0.22), 3, bt);
      if (s >= 1) {
        for (let k = 0; k < 2; k++) { const sd = d.clone().applyAxisAngle(new V3(r() - 0.5, 0, r() - 0.5).normalize(), 0.5 + r() * 0.6); const tw = nx.clone().addScaledVector(sd, L * (0.15 + r() * 0.2)); limb(bark, nx, tw, 0.008, 0.003, 3, bt);
          for (let j = 0; j < 3; j++) card(leaf, tw.clone().lerp(nx, r() * 0.7).add(new V3((r() - 0.5) * 0.35, (r() - 0.5) * 0.3, (r() - 0.5) * 0.35)), 0.55 + r() * 0.45, r, shade(0.55 + 0.45 * clamp(nx.y / S, 0, 1) + r() * 0.12), { c: cen, k: 0.75, up: 0.25, ys: 0.8 }); }
      }
      p = nx;
    }
  }
  return { parts: [[M.bark, bark.build()], [leafMat, leaf.build()]], col: 0, h: S };
}
// ---------- голый прутняк (пучок прямых веток) ----------
function makeSticks(seed) {
  const r = rng(seed), bark = new Bag(), leaf = new Bag(), bt = [0.62, 0.55, 0.48];
  const n = 26 + (r() * 14 | 0), S = 1.3 + r() * 0.7;
  for (let i = 0; i < n; i++) { const az = r() * 6.283, el = r() * 0.42, L = S * (0.6 + r() * 0.5); const a = new V3(Math.cos(az) * 0.08, 0, Math.sin(az) * 0.08); const b = a.clone().add(new V3(Math.sin(el) * Math.cos(az) * L, Math.cos(el) * L, Math.sin(el) * Math.sin(az) * L)); limb(bark, a, b, 0.011, 0.004, 3, bt);
    if (r() < 0.12) card(leaf, b.clone().add(new V3(0, -0.15, 0)), 0.3 + r() * 0.2, r, shade(0.9)); }
  return { parts: [[M.bark, bark.build()], [M.leafAutumn, leaf.build()]].filter((x) => x[1]), col: 0, h: S };
}
// Прототипы (строятся один раз, порциями, чтобы не подвешивать загрузку)
const PROTO = {};
const appleCol = (r) => { const t = r(); return t < 0.6 ? lin([0.62 + r() * 0.15, 0.12 + r() * 0.1, 0.07]) : t < 0.85 ? lin([0.75, 0.55, 0.15]) : lin([0.55, 0.62, 0.2]); };
const PROTO_JOBS = (INDOOR || STROY) ? [] : GARDEN ? [
  ['apple0', () => makeTree(201, M.leafOlive, 0.85, { len: 1.3, rad: 0.15, depth: 5, spread: 1.35, upk: 0.25, wash: 0.9, cards: 2, cs: 0.75, fruit: 0.45, fr: 0.045, fc: appleCol, bt: [0.6, 0.56, 0.5] })],
  ['apple1', () => makeTree(223, M.leafOlive, 0.75, { len: 1.1, rad: 0.13, depth: 5, spread: 1.5, upk: 0.2, wash: 0.8, cards: 2, cs: 0.7, fruit: 0.4, fr: 0.042, fc: appleCol, bt: [0.6, 0.56, 0.5] })],
  ['apple2', () => makeTree(247, M.leafAutumn, 0.6, { len: 1.4, rad: 0.16, depth: 5, spread: 1.3, upk: 0.3, wash: 1.0, cards: 2, cs: 0.75, fruit: 0.3, fr: 0.045, fc: appleCol, bt: [0.6, 0.56, 0.5] })],
  ['pear0', () => makeTree(263, M.leafAutumn, 0.7, { len: 2.2, rad: 0.17, depth: 5, spread: 0.85, upk: 0.65, wash: 1.0, cards: 2, cs: 0.7, fruit: 0.3, fr: 0.05, fc: (r) => lin([0.68, 0.64, 0.25 + r() * 0.1]), bt: [0.5, 0.47, 0.43] })],
  ['plum0', () => makeTree(281, M.leafOlive, 0.7, { len: 1.2, rad: 0.1, depth: 4, spread: 1.1, upk: 0.45, cards: 2, cs: 0.6, fruit: 0.35, fr: 0.03, fc: () => lin([0.24, 0.12, 0.3]), bt: [0.45, 0.38, 0.36] })],
  ['rasp0', () => makeRasp(301)], ['rasp1', () => makeRasp(317)],
  ['poplar0', () => makePoplar(11)], ['poplar1', () => makePoplar(23)],
  ['elm0', () => makeTree(51, M.leafAutumn, 0.45)], ['elm1', () => makeTree(67, M.leafAutumn, 0.2)],
  ['shrubY0', () => makeShrub(101, M.leafAutumn, 3.2)], ['shrubG0', () => makeShrub(127, M.leafOlive, 2.8)], ['shrubG1', () => makeShrub(139, M.leafOlive, 2.0)],
  ['sticks0', () => makeSticks(151)], ['sticks1', () => makeSticks(163)],
] : [
  ['poplar0', () => makePoplar(11)], ['poplar1', () => makePoplar(23)], ['poplar2', () => makePoplar(37)],
  ['elm0', () => makeTree(51, M.leafAutumn, 0.45)], ['elm1', () => makeTree(67, M.leafAutumn, 0.2)], ['elm2', () => makeTree(83, M.leafOlive, 0.65)],
  ['shrubY0', () => makeShrub(101, M.leafAutumn, 3.2)], ['shrubY1', () => makeShrub(113, M.leafAutumn, 2.4)], ['shrubG0', () => makeShrub(127, M.leafOlive, 2.8)], ['shrubG1', () => makeShrub(139, M.leafOlive, 2.0)],
  ['sticks0', () => makeSticks(151)], ['sticks1', () => makeSticks(163)],
];
