// ===================== Подъезд: на площадке первого этажа стоят детские санки и стоптанные валенки =====================
if (PODEZD) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a5a2a, roughness: 0.85 }), steel = new THREE.MeshStandardMaterial({ color: 0x585c60, roughness: 0.4, metalness: 0.6 }), felt = new THREE.MeshStandardMaterial({ color: 0x6a6358, roughness: 1 }), rope = new THREE.MeshStandardMaterial({ color: 0xb02a2a, roughness: 0.9 });
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.5), wood); s.position.set(-0.17 + i * 0.085, 0.14, 0); g.add(s); }
  for (const sx of [-0.2, 0.2]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.62), steel); r.position.set(sx, 0.015, 0.02); g.add(r); for (const z of [-0.15, 0.15]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), steel); l.position.set(sx, 0.08, z); g.add(l); } }
  const ro = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6), rope); ro.scale.y = 0.5; ro.rotation.set(Math.PI / 2, 0, 0.5); ro.position.set(0.12, 0.012, 0.5); g.add(ro);
  g.position.set(1.2, 0, -1.6); g.rotation.y = 0.15; scene.add(g);
  for (const [x, z, r] of [[2.3, -1.7, 0.3], [2.48, -1.78, -0.2]]) { const v = new THREE.Group(); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.24), felt), sh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.24, 10), felt); foot.position.y = 0.04; foot.position.z = 0.04; sh.position.set(0, 0.2, -0.04); v.add(foot, sh); v.position.set(x, 0, z); v.rotation.y = r; scene.add(v); }
}
