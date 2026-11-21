// ===================== Квартира 47: на подушке в твоей комнате сидит потёртый плюшевый мишка =====================
if (KV) {
  const fur = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 1 }), light = new THREE.MeshStandardMaterial({ color: 0xc19a6b, roughness: 1 }), dark = new THREE.MeshStandardMaterial({ color: 0x120a06, roughness: 0.5 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), fur); body.scale.set(1, 1.1, 0.9); body.position.y = 0.09; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), light); belly.position.set(0, 0.085, 0.045); belly.scale.set(1, 1.1, 0.5); g.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), fur); head.position.set(0.005, 0.2, 0.01); head.rotation.z = 0.2; g.add(head);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), fur); ear.position.set(s * 0.04, 0.25, 0); g.add(ear); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), dark); eye.position.set(s * 0.02, 0.21, 0.054); g.add(eye); const arm = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), fur); arm.scale.set(0.8, 1.4, 0.8); arm.position.set(s * 0.09, 0.1, 0.02); arm.rotation.z = -s * 0.5; g.add(arm); const leg = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), fur); leg.position.set(s * 0.05, 0.02, 0.06); g.add(leg); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), light); nose.position.set(0.005, 0.195, 0.058); g.add(nose); const nn = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), dark); nn.position.set(0.005, 0.2, 0.07); g.add(nn);
  g.position.set(-2.55, 0.66, 0.85); g.rotation.y = 0.15; scene.add(g);
}
