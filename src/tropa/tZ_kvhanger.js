// ===================== Квартира: вешалка в прихожей с курткой, шарфом и ушанкой на стене x=1.8 =====================
if (KV) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3c22, roughness: 0.6 }), metal = new THREE.MeshStandardMaterial({ color: 0xb0a890, roughness: 0.3, metalness: 0.8 }), coat = new THREE.MeshStandardMaterial({ color: 0x2c3e66, roughness: 0.95 }), scarf = new THREE.MeshStandardMaterial({ color: 0xb02a2a, roughness: 0.95 }), fur = new THREE.MeshStandardMaterial({ color: 0x6a5238, roughness: 1 });
  const g = new THREE.Group(); // локально: +x от стены в прихожую, стена в x=0
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.8), wood); board.position.set(0.015, 1.75, 0); g.add(board);
  const hooks = [-0.28, 0, 0.28].map(z => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6), metal); h.rotation.z = Math.PI / 2; h.position.set(0.075, 1.72, z); g.add(h); const k = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), metal); k.position.set(0.12, 1.72, z); g.add(k); return z; });
  // куртка на среднем крючке
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.42), coat); body.position.set(0.1, 1.32, 0); g.add(body);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.46, 10), coat); sh.rotation.x = Math.PI / 2; sh.position.set(0.09, 1.66, 0); g.add(sh);
  for (const s of [-1, 1]) { const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.62, 8), coat); sl.position.set(0.1, 1.3, s * 0.26); sl.rotation.x = s * 0.08; g.add(sl); }
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), fur); col.position.set(0.13, 1.68, 0); g.add(col);
  // шарф на левом крючке
  const sc = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.08), scarf); sc.position.set(0.1, 1.45, -0.28); g.add(sc);
  const sc2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.09), scarf); sc2.position.set(0.11, 1.18, -0.28); g.add(sc2);
  // ушанка на правом
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), fur); hat.scale.set(1, 0.9, 1.1); hat.position.set(0.12, 1.78, 0.28); g.add(hat);
  for (const s of [-1, 1]) { const fl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.05), fur); fl.position.set(0.12, 1.66, 0.28 + s * 0.11); g.add(fl); }
  g.position.set(1.77, 0, 2.55); g.rotation.y = Math.PI; scene.add(g);
}
