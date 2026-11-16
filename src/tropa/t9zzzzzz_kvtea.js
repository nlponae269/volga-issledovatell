// ===================== Квартира 47: на кухонном столе — чашка недопитого чая и тарелка с хлебом =====================
if (KV) {
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeae0, roughness: 0.35 }), tea = new THREE.MeshStandardMaterial({ color: 0x5a2f14, roughness: 0.08, metalness: 0.15 }), bread = new THREE.MeshStandardMaterial({ color: 0xc9a266, roughness: 0.9 }), crust = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.9 });
  const Y = 0.775;
  const cup = new THREE.Group(); cup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 14), white)); const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.004, 14), tea); liq.position.y = 0.034; cup.add(liq);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12), white); handle.position.set(0.05, 0.005, 0); cup.add(handle); cup.position.set(3.2, Y + 0.04, 1.9); scene.add(cup);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.015, 18), white); plate.position.set(3.0, Y + 0.008, 2.25); scene.add(plate);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.1), bread); s.position.set(3.0 + (i - 1) * 0.012, Y + 0.02 + i * 0.012, 2.25 + (i - 1) * 0.01); s.rotation.y = (i - 1) * 0.25; scene.add(s); const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.004, 0.1), crust); c.position.copy(s.position); c.position.y -= 0.005; c.rotation.y = s.rotation.y; c.scale.set(1.04, 1, 1.04); scene.add(c); }
}
