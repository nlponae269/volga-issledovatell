// ===================== Дворы: размокшая картонная коробка с кирпичами и пустая пластиковая бутылка =====================
if (DVOR && !ALT) {
  const card = new THREE.MeshStandardMaterial({ color: 0x8c6c48, roughness: 1 }), wet = new THREE.MeshStandardMaterial({ color: 0x5e4630, roughness: 0.8 }), brick = new THREE.MeshStandardMaterial({ color: 0x9a4a36, roughness: 0.95 }), tape = new THREE.MeshStandardMaterial({ color: 0xb89c6a, roughness: 0.5 });
  const g = new THREE.Group();
  const bx = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.36), card); bx.position.y = 0.15; bx.rotation.z = 0.04; g.add(bx);
  const low = new THREE.Mesh(new THREE.BoxGeometry(0.505, 0.1, 0.365), wet); low.position.y = 0.05; g.add(low);
  const fl = [[-0.28, 0.33, 0.9], [0.28, 0.33, -1.0]];
  for (const [x, y, r] of fl) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.01, 0.36), card); f.position.set(x, 0.3, 0); f.rotation.z = r * 0.5 * Math.sign(-x); f.position.y = 0.34; g.add(f); }
  const tp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.002, 0.37), tape); tp.position.set(0, 0.302, 0); g.add(tp);
  g.position.set(6.9, 0, -6.8); g.rotation.y = 0.5; scene.add(g);
  for (const [x, z, r] of [[7.5, -6.2, 0.3], [7.65, -6.4, 1.2], [6.2, -6.0, 2.0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.065, 0.105), brick); b.position.set(x, 0.033, z); b.rotation.y = r; scene.add(b); }
}
