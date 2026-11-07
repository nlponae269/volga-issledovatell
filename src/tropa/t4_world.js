// ===================== ТРОПА: сцена, небо, земля, трава, чанки =====================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 520);
// --- небо: сплошная облачность ---
const skyU = { tN: { value: TX.noise }, uTime: SHARED.uTime, sunDir: { value: new V3(0.35, 0.32, -0.6).normalize() } };
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w*0.99999; }',
  fragmentShader: `varying vec3 vD; uniform sampler2D tN; uniform float uTime; uniform vec3 sunDir;
    void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.0);
      vec2 cp = d.xz / (y + 0.12) * 0.09;
      float c = texture2D(tN, cp + vec2(uTime*0.0012, uTime*0.0005)).r*0.6 + texture2D(tN, cp*2.7 - vec2(uTime*0.002, 0.0)).g*0.4;
      vec3 hor = vec3(0.60, 0.62, 0.64), zen = vec3(0.40, 0.43, 0.47);
      vec3 col = mix(hor, zen, pow(y, 0.6));
      col *= mix(1.08, 0.78, smoothstep(0.35, 0.8, c));
      float s = max(dot(d, sunDir), 0.0); col += vec3(0.20, 0.18, 0.14) * pow(s, 6.0) * 0.6 + vec3(0.25,0.22,0.18)*pow(s, 60.0)*0.5;
      col = mix(col, hor, 1.0 - smoothstep(-0.05, 0.25, d.y));
      gl_FragColor = vec4(col, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
// отражения/рассеянный свет от неба
{ const envScene = new THREE.Scene(); const s2 = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat.clone()); s2.material.uniforms = skyU; envScene.add(s2);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3a3a2c })); gnd.position.y = -2; envScene.add(gnd);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(envScene, 0.02).texture; pm.dispose(); }
const hemi = new THREE.HemisphereLight(0xc4ccd4, 0x4a4434, 0.35); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dc, 1.15);
sun.castShadow = Q.shadows; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 260 }); sun.shadow.camera.updateProjectionMatrix();
scene.add(sun, sun.target);

// --- земля: трава / опавшие листья / тропа / трасса, всё в шейдере по мировым координатам ---
const GS = MOBILE ? 180 : 260, GSEG = MOBILE ? 90 : 130;
const groundMat = std({ map: TX.grass, normalMap: TX.leavesN, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1 });
groundMat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, { tLeaves: { value: TX.leaves }, tSand: { value: TX.sand }, tSandN: { value: TX.sandN }, tAsph: { value: TX.asph }, tNoise: { value: TX.noise } });
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;\n' + GLSL_WORLD)
    .replace('#include <beginnormal_vertex>', `
       vec3 objectNormal = normalize(vec3(h0-groundH(wp0.xz+vec2(0.5,0.0)), 0.5, h0-groundH(wp0.xz+vec2(0.0,0.5))));`)
    .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.x, h0, position.z); vW = vec3(wp0.x, h0, wp0.z);')
    .replace('#include <uv_vertex>', '#include <uv_vertex>\n vec3 wp0 = (modelMatrix*vec4(position,1.0)).xyz; float h0 = groundH(wp0.xz); vMapUv = wp0.xz; vNormalMapUv = wp0.xz/2.0;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
    varying vec3 vW; uniform sampler2D tLeaves, tSand, tSandN, tAsph, tNoise; float gRough = 1.0; float gPath = 0.0;\n` + GLSL_WORLD)
    .replace('#include <map_fragment>', `
      vec2 wp = vW.xz;
      vec4 nA = texture2D(tNoise, wp*0.0105), nB = texture2D(tNoise, wp*0.043+0.31), nC = texture2D(tNoise, wp*0.17+0.77);
      vec3 gr = mix(texture2D(map, wp/1.6).rgb, texture2D(map, wp/5.3+0.37).rgb, 0.45);
      gr *= mix(vec3(1.0), vec3(1.25,1.12,0.8), smoothstep(0.45,0.75,nA.g));      // выгоревшая трава
      vec3 lv = texture2D(tLeaves, wp/2.1).rgb * vec3(1.35,1.3,1.2);
      vec3 dirt = texture2D(tSand, wp/2.7+0.5).rgb * vec3(0.62,0.56,0.5);
      float litter = smoothstep(0.38, 0.72, nA.r*0.65 + nB.g*0.5 - 0.05);
      vec3 col = mix(gr, lv, litter*0.85);
      col = mix(col, dirt, smoothstep(0.63, 0.82, nB.r*0.75 + nC.g*0.4) * 0.75);
      // тропа
      float dz = abs(wp.y - pathC(wp.x));
      float pw = 1.75 + (nB.b - 0.5)*0.9 + (nC.r - 0.5)*0.35;
      float pm = 1.0 - smoothstep(pw - 0.45, pw + 0.3, dz);
      vec3 sd = texture2D(tSand, wp/2.3).rgb * vec3(1.3,1.24,1.15);
      float lp = smoothstep(0.5, 0.85, nC.b*0.65 + nA.a*0.5) * (0.25 + 0.75*smoothstep(0.3, 1.0, dz/pw));
      vec3 pc = mix(sd, lv*0.95, lp*0.8);
      float wet = smoothstep(0.66, 0.78, texture2D(tNoise, wp*0.06+0.5).a) * (1.0 - smoothstep(0.0, pw*0.9, dz)*0.6);
      pc = mix(pc, pc*vec3(0.6,0.56,0.52), wet*0.8);
      col = mix(col, pc, pm); gPath = pm;
      gRough = mix(1.0, mix(0.95, 0.62, wet), pm);
      // трасса и обочины
      float rz = wp.y - (${ROAD_C.toFixed(1)}), ar = abs(rz);
      float sh = 1.0 - smoothstep(${(ROAD_HW + 1.2).toFixed(1)}, ${(ROAD_HW + 2.2).toFixed(1)} + nB.r*0.6, ar);
      vec3 grav = mix(dirt*1.15, vec3(0.42,0.41,0.39), 0.4) * (0.8 + 0.4*nC.r);
      col = mix(col, grav, sh);
      float rm = 1.0 - smoothstep(${ROAD_HW.toFixed(1)} - 0.02, ${ROAD_HW.toFixed(1)} + 0.04, ar);
      vec3 as = texture2D(tAsph, wp/3.2).rgb * mix(0.85, 1.12, nB.g);
      float worn = smoothstep(0.3, 0.7, nC.a);
      float mk = (1.0 - smoothstep(0.06, 0.08, ar)) * step(fract(wp.x/9.0), 0.33);
      mk += (1.0 - smoothstep(0.07, 0.09, abs(ar - (${ROAD_HW.toFixed(1)} - 0.45))));
      as = mix(as, vec3(0.78,0.78,0.74), mk * (0.55 + 0.45*worn));
      float tr = smoothstep(0.5, 0.0, abs(abs(rz) - 2.5) - 0.6) * 0.18;                // накатанные колеи
      as *= 1.0 - tr;
      col = mix(col, as, rm);
      gRough = mix(gRough, 0.82 - tr, rm);
      diffuseColor.rgb *= col;
    `)
    .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = gRough;');
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(GS, GS, GSEG, GSEG).rotateX(-Math.PI / 2), groundMat);
ground.receiveShadow = true; ground.frustumCulled = false; scene.add(ground);

