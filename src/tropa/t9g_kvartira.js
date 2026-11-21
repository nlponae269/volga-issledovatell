// ===================== КВАРТИРА 47: Героев Тулы, 13, третий этаж. Ноябрь, 14:50 =====================
const KV_IMG = /*KVIMG*/{};
if (KV) {
  ground.visible = false; grass.mesh.visible = false; torchOn = false;
  hemi.intensity = 0.55; hemi.color.setHex(0xd8dce2); hemi.groundColor.setHex(0x6a5e52);
  P.x = 0.9; P.z = 5.4; P.y = 0; P.yaw = 0; P.pitch = 0;
  const FINAL = (() => { try { return localStorage.getItem('dream_final') === '1'; } catch (e) { return false; } })();
  const H = 2.6, T = 0.12, group = new THREE.Group(), b = new Batch();
  const cv = (w, h, draw) => texFrom(mkCanvas(w, h, draw));
  const paper = (bg, draw, sx = 0.6, sy = 0.6) => { const t = cv(256, 256, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g, w, h); }); t.repeat.set(1 / sx, 1 / sy); return std({ map: t, roughness: 0.9 }); };
  const W = {
    hall: paper('#c8b48e', (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(120,80,40,0.18)'; g.fillRect(x, 0, 10, h); } }),
    kitchen: paper('#bcd0b8', (g, w, h) => { g.strokeStyle = 'rgba(80,110,80,0.3)'; for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.beginPath(); g.arc(x + 32, y + 32, 14, 0, 6.28); g.stroke(); } }),
    room: paper('#d8c8a8', (g, w, h) => { const r = rng(3); for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h; g.fillStyle = 'rgba(150,70,60,0.35)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.26) * 9, y + Math.sin(k * 1.26) * 9, 7, 4, k * 1.26, 0, 6.28); g.fill(); } g.fillStyle = 'rgba(90,120,60,0.4)'; g.fillRect(x - 1, y + 10, 2, 18); } }),
    bed: paper('#b8c8d8', (g, w, h) => { for (let y = 0; y < h; y += 24) { g.fillStyle = 'rgba(60,80,120,0.16)'; g.fillRect(0, y, w, 6); } }),
  };
  const parquet = std({ roughness: 0.55, map: (() => { const t = cv(256, 256, (g, w, h) => { const r = rng(9); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const c = 110 + r() * 50; g.fillStyle = `rgb(${c},${c * 0.68},${c * 0.4})`; g.fillRect(x * 64 + (y % 2) * 32, y * 32, 63, 31); g.fillRect(x * 64 + (y % 2) * 32 - 256, y * 32, 63, 31); } }); t.repeat.set(1 / 1.6, 1 / 1.6); return t; })() });
  const lino = std({ roughness: 0.4, map: (() => { const t = cv(128, 128, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#8a6a4a' : '#c8b08a'; g.fillRect(x * 32, y * 32, 32, 32); } }); t.repeat.set(1 / 1.2, 1 / 1.2); return t; })() });
  const ceil = std({ color: 0xeeeeea, roughness: 0.95 });
  const wood = std({ color: 0x6a3e22, roughness: 0.5 }), dark = std({ color: 0x2a2420, roughness: 0.6 }), white = std({ color: 0xe8e6e0, roughness: 0.5 }), metal = std({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.7 });
  const frameM = std({ color: 0xf0f0ec, roughness: 0.4 });
  // стена с проёмами: ось 'x' — вдоль x на z = c; 'z' — вдоль z на x = c. holes: [a0, a1, y0, y1]
  function wall(ax, c, a0, a1, mat, holes = []) {
    const put = (p0, p1, y0, y1) => { if (p1 - p0 < 0.01 || y1 - y0 < 0.01) return; const m = (p0 + p1) / 2, L = p1 - p0, hy = y1 - y0;
      if (ax === 'x') b.box(mat, m, (y0 + y1) / 2, c, L, hy, T); else b.box(mat, c, (y0 + y1) / 2, m, T, hy, L); };
    const hs = holes.slice().sort((p, q) => p[0] - q[0]); let cur = a0;
    for (const h of hs) { put(cur, h[0], 0, H); put(h[0], h[1], 0, h[2]); put(h[0], h[1], h[3], H); cur = h[1]; } put(cur, a1, 0, H);
    let s0 = a0; const solid = (p0, p1) => { if (p1 - p0 < 0.01) return; const m = (p0 + p1) / 2; if (ax === 'x') b.cols.push({ x: m, z: c, hx: (p1 - p0) / 2, hz: 0.1, c: 1, s: 0 }); else b.cols.push({ x: c, z: m, hx: 0.1, hz: (p1 - p0) / 2, c: 1, s: 0 }); };
    for (const h of hs) { if (h[2] < 0.01) { solid(s0, h[0]); s0 = h[1]; } } solid(s0, a1);
  }
  // окно с видом во двор (фото из настоящего окна)
  const winMat = (k) => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff }); if (KV_IMG[k]) new THREE.TextureLoader().load(KV_IMG[k], (t) => { t.colorSpace = THREE.SRGBColorSpace; m.map = t; m.needsUpdate = true; }); else m.color.setHex(0xc8ccd0); return m; };
  function windowAt(ax, c, a, img, out) { const w = 1.4, y0 = 0.85, y1 = 2.3, m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, (y1 - y0) * 2.6), winMat(img));
    if (ax === 'x') { m.position.set(a, (y0 + y1) / 2, c + out * 1.6); m.rotation.y = out > 0 ? Math.PI : 0; } else { m.position.set(c + out * 1.6, (y0 + y1) / 2, a); m.rotation.y = out > 0 ? -Math.PI / 2 : Math.PI / 2; }
    group.add(m);
    const fr = (x0, x1, yy0, yy1) => { if (ax === 'x') b.box(frameM, (x0 + x1) / 2, (yy0 + yy1) / 2, c, x1 - x0, yy1 - yy0, 0.16); else b.box(frameM, c, (yy0 + yy1) / 2, (x0 + x1) / 2, 0.16, yy1 - yy0, x1 - x0); };
    fr(a - w / 2, a - w / 2 + 0.07, y0, y1); fr(a + w / 2 - 0.07, a + w / 2, y0, y1); fr(a - 0.035, a + 0.035, y0, y1); fr(a - w / 2, a + w / 2, y1 - 0.07, y1); fr(a - w / 2, a + w / 2, y0, y0 + 0.07); fr(a - w / 2, a + w / 2, y1 - 0.5, y1 - 0.45);
    if (ax === 'x') { b.box(white, a, y0 - 0.02, c - out * 0.18, w + 0.3, 0.04, 0.3); for (let k = 0; k < 8; k++) b.box(white, a - 0.42 + k * 0.12, 0.45, c - out * 0.2, 0.08, 0.55, 0.1); }
    else { b.box(white, c - out * 0.18, y0 - 0.02, a, 0.3, 0.04, w + 0.3); for (let k = 0; k < 8; k++) b.box(white, c - out * 0.2, 0.45, a - 0.42 + k * 0.12, 0.1, 0.55, 0.08); }
    bulbAnchors.push({ x: ax === 'x' ? a : c - out * 0.6, y: 1.7, z: ax === 'x' ? c - out * 0.6 : a, fy: 0, group, mesh: null, color: 0xc8d2de, dist: 6, int: 3.5 });
    return ax === 'x' ? [a, c - out * 0.6] : [c - out * 0.6, a]; }
  const lamp = (x, z, int) => { b.cyl(white, x, H - 0.12, z, 0.22, 0.3, 0.14, 16); bulbAnchors.push({ x, y: H - 0.35, z, fy: 0, group, mesh: null, color: 0xffd8a0, dist: 6, int }); };
  // --- пол, потолок ---
  b.box(lino, 0.9, -0.05, 3, 1.8, 0.1, 6); b.box(lino, 3.2, -0.05, 1.5, 2.8, 0.1, 3); b.box(parquet, 3.9, -0.05, 5, 4.2, 0.1, 4); b.box(parquet, -1.6, -0.05, 1.8, 3.2, 0.1, 3.6);
  b.box(ceil, 1.4, H + 0.05, 3.5, 9.4, 0.1, 7.2);
  // --- стены ---
  const DOOR = (a) => [a, a + 0.85, 0, 2.05];
  wall('x', 0, -3.2, 0, W.bed, [[-2.3, -0.9, 0.85, 2.3]]); wall('x', 0, 1.8, 4.6, W.kitchen, [[2.5, 3.9, 0.85, 2.3]]); wall('x', 0, 0, 1.8, W.hall);
  wall('z', -3.2, 0, 3.6, W.bed); wall('x', 3.6, -3.2, 0, W.bed); wall('z', 0, 0, 3.6, W.hall, [DOOR(1.0)]); wall('z', 0, 3.6, 6, W.hall);
  wall('z', 1.8, 0, 7, W.hall, [DOOR(1.05), DOOR(4.05)]); wall('x', 6, 0, 1.8, W.hall, [[0.5, 1.35, 0, 2.05]]);
  wall('z', 4.6, 0, 3, W.kitchen); wall('x', 3, 1.8, 6, W.room); wall('z', 6, 3, 7, W.room, [[4.3, 5.7, 0.85, 2.3]]); wall('x', 7, 1.8, 6, W.room);
  const wk = windowAt('x', 0, 3.2, 'o1', -1), wr = windowAt('z', 6, 5.0, 'o2', 1), wb = windowAt('x', 0, -1.6, 'o1', -1);
  // двери: входная (дерматин), в ванную (закрыта)
  b.box(dark, 0.92, 1.02, 5.96, 0.85, 2.04, 0.05); b.box(metal, 1.2, 1.0, 5.9, 0.03, 0.15, 0.03); b.box(white, 0.06, 1.02, 4.8, 0.05, 2.04, 0.8);
  // --- прихожая: вешалка, обувь, зеркало, телефон ---
  b.box(wood, 1.7, 1.75, 4.6, 0.04, 0.08, 1.2); for (let k = 0; k < 3; k++) b.box(std({ color: [0x3a3f48, 0x6a4a3a, 0x2a4a6a][k], roughness: 0.9 }), 1.55, 1.25, 4.15 + k * 0.4, 0.22, 0.95, 0.38);
  b.box(wood, 0.25, 0.25, 4.6, 0.3, 0.5, 0.9); for (let k = 0; k < 4; k++) b.box(dark, 0.3, 0.55, 4.25 + k * 0.22, 0.24, 0.1, 0.1);
  b.box(std({ color: 0x9aa4ae, roughness: 0.05, metalness: 0.9 }), 0.07, 1.5, 2.6, 0.02, 0.9, 0.55); b.box(std({ color: 0xc8b8a0, roughness: 0.5 }), 1.72, 1.4, 2.2, 0.08, 0.2, 0.12);
  // --- кухня: плита с кастрюлей, холодильник, стол, табуретки, часы ---
  b.box(white, 4.3, 0.45, 0.4, 0.6, 0.9, 0.6); b.box(dark, 4.3, 0.91, 0.4, 0.58, 0.02, 0.58); for (const [dx, dz] of [[-0.14, -0.14], [0.14, 0.14]]) b.cyl(dark, 4.3 + dx, 0.93, 0.4 + dz, 0.1, 0.1, 0.02, 12);
  b.cyl(std({ color: 0xc0302a, roughness: 0.4 }), 4.16, 1.02, 0.26, 0.13, 0.12, 0.18, 16); b.cyl(white, 4.16, 1.12, 0.26, 0.135, 0.135, 0.02, 16);
  b.box(white, 4.25, 0.9, 1.25, 0.6, 1.8, 0.6); b.box(metal, 3.97, 1.2, 1.4, 0.02, 0.3, 0.03);
  b.box(white, 2.4, 0.45, 0.35, 1.0, 0.9, 0.6); b.box(metal, 2.4, 0.9, 0.35, 0.45, 0.02, 0.35); b.box(white, 2.6, 1.9, 0.18, 1.6, 0.6, 0.32);
  b.box(wood, 3.0, 0.74, 2.2, 1.0, 0.04, 0.7); for (const [dx, dz] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) b.box(wood, 3.0 + dx, 0.36, 2.2 + dz, 0.04, 0.72, 0.04); b.box(std({ color: 0xe8e0d0, roughness: 0.8 }), 3.0, 0.765, 2.2, 1.04, 0.01, 0.74);
  for (const dx of [-0.75, 0.75]) { b.box(wood, 3.0 + dx, 0.45, 2.2, 0.32, 0.04, 0.32); b.box(wood, 3.0 + dx, 0.22, 2.2, 0.26, 0.44, 0.26); }
  b.collide(3.0, 2.2, 0.55, 0.4); b.collide(4.3, 0.8, 0.32, 0.8); b.collide(2.4, 0.35, 0.5, 0.32);
  b.box(std({ color: 0xf4f0e4, roughness: 0.9 }), 2.85, 0.775, 2.1, 0.15, 0.003, 0.2);   // записка на столе
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), std({ map: cv(128, 128, (g, w, h) => { g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(64, 64, 62, 0, 6.28); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 3; g.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4); } const hand = (a, l, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(a) * l, 64 - Math.cos(a) * l); g.stroke(); }; hand((2 + 50 / 60) / 12 * 6.283, 30, 5); hand(50 / 60 * 6.283, 46, 3); }) }));
  clock.position.set(4.54, 2.0, 2.2); clock.rotation.y = -Math.PI / 2; group.add(clock);
  // --- зал: стенка, телевизор, диван, ковёр на стене, ковёр на полу, люстра ---
  const carpet = (w, h, seed) => std({ roughness: 1, map: cv(256, 192, (g, W2, H2) => { const r = rng(seed); g.fillStyle = '#7a1e1a'; g.fillRect(0, 0, W2, H2); g.strokeStyle = '#d8b060'; g.lineWidth = 6; g.strokeRect(10, 10, W2 - 20, H2 - 20); g.strokeStyle = '#1a2a5a'; g.lineWidth = 4; g.strokeRect(22, 22, W2 - 44, H2 - 44);
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#d8b060', '#1a2a5a', '#e8e0c8', '#3a6a3a'][i % 4]; g.beginPath(); const cx = W2 / 2, cy = H2 / 2, s = 70 - i * 11; g.moveTo(cx, cy - s * 0.7); g.lineTo(cx + s, cy); g.lineTo(cx, cy + s * 0.7); g.lineTo(cx - s, cy); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '216,176,96' : '26,42,90'},0.7)`; g.fillRect(30 + r() * (W2 - 60), 30 + r() * (H2 - 60), 5, 5); } }) });
  b.box(carpet(2.4, 1.6, 1), 1.87, 1.5, 5.4, 0.02, 1.5, 2.2); b.box(carpet(2.4, 1.6, 2), 3.9, 0.005, 5.0, 2.6, 0.01, 1.8);
  b.box(wood, 3.9, 1.1, 6.75, 3.4, 2.2, 0.45); for (let k = 0; k < 4; k++) b.box(std({ color: 0x9ab0c0, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.6 }), 2.6 + k * 0.85, 1.55, 6.52, 0.75, 0.7, 0.02);
  b.box(dark, 3.9, 0.85, 6.4, 0.7, 0.55, 0.5); b.box(std({ color: 0x1a2028, roughness: 0.15, metalness: 0.3 }), 3.9, 0.87, 6.14, 0.5, 0.4, 0.02);
  b.box(std({ color: 0x6a5a4a, roughness: 0.9 }), 3.9, 0.3, 3.55, 2.0, 0.45, 0.8); b.box(std({ color: 0x6a5a4a, roughness: 0.9 }), 3.9, 0.65, 3.25, 2.0, 0.5, 0.2);
  b.collide(3.9, 6.7, 1.75, 0.3); b.collide(3.9, 3.5, 1.0, 0.45);
  // --- твоя комната: кровать, стол с рюкзаком, плакат ---
  b.box(wood, -2.55, 0.25, 1.6, 1.0, 0.5, 2.0); b.box(std({ color: 0x4a6a9a, roughness: 0.95 }), -2.55, 0.53, 1.75, 0.95, 0.08, 1.7); b.box(white, -2.55, 0.6, 0.75, 0.6, 0.12, 0.35); b.collide(-2.55, 1.6, 0.5, 1.0);
  b.box(wood, -0.6, 0.74, 3.2, 1.1, 0.04, 0.55); b.box(wood, -0.6, 0.36, 3.2, 1.06, 0.72, 0.5); b.box(std({ color: 0x2a4a3a, roughness: 0.9 }), -0.3, 0.95, 3.25, 0.32, 0.4, 0.2); b.collide(-0.6, 3.2, 0.55, 0.3);
  b.add(std({ map: cv(128, 180, (g, w, h) => { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d82a2a'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('КИНО', w / 2, 60); g.fillStyle = '#e8e0c8'; g.font = '15px sans-serif'; g.fillText('ГРУППА КРОВИ', w / 2, 100); }) }), new THREE.PlaneGeometry(0.5, 0.7), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-3.13, 1.6, 2.3));
  lamp(0.9, 1.5, 2.2); lamp(3.2, 1.5, 2.6); lamp(3.9, 5.0, 3.0); lamp(-1.6, 1.8, 2.2);
  b.build(group); scene.add(group); colliders.set('kv', b.cols);
  // --- действия ---
  const NOTE = '«Обед на плите, разогрей. Ключ у тёти Вали из 45-й. Буду в шесть.<br><i>— Мама</i>»<br><br><span style="font-size:14px">Ключа у тебя нет. А дверь почему-то была открыта.</span>';
  INTER.push({ x: 0.9, z: 5.5, r: 0.9, label: 'E — выйти во двор', act: () => goWorld('dvory', 'Ты спустился во двор.') });
  INTER.push({ x: 2.85, z: 2.1, r: 0.9, label: 'E — прочитать записку', act: () => showNote(NOTE) });
  INTER.push({ x: 4.0, z: 0.9, r: 0.8, label: 'E — плита', act: () => toast('Суп ещё тёплый.<br><span style="font-size:14px">Как будто мама ушла минуту назад.</span>') });
  INTER.push({ x: wk[0], z: wk[1], r: 0.9, label: 'E — посмотреть в окно', act: () => toast('Во дворе стоит белая «Волга».<br><span style="font-size:14px">Ни одного человека. 14:50.</span>') });
  INTER.push({ x: wr[0], z: wr[1], r: 0.9, label: 'E — посмотреть в окно', act: () => toast('Площадка пустая. На качелях никого.<br><span style="font-size:14px">Но они качаются.</span>') });
  INTER.push({ x: 3.9, z: 5.9, r: 0.8, label: 'E — включить телевизор', act: () => { burst(1.6, 'bandpass', 3000, 0.4, 0.2); toast('Помехи. Потом голос диктора: «…в Волгограде 14 часов 50 минут…»<br><span style="font-size:14px">И снова помехи.</span>'); } });
  INTER.push({ x: -2.0, z: 1.6, r: 1.0, label: () => FINAL && allKeys() ? 'E — лечь и проснуться' : 'E — лечь спать', act: () => {
    if (FINAL && allKeys()) { const day = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); wakeUp(['Ты лёг на свою кровать и закрыл глаза.', 'Где-то хлопнула дверь. Часы на кухне щёлкнули: 14:51.', 'В прихожей зашуршали пакеты: «Я дома!»', 'Ты открыл глаза.', `Утро. ${day}. Будильник на семь.`, 'Ты проснулся.']); }
    else goWorld(randomWorld(), 'Ты лёг на кровать и закрыл глаза.<br><span style="font-size:14px">Сон утащил тебя дальше.</span>'); } });
  setTimeout(() => toast(FINAL ? '<b style="color:#ffd35a">Дома.</b><br><span style="font-size:14px">Ляг на свою кровать.</span>' : 'Дома. Пусто. Пахнет супом.'), 2600);
}
