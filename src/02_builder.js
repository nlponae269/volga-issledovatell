// ============================================================
//  ЧАСТЬ 2. Генератор геометрии, деревья, дома, лагерь
// ============================================================
const LUT = new Float32Array(1024);
for (let i = 0; i < 1024; i++) LUT[i] = Math.pow(i / 1023, 2.2);
const lin = (v) => LUT[(clamp(v, 0, 1) * 1023 + 0.5) | 0];
const jit = (c, a, rng) => { const k = 1 + (rng() - 0.5) * 2 * a; return [c[0] * k, c[1] * k, c[2] * k]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const T_ = (1 + Math.sqrt(5)) / 2;
const ICO = [[-1, T_, 0], [1, T_, 0], [-1, -T_, 0], [1, -T_, 0], [0, -1, T_], [0, 1, T_], [0, -1, -T_], [0, 1, -T_], [T_, 0, -1], [T_, 0, 1], [-T_, 0, -1], [-T_, 0, 1]]
  .map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
const ICOF = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];

class MB {
  constructor() { this.p = []; this.c = []; }
  // треугольник; (rx,ry,rz) — точка "внутри" объекта для правильной ориентации нормали
  t(ax, ay, az, bx, by, bz, cx, cy, cz, col, rx, ry, rz) {
    if (rx !== undefined) {
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const mx = (ax + bx + cx) / 3 - rx, my = (ay + by + cy) / 3 - ry, mz = (az + bz + cz) / 3 - rz;
      if (nx * mx + ny * my + nz * mz < 0) { let t = bx; bx = cx; cx = t; t = by; by = cy; cy = t; t = bz; bz = cz; cz = t; }
    }
    this.p.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    const r = lin(col[0]), g = lin(col[1]), b = lin(col[2]);
    this.c.push(r, g, b, r, g, b, r, g, b);
  }
  // треугольник с цветом на каждую вершину (для травы), без ориентации
  tg(a, b, c, ca, cb, cc) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.c.push(lin(ca[0]), lin(ca[1]), lin(ca[2]), lin(cb[0]), lin(cb[1]), lin(cb[2]), lin(cc[0]), lin(cc[1]), lin(cc[2]));
  }
  quadUp(x, y, z, hs, ang, col) { // лист, лежащий на земле
    const c = Math.cos(ang) * hs, s = Math.sin(ang) * hs;
    const a = [x - c, y, z - s], b = [x + s * 0.6, y, z - c * 0.6], d = [x + c, y, z + s], e = [x - s * 0.6, y, z + c * 0.6];
    this.tg(a, b, d, col, col, col); this.tg(a, d, e, col, col, col);
  }
  obox(c, U, V, W, hu, hv, hw, col) {
    const P = (su, sv, sw) => [c[0] + U[0] * hu * su + V[0] * hv * sv + W[0] * hw * sw,
      c[1] + U[1] * hu * su + V[1] * hv * sv + W[1] * hw * sw, c[2] + U[2] * hu * su + V[2] * hv * sv + W[2] * hw * sw];
    const f = (a, b, d, e) => { this.t(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2], col, c[0], c[1], c[2]); this.t(a[0], a[1], a[2], d[0], d[1], d[2], e[0], e[1], e[2], col, c[0], c[1], c[2]); };
    f(P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1));
    f(P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1));
    f(P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1));
    f(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1));
    f(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1));
    f(P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1));
  }
  box(cx, cy, cz, sx, sy, sz, ry, col) {
    const c = Math.cos(ry), s = Math.sin(ry);
    this.obox([cx, cy, cz], [c, 0, -s], [0, 1, 0], [s, 0, c], sx / 2, sy / 2, sz / 2, col);
  }
  limb(ax, ay, az, bx, by, bz, r0, r1, col, seg, capA, capB) {
    seg = seg || 6;
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz) || 1e-6;
    const wx = dx / len, wy = dy / len, wz = dz / len;
    let ux = 0, uy = 1, uz = 0;
    if (Math.abs(wy) > 0.9) { ux = 1; uy = 0; }
    let px = wy * uz - wz * uy, py = wz * ux - wx * uz, pz = wx * uy - wy * ux;
    const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
    const qx = wy * pz - wz * py, qy = wz * px - wx * pz, qz = wx * py - wy * px;
    const mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2;
    const A = [], Bv = [];
    for (let i = 0; i < seg; i++) {
      const an = (i / seg) * TAU, cs = Math.cos(an), sn = Math.sin(an);
      const ox = px * cs + qx * sn, oy = py * cs + qy * sn, oz = pz * cs + qz * sn;
      A.push([ax + ox * r0, ay + oy * r0, az + oz * r0]);
      Bv.push([bx + ox * r1, by + oy * r1, bz + oz * r1]);
    }
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg, a0 = A[i], a1 = A[j], b0 = Bv[i], b1 = Bv[j];
      let cc = col;
      if (this.rough) { const k = 1 + this.rough * ((((i * 2654435761 + ((ax * 91 + az * 57) | 0)) >>> 0) % 100) / 50 - 1); cc = [col[0] * k, col[1] * k, col[2] * k]; }
      this.t(a0[0], a0[1], a0[2], b0[0], b0[1], b0[2], b1[0], b1[1], b1[2], cc, mx, my, mz);
      if (r0 > 0.001) this.t(a0[0], a0[1], a0[2], b1[0], b1[1], b1[2], a1[0], a1[1], a1[2], cc, mx, my, mz);
      if (capA && r0 > 0.02) this.t(ax, ay, az, a1[0], a1[1], a1[2], a0[0], a0[1], a0[2], col, bx, by, bz);
      if (capB && r1 > 0.02) this.t(bx, by, bz, b1[0], b1[1], b1[2], b0[0], b0[1], b0[2], col, ax, ay, az);
    }
  }
  blob(cx, cy, cz, rx, ry, rz, col, rng, jt, vr) {
    jt = jt === undefined ? 0.2 : jt; vr = vr === undefined ? 0.12 : vr;
    const v = [];
    for (let i = 0; i < 12; i++) {
      const k = 1 + (rng() - 0.5) * 2 * jt;
      v.push([cx + ICO[i][0] * rx * k, cy + ICO[i][1] * ry * k, cz + ICO[i][2] * rz * k]);
    }
    for (let f = 0; f < 20; f++) {
      const a = v[ICOF[f][0]], b = v[ICOF[f][1]], c = v[ICOF[f][2]];
      const ny = ((a[1] + b[1] + c[1]) / 3 - cy) / (ry || 1);
      const sh = (1 + (rng() - 0.5) * 2 * vr) * (1 + 0.14 * ny);
      this.t(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], [col[0] * sh, col[1] * sh, col[2] * sh], cx, cy, cz);
    }
  }
}

