// «Тишина Cloud» — свой облачный гейминг: игра крутится в Chromium на сервере,
// картинка идёт JPEG-кадрами по WebSocket, касания/клавиши — обратно в игру.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PORT = +process.env.PORT || 8080;
const W = +process.env.W || 640, H = +process.env.H || 360, Q = +process.env.Q || 50;
const KEY = process.env.KEY || '';           // если задан — вход только по ссылке ?k=KEY
const GPU = process.env.GPU === '1';
const START = process.env.START || 'index.html';
// перехват звука в игре: всё, что идёт в динамики (WebAudio и <audio>), режется в PCM 16 бит 24 кГц моно
const AUDIO_HOOK = `(() => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC || window.__capHook) return; window.__capHook = 1;
  const orig = AudioNode.prototype.connect; let nid = 0;
  function cap(ctx) { if (ctx.__cap) return ctx.__cap; const id = (nid++) % 250; const g = ctx.createGain(); orig.call(g, ctx.destination);
    const sp = ctx.createScriptProcessor(4096, 2, 1); orig.call(g, sp); orig.call(sp, ctx.destination);
    sp.onaudioprocess = (e) => { if (!window.__pushAudio) return; const ib = e.inputBuffer, l = ib.getChannelData(0), r = ib.numberOfChannels > 1 ? ib.getChannelData(1) : l;
      const ratio = ctx.sampleRate / 24000, n = Math.floor(l.length / ratio), out = new Int16Array(n); let peak = 0;
      for (let i = 0; i < n; i++) { const j = Math.floor(i * ratio); let v = (l[j] + r[j]) * 0.5; v = v > 1 ? 1 : v < -1 ? -1 : v; out[i] = v * 32767; peak |= out[i]; }
      if (!peak) return; const u = new Uint8Array(out.buffer); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); window.__pushAudio(id, btoa(s)); };
    ctx.__cap = g; return g; }
  AudioNode.prototype.connect = function (dst, ...a) { if (dst instanceof AudioDestinationNode) dst = cap(dst.context); return orig.call(this, dst, ...a); };
  let mctx = null; const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { try { if (!this.__capd) { this.__capd = 1; mctx = mctx || new AC(); mctx.createMediaElementSource(this).connect(mctx.destination); mctx.resume(); } } catch (e) {} return play.apply(this, arguments); };
})();`;         // на сервере с видеокартой
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', json: 'application/json', bin: 'application/octet-stream', hdr: 'application/octet-stream', svg: 'image/svg+xml', woff2: 'font/woff2' };
const srv = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/' || u === '/index.html') u = '/cloud/client.html';
  else if (u.startsWith('/g/')) u = u.slice(2);
  else if (u !== '/cloud/client.html') { res.writeHead(404); return res.end(); }
  const f = path.join(ROOT, path.normalize(u));
  if (!f.startsWith(ROOT) || /[\\/]\.git[\\/]/.test(f)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => { if (e || !st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[f.split('.').pop().toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(res); });
});
const wss = new WebSocketServer({ server: srv, path: '/ws' });
let page, cdp, frames = 0, fps = 0;
async function startGame() {
  const args = ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
  if (GPU) args.push('--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'); else args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const browser = await chromium.launch({ args, executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; TishinaCloud) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  await ctx.addInitScript(AUDIO_HOOK);
  if (!GPU) await ctx.addInitScript(() => { try { localStorage.setItem('gfx', 'normal'); } catch (e) {} });   // без видеокарты — обычная графика
  await ctx.exposeBinding('__pushAudio', (_, id, b64) => { const pcm = Buffer.from(b64, 'base64'); const pk = Buffer.concat([Buffer.from([1, id]), pcm]);
    for (const c of wss.clients) if (c.readyState === 1 && c.bufferedAmount < 3e6) c.send(pk); });
  page = await ctx.newPage();
  page.on('crash', () => { console.log('вкладка упала — перезапуск'); page.reload().catch(() => {}); });
  page.on('pageerror', (e) => console.log('ошибка в игре:', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/g/${START}`);
  cdp = await ctx.newCDPSession(page);
  cdp.on('Page.screencastFrame', (f) => { cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); frames++;
    const buf = Buffer.from(f.data, 'base64'); for (const c of wss.clients) if (c.readyState === 1 && c.bufferedAmount < 2e6) c.send(buf); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: Q, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  setInterval(() => { fps = frames; frames = 0; for (const c of wss.clients) if (c.readyState === 1) c.send(JSON.stringify({ fps, w: W, h: H, url: page.url().split('/').pop() })); }, 1000);
  console.log(`игра запущена (${GPU ? 'GPU' : 'CPU'}, ${W}x${H})`);
}
wss.on('connection', (ws, req) => {
  if (KEY && new URL(req.url, 'http://x').searchParams.get('k') !== KEY) return ws.close();
  ws.on('message', async (m) => { if (!cdp) return; let d; try { d = JSON.parse(m); } catch (e) { return; }
    try {
      if (d.t === 'touch') await cdp.send('Input.dispatchTouchEvent', { type: d.type, touchPoints: d.pts.map(([id, x, y]) => ({ id, x: x * W, y: y * H, radiusX: 8, radiusY: 8, force: 1 })) });
      else if (d.t === 'key') await cdp.send('Input.dispatchKeyEvent', { type: d.type, key: d.key, code: d.code, windowsVirtualKeyCode: d.kc, nativeVirtualKeyCode: d.kc, text: d.type === 'keyDown' && d.key.length === 1 ? d.key : undefined });
      else if (d.t === 'menu') await page.goto(`http://127.0.0.1:${PORT}/g/index.html`);
    } catch (e) {} });
});
srv.listen(PORT, () => { console.log(`Тишина Cloud: http://localhost:${PORT}/${KEY ? '?k=' + KEY : ''}`); startGame().catch((e) => { console.error('не смог запустить Chromium:', e.message); process.exit(1); }); });
