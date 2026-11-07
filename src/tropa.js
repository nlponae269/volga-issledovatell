// ТРОПА — бесконечная тропа вдоль трассы
const $ = id => document.getElementById(id);
const MOBILE = matchMedia('(pointer:coarse)').matches;
const renderer = new THREE.WebGLRenderer({antialias: !MOBILE});
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !MOBILE; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const SKY = new THREE.Color(0xaeb4b8);
scene.background = SKY; scene.fog = new THREE.Fog(SKY, 40, 230);
const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 600);
scene.add(new THREE.HemisphereLight(0xd8dde2, 0x5d5a48, 1.6));
const sun = new THREE.DirectionalLight(0xfff2e0, 1.3);
sun.position.set(30, 60, 20); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left:-60,right:60,top:60,bottom:-60,far:200});
scene.add(sun, sun.target);

// ---------- утилиты ----------
function hash(a, b, c = 0) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function speckle(g, w, h, n, cols, smin, smax) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; const s = smin + Math.random() * (smax - smin); g.save(); g.translate(Math.random() * w, Math.random() * h); g.rotate(Math.random() * 6.3); g.beginPath(); g.ellipse(0, 0, s, s * 0.55, 0, 0, 6.3); g.fill(); g.restore(); } }

// ---------- текстуры ----------
const grassTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#6b7a45'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 900, ['#7f8c50', '#5d6b3b', '#8a8a55', '#6e7040', '#9a9060'], 6, 30);
  speckle(g, w, h, 500, ['#8d7a52', '#7b6a48', '#a39268'], 4, 18); // проплешины
  for (let i = 0; i < 5000; i++) { g.strokeStyle = ['#4f6130', '#7d9348', '#5f7438', '#93a35a'][(Math.random() * 4) | 0]; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 4, y - 3 - Math.random() * 6); g.stroke(); }
  speckle(g, w, h, 700, ['#d1a83a', '#c08a2e', '#b9a04a', '#a8742b', '#e0c056'], 2.5, 6); // листья
}, [1, 1]);
const sandTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#cbb894'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 600, ['#c2ad86', '#d6c4a0', '#b8a27a', '#bfae8e'], 8, 40);
  speckle(g, w, h, 160, ['#8f7f62', '#7b6d55'], 6, 26);
  for (let i = 0; i < 4000; i++) { g.fillStyle = ['#9d8b6a', '#e2d3b2', '#a99779'][(Math.random() * 3) | 0]; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  speckle(g, w, h, 120, ['#d1a83a', '#b07a30'], 2.5, 5);
}, [1, 1]);
const asphTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5c5f62'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = ['#4d5053', '#6a6d70', '#575a5d', '#73767a'][(Math.random() * 4) | 0]; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#e8e8e2'; for (let x = 0; x < w; x += 128) g.fillRect(x, h / 2 - 3, 64, 6);
  g.fillRect(0, 12, w, 5); g.fillRect(0, h - 17, w, 5);
}, [1, 1]);
const corrTex = canvasTex(256, 256, (g, w, h) => {
  for (let x = 0; x < w; x++) { const v = 200 + 30 * Math.sin(x / 256 * 6.283 * 16); g.fillStyle = `rgb(${v},${v + 2},${v + 4})`; g.fillRect(x, 0, 1, h); }
  speckle(g, w, h, 40, ['#9a9a90aa', '#8a7c6a88'], 2, 8);
}, [1, 1]);
const brickTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#bfb9ab'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 16; x < w + 32; x += 32) { const v = 220 + Math.random() * 25; g.fillStyle = `rgb(${v},${v - 6},${v - 30})`; g.fillRect(x - 15, y + 1, 30, 14); }
}, [1, 1]);
const woodTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#6f6656'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { g.fillStyle = `rgb(${100 + Math.random() * 30},${92 + Math.random() * 25},${78 + Math.random() * 20})`; g.fillRect(x, 0, 15, h); g.fillStyle = '#3e382f'; g.fillRect(x + 15, 0, 1, h); }
  speckle(g, w, h, 300, ['#5a5245', '#857a66'], 1, 4);
}, [1, 1]);

