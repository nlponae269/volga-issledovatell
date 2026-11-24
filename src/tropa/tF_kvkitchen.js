// ===================== Квартира 47: на плите — эмалированный чайник, у раковины — сушилка с тарелками =====================
if (KV) {
  const enamel = new THREE.MeshStandardMaterial({ color: 0xe9e4d4, roughness: 0.3 }), blue = new THREE.MeshStandardMaterial({ color: 0x2a5aa0, roughness: 0.35 }), dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.6 }), steel = new THREE.MeshStandardMaterial({ color: 0xb4b8bc, roughness: 0.3, metalness: 0.8 }), plate = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.25 }), rim = new THREE.MeshStandardMaterial({ color: 0x3a6aa8, roughness: 0.3 });
  const k = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.115, 0.17, 18), enamel); body.position.y = 0.085; k.add(body);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), enamel); lid.position.y = 0.17; lid.scale.y = 0.4; k.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), dark); knob.position.y = 0.21; k.add(knob);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.025, 18), blue); band.position.y = 0.025; k.add(band);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.12, 8), enamel); spout.position.set(0.12, 0.12, 0); spout.rotation.z = -0.9; k.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 14, Math.PI), dark); handle.position.set(0, 0.17, 0); k.add(handle);
  k.position.set(4.44, 0.93, 0.54); k.rotation.y = 0.6; scene.add(k);
  const r = new THREE.Group(); const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.28), steel); base.position.y = 0.006; r.add(base);
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.07, 0.28), steel); s.position.set(-0.15 + i * 0.1, 0.045, 0); r.add(s); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.006, 20), plate); p.rotation.z = Math.PI / 2; p.position.set(-0.1 + i * 0.09, 0.115, 0); r.add(p); const pr = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.003, 4, 24), rim); pr.rotation.y = Math.PI / 2; pr.position.copy(p.position); r.add(pr); if (i === 3) break; }
  r.position.set(2.4, 0.92, 0.35); scene.add(r);
}