// --- трава: инстансы пучков, бесконечно «перекатываются» вокруг игрока ---
const GRASS_S = MOBILE ? 46 : 72;
const grass = (() => {
  const base = new THREE.BufferGeometry(); const P = [], U = [], I = [];
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, c = Math.cos(a) * 0.38, s = Math.sin(a) * 0.38, o = P.length / 3;
    P.push(-c, 0, -s, c, 0, s, c, 0.62, s, -c, 0.62, -s); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(P.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); g.setIndex(I);
  const N = Q.grass, A = new Float32Array(N * 4), r = rng(7);
  for (let i = 0; i < N; i++) { A[i * 4] = r() * GRASS_S; A[i * 4 + 1] = r() * GRASS_S; A[i * 4 + 2] = r() * 6.283; A[i * 4 + 3] = 0.6 + r() * 0.8; }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(A, 4)); g.instanceCount = N;
  const mat = std({ map: TX.blades, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uC: { value: new V3() }, uS: { value: GRASS_S }, uTime: SHARED.uTime, tNoise: { value: TX.noise } }); mat.userData.sh = sh;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aI; uniform vec3 uC; uniform float uS, uTime; uniform sampler2D tNoise; varying float vTint, vHt;\n' + GLSL_WORLD)
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0,1.0,0.0);')
      .replace('#include <begin_vertex>', `
        vec2 bp = aI.xy + uS*floor((uC.xz - aI.xy)/uS + 0.5);
        vec4 nz = texture2D(tNoise, bp*0.0105);
        float dz = abs(bp.y - pathC(bp.x));
        float pathM = smoothstep(1.3, 2.5 + 0.6*nz.b, dz);
        float roadM = smoothstep(${(ROAD_HW + 0.8).toFixed(1)}, ${(ROAD_HW + 1.8).toFixed(1)}, abs(bp.y - (${ROAD_C.toFixed(1)})));
        float fade = 1.0 - smoothstep(uS*0.3, uS*0.47, length(bp - uC.xz));
        float dens = smoothstep(0.25, 0.6, 1.0 - (nz.r*0.65 + nz.g*0.3));
        float s = aI.w * pathM * roadM * fade * step(0.15, dens + aI.w*0.1) * (0.5 + 0.7*dens);
        float c = cos(aI.z), sn = sin(aI.z);
        vec3 p = position * vec3(1.0, (0.26 + 0.42*nz.a*nz.a) * (0.6 + 0.6*dens), 1.0) * s; p = vec3(c*p.x - sn*p.z, p.y, sn*p.x + c*p.z);
        float w = position.y * (sin(uTime*1.7 + bp.x*0.31 + bp.y*0.17)*0.16 + sin(uTime*4.1 + bp.x*1.9 + bp.y)*0.04);
        p.x += w; p.z += w*0.5;
        vec3 transformed = vec3(bp.x, groundH(bp), bp.y) + p;
        vTint = nz.g; vHt = uv.y;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vTint, vHt;')
      .replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''))
      .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= mix(vec3(0.9,0.95,0.8), vec3(1.25,1.1,0.72), smoothstep(0.4,0.75,vTint)) * mix(0.32, 1.0, vHt);');
  };
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.receiveShadow = true; scene.add(mesh);
  return { mesh, update(p) { if (mat.userData.sh) mat.userData.sh.uniforms.uC.value.copy(p); } };
})();

// ---------------- монеты ----------------
const COIN_TYPES = [{ n: 'Монетка', v: 5 }, { n: 'Горстка монет', v: 50 }, { n: 'Слиток золота', v: 100 }];
const goldMat = std({ color: 0xf2c25a, roughness: 0.22, metalness: 1, envMapIntensity: 1.6 });
const coinMat = std({ color: 0xd9b46a, roughness: 0.3, metalness: 1, envMapIntensity: 1.4 });
const coinGeo = new THREE.LatheGeometry([[0, -0.012], [0.11, -0.012], [0.125, -0.008], [0.125, 0.008], [0.11, 0.012], [0.1, 0.009], [0, 0.009]].map((p) => new THREE.Vector2(p[0], p[1])), 24);
const barGeo = (() => { const s = new THREE.Shape(); s.moveTo(-0.13, 0); s.lineTo(0.13, 0); s.lineTo(0.1, 0.075); s.lineTo(-0.1, 0.075); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.11, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }); g.translate(0, 0.008, -0.055); return g; })();
function coinObj(type, r) {
  const g = new THREE.Group();
  if (type === 0) { const c = new THREE.Mesh(coinGeo, coinMat); c.rotation.x = Math.PI / 2; c.position.y = 0.35; g.add(c); }
  else if (type === 1) { for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(coinGeo, coinMat); const a = r() * 6.28, d = r() * 0.16; c.position.set(Math.cos(a) * d, 0.012 + i * 0.012 * (1 - d * 3), Math.sin(a) * d); c.rotation.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); g.add(c); } }
  else { const b = new THREE.Mesh(barGeo, goldMat); b.rotation.y = r() * 6; g.add(b); }
  g.traverse((o) => { o.castShadow = Q.shadows; }); return g;
}
const taken = new Map(), coinsLive = [], RESPAWN = 90;
function spawnCoins(group, r, x, z, ry, id) {
  const n = 3 + (r() * 4 | 0), c = Math.cos(ry), s = Math.sin(ry);
  for (let i = 0; i < n; i++) { const lx = (r() - 0.5) * 9, lz = 3.6 + r() * 4.0; const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
    const t = r(), type = t < 0.7 ? 0 : t < 0.92 ? 1 : 2; const o = coinObj(type, r); o.position.set(wx, groundH(wx, wz), wz); group.add(o); coinsLive.push({ id: id + ':' + i, obj: o, type, x: wx, z: wz, group }); }
}

// ---------------- чанки ----------------
const CS = 48, chunks = new Map(), colliders = new Map();
function buildChunk(cx, cz) {
  const group = new THREE.Group(), b = new Batch(), r = rng((cx * 73856093) ^ (cz * 19349663) ^ 0x7a11), x0 = cx * CS, z0 = cz * CS, x1 = x0 + CS, z1 = z0 + CS;
  const inst = new Map(), occ = [];
  const free = (x, z, rad) => { if (x < x0 || x >= x1 || z < z0 || z >= z1) return false; if (Math.abs(z - pathC(x)) < 2.6 + rad) return false; if (Math.abs(z - ROAD_C) < ROAD_HW + 2.4 + rad) return false; for (const o of occ) if (Math.hypot(o[0] - x, o[1] - z) < o[2] + rad) return false; return true; };
  const take = (x, z, rad) => occ.push([x, z, rad]);
  const plant = (key, x, z, s = 1) => { if (!free(x, z, PROTO[key].col ? 0.8 : 0.6)) return; take(x, z, PROTO[key].col ? 0.9 : 0.5 * s); const m = new THREE.Matrix4().compose(new V3(x, groundH(x, z) - 0.05, z), new THREE.Quaternion().setFromAxisAngle(UP, r() * 6.283), new V3(s, s * (0.9 + r() * 0.2), s)); (inst.get(key) || inst.set(key, []).get(key)).push(m); if (PROTO[key].col) b.cols.push({ x, z, hx: PROTO[key].col * s, hz: PROTO[key].col * s, c: 1, s: 0 }); };
  const pick = (a) => a[(r() * a.length) | 0];
  const inZ = (a, c) => Math.max(a, z0) < Math.min(c, z1);
  const rx = () => x0 + r() * CS;
  // постройки сначала (резервируют место)
  const near = (zz, cb) => { if (zz >= z0 && zz < z1) cb(zz); };
  // 1) северная сторона тропы: магазины, сараи, дома
  near(13, () => { const roll = cx === 0 ? 0 : ihash(cx, 5, 11); const x = x0 + 24 + (r() - 0.5) * 8, z = pathC(x) + 13 + r() * 3;
    if (roll < 0.34) { shop(b, r, x, z, Math.PI, group); spawnCoins(group, r, x, z, Math.PI, cx + ',n'); take(x, z, 7); }
    else if (roll < 0.58) { shed(b, r, x, z - 3, Math.PI); take(x, z - 3, 12); }
    else { house(b, r, x, z + 3, Math.PI); take(x, z + 3, 7); yardBits(b, r, x + 6, z - 3.5); if (r() < 0.6) { house(b, r, x + 18 * (r() < 0.5 ? -1 : 1), z + 5, Math.PI); take(x - 18, z + 5, 7); } } });
  // 2) между тропой и трассой: навесы
  near(-12, () => { if (ihash(cx, 9) < 0.3) { const x = x0 + 24; shed(b, r, x, -13, 0); take(x, -13, 13); } });
  // 3) за трассой: дома лицом к дороге, гаражи, магазины
  near(-54, () => { const roll = ihash(cx, 3, 7);
    if (roll < 0.28) { const x = x0 + 24; shop(b, r, x, -53, 0, group); spawnCoins(group, r, x, -53, 0, cx + ',s'); take(x, -53, 7); }
    else if (roll < 0.55) { const x = x0 + 14 + r() * 18; garages(b, r, x, -52, 0); take(x, -52, 9); }
    for (let k = 0; k < 2; k++) { const x = x0 + 8 + k * 26 + r() * 6; if (free(x, -58, 6)) { house(b, r, x, -58, 0); take(x, -58, 7); yardBits(b, r, x + 4, -51.5); } } });
  // 4) дальние кварталы
  if (z0 >= 48 || z1 <= -80) for (let k = 0; k < 2; k++) { const x = x0 + 8 + r() * 32, z = z0 + 8 + r() * 32; if (!free(x, z, 7)) continue; const t = r();
    if (t < 0.45) { house(b, r, x, z, (r() * 4 | 0) * Math.PI / 2); take(x, z, 7); } else if (t < 0.6) { garages(b, r, x, z, (r() * 4 | 0) * Math.PI / 2); take(x, z, 9); } else if (t < 0.7) { shop(b, r, x, z, (r() * 4 | 0) * Math.PI / 2, group); spawnCoins(group, r, x, z, 0, cx + ',' + cz); take(x, z, 7); } }
  // столбы с проводами вдоль тропы
  if (inZ(-12, 0)) { let prev = null; for (let x = Math.floor(x0 / 34) * 34 - 34; x < x1 + 34; x += 34) { const z = pathC(x) - 5.5; if (x >= x0 && x < x1) { pole(b, rng(x * 7 + 3), x, z); take(x, z, 0.6); }
      if (prev && (prev[0] >= x0 && prev[0] < x1)) { const ya = groundH(prev[0], prev[1]), yb = groundH(x, z); for (const [dz, h] of [[-0.7, 8.93], [0.7, 8.93], [0, 9.32]]) wire(b, prev[0], x, ya + h, yb + h, prev[1] + dz, z + dz, 0.85); } prev = [x, z]; } }
  // фонари, ограждения трассы, столбики
  if (inZ(-29, -27)) { for (let x = Math.ceil(x0 / 42) * 42; x < x1; x += 42) lamp(b, x, -28.0, -1); roadFence(b, x0, x1, -28.6); for (let x = Math.ceil(x0 / 21) * 21 + 7; x < x1; x += 63) striped(b, x, -27.4); }
  if (inZ(-43, -41)) { for (let x = Math.ceil(x0 / 42) * 42 + 21; x < x1; x += 42) lamp(b, x, -42.0, 1); roadFence(b, x0, x1, -41.4); }
  // ряды тополей (вдоль трассы — как на фото), кусты
  if (inZ(-27, -14)) { const rowZ = -21 + Math.sin(cx * 1.7) * 2; let x = x0 + r() * 4; const dense = ihash(cx, 21) < 0.7;
    while (x < x1) { if (dense || r() < 0.4) plant(pick(['poplar0', 'poplar1', 'poplar2']), x, rowZ + (r() - 0.5) * 1.2, 0.85 + r() * 0.35); x += 4.5 + r() * (dense ? 3 : 12); } }
  for (let i = 0; i < 26; i++) { const x = rx(), z = z0 + r() * CS; const zz = z - pathC(x);
    const bandMid = z > -26 && z < -3, nearN = zz > 3 && zz < 40, south = z < -44;
    const p = r();
    if (bandMid) { if (p < 0.45) plant(pick(['shrubY0', 'shrubY1', 'shrubG0', 'shrubG1']), x, z, 0.8 + r() * 0.5); else if (p < 0.65) plant(pick(['sticks0', 'sticks1']), x, z, 0.8 + r() * 0.6); else if (p < 0.78) plant(pick(['elm0', 'elm1', 'elm2']), x, z, 0.75 + r() * 0.4); }
    else if (nearN || south) { if (p < 0.3) plant(pick(['shrubY0', 'shrubY1', 'shrubG0', 'shrubG1']), x, z, 0.8 + r() * 0.5); else if (p < 0.45) plant(pick(['elm0', 'elm1', 'elm2']), x, z, 0.8 + r() * 0.5); else if (p < 0.55) plant(pick(['poplar0', 'poplar1', 'poplar2']), x, z, 0.85 + r() * 0.3); else if (p < 0.65) plant(pick(['sticks0', 'sticks1']), x, z, 1); }
    else if (p < 0.35) plant(pick(['elm0', 'elm1', 'elm2', 'poplar0', 'shrubY0', 'shrubG0', 'sticks0']), x, z, 0.8 + r() * 0.5);
  }
  // кустики-прутняки у самой тропы (как на 3-м фото)
  for (let i = 0; i < 3; i++) { const x = rx(), z = pathC(x) + (r() < 0.5 ? -1 : 1) * (3.2 + r() * 2.5); if (z >= z0 && z < z1 && r() < 0.5) plant(pick(['sticks0', 'sticks1']), x, z, 0.7 + r() * 0.4); }
  // пни, камни, кирпичи
  for (let i = 0; i < 5; i++) { const x = rx(), z = z0 + r() * CS; if (!free(x, z, 0.5)) continue; const y = groundH(x, z); const t = r();
    if (t < 0.3) b.cyl(M.bark, x, y + 0.15, z, 0.3, 0.26, 0.4, 10, [0.7, 0.62, 0.55]); else if (t < 0.6) b.geo(M.conc, new THREE.DodecahedronGeometry(0.25 + r() * 0.3, 0), x, y + 0.1, z, r(), r(), r(), 1, shade(1.0, [1.02, 0.97, 0.88])); else b.box(M.brick, x, y + 0.04, z, 0.25, 0.07, 0.12, shade(0.95), 0, r() * 3, 0.1); }
  b.build(group);
  for (const [key, ms] of inst) for (const [mat, geo] of PROTO[key].parts) { const im = new THREE.InstancedMesh(geo, mat, ms.length); ms.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = Q.shadows; im.receiveShadow = true; im.computeBoundingSphere(); group.add(im); }
  scene.add(group);
  return { group, cols: b.cols };
}
let chunkQueue = [];
function updateChunks(px, pz, force) {
  const ccx = Math.floor(px / CS), ccz = Math.floor(pz / CS), want = new Set(), R = Q.R; chunkQueue = [];
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const k = (ccx + dx) + ',' + (ccz + dz); want.add(k); if (!chunks.has(k)) chunkQueue.push([ccx + dx, ccz + dz, dx * dx + dz * dz]); }
  chunkQueue.sort((a, b) => a[2] - b[2]);
  const n = force ? chunkQueue.length : 1;
  for (let i = 0; i < n && chunkQueue.length; i++) { const [x, z] = chunkQueue.shift(); const c = buildChunk(x, z); chunks.set(x + ',' + z, c); colliders.set(x + ',' + z, c.cols); }
  for (const [k, c] of chunks) if (!want.has(k)) {
    scene.remove(c.group); c.group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry && o.geometry !== coinGeo && o.geometry !== barGeo) o.geometry.dispose(); });
    for (let i = coinsLive.length - 1; i >= 0; i--) if (coinsLive[i].group === c.group) coinsLive.splice(i, 1);
    chunks.delete(k); colliders.delete(k);
  }
}
