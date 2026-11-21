// ===================== Дворы: у спавна брошена пластмассовая машинка и эмалированная кружка =====================
if (DVOR && !ALT) {
  const red = new THREE.MeshStandardMaterial({ color: 0xd03a2a, roughness: 0.45 }), yel = new THREE.MeshStandardMaterial({ color: 0xe8c030, roughness: 0.5 }), blk = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }), glass = new THREE.MeshStandardMaterial({ color: 0x8fb4cc, roughness: 0.1, transparent: true, opacity: 0.7 }), enamel = new THREE.MeshStandardMaterial({ color: 0xece8d8, roughness: 0.3 }), rimM = new THREE.MeshStandardMaterial({ color: 0x244f9a, roughness: 0.4 });
  const c = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.12), red); body.position.y = 0.065; c.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.105), glass); cab.position.set(-0.02, 0.125, 0); c.add(cab);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.008, 0.11), red); roof.position.set(-0.02, 0.158, 0); c.add(roof);
  for (const [x, z] of [[-0.085, 0.07], [-0.085, -0.07], [0.09, 0.07], [0.09, -0.07]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), blk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.03, z); c.add(w); const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.022, 8), yel); hb.rotation.x = Math.PI / 2; hb.position.set(x, 0.03, z); c.add(hb); }
  c.position.set(9.4, 0, 0.3); c.rotation.y = 0.7; c.rotation.z = 0.05; scene.add(c);
  const m = new THREE.Group(); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 14), enamel); cup.rotation.z = Math.PI / 2; cup.position.y = 0.04; m.add(cup);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.004, 4, 14), rimM); rim.rotation.y = Math.PI / 2; rim.position.set(0.045, 0.04, 0); m.add(rim);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 10, Math.PI), enamel); hd.position.set(0, 0.04, 0.045); hd.rotation.x = Math.PI / 2; m.add(hd);
  m.position.set(7.1, 0.01, 0.1); m.rotation.y = 1.1; scene.add(m);
}
