// ===================== ТРОПА: машины, постобработка, игрок, звук, цикл =====================
// ---------------- машины ----------------
const LANE_Z = [-37.5, -32.5]; // 0 → едет в −X, 1 → в +X
const ROAD_Y = 0.28;
const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff2d8, emissiveIntensity: 6 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1a0a, emissiveIntensity: 2.5 });
const truckSide = texFrom(mkCanvas(1024, 256, (g, w, h) => {
  g.fillStyle = '#d4d6d3'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 18) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, 0, 2, h); }
  g.fillStyle = '#3f9a52'; g.fillRect(w * 0.62, 10, w * 0.36, h - 20);
  g.strokeStyle = '#3f9a52'; g.lineWidth = 16; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * 0.32, h / 2, 30 + i * 22, 0, 6.28); g.stroke(); }
  g.fillStyle = '#fff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText('ГРУЗ', w * 0.8, h / 2 + 18);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,50,40,0.3)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
function extrude(pts, depth, bevel) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: !!bevel, bevelSize: bevel || 0, bevelThickness: bevel || 0, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -depth / 2); return g; }
const CAR_PAINT = [0xd8d8d4, 0xb0b4b8, 0x1d1f22, 0x1d2c4a, 0x6a1518, 0x2c4a36, 0x8a8f86, 0xc9c2a8];
const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 18).rotateX(Math.PI / 2), rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 12).rotateX(Math.PI / 2);
const rimMat = std({ color: 0x9a9da0, metalness: 0.9, roughness: 0.35 });
function makeCar() {
  const g = new THREE.Group(), paint = std({ color: CAR_PAINT[(Math.random() * CAR_PAINT.length) | 0], roughness: 0.28, metalness: 0.55, envMapIntensity: 1.3 });
  const body = new THREE.Mesh(extrude([[-2.2, 0.3], [-2.24, 0.72], [-1.98, 0.9], [-1.1, 0.96], [1.0, 0.96], [2.05, 0.82], [2.26, 0.62], [2.22, 0.3]], 1.66, 0.06), paint);
  const glass = new THREE.Mesh(extrude([[-1.18, 0.95], [-0.74, 1.37], [0.44, 1.39], [1.06, 0.95]], 1.56), M.glass);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 1.5), paint); roof.position.set(-0.15, 1.39, 0);
  const pil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 1.58), paint); pil.position.set(-0.12, 1.17, 0);
  g.add(body, glass, roof, pil);
  for (const sx of [-1.35, 1.35]) for (const sz of [-0.78, 0.78]) { const w = new THREE.Mesh(wheelGeo, M.rubber); w.position.set(sx, 0.32, sz); const rm = new THREE.Mesh(rimGeo, rimMat); w.add(rm); g.add(w); }
  for (const sz of [-0.6, 0.6]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.32), lightMat); h.position.set(2.24, 0.68, sz); const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.3), tailMat); t.position.set(-2.25, 0.74, sz); g.add(h, t); }
  g.traverse((o) => { o.castShadow = Q.shadows; }); return { g, len: 4.6, wheels: g.children.filter((c) => c.geometry === wheelGeo) };
}
function makeTruck() {
  const g = new THREE.Group(), cabC = std({ color: [0xe8e8e4, 0x2b4a7a, 0x9a1f1a][(Math.random() * 3) | 0], roughness: 0.3, metalness: 0.5 });
  const cab = new THREE.Mesh(extrude([[0, 0.9], [0, 3.3], [1.9, 3.3], [2.25, 2.6], [2.3, 0.9]], 2.45, 0.05), cabC); cab.position.x = 5.6;
  const ws = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 2.2), M.glass); ws.position.set(5.6 + 2.29, 2.3, 0); ws.rotation.z = 0.13;
  const grill = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 1.6), M.rubber); grill.position.set(5.6 + 2.33, 1.4, 0);
  const trailerM = [std({ color: 0xcfd1ce, roughness: 0.6 }), std({ color: 0xcfd1ce, roughness: 0.6 }), std({ color: 0xc8cac7, roughness: 0.6 }), std({ color: 0x777, roughness: 0.8 }), std({ map: truckSide, roughness: 0.6 }), std({ map: truckSide, roughness: 0.6 })];
  const tr = new THREE.Mesh(new THREE.BoxGeometry(13.4, 2.85, 2.5).rotateY(Math.PI / 2), trailerM); tr.rotation.y = -Math.PI / 2; tr.position.set(-1.5, 2.45, 0);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(19, 0.35, 1.1), M.rubber); ch.position.set(-0.6, 0.85, 0);
  g.add(cab, ws, grill, tr, ch);
  for (const sx of [6.6, 4.6, -5.8, -7.1, -8.4]) for (const sz of [-0.95, 0.95]) { const w = new THREE.Mesh(wheelGeo, M.rubber); w.scale.set(1.5, 1.5, 1.3); w.position.set(sx, 0.48, sz); w.add(new THREE.Mesh(rimGeo, rimMat)); g.add(w); }
  for (const sz of [-0.95, 0.95]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.36), lightMat); h.position.set(5.6 + 2.33, 0.95, sz); const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.4), tailMat); t.position.set(-8.25, 1.0, sz); g.add(h, t); }
  g.traverse((o) => { o.castShadow = Q.shadows; }); return { g, len: 16.5, wheels: g.children.filter((c) => c.geometry === wheelGeo) };
}
const cars = [];
for (let i = 0; i < (ROADW ? 9 : 0); i++) { const c = i % 3 === 0 ? makeTruck() : makeCar(); scene.add(c.g); cars.push(Object.assign(c, { lane: i % 2, x: (Math.random() - 0.5) * 400, v: 15 + Math.random() * 9, snd: null })); }
function updateCars(dt, px) {
  for (const c of cars) {
    const dir = c.lane === 0 ? -1 : 1; c.x += dir * c.v * dt;
    if (dir * (c.x - px) > 230) { c.x = px - dir * (190 + Math.random() * 80); c.v = 15 + Math.random() * 9; }
    c.g.position.set(c.x, ROAD_Y, LANE_Z[c.lane]); c.g.rotation.y = dir > 0 ? 0 : Math.PI;
    for (const w of c.wheels) w.rotation.z -= c.v * dt / 0.32;
  }
}