// ---------------- Палитры ----------------
const FOLIAGE = [[0.55, 0.42, 0.2], [0.5, 0.33, 0.17], [0.62, 0.53, 0.26], [0.42, 0.38, 0.2], [0.45, 0.25, 0.14], [0.36, 0.34, 0.18]];
const BARK = [0.17, 0.14, 0.12], BARK_LIGHT = [0.38, 0.34, 0.3], BIRCH = [0.66, 0.65, 0.6], WOOD_GRAY = [0.34, 0.31, 0.28];
const SPRUCE = [0.08, 0.17, 0.12];

// ---------------- Деревья ----------------
function treeBroad(B, cols, rng, x, y, z, sc) {
  const H = (4.8 + rng() * 3.6) * sc, lean = (rng() - 0.5) * 0.7;
  const bark = jit(BARK, 0.15, rng);
  const tx = x + lean, tz = z + lean * 0.6, cy = y + H * 0.55;
  B.limb(x, y - 0.3, z, tx, cy, tz, 0.26 * sc, 0.14 * sc, bark, 6, false, true);
  const base = FOLIAGE[(rng() * FOLIAGE.length) | 0], alt = FOLIAGE[(rng() * FOLIAGE.length) | 0];
  const n = 2 + ((rng() * 2) | 0);
  for (let k = 0; k < n; k++) {
    const a = rng() * TAU, r = (0.4 + rng() * 1.5) * sc;
    const bx = tx + Math.cos(a) * r, bz = tz + Math.sin(a) * r, by = cy + (0.1 + rng() * 0.9) * sc * 1.4;
    B.limb(tx, cy - 0.5 * sc, tz, bx, by - 0.5 * sc, bz, 0.08 * sc, 0.04 * sc, bark, 4, false, false);
    const rr = (1.0 + rng() * 0.7) * sc;
    B.blob(bx, by + 0.4 * sc, bz, rr, rr * 0.6, rr, jit(mixc(base, alt, rng() * 0.6), 0.1, rng), rng, 0.22, 0.14);
  }
  cols.push([x, z, 0.38 * sc]);
}
function treeBirch(B, cols, rng, x, y, z, sc) {
  const H = (7 + rng() * 4) * sc, lean = (rng() - 0.5) * 0.5;
  const tx = x + lean, tz = z + lean * 0.5;
  B.limb(x, y - 0.3, z, tx, y + H * 0.8, tz, 0.15 * sc, 0.06 * sc, jit(BIRCH, 0.06, rng), 6, false, true);
  for (let k = 0; k < 4; k++) {
    const t = 0.15 + rng() * 0.6, bx = lerp(x, tx, t), bz = lerp(z, tz, t), by = y + H * 0.8 * t;
    B.limb(bx, by, bz, bx, by + 0.12, bz, 0.168 * sc * (1 - t * 0.5), 0.168 * sc * (1 - t * 0.5), [0.12, 0.11, 0.1], 6, true, true);
  }
  const base = rng() < 0.75 ? [0.62, 0.52, 0.22] : [0.5, 0.4, 0.18];
  for (let k = 0; k < 2; k++) {
    const a = rng() * TAU, r = rng() * 0.9 * sc, by = y + H * (0.55 + 0.14 * k);
    const rr = (0.95 + rng() * 0.5) * sc;
    B.blob(tx + Math.cos(a) * r, by, tz + Math.sin(a) * r, rr, rr * 1.1, rr, jit(base, 0.1, rng), rng, 0.2, 0.12);
    B.limb(tx, by - 1, tz, tx + Math.cos(a) * r, by - 0.2, tz + Math.sin(a) * r, 0.05 * sc, 0.03 * sc, BIRCH, 4, false, false);
  }
  cols.push([x, z, 0.3 * sc]);
}
function treeSpruce(B, cols, rng, x, y, z, sc) {
  const H = (7 + rng() * 5) * sc;
  B.limb(x, y - 0.3, z, x, y + H * 0.35, z, 0.2 * sc, 0.12 * sc, jit(BARK, 0.1, rng), 5, false, true);
  const col = jit(rng() < 0.2 ? [0.34, 0.40, 0.14] : SPRUCE, 0.18, rng);
  const tiers = 4;
  for (let k = 0; k < tiers; k++) {
    const f = k / tiers, y0 = y + H * (0.14 + f * 0.62), r = (2.5 - f * 1.55) * sc, hh = H * 0.34;
    B.limb(x, y0, z, x, y0 + hh, z, r, 0.02, jit(col, 0.08, rng), 7, true, false);
  }
  cols.push([x, z, 0.3 * sc]);
}
function treeDeadOld(B, cols, rng, x, y, z, sc) {
  const H = (4.5 + rng() * 3) * sc, lean = (rng() - 0.5) * 0.9;
  const bark = jit(WOOD_GRAY, 0.15, rng);
  const tx = x + lean, tz = z + lean * 0.4;
  B.limb(x, y - 0.2, z, tx, y + H, tz, 0.22 * sc, 0.05 * sc, bark, 6, false, true);
  for (let k = 0; k < 5; k++) {
    const t = 0.35 + rng() * 0.55, a = rng() * TAU, L = (1.0 + rng() * 1.6) * sc;
    const bx = lerp(x, tx, t), bz = lerp(z, tz, t), by = y + H * t;
    const ex = bx + Math.cos(a) * L, ez = bz + Math.sin(a) * L, ey = by + L * (0.2 + rng() * 0.7);
    B.limb(bx, by, bz, ex, ey, ez, 0.07 * sc, 0.02 * sc, bark, 4, false, false);
    B.limb(lerp(bx, ex, 0.6), lerp(by, ey, 0.6), lerp(bz, ez, 0.6), ex + (rng() - 0.5), ey + 0.6, ez + (rng() - 0.5), 0.03 * sc, 0.01, bark, 3, false, false);
  }
  cols.push([x, z, 0.3 * sc]);
}
// ветка с вилками (голое дерево)
function branchTree(B, rng, x, y, z, dx, dy, dz, len, r, depth, col) {
  const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  const ex = x + dx * len, ey = y + dy * len, ez = z + dz * len;
  B.limb(x, y, z, ex, ey, ez, r, r * 0.55, col, depth > 1 ? 4 : 3, false, false);
  if (depth <= 0) return;
  const n = depth > 1 ? 2 : 2 + ((rng() * 2) | 0);
  for (let k = 0; k < n; k++) {
    const a = rng() * TAU, sp = 0.5 + rng() * 0.6;
    const ndx = dx + Math.cos(a) * sp, ndz = dz + Math.sin(a) * sp, ndy = dy * 0.7 + 0.15 + rng() * 0.3;
    const t = 0.55 + rng() * 0.4;
    branchTree(B, rng, lerp(x, ex, t), lerp(y, ey, t), lerp(z, ez, t), ndx, ndy, ndz, len * (0.55 + rng() * 0.2), r * 0.6, depth - 1, col);
  }
}
// голое мёртвое дерево — тёмный кривой ствол
function treeDead(B, cols, rng, x, y, z, sc) {
  const H = (5.5 + rng() * 4.5) * sc, lean = (rng() - 0.5) * 1.3;
  const bark = jit(BARK, 0.25, rng);
  B.rough = 0.28;
  const mid = [x + lean * 0.5 + (rng() - 0.5) * 0.5, y + H * 0.5, z + (rng() - 0.5) * 0.5], tx = x + lean, tz = z + lean * 0.5;
  const R0 = (0.34 + rng() * 0.12) * sc;
  B.limb(x, y - 0.4, z, x, y + 0.5, z, R0 * 1.45, R0 * 1.05, bark, 8, false, false); // корневой наплыв
  B.limb(x, y + 0.4, z, mid[0], mid[1], mid[2], R0 * 1.05, R0 * 0.7, bark, 8, false, false);
  B.limb(mid[0], mid[1], mid[2], tx, y + H, tz, R0 * 0.7, R0 * 0.3, bark, 7, false, true);
  B.rough = 0.12;
  const nb = 3 + ((rng() * 3) | 0);
  for (let k = 0; k < nb; k++) {
    const t = 0.45 + rng() * 0.55, a = rng() * TAU;
    const bx = lerp(x, tx, t), bz = lerp(z, tz, t), by = y + H * t;
    branchTree(B, rng, bx, by, bz, Math.cos(a), 0.35 + rng() * 0.7, Math.sin(a), (1.4 + rng() * 1.8) * sc * (1.1 - t * 0.4), 0.11 * sc * (1.2 - t * 0.5), 2, bark);
  }
  B.rough = 0;
  cols.push([x, z, R0 * 1.15]);
}
// голый куст из тонких прутьев
function bareBush(B, rng, x, y, z, sc) {
  const col = jit([0.26, 0.2, 0.15], 0.25, rng), n = 6 + ((rng() * 4) | 0);
  for (let k = 0; k < n; k++) {
    const a = rng() * TAU, sp = 0.2 + rng() * 0.7;
    branchTree(B, rng, x + (rng() - 0.5) * 0.3, y, z + (rng() - 0.5) * 0.3, Math.cos(a) * sp, 1, Math.sin(a) * sp, (0.8 + rng() * 0.7) * sc, 0.018, 1, col);
  }
  if (rng() < 0.4) { // редкие уцелевшие листья
    const c = jit(FOLIAGE[(rng() * FOLIAGE.length) | 0], 0.15, rng);
    for (let k = 0; k < 3; k++) B.blob(x + (rng() - 0.5) * 0.9, y + 0.7 + rng() * 0.6, z + (rng() - 0.5) * 0.9, 0.22, 0.14, 0.22, c, rng, 0.3, 0.1);
  }
}

