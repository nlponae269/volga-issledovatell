// ===================== Яндекс Игры: SDK, пропуски за яны (полёт, телепорт, ускорение) =====================
// Подключается только в сборке для Яндекс Игр (build_yandex.py). Товары заводятся в консоли разработчика
// с идентификаторами fly / teleport / speed. Покупки постоянные: при каждом запуске восстанавливаются через getPurchases().
(function () {
  const GP = (window.__gp = { fly: false, teleport: false, speed: false, flyOn: false, speedOn: true, up: 0, down: 0 });
  const ITEMS = [
    { id: 'fly', icon: '✈', name: 'Полёт', desc: 'Летай над дворами. V — вкл/выкл, Пробел — вверх, C — вниз.' },
    { id: 'teleport', icon: '⌖', name: 'Телепорт', desc: 'Мгновенно к ключу мира, к старту или к дому 13.' },
    { id: 'speed', icon: '⚡', name: 'Ускорение', desc: 'Ходишь и бегаешь почти в 2 раза быстрее.' },
  ];
  const TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  let ysdk = null, payments = null, catalog = {};
  try { JSON.parse(localStorage.getItem('gp_owned') || '[]').forEach((id) => { if (id in GP) GP[id] = true; }); } catch (e) {}
  const saveOwned = () => { try { localStorage.setItem('gp_owned', JSON.stringify(ITEMS.filter((i) => GP[i.id]).map((i) => i.id))); } catch (e) {} };
  const grant = (id) => { if (!(id in GP)) return; GP[id] = true; saveOwned(); render(); };
  const say = (h) => { const g = window.__game; if (g && g.toast) g.toast(h); };

  // --- SDK ---
  function initSdk() {
    if (!window.YaGames) return;
    YaGames.init().then((s) => {
      ysdk = s; window.ysdk = s;
      try { s.features && s.features.LoadingAPI && s.features.LoadingAPI.ready(); } catch (e) {}
      return s.getPayments({ signed: false });
    }).then((p) => {
      if (!p) return; payments = p;
      p.getCatalog().then((list) => { list.forEach((it) => { catalog[it.id] = it; }); render(); }).catch(() => {});
      return p.getPurchases().then((list) => { list.forEach((pu) => grant(pu.productID)); });
    }).catch(() => {});
  }
  function buy(id) {
    if (GP[id]) return;
    if (!payments) { alert('Покупки доступны только в Яндекс Играх.'); return; }
    payments.purchase({ id }).then(() => { grant(id); say(`<b style="color:#ffd35a">Куплено: ${ITEMS.find((i) => i.id === id).name}</b>`); }).catch(() => {});
  }

  // --- UI ---
  const css = document.createElement('style');
  css.textContent = `
  #gpBtn{position:fixed;left:10px;top:44px;z-index:99;background:#0007;color:#ffd35a;border:1px solid #ffd35a66;border-radius:14px;padding:5px 11px;font:600 12px system-ui,sans-serif;cursor:pointer}
  #gpShop{position:fixed;inset:0;z-index:200;background:#000b;display:none;align-items:center;justify-content:center;font-family:system-ui,sans-serif}
  #gpShop.on{display:flex}
  #gpShop .box{background:#16181c;border:1px solid #ffffff22;border-radius:16px;padding:18px;width:min(92vw,440px);color:#ddd;box-shadow:0 10px 40px #000a}
  #gpShop h3{margin:0 0 12px;font-size:18px;color:#fff;letter-spacing:.05em}
  #gpShop .it{display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px;background:#ffffff0a;margin-bottom:8px}
  #gpShop .ic{font-size:26px;width:36px;text-align:center}
  #gpShop .tx{flex:1;font-size:13px;line-height:1.35}#gpShop .tx b{font-size:15px;color:#fff}
  #gpShop button{border:0;border-radius:10px;padding:8px 12px;font:600 13px system-ui;cursor:pointer;background:linear-gradient(135deg,#ffd35a,#f08a3a);color:#1a1205;white-space:nowrap;display:flex;align-items:center;gap:4px}
  #gpShop button.own{background:#2f6b3f;color:#d8ffe0}
  #gpShop button img{width:16px;height:16px}
  #gpShop .cl{margin-top:6px;width:100%;justify-content:center;background:#ffffff14;color:#ccc}
  #gpTools{position:fixed;right:12px;top:42%;z-index:99;display:flex;flex-direction:column;gap:8px}
  #gpTools div{width:46px;height:46px;border-radius:50%;background:#0008;border:1px solid #ffffff44;color:#fff;font:20px system-ui;display:none;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;touch-action:none}
  #gpTools div.on{display:flex}#gpTools div.act{background:#ffd35acc;color:#111}
  #gpTp{position:fixed;inset:0;z-index:201;background:#000a;display:none;align-items:center;justify-content:center;font-family:system-ui}
  #gpTp.on{display:flex}#gpTp .box{background:#16181c;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px;min-width:240px}
  #gpTp button{border:0;border-radius:10px;padding:11px;font:600 14px system-ui;background:#ffffff14;color:#fff;cursor:pointer}`;
  document.head.appendChild(css);
  const shop = document.createElement('div'); shop.id = 'gpShop';
  const btn = document.createElement('button'); btn.id = 'gpBtn'; btn.textContent = '★ Пропуски';
  const tools = document.createElement('div'); tools.id = 'gpTools';
  tools.innerHTML = '<div id="gpFly" title="Полёт (V)">✈</div><div id="gpUp">▲</div><div id="gpDown">▼</div><div id="gpTpB" title="Телепорт (T)">⌖</div><div id="gpSpd" title="Ускорение">⚡</div>';
  const tp = document.createElement('div'); tp.id = 'gpTp';
  function priceHtml(id) {
    const c = catalog[id]; if (!c) return 'Купить';
    let img = ''; try { const u = c.getPriceCurrencyImage && c.getPriceCurrencyImage('small'); if (u) img = `<img src="${u}" alt="">`; } catch (e) {}
    return `${c.priceValue || c.price}${img || ' ' + (c.priceCurrencyCode || '')}`;
  }
  function render() {
    shop.innerHTML = '<div class="box"><h3>★ ПРОПУСКИ</h3>' + ITEMS.map((i) => `<div class="it"><div class="ic">${i.icon}</div><div class="tx"><b>${(catalog[i.id] && catalog[i.id].title) || i.name}</b><br>${i.desc}</div><button data-id="${i.id}" class="${GP[i.id] ? 'own' : ''}">${GP[i.id] ? 'Есть ✓' : priceHtml(i.id)}</button></div>`).join('') + '<button class="cl">Закрыть</button></div>';
    shop.querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); buy(b.dataset.id); }));
    shop.querySelector('.cl').addEventListener('click', (e) => { e.stopPropagation(); shop.classList.remove('on'); });
    const game = !!window.__game;
    tools.querySelector('#gpFly').classList.toggle('on', game && GP.fly); tools.querySelector('#gpFly').classList.toggle('act', GP.flyOn);
    for (const k of ['#gpUp', '#gpDown']) tools.querySelector(k).classList.toggle('on', game && GP.fly && GP.flyOn && TOUCH);
    tools.querySelector('#gpTpB').classList.toggle('on', game && GP.teleport);
    tools.querySelector('#gpSpd').classList.toggle('on', game && GP.speed); tools.querySelector('#gpSpd').classList.toggle('act', GP.speed && GP.speedOn);
  }
  function setFly(v) { if (!GP.fly) return; GP.flyOn = v; render(); say(v ? '✈ Полёт: вкл' : 'Полёт: выкл'); }
  function openTp() {
    const g = window.__game; if (!g || !GP.teleport) return;
    const pts = []; const kp = g.KEY_POS && g.KEY_POS[g.WORLD]; const got = g.keysGot ? g.keysGot().includes(g.WORLD) : false;
    if (kp && !got) pts.push(['К ключу этого мира', kp[0], kp[2], kp[1] || 0]);
    if (g.home) pts.push([g.home.n, g.home.x, g.home.z, 0]);
    const sp = g.SPAWN; pts.push(['К старту', sp ? sp.x : 0, sp ? sp.z : 0, 0]);
    pts.push(['На 100 м вперёд', null, null, null]);
    tp.innerHTML = '<div class="box">' + pts.map((p, i) => `<button data-i="${i}">${p[0]}</button>`).join('') + '<button data-i="x" style="opacity:.7">Отмена</button></div>';
    tp.querySelectorAll('button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); tp.classList.remove('on'); if (b.dataset.i === 'x') return; const p = pts[+b.dataset.i], P = g.P;
      if (p[1] === null) { P.x += -Math.sin(P.yaw) * 100; P.z += -Math.cos(P.yaw) * 100; } else { P.x = p[1] + 1.5; P.z = p[2] + 1.5; P.y = p[3]; } P.vy = 0; say('⌖ ' + p[0]); }));
    tp.classList.add('on');
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); render(); shop.classList.add('on'); });
  btn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  const hold = (id, k) => { const el = tools.querySelector(id); const on = (e) => { e.preventDefault(); e.stopPropagation(); GP[k] = 1; }, off = (e) => { e.preventDefault(); GP[k] = 0; };
    el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('touchend', off); el.addEventListener('mousedown', on); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off); };
  const tap = (id, f) => { const el = tools.querySelector(id); el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); f(); }, { passive: false }); el.addEventListener('click', (e) => { e.stopPropagation(); f(); }); };
  function mount() {
    if (mount.done || !document.body) return; mount.done = true;
    document.body.append(btn, shop, tools, tp); if (!window.__game) { btn.style.top = 'auto'; btn.style.bottom = '12px'; btn.style.left = 'auto'; btn.style.right = '12px'; }
    hold('#gpUp', 'up'); hold('#gpDown', 'down');
    tap('#gpFly', () => setFly(!GP.flyOn)); tap('#gpTpB', openTp); tap('#gpSpd', () => { GP.speedOn = !GP.speedOn; render(); say(GP.speedOn ? '⚡ Ускорение: вкл' : 'Ускорение: выкл'); });
    render();
  }
  addEventListener('keydown', (e) => { if (e.code === 'KeyV') setFly(!GP.flyOn); if (e.code === 'KeyT') openTp(); });
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
  initSdk();
})();
