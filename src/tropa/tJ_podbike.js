// ===================== Подъезд: на площадке первого этажа к стене прислонён детский велосипед =====================
if (PODEZD) {
  const rubber = new THREE.MeshStandardMaterial({ color: 0x131314, roughness: 0.9 }), frame = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.35, metalness: 0.5 }), chrome = new THREE.MeshStandardMaterial({ color: 0xb9bdc1, roughness: 0.25, metalness: 0.9 }), seat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.7 });
  const b = new THREE.Group(), R = 0.2;
  function wheel(z) { const w = new THREE.Mesh(new THREE.TorusGeometry(R, 0.018, 8, 24), rubber); w.rotation.y = Math.PI / 2; w.position.set(0, R + 0.02, z); b.add(w); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8), chrome); hub.rotation.z = Math.PI / 2; hub.position.set(0, R + 0.02, z); b.add(hub); for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, R * 2, 3), chrome); sp.rotation.x = i * Math.PI / 6; sp.position.set(0, R + 0.02, z); b.add(sp); } }
  wheel(-0.36); wheel(0.36);
  function bar(x1, y1, z1, x2, y2, z2, m = frame, r = 0.013) { const L = Math.hypot(y2 - y1, z2 - z1); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), m); c.position.set(x1, (y1 + y2) / 2, (z1 + z2) / 2); c.rotation.x = Math.atan2(z2 - z1, y2 - y1) * -1; b.add(c); }
  bar(0, 0.22, -0.36, 0, 0.5, -0.2); bar(0, 0.5, -0.2, 0, 0.55, 0.18); bar(0, 0.55, 0.18, 0, 0.22, 0.36); bar(0, 0.22, -0.36, 0, 0.55, 0.18); bar(0, 0.2, 0.0, 0, 0.55, 0.18);
  bar(0, 0.22, 0.36, 0, 0.45, 0.2, frame, 0.01);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.2), seat); st.position.set(0, 0.6, 0.2); b.add(st);
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 6), chrome); hb.rotation.z = Math.PI / 2; hb.position.set(0, 0.6, -0.24); b.add(hb);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), chrome); fork.position.set(0, 0.4, -0.3); fork.rotation.x = -0.15; b.add(fork);
  b.position.set(-1.3, 0, -1.0); b.rotation.z = -0.13; scene.add(b);
}
