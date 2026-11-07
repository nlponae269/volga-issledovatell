// ===================== Школа, Поликлиника, Универсам (на сетке «Дома») =====================
const SHK = WORLD === 'shkola', BOL = WORLD === 'bolnica', MAG = WORLD === 'magazin';
const mod = (a, n) => ((a % n) + n) % n;
// --- общие текстуры ---
TX.lino2 = texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(81); g.fillStyle = '#5a3a26'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64) { const o = (y / 32) % 2 ? 32 : 0; g.fillStyle = `rgb(${90 + r() * 30 | 0},${58 + r() * 18 | 0},${38 + r() * 12 | 0})`; g.fillRect(x + o + 1, y + 1, 62, 30); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 1 + r() * 10, 1); } }));
TX.tileGray = texFrom(mkCanvas(256, 256, (g, w, h) => { const r = rng(83), n = 8, s = w / n; g.fillStyle = '#555'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = ((x + y) % 2) ? 170 + r() * 15 : 120 + r() * 15; g.fillStyle = `rgb(${v | 0},${v | 0},${v + 4 | 0})`; g.fillRect(x * s + 1, y * s + 1, s - 2, s - 2); } }));
TX.tileWall = texFrom(mkCanvas(512, 512, (g, w, h) => { const r = rng(85), split = h * (1 - 1.6 / 2.7);
  g.fillStyle = '#d8d6cc'; g.fillRect(0, 0, w, split); const ts = 28;
  g.fillStyle = '#8fa8a8'; g.fillRect(0, split, w, h - split);
  for (let y = split; y < h; y += ts) for (let x = 0; x < w; x += ts) { const v = r(); g.fillStyle = v < 0.03 ? '#6a7a78' : `rgb(${196 + r() * 14 | 0},${214 + r() * 12 | 0},${214 + r() * 12 | 0})`; g.fillRect(x + 1.2, y + 1.2, ts - 2.4, ts - 2.4); }
  g.fillStyle = 'rgba(40,60,60,0.6)'; g.fillRect(0, split - 3, w, 5);
  for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * w, r() * split, 2, 2); } }));
const MT = {
  lino2: rep(envMat({ map: TX.lino2, roughness: 0.4 }, 0.25), 1.2, 1.2),
  tileGray: rep(envMat({ map: TX.tileGray, roughness: 0.3 }, 0.3), 1.2, 1.2),
  tileWall: rep(std({ map: TX.tileWall, roughness: 0.4, vertexColors: true }), 2.4, 2.7),
  tubeOn: new THREE.MeshStandardMaterial({ color: 0xf4fbff, emissive: 0xe8f4ff, emissiveIntensity: 4 }),
  tubeOff: std({ color: 0xbcc4c8, roughness: 0.3 }),
  whiteDoor: rep(envMat({ map: TX.wall, color: 0xe8e8e2, roughness: 0.45, vertexColors: true }, 0.3), 0.9, 2.05),
  board: null,
};
// люминесцентная лампа на потолке (часть мерцает)
function tubeLight(b, group, x, z, r, offP = 0.2) {
  const on = r() > offP, flick = on && r() < 0.18; b.box(M.metal, x, HH - 0.03, z, 1.3, 0.05, 0.22, PAINT.galv);
  let m = null; if (flick) { m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.12), MT.tubeOn); m.position.set(x, HH - 0.07, z); group.add(m); } else b.box(on ? MT.tubeOn : MT.tubeOff, x, HH - 0.07, z, 1.2, 0.05, 0.12);
  if (on) bulbAnchors.push({ x, y: HH - 0.3, z, flick, ph: r() * 100, group, mesh: m, tube: true });
}
// классная доска с недописанной задачей
const BOARD_TXT = [['x² + 5x − 14 = 0', 'x₁ = 2,  x₂ = '], ['Задача №3', 'Поезд вышел из пункта А…', 'Ответ: '], ['Классная работа', 'Тема: «Куда ведёт коридор»'], ['13 + 8 = 21', '21 + 13 = 34', '34 + 21 = '], ['Домашнее задание:', 'выучить выход наизусть'], ['sin²α + cos²α = '], ['Сочинение', '«Как я провёл лето,', 'которое не кончается»']];
const boardMats = BOARD_TXT.map((lines, k) => new THREE.MeshStandardMaterial({ roughness: 0.85, map: texFrom(mkCanvas(512, 256, (g, w, h) => {
  g.fillStyle = '#1f3a2c'; g.fillRect(0, 0, w, h); const r = rng(k + 5); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 20 + r() * 120, 6 + r() * 30); }
  g.fillStyle = 'rgba(235,235,225,0.9)'; g.font = '30px "Comic Sans MS", cursive, sans-serif'; lines.forEach((l, i) => g.fillText(l, 30, 60 + i * 50));
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); })) }));
const standMat = new THREE.MeshStandardMaterial({ roughness: 0.8, map: texFrom(mkCanvas(512, 256, (g, w, h) => { const r = rng(91);
  g.fillStyle = '#8a1e1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0e6c8'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('НАШИ ОТЛИЧНИКИ', w / 2, 40);
  for (let i = 0; i < 8; i++) { const x = 30 + (i % 4) * 118, y = 60 + Math.floor(i / 4) * 95; g.fillStyle = '#ddd'; g.fillRect(x, y, 80, 80); g.fillStyle = '#9a9a9a'; g.beginPath(); g.arc(x + 40, y + 34, 18, 0, 6.28); g.fill(); g.fillRect(x + 16, y + 56, 48, 24); if (r() < 0.3) { g.fillStyle = 'rgba(30,30,30,0.85)'; g.fillRect(x, y, 80, 80); } } })) });
