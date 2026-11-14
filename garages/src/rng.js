// Точный порт System.Random(seed) из .NET — чтобы планировка мира совпадала с Unity-версией.
const MBIG = 2147483647, MSEED = 161803398;
export class DotNetRandom {
  constructor(seed) {
    seed |= 0;
    const arr = new Int32Array(56);
    const sub = seed === -2147483648 ? 2147483647 : Math.abs(seed);
    let mj = MSEED - sub;
    arr[55] = mj;
    let mk = 1, ii = 0;
    for (let i = 1; i < 55; i++) {
      ii += 21; if (ii >= 55) ii -= 55;
      arr[ii] = mk;
      mk = mj - mk; if (mk < 0) mk += MBIG;
      mj = arr[ii];
    }
    for (let k = 1; k < 5; k++) {
      for (let i = 1; i < 56; i++) {
        arr[i] -= arr[1 + (i + 30) % 55];
        if (arr[i] < 0) arr[i] += MBIG;
      }
    }
    this.a = arr; this.inext = 0; this.inextp = 21;
  }
  internal() {
    let a = this.inext + 1; if (a >= 56) a = 1;
    let b = this.inextp + 1; if (b >= 56) b = 1;
    let r = this.a[a] - this.a[b];
    if (r === MBIG) r--;
    if (r < 0) r += MBIG;
    this.a[a] = r; this.inext = a; this.inextp = b;
    return r;
  }
  sample() { return this.internal() * (1.0 / MBIG); }
  nextDouble() { return this.sample(); }
  next(a, b) {
    if (a === undefined) return this.internal();
    if (b === undefined) return Math.floor(this.sample() * a);
    return Math.floor(this.sample() * (b - a)) + a;
  }
}

// Аналог UnityEngine.Random (несид.)
export const R = {
  range: (a, b) => a + Math.random() * (b - a),
  insideUnitSphere() {
    for (;;) {
      const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1;
      if (x * x + y * y + z * z <= 1) return { x, y, z };
    }
  },
};

// Перлин 2D в диапазоне 0..1 (как Mathf.PerlinNoise)
const P = new Uint8Array(512);
{ const r = new DotNetRandom(12345); const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = r.next(i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
function grad(h, x, y) { switch (h & 7) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
  case 4: return x; case 5: return -x; case 6: return y; default: return -y; } }
export function perlin(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const aa = P[P[X] + Y], ab = P[P[X] + Y + 1], ba = P[P[X + 1] + Y], bb = P[P[X + 1] + Y + 1];
  const n = lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u), lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
  return Math.min(1, Math.max(0, 0.5 + n * 0.7));
}
