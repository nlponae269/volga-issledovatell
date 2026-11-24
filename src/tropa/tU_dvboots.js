// ===================== Дворы: детские жёлтые резиновые сапожки, брошенные в грязи =====================
if (DVOR && !ALT) {
  const yel = new THREE.MeshStandardMaterial({ color: 0xe6b81c, roughness: 0.35 }), sole = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }), mud = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 1 });
  function boot(x, z, ry, tilt) {
    const g = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.22, 12), yel); leg.position.set(0, 0.17, -0.03); g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.2), yel); foot.position.set(0, 0.05, 0.05); g.add(foot);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), yel); toe.position.set(0, 0.055, 0.15); toe.scale.set(1, 0.8, 1); g.add(toe);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.015, 0.27), sole); sl.position.set(0, 0.008, 0.06); g.add(sl);
    const dirt = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mud); dirt.position.set(0, 0.04, 0.14); dirt.scale.set(1.1, 0.5, 1.3); g.add(dirt);
    g.position.set(x, 0, z); g.rotation.set(0, ry, tilt); scene.add(g);
  }
  boot(4.9, -7.6, 0.4, 0); boot(5.15, -7.95, 2.2, 1.45);
}
