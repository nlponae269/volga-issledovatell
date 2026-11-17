// ===================== Дворы: брошенный детский самокат брошен у спавна =====================
if (DVOR && !ALT) {
  const grn = new THREE.MeshStandardMaterial({ color: 0x2f9e5a, roughness: 0.45 }), met = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.7 }), blk = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 }), ora = new THREE.MeshStandardMaterial({ color: 0xe8741c, roughness: 0.5 });
  const s = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.12), grn); deck.position.set(0, 0.05, 0); s.add(deck);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.004, 0.03), ora); stripe.position.set(0, 0.067, 0); s.add(stripe);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 8), met); fork.position.set(0.3, 0.2, 0); fork.rotation.z = -0.35; s.add(fork);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), met); bar.rotation.x = Math.PI / 2; bar.position.set(0.42, 0.44, 0); s.add(bar);
  for (const z of [-0.2, 0.2]) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), blk); g.rotation.x = Math.PI / 2; g.position.set(0.42, 0.44, z); s.add(g); }
  for (const x of [-0.27, 0.34]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 16), blk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.055, 0); s.add(w); const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.034, 8), ora); hb.rotation.x = Math.PI / 2; hb.position.set(x, 0.055, 0); s.add(hb); }
  const brk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.1), met); brk.position.set(-0.3, 0.115, 0); brk.rotation.z = 0.5; s.add(brk);
  s.position.set(10.4, 0.0, -4.6); s.rotation.set(0, 0.5, 0); scene.add(s);
}
