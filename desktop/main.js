const { app, BrowserWindow, protocol, net, Menu } = require('electron');
const path = require('path'); const { pathToFileURL } = require('url');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force_high_performance_gpu');   // ноутбуки: дискретная видеокарта, а не встроенная
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const ROOT = path.join(__dirname, 'game');
app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname); if (p === '/' || p === '') p = '/index.html';
    const f = path.normalize(path.join(ROOT, p)); if (!f.startsWith(ROOT)) return new Response('no', { status: 403 });
    return net.fetch(pathToFileURL(f).toString());
  });
  Menu.setApplicationMenu(null);
  const w = new BrowserWindow({ width: 1600, height: 900, backgroundColor: '#000000', title: 'Тишина', autoHideMenuBar: true, webPreferences: { contextIsolation: true, backgroundThrottling: false } });
  w.maximize();
  w.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { w.setFullScreen(!w.isFullScreen()); e.preventDefault(); return; }
    if (i.key === 'Escape' && !i.isAutoRepeat) {   // Esc — назад в меню (в мире), даже когда мышь захвачена
      const u = w.webContents.getURL(); if (/\/index\.html$/.test(u) || /\/game\/?$/.test(u)) return;
      e.preventDefault();
      w.webContents.executeJavaScript("window.__esc ? window.__esc() : 'menu'").then((r) => { if (r === 'menu' || r === 'busy') setTimeout(() => w.loadURL('app://game/index.html'), 300); }).catch(() => w.loadURL('app://game/index.html'));
    }
  });
  const T = process.env.TISHINA_TEST;
  if (T) { w.webContents.on('console-message', (e, l, m) => { if (l >= 2) console.log('CONSOLE', m); });
    w.loadURL('app://game/' + T); setTimeout(async () => { const img = await w.webContents.capturePage(); require('fs').writeFileSync(process.env.TISHINA_SHOT || 'shot.png', img.toPNG()); app.quit(); }, 25000); return; }
  w.loadURL('app://game/index.html');
});
app.on('window-all-closed', () => app.quit());
