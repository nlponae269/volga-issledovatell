// ===================== Квартира: две семейные фотографии в рамках над кроватью в спальне =====================
if (KV) {
  function photo(seed, tone) {
    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 200; const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, tone[0]); g.addColorStop(1, tone[1]); c.fillStyle = g; c.fillRect(0, 0, 160, 200);
    c.fillStyle = tone[2];
    for (let i = 0; i < 2 + (seed % 2); i++) { const x = 40 + i * 48 + (seed * 7) % 10, h = 70 + ((seed + i) % 3) * 12; c.beginPath(); c.arc(x, 200 - h - 14, 14, 0, 7); c.fill(); c.fillRect(x - 15, 200 - h, 30, h); }
    for (let i = 0; i < 400; i++) { c.fillStyle = 'rgba(' + (60 + (i * 13) % 80) + ',50,30,0.06)'; c.fillRect((i * 37 + seed * 11) % 160, (i * 53) % 200, 2, 2); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.6 }), mat = new THREE.MeshStandardMaterial({ color: 0xeee6d2, roughness: 0.9 });
  const defs = [[0.3, 0.4, 1.47, 1.1, 1.52, ['#c9b38a', '#8c7552', '#3a2c1e']], [0.26, 0.34, 1.0, 1.15, 1.53, ['#9fb0b5', '#5f6d70', '#232a2c']], [0.3, 0.4, 0.55, 1.1, 1.51, ['#d1b89a', '#8a6d52', '#40281c']]];
  defs.forEach(([w, h, z, , y, tone], i) => {
    const g = new THREE.Group();
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.03, h + 0.04, w + 0.04), wood); g.add(fr);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.032, h - 0.01, w - 0.01), mat); g.add(m);
    const im = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, h * 0.72), new THREE.MeshStandardMaterial({ map: photo(i + 3, tone), roughness: 0.6 })); im.position.x = 0.018; im.rotation.y = Math.PI / 2; g.add(im);
    if (i > 1) return; g.position.set(-3.13, y, 2.9 + i * 0.32); g.rotation.z = (i - 1) * 0.02; scene.add(g);
  });
}
