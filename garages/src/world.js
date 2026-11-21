// Бесконечный гаражный кооператив (порт GarageWorld.cs + MeshBuilder.cs).
import * as THREE from 'three';
import * as L from './layout.js';
import { DotNetRandom, perlin } from './rng.js';
const { GarageW, GarageD, Wall, WallH, DoorW, DoorH, MaxGarages, BlockD, PeriodX, PeriodZ, MainAlley } = L;
const D2R = Math.PI / 180;

// ---------- сборка коробок/шаблонов в один меш на материал ----------
const FACE_N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FACES = FACE_N.map((N, f) => { const V = (f === 2 || f === 3) ? [0, 0, 1] : [0, 1, 0]; return { N, V, U: cross(N, V) }; });

class MeshBuilder {
  constructor() { this.bufs = new Map(); }
  buf(k) { let b = this.bufs.get(k); if (!b) { b = { v: [], n: [], uv: [], idx: [] }; this.bufs.set(k, b); } return b; }
  box(key, cx, cy, cz, sx, sy, sz, yaw, tile, worldUV = true, uox = 0, uoy = 0) {
    const b = this.buf(key), c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R);
    const rot = v => [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
    const h = [sx / 2, sy / 2, sz / 2];
    for (const { N, V, U } of FACES) {
      const hn = Math.abs(dot(h, N)), hu = Math.abs(dot(h, U)), hv = Math.abs(dot(h, V));
      const ce = [N[0] * hn, N[1] * hn, N[2] * hn];
      const p = [[-1, -1], [-1, 1], [1, 1], [1, -1]].map(([a, bb]) =>
        [ce[0] + U[0] * hu * a + V[0] * hv * bb, ce[1] + U[1] * hu * a + V[1] * hv * bb, ce[2] + U[2] * hu * a + V[2] * hv * bb]);
      const wN = rot(N), wU = rot(U), wV = rot(V), base = b.v.length / 3;
      for (const q of p) {
        const r = rot(q), wp = [cx + r[0], cy + r[1], cz + r[2]];
        b.v.push(wp[0], wp[1], wp[2]); b.n.push(wN[0], wN[1], wN[2]);
        const u = worldUV ? dot(wp, wU) : dot(q, U) + hu, v = worldUV ? dot(wp, wV) : dot(q, V) + hv;
        b.uv.push(u / tile + uox, v / tile + uoy);
      }
      b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  prop(t, x, y, z, yaw) {
    const b = this.buf(t.matKey), c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R), base = b.v.length / 3;
    for (let i = 0; i < t.P.length; i += 3) {
      const px = t.P[i], py = t.P[i + 1], pz = t.P[i + 2], nx = t.N[i], nz = t.N[i + 2];
      b.v.push(x + px * c + pz * s, y + py, z - px * s + pz * c);
      b.n.push(nx * c + nz * s, t.N[i + 1], -nx * s + nz * c);
    }
    for (let i = 0; i < t.UV.length; i++) b.uv.push(t.UV[i]);
    for (let i = 0; i < t.I.length; i++) b.idx.push(base + t.I[i]);
  }
  quad(key, a, bb, c, d, n) { // 4 вершины, 2 стороны не нужны (материал DoubleSide)
    const b = this.buf(key), base = b.v.length / 3;
    for (const p of [a, bb, c, d]) { b.v.push(p[0], p[1], p[2]); b.n.push(n[0], n[1], n[2]); b.uv.push(0, 0); }
    b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  build(group, mats, shadows = true) {
    for (const [k, b] of this.bufs) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.v, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      g.setIndex(b.v.length / 3 > 65000 ? new THREE.Uint32BufferAttribute(b.idx, 1) : new THREE.Uint16BufferAttribute(b.idx, 1));
      const m = new THREE.Mesh(g, mats[k]);
      m.castShadow = shadows && k !== 'wire'; m.receiveShadow = k !== 'wire'; m.matrixAutoUpdate = false;
      group.add(m);
    }
    this.bufs.clear();
  }
}

const JUNK = ['old_tyre', 'barrel_03', 'trashbag', 'cardboard_box_01', 'wooden_crate_01', 'metal_jerrycan', 'rusted_wheel_rim_01', 'plastic_crate_01', 'cement_bag', 'trashbag', 'barrel_03'];
const LAMP_DEF = {
  spotStreet: { type: 'spot', color: [1, .6, .28], intensity: 9, range: 22 },
  spotWall: { type: 'spot', color: [.82, .88, 1], intensity: 3.5, range: 12 },
  pointBulb: { type: 'point', color: [1, .72, .42], intensity: 1.6, range: 7 },
};

export class GarageWorld {
  constructor(root, assets, viewRadius = 56) {
    this.root = root; this.M = assets.M; this.props = assets.props; this.viewRadius = viewRadius;
    this.chunks = new Map(); this.timer = 0; this.lamps = new Set(); this.time = 0;
    this.bulbGeo = new THREE.SphereGeometry(0.06, 8, 6);
    this.junk = JUNK.map(n => this.props[n]);
  }
  update(dt, p) {
    this.timer -= dt; if (this.timer > 0) return; this.timer = 0.1;
    this.updateChunks(p, 1);
  }
  updateChunks(p, budget) {
    const ri = Math.ceil(this.viewRadius / PeriodX) + 1, rj = Math.ceil(this.viewRadius / PeriodZ) + 1, c = L.cellOf(p.x, p.z);
    const wanted = [];
    for (let i = c.i - ri; i <= c.i + ri; i++) for (let j = c.j - rj; j <= c.j + rj; j++) {
      const d = this.distToCell(p, i, j); if (d < this.viewRadius) wanted.push([i, j, d]);
    }
    wanted.sort((a, b) => a[2] - b[2]);
    for (const [i, j] of wanted) {
      const k = i + ',' + j; if (this.chunks.has(k)) continue;
      if (budget-- <= 0) break; this.chunks.set(k, this.buildChunk(i, j));
    }
    for (const [k, ch] of this.chunks) {
      if (this.distToCell(p, ch.i, ch.j) > this.viewRadius + 25) { this.destroyChunk(ch); this.chunks.delete(k); }
    }
  }
  distToCell(p, i, j) {
    const o = L.cellOrigin(i, j);
    const dx = Math.max(o.x - p.x, 0, p.x - (o.x + PeriodX)), dz = Math.max(o.z - p.z, 0, p.z - (o.z + PeriodZ));
    return Math.hypot(dx, dz);
  }
  destroyChunk(ch) {
    this.root.remove(ch.group);
    ch.group.traverse(o => { if (o.geometry && o.geometry !== this.bulbGeo) o.geometry.dispose(); if (o.userData.bulbMat) o.userData.bulbMat.dispose(); });
    for (const l of ch.lamps) this.lamps.delete(l);
    L.setObstacles(ch.i, ch.j, null); L.setColliders(ch.i, ch.j, null);
  }

