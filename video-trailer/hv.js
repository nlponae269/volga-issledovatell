/*!
 * hv.js — tiny runtime for HTML videos (html-video plugin). No dependencies.
 *
 * A composition is a fixed-size <div id="stage"> whose look is a pure function
 * of time:  HV.video({ width, height, fps, duration, render(t) { ... } })
 *
 *  - In the renderer (python render.py) the page is driven frame-by-frame via window.seek(t).
 *  - Opened directly in a browser it plays live, scaled to fit, with a scrubber
 *    (space = play/pause, ←/→ = ±1 frame, Shift+←/→ = ±1 s, Home = start).
 */
(function (global) {
  'use strict';
  const HV = {};
  const RENDER = !!global.__HV_RENDER || /[?&]render(=1)?(&|$)/.test(location.search);
  HV.isRender = RENDER;

  // ---------------------------------------------------------------- math
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  HV.clamp = clamp;
  HV.lerp = lerp;

  const c1 = 1.70158, c3 = c1 + 1, c4 = (2 * Math.PI) / 3;
  HV.ease = {
    linear: k => k,
    inQuad: k => k * k,
    outQuad: k => 1 - (1 - k) * (1 - k),
    inOutQuad: k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    inCubic: k => k * k * k,
    outCubic: k => 1 - Math.pow(1 - k, 3),
    inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outQuart: k => 1 - Math.pow(1 - k, 4),
    inOutQuart: k => (k < 0.5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2),
    outExpo: k => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    inOutExpo: k => k === 0 ? 0 : k === 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
    inOutSine: k => -(Math.cos(Math.PI * k) - 1) / 2,
    outSine: k => Math.sin((k * Math.PI) / 2),
    outBack: k => 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2),
    inOutBack: k => {
      const c2 = c1 * 1.525;
      return k < 0.5 ? (Math.pow(2 * k, 2) * ((c2 + 1) * 2 * k - c2)) / 2
        : (Math.pow(2 * k - 2, 2) * ((c2 + 1) * (k * 2 - 2) + c2) + 2) / 2;
    },
    outElastic: k => k === 0 ? 0 : k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c4) + 1,
    outBounce: k => {
      const n1 = 7.5625, d1 = 2.75;
      if (k < 1 / d1) return n1 * k * k;
      if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75;
      if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375;
      return n1 * (k -= 2.625 / d1) * k + 0.984375;
    },
  };
  const E = HV.ease;
  const getEase = e => (typeof e === 'function' ? e : E[e || 'inOutCubic'] || E.linear);

  /** Progress 0..1 of t inside [start, end], eased. */
  HV.p = (t, start, end, ease) => getEase(ease)(clamp((t - start) / Math.max(1e-9, end - start)));
  /** Interpolate number or array from→to while t goes start→end. */
  HV.tween = (t, start, end, from, to, ease) => {
    const k = HV.p(t, start, end, ease);
    return Array.isArray(from) ? from.map((f, i) => lerp(f, to[i], k)) : lerp(from, to, k);
  };
  /** Multi-keyframe interpolation: keys = [[t0, v0], [t1, v1, ease?], ...] */
  HV.keys = (t, keys, ease) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [ta, va] = keys[i - 1], [tb, vb, e] = keys[i];
      if (t <= tb) return HV.tween(t, ta, tb, va, vb, e || ease);
    }
    return keys[keys.length - 1][1];
  };
  /** In → hold → out envelope (0..1): fade in over [a,b], out over [c,d]. */
  HV.env = (t, a, b, c, d, ease = 'inOutCubic') =>
    t < c ? HV.p(t, a, b, ease) : 1 - HV.p(t, c, d, ease);
  HV.inRange = (t, a, b) => t >= a && t < b;
  /** Deterministic PRNG (mulberry32). Never use Math.random() in a composition. */
  HV.rng = (seed = 1) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  /** Smooth deterministic noise in [-1,1] (1D value noise). */
  HV.noise = (x, seed = 0) => {
    const h = n => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(h(i), h(i + 1), u) * 2 - 1;
  };

  // ---------------------------------------------------------------- DOM helpers
  HV.$ = (s, r = document) => r.querySelector(s);
  HV.$$ = (s, r = document) => [...r.querySelectorAll(s)];

  /** Set transform/opacity/filter in one call. Units: px, deg. */
  HV.set = (el, o) => {
    if (!el) return;
    if (typeof el === 'string') el = HV.$(el);
    const tr = [];
    if (o.x != null || o.y != null) tr.push(`translate(${o.x || 0}px, ${o.y || 0}px)`);
    if (o.z != null) tr.push(`translateZ(${o.z}px)`);
    if (o.rotate != null) tr.push(`rotate(${o.rotate}deg)`);
    if (o.rotateX != null) tr.push(`rotateX(${o.rotateX}deg)`);
    if (o.rotateY != null) tr.push(`rotateY(${o.rotateY}deg)`);
    if (o.scale != null) tr.push(`scale(${o.scale})`);
    if (o.scaleX != null || o.scaleY != null) tr.push(`scale(${o.scaleX ?? 1}, ${o.scaleY ?? 1})`);
    if (tr.length) el.style.transform = tr.join(' ');
    if (o.opacity != null) el.style.opacity = o.opacity;
    if (o.blur != null) el.style.filter = o.blur > 0.01 ? `blur(${o.blur}px)` : 'none';
    if (o.clip != null) el.style.clipPath = o.clip;
    if (o.visible != null) el.style.visibility = o.visible ? 'visible' : 'hidden';
    if (o.text != null && el.textContent !== String(o.text)) el.textContent = o.text;
    if (o.style) Object.assign(el.style, o.style);
  };

  /** Classic entrance: rise + fade + un-blur over [start, start+dur]. */
  /** Optional exit: pass outAt (seconds) to fade/sink out over outDur. */
  HV.reveal = (el, t, start, dur = 0.6, { dy = 40, blur = 8, ease = 'outCubic', outAt, outDur = 0.4 } = {}) => {
    let k = HV.p(t, start, start + dur, ease);
    if (outAt != null) k *= 1 - HV.p(t, outAt, outAt + outDur, 'inCubic');
    HV.set(el, { y: (1 - k) * dy, opacity: k, blur: (1 - k) * blur });
    return k;
  };

  /** Split element text into spans (by 'word' or 'char'). Returns the spans. Idempotent. */
  HV.split = (el, by = 'word') => {
    if (typeof el === 'string') el = HV.$(el);
    if (el.__hvSplit) return el.__hvSplit;
    const text = el.textContent;
    el.textContent = '';
    const parts = by === 'char' ? [...text] : text.split(/(\s+)/);
    const spans = [];
    for (const p of parts) {
      if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); continue; }
      const s = document.createElement('span');
      s.textContent = p;
      s.style.display = 'inline-block';
      s.style.whiteSpace = 'pre';
      el.appendChild(s);
      spans.push(s);
    }
    el.__hvSplit = spans;
    return spans;
  };

  /** Staggered entrance for an array of elements. */
  HV.stagger = (els, t, start, { each = 0.05, dur = 0.5, dy = 30, blur = 6, ease = 'outCubic' } = {}) =>
    els.forEach((el, i) => HV.reveal(el, t, start + i * each, dur, { dy, blur, ease }));

  /** Typewriter: returns the visible substring for progress. */
  HV.type = (text, t, start, cps = 30) => text.slice(0, Math.max(0, Math.floor((t - start) * cps)));

  /** Animated number formatting, e.g. HV.count(t, 1, 3, 0, 12500, v => v.toLocaleString('ru-RU')) */
  HV.count = (t, start, end, from, to, fmt = v => Math.round(v).toString(), ease = 'outCubic') =>
    fmt(HV.tween(t, start, end, from, to, ease));

  /** Draw an SVG path/line/circle progressively (0..1). */
  HV.draw = (pathEl, k) => {
    if (typeof pathEl === 'string') pathEl = HV.$(pathEl);
    const L = pathEl.__hvLen || (pathEl.__hvLen = pathEl.getTotalLength());
    pathEl.style.strokeDasharray = L;
    pathEl.style.strokeDashoffset = L * (1 - clamp(k));
  };

  // ---------------------------------------------------------------- async readiness
  const pending = [];
  /** Register something to wait for before frame 0 (fonts, textures, models). */
  HV.wait = p => { pending.push(Promise.resolve(p)); return p; };
  HV.loadImage = src => HV.wait(new Promise((res, rej) => {
    const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src;
  }));

  // ---------------------------------------------------------------- scenes
  /**
   * HV.scenes([ ['intro', 3], ['problem', 5], ['solution', 6] ])
   * → { list, total, at(name) => {start,end,dur}, local(t,name) => seconds inside scene,
   *     prog(t,name) => 0..1, active(t) => name, on(t,name) => bool }
   */
  HV.scenes = defs => {
    let acc = 0;
    const list = defs.map(([name, dur]) => { const s = { name, start: acc, end: acc + dur, dur }; acc += dur; return s; });
    const by = Object.fromEntries(list.map(s => [s.name, s]));
    return {
      list, total: acc,
      at: n => by[n],
      local: (t, n) => t - by[n].start,
      prog: (t, n, e) => HV.p(t, by[n].start, by[n].end, e || 'linear'),
      on: (t, n, pad = 0) => t >= by[n].start - pad && t < by[n].end + pad,
      active: t => (list.find(s => t >= s.start && t < s.end) || list[list.length - 1]).name,
    };
  };

  // ---------------------------------------------------------------- the video
  HV.video = cfg => {
    const V = Object.assign({ width: 1920, height: 1080, fps: 30, duration: 5, background: '#000' }, cfg);
    global.VIDEO = { width: V.width, height: V.height, fps: V.fps, duration: V.duration,
                     audio: V.audio || null, background: V.background };
    const stage = V.stage ? (typeof V.stage === 'string' ? HV.$(V.stage) : V.stage) : HV.$('#stage');
    if (!stage) throw new Error('hv.js: no #stage element');
    Object.assign(stage.style, { width: V.width + 'px', height: V.height + 'px', position: 'relative',
                                 overflow: 'hidden', background: V.background });
    document.documentElement.style.background = RENDER ? V.background : '#111';
    Object.assign(document.body.style, { margin: '0', overflow: 'hidden' });

    let current = -1;
    const draw = t => { t = clamp(t, 0, V.duration); current = t; return V.render(t, V); };

    let readyResolve;
    global.HV_READY = new Promise(r => (readyResolve = r));
    const boot = async () => {
      if (V.setup) await V.setup(V);
      await Promise.all(pending);
      if (document.fonts) await document.fonts.ready;
      global.seek = t => draw(t);
      await draw(0);
      readyResolve();
      if (!RENDER) preview();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else setTimeout(boot, 0);

    // ------------- live preview UI (never shown in renders)
    function preview() {
      const raf = global.__hvOrigRAF || global.requestAnimationFrame.bind(global);
      const bar = document.createElement('div');
      bar.innerHTML = `<button id="hvp">❚❚</button><input id="hvs" type="range" min="0" max="${V.duration}" step="${1 / V.fps}" value="0"><span id="hvt"></span>`;
      Object.assign(bar.style, { position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', gap: '12px',
        alignItems: 'center', padding: '10px 16px', background: 'rgba(0,0,0,.75)', color: '#eee',
        font: '13px/1 ui-monospace,monospace', zIndex: 99999 });
      bar.querySelector('#hvs').style.flex = '1';
      Object.assign(bar.querySelector('#hvp').style, { width: '38px', height: '28px', cursor: 'pointer',
        background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '6px' });
      document.body.appendChild(bar);
      const fit = () => {
        const s = Math.min(innerWidth / V.width, (innerHeight - 48) / V.height);
        Object.assign(stage.style, { transformOrigin: '0 0', position: 'absolute',
          left: (innerWidth - V.width * s) / 2 + 'px', top: (innerHeight - 48 - V.height * s) / 2 + 'px',
          transform: `scale(${s})` });
      };
      fit(); addEventListener('resize', fit);
      let playing = true, t0 = performance.now(), base = 0;
      const btn = bar.querySelector('#hvp'), sl = bar.querySelector('#hvs'), lab = bar.querySelector('#hvt');
      const show = t => { draw(t); sl.value = t; lab.textContent = `${t.toFixed(2)} / ${V.duration.toFixed(2)}s  f${Math.round(t * V.fps)}`; };
      const setPlay = p => { playing = p; btn.textContent = p ? '❚❚' : '▶'; base = current; t0 = performance.now(); };
      btn.onclick = () => setPlay(!playing);
      sl.oninput = () => { setPlay(false); show(+sl.value); };
      addEventListener('keydown', e => {
        if (e.code === 'Space') { e.preventDefault(); if (!playing && current >= V.duration) base = 0; setPlay(!playing); }
        const step = e.shiftKey ? 1 : 1 / V.fps;
        if (e.code === 'ArrowRight') { setPlay(false); show(Math.min(V.duration, current + step)); }
        if (e.code === 'ArrowLeft') { setPlay(false); show(Math.max(0, current - step)); }
        if (e.code === 'Home') { setPlay(false); show(0); }
      });
      const loop = () => {
        if (playing) {
          let t = base + (performance.now() - t0) / 1000;
          if (t > V.duration) { t = 0; base = 0; t0 = performance.now(); }
          show(t);
        }
        raf(loop);
      };
      raf(loop);
    }
    return V;
  };

  global.HV = HV;
})(window);