const M = {
  grass: new THREE.MeshStandardMaterial({map: grassTex, roughness: 1}),
  sand: new THREE.MeshStandardMaterial({map: sandTex, roughness: 1}),
  asph: new THREE.MeshStandardMaterial({map: asphTex, roughness: .9}),
  corr: new THREE.MeshStandardMaterial({map: corrTex, roughness: .6, metalness: .3, side: THREE.DoubleSide}),
  brick: new THREE.MeshStandardMaterial({map: brickTex, roughness: .95}),
  wood: new THREE.MeshStandardMaterial({map: woodTex, roughness: 1}),
  white: new THREE.MeshStandardMaterial({color: 0xe9e9e4, roughness: .9}),
  conc: new THREE.MeshStandardMaterial({color: 0x9c9a94, roughness: 1}),
  metal: new THREE.MeshStandardMaterial({color: 0x6b6f72, roughness: .5, metalness: .7}),
  rust: new THREE.MeshStandardMaterial({color: 0x7a5236, roughness: .8, metalness: .4}),
  bark: new THREE.MeshStandardMaterial({color: 0x5b5246, roughness: 1}),
  roofG: new THREE.MeshStandardMaterial({color: 0x8a8d8a, roughness: .8, metalness: .2}),
  roofB: new THREE.MeshStandardMaterial({color: 0x5a3a2c, roughness: .6, metalness: .3}),
  blue: new THREE.MeshStandardMaterial({color: 0x7aa6c8, roughness: .7, metalness: .3}),
  green: new THREE.MeshStandardMaterial({color: 0x3f8a5a, roughness: .7}),
  glass: new THREE.MeshStandardMaterial({color: 0x2a3036, roughness: .15, metalness: .6}),
  wire: new THREE.LineBasicMaterial({color: 0x2a2a2a}),
  poplar: new THREE.MeshStandardMaterial({color: 0x5f6e44, roughness: 1, flatShading: true}),
  bushA: new THREE.MeshStandardMaterial({color: 0xa88a4a, roughness: 1, flatShading: true}),
  bushB: new THREE.MeshStandardMaterial({color: 0x8c8c48, roughness: 1, flatShading: true}),
  dark: new THREE.MeshStandardMaterial({color: 0x2f3a2c, roughness: 1, flatShading: true}),
  gold: new THREE.MeshStandardMaterial({color: 0xffc83a, roughness: .25, metalness: 1, emissive: 0x6a4800}),
  coin: new THREE.MeshStandardMaterial({color: 0xe8c460, roughness: .3, metalness: 1, emissive: 0x5a4000}),
};
const G = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(.5, .5, 1, 8), ico: new THREE.IcosahedronGeometry(1, 1), coin: new THREE.CylinderGeometry(.12, .12, .025, 16) };

// ---------- раскладка мира ----------
// Тропа — вдоль X на z∈[-2.2,2.2]. Трасса — z∈[-40,-30]. Ограждения по краям трассы.
const PATH = 2.2, ROAD0 = -40, ROAD1 = -30;
const groundY = (x, z) => 0;

function mesh(geo, mat, x, y, z, sx, sy, sz, ry = 0, grp) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; grp.add(m); return m; }
function texBox(mat, x, y, z, sx, sy, sz, ry, grp, rep) { const geo = new THREE.BoxGeometry(sx, sy, sz); if (rep) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep[0], uv.getY(i) * rep[1]); } const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; grp.add(m); return m; }

const colliders = new Map(); // chunk key -> [{x,z,hx,hz,ry}]
function addCol(list, x, z, hx, hz, ry = 0) { list.push({x, z, hx, hz, c: Math.cos(ry), s: Math.sin(ry)}); }

