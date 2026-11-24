// ===================== ALTERNATIVE: посреди двора стоит одинокий стул, а на нём аккуратно сложена школьная форма =====================
if (ALT) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.8 }), cloth = new THREE.MeshStandardMaterial({ color: 0x1b2a4a, roughness: 1 }), white = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 1 });
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), wood); seat.position.y = 0.45; g.add(seat);
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), wood); l.position.set(x, 0.225, z); g.add(l); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.04), wood); back.position.set(0, 0.68, -0.19); g.add(back);
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.3), cloth); jacket.position.set(0, 0.505, 0.02); g.add(jacket);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.26), white); shirt.position.set(0, 0.545, 0.0); g.add(shirt);
  g.position.set(7.4, 0, -7.5); g.rotation.y = Math.PI + 0.1; scene.add(g);
}
