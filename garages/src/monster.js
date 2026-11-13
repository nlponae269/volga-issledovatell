// Существо (порт Monster.cs): ИИ с восприятием, поиском пути и процедурной анимацией.
import * as THREE from 'three';
import * as L from './layout.js';
import { A } from './audio.js';
import { R } from './rng.js';

const D2R = Math.PI / 180, RADIUS = 0.4;
const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const eul = (x, y, z) => new THREE.Euler(x * D2R, y * D2R, z * D2R, 'YXZ');
const quatE = (x, y, z) => new THREE.Quaternion().setFromEuler(eul(x, y, z));
const flat = v => { const l = Math.hypot(v.x, v.z); return l > 1e-6 ? { x: v.x / l, z: v.z / l } : { x: 1, z: 0 }; };

export const State = { Roam: 0, Investigate: 1, Chase: 2, Search: 3, Caught: 4 };

export class Monster {
  constructor(root, skin, eye, player, game) {
    this.player = player; this.game = game; this.skin = skin; this.eye = eye;
    this.cfg = { roam: 1.4, investigate: 2.8, chase: 4.9, view: 18, viewFlash: 38, angle: 75, catchDist: 1.5 };
    this.state = State.Roam; this.dist = 999; this.sees = false; this.enabled = false;
    this.pos = { x: 60, y: 0.03, z: L.BlockD + L.MainAlley * 0.5 }; this.yaw = 0;
    this.path = []; this.pathIndex = 0; this.goal = { x: 0, z: 0 }; this.lastSeen = { x: 0, z: 0 }; this.lastSeenVel = { x: 0, z: 0 };
    this.repathTimer = 0; this.perceiveTimer = 0; this.stateTimer = 0; this.lostTimer = 0; this.screamCooldown = 0; this.stuckTimer = 0;
    this.stuckPos = { x: 0, z: 0 }; this.speed = 0; this.vel = { x: 0, z: 0 };
    this.phase = 0; this.lastPhase = 0; this.twitchTimer = 0; this.headTwitch = new THREE.Quaternion(); this.headTwitchZ = 0;
    this.group = new THREE.Group(); this.group.rotation.order = 'YXZ'; root.add(this.group);
    this.buildBody();
    this.tmp = new THREE.Vector3();
  }
  initAudio() {
    this.growl = A.source({ spatial: true, min: 3, max: 35 }); this.growl.loop(A.raw.growl, 0.6);
    this.sfx = A.source({ spatial: true, min: 4, max: 60 });
  }
  start() { this.enabled = true; this.placeAway(45, 60); this.pickRoamGoal(); }

  gamePos(obj, out = {}) { obj.updateWorldMatrix(true, false); this.tmp.setFromMatrixPosition(obj.matrixWorld); out.x = this.tmp.x; out.y = this.tmp.y; out.z = -this.tmp.z; return out; }
  get headPos() { return this.gamePos(this.head, this._hp || (this._hp = {})); }

  // ================================================================ AI
  update(dt, t) {
    if (!this.enabled) return;
    const p = this.player;
    this.screamCooldown -= dt; this.stateTimer += dt;
    this.dist = Math.hypot(this.pos.x - p.pos.x, this.pos.z - p.pos.z);
    this.perceiveTimer -= dt;
    if (this.perceiveTimer <= 0 && this.state !== State.Caught) { this.perceiveTimer = 0.15; this.perceive(); }
    const c = this.cfg;
    switch (this.state) {
      case State.Roam:
        this.speed = c.roam;
        if (this.reached() || this.stateTimer > 25) this.pickRoamGoal();
        if (this.dist > 85 && !this.sees) { this.placeAway(40, 55); this.pickRoamGoal(); }
        break;
      case State.Investigate:
        this.speed = c.investigate; if (this.reached()) this.enter(State.Search); break;
      case State.Chase:
        this.speed = c.chase;
        if (this.sees) { this.lostTimer = 0; this.setGoal(p.pos.x, p.pos.z); }
        else {
          this.lostTimer += dt;
          if (this.lostTimer > 3.5) { this.setGoal(this.lastSeen.x + this.lastSeenVel.x * 2.5, this.lastSeen.z + this.lastSeenVel.z * 2.5); this.enter(State.Search); }
        }
        if (this.sees && this.dist < c.catchDist) { this.enter(State.Caught); this.game.onCaught(this); }
        break;
      case State.Search:
        this.speed = c.investigate;
        if (this.reached() && this.stateTimer > 1) { this.speed = 0; if (this.stateTimer > 7) { this.enter(State.Roam); this.pickRoamGoal(); } }
        break;
      case State.Caught: this.speed = 0; break;
    }
    this.move(dt);
    this.animate(dt, t);
    if (this.growl) {
      const chase = this.state === State.Chase;
      this.growl.setVolume(lerp(this.growl.volume, chase ? 1 : 0.55, dt));
      this.growl.setPitch(chase ? 1.12 : 0.95);
      this.growl.setPos(this.pos.x, 1.3, this.pos.z);
    }
  }
  enter(s) { this.state = s; this.stateTimer = 0; this.lostTimer = 0; }