function poplar(g, r, x, z, cols) {
  const h = 13 + r() * 8;
  mesh(G.cyl, M.bark, x, h * .2, z, .45, h * .4, .45, 0, g);
  mesh(G.cyl, M.white, x, .7, z, .5, 1.4, .5, 0, g); // побелка
  const n = 5;
  for (let i = 0; i < n; i++) { const t = i / n; mesh(G.ico, M.poplar, x + (r() - .5) * .5, h * (.35 + t * .55), z + (r() - .5) * .5, 1.6 * (1 - t * .55), h * .16, 1.6 * (1 - t * .55), r() * 6, g); }
  addCol(cols, x, z, .35, .35);
}
const G_leaf = new THREE.IcosahedronGeometry(1, 0);
function bush(g, r, x, z) {
  const s = 1.2 + r() * 1.6, mat = r() < .55 ? M.bushA : M.bushB, n = 26;
  for (let i = 0; i < 7; i++) { const st = mesh(G.cyl, M.bark, x + (r() - .5) * s * .4, s * .55, z + (r() - .5) * s * .4, .04, s * 1.2, .04, 0, g); st.rotation.set((r() - .5) * .9, 0, (r() - .5) * .9); st.castShadow = false; }
  for (let i = 0; i < n; i++) { const a = r() * 6.28, h = .12 + r() * .9, d = r() * s * (.25 + h * .5), k = .14 + r() * .18; const b = mesh(G_leaf, mat, x + Math.cos(a) * d, s * h, z + Math.sin(a) * d, k * s, k * s * .7, k * s, r() * 6, g); b.castShadow = i % 3 === 0; }
}
function bareTree(g, r, x, z, cols) {
  const h = 6 + r() * 4;
  mesh(G.cyl, M.bark, x, h / 2, z, .35, h, .35, 0, g);
  for (let i = 0; i < 9; i++) { const b = mesh(G.cyl, M.bark, x, h * (.45 + r() * .45), z, .08, 2.5 + r() * 2.5, .08, 0, g); b.rotation.set((r() - .5) * 1.6, r() * 6, (r() - .5) * 1.6); }
  addCol(cols, x, z, .3, .3);
}
function pole(g, x, z) { mesh(G.box, M.conc, x, 4.5, z, .28, 9, .28, 0, g); mesh(G.box, M.wood, x, 8.6, z, .12, .12, 1.6, 0, g); }
function shed(g, r, x, z, cols) { // длинный навес/гараж из шифера, как на фото
  const L = 18 + r() * 14, H = 2.6, ry = (r() < .5 ? 0 : 0.04);
  const wall = texBox(M.corr, x, H / 2 + .5, z, L, H, .08, ry, g, [L / 3, 1]);
  for (let i = 0; i <= L / 3; i++) mesh(G.cyl, M.rust, x - L / 2 + i * 3, 1.1, z + .1, .07, 2.2, .07, 0, g);
  const roof = texBox(M.corr, x, H + .7, z + 2, L + .4, .06, 4.4, 0, g, [L / 3, 1]); roof.rotation.x = -.06;
  for (let i = 0; i <= L / 4; i++) mesh(G.cyl, M.rust, x - L / 2 + i * 4, (H + .7) / 2, z + 4, .06, H + .7, .06, 0, g);
  addCol(cols, x, z, L / 2, .3);
  if (r() < .5) { const sp = mesh(G.cyl, M.rust, x + L / 2 + .8, 1.2, z + .5, .05, 2.6, .05, 0, g); sp.rotation.z = .35; }
  for (let i = 0; i < 4; i++) mesh(G.box, M.white, x + (r() - .5) * L, .1, z + 1 + r() * 5, .4 + r() * .6, .12, .25 + r() * .3, r() * 3, g); // битый кирпич
}
function garageBox(g, r, x, z, cols) { // ряд синих жестяных гаражей
  const n = 2 + (r() * 3 | 0);
  for (let i = 0; i < n; i++) { const gx = x + i * 3.6, m = r() < .6 ? M.blue : M.metal; mesh(G.box, m, gx, 1.25, z, 3.4, 2.5, 5.5, 0, g); mesh(G.box, M.roofG, gx, 2.6, z, 3.6, .1, 5.9, 0, g); mesh(G.box, M.metal, gx, 1.1, z + 2.77, 2.8, 2.1, .05, 0, g); }
  addCol(cols, x + (n - 1) * 1.8, z, n * 1.8, 2.8);
}
function signTex(text, bg, fg) { return canvasTex(512, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = 'bold 72px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); }); }
const SIGNS = ['ПРОДУКТЫ', 'МАГАЗИН', 'У ДОРОГИ', 'ХЛЕБ', 'ВСЁ ДЛЯ ДОМА'].map((t, i) => new THREE.MeshBasicMaterial({map: signTex(t, ['#2f6f3e', '#a13a2e', '#2c4f86', '#c49a2a', '#555'][i], '#fff')}));
function shop(g, r, x, z, cols, ry) { // кирпичный магазинчик
  const W = 9, D = 6, H = 3.4, s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
  texBox(M.brick, 0, H / 2, 0, W, H, D, 0, s, [3, 1.2]);
  mesh(G.box, M.roofB, 0, H + .15, 0, W + .8, .3, D + .8, 0, s);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.3), SIGNS[(r() * SIGNS.length) | 0]); sign.position.set(0, H - .5, D / 2 + .02); s.add(sign);
  mesh(G.box, M.glass, -2.3, 1.5, D / 2 + .01, 2.6, 1.6, .05, 0, s); mesh(G.box, M.glass, 2.3, 1.5, D / 2 + .01, 2.6, 1.6, .05, 0, s);
  mesh(G.box, M.wood, 0, 1.1, D / 2 + .01, 1.1, 2.2, .06, 0, s);
  mesh(G.box, M.conc, 0, .08, D / 2 + 1.2, W, .16, 2.4, 0, s); // крыльцо
  addCol(cols, x, z, W / 2, D / 2, ry);
  return s;
}
function house(g, r, x, z, cols, ry) {
  const W = 7 + r() * 3, D = 6 + r() * 2, H = 3, s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
  const wood = r() < .5; texBox(wood ? M.wood : M.brick, 0, H / 2, 0, W, H, D, 0, s, [W / 3, 1]);
  const roofM = r() < .5 ? M.roofG : M.roofB;
  for (const sd of [-1, 1]) { const p = mesh(G.box, roofM, 0, H + 1.1, sd * D / 4, W + .6, .12, D / 2 * 1.25, 0, s); p.rotation.x = sd * .62; }
  const gable = new THREE.Mesh(new THREE.CylinderGeometry(0, D / 2 * 1.02, 2.2, 3, 1).rotateY(Math.PI / 6), wood ? M.wood : M.brick); // приблизительный фронтон
  for (const sd of [-1, 1]) { const gm = gable.clone(); gm.position.set(sd * (W / 2 - .02), H + 1.1, 0); gm.rotation.set(0, 0, 0); gm.scale.set(.02 / D, 1, 1); s.add(gm); }
  for (let i = -1; i <= 1; i += 2) mesh(G.box, M.glass, i * W / 4, 1.7, D / 2 + .01, 1.1, 1.2, .05, 0, s);
  addCol(cols, x, z, W / 2, D / 2, ry);
}
function fenceRail(g, x0, x1, z) { // ограждение трассы (секции)
  const L = x1 - x0; mesh(G.box, M.metal, (x0 + x1) / 2, 1.0, z, L, .06, .06, 0, g); mesh(G.box, M.metal, (x0 + x1) / 2, .25, z, L, .06, .06, 0, g);
  for (let x = x0; x < x1; x += 2.5) mesh(G.box, M.metal, x, .6, z, .08, 1.2, .08, 0, g);
  for (let x = x0; x < x1; x += .5) mesh(G.box, M.metal, x, .62, z, .025, .75, .025, 0, g);
}

