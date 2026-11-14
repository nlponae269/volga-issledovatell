// ===================== ДВОРЫ: 415-й микрорайон, ул. Героев Тулы, 13. Ноябрь, 14:50 =====================
// Сюжет: после школы ты дошёл до своего двора. Ключа нет, домофон молчит, часы стоят на 14:50.
const DV_LORE = [
  '«Обед на плите, разогрей. Ключ у тёти Вали из 45-й. Буду в шесть.<br><i>— Мама</i>»<br><br><span style="font-size:14px">На обороте твоим почерком: «Тёти Вали нет дома. Никого нет дома».</span>',
  'Если ты читаешь это — значит, ты опять стоишь во дворе в 14:50.<br>Ты приходишь сюда каждый раз, когда засыпаешь.<br>И каждый раз не помнишь.',
  'Часы здесь не идут. Без десяти три, ноябрь, дождь только что кончился.<br>Это не день. Это фотография дня.',
  'Помнишь лужу у третьего подъезда? В ней вся девятиэтажка — вверх ногами.<br>Ты думал, что там, внизу, второй город.',
  'Весной вы уехали. Двор никуда не делся — это ты ушёл.<br>А кусок тебя так и стоит здесь с рюкзаком и без ключа.',
  'Тропа, дача, школа, лагерь, электричка — всё это отсюда.<br>Каждое место, куда ты так и не вернулся, прячет ключ.',
  'Подъезды открываются не все.<br>Те, что открыты, ведут не домой.',
  'Не стой на дороге. Машины здесь не тормозят —<br>им не для кого.',
  'В окнах горит свет. Из форточки первого этажа пахнет жареным луком.<br>Ни в одном окне тебя не ждут: там всё ещё 14:50.',
  'Один ключ — здесь, во дворах.<br>Ищи площадку, где у домика самая яркая крыша. Она к юго-западу: за детским садом, через дорогу.',
  'Бабушкины ворота на даче — единственная дверь, которая помнит, где ты живёшь на самом деле.',
  'Когда соберёшь все ключи и откроешь ворота — поднимись домой и ляг на свою кровать.<br>Минута пойдёт дальше. Мама придёт в шесть. Ты проснёшься. Обещаю.<br><i>— Ты</i>',
];
const DV_GREET = ['«Продам гараж. Звонить после шести».', '«Пропал кот. Серый, отзывается на Ваську. Нашедшему — спасибо».', '«Уважаемые жильцы! 15 ноября отключение горячей воды».', '«Куплю волосы, часы, значки». Телефон оторван.', '«Не ставьте машины на газон!!!» — буквы поплыли от дождя.'];
const DV_STREETS = ['Героев Тулы', 'Академика Бардина', 'Менжинского', 'Жолудева', 'Николая Отрады', 'Мясникова', 'Луговского', 'Клименко'];
const DV_HOME = { x: 20 - 40 / 3, z: 23.5 };
function dvLS(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
// звуки района: собака, трамвай с Тракторозаводской, скрип качелей, капли
function dvAmbient() { if (!AC) return; const t = Math.random(), pan = Math.random() * 2 - 1;
  if (t < 0.35) { for (let k = 0; k < 3 + ((Math.random() * 3) | 0); k++) setTimeout(() => burst(0.11, 'bandpass', 480 + Math.random() * 120, 3, 0.09, pan), k * 330); }
  else if (t < 0.65) { burst(3.5, 'lowpass', 90, 0.7, 0.35, pan); setTimeout(() => blip([1320, 1320], 0.5, 'sine', 0.012), 900); setTimeout(() => { for (let k = 0; k < 6; k++) setTimeout(() => burst(0.06, 'lowpass', 260, 1, 0.1, pan), k * 380); }, 300); }
  else if (t < 0.85) creak();
  else { for (let k = 0; k < 5; k++) setTimeout(() => blip([1500 + Math.random() * 900], 0.07, 'sine', 0.015), k * (180 + Math.random() * 300)); } }

if (DVOR) {
  KEY_POS.dvory = [-187.5, 0, 100.5];
  const FINAL = dvLS('dream_final') === '1';
  SPAWN = { x: 8, z: 2, yaw: 0 };                       // спавн — во дворе дома № 13, лицом на север
  P.x = SPAWN.x; P.z = SPAWN.z; P.yaw = SPAWN.yaw; P.pitch = 0.04;
  // --- фасады: серый кирпич, окна с тюлем, редкий тёплый свет ---
  // пары окон, как в доме № 13: широкое (3 створки) и узкое (2 створки)
  const winW = (o, c) => o.pair ? (c % 2 === 0 ? 2.1 : 1.4) : o.ww;
  const mull = (g, x, y, ww, wh, wm) => { const n = wm > 1.8 ? 3 : 2; for (let k = 1; k < n; k++) g.fillRect(x + ww * k / n - 2, y, 4, wh); };
  // силикатный кирпич по фото: светлый серо-бежевый, тонкие тёмные швы, тычковый ряд через пять ложковых
  if (PBR.brick) { const S = 1024, rows = 20, rh = S / rows, bl = S / 6, r0 = rng(77);
    const col = document.createElement('canvas'), hgt = document.createElement('canvas'), rgh = document.createElement('canvas'); col.width = col.height = hgt.width = hgt.height = rgh.width = rgh.height = S;
    const g = col.getContext('2d'), h = hgt.getContext('2d'), q = rgh.getContext('2d');
    g.fillStyle = '#6e6660'; g.fillRect(0, 0, S, S); h.fillStyle = '#202020'; h.fillRect(0, 0, S, S); q.fillStyle = '#ff00ff'; q.fillRect(0, 0, S, S);
    for (let i = 0; i < rows; i++) { const hdr = i % 6 === 5, L = hdr ? bl * 0.48 : bl, off = hdr ? bl * 0.24 : (i % 2) * bl / 2, y = i * rh;
      for (let x = -L + off; x < S + L; x += L) { const v = (r0() - 0.5) * 22, pk = r0() < 0.25 ? 8 : 0, base = 196 + v; g.fillStyle = `rgb(${base + pk},${base - 6 + pk * 0.3},${base - 14})`;
        const draw = (dx) => { g.fillRect(x + dx + 2.5, y + 2.5, L - 5, rh - 5); h.fillStyle = `rgb(${200 + r0() * 40 | 0},0,0)`; h.fillRect(x + dx + 2.5, y + 2.5, L - 5, rh - 5); q.fillStyle = `rgb(0,${200 + r0() * 40 | 0},0)`; q.fillRect(x + dx + 2.5, y + 2.5, L - 5, rh - 5); };
        draw(0);
        for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${r0() < 0.5 ? '0,0,0' : '255,255,255'},${0.04 + r0() * 0.06})`; g.fillRect(x + r0() * L, y + 3 + r0() * (rh - 8), 3 + r0() * 14, 2 + r0() * 4); } } }
    for (let i = 0; i < 40; i++) { const x = r0() * S, w = 6 + r0() * 30, gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(60,50,40,0)'); gr.addColorStop(0.5, `rgba(60,50,40,${0.05 + r0() * 0.08})`); gr.addColorStop(1, 'rgba(60,50,40,0)'); g.fillStyle = gr; g.fillRect(x, 0, w, S); }
    const tex = (c, srgb) => { const t = texFrom(c, srgb); return t; };
    PBR.brick = { map: tex(col, true), nor: tex(normalFromHeight(hgt, 2.2), false), arm: tex(rgh, false) }; }
  function facade(seed, o) {
    const W = 1024, H = 784, mx = W / 36, my = H / 28, r = rng(seed);
    const cc = document.createElement('canvas'), ec = document.createElement('canvas'); cc.width = ec.width = W; cc.height = ec.height = H;
    const g = cc.getContext('2d'), e = ec.getContext('2d');
    const PB = o.brick && PBR.brick;
    if (PB) g.clearRect(0, 0, W, H); else { g.fillStyle = o.wall; g.fillRect(0, 0, W, H); } e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    if (o.brick && !PB) { for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.55 ? '0,0,0' : '255,255,255'},${0.03 + r() * 0.07})`; g.fillRect(((r() * 128) | 0) * 8, ((r() * 262) | 0) * 3, 8, 3); }
      g.fillStyle = 'rgba(0,0,0,0.13)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); g.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = 0, k = 0; y < H; y += 3, k++) for (let x = (k % 2) * 4; x < W; x += 8) g.fillRect(x, y, 1, 3); }
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.6 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.04})`; g.fillRect(r() * W, r() * H, 6 + r() * 40, 6 + r() * 40); }
    const Y = (m) => H - m * my;
    g.fillStyle = o.plinth; g.fillRect(0, Y(o.base), W, o.base * my);
    if (!PB) g.strokeStyle = 'rgba(0,0,0,0.22)'; else g.strokeStyle = 'rgba(0,0,0,0)'; g.lineWidth = 2; for (let f = 0; f <= o.floors; f++) { g.beginPath(); g.moveTo(0, Y(o.base + f * o.fh)); g.lineTo(W, Y(o.base + f * o.fh)); g.stroke(); }
    const ACC = ['#2f6fb0', '#e08a2a', '#6aa84f', '#c94a3a'];
    if (o.panel) { for (let x = 0; x < 36; x += 12) { g.fillStyle = (x / 12) % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(120,90,40,0.06)'; g.fillRect(x * mx, 0, 12 * mx, Y(o.base)); }
      g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 2; for (let x = 0; x <= 36; x += 3) { g.beginPath(); g.moveTo(x * mx, 0); g.lineTo(x * mx, Y(o.base)); g.stroke(); } }
    for (let f = 0; f < o.floors; f++) for (let c = 0; c < 36 / o.cw; c++) {
      if (o.balc && c % 4 === 1) { // лоджия: ниша на всю ячейку, остеклённая или открытая
        const lx0 = c * o.cw * mx + 3, lw = o.cw * mx - 6, ly0 = Y(o.base + (f + 1) * o.fh) + 3, lh = o.fh * my - 6, glz = r() < 0.65;
        g.fillStyle = '#3a3c3f'; g.fillRect(lx0, ly0, lw, lh); g.fillStyle = o.wall; g.fillRect(lx0, ly0 + lh * 0.55, lw, lh * 0.45); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(lx0, ly0 + lh * 0.55, lw, 3);
        if (glz) { const gr = g.createLinearGradient(lx0, ly0, lx0 + lw, ly0 + lh * 0.55); gr.addColorStop(0, '#9aa6b2'); gr.addColorStop(1, '#5c6874'); g.fillStyle = gr; g.fillRect(lx0 + 2, ly0 + 2, lw - 4, lh * 0.55 - 2); g.fillStyle = '#f0f0ec'; for (let k = 0; k <= 4; k++) g.fillRect(lx0 + k * (lw - 4) / 4, ly0, 4, lh * 0.55); g.fillRect(lx0, ly0, lw, 4); g.fillRect(lx0, ly0 + lh * 0.55 - 3, lw, 4); }
        else if (r() < 0.5) for (let k = 0; k < 4; k++) { g.fillStyle = ['#c84a4a', '#4a7ac8', '#e8e0c8', '#3a9a5a', '#d8b040'][(r() * 5) | 0]; g.fillRect(lx0 + 6 + k * lw / 4.4, ly0 + 10, lw / 6, lh * 0.25); }
        continue; }
      const wm = winW(o, c), tall = false, ww = wm * mx, wh = (tall ? 2.15 : o.wh) * my, x = (c * o.cw + (o.cw - wm) / 2) * mx, y = Y(o.base + f * o.fh + (tall ? 0.1 : o.sill)) - wh;
      if (o.accent && r() < 0.3) { g.fillStyle = ACC[(r() * 4) | 0]; g.fillRect(c * o.cw * mx + 2, Y(o.base + (f + 1) * o.fh) + 2, o.cw * mx - 4, o.fh * my - 4); }
      g.fillStyle = 'rgba(25,22,18,0.12)'; g.fillRect(x + ww * 0.2, y + wh, ww * 0.6, 14 + r() * 40);                          // потёк под подоконником
      const lit = r() < o.lit, t = r(), glow = t < 0.08 ? '#a8c0ff' : t < 0.3 ? '#ffe6c0' : t < 0.7 ? '#ffcf8a' : '#ffbe6a';
      g.fillStyle = o.frame; g.fillRect(x - 4, y - 4, ww + 8, wh + 8);
      if (lit) { g.fillStyle = glow; g.fillRect(x, y, ww, wh); e.fillStyle = glow; e.fillRect(x, y, ww, wh);
        if (r() < 0.7) { const cw = ww * (0.15 + r() * 0.25), cl = ['#7a3a2a', '#8a6a3a', '#3a4a6a', '#6a6a4a'][(r() * 4) | 0]; for (const k of [0, 1]) { g.fillStyle = cl; e.fillStyle = 'rgba(80,40,15,0.85)'; const xx = k ? x + ww - cw : x; g.fillRect(xx, y, cw, wh); e.fillRect(xx, y, cw, wh); } }
        if (r() < 0.1) { const sx = x + ww * (0.3 + r() * 0.4), sy = y + wh * 0.45; for (const c2 of [g, e]) { c2.fillStyle = 'rgba(8,6,5,0.92)'; c2.beginPath(); c2.arc(sx, sy, ww * 0.1, 0, 6.28); c2.fill(); c2.fillRect(sx - ww * 0.2, sy + ww * 0.12, ww * 0.4, wh); } }
        e.fillStyle = 'rgba(0,0,0,0.35)'; mull(e, x, y, ww, wh, wm);
      } else { const gr = g.createLinearGradient(x, y, x + ww * 0.4, y + wh); gr.addColorStop(0, '#8793a0'); gr.addColorStop(0.55, '#4a5560'); gr.addColorStop(1, '#6b7782'); g.fillStyle = gr; g.fillRect(x, y, ww, wh);
        const cur = r(); if (cur < 0.55) { g.fillStyle = 'rgba(236,234,224,0.5)'; g.fillRect(x, y + wh * 0.1, ww, wh * 0.9); } else if (cur < 0.75) { g.fillStyle = ['rgba(150,90,70,0.6)', 'rgba(90,110,140,0.6)', 'rgba(140,130,90,0.6)'][(r() * 3) | 0]; g.fillRect(x, y, ww * 0.3, wh); g.fillRect(x + ww * 0.7, y, ww * 0.3, wh); }
        if (r() < 0.14) { g.fillStyle = '#3d6a3a'; g.beginPath(); g.arc(x + ww * (0.2 + r() * 0.6), y + wh - 9, 7, 0, 6.28); g.fill(); } }
      g.fillStyle = o.frame; mull(g, x, y, ww, wh, wm);
    }
    const mk = (c) => { const t = texFrom(c, true); t.repeat.set(1 / 36, 1 / 28); return t; };
    const m = std({ map: mk(cc), emissiveMap: mk(ec), emissive: 0xffffff, emissiveIntensity: o.ei || 1.3, roughness: 0.92 }); m.userData.wc = lin(hexc(parseInt(o.wall.slice(1), 16), 0.8));
    if (PB) { const rp = (t) => { const c = t.clone(); c.repeat.set(1 / 1.5, 1 / 1.5); c.needsUpdate = !!t.image; (_clones[Object.keys(PBR.tex).find((k) => PBR.tex[k] === t)] || []).push(c); return c; };
      m.normalMap = rp(PBR.brick.nor); m.roughnessMap = rp(PBR.brick.arm); m.roughness = 1; const tb = rp(PBR.brick.map), wallC = new THREE.Color(o.wall);
      m.onBeforeCompile = (sh) => { sh.uniforms.tBrick = { value: tb }; sh.uniforms.uWall = { value: wallC };
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tBrick; uniform vec3 uWall; float fWall = 0.0;')
          .replace('#include <map_fragment>', `#include <map_fragment>
            fWall = 1.0 - diffuseColor.a; vec3 brT = texture2D(tBrick, vNormalMapUv).rgb; float brL = dot(brT, vec3(0.299, 0.587, 0.114));
            vec3 brick = brT * 1.05; diffuseColor.rgb = mix(diffuseColor.rgb, brick, fWall); diffuseColor.a = 1.0;`)
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(0.22, roughnessFactor, fWall);')
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(mix(nonPerturbedNormal, normal, fWall));'); }; }
    m.userData.o = o; return m;
  }
  const FAC = [  // светлый силикатный кирпич (как дом № 13), кремовые панельки, пятиэтажка
    facade(11, { pair: true, wall: '#cdcac2', plinth: '#8a8278', frame: '#f4f4f0', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.1, balc: true, brick: true }),
    facade(23, { pair: true, wall: '#c4c1b9', plinth: '#7e776e', frame: '#f2f2ee', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.12, balc: true, brick: true }),
    facade(37, { wall: '#e0d6bd', plinth: '#8a8070', frame: '#f4f2ea', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.1, balc: true, panel: true }),
    facade(41, { pair: true, wall: '#c9c4b8', plinth: '#7a7268', frame: '#f0efe8', base: 1.2, fh: 2.8, floors: 5, cw: 3, ww: 1.4, wh: 1.4, sill: 0.85, lit: 0.12, balc: true, brick: true }),
    facade(47, { wall: '#e6e3da', plinth: '#8c8a84', frame: '#f6f6f2', base: 1.6, fh: 2.8, floors: 9, cw: 3, ww: 1.5, wh: 1.45, sill: 0.85, lit: 0.1, balc: true, panel: true }),
  ];
  const SAD = facade(59, { wall: '#e4dac2', plinth: '#9a8a74', frame: '#f4f2ec', base: 0.6, fh: 3.3, floors: 2, cw: 3, ww: 1.6, wh: 1.5, sill: 0.9, lit: 0.08, balc: false });
  const mkWin = (key, W2, n) => { const H2 = 1.45, fw = 0.07, d = 0.1, frame = new Bag(), sill = new Bag(), glass = new Bag(), add = (bag, x, y, z, sx, sy, sz) => bag.add(new THREE.BoxGeometry(sx, sy, sz), new THREE.Matrix4().makeTranslation(x, y, z));
    add(frame, -W2 / 2 + fw / 2, H2 / 2, d / 2, fw, H2, d); add(frame, W2 / 2 - fw / 2, H2 / 2, d / 2, fw, H2, d); add(frame, 0, H2 - fw / 2, d / 2, W2, fw, d); add(frame, 0, fw / 2, d / 2, W2, fw, d);
    for (let k = 1; k < n; k++) add(frame, -W2 / 2 + W2 * k / n, H2 / 2, d * 0.45, 0.06, H2 - fw * 2, d * 0.7);
    add(sill, 0, -0.03, 0.12, W2 + 0.16, 0.035, 0.26); add(sill, 0, H2 + 0.06, 0.04, W2 + 0.2, 0.1, 0.08);
    glass.add(new THREE.PlaneGeometry(W2 - fw * 2, H2 - fw * 2), new THREE.Matrix4().makeTranslation(0, H2 / 2, 0.035));
    const mF = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.35, metalness: 0 }), mS = new THREE.MeshStandardMaterial({ color: 0x9a9a98, roughness: 0.45, metalness: 0.6 });
    const mG = new THREE.MeshStandardMaterial({ color: 0x8a96a4, roughness: 0.04, metalness: 1, transparent: true, opacity: 0.32, envMapIntensity: 1.4, depthWrite: false });
    PROTO[key] = { parts: [[mF, frame.build()], [mS, sill.build()], [mG, glass.build()]], col: false }; };
  if (!PROTO.m_win) { mkWin('m_win', 1.5, 2); mkWin('m_win2', 1.4, 2); mkWin('m_win3', 2.1, 3); }
  const SCHOOL = facade(53, { wall: '#a8553c', plinth: '#6a6a66', frame: '#e8e4dc', base: 1.0, fh: 3.6, floors: 3, cw: 3, ww: 2.2, wh: 2.2, sill: 0.9, lit: 0.1, balc: false, brick: true, ei: 1.1 });
  const SCHOOL2 = facade(67, { wall: '#ecebe6', plinth: '#8a8d90', frame: '#3a4046', base: 0.8, fh: 3.6, floors: 3, cw: 3, ww: 2.5, wh: 2.1, sill: 0.9, lit: 0.3, balc: false, accent: true, ei: 1.0 });
  const lampOff = std({ color: 0x9a9a94, roughness: 0.5 });
  const shopGlass = std({ color: 0x555555, emissive: 0xfff4e0, emissiveIntensity: 0.9, map: texFrom(mkCanvas(256, 128, (g, w, h) => { g.fillStyle = '#ddd'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = '#556'; g.fillRect(0, 20 + i * 26, w, 5); for (let k = 0; k < 40; k++) { g.fillStyle = ['#c33', '#3a3', '#dd4', '#36c', '#fff'][(k * 7 + i) % 5]; g.fillRect(k * 6.4 + 1, 8 + i * 26, 4, 12); } } g.fillStyle = 'rgba(0,0,0,0.5)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 4, h); })) });
  shopGlass.emissiveMap = shopGlass.map;
  const signCache = new Map();
  function sign(text, bg, fg, w = 512, font = 'bold 66px sans-serif', lit = 0) { const k = text + bg + lit; if (signCache.has(k)) return signCache.get(k); const m = signMat(text, bg, fg, w, 112, font); if (lit) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = lit; } signCache.set(k, m); return m; }
  const plate = (text) => sign(text, '#1f3f8f', '#fff', 512, 'bold 44px sans-serif');
  const RED = lin([0.55, 0.2, 0.15]), YEL = lin([0.75, 0.6, 0.2]), BLU = lin([0.22, 0.36, 0.56]), GRN = lin([0.24, 0.42, 0.3]), CRM = lin([0.8, 0.76, 0.62]), RUST = lin([0.36, 0.2, 0.12]);
  const peel = (c, r) => c.map((v) => v * (0.7 + r() * 0.4));
  const SMELLS = [];
  const smell = (K, x, z, text) => SMELLS.push({ x, z, text, group: K.group });
  const PUT = (K, key, x, y, z, ry = 0, s = 1, sy = s) => K.put(key, new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), new V3(s, sy, s)));

  // --- уличные фонари (днём не горят) и провода ---
  function lampPole(K, x, z, ax, az) { const { b } = K; if (PROTO.m_pole) PUT(K, 'm_pole', x, 0, z, K.r() * 6, 1.25, 0.95); else b.cyl(M.metal, x, 3.2, z, 0.09, 0.06, 6.4, 8, PAINT.dark); b.pipe(M.metal, new V3(x, 6.3, z), new V3(x + ax * 1.3, 6.45, z + az * 1.3), 0.04, PAINT.dark);
    b.box(lampOff, x + ax * 1.4, 6.38, z + az * 1.4, 0.55, 0.12, 0.28, null, 0, Math.atan2(az, ax) * -1); b.collide(x, z, 0.15, 0.15); K.take(x, z, 0.6); }
  function wire(b, a, c, sag) { const N = 8; for (let k = 0; k < N; k++) { const t0 = k / N, t1 = (k + 1) / N, s0 = Math.sin(t0 * Math.PI) * sag, s1 = Math.sin(t1 * Math.PI) * sag; b.lines.push(new V3(lerp(a.x, c.x, t0), lerp(a.y, c.y, t0) - s0, lerp(a.z, c.z, t0)), new V3(lerp(a.x, c.x, t1), lerp(a.y, c.y, t1) - s1, lerp(a.z, c.z, t1))); } }
  function bench(K, x, z, ry) { const { b, r } = K; b.push(x, 0, z, ry); b.box(M.plank, 0, 0.45, 0, 1.8, 0.05, 0.42, peel(GRN, r)); b.box(M.plank, 0, 0.8, -0.2, 1.8, 0.3, 0.05, peel(GRN, r)); for (const s of [-0.7, 0.7]) b.box(M.conc, s, 0.22, 0, 0.12, 0.44, 0.4, shade(0.7)); b.collide(0, 0, 0.9, 0.25); b.pop(); K.take(x, z, 1.1); }
  function parked(K, x, z, ry) { const { b, r } = K, c = lin(hexc(CAR_PAINT[(r() * CAR_PAINT.length) | 0])); if (PROTO.m_ccar && r() < 0.2) { PUT(K, 'm_ccar', x, 0, z, ry + Math.PI / 2); b.push(x, 0, z, ry); b.collide(0, 0, 2.2, 0.9); b.pop(); K.take(x, z, 2.4); return; } b.push(x, 0, z, ry);
    b.box(M.paint, 0, 0.62, 0, 4.2, 0.6, 1.66, c); b.box(M.paint, -0.15, 1.18, 0, 2.1, 0.55, 1.5, c.map((v) => v * 0.8)); b.box(M.glass, -0.15, 1.2, 0, 2.0, 0.42, 1.52); b.box(M.glass, -0.15, 1.2, 0, 2.12, 0.4, 1.3);
    for (const sx of [-1.35, 1.35]) for (const sz of [-0.78, 0.78]) b.cyl(M.rubber, sx, 0.31, sz, 0.31, 0.31, 0.22, 10, null, Math.PI / 2);
    b.collide(0, 0, 2.15, 0.88); b.pop(); K.take(x, z, 2.4); }
  // белая «Волга» восьмидесятых у обочины
  function volga(K, x, z, ry) { const { b } = K, w = lin([0.86, 0.86, 0.82]), ch = PAINT.galv; b.push(x, 0, z, ry);
    b.box(M.paint, 0, 0.66, 0, 4.9, 0.5, 1.8, w); b.box(M.paint, 0, 0.4, 0, 4.7, 0.16, 1.72, shade(0.2)); b.box(M.paint, -0.25, 1.17, 0, 2.3, 0.52, 1.62, w); b.box(M.glass, -0.25, 1.19, 0, 2.2, 0.4, 1.64); b.box(M.glass, -0.25, 1.19, 0, 2.32, 0.38, 1.42);
    b.box(M.paint, 1.75, 0.93, 0, 1.4, 0.06, 1.74, w); b.box(M.paint, -1.9, 0.93, 0, 1.1, 0.06, 1.74, w);
    b.box(M.metal, 2.5, 0.5, 0, 0.12, 0.14, 1.86, ch); b.box(M.metal, -2.5, 0.5, 0, 0.12, 0.14, 1.86, ch); b.box(M.paint, 2.46, 0.72, 0, 0.04, 0.22, 1.0, shade(0.12)); b.box(M.metal, 2.47, 0.72, 0, 0.03, 0.03, 1.02, ch);
    for (const s of [-0.68, 0.68]) { b.cyl(M.metal, 2.46, 0.72, s, 0.11, 0.11, 0.05, 12, lin([0.9, 0.9, 0.85]), 0, Math.PI / 2); b.box(M.paint, -2.46, 0.72, s, 0.04, 0.14, 0.34, lin([0.5, 0.06, 0.05])); }
    for (const sx of [-1.5, 1.55]) for (const sz of [-0.82, 0.82]) { b.cyl(M.rubber, sx, 0.33, sz, 0.33, 0.33, 0.22, 12, null, Math.PI / 2); b.cyl(M.metal, sx, 0.33, sz * 1.14, 0.17, 0.17, 0.02, 10, ch, Math.PI / 2); }
    b.collide(0, 0, 2.5, 0.95); b.pop(); K.take(x, z, 2.8); }
  function fallenPole(K, x, z, ry) { const { b } = K; b.push(x, 0, z, ry); b.cyl(M.conc, 0, 0.16, 0, 0.13, 0.18, 6.5, 10, shade(0.75), 0, Math.PI / 2); b.box(M.conc, -3.6, 0.12, 0.3, 1.6, 0.24, 0.9, shade(0.7), 0, 0.3, 0); b.box(M.conc, -2.9, 0.35, -0.1, 0.5, 0.5, 0.5, shade(0.65), 0, 0.5, 0.1); b.collide(0, 0, 3.3, 0.22); b.pop(); K.take(x, z, 3.5); }
  // детская площадка с облезлой краской: горка, качели-балансиры, качели, песочница, домик с цветной крышей
  function playground(K, x, z, bright) { const { b, r } = K; K.take(x, z, 8);
    b.push(x - 4, 0, z - 1, r() * 0.4); for (const sx of [-0.4, 0.4]) for (const sz of [-0.4, 0.4]) b.cyl(M.metal, sx, 0.8, sz, 0.04, 0.04, 1.6, 6, peel(RED, r));
    b.box(M.plank, 0, 1.55, 0, 0.9, 0.06, 0.9, shade(0.5)); b.box(M.metal, 0, 0.85, 1.6, 0.6, 0.04, 2.4, peel(BLU, r), -0.62); for (let k = 0; k < 5; k++) b.box(M.metal, 0, 0.25 + k * 0.3, -0.45, 0.8, 0.03, 0.03, peel(YEL, r)); b.collide(0, 0.6, 0.5, 1.4); b.pop();
    for (let q = 0; q < 2; q++) { b.push(x + 0.5 + q * 1.6, 0, z - 3.2, 0.2); const tilt = q ? 0.22 : -0.22; b.box(M.metal, 0, 0.3, 0, 0.3, 0.6, 0.12, peel(RED, r)); b.box(M.plank, 0, 0.62, 0, 0.22, 0.05, 3.0, peel(q ? YEL : BLU, r), tilt); for (const s of [-1, 1]) b.box(M.metal, 0, 0.82 - s * tilt * 1.3, s * 1.3, 0.3, 0.03, 0.03, peel(RED, r)); b.pop(); }
    b.push(x + 3.6, 0, z - 0.5, 0); for (const s of [-1.1, 1.1]) { b.pipe(M.metal, new V3(s, 0, -0.7), new V3(s, 2.3, 0), 0.05, peel(YEL, r)); b.pipe(M.metal, new V3(s, 0, 0.7), new V3(s, 2.3, 0), 0.05, peel(YEL, r)); }
    b.pipe(M.metal, new V3(-1.1, 2.3, 0), new V3(1.1, 2.3, 0), 0.05, peel(YEL, r)); for (const s of [-0.25, 0.25]) b.pipe(M.metal, new V3(s, 2.3, 0), new V3(s + 0.06, 0.5, 0.18), 0.012, PAINT.galv); b.box(M.plank, 0.06, 0.48, 0.18, 0.6, 0.04, 0.3, shade(0.5)); b.collide(-1.1, 0, 0.1, 0.7); b.collide(1.1, 0, 0.1, 0.7); b.pop();
    for (const [dx, dz, sx, sz] of [[0, -1.2, 2.6, 0.12], [0, 1.2, 2.6, 0.12], [-1.25, 0, 0.12, 2.4], [1.25, 0, 0.12, 2.4]]) b.box(M.plank, x - 3.6 + dx, 0.15, z + 3.6 + dz, sx, 0.3, sz, peel(BLU, r));
    b.box(M.paint, x - 3.6, 0.1, z + 3.6, 2.4, 0.12, 2.3, lin([0.55, 0.47, 0.33]));
    // домик: четыре стойки, низкие стенки, двускатная крыша из цветного пластика
    b.push(x + 1.5, 0, z + 2.5, 0); const RC = bright ? [lin([0.95, 0.12, 0.1]), lin([1.0, 0.8, 0.05]), lin([0.1, 0.4, 0.95]), lin([0.1, 0.75, 0.25])] : [peel(RED, r), peel(YEL, r), peel(BLU, r), peel(GRN, r)];
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.9, 0.9]) b.box(M.plank, sx, 0.85, sz, 0.09, 1.7, 0.09, shade(0.6)); b.box(M.plank, 0, 0.4, -0.9, 1.8, 0.7, 0.04, peel(YEL, r)); b.box(M.plank, -0.9, 0.4, 0, 0.04, 0.7, 1.8, peel(GRN, r)); b.box(M.plank, 0.9, 0.4, 0, 0.04, 0.7, 1.8, peel(RED, r));
    for (let k = 0; k < 4; k++) { b.box(M.paint, -0.75 + k * 0.5, 2.05, -0.5, 0.5, 0.03, 1.25, RC[k % 4], 0.62); b.box(M.paint, -0.75 + k * 0.5, 2.05, 0.5, 0.5, 0.03, 1.25, RC[(k + 2) % 4], -0.62); } b.pop(); }
  function trashSite(K, x, z, ry) { const { b, r } = K; b.push(x, 0, z, ry); for (const s of [-1.6, 0, 1.6]) b.box(M.metal, s, 0.6, 0, 1.4, 1.15, 1.0, peel(GRN, r));
    b.box(M.prof, 0, 1.0, -0.8, 5.2, 2.0, 0.05, shade(0.75)); b.box(M.prof, -2.6, 1.0, 0, 0.05, 2.0, 1.6, shade(0.75)); b.box(M.prof, 2.6, 1.0, 0, 0.05, 2.0, 1.6, shade(0.75));
    if (PROTO.m_bag) { for (let k = 0; k < 5; k++) { const w = b.world(-2.2 + r() * 4.4, 0, 0.75 + r() * 0.8); PUT(K, r() < 0.6 ? 'm_bag' : 'm_box', w.x, 0, w.z, r() * 6, 0.9 + r() * 0.4); } } else for (let k = 0; k < 3; k++) b.box(M.paint, -2 + r() * 4, 0.12 + k * 0.02, 0.9 + r() * 0.5, 0.6, 0.2 + r() * 0.2, 0.45, lin([0.42, 0.33, 0.22]), 0, r(), 0); b.collide(0, -0.1, 2.7, 0.8); b.pop(); K.take(x, z, 3.2); smell(K, x, z, 'Пахнет мокрым картоном.'); }
  // --- дом из серого кирпича: кондиционеры гроздьями, антенны, водостоки, полосатые козырьки ---
  function panel(K, cx, cz, len, dep, floors, ry, fac, home) {
    const { b, group, r } = K, base = floors === 9 ? 1.6 : 1.2, Hh = base + floors * 2.8 + 0.5, uo = ((r() * 12) | 0) * 3, wc = fac.userData.wc;
    b.push(cx, 0, cz, ry);
    b.box(M.conc, 0, Hh / 2, 0, len, Hh, dep, wc); b.box(M.conc, 0, Hh + 0.1, 0, len + 0.3, 0.2, dep + 0.3, shade(0.4)); b.box(M.conc, len * 0.2, Hh + 1.2, 0, 4, 2.0, 3.5, shade(0.5));
    for (const s of [1, -1]) { const g = new THREE.PlaneGeometry(len, Hh); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len + uo + (s < 0 ? 21 : 0), uv.getY(i) * Hh); b.add(fac, g, new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI).setPosition(0, Hh / 2, s * (dep / 2 + 0.02))); }
    b.collide(0, 0, len / 2, dep / 2);
    { const o = fac.userData.o; if (o && PROTO.m_win) for (const s of [1, -1]) { const uo2 = uo + (s < 0 ? 21 : 0);
      for (let k = 0; k * 3 < len - 0.5; k++) { const col = ((k + uo2 / 3) % 12 + 12) % 12; if (o.balc && (col % (o.cw === 3 ? 4 : 4)) === 1) continue; const xp = -len / 2 + k * 3 + 1.5, xl = s > 0 ? xp : -xp;
        for (let f = 0; f < floors; f++) { const y = o.base + f * o.fh + o.sill, w = b.world(xl, y, s * (dep / 2 + 0.02));
          const wm = winW(o, col), key = o.pair ? (wm > 1.8 ? 'm_win3' : 'm_win2') : 'm_win'; K.put(key, new THREE.Matrix4().compose(new V3(w.x, y, w.z), new THREE.Quaternion().setFromAxisAngle(UP, ry + (s > 0 ? 0 : Math.PI)), new V3(o.pair ? 1 : o.ww / 1.5, o.wh / 1.45, 1))); } } } }
    // антенны и провода на крыше
    const ants = []; for (let q = 0; q < 6 + ((r() * 5) | 0); q++) { const ax = (r() - 0.5) * (len - 3), az = (r() - 0.5) * (dep - 2), h = 2 + r() * 2.2; b.cyl(M.metal, ax, Hh + 0.2 + h / 2, az, 0.02, 0.02, h, 5, RUST); for (let e2 = 0; e2 < 3; e2++) b.box(M.metal, ax, Hh + h - e2 * 0.32, az, 0.95 - e2 * 0.22, 0.02, 0.02, RUST, 0, r() * 3); ants.push(b.world(ax, Hh + 0.2 + h, az)); }
    for (let q = 1; q < ants.length; q++) if (r() < 0.6) wire(b, ants[q - 1], ants[q], 0.4);
    // водосточные трубы
    for (const sx of [-len / 2 + 0.4, len / 2 - 0.4]) for (const s of [1, -1]) { if (PROTO.m_gutter) { for (let y = 0; y < Hh - 0.5; y += 1) { const w = b.world(sx, y, s * (dep / 2 + 0.12)); PUT(K, 'm_gutter', w.x, y, w.z, 0, 1.3, 1.0); } } else b.cyl(M.metal, sx, Hh / 2, s * (dep / 2 + 0.12), 0.07, 0.07, Hh, 6, lin([0.42, 0.44, 0.45])); }
    // кондиционеры гроздьями
    for (const s of [1, -1]) { const ncl = 2 + ((r() * 3) | 0); for (let q = 0; q < ncl; q++) { const c = (r() * (len / 3)) | 0, f0 = 1 + ((r() * (floors - 2)) | 0), nf = 1 + ((r() * 4) | 0), off = r() < 0.5 ? 0.5 : 2.5;
      for (let f = f0; f < Math.min(floors, f0 + nf); f++) if (r() < 0.8) { const x = -len / 2 + c * 3 + off, y = base + f * 2.8 + 0.45, zz = s * (dep / 2 + 0.2);
        if (PROTO.m_ac) { const w = b.world(x, y - 0.45, s * (dep / 2 + 0.19)); PUT(K, 'm_ac', w.x, y - 0.45, w.z, ry + (s > 0 ? 0 : Math.PI), 0.95);
          const c1 = b.world(x + 0.45, y, s * (dep / 2 + 0.05)), c2 = b.world(x + 0.55 + r() * 0.3, y + 1.3 + r() * 0.6, s * (dep / 2 + 0.05)), c3 = b.world(x + 0.5, y - 0.6, s * (dep / 2 + 0.05)); b.lines.push(c1, c2); if (r() < 0.5) b.lines.push(c1, c3); }
        else { b.box(M.paint, x, y, zz, 0.78, 0.52, 0.32, shade(0.8 + r() * 0.12)); b.box(M.paint, x - 0.1, y, zz + s * 0.165, 0.42, 0.42, 0.01, shade(0.22)); } } } }
    // подъезды
    const AD = home && typeof home === 'object' ? home : null; const n = Math.max(1, Math.round(len / 12)); const street = AD ? AD.st : home ? DV_STREETS[0] : DV_STREETS[(r() * DV_STREETS.length) | 0]; let num = 1 + ((r() * 60) | 0); if (num === 13) num = 15; if (home) num = AD ? AD.n : 13;
    for (let i = 0; i < n; i++) { const lx = -len / 2 + len / (2 * n) * (2 * i + 1), fz = dep / 2;
      b.box(M.metal, lx, 1.05, fz + 0.04, 1.1, 2.1, 0.08, lin([0.2, 0.17, 0.15])); b.box(M.metal, lx + 0.75, 1.3, fz + 0.06, 0.18, 0.3, 0.04, PAINT.galv); if (r() < 0.6) b.add(MPC.notice, new THREE.PlaneGeometry(0.24, 0.32), new THREE.Matrix4().makeRotationZ((r() - 0.5) * 0.1).setPosition(lx - 0.2, 1.45, fz + 0.09));
      b.box(M.conc, lx, 2.7, fz + 0.75, 2.4, 0.14, 1.6, shade(0.6)); b.box(M.conc, lx, 0.08, fz + 0.75, 2.4, 0.16, 1.5, shade(0.55)); for (const s of [-1.1, 1.1]) b.cyl(M.metal, lx + s, 1.35, fz + 1.45, 0.035, 0.035, 2.7, 6, PAINT.dark);
      for (let k = 0; k < 8; k++) b.box(M.paint, lx - 1.05 + k * 0.3, 2.86, fz + 0.8, 0.3, 0.03, 1.72, k % 2 ? CRM : RED, 0.1);                 // полосатый козырёк
      if (PROTO.m_slight) { const w = b.world(lx, 2.3, fz + 0.02); PUT(K, 'm_slight', w.x, 2.3, w.z, ry, 1.1); } else b.box(lampOff, lx, 2.52, fz + 0.3, 0.3, 0.08, 0.18);
      const pn = b.world(lx, 0, fz + 1.1); const id = `${Math.round(pn.x)},${Math.round(pn.z)}`, isHome = home === true && i === n - 1, open = !isHome && ihash(Math.round(pn.x), Math.round(pn.z), 5) < 0.2;
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), plate(String(i + 1))); const pp = b.world(lx, 2.2, fz + 0.03); pm.position.copy(pp); pm.rotation.y = ry; group.add(pm);
      INTER.push({ x: pn.x, z: pn.z, r: 1.6, group, label: () => isHome ? 'E — домой, кв. 47' : 'E — домофон', act: () => dvDoor(isHome, open, id) });
      if (isHome) smell(K, pn.x, pn.z - 1.5, 'Из форточки первого этажа пахнет жареным луком.');
      if (!isHome && r() < 0.5) { const bp = b.world(lx + 2.2, 0, fz + 1.6); b.pop(); bench(K, bp.x, bp.z, ry + Math.PI); b.push(cx, 0, cz, ry); }
    }
    const am = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.35), plate(`ул. ${street}, ${num}`)); const ap = b.world(len / 2 + 0.03, 3.2, dep / 2 - 1.3); am.position.copy(ap); am.rotation.y = ry + Math.PI / 2; group.add(am);
    b.pop();
  }
  function pavilion(K, cx, cz, ry, kind, truck) { const { b, group, r } = K; const S = { 5: ['ПЯТЁРОЧКА', '#ffffff', '#d4202a', 'magazin', '«Пятёрочку»'], m: ['МАГНИТ', '#d8202a', '#ffffff', 'magazin', '«Магнит»'], p: ['ПРОДУКТЫ', '#1a2a6a', '#ffd23a', 'magazin', 'магазин'], a: ['АПТЕКА', '#1a8a3a', '#ffffff', 'bolnica', 'аптеку'], f: ['ЦВЕТЫ', '#d0307a', '#ffffff', 'magazin', '«Цветы»'] }[kind];
    b.push(cx, 0, cz, ry); b.box(M.conc, 0, 2.1, 0, 18, 4.2, 10, lin([0.72, 0.7, 0.66])); b.box(M.conc, 0, 4.28, 0, 18.4, 0.16, 10.4, shade(0.4));
    b.box(shopGlass, -3.5, 1.6, 5.02, 9, 2.4, 0.04); b.box(shopGlass, 6, 1.6, 5.02, 4, 2.4, 0.04); b.box(M.glass, 2.2, 1.15, 5.03, 1.6, 2.3, 0.04);
    b.box(M.conc, 0, 0.08, 6.0, 7, 0.16, 2.0, shade(0.5)); b.collide(0, 0, 9, 5);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.3), sign(S[0], S[1], S[2], 768, 'bold 78px sans-serif', 0.5)); const sp = b.world(0, 3.45, 5.06); sm.position.copy(sp); sm.rotation.y = ry; group.add(sm);
    const dp = b.world(2.2, 0, 6.3); INTER.push({ x: dp.x, z: dp.z, r: 1.8, group, label: `E — зайти в ${S[4]}`, act: () => goWorld(S[3], S[3] === 'bolnica' ? 'В аптеке пахнет хлоркой. Коридор уходит дальше, чем должен.' : 'Внутри магазин оказался больше, чем снаружи.') });
    if (truck) { // к четырём часам у магазина разгружается машина
      b.push(-12.5, 0, 8.2, 0); const cab = lin([0.2, 0.32, 0.5]); b.box(M.paint, 2.3, 1.2, 0, 1.7, 1.6, 2.0, cab); b.box(M.glass, 3.16, 1.6, 0, 0.03, 0.7, 1.8); b.box(M.paint, -0.9, 1.75, 0, 4.4, 2.5, 2.2, shade(0.8)); b.box(M.paint, -0.9, 0.45, 0, 6.0, 0.2, 1.9, shade(0.15));
      for (const sx of [2.2, -2.2]) for (const sz of [-0.95, 0.95]) b.cyl(M.rubber, sx, 0.38, sz, 0.38, 0.38, 0.26, 10, null, Math.PI / 2);
      for (const s of [-1, 1]) b.box(M.paint, -3.5, 1.75, s * 1.55, 0.04, 2.4, 1.05, shade(0.75), 0, s * 0.5, 0);
      for (let k = 0; k < 6; k++) b.box(M.plank, -4.6 - (k % 3) * 0.55, 0.18 + ((k / 3) | 0) * 0.34, -0.6 + (k % 2) * 0.7, 0.5, 0.32, 0.4, shade(0.6 + r() * 0.3));
      b.collide(-0.5, 0, 3.2, 1.15); b.pop(); }
    b.pop(); }
  function schoolBody(K, cx, cz, ry, fac, name, L, D) { const { b, group } = K, Hh = fac === SCHOOL2 ? 0.8 + 3 * 3.6 + 0.5 : 1.0 + 3 * 3.6 + 0.6;
    b.push(cx, 0, cz, ry); b.box(M.conc, 0, Hh / 2, 0, L, Hh, D, fac.userData.wc); b.box(M.conc, 0, Hh + 0.1, 0, L + 0.3, 0.2, D + 0.3, shade(0.4));
    for (const s of [1, -1]) { const g = new THREE.PlaneGeometry(L, Hh); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L, uv.getY(i) * Hh); b.add(fac, g, new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI).setPosition(0, Hh / 2, s * (D / 2 + 0.02))); }
    b.collide(0, 0, L / 2, D / 2); b.box(M.conc, 0, 3.3, D / 2 + 1.5, 6, 0.25, 3, shade(0.7)); for (const s of [-2.6, 2.6]) b.cyl(M.conc, s, 1.65, D / 2 + 2.7, 0.18, 0.18, 3.3, 10, shade(0.8)); b.box(M.glass, 0, 1.2, D / 2 + 0.03, 2.2, 2.4, 0.04);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), sign(name, fac === SCHOOL2 ? '#2f6fb0' : '#e8e4d8', fac === SCHOOL2 ? '#ffffff' : '#1a3a7a')); const sp = b.world(0, 4.3, D / 2 + 0.04); sm.position.copy(sp); sm.rotation.y = ry; group.add(sm);
    const dp = b.world(0, 0, D / 2 + 1.4); INTER.push({ x: dp.x, z: dp.z, r: 1.8, group, label: 'E — войти в школу', act: () => goWorld('shkola', fac === SCHOOL2 ? 'Новая школа. Внутри пахнет краской и резиной. Коридоры те же.' : 'Дверь школы не заперта. Уроки давно кончились.') });
    return () => b.pop(); }
  const paverMat = rep(std({ roughness: 0.8, map: texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(83); g.fillStyle = '#6a625a'; g.fillRect(0, 0, w, h); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { g.fillStyle = ['#b8a89a', '#a89688', '#c6b8a8', '#9a7a6a', '#b0a090'][(r() * 5) | 0]; g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); } })) }), 2, 2);
  function kindergarten(K, cx, cz, ry) { const { b, r } = K, L = 40, D = 12, Hh = 0.6 + 2 * 3.3 + 0.5, OR = lin([0.82, 0.42, 0.22]), WH = shade(0.92);
    b.push(cx, 0, cz, ry); b.box(M.conc, 0, Hh / 2, 0, L, Hh, D, SAD.userData.wc); b.box(M.conc, 0, Hh + 0.1, 0, L + 0.4, 0.22, D + 0.4, shade(0.35));
    for (const s of [1, -1]) { const g = new THREE.PlaneGeometry(L, Hh); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L, uv.getY(i) * Hh); b.add(SAD, g, new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI).setPosition(0, Hh / 2, s * (D / 2 + 0.02))); }
    b.collide(0, 0, L / 2, D / 2);
    for (const sx of [-13, 0, 13]) { b.box(M.paint, sx, 3.4, D / 2 + 1.2, 3.2, 6.8, 2.4, OR); b.box(M.paint, sx - 1.0, 1.0, D / 2 + 3.0, 1.2, 2.0, 1.4, OR);   // оранжевые лестничные блоки
      for (const q of [-0.5, 0.5]) b.pipe(M.metal, new V3(sx + 1.6 + q * 0.3, 0.2, D / 2 + 4.4), new V3(sx + 1.6 + q * 0.3, 3.6, D / 2 + 1.2), 0.05, WH); b.box(M.paint, sx + 1.6, 1.9, D / 2 + 2.8, 0.5, 0.1, 3.6, WH, Math.atan2(3.4, 3.2)); b.collide(sx, D / 2 + 2.2, 1.9, 2.2); }
    // площадка с плиткой, газон-овал, веранды
    b.box(paverMat, 0, 0.03, D / 2 + 5.7, L - 4, 0.06, 10); const lawn = new THREE.CylinderGeometry(1, 1, 0.08, 24); b.add(M.paint, lawn, new THREE.Matrix4().compose(new V3(-6, 0.06, D / 2 + 7.5), new THREE.Quaternion(), new V3(6.5, 1, 2.6)), lin([0.3, 0.42, 0.2]));
    for (const [px, pc] of [[10, lin([0.55, 0.22, 0.2])], [-16, lin([0.42, 0.24, 0.18])], [3, lin([0.6, 0.6, 0.62])]]) { const pz = D / 2 + 6.5 + r() * 1.5; for (const dx of [-2, 2]) for (const dz of [-1.5, 1.5]) b.box(M.metal, px + dx, 1.2, pz + dz, 0.08, 2.4, 0.08, shade(0.3)); b.box(M.prof, px, 2.45, pz, 4.6, 0.06, 3.6, pc, 0.06); b.collide(px, pz, 2.3, 1.8); }
    b.pop(); }
  function profFence(b, x0, x1, z, gap) { for (let x = x0; x < x1 - 0.1; x += 2.5) { if (gap && Math.abs(x + 1.25 - gap) < 2) continue; b.box(M.prof, x + 1.25, 1.0, z, 2.45, 2.0, 0.04, lin([0.16, 0.36, 0.26])); b.box(M.metal, x, 1.05, z, 0.06, 2.1, 0.06, shade(0.25)); } }
  function fenceRun(b, x0, x1, z, c) { for (let x = x0; x < x1 - 0.1; x += 2.5) { b.box(M.metal, x, 0.8, z, 0.05, 1.6, 0.05, c); b.box(M.metal, x + 1.25, 1.5, z, 2.5, 0.04, 0.04, c); b.box(M.metal, x + 1.25, 0.3, z, 2.5, 0.04, 0.04, c); for (let k = 1; k < 8; k++) b.box(M.metal, x + 0.31 * k, 0.9, z, 0.02, 1.2, 0.02, c); } }
  function school(K, cx, cz, ry, num) { const end = schoolBody(K, cx, cz, ry, SCHOOL, `ШКОЛА № ${num}`, 36, 14), { b } = K; fenceRun(b, -21, 21, -12, GRN); fenceRun(b, -21, -3, 15, GRN); fenceRun(b, 3, 21, 15, GRN); b.collide(-12, 15, 9, 0.1); b.collide(12, 15, 9, 0.1); b.collide(0, -12, 21, 0.1); end(); }
  // новая школа № 121: светлые панели с цветными вставками и резиновый стадион
  function school2(K, cx, cz, ry) { const end = schoolBody(K, cx, cz, ry, SCHOOL2, 'ШКОЛА № 121', 36, 14), { b } = K;
    b.box(M.paint, 0, 0.02, -20, 34, 0.04, 16, lin([0.62, 0.2, 0.16])); b.box(M.paint, 0, 0.035, -20, 28, 0.04, 10, lin([0.2, 0.45, 0.22])); b.box(M.paint, 0, 0.045, -20, 0.1, 0.04, 10, shade(0.9));
    for (const s of [-1, 1]) { b.box(M.paint, 0, 0.045, -20 + s * 6.5, 34, 0.04, 0.08, shade(0.9)); for (const q of [-1.5, 1.5]) b.cyl(M.metal, s * 13.6, 1.0, -20 + q, 0.04, 0.04, 2, 6, shade(0.9)); b.box(M.metal, s * 13.6, 2.0, -20, 0.06, 0.06, 3.0, shade(0.9)); }
    fenceRun(b, -18, 18, -28.5, lin([0.3, 0.3, 0.32])); b.collide(0, -28.5, 18, 0.1); end(); }
  function busStop(K, x, z, ry, name) { const { b, group } = K; b.push(x, 0, z, ry); b.box(M.conc, 0, 0.06, 0, 5.4, 0.12, 2.4, shade(0.6)); b.box(M.prof, 0, 1.3, -1.0, 5.0, 2.4, 0.05, lin([0.25, 0.4, 0.55])); for (const s of [-2.5, 2.5]) b.box(M.glass, s, 1.3, -0.3, 0.05, 2.2, 1.4);
    b.box(M.prof, 0, 2.55, -0.2, 5.4, 0.06, 2.0, shade(0.5)); b.box(M.plank, 0, 0.5, -0.7, 3.6, 0.06, 0.38, shade(0.6)); for (const s of [-1.5, 1.5]) b.box(M.metal, s, 0.25, -0.7, 0.06, 0.5, 0.3, PAINT.dark);
    b.cyl(M.metal, 3.2, 1.3, 0.9, 0.04, 0.04, 2.6, 8, PAINT.galv); const am = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), sign('А', '#f0f0f0', '#1a3a8a', 128, 'bold 90px sans-serif')); am.position.copy(b.world(3.2, 2.5, 0.92)); am.rotation.y = ry; group.add(am);
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.42), sign(name, '#f4f4f0', '#1a3a7a', 768, 'bold 54px sans-serif')); nm.position.copy(b.world(0, 2.78, 0.82)); nm.rotation.y = ry; group.add(nm);
    b.cyl(M.metal, -3.0, 0.4, 0.3, 0.22, 0.26, 0.8, 10, GRN); b.collide(0, -1.0, 2.5, 0.12);
    const p = b.world(0, 0, 0.6); INTER.push({ x: p.x, z: p.z, r: 2.0, group, label: 'E — ждать автобус', act: () => goWorld('ostanovka', 'Автобус на Тракторозаводскую. Двери закрываются.') }); b.pop(); K.take(x, z, 3.5); }
  // --- записки и каштаны ---
  const cardMat = std({ roughness: 0.9, map: texFrom(mkCanvas(128, 160, (g, w, h) => { g.fillStyle = '#eeeade'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,120,170,0.5)'; g.lineWidth = 1; for (let i = 8; i < w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (let i = 8; i < h; i += 8) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } g.strokeStyle = 'rgba(200,60,60,0.6)'; g.beginPath(); g.moveTo(w - 22, 0); g.lineTo(w - 22, h); g.stroke(); g.fillStyle = '#2a3a7a'; for (let i = 0; i < 7; i++) g.fillRect(10, 22 + i * 16, 50 + ((i * 37) % 40), 2); })) });
  const nutMat = std({ color: 0x5a2a12, roughness: 0.25 });
  function addCard(K, x, z, id) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.004, 0.19), cardMat); m.rotation.y = K.r() * 6; addItem(K.group, m, x, 0.02, z, id, 'Записка'); coinsLive[coinsLive.length - 1].kind = 'card'; }
  function addNut(K, x, z, id) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), nutMat); m.position.y = 0.03; addItem(K.group, m, x, 0.0, z, id, 'Каштан'); coinsLive[coinsLive.length - 1].kind = 'mand'; }
  let CARDS = +dvLS('dvory_cards') || 0, MAND = +dvLS('dvory_mand') || 0;
  const showDv = () => { const a = $('f_cards'), m = $('f_mand'); if (a) a.textContent = Math.min(CARDS, DV_LORE.length); if (m) m.textContent = MAND; }; showDv();
  const baseItem = itemPicked;
  itemPicked = function (c, T) {
    if (c.kind === 'mand') { MAND++; dvLS('dvory_mand', MAND); showDv(); burst(0.08, 'bandpass', 1600, 1.2, 0.25); blip([784], 0.18, 'sine', 0.05); toast('Каштан <b style="color:#c98a5a">+1</b>'); return; }
    if (c.kind === 'card') { burst(0.1, 'bandpass', 2400, 1, 0.25); blip([659, 988], 0.3, 'triangle', 0.05);
      if (CARDS < DV_LORE.length) { showNote(`<b>Записка ${CARDS + 1} / ${DV_LORE.length}</b><br><br>${DV_LORE[CARDS]}`); CARDS++; dvLS('dvory_cards', CARDS); } else showNote(DV_GREET[(Math.random() * DV_GREET.length) | 0]);
      showDv(); return; }
    baseItem(c, T); };
  const INTERCOM = ['Домофон пищит. Никто не отвечает.', '— Кто там?.. — и короткие гудки.', 'В трубке шипит радио. Дверь не открывается.', 'Код не подходит. Ты точно помнил этот код.', 'Домофон играет мелодию. Долго. Слишком долго.', 'Тишина. Только капает с козырька.'];
  function dvDoor(isHome, open, id) {
    blip([1046, 784, 1046, 784], 0.25, 'square', 0.025);
    if (isHome) { try { sessionStorage.setItem('pod_home', '1'); } catch (e) {} setTimeout(() => goWorld('podezd', 'Домофон пискнул. Дверь открылась.<br><span style="font-size:14px">Твой подъезд.</span>'), 500); return; }
    if (open) { setTimeout(() => goWorld('podezd', 'Дверь подъезда поддалась.<br><span style="font-size:14px">Это не твой подъезд.</span>'), 500); return; }
    toast(INTERCOM[(ihash(id.length, Math.floor(clock * 3)) * INTERCOM.length) | 0]); }
  let clockStop = false;
  function dvFinal() { clockStop = true; if ($('f_clock')) $('f_clock').textContent = 'ноябрь · 14:51'; blip([523, 659, 784, 1047], 1.5, 'sine', 0.07);
    const day = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    setTimeout(() => wakeUp(['Домофон пискнул. Дверь открылась.', 'На лестнице пахло жареным луком.', 'Часы показали 14:51.', 'Ты поднялся на свой этаж, открыл дверь —', '— и открыл глаза.', `Утро. ${day}. Будильник на семь.`, 'Ты проснулся.']), 1200); }

  // ================= реальная планировка (по спутниковой карте) =================
  function rails(K) { const { b, x0, x1 } = K; for (const zt of [DV_RAIL - 5, DV_RAIL, DV_RAIL + 5]) { b.box(M.conc, (x0 + x1) / 2, 0.1, zt, x1 - x0, 0.2, 3.4, lin([0.3, 0.28, 0.26]));
      for (const s2 of [-0.76, 0.76]) b.box(M.metal, (x0 + x1) / 2, 0.32, zt + s2, x1 - x0, 0.14, 0.07, lin([0.32, 0.22, 0.16]));
      for (let x = x0 + 0.3; x < x1; x += 0.6) b.box(M.plank, x, 0.22, zt, 0.24, 0.12, 2.6, shade(0.32)); }
    for (let x = Math.ceil(x0 / 48) * 48; x < x1; x += 48) { b.cyl(M.metal, x, 4.5, DV_RAIL - 9, 0.12, 0.1, 9, 8, shade(0.35)); b.box(M.metal, x, 8.4, DV_RAIL - 2, 0.1, 0.1, 14, shade(0.35)); }
    for (const zt of [DV_RAIL - 5, DV_RAIL, DV_RAIL + 5]) b.lines.push(new V3(x0, 7.6, zt), new V3(x1, 7.6, zt), new V3(x0, 8.3, zt), new V3(x1, 8.3, zt)); }
  function wing(K, x, z, L, D, Hh, ry, fac) { const { b } = K; b.push(x, 0, z, ry); b.box(M.conc, 0, Hh / 2, 0, L, Hh, D, fac.userData.wc); b.box(M.conc, 0, Hh + 0.1, 0, L + 0.3, 0.2, D + 0.3, shade(0.4));
    for (const s2 of [1, -1]) { const g = new THREE.PlaneGeometry(L, Hh); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L, uv.getY(i) * Hh); b.add(fac, g, new THREE.Matrix4().makeRotationY(s2 > 0 ? 0 : Math.PI).setPosition(0, Hh / 2, s2 * (D / 2 + 0.02))); }
    b.collide(0, 0, L / 2, D / 2); b.pop(); }
  const DVB = [], DVI = [];   // прямоугольники зданий и предметы района
  const bld = (x, z, hx, hz) => DVB.push([x, z, hx, hz]);
  const item = (x, z, f) => DVI.push({ x, z, f });
  const SEC = (x, z, len, ry, fac, addr, fl = 9, dep = 13) => { const ns = Math.abs(Math.sin(ry)) > 0.5; bld(x, z, ns ? dep / 2 + 1.5 : len / 2 + 0.5, ns ? len / 2 + 0.5 : dep / 2 + 1.5); item(x, z, (K) => panel(K, x, z, len, dep, fl, ry, fac, addr)); };
  const E = -Math.PI / 2, Wd = Math.PI / 2, N = Math.PI, S = 0;   // куда смотрит фасад со входами
  // --- район А: двор дома № 13 ---
  const A13 = { st: 'Героев Тулы', n: 13 };
  [-102.75, -62.25, -21.75].forEach((z) => SEC(46, z, 40.5, E, FAC[0], A13)); SEC(46, 18.75, 40.5, E, FAC[0], true);           // восточный дом — твой (вход с запада, во двор)
  [-117, -71, -25].forEach((z) => SEC(-39, z, 46, Wd, FAC[1], { st: 'Героев Тулы', n: 11 }));                                    // западный дом
  [-36, 12].forEach((x) => SEC(x, -146, 48, S, FAC[1], { st: 'Героев Тулы', n: 9 }));                                              // северный дом
  [74, 114].forEach((z) => SEC(40, z, 40, E, FAC[0], { st: 'Героев Тулы', n: 15 }));                                              // юго-восточный
  [-97, -57].forEach((z) => SEC(-100, z, 40, Wd, FAC[2], { st: 'Академика Бардина', n: 17 }));
  [-112, -72].forEach((x) => SEC(x, 128, 40, N, FAC[3], { st: 'Академика Бардина', n: 19 }, 5, 11));
  for (const z of [56, 96]) { bld(-80, z - 2, 21, 9); item(-80, z, (K) => kindergarten(K, -80, z, N)); }
  item(-80, 37, (K) => { const { b } = K; b.push(-80, 0, 37, 0); profFence(b, -30, 30, 0, 0); b.collide(-16.5, 0, 13.5, 0.1); b.collide(16.5, 0, 13.5, 0.1); b.pop();
    for (const sx of [-110, -50]) { b.push(sx, 0, 37, Math.PI / 2); profFence(b, -75, 0, 0, 0); b.collide(-37.5, 0, 37.5, 0.1); b.pop(); } });
  bld(-58, 24, 10, 6); item(-58, 24, (K) => pavilion(K, -58, 24, N, 'p', true));
  item(8, -60, (K) => playground(K, 0, -60, false)); item(20, -28, (K) => playground(K, 20, -28, false)); bld(0, -60, 8, 8); bld(20, -28, 8, 8);
  item(-8, -6, (K) => { volga(K, -8, -6, 0.35); fallenPole(K, -1, -14, -0.6); }); bld(-8, -6, 3, 3); bld(-1, -14, 3.5, 1.5);
  item(30, 4, (K) => trashSite(K, 30, 4, 0)); bld(30, 4, 3, 1.5);
  item(96, -20, (K) => busStop(K, 96, -20, Wd, 'ул. Героев Тулы')); bld(96, -20, 3, 3);
  item(12, -4, (K) => addCard(K, 12, -4, 'cdHome'));
  for (const x of [-28, -22, -16]) item(x, 6.4, (K) => parked(K, x, 6.4, 0));
  for (let x = -26; x <= 26; x += 3.4) for (const z of [-118.5, -99.5]) if (ihash(x * 10, z, 4) < 0.55) item(x, z, (K) => parked(K, x, z, Math.PI / 2));
  for (let z = -84; z <= 24; z += 6) if (ihash(z, 3, 5) < 0.45) item(68.2, z, (K) => parked(K, 68.2, z, Math.PI / 2));
  const poleRun = (pts, ax, az) => pts.forEach((p, i) => item(p[0], p[1], (K) => { lampPole(K, p[0], p[1], ax, az); const q = pts[i + 1]; if (q) wire(K.b, new V3(p[0], 6.2, p[1]), new V3(q[0], 6.2, q[1]), 0.6); }));
  poleRun([-120, -96, -72, -48, -24, 0, 24].map((x) => [x, 15.6]), 0, -1); poleRun([-180, -156, -132, -108, -84, -60, -36, -12, 12, 36, 60, 84, 108, 132].map((z) => [68.4, z]), 1, 0);
  poleRun([-130, -106, -82, -58, -34, -10, 14, 38, 62, 86].map((x) => [x, -199]), 0, 1); poleRun([-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120].map((z) => [97, z]), 1, 0);
  for (let x = -132; x < 96; x += 21) item(x + 6, -216, (K) => { const { b, r } = K; house(b, r, x + 6, -216, ((r() * 2) | 0) * Math.PI); for (let k = 0; k < 9; k++) b.box(M.plank, x + 0.5 + k * 2.2, 0.8, -204, 2.1, 1.6, 0.04, shade(0.4 + r() * 0.3)); }), bld(x + 6, -216, 6, 6);
  // --- район Б: новая школа № 121, дома рядом, частный сектор, гаражи ---
  bld(1008, -94, 52, 41); bld(938, -100, 13, 18);
  item(1008, -64.5, (K) => { schoolBody(K, 1008, -64.5, S, SCHOOL2, 'ШКОЛА № 121', 100, 18)(); wing(K, 1008, -123.5, 100, 18, 11.9, N, SCHOOL2); });
  item(967, -94, (K) => { wing(K, 967, -94, 41, 18, 11.9, E, SCHOOL2); wing(K, 938, -100, 34, 24, 9, E, SCHOOL); K.b.box(M.paint, 938, 9.1, -100, 24.4, 0.2, 34.4, shade(0.95)); });
  item(1049, -94, (K) => wing(K, 1049, -94, 41, 18, 11.9, Wd, SCHOOL2));
  item(1088, -110, (K) => { const { b } = K; b.box(M.paint, 1088, 0.03, -110, 46, 0.06, 62, lin([0.6, 0.24, 0.18])); for (const [x, z, sx, sz] of [[1088, -140.5, 44, 0.12], [1088, -79.5, 44, 0.12], [1066.5, -110, 0.12, 61], [1109.5, -110, 0.12, 61], [1088, -110, 44, 0.12]]) b.box(M.paint, x, 0.065, z, sx, 0.02, sz, shade(0.92));
    const ring = new THREE.TorusGeometry(7, 0.08, 4, 40).rotateX(Math.PI / 2); b.add(M.paint, ring, new THREE.Matrix4().makeTranslation(1088, 0.07, -110), shade(0.92));
    for (const z of [-140, -80]) { for (const s2 of [-3.7, 3.7]) b.cyl(M.metal, 1088 + s2, 1.2, z, 0.06, 0.06, 2.4, 8, shade(0.95)); b.box(M.metal, 1088, 2.4, z, 7.5, 0.1, 0.1, shade(0.95)); } });
  item(980, -152, (K) => { const { b } = K; b.box(M.paint, 980, 0.03, -152, 24, 0.06, 33, lin([0.55, 0.22, 0.2])); b.box(M.paint, 980, 0.05, -152, 20, 0.06, 28, lin([0.2, 0.45, 0.48]));
    for (const z of [-165, -139]) { b.cyl(M.metal, 980, 1.6, z, 0.07, 0.07, 3.2, 8, shade(0.3)); b.box(M.paint, 980, 3.2, z + Math.sign(-152 - z) * -0.2, 1.8, 1.1, 0.06, shade(0.95)); } });
  item(1078, -60, (K) => { for (const x of [1066, 1080, 1094]) { K.b.box(paverMat, x, 0.04, -60, 12, 0.08, 12); K.b.add(M.paint, new THREE.CylinderGeometry(3, 3, 0.1, 24), new THREE.Matrix4().makeTranslation(x, 0.06, -60), lin([0.7, 0.55, 0.3])); } });
  item(1008, -172, (K) => { const { b } = K; b.push(1008, 0, -172, 0); fenceRun(b, -83, 110, 0, lin([0.3, 0.3, 0.32])); b.collide(13.5, 0, 96.5, 0.1); b.pop(); b.push(1008, 0, -46, 0); fenceRun(b, -83, -3, 0, lin([0.3, 0.3, 0.32])); fenceRun(b, 3, 110, 0, lin([0.3, 0.3, 0.32])); b.collide(-43, 0, 40, 0.1); b.collide(56.5, 0, 53.5, 0.1); b.pop();
    for (const x of [925, 1118]) { b.push(x, 0, -109, Math.PI / 2); fenceRun(b, -63, 63, 0, lin([0.3, 0.3, 0.32])); b.collide(0, 0, 63, 0.1); b.pop(); } });
  const B12 = { st: 'Академика Бардина', n: 23 };
  SEC(922, 16, 40, Wd, FAC[4], B12); SEC(994, 16, 40, E, FAC[4], B12); SEC(958, 32, 56, N, FAC[2], B12, 9, 12); SEC(1062, 12, 44, Wd, FAC[4], { st: 'Академика Бардина', n: 25 }); SEC(1104, 20, 36, E, FAC[2], { st: 'Академика Бардина', n: 25 });
  item(958, 8, (K) => playground(K, 958, 6, false)); bld(958, 6, 8, 8);
  for (let x = 1008; x <= 1042; x += 3.4) for (const z of [-26, 36]) if (ihash(x * 10, z, 6) < 0.6) item(x, z, (K) => parked(K, x, z, Math.PI / 2));
  for (let x = 884; x < 1032; x += 22) for (const z of [70, 98, 124]) if (ihash(x, z, 7) < 0.8) { item(x + 9, z, (K) => { const { b, r } = K; house(b, r, x + 9, z, ((r() * 2) | 0) * Math.PI); for (let k = 0; k < 9; k++) b.box(M.plank, x + 0.5 + k * 2.2, 0.8, z - 9, 2.1, 1.6, 0.04, shade(0.4 + r() * 0.3)); if (r() < 0.6) shed(b, r, x + 17, z + 5, r() * 6); }); bld(x + 9, z, 7, 7); }
  item(1046, 70, (K) => INTER.push({ x: 1046, z: 70, r: 3, group: K.group, label: 'E — в гаражный кооператив', act: () => goWorld('garages/index', 'Ворота кооператива открыты. Сторожа нет. Темнеет.') }));
  for (let x = 1050; x < 1140; x += 19) for (const z of [62, 78, 98, 114]) { item(x, z, (K) => garages(K.b, K.r, x, z, z % 2 ? 0 : Math.PI)); bld(x, z, 9, 3.5); }
  poleRun([884, 908, 932, 956, 980, 1004, 1028, 1052, 1076, 1100, 1124].map((x) => [x, -35]), 0, -1);
  const DIST = (cx, cz) => (cx >= -3 && cx <= 2 && cz >= -5 && cz <= 2) || (cx >= 18 && cx <= 23 && cz >= -5 && cz <= 2);
  const dvBldg = (x, z, pad) => { for (const q of DVB) if (Math.abs(x - q[0]) < q[2] + pad && Math.abs(z - q[1]) < q[3] + pad) return true; return false; };
  function clutter(K, fr) { const { r, b } = K; if (!PROTO.m_tyre) return;
    for (let i = 0; i < 7; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (!fr(x, z, 0.6)) continue; const t = r(); K.take(x, z, 0.6);
      if (t < 0.25) PUT(K, 'm_tyre', x, 0.0, z, r() * 6, 1, 1); else if (t < 0.45) PUT(K, 'm_box', x, 0, z, r() * 6, 1 + r() * 0.5); else if (t < 0.6) PUT(K, 'm_crate', x, 0, z, r() * 6, 1.2); else if (t < 0.75) PUT(K, 'm_bag', x, 0, z, r() * 6, 1); else if (t < 0.85) { PUT(K, 'm_can', x, 0, z, r() * 6, 1); b.collide(x, z, 0.3, 0.3); } else { PUT(K, 'm_shrub', x, 0, z, r() * 6, 0.6 + r() * 0.3); } }
    if (r() < 0.35) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (fr(x, z, 1)) { K.take(x, z, 1); PUT(K, 'm_ubox', x, 0, z, ((r() * 4) | 0) * Math.PI / 2, 1.1); b.collide(x, z, 0.5, 0.5); } } }
  function dvDistrict(cx, cz) {
    const K = kit(cx, cz, 0xa1b2), { r } = K; K.block = (x, z, rad) => dvBldg(x, z, rad);
    for (const it of DVI) if (K.inb(it.x, it.z)) it.f(K);
    const fr = (x, z, rad) => K.free(x, z, rad) && dvRoadD(x, z) > 7 + rad && dvDriveD(x, z) > 0.5 + rad;
    clutter(K, fr);
    for (let i = 0; i < 9; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (fr(x, z, 1.5)) K.plant(K.pick(['poplar0', 'poplar1', 'elm0', 'elm0', 'elm1', 'shrubY0', 'shrubY0', 'sticks0']), x, z, 0.9 + r() * 0.5); }
    if (r() < 0.35) for (let t = 0; t < 8; t++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (fr(x, z, 0.3)) { addCard(K, x, z, `cd${cx},${cz}`); break; } }
    for (let i = 0; i < 4; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS; if (r() < 0.6 && fr(x, z, 0.3)) addNut(K, x, z, `md${cx},${cz},${i}`); }
    return K.finish(); }

  // --- чанк: квартал 96×96, дороги по краям; каждый чанк — четверть квартала ---
  OUT_BUILD = (cx, cz) => {
    if (DIST(cx, cz)) return dvDistrict(cx, cz);
    const K = kit(cx, cz, 0xd0e1), { b, r } = K; const bx = Math.floor((cx + 1) / 2), bz = Math.floor((cz + 1) / 2), ex = cx - 2 * bx === 0 ? 1 : -1, ez = cz - 2 * bz === 0 ? 1 : -1;
    const X0 = bx * 96, Z0 = bz * 96, W = (a, c) => [X0 + ex * a, Z0 + ez * c];
    const home = false, keyQ = cx === -4 && cz === 2, shopQ = false, oldQ = cx === -5 && cz === -1, newQ = false, stopQ = cx === 4 && cz === 0;
    const h = ihash(bx * 2 + (ex > 0), bz * 2 + (ez > 0), 77); const mode = bx === 0 && bz === 0 ? true : ihash(bx, bz, 3) < 0.5; const along = home || shopQ || oldQ || newQ ? true : mode ? ez > 0 : ez < 0;
    const sadQ = false;
    const type = home ? 'p9' : keyQ ? 'p5' : cx === 2 || cz === 3 ? 'strip' : shopQ ? 'shop' : sadQ ? 'sad' : oldQ ? 'school' : newQ ? 'school2' : bx <= -11 ? 'waste' : bx <= -6 ? 'private' : h < 0.5 ? 'p9' : h < 0.72 ? 'p5' : h < 0.86 ? 'shop' : h < 0.93 ? 'sad' : 'school';
    const ryA = Math.atan2(0, -ez), ryB = Math.atan2(-ex, 0);
    if (type === 'p9' || type === 'p5') { const nine = type === 'p9', len = 40, dep = nine ? 12 : 11, fl = nine ? 9 : 5, fac = nine ? FAC[home ? 0 : [0, 1, 2, 4][(ihash(bx, bz, 17 + (ez > 0)) * 4) | 0]] : FAC[3];
      if (along) { const [x, z] = W(20, 29.5); panel(K, x, z, len, dep, fl, ryA, fac, home); K.block = (px, pz) => Math.abs(px - x) < len / 2 + 1 && Math.abs(pz - z) < dep / 2 + 2; }
      else { const [x, z] = W(29.5, 20); panel(K, x, z, len, dep, fl, ryB, fac, false); K.block = (px, pz) => Math.abs(px - x) < dep / 2 + 2 && Math.abs(pz - z) < len / 2 + 1; } }
    else if (type === 'shop') { const kinds = ['5', 'm', '5', 'm', 'p', 'a', 'f']; const kind = shopQ ? 'p' : kinds[(r() * kinds.length) | 0];
      if (along) { const [x, z] = W(22, 33.5); pavilion(K, x, z, Math.atan2(0, ez), kind, shopQ); K.block = (px, pz) => Math.abs(px - x) < 16 && Math.abs(pz - z) < 11; }
      else { const [x, z] = W(33.5, 22); pavilion(K, x, z, Math.atan2(ex, 0), kind, false); K.block = (px, pz) => Math.abs(px - x) < 7.5 && Math.abs(pz - z) < 10; } }
    else if (type === 'school' || type === 'school2') { const [x, z] = W(22, type === 'school2' ? 31 : 24); if (type === 'school2') school2(K, x, z, Math.atan2(0, ez)); else school(K, x, z, Math.atan2(0, ez), oldQ ? 87 : 3 + ((r() * 80) | 0)); K.block = (px, pz) => { const a = (px - X0) * ex, c = (pz - Z0) * ez; return a > 0 && a < 44 && c > (type === 'school2' ? 1 : 11) && c < 41; }; }
    else if (type === 'sad') { const [x, z] = W(22, 33); kindergarten(K, x, z, Math.atan2(0, -ez)); const { b: bb } = K; bb.push(X0, 0, Z0 + ez * 15.6, 0); profFence(bb, ex > 0 ? 1 : -44, ex > 0 ? 44 : -1, 0, ex * 30); bb.collide(ex * 22.5, 0, 21.5, 0.1); bb.pop();
      K.block = (px, pz) => { const a = (px - X0) * ex, c = (pz - Z0) * ez; return a > 0 && a < 44 && c > 15 && c < 41; }; }
    else if (type === 'private') { for (const [a, c] of [[12, 13], [34, 14], [14, 34], [35, 33]]) if (r() < 0.8) { const [x, z] = W(a + r() * 3, c + r() * 3); K.take(x, z, 8); house(b, r, x, z, ((r() * 4) | 0) * Math.PI / 2); if (r() < 0.6) { const [sx, sz] = W(a + 8, c + 7); if (K.free(sx, sz, 3)) { K.take(sx, sz, 3); shed(b, r, sx, sz, r() * 6); } } }
      for (let a = 2; a < 40; a += 2.2) { const [x, z] = W(a, 24); b.box(M.plank, x, 0.75, z, 0.1, 1.5, 0.03, shade(0.45 + r() * 0.3)); } }
    const fb = K.block; const freeY = (x, z, rad) => K.free(x, z, rad) && dvRoadD(x, z) > 7 + rad && dvDriveD(x, z) > 0.5 + rad && Math.abs(z - DV_RAIL) > 11 + rad;
    if (cz === 3) rails(K); if (cx === 2) for (let z = K.z0 + 12; z < K.z1; z += 24) { lampPole(K, DV_AVE - 11.5, z, 1, 0); lampPole(K, DV_AVE + 11.5, z, -1, 0); }
    // столбы вдоль улиц и провода «сажей через небо»
    const tops = []; for (const c of [12, 36]) { const [x, z] = W(c, 42.6); lampPole(K, x, z, 0, ez); tops.push(new V3(x, 6.2, z)); const [x2, z2] = W(42.6, c); lampPole(K, x2, z2, ex, 0); tops.push(new V3(x2, 6.2, z2)); }
    wire(b, tops[0], tops[2], 0.7); wire(b, tops[1], tops[3], 0.7); { const [x, z] = W(60, 42.6), [x2, z2] = W(42.6, 60); wire(b, tops[2], new V3(x, 6.2, z), 0.7); wire(b, tops[3], new V3(x2, 6.2, z2), 0.7); }
    if (type === 'p9' || type === 'p5') { const [x, z] = along ? W(20, 29.5) : W(29.5, 20); wire(b, tops[0], new V3(x, type === 'p9' ? 27 : 15.5, z), 1.2); }
    if (stopQ || (type !== 'school' && type !== 'school2' && ihash(cx, cz, 91) < 0.1)) { const [x, z] = W(14, 43.3); if (K.free(x, z, 3)) busStop(K, x, z, Math.atan2(0, ez), stopQ ? 'ул. Героев Тулы' : 'ул. ' + DV_STREETS[1 + ((r() * 7) | 0)]); }
    if (home) { const [x, z] = W(13, 9); volga(K, x, z, 0.35); const [px, pz] = W(19, 5); fallenPole(K, px, pz, -0.6); }
    // двор
    if (type === 'p9' || type === 'p5' || type === 'shop' || type === 'sad') {
      if (keyQ) playground(K, -189, 98, true);
      else if (home) playground(K, 30, 9, false);
      else if (r() < 0.5) { const [x, z] = W(16 + r() * 10, 9 + r() * 4); if (freeY(x, z, 8)) playground(K, x, z, false); }
      if (r() < 0.45) { const [x, z] = W(36 + r() * 3, 6 + r() * 6); if (freeY(x, z, 3.2)) trashSite(K, x, z, Math.atan2(-ex, 0)); }
      const nc = home ? 2 : (r() * 3) | 0; for (let i = 0; i < nc; i++) { const a = (home ? 27 : 9) + i * 5.2 + r() * 0.6, c = 19; const [x, z] = along ? W(a, c) : W(c, a); if (freeY(x, z, 2.2)) parked(K, x, z, along ? Math.PI / 2 : 0); }
      for (let i = 0; i < 2; i++) { const [x, z] = W(5 + r() * 34, 3 + r() * 14); if (freeY(x, z, 1.1)) bench(K, x, z, r() * 6.28); }
    }
    const nt = type === 'waste' ? 5 : type === 'private' ? 12 : 8;
    for (let i = 0; i < nt; i++) { const [x, z] = W(3 + r() * 40, 3 + r() * 39); if (freeY(x, z, 1.2)) { if (K.plant(K.pick(['poplar0', 'poplar1', 'elm0', 'elm0', 'elm1', 'shrubY0', 'shrubY0', 'sticks0']), x, z, 0.9 + r() * 0.5) && i === 0) smell(K, x, z, 'Пахнет мокрой землёй и тополиной гнилью.'); } }
    if (type === 'waste') for (let i = 0; i < 3; i++) { const [x, z] = W(5 + r() * 36, 5 + r() * 36); if (freeY(x, z, 2)) b.box(M.conc, x, 0.15, z, 3, 0.3, 1.2, shade(0.6 + r() * 0.2), 0, r() * 3, (r() - 0.5) * 0.2); }
    // находки
    if (r() < 0.45 || home) { for (let t = 0; t < 8; t++) { const [x, z] = home ? W(13 + r() * 5, 14 + r() * 3) : W(4 + r() * 36, 3 + r() * 16); if (freeY(x, z, 0.3)) { addCard(K, x, z, `cd${cx},${cz}`); break; } } }
    for (let i = 0; i < 4; i++) { const [x, z] = W(3 + r() * 40, 3 + r() * 38); if (r() < 0.6 && freeY(x, z, 0.3)) addNut(K, x, z, `md${cx},${cz},${i}`); }
    clutter(K, freeY); K.block = fb; return K.finish(); };

  // --- редкие машины и автобус; не тормозят ---
  const DC = []; for (let i = 0; i < (MOBILE ? 3 : 4); i++) { let c; if (i === 0) { c = makePaz(); c.g.visible = true; c.len = 7.6; c.wheels = []; } else { c = makeCar(); scene.add(c.g); } DC.push(Object.assign(c, { s: 0, lane: 0, ax: 0, dir: 1, v: 10, passed: false, honk: 0 })); }
  function carSpawn(c, first) { c.ax = Math.random() < 0.5 ? 0 : 1; c.dir = Math.random() < 0.5 ? 1 : -1; c.v = 8 + Math.random() * 6; c.passed = false;
    const k = Math.round(((c.ax ? P.x : P.z) - 48) / 96) + ((Math.random() * 3) | 0) - 1, line = 48 + k * 96, along = c.ax ? P.z : P.x;
    c.av = c.ax && Math.random() < 0.55 && Math.abs(P.x - DV_AVE) < 260; c.lane = c.av ? DV_AVE - c.dir * (Math.random() < 0.5 ? 2.5 : 7.5) : c.ax ? line - c.dir * 1.9 : line + c.dir * 1.9; c.s = first ? along + (Math.random() - 0.5) * 300 : along - c.dir * (140 + Math.random() * 120); }
  DC.forEach((c) => carSpawn(c, true));
  function carsUpdate(dt) {
    for (const c of DC) { c.s += c.dir * c.v * dt; const along = c.ax ? P.z : P.x, side = c.ax ? P.x : P.z; if (c.dir * (c.s - along) > 170 || Math.abs(side - c.lane) > 280) carSpawn(c, false);
      if (c.ax) { c.g.position.set(c.lane, 0, c.s); c.g.rotation.y = -c.dir * Math.PI / 2; } else { c.g.position.set(c.s, 0, c.lane); c.g.rotation.y = c.dir > 0 ? 0 : Math.PI; }
      for (const w of c.wheels) w.rotation.z -= c.v * dt / 0.32;
      c.g.visible = c.av || !dvSup(c.g.position.x, c.g.position.z); if (!c.g.visible) continue;
      if (!started || dead) continue; const da = (along - c.s) * c.dir, dl = Math.abs(side - c.lane), d = Math.hypot(da, dl);
      if (da > -c.len / 2 - 0.3 && da < c.len / 2 + 0.5 && dl < 1.3 && P.y < 1.2) { die(); continue; }
      if (da > 4 && da < 30 && dl < 2.5 && c.honk <= 0) { horn(); c.honk = 6; } c.honk -= dt;
      if (d < 16 && !c.passed) { c.passed = true; const v = 0.6 * (1 - d / 16); burst(1.8, 'lowpass', 340, 0.6, v); burst(1.1, 'highpass', 3200, 0.5, v * 0.5); } if (d > 34) c.passed = false; } }
  // --- дождь: редкие косые штрихи вокруг игрока ---
  const RN = MOBILE ? 500 : 1400, rp = new Float32Array(RN * 6), rb = new Float32Array(RN * 3); for (let i = 0; i < RN; i++) { rb[i * 3] = (Math.random() - 0.5) * 30; rb[i * 3 + 1] = Math.random() * 14; rb[i * 3 + 2] = (Math.random() - 0.5) * 30; }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d0d6, transparent: true, opacity: 0.28, depthWrite: false })); rain.frustumCulled = false; scene.add(rain); REFL.hide.push(rain);
  let rainSnd = null, dripT = 2;
  function rainUpdate(dt) { for (let i = 0; i < RN; i++) { let y = rb[i * 3 + 1] - dt * (11 + (i % 5)); if (y < 0) { y += 14; rb[i * 3] = (Math.random() - 0.5) * 30; rb[i * 3 + 2] = (Math.random() - 0.5) * 30; } rb[i * 3 + 1] = y; const j = i * 6, x = rb[i * 3], z = rb[i * 3 + 2]; rp[j] = x; rp[j + 1] = y; rp[j + 2] = z; rp[j + 3] = x + 0.05; rp[j + 4] = y + 0.45; rp[j + 5] = z; }
    rg.attributes.position.needsUpdate = true; rain.position.set(P.x, 0, P.z);
    if (AC && !rainSnd) { const s = loopSrc(AC._white, 1), f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 0.4; const g = AC.createGain(); g.gain.value = 0.035; s.connect(f).connect(g).connect(master); rainSnd = g; }
    dripT -= dt; if (dripT < 0 && started) { dripT = 0.6 + Math.random() * 2.2; blip([1300 + Math.random() * 1100], 0.06, 'sine', 0.012 + Math.random() * 0.012); } }
  // --- прохожий вдалеке под зонтом: уходит и пропадает, если подойти ---
  const walker = new THREE.Group(); { const coat = std({ color: 0x2a2d33, roughness: 0.9 }), skin = std({ color: 0xb89a84, roughness: 0.8 }), um = std({ color: 0x15171a, roughness: 0.6, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 1.0, 4, 10), coat); body.position.y = 0.8; const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skin); head.position.y = 1.58;
    const umb = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.26, 10, 1, true), um); umb.position.set(0.1, 2.05, 0); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5), um); st.position.set(0.1, 1.6, 0); walker.add(body, head, umb, st); }
  walker.visible = false; scene.add(walker); let wkT = 14, wkA = 0;
  function walkerUpdate(dt) { if (!started) return; wkT -= dt;
    if (walker.visible) { const d = Math.hypot(walker.position.x - P.x, walker.position.z - P.z); walker.position.x -= Math.sin(wkA) * 0.9 * dt; walker.position.z -= Math.cos(wkA) * 0.9 * dt; walker.position.y = Math.abs(Math.sin(clock * 5)) * 0.03; walker.rotation.y = wkA + Math.PI; if (d < 13 || wkT < 0 || d > 90) { walker.visible = false; wkT = 30 + Math.random() * 40; } return; }
    if (wkT < 0) { const a = P.yaw + (Math.random() - 0.5) * 1.0, d = 34 + Math.random() * 16, x = P.x - Math.sin(a) * d, z = P.z - Math.cos(a) * d; if (dvRoadD(x, z) > 4.6 && dvRoadD(x, z) < 6.2) { walker.position.set(x, 0, z); wkA = a + (Math.random() - 0.5); walker.visible = true; wkT = 45; } else wkT = 1.5; } }
  // --- часы, запахи ---
  let secs = 0, lastS = -1, smT = 3, smLast = '', interT = 0;
  if (FINAL) { const st = $('start'); const p = st && st.querySelector('p'); if (p) p.innerHTML = '<b>Ноябрь. 14:50:59.</b><br>Ворота открылись. Ты снова у своего подъезда. Поднимись домой.'; }
  WORLD_UPDATE = (dt) => {
    carsUpdate(dt); rainUpdate(dt); walkerUpdate(dt);
    if (started && !clockStop) { secs += dt; const s = FINAL ? 59 : Math.floor(secs) % 60; if (s !== lastS) { lastS = s; const e = $('f_clock'); if (e) e.textContent = `ноябрь · 14:50:${String(s).padStart(2, '0')}`; } }
    smT -= dt; if (smT < 0 && started) { smT = 1; for (let k = SMELLS.length - 1; k >= 0; k--) { const m = SMELLS[k]; if (!m.group.parent) { SMELLS.splice(k, 1); continue; } if (m.text !== smLast && Math.hypot(m.x - P.x, m.z - P.z) < 4.5) { smLast = m.text; smT = 25; toast(`<span style="font-size:15px;font-style:italic;color:#d8d2c4">${m.text}</span>`); break; } } }
    interT -= dt; if (interT < 0) { interT = 5; for (let k = INTER.length - 1; k >= 0; k--) if (INTER[k].group && !INTER[k].group.parent) INTER.splice(k, 1); }
  };
  if (TEST) window.__dv = { INTER, DC };
  if (FINAL) setTimeout(() => toast('<b style="color:#ffd35a">Ворота открылись.</b><br><span style="font-size:14px">Поднимись домой, в квартиру 47, и ляг спать.</span>'), 2500);
}
