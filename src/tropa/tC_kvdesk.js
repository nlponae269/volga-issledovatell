// ===================== Квартира 47: на письменном столе — кассетный магнитофон и стопка тетрадей =====================
if (KV) {
  const Y = 0.76, body = new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.5, metalness: 0.2 }), silver = new THREE.MeshStandardMaterial({ color: 0xaeb2b6, roughness: 0.3, metalness: 0.8 }), win = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.3 }), paper = new THREE.MeshStandardMaterial({ color: 0xe9e4d2, roughness: 0.9 }), cover = new THREE.MeshStandardMaterial({ color: 0x4f7f4a, roughness: 0.9 }), cover2 = new THREE.MeshStandardMaterial({ color: 0xb04a3a, roughness: 0.9 });
  const rec = new THREE.Group(); rec.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.16), body));
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.004), silver); front.position.set(0, 0, 0.082); rec.add(front);
  const cas = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.006), win); cas.position.set(-0.05, 0.005, 0.086); rec.add(cas);
  for (const k of [0, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.007, 10), silver); b.rotation.x = Math.PI / 2; b.position.set(0.09 + k * 0.035, 0, 0.087); rec.add(b); }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.34, 4), silver); ant.position.set(0.12, 0.2, -0.06); ant.rotation.z = -0.5; rec.add(ant);
  rec.position.set(-1.0, Y + 0.05, 3.12); rec.rotation.y = 0.15; scene.add(rec);
  for (let i = 0; i < 4; i++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.006, 0.21), i % 2 ? cover2 : cover); n.position.set(-0.62 + (i % 2) * 0.004, Y + 0.005 + i * 0.007, 3.3); n.rotation.y = 0.25 + i * 0.08; scene.add(n); const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.004, 0.2), paper); p.position.copy(n.position); p.position.y += 0.0045; p.rotation.y = n.rotation.y; scene.add(p); }
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 6), new THREE.MeshStandardMaterial({ color: 0x1b3a8a })); pen.rotation.set(Math.PI / 2, 0, 0.9); pen.position.set(-0.45, Y + 0.008, 3.1); scene.add(pen);
}
