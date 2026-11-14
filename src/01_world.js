// ============================================================
//  ЧАСТЬ 1. Математика, шум, рельеф, деревни
// ============================================================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------- Сид мира ----------------
// Задаётся в адресе: index.html#seed=ТЕКСТ_ИЛИ_ЧИСЛО. Пусто = стандартный мир. Сид 1 = демо-мир, где всё рядом со стартом.
function readSeed() {
  let raw = '';
  try { const m = /seed=([^&]*)/.exec(location.hash); if (m) raw = decodeURIComponent(m[1]).trim(); } catch (e) { }
  if (!raw) return { raw: '', n: 0 };
  if (/^-?\d{1,9}$/.test(raw)) return { raw, n: parseInt(raw, 10) };
  let h = 2166136261;
  for (const ch of raw) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return { raw, n: (h | 0) || 7 };
}
const SEEDINFO = readSeed(), WSEED = SEEDINFO.n, SHOWCASE = WSEED === 1;
const SEEDMIX = Math.imul(WSEED, 2654435761);

function hash2(x, z, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(((s | 0) + 1) ^ SEEDMIX, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function vnoise(x, z, s) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = zf * zf * zf * (zf * (zf * 6 - 15) + 10);
  const a = hash2(xi, zi, s), b = hash2(xi + 1, zi, s), c = hash2(xi, zi + 1, s), d = hash2(xi + 1, zi + 1, s);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function fbm(x, z, oct, s) {
  let a = 1, f = 1, sum = 0, n = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * vnoise(x * f + i * 31.7, z * f - i * 17.3, s + i * 17);
    n += a; a *= 0.5; f *= 2.03;
  }
  return sum / n;
}

// ---------------- Рельеф ----------------
const CH = 64;            // размер чанка (м)
const SEG = 40;           // сегментов сетки
const CELL = CH / SEG;

// береговая линия Волги (вода при z < shoreZ(x))
function shoreZ(x) { return 14 * fbm(x * 0.011, 3.7, 3, 11) + 6 * fbm(x * 0.04, 8.1, 2, 12); }

// "авторский" рельеф у спавна: широкая река, пляж, склон вверх
function authoredH(x, z) {
  const zs = z - shoreZ(x);
  let h;
  if (zs < 0) h = -16 * (1 - Math.exp(zs / 24));
  else {
    const zc = Math.min(zs, 460);
    h = 0.15 * zc + 0.00062 * zc * zc;
    const amp = 1.2 + Math.min(zs, 300) * 0.07;
    h += fbm(x * 0.013, z * 0.013, 4, 5) * amp * smooth(4, 40, zs);
    h += 22 * fbm(x * 0.0045 + 7, z * 0.0045, 3, 6) * smooth(10, 120, zs);
    // стены долины по бокам
    h += 70 * smooth(140, 430, Math.abs(x) + 20 * fbm(z * 0.01, x * 0.003, 2, 8)) * smooth(0, 70, zs);
    // уступы-скалы
    h += 10 * smooth(0.12, 0.22, fbm(x * 0.009 + 5, z * 0.009, 2, 73)) * smooth(60, 160, zs);
  }
  h += 0.35 * fbm(x * 0.17, z * 0.17, 2, 7);
  return h;
}

// бесконечный "обычный" рельеф: холмы, горы, реки, озёра
function genericH(x, z) {
  const c = fbm(x * 0.0025, z * 0.0025, 4, 31);
  const hills = fbm(x * 0.012, z * 0.012, 4, 32) * 14;
  const mm = smooth(-0.12, 0.2, fbm(x * 0.0018 + 50, z * 0.0018 - 30, 3, 33));
  let ridge = 1 - Math.abs(fbm(x * 0.0058, z * 0.0058, 4, 34));
  ridge = ridge * ridge;
  let h = c * 26 + 14 + hills + mm * (ridge * 185 + 30);
  // скальные уступы: крутые стенки, которые надо обходить
  const lg = fbm(x * 0.011 + 9, z * 0.011 - 2, 2, 71);
  h += 10 * smooth(0.0, 0.09, lg) * (0.3 + mm);
  h += 6 * smooth(0.02, 0.11, fbm(x * 0.017, z * 0.017 + 4, 2, 72)) * mm;
  // реки
  const r = Math.abs(fbm(x * 0.0032 + 11, z * 0.0032 - 5, 3, 41));
  h -= (1 - smooth(0.0, 0.05, r)) * 15 * (1 - mm);
  h += 0.4 * fbm(x * 0.17, z * 0.17, 2, 7);
  return h;
}

function heightBase(x, z) {
  const d = Math.hypot(x, z - 80);
  const w = 1 - smooth(260, 560, d);
  let h = 0;
  if (w > 0) h += w * authoredH(x, z);
  if (w < 1) h += (1 - w) * genericH(x, z);
  return h;
}

// ---------------- Деревни ----------------
const VCELL = 220, VF = 38, VR = 78;
const VNAMES = ['Заречье', 'Липовка', 'Осиновка', 'Берёзовка', 'Волжанка', 'Ягодное', 'Подгорное', 'Кленовка',
  'Дубрава', 'Затишье', 'Рыбачье', 'Лесное', 'Красный Яр', 'Бор', 'Малые Ключи', 'Тихая Заводь', 'Вишнёвка',
  'Сосновка', 'Старая Слобода', 'Покровское', 'Ольховка', 'Грачи'];
const villageCache = new Map();

function villageCell(cx, cz) {
  const key = cx + ',' + cz;
  let v = villageCache.get(key);
  if (v !== undefined) return v;
  v = null;
  const showPos = SHOWCASE ? (cx === 0 && cz === 0 ? [34, shoreZ(34) + 36] : (cx === -1 && cz === 0 ? [-50, shoreZ(-50) + 42] : null)) : null;
  const forced = showPos ? true : (!SHOWCASE && cx === 0 && cz === 0);
  const r1 = hash2(cx, cz, 901), r2 = hash2(cx, cz, 902), r3 = hash2(cx, cz, 903), r4 = hash2(cx, cz, 904);
  if (forced || r1 < 0.4) {
    let x, z;
    if (showPos) { x = showPos[0]; z = showPos[1]; }
    else if (forced) { x = 46; z = 205; }
    else { x = (cx + 0.18 + 0.64 * r2) * VCELL; z = (cz + 0.18 + 0.64 * r3) * VCELL; }
    const h = heightBase(x, z);
    let ok = forced || (h > 3 && h < 70 && Math.hypot(x, z) > 150);
    if (ok && !forced) {
      let mn = h, mx = h;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        const hh = heightBase(x + Math.cos(a) * 36, z + Math.sin(a) * 36);
        if (hh < 1.5) ok = false;
        mn = Math.min(mn, hh); mx = Math.max(mx, hh);
      }
      if (mx - mn > 26) ok = false;
    }
    if (ok) {
      v = {
        x, z, h, id: (cx * 1000 + cz) | 0,
        ang: forced ? 0.2 : r4 * TAU,
        name: showPos ? (cx === 0 ? 'Нагорное' : 'Заречье') : forced ? 'Нагорное' : VNAMES[Math.floor(hash2(cx, cz, 905) * VNAMES.length)],
        found: false, layout: null,
      };
    }
  }
  villageCache.set(key, v);
  return v;
}
function villagesNear(x, z, rad) {
  const out = [];
  const cx0 = Math.floor((x - rad) / VCELL), cx1 = Math.floor((x + rad) / VCELL);
  const cz0 = Math.floor((z - rad) / VCELL), cz1 = Math.floor((z + rad) / VCELL);
  for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) {
    const v = villageCell(cx, cz);
    if (v && Math.hypot(x - v.x, z - v.z) < rad) out.push(v);
  }
  return out;
}

