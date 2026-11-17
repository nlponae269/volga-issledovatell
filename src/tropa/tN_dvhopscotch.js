// ===================== Дворы: во дворе лежит бетонная плита с нарисованными мелом классиками =====================
if (DVOR && !ALT) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const g = cv.getContext('2d');
  g.fillStyle = '#8a8780'; g.fillRect(0, 0, 256, 512); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60|0},${40 + Math.random() * 50|0},${35 + Math.random() * 50|0},0.18)`; g.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 6, 2 + Math.random() * 6); }
  g.strokeStyle = 'rgba(245,245,240,0.82)'; g.fillStyle = 'rgba(245,245,240,0.82)'; g.lineWidth = 5; g.lineCap = 'round'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center';
  const cells = [[88, 430, 80, 70], [88, 360, 80, 70], [48, 290, 80, 70], [128, 290, 80, 70], [88, 220, 80, 70], [48, 150, 80, 70], [128, 150, 80, 70], [88, 80, 80, 70]];
  cells.forEach(([x, y, w, h], i) => { g.strokeRect(x, y, w, h + 0); g.fillText(String(i + 1), x + w / 2, y + h / 2 + 12); });
  g.beginPath(); g.arc(128, 38, 28, 0, 6.3); g.stroke(); g.fillText('9', 128, 50);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), side = new THREE.MeshStandardMaterial({ color: 0x6f6c66, roughness: 1 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 3.2), [side, side, top, side, side, side]); slab.position.set(4.2, 0.05, -5.2); slab.rotation.y = 0.12; scene.add(slab);
}
