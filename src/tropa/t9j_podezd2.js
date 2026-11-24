// ===================== ПОДЪЕЗД, цикл 2: новогодняя ночь — салюты за окном, куранты, телевизоры, шаги этажом выше =====================
if (PODEZD) {
  // цветные вспышки салюта в окне межэтажной площадки (один PointLight следует за этажом игрока)
  const fw = new THREE.PointLight(0xff4040, 0, 9, 2); scene.add(fw); let fwT = 0, fwCol = 0xff4040, fwBase = 0; const FW = [0xff3a3a, 0x3aff7a, 0x3a8aff, 0xffd03a, 0xd03aff];
  const lastSnd = { fire: 8, tv: 20, step: 35, chime: 60, glass: 50, cough: 90 };
  const pan = () => Math.random() * 1.6 - 0.8;
  function salute() { if (!AC) return; const p = pan(); burst(0.12, 'lowpass', 160, 0.8, 0.5, p); setTimeout(() => { burst(1.4, 'bandpass', 3200, 0.7, 0.06, p); burst(0.9, 'highpass', 5200, 0.4, 0.03, p); }, 160 + Math.random() * 120); if (Math.random() < 0.5) setTimeout(() => burst(0.12, 'lowpass', 150, 0.8, 0.35, p), 420); }
  function chimes() { if (!AC) return; const t0 = AC.currentTime; for (let k = 0; k < 12; k++) { const t = t0 + k * 1.25, o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(), sp = AC.createStereoPanner(); sp.pan.value = -0.3;
      o.type = 'sine'; o.frequency.value = 196; o2.type = 'sine'; o2.frequency.value = 196 * 2.76; f.type = 'lowpass'; f.frequency.value = 1500; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0003, t + 2.6); o.connect(f); o2.connect(f); f.connect(g).connect(sp).connect(master); o.start(t); o2.start(t); o.stop(t + 2.7); o2.stop(t + 2.7); } }
  function tvMurmur() { if (!AC) return; const p = pan(), n = 14 + ((Math.random() * 10) | 0); for (let k = 0; k < n; k++) setTimeout(() => burst(0.05 + Math.random() * 0.12, 'bandpass', 350 + Math.random() * 700, 5, 0.03, p), k * (90 + Math.random() * 140)); if (Math.random() < 0.6) setTimeout(() => { for (let k = 0; k < 6; k++) setTimeout(() => burst(0.2, 'lowpass', 320, 1, 0.02, p), k * 70); }, n * 120); }
  function stepsAbove() { if (!AC) return; const p = pan(), n = 6 + ((Math.random() * 6) | 0); for (let k = 0; k < n; k++) setTimeout(() => burst(0.07, 'lowpass', 260 + Math.random() * 120, 1.2, 0.09, p), k * (430 + Math.random() * 80)); }
  function glasses() { if (!AC) return; const p = pan(); [1320, 1760, 1480].forEach((f, i) => setTimeout(() => blip([f * (0.98 + Math.random() * 0.04)], 0.35, 'sine', 0.01), i * 120)); for (let k = 0; k < 5; k++) setTimeout(() => burst(0.15, 'bandpass', 420 + Math.random() * 200, 4, 0.03, p), 600 + k * 130); }
  function cough() { if (!AC) return; const p = pan(); burst(0.22, 'bandpass', 700, 2, 0.08, p); setTimeout(() => burst(0.18, 'bandpass', 620, 2, 0.06, p), 260); }

  // пылинки в воздухе вокруг игрока: видны в свете лампочки
  const dn = MOBILE ? 60 : 120, dp = new Float32Array(dn * 3), dv = new Float32Array(dn * 3);
  for (let i = 0; i < dn; i++) { dp[i * 3] = (Math.random() - 0.5) * 7; dp[i * 3 + 1] = (Math.random() - 0.3) * 3; dp[i * 3 + 2] = (Math.random() - 0.5) * 7; dv[i * 3] = (Math.random() - 0.5) * 0.04; dv[i * 3 + 1] = (Math.random() - 0.5) * 0.03; dv[i * 3 + 2] = (Math.random() - 0.5) * 0.04; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dn * 3), 3));
  const dustTex = texFrom(mkCanvas(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.011, map: dustTex, color: 0xffeeb8, transparent: true, opacity: 0.55, depthWrite: false })); dust.frustumCulled = false; scene.add(dust);
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return;
    { const a = dg.attributes.position.array; for (let i = 0; i < dn; i++) { for (let k = 0; k < 3; k++) { dp[i * 3 + k] += dv[i * 3 + k] * dt * 60 * 0.016 * 4 + Math.sin(clock * 0.5 + i) * 0.0006; } if (Math.abs(dp[i * 3]) > 3.5) dp[i * 3] *= -0.95; if (dp[i * 3 + 1] > 2.2 || dp[i * 3 + 1] < -1.2) dp[i * 3 + 1] *= -0.9; if (Math.abs(dp[i * 3 + 2]) > 3.5) dp[i * 3 + 2] *= -0.95; a[i * 3] = P.x + dp[i * 3]; a[i * 3 + 1] = P.y + 1.4 + dp[i * 3 + 1]; a[i * 3 + 2] = P.z + dp[i * 3 + 2]; } dg.attributes.position.needsUpdate = true; }
    fwT -= dt; if (fwT > 0) { fw.intensity = fwBase * Math.max(0, fwT / 0.9) * (0.7 + 0.3 * Math.sin(clock * 40)); } else fw.intensity = 0;
    const fy = Math.floor((P.y + 0.3) / FH) * FH + FH / 2 + 1.5; fw.position.set(PW / 2, fy, PL + MIDD + 0.4);
    for (const k in lastSnd) { lastSnd[k] -= dt; if (lastSnd[k] > 0) continue;
      if (k === 'fire') { lastSnd.fire = 6 + Math.random() * 18; salute(); fwCol = FW[(Math.random() * FW.length) | 0]; fw.color.setHex(fwCol); fwBase = 14; fwT = 0.9; }
      else if (k === 'tv') { lastSnd.tv = 25 + Math.random() * 30; tvMurmur(); }
      else if (k === 'step') { lastSnd.step = 40 + Math.random() * 50; stepsAbove(); }
      else if (k === 'chime') { lastSnd.chime = 150 + Math.random() * 120; chimes(); toast('<span style="font-size:14px;opacity:.75">где-то бьют куранты…</span>'); }
      else if (k === 'glass') { lastSnd.glass = 60 + Math.random() * 60; glasses(); }
      else if (k === 'cough') { lastSnd.cough = 80 + Math.random() * 90; cough(); } } };

  // ===== пасхалки лифта: особые этажи =====
  const EGG = {
    13: ['13-го этажа не бывает.', 'Лифт привёз тебя на «12-А». Это то же самое, только честнее.'],
    14: ['Этаж 14.', 'Иногда лифт врёт про этаж. Не верь табло.'],
    0: ['Нулевой этаж.', 'Пахнет сыростью и чужими кошками.'],
    9: ['Девятый. Выше только крыша.', 'На крышу не пускают — замок, и ключ у деда Васи, который умер в 2009-м.'],
    47: ['Этаж 47.', 'Квартиры тут другие. Твоя — на третьем.'],
    404: ['<b style="color:#ff9a3a">404</b>', 'Этаж не найден. Лифт стоит и смотрит на тебя.'],
    777: ['<b style="color:#ffd35a">777</b>', 'Из-за двери звенят монеты. Тебе не открывают.'],
    1337: ['Этаж 1337.', 'На двери наклейка: «здесь живёт хакер». Дверь заварена изнутри.'],
    1991: ['1991.', 'Из-за двери: «…в стране сегодня…». Ты уходишь, пока не стало поздно.'],
    2007: ['2007.', 'Где-то играет «Кино». На двери нацарапано: «ВИТЯ».'],
    666: ['<b style="color:#ff3030">666</b>', 'Свет стал красным. Одна из дверей чуть приоткрыта. Из щели кто-то машет.'],
    1111: ['Этаж 1111.', 'Одинаковые двери. Одинаковые коврики. Одинаковый запах борща. Ты идёшь по кругу.'],
  };
  let prevSt = LIFT.st, redT = 0;
  const _w = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { _w(dt);
    if (prevSt === 'ride' && LIFT.st === 'idle') { const d = LIFT.dest; if (d < 0) { toast(`<b>Этаж ${d}.</b><br><span style="font-size:14px">Ты спустился ниже подвала. Здесь тоже кто-то живёт.</span>`); }
      else if (EGG[d]) { toast(`${EGG[d][0]}<br><span style="font-size:14px">${EGG[d][1]}</span>`); if (d === 666) { redT = 25; if (AC) { burst(4, 'lowpass', 55, 0.7, 0.7); setTimeout(() => burst(1.2, 'lowpass', 80, 0.6, 0.5), 2500); } } if (d === 404 && AC) burst(0.6, 'bandpass', 2000, 0.4, 0.3); if (d === 777 && AC) [988, 1319, 1568, 1976].forEach((f, i) => setTimeout(() => blip([f], 0.25, 'triangle', 0.05), i * 110)); if (d === 2007 && AC) setTimeout(tvMurmur, 800); } }
    prevSt = LIFT.st;
    if (redT > 0) { redT -= dt; for (const l of LPOOL) l.color.setRGB(1, 0.05, 0.03); if (redT <= 0) for (const l of LPOOL) l.color.setRGB(1, 0.85, 0.6); } };

  // ===== глазок: если долго стоять у двери, за ней кто-то подойдёт =====
  let dwell = 0, dwellDoor = null, cool = 40;
  const _w2 = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { _w2(dt); cool -= dt; let best = null, bd = 1.3; for (const d of doorsLive) { if (Math.abs(d.y - P.y) > 1.5) continue; const x = Math.hypot(d.x - P.x, d.z - P.z); if (x < bd) { bd = x; best = d; } }
    if (best && best === dwellDoor) dwell += dt; else { dwell = 0; dwellDoor = best; }
    if (dwell > 4.5 && cool < 0) { dwell = 0; cool = 60 + Math.random() * 60; const k = Math.random();
      if (AC) { if (k < 0.5) { for (let i = 0; i < 4; i++) setTimeout(() => burst(0.05, 'lowpass', 400, 1, 0.06 + i * 0.02, 0.2), i * 380); } else { burst(0.18, 'bandpass', 2300, 3, 0.07); setTimeout(() => burst(0.14, 'bandpass', 2100, 3, 0.06), 140); } }
      toast(k < 0.5 ? '<span style="font-size:14px;opacity:.85">За дверью подошли. Остановились.<br>Глазок потемнел.</span>' : '<span style="font-size:14px;opacity:.85">Звякнула цепочка.</span>'); } };

  // ===== гул лампочек: рядом с горящей слышно жужжание, у мигающих срывается =====
  let buzz = null;
  const _w3 = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { _w3(dt); if (!AC) return;
    if (!buzz) { const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(), sp = AC.createStereoPanner(); o.type = 'sawtooth'; o.frequency.value = 100; o2.type = 'square'; o2.frequency.value = 200; f.type = 'bandpass'; f.frequency.value = 280; f.Q.value = 1.2; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g).connect(sp).connect(master); o.start(); o2.start(); buzz = { g, sp, o }; }
    let best = null, bd = 4; for (const a of bulbAnchors) { if (Math.abs((a.fy || 0) - P.y) > 2.2) continue; const d = Math.hypot(a.x - P.x, a.z - P.z); if (d < bd) { bd = d; best = a; } }
    let v = best ? 0.012 * (1 - bd / 4) : 0; if (best && best.flick && Math.sin(clock * 23 + best.x) > 0.4) v *= 0.15 + 2.4 * Math.max(0, Math.sin(clock * 61)); buzz.g.gain.value += (v - buzz.g.gain.value) * Math.min(1, dt * 12); buzz.sp.pan.value = best ? Math.max(-1, Math.min(1, (best.x - P.x) / 3)) : 0; };
}
