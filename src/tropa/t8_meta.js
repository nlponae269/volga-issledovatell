// ===================== Сон: переходы между мирами, ключи, концовка =====================
const WORLD_LIST = ['dvory', 'tishina', 'tropa', 'vorota', 'dom', 'podezd', 'ostanovka', 'shkola', 'bolnica', 'metro', 'magazin', 'plyazh', 'lager', 'pole', 'elektrichka', 'stroyka', 'zima'];
const WORLD_NAMES = { kvartira: 'Квартира', dvory: 'Дворы', tishina: 'Тишина', tropa: 'Тропа', vorota: 'Ворота', dom: 'Дом', podezd: 'Подъезд', ostanovka: 'Остановка', shkola: 'Школа', bolnica: 'Поликлиника', metro: 'Метро', magazin: 'Универсам', plyazh: 'Пляж', lager: 'Пионерлагерь', pole: 'Поле', elektrichka: 'Электричка', stroyka: 'Стройка', zima: 'Аномальная зима' };
const KEY_WORLDS = WORLD_LIST.filter((w) => w !== 'vorota');
const INTER = [];
function goWorld(id, text) {
  if (goWorld.busy) return; goWorld.busy = true; if (document.pointerLockElement) document.exitPointerLock();
  const f = $('fade'); f.style.transition = 'opacity 0.9s'; f.style.background = '#000'; f.style.opacity = 1; f.innerHTML = `<span style="color:#bbb;font-size:18px">${text || WORLD_NAMES[id] || ''}</span>`;
  try { localStorage.setItem('menu_last', id); } catch (e) {}
  setTimeout(() => { location.href = id + '.html'; }, 1300);
}
goWorld.busy = false;
function randomWorld() { const a = WORLD_LIST.filter((w) => w !== WORLD); return a[(Math.random() * a.length) | 0]; }
// --- ключи от ворот ---
function keysGot() { try { return JSON.parse(localStorage.getItem('dream_keys') || '[]'); } catch (e) { return []; } }
const keyMat = std({ color: 0xd9b24c, metalness: 1, roughness: 0.22, emissive: 0x4a3000, emissiveIntensity: 1.2 }); keyMat.envMap = ENV_TEX; keyMat.envMapIntensity = 1.4;
const keyGeo = (() => { const b = new Bag(); const I = new THREE.Matrix4();
  b.add(new THREE.TorusGeometry(0.06, 0.014, 8, 20), new THREE.Matrix4().makeTranslation(0, 0.3, 0));
  b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8), new THREE.Matrix4().makeTranslation(0, 0.13, 0));
  b.add(new THREE.BoxGeometry(0.06, 0.022, 0.016), new THREE.Matrix4().makeTranslation(0.03, 0.04, 0)); b.add(new THREE.BoxGeometry(0.045, 0.02, 0.016), new THREE.Matrix4().makeTranslation(0.022, 0.075, 0));
  return b.build(); })();
COIN_TYPES[20] = { n: 'Ключ от ворот', k: 'key' };
let keyObj = null;
function placeKey(group, x, y, z) {
  if (keysGot().includes(WORLD) || WORLD === 'vorota') return;
  const g = new THREE.Group(); const m = new THREE.Mesh(keyGeo, keyMat); m.castShadow = true; g.add(m);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.12, depthWrite: false })); glow.position.y = 0.2; g.add(glow);
  g.position.set(x, y, z); group.add(g); keyObj = { obj: g, x, y, z }; coinsLive.push({ id: 'KEY', obj: g, type: 20, x, z, fy: y, group });
}
function addKey() { const k = keysGot(); if (!k.includes(WORLD)) k.push(WORLD); try { localStorage.setItem('dream_keys', JSON.stringify(k)); } catch (e) {} keyObj = null;
  const n = k.filter((w) => KEY_WORLDS.includes(w)).length; toast(`<b style="color:#ffd35a">Ключ от ворот</b><br>${n} / ${KEY_WORLDS.length}${n >= KEY_WORLDS.length ? '<br><span style="font-size:14px">Ворота ждут.</span>' : ''}`); blip([523, 659, 784, 1047], 0.6, 'sine', 0.08); showKeys(); }
