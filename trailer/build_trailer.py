#!/usr/bin/env python3
"""Трейлер «Тишина»: монтаж из видео + оригинальный саундтрек (синтез, без чужой музыки).
Запуск: python3 build_trailer.py <исходное_видео.mp4> <выход.mp4>"""
import subprocess, sys, os, tempfile, wave
import numpy as np

SRC = sys.argv[1]; OUT = sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
FONT2 = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
URL = 'nlponae269.github.io/volga-issledovatell'
W, H, FPS = 1280, 720, 30

# (вид, источник/файл, начало, длительность, замедление, текст, подпись-размер)
SEG = [
 ('black', None, 0, 2.6, 1, 'ОСЕНЬ.', 80),
 ('vid', SRC, 7.0, 3.5, 1, 'ВОЛГА.', 80),
 ('vid', SRC, 4.2, 3.5, 1, 'ТИШИНА.', 80),
 ('vid', SRC, 2.0, 1.6, 1, '', 0),
 ('vid', SRC, 10.0, 1.4, 1, '', 0),
 ('vid', SRC, 12.3, 3.2, 1, 'ЗДЕСЬ БЫЛИ ЛЮДИ.', 54),
 ('vid', SRC, 14.2, 3.0, 1, '', 0),
 ('vid', SRC, 16.3, 3.0, 1, 'ОНИ УШЛИ.', 66),
 ('vid', SRC, 18.3, 3.6, 1, 'КОСТЁР ЕЩЁ ДЫМИТСЯ.', 54),
 ('vid', SRC, 20.3, 3.0, 1, 'А ТЫ СЛЫШИШЬ?', 66),
 ('black', None, 0, 1.3, 1, '', 0),
 ('vid', SRC, 2.0, 0.55, 1, '', 0), ('vid', SRC, 4.5, 0.55, 1, '', 0), ('vid', SRC, 10.5, 0.5, 1, '', 0),
 ('vid', SRC, 12.8, 0.55, 1, '', 0), ('vid', SRC, 15.0, 0.55, 1, '', 0), ('vid', SRC, 17.0, 0.5, 1, '', 0),
 ('vid', SRC, 19.0, 0.55, 1, '', 0), ('vid', SRC, 21.0, 0.55, 1, '', 0),
 ('black', None, 0, 0.7, 1, '', 0),
 ('img', os.path.join(HERE, 'game1.png'), 0, 3.2, 1, 'НЕТ МОНСТРОВ.', 60),
 ('img', os.path.join(HERE, 'game2.png'), 0, 3.2, 1, 'НЕТ СКРИМЕРОВ.', 60),
 ('title', None, 0, 4.4, 1, 'ТИШИНА', 120),
 ('end', None, 0, 4.0, 1, '', 0),
]
starts = np.cumsum([0] + [s[3] for s in SEG])
TOTAL = float(starts[-1])

tmp = tempfile.mkdtemp()
GRADE = ("eq=saturation=0.5:contrast=1.18:brightness=-0.07:gamma=0.92,"
         "colorbalance=bs=0.1:bm=0.05:rs=-0.04,vignette=PI/3.2,noise=alls=11:allf=t")
def text(t, size, dur, y='h*0.80', fs=FONT):
    if not t: return ''
    return (f",drawtext=fontfile={fs}:text='{t}':fontsize={size}:fontcolor=0xe8e2d0:x=(w-text_w)/2:y={y}:"
            f"alpha='if(lt(t,0.5),t/0.5,if(gt(t,{dur-0.5}),({dur}-t)/0.5,1))':shadowcolor=black@0.7:shadowx=2:shadowy=2")

