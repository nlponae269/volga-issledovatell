// ===================== ТРОПА: ядро, текстуры, материалы =====================
const $ = (id) => document.getElementById(id);
const MOBILE = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
const Q = {
  shadows: !MOBILE, ssao: !MOBILE, grass: MOBILE ? 9000 : 34000, R: MOBILE ? 1 : 2,
  pr: MOBILE ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 1.5), msaa: MOBILE ? 0 : 4, fogSteps: MOBILE ? 5 : 9,
};
const TEST = location.hash.includes('test');
if (['shkola', 'bolnica', 'magazin'].includes(window.WORLD)) { Q.R = 1; Q.grass = 16; Q.fogSteps = MOBILE ? 4 : 6; }
if (['metro'].includes(window.WORLD)) { Q.R = 0; Q.grass = 16; Q.fogSteps = MOBILE ? 4 : 6; }
if (window.WORLD === 'pole') { Q.grass = MOBILE ? 14000 : 46000; }
if (window.WORLD === 'podezd') { Q.R = 0; Q.grass = 16; Q.fogSteps = MOBILE ? 4 : 6; }
if (window.WORLD === 'dvory') { Q.grass = MOBILE ? 4000 : 12000; }
if (window.WORLD === 'dom') { Q.R = 1; Q.grass = MOBILE ? 3000 : 8000; Q.fogSteps = MOBILE ? 4 : 6; }
if (TEST) { const m = location.hash.match(/R=(\d)/); Q.R = m ? +m[1] : 1; Q.grass = 12000; Q.msaa = 0; Q.pr = 1; }
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: TEST });
renderer.setPixelRatio(Q.pr);
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = Q.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function ihash(a, b, c = 0) { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi; const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(ihash(xi, zi), ihash(xi + 1, zi), u), lerp(ihash(xi, zi + 1), ihash(xi + 1, zi + 1), u), v); }

