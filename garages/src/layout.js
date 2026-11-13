// Детерминированная планировка бесконечного гаражного кооператива (порт GarageLayout.cs + GridNav.cs).
export const GarageW = 3.6, GarageD = 6.5, Wall = 0.25, WallH = 2.65, DoorW = 2.7, DoorH = 2.15;
export const MaxGarages = 8, BlockD = GarageD * 2, CrossAlley = 6, MainAlley = 8;
export const PeriodX = GarageW * MaxGarages + CrossAlley, PeriodZ = BlockD + MainAlley;
export const Seed = 1337;

const u32 = x => x >>> 0;
export function hash(x, z, salt) {
  let h = u32(Math.imul(Seed, 0x9E3779B1));
  h = u32(h ^ Math.imul(x >>> 0, 0x85EBCA6B)); h = u32((h << 13) | (h >>> 19));
  h = u32(h ^ Math.imul(z >>> 0, 0xC2B2AE35)); h = u32((h << 17) | (h >>> 15));
  h = u32(h ^ Math.imul(salt >>> 0, 0x27D4EB2F));
  h = u32(h ^ (h >>> 16)); h = u32(Math.imul(h, 0x7FEB352D)); h = u32(h ^ (h >>> 15));
  h = u32(Math.imul(h, 0x846CA68B)); h = u32(h ^ (h >>> 16));
  return h;
}
export const rand01 = (x, z, salt) => (hash(x, z, salt) & 0xFFFFFF) / 16777216;

export function getBlock(i, j) {
  return {
    exists: rand01(i, j, 1) > 0.07 || (i === 0 && j === 0),
    start: rand01(i, j, 2) < 0.2 ? 1 : 0,
    end: rand01(i, j, 3) < 0.2 ? MaxGarages - 1 : MaxGarages,
    plaster: rand01(i, j, 4) < 0.35,
  };
}
export const isOpen = (i, j, row, k) => rand01(i * 31 + k, j * 7 + row, 11) < 0.13;
export const cellOrigin = (i, j) => ({ x: i * PeriodX, z: j * PeriodZ });
export const cellOf = (x, z) => ({ i: Math.floor(x / PeriodX), j: Math.floor(z / PeriodZ) });
const key = (i, j) => i * 100003 + j;

// ---------- препятствия реквизита (Rect: xMin, zMin, w, h) ----------
const obstacles = new Map();
export function setObstacles(i, j, rects) { if (!rects) obstacles.delete(key(i, j)); else obstacles.set(key(i, j), rects); }
export const clearObstacles = () => obstacles.clear();

export function isBlocked(x, z, r) {
  const i = Math.floor(x / PeriodX), j = Math.floor(z / PeriodZ);
  for (let di = -1; di <= 0; di++) for (let dj = -1; dj <= 0; dj++) if (blockedByBlock(i + di, j + dj, x, z, r)) return true;
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
    const list = obstacles.get(key(i + di, j + dj));
    if (list) for (const rc of list)
      if (x > rc.x - r && x < rc.x + rc.w + r && z > rc.z - r && z < rc.z + rc.h + r) return true;
  }
  return false;
}
function blockedByBlock(i, j, x, z, r) {
  const b = getBlock(i, j);
  if (!b.exists) return false;
  const o = cellOrigin(i, j);
  const lx = x - o.x, lz = z - o.z;
  const x0 = b.start * GarageW, x1 = b.end * GarageW;
  if (lx < x0 - r || lx > x1 + r || lz < -r || lz > BlockD + r) return false;
  const k = Math.floor(lx / GarageW);
  if (k < b.start || k >= b.end) return true;
  const row = lz < GarageD ? 0 : 1;
  if (!isOpen(i, j, row, k)) return true;
  const cx = (k + 0.5) * GarageW;
  const half = DoorW * 0.5 - r;
  if (Math.abs(lx - cx) > half) return true;
  if (row === 0) return lz > GarageD - Wall - r;
  return lz < GarageD + Wall + r;
}

// ---------- физические коробки (вместо PhysX): поворот только вокруг Y ----------
const colliders = new Map();
export function setColliders(i, j, list) { if (!list) colliders.delete(key(i, j)); else colliders.set(key(i, j), list); }

