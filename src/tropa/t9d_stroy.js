// ===================== Стройка =====================
const SC = 6; // шаг сетки перекрытий
function stroyHole(i, j) { if (Math.abs(i) <= 1 && Math.abs(j) <= 1) return false; const kp = KEY_POS.stroyka; if (kp && Math.floor(kp[0] / SC) === i && Math.floor(kp[2] / SC) === j) return false; return ihash(i, j, 404) < 0.16; }
function stroyPlank(i, j) { return stroyHole(i, j) && ihash(i, j, 405) < 0.35; }
function stroySurface(x, z) { const i = Math.floor(x / SC), j = Math.floor(z / SC); if (!stroyHole(i, j)) return 0; if (stroyPlank(i, j)) { const lz = z - j * SC; if (Math.abs(lz - SC / 2) < 0.45) return 0.05; } return -200; }
const rebarMat = envMat({ color: 0x6a4a3a, roughness: 0.6, metalness: 0.6 }, 0.3);
const helmetMat = std({ color: 0xf0c020, roughness: 0.35 });
const helmetGeo = new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.02, 0);
function crane(b, x, z) { const H = 58; for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(M.metal, x + a * 0.9, -42 + H / 2, z + c * 0.9, 0.15, H, 0.15, lin([0.85, 0.65, 0.1]));
  for (let y = -42; y < -42 + H; y += 3) { b.pipe(M.metal, new V3(x - 0.9, y, z - 0.9), new V3(x + 0.9, y + 3, z - 0.9), 0.04, lin([0.85, 0.65, 0.1])); b.pipe(M.metal, new V3(x - 0.9, y, z + 0.9), new V3(x + 0.9, y + 3, z + 0.9), 0.04, lin([0.85, 0.65, 0.1])); }
  b.box(M.metal, x + 14, -42 + H + 0.5, z, 44, 1.0, 1.0, lin([0.85, 0.65, 0.1])); b.box(M.conc, x - 6, -42 + H, z, 3, 2, 2, shade(0.7)); b.box(M.metal, x + 1.5, -42 + H - 1.5, z, 2, 2, 1.8, lin([0.8, 0.8, 0.75])); b.lines.push(new V3(x + 28, -42 + H, z), new V3(x + 28, -42 + H - 25, z)); }
if (STROY) {
  KEY_POS.stroyka = [54, 0, 42]; P.x = 3; P.z = 3; P.yaw = -0.6;
  OUT_BUILD = (cx, cz) => { const K = kit(cx, cz, 0x57a0), { b, r, group } = K;
    for (let i = Math.floor(K.x0 / SC); i < Math.floor(K.x1 / SC); i++) for (let j = Math.floor(K.z0 / SC); j < Math.floor(K.z1 / SC); j++) {
      const X = i * SC, Z = j * SC, hole = stroyHole(i, j);
      for (const fy of [0, -3.2, -6.4, 3.2]) { if (fy === 0 && hole) continue; if (fy !== 0 && ihash(i, j, 500 + fy * 10) < 0.2) continue; b.box(M.conc, X + SC / 2, fy - 0.11, Z + SC / 2, SC - 0.04, 0.22, SC - 0.04, shade(0.75 + ihash(i, j, 7) * 0.2)); }
      b.box(M.conc, X, -18, Z, 0.4, 42, 0.4, shade(0.8)); b.cols.push({ x: X, z: Z, hx: 0.25, hz: 0.25, c: 1, s: 0 });
      for (let k = 0; k < 4; k++) b.box(rebarMat, X + (k % 2 - 0.5) * 0.25, 3.6 + 0.6, Z + ((k >> 1) - 0.5) * 0.25, 0.025, 1.2 + r() * 0.6, 0.025, null, (r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3);
      if (hole) { for (let k = 0; k < 5; k++) b.box(rebarMat, X + 0.3 + r() * (SC - 0.6), -0.05, Z + (r() < 0.5 ? 0.1 : SC - 0.1), 0.02, 0.02, 0.8 + r() * 1.2, null, 0, r() * 0.6 - 0.3, 0.2);
        if (stroyPlank(i, j)) { for (let k = 0; k < 3; k++) b.box(M.plank, X + SC / 2, 0.02, Z + SC / 2 - 0.3 + k * 0.3, SC + 0.6, 0.05, 0.28, shade(0.7 + r() * 0.2), 0, 0, (r() - 0.5) * 0.02); } }
      else { const t = r(); const px = X + 1 + r() * (SC - 2), pz = Z + 1 + r() * (SC - 2);
        if (t < 0.12) { for (let k = 0; k < 3; k++) for (let q = 0; q < 2; q++) b.box(M.brick, px + q * 0.52, 0.12 + k * 0.13, pz, 0.5, 0.12, 0.8, shade(0.95, [1.05, 0.9, 0.75])); b.cols.push({ x: px + 0.26, z: pz, hx: 0.55, hz: 0.45, c: 1, s: 0 }); }
        else if (t < 0.2) { for (let k = 0; k < 4; k++) b.box(M.paint, px + (k % 2) * 0.45, 0.1 + (k >> 1) * 0.18, pz, 0.42, 0.17, 0.6, lin([0.75, 0.72, 0.65])); }
        else if (t < 0.25) { b.box(M.metal, px, 0.45, pz, 0.6, 0.3, 0.9, lin([0.3, 0.5, 0.3])); b.cyl(M.rubber, px, 0.2, pz + 0.6, 0.2, 0.2, 0.08, 10, null, 0, Math.PI / 2); }
        else if (t < 0.32) { const m = new THREE.Mesh(helmetGeo, helmetMat); m.castShadow = true; addItem(group, m, px, 0, pz, `hm${i},${j}`, 'Каска'); }
        if (r() < 0.06) { b.box(M.conc, X + SC / 2, 1.5, Z + 0.1, SC * 0.8, 3, 0.2, shade(0.8)); b.cols.push({ x: X + SC / 2, z: Z + 0.1, hx: SC * 0.4, hz: 0.12, c: 1, s: 0 }); } } }
    if (r() < 0.12) crane(b, K.x0 + 24, K.z0 + 24);
    return K.finish(); };
  WORLD_UPDATE = () => { if (started && P.y < -4 && !goWorld.busy) goWorld('podezd', 'Ты сорвался вниз…<br><span style="font-size:15px;color:#999">…и проснулся на лестнице в подъезде.</span>'); };
}
