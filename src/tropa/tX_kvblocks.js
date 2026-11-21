// ===================== Квартира: детские кубики с буквами и резиновый мячик на ковре в большой комнате =====================
if (KV) {
  function cube(col, letter) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d');
    c.fillStyle = col; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(32, 32, 24, 0, 7); c.fill();
    c.fillStyle = col; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(letter, 32, 34);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
  }
  const g = new THREE.Group();
  const specs = [['#c4392b', 'А', 0, 0.035, 0, 0.2], ['#2f78c4', 'Б', 0.005, 0.105, 0.003, -0.1], ['#e0b020', 'В', -0.003, 0.175, 0, 0.3], ['#3a9a50', 'Г', 0.16, 0.035, 0.1, 0.9], ['#c4392b', 'Д', 0.22, 0.035, -0.06, 0.4]];
  for (const [col, l, x, y, z, ry] of specs) { const m = cube(col, l); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshStandardMaterial({ color: 0xd8472c, roughness: 0.35 })); ball.position.set(-0.22, 0.05, 0.12); g.add(ball);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 16), new THREE.MeshStandardMaterial({ color: 0xf2efe0, roughness: 0.4 })); band.position.copy(ball.position); band.rotation.x = Math.PI / 2; g.add(band);
  g.position.set(4.4, 0.01, 4.5); scene.add(g);
}
