// ===================== Дворы: брошенная скакалка с красными ручками рядом с классиками =====================
if (DVOR && !ALT) {
  const cord = new THREE.MeshStandardMaterial({ color: 0xe0c040, roughness: 0.7 }), hnd = new THREE.MeshStandardMaterial({ color: 0xcc2a2a, roughness: 0.4 });
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(-0.8 + t * 1.6 + Math.sin(t * 9) * 0.05, 0.008, Math.sin(t * 5.5) * 0.28 * Math.sin(t * Math.PI) + Math.cos(t * 13) * 0.03)); }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.008, 5, false), cord); g.add(tube);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), hnd); h.rotation.z = Math.PI / 2; h.rotation.y = s * 0.4; h.position.set(s * 0.88, 0.02, s * 0.04); g.add(h); }
  g.position.set(2.6, 0, -4.0); g.rotation.y = 0.4; scene.add(g);
}
