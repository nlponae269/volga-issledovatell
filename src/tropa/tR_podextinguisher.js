// ===================== Подъезд: огнетушитель у стены на площадке 1 этажа =====================
if (PODEZD) {
  const red = new THREE.MeshStandardMaterial({ color: 0xc4201c, roughness: 0.4 }), blk = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 }), met = new THREE.MeshStandardMaterial({ color: 0xa0a4a8, roughness: 0.3, metalness: 0.8 }), lab = new THREE.MeshStandardMaterial({ color: 0xe8e4d4, roughness: 0.8 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.38, 16), red); body.position.y = 0.3; g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), red); dome.position.y = 0.49; g.add(dome);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 10), met); neck.position.y = 0.58; g.add(neck);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), blk); hd.position.set(0.02, 0.61, 0); g.add(hd);
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 14, Math.PI * 1.3), blk); hose.position.set(0.05, 0.46, 0.06); hose.rotation.set(0, 0.4, 0.3); g.add(hose);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.12), lab); l.position.set(0, 0.32, 0.077); g.add(l);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), blk); base.position.y = 0.11; g.add(base);
  g.position.set(-1.45, 0.0, -1.75); scene.add(g);
}
