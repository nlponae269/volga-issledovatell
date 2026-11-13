import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const base = new URL('../assets/', import.meta.url).href;
const texLoader = new THREE.TextureLoader();
const texCache = new Map();
export const sRGB = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

let maxAniso = 4;
export const setAniso = a => { maxAniso = a; };

function loadTex(file, srgb) {
  const k = file + srgb;
  if (texCache.has(k)) return texCache.get(k);
  const p = new Promise((res, rej) => texLoader.load(base + 'tex/' + file, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; res(t);
  }, undefined, e => { console.warn('нет текстуры', file); res(null); }));
  texCache.set(k, p); return p;
}

// ORM = R: AO, G: roughness, B: metalness (карты блеска/луж собраны tools/prep_assets.py)
export async function litMaterial({ set, orm, tint = [1, 1, 1], bump = 1 }) {
  const [map, nor, ormT] = await Promise.all([loadTex(`${set}_diff.jpg`, true), loadTex(`${set}_nor.jpg`, false), orm ? loadTex(`${orm}_orm.jpg`, false) : null]);
  const m = new THREE.MeshStandardMaterial({ map, normalMap: nor, color: sRGB(...tint), roughness: 1, metalness: 0 });
  m.shadowSide = THREE.DoubleSide;
  if (nor) m.normalScale.set(bump, bump);
  if (ormT) { m.aoMap = ormT; m.roughnessMap = ormT; m.metalnessMap = ormT; m.metalness = 1; }
  return m;
}

export const EXPECTED = {
  old_tyre: 0.75, barrel_03: 0.9, trashbag: 0.8, covered_car: 4.6, street_lamp_01: 6.5, cardboard_box_01: 0.5,
  wooden_crate_01: 0.8, metal_jerrycan: 0.5, concrete_road_barrier: 2, rusted_wheel_rim_01: 0.6, utility_box_01: 0.8,
  plastic_crate_01: 0.55, cement_bag: 0.75, security_light: 0.35, water_manhole_cover: 0.8,
};

// Загружает FBX и "запекает" в шаблон: позиции/нормали/uv/индексы, масштаб как в GarageSetup.BuildPrefabs
async function loadProp(name) {
  const mgr = new THREE.LoadingManager(); mgr.setURLModifier(u => u.endsWith('.fbx') ? u : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');
  const grp = await new Promise((res, rej) => new FBXLoader(mgr).load(base + `models/${name}.fbx`, res, undefined, rej));
  grp.updateMatrixWorld(true);
  const P = [], N = [], UV = [], I = [];
  const nm = new THREE.Matrix3(), v = new THREE.Vector3();
  grp.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
    nm.getNormalMatrix(o.matrixWorld);
    const b = P.length / 3;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); P.push(v.x, v.y, v.z);
      if (nor) v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); else v.set(0, 1, 0);
      N.push(v.x, v.y, v.z); UV.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) I.push(b + g.index.getX(i)); else for (let i = 0; i < pos.count; i++) I.push(b + i);
  });
  const bb = () => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < P.length; i += 3) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i + a]); mx[a] = Math.max(mx[a], P[i + a]); } return { mn, mx }; };
  let { mn, mx } = bb();
  const maxDim = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
  const ratio = EXPECTED[name] / Math.max(1e-4, maxDim);
  const sc = (ratio > 3 || ratio < 0.33) ? ratio : 1;
  const cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
  for (let i = 0; i < P.length; i += 3) { P[i] = (P[i] - cx) * sc; P[i + 1] = (P[i + 1] - mn[1]) * sc; P[i + 2] = (P[i + 2] - cz) * sc; }
  const size = [(mx[0] - mn[0]) * sc, (mx[1] - mn[1]) * sc, (mx[2] - mn[2]) * sc];
  return { name, P: new Float32Array(P), N: new Float32Array(N), UV: new Float32Array(UV), I: new Uint32Array(I), size, matKey: 'prop_' + name };
}

export async function loadAll(onProgress) {
  const M = {};
  const defs = {
    asphalt: { set: 'road_damaged', orm: 'road_damaged_w100', tint: [.62, .62, .64] },
    brick: { set: 'worn_brick_wall', orm: 'worn_brick_wall_w35', tint: [.8, .78, .76] },
    plaster: { set: 'rough_plaster_brick_02', orm: 'rough_plaster_brick_02_w30', tint: [.72, .72, .7] },
    roof: { set: 'tarred_gravel', orm: 'tarred_gravel_w80', tint: [.55, .55, .55] },
    concrete: { set: 'dirty_concrete', orm: 'dirty_concrete_w40', tint: [.7, .7, .7] },
    garageFloor: { set: 'garage_floor', orm: 'garage_floor_w0', tint: [.6, .6, .6] },
    doorFrame: { set: 'rusty_metal_shutter', orm: 'rusty_metal_shutter_w0', tint: [.45, .4, .38] },
    door0: { set: 'green_metal_rust', orm: 'green_metal_rust_w25' },
    door1: { set: 'rusty_painted_metal', orm: 'rusty_painted_metal_w25' },
    door2: { set: 'rusty_painted_metal', orm: 'rusty_painted_metal_w25', tint: [.75, .55, .42] },
    door3: { set: 'painted_metal_shutter', orm: 'painted_metal_shutter_w25' },
    door4: { set: 'rusty_metal_shutter', orm: 'rusty_metal_shutter_w20' },
    door5: { set: 'rusty_painted_metal', orm: 'rusty_painted_metal_w25', tint: [.62, .66, .66] },
    skin: { set: 'worn_cracked_plaster', orm: 'worn_cracked_plaster_w75', tint: [.42, .39, .37], bump: 1.6 },
  };
  const names = Object.keys(EXPECTED);
  let done = 0; const total = Object.keys(defs).length + names.length;
  const tick = () => onProgress && onProgress(++done / total);
  await Promise.all(Object.entries(defs).map(async ([k, d]) => { M[k] = await litMaterial(d); tick(); }));
  const props = {};
  await Promise.all(names.map(async n => {
    const t = await loadProp(n); props[n] = t;
    M[t.matKey] = await litMaterial({ set: n, orm: n }); tick();
  }));
  M.doors = [M.door0, M.door1, M.door2, M.door3, M.door4, M.door5];
  M.eye = new THREE.MeshStandardMaterial({ color: sRGB(.02, .02, .02), roughness: 0, metalness: 0, emissive: new THREE.Color(.25, .22, .18) });
  M.wire = new THREE.MeshBasicMaterial({ color: sRGB(.015, .015, .015), side: THREE.DoubleSide });
  return { M, props };
}