// ---------- монеты ----------
const COIN_TYPES = [{n: 'Монетка', v: 5}, {n: 'Горстка монет', v: 50}, {n: 'Слиток золота', v: 100}];
const taken = new Map(); // id -> время подбора
const RESPAWN = 90;
const coinsLive = []; // {id, obj, type, x, z}
let money = 0; try { money = +localStorage.getItem('tropa_money') || 0; } catch (e) {}
function coinMesh(type, r) {
  const g = new THREE.Group();
  if (type === 0) { const c = new THREE.Mesh(G.coin, M.coin); c.rotation.x = Math.PI / 2; c.scale.setScalar(1.6); g.add(c); }
  else if (type === 1) { for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(G.coin, M.coin); c.position.set((r() - .5) * .35, .02 + i * .022, (r() - .5) * .35); c.rotation.set((r() - .5) * .3, 0, (r() - .5) * .3); g.add(c); } }
  else { const geo = new THREE.CylinderGeometry(.18, .26, .14, 4, 1).rotateY(Math.PI / 4); geo.scale(1.8, 1, .8); const b = new THREE.Mesh(geo, M.gold); b.position.y = .07; g.add(b); }
  g.traverse(o => o.castShadow = true);
  return g;
}
function spawnCoinsAt(g, r, sx, sz, ry, id) {
  const n = 3 + (r() * 4 | 0);
  for (let i = 0; i < n; i++) {
    const lx = (r() - .5) * 10, lz = 3.4 + r() * 4.5, c = Math.cos(ry), s = Math.sin(ry);
    const x = sx + lx * c + lz * s, z = sz - lx * s + lz * c;
    const t = r(), type = t < .7 ? 0 : t < .92 ? 1 : 2;
    const obj = coinMesh(type, r); obj.position.set(x, type === 0 ? .45 : 0, z); g.add(obj);
    coinsLive.push({id: id + ':' + i, obj, type, x, z, chunk: g});
  }
}

