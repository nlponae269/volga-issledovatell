// ===================== ДВОРЫ: 01.01.2017, 00:24 =====================
// Сюжет: в 00:24 ты вышел во двор посмотреть салют, дверь подъезда хлопнула — и время остановилось.
const DV_LORE = [
  'С Новым 2017 годом! Счастья, здоровья, и чтобы всё было как раньше.<br><i>— Баба Валя</i><br><br><span style="font-size:14px">На обороте детской рукой: «не уходи далеко от подъезда».</span>',
  'Если ты читаешь это — значит, ты опять вышел в 00:24.<br>Ты выходишь каждый раз.<br>И каждый раз не помнишь.',
  'Часы здесь не идут. Двадцать четыре минуты первого — навсегда.<br>Салют не кончается, потому что ты не хочешь, чтобы он кончался.',
  'Помнишь, как пахло на лестнице? Мандарины, бенгальские огни, холод из-под двери.<br>Это последний раз, когда всё было целым.',
  'Весной вы переехали. Двор никуда не делся — это ты ушёл.<br>А кусок тебя так и стоит у подъезда в куртке нараспашку.',
  'Тропа, дача, школа, лагерь, электричка — всё это отсюда.<br>Каждое место, куда ты так и не вернулся, прячет ключ.',
  'Подъезды открываются не все.<br>Те, что открыты, ведут не домой.',
  'Не стой на дороге. Машины здесь не тормозят —<br>им тоже надо успеть домой до 00:25.',
  'В каждом окне кто-то празднует.<br>Ни в одном окне нет тебя.',
  'Один ключ — здесь, во дворах.<br>Ищи настоящую ёлку с гирляндой. Встань спиной к своему подъезду: два квартала влево и один квартал назад.',
  'Бабушкины ворота на даче — единственная дверь, которая помнит, где ты живёшь на самом деле.',
  'Когда соберёшь все ключи и откроешь ворота — вернись к своему подъезду.<br>Минута пойдёт дальше. Ты проснёшься. Обещаю.<br><i>— Ты</i>',
];
const DV_GREET = ['С Новым годом! Пусть сбудется всё задуманное!', 'С Новым годом и Рождеством! Мира, добра и тепла вашему дому.', 'Поздравляю с 2017-м! Год Петуха — кукарекай громче! 🐓', 'С праздником! Любви, мандаринов и снега.', 'Дорогие соседи из 47-й! С Новым годом! Не шумите после трёх. :)'];
const DV_STREETS = ['Строителей', 'Мира', 'Садовая', 'Молодёжная', 'Новогодняя', 'Школьная', 'Заводская', 'Весенняя'];
const DV_HOME = { x: 10, z: 23.5 };
function dvLS(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
// хлопушки/петарды где-то во дворах
function petard() { if (!AC) return; const pan = Math.random() * 2 - 1, n = 3 + ((Math.random() * 8) | 0); let t = 0;
  for (let i = 0; i < n; i++) { t += 40 + Math.random() * 160; setTimeout(() => burst(0.05 + Math.random() * 0.05, 'bandpass', 1400 + Math.random() * 2400, 0.7, 0.18 + Math.random() * 0.25, pan), t); }
  if (Math.random() < 0.5) setTimeout(() => burst(0.5, 'lowpass', 260, 0.7, 0.5, pan), t + 200);
  if (Math.random() < 0.3) for (let k = 0; k < 3 + ((Math.random() * 3) | 0); k++) setTimeout(() => burst(0.11, 'bandpass', 480 + Math.random() * 120, 3, 0.07, -pan), t + 1500 + k * 320); }
// автосигнализация, сработавшая от салюта
function carAlarm() { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'square'; f.type = 'lowpass'; f.frequency.value = 1600; const t = AC.currentTime, v = 0.012 + Math.random() * 0.02;
  for (let i = 0; i < 40; i++) o.frequency.setValueAtTime(i % 2 ? 1250 : 720, t + i * 0.18); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.1); g.gain.setValueAtTime(v, t + 6.5); g.gain.linearRampToValueAtTime(0, t + 7);
  o.connect(f).connect(g); if (AC.createStereoPanner) { const pn = AC.createStereoPanner(); pn.pan.value = Math.random() * 2 - 1; g.connect(pn).connect(master); } else g.connect(master); o.start(t); o.stop(t + 7.1); }

