// ===================== Вороны на проводах: сидят на линиях, при приближении срываются с карканьем =====================
if (DVOR) {
  window.__wires = [];
  const ob = OUT_BUILD;
  OUT_BUILD = (cx, cz) => { window.__wireBuf = []; const res = ob(cx, cz), buf = window.__wireBuf; window.__wireBuf = null; for (const w of buf) { w.g = res.group; if (w.c.distanceTo(w.a) > 15) window.__wires.push(w); } if (window.__wires.length > 500) window.__wires.splice(0, window.__wires.length - 500); return res; };
  const mat = new THREE.MeshStandardMaterial({ color: ALT ? 0x1a0505 : 0x16161a, roughness: 0.8 });
  function crow() { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 4, 8), mat); body.rotation.z = Math.PI / 2; body.position.y = 0.12; const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat); head.position.set(0.18, 0.2, 0);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 5), new THREE.MeshStandardMaterial({ color: 0x2a2622 })); beak.rotation.z = -Math.PI / 2; beak.position.set(0.26, 0.19, 0);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.07), mat); tail.position.set(-0.26, 0.1, 0); tail.rotation.z = 0.25;
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12).translate(0, 0, 0.16), mat), wr = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12).translate(0, 0, -0.16), mat); wl.rotation.x = Math.PI / 2; wr.rotation.x = Math.PI / 2; wl.position.y = wr.position.y = 0.15; wl.visible = wr.visible = false;
    g.add(body, head, beak, tail, wl, wr); g.visible = false; scene.add(g); REFL.hide.push(g); return { g, wl, wr }; }
  const C = []; for (let i = 0; i < 6; i++) C.push(Object.assign(crow(), { st: 'off', w: null, t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, cd: Math.random() * 10, ph: 0 }));
  function caw(x, z) { if (!AC) return; const d = Math.hypot(x - P.x, z - P.z), v = 0.06 * Math.max(0, 1 - d / 60); if (v <= 0) return; const a = Math.atan2(x - P.x, z - P.z) - (P.yaw + Math.PI), p = Math.max(-1, Math.min(1, -Math.sin(a)));
    for (let k = 0; k < 2 + ((Math.random() * 2) | 0); k++) setTimeout(() => { const t = AC.currentTime, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), sp = AC.createStereoPanner(); o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(330, t + 0.3); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2.2; sp.pan.value = p; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.34); o.connect(f).connect(g).connect(sp).connect(master); o.start(t); o.stop(t + 0.4); }, k * 330); }
  const used = new Set(); const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    for (const c of C) { c.cd -= dt;
      if (c.st === 'off') { if (c.cd > 0) continue; c.cd = 3; const cand = window.__wires.filter((w) => w.g.parent && !used.has(w) && Math.hypot((w.a.x + w.c.x) / 2 - P.x, (w.a.z + w.c.z) / 2 - P.z) < 60); if (!cand.length) continue; const w = cand[(Math.random() * cand.length) | 0], t = 0.25 + Math.random() * 0.5;
        const x = w.a.x + (w.c.x - w.a.x) * t, z = w.a.z + (w.c.z - w.a.z) * t, y = w.a.y + (w.c.y - w.a.y) * t - Math.sin(t * Math.PI) * w.sag; if (Math.hypot(x - P.x, z - P.z) < 14) continue;
        c.w = w; used.add(w); c.x = x; c.y = y; c.z = z; c.g.position.set(x, y, z); c.g.rotation.y = Math.atan2(w.c.z - w.a.z, w.c.x - w.a.x) * -1 + (Math.random() < 0.5 ? 0 : Math.PI); c.g.visible = true; c.st = 'sit'; c.t = 25 + Math.random() * 40; c.wl.visible = c.wr.visible = false; }
      else if (c.st === 'sit') { c.t -= dt; const d = Math.hypot(c.x - P.x, c.z - P.z); if (!c.w.g.parent || c.t < 0 || d > 85) { c.st = 'off'; c.g.visible = false; used.delete(c.w); c.cd = 5; continue; }
        c.g.position.y = c.y + Math.max(0, Math.sin(clock * 3 + c.x)) * 0.01;
        if (d < 9) { c.st = 'fly'; c.t = 4; const a = Math.atan2(c.x - P.x, c.z - P.z) + (Math.random() - 0.5) * 0.8; c.vx = Math.sin(a) * 7; c.vz = Math.cos(a) * 7; c.vy = 3.5; c.wl.visible = c.wr.visible = true; c.g.rotation.y = Math.atan2(c.vz, c.vx) * -1; caw(c.x, c.z); } }
      else if (c.st === 'fly') { c.t -= dt; c.ph += dt * 22; c.x += c.vx * dt; c.z += c.vz * dt; c.y += c.vy * dt; c.vy = Math.max(1.2, c.vy - dt * 1.2); c.g.position.set(c.x, c.y, c.z); c.wl.rotation.x = Math.PI / 2 + Math.sin(c.ph) * 0.9; c.wr.rotation.x = Math.PI / 2 - Math.sin(c.ph) * 0.9;
        if (c.t < 0) { c.st = 'off'; c.g.visible = false; used.delete(c.w); c.cd = 20 + Math.random() * 30; } } } };
}
