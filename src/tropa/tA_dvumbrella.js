// ===================== Дворы: во дворе валяется сломанный зонт и пустая бутылка =====================
if (DVOR && !ALT) {
  const cloth = new THREE.MeshStandardMaterial({ color: 0x1c1d24, roughness: 0.8, side: THREE.DoubleSide }), metal = new THREE.MeshStandardMaterial({ color: 0x777a7e, roughness: 0.35, metalness: 0.7 }), glass = new THREE.MeshStandardMaterial({ color: 0x3e6b3a, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.8 });
  const u = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), cloth); dome.position.y = 0.04; dome.rotation.z = 0.12; u.add(dome);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, sp = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.44, 4), metal); sp.position.set(Math.cos(a) * 0.19, 0.17, Math.sin(a) * 0.19); sp.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); u.add(sp); if (i === 2 || i === 5) sp.rotation.x += 0.7; }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.85, 6), metal); shaft.rotation.z = Math.PI / 2; shaft.position.set(0.5, 0.012, 0.05); u.add(shaft);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 6, 10, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.6 })); hook.position.set(0.93, 0.04, 0.05); hook.rotation.z = Math.PI; u.add(hook);
  u.position.set(10.2, 0, -1.6); u.rotation.y = 0.8; scene.add(u);
  const b = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 10), glass), neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.034, 0.09, 10), glass); body.rotation.z = Math.PI / 2; neck.rotation.z = Math.PI / 2; neck.position.x = 0.145; b.add(body, neck); b.position.set(8.9, 0.036, -2.4); b.rotation.y = 2.2; scene.add(b);
}
