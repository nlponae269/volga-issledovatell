// ГАРАЖИ — веб-версия (порт GameManager.cs + сборка сцены из GarageSetup.cs). Без Unity.
import * as THREE from 'three';
import * as L from './layout.js';
import { A, generateAll } from './audio.js';
import { loadAll, setAniso, sRGB } from './assets.js';
import { GarageWorld } from './world.js';
import { Player } from './player.js';
import { Monster, State } from './monster.js';
import { Controls } from './controls.js';
import { Rain } from './rain.js';
import { createPost } from './post.js';
import { R, perlin } from './rng.js';

const D2R = Math.PI / 180, PI = Math.PI;
const params = new URLSearchParams(location.search);
const ultra = (() => { try { return (localStorage.getItem('gfx') || 'ultra') === 'ultra'; } catch (e) { return true; } })();
const mobile = matchMedia('(pointer:coarse)').matches && !ultra;   // «Ультра» — графика как на компьютере
const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const moveToward = (a, b, d) => Math.abs(b - a) <= d ? b : a + Math.sign(b - a) * d;

const status = document.getElementById('status');
const setStatus = t => { status.textContent = t; };

async function main() {
  // ---------- рендерер ----------
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  let pr = Math.min(devicePixelRatio, Number(params.get('pr')) || (mobile ? 0.9 : 1.25));   // дальше подстраивается под FPS
  renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = mobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  setAniso(Math.min(4, renderer.capabilities.getMaxAnisotropy()));

  const scene = new THREE.Scene();
  const fogCol = sRGB(.075, .085, .1);
  scene.background = fogCol; scene.fog = new THREE.FogExp2(fogCol, 0.036);
  // Unity зеркален относительно Three: игровые координаты (x,y,z) → Three (x,y,−z). Все вычисления — в игровых.
  const root = new THREE.Group(); root.scale.set(1, 1, -1); scene.add(root);
  const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 110);

  // ---------- свет ----------
  root.add(new THREE.AmbientLight(sRGB(.13, .14, .17), PI));
  const moon = new THREE.DirectionalLight(sRGB(.55, .63, .82), 0.4 * PI);
  { const d = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(38 * D2R, -35 * D2R, 0, 'YXZ')); moon.position.copy(d).multiplyScalar(-50); root.add(moon, moon.target); }
  const flash = new THREE.SpotLight(new THREE.Color().setRGB(1, .95, .86, THREE.SRGBColorSpace), 14 * PI, 38, 36 * D2R, 1 - 13 / 36, 2);
  flash.castShadow = true; flash.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  flash.shadow.camera.near = 0.2; flash.shadow.camera.far = 38; flash.shadow.bias = -0.0004; flash.shadow.normalBias = 0.03; flash.shadow.radius = 3;
  flash.map = makeCookie(); root.add(flash, flash.target);
  // пул динамических ламп (ближайшие к игроку) — число ламп постоянно, чтобы шейдеры не перекомпилировались
  const spotPool = [], pointPool = [];
  const NL = mobile ? 2 : 4;
  for (let i = 0; i < NL; i++) { const s = new THREE.SpotLight(0xffffff, 0, 20, 60 * D2R, 1 - 20 / 60, 2); root.add(s, s.target); spotPool.push(s); }
  for (let i = 0; i < NL; i++) { const p = new THREE.PointLight(0xffffff, 0, 7, 2); root.add(p); pointPool.push(p); }

  // ---------- загрузка ----------
  setStatus('Синтез звука…'); await new Promise(r => setTimeout(r, 30)); generateAll();
  const assets = await loadAll(p => setStatus(`Загрузка… ${Math.round(p * 100)}%`));
  const world = new GarageWorld(root, assets, Number(params.get('vr')) || (mobile ? 40 : 52));
  const player = new Player();
  const game = { onCaught: m => onCaught(m), onChaseStarted: () => onChaseStarted() };
  const monster = new Monster(root, assets.M.skin, assets.M.eye, player, game);
  const rain = new Rain(root);
  const controls = new Controls(player, canvas);
  setStatus('Строю гаражи…'); await new Promise(r => setTimeout(r, 30));
  L.clearObstacles();
  world.updateChunks({ x: player.pos.x, z: player.pos.z }, 1e9);
  monster.placeAway(45, 60); monster.pickRoamGoal();

  // ---------- пост-обработка ----------
  let post = createPost(renderer, scene, camera, innerWidth * pr, innerHeight * pr, mobile ? 0 : 4);
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    setRes(pr); ov.width = innerWidth; ov.height = innerHeight;
  });
  // разрешение рендера (пиксели CSS × pr): композер сам умножает на свой pixelRatio
  function setRes(v) { pr = v; renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false); post.composer.setPixelRatio(pr); post.composer.setSize(innerWidth, innerHeight); }
  setRes(pr);
  // автонастройка под телефон: держим ~55+ FPS, меняя разрешение, а в крайнем случае выключаем свечение
  const AQ = { t: 0, n: 0, warm: 2.5 };
  function autoQ(dt) { if (params.get('pr') || ultra) return; AQ.warm -= dt; if (AQ.warm > 0) return; AQ.t += dt; AQ.n++; if (AQ.t < 2) return;
    const fps = AQ.n / AQ.t; AQ.t = 0; AQ.n = 0;
    if (fps < 50 && pr > 0.55) setRes(Math.max(0.55, pr * 0.85));
    else if (fps < 42 && post.bloom.enabled) post.bloom.enabled = false;
    else if (fps > 58 && pr < (mobile ? 1.1 : 1.5)) setRes(Math.min(mobile ? 1.1 : 1.5, pr * 1.08)); }

  // ---------- HUD (замена OnGUI) ----------
  const ov = document.getElementById('hud'); ov.width = innerWidth; ov.height = innerHeight; const g = ov.getContext('2d');

  // ---------- состояние игры ----------
  let phase = 'menu', surviveTime = 0, fade = 1, redFlash = 0, menuAlpha = 1, heartTimer = 0, ambientTimer = 6, caughtT = 0, deadT = 0;
  let best = 0; try { best = Number(localStorage.getItem('best') || 0); } catch (e) {}
  let rainSrc, windSrc, heartSrc, stingSrc, ambSrc, audioReady = false;
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function startAudio() {
    A.init(); if (audioReady) return; audioReady = true;
    rainSrc = A.source(); rainSrc.loop(A.raw.rain, 0.55);
    windSrc = A.source(); windSrc.loop(A.raw.wind, 0.35);
    heartSrc = A.source(); stingSrc = A.source();
    ambSrc = A.source({ spatial: true, min: 6, max: 80, rolloff: 'linear' });
    player.initAudio(); monster.initAudio();
  }
  function startGame() {
    startAudio(); phase = 'play'; player.controlsEnabled = true; controls.visible = true; monster.start();
  }
  function onChaseStarted() { stingSrc && stingSrc.play(A.raw.sting, 0.6); redFlash = 0.25; player.addShake(0.4); }
  function onCaught(m) {
    if (phase !== 'play') return;
    phase = 'caught'; caughtT = 0; player.controlsEnabled = false; controls.visible = false; controls.unlockMouse();
    const fx = Math.sin(player.yaw * D2R), fz = Math.cos(player.yaw * D2R);
    m.placeForJumpscare(player.pos.x + fx * 0.95, player.pos.z + fz * 0.95, player.pos.x, player.pos.z);
    player.addShake(1.5); redFlash = 0.6;
  }
  function consumePress() { const p = controls.anyPress; controls.anyPress = false; return p; }

  // ---------- цикл ----------
  let last = performance.now(), T = 0, frameN = 0;
  const camV = new THREE.Vector3(), camU = new THREE.Vector3(), camF = new THREE.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; T += dt;
    if (document.hidden) return;
    if (audioReady) A.resume();

    controls.update();
    if (phase === 'menu') { fade = moveToward(fade, 0.35, dt * 0.5); if (consumePress() && fade < 0.6) startGame(); }
    else if (phase === 'play') {
      menuAlpha = moveToward(menuAlpha, 0, dt * 1.5); fade = moveToward(fade, 0, dt * 0.6); surviveTime += dt; consumePress();
      updateTension(dt);
    } else if (phase === 'caught') {
      caughtT += dt; player.lookAtPoint(monster.headPos, 0.35);
      if (caughtT > 1.4 && fade < 1) { fade = 1; rainSrc && rainSrc.setVolume(0.2); if (surviveTime > best) { best = surviveTime; try { localStorage.setItem('best', best); } catch (e) {} } deadT = 0; }
      if (fade >= 1) { deadT += dt; if (deadT > 1.2) phase = 'dead'; }
    } else if (phase === 'dead') { if (consumePress()) location.reload(); }
    redFlash = moveToward(redFlash, 0, dt * 0.8);

    player.update(dt);
    monster.update(dt, T);
    world.update(dt, player.pos);
    world.tickLamps(T);
    rain.update(dt, player.pos);

    // случайные звуки кооператива
    ambientTimer -= dt;
    if (ambientTimer <= 0 && audioReady) {
      ambientTimer = R.range(8, 22);
      const f = R.insideUnitSphere(), l = Math.hypot(f.x, f.z) || 1, d = R.range(15, 45);
      ambSrc.setPos(player.pos.x + f.x / l * d, 2, player.pos.z + f.z / l * d);
      const all = [...A.raw.creaks, ...A.raw.clanks];
      ambSrc.play(all[Math.floor(Math.random() * all.length)], R.range(0.4, 0.9), R.range(0.8, 1.1));
    }

    syncLights();
    syncCamera();
    post.u.uTime.value = T;
    if (mobile) flash.shadow.autoUpdate = player.flashOn && (frameN++ & 1) === 0;   // тень фонарика — через кадр
    post.composer.render(dt); autoQ(dt);
    drawHud();
  }

  function updateTension(dt) {
    const d = monster.dist, chase = monster.state === State.Chase;
    let t = Math.min(1, Math.max(0, 1 - (d - 3) / 30)); if (chase) t = Math.max(t, 0.75);
    heartTimer -= dt;
    if (t > 0.05 && heartTimer <= 0 && heartSrc) { heartTimer = lerp(1.3, 0.42, t); heartSrc.play(A.raw.heart, lerp(0.15, 0.9, t)); }
    post.u.uVig.value = lerp(0.33, 0.55, t);
    post.u.uChroma.value = lerp(0.05, 0.45, chase ? t : t * 0.3);
    windSrc && windSrc.setVolume(lerp(0.35, 0.15, t));
  }

  const tv = new THREE.Vector3();
  function syncLights() {
    const q = player.flashQuat; tv.set(0, 0, 1).applyQuaternion(q);
    flash.position.set(player.flashPos.x, player.flashPos.y, player.flashPos.z);
    flash.target.position.set(flash.position.x + tv.x, flash.position.y + tv.y, flash.position.z + tv.z);
    flash.intensity = player.flashOn ? 14 * PI : 0; flash.shadow.autoUpdate = player.flashOn;
    // ближайшие лампы
    const px = player.pos.x, pz = player.pos.z, cand = { spot: [], point: [] };
    for (const l of world.lamps) {
      const d = Math.hypot(l.x - px, l.z - pz) - l.range * 0.6;
      if (d < l.range + 40) cand[l.type].push([d, l]);
    }
    const assign = (pool, list) => {
      list.sort((a, b) => a[0] - b[0]);
      pool.forEach((li, i) => {
        const e = list[i];
        if (!e) { li.intensity = 0; return; }
        const l = e[1]; li.position.set(l.x, l.y, l.z);
        li.color.setRGB(l.color[0], l.color[1], l.color[2], THREE.SRGBColorSpace);
        li.intensity = l.intensity * l.k * PI; li.distance = l.range;
        if (li.target) li.target.position.set(l.x + l.dir[0], l.y + l.dir[1], l.z + l.dir[2]);
      });
    };
    assign(spotPool, cand.spot); assign(pointPool, cand.point);
  }
  function syncCamera() {
    const h = player.headPos, q = player.headQuat;
    camera.position.set(h.x, h.y, -h.z);
    camF.set(0, 0, 1).applyQuaternion(q); camU.set(0, 1, 0).applyQuaternion(q);
    camera.up.set(camU.x, camU.y, -camU.z);
    camera.lookAt(h.x + camF.x, h.y + camF.y, -(h.z + camF.z));
    camera.updateMatrixWorld();
    if (audioReady) A.setListener({ x: h.x, y: h.y, z: -h.z }, { x: camF.x, y: camF.y, z: -camF.z }, { x: camU.x, y: camU.y, z: -camU.z });
  }

  function drawHud() {
    const W = innerWidth, H = innerHeight, sc = Math.min(W, H) / 720;
    g.clearRect(0, 0, W, H);
    if (fade > 0.001) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }
    if (redFlash > 0.001) { g.fillStyle = `rgba(128,0,0,${redFlash})`; g.fillRect(0, 0, W, H); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const txt = (s, y, size, col, bold) => { g.font = `${bold ? 'bold ' : ''}${size * sc}px sans-serif`; g.fillStyle = col; g.fillText(s, W / 2, y); };
    if (phase === 'menu' || menuAlpha > 0.01) {
      const a = phase === 'menu' ? 1 : menuAlpha, y0 = H * 0.25;
      txt('ГАРАЖИ', y0 + 60 * sc, 84, `rgba(217,209,199,${a})`, true);
      txt('Здесь кто-то есть. Не попадайся ему на глаза.', y0 + 145 * sc, 26, `rgba(204,204,204,${a * 0.8})`);
      txt('Бег и фонарь выдают тебя.', y0 + 190 * sc, 26, `rgba(204,204,204,${a * 0.8})`);
      if (phase === 'menu') {
        txt(mobile || controls.touchMode ? 'Коснись экрана' : 'Нажми, чтобы начать  (WASD, мышь, Shift — бег, F — фонарь)', H * 0.72, 26, `rgba(255,255,255,${0.5 + 0.4 * Math.sin(T * 3)})`);
        if (best > 0) txt('Рекорд: ' + fmt(best), H * 0.8, 26, 'rgba(255,255,255,.5)');
      }
    }
    if (phase === 'play') { g.textAlign = 'left'; g.font = `${22 * sc}px sans-serif`; g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText(fmt(surviveTime), 24 * sc, 38 * sc); }
    if (phase === 'dead') {
      txt('ОН ТЕБЯ НАШЁЛ', H * 0.3 + 60 * sc, 84, 'rgb(179,20,15)', true);
      txt(`Ты продержался ${fmt(surviveTime)}    Рекорд: ${fmt(best)}`, H * 0.3 + 145 * sc, 26, 'rgba(217,217,217,.9)');
      txt('Ещё раз', H * 0.72, 26, `rgba(255,255,255,${0.5 + 0.4 * Math.sin(T * 3)})`);
    }
    controls.draw(g, W, H);
  }

  // Куки фонаря: яркое пятно, кольцо рефлектора, мягкий край, грязь на стекле (порт FlashlightCookie)
  function makeCookie() {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), im = x.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const d = Math.hypot(xx - S / 2, y - S / 2) / (S / 2);
      const hot = Math.exp(-d * d * 9), ring = Math.exp(-Math.pow((d - 0.42) * 9, 2)) * 0.35, spill = Math.max(0, Math.min(1, 1 - d)) * 0.6;
      const dirt = 0.85 + 0.15 * perlin(xx * 0.05, y * 0.05);
      const v = Math.min(1, (hot + ring + spill) * dirt) * Math.min(1, Math.max(0, (1 - d) * 6)), i = (y * S + xx) * 4;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.round(v * 255); im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }

  status.style.display = 'none';
  window.__game = { flash, post, root, assets, setFade: v => { fade = v; menuAlpha = 0; }, player, monster, world, renderer, camera, scene, T: () => T, startGame, get phase() { return phase; } };
  requestAnimationFrame(frame);
}
main().catch(e => { document.getElementById('status').textContent = 'Ошибка: ' + e.message; console.error(e); });
