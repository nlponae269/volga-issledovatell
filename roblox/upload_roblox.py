#!/usr/bin/env python3
"""Загрузка всех текстур из textures/ в Roblox через Open Cloud (без ручной возни).
Нужно один раз:
  1) https://create.roblox.com/dashboard/credentials → Create API Key → доступ «Assets API» (read + write), IP 0.0.0.0/0.
  2) Свой userId: открой свой профиль на roblox.com, число в адресе.
Запуск:
  pip install requests
  ROBLOX_API_KEY=... ROBLOX_USER_ID=... python3 upload_roblox.py
Результат: ids.json  {"pod_floor.jpg": 1234567890, ...}  — это ID картинок (rbxassetid://ID).
Если загрузка вернула ID декали, а картинка в Studio не видна — см. CLAUDE.md, раздел «Если текстура не видна».
"""
import json, os, pathlib, sys, time
import requests

KEY = os.environ.get('ROBLOX_API_KEY'); UID = os.environ.get('ROBLOX_USER_ID')
if not KEY or not UID: sys.exit('Нужны переменные ROBLOX_API_KEY и ROBLOX_USER_ID')
root = pathlib.Path(__file__).parent
out = root / 'ids.json'; ids = json.loads(out.read_text()) if out.exists() else {}
H = {'x-api-key': KEY}
for f in sorted((root / 'textures').iterdir()):
    if f.name.startswith('_') or f.suffix.lower() not in ('.jpg', '.png') or f.name in ids: continue
    req = {'assetType': 'Decal', 'displayName': 'tishina_' + f.stem, 'description': 'Tishina texture ' + f.name,
           'creationContext': {'creator': {'userId': str(UID)}}}
    ct = 'image/png' if f.suffix.lower() == '.png' else 'image/jpeg'
    r = requests.post('https://apis.roblox.com/assets/v1/assets', headers=H,
                      files={'request': (None, json.dumps(req), 'application/json'), 'fileContent': (f.name, f.read_bytes(), ct)})
    if r.status_code >= 300: print('ОШИБКА', f.name, r.status_code, r.text[:300]); continue
    op = r.json().get('path') or r.json().get('operationId')
    for _ in range(30):
        time.sleep(2)
        o = requests.get('https://apis.roblox.com/assets/v1/' + (op if op.startswith('operations/') else 'operations/' + op), headers=H).json()
        if o.get('done'):
            aid = (o.get('response') or {}).get('assetId'); ids[f.name] = int(aid) if aid else None; print(f.name, '→', aid); break
    else: print('нет ответа', f.name)
    out.write_text(json.dumps(ids, ensure_ascii=False, indent=1))
print('Готово:', out)
