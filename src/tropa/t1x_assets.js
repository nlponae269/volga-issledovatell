// ===================== Настоящие ресурсы (Poly Haven, CC0): PBR-текстуры, HDRI-небо, 3D-модели =====================
// Только для «Дворов» и «Подъезда». Файлы лежат в res/ рядом со страницей; мир стартует, когда всё загружено.
const PBR_ON = DVOR || PODEZD;
const PBR = { ready: !PBR_ON, pending: 0, total: 0, started: false, tex: {}, env: null, bg: null };
const _tl = new THREE.TextureLoader(), _clones = {};
function pbrDone() { PBR.pending--; if (PBR.pending <= 0 && PBR.started) PBR.ready = true; }
// текстура (с кешем); rx/ry — повтор (для разных масштабов создаётся копия, которая обновится после загрузки)
function pbrT(file, srgb, rx = 1, ry = rx) {
  let base = PBR.tex[file];
  if (!base) { PBR.pending++; PBR.total++;
    base = PBR.tex[file] = _tl.load('res/' + file, () => { (_clones[file] || []).forEach((c) => (c.needsUpdate = true)); pbrDone(); }, undefined, () => pbrDone());
    base.wrapS = base.wrapT = THREE.RepeatWrapping; base.anisotropy = MAXANI; if (srgb) base.colorSpace = THREE.SRGBColorSpace; }
  if (rx === 1 && ry === 1) return base;
  const c = base.clone(); c.repeat.set(rx, ry); (_clones[file] = _clones[file] || []).push(c); if (base.image) c.needsUpdate = true; return c;
}
// PBR-набор материала Poly Haven: цвет, нормали, ARM (R — AO, G — шероховатость, B — металл); meters — размер одного тайла
function pbrApply(mat, name, meters, nscale = 1) {
  const r = 1 / meters; mat.map = pbrT(`tex/${name}_diff.jpg`, true, r); mat.normalMap = pbrT(`tex/${name}_nor.jpg`, false, r); mat.normalScale = new THREE.Vector2(nscale, nscale);
  const arm = pbrT(`tex/${name}_arm.jpg`, false, r); mat.roughnessMap = arm; mat.metalnessMap = arm; mat.roughness = 1; mat.metalness = 1; mat.needsUpdate = true; return mat;
}
// 3D-модель (сконвертирована из glTF): регистрируется в PROTO, ставится инстансами через kit / Batch
function loadModel(name, key, opt = {}) {
  PBR.pending++; PBR.total++;
  Promise.all([fetch(`res/mdl/${name}.json`).then((r) => r.json()), fetch(`res/mdl/${name}.bin`).then((r) => r.arrayBuffer())]).then(([j, bin]) => {
    const parts = j.parts.map((p) => { const m = j.mats[p.mat], g = new THREE.BufferGeometry(); let o = p.off;
      const P = new Float32Array(bin, o, p.v * 3); o += p.v * 12; const N = new Float32Array(bin, o, p.v * 3); o += p.v * 12; const U = new Float32Array(bin, o, p.v * 2); o += p.v * 8; const I = new Uint32Array(bin, o, p.i);
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setIndex(new THREE.BufferAttribute(I, 1)); g.computeBoundingSphere();
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(m.color[0], m.color[1], m.color[2]), roughness: 1, metalness: 1, side: m.alpha || m.double ? THREE.DoubleSide : THREE.FrontSide });
      if (m.map) mat.map = pbrT('mdl/tex/' + m.map, true); if (m.nor) mat.normalMap = pbrT('mdl/tex/' + m.nor, false);
      if (m.arm) { const a = pbrT('mdl/tex/' + m.arm, false); mat.roughnessMap = a; mat.metalnessMap = a; } else { mat.metalness = m.metal; mat.roughness = m.rough; }
      if (m.alpha) mat.alphaTest = 0.45; if (opt.tint) mat.color.multiply(new THREE.Color(opt.tint)); if (opt.emissive && /bulb|glass/.test(m.name || '')) { mat.emissive = new THREE.Color(opt.emissive); mat.emissiveIntensity = 3; }
      return [mat, g]; });
    PROTO[key] = { parts, col: !!opt.col, size: j.size }; pbrDone(); }).catch(() => pbrDone());
}
// HDRI (.hdr, RGBE с RLE) → половинная точность → небо и окружение (отражения, рассеянный свет)
function parseHDR(buf) {
  const b = new Uint8Array(buf); let p = 0; const line = () => { let s = ''; while (p < b.length && b[p] !== 10) s += String.fromCharCode(b[p++]); p++; return s; };
  while (line() !== '') {} const rs = line().split(' '), H = +rs[1], W = +rs[3];
  const out = new Uint16Array(W * H * 4), sl = new Uint8Array(W * 4), half = THREE.DataUtils.toHalfFloat, one = half(1);
  for (let y = 0; y < H; y++) {
    if (b[p] === 2 && b[p + 1] === 2) { p += 4; for (let c = 0; c < 4; c++) { let x = 0; while (x < W) { let n = b[p++]; if (n > 128) { n -= 128; const v = b[p++]; while (n--) sl[(x++) * 4 + c] = v; } else { while (n--) sl[(x++) * 4 + c] = b[p++]; } } } }
    else for (let x = 0; x < W * 4; x++) sl[x] = b[p++];
    const row = (H - 1 - y) * W;
    for (let x = 0; x < W; x++) { const e = sl[x * 4 + 3], f = e ? Math.pow(2, e - 136) : 0, o = (row + x) * 4; out[o] = half(sl[x * 4] * f); out[o + 1] = half(sl[x * 4 + 1] * f); out[o + 2] = half(sl[x * 4 + 2] * f); out[o + 3] = one; }
  }
  return { W, H, data: out };
}
function loadHDR(file) {
  PBR.pending++; PBR.total++;
  fetch('res/' + file).then((r) => r.arrayBuffer()).then((buf) => { const h = parseHDR(buf);
    const t = new THREE.DataTexture(h.data, h.W, h.H, THREE.RGBAFormat, THREE.HalfFloatType); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.LinearSRGBColorSpace;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    const pm = new THREE.PMREMGenerator(renderer); PBR.env = pm.fromEquirectangular(t).texture; pm.dispose(); PBR.bg = t; pbrDone(); }).catch(() => pbrDone());
}
if (PBR_ON) {
  if (DVOR) {
    loadHDR('hdri/sky.hdr'); M.bark.color.setRGB(0.72, 0.74, 0.76);
    // земля: асфальт, сухая земля, пожухлая трава — настоящие сканы
    TX.asph = pbrT('tex/asphalt_02_diff.jpg', true); TX.sand = pbrT('tex/brown_mud_dry_diff.jpg', true); TX.grass = pbrT('tex/withered_grass_diff.jpg', true); TX.leavesN = pbrT('tex/brown_mud_dry_nor.jpg', false);
    pbrApply(M.conc, 'chipped_concrete', 2.5); pbrApply(M.brick, 'brick_wall_003', 1.6);
    PBR.brick = { map: pbrT('tex/brick_wall_003_diff.jpg', true), nor: pbrT('tex/brick_wall_003_nor.jpg', false), arm: pbrT('tex/brick_wall_003_arm.jpg', false) };
    for (const [n, k, o] of [['exterior_aircon_unit', 'm_ac'], ['security_light', 'm_slight', { emissive: 0xfff2d8 }], ['metal_trash_can', 'm_can', { col: true }], ['trashbag', 'm_bag'], ['old_tyre', 'm_tyre'],
      ['cardboard_box_01', 'm_box'], ['plastic_crate_01', 'm_crate'], ['utility_box_02', 'm_ubox', { col: true }], ['concrete_road_barrier', 'm_barrier', { col: true }], ['covered_car', 'm_ccar', { col: true }],
      ['shrub_02', 'm_shrub'], ['modular_electricity_poles', 'm_pole'], ['modular_metal_gutter', 'm_gutter'], ['rollershutter_door', 'm_shutter'], ['power_box_01', 'm_pbox']]) loadModel(n, k, o || {});
  }
  if (PODEZD) {
    pbrApply(M.conc, 'concrete_floor_worn_001', 2.2);
    PBR.wallN = pbrT('tex/blue_plaster_weathered_nor.jpg', false, 1 / 1.6); PBR.wallArm = pbrT('tex/blue_plaster_weathered_arm.jpg', false, 1 / 1.6); PBR.wallDet = pbrT('tex/grey_plaster_diff.jpg', true, 1 / 1.6);
    PBR.floor = 'floor_tiles_06';
    for (const [n, k] of [['power_box_01', 'm_pbox'], ['trashbag', 'm_bag'], ['cardboard_box_01', 'm_box'], ['lightbulb_01', 'm_bulb']]) loadModel(n, k, n === 'lightbulb_01' ? { emissive: 0xffd8a0 } : {});
  }
  PBR.started = true; if (PBR.pending <= 0) PBR.ready = true;
}