function forCellsNear(x0, z0, x1, z1, fn) {
  const i0 = Math.floor(x0 / PeriodX) - 1, i1 = Math.floor(x1 / PeriodX) + 1;
  const j0 = Math.floor(z0 / PeriodZ) - 1, j1 = Math.floor(z1 / PeriodZ) + 1;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const l = colliders.get(key(i, j)); if (l) fn(l); }
}

// Выталкивает круг (x,z,r) из коробок, пересекающихся с вертикальным диапазоном [y0,y1]. Меняет p.x/p.z.
export function pushOut(p, r, y0, y1) {
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    forCellsNear(p.x, p.z, p.x, p.z, list => {
      for (const c of list) {
        if (c.maxY < y0 || c.minY > y1) continue;
        const dx = p.x - c.cx, dz = p.z - c.cz;
        if (dx > c.rad + r || dx < -c.rad - r || dz > c.rad + r || dz < -c.rad - r) continue;
        const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
        const px = Math.max(-c.hx, Math.min(c.hx, lx)), pz = Math.max(-c.hz, Math.min(c.hz, lz));
        let ox = lx - px, oz = lz - pz;
        const d2 = ox * ox + oz * oz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; ox *= k; oz *= k; }
        else { // центр внутри коробки — выталкиваем по ближайшей грани
          const ex = c.hx - Math.abs(lx), ez = c.hz - Math.abs(lz);
          if (ex < ez) { ox = (lx >= 0 ? 1 : -1) * (ex + r); oz = 0; } else { oz = (lz >= 0 ? 1 : -1) * (ez + r); ox = 0; }
        }
        p.x += ox * c.cos + oz * c.sin; p.z += -ox * c.sin + oz * c.cos;
        moved = true;
      }
    });
    if (!moved) break;
  }
}

// Отрезок (a→b) пересекает какую-нибудь коробку? (замена Physics.Linecast)
export function linecast(ax, ay, az, bx, by, bz) {
  let hit = false;
  forCellsNear(Math.min(ax, bx) - 1, Math.min(az, bz) - 1, Math.max(ax, bx) + 1, Math.max(az, bz) + 1, list => {
    if (hit) return;
    for (const c of list) {
      const x0 = ax - c.cx, z0 = az - c.cz, x1 = bx - c.cx, z1 = bz - c.cz;
      const lax = x0 * c.cos - z0 * c.sin, laz = x0 * c.sin + z0 * c.cos;
      const lbx = x1 * c.cos - z1 * c.sin, lbz = x1 * c.sin + z1 * c.cos;
      const lay = ay - c.cy, lby = by - c.cy;
      let t0 = 0, t1 = 1;
      const slab = (a, b, h) => {
        const d = b - a;
        if (Math.abs(d) < 1e-9) return a >= -h && a <= h;
        let ta = (-h - a) / d, tb = (h - a) / d;
        if (ta > tb) { const t = ta; ta = tb; tb = t; }
        if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
        return t0 <= t1;
      };
      if (slab(lax, lbx, c.hx) && slab(lay, lby, c.hy) && slab(laz, lbz, c.hz)) { hit = true; return; }
    }
  });
  return hit;
}

export function makeCollider(cx, cy, cz, sx, sy, sz, yawDeg) {
  const a = yawDeg * Math.PI / 180;
  const hx = sx / 2, hz = sz / 2;
  return { cx, cy, cz, hx, hy: sy / 2, hz, cos: Math.cos(a), sin: Math.sin(a),
    minY: cy - sy / 2, maxY: cy + sy / 2, rad: Math.hypot(hx, hz) };
}
// cos/sin здесь — для перехода в локальную систему коробки: l = R(-yaw)*d

// ================= GridNav: A* по сетке 0.5 м =================
const CELL = 0.5, MAX_NODES = 9000;
const nk = (x, z) => x * 65536 + z; // |x|,|z| < 32768 клеток на практике
export const walkable = (x, z, r) => !isBlocked(x, z, r);
const walkCell = (x, z, r) => !isBlocked(x * CELL, z * CELL, r);

