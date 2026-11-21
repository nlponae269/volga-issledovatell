// ===================== ALTERNATIVE: посреди двора стоит дверь в никуда — открытая, а за ней чернота =====================
if (ALT) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.8 }), frameM = new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.7 }), void_ = new THREE.MeshBasicMaterial({ color: 0x000000 }), brass = new THREE.MeshStandardMaterial({ color: 0xb08a40, roughness: 0.3, metalness: 0.9 });
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.15, 0.14), frameM); p.position.set(s * 0.5, 1.075, 0); g.add(p); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.14), frameM); top.position.set(0, 2.15, 0); g.add(top);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.1), void_); hole.position.set(0, 1.05, 0); g.add(hole);
  const hole2 = hole.clone(); hole2.rotation.y = Math.PI; g.add(hole2);
  const leaf = new THREE.Group(); const door = new THREE.Mesh(new THREE.BoxGeometry(0.88, 2.05, 0.04), wood); door.position.set(0.44, 1.03, 0); leaf.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), brass); knob.position.set(0.76, 1.0, 0.04); leaf.add(knob);
  leaf.position.set(-0.45, 0, 0); leaf.rotation.y = -1.15; g.add(leaf);
  g.position.set(5.5, 0, -13); g.rotation.y = 0.2; scene.add(g);
}
