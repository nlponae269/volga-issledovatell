// ===================== Квартира 47: на подоконнике большой комнаты — герань в горшке =====================
if (KV) {
  const pot = new THREE.MeshStandardMaterial({ color: 0xa9552f, roughness: 0.9 }), soil = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 1 }), leaf = new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 0.8, side: THREE.DoubleSide }), flower = new THREE.MeshStandardMaterial({ color: 0xc8283a, roughness: 0.6 });
  const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.1, 14), pot); p.position.y = 0.05; g.add(p);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.01, 14), soil); s.position.y = 0.1; g.add(s);
  const r = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), leaf), a = i / 9 * 6.283 + r(), d = 0.03 + r() * 0.05; l.scale.set(1, 0.35, 1); l.position.set(Math.cos(a) * d, 0.16 + r() * 0.12, Math.sin(a) * d); l.rotation.set(r() * 0.8, r() * 3, r() * 0.8); g.add(l); }
  for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), flower), a = i * 2.1; f.position.set(Math.cos(a) * 0.04, 0.3 + (i % 2) * 0.03, Math.sin(a) * 0.04); g.add(f); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 4), leaf); st.position.set(f.position.x, 0.2, f.position.z); g.add(st); }
  g.position.set(5.86, 0.9, 5.0); scene.add(g);
}