function treeApple(B, cols, rng, x, y, z, sc) {
  B.limb(x, y - 0.2, z, x, y + 1.7 * sc, z, 0.17 * sc, 0.1 * sc, jit(BARK, 0.1, rng), 6, false, true);
  const base = rng() < 0.5 ? [0.58, 0.58, 0.18] : [0.80, 0.62, 0.15];
  for (let k = 0; k < 4; k++) {
    const a = rng() * TAU, r = rng() * 0.9 * sc;
    B.blob(x + Math.cos(a) * r, y + (2.4 + rng() * 0.7) * sc, z + Math.sin(a) * r, 1.3 * sc, 1.0 * sc, 1.3 * sc, jit(base, 0.1, rng), rng, 0.2, 0.12);
  }
  for (let k = 0; k < 6; k++) {
    const a = rng() * TAU, r = 1.0 + rng() * 0.7;
    B.blob(x + Math.cos(a) * r * sc, y + (1.9 + rng() * 1.3) * sc, z + Math.sin(a) * r * sc, 0.13, 0.13, 0.13, [0.82, 0.14, 0.1], rng, 0.1, 0.1);
  }
  cols.push([x, z, 0.3 * sc]);
}

// ---------------- Постройки ----------------
const WALLS = [[0.42, 0.28, 0.16], [0.38, 0.26, 0.15], [0.32, 0.48, 0.68], [0.34, 0.55, 0.45], [0.88, 0.76, 0.40], [0.86, 0.85, 0.80], [0.55, 0.30, 0.18], [0.70, 0.45, 0.25]];
const ROOFS = [[0.55, 0.20, 0.15], [0.26, 0.46, 0.30], [0.36, 0.38, 0.42], [0.40, 0.30, 0.20], [0.50, 0.18, 0.12]];

