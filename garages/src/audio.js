// Все звуки синтезируются кодом (порт ProceduralAudio.cs) + небольшой движок на WebAudio.
import { DotNetRandom, perlin } from './rng.js';
const SR = 44100;
const rng = new DotNetRandom(7);
const noise = () => rng.nextDouble() * 2 - 1;
const TAU = Math.PI * 2;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * clamp01(t);

function normalize(d, peak) {
  let m = 0.0001; for (const x of d) m = Math.max(m, Math.abs(x));
  const k = peak / m; for (let i = 0; i < d.length; i++) d[i] *= k;
}
function looped(d, fade) {
  const n = Math.min(Math.floor(fade * SR), d.length >> 1);
  const o = new Float32Array(d.length - n);
  for (let i = 0; i < o.length; i++) o[i] = d[i];
  for (let i = 0; i < n; i++) { const t = i / n; o[i] = d[i] * t + d[d.length - n + i] * (1 - t); }
  return o;
}
const gens = {
  rain() {
    const len = SR * 8, d = new Float32Array(len); let lp = 0, lp2 = 0;
    for (let i = 0; i < len; i++) { lp += (noise() - lp) * 0.35; lp2 += (lp - lp2) * 0.08; d[i] = (lp - lp2 * 0.6) * 0.5; }
    for (let k = 0; k < 1400; k++) {
      const pos = rng.next(len - 3000), amp = 0.15 + rng.nextDouble() * 0.6, freq = 900 + rng.nextDouble() * 3500, dur = 400 + rng.next(1600);
      for (let i = 0; i < dur; i++) d[pos + i] += amp * Math.exp(-i / (dur * 0.18)) * Math.sin(TAU * freq * i / SR * (1 + i * 0.0002)) * 0.25;
    }
    const o = looped(d, 0.5); normalize(o, 0.6); return o;
  },
  wind() {
    const len = SR * 12, d = new Float32Array(len); let b = 0, lp = 0;
    for (let i = 0; i < len; i++) {
      b += noise() * 0.02; b *= 0.995;
      const t = i / SR, gust = 0.55 + 0.45 * Math.sin(t * 0.7) * Math.sin(t * 0.23 + 1.3);
      lp += (noise() - lp) * (0.01 + 0.02 * gust);
      d[i] = (b * 2.5 + lp * 0.6) * gust;
    }
    const o = looped(d, 1.5); normalize(o, 0.5); return o;
  },
  footstep(v) {
    const r = new DotNetRandom(100 + v), len = Math.floor(SR * 0.32), d = new Float32Array(len);
    let lp = 0, hp = 0; const cutoff = 0.12 + r.nextDouble() * 0.08;
    for (let i = 0; i < len; i++) {
      const t = i / SR, n = r.nextDouble() * 2 - 1; lp += (n - lp) * cutoff;
      const thud = Math.sin(TAU * 85 * t) * Math.exp(-t * 45), heel = lp * Math.exp(-t * 38);
      const sp = t > 0.03 ? Math.exp(-(t - 0.03) * 22) : 0; hp = n - hp * 0.2;
      d[i] = thud * 0.6 + heel * 0.9 + hp * sp * 0.18;
    }
    normalize(d, 0.8); return d;
  },
  monsterStep(v) {
    const r = new DotNetRandom(200 + v), len = Math.floor(SR * 0.5), d = new Float32Array(len); let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR, n = r.nextDouble() * 2 - 1; lp += (n - lp) * 0.05;
      const thump = Math.sin(TAU * (55 - t * 30) * t) * Math.exp(-t * 14), scrape = lp * Math.exp(-t * 9);
      const splash = t > 0.02 ? (r.nextDouble() * 2 - 1) * Math.exp(-(t - 0.02) * 18) * 0.15 : 0;
      d[i] = thump + scrape * 1.2 + splash;
    }
    normalize(d, 0.95); return d;
  },
  growl() {
    const len = SR * 6, d = new Float32Array(len); let phase = 0, lp = 0, lp2 = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR, breath = Math.sin(t * Math.PI * 2 / 2), env = Math.pow(Math.abs(breath), 0.7);
      const f0 = 62 + 10 * Math.sin(t * 3.1) + (breath > 0 ? 8 : -6);
      phase += f0 / SR; const saw = (phase % 1) * 2 - 1;
      const tremor = 0.6 + 0.4 * Math.sin(t * TAU * 17 + Math.sin(t * 5) * 3);
      lp += (saw * tremor + noise() * 0.6 - lp) * 0.06; lp2 += (lp - lp2) * 0.15;
      d[i] = Math.max(-1, Math.min(1, lp2 * 3)) * env;
    }
    const o = looped(d, 0.4); normalize(o, 0.9); return o;
  },
  scream() {
    const len = Math.floor(SR * 2.2), d = new Float32Array(len), ph = [0, 0, 0, 0, 0], det = [1, 1.013, 0.987, 1.5, 2.02]; let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      let g = t < 0.25 ? lerp(180, 520, t / 0.25) : lerp(520, 260, (t - 0.25) / 1.95);
      g *= 1 + 0.04 * Math.sin(t * TAU * 9);
      let s = 0;
      for (let k = 0; k < 5; k++) { ph[k] += g * det[k] / SR; s += ((ph[k] % 1) * 2 - 1) * (k < 3 ? 1 : 0.4); }
      lp += (s * 0.3 + noise() * 0.5 - lp) * 0.3;
      const env = Math.min(1, t / 0.04) * Math.exp(-Math.max(0, t - 0.6) * 2.2);
      d[i] = Math.tanh(lp * 4) * env;
    }
    normalize(d, 1); return d;
  },
  heartbeat() {
    const len = Math.floor(SR * 0.9), d = new Float32Array(len);
    const beat = t => t < 0 ? 0 : Math.sin(TAU * (48 - t * 40) * t) * Math.exp(-t * 22);
    for (let i = 0; i < len; i++) { const t = i / SR; d[i] = beat(t) + beat(t - 0.28) * 0.7; }
    normalize(d, 1); return d;
  },
  breath() {
    const len = Math.floor(SR * 1.6), d = new Float32Array(len); let lp = 0, bp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR, ph = t / 1.6;
      const env = ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI) : (ph > 0.5 ? Math.sin((ph - 0.5) / 0.5 * Math.PI) * 0.8 : 0);
      lp += (noise() - lp) * (ph < 0.45 ? 0.25 : 0.15); bp += (lp - bp) * 0.05;
      d[i] = (lp - bp) * env;
    }
    normalize(d, 0.7); return d;
  },
  creak(v) {
    const r = new DotNetRandom(300 + v), len = Math.floor(SR * (1.2 + r.nextDouble())), d = new Float32Array(len);
    let ph = 0; const f0 = 220 + r.nextDouble() * 400;
    for (let i = 0; i < len; i++) {
      const t = i / SR, stick = perlin(t * 30, v) > 0.45 ? 1 : 0.2;
      const f = f0 * (1 + 0.3 * Math.sin(t * 1.7 + v)); ph += f / SR;
      const s = Math.sign(Math.sin(ph * TAU)) * 0.5 + Math.sin(ph * 2 * TAU) * 0.3;
      const env = Math.sin(clamp01(t / (len / SR)) * Math.PI);
      d[i] = s * stick * env * 0.5;
    }
    normalize(d, 0.6); return d;
  },
  clank(v) {
    const r = new DotNetRandom(400 + v), len = Math.floor(SR * 2.5), d = new Float32Array(len), fr = [180, 437, 712, 1130, 1610];
    for (let i = 0; i < len; i++) {
      const t = i / SR; let s = 0;
      for (let k = 0; k < 5; k++) s += Math.sin(TAU * fr[k] * (1 + v * 0.07) * t) * Math.exp(-t * (2.5 + k * 1.5)) / (k + 1);
      s += (r.nextDouble() * 2 - 1) * Math.exp(-t * 60) * 0.5; d[i] = s;
    }
    normalize(d, 0.7); return d;
  },
};