function heightAt(x, z) {
  let h = heightBase(x, z);
  const cx0 = Math.floor((x - VR) / VCELL), cx1 = Math.floor((x + VR) / VCELL);
  const cz0 = Math.floor((z - VR) / VCELL), cz1 = Math.floor((z + VR) / VCELL);
  for (let cz = cz0; cz <= cz1; cz++) for (let cx = cx0; cx <= cx1; cx++) {
    const v = villageCell(cx, cz);
    if (!v) continue;
    const d = Math.hypot(x - v.x, z - v.z);
    if (d < VR) h = lerp(h, v.h, 1 - smooth(VF, VR, d));
  }
  return h;
}

// ---------------- Лагерь у костра (спавн) ----------------
const CAMP = { x: 15, z: shoreZ(15) + 11, y: 0 };
CAMP.y = heightAt(CAMP.x, CAMP.z);
const WLIM = 16777216, FAR = (() => { try { return localStorage.getItem('farlands') === '1'; } catch (e) { return false; } })();   // Far Lands: край мира там, где в 32-битных числах кончается место
const SPAWN = { x: FAR ? WLIM - 150 : 0, z: shoreZ(FAR ? WLIM - 150 : 0) + 3.2 };

// плотность леса 0..1
function forestAt(x, z, h) {
  if (h < 0.9 || h > 100) return 0;
  const f = fbm(x * 0.006 + 9, z * 0.006 - 4, 3, 51);
  let d = smooth(-0.15, 0.2, f);
  const zs = z - shoreZ(x);
  const wA = 1 - smooth(220, 520, Math.hypot(x, z - 60));
  d = Math.max(d, wA * 0.6 * smooth(3, 12, zs) * (1 - smooth(150, 215, zs)));
  d *= smooth(-0.65, -0.1, fbm(x * 0.021, z * 0.021, 2, 52));
  d *= 1 - smooth(60, 100, h);
  return d;
}

