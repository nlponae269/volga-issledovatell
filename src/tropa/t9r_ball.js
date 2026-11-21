// ===================== Мяч: иногда по двору катится ничей мячик, глухо стукает и замирает =====================
if (DVOR && !ALT) {
  const R = 0.11, cv = document.createElement('canvas'); cv.width = cv.height = 64; const cx = cv.getContext('2d'); cx.fillStyle = '#d9d6cc'; cx.fillRect(0, 0, 64, 64); cx.fillStyle = '#26262a';
  for (const [x, y] of [[16, 16], [48, 16], [32, 32], [16, 48], [48, 48]]) { cx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4 - Math.PI / 2; cx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); } cx.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 14, 10), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })); ball.visible = false; scene.add(ball); REFL.hide.push(ball);
  let st = 'off', cd = 40 + Math.random() * 40, t = 0, x = 0, z = 0, y = R, vx = 0, vz = 0, vy = 0;
  function thump(v) { if (!AC) return; const d = Math.hypot(x - P.x, z - P.z), g0 = 0.22 * Math.max(0, 1 - d / 70) * v; if (g0 <= 0.002) return; const a = Math.atan2(x - P.x, z - P.z) - (P.yaw + Math.PI), pan = Math.max(-1, Math.min(1, -Math.sin(a)));
    const tt = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(), sp = AC.createStereoPanner(); o.type = 'sine'; o.frequency.setValueAtTime(150, tt); o.frequency.exponentialRampToValueAtTime(70, tt + 0.12); sp.pan.value = pan; g.gain.setValueAtTime(g0, tt); g.gain.exponentialRampToValueAtTime(0.0004, tt + 0.16); o.connect(g).connect(sp).connect(master); o.start(tt); o.stop(tt + 0.2); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    if (st === 'off') { cd -= dt; if (cd > 0) return; const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 14; x = P.x + Math.sin(a) * r; z = P.z + Math.cos(a) * r; y = R; const b = Math.atan2(P.x - x, P.z - z) + (Math.random() - 0.5) * 1.2, s = 3 + Math.random() * 2.5; vx = Math.sin(b) * s; vz = Math.cos(b) * s; vy = 2.2; st = 'roll'; t = 0; ball.visible = true; return; }
    t += dt; vy -= 9.8 * dt; y += vy * dt; if (y < R) { y = R; if (vy < -0.8) { thump(Math.min(1, -vy / 2.2)); vy = -vy * 0.45; } else vy = 0; }
    const grounded = y <= R + 0.001, k = grounded ? 0.55 : 0.05; const f = Math.exp(-k * dt); vx *= f; vz *= f; x += vx * dt; z += vz * dt;
    const sp = Math.hypot(vx, vz); ball.position.set(x, y, z); if (sp > 0.01) { ball.rotation.x += vz * dt / R; ball.rotation.z -= vx * dt / R; }
    if (st === 'roll' && sp < 0.25 && grounded) { st = 'rest'; t = 0; }
    if ((st === 'rest' && t > 60) || Math.hypot(x - P.x, z - P.z) > 120) { st = 'off'; ball.visible = false; cd = 90 + Math.random() * 120; }
    if (st === 'rest' && Math.hypot(x - P.x, z - P.z) < 1.2) { st = 'off'; ball.visible = false; cd = 120 + Math.random() * 120; } };
}
