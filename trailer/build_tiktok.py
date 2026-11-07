#!/usr/bin/env python3
"""TikTok-версия трейлера «Тишина»: 15 с, 1080x1920. Запуск: python3 build_tiktok.py <исходное.mp4> <выход.mp4>"""
import subprocess, sys, os, tempfile, wave
import numpy as np
SRC, OUT = sys.argv[1], sys.argv[2]
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
FONT2 = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
W, H, FPS = 1080, 1920, 30
# (источник-начало, длительность, текст сверху, размер)
SEG = [
 (7.0, 1.6, 'ХОРРОР БЕЗ МОНСТРОВ', 84),
 (4.5, 1.4, 'БЕЗ СКРИМЕРОВ', 90),
 (2.0, 1.2, 'ТОЛЬКО ТЫ', 100),
 (10.0, 1.2, '', 0),
 (14.2, 2.0, 'ОНИ УШЛИ…', 100),
 (16.3, 2.0, 'А КОСТЁР ГОРИТ', 84),
 (18.5, 2.0, 'ПОЧЕМУ?', 110),
 (12.8, 0.33, '', 0), (19.5, 0.33, '', 0), (4.0, 0.34, '', 0),
 ('end', 2.6, '', 0),
]
starts = np.cumsum([0] + [s[1] for s in SEG]); TOTAL = float(starts[-1])
tmp = tempfile.mkdtemp()
GRADE = "eq=saturation=0.5:contrast=1.2:brightness=-0.07:gamma=0.92,colorbalance=bs=0.1:bm=0.05,unsharp=5:5:0.8,vignette=PI/3,noise=alls=9:allf=t"
def txt(t, size, d):
    if not t: return ''
    return (f",drawtext=fontfile={FONT}:text='{t}':fontsize={size}:fontcolor=white:borderw=4:bordercolor=black@0.85:"
            f"x=(w-text_w)/2:y=h*0.13:alpha='min(t/0.15,1)'")
parts = []
for i, (ss, d, t, size) in enumerate(SEG):
    o = os.path.join(tmp, f'{i:02d}.mp4')
    if ss == 'end':
        vf = ("noise=alls=8:allf=t"
              f",drawtext=fontfile={FONT}:text='ТИШИНА':fontsize=190:fontcolor=0xe8e2d0:x=(w-text_w)/2:y=h*0.30:alpha='min(t/0.4,1)'"
              f",drawtext=fontfile={FONT2}:text='Играй на Android':fontsize=62:fontcolor=white:x=(w-text_w)/2:y=h*0.46:alpha='if(lt(t,0.5),0,min((t-0.5)/0.3,1))'"
              f",drawtext=fontfile={FONT2}:text='и в браузере':fontsize=62:fontcolor=white:x=(w-text_w)/2:y=h*0.46+80:alpha='if(lt(t,0.7),0,min((t-0.7)/0.3,1))'"
              f",drawtext=fontfile={FONT2}:text='Сид 1 — все записки рядом':fontsize=48:fontcolor=0xd8c9a0:x=(w-text_w)/2:y=h*0.62:alpha='if(lt(t,1.1),0,min((t-1.1)/0.4,1))',fade=t=out:st={d-0.5}:d=0.5")
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-t', str(d), '-i', f'color=c=black:s={W}x{H}:r={FPS}', '-vf', vf]
    else:
        zoom = 1.0 + 0.12 * (d > 1)
        vf = (f"setpts=PTS-STARTPTS,fps={FPS},scale=-2:{int(H*zoom)},"
              f"crop={W}:{H}:x='(iw-{W})/2+({'-' if i%2 else ''}60)*(t/{d}-0.5)':y='(ih-{H})/2'," + GRADE + txt(t, size, d))
        if i == 0: vf += ',fade=t=in:d=0.2'
        cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', str(ss), '-t', str(d), '-i', SRC, '-vf', vf]
    cmd += ['-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-r', str(FPS), o]
    subprocess.run(cmd, check=True); parts.append(o)
lst = os.path.join(tmp, 'l.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
vid = os.path.join(tmp, 'v.mp4')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid], check=True)

# ---- звук ----
sr = 44100; n = int(TOTAL * sr); t = np.arange(n) / sr; rng = np.random.default_rng(3)
def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr); m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))
def place(sig, t0, amp=1.0):
    out = np.zeros(n); i0 = int(t0 * sr); j = min(n, i0 + len(sig)); out[i0:j] = sig[:j - i0] * amp; return out
def boom(length=1.2):
    k = np.arange(int(length * sr)) / sr
    return np.sin(2 * np.pi * (46 * np.exp(-k * 1.1) + 28) * k) * np.exp(-k * 3) + 0.4 * filt(rng.standard_normal(len(k)), 40, 600) * np.exp(-k * 7)
def thump():
    k = np.arange(int(0.3 * sr)) / sr
    return np.sin(2 * np.pi * (64 - 34 * k / 0.3) * k) * np.exp(-k * 15)
def bell(f):
    k = np.arange(int(3 * sr)) / sr
    return (np.sin(2*np.pi*f*k) + 0.4*np.sin(2*np.pi*f*2.01*k) + 0.2*np.sin(2*np.pi*f*3.99*k)) * np.exp(-k * 1.8)
endS = starts[-2]; riseEnd = starts[7]
wind = filt(rng.standard_normal(n), 80, 800) * 0.4
drone = sum(a * np.sin(2*np.pi*f*t) for f, a in [(55, 1), (55.6, .8), (82.4, .5), (116.5, .25)]) * (0.25 + 0.5 * np.clip(t / riseEnd, 0, 1) ** 1.5)
heart = np.zeros(n); tb, gap = 0.3, 0.8
while tb < riseEnd - 0.2:
    heart += place(thump(), tb) + place(thump(), tb + 0.2, 0.6); tb += gap; gap = max(0.5, gap - 0.04)
hits = sum(place(boom(), s, 0.9) for s in starts[:7]) + sum(place(boom(0.5), s, 1.0) for s in starts[7:10])
hits += place(boom(2.0), endS, 1.4)
rm = np.clip((t - 6.2) / (riseEnd - 6.2), 0, 1) * (t < riseEnd + 0.02)
riser = filt(rng.standard_normal(n), 700, 6000) * rm ** 2 * 0.8
mel = place(bell(440), endS + 0.2, 0.4) + place(bell(523.25), endS + 0.9, 0.35) + place(bell(329.63), endS + 1.6, 0.35)
sil = np.ones(n); sil[int(starts[7] * sr) - 1500:int(starts[7] * sr)] = 0.0  # крошечная пауза перед финальными вспышками
mix = (wind + drone * 0.4 + heart * 0.6 + hits * 0.6 + riser * 0.6 + mel * 0.5) * sil
mix *= np.clip(t / 0.15, 0, 1) * np.clip((TOTAL - t) / 0.8, 0, 1)
mix = mix / np.abs(mix).max() * 0.88; st = np.stack([mix, mix], 1)
wav = os.path.join(tmp, 'a.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype('<i2').tobytes())
aud = os.path.join(tmp, 'a.m4a')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'aecho=0.8:0.6:60|120:0.3|0.2,alimiter=limit=0.92,loudnorm=I=-14:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', aud], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', aud, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', OUT], check=True)
print('OK', OUT, round(TOTAL, 1), 's')