function biomeName(x, z, h) {
  const vs = villagesNear(x, z, 45);
  if (vs.length) return 'Деревня «' + vs[0].name + '»';
  if (Math.hypot(x - CAMP.x, z - CAMP.z) < 16) return 'Лагерь у костра';
  if (h < -0.4) return Math.abs(z - shoreZ(x)) < 600 && z < 100 && Math.hypot(x, z - 80) < 520 ? 'Волга' : 'Река / озеро';
  if (h > 118) return 'Заснеженные вершины';
  if (h > 72) return 'Горы';
  if (h < 2.0) return 'Берег';
  const f = forestAt(x, z, h);
  if (f > 0.5) return 'Осенний лес';
  if (f > 0.2) return 'Редколесье';
  return h > 28 ? 'Холмы' : 'Осенний луг';
}

// ---------------- Записки ----------------
const NOTES = [
  'Конец октября. Встали лагерем на берегу, ниже последней деревни. Дима с утра пошёл вверх по склону — посмотреть, что за гребнем. Обещал вернуться к обеду. Костёр я не гашу.',
  'Вечер. Дима не вернулся. Кричал до хрипоты. Эхо возвращается как-то странно — с опозданием, и не оттуда, куда я кричу. Утром пойду по его следам.',
  'Нашёл его следы. Они идут вверх по склону и просто обрываются на ровном месте. Ни обрыва, ни снега. Листья вокруг лежат нетронутыми.',
  'В деревне наверху никого. Двери открыты, на столах посуда, чайник ещё тёплый. Я просидел там час. Никто не пришёл.',
  'Только сейчас заметил: здесь нет птиц. Давно уже нет. Слышно только мои шаги и ветер. Раньше я думал, что тишина — это когда тихо. Оказалось, это когда слушаешь.',
  'Делаю зарубки на деревьях. Через час вышел к дереву с зарубкой. К своей. Но я шёл только прямо.',
  'Туман третий день не уходит. Стрелка компаса не стоит на месте. Реку с гребня не видно. Сколько я прошёл — не знаю. Хожу, потому что стоять на месте хуже.',
  'Если ты это читаешь — не ищи нас. Вернись к воде и иди вдоль берега. Не поднимайся выше. Мы ничего не видели. Мы просто не смогли найти дорогу назад.',
  'Не помню, какое сегодня число. Костёр у реки, наверное, давно погас. Хотя я почему-то уверен: он ещё горит. Я оставил его — и он горит. Он не должен был гореть так долго.',
  'На камне кто-то нацарапал: «ВНИЗ». Рядом ещё одна надпись, но её почти стёрло. Я долго не мог разобрать. Там написано: «ТЫ УЖЕ ЗДЕСЬ БЫЛ».',
];
