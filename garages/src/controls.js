// Сенсорное управление (джойстик слева, обзор справа, кнопки «Бег» и «Фонарь») + клавиатура/мышь (порт MobileControls.cs).
export class Controls {
  constructor(player, canvas) {
    this.p = player; this.visible = false; this.touchMode = matchMedia('(pointer:coarse)').matches;
    this.moveId = -1; this.lookId = -1; this.runId = -1; this.moveOrigin = { x: 0, y: 0 }; this.moveCur = { x: 0, y: 0 };
    this.lastLook = new Map(); this.keys = new Set(); this.look = { x: 0, y: 0 }; this.locked = false;
    this.touchLookSens = 0.16; this.mouseLookSens = 0.09; this.anyPress = false;
    const opt = { passive: false };
    window.addEventListener('touchstart', e => this.ts(e), opt);
    window.addEventListener('touchmove', e => this.tm(e), opt);
    window.addEventListener('touchend', e => this.te(e), opt);
    window.addEventListener('touchcancel', e => this.te(e), opt);
    window.addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) { if (e.code === 'KeyF' && this.visible) player.toggleFlashlight(); if (e.code === 'Space' || e.code === 'Enter') this.anyPress = true; }
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousedown', () => {
      this.anyPress = true;
      if (!this.touchMode && this.visible && document.pointerLockElement !== canvas) canvas.requestPointerLock && canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    window.addEventListener('mousemove', e => { if (this.locked && this.visible) { this.look.x += e.movementX * this.mouseLookSens; this.look.y += e.movementY * this.mouseLookSens; } });
    this.canvas = canvas;
  }
  get scale() { return Math.min(innerWidth, innerHeight) / 720; }
  runRect() { const s = this.scale; return { x: innerWidth - 230 * s, y: innerHeight - 230 * s, w: 170 * s, h: 170 * s }; }
  lightRect() { const s = this.scale; return { x: innerWidth - 400 * s, y: innerHeight - 160 * s, w: 120 * s, h: 120 * s }; }
  inside(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  unlockMouse() { if (document.exitPointerLock) document.exitPointerLock(); }

  ts(e) {
    e.preventDefault(); this.touchMode = true; this.anyPress = true;
    for (const t of e.changedTouches) {
      const id = t.identifier, x = t.clientX, y = t.clientY;
      if (!this.visible) continue;
      if (this.inside(this.runRect(), x, y)) this.runId = id;
      else if (this.inside(this.lightRect(), x, y)) this.p.toggleFlashlight();
      else if (x < innerWidth * 0.42 && this.moveId < 0) { this.moveId = id; this.moveOrigin = { x, y }; this.moveCur = { x, y }; }
      else if (this.lookId < 0) { this.lookId = id; this.lastLook.set(id, { x, y }); }
    }
  }
  tm(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const id = t.identifier;
      if (id === this.moveId) this.moveCur = { x: t.clientX, y: t.clientY };
      else if (id === this.lookId) {
        const l = this.lastLook.get(id);
        if (l) { const k = this.touchLookSens * (720 / Math.max(1, innerHeight)); this.look.x += (t.clientX - l.x) * k; this.look.y += (t.clientY - l.y) * k; }
        this.lastLook.set(id, { x: t.clientX, y: t.clientY });
      }
    }
  }
  te(e) {
    for (const t of e.changedTouches) {
      const id = t.identifier;
      if (id === this.moveId) this.moveId = -1; if (id === this.lookId) { this.lookId = -1; this.lastLook.delete(id); } if (id === this.runId) this.runId = -1;
    }
  }

  update() {
    const p = this.p; let mx = 0, my = 0, run = false;
    if (this.moveId >= 0) {
      const R = 110 * this.scale; let dx = this.moveCur.x - this.moveOrigin.x, dy = this.moveCur.y - this.moveOrigin.y; const d = Math.hypot(dx, dy);
      if (d > R) { this.moveOrigin.x = this.moveCur.x - dx / d * R; this.moveOrigin.y = this.moveCur.y - dy / d * R; dx = this.moveCur.x - this.moveOrigin.x; dy = this.moveCur.y - this.moveOrigin.y; }
      const l = Math.min(1, Math.hypot(dx, dy) / R), dd = Math.hypot(dx, dy) || 1;
      mx = dx / dd * l; my = -dy / dd * l; // вверх на экране = вперёд
      if (my > 0.95 && Math.hypot(dx, dy) >= R * 0.98) run = true;
    }
    if (this.runId >= 0) run = true;
    const k = this.keys; let kx = 0, ky = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) ky++; if (k.has('KeyS') || k.has('ArrowDown')) ky--;
    if (k.has('KeyD') || k.has('ArrowRight')) kx++; if (k.has('KeyA') || k.has('ArrowLeft')) kx--;
    if (kx || ky) { const l = Math.hypot(kx, ky); mx = kx / l; my = ky / l; this.touchMode = false; }
    if (k.has('ShiftLeft') || k.has('ShiftRight')) run = true;
    if (this.visible) { p.moveInput.x = mx; p.moveInput.y = my; p.lookDelta.x += this.look.x; p.lookDelta.y += this.look.y; p.runHeld = run; }
    else { p.moveInput.x = p.moveInput.y = 0; p.runHeld = false; }
    this.look.x = this.look.y = 0;
  }

  draw(g, W, H) {
    if (!this.visible) return;
    const s = this.scale, p = this.p;
    if (p.stamina < 0.99) {
      const w = 260 * s, h = 6 * s, x = (W - w) / 2, y = H - 40 * s;
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(217,217,204,.7)'; g.fillRect(x, y, w * p.stamina, h);
    }
    if (!this.touchMode) return;
    const circle = (cx, cy, r, a) => { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); };
    const ring = (cx, cy, r, a) => { g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 3 * s; g.beginPath(); g.arc(cx, cy, r * .92, 0, Math.PI * 2); g.stroke(); };
    if (this.moveId >= 0) {
      const R = 110 * s, o = this.moveOrigin; ring(o.x, o.y, R, .18);
      let dx = this.moveCur.x - o.x, dy = this.moveCur.y - o.y; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      circle(o.x + dx, o.y + dy, 45 * s, .3);
    } else ring(220 * s, H - 220 * s, 110 * s, .18);
    const rr = this.runRect(), lr = this.lightRect();
    circle(rr.x + rr.w / 2, rr.y + rr.h / 2, rr.w / 2, this.runId >= 0 ? .45 : .22);
    circle(lr.x + lr.w / 2, lr.y + lr.h / 2, lr.w / 2, p.flashOn ? .35 : .15);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold ${26 * s}px sans-serif`; g.fillText('БЕГ', rr.x + rr.w / 2, rr.y + rr.h / 2);
    g.font = `bold ${18 * s}px sans-serif`; g.fillText('ФОНАРЬ', lr.x + lr.w / 2, lr.y + lr.h / 2);
  }
}