const portraitMat = new THREE.MeshStandardMaterial({ roughness: 0.7, map: texFrom(mkCanvas(128, 160, (g, w, h) => { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2622'; g.fillRect(8, 8, w - 16, h - 16); g.fillStyle = '#4a443e'; g.beginPath(); g.ellipse(w / 2, 62, 24, 30, 0, 0, 6.28); g.fill(); g.fillRect(28, 96, 72, 56); })) });
const posterMats = ['МОЙТЕ РУКИ ПЕРЕД ЕДОЙ', 'ГРИПП — ОПАСНО!', 'ТИШИНА', 'ПРИЁМ ПО ТАЛОНАМ'].map((t, k) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: texFrom(mkCanvas(256, 360, (g, w, h) => { g.fillStyle = ['#e8e0c8', '#d8e4ea', '#efe6d0', '#e8e8e0'][k]; g.fillRect(0, 0, w, h); g.fillStyle = '#2a4a8a'; g.font = 'bold 28px sans-serif'; g.textAlign = 'center'; t.split(' ').forEach((wd, i) => g.fillText(wd, w / 2, 60 + i * 40)); g.fillStyle = '#b03030'; g.beginPath(); g.arc(w / 2, 270, 50, 0, 6.28); g.fill(); })) }));
const plate = (geoW, geoH, mat, b, group, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(geoW, geoH), mat); m.position.set(x, y, z); m.rotation.y = ry; group.add(m); return m; };
// предметы-коллекции
const ITEM_MESH = {
  penal: () => new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.06).translate(0, 0.018, 0), std({ color: [0x2a5aa8, 0xb03a2a, 0x3a8a4a][(Math.random() * 3) | 0], roughness: 0.5 })),
  dnevnik: () => new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.22).translate(0, 0.01, 0), std({ color: 0x2a3a6a, roughness: 0.7 })),
  smenka: () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1).scale(1, 1.3, 0.5).translate(0, 0.16, 0), std({ color: 0x3a3a5a, roughness: 0.9 })),
  bahily: () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1).scale(1.6, 0.5, 1).translate(0, 0.03, 0), std({ color: 0x3a7ad0, roughness: 0.4, transparent: true, opacity: 0.85 })),
};
const ITEM_NAMES = { penal: 'Пенал', dnevnik: 'Дневник', smenka: 'Сменка', bahily: 'Бахилы' };
function dropItem(group, kinds, x, z, id) { const k = kinds[(Math.random() * kinds.length) | 0]; const m = ITEM_MESH[k](); m.castShadow = true; m.rotation.y = Math.random() * 6; addItem(group, m, x, 0, z, id, ITEM_NAMES[k]); }