if (DVOR) {
  KEY_POS.dvory = [-187.5, 0, 100.5];
  const FINAL = dvLS('dream_final') === '1';
  SPAWN = { x: DV_HOME.x, z: DV_HOME.z - 2.3, yaw: 0 };
  P.x = SPAWN.x; P.z = SPAWN.z; P.yaw = SPAWN.yaw; P.pitch = 0.04;
  torchOn = false;
  // --- фасады панелек: окна, шторы, гирлянды, ёлки ---
  function facade(seed, o) {
    const W = 1024, H = 784, mx = W / 36, my = H / 28, r = rng(seed);
    const cc = document.createElement('canvas'), ec = document.createElement('canvas'); cc.width = ec.width = W; cc.height = ec.height = H;
    const g = cc.getContext('2d'), e = ec.getContext('2d');
    g.fillStyle = o.wall; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.05})`; g.fillRect(r() * W, r() * H, 4 + r() * 30, 4 + r() * 30); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(30,25,20,0.07)'; g.fillRect(r() * W, r() * H, 2 + r() * 5, 30 + r() * 140); }   // потёки
    const Y = (m) => H - m * my;
    g.fillStyle = o.plinth; g.fillRect(0, Y(o.base), W, o.base * my);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
    for (let f = 0; f <= o.floors; f++) { g.beginPath(); g.moveTo(0, Y(o.base + f * o.fh)); g.lineTo(W, Y(o.base + f * o.fh)); g.stroke(); }
    for (let c = 0; c <= 36 / o.cw; c++) { g.beginPath(); g.moveTo(c * o.cw * mx, 0); g.lineTo(c * o.cw * mx, Y(o.base)); g.stroke(); }
    const GC = ['#ff3030', '#30ff50', '#3080ff', '#ffd020', '#ff40ff'];
    for (let f = 0; f < o.floors; f++) for (let c = 0; c < 36 / o.cw; c++) {
      const tall = o.balc && c % 4 === 1, ww = o.ww * mx, wh = (tall ? 2.15 : o.wh) * my, x = (c * o.cw + (o.cw - o.ww) / 2) * mx, y = Y(o.base + f * o.fh + (tall ? 0.1 : o.sill)) - wh;
      const lit = r() < o.lit, t = r();
      const glow = t < 0.08 ? '#8fb2ff' : t < 0.2 ? '#ffe2b8' : t < 0.6 ? '#ffc477' : '#ffb35c';
      g.fillStyle = o.frame; g.fillRect(x - 4, y - 4, ww + 8, wh + 8);
      if (lit) {
        g.fillStyle = glow; g.fillRect(x, y, ww, wh); e.fillStyle = glow; e.fillRect(x, y, ww, wh);
        const cur = r(); if (cur < 0.7) { const cw = ww * (0.15 + r() * 0.25), cl = ['#7a3a2a', '#8a6a3a', '#3a4a6a', '#6a6a4a'][(r() * 4) | 0]; for (const k of [0, 1]) { g.fillStyle = cl; e.fillStyle = 'rgba(80,40,15,0.85)'; const xx = k ? x + ww - cw : x; g.fillRect(xx, y, cw, wh); e.fillRect(xx, y, cw, wh); } }
        if (r() < 0.16) { e.fillStyle = '#0a2a0a'; g.fillStyle = '#204a20'; const cx = x + ww * (0.3 + r() * 0.4); e.beginPath(); e.moveTo(cx, y + wh * 0.25); e.lineTo(cx - ww * 0.18, y + wh); e.lineTo(cx + ww * 0.18, y + wh); e.fill(); g.beginPath(); g.moveTo(cx, y + wh * 0.25); g.lineTo(cx - ww * 0.18, y + wh); g.lineTo(cx + ww * 0.18, y + wh); g.fill(); }
        if (r() < 0.08) { const sx = x + ww * (0.3 + r() * 0.4), sy = y + wh * 0.45; for (const c of [g, e]) { c.fillStyle = 'rgba(8,6,5,0.92)'; c.beginPath(); c.arc(sx, sy, ww * 0.1, 0, 6.28); c.fill(); c.beginPath(); c.ellipse(sx, sy + ww * 0.32, ww * 0.22, ww * 0.2, 0, 3.14, 6.28); c.fill(); c.fillRect(sx - ww * 0.22, sy + ww * 0.3, ww * 0.44, wh); } }
        e.fillStyle = 'rgba(0,0,0,0.35)'; e.fillRect(x + ww / 2 - 2, y, 4, wh); e.fillRect(x, y + wh * 0.3, ww, 3);
      } else { const gr = g.createLinearGradient(x, y, x + ww, y + wh); gr.addColorStop(0, '#20242c'); gr.addColorStop(0.5, '#141820'); gr.addColorStop(1, '#262a30'); g.fillStyle = gr; g.fillRect(x, y, ww, wh); }
      g.fillStyle = o.frame; g.fillRect(x + ww / 2 - 2, y, 4, wh); g.fillRect(x, y + wh * 0.3, ww, 3);
      if (r() < 0.14) for (let k = 0; k < 9; k++) { const cl = GC[(k + ((r() * 5) | 0)) % 5]; const gx = x + (k + 0.5) * ww / 9, gy = y + 6 + Math.sin(k * 0.9) * 4; e.fillStyle = cl; e.beginPath(); e.arc(gx, gy, 3.5, 0, 6.28); e.fill(); g.fillStyle = cl; g.beginPath(); g.arc(gx, gy, 3.5, 0, 6.28); g.fill(); }
      if (o.balc && !lit && r() < 0.2) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x, y + wh - 4, ww, 4); }
    }
    const mk = (c, srgb) => { const t = texFrom(c, srgb); t.repeat.set(1 / 36, 1 / 28); return t; };
    return std({ map: mk(cc, true), emissiveMap: mk(ec, true), emissive: 0xffffff, emissiveIntensity: o.ei || 2.4, roughness: 0.9 });
  }
  const FAC = [
    facade(11, { wall: '#9d9b95', plinth: '#5e5a55', frame: '#c8c4bc', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.36, balc: true }),
    facade(23, { wall: '#b3a68e', plinth: '#6a6052', frame: '#e0dcd0', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.42, balc: true }),
    facade(37, { wall: '#8e8a86', plinth: '#55504a', frame: '#7a5a3a', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.32, balc: true }),
    facade(41, { wall: '#a86a52', plinth: '#5a4a40', frame: '#d8d4c8', base: 1.2, fh: 2.8, floors: 5, cw: 3, ww: 1.4, wh: 1.4, sill: 0.85, lit: 0.4, balc: false }),
  ];
  const SCHOOL = facade(53, { wall: '#b45a3e', plinth: '#6a6a66', frame: '#e8e4dc', base: 1.0, fh: 3.6, floors: 3, cw: 3, ww: 2.2, wh: 2.2, sill: 0.9, lit: 0.06, balc: false, ei: 1.6 });
  const roofSnow = std({ color: 0xe6e8f0, roughness: 0.95 });
  const lampHead = std({ color: 0xffd0a0, emissive: 0xff8a2a, emissiveIntensity: 34 });
  const entLamp = std({ color: 0xffe8c8, emissive: 0xffc070, emissiveIntensity: 11 });
  const poolTex = texFrom(mkCanvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(0.55, 0.3, 0.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6 });
  const beamMat = new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(0.5, 0.48, 0.42), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6 });
  const spillMat = new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(0.2, 0.12, 0.05), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -5 });
  const coneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 0.4, 0.34), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    map: texFrom(mkCanvas(128, 32, (g, w, h) => { const img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = x / w, v = Math.abs(y / (h - 1) - 0.5) * 2, a = Math.pow(1 - u, 1.6) * Math.max(0, 1 - Math.pow(v / (0.25 + u * 0.75), 2)) * Math.min(1, u * 14); const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255 * a; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); })) });
  const shopGlass = std({ color: 0x222, emissive: 0xfff4e0, emissiveIntensity: 1.6, map: texFrom(mkCanvas(256, 128, (g, w, h) => { g.fillStyle = '#ddd'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = '#556'; g.fillRect(0, 20 + i * 26, w, 5); for (let k = 0; k < 40; k++) { g.fillStyle = ['#c33', '#3a3', '#dd4', '#36c', '#fff'][(k * 7 + i) % 5]; g.fillRect(k * 6.4 + 1, 8 + i * 26, 4, 12); } } g.fillStyle = 'rgba(0,0,0,0.5)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 4, h); })) });
  shopGlass.emissiveMap = shopGlass.map;
  const signCache = new Map();
  function litSign(text, bg, fg, w = 512, font = 'bold 66px sans-serif') { const k = text + bg; if (signCache.has(k)) return signCache.get(k); const m = signMat(text, bg, fg, w, 112, font); m.emissiveMap = m.map; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 1.6; signCache.set(k, m); return m; }
  function plate(text) { const k = 'pl' + text; if (signCache.has(k)) return signCache.get(k); const m = signMat(text, '#1f3f8f', '#fff', 512, 112, 'bold 44px sans-serif'); signCache.set(k, m); return m; }
  const RED = lin([0.62, 0.16, 0.12]), YEL = lin([0.85, 0.66, 0.18]), BLU = lin([0.2, 0.36, 0.62]), GRN = lin([0.22, 0.45, 0.3]), WHT = shade(0.9), DRK = shade(0.12);

  // --- уличные фонари (натрий) ---
  function sodium(K, x, z, ax, az, grid) { const { b, group } = K, y = 0; b.cyl(M.metal, x, 3.2, z, 0.09, 0.06, 6.4, 8, PAINT.dark); b.pipe(M.metal, new V3(x, 6.3, z), new V3(x + ax * 1.3, 6.45, z + az * 1.3), 0.04, PAINT.dark);
    const on = grid || K.r() < 0.9; b.box(on ? lampHead : M.metal, x + ax * 1.4, 6.38, z + az * 1.4, 0.55, 0.12, 0.28, PAINT.dark, 0, Math.atan2(az, ax) * -1);
    if (on) { if (!grid) { bulbAnchors.push({ x: x + ax * 1.4, y: 6.1, z: z + az * 1.4, fy: 0, group, mesh: null, color: 0xff8a30, dist: 20, int: 22 }); b.add(poolMat, new THREE.PlaneGeometry(13, 13).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x + ax * 1.4, 0.03, z + az * 1.4)); } }
    b.collide(x, z, 0.15, 0.15); K.take(x, z, 0.6); }
  function bench(K, x, z, ry) { const { b } = K; b.push(x, 0, z, ry); b.box(M.plank, 0, 0.45, 0, 1.8, 0.05, 0.42, shade(0.55)); b.box(M.plank, 0, 0.8, -0.2, 1.8, 0.3, 0.05, shade(0.55)); for (const s of [-0.7, 0.7]) b.box(M.conc, s, 0.22, 0, 0.12, 0.44, 0.4, shade(0.7)); b.box(M.paint, 0, 0.49, 0.02, 1.7, 0.04, 0.36, shade(0.92)); b.collide(0, 0, 0.9, 0.25); b.pop(); K.take(x, z, 1.1); }
  function parked(K, x, z, ry) { const { b, r } = K, c = lin(hexc(CAR_PAINT[(r() * CAR_PAINT.length) | 0])); b.push(x, 0, z, ry);
    b.box(M.paint, 0, 0.62, 0, 4.2, 0.6, 1.66, c); b.box(M.paint, -0.15, 1.18, 0, 2.1, 0.55, 1.5, c.map((v) => v * 0.8)); b.box(M.glass, -0.15, 1.18, 0, 2.0, 0.45, 1.52);
    for (const sx of [-1.35, 1.35]) for (const sz of [-0.78, 0.78]) b.cyl(M.rubber, sx, 0.31, sz, 0.31, 0.31, 0.22, 10, null, Math.PI / 2);
    b.box(roofSnow, -0.15, 1.5, 0, 2.0, 0.1 + r() * 0.06, 1.45); b.box(roofSnow, 1.5, 0.96, 0, 1.0, 0.06, 1.5); b.box(roofSnow, -1.85, 0.96, 0, 0.6, 0.05, 1.5);
    b.collide(0, 0, 2.15, 0.88); b.pop(); K.take(x, z, 2.4); }
  function playground(K, x, z) { const { b, r } = K; K.take(x, z, 7);
    // горка
    b.push(x - 3, 0, z, r() * 0.4); for (const sx of [-0.4, 0.4]) for (const sz of [-0.4, 0.4]) b.cyl(M.metal, sx, 0.8, sz, 0.04, 0.04, 1.6, 6, RED);
    b.box(M.plank, 0, 1.55, 0, 0.9, 0.06, 0.9, shade(0.5)); b.box(M.metal, 0, 0.85, 1.6, 0.6, 0.04, 2.4, BLU, -0.62); b.box(roofSnow, 0, 1.6, 0, 0.85, 0.06, 0.85);
    for (let k = 0; k < 5; k++) b.box(M.metal, 0, 0.25 + k * 0.3, -0.45, 0.8, 0.03, 0.03, YEL); b.collide(0, 0.6, 0.5, 1.4); b.pop();
    // качели
    b.push(x + 2.5, 0, z - 1, 0); for (const s of [-1.1, 1.1]) { b.pipe(M.metal, new V3(s, 0, -0.7), new V3(s, 2.3, 0), 0.05, YEL); b.pipe(M.metal, new V3(s, 0, 0.7), new V3(s, 2.3, 0), 0.05, YEL); }
    b.pipe(M.metal, new V3(-1.1, 2.3, 0), new V3(1.1, 2.3, 0), 0.05, YEL); for (const s of [-0.25, 0.25]) b.pipe(M.metal, new V3(s, 2.3, 0), new V3(s, 0.5, 0), 0.012, PAINT.galv); b.box(M.plank, 0, 0.48, 0, 0.6, 0.04, 0.3, RED); b.collide(-1.1, 0, 0.1, 0.7); b.collide(1.1, 0, 0.1, 0.7); b.pop();
    // карусель, песочница
    b.cyl(M.metal, x + 0.5, 0.35, z + 3, 1.0, 1.0, 0.06, 18, GRN); b.cyl(M.metal, x + 0.5, 0.7, z + 3, 0.04, 0.04, 0.8, 6, RED); b.cyl(roofSnow, x + 0.5, 0.4, z + 3, 0.95, 0.95, 0.04, 18); b.collide(x + 0.5, z + 3, 0.8, 0.8);
    for (const [dx, dz, sx, sz] of [[0, -1.2, 2.6, 0.12], [0, 1.2, 2.6, 0.12], [-1.25, 0, 0.12, 2.4], [1.25, 0, 0.12, 2.4]]) b.box(M.plank, x + 4 + dx, 0.15, z + 3.2 + dz, sx, 0.3, sz, shade(0.6));
    b.box(roofSnow, x + 4, 0.2, z + 3.2, 2.4, 0.2, 2.3); }
  function trashSite(K, x, z, ry) { const { b } = K; b.push(x, 0, z, ry); for (const s of [-1.6, 0, 1.6]) { b.box(M.metal, s, 0.6, 0, 1.4, 1.15, 1.0, GRN); b.box(roofSnow, s, 1.2, 0, 1.38, 0.06, 0.98); }
    b.box(M.prof, 0, 1.0, -0.8, 5.2, 2.0, 0.05, shade(0.75)); b.box(M.prof, -2.6, 1.0, 0, 0.05, 2.0, 1.6, shade(0.75)); b.box(M.prof, 2.6, 1.0, 0, 0.05, 2.0, 1.6, shade(0.75)); b.collide(0, -0.1, 2.7, 0.8); b.pop(); K.take(x, z, 3.2); }
  function snowman(K, x, z) { const { b } = K; b.cyl(roofSnow, x, 0.35, z, 0.42, 0.36, 0.7, 12); b.cyl(roofSnow, x, 0.95, z, 0.3, 0.25, 0.5, 12); b.cyl(roofSnow, x, 1.35, z, 0.2, 0.17, 0.32, 10); b.cyl(M.paint, x, 1.6, z, 0.14, 0.16, 0.22, 8, lin([0.4, 0.3, 0.2])); b.box(M.paint, x, 1.38, z + 0.2, 0.04, 0.04, 0.16, lin([0.9, 0.4, 0.1])); b.collide(x, z, 0.4, 0.4); K.take(x, z, 0.8); }
  // --- панельный дом: фасады с окнами, балконы, подъезды с козырьками ---
  function panel(K, cx, cz, len, dep, floors, ry, fac, home) {
    const { b, group, r } = K, Hh = (floors === 9 ? 1.6 : 1.2) + floors * 2.8 + 0.5, uo = ((r() * 12) | 0) * 3;
    const wallC = fac === FAC[3] ? lin([0.6, 0.38, 0.3]) : shade(0.5);
    b.push(cx, 0, cz, ry);
    b.box(M.conc, 0, Hh / 2, 0, len, Hh, dep, wallC); b.box(M.conc, 0, Hh + 0.1, 0, len + 0.3, 0.2, dep + 0.3, shade(0.35)); b.box(roofSnow, 0, Hh + 0.25, 0, len, 0.12, dep);
    b.box(M.conc, len * 0.2, Hh + 1.2, 0, 4, 2.0, 3.5, shade(0.4)); b.box(roofSnow, len * 0.2, Hh + 2.25, 0, 4, 0.1, 3.5);
    for (const s of [1, -1]) { const g = new THREE.PlaneGeometry(len, Hh); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len + uo + (s < 0 ? 7 * 3 : 0), uv.getY(i) * Hh); b.add(fac, g, new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI).setPosition(0, Hh / 2, s * (dep / 2 + 0.02))); }
    b.collide(0, 0, len / 2, dep / 2);
    for (const sd of [1, -1]) b.add(spillMat, new THREE.PlaneGeometry(len * 1.05, 9).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(0, 0.04, sd * (dep / 2 + 3.6)));
    // сугробы вдоль стен
    const drift = (x, z, sx, sz) => b.add(roofSnow, new THREE.SphereGeometry(1, 10, 6), new THREE.Matrix4().compose(new V3(x, -0.18, z), new THREE.Quaternion(), new V3(sx, 0.5 + r() * 0.35, sz)));
    for (let k = 0; k < 4; k++) drift(-len / 2 + 3 + r() * (len - 6), -dep / 2 - 0.8, 1.5 + r() * 1.5, 0.9);
    for (const dx of [-6, 6]) if (r() < 0.7) drift(dx + (r() - 0.5) * 2, dep / 2 + 0.8, 1.2 + r(), 0.8);
    // балконы со стороны двора
    if (floors === 9) for (let c = 0; c < len / 3; c++) { const col = Math.floor((c * 3 + uo) / 3) % 12; if (col % 4 !== 1) continue; const lx = -len / 2 + c * 3 + 1.5; if (lx > len / 2 - 1) continue;
      for (let f = 1; f < floors; f++) { const y = 1.6 + f * 2.8; b.box(M.conc, lx, y, dep / 2 + 0.55, 2.8, 0.14, 1.1, shade(0.55)); const gl = ((c * 7 + f * 3) % 5) === 0; b.box(gl ? M.glass : M.conc, lx, y + 0.55, dep / 2 + 1.08, 2.8, gl ? 1.0 : 0.95, 0.06, shade(0.6)); for (const s of [-1.4, 1.4]) b.box(M.conc, lx + s, y + 0.5, dep / 2 + 0.55, 0.06, 0.95, 1.1, shade(0.6)); if (!gl) b.box(roofSnow, lx, y + 1.04, dep / 2 + 1.08, 2.8, 0.05, 0.12); } }
    // подъезды
    const n = Math.max(1, Math.round(len / 12)); const street = DV_STREETS[(r() * DV_STREETS.length) | 0]; let num = 1 + ((r() * 60) | 0); if (num === 17) num = 19; if (home) num = 17;
    for (let i = 0; i < n; i++) { const lx = -len / 2 + len / (2 * n) * (2 * i + 1), fz = dep / 2;
      b.box(M.metal, lx, 1.05, fz + 0.04, 1.1, 2.1, 0.08, lin([0.16, 0.14, 0.13])); b.box(M.metal, lx + 0.75, 1.3, fz + 0.06, 0.18, 0.3, 0.04, PAINT.galv); if (r() < 0.6) b.add(MPC.notice, new THREE.PlaneGeometry(0.24, 0.32), new THREE.Matrix4().makeRotationZ((r() - 0.5) * 0.1).setPosition(lx - 0.2, 1.45, fz + 0.09));
      b.box(M.conc, lx, 2.7, fz + 0.75, 2.4, 0.14, 1.6, shade(0.6)); b.box(roofSnow, lx, 2.82, fz + 0.75, 2.35, 0.1, 1.55); b.box(M.conc, lx, 0.08, fz + 0.75, 2.4, 0.16, 1.5, shade(0.55));
      const lo = b.world(lx, 2.45, fz + 0.3); b.box(entLamp, lx, 2.52, fz + 0.3, 0.3, 0.08, 0.18); bulbAnchors.push({ x: lo.x, y: 2.4, z: lo.z, fy: 0, group, mesh: null, color: 0xffb060, dist: 9, int: 5 });
      const pn = b.world(lx, 0, fz + 1.1); const id = `${Math.round(pn.x)},${Math.round(pn.z)}`, isHome = home && i === n - 1, open = !isHome && ihash(Math.round(pn.x), Math.round(pn.z), 5) < 0.2;
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), plate(String(i + 1))); const pp = b.world(lx, 2.2, fz + 0.03); pm.position.copy(pp); pm.rotation.y = ry; group.add(pm);
      INTER.push({ x: pn.x, z: pn.z, r: 1.6, group, label: () => isHome ? (FINAL ? 'E — домой' : 'E — домофон, кв. 47') : 'E — домофон', act: () => dvDoor(isHome, open, id) });
      if (!isHome && r() < 0.5) { const bp = b.world(lx + 2.2, 0, fz + 1.6); b.pop(); bench(K, bp.x, bp.z, ry + Math.PI); b.push(cx, 0, cz, ry); }
    }
    // табличка с адресом на торце
    const am = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), plate(`ул. ${street}, ${num}`)); const ap = b.world(len / 2 + 0.03, 3.2, dep / 2 - 1.2); am.position.copy(ap); am.rotation.y = ry + Math.PI / 2; group.add(am);
    b.pop();
  }
  function pavilion(K, cx, cz, ry, kind) { const { b, group } = K; const S = { 5: ['ПЯТЁРОЧКА', '#ffffff', '#d4202a', 'magazin', '«Пятёрочку»'], m: ['МАГНИТ', '#d8202a', '#ffffff', 'magazin', '«Магнит»'], p: ['ПРОДУКТЫ 24', '#1a2a6a', '#ffd23a', 'magazin', '«Продукты 24»'], a: ['АПТЕКА', '#1a8a3a', '#ffffff', 'bolnica', 'аптеку'], f: ['ЦВЕТЫ 24', '#d0307a', '#ffffff', 'magazin', '«Цветы 24»'] }[kind];
    b.push(cx, 0, cz, ry); b.box(M.conc, 0, 2.1, 0, 18, 4.2, 10, lin([0.75, 0.72, 0.68])); b.box(roofSnow, 0, 4.28, 0, 18, 0.14, 10);
    b.box(shopGlass, -3.5, 1.6, 5.02, 9, 2.4, 0.04); b.box(shopGlass, 6, 1.6, 5.02, 4, 2.4, 0.04); b.box(M.glass, 2.2, 1.15, 5.03, 1.6, 2.3, 0.04);
    b.box(M.conc, 0, 0.08, 6.0, 7, 0.16, 2.0, shade(0.5)); b.collide(0, 0, 9, 5);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.3), litSign(S[0], S[1], S[2], 768, 'bold 78px sans-serif')); const sp = b.world(0, 3.45, 5.06); sm.position.copy(sp); sm.rotation.y = ry; group.add(sm);
    const lp = b.world(2.2, 3.0, 5.6); bulbAnchors.push({ x: lp.x, y: 3.0, z: lp.z, fy: 0, group, mesh: null, color: 0xfff0e0, dist: 12, int: 8 });
    const dp = b.world(2.2, 0, 6.3); INTER.push({ x: dp.x, z: dp.z, r: 1.8, group, label: `E — зайти в ${S[4]}`, act: () => goWorld(S[3], S[3] === 'bolnica' ? 'В аптеке пахнет хлоркой. Коридор уходит дальше, чем должен.' : 'Внутри павильон оказался больше, чем снаружи.') });
    b.pop(); }
  function school(K, cx, cz, ry) { const { b, group, r } = K; const L = 36, D = 14, Hh = 1.0 + 3 * 3.6 + 0.6;
    b.push(cx, 0, cz, ry); b.box(M.conc, 0, Hh / 2, 0, L, Hh, D, lin([0.55, 0.3, 0.22])); b.box(roofSnow, 0, Hh + 0.1, 0, L, 0.2, D);
    for (const s of [1, -1]) { const g = new THREE.PlaneGeometry(L, Hh); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L, uv.getY(i) * Hh); b.add(SCHOOL, g, new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI).setPosition(0, Hh / 2, s * (D / 2 + 0.02))); }
    b.collide(0, 0, L / 2, D / 2); b.box(M.conc, 0, 3.3, D / 2 + 1.5, 6, 0.25, 3, shade(0.7)); for (const s of [-2.6, 2.6]) b.cyl(M.conc, s, 1.65, D / 2 + 2.7, 0.18, 0.18, 3.3, 10, shade(0.8)); b.box(roofSnow, 0, 3.48, D / 2 + 1.5, 6, 0.1, 3);
    b.box(M.glass, 0, 1.2, D / 2 + 0.03, 2.2, 2.4, 0.04);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), litSign(`ШКОЛА № ${3 + ((r() * 40) | 0)}`, '#e8e4d8', '#1a3a7a')); const sp = b.world(0, 4.3, D / 2 + 0.04); sm.position.copy(sp); sm.rotation.y = ry; group.add(sm);
    const lp = b.world(0, 3.0, D / 2 + 1.5); bulbAnchors.push({ x: lp.x, y: 3.0, z: lp.z, fy: 0, group, mesh: null, color: 0xfff2e0, dist: 12, int: 7 });
    const dp = b.world(0, 0, D / 2 + 1.4); INTER.push({ x: dp.x, z: dp.z, r: 1.8, group, label: 'E — войти в школу', act: () => goWorld('shkola', 'Дверь школы не заперта. Внутри горит дежурный свет.') });
    // забор
    for (let x = -L / 2 - 3; x <= L / 2 + 3; x += 2.5) for (const zz of [-D / 2 - 5, D / 2 + 8]) { if (zz > 0 && Math.abs(x) < 3) continue; b.box(M.metal, x, 0.8, zz, 0.05, 1.6, 0.05, GRN); b.box(M.metal, x + 1.25, 1.5, zz, 2.5, 0.04, 0.04, GRN); b.box(M.metal, x + 1.25, 0.3, zz, 2.5, 0.04, 0.04, GRN); for (let k = 0; k < 8; k++) b.box(M.metal, x + 0.3 * k, 0.9, zz, 0.02, 1.2, 0.02, GRN); }
    b.collide(-L / 4 - 2.2, D / 2 + 8, L / 4 - 0.6, 0.1); b.collide(L / 4 + 2.2, D / 2 + 8, L / 4 - 0.6, 0.1); b.collide(0, -D / 2 - 5, L / 2 + 3, 0.1);
    b.pop(); }
  // --- новогодняя ёлка во дворе (тут ключ) ---
  function yolka(K, x, z) { const { b, group } = K; K.take(x, z, 3); b.cyl(M.metal, x, 0.2, z, 0.9, 0.9, 0.4, 12, RED);
    const tm = std({ color: 0x1d3a22, roughness: 0.9 }); for (let i = 0; i < 6; i++) b.add(tm, new THREE.ConeGeometry(2.2 - i * 0.32, 1.8, 14), new THREE.Matrix4().makeTranslation(x, 1.3 + i * 0.95, z));
    const GL = [0xff2020, 0x20ff40, 0x3060ff, 0xffd020, 0xff30ff]; for (let i = 0; i < 70; i++) { const t = i / 70, a = t * 6.28 * 7, rad = 2.1 * (1 - t) + 0.1, h = 0.6 + t * 6; const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(GL[i % 5]).multiplyScalar(6) })); m.position.set(x + Math.cos(a) * rad, h, z + Math.sin(a) * rad); group.add(m); }
    const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 1, 0.6) })); st.position.set(x, 7.2, z); group.add(st);
    bulbAnchors.push({ x, y: 3, z, fy: 0, group, mesh: null, color: 0xff6040, dist: 14, int: 10 }); b.collide(x, z, 1.2, 1.2); }
  // --- предметы: открытки и мандарины ---
  const cardMat = std({ map: texFrom(mkCanvas(128, 90, (g, w, h) => { g.fillStyle = '#b8282a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4e8c8'; g.font = 'bold 16px serif'; g.textAlign = 'center'; g.fillText('С НОВЫМ', 64, 38); g.fillText('ГОДОМ!', 64, 58); g.strokeStyle = '#f0d070'; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10); })), emissive: 0x401010, roughness: 0.7 });
  const mandMat = std({ color: 0xff7a10, emissive: 0x401800, roughness: 0.6 });
  function addCard(K, x, z, id) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.004, 0.105), cardMat); m.rotation.y = K.r() * 6; addItem(K.group, m, x, 0.02, z, id, 'Открытка'); coinsLive[coinsLive.length - 1].kind = 'card'; }
  function addMand(K, x, z, id) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8).scale(1, 0.85, 1), mandMat); m.position.y = 0.035; addItem(K.group, m, x, 0.0, z, id, 'Мандарин'); coinsLive[coinsLive.length - 1].kind = 'mand'; }
  let CARDS = +dvLS('dvory_cards') || 0, MAND = +dvLS('dvory_mand') || 0;
  const showDv = () => { const a = $('f_cards'), m = $('f_mand'); if (a) a.textContent = Math.min(CARDS, DV_LORE.length); if (m) m.textContent = MAND; }; showDv();
  const baseItem = itemPicked;
  itemPicked = function (c, T) {
    if (c.kind === 'mand') { MAND++; dvLS('dvory_mand', MAND); showDv(); burst(0.08, 'bandpass', 1600, 1.2, 0.25); blip([784], 0.18, 'sine', 0.05); toast('Мандарин <b style="color:#ff9a3a">+1</b>'); return; }
    if (c.kind === 'card') { burst(0.1, 'bandpass', 2400, 1, 0.25); blip([659, 988], 0.3, 'triangle', 0.05);
      if (CARDS < DV_LORE.length) { showNote(`<b>Открытка ${CARDS + 1} / ${DV_LORE.length}</b><br><br>${DV_LORE[CARDS]}`); CARDS++; dvLS('dvory_cards', CARDS); } else showNote(DV_GREET[(Math.random() * DV_GREET.length) | 0]);
      showDv(); return; }
    baseItem(c, T); };
  const INTERCOM = ['Домофон пищит. Никто не отвечает.', '— Кто там?.. — и короткие гудки.', 'Из трубки кричат «С Новым годом!» чужие голоса. Дверь не открывается.', 'Код не подходит. Ты точно помнил этот код.', 'Домофон играет мелодию. Долго. Слишком долго.', 'Тишина. Только где-то наверху хлопает петарда.'];
  function dvDoor(isHome, open, id) {
    blip([1046, 784, 1046, 784], 0.25, 'square', 0.025);
    if (isHome) { if (FINAL) dvFinal(); else toast(CARDS >= 1 ? 'Это твой подъезд. Домофон молчит.<br><span style="font-size:14px">Сначала — ключи. Потом — ворота.</span>' : 'Это твой подъезд. Кв. 47.<br><span style="font-size:14px">Домофон молчит.</span>'); return; }
    if (open) { setTimeout(() => goWorld('podezd', 'Дверь подъезда поддалась.<br><span style="font-size:14px">Это не твой подъезд.</span>'), 500); return; }
    toast(INTERCOM[(ihash(id.length, Math.floor(clock * 3)) * INTERCOM.length) | 0]); }
  function dvFinal() { clockStop = true; $('f_clock') && ($('f_clock').textContent = '01.01.2017 · 00:25'); blip([523, 659, 784, 1047], 1.5, 'sine', 0.07);
    const day = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    setTimeout(() => wakeUp(['Дверь подъезда щёлкнула и открылась.', 'На лестнице пахло мандаринами и бенгальскими огнями.', 'Часы на телефоне показали 00:25.', 'Ты поднялся на свой этаж, открыл дверь квартиры —', '— и открыл глаза.', `Утро. ${day}. Будильник на семь.`, 'Ты проснулся.']), 1200); }

  // --- чанк: квартал 96×96, дороги по краям; каждый чанк — четверть квартала ---
  OUT_BUILD = (cx, cz) => {
    const K = kit(cx, cz, 0xd0e1), { b, r } = K; const bx = Math.floor((cx + 1) / 2), bz = Math.floor((cz + 1) / 2), ex = cx - 2 * bx === 0 ? 1 : -1, ez = cz - 2 * bz === 0 ? 1 : -1;
    const X0 = bx * 96, Z0 = bz * 96, W = (a, c) => [X0 + ex * a, Z0 + ez * c];
    const home = cx === 0 && cz === 0, tree = cx === -4 && cz === 2;
    const h = ihash(bx * 2 + (ex > 0), bz * 2 + (ez > 0), 77); const along = home ? true : ihash(bx, bz, 3) < 0.5 ? (ex * ez > 0) : (ex * ez < 0);
    const type = home ? 'p9' : tree ? 'p5' : h < 0.45 ? 'p9' : h < 0.7 ? 'p5' : h < 0.92 ? 'shop' : 'school';
    // где двор (a,c ∈ [0..48]); дом стоит вдоль внешней улицы
    const ryA = Math.atan2(0, -ez), ryB = Math.atan2(-ex, 0);
    if (type === 'p9' || type === 'p5') { const nine = type === 'p9', len = nine ? 36 : 36, dep = nine ? 12 : 11, fl = nine ? 9 : 5, fac = nine ? FAC[home ? 0 : (r() * 3) | 0] : FAC[3];
      if (along) { const [x, z] = W(22, 29.5); panel(K, x, z, len, dep, fl, ryA, fac, home); K.block = (px, pz) => Math.abs(px - x) < len / 2 + 1 && Math.abs(pz - z) < dep / 2 + 2; }
      else { const [x, z] = W(29.5, 22); panel(K, x, z, len, dep, fl, ryB, fac, false); K.block = (px, pz) => Math.abs(px - x) < dep / 2 + 2 && Math.abs(pz - z) < len / 2 + 1; } }
    else if (type === 'shop') { const kinds = ['5', 'm', '5', 'm', 'p', 'a', 'f']; const kind = kinds[(r() * kinds.length) | 0];
      if (along) { const [x, z] = W(22, 33.5); pavilion(K, x, z, Math.atan2(0, ez), kind); K.block = (px, pz) => Math.abs(px - x) < 10 && Math.abs(pz - z) < 7.5; }
      else { const [x, z] = W(33.5, 22); pavilion(K, x, z, Math.atan2(ex, 0), kind); K.block = (px, pz) => Math.abs(px - x) < 7.5 && Math.abs(pz - z) < 10; } }
    else { const [x, z] = W(22, 24); school(K, x, z, Math.atan2(0, ez)); K.block = (px, pz) => { const a = (px - X0) * ex, c = (pz - Z0) * ez; return a > 0 && a < 44 && c > 11 && c < 41; }; }
    const fb = K.block; const freeY = (x, z, rad) => K.free(x, z, rad) && dvRoadD(x, z) > 7 + rad;
    // фонари вдоль улиц
    for (const c of [12, 36]) { const [x, z] = W(c, 42.6); sodium(K, x, z, 0, ez, true); const [x2, z2] = W(42.6, c); sodium(K, x2, z2, ex, 0, true); }
    // снежные валы вдоль бордюров
    for (let a = 2; a < 40; a += 5) { if (r() < 0.65) { const [x, z] = W(a + r() * 2, 43.6); b.add(roofSnow, new THREE.SphereGeometry(1, 10, 6), new THREE.Matrix4().compose(new V3(x, -0.12, z), new THREE.Quaternion(), new V3(2.2, 0.38, 0.6))); }
      if (r() < 0.65) { const [x, z] = W(43.6, a + r() * 2); b.add(roofSnow, new THREE.SphereGeometry(1, 10, 6), new THREE.Matrix4().compose(new V3(x, -0.12, z), new THREE.Quaternion(), new V3(0.6, 0.38, 2.2))); } }
    // двор
    if (tree) { yolka(K, -189, 99); }
    if (type !== 'school') {
      if (r() < 0.6) { const [x, z] = W(16 + r() * 10, 9 + r() * 4); if (freeY(x, z, 7)) playground(K, x, z); }
      if (r() < 0.45) { const [x, z] = W(36 + r() * 3, 6 + r() * 6); if (freeY(x, z, 3.2)) trashSite(K, x, z, Math.atan2(-ex, 0)); }
      for (let i = 0; i < 2; i++) { const [x, z] = W(6 + r() * 30, 4 + r() * 14); if (freeY(x, z, 0.8)) sodium(K, x, z, r() < 0.5 ? 1 : -1, 0); }
      const nc = (r() * 6) | 0; for (let i = 0; i < nc; i++) { const a = 8 + i * 4.8 + r() * 0.6, c = 19; const [x, z] = along ? W(a, c) : W(c, a); if (freeY(x, z, 2.2)) parked(K, x, z, along ? Math.PI / 2 : 0); }
      for (let i = 0; i < 2; i++) { const [x, z] = W(5 + r() * 34, 3 + r() * 14); if (freeY(x, z, 1.1)) bench(K, x, z, r() * 6.28); }
      if (r() < 0.2) { const [x, z] = W(10 + r() * 25, 4 + r() * 10); if (freeY(x, z, 0.8)) snowman(K, x, z); }
    }
    for (let i = 0; i < 9; i++) { const [x, z] = W(3 + r() * 40, 3 + r() * 39); if (freeY(x, z, 1.2)) K.plant(K.pick(['sticks0', 'sticks1', 'sticks0', 'elm1']), x, z, 0.9 + r() * 0.5); }
    // находки
    if (r() < 0.45 || home) { for (let t = 0; t < 8; t++) { const [x, z] = home ? W(14 + r() * 6, 12 + r() * 4) : W(4 + r() * 36, 3 + r() * 16); if (freeY(x, z, 0.3)) { addCard(K, x, z, `cd${cx},${cz}`); break; } } }
    for (let i = 0; i < 4; i++) { const [x, z] = W(3 + r() * 40, 3 + r() * 38); if (r() < 0.65 && freeY(x, z, 0.3)) addMand(K, x, z, `md${cx},${cz},${i}`); }
    K.block = fb; return K.finish(); };

  // --- машины на дорогах: фары, свет на асфальте; не тормозят ---
  const DC = []; for (let i = 0; i < (MOBILE ? 5 : 8); i++) { const c = makeCar(); const beam = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.6).rotateX(-Math.PI / 2), beamMat); beam.position.set(6.6, 0.05, 0); c.g.add(beam); const tail = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.6).rotateX(-Math.PI / 2), poolMat); tail.position.set(-3, 0.05, 0); c.g.add(tail);
    for (const sz of [-0.6, 0.6]) { const c1 = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.4).rotateX(-Math.PI / 2), coneMat); c1.position.set(2.3 + 6.5, 0.66, sz); const c2 = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.5), coneMat); c2.position.set(2.3 + 6.5, 0.66, sz); c.g.add(c1, c2); } scene.add(c.g); DC.push(Object.assign(c, { s: 0, lane: 0, ax: 0, dir: 1, v: 10, passed: false, honk: 0 })); }
  function carSpawn(c, first) { c.ax = Math.random() < 0.5 ? 0 : 1; c.dir = Math.random() < 0.5 ? 1 : -1; c.v = 8 + Math.random() * 7; c.passed = false;
    const pc = c.ax ? P.x : P.z, k = Math.round(((c.ax ? P.x : P.z) - 48) / 96) + ((Math.random() * 3) | 0) - 1, line = 48 + k * 96; const along = c.ax ? P.z : P.x;
    c.lane = c.ax ? line - c.dir * 1.9 : line + c.dir * 1.9; c.s = first ? along + (Math.random() - 0.5) * 260 : along - c.dir * (120 + Math.random() * 60); void pc; }
  DC.forEach((c) => carSpawn(c, true));
  function carsUpdate(dt) {
    for (const c of DC) { c.s += c.dir * c.v * dt; const along = c.ax ? P.z : P.x, side = c.ax ? P.x : P.z; if (c.dir * (c.s - along) > 150 || Math.abs(side - c.lane) > 260) carSpawn(c, false);
      if (c.ax) { c.g.position.set(c.lane, 0, c.s); c.g.rotation.y = -c.dir * Math.PI / 2; } else { c.g.position.set(c.s, 0, c.lane); c.g.rotation.y = c.dir > 0 ? 0 : Math.PI; }
      for (const w of c.wheels) w.rotation.z -= c.v * dt / 0.32;
      if (!started || dead) continue; const da = (along - c.s) * c.dir, dl = Math.abs(side - c.lane), d = Math.hypot(da, dl);
      if (da > -c.len / 2 - 0.3 && da < c.len / 2 + 0.5 && dl < 1.25 && P.y < 1.2) { die(); continue; }
      if (da > 4 && da < 30 && dl < 2.5 && c.honk <= 0) { horn(); c.honk = 6; } c.honk -= dt;
      if (d < 14 && !c.passed) { c.passed = true; burst(1.6, 'lowpass', 380, 0.6, 0.5 * (1 - d / 14)); } if (d > 30) c.passed = false; } }
  // --- салют ---
  const fwTex = texFrom(mkCanvas(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
  const FWN = 170, FW = []; const FWC = [[1, 0.25, 0.15], [0.2, 1, 0.35], [0.3, 0.5, 1], [1, 0.8, 0.25], [1, 0.3, 0.9], [1, 1, 1], [0.3, 1, 1]];
  for (let k = 0; k < 6; k++) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FWN * 3), 3)); const mat = new THREE.PointsMaterial({ size: 1.3, map: fwTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1, 1, 1) });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; scene.add(pts); FW.push({ pts, geo, mat, vel: new Float32Array(FWN * 3), t: 0, ph: 0, x: 0, y: 0, z: 0, h: 0, col: FWC[0] }); }
  const fwLight = new THREE.PointLight(0xffffff, 0, 0, 0); scene.add(fwLight); let fwT = 1.5, fwFlash = 0;
  function fwLaunch() { const f = FW.find((q) => !q.ph); if (!f) return; const a = Math.random() * 6.283, d = 60 + Math.random() * 140; f.x = P.x + Math.cos(a) * d; f.z = P.z + Math.sin(a) * d; f.y = 2; f.h = 30 + Math.random() * 45; f.ph = 1; f.t = 0; f.col = FWC[(Math.random() * FWC.length) | 0]; f.d = d;
    f.mat.size = 0.5; f.mat.opacity = 1; f.mat.color.setRGB(9, 6, 3); f.pts.visible = true; if (AC && d < 120) blip([1800, 1400, 1000], 0.9, 'sine', 0.006 * (1 - d / 140)); }
  function fwUpdate(dt) {
    fwT -= dt; if (fwT < 0) { fwT = 0.7 + Math.random() * 3.2; fwLaunch(); if (Math.random() < 0.3) setTimeout(fwLaunch, 300); }
    fwFlash = Math.max(0, fwFlash - dt * 1.6);
    for (const f of FW) { if (!f.ph) continue; const p = f.geo.attributes.position.array; f.t += dt;
      if (f.ph === 1) { f.y += dt * 38; for (let i = 0; i < FWN; i++) { p[i * 3] = f.x + (i % 7) * 0.02; p[i * 3 + 1] = f.y - (i % 13) * 0.25; p[i * 3 + 2] = f.z; }
        if (f.y >= f.h) { f.ph = 2; f.t = 0; const sp = 13 + Math.random() * 9, ring = Math.random() < 0.25; for (let i = 0; i < FWN; i++) { let vx = Math.random() * 2 - 1, vy = Math.random() * 2 - 1, vz = Math.random() * 2 - 1; if (ring) vy *= 0.12; const l = Math.hypot(vx, vy, vz) || 1, s = sp * (0.75 + Math.random() * 0.3) / l; f.vel[i * 3] = vx * s; f.vel[i * 3 + 1] = vy * s; f.vel[i * 3 + 2] = vz * s; p[i * 3] = f.x; p[i * 3 + 1] = f.y; p[i * 3 + 2] = f.z; }
          f.mat.size = 1.5; f.mat.color.setRGB(f.col[0] * 14, f.col[1] * 14, f.col[2] * 14); fwFlash = Math.max(fwFlash, 1.2 - f.d / 220); fwLight.color.setRGB(f.col[0], f.col[1], f.col[2]); fwLight.position.set(f.x, f.y, f.z);
          const dl = f.d / 340 * 1000, v = Math.max(0.08, 1 - f.d / 220); setTimeout(() => { burst(1.1, 'lowpass', 140 + Math.random() * 80, 0.8, 1.1 * v); burst(0.25, 'bandpass', 900, 0.5, 0.3 * v); }, dl);
          if (Math.random() < 0.14) setTimeout(carAlarm, dl + 700 + Math.random() * 1500);
          if (Math.random() < 0.6) setTimeout(() => { for (let k = 0; k < 10; k++) setTimeout(() => burst(0.03, 'bandpass', 3000 + Math.random() * 3000, 0.8, 0.12 * v), k * 60 + Math.random() * 90); }, dl + 900); }
        f.geo.attributes.position.needsUpdate = true; continue; }
      const dr = Math.exp(-dt * 1.4); for (let i = 0; i < FWN; i++) { const j = i * 3; f.vel[j] *= dr; f.vel[j + 1] = f.vel[j + 1] * dr - 7 * dt; f.vel[j + 2] *= dr; p[j] += f.vel[j] * dt; p[j + 1] += f.vel[j + 1] * dt; p[j + 2] += f.vel[j + 2] * dt; }
      f.geo.attributes.position.needsUpdate = true; const life = 2.6; f.mat.opacity = Math.max(0, 1 - f.t / life) * (f.t > 1.6 ? 0.6 + 0.4 * Math.sin(f.t * 40) : 1); if (f.t > life) { f.ph = 0; f.pts.visible = false; } }
    fwLight.intensity = fwFlash * 0.8; hemi.intensity = 0.2 + fwFlash * 0.15; }
  // --- далёкие многоэтажки по кругу (огни окон, вывески на крышах) ---
  const skyline = new THREE.Mesh(new THREE.CylinderGeometry(330, 330, 90, 48, 1, true), new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, alphaTest: 0.5, depthWrite: false, fog: false, color: new THREE.Color(1, 1, 1),
    map: texFrom(mkCanvas(4096, 256, (g, w, h) => { const r = rng(9); g.clearRect(0, 0, w, h); let x = 0; while (x < w) { const bw = 30 + r() * 110, bh = 30 + r() * 120 * (r() < 0.2 ? 1.4 : 1); g.fillStyle = '#05050a'; g.fillRect(x, h - bh, bw, bh);
      for (let yy = h - bh + 6; yy < h - 4; yy += 7) for (let xx = x + 4; xx < x + bw - 4; xx += 6) if (r() < 0.22) { g.fillStyle = r() < 0.85 ? '#ffb860' : '#bcd0ff'; g.fillRect(xx, yy, 3, 3); }
      if (r() < 0.12) { g.fillStyle = ['#ff2a2a', '#30d050', '#ffffff', '#20e0e0'][(r() * 4) | 0]; g.fillRect(x + bw * 0.2, h - bh - 8, bw * 0.6, 7); } x += bw + r() * 30; } })) }));
  skyline.material.map.repeat.set(2, 1); skyline.material.color.setRGB(3.5, 3.0, 2.6); skyline.position.y = 42; skyline.renderOrder = -1; scene.add(skyline);
  // --- снегопад ---
  const SN = MOBILE ? 1800 : 4500, sp = new Float32Array(SN * 3); for (let i = 0; i < SN; i++) { sp[i * 3] = (Math.random() - 0.5) * 40; sp[i * 3 + 1] = Math.random() * 16; sp[i * 3 + 2] = (Math.random() - 0.5) * 40; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.055, map: fwTex, transparent: true, depthWrite: false, color: 0xfff0e0 })); snow.frustumCulled = false; scene.add(snow);
  // --- часы ---
  let clockStop = false, secs = 0, lastS = -1;
  if (FINAL) { const st = $('start'); const p = st && st.querySelector('p'); if (p) p.innerHTML = '<b>01.01.2017. 00:24:59.</b><br>Ворота открылись. Ты снова у своего подъезда. Минута вот-вот пойдёт дальше.'; }
  const myFeet = []; let lastFoot = null, footSide = 1, interT = 0;
  WORLD_UPDATE = (dt) => {
    carsUpdate(dt); fwUpdate(dt); partyTick(started ? 0.05 + 0.03 * Math.sin(clock * 0.07) : 0, 240); strangerUpdate(dt); skyline.position.x = P.x; skyline.position.z = P.z;
    const p = sg.attributes.position; for (let i = 0; i < SN; i++) { let y = p.getY(i) - dt * (0.9 + (i % 7) * 0.12), x = p.getX(i) + dt * (0.3 + Math.sin(clock * 0.4 + i) * 0.4); if (y < 0) y += 16; if (x > 20) x -= 40; p.setXY(i, x, y); } p.needsUpdate = true; snow.position.set(P.x, 0, P.z);
    if (started && !clockStop) { secs += dt; const s = FINAL ? 59 : Math.floor(secs) % 60; if (s !== lastS) { lastS = s; const e = $('f_clock'); if (e) e.textContent = `01.01.2017 · 00:24:${String(s).padStart(2, '0')}`; } }
    if (P.ground && P.speed > 0.4 && dvRoadD(P.x, P.z) > 6.4 && (!lastFoot || Math.hypot(P.x - lastFoot[0], P.z - lastFoot[1]) > 0.7)) { lastFoot = [P.x, P.z]; footSide = -footSide; const a = Math.atan2(P.dx || 0, P.dz || 1); const m = myFeet.length > 200 ? myFeet.shift() : new THREE.Mesh(footGeo, footMat); m.position.set(P.x + Math.cos(a) * 0.12 * footSide, 0.02, P.z - Math.sin(a) * 0.12 * footSide); m.rotation.y = a; if (!m.parent) scene.add(m); myFeet.push(m); }
    interT -= dt; if (interT < 0) { interT = 5; for (let k = INTER.length - 1; k >= 0; k--) if (INTER[k].group && !INTER[k].group.parent) INTER.splice(k, 1); }
  };
  // незнакомец: стоит во дворе вдалеке и исчезает, если подойти
  const stranger = new THREE.Group(); { const dm = std({ color: 0x060606, roughness: 1 }); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.05, 4, 10), dm); body.position.y = 0.82; const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), dm); head.position.y = 1.62; const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 10), dm); hat.position.y = 1.74; stranger.add(body, head, hat); }
  stranger.visible = false; scene.add(stranger); let strT = 25;
  function strangerUpdate(dt) { if (!started) return; strT -= dt;
    if (stranger.visible) { const d = Math.hypot(stranger.position.x - P.x, stranger.position.z - P.z); stranger.lookAt(P.x, 0, P.z); if (d < 12 || strT < 0) { stranger.visible = false; strT = 35 + Math.random() * 40; if (d < 12) burst(1.2, 'lowpass', 200, 0.5, 0.25); } return; }
    if (strT < 0) { const a = P.yaw + (Math.random() - 0.5) * 0.9, d = 26 + Math.random() * 14, x = P.x - Math.sin(a) * d, z = P.z - Math.cos(a) * d; if (dvRoadD(x, z) > 8) { stranger.position.set(x, 0, z); stranger.visible = true; strT = 60; } else strT = 3; } }
  if (TEST) window.__dv = { INTER, DC, FW, fwLaunch };
  if (FINAL) setTimeout(() => toast('<b style="color:#ffd35a">Твой подъезд.</b><br><span style="font-size:14px">Дверь за спиной. Подойди и нажми E.</span>'), 2500);
}