  perceive() {
    const p = this.player, eye = this.headPos, ph = p.headPos;
    const tx = ph.x - eye.x, ty = ph.y - eye.y, tz = ph.z - eye.z, d = Math.hypot(tx, ty, tz);
    const range = p.flashOn ? this.cfg.viewFlash : this.cfg.view;
    const fx = Math.sin(this.yaw * D2R), fz = Math.cos(this.yaw * D2R);
    const hl = Math.hypot(tx, tz) || 1e-6;
    const ang = Math.acos(Math.max(-1, Math.min(1, (fx * tx + fz * tz) / hl))) / D2R;
    const inCone = d < 6 || (d < range && ang < this.cfg.angle);
    const los = inCone && !L.linecast(eye.x, eye.y, eye.z, ph.x, ph.y, ph.z);
    this.sees = los;
    if (los) {
      let vx = (p.pos.x - this.lastSeen.x) / 0.15, vz = (p.pos.z - this.lastSeen.z) / 0.15;
      const l = Math.hypot(vx, vz); if (l > 6) { vx *= 6 / l; vz *= 6 / l; }
      this.lastSeenVel = { x: vx, z: vz }; this.lastSeen = { x: p.pos.x, z: p.pos.z };
      if (this.state !== State.Chase) {
        this.enter(State.Chase);
        if (this.screamCooldown <= 0) { this.sfx && this.sfx.play(A.raw.scream, 1); this.screamCooldown = 18; }
        this.game.onChaseStarted();
      }
      return;
    }
    if (this.state !== State.Chase && p.noiseRadius > this.dist) {
      if (this.state !== State.Investigate) this.enter(State.Investigate);
      const r = R.insideUnitSphere(), f = flat(r);
      this.setGoal(p.pos.x + f.x * Math.hypot(r.x, r.z) * 2, p.pos.z + f.z * Math.hypot(r.x, r.z) * 2);
    }
  }

  pickRoamGoal() {
    this.stateTimer = 0;
    for (let k = 0; k < 20; k++) {
      const f = flat(R.insideUnitSphere()), r = R.range(8, 28);
      const x = this.player.pos.x + f.x * r, z = this.player.pos.z + f.z * r;
      if (L.walkable(x, z, RADIUS)) { this.setGoal(x, z); return; }
    }
  }
  placeAway(min, max) {
    const p = this.player;
    for (let k = 0; k < 40; k++) {
      const f = flat(R.insideUnitSphere()), r = R.range(min, max), x = p.pos.x + f.x * r, z = p.pos.z + f.z * r;
      if (!L.walkable(x, z, RADIUS + 0.2)) continue;
      const ph = p.headPos;
      if (!L.linecast(x, 2, z, ph.x, ph.y, ph.z)) continue; // не появляться на виду (как в оригинале)
      this.pos.x = x; this.pos.z = z; this.path = []; return;
    }
  }
  setGoal(x, z) {
    if ((x - this.goal.x) ** 2 + (z - this.goal.z) ** 2 < 0.5 && this.path.length > 0 && this.repathTimer > 0) return;
    this.goal = { x, z }; this.repathTimer = this.state === State.Chase ? 0.3 : 1.2;
    L.findPath(this.pos.x, this.pos.z, x, z, RADIUS, this.path); this.pathIndex = 0;
  }
  reached() { return this.path.length === 0 || this.pathIndex >= this.path.length; }