parts = []
for i, (kind, f, ss, d, slow, t, size) in enumerate(SEG):
    o = os.path.join(tmp, f'{i:02d}.mp4')
    base = ['ffmpeg', '-v', 'error', '-y']
    if kind == 'vid':
        zoom = 1.12 if d > 1 else 1.3
        vf = (f"setpts=PTS-STARTPTS,fps={FPS},scale={int(W*zoom)}:-2,"
              f"crop={W}:{H}:x='(iw-{W})*t/{d}':y='(ih-{H})/2+({'-' if i%2 else ''}10)*t'," + GRADE + text(t, size, d))
        cmd = base + ['-ss', str(ss), '-t', str(d), '-i', f, '-vf', vf]
    elif kind == 'img':
        vf = (f"scale={int(W*1.25)}:-2,zoompan=z='1+0.0009*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(d*FPS)}:s={W}x{H}:fps={FPS},"
              + GRADE.replace('saturation=0.5', 'saturation=0.9') + text(t, size, d))
        cmd = base + ['-loop', '1', '-t', str(d), '-i', f, '-vf', vf]
    else:  # black / title / end
        cmd = base + ['-f', 'lavfi', '-t', str(d), '-i', f'color=c=black:s={W}x{H}:r={FPS}']
        if kind == 'black':
            vf = 'noise=alls=8:allf=t' + text(t, size, d, y='(h-text_h)/2')
        elif kind == 'title':
            vf = ('noise=alls=10:allf=t' + text(t, size, d, y='(h-text_h)/2-30')
                  + f",drawtext=fontfile={FONT2}:text='Хоррор без монстров. Только ты и лес.':fontsize=28:fontcolor=0xa8a392:x=(w-text_w)/2:y=h/2+60:"
                  f"alpha='if(lt(t,1.2),0,if(lt(t,2),(t-1.2)/0.8,if(gt(t,{d-0.5}),({d}-t)/0.5,1)))'")
        else:
            vf = ('noise=alls=8:allf=t'
                  f",drawtext=fontfile={FONT}:text='ИГРАЙ В БРАУЗЕРЕ':fontsize=46:fontcolor=0xe8e2d0:x=(w-text_w)/2:y=h/2-70:alpha='min(t/0.6,1)'"
                  f",drawtext=fontfile={FONT2}:text='{URL}':fontsize=34:fontcolor=0xd8c9a0:x=(w-text_w)/2:y=h/2+10:alpha='if(lt(t,0.8),0,min((t-0.8)/0.6,1))'"
                  f",drawtext=fontfile={FONT2}:text='ПК и телефон · Наушники обязательны':fontsize=24:fontcolor=0x908c7e:x=(w-text_w)/2:y=h/2+80:alpha='if(lt(t,1.4),0,min((t-1.4)/0.6,1))'")
        cmd += ['-vf', vf]
    # чёрные полосы (кинематограф) + плавные входы/выходы
    bars = f",drawbox=x=0:y=0:w=iw:h=62:color=black:t=fill,drawbox=x=0:y=ih-62:w=iw:h=62:color=black:t=fill"
    fade = ''
    if i in (0, 1, 2, 5, 7, 8, 9): fade = f",fade=t=in:d=0.35"
    if i in (9, 10, 18, 19, 20, 21): fade += f",fade=t=out:st={d-0.3}:d=0.3"
    if i == len(SEG)-1: fade += f",fade=t=out:st={d-0.8}:d=0.8"
    cmd[cmd.index('-vf')+1] += bars + fade
    cmd += ['-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), o]
    subprocess.run(cmd, check=True); parts.append(o)

lst = os.path.join(tmp, 'list.txt')
open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
vid = os.path.join(tmp, 'video.mp4')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid], check=True)

# ---------------- Саундтрек (синтез) ----------------
sr = 44100; n = int(TOTAL * sr); rng = np.random.default_rng(7)
t = np.arange(n) / sr
def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr); m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))
def env_at(t0, dur, a=0.01):
    e = np.zeros(n); i0 = int(t0 * sr); i1 = min(n, i0 + int(dur * sr))
    if i0 >= n: return e
    k = np.arange(i1 - i0) / sr
    e[i0:i1] = np.minimum(k / a, 1) * np.exp(-k * 5 / dur)
    return e
def stereo(x, pan=0.0): return np.stack([x * (1 - max(pan, 0)), x * (1 + min(pan, 0))], 1)

# ветер
wind = fft_filter(rng.standard_normal(n), 80, 900)
wind *= 0.35 + 0.25 * np.sin(t * 0.37) * np.sin(t * 0.11 + 1)
windR = fft_filter(rng.standard_normal(n), 80, 900) * (0.35 + 0.25 * np.sin(t * 0.31 + 2) * np.sin(t * 0.13))
# дрон: тревожный, растёт к концу монтажа
mont0 = starts[11]; mont1 = starts[19]
swell = np.clip(t / mont0, 0, 1) ** 1.6 * 0.6 + 0.12
drone = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in [(55, 1, 0), (55.5, .8, 1), (82.4, .5, 2), (110.4, .35, 3), (116.5, .22, 1)])
drone *= swell * (0.8 + 0.2 * np.sin(t * 0.5))
drone = fft_filter(drone, None, 900)
# тишина после «А ТЫ СЛЫШИШЬ?» и перед игрой
sil = np.ones(n)
for s0, s1 in [(starts[10], starts[11]), (starts[19], starts[20] + 0.0)]:
    i0, i1 = int(s0 * sr), int(s1 * sr); sil[i0:i1] = 0.02
