#!/bin/bash
# Сборка Tishina.exe (Windows x64) из готовых *.html и ассетов APK. Запуск из корня репозитория.
set -e
W=$(mktemp -d); mkdir -p "$W/app"; cp desktop/main.js desktop/package.json "$W/app/"
python3 build.py && cp *.html android/app/src/main/assets/
cp -r android/app/src/main/assets "$W/app/game"          # музыка там есть только если положена локально
(cd "$W" && npx -y @electron/packager@18.3.6 app Tishina --platform=win32 --arch=x64 --electron-version=33.2.1 --out=out --overwrite)
mkdir -p dist && (cd "$W/out" && zip -qr -9 Tishina-win32.zip Tishina-win32-x64) && mv "$W/out/Tishina-win32.zip" dist/
echo "dist/Tishina-win32.zip"