// ---------------- постобработка: AO, объёмный туман, свечение, плёнка ----------------
const post = (() => {
  const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  const BLOOM_IT = MOBILE ? 3 : 4, BLOOM_K = DARK ? 0.48 : 0.38;
  const HF = THREE.HalfFloatType;
  const main = new THREE.WebGLRenderTarget(4, 4, { type: HF, samples: Q.msaa, depthTexture: new THREE.DepthTexture(4, 4) });
  const bA = new THREE.WebGLRenderTarget(4, 4, { type: HF }), bB = new THREE.WebGLRenderTarget(4, 4, { type: HF });
  const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), qg = new THREE.PlaneGeometry(2, 2);
  const reflCam = new THREE.PerspectiveCamera(); if (REFL.use) { REFL.rt = new THREE.WebGLRenderTarget(4, 4, { type: HF, depthBuffer: true }); REFL.tex.value = REFL.rt.texture; REFL.on.value = 1; }
  const mk = (fs, u) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false }); const sc = new THREE.Scene(); const me = new THREE.Mesh(qg, m); me.frustumCulled = false; sc.add(me); return { m, sc }; };
  const bright = mk(`varying vec2 vUv; uniform sampler2D t; void main(){ vec3 c=texture2D(t,vUv).rgb; float l=dot(c,vec3(0.2126,0.7152,0.0722)); gl_FragColor=vec4(min(c, vec3(40.0))*smoothstep(0.9,2.5,l),1.0); }`, { t: { value: main.texture } });
  const blurFS = `varying vec2 vUv; uniform sampler2D t; uniform vec2 dir; void main(){ vec3 c=texture2D(t,vUv).rgb*0.227; c+=(texture2D(t,vUv+dir*1.385).rgb+texture2D(t,vUv-dir*1.385).rgb)*0.316; c+=(texture2D(t,vUv+dir*3.231).rgb+texture2D(t,vUv-dir*3.231).rgb)*0.07; gl_FragColor=vec4(c,1.0); }`;
  const blurH = mk(blurFS, { t: { value: bA.texture }, dir: { value: new THREE.Vector2() } });
  const blurV = mk(blurFS, { t: { value: bB.texture }, dir: { value: new THREE.Vector2() } });
  const U = { tC: { value: main.texture }, tD: { value: main.depthTexture }, tB: { value: bA.texture }, tN: { value: TX.noise }, res: { value: new THREE.Vector2(4, 4) },
    nearF: { value: camera.near }, farF: { value: camera.far }, time: { value: 0 }, expo: { value: 1.0 }, aoOn: { value: Q.ssao ? 1 : 0 }, dens: { value: KV ? 0.005 : HOUSE ? 0.03 : PODEZD ? 0.022 : METRO ? 0.012 : GRID ? 0.024 : NIGHT ? 0.03 : STROY ? 0.03 : DVOR ? 0.008 : SNOW ? 0.05 : BEACH ? 0.026 : 0.042 }, flash: { value: 0 }, dark: { value: 0 },
    invProj: { value: new THREE.Matrix4() }, camW: { value: new THREE.Matrix4() }, camPos: { value: new V3() }, sunDir: skyU.sunDir };
  const comp = mk(`varying vec2 vUv; uniform sampler2D tC,tD,tB,tN; uniform vec2 res; uniform float nearF,farF,time,expo,dens,flash,dark,aoOn; uniform mat4 invProj,camW; uniform vec3 camPos,sunDir;
    float lz(float d){ float z=d*2.0-1.0; return 2.0*nearF*farF/(farF+nearF-z*(farF-nearF)); }
    float h12(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
    float fogD(vec3 p){
      float n = texture2D(tN, p.xz*0.011 + vec2(time*0.0045, time*0.0018)).r*0.6 + texture2D(tN, p.xz*0.041 + vec2(p.y*0.03 - time*0.011, time*0.004)).g*0.4;
      float h = max(p.y, 0.0);
      return dens * exp(-h*0.07) * (0.35 + 1.3*n*n) + 0.0018;
    }
    void main(){
      vec2 uv=vUv, dc=uv-0.5;
      vec3 col=texture2D(tC,uv).rgb;
      ${!MOBILE ? 'vec2 ca = dc * dot(dc, dc) * 0.012; col.r = texture2D(tC, uv + ca).r; col.b = texture2D(tC, uv - ca).b;' : ''}
      float rd=texture2D(tD,uv).x; bool isSky = rd > 0.99999;
      ${!MOBILE ? `if(!isSky && aoOn > 0.5){ float d0=lz(rd); float ao=0.0, rn=h12(uv*res+time)*6.283, sc=clamp(22.0/d0,0.35,3.0);
        for(int i=0;i<10;i++){ float fi=float(i); float a=rn+fi*2.39996; vec2 o=vec2(cos(a),sin(a))*(3.0+fi*2.2)*sc/res;
          float d=lz(texture2D(tD,uv+o).x); float df=d0-d; ao+=smoothstep(0.02,0.5+d0*0.02,df)*(1.0-smoothstep(1.2,3.5+d0*0.05,df)); }
        col*=1.0-0.6*ao/10.0; }` : ''}
      // объёмный туман: марш по лучу через шумовую плотность
      vec4 cp = vec4(uv*2.0-1.0, (isSky ? 0.9999 : rd)*2.0-1.0, 1.0); vec4 vp = invProj*cp; vp/=vp.w; vec3 wp=(camW*vp).xyz;
      vec3 rdir = normalize(wp-camPos); float dist = isSky ? 420.0 : length(wp-camPos);
      float L = min(dist, 150.0), j = h12(uv*res + fract(time*7.0)*31.0);
      const int NS = ${Q.fogSteps}; float od = 0.0; float st = L/float(NS);
      for(int i=0;i<NS;i++){ float t=(float(i)+j)*st; od += fogD(camPos + rdir*t)*st; }
      if(dist>L){ vec3 pe = camPos + rdir*L; float hy = max(pe.y,0.0); float far = dist-L; float k=0.07*max(rdir.y,0.0005);
        od += (dens*0.75*exp(-hy*0.07)*(1.0-exp(-k*far))/k) + 0.0018*far; }
      float T = exp(-od);
      float sf = max(dot(rdir, sunDir), 0.0);
      vec3 fogC = vec3(0.56,0.585,0.61) + vec3(0.17,0.14,0.10)*pow(sf, 5.0) + vec3(-0.03,-0.02,0.0)*(1.0-smoothstep(-0.1,0.3,rdir.y));
      ${DVOR ? 'fogC = vec3(0.74,0.75,0.76) + vec3(-0.04,-0.035,-0.025)*(1.0-smoothstep(-0.1,0.3,rdir.y));' : ''}
      ${INDOOR ? 'if(!isSky) fogC = vec3(0.012,0.0115,0.011);' : ''}${NIGHT ? 'fogC = vec3(0.022,0.026,0.038);' : ''}${ZIMA ? 'fogC = vec3(0.62,0.13,0.42)*(isSky ? 1.0 : 0.85);' : ''}
      col = col*T + fogC*(1.0-T);
      col += texture2D(tB,uv).rgb*${BLOOM_K.toFixed(2)}*(0.5+0.5*T);
      col = aces(col*expo);
      float Lm=dot(col,vec3(0.2126,0.7152,0.0722));
      col=mix(vec3(Lm),col,0.82);
      col+=vec3(-0.01,0.0,0.018)*(1.0-Lm)+vec3(0.018,0.01,-0.012)*Lm;
      col=pow(max(col,0.0),vec3(1.0/2.2));
      col*=mix(0.5,1.0,smoothstep(1.0,0.3,length(dc*vec2(1.2,1.0))));
      col+=(h12(uv*res+fract(time*13.0)*91.0)-0.5)*0.04;
      col=mix(col, vec3(1.0), flash); col*=1.0-dark;
      gl_FragColor=vec4(col,1.0);
    }`, U);
  return {
    U,
    resize(W, H) { const pr = renderer.getPixelRatio(), w = Math.floor(W * pr), h = Math.floor(H * pr); main.setSize(w, h); main.depthTexture.image.width = w; main.depthTexture.image.height = h;
      const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2); bA.setSize(bw, bh); bB.setSize(bw, bh); blurH.m.uniforms.dir.value.set(1 / bw, 0); blurV.m.uniforms.dir.value.set(0, 1 / bh); U.res.value.set(w, h); if (REFL.rt) { const k = MOBILE ? 3 : 2; REFL.rt.setSize(Math.max(1, Math.floor(w / k)), Math.max(1, Math.floor(h / k))); REFL.res.value.set(w, h); } },
    render(t) {
      U.time.value = t; U.invProj.value.copy(camera.projectionMatrixInverse); U.camW.value.copy(camera.matrixWorld); U.camPos.value.copy(camera.position);
      if (REFL.rt && REFL.on.value > 0 && (!MOBILE || (REFL.flip = !REFL.flip))) {
        reflCam.fov = camera.fov; reflCam.aspect = camera.aspect; reflCam.near = camera.near; reflCam.far = camera.far; reflCam.updateProjectionMatrix();
        reflCam.position.set(camera.position.x, 2 * GROUND_Y - camera.position.y, camera.position.z); reflCam.rotation.set(-camera.rotation.x, camera.rotation.y, -camera.rotation.z, 'YXZ'); reflCam.updateMatrixWorld();
        ground.visible = false; grass.mesh.visible = false; for (const o of REFL.hide) o.visible = false;
        renderer.setRenderTarget(REFL.rt); renderer.render(scene, reflCam);
        ground.visible = true; grass.mesh.visible = true; for (const o of REFL.hide) o.visible = true; }
      renderer.setRenderTarget(main); renderer.render(scene, camera);
      renderer.setRenderTarget(bA); renderer.render(bright.sc, qc);
      for (let i = 0; i < BLOOM_IT; i++) { const k = 1 + i * 1.6; blurH.m.uniforms.dir.value.set(k / bA.width, 0); blurV.m.uniforms.dir.value.set(0, k / bA.height); renderer.setRenderTarget(bB); renderer.render(blurH.sc, qc); renderer.setRenderTarget(bA); renderer.render(blurV.sc, qc); }
      renderer.setRenderTarget(null); renderer.render(comp.sc, qc);
    },
  };
})();

