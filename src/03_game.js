// ============================================================
//  ЧАСТЬ 3. Чанки, рендер, игрок, звук, интерфейс
// ============================================================
const $ = (id) => document.getElementById(id);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
let VIEW_R = 3;

// ---------------- Цвета земли ----------------
const cGreen = [0.31, 0.34, 0.2], cDry = [0.46, 0.42, 0.27], cLitter = [0.33, 0.24, 0.15], cOrange = [0.45, 0.31, 0.17];
const cGravel = [0.42, 0.4, 0.37], cWet = [0.24, 0.23, 0.2], cSand = [0.48, 0.45, 0.37], cRock = [0.36, 0.35, 0.34];
const cSnow = [0.74, 0.76, 0.78], cDirt = [0.3, 0.25, 0.19], cDeep = [0.1, 0.12, 0.11], cDebris = [0.3, 0.25, 0.19];

function terrainColor(x, z, h, grad, o) {
  const n1 = fbm(x * 0.09, z * 0.09, 2, 61), n2 = fbm(x * 0.025 + 3, z * 0.025, 2, 62), n3 = vnoise(x * 0.8, z * 0.8, 63);
  let c = mixc(cGreen, cDry, smooth(-0.35, 0.35, n1 + 0.3 * n2));
  const f = forestAt(x, z, h);
  c = mixc(c, mixc(cLitter, cOrange, smooth(-0.2, 0.6, n1)), clamp(0.06 + f * 0.6 + 0.18 * n2, 0, 0.9));
  const beach = 1 - smooth(0.9, 2.5, h + n1 * 0.6);
  if (beach > 0) {
    let b = mixc(cGravel, cSand, smooth(-0.2, 0.5, n2));
    b = mixc(b, cDebris, smooth(0.15, 0.75, n3 + n1 * 0.3) * 0.55);
    b = mixc(cWet, b, smooth(-0.1, 0.4, h));
    c = mixc(c, b, beach);
  }
  if (h < -0.1) c = mixc(c, mixc(cWet, cDeep, smooth(-0.3, -7, h)), smooth(0.1, -0.35, h));
  const rock = Math.max(smooth(0.55, 1.0, grad), smooth(55, 88, h + 10 * n2));
  if (rock > 0) c = mixc(c, mixc(cRock, [0.40, 0.38, 0.36], smooth(-0.3, 0.5, n3)), rock);
  const snow = smooth(125, 160, h + 9 * n2 - grad * 14);
  if (snow > 0) c = mixc(c, cSnow, snow);
  const vs = villagesNear(x, z, 50);
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i], dx = x - v.x, dz = z - v.z, ca = Math.cos(v.ang), sa = Math.sin(v.ang);
    const al = dx * ca + dz * sa, pe = -dx * sa + dz * ca, d = Math.hypot(dx, dz);
    let t = 0;
    if (Math.abs(al) < 36) t = 1 - smooth(1.8, 3.4, Math.abs(pe));
    t = Math.max(t, 1 - smooth(5, 9, d), 0.28 * (1 - smooth(22, 38, d)));
    if (t > 0) c = mixc(c, mixc(cDirt, cGravel, smooth(-0.3, 0.6, n3) * 0.4), t * (h > 0 ? 1 : 0));
  }
  const sh = 1 - 0.13 * f;
  o[0] = c[0] * sh; o[1] = c[1] * sh; o[2] = c[2] * sh;
}

// ---------------- Chunk ----------------
const chunks = new Map();
const ckey = (cx, cz) => cx + ',' + cz;
const TMP = [0, 0, 0];

function itemsForChunk(cx, cz) {
  const x0 = cx * CH, z0 = cz * CH, x1 = x0 + CH, z1 = z0 + CH, out = [];
  const inChunk = (it) => it.x >= x0 && it.x < x1 && it.z >= z0 && it.z < z1;
  for (const it of CAMP_ITEMS) if (inChunk(it)) out.push(it);
  const vs = villagesNear((x0 + x1) / 2, (z0 + z1) / 2, CH * 0.75 + 45);
  for (const v of vs) for (const it of layoutOf(v)) if (inChunk(it)) out.push(it);
  return out;
}
function blocked(x, z) {
  if (Math.hypot(x - CAMP.x, z - CAMP.z) < 15) return true;
  return villagesNear(x, z, 46).length > 0;
}

