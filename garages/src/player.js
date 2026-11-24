// Игрок (порт PlayerController.cs). Координаты — игровые (как в Unity, левосторонние).
import * as THREE from 'three';
import * as L from './layout.js';
import { A } from './audio.js';
import { R } from './rng.js';

const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const moveToward = (a, b, d) => Math.abs(b - a) <= d ? b : a + Math.sign(b - a) * d;
const qE = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x * D2R, y * D2R, z * D2R, 'YXZ'));

export class Player {
  constructor() {
    this.pos = { x: 10, y: 0.03, z: L.BlockD + L.MainAlley * 0.5 };
    this.yaw = 90; this.pitch = 0;
    this.walkSpeed = 2.7; this.runSpeed = 5.9; this.staminaDrain = 1 / 6.5; this.staminaRegen = 1 / 9; this.bobAmount = 0.045;
    this.moveInput = { x: 0, y: 0 }; this.lookDelta = { x: 0, y: 0 }; this.runHeld = false;
    this.stamina = 1; this.running = false; this.speed = 0; this.flashOn = true; this.controlsEnabled = true;
    this.exhausted = false; this.bobPhase = 0; this.lastStepPhase = 0; this.shake = 0;
    this.headPos = { x: 0, y: 0, z: 0 }; this.headQuat = new THREE.Quaternion(); this.flashQuat = new THREE.Quaternion(); this.flashPos = { x: 0, y: 0, z: 0 };
    this.compute(0, 0, 0, 0);
    this.flashQuat.copy(this.headQuat);
  }
  get noiseRadius() { return this.speed < 0.3 ? 0 : (this.running ? 24 : 7); }
  initAudio() {
    this.stepSrc = A.source(); this.stepSrc.gain.gain.value = 0.5;
    this.breathSrc = A.source(); this.breathSrc.loop(A.raw.breath, 0);
  }
  toggleFlashlight() { this.flashOn = !this.flashOn; this.stepSrc && this.stepSrc.play(A.raw.steps[0], 0.15); }
  addShake(a) { this.shake = Math.max(this.shake, a); }

  compute(bx, by, bz, roll) {
    const c = Math.cos(this.yaw * D2R), s = Math.sin(this.yaw * D2R);
    const lx = bx, ly = 1.62 + by, lz = bz;
    this.headPos.x = this.pos.x + lx * c + lz * s; this.headPos.y = this.pos.y + ly; this.headPos.z = this.pos.z - lx * s + lz * c;
    this.headQuat.copy(qE(0, this.yaw, 0)).multiply(qE(this.pitch, 0, -roll));
  }

  update(dt) {
    let mx = this.controlsEnabled ? this.moveInput.x : 0, my = this.controlsEnabled ? this.moveInput.y : 0;
    const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
    if (this.controlsEnabled) { this.yaw += this.lookDelta.x; this.pitch = Math.min(80, Math.max(-80, this.pitch + this.lookDelta.y)); /* вверх — вверх, вниз — вниз */ }
    this.lookDelta.x = this.lookDelta.y = 0;
    const mag = Math.hypot(mx, my);
    const wantRun = this.runHeld && my > 0.2 && !this.exhausted;
    this.running = wantRun && this.stamina > 0;
    if (this.running) this.stamina -= this.staminaDrain * dt; else this.stamina += this.staminaRegen * dt * (mag * mag < 0.01 ? 1.6 : 1);
    this.stamina = clamp01(this.stamina);
    if (this.stamina <= 0) this.exhausted = true;
    if (this.exhausted && this.stamina > 0.35) this.exhausted = false;
    const target = (this.running ? this.runSpeed : this.walkSpeed) * mag;
    this.speed = moveToward(this.speed, target, 14 * dt);

    const fx = Math.sin(this.yaw * D2R), fz = Math.cos(this.yaw * D2R), rx = Math.cos(this.yaw * D2R), rz = -Math.sin(this.yaw * D2R);
    let dx = fx * my + rx * mx, dz = fz * my + rz * mx; const dl = Math.hypot(dx, dz); if (dl > 1) { dx /= dl; dz /= dl; }
    const ox = this.pos.x, oz = this.pos.z;
    this.pos.x += dx * this.speed * dt; this.pos.z += dz * this.speed * dt;
    L.pushOut(this.pos, 0.32, 0.4, 1.75);
    const horiz = Math.hypot(this.pos.x - ox, this.pos.z - oz) / Math.max(dt, 1e-4);

    if (horiz > 0.2) {
      this.bobPhase += dt * horiz * (this.running ? 1.55 : 1.85);
      if (Math.floor(this.bobPhase / Math.PI) !== Math.floor(this.lastStepPhase / Math.PI) && this.stepSrc)
        this.stepSrc.play(A.raw.steps[Math.floor(Math.random() * 5)], this.running ? 0.9 : 0.5, R.range(0.85, 1.1));
    }
    this.lastStepPhase = this.bobPhase;
    const amp = this.bobAmount * clamp01(horiz / this.walkSpeed) * (this.running ? 1.8 : 1);
    const bx = Math.cos(this.bobPhase) * amp * 0.6, by = -Math.abs(Math.sin(this.bobPhase)) * amp * 1.4;
    this.shake = moveToward(this.shake, 0, dt * 1.5);
    const sh = R.insideUnitSphere(), k = this.shake * 0.05;
    this.compute(bx + sh.x * k, by + sh.y * k, sh.z * k, Math.cos(this.bobPhase) * amp * 12);

    // фонарь с инерцией руки
    const tq = this.headQuat.clone().multiply(qE(1.5 + Math.sin(this.bobPhase * 2) * amp * 15, Math.cos(this.bobPhase) * amp * 20, 0));
    this.flashQuat.slerp(tq, 1 - Math.exp(-dt * 11));
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(this.headQuat), u = new THREE.Vector3(0, 1, 0).applyQuaternion(this.headQuat), f = new THREE.Vector3(0, 0, 1).applyQuaternion(this.headQuat);
    this.flashPos.x = this.headPos.x + r.x * 0.18 - u.x * 0.18 + f.x * 0.1;
    this.flashPos.y = this.headPos.y + r.y * 0.18 - u.y * 0.18 + f.y * 0.1;
    this.flashPos.z = this.headPos.z + r.z * 0.18 - u.z * 0.18 + f.z * 0.1;

    if (this.breathSrc) {
      const bt = clamp01((0.6 - this.stamina) / 0.6) * 0.55;
      this.breathSrc.setVolume(moveToward(this.breathSrc.volume, bt, dt * 0.5)); this.breathSrc.setPitch(1 + (1 - this.stamina) * 0.3);
    }
  }
  lookAtPoint(p, t) {
    const dx = p.x - this.headPos.x, dy = p.y - this.headPos.y, dz = p.z - this.headPos.z;
    const ty = Math.atan2(dx, dz) / D2R, tp = -Math.atan2(dy, Math.hypot(dx, dz)) / D2R;
    const d = ((ty - this.yaw + 540) % 360) - 180;
    this.yaw += d * t; this.pitch += (tp - this.pitch) * t;
  }
}