// ---------------- игрок ----------------
const P = { x: 0, y: 0, z: 0, vy: 0, yaw: -Math.PI / 2 + 0.2, pitch: -0.03, ground: true, speed: 0 };
const keys = {}; let running = false, dead = 0, started = false;
addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space') { e.preventDefault(); if (P.ground && started) P.vy = 4.2; } });
addEventListener('keyup', (e) => { keys[e.code] = false; });
renderer.domElement.addEventListener('click', () => { if (!MOBILE && started) renderer.domElement.requestPointerLock(); });
addEventListener('mousemove', (e) => { if (document.pointerLockElement) { P.yaw -= e.movementX * 0.0021; P.pitch = clamp(P.pitch - e.movementY * 0.0021, -1.45, 1.45); } });
const joy = { x: 0, y: 0, id: null }, look = { id: null };
if (MOBILE) {
  $('touch').style.display = 'block'; const jb = $('joy'), kn = $('knob');
  addEventListener('touchstart', (e) => { if (!started) return; for (const t of e.changedTouches) { if (t.target.classList && t.target.classList.contains('tb')) continue;
    if (t.clientX < innerWidth / 2 && joy.id === null) { joy.id = t.identifier; joy.cx = t.clientX; joy.cy = t.clientY; jb.style.left = (t.clientX - 60) + 'px'; jb.style.top = (t.clientY - 60) + 'px'; jb.style.bottom = 'auto'; }
    else if (look.id === null) { look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY; } } }, { passive: true });
  addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { let dx = t.clientX - joy.cx, dy = t.clientY - joy.cy; const l = Math.hypot(dx, dy); if (l > 50) { dx *= 50 / l; dy *= 50 / l; } joy.x = dx / 50; joy.y = dy / 50; kn.style.left = (40 + dx) + 'px'; kn.style.top = (40 + dy) + 'px'; }
    else if (t.identifier === look.id) { P.yaw -= (t.clientX - look.lx) * 0.005; P.pitch = clamp(P.pitch - (t.clientY - look.ly) * 0.005, -1.4, 1.4); look.lx = t.clientX; look.ly = t.clientY; } } }, { passive: true });
  addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; kn.style.left = kn.style.top = '40px'; } if (t.identifier === look.id) look.id = null; } });
  $('tRun').addEventListener('touchstart', () => { running = !running; $('tRun').style.background = running ? '#c9a43a88' : '#0005'; });
  $('tJump').addEventListener('touchstart', () => { if (P.ground) P.vy = 4.2; });
}
function collide(nx, nz) {
  const pr = 0.32;
  for (const list of colliders.values()) for (const c of list) {
    if (c.off) continue;
    const dx = nx - c.x, dz = nz - c.z, rr = c.hx + c.hz + 1; if (dx > rr || dx < -rr || dz > rr || dz < -rr) continue;
    let lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c; const ex = c.hx + pr - Math.abs(lx), ez = c.hz + pr - Math.abs(lz);
    if (ex > 0 && ez > 0) { if (ex < ez) lx += Math.sign(lx || 1) * ex; else lz += Math.sign(lz || 1) * ez; nx = c.x + lx * c.c + lz * c.s; nz = c.z - lx * c.s + lz * c.c; }
  }
  if (GARDEN) nz = clamp(nz, -FENCE + 0.45, FENCE - 0.45);
  return [nx, nz];
}
function surfaceAt(x, z) { if (INDOOR || TRAIN || STROY) return 'lino'; if (DVOR) return dvRoadD(x, z) < 6.4 || dvDriveD(x, z) < 0.01 ? 'asph' : 'grass'; if (SNOW) return 'snow'; if (BEACH && z < 30) return 'sand'; if (bedM(x, z)) return 'sand'; if (Math.abs(z - ROAD_C) < ROAD_HW) return 'asph'; if (Math.abs(z - pathC(x)) < 1.9) return 'sand'; if (Math.abs(z - ROAD_C) < ROAD_HW + 2) return 'grav'; return 'grass'; }

