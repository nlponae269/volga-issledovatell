// ===================== Квартира: настенный календарь на кухне (ноябрь, одна дата обведена) =====================
if (KV) {
  const W = 256, H = 360, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = '#efe8d6'; c.fillRect(0, 0, W, H);
  const gr = c.createLinearGradient(0, 0, 0, 150); gr.addColorStop(0, '#6a8fb0'); gr.addColorStop(1, '#c9b27a'); c.fillStyle = gr; c.fillRect(12, 12, W - 24, 138);
  c.fillStyle = '#2f4a2a'; c.beginPath(); c.moveTo(12, 150); c.lineTo(70, 70); c.lineTo(120, 120); c.lineTo(170, 55); c.lineTo(W - 12, 150); c.closePath(); c.fill();
  c.fillStyle = '#c4392b'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('НОЯБРЬ', W / 2, 182);
  c.fillStyle = '#222'; c.font = '13px sans-serif';
  const dn = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  for (let i = 0; i < 7; i++) { c.fillStyle = i > 4 ? '#c4392b' : '#222'; c.fillText(dn[i], 26 + i * 34, 205); }
  let d = 1, col0 = 4;
  for (let r = 0; r < 5 && d <= 30; r++) for (let i = 0; i < 7 && d <= 30; i++) { if (r === 0 && i < col0) continue; c.fillStyle = i > 4 ? '#c4392b' : '#222'; c.fillText(String(d), 26 + i * 34, 228 + r * 24); if (d === 14) { c.strokeStyle = '#c4392b'; c.lineWidth = 2; c.beginPath(); c.arc(26 + i * 34, 224 + r * 24, 12, 0, 7); c.stroke(); } d++; }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.39), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); g.add(card);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })); nail.position.set(0, 0.2, 0.004); g.add(nail);
  g.position.set(4.52, 1.5, 0.6); g.rotation.y = -Math.PI / 2; scene.add(g);
}