function showKeys() { const e = $('f_keys'); if (e) e.textContent = `${keysGot().filter((w) => KEY_WORLDS.includes(w)).length}/${KEY_WORLDS.length}`; }
// где спрятан ключ в каждом мире (детерминированно, далеко от старта)
const KEY_POS = { tropa: [-142, 0, 9], ostanovka: [186, 0, -24], plyazh: [-120, 0, 3], lager: [96, 0, 38], pole: [-160, 0, 22], stroyka: [54, 0, 42] };
let WORLD_UPDATE = null;
// ключ в мире-сетке: ближайшая обычная клетка к заданной
const KEY_CELL_WANT = { dom: [7, -5], shkola: [10, 3], bolnica: [12, 2], magazin: [15, 6] };
let KEYCELL = null;
function keyCell() { if (KEYCELL || !KEY_CELL_WANT[WORLD]) return KEYCELL; const [a, b] = KEY_CELL_WANT[WORLD]; for (let r = 0; r < 12 && !KEYCELL; r++) for (let i = a - r; i <= a + r && !KEYCELL; i++) for (let j = b - r; j <= b + r; j++) { const t = cellType(i, j); if (t === 'room' || t === 'aisle') { KEYCELL = [i, j]; break; } } return KEYCELL; }
// --- общие предметы-коллекции (значки, ракушки, вещи...) ---
let ITEMN = 0; try { ITEMN = +localStorage.getItem(WORLD + '_items') || 0; } catch (e) {}
COIN_TYPES[21] = { n: '', k: 'item' };
function addItem(group, mesh, x, y, z, id, name, note) { const g = new THREE.Group(); g.add(mesh); g.position.set(x, y, z); group.add(g); coinsLive.push({ id, obj: g, type: 21, x, z, fy: y, group, name, note }); }
function itemPicked(c) { ITEMN++; try { localStorage.setItem(WORLD + '_items', ITEMN); } catch (e) {} const el = $('f_items'); if (el) el.textContent = ITEMN; burst(0.1, 'bandpass', 2400, 1, 0.25); blip([988], 0.2, 'triangle', 0.05);
  if (c.note) showNote(c.note); else toast(`${c.name} <b style="color:#cfe08a">+1</b>`); }
function showNote(text) { const n = $('note'); if (!n) { toast(text); return; } n.querySelector('p').innerHTML = text; n.style.display = 'flex'; if (document.pointerLockElement) document.exitPointerLock(); n.onclick = () => { n.style.display = 'none'; }; }
// --- звуковой маяк ключа ---
let keyPing = 0;
function metaUpdate(dt) {
  if (BOL) tabloUpdate(dt);
  if (WORLD_UPDATE) WORLD_UPDATE(dt);
  if (keyObj && started) { const d = Math.hypot(keyObj.x - P.x, keyObj.z - P.z, (keyObj.y || 0) - P.y); keyObj.obj.rotation.y += dt * 1.2; keyObj.obj.children[0].position.y = 0.1 + Math.sin(clock * 2) * 0.04;
    if (!keyObj.obj.parent || !keyObj.obj.parent.parent) keyObj = null;
    else if (d < 30) { keyPing -= dt; if (keyPing < 0) { keyPing = 1 + d / 10; blip([1568 + (30 - d) * 10], 0.5, 'sine', 0.012 + 0.04 * (1 - d / 30)); } } }
}
// --- концовка (в «Воротах», когда собраны все ключи) ---
function allKeys() { return KEY_WORLDS.every((w) => keysGot().includes(w)); }
function ending() {
  if (GARDEN) { try { localStorage.setItem('dream_final', '1'); } catch (e) {} blip([392, 523, 659], 1.5, 'sine', 0.06); goWorld('dvory', 'Ворота открылись.<br><span style="font-size:15px">За ними — твой двор. 00:24.</span>'); return; }
  wakeUp(['Ворота открылись.', 'За ними не было ни участка, ни тумана.', 'Только комната. Утро. Будильник на семь.', 'Ты проснулся.']);
}
function wakeUp(lines) {
  if (goWorld.busy) return; goWorld.busy = true; if (document.pointerLockElement) document.exitPointerLock();
  try { localStorage.setItem('dream_done', '1'); } catch (e) {}
  const f = $('fade'); f.style.transition = 'opacity 3s'; f.style.background = '#f4f1ea'; f.style.opacity = 1; f.style.pointerEvents = 'auto'; f.innerHTML = '';
  blip([392, 523, 659, 784], 2.5, 'sine', 0.06);
  const box = document.createElement('div'); box.style.cssText = 'color:#333;font:300 22px system-ui,sans-serif;text-align:center;line-height:2;max-width:640px;padding:20px'; f.appendChild(box);
  lines.forEach((l, i) => setTimeout(() => { const p = document.createElement('div'); p.textContent = l; p.style.cssText = 'opacity:0;transition:opacity 2s'; box.appendChild(p); requestAnimationFrame(() => (p.style.opacity = 1)); }, 3500 + i * 3200));
  setTimeout(() => { const b = document.createElement('button'); b.textContent = 'В меню'; b.style.cssText = 'margin-top:30px;background:#333;color:#eee;border:0;padding:12px 28px;font-size:16px;border-radius:4px;cursor:pointer'; b.onclick = () => (location.href = 'index.html'); box.appendChild(b); }, 3500 + lines.length * 3200 + 800);
}
addEventListener('load', showKeys); showKeys();
if (GARDEN && allKeys()) setTimeout(() => toast('<b style="color:#ffd35a">Где-то в заборе появились ворота.</b>'), 4000);