  // ----------------------------------------------------------------
  buildChunk(i, j) {
    const ch = { i, j, group: new THREE.Group(), lamps: [], cols: [], obs: [], mb: new MeshBuilder() };
    const rnd = new DotNetRandom(L.hash(i, j, 99) | 0);
    const o = L.cellOrigin(i, j), block = L.getBlock(i, j);
    ch.group.matrixAutoUpdate = false;
    const gc = [o.x + PeriodX * .5, -0.1, o.z + PeriodZ * .5];
    ch.mb.box('asphalt', gc[0], gc[1], gc[2], PeriodX, 0.2, PeriodZ, 0, 5);
    this.col(ch, gc[0], gc[1], gc[2], PeriodX, 0.2, PeriodZ, 0);
    if (block.exists) this.buildBlock(ch, i, j, block, o, rnd); else this.buildEmptyLot(ch, o, rnd);
    this.buildAlleyProps(ch, i, j, block, o, rnd);
    this.buildPoleAndLamp(ch, i, j, o, rnd);
    ch.mb.build(ch.group, this.M);
    ch.group.updateMatrixWorld(true);
    this.root.add(ch.group);
    L.setObstacles(i, j, ch.obs); L.setColliders(i, j, ch.cols);
    return ch;
  }
  col(ch, cx, cy, cz, sx, sy, sz, yaw) { ch.cols.push(L.makeCollider(cx, cy, cz, sx, sy, sz, yaw)); }

