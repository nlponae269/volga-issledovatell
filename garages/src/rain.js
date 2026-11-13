// Дождь вокруг игрока (порт RainFX.cs): капли умирают об землю и крыши гаражей.
import * as THREE from 'three';
import * as L from './layout.js';

const N = 2000, BOX = 26, TOP = 9, ROOF_Y = L.WallH + 0.18;
export class Rain {
  constructor(root) {
    this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3);
    this.geo = new THREE.BufferGeometry(); this.attr = new THREE.BufferAttribute(new Float32Array(N * 6), 3); this.attr.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.attr);
    this.mat = new THREE.LineBasicMaterial({ color: new THREE.Color().setRGB(.75, .8, .9, THREE.SRGBColorSpace), transparent: true, opacity: .2, depthWrite: false });
    this.mesh = new THREE.LineSegments(this.geo, this.mat); this.mesh.frustumCulled = false; root.add(this.mesh);
    this.first = true;
  }
  respawn(i, p, anywhere) {
    const o = i * 3;
    this.pos[o] = p.x + (Math.random() - .5) * BOX; this.pos[o + 2] = p.z + (Math.random() - .5) * BOX;
    this.pos[o + 1] = anywhere ? Math.random() * TOP : TOP + Math.random() * 0.1;
    this.vel[o] = 0.6 + Math.random() * 0.6; this.vel[o + 1] = -(11 + Math.random() * 2); this.vel[o + 2] = 0.2 + Math.random() * 0.3;
  }
  static underRoof(x, z) {
    const i = Math.floor(x / L.PeriodX), j = Math.floor(z / L.PeriodZ), b = L.getBlock(i, j);
    if (!b.exists) return false;
    const o = L.cellOrigin(i, j), lx = x - o.x, lz = z - o.z;
    return lx > b.start * L.GarageW - 0.25 && lx < b.end * L.GarageW + 0.25 && lz > -0.4 && lz < L.BlockD + 0.4;
  }
  update(dt, p) {
    const a = this.attr.array;
    for (let i = 0; i < N; i++) {
      if (this.first) this.respawn(i, p, true);
      const o = i * 3;
      this.pos[o] += this.vel[o] * dt; this.pos[o + 1] += this.vel[o + 1] * dt; this.pos[o + 2] += this.vel[o + 2] * dt;
      const x = this.pos[o], y = this.pos[o + 1], z = this.pos[o + 2];
      if (y < 0 || Math.abs(x - p.x) > BOX / 2 + 1 || Math.abs(z - p.z) > BOX / 2 + 1 || (y < ROOF_Y && y > ROOF_Y - 0.6 && Rain.underRoof(x, z))) this.respawn(i, p, false);
      const q = i * 6, s = 0.045;
      a[q] = this.pos[o]; a[q + 1] = this.pos[o + 1]; a[q + 2] = this.pos[o + 2];
      a[q + 3] = this.pos[o] - this.vel[o] * s; a[q + 4] = this.pos[o + 1] - this.vel[o + 1] * s; a[q + 5] = this.pos[o + 2] - this.vel[o + 2] * s;
    }
    this.first = false; this.attr.needsUpdate = true;
  }
}