// ---------- чанки ----------
const CS = 48, R = MOBILE ? 3 : 4, chunks = new Map();
function buildChunk(cx, cz) {
  const g = new THREE.Group(), cols = [], r = rng((cx * 73856093) ^ (cz * 19349663) ^ 0x51ed);
  const x0 = cx * CS, z0 = cz * CS, x1 = x0 + CS, z1 = z0 + CS;
  const inZ = (a, b) => Math.max(a, z0) < Math.min(b, z1);
  // полоса между тропой и трассой (z -28..-2.2): тополя, кусты, столбы
  if (inZ(-28, -3)) {
    const kind = hash(cx, 7);
    for (let x = x0 + 2; x < x1; x += 4 + r() * 5) { const z = -22 + r() * 6; if (z < z0 || z >= z1) continue; if (kind < .55) poplar(g, r, x, z, cols); else bush(g, r, x, z); }
    for (let i = 0; i < 5; i++) { const z = -16 + r() * 10; if (z >= z0 && z < z1) bush(g, r, x0 + r() * CS, z); }
    if (r() < .35) { const z = -12; if (z >= z0 && z < z1) shed(g, r, x0 + 24, z, cols); }
    if (inZ(-6.5, -5.5)) { for (let x = Math.ceil(x0 / 32) * 32; x < x1; x += 32) pole(g, x, -6); }
  }
  // за тропой (z > 3): огороды, магазины, сараи, дома
  if (inZ(3, 1e9)) {
    for (let i = 0; i < 6; i++) { const x = x0 + r() * CS, z = Math.max(z0, 6) + r() * (z1 - Math.max(z0, 6)); if (z < z1) bush(g, r, x, z); }
    for (let i = 0; i < 2; i++) { const x = x0 + r() * CS, z = Math.max(z0, 10) + r() * (z1 - Math.max(z0, 10)); if (z < z1 && r() < .7) bareTree(g, r, x, z, cols); }
    const roll = (cx === 0 && cz === 0) ? 0 : hash(cx, cz, 11);
    if (z0 <= 14 && z1 > 14) { // первая линия — у самой тропы
      if (roll < .38) { const sx = x0 + 24, sz = 15.5; shop(g, r, sx, sz, cols, Math.PI); spawnCoinsAt(g, r, sx, sz, Math.PI, `${cx},${cz}`); }
      else if (roll < .62) shed(g, r, x0 + 24, 12, cols);
      else if (roll < .85) house(g, r, x0 + 24, 18, cols, Math.PI);
    } else if (z0 > 14) {
      if (roll < .2) { const sx = x0 + 24, sz = z0 + 24; shop(g, r, sx, sz, cols, r() * 6.28); spawnCoinsAt(g, r, sx, sz, cols[cols.length - 1] ? 0 : 0, `${cx},${cz}`); }
      else if (roll < .55) house(g, r, x0 + 10 + r() * 28, z0 + 10 + r() * 28, cols, r() * 6.28);
      else if (roll < .7) shed(g, r, x0 + 24, z0 + 20, cols);
      else for (let i = 0; i < 3; i++) poplar(g, r, x0 + r() * CS, z0 + r() * CS, cols);
    }
  }
  // за трассой (z < -44): дома, синие гаражи, магазины
  if (inZ(-1e9, -44)) {
    const roll = hash(cx, cz, 23);
    if (z0 <= -54 && z1 > -54) {
      if (roll < .3) { const sx = x0 + 24, sz = -54; shop(g, r, sx, sz, cols, 0); spawnCoinsAt(g, r, sx, sz, 0, `${cx},${cz}`); }
      else if (roll < .6) garageBox(g, r, x0 + 6 + r() * 20, -52, cols);
      else house(g, r, x0 + 24, -55, cols, 0);
      if (roll >= .3 && r() < .5) house(g, r, x0 + 8, -58, cols, 0);
    } else if (z1 <= -54) {
      if (roll < .45) house(g, r, x0 + 10 + r() * 28, z0 + 10 + r() * 28, cols, r() * 6.28);
      else if (roll < .6) garageBox(g, r, x0 + 10, z0 + 20, cols);
    }
    for (let i = 0; i < 4; i++) { const x = x0 + r() * CS, z = z0 + r() * (Math.min(z1, -46) - z0); if (z < -46) (r() < .5 ? poplar : bareTree)(g, r, x, z, cols); }
  }
  // ограждения трассы
  if (inZ(-29, -27)) fenceRail(g, x0, x1, -28.5);
  if (inZ(-43, -41)) fenceRail(g, x0, x1, -41.5);
  // провода между столбами
  if (inZ(-6.5, -5.5)) { const pts = []; for (const h of [8.55, 8.1]) for (let x = Math.ceil(x0 / 32) * 32; x < x1 + 32; x += 32) for (let k = 0; k < 8; k++) { const t = k / 8, t2 = (k + 1) / 8; const sag = t2 => 0.9 * 4 * t2 * (1 - t2); pts.push(new THREE.Vector3(x + t * 32, h - sag(t), -6 + (h > 8.3 ? .6 : -.6)), new THREE.Vector3(x + t2 * 32, h - sag(t2), -6 + (h > 8.3 ? .6 : -.6))); } g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), M.wire)); }
  scene.add(g);
  return {g, cols};
}
function updateChunks(px, pz) {
  const ccx = Math.floor(px / CS), ccz = Math.floor(pz / CS), want = new Set();
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
    const k = (ccx + dx) + ',' + (ccz + dz); want.add(k);
    if (!chunks.has(k)) { const c = buildChunk(ccx + dx, ccz + dz); chunks.set(k, c); colliders.set(k, c.cols); }
  }
  for (const [k, c] of chunks) if (!want.has(k)) {
    scene.remove(c.g); c.g.traverse(o => { if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); });
    for (let i = coinsLive.length - 1; i >= 0; i--) if (coinsLive[i].chunk === c.g) coinsLive.splice(i, 1);
    chunks.delete(k); colliders.delete(k);
  }
}