// ---------------- звук ----------------
let AC = null, master, windG, rustleG, humG, humF;
function noiseBuf(sec, brown) { const b = AC.createBuffer(1, AC.sampleRate * sec, AC.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w; } return b; }
function loopSrc(buf, rate = 1) { const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.start(0, Math.random() * buf.duration); return s; }
function initAudio() {
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
  const brown = noiseBuf(6, true), white = noiseBuf(4, false); AC._white = white; AC._brown = brown;
  // ветер
  const wf = AC.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 380; wf.Q.value = 0.5; windG = AC.createGain(); windG.gain.value = 0.3; loopSrc(brown).connect(wf).connect(windG).connect(master);
  // шелест листвы
  const rf = AC.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 3200; rustleG = AC.createGain(); rustleG.gain.value = 0.0; loopSrc(white).connect(rf).connect(rustleG).connect(master);
  // далёкий гул трассы
  humF = AC.createBiquadFilter(); humF.type = 'lowpass'; humF.frequency.value = 220; humG = AC.createGain(); humG.gain.value = 0.2; loopSrc(brown, 0.7).connect(humF).connect(humG).connect(master);
  // каждая машина — свой источник с панорамой и эффектом Доплера
  for (const c of cars) { const s = loopSrc(brown, 1), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = AC.createGain(); g.gain.value = 0; const pn = AC.createPanner(); pn.panningModel = 'equalpower'; pn.distanceModel = 'inverse'; pn.refDistance = 6; pn.rolloffFactor = 1.3;
    const tyre = loopSrc(white, 1), tf = AC.createBiquadFilter(); tf.type = 'bandpass'; tf.frequency.value = 1100; tf.Q.value = 0.6; const tg = AC.createGain(); tg.gain.value = 0.25;
    s.connect(f).connect(g); tyre.connect(tf).connect(tg).connect(g); g.connect(pn).connect(master); c.snd = { s, tyre, g, pn, f }; }
}
function blip(freqs, dur, type = 'sine', vol = 0.12) { if (!AC) return; freqs.forEach((fq, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = fq; const t = AC.currentTime + i * 0.07; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); }); }
function burst(dur, ftype, freq, q, vol, pan = 0) { if (!AC) return; const s = AC.createBufferSource(); s.buffer = AC._white; const f = AC.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q; const g = AC.createGain(); const t = AC.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); const p = AC.createStereoPanner ? AC.createStereoPanner() : null; if (p) p.pan.value = pan; s.connect(f).connect(g); (p ? g.connect(p) : g).connect(master); if (p) p.connect(master); s.start(t, Math.random() * 3, dur + 0.05); }
function footstep(surf, run) { const v = run ? 0.5 : 0.32; if (surf === 'grass') { burst(0.16, 'bandpass', 2600 + Math.random() * 900, 0.7, v * 0.55); burst(0.09, 'highpass', 5000, 0.5, v * 0.3); } else if (surf === 'sand') { burst(0.13, 'bandpass', 1100 + Math.random() * 400, 0.9, v * 0.7); burst(0.07, 'highpass', 3500, 0.5, v * 0.2); } else if (surf === 'snow') { burst(0.16, 'lowpass', 1500 + Math.random() * 500, 0.8, v * 0.9); burst(0.1, 'bandpass', 3500, 1.5, v * 0.15); } else if (surf === 'grav') burst(0.12, 'bandpass', 1800, 0.6, v * 0.8); else burst(0.07, 'bandpass', 900, 1.4, v * 0.9); }
function crow() { if (!AC) return; const pan = Math.random() * 2 - 1, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) { const t = AC.currentTime + i * 0.42, o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(560, t); o.frequency.exponentialRampToValueAtTime(340, t + 0.3); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2.5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32); const p = AC.createStereoPanner(); p.pan.value = pan; o.connect(f).connect(g).connect(p).connect(master); o.start(t); o.stop(t + 0.4); } }
function creak() { if (!AC) return; const t = AC.currentTime, pan = Math.random() * 2 - 1, p = AC.createStereoPanner(); p.pan.value = pan; p.connect(master);
  const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(); o.type = 'sawtooth'; const f0 = 140 + Math.random() * 80; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 0.62, t + 1.6); o.frequency.linearRampToValueAtTime(f0 * 0.8, t + 2.2);
  lfo.frequency.value = 23 + Math.random() * 10; lg.gain.value = 12; lfo.connect(lg).connect(o.frequency); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 4;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.022, t + 0.3); g.gain.linearRampToValueAtTime(0.016, t + 1.8); g.gain.linearRampToValueAtTime(0, t + 2.3);
  o.connect(f).connect(g).connect(p); o.start(t); lfo.start(t); o.stop(t + 2.4); lfo.stop(t + 2.4);
  setTimeout(() => burst(0.25, 'lowpass', 400, 0.7, 0.06, pan), 2350); }
