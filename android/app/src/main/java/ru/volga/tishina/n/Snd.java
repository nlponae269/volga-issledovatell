package ru.volga.tishina.n;

import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.SoundPool;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

/** Звук: синтезатор в реальном времени (моторы, шум, удары, звонки) + записанные клипы через SoundPool. */
final class Snd implements Runnable {
    static final int SR = 22050;
    private AudioTrack at; private volatile boolean run = true; private Thread th;
    private final Random rnd = new Random();
    // непрерывные голоса: цели (меняются из игры), сглаживаются в потоке
    /** музыка «за стеной» (подъезд): громкость */
    volatile float partyG = 0;
    private float pg, pt, pk, pb, pph, pbph, plp; private int beat; private final float[] chph = new float[3];
    private static final float[][] CH = {{220, 277, 330}, {196, 247, 294}, {175, 220, 262}, {165, 208, 247}};
    volatile float motorF = 40, motorG = 0, whineF = 300, whineG = 0, noiseG = 0, noiseCut = 400, windG = 0;
    private float mf = 40, mg, wf = 300, wg, ng, nc = 400, wdg, mph, wph, lp1, lp2, wl1, wl2;
    interface Gen { /** возвращает false, когда звук кончился */ boolean next(float[] out, int n); }
    private final ArrayList<Gen> one = new ArrayList<>(), add = new ArrayList<>();
    private SoundPool sp; private final HashMap<String, Integer> clips = new HashMap<>(); private int lastStream;