function emitHouse(B, ctx, it) {
  const rng = ctx.rng, c = Math.cos(it.rot), s = Math.sin(it.rot);
  const Lp = (lx, ly, lz) => [it.x + lx * c + lz * s, it.y + ly, it.z - lx * s + lz * c];
  const Lv = (lx, ly, lz) => [lx * c + lz * s, ly, -lx * s + lz * c];
  const { w, d, h } = it;
  const gray = (c, k) => { const m = (c[0] + c[1] + c[2]) / 3; return [lerp(c[0], m, 0.55) * k, lerp(c[1], m, 0.55) * k, lerp(c[2], m, 0.55) * k]; };
  const wall = gray(it.wall, 0.72), dark = [wall[0] * 0.7, wall[1] * 0.7, wall[2] * 0.7]; it = Object.assign({}, it, { roof: gray(it.roof, 0.6), lit: false });
  const part = (lx, ly, lz, sx, sy, sz, col) => { const p = Lp(lx, ly, lz); B.box(p[0], p[1], p[2], sx, sy, sz, it.rot, col); };
  part(0, 0.18, 0, w + 0.35, 0.36, d + 0.35, [0.5, 0.49, 0.46]);          // фундамент
  part(0, 0.36 + (h - 0.36) / 2, 0, w, h - 0.36, d, wall);                  // стены
  for (let y = 0.8; y < h - 0.2; y += 0.55) part(0, y, 0, w + 0.1, 0.09, d + 0.1, dark); // венцы
  // двускатная крыша
  const rh = 1.55 + rng() * 0.4, ex = w / 2 + 0.45, ez = d / 2 + 0.55;
  const len = Math.hypot(rh, ez), sa = rh / len, ca = ez / len;
  for (const sg of [1, -1]) {
    const p = Lp(0, h + rh / 2 + 0.04, sg * ez / 2);
    B.obox(p, Lv(1, 0, 0), Lv(0, ca, sg * sa), Lv(0, -sa, sg * ca), ex, 0.07, len / 2 + 0.1, it.roof);
  }
  for (const sx of [1, -1]) { // фронтоны
    const a = Lp(sx * (w / 2 + 0.02), h, d / 2), b = Lp(sx * (w / 2 + 0.02), h, -d / 2), cc = Lp(sx * (w / 2 + 0.02), h + rh * 0.92, 0);
    const m = Lp(0, h + 0.5, 0);
    B.t(a[0], a[1], a[2], b[0], b[1], b[2], cc[0], cc[1], cc[2], wall, m[0], m[1], m[2]);
  }
  // дверь, окна
  part(it.doorX, 1.05, d / 2 + 0.03, 0.95, 2.05, 0.1, [0.01, 0.01, 0.01]); // тёмный проём
  { const a = 1.15, hx = it.doorX - 0.47, hp = Lp(hx + Math.cos(a) * 0.47, 1.05, d / 2 + Math.sin(a) * 0.47); B.box(hp[0], hp[1], hp[2], 0.94, 2.0, 0.06, it.rot - a, [0.2, 0.14, 0.1]); } // приоткрытая дверь
  part(it.doorX, 0.2, d / 2 + 0.35, 1.3, 0.2, 0.7, [0.55, 0.53, 0.5]);
  for (const wx of [-w * 0.3, w * 0.3]) {
    if (Math.abs(wx - it.doorX) < 1.2) continue;
    part(wx, 1.75, d / 2 + 0.03, 0.98, 0.98, 0.09, [0.9, 0.88, 0.82]);
    part(wx, 1.75, d / 2 + 0.05, 0.78, 0.78, 0.09, it.lit ? [0.95, 0.78, 0.38] : [0.04, 0.05, 0.06]);
  }
  part(w / 2 + 0.03, 1.75, 0, 0.09, 0.9, 0.9, [0.9, 0.88, 0.82]);
  part(w / 2 + 0.05, 1.75, 0, 0.09, 0.72, 0.72, [0.04, 0.05, 0.06]);
  // труба
  part(-w * 0.22, h + rh + 0.1, -d * 0.12, 0.55, 1.5, 0.55, [0.5, 0.28, 0.22]);
  ctx.boxes.push({ x: it.x, z: it.z, hx: w / 2 + 0.3, hz: d / 2 + 0.3, c, s });
}

