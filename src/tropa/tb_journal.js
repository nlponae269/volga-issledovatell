// ===================== «Дневник сна»: достижения, карта миров, записки, статистика. Кнопка 📖 или клавиша J. Всё хранится в localStorage («ach_state»). =====================
(() => {
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const ST = (() => { try { return Object.assign({ visited: {}, ach: {}, dist: 0, time: 0, best: { still: 0 }, puddles: 0, cats: 0 }, JSON.parse(LS('ach_state') || '{}')); } catch (e) { return { visited: {}, ach: {}, dist: 0, time: 0, best: { still: 0 }, puddles: 0, cats: 0 }; } })();
  ST.best = ST.best || { still: 0 };
  const save = () => LS('ach_state', JSON.stringify(ST));
  const ALLW = ['dvory', 'podezd', 'kvartira', 'alt', ...WORLD_LIST.filter((w) => !['dvory', 'podezd'].includes(w))];
  const NAME = (w) => WORLD_NAMES[w] || w;
  const nKeys = () => keysGot().filter((w) => KEY_WORLDS.includes(w)).length;
  const nItems = () => ALLW.reduce((s, w) => s + (+LS(w + '_items') || 0) + (+LS(w + '_trash') || 0), 0);
  const nNotes = () => Math.min(+LS('dvory_cards') || 0, 12);
  const nVisited = () => ALLW.filter((w) => ST.visited[w]).length;
  ST.visited[WORLD] = ST.visited[WORLD] || Date.now(); save();
  // сохранить текст записок (в ALT массив подменяется другим)
  if (!ALT && typeof DV_LORE !== 'undefined') LS('journal_lore', JSON.stringify(DV_LORE));
  const LORE = () => { try { return JSON.parse(LS('journal_lore') || '[]'); } catch (e) { return []; } };

  // ---------- список достижений ----------
  const A = [
    { id: 'start', i: '👣', n: 'Первый шаг', d: 'Войти в любой мир', ok: () => true },
    { id: 'dvory', i: '🏚', n: 'Домофон молчит', d: 'Побывать во Дворах', ok: () => ST.visited.dvory },
    { id: 'podezd', i: '🎆', n: 'Новогодняя ночь', d: 'Подняться в Подъезд', ok: () => ST.visited.podezd },
    { id: 'kv', i: '🛏', n: 'Квартира 47', d: 'Дойти до дома', ok: () => ST.visited.kvartira },
    { id: 'alt', i: '🌑', n: 'Не оборачивайся', d: 'Найти ALTERNATIVE', hid: 1, ok: () => ST.visited.alt },
    { id: 'tour5', i: '🧭', n: 'Турист', d: 'Побывать в 5 мирах', ok: () => nVisited() >= 5 },
    { id: 'tour10', i: '🗺', n: 'Путешественник по снам', d: 'Побывать в 10 мирах', ok: () => nVisited() >= 10 },
    { id: 'tourall', i: '🌌', n: 'Всё помню', d: 'Побывать во всех мирах', ok: () => nVisited() >= ALLW.length },
    { id: 'key1', i: '🗝', n: 'Первый ключ', d: 'Найти ключ от ворот', ok: () => nKeys() >= 1 },
    { id: 'key8', i: '🔑', n: 'Связка', d: 'Собрать 8 ключей', ok: () => nKeys() >= 8 },
    { id: 'keyall', i: '🚪', n: 'Ворота ждут', d: 'Собрать все ключи', ok: () => nKeys() >= KEY_WORLDS.length },
    { id: 'note1', i: '✉', n: 'Записка', d: 'Прочитать первую записку', ok: () => nNotes() >= 1 },
    { id: 'note6', i: '📜', n: 'Чужие слова', d: 'Прочитать 6 записок', ok: () => nNotes() >= 6 },
    { id: 'note12', i: '📚', n: 'Архивариус', d: 'Собрать все 12 записок Дворов', ok: () => nNotes() >= 12 },
    { id: 'items10', i: '🧺', n: 'Собиратель', d: 'Подобрать 10 вещей в разных мирах', ok: () => nItems() >= 10 },
    { id: 'items50', i: '🎒', n: 'Барахольщик', d: 'Подобрать 50 вещей', ok: () => nItems() >= 50 },
    { id: 'walk1', i: '🚶', n: 'Прогулка', d: 'Пройти 1 километр', ok: () => ST.dist >= 1000 },
    { id: 'walk10', i: '🥾', n: 'Марафон', d: 'Пройти 10 километров', ok: () => ST.dist >= 10000 },
    { id: 'walk42', i: '🏅', n: 'Бесконечный двор', d: 'Пройти 42 километра', ok: () => ST.dist >= 42195 },
    { id: 'time30', i: '⏳', n: 'Засиделся', d: 'Провести во сне 30 минут', ok: () => ST.time >= 1800 },
    { id: 'time120', i: '🕰', n: 'Время остановилось', d: 'Провести во сне 2 часа', ok: () => ST.time >= 7200 },
    { id: 'still', i: '🤫', n: 'Тишина', d: 'Простоять на месте целую минуту', hid: 1, ok: () => ST.best.still >= 60 },
    { id: 'sky', i: '☁', n: 'Небо', d: 'Смотреть вверх 8 секунд', ok: () => ST.skyDone },
    { id: 'puddle', i: '💧', n: 'Плюх', d: 'Наступить в лужу', ok: () => ST.puddles >= 1 },
    { id: 'puddle30', i: '🌧', n: 'Мокрые ноги', d: 'Наступить в 30 луж', ok: () => ST.puddles >= 30 },
    { id: 'far', i: '🌐', n: 'Дальние земли', d: 'Включить режим Far Lands', ok: () => FAR },
    { id: 'int32', i: '🛗', n: 'Переполнение', d: 'Сломать лифт числом больше 2 147 483 647', hid: 1 },
    { id: 'beast', i: '😈', n: 'Не тот этаж', d: 'Набрать в лифте 666', hid: 1 },
    { id: 'e404', i: '❓', n: 'Этаж не найден', d: 'Набрать в лифте 404', hid: 1 },
    { id: 'wake', i: '☀', n: 'Минута пошла дальше', d: 'Дойти до концовки', hid: 1, ok: () => LS('dream_done') === '1' },
    { id: 'final', i: '🏠', n: 'Ворота открылись', d: 'Вернуться во двор с открытыми воротами', hid: 1, ok: () => LS('dream_final') === '1' },
  ];
  const AM = Object.fromEntries(A.map((a) => [a.id, a]));
  ST.total = A.length;
  const nDone = () => A.filter((a) => ST.ach[a.id]).length;

  // ---------- интерфейс ----------
  const css = document.createElement('style');
  css.textContent = `
#jBtn{position:fixed;left:max(12px,env(safe-area-inset-left,0px));top:max(12px,env(safe-area-inset-top,0px));z-index:15;min-width:44px;height:44px;padding:0 12px;border-radius:22px;border:1px solid #fff3;background:#0007;color:#eee;font:600 14px/42px system-ui,sans-serif;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .4s}
#jBtn.on{opacity:.6;pointer-events:auto}#jBtn:hover{opacity:1}
#jBtn small{opacity:.55;font-weight:400;margin-left:6px}
#jAch{position:fixed;left:50%;top:max(16px,env(safe-area-inset-top,0px));z-index:40;transform:translate(-50%,-140%);display:flex;gap:14px;align-items:center;max-width:min(460px,calc(100vw - 24px));padding:12px 20px 12px 14px;border-radius:14px;background:linear-gradient(135deg,#1c1a14f2,#2a2010f2);border:1px solid #d9b24c88;box-shadow:0 10px 36px #000a,0 0 30px #d9b24c33;color:#f2ead6;font-family:system-ui,sans-serif;pointer-events:none;transition:transform .7s cubic-bezier(.16,1,.3,1)}
#jAch.show{transform:translate(-50%,0)}
#jAch .ic{font-size:34px;line-height:1;filter:drop-shadow(0 2px 6px #000)}
#jAch small{display:block;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#d9b24c}
#jAch b{display:block;font-size:18px;margin:2px 0}
#jAch span{font-size:13px;opacity:.75}
#jOv{position:fixed;inset:0;z-index:35;display:none;align-items:center;justify-content:center;background:#000c;font-family:system-ui,sans-serif;color:#e8e4d8;padding:max(12px,env(safe-area-inset-top,0px)) 12px 12px}
#jOv.on{display:flex}
#jPan{width:min(780px,100%);max-height:100%;display:flex;flex-direction:column;background:#14130f;border:1px solid #ffffff22;border-radius:16px;box-shadow:0 20px 80px #000;overflow:hidden;animation:jIn .45s cubic-bezier(.16,1,.3,1)}
@keyframes jIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
#jHead{display:flex;align-items:center;gap:14px;padding:16px 18px 10px}
#jHead h2{margin:0;font:300 24px/1 system-ui;letter-spacing:.24em;text-transform:uppercase;flex:1}
#jHead button{background:#ffffff14;border:0;color:#eee;width:38px;height:38px;border-radius:50%;font-size:20px;cursor:pointer}
#jTabs{display:flex;gap:4px;padding:0 14px;border-bottom:1px solid #ffffff1a;overflow-x:auto}
#jTabs button{background:none;border:0;border-bottom:2px solid transparent;color:#9a968a;padding:10px 14px;font:600 13px system-ui;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap}
#jTabs button.on{color:#ffd35a;border-color:#ffd35a}
#jBody{overflow-y:auto;padding:16px 18px 22px;-webkit-overflow-scrolling:touch}
.jBar{height:6px;border-radius:3px;background:#ffffff18;overflow:hidden;margin:6px 0 16px}.jBar i{display:block;height:100%;background:linear-gradient(90deg,#e07a4f,#ffd35a)}
.jGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.jA{display:flex;gap:12px;align-items:center;padding:11px 12px;border-radius:12px;background:#ffffff0a;border:1px solid #ffffff12}
.jA.ok{background:linear-gradient(135deg,#d9b24c1c,#ffffff08);border-color:#d9b24c66}
.jA .ic{font-size:28px;width:36px;text-align:center;filter:grayscale(1) brightness(.6)}.jA.ok .ic{filter:none}
.jA b{display:block;font-size:15px}.jA span{font-size:12.5px;opacity:.65;line-height:1.35}
.jW{display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid #ffffff12}
.jW .st{width:10px;height:10px;border-radius:50%;background:#444;flex:none}.jW.v .st{background:#7bd88f}
.jW b{flex:1;font-size:15px}.jW span{font-size:13px;opacity:.7;text-align:right}
.jN{background:#e8e0c8;color:#2a2418;padding:14px 16px;border-radius:4px;margin-bottom:12px;font:15px/1.55 Georgia,serif;box-shadow:0 4px 14px #0008}
.jN small{display:block;font:600 11px system-ui;letter-spacing:.2em;color:#8a7a50;margin-bottom:6px}
.jN.lock{background:#ffffff0a;color:#6b675c;box-shadow:none;border:1px dashed #ffffff22;font-family:system-ui}
.jS{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.jS div{padding:14px;border-radius:12px;background:#ffffff0a;border:1px solid #ffffff12}.jS b{display:block;font:300 30px/1.1 system-ui;color:#ffd35a}.jS span{font-size:12px;opacity:.65;text-transform:uppercase;letter-spacing:.12em}
.jHint{font-size:12px;opacity:.5;text-align:center;padding:10px}
`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.id = 'jBtn'; btn.setAttribute('aria-label', 'Дневник');
  const ach = document.createElement('div'); ach.id = 'jAch';
  const ov = document.createElement('div'); ov.id = 'jOv';
  ov.innerHTML = '<div id="jPan"><div id="jHead"><h2>Дневник сна</h2><button id="jX" aria-label="Закрыть">×</button></div><div id="jTabs"></div><div id="jBody"></div></div>';
  document.body.append(btn, ach, ov);
  const body = ov.querySelector('#jBody'), tabs = ov.querySelector('#jTabs');
  const TABS = [['a', 'Достижения'], ['w', 'Миры'], ['n', 'Записки'], ['s', 'Статистика']];
  let tab = 'a', open = false;
  const fmtT = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} ч ${m} мин` : `${m} мин ${s % 60} с`; };
  const fmtD = (m) => (m >= 1000 ? (m / 1000).toFixed(2) + ' км' : Math.round(m) + ' м');
  const bar = (a, b) => `<div class="jBar"><i style="width:${Math.min(100, (a / b) * 100)}%"></i></div>`;
  function render() {
    tabs.innerHTML = TABS.map(([k, t]) => `<button data-k="${k}" class="${k === tab ? 'on' : ''}">${t}</button>`).join('');
    let h = '';
    if (tab === 'a') {
      h = `<div style="display:flex;justify-content:space-between;font-size:14px"><span>Открыто</span><b>${nDone()} / ${A.length}</b></div>${bar(nDone(), A.length)}<div class="jGrid">` +
        [...A].sort((x, y) => !!ST.ach[y.id] - !!ST.ach[x.id]).map((a) => { const o = !!ST.ach[a.id]; const hid = a.hid && !o;
          return `<div class="jA ${o ? 'ok' : ''}"><div class="ic">${hid ? '❔' : a.i}</div><div><b>${hid ? 'Секретное' : a.n}</b><span>${hid ? 'Условие скрыто — оно само найдёт тебя' : a.d}</span></div></div>`; }).join('') + '</div>';
    } else if (tab === 'w') {
      h = `<div style="display:flex;justify-content:space-between;font-size:14px"><span>Побывал в мирах</span><b>${nVisited()} / ${ALLW.length}</b></div>${bar(nVisited(), ALLW.length)}<div style="display:flex;justify-content:space-between;font-size:14px"><span>Ключей от ворот</span><b>${nKeys()} / ${KEY_WORLDS.length}</b></div>${bar(nKeys(), KEY_WORLDS.length)}` +
        ALLW.map((w) => { const v = !!ST.visited[w], k = keysGot().includes(w), it = (+LS(w + '_items') || 0) + (+LS(w + '_trash') || 0);
          return `<div class="jW ${v ? 'v' : ''}"><div class="st"></div><b>${v || w === WORLD ? NAME(w) : '???'}</b><span>${v ? (KEY_WORLDS.includes(w) ? (k ? '🗝 ключ найден' : 'ключ ещё ищет тебя') : '') + (it ? ` · вещей: ${it}` : '') : 'не был'}${w === WORLD ? ' · ты здесь' : ''}</span></div>`; }).join('');
    } else if (tab === 'n') {
      const L = LORE(), n = nNotes();
      h = `<div style="display:flex;justify-content:space-between;font-size:14px"><span>Записки Дворов</span><b>${n} / 12</b></div>${bar(n, 12)}` +
        (L.length ? L.slice(0, 12).map((t, i) => i < n ? `<div class="jN"><small>ЗАПИСКА ${i + 1}</small>${t}</div>` : `<div class="jN lock"><small>ЗАПИСКА ${i + 1}</small>Ещё не найдена. Ищи во дворе.</div>`).join('') : '<div class="jN lock">Записки появятся, когда ты зайдёшь во Дворы.</div>');
    } else {
      h = `<div class="jS"><div><b>${fmtD(ST.dist)}</b><span>пройдено</span></div><div><b>${fmtT(ST.time)}</b><span>во сне</span></div><div><b>${nVisited()}/${ALLW.length}</b><span>миров</span></div><div><b>${nKeys()}/${KEY_WORLDS.length}</b><span>ключей</span></div><div><b>${nNotes()}/12</b><span>записок</span></div><div><b>${nItems()}</b><span>вещей</span></div><div><b>${ST.puddles}</b><span>луж</span></div><div><b>${fmtT(ST.best.still)}</b><span>дольше всего стоял</span></div></div><div class="jHint">Мир: ${NAME(WORLD)} · дневник хранится только на этом устройстве</div>`;
    }
    body.innerHTML = h; body.scrollTop = 0;
  }
  tabs.addEventListener('click', (e) => { const k = e.target.dataset && e.target.dataset.k; if (k) { tab = k; render(); } });
  const toggle = (v) => { if (!started && v) return; open = v === undefined ? !open : v; ov.classList.toggle('on', open); if (open) { if (document.pointerLockElement) document.exitPointerLock(); render(); blip([440, 554], 0.25, 'sine', 0.025); } };
  btn.onclick = () => toggle(); ov.querySelector('#jX').onclick = () => toggle(false); ov.addEventListener('click', (e) => { if (e.target === ov) toggle(false); });
  addEventListener('keydown', (e) => { const t = e.target; if (t && /INPUT|TEXTAREA/.test(t.tagName)) return; if (e.code === 'KeyJ') { e.preventDefault(); toggle(); } else if (e.code === 'Escape' && open) toggle(false); });
  const upBtn = () => { btn.innerHTML = `📖${TOUCH ? '' : '<small>J</small>'}`; btn.title = `Дневник · ${nDone()}/${A.length}`; };
  upBtn();

  // ---------- выдача ----------
  const Q = []; let showing = 0;
  function unlock(id) {
    if (ST.ach[id] || !AM[id]) return; ST.ach[id] = Date.now(); save(); Q.push(AM[id]); upBtn();
  }
  window.__unlockAch = unlock;
  function pump(dt) {
    if (showing > 0) { showing -= dt; if (showing <= 0) { ach.classList.remove('show'); showing = -0.9; } return; }
    if (showing < 0) { showing += dt; if (showing >= 0) showing = 0; return; }
    if (!Q.length || open) return;
    const a = Q.shift(); ach.innerHTML = `<div class="ic">${a.i}</div><div><small>Достижение · ${nDone()}/${A.length}</small><b>${a.n}</b><span>${a.d}</span></div>`;
    ach.classList.add('show'); showing = 4.2; blip([523, 659, 784, 1047], 0.9, 'sine', 0.035);
  }

  // ---------- слежение ----------
  const prev = WORLD_UPDATE; let poll = 0, sv = 0, lx = null, lz = null, still = 0, sky = 0, wasP = false;
  WORLD_UPDATE = (dt) => {
    prev && prev(dt);
    const on = started && !open;
    btn.classList.toggle('on', !!started); const stEl = document.getElementById('start'); if (stEl && stEl.style.display !== 'none' && !started) btn.classList.remove('on');
    pump(dt);
    if (!started) return;
    ST.time += dt;
    if (lx !== null) { const d = Math.hypot(P.x - lx, P.z - lz); if (d < 4) { ST.dist += d; still = d < 0.004 ? still + dt : 0; if (still > (ST.best.still || 0)) ST.best.still = still; } else still = 0; }
    lx = P.x; lz = P.z;
    if (P.pitch > 1.0) { sky += dt; if (sky > 8) ST.skyDone = 1; } else sky = 0;
    if (DVOR && window.__puddle && P.ground) { const p = !!window.__puddle(P.x, P.z); if (p && !wasP && P.speed > 0.5) ST.puddles++; wasP = p; }
    poll -= dt; if (poll <= 0) { poll = 0.7; for (const a of A) if (!ST.ach[a.id] && a.ok && a.ok()) unlock(a.id); }
    sv -= dt; if (sv <= 0) { sv = 6; save(); }
  };
  addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  // секретные пасхалки лифта
  try { if (typeof liftGo === 'function') { const _lg = liftGo; liftGo = function () { const raw = (typeof liftIn !== 'undefined' && liftIn.value || '').trim().replace(/\s+/g, ''); _lg.apply(this, arguments);
    try { if (/^-?\d{1,22}$/.test(raw)) { const T = Number(raw); if (Math.abs(T) > 2147483647) unlock('int32'); if (T === 666) unlock('beast'); if (T === 404) unlock('e404'); } } catch (e) {} }; } } catch (e) {}
  window.__journal = { ST, unlock, toggle, A, nDone };
})();
