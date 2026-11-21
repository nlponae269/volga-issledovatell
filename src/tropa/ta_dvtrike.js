// ===================== Дворы: заброшенный детский трёхколёсный велосипед, опрокинутый на бок =====================
if (DVOR && !ALT) {
  const red = new THREE.MeshStandardMaterial({ color: 0xc23a2a, roughness: 0.45 }), blk = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 }), met = new THREE.MeshStandardMaterial({ color: 0xa8abb0, roughness: 0.3, metalness: 0.8 }), yel = new THREE.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.5 });
  const g = new THREE.Group();
  const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 18), blk); fw.rotation.x = Math.PI / 2; fw.position.set(0.32, 0.13, 0); g.add(fw);
  const fh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), yel); fh.rotation.x = Math.PI / 2; fh.position.copy(fw.position); g.add(fh);
  for (const z of [-0.14, 0.14]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 14), blk); w.rotation.x = Math.PI / 2; w.position.set(-0.22, 0.09, z); g.add(w); }
  const fr = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.05), red); fr.position.set(0.02, 0.2, 0); fr.rotation.z = 0.2; g.add(fr);
  const fk = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), met); fk.position.set(0.28, 0.27, 0); fk.rotation.z = -0.3; g.add(fk);
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), met); hb.rotation.x = Math.PI / 2; hb.position.set(0.22, 0.4, 0); g.add(hb);
  for (const z of [-0.15, 0.15]) { const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), yel); gr.rotation.x = Math.PI / 2; gr.position.set(0.22, 0.4, z); g.add(gr); }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.12), blk); seat.position.set(-0.18, 0.24, 0); g.add(seat);
  g.position.set(12.6, 0, -2.4); g.rotation.set(0, 0.8, 0); scene.add(g);
}
