// ===================== ALTERNATIVE: из грязи поднимается бетонная лестница — ступени идут в небо и обрываются =====================
if (ALT) {
  const conc = new THREE.MeshStandardMaterial({ color: 0x8c7f78, roughness: 0.95 }), rail = new THREE.MeshStandardMaterial({ color: 0x2a1a18, roughness: 0.7 });
  const g = new THREE.Group(); const N = 22;
  for (let i = 0; i < N; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.5), conc); s.position.set(0, 0.1 + i * 0.36, -i * 0.5); s.rotation.z = (i % 5 === 3) ? 0.04 : 0; g.add(s); }
  for (const x of [-0.78, 0.78]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, Math.hypot(N * 0.5, N * 0.36)), rail); r.position.set(x, 1.0 + N * 0.18, -N * 0.25); r.rotation.x = Math.atan2(N * 0.36, N * 0.5); g.add(r); for (let i = 0; i < N; i += 3) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), rail); p.position.set(x, 0.55 + i * 0.36, -i * 0.5); g.add(p); } }
  g.position.set(1.5, 0, -17); scene.add(g);
}