  move(dt) {
    this.repathTimer -= dt;
    const p = this.player; let vx = 0, vz = 0;
    if (this.pathIndex < this.path.length && this.speed > 0) {
      const tg = this.path[this.pathIndex], dx = tg.x - this.pos.x, dz = tg.z - this.pos.z, l = Math.hypot(dx, dz);
      if (l < 0.6) this.pathIndex++; else { vx = dx / l * this.speed; vz = dz / l * this.speed; }
    }
    if (this.state === State.Chase && this.sees && this.dist < 4) {
      const dx = p.pos.x - this.pos.x, dz = p.pos.z - this.pos.z, l = Math.hypot(dx, dz) || 1; vx = dx / l * this.speed; vz = dz / l * this.speed;
    }
    const ox = this.pos.x, oz = this.pos.z;
    this.pos.x += vx * dt; this.pos.z += vz * dt;
    L.pushOut(this.pos, RADIUS, 0.4, 2.6);
    this.vel.x = (this.pos.x - ox) / dt; this.vel.z = (this.pos.z - oz) / dt;
    let fx = 0, fz = 0;
    if (vx * vx + vz * vz > 0.01) { fx = vx; fz = vz; }
    else if (this.state === State.Chase || this.state === State.Caught) { fx = p.pos.x - this.pos.x; fz = p.pos.z - this.pos.z; }
    else { fx = Math.sin(this.yaw * D2R); fz = Math.cos(this.yaw * D2R); }
    if (fx * fx + fz * fz > 0.001) {
      const target = Math.atan2(fx, fz) / D2R; let dlt = ((target - this.yaw + 540) % 360) - 180;
      this.yaw += dlt * (1 - Math.exp(-dt * 6));
    }
    this.stuckTimer += dt;
    if (this.stuckTimer > 1.5) {
      if (vx * vx + vz * vz > 0.1 && Math.hypot(this.pos.x - this.stuckPos.x, this.pos.z - this.stuckPos.z) < 0.3) {
        this.path = []; L.findPath(this.pos.x, this.pos.z, this.goal.x, this.goal.z, RADIUS, this.path); this.pathIndex = 0;
        if (!this.path.length) this.pickRoamGoal();
      }
      this.stuckTimer = 0; this.stuckPos = { x: this.pos.x, z: this.pos.z };
    }
    this.group.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.group.rotation.y = this.yaw * D2R;
  }