function emitChapel(B, ctx, it) {
  const c = Math.cos(it.rot), s = Math.sin(it.rot);
  const Lp = (lx, ly, lz) => [it.x + lx * c + lz * s, it.y + ly, it.z - lx * s + lz * c];
  const part = (lx, ly, lz, sx, sy, sz, col) => { const p = Lp(lx, ly, lz); B.box(p[0], p[1], p[2], sx, sy, sz, it.rot, col); };
  const white = [0.6, 0.59, 0.55], rng = ctx.rng;
  part(0, 2.6, 0, 6, 5.2, 4.6, white);
  part(0, 0.15, 0, 6.3, 0.3, 4.9, [0.5, 0.49, 0.46]);
  const rh = 1.6, ex = 3.3, ez = 2.6, len = Math.hypot(rh, ez), sa = rh / len, ca = ez / len;
  const Lv = (lx, ly, lz) => [lx * c + lz * s, ly, -lx * s + lz * c];
  for (const sg of [1, -1]) B.obox(Lp(0, 5.2 + rh / 2, sg * ez / 2), Lv(1, 0, 0), Lv(0, ca, sg * sa), Lv(0, -sa, sg * ca), ex, 0.08, len / 2 + 0.1, [0.25, 0.42, 0.3]);
  part(0, 6.2, -1.4, 2.0, 2.6, 2.0, white);               // колокольня
  const dm = Lp(0, 8.4, -1.4);
  B.blob(dm[0], dm[1], dm[2], 1.25, 1.7, 1.25, [0.5, 0.42, 0.2], rng, 0.04, 0.05);
  B.limb(dm[0], dm[1] + 1.4, dm[2], dm[0], dm[1] + 2.9, dm[2], 0.05, 0.05, [0.5, 0.42, 0.2], 4, true, true);
  B.limb(dm[0] - 0.4, dm[1] + 2.35, dm[2], dm[0] + 0.4, dm[1] + 2.35, dm[2], 0.04, 0.04, [0.5, 0.42, 0.2], 4, true, true);
  part(0, 1.1, 2.33, 1.2, 2.2, 0.15, [0.30, 0.18, 0.1]);
  part(-1.8, 3.2, 2.33, 0.7, 1.4, 0.12, [0.03, 0.04, 0.05]);
  part(1.8, 3.2, 2.33, 0.7, 1.4, 0.12, [0.03, 0.04, 0.05]);
  ctx.boxes.push({ x: it.x, z: it.z, hx: 3.3, hz: 2.6, c, s });
}

function emitWell(B, ctx, it) {
  const rng = ctx.rng, { x, y, z } = it;
  B.limb(x, y, z, x, y + 0.95, z, 1.0, 0.95, [0.55, 0.53, 0.5], 10, true, true);
  B.limb(x, y + 0.93, z, x, y + 0.96, z, 0.72, 0.72, [0.1, 0.16, 0.2], 10, true, true);
  const wd = [0.36, 0.25, 0.15];
  B.limb(x - 0.95, y, z, x - 0.95, y + 2.4, z, 0.08, 0.08, wd, 4, false, true);
  B.limb(x + 0.95, y, z, x + 0.95, y + 2.4, z, 0.08, 0.08, wd, 4, false, true);
  B.limb(x - 0.95, y + 2.0, z, x + 0.95, y + 2.0, z, 0.06, 0.06, wd, 4, false, false);
  B.box(x, y + 2.55, z, 2.3, 0.08, 1.7, 0, [0.4, 0.28, 0.18]);
  B.box(x, y + 1.35, z + 0.8, 0.3, 0.3, 0.3, 0, [0.35, 0.3, 0.25]);
  ctx.circ.push([x, z, 1.1]);
}
function emitHay(B, ctx, it) {
  const { x, y, z } = it, rng = ctx.rng;
  B.blob(x, y + 0.9, z, 1.7, 1.6, 1.7, jit([0.80, 0.66, 0.28], 0.1, rng), rng, 0.08, 0.1);
  B.blob(x, y + 2.0, z, 0.8, 0.7, 0.8, jit([0.78, 0.64, 0.26], 0.1, rng), rng, 0.08, 0.1);
  ctx.circ.push([x, z, 1.5]);
}
function emitWood(B, ctx, it) {
  const { x, y, z, rot } = it, rng = ctx.rng, c = Math.cos(rot), s = Math.sin(rot);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) {
    const lx = (k - (5 - r) / 2) * 0.27, ly = 0.13 + r * 0.24;
    const px = x + lx * c, pz = z - lx * s;
    B.limb(px - s * 0.7, y + ly, pz - c * 0.7, px + s * 0.7, y + ly, pz + c * 0.7, 0.12, 0.12, jit([0.5, 0.36, 0.22], 0.2, rng), 5, true, true);
  }
  ctx.circ.push([x, z, 1.0]);
}
function emitFence(B, ctx, it) {
  const rng = ctx.rng, wd = [0.42, 0.32, 0.22];
  const { x0, z0, x1, z1, y } = it, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2));
  for (let k = 0; k <= n; k++) {
    const t = k / n, px = lerp(x0, x1, t), pz = lerp(z0, z1, t);
    if (rng() < 0.2) continue;
    B.limb(px, y - 0.1, pz, px + (rng() - 0.5) * 0.25, y + 1.25 - rng() * 0.5, pz, 0.07, 0.06, jit(wd, 0.2, rng), 4, false, true);
    if (k < n && rng() < 0.7) {
      const qx = lerp(x0, x1, (k + 1) / n), qz = lerp(z0, z1, (k + 1) / n);
      for (const hy of [0.45, 0.95]) B.limb(px, y + hy, pz, qx, y + hy + (rng() - 0.5) * 0.06, qz, 0.045, 0.045, jit(wd, 0.2, rng), 4, false, false);
    }
  }
}
function emitPaperItem(B, ctx, it) { paper(B, ctx, it.x, it.y, it.z, it.rot || 0, it.id); }
function emitTree(B, ctx, it) { const f = { broad: treeBroad, birch: treeBirch, spruce: treeSpruce, dead: treeDead, apple: treeDead }[it.type]; f(B, ctx.circ, ctx.rng, it.x, it.y, it.z, it.sc || 1); }