  buildBlock(ch, i, j, b, o, rnd) {
    const mb = ch.mb, wall = b.plaster ? 'plaster' : 'brick';
    const x0 = o.x + b.start * GarageW, x1 = o.x + b.end * GarageW, len = x1 - x0, cx = (x0 + x1) * .5, H = WallH;
    mb.box('roof', cx, H + .09, o.z + BlockD * .5, len + .5, .18, BlockD + .8, 0, 4);
    mb.box('concrete', cx, H - .02, o.z + BlockD * .5, len + .3, .12, BlockD + .5, 0, 3);
    this.col(ch, cx, H + .09, o.z + BlockD * .5, len + .5, .18, BlockD + .8, 0);
    mb.box(wall, cx, H * .5, o.z + GarageD, len, H, Wall * 1.2, 0, 3);
    this.col(ch, cx, H * .5, o.z + GarageD, len, H, Wall * 1.2, 0);
    for (let k = b.start; k <= b.end; k++) {
      const x = o.x + k * GarageW;
      mb.box(wall, x, H * .5, o.z + BlockD * .5, Wall, H, BlockD, 0, 3);
      this.col(ch, x, H * .5, o.z + BlockD * .5, Wall, H, BlockD, 0);
    }
    for (let row = 0; row < 2; row++) {
      const fz = row === 0 ? o.z : o.z + BlockD, sgn = row === 0 ? -1 : 1;
      mb.box('concrete', cx, .03, fz + sgn * .6, len, .1, 1.2, 0, 3);
      for (let k = b.start; k < b.end; k++) this.buildGarageFront(ch, i, j, row, k, o, fz, sgn, wall, rnd);
    }
    if (rnd.nextDouble() < 0.3) {
      const px = rnd.nextDouble() < 0.5 ? x0 - .15 : x1 + .15;
      const pz = o.z + GarageD + (rnd.nextDouble() * 4 - 2);
      this.spawn(ch, 'utility_box_01', px, 1.1, pz, px < cx ? -90 : 90, true);
    }
  }

  buildGarageFront(ch, i, j, row, k, o, fz, sgn, wall, rnd) {
    const mb = ch.mb, gx0 = o.x + k * GarageW, gx1 = gx0 + GarageW, gcx = (gx0 + gx1) * .5;
    const H = WallH, dw = DoorW, dh = DoorH, pier = (GarageW - dw) * .5, wz = fz - sgn * Wall * .5;
    mb.box(wall, gx0 + pier * .5, H * .5, wz, pier, H, Wall, 0, 3);
    mb.box(wall, gx1 - pier * .5, H * .5, wz, pier, H, Wall, 0, 3);
    mb.box('concrete', gcx, dh + (H - dh) * .5, wz, dw + .1, H - dh, Wall + .04, 0, 2);
    this.col(ch, gx0 + pier * .5, H * .5, wz, pier, H, Wall, 0);
    this.col(ch, gx1 - pier * .5, H * .5, wz, pier, H, Wall, 0);
    const fzOut = fz + sgn * .02;
    mb.box('doorFrame', gcx - dw * .5, dh * .5, fzOut, .06, dh, .06, 0, 1);
    mb.box('doorFrame', gcx + dw * .5, dh * .5, fzOut, .06, dh, .06, 0, 1);
    mb.box('doorFrame', gcx, dh, fzOut, dw + .06, .06, .06, 0, 1);
    const doorKey = 'door' + (L.hash(i * 13 + k, j * 5 + row, 21) % 6);
    const uox = L.rand01(i, k, row + 40), uoy = L.rand01(j, k, row + 41), leafW = dw * .5 - .02, open = L.isOpen(i, j, row, k);
    if (!open) {
      for (let s = -1; s <= 1; s += 2) {
        const cx = gcx + s * dw * .25, cy = dh * .5, cz = fz + sgn * .03;
        mb.box(doorKey, cx, cy, cz, leafW, dh - .04, .05, 0, 2.2, false, uox, uoy);
        mb.box('doorFrame', cx, cy - .25, cz + sgn * .03, leafW - .06, .05, .02, 0, 1);
      }
      mb.box('doorFrame', gcx, 1.05, fz + sgn * .08, .14, .1, .06, 0, 1);
      this.col(ch, gcx, dh * .5, fz + sgn * .03, dw, dh, .1, 0);
    } else {
      const innerZ = fz - sgn * (GarageD * .5);
      mb.box('garageFloor', gcx, .01, innerZ, GarageW - Wall, .04, GarageD - Wall, 0, 3);
      const both = L.rand01(i + k, j + row, 55) < 0.4;
      for (let s = -1; s <= 1; s += 2) {
        const leafOpen = s === 1 || both, hingeX = gcx + s * dw * .5;
        const ang = leafOpen ? 35 + (105 - 35) * L.rand01(i + s, k + j, row + 60) : 0;
        const yaw = -s * sgn * ang, c = Math.cos(yaw * D2R), sn = Math.sin(yaw * D2R);
        const lx = -s * leafW * .5;
        const hx = hingeX, hy = dh * .5, hz = fz + sgn * .03;
        const cx = hx + lx * c, cz = hz - lx * sn;
        mb.box(doorKey, cx, hy, cz, leafW, dh - .04, .05, yaw, 2.2, false, uox, uoy);
        this.col(ch, cx, hy, cz, leafW, dh, .08, yaw);
        if (leafOpen) {
          const tx = hx + (-s * leafW) * c, tz = hz - (-s * leafW) * sn, pad = .12;
          ch.obs.push({ x: Math.min(hx, tx) - pad, z: Math.min(hz, tz) - pad, w: Math.abs(hx - tx) + pad * 2, h: Math.abs(hz - tz) + pad * 2 });
        }
      }
      const n = rnd.next(1, 4);
      for (let q = 0; q < n; q++) {
        const name = JUNK[rnd.next(JUNK.length)];
        const px = gcx + (rnd.nextDouble() * 2 - 1) * 1.1, pz = fz - sgn * (3.5 + rnd.nextDouble() * 2.3);
        this.spawn(ch, name, px, .03, pz, rnd.next(360), false);
      }
      if (rnd.nextDouble() < 0.3) this.spawn(ch, 'covered_car', gcx, .02, fz - sgn * 3.3, sgn > 0 ? 0 : 180, true);
      if (rnd.nextDouble() < 0.35) this.addLamp(ch, 'pointBulb', gcx, H - .35, fz - sgn * 3.5, [0, -1, 0], rnd, .5, true);
    }
    if (rnd.nextDouble() < 0.07) {
      const px = gcx, py = H - .15, pz = fz + sgn * .15;
      this.spawn(ch, 'security_light', px, py, pz, sgn > 0 ? 0 : 180, true);
      if (rnd.nextDouble() < 0.6) {
        const d = [0, -1, .6 * sgn], l = Math.hypot(...d);
        this.addLamp(ch, 'spotWall', px, py - .2, pz + sgn * .25, [d[0] / l, d[1] / l, d[2] / l], rnd, .45, false);
      }
    }
  }