function horn() { blip([350, 440], 1.1, 'sawtooth', 0.09); }
function crash() { if (!AC) return; burst(0.8, 'lowpass', 1500, 0.5, 1.2); burst(0.4, 'bandpass', 3000, 0.4, 0.8); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 6100; const t = AC.currentTime; g.gain.setValueAtTime(0.05, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0005, t + 3.5); o.connect(g).connect(master); o.start(t); o.stop(t + 3.6); }
function updateAudio(dt, gust) {
  if (!AC) return;
  const L = AC.listener, fw = new V3(0, 0, -1).applyQuaternion(camera.quaternion), up = new V3(0, 1, 0).applyQuaternion(camera.quaternion);
  if (L.positionX) { L.positionX.value = P.x; L.positionY.value = camera.position.y; L.positionZ.value = P.z; L.forwardX.value = fw.x; L.forwardY.value = fw.y; L.forwardZ.value = fw.z; L.upX.value = up.x; L.upY.value = up.y; L.upZ.value = up.z; }
  else { L.setPosition(P.x, camera.position.y, P.z); L.setOrientation(fw.x, fw.y, fw.z, up.x, up.y, up.z); }
  windG.gain.value = (0.18 + gust * 0.32) * (INDOOR ? 0.25 : ZIMA ? 1.8 : DVOR ? 0.6 : 1); rustleG.gain.value = INDOOR ? 0 : 0.004 + gust * 0.02;
  const rd = Math.abs(P.z - ROAD_C); humG.gain.value = !ROADW ? 0.025 : 0.06 + 0.25 * Math.exp(-rd / 40); humF.frequency.value = 140 + 300 * Math.exp(-rd / 30);
  for (const c of cars) { const s = c.snd; if (!s) continue; const dir = c.lane === 0 ? -1 : 1, cz = LANE_Z[c.lane];
    const dx = P.x - c.x, dz = P.z - cz, d = Math.hypot(dx, dz) || 1, vr = dir * c.v * dx / d; const dop = clamp(343 / (343 - vr), 0.7, 1.4);
    s.s.playbackRate.value = (c.len > 10 ? 0.55 : 0.85) * dop; s.tyre.playbackRate.value = dop; s.f.frequency.value = 500 + 2500 * Math.exp(-d / 25);
    s.g.gain.value = c.len > 10 ? 2.2 : 1.4; if (s.pn.positionX) { s.pn.positionX.value = c.x; s.pn.positionY.value = 0.6; s.pn.positionZ.value = cz; } else s.pn.setPosition(c.x, 0.6, cz); }
}