// ---------------- Раскладка деревни ----------------
function layoutOf(v) {
  if (v.layout) return v.layout;
  const rng = mulberry32((v.id * 2654435761 + 77) >>> 0), items = [];
  const ca = Math.cos(v.ang), sa = Math.sin(v.ang), ax = [ca, sa], px = [-sa, ca];
  const place = (al, of) => ({ x: v.x + ax[0] * al + px[0] * of, z: v.z + ax[1] * al + px[1] * of });
  const inside = (p, r) => Math.hypot(p.x - v.x, p.z - v.z) <= r;
  const n = 8 + ((rng() * 3) | 0);
  const houses = [];
  for (let i = 0; i < n; i++) {
    const side = (i & 1) ? 1 : -1;
    const al = ((i >> 1) - (n / 4 - 0.5)) * 11.5 + (rng() - 0.5) * 2.5, of = side * (9.5 + rng() * 3);
    const p = place(al, of);
    if (!inside(p, 31)) continue;
    const fx = -side * px[0], fz = -side * px[1];
    const w = 5.6 + rng() * 2.2, d = 4.6 + rng() * 1.8;
    const it = {
      kind: 'house', x: p.x, z: p.z, y: v.h, rot: Math.atan2(fx, fz) + (rng() - 0.5) * 0.14, w, d, h: 2.6 + rng() * 0.6,
      wall: WALLS[(rng() * WALLS.length) | 0], roof: ROOFS[(rng() * ROOFS.length) | 0], doorX: (rng() - 0.5) * w * 0.3, lit: rng() < 0.5,
    };
    items.push(it); houses.push(it);
  }
  const c0 = place(-27, -5);
  items.push({ kind: 'chapel', x: c0.x, z: c0.z, y: v.h, rot: Math.atan2(ax[0], ax[1]) });
  items.push({ kind: 'well', x: v.x + px[0] * 2.5, z: v.z + px[1] * 2.5, y: v.h });
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i], c = Math.cos(h.rot), s = Math.sin(h.rot);
    const back = (lx, lz) => ({ x: h.x + lx * c + lz * s, z: h.z - lx * s + lz * c });
    if (i % 3 === 0) { const p = back(h.w / 2 + 1.5, -h.d / 2 + 0.5); items.push({ kind: 'wood', x: p.x, z: p.z, y: v.h, rot: h.rot }); }
    if (i % 2 === 0) {
      const a = back(-h.w / 2 - 1, -h.d / 2 - 5), b = back(h.w / 2 + 1, -h.d / 2 - 5), c1 = back(h.w / 2 + 1, -h.d / 2 - 0.5);
      if (inside(a, 36) && inside(b, 36)) {
        items.push({ kind: 'fence', x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, x0: a.x, z0: a.z, x1: b.x, z1: b.z, y: v.h });
        items.push({ kind: 'fence', x: (b.x + c1.x) / 2, z: (b.z + c1.z) / 2, x0: b.x, z0: b.z, x1: c1.x, z1: c1.z, y: v.h });
      }
    }
    if (rng() < 0.75) { const p = back((rng() - 0.5) * h.w * 0.8, -h.d / 2 - 3.2 - rng() * 1.5); if (inside(p, 35)) items.push({ kind: 'tree', type: 'dead', x: p.x, z: p.z, y: v.h, sc: 0.9 + rng() * 0.3 }); }
  }
  for (let k = 0; k < 3; k++) {
    const p = place((rng() - 0.5) * 50, (rng() < 0.5 ? -1 : 1) * (22 + rng() * 5));
    if (inside(p, 33)) items.push({ kind: 'hay', x: p.x, z: p.z, y: v.h });
  }
  { const nid = 3 + (Math.abs(v.id) % 3), h0 = houses[0];
    if (h0) { const c = Math.cos(h0.rot), sn = Math.sin(h0.rot), lz = h0.d / 2 + 1.4, lx = h0.doorX + 0.6;
      items.push({ kind: 'paper', x: h0.x + lx * c + lz * sn, z: h0.z - lx * sn + lz * c, y: v.h, rot: h0.rot, id: nid }); } }
  for (const it of items) it.vid = v.id;
  v.layout = items;
  return items;
}