  buildEmptyLot(ch, o, rnd) {
    const n = rnd.next(3, 7);
    for (let q = 0; q < n; q++) {
      const px = o.x + (2 + rnd.nextDouble() * (PeriodX - L.CrossAlley - 4)), pz = o.z + (1.5 + rnd.nextDouble() * (BlockD - 3));
      const name = q === 0 ? 'concrete_road_barrier' : JUNK[rnd.next(JUNK.length)];
      this.spawn(ch, name, px, 0, pz, rnd.next(360), true, true);
    }
  }

  buildAlleyProps(ch, i, j, b, o, rnd) {
    const zLow = o.z + BlockD + 1.4, zHigh = o.z + PeriodZ - 1.4, n = rnd.next(2, 6);
    for (let q = 0; q < n; q++) {
      const x = o.x + (rnd.nextDouble() * (PeriodX - 2) + 1);
      const z = rnd.nextDouble() < 0.5 ? zLow + rnd.nextDouble() * .4 : zHigh - rnd.nextDouble() * .4;
      this.junkCluster(ch, x, z, rnd);
    }
    if (rnd.nextDouble() < 0.22) {
      const low = rnd.nextDouble() < 0.5;
      const px = o.x + (4 + rnd.nextDouble() * (PeriodX - 14)), pz = low ? zLow + .6 : zHigh - .6;
      this.spawn(ch, 'covered_car', px, .02, pz, rnd.nextDouble() < 0.5 ? 90 : -90, true, true);
    }
    const xa = o.x + MaxGarages * GarageW, m = rnd.next(0, 3);
    for (let q = 0; q < m; q++) {
      const x = rnd.nextDouble() < 0.5 ? xa + .9 : o.x + PeriodX - .9;
      const z = o.z + (1 + rnd.nextDouble() * (BlockD - 2));
      this.junkCluster(ch, x, z, rnd);
    }
    if (rnd.nextDouble() < 0.25)
      this.spawn(ch, 'water_manhole_cover', o.x + (3 + rnd.nextDouble() * 20), 0, o.z + BlockD + MainAlley * .5, rnd.next(360), false);
  }

  junkCluster(ch, px, pz, rnd) {
    if (rnd.nextDouble() < 0.3) {
      const h = rnd.next(1, 5);
      for (let s = 0; s < h; s++) this.spawn(ch, 'old_tyre', px, s * .2, pz, rnd.next(360), true, s === 0);
      return;
    }
    const n = rnd.next(1, 4);
    for (let q = 0; q < n; q++) {
      const x = px + (rnd.nextDouble() - .5) * 1.6, z = pz + (rnd.nextDouble() - .5) * .6;
      this.spawn(ch, JUNK[rnd.next(JUNK.length)], x, 0, z, rnd.next(360), true, true);
    }
  }

  static polePos(i, j) { const o = L.cellOrigin(i, j); return [o.x + MaxGarages * GarageW + .6, 0, o.z + BlockD + .6]; }

