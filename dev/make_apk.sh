#!/bin/bash
# Собирает отдельный DEV-APK (ru.volga.tishina.dev) рядом с основной игрой
set -e
cd "$(dirname "$0")/.."
python3 build.py >/dev/null && python3 dev/build_dev.py
B=dev/android-build; rm -rf $B; cp -r android $B; rm -rf $B/app/build $B/.gradle $B/build
sed -i "s/applicationId 'ru.volga.tishina'/applicationId 'ru.volga.tishina.dev'/" $B/app/build.gradle
sed -i 's/android:label="Тишина"/android:label="Тишина DEV"/' $B/app/src/main/AndroidManifest.xml
cp dev/assets/*.html $B/app/src/main/assets/
(cd $B && /opt/gradle/bin/gradle -q assembleDebug --offline >/dev/null 2>&1 || /opt/gradle/bin/gradle -q assembleDebug)
cp $B/app/build/outputs/apk/debug/app-debug.apk dist/Tishina-DEV.apk
ls -la dist/Tishina-DEV.apk
