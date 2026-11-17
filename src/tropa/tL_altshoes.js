// ===================== ALTERNATIVE: от спавна уходит ровная цепочка детских ботинок — пара за парой, всё дальше =====================
if (ALT) {
  const leather = new THREE.MeshStandardMaterial({ color: 0x2a1c16, roughness: 0.6 }), sole = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.9 });
  for (let i = 0; i < 10; i++) { const z = -3.5 - i * 1.9, x = 8 + Math.sin(i * 0.6) * 0.35, s = 1 + i * 0.045;
    for (const d of [-1, 1]) { const g = new THREE.Group(); const so = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.22), sole), up = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.15), leather), sh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.1, 8), leather); so.position.y = 0.01; up.position.set(0, 0.05, -0.03); sh.position.set(0, 0.11, 0.04); g.add(so, up, sh); g.scale.setScalar(s); g.position.set(x + d * 0.14, 0, z); g.rotation.y = d * 0.05; scene.add(g); } }
}