// ---------------- Лагерь ----------------
function makeCamp() {
  const items = [], C = CAMP, gy = (x, z) => heightAt(x, z);
  const add = (x, z, fn) => items.push({ kind: 'camp', x, z, fn });
  const DARK = [0.13, 0.13, 0.15];
  add(C.x, C.z, (B, ctx) => {
    const rng = ctx.rng, y = gy(C.x, C.z);
    B.blob(C.x, y + 0.2, C.z, 1.0, 0.5, 0.82, [0.66, 0.64, 0.58], rng, 0.1, 0.07);            // большой камень, на нём костёр
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU + rng() * 0.3, r = 1.45 + rng() * 0.2, px = C.x + Math.cos(a) * r, pz = C.z + Math.sin(a) * r;
      B.blob(px, gy(px, pz) + 0.1, pz, 0.3, 0.22, 0.28, jit([0.52, 0.5, 0.46], 0.15, rng), rng, 0.2, 0.1);
    }
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU + 0.3;
      B.limb(C.x + Math.cos(a) * 0.65, y + 0.48, C.z + Math.sin(a) * 0.65, C.x + Math.cos(a) * 0.08, y + 1.0, C.z + Math.sin(a) * 0.08, 0.07, 0.055, jit([0.23, 0.16, 0.1], 0.3, rng), 5, true, true);
    }
    for (let k = 0; k < 4; k++) { // чёрные обугленные поленья
      const a = rng() * TAU;
      B.limb(C.x + Math.cos(a) * 0.5, y + 0.5, C.z + Math.sin(a) * 0.5, C.x - Math.cos(a) * 0.4, y + 0.55, C.z - Math.sin(a) * 0.4, 0.06, 0.06, [0.08, 0.07, 0.06], 5, true, true);
    }
    ctx.circ.push([C.x, C.z, 1.0]);
  });
  add(C.x + 5.2, C.z + 7.4, (B, ctx) => emitTent(B, ctx, C.x + 5.2, gy(C.x + 5.2, C.z + 7.4), C.z + 7.4, 3.6, [0.6, 0.33, 0.12], 1));
  const Tx = C.x - 4.6, Tz = C.z + 5.6, Try = 0.5;
  add(Tx, Tz, (B, ctx) => { // стол
    const y = gy(Tx, Tz), c = Math.cos(Try), s = Math.sin(Try), rng = ctx.rng;
    B.box(Tx, y + 0.74, Tz, 1.5, 0.05, 0.8, Try, [0.74, 0.76, 0.78]);
    for (const [lx, lz] of [[-0.65, -0.33], [0.65, -0.33], [-0.65, 0.33], [0.65, 0.33]]) {
      const px = Tx + lx * c + lz * s, pz = Tz - lx * s + lz * c;
      B.limb(px, gy(px, pz) - 0.05, pz, px, y + 0.72, pz, 0.025, 0.025, [0.3, 0.3, 0.32], 4, false, false);
    }
    B.limb(Tx - 0.25 * c, y + 0.77, Tz + 0.25 * s, Tx - 0.25 * c, y + 1.1, Tz + 0.25 * s, 0.06, 0.06, [0.72, 0.12, 0.1], 7, true, true); // термос
    B.box(Tx + 0.4 * c, y + 0.82, Tz - 0.4 * s, 0.3, 0.13, 0.22, Try, [0.25, 0.4, 0.28]);
    B.limb(Tx + 0.1, y + 0.77, Tz + 0.2, Tx + 0.1, y + 0.85, Tz + 0.2, 0.04, 0.04, [0.9, 0.88, 0.8], 7, true, true);
    ctx.circ.push([Tx, Tz, 0.85]);
  });
  const chairs = [[C.x + 2.6, C.z + 2.2], [C.x - 1.4, C.z + 3.2], [Tx + 1.5, Tz - 1.4], [C.x + 3.2, C.z - 0.3]];
  for (const [chx, chz] of chairs) add(chx, chz, (B, ctx) => { // складные стулья
    const y = gy(chx, chz), ry = Math.atan2(C.x - chx, C.z - chz), c = Math.cos(ry), s = Math.sin(ry);
    const P = (lx, lz) => [chx + lx * c + lz * s, chz - lx * s + lz * c];
    B.box(chx, y + 0.42, chz, 0.5, 0.05, 0.46, ry, DARK);
    const bk = P(0, -0.22);
    B.box(bk[0], y + 0.72, bk[1], 0.5, 0.42, 0.05, ry, DARK);
    for (const [lx, lz] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) { const p = P(lx, lz); B.limb(p[0], y, p[1], p[0], y + 0.42, p[1], 0.022, 0.022, [0.55, 0.55, 0.58], 4, false, false); }
    ctx.circ.push([chx, chz, 0.38]);
  });
  const Lx0 = C.x - 11, Lz0 = C.z + 1.5, Lx1 = C.x - 3.5, Lz1 = C.z + 9;
  add(Lx0, Lz0, (B, ctx) => { // поваленное дерево на склоне
    const rng = ctx.rng, bark = [0.42, 0.38, 0.33];
    B.limb(Lx0, gy(Lx0, Lz0) + 0.35, Lz0, Lx1, gy(Lx1, Lz1) + 2.6, Lz1, 0.26, 0.13, bark, 7, true, true);
    for (let k = 0; k < 4; k++) {
      const t = 0.3 + rng() * 0.6, bx = lerp(Lx0, Lx1, t), bz = lerp(Lz0, Lz1, t), by = lerp(gy(Lx0, Lz0) + 0.35, gy(Lx1, Lz1) + 2.6, t);
      B.limb(bx, by, bz, bx + (rng() - 0.5) * 2, by + 1 + rng(), bz + (rng() - 0.5) * 2, 0.07, 0.02, bark, 4, false, false);
    }
    ctx.circ.push([lerp(Lx0, Lx1, 0.2), lerp(Lz0, Lz1, 0.2), 0.45]);
  });
  add(C.x + 1, C.z - 2.5, (B, ctx) => { // дрова и рюкзак
    const rng = ctx.rng;
    for (let k = 0; k < 6; k++) {
      const ox = C.x + 0.2 + rng() * 1.4, oz = C.z - 3.2 + rng() * 1.2, a = rng() * 3;
      B.limb(ox, gy(ox, oz) + 0.1, oz, ox + Math.cos(a) * 1.1, gy(ox, oz) + 0.12, oz + Math.sin(a) * 1.1, 0.07, 0.06, jit([0.36, 0.26, 0.17], 0.3, rng), 5, true, true);
    }
    const bx = C.x + 3.4, bz = C.z + 4.2;
    B.box(bx, gy(bx, bz) + 0.3, bz, 0.42, 0.55, 0.28, 0.6, [0.3, 0.36, 0.2]);
  });
  return items;
}
const CAMP_ITEMS = makeCamp();

