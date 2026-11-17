// ===================== Подъезд: у стены на площадке стоят мусорные пакеты и пустые банки =====================
if (PODEZD) {
  const bag = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.35, metalness: 0.1 }), white = new THREE.MeshStandardMaterial({ color: 0xdcdad2, roughness: 0.5 }), tin = new THREE.MeshStandardMaterial({ color: 0xa8aeb4, roughness: 0.35, metalness: 0.8 });
  function trash(x, z, s, mat) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 12, 10), mat); b.scale.set(1, 1.15, 0.9); b.position.set(x, 0.21 * s, z); scene.add(b); const t = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 8, 6), mat); t.position.set(x + 0.02 * s, 0.43 * s, z); t.scale.set(1, 0.7, 1); scene.add(t); }
  trash(0.15, -1.7, 1, bag); trash(0.5, -1.62, 0.8, bag); trash(0.38, -1.95, 0.7, white);
  for (const [x, z, r] of [[0.9, -1.85, 1.2], [0.75, -1.5, 0.3]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 10), tin); c.position.set(x, 0.03, z); c.rotation.z = Math.PI / 2; c.rotation.y = r; scene.add(c); }
}
