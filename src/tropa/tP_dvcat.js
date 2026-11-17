// ===================== Дворы: рыжий кот сидит недалеко от спавна и смотрит на игрока =====================
if (DVOR && !ALT) {
  const fur = new THREE.MeshStandardMaterial({ color: 0xc9772e, roughness: 0.95 }), wht = new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: 0.95 }), eye = new THREE.MeshStandardMaterial({ color: 0xb8d048, roughness: 0.3, emissive: 0x303810 }), blk = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.5 }), pink = new THREE.MeshStandardMaterial({ color: 0xd89a9a, roughness: 0.8 });
  const cat = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), fur); body.scale.set(0.95, 1.2, 0.85); body.position.set(0, 0.16, 0); body.rotation.x = -0.25; cat.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), wht); chest.position.set(0, 0.17, 0.085); chest.scale.set(0.9, 1.3, 0.6); cat.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), fur); head.position.set(0, 0.33, 0.04); head.scale.set(1.1, 0.95, 1); cat.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), fur); ear.position.set(s * 0.052, 0.4, 0.03); ear.rotation.z = -s * 0.2; cat.add(ear);
    const ein = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.035, 4), pink); ein.position.set(s * 0.052, 0.395, 0.045); ein.rotation.z = -s * 0.2; cat.add(ein);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eye); e.position.set(s * 0.03, 0.34, 0.108); e.scale.set(1, 1.2, 0.6); cat.add(e);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 5), blk); pu.position.set(s * 0.03, 0.34, 0.116); pu.scale.set(0.6, 1.4, 0.5); cat.add(pu);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), wht); paw.position.set(s * 0.05, 0.03, 0.12); paw.scale.set(0.8, 0.8, 1.3); cat.add(paw);
    const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), fur); thigh.position.set(s * 0.1, 0.07, -0.02); thigh.scale.set(0.8, 0.9, 1.2); cat.add(thigh);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), pink); nose.position.set(0, 0.318, 0.115); cat.add(nose);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI * 1.1), fur); tail.position.set(0.02, 0.02, -0.1); tail.rotation.set(Math.PI / 2, 0, 0.6); cat.add(tail);
  // полоски на спине
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.02), new THREE.MeshStandardMaterial({ color: 0x8c4a18, roughness: 1 })); st.position.set(0, 0.2 + i * 0.045, -0.09 + i * 0.012); st.rotation.x = -0.25; cat.add(st); }
  cat.position.set(5.6, 0, -3.4); cat.scale.setScalar(1.25); scene.add(cat);
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => {
    if (prev) prev(dt);
    if (!started) return;
    const dx = P.x - cat.position.x, dz = P.z - cat.position.z, d = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz); let da = want - cat.rotation.y; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    cat.rotation.y += da * Math.min(1, dt * 3);
    tail.rotation.z = 0.6 + Math.sin(clock.elapsedTime * 1.6) * 0.25;
    if (d < 2.2) { cat.position.x -= dx / d * dt * 3; cat.position.z -= dz / d * dt * 3; cat.position.y = Math.abs(Math.sin(clock.elapsedTime * 14)) * 0.05; }
  };
}