if (GRID && !HOUSE) { ground.visible = false; grass.mesh.visible = false; P.x = MAG ? 4.0 : HC / 2; P.z = HC / 2; P.yaw = MAG ? 0 : -Math.PI / 2; }
// ================= ШКОЛА =================
if (SHK) {
  cellType = (i, j) => { if (mod(j, 3) === 0 || mod(i, 5) === 0) return 'room'; return ihash(i, j, 31) < 0.06 ? 'cloak' : 'class'; };
  edgeType = (i0, j0, i1, j1, salt) => { const a = cellType(i0, j0), b = cellType(i1, j1); if (a === 'room' && b === 'room') return 'none'; if (a === 'room' || b === 'room') return ihash(i0 + i1 * 3, j0 + j1 * 5, salt) < 0.55 ? 'door' : 'wall'; return ihash(i0, j0 + i1, salt) < 0.2 ? 'door' : 'wall'; };
  GT.wall = (i, j) => (cellType(i, j) === 'room' ? PWALL[1] : PWALL[cellType(i, j) === 'cloak' ? 2 : 0]);
  roomColor = () => shade(1.0);
  GT.floor = MT.lino2; GT.trash = false;
  GT.light = (b, group, i, j, r, t) => { const X = i * HC, Z = j * HC; if (r() < 0.75) tubeLight(b, group, X + HC / 2, Z + HC / 2, r, 0.3); };
  furnish = (b, group, i, j, r) => { const X = i * HC, Z = j * HC; // коридор
    if (r() < 0.25) { b.box(M.plank, X + 0.35, 0.42, Z + HC / 2, 0.35, 0.05, 1.6, shade(0.8)); b.box(M.metal, X + 0.35, 0.2, Z + HC / 2 - 0.7, 0.3, 0.4, 0.04, PAINT.dark); b.box(M.metal, X + 0.35, 0.2, Z + HC / 2 + 0.7, 0.3, 0.4, 0.04, PAINT.dark); }
    if (r() < 0.2) plate(1.4, 0.7, 0, b, group, X + HC / 2, 1.6, Z + 0.09, 0).material = standMat;
    if (r() < 0.25) dropItem(group, ['penal', 'dnevnik', 'smenka'], X + 0.6 + r() * 3.6, Z + 0.6 + r() * 3.6, `s${i},${j}`); };
  GT.room = (b, group, i, j, r, t) => { const X = i * HC, Z = j * HC;
    if (t === 'class') { // парты, доска, портреты
      for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) { const dx = X + 1.3 + col * 2.0, dz = Z + 1.6 + row * 1.0; b.box(M.plank, dx, 0.74, dz, 1.1, 0.04, 0.5, shade(0.9, [1, 0.9, 0.75])); b.box(M.metal, dx - 0.5, 0.37, dz, 0.04, 0.74, 0.45, PAINT.dark); b.box(M.metal, dx + 0.5, 0.37, dz, 0.04, 0.74, 0.45, PAINT.dark);
        b.box(M.plank, dx, 0.44, dz + 0.42, 0.9, 0.035, 0.32, shade(0.8)); b.box(M.plank, dx, 0.66, dz + 0.58, 0.9, 0.3, 0.03, shade(0.8)); b.cols.push({ x: dx, z: dz + 0.15, hx: 0.56, hz: 0.45, c: 1, s: 0 });
        if (r() < 0.12) dropItem(group, ['penal', 'dnevnik', 'smenka'], dx + (r() - 0.5) * 0.6, dz + 0.9, `c${i},${j},${row},${col}`); }
      b.box(M.plank, X + HC / 2, 0.75, Z + 0.7, 1.2, 0.05, 0.6, shade(0.7)); b.cols.push({ x: X + HC / 2, z: Z + 0.7, hx: 0.62, hz: 0.32, c: 1, s: 0 });
      plate(2.6, 1.2, 0, b, group, X + HC / 2, 1.55, Z + 0.09, 0).material = boardMats[(r() * boardMats.length) | 0];
      for (let k = 0; k < 3; k++) plate(0.3, 0.38, 0, b, group, X + 1.1 + k * 1.3, 2.38, Z + 0.09, 0).material = portraitMat;
    } else { // раздевалка: вешалки с пальто, табличка ВЫХОД
      for (let k = 0; k < 2; k++) { const rz = Z + 1.3 + k * 2.2; b.box(M.metal, X + HC / 2, 1.7, rz, 3.8, 0.04, 0.04, PAINT.galv); for (const sx of [-1.9, 1.9]) b.box(M.metal, X + HC / 2 + sx, 0.85, rz, 0.04, 1.7, 0.04, PAINT.galv);
        for (let c = 0; c < 9; c++) b.box(M.paint, X + 0.65 + c * 0.42, 1.2, rz + (r() - 0.5) * 0.08, 0.32, 0.9 + r() * 0.2, 0.12, lin([[0.2, 0.2, 0.25], [0.35, 0.2, 0.15], [0.15, 0.25, 0.2], [0.4, 0.38, 0.35]][(r() * 4) | 0]), 0, (r() - 0.5) * 0.3, 0);
        b.cols.push({ x: X + HC / 2, z: rz, hx: 1.95, hz: 0.25, c: 1, s: 0 }); }
      const ex = plate(0.9, 0.3, 0, b, group, X + HC / 2, 2.35, Z + HC - 0.1, Math.PI); ex.material = new THREE.MeshBasicMaterial({ map: texFrom(mkCanvas(256, 84, (g, w, h) => { g.fillStyle = '#1a7a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 50px sans-serif'; g.textAlign = 'center'; g.fillText('ВЫХОД', w / 2, 60); })) });
      b.box(MH.door, X + HC / 2, 1.02, Z + HC - 0.1, 0.95, 2.04, 0.06, shade(0.9));
      INTER.push({ x: X + HC / 2, z: Z + HC - 0.6, r: 1.4, group, label: 'E — выйти', act: () => goWorld('ostanovka', 'Ты вышел из школы.') });
    } };
  // звонок
  setInterval(() => { if (!AC || !started) return; const o = AC.createOscillator(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(); o.type = 'square'; o.frequency.value = 1150; lfo.frequency.value = 22; lg.gain.value = 0.5; lfo.connect(lg).connect(g.gain); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 2; g.gain.value = 0.5; const out = AC.createGain(); const t = AC.currentTime; out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.03, t + 0.05); out.gain.setValueAtTime(0.03, t + 3.5); out.gain.linearRampToValueAtTime(0, t + 3.7); o.connect(f).connect(g).connect(out).connect(master); o.start(t); lfo.start(t); o.stop(t + 3.8); lfo.stop(t + 3.8); toast('Звенит звонок.<br><span style="font-size:14px;opacity:.6">Никто не выходит.</span>'); }, 75000);
}
// ================= ПОЛИКЛИНИКА =================
let TICKET = 0;
const cabNum = (i, j) => 100 * (1 + mod(j, 4)) + 1 + mod(i * 7 + j * 3, 40);
if (BOL) {
  cellType = (i, j) => (mod(j, 2) === 0 || mod(i, 6) === 0 ? 'room' : 'cab');
  edgeType = (i0, j0, i1, j1) => { const a = cellType(i0, j0), b = cellType(i1, j1); if (a === 'room' && b === 'room') return 'none'; if (a === 'room' || b === 'room') return 'door'; return 'wall'; };
  GT.wall = () => MT.tileWall; roomColor = () => shade(1.0); GT.floor = MT.tileGray; GT.trash = false; GT.doorMat = MT.whiteDoor;
  GT.light = (b, group, i, j, r, t) => { if (t === 'room' && r() < 0.8) tubeLight(b, group, i * HC + HC / 2, j * HC + HC / 2, r, 0.25); };
  // номер талона: кабинет в клетке (7,3)
  TICKET = cabNum(7, 3); { const e = $('f_ticket'); if (e) e.textContent = 'каб. ' + TICKET; }
  GT.edgeDoor = (dl, i0, j0, i1, j1, axis, leaf, closed) => {
    const cab = cellType(i0, j0) === 'cab' ? [i0, j0] : [i1, j1]; const n = cabNum(cab[0], cab[1]);
    dl.ang = dl.target = 0; dl.pivot.rotation.y = dl.base; dl.col.off = false; dl.label = `E — каб. ${n}`;
    dl.act = () => { if (n === TICKET) goWorld('elektrichka', `Кабинет ${n}. Вас ждали.`); else { burst(0.09, 'lowpass', 300, 1, 0.5); toast(`Кабинет ${n}.<br><span style="font-size:14px;opacity:.7">${['Закрыто. Приём окончен.', 'Врач на вызове.', 'Не ваш номер.', 'Ждите, вас вызовут.'][(Math.random() * 4) | 0]}</span>`); } };
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshStandardMaterial({ roughness: 0.6, map: texFrom(mkCanvas(128, 60, (g, w, h) => { g.fillStyle = n === TICKET ? '#e8e0b0' : '#dfe6ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a2a5a'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText(String(n), w / 2, 45); })) }));
    pl.position.set(0.44, 1.7, 0.03); leaf.add(pl); const pl2 = pl.clone(); pl2.position.z = -0.03; pl2.rotation.y = Math.PI; leaf.add(pl2);
  };
  furnish = (b, group, i, j, r) => { const X = i * HC, Z = j * HC, t = r();
    if (t < 0.45) for (const zz of [Z + 0.35, Z + HC - 0.35]) if (r() < 0.7) { for (let k = 0; k < 5; k++) { const cx = X + 0.6 + k * 0.8; b.box(M.paint, cx, 0.45, zz, 0.46, 0.05, 0.44, lin([0.3, 0.35, 0.45])); b.box(M.paint, cx, 0.72, zz + (zz < Z + 1 ? -0.2 : 0.2), 0.46, 0.5, 0.04, lin([0.3, 0.35, 0.45])); } b.box(M.metal, X + 2.2, 0.22, zz, 3.9, 0.04, 0.3, PAINT.galv); b.cols.push({ x: X + 2.2, z: zz, hx: 2, hz: 0.3, c: 1, s: 0 }); }
    if (t > 0.8) { b.box(MP.leather, X + HC / 2, 0.5, Z + 0.45, 1.8, 0.12, 0.6, shade(0.6)); for (const dx of [-0.8, 0.8]) b.box(M.metal, X + HC / 2 + dx, 0.22, Z + 0.45, 0.04, 0.44, 0.5, PAINT.galv); b.cols.push({ x: X + HC / 2, z: Z + 0.45, hx: 0.92, hz: 0.32, c: 1, s: 0 }); }
    if (r() < 0.2) plate(0.5, 0.7, 0, b, group, X + 1 + r() * 2.8, 1.6, Z + 0.09, 0).material = posterMats[(r() * posterMats.length) | 0];
    if (ihash(i, j, 44) < 0.06) { // регистратура + табло
      b.box(M.paint, X + HC / 2, 0.55, Z + HC - 0.6, 3.6, 1.1, 0.5, lin([0.75, 0.72, 0.65])); b.box(M.glass, X + HC / 2, 1.6, Z + HC - 0.6, 3.6, 1.0, 0.03); b.cols.push({ x: X + HC / 2, z: Z + HC - 0.6, hx: 1.85, hz: 0.3, c: 1, s: 0 });
      plate(1.6, 0.3, 0, b, group, X + HC / 2, 2.3, Z + HC - 0.58, Math.PI).material = new THREE.MeshBasicMaterial({ map: texFrom(mkCanvas(256, 48, (g, w, h) => { g.fillStyle = '#2a4a8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 28px sans-serif'; g.textAlign = 'center'; g.fillText('РЕГИСТРАТУРА', w / 2, 34); })) }); }
    if (ihash(i, j, 45) < 0.12) { const cv = mkCanvas(256, 64, () => {}); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const m = plate(1.2, 0.3, 0, b, group, X + HC / 2, 2.25, Z + 0.1, 0); m.material = new THREE.MeshBasicMaterial({ map: tx }); TABLO.push({ cv, tx, m, group }); }
    if (r() < 0.22) dropItem(group, ['bahily'], X + 0.6 + r() * 3.6, Z + 1.0 + r() * 2.8, `b${i},${j}`); };
}
const TABLO = [];
let tabloT = 0;
function tabloUpdate(dt) { tabloT -= dt; if (tabloT > 0) return; tabloT = 9; const n = 100 + ((Math.random() * 400) | 0), num = (Math.random() * 90 | 0) + 10; for (let k = TABLO.length - 1; k >= 0; k--) { const t = TABLO[k]; if (!t.group.parent) { TABLO.splice(k, 1); continue; } const g = t.cv.getContext('2d'); g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#ff3a2a'; g.font = 'bold 30px monospace'; g.textAlign = 'center'; g.fillText(`А-${num} → ${n === TICKET ? n + 1 : n}`, 128, 44); t.tx.needsUpdate = true; } if (BOL && started && Math.random() < 0.5) blip([660, 880], 0.4, 'sine', 0.03); }
// ================= УНИВЕРСАМ =================
const PRODUCTS = { hleb: 'Хлеб', moloko: 'Молоко', grechka: 'Гречка', tushenka: 'Тушёнка', sgush: 'Сгущёнка', chai: 'Чай', makarony: 'Макароны', sahar: 'Сахар' };
let LIST = [], GOT = {};
function shelfTex(k) { return texFrom(mkCanvas(512, 128, (g, w, h) => { const r = rng(k * 13 + 1); g.fillStyle = '#2a2622'; g.fillRect(0, 0, w, h);
  let x = 4; while (x < w - 10) { const t = r(), wd = 22 + r() * 30; const hh = 50 + r() * 60;
    if (t < 0.3) { g.fillStyle = ['#b8b0a0', '#8a7a5a', '#c8c0a8'][(r() * 3) | 0]; g.fillRect(x, h - hh, wd, hh); g.fillStyle = ['#b03a2a', '#2a5a9a', '#e8d080'][(r() * 3) | 0]; g.fillRect(x, h - hh * 0.65, wd, hh * 0.3); } // коробки
    else if (t < 0.6) { g.fillStyle = '#8a8a88'; g.fillRect(x, h - 46, wd, 46); g.fillStyle = ['#2a4a8a', '#c8b060', '#8a2a2a', '#3a6a3a'][(r() * 4) | 0]; g.fillRect(x, h - 38, wd, 22); } // банки
    else { g.fillStyle = 'rgba(160,190,150,0.8)'; g.fillRect(x + 3, h - hh, wd - 6, hh); g.fillStyle = '#4a6a2a'; g.fillRect(x + 6, h - hh * 0.7, wd - 12, hh * 0.6); g.fillStyle = '#b8a040'; g.fillRect(x + 5, h - hh - 6, wd - 10, 7); } // банки с соленьями
    x += wd + 2 + r() * 4; }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 16); })); }
const shelfMats = [0, 1, 2, 3].map((k) => new THREE.MeshStandardMaterial({ map: shelfTex(k), roughness: 0.7 }));
const prodMesh = { hleb: () => new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 8).rotateZ(Math.PI / 2).translate(0, 0.06, 0), std({ color: 0xb07a3a, roughness: 0.9 })),
  moloko: () => new THREE.Mesh(new THREE.TetrahedronGeometry(0.11).translate(0, 0.06, 0), std({ color: 0xf0f0f0, roughness: 0.6 })),
  grechka: () => new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.06).translate(0, 0.09, 0), std({ color: 0xc89a5a, roughness: 0.8 })),
  tushenka: () => new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 12).translate(0, 0.045, 0), envMat({ color: 0xb8b8b0, metalness: 1, roughness: 0.3 }, 0.8)),
  sgush: () => new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12).translate(0, 0.04, 0), std({ color: 0x3a6ab0, roughness: 0.5 })),
  chai: () => new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.06).translate(0, 0.07, 0), std({ color: 0x2a6a3a, roughness: 0.6 })),
  makarony: () => new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.08).translate(0, 0.03, 0), std({ color: 0xd8c070, roughness: 0.8 })),
  sahar: () => new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08).translate(0, 0.08, 0), std({ color: 0xeeeeea, roughness: 0.9 })) };