// ------------------------------------------------------------------ движок
let ctx = null, master = null, listener = null;
const raw = {}; // имя -> Float32Array
export function generateAll() {
  raw.rain = gens.rain(); raw.wind = gens.wind(); raw.heart = gens.heartbeat(); raw.breath = gens.breath();
  raw.growl = gens.growl(); raw.scream = gens.scream();
  raw.steps = [0, 1, 2, 3, 4].map(gens.footstep); raw.mSteps = [0, 1, 2, 3].map(gens.monsterStep);
  raw.creaks = [0, 1, 2].map(gens.creak); raw.clanks = [0, 1].map(gens.clank); raw.sting = gens.clank(3);
}
const bufs = new Map();
function buf(a) {
  if (!bufs.has(a)) { const b = ctx.createBuffer(1, a.length, SR); b.copyToChannel(a, 0); bufs.set(a, b); }
  return bufs.get(a);
}
export const A = {
  raw,
  get ready() { return !!ctx; },
  init() {
    if (ctx) { ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SR });
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination); listener = ctx.listener;
  },
  resume() { if (ctx && ctx.state !== 'running') ctx.resume(); },
  setListener(p, f, u) { // координаты уже в системе Three (z перевёрнут)
    if (!ctx) return;
    if (listener.positionX) {
      listener.positionX.value = p.x; listener.positionY.value = p.y; listener.positionZ.value = p.z;
      listener.forwardX.value = f.x; listener.forwardY.value = f.y; listener.forwardZ.value = f.z;
      listener.upX.value = u.x; listener.upY.value = u.y; listener.upZ.value = u.z;
    } else { listener.setPosition(p.x, p.y, p.z); listener.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z); }
  },
  // источник: 2D или 3D. opts: {spatial, min, max, rolloff:'inverse'|'linear'}
  source(opts = {}) {
    const g = ctx.createGain(); let panner = null;
    if (opts.spatial) {
      panner = ctx.createPanner(); panner.panningModel = 'equalpower';
      panner.distanceModel = opts.rolloff || 'inverse'; panner.refDistance = opts.min || 1; panner.maxDistance = opts.max || 100;
      panner.rolloffFactor = 1; g.connect(panner); panner.connect(master);
    } else g.connect(master);
    const s = {
      gain: g, panner, loopNode: null, volume: 1,
      setPos(x, y, z) { if (!panner) return; if (panner.positionX) { panner.positionX.value = x; panner.positionY.value = y; panner.positionZ.value = -z; } else panner.setPosition(x, y, -z); },
      play(arr, vol = 1, pitch = 1) {
        if (!ctx) return; const n = ctx.createBufferSource(); n.buffer = buf(arr); n.playbackRate.value = pitch;
        const v = ctx.createGain(); v.gain.value = vol; n.connect(v); v.connect(g); n.start();
      },
      loop(arr, vol) {
        if (!ctx) return; const n = ctx.createBufferSource(); n.buffer = buf(arr); n.loop = true; n.connect(g); n.start();
        s.loopNode = n; g.gain.value = vol; s.volume = vol;
      },
      setVolume(v) { s.volume = v; if (ctx) g.gain.setTargetAtTime(v, ctx.currentTime, 0.03); },
      setPitch(p) { if (s.loopNode) s.loopNode.playbackRate.value = p; },
    };
    return s;
  },
};