// ---------------- Записки, палатки, находки ----------------
function paper(B, ctx, x, y, z, rot, id) {
  B.box(x, y + 0.012, z, 0.3, 0.02, 0.21, rot, [0.82, 0.8, 0.7]);
  B.box(x + 0.02, y + 0.025, z, 0.2, 0.004, 0.012, rot, [0.25, 0.25, 0.3]);
  ctx.notes.push({ x, y: y + 0.05, z, id });
}
function emitTent(B, ctx, x, y, z, rot, col, note) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const Lp = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
  const Lv = (lx, ly, lz) => [lx * c + lz * s, ly, -lx * s + lz * c];
  const ex = 1.15, ez = 1.05, rh = 1.2, len = Math.hypot(rh, ez), sa = rh / len, ca = ez / len;
  for (const sg of [1, -1]) B.obox(Lp(0, rh / 2, sg * ez / 2), Lv(1, 0, 0), Lv(0, ca, sg * sa), Lv(0, -sa, sg * ca), ex, 0.015, len / 2, col);
  const f = (sx) => { const a = Lp(sx, 0, ez), b = Lp(sx, 0, -ez), t = Lp(sx, rh, 0), m = Lp(0, 0.4, 0); B.t(a[0], a[1], a[2], b[0], b[1], b[2], t[0], t[1], t[2], col, m[0], m[1], m[2]); };
  f(-ex);
  const a = Lp(ex, 0, ez), b = Lp(ex, 0, -ez), t = Lp(ex, rh, 0), m = Lp(0, 0.4, 0); // вход — тёмный
  B.t(a[0], a[1], a[2], b[0], b[1], b[2], t[0], t[1], t[2], [0.02, 0.02, 0.02], m[0], m[1], m[2]);
  const fl = Lp(0, 0.02, 0); B.box(fl[0], fl[1], fl[2], ex * 2, 0.03, ez * 2, rot, [0.12, 0.13, 0.1]);
  const sl = Lp(0, 0.1, 0); B.box(sl[0], sl[1], sl[2], 1.9, 0.12, 0.7, rot, [0.22, 0.28, 0.35]); // спальник
  ctx.boxes.push({ x, z, hx: ex + 0.1, hz: ez + 0.1, c, s });
  if (note) { const p = Lp(ex + 0.9, 0, 0.2); paper(B, ctx, p[0], heightAt(p[0], p[2]), p[2], rot + 0.4, note); }
}
function emitCairn(B, ctx, x, y, z, rng) {
  let r = 0.55;
  for (let k = 0; k < 5; k++) { B.blob(x + (rng() - 0.5) * 0.1, y + 0.12 + k * 0.2, z + (rng() - 0.5) * 0.1, r, 0.13, r * 0.9, jit([0.42, 0.41, 0.39], 0.12, rng), rng, 0.15, 0.1); r *= 0.78; }
  ctx.circ.push([x, z, 0.5]);
}
function emitPost(B, ctx, x, y, z, rng) {
  B.limb(x, y - 0.2, z, x + 0.05, y + 2.3, z, 0.06, 0.05, [0.3, 0.24, 0.18], 5, false, true);
  B.limb(x, y + 1.85, z, x + 0.6, y + 1.7, z + 0.2, 0.018, 0.018, [0.3, 0.24, 0.18], 4, false, false);
  B.box(x + 0.35, y + 1.55, z + 0.1, 0.28, 0.5, 0.01, 0.3, [0.55, 0.25, 0.12]); // выцветшая лента
  ctx.circ.push([x, z, 0.2]);
}
