// ===================== Окно кв. 47: тёплый свет и силуэт мамы, которая иногда машет рукой (только обычные Дворы) =====================
if (DVOR && !ALT) {
  const frameBars = [];
  const W = 1.35, H = 1.35, X = 39.44, Y = 8.9, Z = 33.0;   // третий этаж дома 13, подъезд «твой»
  const glow = new THREE.MeshBasicMaterial({ map: texFrom(mkCanvas(64, 64, (g) => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#ffe2a8'); gr.addColorStop(1, '#ffc070'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(120,70,30,0.5)'; g.fillRect(0, 0, 8, 64); g.fillRect(56, 0, 8, 64); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(30, 0, 4, 64); })), fog: true });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(W, H), glow); win.position.set(X, Y, Z); win.rotation.y = -Math.PI / 2; scene.add(win);
  { const fm = new THREE.MeshBasicMaterial({ color: 0xe8e8e2 }); for (const [dy, dz, sy, sz] of [[0, 0.7, 1.45, 0.07], [0, -0.7, 1.45, 0.07], [0.7, 0, 0.07, 1.45], [-0.7, 0, 0.07, 1.45]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, sy, sz), fm); f.position.set(X - 0.01, Y + dy, Z + dz); scene.add(f); frameBars.push(f); } }
  const sil = new THREE.Group(), blk = new THREE.MeshBasicMaterial({ color: 0x1a1008 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.4, 4, 8), blk); body.position.set(0, -0.2, 0); const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), blk); head.position.set(0, 0.2, 0);
  const arm = new THREE.Group(); arm.position.set(0.17, 0.05, 0); const aR = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.36, 3, 6).translate(0, 0.2, 0), blk); arm.add(aR); sil.add(body, head, arm);
  sil.position.set(X + 0.015, Y - 0.1, Z - 0.1); sil.rotation.y = -Math.PI / 2; sil.visible = false; scene.add(sil);
  // тёплый свет на фасаде
  const lt = new THREE.PointLight(0xffc070, 0, 9, 2); lt.position.set(X - 0.6, Y, Z); scene.add(lt);
  let t = 12, wave = 0, seen = false;
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    const d = Math.hypot(X - P.x, Z - P.z), vis = d < 140; win.visible = vis; frameBars.forEach((f) => { f.visible = vis; }); lt.intensity = vis ? 1.1 + Math.sin(clock * 0.8) * 0.06 : 0;
    t -= dt; if (t < 0 && d < 70) { t = 45 + Math.random() * 60; wave = 4; sil.visible = true; if (!seen && d < 50) { seen = true; toast('<span style="font-size:14px">В окне на третьем этаже горит свет.<br>Там кто-то стоит.</span>'); } }
    if (wave > 0) { wave -= dt; arm.rotation.z = -2.3 + Math.sin(clock * 6) * 0.45; if (wave <= 0) sil.visible = false; } };
}