function buildChunk(cx, cz) {
  const x0 = cx * CH, z0 = cz * CH, G = SEG + 3;
  const Hg = new Float32Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) Hg[j * G + i] = heightAt(x0 + (i - 1) * CELL, z0 + (j - 1) * CELL);
  const hv = (i, j) => Hg[(j + 1) * G + i + 1];
  const gridH = (x, z) => {
    const fx = (x - x0) / CELL, fz = (z - z0) / CELL;
    const i = clamp(Math.floor(fx), -1, SEG), j = clamp(Math.floor(fz), -1, SEG), tx = fx - i, tz = fz - j;
    return lerp(lerp(hv(i, j), hv(i + 1, j), tx), lerp(hv(i, j + 1), hv(i + 1, j + 1), tx), tz);
  };
  const gridGrad = (x, z) => { const e = 1.2; return Math.hypot(gridH(x + e, z) - gridH(x - e, z), gridH(x, z + e) - gridH(x, z - e)) / (2 * e); };

  // ---- рельеф ----
  const NV = (SEG + 1) * (SEG + 1);
  const pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), col = new Float32Array(NV * 3), uv = new Float32Array(NV * 2);
  let k = 0;
  for (let j = 0; j <= SEG; j++) for (let i = 0; i <= SEG; i++, k++) {
    const x = x0 + i * CELL, z = z0 + j * CELL, h = hv(i, j);
    const gx = (hv(i + 1, j) - hv(i - 1, j)) / (2 * CELL), gz = (hv(i, j + 1) - hv(i, j - 1)) / (2 * CELL);
    const il = 1 / Math.hypot(gx, 1, gz);
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    nor[k * 3] = -gx * il; nor[k * 3 + 1] = il; nor[k * 3 + 2] = -gz * il;
    terrainColor(x, z, h, Math.hypot(gx, gz), TMP);
    col[k * 3] = lin(TMP[0]); col[k * 3 + 1] = lin(TMP[1]); col[k * 3 + 2] = lin(TMP[2]);
    uv[k * 2] = x / 4.5; uv[k * 2 + 1] = z / 4.5;
  }
  const idx = new Uint16Array(SEG * SEG * 6);
  let q = 0;
  for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  tg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  tg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  tg.setIndex(new THREE.BufferAttribute(idx, 1));
  tg.computeBoundingSphere();
  const terrain = new THREE.Mesh(tg, MAT.terrain);

  // ---- декор ----
  const rng = mulberry32((hash2(cx, cz, 777) * 4294967296) >>> 0);
  const B = new MB(), GB = new MB(), circ = [], boxes = [];
  const notes = [];
  const ctx = { rng, circ, boxes, notes };
  const R = (a, b) => a + (b - a) * rng();

  // структуры (лагерь, деревни)
  for (const it of itemsForChunk(cx, cz)) {
    if (it.fn) it.fn(B, ctx);
    else if (it.kind === 'house') emitHouse(B, ctx, it);
    else if (it.kind === 'chapel') emitChapel(B, ctx, it);
    else if (it.kind === 'well') emitWell(B, ctx, it);
    else if (it.kind === 'hay') emitHay(B, ctx, it);
    else if (it.kind === 'wood') emitWood(B, ctx, it);
    else if (it.kind === 'fence') emitFence(B, ctx, it);
    else if (it.kind === 'tree') emitTree(B, ctx, it);
    else if (it.kind === 'paper') emitPaperItem(B, ctx, it);
  }

  // одиночные находки в глуши: брошенные палатки, туры, вешки
  if (hash2(cx, cz, 555) < 0.3) {
    for (let tries = 0; tries < 6; tries++) {
      const x = x0 + 8 + rng() * (CH - 16), z = z0 + 8 + rng() * (CH - 16), h = gridH(x, z);
      if (h < 3 || h > 110 || gridGrad(x, z) > 0.4 || blocked(x, z)) continue;
      const kind = rng();
      if (kind < 0.45) emitTent(B, ctx, x, h, z, rng() * TAU, jit(rng() < 0.5 ? [0.5, 0.3, 0.12] : [0.2, 0.28, 0.36], 0.15, rng), rng() < 0.6 ? 1 + ((rng() * 10) | 0) : 0);
      else if (kind < 0.75) { emitCairn(B, ctx, x, h, z, rng); if (rng() < 0.3) paper(B, ctx, x + 0.9, gridH(x + 0.9, z), z, rng() * 3, 1 + ((rng() * 10) | 0)); }
      else emitPost(B, ctx, x, h, z, rng);
      break;
    }
  }
  // деревья
  const TC = 6.4;
  for (let gj = 0; gj < 10; gj++) for (let gi = 0; gi < 10; gi++) {
    const x = x0 + (gi + rng()) * TC, z = z0 + (gj + rng()) * TC;
    const h = gridH(x, z);
    const roll = rng(), tp = rng();
    if (h < 1.0) continue;
    const f = forestAt(x, z, h);
    if (roll > f * 0.92) continue;
    if (blocked(x, z)) continue;
    if (gridGrad(x, z) > 1.0) continue;
    const sc = 0.85 + rng() * 0.5;
    const hi = smooth(45, 85, h);
    if (tp < 0.58) treeDead(B, circ, rng, x, h, z, sc);
    else if (tp < 0.7 + hi * 0.25) treeSpruce(B, circ, rng, x, h, z, sc);
    else if (tp < 0.86) treeBirch(B, circ, rng, x, h, z, sc);
    else treeBroad(B, circ, rng, x, h, z, sc);
  }
  // кусты и камни
  for (let gj = 0; gj < 20; gj++) for (let gi = 0; gi < 20; gi++) {
    const x = x0 + (gi + rng()) * 3.2, z = z0 + (gj + rng()) * 3.2, h = gridH(x, z), r1 = rng(), r2 = rng();
    if (blocked(x, z) || h < 1.6) continue;
    const f = forestAt(x, z, h), g = gridGrad(x, z);
    if (r1 < 0.07 + f * 0.2 && h < 80) {
      bareBush(B, rng, x, h, z, R(0.8, 1.5));
    } else if (r2 < 0.02 + smooth(0.5, 1.1, g) * 0.15 + smooth(60, 100, h) * 0.08) {
      const s = R(0.5, 1.8), gr = R(0.42, 0.56);
      B.blob(x, h + s * 0.25, z, s, s * 0.7, s * R(0.8, 1.2), [gr, gr * 0.97, gr * 0.93], rng, 0.28, 0.12);
      if (s > 1.0) circ.push([x, z, s * 0.8]);
    }
  }
  // пляж: камни, коряги, плавник
  for (let gj = 0; gj < 26; gj++) for (let gi = 0; gi < 26; gi++) {
    const x = x0 + (gi + rng()) * 2.5, z = z0 + (gj + rng()) * 2.5, h = gridH(x, z), r1 = rng(), r2 = rng();
    if (h < -0.35 || h > 2.2) continue;
    if (r1 < 0.2) { const s = R(0.08, 0.3); const gr = R(0.35, 0.6); B.blob(x, h + s * 0.2, z, s, s * 0.6, s * R(0.8, 1.3), [gr, gr * 0.96, gr * 0.9], rng, 0.3, 0.15); }
    else if (r2 < 0.2 && h > 0.0) {
      const a = rng() * TAU, L = R(0.5, 2.6), r = R(0.015, 0.05), c = jit(rng() < 0.5 ? WOOD_GRAY : [0.38, 0.28, 0.2], 0.2, rng);
      B.limb(x, h + r + 0.02, z, x + Math.cos(a) * L, h + r + 0.04 + rng() * 0.15, z + Math.sin(a) * L, r, r * 0.7, c, 4, false, false);
      if (rng() < 0.4) { const a2 = a + R(0.5, 1.3), L2 = L * 0.5; B.limb(x + Math.cos(a) * L * 0.4, h + r + 0.05, z + Math.sin(a) * L * 0.4, x + Math.cos(a) * L * 0.4 + Math.cos(a2) * L2, h + r + 0.15, z + Math.sin(a) * L * 0.4 + Math.sin(a2) * L2, r * 0.6, r * 0.3, c, 3, false, false); }
    } else if (r2 > 0.992 && h > 0.2) { // большая коряга
      const a = rng() * TAU, L = R(2.5, 4.5);
      B.limb(x, h + 0.25, z, x + Math.cos(a) * L, h + 0.3, z + Math.sin(a) * L, 0.22, 0.14, WOOD_GRAY, 6, true, true);
      for (let t = 0; t < 3; t++) B.limb(x + Math.cos(a) * L * 0.2, h + 0.3, z + Math.sin(a) * L * 0.2, x + R(-1, 1), h + R(0.5, 1.3), z + R(-1, 1), 0.07, 0.02, WOOD_GRAY, 4, false, false);
    }
  }
  // лесной мусор: ветки и брёвна
  for (let n = 0; n < 14; n++) {
    const x = x0 + rng() * CH, z = z0 + rng() * CH, h = gridH(x, z), f = forestAt(x, z, h);
    if (h < 1.2 || blocked(x, z) || rng() > f + 0.1) continue;
    const a = rng() * TAU, L = R(1.0, 3.5), r = R(0.03, 0.09);
    const c = jit(rng() < 0.6 ? [0.34, 0.26, 0.18] : WOOD_GRAY, 0.2, rng);
    B.limb(x, h + r, z, x + Math.cos(a) * L, gridH(x + Math.cos(a) * L, z + Math.sin(a) * L) + r, z + Math.sin(a) * L, r, r * 0.8, c, 5, true, true);
  }
  for (let n = 0; n < 2; n++) { // упавшие стволы
    const x = x0 + rng() * CH, z = z0 + rng() * CH, h = gridH(x, z), f = forestAt(x, z, h);
    if (rng() > f * 1.3 || h < 1.5 || blocked(x, z)) continue;
    const a = rng() * TAU, L = R(4, 8), ex = x + Math.cos(a) * L, ez = z + Math.sin(a) * L;
    B.limb(x, h + 0.25, z, ex, gridH(ex, ez) + 0.3, ez, 0.22, 0.12, jit(WOOD_GRAY, 0.2, rng), 6, true, true);
  }

  // ---- трава, листья, камыш (отдельная "мелкая" сетка, видна вблизи) ----
  for (let gj = 0; gj < 42; gj++) for (let gi = 0; gi < 42; gi++) {
    const x = x0 + (gi + rng()) * 1.52, z = z0 + (gj + rng()) * 1.52;
    const h = gridH(x, z), r1 = rng(), r2 = rng(), r3 = rng();
    if (h < -0.9 || h > 95) continue;
    if (h < 0.55) { // камыш у воды
      if (h > -0.9 && r1 < 0.12) {
        for (let b = 0; b < 4; b++) {
          const bx = x + R(-0.3, 0.3), bz = z + R(-0.3, 0.3), H = R(1.2, 2.1), lx = R(-0.4, 0.4), lz = R(-0.4, 0.4);
          GB.tg([bx - 0.04, h, bz], [bx + 0.04, h, bz], [bx + lx, h + H, bz + lz], [0.45, 0.4, 0.2], [0.45, 0.4, 0.2], [0.8, 0.7, 0.4]);
        }
      }
      continue;
    }
    if (blocked(x, z) && villagesNear(x, z, 46).length) { if (r1 > 0.12) continue; }
    const f = forestAt(x, z, h), g = gridGrad(x, z);
    if (g > 1.1) continue;
    const meadow = 1 - f;
    if (r1 < 0.5 + meadow * 0.2 && h > 0.9) { // пучок травы
      const nb = 5 + ((r2 * 4) | 0), gold = rng() < 0.5;
      const bc = gold ? [0.4, 0.35, 0.2] : [0.28, 0.32, 0.17], tc = gold ? [0.64, 0.58, 0.36] : [0.46, 0.46, 0.26];
      for (let b = 0; b < nb; b++) {
        const bx = x + R(-0.3, 0.3), bz = z + R(-0.3, 0.3), H = R(0.25, 0.7) * (0.7 + meadow * 0.5), a = rng() * TAU, w = R(0.04, 0.07);
        const ca = Math.cos(a), sa = Math.sin(a), lean = R(0.05, 0.3);
        GB.tg([bx - sa * w, h - 0.02, bz + ca * w], [bx + sa * w, h - 0.02, bz - ca * w], [bx + ca * lean, h + H, bz + sa * lean], jit(bc, 0.2, rng), jit(bc, 0.2, rng), jit(tc, 0.15, rng));
      }
    }
    if (r3 < 0.5 + f * 0.4 && h > 0.5) { // опавшие листья
      const c = rng() < 0.5 ? jit(FOLIAGE[(rng() * FOLIAGE.length) | 0], 0.15, rng) : jit([0.34, 0.25, 0.15], 0.25, rng);
      GB.quadUp(x + R(-0.5, 0.5), h + 0.025, z + R(-0.5, 0.5), R(0.07, 0.15), rng() * TAU, c);
      if (rng() < 0.8) GB.quadUp(x + R(-0.5, 0.5), h + 0.025, z + R(-0.5, 0.5), R(0.07, 0.15), rng() * TAU, jit(FOLIAGE[(rng() * FOLIAGE.length) | 0], 0.15, rng));
    }
    if (f > 0.35 && rng() < 0.012) { // грибы
      const px = x, pz = z;
      GB.tg([px - 0.02, h, pz], [px + 0.02, h, pz], [px, h + 0.12, pz], [0.85, 0.82, 0.7], [0.85, 0.82, 0.7], [0.85, 0.82, 0.7]);
      const cc = rng() < 0.5 ? [0.75, 0.15, 0.1] : [0.6, 0.38, 0.2];
      GB.tg([px - 0.08, h + 0.1, pz], [px + 0.08, h + 0.1, pz], [px, h + 0.17, pz + 0.02], cc, cc, cc);
      GB.tg([px, h + 0.1, pz - 0.08], [px, h + 0.1, pz + 0.08], [px + 0.02, h + 0.17, pz], cc, cc, cc);
    }
  }

  const mk = (b, mat) => {
    if (!b.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
    if (mat === MAT.deco) g.computeVertexNormals();
    else { // трава: нормаль вверх, чтобы освещалась мягко
      const n = new Float32Array(b.p.length); for (let i = 1; i < n.length; i += 3) n[i] = 1;
      g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    }
    g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  };
  const deco = mk(B, MAT.deco), grass = mk(GB, MAT.grass);
  terrain.receiveShadow = true;
  if (deco) { deco.castShadow = true; deco.receiveShadow = true; }
  if (grass) grass.receiveShadow = true;
  for (const m of [terrain, deco, grass]) if (m) scene.add(m);
  return { cx, cz, terrain, deco, grass, circ, boxes, notes };
}