sil = fft_filter(sil, None, 30) if False else sil
# сердцебиение
heart = np.zeros(n); tb = starts[5]; gap = 1.1
while tb < mont0 - 1.0:
    for off, amp in [(0, 1.0), (0.22, 0.65)]:
        tt = tb + off; i0 = int(tt * sr)
        k = np.arange(int(0.35 * sr)) / sr
        thump = np.sin(2 * np.pi * (62 - 30 * k / 0.35) * k) * np.exp(-k * 14) * amp
        j1 = min(n, i0 + len(k)); heart[i0:j1] += thump[:j1 - i0]
    tb += gap; gap = max(0.62, gap - 0.016)
# удары на склейках
def boom(t0, amp=1.0, length=1.8):
    k = np.arange(int(length * sr)) / sr
    b = np.sin(2 * np.pi * (48 * np.exp(-k * 0.9) + 26) * k) * np.exp(-k * 2.4)
    b += 0.5 * fft_filter(rng.standard_normal(len(k)), 40, 500) * np.exp(-k * 6)
    i0 = int(t0 * sr); out = np.zeros(n); j1 = min(n, i0 + len(k)); out[i0:j1] = (b * amp)[:j1 - i0]; return out
hits = np.zeros(n)
for idx, amp in [(1, .35), (2, .5), (3, .9), (5, .6), (7, .6), (8, .7), (9, .8), (10, 1.0), (11, 1.1), (20, .8), (22, 1.2)]:
    hits += boom(starts[idx], amp)
# ритм монтажа: удары на каждый кадр + хлопки
for i in range(11, 19): hits += boom(starts[i], 0.7, 0.5) + 0.25 * fft_filter(rng.standard_normal(n), 2500, 9000) * env_at(starts[i], 0.12)
# райзер перед монтажом
r0, r1 = starts[9] + 0.3, starts[10]
rm = np.clip((t - r0) / (r1 - r0), 0, 1) * (t >= r0) * (t < r1 + 0.05)
riser = fft_filter(rng.standard_normal(n), 600, 5000) * rm ** 2.2 * 0.7
chirp = np.sin(2 * np.pi * np.cumsum(180 * np.exp(rm * 2.4)) / sr) * rm ** 2 * 0.25 * (rm > 0)
# шкатулка-колокольчики (мелодия ля минор)
def bell(t0, f, amp=0.5):
    k = np.arange(int(3.5 * sr)) / sr
    b = (np.sin(2*np.pi*f*k) + 0.4*np.sin(2*np.pi*f*2.01*k) + 0.2*np.sin(2*np.pi*f*3.99*k)) * np.exp(-k * 1.8) * amp
    out = np.zeros(n); i0 = int(t0 * sr); j1 = min(n, i0 + len(k)); out[i0:j1] = b[:j1 - i0]; return out
mel = np.zeros(n); notes = [440, 523.25, 659.25, 587.33, 523.25, 493.88, 440, 392, 440, 329.63]
tt = starts[20] + 0.3
for k, f in enumerate(notes):
    mel += bell(tt, f, 0.28 if k < 6 else 0.22); tt += 0.9 if k < 8 else 1.1
mel += bell(starts[22] + 0.1, 220, 0.4) + bell(starts[22] + 0.1, 329.63, 0.25)
# финальный дрон
tail = np.sin(2*np.pi*55*t) * np.clip((t - starts[22]) / 2, 0, 1) * 0.5 * (t >= starts[22])
L = (wind * 0.5 + drone * 0.35 + heart * 0.55 + hits * 0.55 + riser * 0.6 + chirp * 0.5 + mel * 0.5 + tail * 0.3)
R = (windR * 0.5 + drone * 0.35 + heart * 0.55 + hits * 0.55 + riser * 0.6 + chirp * 0.5 + mel * 0.5 + tail * 0.3)
L *= sil; R *= sil
# fade in/out
fio = np.clip(t / 1.2, 0, 1) * np.clip((TOTAL - t) / 1.5, 0, 1)
L *= fio; R *= fio
m = max(np.abs(L).max(), np.abs(R).max()); st = np.stack([L, R], 1) / m * 0.85
wav = os.path.join(tmp, 'a.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype('<i2').tobytes())
aud = os.path.join(tmp, 'a.m4a')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'aecho=0.8:0.6:70|140:0.35|0.2,alimiter=limit=0.92,loudnorm=I=-16:TP=-1.5', '-c:a', 'aac', '-b:a', '192k', aud], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', aud, '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', OUT], check=True)
print('OK', OUT, round(TOTAL, 1), 's')