// ---------- земля, тропа, трасса (следуют за игроком) ----------
function strip(mat, z0, z1, y, texScale) {
  const W = 1000, geo = new THREE.PlaneGeometry(W, z1 - z0).rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.set(0, y, (z0 + z1) / 2); m.receiveShadow = true; m.renderOrder = 1; mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -8; scene.add(m);
  mat.map = mat.map.clone(); mat.map.needsUpdate = true; mat.map.repeat.set(W / texScale[0], (z1 - z0) / texScale[1]);
  return {m, follow(px) { const sx = Math.floor(px / texScale[0]) * texScale[0]; m.position.x = sx; }};
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000).rotateX(-Math.PI / 2), M.grass); ground.receiveShadow = true; scene.add(ground);
grassTex.repeat.set(1000 / 7, 1000 / 7);
const pathS = strip(M.sand, -PATH, PATH, .02, [4, PATH * 2]);
const shoulder = strip(new THREE.MeshStandardMaterial({map: sandTex, roughness: 1, color: 0xb5a98e}), ROAD1, ROAD1 + 1.6, .015, [6, 1.6]);
const shoulder2 = strip(new THREE.MeshStandardMaterial({map: sandTex, roughness: 1, color: 0xb5a98e}), ROAD0 - 1.6, ROAD0, .015, [6, 1.6]);
const roadS = strip(M.asph, ROAD0, ROAD1, .03, [14, 10]);

