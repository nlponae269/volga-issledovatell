// ===================== Шаг в лужу: плюх + брызги. Лужи считаются так же, как в шейдере земли (тот же шум), поэтому совпадают с тем, что видно =====================
if (DVOR) {
  const D = TX.noise.image.data, S = 256;
  const nz = (u, v, c) => { u = ((u % 1) + 1) % 1; v = ((v % 1) + 1) % 1; const x = u * S - 0.5, y = v * S - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (a, b) => D[((((b % S) + S) % S) * S + (((a % S) + S) % S)) * 4 + c] / 255; return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy; };
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function puddle(x, z) { const pn = nz(x * 0.021 + 0.3, z * 0.021 + 0.3, 0) * 0.6 + nz(x * 0.067, z * 0.067, 2) * 0.4, damp = ss(0.42, 0.74, nz(x * 0.045 + 0.77, z * 0.045 + 0.77, 1) * 0.65 + nz(x * 0.16, z * 0.16, 0) * 0.35);
    const road = dvRoadD(x, z) < 4.0, walk = !road && dvRoadD(x, z) < 6.3; const v = pn + damp * 0.03; if (road || walk) return ss(0.6, 0.618, v) > 0.5; const bare = 1 - ss(0.52, 0.68, nz(x * 0.031 + 0.13, z * 0.031 + 0.13, 1) * 0.7 + nz(x * 0.11 + 0.71, z * 0.11 + 0.71, 2) * 0.3); return ss(0.628, 0.645, v) * bare * 0.92 > 0.5; }
  window.__puddle = puddle;
  // брызги
  const N = 40, pos = new Float32Array(N * 3).fill(-9999), vel = new Float32Array(N * 3), life = new Float32Array(N), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = texFrom(mkCanvas(16, 16, (c) => { const gr = c.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 16, 16); }));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, map: dot, color: 0xdde6ee, transparent: true, opacity: 0.8, depthWrite: false })); pts.frustumCulled = false; scene.add(pts); let pi = 0;
  const _fs = footstep;
  footstep = function (surf, run) { if (!ALT || true) { if (P.ground && puddle(P.x, P.z)) { splash(run); return; } } _fs(surf, run); };
  function splash(run) { if (AC) { const v = run ? 0.5 : 0.32; burst(0.22, 'bandpass', 900 + Math.random() * 500, 1.3, v * 0.8); burst(0.3, 'lowpass', 700, 0.8, v * 0.7); setTimeout(() => burst(0.12, 'highpass', 3800, 0.6, v * 0.25), 40); }
    for (let k = 0; k < 8; k++) { const i = pi++ % N; pos[i * 3] = P.x + (Math.random() - 0.5) * 0.3; pos[i * 3 + 1] = groundH(P.x, P.z) + 0.04; pos[i * 3 + 2] = P.z + (Math.random() - 0.5) * 0.3; vel[i * 3] = (Math.random() - 0.5) * (run ? 1.6 : 1); vel[i * 3 + 1] = 1.2 + Math.random() * (run ? 1.6 : 1); vel[i * 3 + 2] = (Math.random() - 0.5) * (run ? 1.6 : 1); life[i] = 0.5; } }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); for (let i = 0; i < N; i++) { if (life[i] <= 0) { pos[i * 3 + 1] = -9999; continue; } life[i] -= dt; vel[i * 3 + 1] -= 9 * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt; } g.attributes.position.needsUpdate = true; };
}