    void start() {
        int min = AudioTrack.getMinBufferSize(SR, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
        at = new AudioTrack(AudioManager.STREAM_MUSIC, SR, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(min, 4096), AudioTrack.MODE_STREAM);
        at.play(); th = new Thread(this, "snd"); th.start();
        sp = new SoundPool.Builder().setMaxStreams(6).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).build()).build();
    }
    void stop() { run = false; try { if (th != null) th.join(300); } catch (Exception e) {} if (at != null) { at.stop(); at.release(); } if (sp != null) sp.release(); }
    void pause(boolean p) { if (at == null) return; if (p) at.pause(); else at.play(); if (sp != null) { if (p) sp.autoPause(); else sp.autoResume(); } }

    void load(String path) { try (AssetFileDescriptor fd = Tex.am.openFd(path)) { clips.put(path, sp.load(fd, 1)); } catch (Exception e) { } }
    boolean has(String path) { return clips.containsKey(path); }
    void clip(String path, float vol) { Integer id = clips.get(path); if (id == null) { load(path); id = clips.get(path); if (id == null) return; }
        if (lastStream != 0) sp.stop(lastStream); lastStream = sp.play(id, vol, vol, 1, 0, 1f); }
    void sfx(String path, float vol, float rate) { Integer id = clips.get(path); if (id == null) { load(path); return; } sp.play(id, vol, vol, 0, 0, rate); }

    void play(Gen g) { synchronized (add) { add.add(g); } }
    /** глухой удар (стык рельсов, дверь) */
    void thump(float v, float f, float d) { final float[] st = {0, 0, f}; play((o, n) -> { for (int i = 0; i < n; i++) { float t = st[0] / SR; if (t > d + 0.05f) return false; float e = (float) Math.exp(-t / (d * 0.35f));
        st[2] *= 0.99995f; st[1] += st[2] / SR; o[i] += (float) Math.sin(st[1] * 6.2832) * v * 0.6f * e + (rnd.nextFloat() * 2 - 1) * v * 0.3f * e * (t < 0.02f ? 1 : 0.3f); st[0]++; } return true; }); }
    /** шипение (двери, пневматика) */
    void hiss(float len, float v) { final float[] st = {0, 0}; play((o, n) -> { for (int i = 0; i < n; i++) { float t = st[0] / SR; if (t > len) return false; float e = Math.min(1, t * 20) * (float) Math.exp(-t / (len * 0.4f)); float w = rnd.nextFloat() * 2 - 1; st[1] = w - st[1] * 0.2f; o[i] += (w - st[1] * 0.6f) * v * e; st[0]++; } return true; }); }
    /** звонок трамвая: два удара */
    void bell() { for (float dt : new float[]{0, 0.32f}) { final float[] st = {-dt * SR}; play((o, n) -> { for (int i = 0; i < n; i++) { float t = st[0] / SR; st[0]++; if (t < 0) continue; if (t > 1.2f) return false; float e = (float) Math.exp(-t * 4);
        o[i] += ((float) Math.sin(t * 1180 * 6.2832) * 0.16f + (float) Math.sin(t * 2770 * 6.2832) * 0.06f + (float) Math.sin(t * 4100 * 6.2832) * 0.03f) * e; } return true; }); } }
    /** «дзинь-дон» перед объявлением */
    void chime() { float[][] nt = {{784, 0}, {622, 0.38f}}; for (float[] q : nt) { final float f = q[0], d0 = q[1]; final float[] st = {-d0 * SR}; play((o, n) -> { for (int i = 0; i < n; i++) { float t = st[0] / SR; st[0]++; if (t < 0) continue; if (t > 1f) return false;
        o[i] += (float) Math.sin(t * f * 6.2832) * 0.13f * Math.min(1, t * 50) * (float) Math.exp(-t * 3.5); } return true; }); } }
    /** тон с затуханием (лифт, писк) */
    void tone(float f, float len, float v) { final float[] st = {0}; play((o, n) -> { for (int i = 0; i < n; i++) { float t = st[0] / SR; st[0]++; if (t > len) return false; o[i] += (float) Math.sin(t * f * 6.2832) * v * Math.min(1, t * 80) * Math.min(1, (len - t) * 20); } return true; }); }
    /** шум с полосой (шаги, шорох): длина, громкость, «яркость» 0..1 */
    void noise(float len, float v, float bright) { final float[] st = {0, 0}; play((o, n) -> { for (int i = 0; i < n; i++) { float t = st[0] / SR; st[0]++; if (t > len) return false; float w = rnd.nextFloat() * 2 - 1; st[1] += (w - st[1]) * bright; o[i] += st[1] * v * (float) Math.exp(-t / (len * 0.3f)); } return true; }); }

    @Override public void run() {
        final int N = 512; short[] buf = new short[N]; float[] mix = new float[N];
        while (run) {
            java.util.Arrays.fill(mix, 0);
            synchronized (add) { one.addAll(add); add.clear(); }
            for (int i = one.size() - 1; i >= 0; i--) if (!one.get(i).next(mix, N)) one.remove(i);
            for (int i = 0; i < N; i++) {
                mf += (motorF - mf) * 0.0008f; mg += (motorG - mg) * 0.0008f; wf += (whineF - wf) * 0.0008f; wg += (whineG - wg) * 0.0008f; ng += (noiseG - ng) * 0.0008f; nc += (noiseCut - nc) * 0.0008f; wdg += (windG - wdg) * 0.0005f;
                mph += mf / SR; if (mph > 1) mph -= 1; wph += wf / SR; if (wph > 1) wph -= 1;
                float saw = mph * 2 - 1; lp1 += (saw - lp1) * 0.08f;
                float wn = rnd.nextFloat() * 2 - 1; float a = Math.min(0.9f, nc / SR * 6.28f); lp2 += (wn - lp2) * a; wl1 += (wn - wl1) * 0.004f; wl2 += (wl1 - wl2) * 0.02f;
                mix[i] += lp1 * mg + (float) Math.sin(wph * 6.2832) * wg + lp2 * ng * 2.5f + wl2 * wdg * 30f;
                pg += (partyG - pg) * 0.0005f;
                if (pg > 0.002f) { pt += 1f / SR; if (pt >= 0.47f) { pt -= 0.47f; beat++; pph = 0; }
                    float kf = 42 + 78 * (float) Math.exp(-pt / 0.06f); pph += kf / SR; float kick = (float) Math.sin(pph * 6.2832) * (float) Math.exp(-pt / 0.08f);
                    float bass = 0; if (beat % 2 == 1) { pbph += CH[(beat / 8) % 4][0] / 2 / SR; bass = (Math.abs((pbph % 1) * 4 - 2) - 1) * 0.35f * (float) Math.exp(-pt / 0.07f); }
                    float ch = 0; int ci = (beat / 8) % 4; float ct = (beat % 8) * 0.47f + pt; if (ct < 3.6f) for (int q = 0; q < 3; q++) { chph[q] += CH[ci][q] / SR; if (chph[q] > 1) chph[q] -= 1; ch += (chph[q] * 2 - 1) * 0.07f * Math.min(1, ct * 16) * Math.min(1, (3.8f - ct) * 2.5f); }
                    float pm = kick + bass + ch; plp += (pm - plp) * 0.1f; mix[i] += plp * pg; }
                float s = mix[i]; s = s / (1 + Math.abs(s) * 0.6f);
                buf[i] = (short) (Math.max(-1, Math.min(1, s)) * 30000);
            }
            at.write(buf, 0, N);
        }
    }
}
