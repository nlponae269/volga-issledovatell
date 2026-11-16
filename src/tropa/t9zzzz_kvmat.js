// ===================== Квартира 47: в прихожей — полосатый коврик и стоптанные тапки =====================
if (KV) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 192; const g = cv.getContext('2d'); g.fillStyle = '#6b3a30'; g.fillRect(0, 0, 128, 192);
  for (let y = 0; y < 192; y += 24) { g.fillStyle = y % 48 ? '#8a5a44' : '#3f2a28'; g.fillRect(0, y, 128, 10); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 6, 192); g.fillRect(122, 0, 6, 192);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.012, 1.05), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })); mat.position.set(0.9, 0.007, 3.4); scene.add(mat);
  const sm = new THREE.MeshStandardMaterial({ color: 0x38424e, roughness: 0.95 }), sole = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.9 });
  for (const [x, z, r] of [[0.78, 3.15, 0.12], [1.02, 3.22, -0.08]]) { const s = new THREE.Group(); const so = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.27), sole), up = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.14), sm); so.position.y = 0.022; up.position.set(0, 0.058, -0.05); s.add(so, up); s.position.set(x, 0.01, z); s.rotation.y = r; scene.add(s); }
}