// ---------------- HUD / смерть ----------------
let money = 0; try { money = +localStorage.getItem('tropa_money') || 0; } catch (e) {}
const coinsEl = $('coins'); if (coinsEl) coinsEl.textContent = money;
const FR = { apple: 0, pear: 0, plum: 0, rasp: 0 }; try { Object.assign(FR, JSON.parse(localStorage.getItem('vorota_fruit') || '{}')); } catch (e) {}
function showFruit() { for (const k in FR) { const el = $('f_' + k); if (el) el.textContent = FR[k]; } }
showFruit();
let toastT = 0; function toast(t) { $('toast').innerHTML = t; $('toast').style.opacity = 1; toastT = 1.8; }
function save() { try { localStorage.setItem('tropa_money', money); } catch (e) {} }
let hitCar = null, flash = 0;
function onRoad(z) { return z > ROAD_C - ROAD_HW + 0.2 && z < ROAD_C + ROAD_HW - 0.2; }
function killCheck() {
  if (dead || !ROADW || BUS) return;
  if (onRoad(P.z)) {
    if (!hitCar) { const lane = P.z < ROAD_C ? 0 : 1, c = cars.filter((q) => q.lane === lane).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0]; const dir = lane === 0 ? -1 : 1; c.x = P.x - dir * 45; c.v = 30; hitCar = c; horn(); }
    const c = hitCar; if (Math.abs(c.x - P.x) < c.len / 2 + 1.0 && Math.abs(LANE_Z[c.lane] - P.z) < 3) die();
  } else hitCar = null;
}
function die() { dead = 3.2; flash = 1; crash(); const f = $('fade'); f.style.transition = 'opacity 0.6s'; f.style.opacity = 1; f.innerHTML = 'Тебя сбила машина.<br><span style="font-size:15px;color:#bbb">Всё сначала.</span>'; }

