// ===================== Дворы: у спавна кто-то забыл детское ведёрко, совок и варежку =====================
if (DVOR && !ALT) {
  const bucketM = new THREE.MeshStandardMaterial({ color: 0xd9382e, roughness: 0.55 }), shovelM = new THREE.MeshStandardMaterial({ color: 0x2f8fd0, roughness: 0.55 }), mit = new THREE.MeshStandardMaterial({ color: 0x8a2a3a, roughness: 1 }), inner = new THREE.MeshStandardMaterial({ color: 0x4a1410, roughness: 0.9 });
  const g = new THREE.Group();
  const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.17, 14, 1, true), bucketM); bk.material.side = THREE.DoubleSide; bk.position.y = 0.06; bk.rotation.z = 1.35; g.add(bk);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(0.075, 14), inner); bot.position.set(0.085, 0.06, 0); bot.rotation.y = Math.PI / 2 * 1; g.add(bot);
  const sh = new THREE.Group(); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.1), shovelM), hn = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.18), shovelM); hn.position.z = -0.14; sh.add(hd, hn); sh.position.set(-0.28, 0.008, 0.12); sh.rotation.y = 0.7; g.add(sh);
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mit); m.scale.set(1, 0.4, 1.3); m.position.set(0.3, 0.012, -0.25); m.rotation.y = 0.4; g.add(m);
  g.position.set(6.2, 0, -2.6); g.rotation.y = 0.5; scene.add(g);
}