// ---------- машины ----------
const cars = [];
const CAR_COLS = [0xd9d9d6, 0x8a1c1c, 0x1f2f4a, 0x222222, 0x9aa3a8, 0x2f5a3a];
function makeCar(truck) {
  const g = new THREE.Group(), col = new THREE.MeshStandardMaterial({color: CAR_COLS[(Math.random() * CAR_COLS.length) | 0], roughness: .35, metalness: .6});
  if (truck) {
    mesh(G.box, M.white, 0, 1.8, 0, 2.4, 2.4, 3, 0, g); mesh(G.box, M.glass, 0, 2.3, 1.51, 2.1, .9, .05, 0, g); g.children[1].rotation.y = 0;
    const tr = texBox(new THREE.MeshStandardMaterial({color: 0xcfd2cf, roughness: .6}), 0, 2.2, -8, 2.5, 3, 12.5, 0, g);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.4), new THREE.MeshBasicMaterial({color: 0x3fa652})); side.position.set(1.27, 2.2, -5); side.rotation.y = Math.PI / 2; g.add(side);
    const s2 = side.clone(); s2.position.x = -1.27; s2.rotation.y = -Math.PI / 2; g.add(s2);
  } else {
    mesh(G.box, col, 0, .7, 0, 1.8, .7, 4.3, 0, g); mesh(G.box, col, 0, 1.3, -.3, 1.6, .6, 2.2, 0, g);
    mesh(G.box, M.glass, 0, 1.3, -.3, 1.62, .45, 2.0, 0, g);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(G.cyl, M.dark); w.rotation.z = Math.PI / 2; w.scale.set(.7, .3, .7); w.position.set(sx * (truck ? 1.1 : .85), .35, sz * (truck ? 1 : 1.3)); g.add(w); }
  const hl = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({color: 0xfff6d0})); hl.scale.set(1.4, .12, .05); hl.position.set(0, truck ? 1.2 : .75, truck ? 1.55 : 2.16); g.add(hl);
  scene.add(g); return g;
}
for (let i = 0; i < 8; i++) { const truck = i % 3 === 0; const o = makeCar(truck); cars.push({o, lane: i % 2, x: (Math.random() - .5) * 400, v: 16 + Math.random() * 10, len: truck ? 16 : 4.5}); }
const LANE_Z = [-37.5, -32.5]; // lane0 едет в -X, lane1 в +X
function updateCars(dt, px) {
  for (const c of cars) {
    const dir = c.lane === 0 ? -1 : 1;
    c.x += dir * c.v * dt;
    if (dir * (c.x - px) > 220) c.x = px - dir * (200 + Math.random() * 60), c.v = 16 + Math.random() * 10;
    c.o.position.set(c.x, 0, LANE_Z[c.lane]); c.o.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
}

// ---------- игрок ----------
const P = {x: 0, y: 0, z: 0, vy: 0, yaw: -Math.PI / 2 + .25, pitch: 0, onGround: true};
const SPAWN = {x: 0, z: 0};
const keys = {}; let running = false, dead = 0;
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space' && P.onGround) P.vy = 4.6; });
addEventListener('keyup', e => keys[e.code] = false);
renderer.domElement.addEventListener('click', () => { if (!MOBILE && started) renderer.domElement.requestPointerLock(); });
addEventListener('mousemove', e => { if (document.pointerLockElement) { P.yaw -= e.movementX * .0022; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - e.movementY * .0022)); } });
// тач
const joy = {x: 0, y: 0, id: null}, look = {id: null, lx: 0, ly: 0};
if (MOBILE) {
  $('touch').style.display = 'block';
  const jb = $('joy'), kn = $('knob');
  addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (t.target.classList.contains('tb')) continue; if (t.clientX < innerWidth / 2 && joy.id === null) { joy.id = t.identifier; joy.cx = t.clientX; joy.cy = t.clientY; jb.style.left = (t.clientX - 60) + 'px'; jb.style.top = (t.clientY - 60) + 'px'; jb.style.bottom = 'auto'; } else if (look.id === null) { look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY; } } }, {passive: true});
  addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { let dx = t.clientX - joy.cx, dy = t.clientY - joy.cy; const l = Math.hypot(dx, dy); if (l > 50) dx *= 50 / l, dy *= 50 / l; joy.x = dx / 50; joy.y = dy / 50; kn.style.left = (40 + dx) + 'px'; kn.style.top = (40 + dy) + 'px'; } else if (t.identifier === look.id) { P.yaw -= (t.clientX - look.lx) * .005; P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - (t.clientY - look.ly) * .005)); look.lx = t.clientX; look.ly = t.clientY; } } }, {passive: true});
  addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; kn.style.left = kn.style.top = '40px'; } if (t.identifier === look.id) look.id = null; } });
  $('tRun').ontouchstart = e => { running = !running; $('tRun').style.background = running ? '#c9a43a88' : '#0005'; };
  $('tJump').ontouchstart = () => { if (P.onGround) P.vy = 4.6; };
}
function collide(nx, nz) {
  const pr = .35;
  for (const list of colliders.values()) for (const c of list) {
    const dx = nx - c.x, dz = nz - c.z; if (Math.abs(dx) > c.hx + c.hz + 2 && Math.abs(dz) > c.hx + c.hz + 2) continue;
    let lx = dx * c.c - dz * c.s, lz = dx * c.s + dz * c.c; // в локальные
    const ex = c.hx + pr - Math.abs(lx), ez = c.hz + pr - Math.abs(lz);
    if (ex > 0 && ez > 0) { if (ex < ez) lx += Math.sign(lx) * ex; else lz += Math.sign(lz) * ez; nx = c.x + lx * c.c + lz * c.s; nz = c.z - lx * c.s + lz * c.c; }
  }
  return [nx, nz];
}

