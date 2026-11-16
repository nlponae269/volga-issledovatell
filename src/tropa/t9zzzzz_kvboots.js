// ===================== Квартира 47: у коврика стоят мокрые ботинки и тёмная лужица под ними =====================
if (KV) {
  const bm = new THREE.MeshStandardMaterial({ color: 0x1e1a18, roughness: 0.55 }), sole = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9 }), pud = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 });
  function boot(x, z, r) { const g = new THREE.Group(); const so = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.3), sole), foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.2), bm), shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 10), bm);
    so.position.y = 0.015; foot.position.set(0, 0.07, 0.04); shaft.position.set(0, 0.16, -0.06); g.add(so, foot, shaft); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g); }
  const p = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), pud); p.rotation.x = -Math.PI / 2; p.position.set(1.36, 0.012, 3.55); p.scale.set(1, 1.4, 1); scene.add(p);
  boot(1.31, 3.5, 0.1); boot(1.43, 3.55, -0.05);
}
