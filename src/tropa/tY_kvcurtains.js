// ===================== Квартира: шторы и карниз у окна большой комнаты =====================
if (KV) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#b5652f'; c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 16) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(i, 0, 6, 128); c.fillStyle = 'rgba(255,220,170,0.12)'; c.fillRect(i + 8, 0, 4, 128); }
  c.fillStyle = '#d9a35c'; for (let y = 10; y < 128; y += 32) for (let x = 8; x < 128; x += 32) { c.beginPath(); c.arc(x + 8, y + 8, 4, 0, 7); c.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 2);
  const cloth = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide }), rodM = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.5 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.0, 8), rodM); rod.rotation.x = Math.PI / 2; rod.position.set(5.9, 2.4, 5.0); scene.add(rod);
  for (const z of [4.0, 6.0]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), rodM); k.position.set(5.9, 2.4, z); scene.add(k); }
  function panel(zc, w) {
    const geo = new THREE.PlaneGeometry(w, 1.9, 14, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / w * Math.PI * 6) * 0.035);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, cloth); m.rotation.y = -Math.PI / 2; m.position.set(5.88, 1.42, zc); scene.add(m);
  }
  panel(4.27, 0.5); panel(5.73, 0.5);
}
