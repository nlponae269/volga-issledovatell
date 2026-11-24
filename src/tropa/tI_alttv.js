// ===================== ALTERNATIVE: в грязи стоит включённый кинескопный телевизор — на экране снег и силуэт =====================
if (ALT) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  function snow(t) { const d = g.createImageData(128, 96); for (let i = 0; i < d.data.length; i += 4) { const v = 60 + Math.random() * 190; d.data[i] = v; d.data[i + 1] = v * 0.95; d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); g.fillStyle = 'rgba(0,0,0,0.88)'; const w = 18 + Math.sin(t) * 2; g.beginPath(); g.ellipse(64, 46, w, 30, 0, 0, 6.3); g.fill(); g.beginPath(); g.arc(64, 22, 11, 0, 6.3); g.fill(); tex.needsUpdate = true; }
  snow(0);
  const casing = new THREE.MeshStandardMaterial({ color: 0x3b3329, roughness: 0.7 }), screen = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const tv = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.42), casing); box.position.y = 0.21; tv.add(box);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.2), casing); back.position.set(0, 0.2, -0.3); tv.add(back);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.28), screen); scr.position.set(-0.04, 0.22, 0.212); tv.add(scr);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), casing); f.position.set(s * 0.2, -0.0, 0.15); tv.add(f); }
  tv.position.set(11.8, 0.03, -4.5); tv.rotation.y = -0.35; scene.add(tv);
  let acc = 0; const prev = WORLD_UPDATE; WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return; acc += dt; if (acc > 0.09) { acc = 0; snow(clock); } };
}