function disposeChunk(ch) {
  for (const m of [ch.terrain, ch.deco, ch.grass]) if (m) { scene.remove(m); m.geometry.dispose(); }
}

// ---------------- Three.js сцена ----------------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 1.75));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.15, 1800);
camera.rotation.order = 'YXZ';
scene.add(camera);
const fogColor = new THREE.Color(0.7, 0.72, 0.72);
scene.fog = new THREE.FogExp2(fogColor, 0.01);
scene.background = fogColor;

const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x6b5a3a, 2.2);
const sun = new THREE.DirectionalLight(0xfff0d0, 2.4);
scene.add(hemi, sun, sun.target);

// детальная текстура земли (листья/трава)
function makeDetailTex() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), r = mulberry32(99);
  g.fillStyle = '#c9c3b4'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5000; i++) { g.globalAlpha = 0.12; g.fillStyle = r() < 0.5 ? '#3d3426' : '#e8e0cc'; g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
  const cols = ['#8a6f45', '#6e5436', '#a38a5a', '#5c4a30', '#9b9272', '#7b6a45', '#b3a06f', '#4e4030', '#6d6a4a', '#8d5f34'];
  const leaf = (x, y) => {
    g.save(); g.translate(x, y); g.rotate(r() * 6.28);
    const L = 5 + r() * 10, W = L * (0.35 + r() * 0.2);
    g.globalAlpha = 0.5 + r() * 0.4; g.fillStyle = cols[(r() * cols.length) | 0];
    g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -W, L, 0); g.quadraticCurveTo(0, W, -L, 0); g.fill();
    g.globalAlpha *= 0.55; g.strokeStyle = '#2e251a'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L * 0.9, 0); g.stroke();
    g.restore();
  };
  for (let i = 0; i < 1700; i++) { const x = r() * S, y = r() * S; leaf(x, y); if (x < 16) leaf(x + S, y); if (y < 16) leaf(x, y + S); if (x < 16 && y < 16) leaf(x + S, y + S); }
  g.strokeStyle = '#2f261c'; g.lineCap = 'round';
  for (let i = 0; i < 160; i++) { const x = r() * S, y = r() * S, a = r() * 6.28, l = 10 + r() * 34; g.globalAlpha = 0.35 + r() * 0.3; g.lineWidth = 0.8 + r() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.fillStyle = '#6b7050'; for (let i = 0; i < 50; i++) { g.globalAlpha = 0.25; g.beginPath(); g.ellipse(r() * S, r() * S, 2 + r() * 6, 1 + r() * 3, r() * 6, 0, 6.28); g.fill(); }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
const texLoader = new THREE.TextureLoader();
function loadTex(src, srgb) {
  const t = texLoader.load(src); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TX = { leaves: loadTex(TEXDATA.leaves, true), leavesN: loadTex(TEXDATA.leavesN, false), bark: loadTex(TEXDATA.bark, true), barkN: loadTex(TEXDATA.barkN, false) };
// земля: сканированная лесная подстилка + карта нормалей; на скалах/снегу/пляже текстура становится серой «фактурой»
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: TX.leaves, normalMap: TX.leavesN, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.95, metalness: 0 });
terrainMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP2; varying vec3 vWN2;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP2=(modelMatrix*vec4(transformed,1.0)).xyz; vWN2=normal;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP2; varying vec3 vWN2;')
    .replace('#include <map_fragment>', `
      vec4 tC = texture2D(map, vMapUv);
      vec4 tF = texture2D(map, vMapUv * 0.21 + 0.37);           // второй масштаб убирает повторяемость
      vec3 tx = mix(tC.rgb, tF.rgb, 0.35);
      float lum = dot(tx, vec3(0.2126, 0.7152, 0.0722));
      float leafy = smoothstep(0.8, 2.2, vWP2.y) * (1.0 - smoothstep(60.0, 90.0, vWP2.y)) * smoothstep(0.55, 0.85, normalize(vWN2).y);
      vec3 gray = vec3(lum / 0.17);
      vec3 col = tx / vec3(0.25, 0.16, 0.06) * 0.62;
      diffuseColor.rgb *= mix(gray, mix(gray, col, 0.75), leafy);
    `);
};
// кора/дерево: трипланарная проекция по миру (без UV)
const decoMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
decoMat.color.setScalar(0.62);
decoMat.onBeforeCompile = (sh) => {
  sh.uniforms.tBark = { value: TX.bark };
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP2; varying vec3 vWN2;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP2=(modelMatrix*vec4(transformed,1.0)).xyz; vWN2=normal;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tBark; varying vec3 vWP2; varying vec3 vWN2;')
    .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 bw = pow(abs(normalize(vWN2)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
      vec3 tb = texture2D(tBark, vWP2.zy * vec2(0.9, 0.45)).rgb * bw.x + texture2D(tBark, vWP2.xz * 0.6).rgb * bw.y + texture2D(tBark, vWP2.xy * vec2(0.9, 0.45)).rgb * bw.z;
      float l = dot(tb, vec3(0.2126, 0.7152, 0.0722)) / 0.19;
      diffuseColor.rgb *= mix(1.0, l, 0.85);
    `);
};
const MAT = {
  terrain: terrainMat,
  deco: decoMat,
  grass: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1, metalness: 0 }),
};
MAT.grass.color.setScalar(0.8);
MAT.grass.onBeforeCompile = (sh) => { // нормаль травы всегда вверх (без чёрной изнанки)
  sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);');
};
const SHADOWS = !isTouch;
if (SHADOWS) {
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 1; sc.far = 450;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
}

// ---------------- Небо ----------------
const skyU = { horizon: { value: new THREE.Color() }, zenith: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, night: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vDir; void main(){ vDir=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; gl_Position.z*=0.9999; }',
  fragmentShader: `varying vec3 vDir; uniform vec3 horizon,zenith,sunDir,sunCol; uniform float night;
    float hs(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
    void main(){ vec3 d=normalize(vDir); float h=clamp(d.y,0.0,1.0);
      vec3 col=mix(horizon,zenith,pow(h,0.55));
      float s=max(dot(d,sunDir),0.0);
      col+=sunCol*(pow(s,6.0)*0.22+pow(s,180.0)*1.4);
      float st=step(0.9975,hs(floor(d*260.0)))*night*smoothstep(0.05,0.3,d.y);
      col+=vec3(st);
      gl_FragColor=vec4(col,1.0); gl_FragColor=linearToOutputTexel(gl_FragColor); }`,
}));
sky.frustumCulled = false; sky.renderOrder = -10;
scene.add(sky);

// ---------------- Вода ----------------
const waterU = { uTime: { value: 0 }, uFog: { value: fogColor }, uDen: { value: 0.01 }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSky: { value: new THREE.Color() }, uZen: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() } };
const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
  uniforms: waterU, transparent: true, depthWrite: false,
  vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader: `varying vec3 vW; uniform float uTime,uDen; uniform vec3 uFog,uSunDir,uSky,uZen,uSunCol;
    void main(){
      vec2 p=vW.xz; float t=uTime;
      vec2 g=vec2(0.0);
      g+=vec2(0.9,0.4)*cos(dot(p,vec2(0.9,0.4))*0.55+t*1.1)*0.35;
      g+=vec2(-0.5,0.8)*cos(dot(p,vec2(-0.5,0.8))*0.9+t*1.5)*0.25;
      g+=vec2(0.3,-0.9)*cos(dot(p,vec2(0.3,-0.9))*1.7+t*2.1)*0.14;
      g+=vec2(0.7,0.7)*cos(dot(p,vec2(0.7,0.7))*3.3-t*2.6)*0.07;
      vec3 n=normalize(vec3(-g.x*0.35,1.0,-g.y*0.35));
      vec3 V=normalize(cameraPosition-vW);
      float dist=length(cameraPosition-vW);
      float fr=pow(1.0-max(dot(n,V),0.0),3.0);
      vec3 r=reflect(-V,n);
      vec3 skyc=mix(uSky,uZen,pow(clamp(r.y,0.0,1.0),0.5));
      vec3 deep=vec3(0.035,0.055,0.055)*(0.4+0.8*length(uSky));
      vec3 col=mix(deep,skyc,0.22+0.78*fr);
      float sp=pow(max(dot(r,uSunDir),0.0),90.0);
      col+=uSunCol*sp*0.5;
      float f=1.0-exp(-pow(dist*uDen,2.0));
      col=mix(col,uFog,f);
      float a=mix(0.9+0.1*fr,1.0,f);
      gl_FragColor=vec4(col,a); gl_FragColor=linearToOutputTexel(gl_FragColor); }`,
}));
water.renderOrder = 5; water.frustumCulled = false;
scene.add(water);

// ---------------- Костёр ----------------
const fire = new THREE.Group();
fire.position.set(CAMP.x, CAMP.y + 0.5, CAMP.z);
fire.scale.setScalar(0.6);
const flameMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
const flames = [];
for (const [r, h, c, o] of [[0.42, 1.05, 0xff4a10, 0.7], [0.3, 0.9, 0xff8a1c, 0.75], [0.17, 0.62, 0xffe070, 0.85]]) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 1, true).translate(0, h / 2, 0), flameMat(c, o));
  m.userData = { h, ph: Math.random() * 10 }; fire.add(m); flames.push(m);
}
for (let i = 0; i < 4; i++) { // язычки
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 6, 1, true).translate(0, 0.3, 0), flameMat(0xff7a18, 0.7));
  const a = (i / 4) * TAU; m.position.set(Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28); m.userData = { h: 0.6, ph: Math.random() * 10 };
  fire.add(m); flames.push(m);
}
function glowTex(inner, outer) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,160,60,0.9)', 'rgba(255,120,20,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
glow.scale.set(4.2, 4.2, 1); glow.position.y = 0.6; fire.add(glow);
const fireLight = new THREE.PointLight(0xff8a3c, 30, 34, 1.6);
fireLight.position.y = 1.0; fire.add(fireLight);
scene.add(fire);

// искры
const SP_N = 40, spPos = new Float32Array(SP_N * 3), spCol = new Float32Array(SP_N * 3), spVel = [], spLife = new Float32Array(SP_N);
const spGeo = new THREE.BufferGeometry();
spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
for (let i = 0; i < SP_N; i++) { spVel.push([0, 0, 0]); spLife[i] = Math.random(); }
const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
sparks.frustumCulled = false; scene.add(sparks);
// дым
const smokeTex = glowTex('rgba(160,160,160,0.55)', 'rgba(160,160,160,0)');
const smokes = [];
for (let i = 0; i < 14; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
  s.userData = { t: i / 14 }; scene.add(s); smokes.push(s);
}

// падающие листья
const LF_N = isTouch ? 90 : 180, lfPos = new Float32Array(LF_N * 3), lfCol = new Float32Array(LF_N * 3), lfPh = new Float32Array(LF_N);
{
  const lc = new THREE.Color();
  for (let i = 0; i < LF_N; i++) {
    lfPos[i * 3] = (Math.random() - 0.5) * 36; lfPos[i * 3 + 1] = Math.random() * 14; lfPos[i * 3 + 2] = (Math.random() - 0.5) * 36; lfPh[i] = Math.random() * 10;
    const f = FOLIAGE[(Math.random() * FOLIAGE.length) | 0]; lc.setRGB(f[0], f[1], f[2], THREE.SRGBColorSpace);
    lfCol[i * 3] = lc.r; lfCol[i * 3 + 1] = lc.g; lfCol[i * 3 + 2] = lc.b;
  }
}
const lfGeo = new THREE.BufferGeometry();
lfGeo.setAttribute('position', new THREE.BufferAttribute(lfPos, 3)); lfGeo.setAttribute('color', new THREE.BufferAttribute(lfCol, 3));
const leafTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 13, 7, 0.6, 0, 6.28); g.fill(); const t = new THREE.CanvasTexture(cv); return t; })();
const leaves = new THREE.Points(lfGeo, new THREE.PointsMaterial({ size: 0.17, vertexColors: true, map: leafTex, alphaTest: 0.4, transparent: true }));
leaves.frustumCulled = false; scene.add(leaves);

// фонарик
const torch = new THREE.SpotLight(0xffe6b0, 0, 48, 0.42, 0.65, 1.3);
torch.position.set(0.2, -0.1, 0); camera.add(torch);
const torchT = new THREE.Object3D(); torchT.position.set(0, 0, -5); camera.add(torchT); torch.target = torchT;

// ---------------- Время суток ----------------
let dayT = 0.58, torchOn = false;
const c3 = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
function applyTime() {
  const a = (dayT - 0.25) * TAU, sa = Math.sin(a), ca = Math.cos(a);
  const day = smooth(-0.12, 0.3, sa);
  const warm = Math.exp(-sa * sa * 30) * 0.6;
  const hz = c3(0.54, 0.56, 0.56).lerp(c3(0.012, 0.016, 0.024), 1 - day).lerp(c3(0.6, 0.44, 0.34), warm * 0.55);
  const zn = c3(0.34, 0.38, 0.42).lerp(c3(0.004, 0.006, 0.016), 1 - day);
  skyU.horizon.value.copy(hz); skyU.zenith.value.copy(zn); fogColor.copy(hz);
  const sd = new THREE.Vector3(ca * 0.85, sa, ca * 0.5 + 0.2).normalize();
  skyU.sunDir.value.copy(sd); skyU.night.value = 1 - day;
  skyU.sunCol.value.setRGB(1.0, 0.78, 0.5).multiplyScalar(day * (0.08 + warm * 0.4));
  const ld = sa >= -0.05 ? sd : sd.clone().negate();
  sun.position.copy(ld).multiplyScalar(100).add(camera.position); sun.target.position.copy(camera.position);
  sun.color.copy(c3(0.95, 0.92, 0.85).lerp(c3(1, 0.6, 0.38), warm).lerp(c3(0.4, 0.5, 0.8), 1 - day));
  sun.intensity = lerp(0.06, 1.9, day);
  hemi.color.copy(c3(0.6, 0.64, 0.68).lerp(c3(0.1, 0.13, 0.22), 1 - day).lerp(c3(0.8, 0.6, 0.5), warm * 0.3));
  hemi.groundColor.copy(c3(0.26, 0.22, 0.17).lerp(c3(0.02, 0.02, 0.03), 1 - day));
  hemi.intensity = lerp(0.1, 2.0, day);
  Object.assign(waterU.uSunDir.value, ld); waterU.uSky.value.copy(hz); waterU.uZen.value.copy(zn);
  waterU.uSunCol.value.copy(skyU.sunCol.value);
}

// ---------------- Игрок ----------------
const P = { x: SPAWN.x, y: 0, z: SPAWN.z, vx: 0, vy: 0, vz: 0, yaw: -Math.atan2(0.97, 0.26) - Math.PI / 2 + Math.PI / 2, pitch: -0.04, ground: false, swim: false, bob: 0 };
// forward = (-sin yaw, -cos yaw): направим на +x с лёгким уклоном вглубь суши
P.yaw = Math.atan2(-0.97, -0.26);
P.slope = 0; P.stam = 1; P.tired = false;
P.y = Math.max(heightAt(P.x, P.z), -1.25);
const EYE = 1.68, PR = 0.36;
const keys = {};
const touch = { mx: 0, mz: 0, jump: false, run: false };
let started = false, locked = false, lastStepT = 0;

function collide() {
  const cx = Math.floor(P.x / CH), cz = Math.floor(P.z / CH);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const ch = chunks.get(ckey(cx + dx, cz + dz)); if (!ch) continue;
    for (const c of ch.circ) {
      const ddx = P.x - c[0], ddz = P.z - c[1], rr = c[2] + PR, d2 = ddx * ddx + ddz * ddz;
      if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2); P.x = c[0] + ddx / d * rr; P.z = c[1] + ddz / d * rr; }
    }
    for (const b of ch.boxes) {
      const rx = P.x - b.x, rz = P.z - b.z;
      let lx = rx * b.c - rz * b.s, lz = rx * b.s + rz * b.c;
      const qx = clamp(lx, -b.hx, b.hx), qz = clamp(lz, -b.hz, b.hz), ddx = lx - qx, ddz = lz - qz, d2 = ddx * ddx + ddz * ddz;
      if (d2 < PR * PR) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2); lx = qx + ddx / d * PR; lz = qz + ddz / d * PR; }
        else { const px = b.hx - Math.abs(lx), pz = b.hz - Math.abs(lz); if (px < pz) lx = Math.sign(lx || 1) * (b.hx + PR); else lz = Math.sign(lz || 1) * (b.hz + PR); }
        P.x = b.x + lx * b.c + lz * b.s; P.z = b.z - lx * b.s + lz * b.c;
      }
    }
  }
}

function updatePlayer(dt) {
  let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1;
  if (keys.KeyD || keys.ArrowRight) fx += 1; if (keys.KeyA || keys.ArrowLeft) fx -= 1;
  fx += touch.mx; fz += touch.mz;
  const l = Math.hypot(fx, fz); if (l > 1) { fx /= l; fz /= l; }
  if (P.stam < 0.03) P.tired = true; else if (P.stam > 0.3) P.tired = false;
  const run = (keys.ShiftLeft || keys.ShiftRight || touch.run) && l > 0.1 && !P.tired;
  let sp = (run ? 7.0 : 3.9) * (P.swim ? 0.5 : 1) * (P.tired ? 0.62 : 1);
  sp *= 1 - 0.55 * smooth(0.25, 1.0, Math.max(0, P.slope));
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  const tvx = (-sy * fz + cy * fx) * sp, tvz = (-cy * fz - sy * fx) * sp;
  const k = 1 - Math.exp(-(P.ground || P.swim ? 12 : 2.5) * dt);
  P.vx += (tvx - P.vx) * k; P.vz += (tvz - P.vz) * k;
  const gOld = heightAt(P.x, P.z);
  let nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
  const gNew = heightAt(nx, nz), step = Math.hypot(nx - P.x, nz - P.z);
  if (step > 1e-5) P.slope += ((gNew - gOld) / step - P.slope) * Math.min(1, dt * 6);
  else P.slope += (0 - P.slope) * Math.min(1, dt * 3);
  if (step > 1e-5 && P.ground && (gNew - gOld) / step > 1.15) { // слишком крутой склон — стена
    const gx = heightAt(nx, P.z), gz = heightAt(P.x, nz);
    if ((gx - gOld) / Math.max(1e-4, Math.abs(nx - P.x)) <= 1.15) { nz = P.z; }
    else if ((gz - gOld) / Math.max(1e-4, Math.abs(nz - P.z)) <= 1.15) { nx = P.x; }
    else { nx = P.x; nz = P.z; P.vx = P.vz = 0; }
  }
  P.x = nx; P.z = nz;
  collide();
  const g = Math.max(heightAt(P.x, P.z), -1.25);
  P.swim = heightAt(P.x, P.z) < -1.2;
  if ((keys.Space || touch.jump) && (P.ground || P.swim) && started && !P.tired) { P.vy = P.swim ? 3.2 : 5.4; P.ground = false; P.stam = Math.max(0, P.stam - 0.05); }
  P.vy -= 17 * dt; if (P.swim && P.y < -1.2) P.vy *= 0.9;
  P.y += P.vy * dt;
  if (P.y <= g) { if (P.vy < -6 && !P.swim) playStep('land'); P.y = g; P.vy = 0; P.ground = true; } else if (P.y - g > 0.08) P.ground = false;
  const speed = Math.hypot(P.vx, P.vz);
  if (P.ground && speed > 0.5) P.bob += dt * speed * 1.55;
  // выносливость: бег и подъёмы выматывают
  const moving = speed > 0.5;
  let drain = 0;
  if (run && moving) drain += 0.13;
  if (moving) drain += 0.17 * smooth(0.3, 1.0, P.slope);
  if (P.swim) drain += 0.05;
  if (drain > 0) P.stam = Math.max(0, P.stam - drain * dt);
  else P.stam = Math.min(1, P.stam + (moving ? 0.06 : 0.16) * dt);
  stepTimer(dt, speed);
}
let stepAcc = 0;
function stepTimer(dt, speed) {
  if (!(P.ground || P.swim) || speed < 0.6) { stepAcc = 0.2; return; }
  stepAcc += dt * speed;
  if (stepAcc > 2.1) { stepAcc = 0; playStep(P.swim ? 'water' : surfaceAt(P.x, P.z)); }
}
function surfaceAt(x, z) { const h = heightAt(x, z); if (h < 0.1) return 'water'; if (h < 1.3) return 'gravel'; if (h > 100) return 'snow'; return 'leaves'; }

// ---------------- Ввод ----------------
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!started) return;
  if (e.code === 'KeyF') toggleTorch();
  if (e.code === 'KeyT') nextTime();
  if (e.code === 'KeyM') toggleSound();
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const SENS = 0.0022;
function look(dx, dy, s) { P.yaw -= dx * s; P.pitch = clamp(P.pitch - dy * s, -1.5, 1.5); }
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', (e) => { if (started && locked) look(e.movementX, e.movementY, SENS); });
let dragId = null, dragLast = null;
canvas.addEventListener('mousedown', (e) => {
  if (!started) return;
  if (!locked) { const p = canvas.requestPointerLock && canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); dragLast = [e.clientX, e.clientY]; }
});
addEventListener('mousemove', (e) => { if (started && !locked && dragLast && e.buttons) { look(e.clientX - dragLast[0], e.clientY - dragLast[1], SENS); dragLast = [e.clientX, e.clientY]; } });
addEventListener('mouseup', () => { dragLast = null; });

// сенсорное управление
if (isTouch) {
  $('touch').classList.remove('hidden'); $('help').classList.add('hidden');
  const base = $('stickBase'), knob = $('stickKnob');
  let stickId = null, sx = 0, sy = 0, lookId = null, llx = 0, lly = 0;
  window.addEventListener('touchstart', (e) => {
    if (!started) return;
    for (const t of e.changedTouches) {
      if (e.target.closest && e.target.closest('button')) continue;
      if (t.clientX < innerWidth * 0.45 && stickId === null) {
        stickId = t.identifier; sx = t.clientX; sy = t.clientY;
        base.style.display = 'block'; base.style.left = (sx - 60) + 'px'; base.style.top = (sy - 60) + 'px';
      } else if (lookId === null) { lookId = t.identifier; llx = t.clientX; lly = t.clientY; }
    }
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        let dx = t.clientX - sx, dy = t.clientY - sy; const l = Math.hypot(dx, dy), m = 55;
        if (l > m) { dx *= m / l; dy *= m / l; }
        knob.style.left = (35 + dx) + 'px'; knob.style.top = (35 + dy) + 'px';
        touch.mx = dx / m; touch.mz = -dy / m;
      } else if (t.identifier === lookId) { look(t.clientX - llx, t.clientY - lly, 0.0055); llx = t.clientX; lly = t.clientY; }
    }
    if (!(e.target.closest && e.target.closest('#start, #note'))) e.preventDefault();
  }, { passive: false });
  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) { stickId = null; touch.mx = touch.mz = 0; base.style.display = 'none'; knob.style.left = '35px'; knob.style.top = '35px'; }
      if (t.identifier === lookId) lookId = null;
    }
  };
  window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
  const hold = (id, on, off) => { const b = $(id); b.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); on(b); }, { passive: false }); b.addEventListener('touchend', (e) => { e.preventDefault(); off && off(b); }); };
  hold('tJump', () => { touch.jump = true; }, () => { touch.jump = false; });
  hold('tRun', (b) => { touch.run = !touch.run; b.classList.toggle('on', touch.run); });
  hold('tLight', (b) => { toggleTorch(); b.classList.toggle('on', torchOn); });
}
function toggleTorch() { torchOn = !torchOn; torch.intensity = torchOn ? 170 : 0; }
function nextTime() { dayT = (dayT + 0.125) % 1; applyTime(); }
$('bSound').onclick = () => toggleSound();
$('bFull').onclick = () => { const d = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : d.requestFullscreen && d.requestFullscreen()); };
['bSound', 'bFull'].forEach((id) => $(id).addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true }));

// ---------------- Звук (процедурный) ----------------
let AC = null, master = null, windG = null, waterG = null, fireG = null, muted = false, noiseBuf = null;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
  AC = new Ctx(); master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
  const sr = AC.sampleRate, n = sr * 3; noiseBuf = AC.createBuffer(1, n, sr);
  const d = noiseBuf.getChannelData(0); let last = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = last * 6; }
  const loop = (type, freq, q) => {
    const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); return { g, f };
  };
  windG = loop('lowpass', 520, 0.5); waterG = loop('bandpass', 900, 0.4); fireG = loop('lowpass', 260, 0.6);
}
function burst(freq, q, type, dur, vol) {
  if (!AC || muted) return;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 1 + Math.random() * 1.5;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq * (0.8 + Math.random() * 0.4); f.Q.value = q;
  const g = AC.createGain(); const t = AC.currentTime;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 2, dur + 0.05);
}
function playStep(kind) {
  if (kind === 'leaves') { burst(2800, 0.8, 'bandpass', 0.2, 0.75); burst(1100, 0.6, 'bandpass', 0.13, 0.45); burst(5000, 1.2, 'highpass', 0.08, 0.25); }
  else if (kind === 'gravel') { burst(3800, 1.2, 'highpass', 0.1, 0.4); burst(1800, 1, 'bandpass', 0.08, 0.3); }
  else if (kind === 'water') { burst(700, 0.7, 'lowpass', 0.4, 0.8); burst(2200, 1, 'bandpass', 0.2, 0.25); }
  else if (kind === 'snow') burst(1500, 0.6, 'bandpass', 0.18, 0.45);
  else if (kind === 'land') burst(300, 0.6, 'lowpass', 0.18, 0.9);
}
function chirp() {
  if (!AC || muted) return;
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime, f0 = 2200 + Math.random() * 1800, n = 2 + ((Math.random() * 3) | 0);
  o.type = 'sine'; g.gain.setValueAtTime(0, t);
  for (let i = 0; i < n; i++) { const tt = t + i * 0.11; o.frequency.setValueAtTime(f0 * (1 + Math.random() * 0.3), tt); o.frequency.exponentialRampToValueAtTime(f0 * 1.4, tt + 0.07); g.gain.linearRampToValueAtTime(0.05, tt + 0.015); g.gain.linearRampToValueAtTime(0, tt + 0.09); }
  o.connect(g); g.connect(master); o.start(t); o.stop(t + n * 0.11 + 0.1);
}
let waterNear = 0, breathT = 0, wnTimer = 0;
function breathe(v) { burst(1400, 0.5, 'bandpass', 0.45, 0.15 + 0.3 * v); setTimeout(() => burst(900, 0.5, 'bandpass', 0.5, 0.12 + 0.25 * v), 480); }
function updateAudio(dt, tm) {
  if (!AC) return;
  const day = smooth(-0.1, 0.25, Math.sin((dayT - 0.25) * TAU));
  const gust = 0.5 + 0.5 * Math.sin(tm * 0.31) * Math.sin(tm * 0.13 + 1);
  const hgt = heightAt(P.x, P.z), alt = smooth(5, 90, hgt);
  windG.g.gain.setTargetAtTime(muted ? 0 : (0.05 + 0.2 * gust + alt * 0.3) * 0.8, AC.currentTime, 0.3);
  windG.f.frequency.setTargetAtTime(380 + 500 * gust + alt * 500, AC.currentTime, 0.3);
  wnTimer -= dt;
  if (wnTimer < 0) { // доля воды вокруг
    wnTimer = 0.5; let n = 0, tot = 0;
    for (let r = 6; r <= 30; r += 12) for (let a = 0; a < 8; a++) { tot++; if (heightAt(P.x + Math.cos(a * 0.785) * r, P.z + Math.sin(a * 0.785) * r) < 0) n++; }
    waterNear = n / tot;
  }
  waterG.g.gain.setTargetAtTime(muted ? 0 : waterNear * (0.35 + 0.15 * Math.sin(tm * 0.8)), AC.currentTime, 0.4);
  const fd = Math.hypot(P.x - CAMP.x, P.z - CAMP.z), fv = Math.pow(clamp(1 - fd / 36, 0, 1), 2);
  fireG.g.gain.setTargetAtTime(muted ? 0 : fv * 0.6, AC.currentTime, 0.2);
  if (fv > 0.02 && Math.random() < dt * (10 + 30 * fv)) burst(3500, 1.5, 'highpass', 0.03, 0.35 * fv + 0.02);
  if (P.stam < 0.4 || P.tired) { breathT -= dt; if (breathT < 0) { breathT = 1.2 + P.stam * 1.6; breathe(1 - P.stam); } }
}
function toggleSound() { muted = !muted; initAudio(); if (master) master.gain.value = muted ? 0 : 0.9; $('bSound').textContent = muted ? '🔇' : '🔊'; toast(muted ? 'Звук выключен' : 'Звук включён'); }

// ---------------- Интерфейс ----------------
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
const stamEl = $('stam'), vigEl = $('vig'), promptEl = $('prompt'), noteEl = $('note');
let noteOpen = false, nearNote = null, readNotes = new Set(), noteT = 0;
function findNote() {
  const cx = Math.floor(P.x / CH), cz = Math.floor(P.z / CH);
  const fx = -Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch);
  let best = null, bd = 1e9;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const ch = chunks.get(ckey(cx + dx, cz + dz)); if (!ch) continue;
    for (const n of ch.notes) {
      const vx = n.x - P.x, vy = n.y - (P.y + EYE), vz = n.z - P.z, d = Math.hypot(vx, vy, vz);
      if (d > 3.0) continue;
      const dot = (vx * fx + vy * fy + vz * fz) / d;
      if ((dot > 0.55 || d < 1.2) && d < bd) { bd = d; best = n; }
    }
  }
  return best;
}
function openNote(n) {
  noteOpen = true; readNotes.add(n.id);
  $('noteText').textContent = NOTES[(n.id - 1) % NOTES.length];
  $('noteMeta').textContent = 'найдено записок: ' + readNotes.size + ' из ' + NOTES.length;
  noteEl.classList.remove('hidden');
}
function closeNote() { noteOpen = false; noteEl.classList.add('hidden'); }
function interact() { if (noteOpen) closeNote(); else if (nearNote) openNote(nearNote); }
addEventListener('keydown', (e) => { if (!started) return; if (e.code === 'KeyE') interact(); if (e.code === 'Escape' && noteOpen) closeNote(); });
noteEl.addEventListener('click', closeNote);
$('tE') && $('tE').addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); interact(); }, { passive: false });
function updateHUD() {
  stamEl.style.opacity = P.stam < 0.97 ? 1 : 0;
  stamEl.firstElementChild.style.width = (P.stam * 100) + '%';
  stamEl.classList.toggle('low', P.tired || P.stam < 0.25);

}
// зерно плёнки
{
  const gr = $('grain'), gx = gr.getContext('2d'), img = gx.createImageData(180, 100);
  setInterval(() => { const d = img.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gx.putImageData(img, 0, 0); }, 100);
}

// ---------------- Потоковая загрузка чанков ----------------
let lastPC = [1e9, 1e9], queue = [];
function refreshQueue(force) {
  const pcx = Math.floor(P.x / CH), pcz = Math.floor(P.z / CH);
  if (!force && pcx === lastPC[0] && pcz === lastPC[1]) return;
  lastPC = [pcx, pcz]; queue = [];
  for (let dz = -VIEW_R; dz <= VIEW_R; dz++) for (let dx = -VIEW_R; dx <= VIEW_R; dx++) {
    const d = Math.hypot(dx, dz); if (d > VIEW_R + 0.2) continue;
    if (!chunks.has(ckey(pcx + dx, pcz + dz))) queue.push([pcx + dx, pcz + dz, d]);
  }
  queue.sort((a, b) => a[2] - b[2]);
  for (const [k, ch] of chunks) if (Math.hypot(ch.cx - pcx, ch.cz - pcz) > VIEW_R + 1.6) { disposeChunk(ch); chunks.delete(k); }
}
function pump(budget, minOne) {
  const t0 = performance.now(); let n = 0;
  while (queue.length && (n === 0 && minOne || performance.now() - t0 < budget)) {
    const [cx, cz] = queue.shift(); if (chunks.has(ckey(cx, cz))) continue;
    chunks.set(ckey(cx, cz), buildChunk(cx, cz)); n++;
  }
}
function applyViewDistance() {
  const far = (VIEW_R - 0.7) * CH * 0.75, den = 1.73 / far;
  scene.fog.density = den; waterU.uDen.value = den;
}

// ---------------- Пост-обработка ----------------
const post = (() => {
  const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  const HF = THREE.HalfFloatType;
  const main = new THREE.WebGLRenderTarget(4, 4, { type: HF, samples: isTouch ? 0 : 4, depthTexture: new THREE.DepthTexture(4, 4) });
  const bA = new THREE.WebGLRenderTarget(4, 4, { type: HF }), bB = new THREE.WebGLRenderTarget(4, 4, { type: HF });
  const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), qg = new THREE.PlaneGeometry(2, 2);
  const mk = (fs, u) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false }); const sc = new THREE.Scene(); const me = new THREE.Mesh(qg, m); me.frustumCulled = false; sc.add(me); return { m, sc }; };
  const bright = mk(`varying vec2 vUv; uniform sampler2D t;
    void main(){ vec3 c=texture2D(t,vUv).rgb; float l=dot(c,vec3(0.2126,0.7152,0.0722)); gl_FragColor=vec4(c*smoothstep(0.55,1.4,l),1.0); }`, { t: { value: main.texture } });
  const blurFS = `varying vec2 vUv; uniform sampler2D t; uniform vec2 dir;
    void main(){ vec3 c=texture2D(t,vUv).rgb*0.227;
      c+=(texture2D(t,vUv+dir*1.385).rgb+texture2D(t,vUv-dir*1.385).rgb)*0.316;
      c+=(texture2D(t,vUv+dir*3.231).rgb+texture2D(t,vUv-dir*3.231).rgb)*0.07;
      gl_FragColor=vec4(c,1.0); }`;
  const blurH = mk(blurFS, { t: { value: bA.texture }, dir: { value: new THREE.Vector2() } });
  const blurV = mk(blurFS, { t: { value: bB.texture }, dir: { value: new THREE.Vector2() } });
  const U = {
    tC: { value: main.texture }, tD: { value: main.depthTexture }, tB: { value: bA.texture },
    res: { value: new THREE.Vector2(4, 4) }, sunUV: { value: new THREE.Vector2(0.5, 0.5) }, sunVis: { value: 0 }, sunCol: { value: new THREE.Color(1, 0.9, 0.75) },
    nearF: { value: camera.near }, farF: { value: camera.far }, time: { value: 0 }, fatigue: { value: 0 }, expo: { value: 1.0 },
  };
  const comp = mk(`varying vec2 vUv; uniform sampler2D tC,tD,tB; uniform vec2 res,sunUV; uniform float sunVis,nearF,farF,time,fatigue,expo; uniform vec3 sunCol;
    float lz(float d){ float z=d*2.0-1.0; return 2.0*nearF*farF/(farF+nearF-z*(farF-nearF)); }
    float h12(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
    void main(){
      vec2 uv=vUv, dc=uv-0.5;
      float ca=0.0012+0.004*fatigue+0.0025*dot(dc,dc);
      vec3 col=vec3(texture2D(tC,uv+dc*ca).r, texture2D(tC,uv).g, texture2D(tC,uv-dc*ca).b);
      // ambient occlusion по глубине
      float rd=texture2D(tD,uv).x, d0=lz(rd);
      if(rd<0.99993){
        float ao=0.0, rn=h12(uv*res+time)*6.283, sc=clamp(26.0/d0,0.35,3.5);
        for(int i=0;i<10;i++){ float fi=float(i); float a=rn+fi*2.39996; vec2 o=vec2(cos(a),sin(a))*(3.0+fi*2.4)*sc/res;
          float d=lz(texture2D(tD,uv+o).x); float df=d0-d; ao+=smoothstep(0.03,0.6+d0*0.02,df)*(1.0-smoothstep(1.5,4.0+d0*0.05,df)); }
        col*=1.0-0.55*ao/10.0;
      }
      // лучи света сквозь туман и ветви
      if(sunVis>0.001){
        vec2 dt=(uv-sunUV)/48.0; vec2 p=uv; float il=0.0, w=1.0;
        for(int i=0;i<48;i++){ p-=dt; float sky=step(0.99993,texture2D(tD,p).x); vec3 sc=texture2D(tC,p).rgb; il+=sky*dot(sc,vec3(0.33))*w; w*=0.965; }
        col+=sunCol*il/48.0*sunVis*1.6;
      }
      col+=texture2D(tB,uv).rgb*0.55;
      col=aces(col*expo*1.15);
      // цветокор: холодные тени, чуть тёплые света, приглушённая насыщенность
      float L=dot(col,vec3(0.2126,0.7152,0.0722));
      col=mix(vec3(L),col,0.78);
      col+=vec3(-0.012,0.004,0.02)*(1.0-L)+vec3(0.02,0.01,-0.015)*L;
      col=pow(max(col,0.0),vec3(1.0/2.2));
      // виньетка и зерно
      float v=smoothstep(0.95,0.25,length(dc*vec2(1.15,1.0)))*(1.0-0.25*fatigue);
      col*=mix(0.32,1.0,v);
      col+=(h12(uv*res+fract(time*13.0)*91.0)-0.5)*0.045;
      gl_FragColor=vec4(col,1.0);
    }`, U);
  let w = 4, h = 4;
  const sv = new THREE.Vector3();
  return {
    U,
    resize(W, H) {
      const pr = renderer.getPixelRatio(); w = Math.floor(W * pr); h = Math.floor(H * pr);
      main.setSize(w, h); main.depthTexture.image.width = w; main.depthTexture.image.height = h;
      const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2); bA.setSize(bw, bh); bB.setSize(bw, bh);
      blurH.m.uniforms.dir.value.set(1 / bw, 0); blurV.m.uniforms.dir.value.set(0, 1 / bh); U.res.value.set(w, h);
    },
    render(t) {
      U.time.value = t; U.farF.value = camera.far; U.nearF.value = camera.near; U.fatigue.value = clamp(1 - P.stam, 0, 1);
      // экранная позиция солнца
      const sd = skyU.sunDir.value; sv.copy(camera.position).addScaledVector(sd, 800).project(camera);
      const on = sv.z < 1 && Math.abs(sv.x) < 1.6 && Math.abs(sv.y) < 1.6 ? 1 : 0;
      U.sunUV.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5);
      const day = smooth(-0.05, 0.25, sd.y);
      U.sunVis.value = on * day * (1 - smooth(0.9, 1.6, Math.max(Math.abs(sv.x), Math.abs(sv.y))));
      U.sunCol.value.copy(sun.color);
      renderer.setRenderTarget(main); renderer.render(scene, camera);
      renderer.setRenderTarget(bA); renderer.render(bright.sc, qc);
      renderer.setRenderTarget(bB); renderer.render(blurH.sc, qc);
      renderer.setRenderTarget(bA); renderer.render(blurV.sc, qc);
      renderer.setRenderTarget(null); renderer.render(comp.sc, qc);
    },
  };
})();

// ---------------- Главный цикл ----------------
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); post.resize(w, h);
}
addEventListener('resize', resize); resize();

let tPrev = performance.now(), tClock = 0, hudT = 0, fireT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - tPrev) / 1000); tPrev = now; tClock += dt;
  if (started) { updatePlayer(dt); refreshQueue(false); pump(7, true); }
  else pump(14, true);
  // камера
  const bob = P.ground && !P.swim ? Math.sin(P.bob * 2) * 0.035 * clamp(Math.hypot(P.vx, P.vz) / 4, 0, 1.4) : 0;
  const swimBob = P.swim ? Math.sin(tClock * 1.6) * 0.04 : 0;
  const tired = P.tired || P.stam < 0.25 ? Math.sin(tClock * 2.2) * 0.012 : 0;
  camera.position.set(P.x, P.y + EYE + bob + swimBob + tired, P.z);
  camera.rotation.set(P.pitch, P.yaw, 0);
  // небо/вода следуют за камерой
  sky.position.copy(camera.position); sky.scale.setScalar(900);
  water.position.set(camera.position.x, 0, camera.position.z); waterU.uTime.value = tClock;
  { const sn = 150 / 2048 * 1; const cx = Math.round(camera.position.x / sn) * sn, cz = Math.round(camera.position.z / sn) * sn;
    sun.target.position.set(cx, camera.position.y, cz);
    sun.position.copy(skyU.sunDir.value.y >= -0.05 ? skyU.sunDir.value : skyU.sunDir.value.clone().negate()).multiplyScalar(200).add(sun.target.position); }
  // LOD мелких деталей
  const pcx = Math.floor(P.x / CH), pcz = Math.floor(P.z / CH), gr = isTouch ? 1.2 : 1.7;
  for (const ch of chunks.values()) if (ch.grass) ch.grass.visible = Math.hypot(ch.cx - pcx, ch.cz - pcz) <= gr;
  // костёр
  fireT += dt;
  for (const m of flames) {
    const u = m.userData, f = 0.75 + 0.25 * Math.sin(fireT * 9 + u.ph) * Math.sin(fireT * 5.3 + u.ph * 2) + (Math.random() - 0.5) * 0.12;
    m.scale.set(1 + 0.12 * Math.sin(fireT * 7 + u.ph), f, 1 + 0.12 * Math.cos(fireT * 6 + u.ph));
    m.rotation.y += dt * 1.5; m.rotation.z = 0.08 * Math.sin(fireT * 4 + u.ph); m.rotation.x = 0.08 * Math.cos(fireT * 3.1 + u.ph);
  }
  glow.material.opacity = 0.8 + 0.2 * Math.sin(fireT * 11);
  fireLight.intensity = (lerp(34, 16, smooth(-0.1, 0.25, Math.sin((dayT - 0.25) * TAU)))) * (0.85 + 0.15 * Math.sin(fireT * 13) * Math.sin(fireT * 7.7) + (Math.random() - 0.5) * 0.12);
  for (let i = 0; i < SP_N; i++) {
    spLife[i] -= dt * 0.45;
    if (spLife[i] <= 0) { spLife[i] = 0.6 + Math.random() * 0.8; const a = Math.random() * TAU, r = Math.random() * 0.35; spPos[i * 3] = CAMP.x + Math.cos(a) * r; spPos[i * 3 + 1] = fire.position.y + 0.5; spPos[i * 3 + 2] = CAMP.z + Math.sin(a) * r; spVel[i] = [(Math.random() - 0.5) * 0.7 + 0.25, 1.2 + Math.random() * 1.8, (Math.random() - 0.5) * 0.7]; }
    const v = spVel[i]; spPos[i * 3] += v[0] * dt; spPos[i * 3 + 1] += v[1] * dt; spPos[i * 3 + 2] += v[2] * dt; v[0] += (Math.random() - 0.5) * dt * 2;
    const b = clamp(spLife[i], 0, 1); spCol[i * 3] = 1.0 * b; spCol[i * 3 + 1] = 0.5 * b; spCol[i * 3 + 2] = 0.1 * b;
  }
  spGeo.attributes.position.needsUpdate = true; spGeo.attributes.color.needsUpdate = true;
  for (const s of smokes) {
    const u = s.userData; u.t += dt * 0.12; if (u.t > 1) u.t -= 1;
    const t = u.t; s.position.set(CAMP.x + 0.3 * t * 6 + Math.sin(t * 9 + u.t * 4) * 0.3, fire.position.y + 1.2 + t * 9, CAMP.z + Math.cos(t * 7) * 0.3);
    s.scale.setScalar(0.8 + t * 4.5); s.material.opacity = Math.sin(t * Math.PI) * 0.16;
  }
  // листья
  for (let i = 0; i < LF_N; i++) {
    const ph = lfPh[i];
    lfPos[i * 3] += (0.9 + Math.sin(tClock * 0.7 + ph) * 0.6) * dt; lfPos[i * 3 + 1] -= (0.55 + 0.25 * Math.sin(ph + tClock)) * dt; lfPos[i * 3 + 2] += Math.cos(tClock * 0.9 + ph) * 0.5 * dt;
    for (let a = 0; a < 3; a += 2) { const rel = lfPos[i * 3 + a] - (a === 0 ? P.x : P.z); if (rel > 18) lfPos[i * 3 + a] -= 36; else if (rel < -18) lfPos[i * 3 + a] += 36; }
    if (lfPos[i * 3 + 1] < P.y - 1) lfPos[i * 3 + 1] += 14;
    else if (lfPos[i * 3 + 1] > P.y + 13) lfPos[i * 3 + 1] -= 14;
  }
  leaves.position.set(0, 0, 0);
  lfGeo.attributes.position.needsUpdate = true;
  // ui
  hudT -= dt; if (hudT < 0) { hudT = 0.25; if (started) updateHUD(); }
  if (started) {
    noteT -= dt; if (noteT < 0) { noteT = 0.12; nearNote = noteOpen ? nearNote : findNote(); if (!noteOpen) nearNote = findNote(); promptEl.classList.toggle('hidden', !nearNote || noteOpen); const te = $('tE'); if (te) te.classList.toggle('hidden', !nearNote && !noteOpen); }
    updateAudio(dt, tClock);
    dayT = (dayT + dt / 1800) % 1; if (Math.floor(tClock * 3) !== Math.floor((tClock - dt) * 3)) applyTime();
  }
  post.render(tClock);
}

// ---------------- Старт ----------------
function boot() {
  applyViewDistance(); applyTime();
  camera.position.set(P.x, P.y + EYE, P.z); camera.rotation.set(P.pitch, P.yaw, 0);
  refreshQueue(true);
  // стартовая загрузка ближних чанков
  const need = queue.filter((q) => q[2] <= 2.3).length || 1;
  let done = 0;
  const bar = $('loadbar').firstElementChild;
  const tick = () => {
    const before = queue.length; pump(12, true);
    done += Math.max(0, before - queue.length);
    bar.style.width = Math.min(100, (done / Math.max(1, need)) * 100) + '%';
    if (queue.filter((q) => q[2] <= 2.3).length === 0) { const b = $('play'); b.disabled = false; b.textContent = 'Войти'; bar.style.width = '100%'; return; }
    setTimeout(tick, 0);
  };
  tick();
  requestAnimationFrame(frame);
}
{
  const goSeed = (v) => { v = (v || '').trim(); location.hash = v ? '#seed=' + encodeURIComponent(v) : ''; location.reload(); };
  $('seedIn').value = SEEDINFO.raw;
  $('seedGo').onclick = () => goSeed($('seedIn').value);
  $('seedIn').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') goSeed($('seedIn').value); });
  $('seedIn').addEventListener('keyup', (e) => e.stopPropagation());
  $('seedRnd').onclick = () => { let n = 100000 + Math.floor(Math.random() * 900000); goSeed(String(n)); };
  $('seedInfo').textContent = SHOWCASE ? 'Сид 1 — демо-мир: все записки, деревни и стоянки рядом со стартом.' : (SEEDINFO.raw ? 'Сид: ' + SEEDINFO.raw + ' · пусто = стандартный мир · 1 = демо, всё рядом' : 'Стандартный мир · введи сид; 1 = демо, где всё рядом со стартом');
}
document.querySelectorAll('#quality button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#quality button').forEach((x) => x.classList.remove('on')); b.classList.add('on');
  VIEW_R = +b.dataset.r; applyViewDistance(); refreshQueue(true);
}));
$('play').addEventListener('click', () => {
  started = true; $('start').classList.add('hidden'); $('hud').classList.remove('hidden');
  initAudio();
  if (!isTouch) { const p = canvas.requestPointerLock && canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); }
  else { const d = document.documentElement; d.requestFullscreen && d.requestFullscreen().catch(() => { }); }
  toast('Здесь никого нет.'); setTimeout(() => $('help').style.opacity = 0, 18000);
  refreshQueue(true);
});

window.__game = {
  P, scene, camera, chunks, NOTES, openNote, findNote, heightAt, villageCell, villagesNear, CAMP,
  teleport(x, z, yaw, pitch) { P.x = x; P.z = z; P.y = Math.max(heightAt(x, z), -1.25); if (yaw !== undefined) P.yaw = yaw; if (pitch !== undefined) P.pitch = pitch; refreshQueue(true); },
  setTime(t) { dayT = t; applyTime(); },
  flush() { pump(1e9, true); },
  start() { $('play').click(); },
  stats() { return { chunks: chunks.size, tris: renderer.info.render.triangles, calls: renderer.info.render.calls }; },
};
boot();

// ---------------- Ключ от ворот (общий сон всех миров) ----------------
(() => {
  let got = []; try { got = JSON.parse(localStorage.getItem('dream_keys') || '[]'); } catch (e) {}
  if (got.includes('tishina')) return;
  const v = villageCell(0, 0); const kx = (v ? v.x : 46) + 7, kz = (v ? v.z : 205) - 5, ky = heightAt(kx, kz);
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xd9b24c, metalness: 1, roughness: 0.25, emissive: 0x6a4400, emissiveIntensity: 1.5 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 20), mat); ring.position.y = 0.3; const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8), mat); shaft.position.y = 0.13; const bit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.022, 0.016), mat); bit.position.set(0.03, 0.04, 0);
  g.add(ring, shaft, bit); const glow = new THREE.PointLight(0xffd080, 2.5, 6, 2); glow.position.y = 0.4; g.add(glow); g.position.set(kx, ky + 0.05, kz); scene.add(g);
  const tick = setInterval(() => { g.rotation.y += 0.12; if (!started) return; if (Math.hypot(P.x - kx, P.z - kz) < 1.3) { clearInterval(tick); scene.remove(g); got.push('tishina'); try { localStorage.setItem('dream_keys', JSON.stringify(got)); } catch (e) {} toast(`Ключ от ворот: ${got.filter((w) => w !== 'vorota').length} / 16`); } }, 100);
})();