export function clear(ax, az, bx, bz, r) {
  const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
  const steps = Math.ceil(len / 0.35);
  for (let i = 1; i <= steps; i++) if (isBlocked(ax + dx * (i / steps), az + dz * (i / steps), r)) return false;
  return true;
}
export function nearestWalkable(x, z, r) {
  if (walkable(x, z, r)) return { x, z };
  for (let ring = 1; ring < 20; ring++) for (let k = 0; k < 16; k++) {
    const a = k / 16 * Math.PI * 2, qx = x + Math.cos(a) * ring * 0.5, qz = z + Math.sin(a) * ring * 0.5;
    if (walkable(qx, qz, r)) return { x: qx, z: qz };
  }
  return { x, z };
}
const H = (x, z, tx, tz) => { const dx = Math.abs(x - tx), dz = Math.abs(z - tz); return dx + dz + (1.4142 - 2) * Math.min(dx, dz); };

export function findPath(fx, fz, tx0, tz0, r, path) {
  path.length = 0;
  const to = nearestWalkable(tx0, tz0, r);
  if (clear(fx, fz, to.x, to.z, r)) { path.push({ x: to.x, z: to.z }); return true; }
  const nodes = [], index = new Map(), closed = new Set(), open = [];
  const sx = Math.round(fx / CELL), sz = Math.round(fz / CELL), tx = Math.round(to.x / CELL), tz = Math.round(to.z / CELL);
  nodes.push({ x: sx, z: sz, g: 0, f: H(sx, sz, tx, tz), parent: -1 });
  index.set(nk(sx, sz), 0); open.push(0);
  let best = 0, bestH = Infinity;
  const push = n => {
    open.push(n); let i = open.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (nodes[open[p]].f <= nodes[open[i]].f) break; [open[p], open[i]] = [open[i], open[p]]; i = p; }
  };
  const pop = () => {
    const top = open[0], last = open.pop();
    if (open.length) {
      open[0] = last; let i = 0;
      for (;;) {
        const l = i * 2 + 1, rr = l + 1; let m = i;
        if (l < open.length && nodes[open[l]].f < nodes[open[m]].f) m = l;
        if (rr < open.length && nodes[open[rr]].f < nodes[open[m]].f) m = rr;
        if (m === i) break; [open[m], open[i]] = [open[i], open[m]]; i = m;
      }
    }
    return top;
  };
  while (open.length && nodes.length < MAX_NODES) {
    const cur = pop(), cn = nodes[cur], ck = nk(cn.x, cn.z);
    if (closed.has(ck)) continue;
    closed.add(ck);
    const h = H(cn.x, cn.z, tx, tz);
    if (h < bestH) { bestH = h; best = cur; }
    if (cn.x === tx && cn.z === tz) { best = cur; break; }
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      const x = cn.x + dx, z = cn.z + dz, k = nk(x, z);
      if (closed.has(k) || !walkCell(x, z, r)) continue;
      if (dx && dz && (!walkCell(cn.x + dx, cn.z, r) || !walkCell(cn.x, cn.z + dz, r))) continue;
      const g = cn.g + (dx && dz ? 1.4142 : 1);
      const ni = index.get(k);
      if (ni !== undefined) {
        if (g >= nodes[ni].g) continue;
        nodes[ni].g = g; nodes[ni].f = g + H(x, z, tx, tz); nodes[ni].parent = cur; push(ni);
      } else { nodes.push({ x, z, g, f: g + H(x, z, tx, tz), parent: cur }); index.set(k, nodes.length - 1); push(nodes.length - 1); }
    }
  }
  const raw = [];
  for (let n = best; n >= 0; n = nodes[n].parent) raw.push({ x: nodes[n].x * CELL, z: nodes[n].z * CELL });
  raw.reverse();
  if (!raw.length) return false;
  let ax = fx, az = fz, iRaw = 0;
  while (iRaw < raw.length) {
    let far = iRaw;
    for (let k = raw.length - 1; k > iRaw; k--) if (clear(ax, az, raw[k].x, raw[k].z, r)) { far = k; break; }
    path.push(raw[far]); ax = raw[far].x; az = raw[far].z; iRaw = far + 1;
  }
  return bestH < 2;
}