// --- общая геометрия мира (дублируется в GLSL ниже) ---
const WORLD = window.WORLD || 'tropa';          // 'tropa' | 'vorota'
const GARDEN = WORLD === 'vorota';
const HOUSE = WORLD === 'dom';
const PODEZD = WORLD === 'podezd';
const GRID = ['dom', 'shkola', 'bolnica', 'magazin'].includes(WORLD);   // мир-сетка комнат
const METRO = WORLD === 'metro', TRAIN = WORLD === 'elektrichka', STROY = WORLD === 'stroyka';
const DVOR = WORLD === 'dvory', ZIMA = WORLD === 'zima';
const SNOW = ZIMA;
const NIGHT = WORLD === 'lager', BEACH = WORLD === 'plyazh', FIELD = WORLD === 'pole', BUS = WORLD === 'ostanovka';
const INDOOR = GRID || PODEZD || METRO;                                 // тёмный интерьер: фонарик, лампы, тёмный туман
const DARK = INDOOR || NIGHT || SNOW;
const ROADW = WORLD === 'tropa' || BUS;
const PATH_ON = ['tropa', 'vorota', 'lager', 'pole', 'elektrichka'].includes(WORLD);
const ROAD_C = ROADW ? -35 : -100000, ROAD_HW = 5;   // трасса: z ∈ [-40,-30]
const FENCE = 44;
// «Дворы»: дороги по линиям x,z = 48 + 96k; расстояние до оси ближайшей дороги
function dvRoadD(x, z) { const u = ((x - 48) % 96 + 96) % 96, v = ((z - 48) % 96 + 96) % 96; return Math.min(Math.min(u, 96 - u), Math.min(v, 96 - v)); }
// внутриквартальный проезд: вдоль x, на 12 м южнее центра квартала
function dvDriveD(x, z) { return Math.abs((((z - 48) % 96) + 96) % 96 - 36); }
let SPAWN = null;
// Far Lands: геометрия мира хранится в 32-битных числах; после 16 777 216 м в них не остаётся места даже для целых метров.
// Это и есть край мира: дальше чанки не создаются. Режим просто переносит игрока к самому краю.
const WLIM = 16777216;
const FAR = (() => { try { return localStorage.getItem('farlands') === '1'; } catch (e) { return false; } })();
function inWorld(a0, a1) { return a0 >= -WLIM && a1 <= WLIM; }
// отражения в лужах (мир «Дворы»): сцена дополнительно рисуется зеркальной камерой в небольшую текстуру
const REFL = { tex: { value: null }, res: { value: new THREE.Vector2(1, 1) }, on: { value: 0 }, use: DVOR, rt: null, hide: [] };
const GROUND_Y = HOUSE ? -6 : STROY ? -42 : 0;                     // в «Доме» земля — во дворах-колодцах, на 6 м ниже пола                                      // забор участка (мир «Ворота»): z = ±44
// грядки: клетки 24×16 м, детерминированный узор (одинаковый в JS и GLSL)
function bedM(x, z) {
  if (!GARDEN) return 0;
  const i = Math.floor(x / 24), j = Math.floor(z / 16); if ((((i * 7 + j * 3) % 5) + 5) % 5 >= 2) return 0;
  const lx = x - i * 24, lz = z - j * 16; if (lx < 2 || lx > 22 || lz < 1.5 || lz > 14.5) return 0;
  if ((((lz - 1.5) % 2.2) + 2.2) % 2.2 > 1.3) return 0;
  if (Math.abs(z - pathC(x)) < 4 || Math.abs(z) > FENCE - 3) return 0; return 1;
}
function pathC(x) { if (TRAIN) return 0; return 2.2 * Math.sin(x * 0.011) + 0.9 * Math.sin(x * 0.037 + 1.3); }
function groundH(x, z) {
  if (INDOOR || STROY || TRAIN || DVOR) return 0;
  if (BEACH) { const sh = -9 + 2.5 * Math.sin(x * 0.017) + 1.2 * Math.sin(x * 0.051 + 1.0); return 0.12 * Math.sin(x * 0.07 + z * 0.05) + 0.08 * Math.sin(x * 0.19 - z * 0.13) + Math.min(0, z - sh + 3) * 0.09 + Math.max(0, z - 20) * 0.02; }
  let h = 0.22 * Math.sin(x * 0.061 + z * 0.043) + 0.15 * Math.sin(x * 0.137 - z * 0.089 + 2.0) + 0.08 * Math.sin(x * 0.29 + z * 0.31);
  const dp = Math.abs(z - pathC(x)); const pf = smooth(1.4, 3.6, dp); h = h * pf - 0.05 * (1 - pf);
  const rd = Math.abs(z - ROAD_C); h = lerp(0.28, h, smooth(ROAD_HW + 0.6, ROAD_HW + 4.0, rd));
  return h;
}
const GLSL_WORLD = `
float pathC(float x){ ${TRAIN ? 'return 0.0;' : ''} return 2.2*sin(x*0.011)+0.9*sin(x*0.037+1.3); }
float groundH(vec2 p){
  ${INDOOR || STROY || TRAIN || DVOR ? 'return 0.0;' : ''}
  ${BEACH ? 'float sh = -9.0 + 2.5*sin(p.x*0.017) + 1.2*sin(p.x*0.051+1.0); return 0.12*sin(p.x*0.07+p.y*0.05) + 0.08*sin(p.x*0.19-p.y*0.13) + min(0.0, p.y-sh+3.0)*0.09 + max(0.0, p.y-20.0)*0.02;' : ''}
  float h=0.22*sin(p.x*0.061+p.y*0.043)+0.15*sin(p.x*0.137-p.y*0.089+2.0)+0.08*sin(p.x*0.29+p.y*0.31);
  float dp=abs(p.y-pathC(p.x)); float pf=smoothstep(1.4,3.6,dp); h=h*pf-0.05*(1.0-pf);
  float rd=abs(p.y-(${ROAD_C.toFixed(1)})); h=mix(0.28,h,smoothstep(${(ROAD_HW + 0.6).toFixed(1)},${(ROAD_HW + 4.0).toFixed(1)},rd));
  return h;
}
float bedM(vec2 p){
  ${GARDEN ? `float i=floor(p.x/24.0), j=floor(p.y/16.0);
  if (mod(i*7.0+j*3.0, 5.0) >= 2.0) return 0.0;
  float lx=p.x-i*24.0, lz=p.y-j*16.0;
  if (lx<2.0||lx>22.0||lz<1.5||lz>14.5) return 0.0;
  if (mod(lz-1.5, 2.2) > 1.3) return 0.0;
  if (abs(p.y-pathC(p.x))<4.0 || abs(p.y)>${(FENCE - 3).toFixed(1)}) return 0.0;
  return 1.0;` : 'return 0.0;'}
}`;