function showList() { const e = $('f_list'); if (!e) return; e.innerHTML = '<b>Список:</b><br>' + LIST.map((k) => (GOT[k] ? `<s style="opacity:.5">${PRODUCTS[k]}</s>` : PRODUCTS[k])).join('<br>'); }
if (MAG) {
  const keys = Object.keys(PRODUCTS); try { LIST = JSON.parse(sessionStorage.getItem('mag_list') || 'null'); } catch (e) {}
  if (!LIST) { LIST = keys.sort(() => Math.random() - 0.5).slice(0, 5); try { sessionStorage.setItem('mag_list', JSON.stringify(LIST)); } catch (e) {} }
  showList();
  cellType = (i, j) => (mod(i, 8) === 3 ? 'kassa' : mod(i, 4) === 3 ? 'aisle' : 'shelf');
  edgeType = () => 'none';
  GT.floor = MT.tileGray; GT.trash = false; GT.ceil = rep(std({ map: TX.wall, color: 0x8a8a84, roughness: 1 }), 1.2, 1.2);
  GT.light = (b, group, i, j, r) => { tubeLight(b, group, i * HC + HC / 2, j * HC + 1.2, r, 0.35); tubeLight(b, group, i * HC + HC / 2, j * HC + 3.6, r, 0.35); };
  GT.room = (b, group, i, j, r, t) => { const X = i * HC, Z = j * HC;
    if (t === 'shelf') { const sx = X + HC / 2, L = HC - 0.6; b.box(M.metal, sx, 0.9, Z + HC / 2, 0.08, 1.8, L, PAINT.galv);
      for (let k = 0; k < 4; k++) { const y = 0.15 + k * 0.45; b.box(M.metal, sx, y, Z + HC / 2, 0.9, 0.03, L, lin([0.55, 0.55, 0.52]));
        for (const sd of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.4), shelfMats[(ihash(i, j * 7 + k, sd) * 4) | 0]); m.position.set(sx + sd * 0.32, y + 0.215, Z + HC / 2); m.rotation.y = sd * Math.PI / 2; group.add(m); } }
      b.cols.push({ x: sx, z: Z + HC / 2, hx: 0.48, hz: L / 2, c: 1, s: 0 });
      if (r() < 0.55) { const pk = Object.keys(PRODUCTS)[(r() * 8) | 0], sd = r() < 0.5 ? -1 : 1, lv = (r() * 3 | 0) + 1, pz = Z + 0.7 + r() * (L - 0.8); const m = prodMesh[pk](); m.castShadow = true; addItem(group, m, sx + sd * 0.55, 0.17 + lv * 0.45, pz, `m${i},${j}`, PRODUCTS[pk]); coinsLive[coinsLive.length - 1].prod = pk; coinsLive[coinsLive.length - 1].fy = 0; coinsLive[coinsLive.length - 1].x = sx + sd * 0.9; }
    } else if (t === 'kassa') { const kx = X + HC / 2; b.box(M.paint, kx, 0.45, Z + 2.4, 0.7, 0.9, 2.6, lin([0.5, 0.48, 0.45])); b.box(M.rubber, kx, 0.91, Z + 2.2, 0.5, 0.02, 2.0); b.box(M.paint, kx + 0.1, 1.1, Z + 3.4, 0.4, 0.35, 0.35, lin([0.2, 0.2, 0.2])); b.box(M.glass, kx + 0.1, 1.2, Z + 3.4, 0.38, 0.12, 0.01);
      b.cols.push({ x: kx, z: Z + 2.4, hx: 0.38, hz: 1.32, c: 1, s: 0 });
      INTER.push({ x: kx - 0.9, z: Z + 3.4, r: 1.3, group, label: () => (LIST.every((k) => GOT[k]) ? 'E — оплатить' : 'E — касса'), act: () => { if (LIST.every((k) => GOT[k])) { try { sessionStorage.removeItem('mag_list'); } catch (e) {} goWorld('pole', 'Чек пробит. Выход — в поле.'); } else { blip([440, 330], 0.4, 'square', 0.04); toast('Касса не работает.<br><span style="font-size:14px;opacity:.7">Сначала всё по списку. Касса — в следующем ряду.</span>'); } } });
    } };
  furnish = () => {};
}
// подбор продукта из списка
const _itemPicked = itemPicked;
itemPicked = function (c, T) { if (c.prod && LIST.includes(c.prod) && !GOT[c.prod]) { GOT[c.prod] = true; showList(); if (LIST.every((k) => GOT[k])) toast('Всё по списку собрано.<br><span style="font-size:14px;opacity:.7">Найди работающую кассу.</span>'); } _itemPicked(c, T); };