  buildPoleAndLamp(ch, i, j, o, rnd) {
    const [px, , pz] = GarageWorld.polePos(i, j), mb = ch.mb;
    const lampHere = L.rand01(i, j, 70) < 0.55;
    if (lampHere) {
      const t = this.props.street_lamp_01;
      this.spawn(ch, 'street_lamp_01', px, 0, pz, 180, true, false);
      if (L.rand01(i, j, 71) < 0.7) this.addLamp(ch, 'spotStreet', px, t.size[1] - .3, pz, [0, -1, 0], rnd, .3, true);
    } else {
      mb.box('concrete', px, 3.5, pz, .24, 7, .24, 0, 2);
      mb.box('doorFrame', px, 6.6, pz, .08, .08, 1.2, 0, 1);
      this.col(ch, px, 3.5, pz, .24, 7, .24, 0);
    }
    ch.obs.push({ x: px - .25, z: pz - .25, w: .5, h: .5 });
    const [nx, , nz] = GarageWorld.polePos(i + 1, j);
    for (let w = 0; w < 2; w++) {
      const dz = w === 0 ? -.5 : .5;
      this.addWire(mb, [px, 6.6, pz + dz], [nx, 6.6, nz + dz], .9 + w * .25);
    }
  }
  addWire(mb, a, b, sag) {
    const seg = 14, pts = [];
    for (let s = 0; s <= seg; s++) { const t = s / seg; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]); }
    const w = .0125;
    for (let s = 0; s < seg; s++) {
      const p = pts[s], q = pts[s + 1];
      mb.quad('wire', [p[0], p[1] + w, p[2]], [p[0], p[1] - w, p[2]], [q[0], q[1] - w, q[2]], [q[0], q[1] + w, q[2]], [0, 0, 1]);
      mb.quad('wire', [p[0], p[1], p[2] + w], [p[0], p[1], p[2] - w], [q[0], q[1], q[2] - w], [q[0], q[1], q[2] + w], [0, 1, 0]);
    }
  }

  // ----------------------------------------------------------------
  addLamp(ch, kind, x, y, z, dir, rnd, flickerChance, bulb) {
    const d = LAMP_DEF[kind];
    const lamp = { kind, type: d.type, x, y, z, dir, color: d.color, intensity: d.intensity, range: d.range, k: 1, flicker: null, bulbMat: null };
    if (bulb) {
      lamp.bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.4) });
      const m = new THREE.Mesh(this.bulbGeo, lamp.bulbMat); m.position.set(x, y, z); m.matrixAutoUpdate = false; m.updateMatrix();
      m.userData.bulbMat = lamp.bulbMat; ch.group.add(m);
    }
    if (rnd.nextDouble() < flickerChance) {
      const seed = rnd.next(), r = new DotNetRandom(seed);
      lamp.flicker = { seed, r, nextEvent: this.time + 0.5 + r.nextDouble() * 5.5, burstEnd: 0 };
    }
    ch.lamps.push(lamp); this.lamps.add(lamp);
  }

  tickLamps(t) {
    this.time = t;
    for (const l of this.lamps) {
      const f = l.flicker; let k = 1;
      if (f) {
        if (t > f.nextEvent) { f.burstEnd = t + 0.2 + f.r.nextDouble() * 1.4; f.nextEvent = f.burstEnd + 1.5 + f.r.nextDouble() * 7.5; }
        if (t < f.burstEnd) { const n = perlin(t * 23, f.seed * 0.01); k = n > .5 ? .6 + Math.random() * .4 : Math.random() * .08; }
      }
      l.k = k;
      if (l.bulbMat) l.bulbMat.color.setRGB(6 * k, 4.2 * k, 2.4 * k);
    }
  }

  // ---------- реквизит ----------
  spawn(ch, name, x, y, z, yaw, collider, obstacle = false) {
    const t = this.props[name]; ch.mb.prop(t, x, y, z, yaw);
    if (collider && name !== 'water_manhole_cover') this.col(ch, x, y + t.size[1] / 2, z, t.size[0], t.size[1], t.size[2], yaw);
    if (obstacle) {
      const c = Math.abs(Math.cos(yaw * D2R)), s = Math.abs(Math.sin(yaw * D2R));
      const hx = c * t.size[0] / 2 + s * t.size[2] / 2, hz = s * t.size[0] / 2 + c * t.size[2] / 2;
      if (t.size[1] >= .15) ch.obs.push({ x: x - hx, z: z - hz, w: hx * 2, h: hz * 2 });
    }
  }
}