  // ============================================================ тело
  buildBody() {
    const sphere = new THREE.SphereGeometry(0.5, 14, 10), capsule = new THREE.CapsuleGeometry(0.5, 1, 4, 10);
    const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.rotation.order = 'YXZ'; j.position.set(x, y, z); parent.add(j); return j; };
    const part = (geo, parent, x, y, z, sx, sy, sz, mat) => {
      const m = new THREE.Mesh(geo, mat || this.skin); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    };
    const S = (...a) => part(sphere, ...a), C = (...a) => part(capsule, ...a);
    const hips = this.hips = joint(this.group, 0, 1.25, 0);
    const spine = this.spine = joint(hips, 0, .05, 0);
    C(spine, 0, .38, 0, .3, .4, .21);
    S(spine, 0, .72, .02, .44, .36, .27);
    S(spine, 0, .06, 0, .32, .2, .22);
    for (let v = 0; v < 6; v++) S(spine, 0, .2 + v * .13, -.11 - Math.sin(v / 5 * Math.PI) * .03, .05, .06, .05);
    const neck = this.neck = joint(spine, 0, .92, .06);
    C(neck, 0, .13, .02, .085, .15, .085);
    const head = this.head = joint(neck, 0, .27, .04);
    S(head, 0, .14, 0, .22, .32, .25);
    S(head, 0, 0, .06, .15, .16, .17);
    S(head, 0, -.04, .1, .1, .05, .08);
    for (const sx of [-.052, .052]) { S(head, sx, .15, .1, .06, .045, .04); S(head, sx, .15, .115, .028, .028, .028, this.eye); }
    const arm = (side, s) => {
      const sh = joint(spine, .25 * s, .84, 0);
      S(sh, 0, 0, 0, .13, .12, .13); C(sh, 0, -.33, 0, .085, .34, .085);
      const el = joint(sh, 0, -.66, 0);
      S(el, 0, 0, 0, .085, .085, .085); C(el, 0, -.35, 0, .07, .36, .07);
      const wr = joint(el, 0, -.7, 0);
      S(wr, 0, -.07, 0, .08, .13, .045);
      for (let f = 0; f < 4; f++) {
        const fj = joint(wr, (f - 1.5) * .022, -.13, 0); fj.quaternion.copy(quatE(8 + f * 3, 0, (f - 1.5) * 4));
        C(fj, 0, -.12, 0, .018, .13, .018);
      }
      return [sh, el];
    };
    [this.shL, this.elL] = arm('L', -1); [this.shR, this.elR] = arm('R', 1);
    const leg = s => {
      const hip = joint(hips, .12 * s, 0, 0);
      C(hip, 0, -.31, 0, .12, .33, .12);
      const kn = joint(hip, 0, -.62, 0);
      S(kn, 0, 0, 0, .1, .1, .1); C(kn, 0, -.31, 0, .085, .32, .085);
      const an = joint(kn, 0, -.6, 0); S(an, 0, -.01, .08, .09, .05, .26);
      return [hip, kn];
    };
    [this.hipL, this.knL] = leg(-1); [this.hipR, this.knR] = leg(1);
  }

  animate(dt, t) {
    const v = Math.hypot(this.vel.x, this.vel.z), chasing = this.state === State.Chase || this.state === State.Caught, c = this.cfg;
    this.phase += v * dt * (chasing ? 2.0 : 2.6);
    if (Math.floor(this.phase / Math.PI) !== Math.floor(this.lastPhase / Math.PI) && v > 0.3 && this.sfx)
      this.sfx.play(A.raw.mSteps[Math.floor(Math.random() * 4)], chasing ? 1 : 0.7, R.range(0.85, 1.05));
    this.lastPhase = this.phase;
    const move01 = Math.min(1, v / c.chase), Amp = lerp(22, 50, move01) * Math.min(1, v * 2), s = Math.sin(this.phase);
    const E = (o, x, y, z) => o.rotation.set(x * D2R, y * D2R, z * D2R);
    E(this.hipL, s * Amp - (chasing ? 15 : 0), 0, 0); E(this.hipR, -s * Amp - (chasing ? 15 : 0), 0, 0);
    E(this.knL, Math.max(0, -Math.sin(this.phase - 0.9)) * Amp * 1.5 + 4, 0, 0);
    E(this.knR, Math.max(0, Math.sin(this.phase - 0.9)) * Amp * 1.5 + 4, 0, 0);
    const lean = chasing ? 30 : 10, idle = Math.sin(t * 0.9) * 2;
    this.hips.position.y = 1.25 - (chasing ? 0.12 : 0) + Math.abs(s) * 0.05 * move01;
    E(this.spine, lean + idle, Math.sin(this.phase) * 6, Math.cos(this.phase) * 4);
    const armBase = chasing ? -35 : 4;
    E(this.shL, armBase - s * Amp * 0.7, 0, -10 + Math.sin(t * 1.3) * 3);
    E(this.shR, armBase + s * Amp * 0.7, 0, 10 - Math.sin(t * 1.1) * 3);
    E(this.elL, chasing ? -35 : -12, 0, 0); E(this.elR, chasing ? -35 : -12, 0, 0);
    this.twitchTimer -= dt;
    if (this.twitchTimer <= 0) {
      this.twitchTimer = R.range(0.25, chasing ? 0.9 : 2.4);
      const z = R.range(-40, 40);
      this.headTwitch = quatE(R.range(-20, 25), R.range(-45, 45), z); this.headTwitchZ = ((z % 360) + 360) % 360;
    }
    let target = this.headTwitch;
    if (chasing) {
      const nk = this.gamePos(this.neck, {}), ph = this.player.headPos;
      const fwd = new THREE.Vector3(ph.x - nk.x, ph.y - nk.y, ph.z - nk.z).normalize();
      const right = new THREE.Vector3(0, 1, 0).cross(fwd); if (right.lengthSq() < 1e-8) right.set(1, 0, 0); right.normalize();
      const up = fwd.clone().cross(right);
      const look = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
      const sw = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw * D2R, 0, 'YXZ')).multiply(this.hips.quaternion).multiply(this.spine.quaternion);
      target = sw.invert().multiply(look).multiply(quatE(0, 0, this.headTwitchZ * 0.5));
    }
    this.neck.quaternion.slerp(quatE(-lean * 0.6, 0, 0), Math.min(1, dt * 5));
    this.head.quaternion.slerp(chasing ? target : this.headTwitch, 1 - Math.exp(-dt * 30));
  }

  placeForJumpscare(x, z, lx, lz) {
    this.pos.x = x; this.pos.z = z; this.path = [];
    this.yaw = Math.atan2(lx - x, lz - z) / D2R;
    this.group.position.set(x, this.pos.y, z); this.group.rotation.y = this.yaw * D2R;
    this.sfx && this.sfx.play(A.raw.scream, 1);
  }
}
