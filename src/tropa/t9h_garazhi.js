// ===================== ГАРАЖИ: бесконечный гаражный кооператив в тумане =====================
if (GAR) {
  // ряды: двойной ряд (спиной к спине) каждые 22 м по z, между ними проезд 10 м; сквозные проходы каждые 68 м по x
  const PER = 22, GW = 3.4, GD = 6, GH = 2.5;
  KEY_POS.garazhi = [-209.1, 0, 53.5];
  P.x = 1.7; P.z = 16.5; P.yaw = 0; P.pitch = 0.02;
  const gap = (x) => ((x % 68) + 68) % 68 < 6;
  const DOORC = [[0.32, 0.42, 0.5], [0.42, 0.3, 0.2], [0.28, 0.4, 0.3], [0.5, 0.5, 0.48], [0.45, 0.22, 0.16], [0.6, 0.5, 0.3]].map(lin);
  const bulbOn = std({ color: 0xfff0d0, emissive: 0xffd890, emissiveIntensity: 6 });
  const jar = std({ color: 0x9ab06a, roughness: 0.1, transparent: true, opacity: 0.8 });
  const numMat = new Map(); const numM = (n) => numMat.get(n) || numMat.set(n, signMat(`№ ${n}`, '#e8e4d8', '#2a2a2a', 256, 112, 'bold 64px sans-serif')).get(n);
  const RADIOS = [];
  // один гараж: ry = 0 — ворота смотрят на +z
  function garage(K, x, z, ry, n, openP) {
    const { b, r, group } = K, kp = KEY_POS.garazhi, hasKey = Math.abs(x - kp[0]) < 1 && Math.abs(z - kp[2]) < 3.5, mine = n === 47 && Math.abs(x - 1.7) < 1, open = hasKey || mine || r() < openP;
    const wc = r() < 0.5 ? shade(0.75 + r() * 0.2) : lin([0.6 + r() * 0.1, 0.42, 0.34]), dc = DOORC[(r() * DOORC.length) | 0], wm = r() < 0.6 ? M.brick : M.conc;
    b.push(x, 0, z, ry);
    b.box(M.conc, 0, GH + 0.08, -0.1, GW + 0.12, 0.16, GD + 0.5, shade(0.5)); b.box(M.conc, 0, GH + 0.25, -GD / 2 + 0.3, GW + 0.1, 0.2, 0.5, shade(0.45));   // плита крыши, бортик
    if (!open) { b.box(wm, 0, GH / 2, 0, GW, GH, GD, wc); b.box(M.metal, -0.75, 1.1, GD / 2 + 0.02, 1.45, 2.15, 0.04, dc); b.box(M.metal, 0.75, 1.1, GD / 2 + 0.02, 1.45, 2.15, 0.04, dc); b.box(M.metal, 0.05, 1.1, GD / 2 + 0.05, 0.06, 0.25, 0.04, shade(0.3)); b.collide(0, 0, GW / 2, GD / 2); }
    else { for (const s of [-1, 1]) b.box(wm, s * (GW / 2 - 0.06), GH / 2, 0, 0.12, GH, GD, wc); b.box(wm, 0, GH / 2, -GD / 2 + 0.06, GW, GH, 0.12, wc); b.box(M.conc, 0, GH - 0.05, 0, GW - 0.2, 0.1, GD - 0.1, shade(0.3)); b.box(M.conc, 0, 0.02, 0, GW - 0.2, 0.04, GD, shade(0.35));
      for (const s of [-1, 1]) b.box(M.metal, s * (GW / 2 + 0.7), 1.1, GD / 2 + 0.7, 0.04, 2.15, 1.45, dc);
      for (const s of [-1, 1]) b.collide(s * (GW / 2 - 0.06), 0, 0.1, GD / 2); b.collide(0, -GD / 2 + 0.06, GW / 2, 0.1);
      b.lines.push(b.world(0, GH - 0.1, -0.5), b.world(0, GH - 0.45, -0.5)); b.box(bulbOn, 0, GH - 0.5, -0.5, 0.07, 0.1, 0.07);
      const t = mine ? 'volga' : hasKey ? 'key' : r() < 0.3 ? 'car' : r() < 0.2 ? 'pit' : 'junk';
      if (t === 'car' || t === 'volga') { const c = t === 'volga' ? lin([0.86, 0.86, 0.82]) : lin(hexc(CAR_PAINT[(r() * CAR_PAINT.length) | 0])); b.box(M.paint, 0, 0.62, -0.4, 1.66, 0.6, 4.2, c); b.box(M.paint, 0, 1.18, -0.55, 1.5, 0.55, 2.1, c); b.box(M.glass, 0, 1.2, -0.55, 1.52, 0.42, 2.0); for (const sx of [-0.78, 0.78]) for (const sz of [-1.75, 0.95]) b.cyl(M.rubber, sx, 0.31, sz, 0.31, 0.31, 0.22, 10, null, 0, Math.PI / 2); }
      else { for (let k = 0; k < 3; k++) b.box(M.plank, -GW / 2 + 0.35, 0.5 + k * 0.55, -1, 0.5, 0.04, 3, shade(0.6)); for (let k = 0; k < 9; k++) b.cyl(jar, -GW / 2 + 0.35, 0.65 + ((k / 3) | 0) * 0.55, -2.2 + (k % 3) * 0.9 + r() * 0.3, 0.07, 0.07, 0.2, 8);
        for (let k = 0; k < 3; k++) b.geo(M.rubber, new THREE.TorusGeometry(0.3, 0.11, 6, 14), GW / 2 - 0.45, 0.12 + k * 0.22, -1.8, Math.PI / 2, 0, 0, 1);
        b.box(M.plank, 0.6, 0.85, -GD / 2 + 0.5, 1.6, 0.06, 0.6, shade(0.5)); b.box(M.metal, 0.3, 0.98, -GD / 2 + 0.5, 0.3, 0.2, 0.2, shade(0.4)); }
      if (t === 'pit') { b.box(M.conc, 0, 0.03, 0.3, 0.9, 0.06, 3.0, shade(0.06)); const p = b.world(0, 0, 0.3); INTER.push({ x: p.x, z: p.z, r: 1.3, group, label: 'E — спуститься в смотровую яму', act: () => goWorld(randomWorld(), 'Внизу темно. Лестница уходит дальше, чем должна.') }); }
      if (t === 'volga') { const p = b.world(0, 0, 1.5); INTER.push({ x: p.x, z: p.z, r: 1.6, group, label: 'E — сесть в папину «Волгу»', act: () => goWorld('dvory', 'Ключ был в замке зажигания. «Волга» завелась с третьего раза.') }); }
      if (r() < 0.25 && !mine) RADIOS.push({ x: b.world(0, 0, 0).x, z: b.world(0, 0, 0).z, group });
    }
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.18), numM(n)); nm.position.copy(b.world(open ? -1.1 : 0, 2.3, GD / 2 + 0.06)); nm.rotation.y = ry; group.add(nm);
    b.pop();
  }
  OUT_BUILD = (cx, cz) => {
    const K = kit(cx, cz, 0x6a2a), { b, r } = K;
    for (let k = Math.floor(K.z0 / PER) - 1; k <= Math.ceil(K.z1 / PER); k++) {
      const z0 = k * PER;
      for (let u = Math.floor(K.x0 / GW); u * GW < K.x1; u++) { const x = u * GW + GW / 2; if (gap(x)) continue;
        const n1 = (((u * 7 + k * 131) % 400) + 400) % 400 + 1, n2 = (((u * 7 + k * 131 + 3) % 400) + 400) % 400 + 1;
        if (K.inb(x, z0 + 3)) garage(K, x, z0 + 3, Math.PI, u === 0 && k === 1 ? 46 : n1, 0.12);
        if (K.inb(x, z0 + 9)) garage(K, x, z0 + 9, 0, u === 0 && k === 0 ? 47 : n2, 0.12); }
      // мусор, лужи-ямы, столбы с проводами в проезде
      const az = z0 + 17;
      if (az >= K.z0 && az < K.z1) for (let x = Math.ceil(K.x0 / 34) * 34; x < K.x1; x += 34) { b.cyl(M.plank, x, 3.5, z0 + 12.6, 0.12, 0.1, 7, 7, shade(0.45)); b.box(M.plank, x, 6.7, z0 + 12.6, 1.4, 0.08, 0.08, shade(0.45)); b.lines.push(new V3(x - 0.6, 6.75, z0 + 12.6), new V3(x + 33.4, 6.4, z0 + 12.6), new V3(x + 0.6, 6.75, z0 + 12.6), new V3(x + 34.6, 6.4, z0 + 12.6)); b.collide(x, z0 + 12.6, 0.15, 0.15); }
    }
    for (let i = 0; i < 6; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS, lz = ((z % PER) + PER) % PER; if (lz < 13 || lz > 21 || !K.free(x, z, 0.4)) continue;
      const t = r(); if (t < 0.5) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 6), std({ color: 0x9a9a92, metalness: 0.9, roughness: 0.35 })); m.position.y = 0.012; addItem(K.group, m, x, 0, z, `nut${cx},${cz},${i}`, 'Гайка'); }
      else if (t < 0.75) { K.take(x, z, 0.5); b.geo(M.rubber, new THREE.TorusGeometry(0.3, 0.11, 6, 14), x, 0.11, z, Math.PI / 2, 0, r(), 1); }
      else { K.take(x, z, 0.6); b.box(M.paint, x, 0.3, z, 0.6, 0.6, 0.6, lin([0.3, 0.3, 0.32]), 0, r(), 0); } }
    for (let i = 0; i < 3; i++) { const x = K.x0 + r() * CS, z = K.z0 + r() * CS, lz = ((z % PER) + PER) % PER; if ((lz > 13 && lz < 21 && r() < 0.7) || gap(x)) K.plant(K.pick(['elm0', 'elm1', 'shrubY0', 'sticks0', 'poplar0']), x, z, 0.8 + r() * 0.4); }
    return K.finish(); };
  // радио из открытых гаражей
  WORLD_UPDATE = () => { let best = 99; for (let k = RADIOS.length - 1; k >= 0; k--) { const q = RADIOS[k]; if (!q.group.parent) { RADIOS.splice(k, 1); continue; } const d = Math.hypot(q.x - P.x, q.z - P.z); if (d < best) best = d; } partyTick(started ? clamp(1 - best / 26, 0, 1) * 0.22 : 0, 1100); };
  setTimeout(() => toast('Папин гараж № 47 — прямо перед тобой.'), 2600);
}
