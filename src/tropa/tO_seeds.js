// ===================== Дворы: у лавочек валяется шелуха от семечек =====================
if (DVOR && !ALT && !MOBILE) {
  const prevOB = OUT_BUILD;
  const geo = new THREE.BoxGeometry(0.03, 0.006, 0.016), mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  OUT_BUILD = (cx, cz) => { const n0 = window.__benches.length, res = prevOB(cx, cz), r = rng((cx * 31337) ^ (cz * 7919) ^ 0x5eed);
    for (let i = n0; i < window.__benches.length; i++) { const bn = window.__benches[i]; if (bn.g !== res.group || r() > 0.7) continue;
      const N = 70, im = new THREE.InstancedMesh(geo, mat, N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), cs = Math.cos(bn.ry), sn = Math.sin(bn.ry);
      for (let k = 0; k < N; k++) { const lx = (r() - 0.5) * 1.9, lz = 0.25 + Math.abs(r() + r() - 1) * 0.7, px = bn.x + lx * cs - lz * sn, pz = bn.z - lx * sn - lz * cs; e.set(0, r() * 6.28, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(px, 0.008, pz), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(k, m); im.setColorAt(k, c.setHex(r() < 0.6 ? 0x2b2926 : 0xd9d3c3)); }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; res.group.add(im); }
    return res; };
}
