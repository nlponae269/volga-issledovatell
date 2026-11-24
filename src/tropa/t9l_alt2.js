// ===================== ALTERNATIVE, цикл 2: багровая луна, сердцебиение, шаги за спиной, мигающая темнота, шёпот в тексте =====================
if (ALT) {
  // огромная багровая «луна» над горизонтом
  const mt = texFrom(mkCanvas(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(20,0,0,1)'); gr.addColorStop(0.45, 'rgba(120,10,6,0.95)'); gr.addColorStop(0.62, 'rgba(255,40,20,0.55)'); gr.addColorStop(1, 'rgba(255,40,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(70 + Math.random() * 120, 70 + Math.random() * 120, 4 + Math.random() * 14, 0, 6.3); g.fill(); } }));
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshBasicMaterial({ map: mt, transparent: true, depthWrite: false, fog: false })); scene.add(moon); REFL.hide.push(moon);
  // трещины в небе: тонкие чёрные линии, подвешены высоко
  const crack = new THREE.Group(); { const r = rng(5); for (let i = 0; i < 5; i++) { const pts = []; let x = (r() - 0.5) * 300, y = 60 + r() * 90, z = -380; for (let k = 0; k < 14; k++) { pts.push(new V3(x, y, z)); x += (r() - 0.5) * 40; y += (r() - 0.5) * 30; } crack.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x000000, fog: false }))); } } scene.add(crack);
  const camDir = new V3(); let beatT = 0, stepT = 25, darkT = 40, dark = 0, whisT = 30, lastD = 99;
  const NAMES = ['они смотрят', 'не оборачивайся', 'ты уже здесь был', 'выход закрыт', 'он за спиной', 'тише', 'не беги', 'считай окна'];
  function heart(v) { if (!AC) return; const t = AC.currentTime; for (const [d, a] of [[0, 1], [0.2, 0.7]]) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 52; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(v * a, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + d + 0.22); o.connect(g).connect(master); o.start(t + d); o.stop(t + d + 0.25); } }
  function stepsBehind() { if (!AC) return; const n = 5 + ((Math.random() * 5) | 0), v = 0.12; for (let k = 0; k < n; k++) setTimeout(() => { burst(0.07, 'lowpass', 300, 1.2, v * (0.6 + k / n * 0.6), -0.1 + Math.random() * 0.2); }, k * 420); }
  const prev = WORLD_UPDATE;
  WORLD_UPDATE = (dt) => { if (prev) prev(dt); if (!started) return; camera.getWorldDirection(camDir);
    moon.position.set(P.x - 120, 95, P.z - 340); moon.lookAt(camera.position); crack.position.set(P.x, 0, P.z + 380 - 380);
    // ближайший безликий: по группам-видимым чёрным капсулам нет доступа, поэтому используем расстояние до ближайшей «аномалии» из общего шума: пульс усиливается ночью и при беге
    beatT -= dt; const tension = 0.35 + 0.35 * Math.sin(clock * 0.2) + Math.min(0.5, P.speed * 0.07); if (beatT < 0) { beatT = 1.1 - Math.min(0.55, tension * 0.5); heart(0.05 + tension * 0.1); }
    stepT -= dt; if (stepT < 0) { stepT = 30 + Math.random() * 40; stepsBehind(); }
    darkT -= dt; if (darkT < 0) { darkT = 35 + Math.random() * 50; dark = 1; if (AC) burst(0.5, 'lowpass', 120, 0.8, 0.45); }
    if (dark > 0) { dark = Math.max(0, dark - dt * 0.9); post.U.expo.value = 0.15 + (1 - dark) * 0.6 * (Math.random() < 0.15 ? 0.3 : 1); } else post.U.expo.value += (0.9 - post.U.expo.value) * Math.min(1, dt * 2);
    whisT -= dt; if (whisT < 0) { whisT = 40 + Math.random() * 40; toast('<i style="color:#ff6050">' + NAMES[(Math.random() * NAMES.length) | 0] + '</i>'); } };
}