// ---------------- цикл ----------------
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); post.resize(innerWidth, innerHeight); }
addEventListener('resize', resize); resize();
let last = performance.now(), clock = 0, bob = 0, lastStep = 0, crowT = 8, gust = 0;
function placeCamera() {
  const gy = groundH(P.x, P.z), sp = P.speed; const bobA = Math.min(sp / 5, 1);
  camera.position.set(P.x + Math.cos(P.yaw) * Math.sin(bob * 0.5) * 0.025 * bobA, gy + P.y + 1.66 + Math.abs(Math.sin(bob * 0.5)) * 0.055 * bobA - 0.02 + Math.sin(clock * 0.9) * 0.006, P.z - Math.sin(P.yaw) * Math.sin(bob * 0.5) * 0.025 * bobA);
  camera.rotation.set(P.pitch + Math.sin(clock * 0.7) * 0.003, P.yaw + Math.sin(clock * 0.45) * 0.002, Math.sin(bob * 0.5) * 0.004 * bobA, 'YXZ');
}
// автоподстройка качества под устройство
const AQ = { t: 0, n: 0, acc: 0, level: 0 };
function autoQuality(dt) {
  if (TEST || !started || AQ.level >= 4) return;
  AQ.t += dt; if (AQ.t < 1.5) return; AQ.acc += dt; AQ.n++;
  if (AQ.acc < 2.5) return;
  const fps = AQ.n / AQ.acc; AQ.acc = 0; AQ.n = 0;
  if (fps > 40) { if (AQ.t > 12) AQ.level = 4; return; }
  AQ.level++;
  if (REFL.on.value > 0) { REFL.on.value = 0; return; }           // первым делом отключаем отражения в лужах
  if (AQ.level === 1 && Q.shadows) { Q.shadows = false; sun.castShadow = false; renderer.shadowMap.enabled = false; scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
  else if (AQ.level <= 2) { post.U.aoOn.value = 0; renderer.setPixelRatio(Math.max(0.7, renderer.getPixelRatio() * 0.75)); resize(); }
  else if (AQ.level === 3) { Q.R = 1; grass.mesh.geometry.instanceCount = Math.floor(Q.grass * 0.5); }
  else { renderer.setPixelRatio(Math.max(0.6, renderer.getPixelRatio() * 0.8)); resize(); }
}
function frame(now) {
  if (!TEST) requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; SHARED.uTime.value = clock;
  gust = clamp(0.5 + 0.5 * Math.sin(clock * 0.21) * Math.sin(clock * 0.53 + 1) + 0.25 * Math.sin(clock * 1.7), 0, 1);
  if (started && !dead && !(jumping || goWorld.busy)) {
    let fx = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, sx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    const l = Math.hypot(fx, sx); if (l > 1) { fx /= l; sx /= l; }
    const target = (keys.ShiftLeft || keys.ShiftRight || running ? 5.6 : 2.3) * Math.min(1, l);
    P.speed = lerp(P.speed, target, 1 - Math.exp(-dt * 6));
    const fwx = -Math.sin(P.yaw), fwz = -Math.cos(P.yaw);
    if (l > 0.01) { P.dx = (fwx * fx - fwz * sx) / l; P.dz = (fwz * fx + fwx * sx) / l; }
    let nx = P.x + (P.dx || 0) * P.speed * dt, nz = P.z + (P.dz || 0) * P.speed * dt;
    [nx, nz] = collide(nx, nz); P.x = nx; P.z = nz;
    P.vy -= 11 * dt; const gy = PODEZD ? podSurface(P.x, P.z, P.y) : TRAIN ? TRAIN_FLOOR : STROY ? stroySurface(P.x, P.z) : 0; P.y += P.vy * dt; if (PODEZD && P.ground && P.vy <= 0 && P.y - gy < 0.45) P.y = gy; if (P.y <= gy) { if (P.vy < -3) footstep(surfaceAt(P.x, P.z), true); P.y = gy; P.vy = 0; P.ground = true; } else P.ground = false;
    if (P.ground && P.speed > 0.3) { bob += dt * (3.2 + P.speed * 1.3); if (bob - lastStep > Math.PI * 2) { lastStep = bob; footstep(surfaceAt(P.x, P.z), P.speed > 4); } }
    killCheck();
    for (let i = coinsLive.length - 1; i >= 0; i--) { const c = coinsLive[i], t = taken.get(c.id); const vis = t === undefined || clock - t > RESPAWN; if (vis && t !== undefined) taken.delete(c.id); c.obj.visible = vis; if (!vis) continue;
      if (c.type === 0) { c.obj.children[0].rotation.z += dt * 2.2; c.obj.children[0].position.y = 0.35 + Math.sin(clock * 2 + i) * 0.04; }
      if (c.fy !== undefined && Math.abs(c.fy - P.y) > 1.3) continue;
      if (Math.hypot(c.x - P.x, c.z - P.z) < (c.type >= 3 ? 0.9 : 1.1)) { const T = COIN_TYPES[c.type]; taken.set(c.id, clock);
        if (T.k === 'key') { addKey(); }
        else if (T.k === 'item') { itemPicked(c, T); }
        else if (T.k === 'trash') { TRASHN++; if ($('f_trash')) $('f_trash').textContent = TRASHN; try { localStorage.setItem(WORLD + '_trash', TRASHN); } catch (e) {} toast(`${T.n} <b style="color:#bbb">+1 мусор</b>`); burst(0.1, 'bandpass', 2200, 1, 0.3); }
        else if (T.k) { FR[T.k]++; showFruit(); try { localStorage.setItem('vorota_fruit', JSON.stringify(FR)); } catch (e) {} toast(T.k === 'rasp' ? `Малина <b style="color:#e0566b">+1</b>` : `${T.n} <b style="color:#cfe08a">+1</b>`); burst(0.08, 'bandpass', 1400, 1.2, 0.25); blip([T.k === 'rasp' ? 1568 : 784], 0.18, 'sine', 0.05); }
        else { money += T.v; if (coinsEl) coinsEl.textContent = money; save(); toast(`${T.n} <b style="color:#ffd35a">+${T.v}</b>`); blip(c.type === 2 ? [880, 1175, 1568] : c.type === 1 ? [988, 1319, 1568] : [1319], 0.3, 'triangle', 0.1); } } }
  } else if (!started) { P.yaw += dt * 0.02; }
  if (dead) { dead -= dt; flash = Math.max(0, flash - dt * 2.5); if (dead <= 0) { dead = 0; Object.assign(P, { x: SPAWN ? SPAWN.x : 0, z: SPAWN ? SPAWN.z : 0, y: 0, vy: 0, yaw: SPAWN ? SPAWN.yaw : -Math.PI / 2 + 0.2, pitch: -0.03, speed: 0 }); hitCar = null; const f = $('fade'); f.style.transition = 'opacity 1.6s'; f.style.opacity = 0; f.innerHTML = ''; } }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  if (started) { crowT -= dt; if (crowT < 0) { crowT = 18 + Math.random() * 35; if ((GARDEN && Math.random() < 0.45) || (INDOOR && Math.random() < 0.8)) (PODEZD && Math.random() < 0.5 ? podSound() : creak()); else if (DVOR && Math.random() < 0.6) dvAmbient(); else crow(); } }
  autoQuality(dt);
  houseUpdate(dt); metaUpdate(dt);
  updateCars(dt, P.x); updateChunks(P.x, P.z, false);
  ground.position.set(Math.round(P.x / (GS / GSEG)) * (GS / GSEG), GROUND_Y, Math.round(P.z / (GS / GSEG)) * (GS / GSEG));
  placeCamera(); grass.update(camera.position);
  sky.position.copy(camera.position);
  const sd = skyU.sunDir.value; sun.position.set(P.x + sd.x * 120, sd.y * 120, P.z + sd.z * 120); sun.target.position.set(P.x, 0, P.z);
  if (Q.shadows) { const ts = 110 / 2048; sun.position.x = Math.round(sun.position.x / ts) * ts; sun.position.z = Math.round(sun.position.z / ts) * ts; sun.target.position.x = sun.position.x - sd.x * 120; sun.target.position.z = sun.position.z - sd.z * 120; }
  updateAudio(dt, gust);
  post.U.flash.value = flash;
  post.render(clock);
}
// ---------------- загрузка ----------------
let jobI = 0;
function loadStep() {
  if (jobI < PROTO_JOBS.length) { const [k, fn] = PROTO_JOBS[jobI++]; PROTO[k] = fn(); $('play').textContent = `Загрузка… ${Math.round(jobI / PROTO_JOBS.length * 100)}%`; setTimeout(loadStep, 0); return; }
  updateChunks(0, 0, true); placeCamera(); $('play').textContent = 'Играть'; $('play').disabled = false; requestAnimationFrame(frame);
}
$('play').disabled = true; setTimeout(loadStep, 30);
$('play').onclick = () => { started = true; $('start').style.display = 'none'; if (!AC) initAudio(); if (AC && AC.state === 'suspended') AC.resume(); if (!MOBILE) renderer.domElement.requestPointerLock(); };
$('back').onclick = () => { location.href = 'index.html'; };
window.__tropa = { cars, P, get paz() { return typeof PAZ !== "undefined" ? PAZ : null; }, tp(x, z, yaw, pitch) { P.x = x; P.z = z; if (yaw !== undefined) P.yaw = yaw; if (pitch !== undefined) P.pitch = pitch; }, start() { $('play').onclick(); }, money: () => money, coins: () => coinsLive.map((c) => [c.x, c.z, c.type]), ready: () => !$('play').disabled, post, Q, flush() { updateChunks(P.x, P.z, true); }, step(n = 1, dtms = 33) { const t0 = performance.now(); for (let i = 0; i < n; i++) { last = performance.now() - dtms; frame(performance.now()); } renderer.getContext().finish(); return performance.now() - t0; }, stats() { let tv = 0, iv = 0, meshes = 0; scene.traverse((o) => { if (o.isMesh && o.visible) { meshes++; const n = o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; if (o.isInstancedMesh) iv += n * o.count; else tv += n; } }); const pr = {}; for (const k in PROTO) pr[k] = PROTO[k].parts.map((x) => x[1].index.count / 3); return { tris: tv, instTris: iv, meshes, calls: renderer.info.render.calls, mem: renderer.info.memory, heap: performance.memory && performance.memory.usedJSHeapSize / 1e6, pr }; }, info() { renderer.info.autoReset = false; renderer.info.reset(); post.render(clock); return { calls: renderer.info.render.calls, tri: renderer.info.render.triangles, cam: camera.position.toArray().map((v) => +v.toFixed(2)).concat([P.speed, P.dx, P.dz, P.y]) }; }, shot() { return renderer.domElement.toDataURL('image/jpeg', 0.9); } };