// ---------- звук ----------
let AC = null, windG;
function initAudio() {
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const n = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = n.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3; }
  const s = AC.createBufferSource(); s.buffer = n; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; windG = AC.createGain(); windG.gain.value = .25; s.connect(f).connect(windG).connect(AC.destination); s.start();
}
function blip(freqs, dur, type = 'sine', vol = .15) { if (!AC) return; freqs.forEach((fq, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = fq; const t = AC.currentTime + i * .07; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .05); }); }
let carHum = 0;
function horn() { blip([392, 370], .9, 'sawtooth', .12); }
function hitSound() { if (!AC) return; const b = AC.createBuffer(1, AC.sampleRate * .6, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const s = AC.createBufferSource(); s.buffer = b; const g = AC.createGain(); g.gain.value = .8; s.connect(g).connect(AC.destination); s.start(); }

// ---------- HUD ----------
const coinsEl = $('coins'); coinsEl.textContent = money;
let toastT = 0; function toast(t) { $('toast').innerHTML = t; $('toast').style.opacity = 1; toastT = 1.6; }
function save() { try { localStorage.setItem('tropa_money', money); } catch (e) {} }

// ---------- смерть на трассе ----------
let hitCar = null;
function onRoad(z) { return z > ROAD0 + .3 && z < ROAD1 - .3; }
function killCheck(dt) {
  if (dead) return;
  if (onRoad(P.z)) {
    if (!hitCar) { // «по игре» машина появляется сразу
      const lane = P.z < (LANE_Z[0] + LANE_Z[1]) / 2 ? 0 : 1, c = cars.find(c => c.lane === lane) || cars[0];
      const dir = lane === 0 ? -1 : 1; c.x = P.x - dir * 38; c.v = 34; c.lane = lane; hitCar = c; horn();
    }
    const c = hitCar; if (Math.abs(c.x - P.x) < c.len / 2 + 1.2 && Math.abs(LANE_Z[c.lane] - P.z) < 3.5) die();
  } else hitCar = null;
}
function die() {
  dead = 2.6; hitSound(); const f = $('fade'); f.style.transition = 'none'; f.style.opacity = 1; f.innerHTML = 'Тебя сбила машина.<br><span style="font-size:15px;color:#bbb">Начинаешь сначала.</span>';
}

// ---------- цикл ----------
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let started = false, last = performance.now(), bob = 0, clock = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
  if (started && !dead) {
    let fx = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - joy.y, sx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
    const l = Math.hypot(fx, sx); if (l > 1) fx /= l, sx /= l;
    const sp = (keys.ShiftLeft || running ? 6.5 : 3.2);
    const fwx = -Math.sin(P.yaw), fwz = -Math.cos(P.yaw);
    let nx = P.x + (fwx * fx - fwz * sx) * sp * dt, nz = P.z + (fwz * fx + fwx * sx) * sp * dt;
    [nx, nz] = collide(nx, nz); P.x = nx; P.z = nz;
    P.vy -= 12 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.onGround = true; } else P.onGround = false;
    if (l > .1 && P.onGround) bob += dt * sp * 2.1;
    killCheck(dt);
    // монеты
    for (let i = coinsLive.length - 1; i >= 0; i--) {
      const c = coinsLive[i], t = taken.get(c.id);
      const vis = t === undefined || clock - t > RESPAWN; if (vis && t !== undefined) taken.delete(c.id);
      c.obj.visible = vis; if (!vis) continue;
      if (c.type === 0) c.obj.rotation.y += dt * 2.5; c.obj.position.y = (c.type === 0 ? .45 : 0) + (c.type === 0 ? Math.sin(clock * 2 + i) * .05 : 0);
      if (Math.hypot(c.x - P.x, c.z - P.z) < 1.1) { const T = COIN_TYPES[c.type]; money += T.v; taken.set(c.id, clock); coinsEl.textContent = money; save(); toast(`${T.n} <b style="color:#ffd35a">+${T.v}</b>`); blip(c.type === 2 ? [880, 1175, 1568] : c.type === 1 ? [988, 1319] : [1319], .25, 'triangle', .12); }
    }
  }
  if (dead) { dead -= dt; if (dead <= 0) { dead = 0; P.x = SPAWN.x; P.z = SPAWN.z; P.y = 0; P.yaw = -Math.PI / 2 + .25; P.pitch = 0; hitCar = null; const f = $('fade'); f.style.transition = 'opacity 1.2s'; f.style.opacity = 0; f.innerHTML = ''; } }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  updateCars(dt, P.x);
  updateChunks(P.x, P.z);
  ground.position.set(Math.floor(P.x / 7) * 7, 0, Math.floor(P.z / 7) * 7);
  for (const s of [pathS, shoulder, shoulder2, roadS]) s.follow(P.x);
  camera.position.set(P.x, P.y + 1.65 + Math.sin(bob) * .04, P.z);
  camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
  sun.position.set(P.x + 30, 60, P.z + 20); sun.target.position.set(P.x, 0, P.z);
  if (windG) { let near = 1e9; for (const c of cars) near = Math.min(near, Math.hypot(c.x - P.x, LANE_Z[c.lane] - P.z)); windG.gain.value = .2 + Math.max(0, 1 - near / 60) * .5; }
  renderer.render(scene, camera);
}
updateChunks(0, 0);
requestAnimationFrame(frame);
$('play').onclick = () => { started = true; $('start').style.display = 'none'; if (!AC) initAudio(); if (!MOBILE) renderer.domElement.requestPointerLock(); };
$('back').onclick = () => { location.href = 'index.html'; };
window.__tropa = {strips: () => [pathS, roadS].map(s => [s.m.position.toArray(), s.m.visible, s.m.material.map.image && s.m.material.map.image.width, s.m.geometry.attributes.position.array.slice(0,6)]), P, tp(x, z, yaw) { P.x = x; P.z = z; if (yaw !== undefined) P.yaw = yaw; }, coins: () => coinsLive.map(c => [c.x, c.z, c.type]), start() { $('play').onclick(); }, money: () => money};