// ---------------- текстуры ----------------
function mkCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); return c; }
function texFrom(c, srgb = true, rep = null) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAXANI; if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
// карта нормалей из карты высот (тайлится)
function normalFromHeight(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  return mkCanvas(w, h, (g) => {
    const out = g.createImageData(w, h), d = out.data, H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
  });
}
// тайлящийся «шум-штамп»: рисует фигуру с обёрткой по краям
function wrapDraw(g, w, h, x, y, s, fn) { for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) if (x + ox > -s && x + ox < w + s && y + oy > -s && y + oy < h + s) fn(x + ox, y + oy); }

const texLoader = new THREE.TextureLoader();
function loadTex(src, srgb) { const t = texLoader.load(src); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAXANI; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
const TX = { leaves: loadTex(TEXDATA.leaves, true), leavesN: loadTex(TEXDATA.leavesN, false), bark: loadTex(TEXDATA.bark, true), barkN: loadTex(TEXDATA.barkN, false) };

// шумовая текстура RGBA (тайлящийся fbm в 4 каналах)
TX.noise = (() => {
  const S = 256, data = new Uint8Array(S * S * 4);
  const per = (x, y, p, seed) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const hh = (a, b) => ihash(((a % p) + p) % p, ((b % p) + p) % p, seed);
    return lerp(lerp(hh(xi, yi), hh(xi + 1, yi), u), lerp(hh(xi, yi + 1), hh(xi + 1, yi + 1), u), v); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (let c = 0; c < 4; c++) {
    let a = 0, amp = 0.5, f = 4 * (c + 1), sum = 0;
    for (let o = 0; o < 5; o++) { a += per(x / S * f, y / S * f, f, c * 17 + o) * amp; sum += amp; amp *= 0.5; f *= 2; }
    data[(y * S + x) * 4 + c] = clamp((a / sum - 0.5) * 1.7 + 0.5, 0, 1) * 255;
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
})();

const R0 = rng(12345);
// трава для земли (вид сверху): плотные короткие травинки, сухие и зелёные
TX.grass = texFrom(mkCanvas(1024, 1024, (g, w, h) => {
  g.fillStyle = '#56643a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const x = R0() * w, y = R0() * h, s = 30 + R0() * 90; wrapDraw(g, w, h, x, y, s, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, s); const c = ['rgba(110,118,62,', 'rgba(74,90,44,', 'rgba(128,118,72,', 'rgba(92,100,50,'][i % 4]; gr.addColorStop(0, c + '0.55)'); gr.addColorStop(1, c + '0)'); g.fillStyle = gr; g.fillRect(X - s, Y - s, s * 2, s * 2); }); }
  g.lineCap = 'round';
  for (let i = 0; i < 52000; i++) {
    const x = R0() * w, y = R0() * h, a = R0() * 6.283, l = 3 + R0() * 9; const dry = R0() < 0.3;
    const v = 0.6 + R0() * 0.6; g.strokeStyle = dry ? `rgba(${170 * v | 0},${150 * v | 0},${88 * v | 0},0.9)` : `rgba(${(70 + R0() * 40) * v | 0},${(100 + R0() * 40) * v | 0},${(42 + R0() * 20) * v | 0},0.9)`;
    g.lineWidth = 0.8 + R0() * 1.2; wrapDraw(g, w, h, x, y, 12, (X, Y) => { g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l); g.stroke(); });
  }
  for (let i = 0; i < 2600; i++) { const x = R0() * w, y = R0() * h; g.fillStyle = `rgba(30,32,18,${0.25 + R0() * 0.3})`; g.fillRect(x, y, 1.5, 1.5); }
}));
// песок/утоптанная грунтовка
const sandH = mkCanvas(1024, 1024, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90000; i++) { const v = 90 + R0() * 80 | 0; g.fillStyle = `rgb(${v},${v},${v})`; const s = 1 + R0() * 2; g.fillRect(R0() * w, R0() * h, s, s); }
  for (let i = 0; i < 900; i++) { const x = R0() * w, y = R0() * h, s = 2 + R0() * 7; wrapDraw(g, w, h, x, y, s, (X, Y) => { g.fillStyle = `rgb(${170 + R0() * 60 | 0},${170},${170})`; g.beginPath(); g.ellipse(X, Y, s, s * (0.5 + R0() * 0.4), R0() * 3, 0, 6.28); g.fill(); }); }
});
TX.sandN = texFrom(normalFromHeight(sandH, 3.5), false);
TX.sand = texFrom(mkCanvas(1024, 1024, (g, w, h) => {
  g.fillStyle = '#c4b08c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) { const x = R0() * w, y = R0() * h, s = 30 + R0() * 120; wrapDraw(g, w, h, x, y, s, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, s); const c = ['rgba(150,135,108,', 'rgba(200,188,160,', 'rgba(120,108,88,', 'rgba(176,160,128,'][i % 4]; gr.addColorStop(0, c + '0.5)'); gr.addColorStop(1, c + '0)'); g.fillStyle = gr; g.fillRect(X - s, Y - s, s * 2, s * 2); }); }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.45; g.drawImage(sandH, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 1400; i++) { const x = R0() * w, y = R0() * h, s = 1.5 + R0() * 5; const v = R0(); g.fillStyle = v < 0.5 ? `rgba(${130 + R0() * 50 | 0},${118 + R0() * 45 | 0},${98 + R0() * 35 | 0},0.7)` : `rgba(${196 + R0() * 25 | 0},${184 + R0() * 25 | 0},${160 + R0() * 25 | 0},0.6)`; g.beginPath(); g.ellipse(x, y, s, s * 0.7, R0() * 3, 0, 6.28); g.fill(); }
}));
// асфальт
const asphH = mkCanvas(512, 512, (g, w, h) => {
  g.fillStyle = '#777'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40000; i++) { const v = 60 + R0() * 140 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(R0() * w, R0() * h, 1 + R0() * 2.5, 1 + R0() * 2.5); }
  g.strokeStyle = '#222'; g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) { let x = R0() * w, y = R0() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 14; k++) { x += (R0() - 0.5) * 40; y += (R0() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); }
});
TX.asphN = texFrom(normalFromHeight(asphH, 2.5), false);
TX.asph = texFrom(mkCanvas(512, 512, (g, w, h) => { g.fillStyle = '#4b4d4f'; g.fillRect(0, 0, w, h); g.globalAlpha = 0.5; g.drawImage(asphH, 0, 0); g.globalAlpha = 1;
  for (let i = 0; i < 30; i++) { const x = R0() * w, y = R0() * h, s = 20 + R0() * 60; wrapDraw(g, w, h, x, y, s, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, s); gr.addColorStop(0, R0() < 0.5 ? 'rgba(30,30,32,0.35)' : 'rgba(120,120,118,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - s, Y - s, s * 2, s * 2); }); } }));

// шифер (асбестоцемент): волна вдоль U, ширина листа 1.13 м, высота 1.75 м
const slateH = mkCanvas(512, 512, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.5 + 0.5 * Math.sin(x / w * Math.PI * 2 * 7); g.fillStyle = `rgb(${v * 255 | 0},0,0)`; g.fillRect(x, 0, 1, h); } });
TX.slateN = texFrom(normalFromHeight(slateH, 7), false);
TX.slate = texFrom(mkCanvas(512, 512, (g, w, h) => {
  g.fillStyle = '#c4c6c2'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x++) { const v = Math.sin(x / w * Math.PI * 2 * 7); g.fillStyle = v > 0 ? `rgba(255,255,255,${v * 0.12})` : `rgba(0,0,0,${-v * 0.12})`; g.fillRect(x, 0, 1, h); }
  for (let i = 0; i < 160; i++) { const x = R0() * w, y = R0() * h, s = 6 + R0() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, s); const c = R0() < 0.45 ? 'rgba(96,98,70,' : R0() < 0.5 ? 'rgba(70,70,66,' : 'rgba(150,130,90,'; gr.addColorStop(0, c + (0.15 + R0() * 0.3) + ')'); gr.addColorStop(1, c + '0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
  for (let i = 0; i < 90; i++) { const x = R0() * w, y = R0() * h * 0.6, l = 40 + R0() * 200; const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, 'rgba(60,58,52,0.22)'); gr.addColorStop(1, 'rgba(60,58,52,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + R0() * 7, l); }
  for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(${R0() < 0.5 ? '210,200,120' : '90,100,60'},${0.3 + R0() * 0.4})`; g.beginPath(); g.arc(R0() * w, R0() * h, 0.8 + R0() * 2.5, 0, 6.28); g.fill(); }
  g.fillStyle = 'rgba(40,40,38,0.35)'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
}));
// профнастил (трапеция), цвет задаётся цветом вершин
const profH = mkCanvas(256, 256, (g, w, h) => { for (let x = 0; x < w; x++) { const p = (x / w * 5) % 1; const v = p < 0.2 ? 0 : p < 0.32 ? (p - 0.2) / 0.12 : p < 0.68 ? 1 : p < 0.8 ? 1 - (p - 0.68) / 0.12 : 0; g.fillStyle = `rgb(${v * 255 | 0},0,0)`; g.fillRect(x, 0, 1, h); } });
TX.profN = texFrom(normalFromHeight(profH, 6), false);
TX.prof = texFrom(mkCanvas(256, 256, (g, w, h) => {
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x++) { const p = (x / w * 5) % 1; if ((p > 0.2 && p < 0.32) || (p > 0.68 && p < 0.8)) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x, 0, 1, h); } }
  for (let i = 0; i < 40; i++) { const x = R0() * w, y = R0() * h, l = 20 + R0() * 120; const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, 'rgba(110,60,30,0.35)'); gr.addColorStop(1, 'rgba(110,60,30,0)'); g.fillStyle = gr; g.fillRect(x, y, 1.5 + R0() * 3, l); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${R0() < 0.6 ? '255,255,255' : '40,30,20'},${0.08 + R0() * 0.15})`; g.fillRect(R0() * w, R0() * h, 1 + R0() * 6, 0.6); }
}));
// силикатный кирпич (250×65 + шов 10 мм); тайл 1.04 × 1.05 м
const brickH = mkCanvas(512, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const rh = h / 14, bw = w / 4;
  for (let r = 0; r < 14; r++) for (let b = -1; b < 5; b++) { const x = b * bw + (r % 2) * bw / 2; const v = 200 + R0() * 55 | 0; g.fillStyle = `rgb(${v},0,0)`; g.fillRect(x + 2.5, r * rh + 2.5, bw - 5, rh - 5); } });
TX.brickN = texFrom(normalFromHeight(brickH, 2.2), false);
TX.brick = texFrom(mkCanvas(512, 512, (g, w, h) => {
  g.fillStyle = '#8d8a80'; g.fillRect(0, 0, w, h); const rh = h / 14, bw = w / 4;
  for (let r = 0; r < 14; r++) for (let b = -1; b < 5; b++) { const x = b * bw + (r % 2) * bw / 2; const v = R0(); const base = [218 + v * 22, 212 + v * 20, 192 + v * 18]; g.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`; g.fillRect(x + 2.5, r * rh + 2.5, bw - 5, rh - 5);
    for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(${R0() < 0.5 ? '120,115,100' : '255,255,245'},${0.1 + R0() * 0.2})`; g.fillRect(x + 3 + R0() * (bw - 8), r * rh + 3 + R0() * (rh - 7), 1 + R0() * 2, 1 + R0() * 2); } }
  for (let i = 0; i < 40; i++) { const x = R0() * w, y = R0() * h, s = 20 + R0() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, `rgba(${R0() < 0.5 ? '90,85,70' : '150,130,90'},0.18)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
}));
// доски (вертикальные, серые от времени): тайл 1.2 × 2.4 м
const plankH = mkCanvas(256, 512, (g, w, h) => { const bw = w / 8; for (let b = 0; b < 8; b++) { g.fillStyle = `rgb(${150 + R0() * 60 | 0},0,0)`; g.fillRect(b * bw + 1, 0, bw - 2, h); for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(0,0,0,${0.2 + R0() * 0.3})`; g.fillRect(b * bw + 2 + R0() * (bw - 4), R0() * h, 0.7, 10 + R0() * 60); } } });
TX.plankN = texFrom(normalFromHeight(plankH, 2.5), false);
TX.plank = texFrom(mkCanvas(256, 512, (g, w, h) => { const bw = w / 8;
  for (let b = 0; b < 8; b++) { const v = R0(); g.fillStyle = `rgb(${100 + v * 30 | 0},${96 + v * 26 | 0},${86 + v * 20 | 0})`; g.fillRect(b * bw, 0, bw, h); for (let k = 0; k < 50; k++) { g.fillStyle = `rgba(${R0() < 0.5 ? '60,55,48' : '150,145,130'},${0.15 + R0() * 0.3})`; g.fillRect(b * bw + 1 + R0() * (bw - 2), R0() * h, 0.6 + R0(), 8 + R0() * 50); } g.fillStyle = '#2a261f'; g.fillRect(b * bw, 0, 1.3, h); }
  for (let i = 0; i < 20; i++) { const x = R0() * w, y = R0() * h, s = 10 + R0() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(60,70,40,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
}));
// бетон
const concH = mkCanvas(256, 256, (g, w, h) => { g.fillStyle = '#888'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 90 + R0() * 100 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(R0() * w, R0() * h, 1 + R0() * 2, 1 + R0() * 2); } for (let i = 0; i < 60; i++) { g.fillStyle = '#333'; g.beginPath(); g.arc(R0() * w, R0() * h, 0.7 + R0() * 1.6, 0, 6.28); g.fill(); } });
TX.concN = texFrom(normalFromHeight(concH, 1.6), false);
TX.conc = texFrom(mkCanvas(256, 256, (g, w, h) => { g.fillStyle = '#9c9a94'; g.fillRect(0, 0, w, h); g.globalAlpha = 0.35; g.drawImage(concH, 0, 0); g.globalAlpha = 1;
  for (let i = 0; i < 25; i++) { const x = R0() * w, y = R0() * h, s = 15 + R0() * 50; wrapDraw(g, w, h, x, y, s, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, s); gr.addColorStop(0, `rgba(${R0() < 0.5 ? '70,72,60' : '170,165,150'},0.3)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - s, Y - s, s * 2, s * 2); }); } }));

// атласы листвы (карточки с веточками)
function leafAtlas(cols, n, shape) {
  return texFrom(mkCanvas(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = rng(n * 31 + 7);
    g.strokeStyle = 'rgba(70,58,40,1)'; g.lineWidth = 3; g.lineCap = 'round';
    const twigs = [];
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2; const x0 = w / 2 + (r() - 0.5) * 60, y0 = h * 0.92; const L = 160 + r() * 200; const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (r() - 0.5) * 60, (y0 + y1) / 2, x1, y1); g.stroke(); twigs.push([x0, y0, x1, y1]); }
    for (let i = 0; i < n; i++) {
      const t = twigs[(r() * twigs.length) | 0], k = 0.25 + r() * 0.8; const x = lerp(t[0], t[2], k) + (r() - 0.5) * 70, y = lerp(t[1], t[3], k) + (r() - 0.5) * 70;
      if (x < 22 || x > w - 22 || y < 22 || y > h - 22) continue;
      const c = cols[(r() * cols.length) | 0], s = shape * (0.7 + r() * 0.6), a = r() * 6.28, v = 0.75 + r() * 0.4;
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = `rgb(${c[0] * v | 0},${c[1] * v | 0},${c[2] * v | 0})`;
      g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * 0.75, -s * 0.55, s * 0.6, s * 0.5, 0, s * 0.8); g.bezierCurveTo(-s * 0.6, s * 0.5, -s * 0.75, -s * 0.55, 0, -s); g.fill();
      g.strokeStyle = `rgba(0,0,0,0.25)`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -s * 0.9); g.lineTo(0, s * 0.75); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.ellipse(-s * 0.2, -s * 0.2, s * 0.25, s * 0.5, 0, 0, 6.28); g.fill();
      g.restore();
    }
  }));
}
TX.leafPoplar = leafAtlas([[78, 96, 46], [96, 110, 52], [66, 84, 40], [120, 122, 58], [150, 140, 60], [178, 160, 70]], 260, 15);
TX.leafAutumn = leafAtlas([[196, 160, 70], [176, 130, 52], [150, 110, 50], [206, 178, 90], [130, 120, 60], [160, 96, 46], [112, 104, 54]], 200, 17);
TX.leafOlive = leafAtlas([[110, 116, 56], [130, 128, 60], [92, 100, 48], [160, 146, 66], [120, 96, 50]], 230, 16);
// пучок травы для инстансов
TX.blades = texFrom(mkCanvas(256, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); const r = rng(99);
  for (let i = 0; i < 70; i++) { const x0 = 10 + r() * (w - 20), L = h * (0.35 + r() * 0.62), bend = (r() - 0.5) * 70, wd = 2 + r() * 3.5; const dry = r() < 0.32; const v = 0.75 + r() * 0.4;
    g.fillStyle = dry ? `rgb(${178 * v | 0},${160 * v | 0},${98 * v | 0})` : `rgb(${(92 + r() * 40) * v | 0},${(118 + r() * 40) * v | 0},${(52 + r() * 20) * v | 0})`;
    g.beginPath(); g.moveTo(x0 - wd, h); g.quadraticCurveTo(x0 - wd * 0.5 + bend * 0.4, h - L * 0.5, x0 + bend, h - L); g.quadraticCurveTo(x0 + wd * 0.5 + bend * 0.4, h - L * 0.5, x0 + wd, h); g.fill(); }
}));
// решётка пешеходного ограждения (секция 2.5 м)
TX.lattice = texFrom(mkCanvas(512, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineCap = 'square';
  g.lineWidth = 8; g.strokeRect(4, 8, w - 8, h - 30); g.lineWidth = 2.5;
  for (let x = -h; x < w + h; x += 22) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + (h - 30), h - 22); g.stroke(); g.beginPath(); g.moveTo(x + (h - 30), 8); g.lineTo(x, h - 22); g.stroke(); }
  g.fillStyle = '#fff'; g.fillRect(0, h - 26, 14, 26); g.fillRect(w - 14, h - 26, 14, 26);
}));
// сетка-рабица
TX.chain = texFrom(mkCanvas(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 3; for (let x = -w; x < w * 2; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); } }));

// ---------------- материалы ----------------
const SHARED = { uTime: { value: 0 } };
function rep(mat, sx, sy) { for (const k of ['map', 'normalMap', 'roughnessMap']) if (mat[k]) { mat[k] = mat[k].clone(); mat[k].repeat.set(1 / sx, 1 / sy); mat[k].needsUpdate = true; } return mat; }
function std(o) { return new THREE.MeshStandardMaterial(o); }
// листва: без переворота нормали на изнанке + ветер
function patchFoliage(mat, leafy) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = SHARED.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { float hh = max(position.y, 0.0); vec3 ip = vec3(0.0);
          #ifdef USE_INSTANCING
            ip = instanceMatrix[3].xyz;
          #endif
          float ph = dot(ip.xz, vec2(0.13, 0.17));
          float sw = sin(uTime * 1.1 + ph) * 0.6 + sin(uTime * 2.3 + ph * 1.7) * 0.4;
          transformed.x += sw * 0.006 * hh * hh * 0.25; transformed.z += cos(uTime * 0.9 + ph) * 0.004 * hh * hh * 0.25;
          ${leafy ? 'transformed += vec3(sin(uTime*6.0+position.x*4.0+position.y*3.0), sin(uTime*5.0+position.z*4.0)*0.6, cos(uTime*6.5+position.z*3.0+position.y*2.0))*0.025;' : ''} }`);
    if (leafy) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''));
  };
  return mat;
}
const M = {
  bark: patchFoliage(rep(std({ map: TX.bark, normalMap: TX.barkN, normalScale: new THREE.Vector2(1.2, 1.2), vertexColors: true, roughness: 0.95 }), 0.9, 1.4), false),
  leafPoplar: patchFoliage(std({ map: TX.leafPoplar, alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true, roughness: 0.8 }), true),
  leafAutumn: patchFoliage(std({ map: TX.leafAutumn, alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true, roughness: 0.85 }), true),
  leafOlive: patchFoliage(std({ map: TX.leafOlive, alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true, roughness: 0.85 }), true),
  slate: rep(std({ map: TX.slate, normalMap: TX.slateN, normalScale: new THREE.Vector2(1.4, 1.4), vertexColors: true, roughness: 0.92 }), 1.13, 1.75),
  prof: rep(std({ map: TX.prof, normalMap: TX.profN, normalScale: new THREE.Vector2(1.6, 1.6), vertexColors: true, roughness: 0.5, metalness: 0.55 }), 1.0, 1.0),
  brick: rep(std({ map: TX.brick, normalMap: TX.brickN, normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true, roughness: 0.93 }), 1.04, 1.05),
  plank: rep(std({ map: TX.plank, normalMap: TX.plankN, normalScale: new THREE.Vector2(1.3, 1.3), vertexColors: true, roughness: 0.95 }), 1.2, 2.4),
  conc: rep(std({ map: TX.conc, normalMap: TX.concN, vertexColors: true, roughness: 0.97 }), 2, 2),
  paint: std({ vertexColors: true, roughness: 0.72 }),
  metal: std({ vertexColors: true, roughness: 0.42, metalness: 0.85 }),
  glass: std({ color: 0x0c1014, roughness: 0.06, metalness: 0.9, envMapIntensity: 1.4 }),
  rubber: std({ color: 0x1a1a1a, roughness: 0.9 }),
  lattice: std({ map: TX.lattice, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xb4b8bb, roughness: 0.4, metalness: 0.7 }),
  chain: rep(std({ map: TX.chain, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x7c7f80, roughness: 0.5, metalness: 0.7 }), 0.45, 0.45),
  wire: new THREE.LineBasicMaterial({ color: 0x1d1d1d }),
};
M.lattice.map.repeat.set(1 / 2.5, 1 / 1.2);
M.film = std({ color: 0xdfe6e8, roughness: 0.35, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
M.fruit = patchFoliage(std({ vertexColors: true, roughness: 0.42 }), false);
M.berry = std({ vertexColors: true, roughness: 0.55 });
