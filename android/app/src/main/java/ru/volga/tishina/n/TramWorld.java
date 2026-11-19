package ru.volga.tishina.n;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Typeface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Random;

/** Мир «ТРАМ𒀱Й»: скоростной трамвай, остановки с диктором, пересадки на наземный транспорт, карта. */
final class TramWorld extends World {
    static final String[] NAMES = {"Площадь Ленина", "Комсомольская", "Пионерская", "Центральный стадион", "Мамаев курган", "Тракторный завод", "Улица Огарёва", "Профсоюзная", "Медицинский университет", "Дворец спорта", "Посёлок ГЭС", "Улица Героев Тулы", "Школа № 87", "415-й микрорайон", "Универсам", "Поликлиника", "Кинотеатр «Ударник»", "Красный Октябрь", "Ельшанка", "Хлебозавод", "Речной вокзал", "Центральный рынок", "Улица Землячки", "Библиотека", "Детский парк", "Депо", "Гаражи", "Больничный городок", "Площадь Чекистов", "Улица Мира", "Пятый квартал", "Почта", "Дом быта", "Остановка по требованию", "Квартира сорок семь", "Тишина"};
    static final int NORMAL = 34; static final float STEP = 560, SEG = 40;
    static final float PX0 = 1.3f, PX1 = 5.2f, PY = 0.32f, PHALF = 26, SWX0 = -5.95f, SWX1 = -2f, SWY = 0.12f, R = 0.24f;
    final Random rnd = new Random();
    static int rawIdx(int k) { Rng r = new Rng(k * (int) 2654435761L + 17); float a = r.f(); if (a < 0.05f) return NORMAL + (int) (r.f() * 2); return (int) (r.f() * NORMAL); }
    static int nameIdx(int k) { if (k == 0) return 11; int i = rawIdx(k); if (i == rawIdx(k - 1)) i = (i + 3) % NORMAL; return i; }
    final HashMap<Integer, Integer> NI = new HashMap<>();
    int nIdx(int k) { Integer v = NI.get(k); if (v == null) { v = nameIdx(k); NI.put(k, v); } return v; }
    int rIdx(int j) { return j % 2 == 0 ? nIdx(j / 2) : nIdx(50000 + j); }
    static float stS(int k) { return k * STEP; }
    static float sB(int j) { return j * STEP / 2; }

    // ---------- транспорт ----------
    static final class Spec { String name, shrt; float L, W, fy, H, dw, vmax; float[] doors; int body, stripe, seat, seatB, floor, wall, col; boolean voice, demand, poles, glow, tram; float[] eng; String[] stick; }
    static Spec spec(String name, String sh, float L, float W, float fy, float H, float[] doors, float dw, int body, int stripe, int seat, int seatB, int floor, int wall, float vmax, boolean voice, float[] eng, int col, String[] st) {
        Spec s = new Spec(); s.name = name; s.shrt = sh; s.L = L; s.W = W; s.fy = fy; s.H = H; s.doors = doors; s.dw = dw; s.body = body; s.stripe = stripe; s.seat = seat; s.seatB = seatB; s.floor = floor; s.wall = wall; s.vmax = vmax; s.voice = voice; s.eng = eng; s.col = col; s.stick = st; return s; }
    final Spec TR = spec("СТ · маршрут 𒀱", "СТ", 30, 2.5f, 0.35f, 2.3f, new float[]{-11.2f, -4.6f, 4.6f, 11.2f}, 1.4f, 0xd8d4c8, 0xb02a22, 0x3e5276, 0x30405e, 0x2e2c2a, 0xb8b2a2, 13.5f, true, new float[]{32, 4.5f, 220, 52, 0, 0.05f}, 0xffff8a20, new String[]{"НЕ ПРИСЛОНЯТЬСЯ", "МЕТРОЭЛЕКТРОТРАНС", "ПРОЕЗД 35 ₽ · ОПЛАТА КАРТОЙ", "РЖД · ПРИГОРОД · ЕДЕМ ДОМОЙ"});
    final Spec[] RT = {
        spec("Маршрутка № 93с", "93с", 6.2f, 2.05f, 0.62f, 1.72f, new float[]{-0.4f}, 1.15f, 0xe8c020, 0x222222, 0x2a2a2a, 0x8a2a1a, 0x2a2826, 0xcfc8b8, 15, false, new float[]{70, 7, 0, 0, 0.06f, 0.06f}, 0xffffd23a, new String[]{"ОПЛАТА ПРИ ВХОДЕ · 45 ₽", "ДЕНЬГИ ПЕРЕДАЁМ ВОДИТЕЛЮ", "ОСТАНОВКИ ПО ТРЕБОВАНИЮ"}),
        spec("Троллейбус № 10", "10", 12, 2.5f, 0.4f, 2.15f, new float[]{-4.3f, 0.4f, 4.4f}, 1.25f, 0x2a6ab0, 0xe8e8e8, 0x7a3a22, 0x6a2e1a, 0x3a3632, 0xc8c8b8, 11, true, new float[]{30, 3, 300, 70, 0.02f, 0.03f}, 0xff3a8ae0, new String[]{"ТРОЛЛЕЙБУС № 10", "ПРОЕЗД 35 ₽", "НЕ ПРИСЛОНЯТЬСЯ"}),
        spec("Автобус № 55 (старый)", "55", 10.8f, 2.5f, 0.8f, 1.95f, new float[]{-3.9f, 3.5f}, 1.0f, 0xd8b040, 0xb02a1a, 0x5a2a1a, 0x4a2216, 0x3a3028, 0xb8a888, 10, false, new float[]{36, 5, 0, 0, 0.1f, 0.09f}, 0xffc8a040, new String[]{"КОНДУКТОР · ПРОЕЗД 30 ₽", "ПО ВСЕМ ВОПРОСАМ — К ВОДИТЕЛЮ", "НЕ КУРИТЬ"}),
        spec("Автобус № 77", "77", 12, 2.55f, 0.36f, 2.2f, new float[]{-4.6f, 0.5f, 4.7f}, 1.25f, 0xeeeeea, 0x2a9a4a, 0x2a4a8a, 0x223e74, 0x3a3a3c, 0xdcdcd4, 12, true, new float[]{45, 4, 0, 0, 0.05f, 0.05f}, 0xff2aa050, new String[]{"ОПЛАТА КАРТОЙ · 35 ₽", "ВЫХОД ВО ВСЕ ДВЕРИ", "МЕСТА ДЛЯ ПАССАЖИРОВ С ДЕТЬМИ"}),
        spec("Электробус Э1", "Э1", 12, 2.55f, 0.36f, 2.25f, new float[]{-4.6f, 0.5f, 4.7f}, 1.25f, 0xf2f2f0, 0x1aa8d8, 0x5a6068, 0x4a5058, 0x2e3034, 0xe4e6e8, 12.5f, true, new float[]{20, 0, 420, 90, 0, 0}, 0xff2ac0e8, new String[]{"ЭЛЕКТРОБУС · USB У КАЖДОГО КРЕСЛА", "ОПЛАТА КАРТОЙ И QR", "ТИХО ЕДЕМ"}),
    };
    { RT[0].demand = true; RT[1].poles = true; RT[4].glow = true; TR.tram = true; }
    static final class Seat { float x, z, w; Seat(float x, float z, float w) { this.x = x; this.z = z; this.w = w; } }
    static final class Pax { Obj body, head; Seat s; float px; }
    final class Veh {
        Spec sp; Group g = new Group(); float s, v, x, t, door; int next, at; String state = "run"; boolean rv, req, told, said, extra;
        final ArrayList<Seat> seats = new ArrayList<>(); final ArrayList<Obj[]> doors = new ArrayList<>(); final ArrayList<Pax> pax = new ArrayList<>(); final ArrayList<Light> lights = new ArrayList<>();
        int ledTex; Bitmap ledBm; Canvas ledC; String ledText = ""; float ledOff, ledT, joint;
    }
    Veh tram; final ArrayList<Veh> rvs = new ArrayList<>(); float rvTimer = 5;

    // ---------- материалы ----------
    Mat mGround, mGrass, mRoad, mPlat, mCurb, mRail, mSleeper, mBed, mPole, mWire, mYel, mDark, mTree, mTrunk, mFloor, mWallIn, mCeil, mFrame, mRubber, mHand, mLamp, mGlass, mSkin, mComp, mPanel, mDarkBox, mLine, mPoolO, mBench, mRoof, mUrn, mKiosk;
    Mat[] mCoat, mShops;
    final Spr dummy = null;

    // ---------- игрок ----------
    boolean on = true; Veh in = null; float lx = 0.2f, lz = 13.6f, px, pz, py, bob, bump; Seat sitS; float sitX; Veh sitV;
    boolean leaving, warned; float clkT;
    String pendClip; float pendT = -1;

    @Override String[] buttons() { return new String[]{"E", "🗺"}; }

    @Override void init() {
        e.fogD = 0.011f; e.col3(e.fogC, 0x242a38, 1); e.col3(e.clear, 0x242a38, 1);
        e.col3(e.sky, 0x52607e, 0.55f); e.col3(e.gnd, 0x2a2018, 0.55f); e.col3(e.dirC, 0xffb080, 0.35f); e.dirD = new float[]{30, -12, 40}; e.exposure = 1.25f;
        e.skyDome(new int[]{0xff0b1020, 0xff1f2a44, 0xff4a4a5a, 0xff7a5a48, 0xff2a2a30, 0xff14161a}, new float[]{0, 0.4f, 0.55f, 0.62f, 0.7f, 1});
        mGround = Mat.c(0x4a4844).tex(Tex.file("res/tex/brown_mud_dry_diff.jpg")); mGrass = Mat.c(0x6a6a58).tex(Tex.file("res/tex/withered_grass_diff.jpg")); mRoad = Mat.c(0x7a7a80).tex(Tex.file("res/tex/asphalt_02_diff.jpg")).spec(0.25f);
        mPlat = Mat.c(0x9a9a96).tex(Tex.file("res/tex/concrete_floor_worn_001_diff.jpg")); mCurb = Mat.c(0xa8a8a0).tex(Tex.file("res/tex/chipped_concrete_diff.jpg"));
        mRail = Mat.c(0x8a8a90).spec(0.6f); mSleeper = Mat.c(0x3a3630); mBed = Mat.c(0x2a2826); mPole = Mat.c(0x5a6066); mWire = Mat.c(0x15171a); mYel = Mat.c(0xe0b020); mDark = Mat.c(0x16181c); mTree = Mat.c(0x1c2016); mTrunk = Mat.c(0x2a241e);
        mFloor = Mat.c(0x2e2c2a); mWallIn = Mat.c(0xd8d2c0); mCeil = Mat.c(0xe8e4d8); mFrame = Mat.c(0x8a8e90).spec(0.3f); mRubber = Mat.c(0x101010); mHand = Mat.c(0xf0c020).spec(0.5f); mLamp = Mat.unlit(0xfff2d8);
        mGlass = Mat.c(0x8aa0b8).alpha(0.16f).spec(0.8f); mSkin = Mat.c(0xd8a888); mComp = Mat.c(0xd02818); mDarkBox = Mat.c(0x1a1c20); mLine = Mat.c(0xcfcfc6); mBench = Mat.c(0x6a4a2a); mRoof = Mat.c(0x404850); mUrn = Mat.c(0x2a5a30); mKiosk = Mat.c(0x2a4a6a);
        mPoolO = Mat.unlit(0xff9a40).add().tex(Tex.star()); mPoolO.a = 0.35f; mPoolO.noFog = false;
        int pt = Tex.file("res/tex/drv/panel.jpg"); mPanel = Mat.c(0x777777).tex(pt).emis(0x000000, 0); mPanel.unlit = false;
        mPanel.er = 0; // окна светятся через «unlit» копию ниже
        mPanel = Mat.unlit(0x9a9a9a).tex(pt);
        mCoat = new Mat[]{Mat.c(0x23262c), Mat.c(0x3a2c24), Mat.c(0x2a3240), Mat.c(0x4a3a40), Mat.c(0x30302a)};
        String[] sh = {"shop_produkty", "shop_apteka", "shop_cvety", "shop_super"}; mShops = new Mat[sh.length];
        for (int i = 0; i < sh.length; i++) mShops[i] = Mat.unlit(0xdddddd).tex(Tex.file("res/tex/drv/" + sh[i] + ".jpg"));
        for (int i = 0; i < NAMES.length; i++) { snd.load("res/snd/tram/next" + i + ".mp3"); snd.load("res/snd/tram/stop" + i + ".mp3"); }
        for (int i = 0; i < 4; i++) snd.load("res/snd/tram/x" + i + ".mp3");
        tram = buildVeh(TR); tram.state = "stop"; tram.next = 1; tram.x = 0; e.groups.add(tram.g);
        shufflePax(tram);
        stream(0);
        g.yaw = 0; g.pitch = -0.05f;
        g.toast(NAMES[nIdx(0)], 2200); g.hud("ноябрь · 17:12\nСТ · маршрут 𒀱 · в салоне");
        ledSet(tram, "ОСТАНОВКА: " + NAMES[nIdx(0)].toUpperCase());
    }

    // ---------- сегменты по 40 м ----------
    final class Seg { Group g; final ArrayList<Group> cars = new ArrayList<>(); final ArrayList<float[]> carV = new ArrayList<>(); final ArrayList<Light> lights = new ArrayList<>(); }
    final HashMap<Integer, Seg> segs = new HashMap<>();
    int stationOf(int k) { float s0 = k * SEG; int st = Math.round((s0 + SEG / 2) / STEP); float c = stS(st); return c > s0 - PHALF && c < s0 + SEG + PHALF ? st : -1; }
    Seg buildSeg(int k) {
        Seg sg = new Seg(); Group g = new Group(); sg.g = g; Rng r = new Rng(k * 97 + 5); float z0 = -k * SEG, zc = z0 - SEG / 2; int st = stationOf(k);
        g.mb(mGround, 6).floor(0, 0, zc, 140, SEG); g.mb(mGrass, 5).floor(9, 0.006f, zc, 10, SEG); g.mb(mGrass, 5).floor(-24, 0.006f, zc, 10, SEG);
        for (float x : new float[]{-0.76f, 0.76f}) g.box(mRail, x, 0.09f, zc, 0.07f, 0.14f, SEG);
        for (int i = 0; i < 54; i++) g.box(mSleeper, 0, 0.03f, z0 - i * 0.74f, 2.4f, 0.08f, 0.24f);
        g.box(mBed, 0, 0.012f, zc, 3, 0.02f, SEG);
        g.mb(mRoad, 6).floor(-12, 0.01f, zc, 12, SEG); g.box(mCurb, -5.9f, 0.08f, zc, 0.25f, 0.16f, SEG); g.box(mCurb, -18.1f, 0.08f, zc, 0.25f, 0.16f, SEG);
        for (int i = 0; i < 4; i++) g.box(mLine, -12, 0.015f, z0 - 4 - i * 10, 0.14f, 0.01f, 4);
        g.mb(mPlat, 3).box((SWX0 + SWX1) / 2, SWY / 2, zc, SWX1 - SWX0, SWY, SEG);
        float pz = z0 - 20; float ex = st >= 0 ? 3 : 0;
        g.cyl(mPole, -2.9f, 3.4f, pz, 0.12f, 6.8f); g.cyl(mPole, 2.9f + ex, 3.4f, pz, 0.12f, 6.8f);
        g.box(mPole, 0.05f + ex / 2, 6.55f, pz, 5.8f + ex, 0.05f, 0.05f); g.box(mPole, -5.45f, 6.0f, pz, 5.1f, 0.05f, 0.05f);
        g.box(mWire, 0, 6.08f, zc, 0.02f, 0.02f, SEG); g.box(mWire, 0, 6.45f, zc, 0.015f, 0.015f, SEG);
        for (float wx : new float[]{-7.15f, -7.75f}) g.box(mWire, wx, 5.95f, zc, 0.02f, 0.02f, SEG);
        for (float lz : new float[]{z0 - 8, z0 - 28}) { g.cyl(mPole, -6.4f, 4, lz, 0.08f, 8); g.box(mPole, -7.3f, 7.9f, lz, 1.8f, 0.08f, 0.1f); g.spr(new Spr(-8.1f, 7.75f, lz, 2.6f, 0xffa64a, 0.9f));
            g.mb(mPoolO).floor(-8.1f, 0.02f, lz, 9, 9); Light L = new Light(-8.1f, 7.2f, lz, 0xff9a40, 1.6f, 16); sg.lights.add(L); }
        for (int i = 0; i < 6; i++) { float x = (r.f() < 0.5f ? 1 : -1) * (r.f() < 0.5f ? 7 + r.f() * 5 : 20 + r.f() * 6); float z = z0 - r.f() * SEG, h = 5 + r.f() * 6; if (x > 0 && x < 9 && st >= 0) continue;
            g.cyl(mTrunk, x, h * 0.35f, z, 0.12f, h * 0.7f); g.mb(mTree).sphere(x, h * 0.75f, z, 2.5f + r.f() * 2, h * 0.55f, 2.5f + r.f() * 2); }
        for (int side : new int[]{1, -1}) { float x = side > 0 ? 26 + r.f() * 10 : -30 - r.f() * 8; float h = r.f() < 0.6f ? 26 : 14 + r.f() * 4; float len = 30 + r.f() * 8;
            MB pm = g.mb(mPanel); pm.tile = 0; float ry = (float) (side > 0 ? -Math.PI / 2 : Math.PI / 2);
            // окна: повтор текстуры по размеру фасада (15 × 8.4 м на повтор)
            int base = pm.n; pm.plane(x, h / 2, zc, len, h, ry, 0); for (int q = base; q < pm.n; q += 8) { pm.d[q + 6] *= len / 15f; pm.d[q + 7] *= h / 8.4f; }
            g.box(mDarkBox, x + side * 6, h / 2, zc, 12, h, len);
            if (r.f() < 0.45f) g.mb(mShops[r.i(mShops.length)]).plane(x - side * 0.05f, 1.8f, zc + (r.f() - 0.5f) * 14, 9, 3.2f, ry, 0); }
        for (int i = 0; i < 2; i++) { int dir = r.f() < 0.5f ? 1 : -1; Group c = new Group(); int[] cols = {0xd0d0d0, 0x2a2a2e, 0x8a1a1a, 0x6a7a8a};
            c.box(Mat.c(cols[r.i(4)]), 0, 0.75f, 0, 1.8f, 0.8f, 4.2f); c.box(mDark, 0, 1.35f, 0.2f, 1.6f, 0.5f, 2.2f);
            for (float sx : new float[]{-0.65f, 0.65f}) { c.spr(new Spr(sx, 0.75f, -2.15f, 1.4f, 0xfff4e0, 1)); c.spr(new Spr(sx, 0.8f, 2.15f, 0.7f, 0xff3020, 0.9f)); }
            c.x = dir > 0 ? -10.6f : -14.8f; c.z = z0 - r.f() * SEG; c.ry = dir > 0 ? 0 : (float) Math.PI; c.done(); sg.cars.add(c); sg.carV.add(new float[]{(dir > 0 ? -1 : 1) * (9 + r.f() * 6), z0}); }
        // остановки наземного транспорта
        for (int j = (int) Math.ceil(k * SEG / (STEP / 2)); sB(j) < k * SEG + SEG; j++) { float c = -sB(j);
            for (float dz : new float[]{-2.4f, 2.4f}) for (float dx : new float[]{-5.5f, -3.3f}) g.cyl(mFrame, dx, SWY + 1.25f, c + dz, 0.05f, 2.5f);
            g.box(mRoof, -4.4f, SWY + 2.55f, c, 2.6f, 0.08f, 5.4f); g.box(mGlass, -3.25f, SWY + 1.35f, c, 0.03f, 2.1f, 4.8f); g.box(mBench, -3.6f, SWY + 0.45f, c, 0.42f, 0.06f, 3.6f);
            Mat sm = Mat.unlit(0xffffff).tex(Tex.text(NAMES[rIdx(j)], 0xf2f2f2, 0x1d4fa8, 1024, 192, 92)).two(); g.mb(sm).plane(-4.4f, SWY + 2.9f, c, 3.6f, 0.66f, (float) -Math.PI / 2, 0);
            g.cyl(mPole, -5.6f, SWY + 1.4f, c - 4.2f, 0.05f, 2.8f);
            Mat rm = Mat.unlit(0xffffff).tex(Tex.text("А · Т · 10 55 77 Э1 93с", 0xffd23a, 0x111111, 768, 160, 64)).two(); g.mb(rm).plane(-5.6f, SWY + 2.6f, c - 4.2f, 1.1f, 0.24f, (float) -Math.PI / 2, 0);
            g.spr(new Spr(-4.4f, SWY + 2.4f, c, 1.6f, 0xe8eeff, 0.8f)); sg.lights.add(new Light(-4.4f, SWY + 2.3f, c, 0xe8eeff, 0.9f, 8)); }
        // станция СТ
        if (st >= 0) { float c = -stS(st); float a = Math.max(c - PHALF, z0 - SEG), b = Math.min(c + PHALF, z0);
            if (b > a) { g.mb(mPlat, 3).box((PX0 + PX1) / 2, PY / 2, (a + b) / 2, PX1 - PX0, PY, b - a); g.box(mYel, PX0 + 0.15f, PY + 0.004f, (a + b) / 2, 0.18f, 0.01f, b - a); }
            if (c <= z0 && c > z0 - SEG) {
                Mat sm = Mat.unlit(0xffffff).tex(Tex.text(NAMES[nIdx(st)], 0x1d4fa8, 0xffffff, 1024, 192, 92)).two();
                for (float dz : new float[]{-4, 4}) for (float dx : new float[]{3.2f, 5.0f}) g.cyl(mFrame, dx, PY + 1.3f, c + dz, 0.05f, 2.6f);
                g.box(mRoof, 4.1f, PY + 2.65f, c, 2.6f, 0.08f, 9); g.box(mGlass, 5.05f, PY + 1.4f, c, 0.03f, 2.2f, 8);
                g.box(mBench, 4.6f, PY + 0.45f, c, 0.45f, 0.06f, 5); g.mb(sm).plane(4.1f, PY + 3.05f, c, 4.6f, 0.86f, (float) Math.PI / 2, 0);
                Mat tr = Mat.unlit(0xffffff).tex(Tex.text("← пересадка: автобус · троллейбус · маршрутка (через пути)", 0x1d4fa8, 0xffffff, 1400, 150, 60)).two(); g.mb(tr).plane(5.0f, PY + 2.2f, c, 4.6f, 0.5f, (float) -Math.PI / 2, 0);
                Mat tm = Mat.unlit(0xffffff).tex(Tex.text("Т", 0xffffff, 0xcc2222, 192, 192, 140)).two();
                for (float dz : new float[]{-14, 14}) { g.cyl(mPole, 4.6f, PY + 1.4f, c + dz, 0.05f, 2.8f); g.mb(tm).plane(4.6f, PY + 2.6f, c + dz, 0.55f, 0.55f, (float) Math.PI / 2, 0); }
                for (float dz : new float[]{-12, 0, 12}) { g.cyl(mPole, 5.0f, PY + 2.5f, c + dz + 6, 0.06f, 5); g.spr(new Spr(4.6f, PY + 4.9f, c + dz + 6, 2.2f, 0xe8eeff, 0.8f)); }
                sg.lights.add(new Light(4.4f, PY + 4.4f, c, 0xe8eeff, 1.4f, 18));
                g.cyl(mUrn, 4.8f, PY + 0.35f, c + 5.4f, 0.22f, 0.7f);
                if (st % 3 != 1) { float kz = c - 9; g.box(mKiosk, 4.2f, PY + 1.2f, kz, 1.8f, 2.4f, 2.6f); Mat km = Mat.unlit(0xffffff).tex(Tex.text("ПЕЧАТЬ", 0xe8d8a0, 0x222233, 512, 128, 70)); g.mb(km).plane(3.29f, PY + 2.1f, kz, 2.4f, 0.5f, (float) -Math.PI / 2, 0); g.mb(Mat.unlit(0xffe0a0)).plane(3.29f, PY + 1.1f, kz, 1.6f, 1.0f, (float) -Math.PI / 2, 0); }
            } }
        g.done(); e.groups.add(g); for (Group c : sg.cars) e.groups.add(c); e.lights.addAll(sg.lights); return sg;
    }
    void freeSeg(Seg sg) { e.groups.remove(sg.g); sg.g.free(); for (Group c : sg.cars) { e.groups.remove(c); c.free(); } e.lights.removeAll(sg.lights); }
    void stream(float s) { int k0 = (int) Math.floor(s / SEG); for (int k = k0 - 4; k <= k0 + 9; k++) if (!segs.containsKey(k)) segs.put(k, buildSeg(k));
        Iterator<Map.Entry<Integer, Seg>> it = segs.entrySet().iterator(); while (it.hasNext()) { Map.Entry<Integer, Seg> en = it.next(); if (en.getKey() < k0 - 6 || en.getKey() > k0 + 12) { freeSeg(en.getValue()); it.remove(); } } }

    // ---------- постройка вагона / автобуса ----------
    Veh buildVeh(Spec T) {
        Veh V = new Veh(); V.sp = T; V.rv = !T.tram; Group g = V.g; float L = T.L, W = T.W, hw = W / 2, fy = T.fy, H = T.H;
        Mat body = Mat.c(T.body).spec(0.3f), stripe = Mat.c(T.stripe), wall = Mat.c(T.wall), seat = Mat.c(T.seat), seatB = Mat.c(T.seatB), floor = Mat.c(T.floor);
        if (fy > 0.2f) g.box(body, 0, (0.05f + fy - 0.06f) / 2, 0, W, fy - 0.12f, L);
        g.box(floor, 0, fy - 0.05f, 0, W - 0.08f, 0.1f, L - 0.1f);
        g.box(mCeil, 0, fy + H + 0.08f, 0, W + 0.02f, 0.16f, L);
        for (int sx : new int[]{-1, 1}) { float x = sx * (hw - 0.04f); ArrayList<float[]> gaps = new ArrayList<>(); if (sx > 0) for (float d : T.doors) gaps.add(new float[]{d, T.dw}); if (T.tram) gaps.add(new float[]{0, 1.2f});
            gaps.sort((p, q) -> Float.compare(p[0], q[0])); float a = -L / 2 + 0.05f; ArrayList<float[]> parts = new ArrayList<>(); for (float[] gp : gaps) { parts.add(new float[]{a, gp[0] - gp[1] / 2}); a = gp[0] + gp[1] / 2; } parts.add(new float[]{a, L / 2 - 0.05f});
            for (float[] pr : parts) { float p0 = pr[0], p1 = pr[1]; if (p1 - p0 < 0.05f) continue; float zz = (p0 + p1) / 2, ln = p1 - p0;
                g.box(wall, x, fy + 0.43f, zz, 0.06f, 0.86f, ln); g.box(body, x + sx * 0.04f, fy + 0.43f, zz, 0.01f, 0.86f, ln); g.box(stripe, x + sx * 0.05f, fy + 0.66f, zz, 0.01f, 0.14f, ln);
                g.box(T.tram ? mWallIn : wall, x, fy + H - 0.17f, zz, 0.06f, 0.34f, ln); g.box(body, x + sx * 0.04f, fy + H - 0.17f, zz, 0.01f, 0.34f, ln);
                int nP = Math.max(1, Math.round(ln / 1.5f)); for (int i = 0; i <= nP; i++) g.box(T.tram ? mFrame : body, x, fy + 0.86f + (H - 1.2f) / 2, p0 + ln * i / nP, 0.07f, H - 1.2f, 0.07f);
                g.box(mGlass, x + sx * 0.02f, fy + 0.86f + (H - 1.2f) / 2, zz, 0.02f, H - 1.2f, ln); }
            g.mb(mHand).cyl(sx * (T.tram ? 0.7f : 0.55f), fy + 1.9f, 0.3f, 0.017f, 0.017f, L - 2.5f, (float) Math.PI / 2, 0, 8); }
        // торцы
        g.box(body, 0, fy + 0.4f, -L / 2 + 0.03f, W, 0.9f, 0.06f); g.box(mGlass, 0, fy + 0.85f + (H - 0.85f) / 2, -L / 2 + 0.02f, W - 0.1f, H - 0.9f, 0.03f);
        g.box(body, 0, fy + 0.5f, L / 2 - 0.03f, W, 1.0f, 0.06f); g.box(mGlass, 0, fy + 1.0f + (H - 1.0f) / 2, L / 2 - 0.03f, W - 0.4f, H - 1.1f, 0.03f);
        // водитель
        float dx = T.tram ? -0.3f : -hw + 0.55f, dz = T.tram ? -L / 2 + 0.85f : -L / 2 + 0.9f;
        g.box(mCoat[rnd.nextInt(5)], dx, fy + 0.95f, dz, 0.5f, 0.65f, 0.35f); g.mb(mSkin).sphere(dx, fy + 1.45f, dz, 0.22f, 0.26f, 0.24f); g.box(mDark, 0, fy + 0.75f, -L / 2 + 0.3f, W - 0.2f, 0.3f, 0.45f);
        if (T.tram) {
            g.box(wall, 0, fy + 0.5f, -L / 2 + 1.6f, W - 0.1f, 1.0f, 0.06f); g.box(mWallIn, 0, fy + 2.15f, -L / 2 + 1.6f, W - 0.1f, 0.3f, 0.06f); g.box(mGlass, 0, fy + 1.5f, -L / 2 + 1.6f, W - 0.1f, 1.0f, 0.02f);
            for (int i = -3; i <= 3; i++) { float z = i * 0.16f; for (int sx : new int[]{-1, 1}) g.box(mRubber, sx * (hw - 0.02f), fy + H / 2, z, 0.12f, H, 0.1f); g.box(mRubber, 0, fy + H - 0.02f, z, W, 0.12f, 0.1f); }
            g.mb(mFrame).cyl(0, fy + 0.006f, 0, 0.95f, 0.95f, 0.012f, 0, 0, 20);
            for (float bz : new float[]{-L / 2 + 3, -1.6f, 1.6f, L / 2 - 3}) g.box(mDark, 0, 0.2f, bz, W - 0.3f, 0.3f, 2.2f);
            g.box(mDark, 0, fy + H + 0.6f, -2, 0.08f, 0.08f, 1.2f); g.box(mDark, 0, fy + H + 1.1f, -1.6f, 1.2f, 0.05f, 0.08f);
            V.ledBm = Bitmap.createBitmap(1024, 96, Bitmap.Config.ARGB_8888); V.ledC = new Canvas(V.ledBm); V.ledTex = Tex.dyn(V.ledBm);
            g.box(mDark, 0, fy + 2.12f, -L / 2 + 1.66f, 1.7f, 0.24f, 0.08f); g.mb(Mat.unlit(0xffffff).tex(V.ledTex)).plane(0, fy + 2.12f, -L / 2 + 1.71f, 1.6f, 0.15f, 0, 0);
            g.mb(Mat.unlit(0xffffff).tex(Tex.text("𒀱  ТИШИНА", 0x111111, 0xffb030, 768, 160, 90))).plane(0, fy + H - 0.2f, -L / 2 - 0.05f, 1.6f, 0.32f, (float) Math.PI, 0);
        } else {
            g.box(wall, -hw / 2 - 0.05f, fy + 0.6f, -L / 2 + 1.35f, hw - 0.1f, 1.2f, 0.05f);
            g.mb(mDark).cyl(-hw + 0.55f, fy + 1.05f, -L / 2 + 0.5f, 0.22f, 0.22f, 0.04f, 1.1f, 0, 14);
            for (int sx : new int[]{-1, 1}) for (float z : new float[]{-L / 2 + 1.9f, L / 2 - 2.4f}) g.mb(mRubber).cyl(sx * (hw - 0.28f), 0.45f, z, 0.45f, 0.45f, 0.32f, 0, (float) Math.PI / 2, 14);
            if (T.voice) { V.ledBm = Bitmap.createBitmap(1024, 96, Bitmap.Config.ARGB_8888); V.ledC = new Canvas(V.ledBm); V.ledTex = Tex.dyn(V.ledBm); g.mb(Mat.unlit(0xffffff).tex(V.ledTex)).plane(0.3f, fy + H - 0.2f, -L / 2 + 1.42f, 1.4f, 0.13f, 0, 0); }
            Mat sm = Mat.unlit(0xffffff).tex(Tex.text(T.shrt + "   ГЕРОЕВ ТУЛЫ", 0x111111, T.glow ? 0x5ad8ff : 0xffb030, 768, 140, 80));
            g.mb(sm).plane(0, fy + H - 0.2f, -L / 2 - 0.04f, W - 0.5f, 0.3f, (float) Math.PI, 0); g.mb(sm).plane(hw + 0.06f, fy + H - 0.25f, -L / 2 + 1.0f, 1.3f, 0.24f, (float) Math.PI / 2, 0);
            if (T.demand) { g.mb(Mat.unlit(0xffffff).tex(Tex.text("☦ ✝ ☦", 0xc8a040, 0x3a2010, 384, 128, 70))).plane(-0.2f, fy + 1.15f, -L / 2 + 0.56f, 0.5f, 0.17f, 0, 0);
                Mat cu = Mat.c(0xd86a2a); for (int sx : new int[]{-1, 1}) for (float z = -L / 2 + 1.8f; z < L / 2 - 0.5f; z += 1.4f) g.box(cu, sx * (hw - 0.09f), fy + 0.86f + (H - 1.2f) / 2, z, 0.02f, H - 1.2f, 0.35f); }
            if (T.poles) { float by = fy + H + 0.25f; for (float pxx : new float[]{-0.25f, 0.25f}) { float dy = 5.95f - by, dzz = 5.2f, l = (float) Math.hypot(dy, dzz); g.mb(mDark).cyl(pxx, by + dy / 2, -L / 2 + 3 + dzz / 2, 0.025f, 0.025f, l, (float) Math.atan2(dzz, dy), 0, 6); } g.box(mDark, 0, by - 0.1f, -L / 2 + 3, 0.9f, 0.2f, 1.2f); }
            if (T.glow) { Mat gm = Mat.unlit(0x2ac0ff); for (int sx : new int[]{-1, 1}) { g.box(gm, sx * (hw + 0.03f), 0.42f, 0, 0.02f, 0.05f, L - 1); g.box(gm, sx * (hw - 0.12f), fy + H - 0.36f, 0, 0.03f, 0.03f, L - 1); } }
        }
        // наклейки
        for (int i = 0; i < T.stick.length; i++) g.mb(Mat.unlit(0xffffff).tex(Tex.text(T.stick[i], 0xf4f0e0, 0x1d3a8a, 900, 150, 60))).plane(-hw + 0.08f, fy + H - 0.45f, -L / 2 + (T.tram ? 3.2f : 2.5f) + i * (T.tram ? 6.5f : 2.6f), 1.3f, 0.2f, (float) Math.PI / 2, 0);
        // свет салона
        g.box(Mat.unlit(T.glow ? 0xe8f6ff : 0xfff2d8), 0, fy + H - 0.01f, 0.4f, T.tram ? 0.5f : 0.4f, 0.02f, L - 3);
        if (T.tram) for (float z : new float[]{-9, 0, 9}) { Light l = new Light(0, fy + H - 0.25f, z, 0xfff0d8, 1.3f, 9); l.grp = g; V.lights.add(l); }
        else { Light l = new Light(0, fy + H - 0.3f, 0, T.glow ? 0xe0f4ff : 0xfff0d8, 1.2f, 8); l.grp = g; V.lights.add(l); }
        // сиденья
        float z0 = -L / 2 + (T.tram ? 2.6f : 2.0f), z1 = L / 2 - (T.tram ? 0.8f : 1.3f), st = T.tram ? 1.05f : 0.95f;
        for (float z = z0; z < z1; z += st) { if (T.tram && Math.abs(z) < 1.5f) continue; seatAt(V, g, seat, seatB, T.tram ? -0.66f : -(hw - 0.5f), z, T.tram ? 0.9f : 0.82f); }
        for (float z = z0; z < z1; z += st) { boolean skip = T.tram && Math.abs(z) < 1.5f; for (float d : T.doors) if (Math.abs(z - d) < T.dw / 2 + (T.tram ? 0.6f : 0.5f)) skip = true; if (!skip) seatAt(V, g, seat, seatB, T.tram ? 0.86f : hw - 0.33f, z, T.tram ? 0.48f : 0.46f); }
        if (!T.tram) seatAt(V, g, seat, seatB, 0, L / 2 - 0.55f, W - 0.3f);
        for (float z = -L / 2 + 2.3f; z < L / 2 - 0.5f; z += 2.1f) g.cyl(mHand, T.tram ? -0.18f : 0.05f, fy + H / 2, z, 0.02f, H);
        for (float d : T.doors) g.cyl(mHand, hw - 0.22f, fy + 1.0f, d - T.dw / 2 - 0.08f, 0.02f, 2.0f);
        for (float sx : new float[]{-0.85f, 0.85f}) { g.spr(new Spr(sx * hw, T.tram ? 0.8f : 0.7f, -L / 2 - 0.1f, 1.5f, 0xfff4e0, 1)); g.spr(new Spr(sx * hw, 0.8f, L / 2 + 0.1f, 0.7f, 0xff3020, 0.9f)); }
        g.done();
        // двери — отдельные объекты, чтобы ездили
        for (float d : T.doors) { MB a = new MB(); a.box(0, 0, 0, 0.04f, H - 0.15f, T.dw / 2 - 0.02f); Mesh m = a.build();
            Obj l = g.add(m, body), r = g.add(m, body); V.doors.add(new Obj[]{l, r}); }
        // пассажиры
        MB bm = new MB(); bm.box(0, fy + 0.82f, 0.08f, 0.42f, 0.6f, 0.28f); bm.box(0, fy + 0.55f, -0.15f, 0.38f, 0.16f, 0.42f); bm.box(0, fy + 0.26f, -0.36f, 0.34f, 0.5f, 0.14f); Mesh bodyM = bm.build();
        MB hm = new MB(); hm.sphere(0, fy + 1.27f, 0.04f, 0.2f, 0.24f, 0.22f); Mesh headM = hm.build();
        for (Seat s : V.seats) { if (s.w > 1.4f) continue; float x = s.w > 0.6f ? s.x + (rnd.nextBoolean() ? -0.22f : 0.22f) : s.x; Pax p = new Pax(); p.s = s; p.px = x;
            p.body = g.add(bodyM, mCoat[rnd.nextInt(5)]).at(x, 0, s.z); p.head = g.add(headM, mSkin).at(x, 0, s.z); boolean vis = V.rv && rnd.nextFloat() < 0.45f; p.body.vis = p.head.vis = vis; V.pax.add(p); }
        e.lights.addAll(V.lights);
        moveDoors(V);
        return V;
    }
    void seatAt(Veh V, Group g, Mat seat, Mat seatB, float x, float z, float w) { float fy = V.sp.fy; g.box(seat, x, fy + 0.45f, z, w, 0.08f, 0.44f); g.box(seatB, x, fy + 0.78f, z + 0.22f, w, 0.62f, 0.06f); g.box(mFrame, x, fy + 0.2f, z, 0.06f, 0.4f, 0.3f); V.seats.add(new Seat(x, z, w)); }
    void moveDoors(Veh V) { Spec T = V.sp; float o = V.door * (T.dw / 2 - 0.05f); for (int i = 0; i < T.doors.length; i++) { float d = T.doors[i]; Obj[] lr = V.doors.get(i);
        lr[0].at(T.W / 2 + 0.02f, T.fy + (T.H - 0.1f) / 2, d - T.dw / 4 - o); lr[1].at(T.W / 2 + 0.02f, T.fy + (T.H - 0.1f) / 2, d + T.dw / 4 + o); } }
    void shufflePax(Veh V) { for (Pax p : V.pax) { boolean v = rnd.nextFloat() < (V.rv ? 0.45f : 0.2f) && !(sitS == p.s && sitV == V); p.body.vis = p.head.vis = v; } }
    void freeVeh(Veh V) { e.groups.remove(V.g); V.g.free(); e.lights.removeAll(V.lights); if (V.ledTex != 0) android.opengl.GLES30.glDeleteTextures(1, new int[]{V.ledTex}, 0); }

    // ---------- табло ----------
    final Paint ledP = new Paint(Paint.ANTI_ALIAS_FLAG);
    void ledSet(Veh V, String t) { V.ledText = t; V.ledOff = 0; ledDraw(V, 0, true); }
    void ledDraw(Veh V, float dt, boolean force) { if (V.ledC == null) return; V.ledT += dt; if (!force && V.ledT < 0.07f) return; V.ledT = 0; V.ledOff += 140 * 0.07f;
        Canvas c = V.ledC; c.drawColor(0xFF100800); ledP.setTypeface(Typeface.MONOSPACE); ledP.setTextSize(58); ledP.setColor(V.sp.glow ? 0xFF5AD8FF : 0xFFFFA020); ledP.setFakeBoldText(true);
        float w = ledP.measureText(V.ledText); if (V.sp.tram) { float x = 1024 - (V.ledOff % (w + 1224)); c.drawText(V.ledText, x, 68, ledP); } else { ledP.setTextAlign(Paint.Align.CENTER); float f = 58; while (ledP.measureText(V.ledText) > 990 && f > 26) { f -= 4; ledP.setTextSize(f); } c.drawText(V.ledText, 512, 68, ledP); ledP.setTextAlign(Paint.Align.LEFT); }
        Tex.update(V.ledTex, V.ledBm); }

    // ---------- голос ----------
    void say(String clip, String text) { g.sub("🔊 " + text, 6500); snd.chime(); pendClip = clip; pendT = 0.9f; }
    boolean hearT() { return on || (in == null && Math.hypot(px, pz + tram.s) < 45); }
    static final String[] EXTRA = {"Уважаемые пассажиры, не забывайте оплачивать проезд.", "Уважаемые пассажиры, не забывайте свои вещи в салоне трамвая.", "Уступайте места пожилым людям и пассажирам с детьми.", "Выход из трамвая — через все двери. Будьте внимательны при выходе."};

    // ---------- логика трамвая ----------
    void tramUpdate(float dt) {
        Veh T = tram; T.t += dt;
        if (T.state.equals("run")) { float target = stS(T.next), dist = target - T.s; float vlim = (float) Math.min(T.sp.vmax, Math.sqrt(Math.max(0, 2 * 1.15f * dist)));
            if (T.v < vlim) T.v = Math.min(vlim, T.v + 1.1f * dt); else T.v = Math.max(vlim, T.v - 1.15f * 1.6f * dt);
            if (!T.extra && T.t > 22 && on && rnd.nextFloat() < dt * 0.02f) { T.extra = true; int i = rnd.nextInt(4); say("res/snd/tram/x" + i + ".mp3", EXTRA[i]); }
            if (dist < 0.05f || (dist < 0.6f && T.v < 0.15f)) { T.s = target; T.v = 0; T.state = "open"; T.t = 0; T.at = T.next; snd.hiss(1.1f, 0.22f); snd.thump(0.25f, 90, 0.09f); String nm = NAMES[nIdx(T.at)]; if (hearT()) say("res/snd/tram/stop" + nIdx(T.at) + ".mp3", "Остановка — " + nm + "."); ledSet(T, "ОСТАНОВКА: " + nm.toUpperCase()); }
            if (dist < 160 && !T.said && on) { T.said = true; ledSet(T, "СЛЕДУЮЩАЯ: " + NAMES[nIdx(T.next)].toUpperCase()); }
        } else if (T.state.equals("open")) { T.door = Math.min(1, T.door + dt * 1.4f); if (T.t > (T.at == 0 ? 12 : 16)) { T.state = "close"; T.t = 0; } if (T.t > 2 && T.t < 2 + dt * 1.5f) shufflePax(T); }
        else if (T.state.equals("close")) { if (T.t < dt * 1.5f) { int n = T.at + 1; if (hearT()) say("res/snd/tram/next" + nIdx(n) + ".mp3", "Осторожно, двери закрываются. Следующая остановка — " + NAMES[nIdx(n)] + "."); }
            if (T.t > 3.6f) { T.door = Math.max(0, T.door - dt * 1.6f); if (T.t > 3.7f && T.t < 3.7f + dt * 1.5f) snd.hiss(0.8f, 0.16f); if (T.door <= 0) { snd.thump(0.35f, 70, 0.12f); snd.bell(); T.state = "run"; T.t = 0; T.next = T.at + 1; T.said = false; T.extra = false; ledSet(T, "СЛЕДУЮЩАЯ: " + NAMES[nIdx(T.next)].toUpperCase()); } } }
        else if (T.state.equals("stop")) { T.state = "open"; T.t = 0; T.door = 1; T.at = 0; }
        T.s += T.v * dt; T.g.z = -T.s; T.g.upd();
        if (T.v > 0.5f) { T.joint += T.v * dt; if (T.joint > 12.5f) { T.joint -= 12.5f; float v = Math.min(0.5f, T.v / 26) * (on ? 1 : 0.4f); snd.thump(v, 110, 0.09f); bump = 1; } }
        moveDoors(T);
        int kP = Math.round(-pz / STEP);
        if (!on && in == null && T.state.equals("run") && (T.s > stS(kP) + 250 || T.s < stS(kP) - 800)) { T.s = stS(kP) - 520; T.v = T.sp.vmax; T.next = kP; T.said = true; shufflePax(T); g.toast("Следующий трамвай — через минуту", 3000); }
    }
    // ---------- наземный транспорт ----------
    Veh rvSpawn(int j) { Veh V = buildVeh(RT[rnd.nextInt(RT.length)]); V.s = sB(j) - 230 - rnd.nextFloat() * 60; V.v = V.sp.vmax; V.next = j; V.x = -7.9f; e.groups.add(V.g); rvs.add(V); ledSet(V, "СЛЕДУЮЩАЯ: " + NAMES[rIdx(j)].toUpperCase()); return V; }
    void rvUpdate(Veh V, float dt) {
        Spec T = V.sp; V.t += dt; boolean mine = in == V; float stopX = SWX0 - 0.1f - T.W / 2;
        if (V.state.equals("run")) { float target = sB(V.next), dist = target - V.s; boolean waiting = !on && in == null && Math.hypot(px + 4.4f, -pz - target) < 22; boolean willStop = !T.demand || V.req || waiting;
            if (!willStop && dist < 0) { V.next++; if (mine) ledSet(V, "СЛЕДУЮЩАЯ: " + NAMES[rIdx(V.next)].toUpperCase()); }
            float vlim = willStop ? (float) Math.min(T.vmax, Math.sqrt(Math.max(0, 2 * 1.3f * dist))) : T.vmax;
            if (V.v < vlim) V.v = Math.min(vlim, V.v + 1.3f * dt); else V.v = Math.max(vlim, V.v - 2.2f * dt);
            float tx = willStop && dist < 70 ? stopX : -7.9f; V.x += (tx - V.x) * Math.min(1, dt * 0.9f);
            if (!V.told && waiting && dist < 120) { V.told = true; g.toast("🚏 Подходит: " + T.name, 2600); }
            if (willStop && (dist < 0.05f || (dist < 0.6f && V.v < 0.2f))) { V.s = target; V.v = 0; V.state = "open"; V.t = 0; V.at = V.next; V.req = false; snd.hiss(0.9f, mine ? 0.2f : 0.08f);
                int ni = rIdx(V.at); String nm = NAMES[ni]; ledSet(V, "ОСТАНОВКА: " + nm.toUpperCase());
                if (mine) { if (T.voice) say("res/snd/tram/stop" + ni + ".mp3", "Остановка — " + nm + "."); else g.toast(T.demand ? "Водитель: «" + nm + ", выходим!»" : "Остановка «" + nm + "»", 2600); } }
        } else if (V.state.equals("open")) { V.door = Math.min(1, V.door + dt * 1.5f); V.x += (stopX - V.x) * Math.min(1, dt * 2); if (V.t > (mine ? 9 : 11)) { V.state = "close"; V.t = 0; } }
        else if (V.state.equals("close")) { if (V.t < dt * 1.5f && mine && T.voice) { int ni = rIdx(V.at + 1); say("res/snd/tram/next" + ni + ".mp3", "Осторожно, двери закрываются. Следующая остановка — " + NAMES[ni] + "."); }
            if (V.t > (T.voice && mine ? 3.4f : 1.2f)) { V.door = Math.max(0, V.door - dt * 1.8f); if (V.door <= 0) { snd.thump(mine ? 0.3f : 0.1f, 70, 0.12f); V.state = "run"; V.t = 0; V.next = V.at + 1; V.told = true; ledSet(V, "СЛЕДУЮЩАЯ: " + NAMES[rIdx(V.next)].toUpperCase()); } } }
        V.s += V.v * dt; V.g.x = V.x; V.g.z = -V.s; V.g.rz = mine ? 0 : (float) Math.sin(V.t * 1.7f) * 0.004f * V.v / 10; V.g.upd(); moveDoors(V);
    }
    void rvManage(float dt) {
        for (int i = rvs.size() - 1; i >= 0; i--) { Veh V = rvs.get(i); rvUpdate(V, dt); float ref = on ? tram.s : in != null ? in.s : -pz; if (in != V && (V.s > ref + 320 || V.s < ref - 900)) { freeVeh(V); rvs.remove(i); } }
        if (!on && in == null && !leaving) { int j = Math.round(-pz / (STEP / 2)); boolean near = Math.hypot(px + 4.4f, -pz - sB(j)) < 26; boolean coming = false; for (Veh V : rvs) if (V.next == j && V.s < sB(j) + 1) coming = true;
            if (near && rvs.size() < 3 && !coming) { rvTimer -= dt; if (rvTimer < 0) { rvSpawn(j); rvTimer = 9 + rnd.nextFloat() * 10; } } }
    }
    // ---------- игрок ----------
    Veh cur() { return on ? tram : in; }
    Seat seatHit(Veh V, float x, float z) { for (Seat s : V.seats) if (Math.abs(x - s.x) < s.w / 2 + R && Math.abs(z - s.z) < 0.24f + R) return s; return null; }
    void moveIn(Veh V, float dx, float dz) { Spec sp = V.sp; float hw = sp.W / 2 - 0.08f - R; float nx = clamp(lx + dx, -hw, hw), nz = clamp(lz + dz, -sp.L / 2 + (sp.tram ? 1.7f : 1.45f) + R, sp.L / 2 - 0.1f - R);
        if (seatHit(V, nx, lz) != null) nx = lx; if (seatHit(V, nx, nz) != null) nz = lz; lx = nx; lz = nz; }
    float groundY(float x, float s) { int k = Math.round(s / STEP); if (x > PX0 - 0.05f && x < PX1 && Math.abs(s - stS(k)) < PHALF) return PY; if (x > SWX0 && x < SWX1) return SWY; return 0; }
    void moveOff(float dx, float dz) { float nx = px + dx, nz = pz + dz;
        ArrayList<Veh> all = new ArrayList<>(rvs); all.add(tram);
        for (Veh U : all) { float hw = U.sp.W / 2 + R, hl = U.sp.L / 2 + R; if (Math.abs(nx - U.x) < hw && Math.abs(nz + U.s) < hl) { if (!(Math.abs(px - U.x) < hw && Math.abs(nz + U.s) < hl)) nz = pz; nx = px; if (Math.abs(nx - U.x) < hw && Math.abs(nz + U.s) < hl) nz = pz; } }
        px = nx; pz = nz; py += (groundY(px, -pz) - py) * 0.25f; }
    float[] nearSeat() { Veh V = cur(); if (V == null) return null; float[] best = null; float bd = 0.95f;
        for (Seat s : V.seats) { float[] xs = s.w > 1.4f ? new float[]{s.x - 0.7f, s.x, s.x + 0.7f} : s.w > 0.6f ? new float[]{s.x - 0.22f, s.x + 0.22f} : new float[]{s.x};
            for (float x : xs) { float d = (float) Math.hypot(lx - x, lz - s.z); boolean taken = false; for (Pax p : V.pax) if (p.body.vis && p.s == s && Math.abs(p.px - x) < 0.15f) taken = true;
                if (d < bd && !taken) { bd = d; best = new float[]{V.seats.indexOf(s), x}; } } } return best; }
    /** {выход?, дверь z, транспорт} */
    Object[] doorNear() { Veh V = cur();
        if (V != null) { if (!(V.door > 0.85f && !V.state.equals("run"))) return null; for (float d : V.sp.doors) if (Math.abs(lz - d) < 1.5f && lx > -0.3f) return new Object[]{true, d, V}; return null; }
        ArrayList<Veh> all = new ArrayList<>(); all.add(tram); all.addAll(rvs);
        for (Veh U : all) { if (!(U.door > 0.85f && !U.state.equals("run"))) continue; float l_z = pz + U.s, l_x = px - U.x, hw = U.sp.W / 2;
            if (l_x > hw - 0.2f && l_x < hw + 2.6f) for (float d : U.sp.doors) if (Math.abs(l_z - d) < 1.8f) return new Object[]{false, d, U}; }
        return null; }
    String mode = "СТ · маршрут 𒀱 · в салоне";
    void act() {
        Veh V = cur();
        if (sitS != null) { lx = sitX > 0 ? 0.1f : 0.15f; lz = sitS.z - 0.55f; if (lz < -sitV.sp.L / 2 + 1.8f) lz = sitS.z + 0.6f; sitS = null; sitV = null; return; }
        Object[] dn = doorNear();
        if (dn != null && (Boolean) dn[0]) { Veh U = (Veh) dn[2]; float d = (Float) dn[1]; on = false; in = null; px = U.x + U.sp.W / 2 + 0.6f; pz = -U.s + d; py = U == tram ? PY : SWY; g.yaw = (float) -Math.PI / 2; mode = U == tram ? "на платформе СТ" : "на остановке у дороги";
            if (U == tram) g.toast("Пересадка на автобусы — через пути, к дороге. 🗺 — карта", 3200); return; }
        if (dn != null) { Veh U = (Veh) dn[2]; float d = (Float) dn[1]; if (U == tram) on = true; else in = U; lx = U.sp.W / 2 - 0.5f; lz = d; g.yaw = 0; mode = U == tram ? "СТ · маршрут 𒀱 · в салоне" : U.sp.name;
            if (U != tram) { g.toast(U.sp.name + (U.sp.demand ? " · «Остановите на остановке» — E" : ""), 2600); if (U.state.equals("open")) ledSet(U, "ОСТАНОВКА: " + NAMES[rIdx(U.at)].toUpperCase()); } return; }
        if (V != null && V.rv && V.sp.demand && V.state.equals("run") && !V.req) { V.req = true; g.toast("«Остановите на остановке!» — «Ага, щас»", 2400); return; }
        float[] n = nearSeat(); if (n != null) { sitS = V.seats.get((int) n[0]); sitX = n[1]; sitV = V; g.yaw = 0; g.toast("Сел. E — встать", 1500); }
    }
    @Override void button(String id) { if (id.equals("E")) act(); else g.showMap(); }

    @Override void update(float dt) {
        if (pendT >= 0) { pendT -= dt; if (pendT < 0 && pendClip != null) { snd.clip(pendClip, 1f); pendClip = null; } }
        tramUpdate(dt); rvManage(dt);
        stream(on ? tram.s : in != null ? in.s : -pz);
        for (Seg sg : segs.values()) for (int i = 0; i < sg.cars.size(); i++) { Group c = sg.cars.get(i); float[] cv = sg.carV.get(i); c.z += cv[0] * dt; if (c.z < cv[1] - SEG) c.z += SEG; if (c.z > cv[1]) c.z -= SEG; c.upd(); }
        for (Veh V : rvs) ledDraw(V, dt, false); ledDraw(tram, dt, false);
        // ходьба
        float fx = g.sx, fz = g.sy, fl = (float) Math.hypot(fx, fz); if (fl > 1) { fx /= fl; fz /= fl; }
        if (sitS != null && fl > 0.5f) act();
        Veh V = cur();
        if (sitS == null && fl > 0.05f) { float sp = (1.6f + Math.max(0, fl - 0.9f) * 10) * dt; float c = (float) Math.cos(g.yaw), s = (float) Math.sin(g.yaw); float dx = (fx * c + fz * s) * sp, dz = (-fx * s + fz * c) * sp; if (V != null) moveIn(V, dx, dz); else moveOff(dx, dz); bob += fl * dt * 9;
            if ((int) (bob / Math.PI) != (int) ((bob - fl * dt * 9) / Math.PI)) snd.noise(0.06f, 0.05f, 0.3f); }
        // подсказки
        Object[] dn = sitS == null ? doorNear() : null;
        if (V != null) { float[] n = sitS == null ? nearSeat() : null; if (sitS != null) g.prompt(""); else if (dn != null) g.prompt("E — выйти"); else if (V.rv && V.sp.demand && V.state.equals("run") && !V.req) g.prompt("E — «Остановите на остановке!»"); else if (n != null) g.prompt("E — сесть"); else g.prompt(""); }
        else { float s = -pz; int k = Math.round(s / STEP), j = Math.round(s / (STEP / 2)); float d = (float) Math.min(Math.hypot(px - 3, s - stS(k)), Math.hypot(px + 4.4f, s - sB(j)));
            g.prompt(dn != null ? "E — войти: " + (dn[2] == tram ? "СТ" : ((Veh) dn[2]).sp.name) : "");
            if (d > 32 && !warned) { warned = true; g.toast("Остановка позади. Дальше — что-то знакомое…", 3200); }
            if (d < 25) warned = false;
            if (d > 46 && !leaving) { leaving = true; g.toast("…двор. Героев Тулы, 13.", 3000); g.goWeb("dvory.html"); } }
        // звук мотора
        Veh src = V; float dd = 1; if (src == null) { float bd = 1e9f; ArrayList<Veh> all = new ArrayList<>(rvs); all.add(tram); for (Veh U : all) { float q = (float) Math.hypot(px - U.x, pz + U.s); if (q < bd) { bd = q; src = U; } } dd = Math.max(0.03f, 1 - bd / 70); }
        float[] eg = src.sp.eng; float v = src.v; boolean run = src.state.equals("run");
        snd.motorF = eg[0] + v * eg[1]; snd.motorG = eg[5] * dd; snd.whineF = (eg[2] > 0 ? eg[2] : 200) + v * eg[3]; snd.whineG = eg[2] > 0 && run ? (0.012f + v * 0.0018f) * dd : 0; snd.noiseG = (0.02f + v * 0.012f + eg[4]) * dd * 0.6f + (V == null ? 0.015f : 0); snd.noiseCut = 220 + v * 30;
        // камера
        float cx, cy, cz; float sv = V != null ? V.v : 0; float sway = V != null ? (float) Math.sin(System.nanoTime() / 1e9 * 1.3) * (V.rv && (V.sp.shrt.equals("55") || V.sp.demand) ? 0.02f : 0.012f) * Math.min(1, sv / 8) : 0;
        bump *= (float) Math.pow(0.02, dt); if (V != null && V.rv && sv > 3 && rnd.nextFloat() < dt * (V.sp.shrt.equals("55") ? 1.5f : 0.4f)) bump = 0.7f;
        if (sitS != null) { cx = sitV.x + sitX; cz = -sitV.s + sitS.z + 0.02f; cy = sitV.sp.fy + 1.13f; }
        else { if (V != null) { cx = V.x + lx; cz = -V.s + lz; cy = V.sp.fy + (V.sp.demand ? 1.5f : 1.62f); } else { cx = px; cz = pz; cy = py + 1.62f; } cy += (float) Math.sin(bob) * 0.03f; }
        cy += bump * 0.012f * (float) Math.sin(System.nanoTime() / 3e7);
        e.cx = cx + sway; e.cy = cy; e.cz = cz; e.yaw = g.yaw; e.pitch = g.pitch; e.roll = sway * 0.6f;
        clkT += dt; if (clkT > 0.5f) { clkT = 0; String st = ""; if (in != null) { if (!in.state.equals("run")) st = " · " + NAMES[rIdx(in.at)]; } else if (Math.abs(stS(Math.round(tram.s / STEP)) - tram.s) < 0.6f && !tram.state.equals("run")) st = " · " + NAMES[nIdx(Math.round(tram.s / STEP))];
            g.hud("ноябрь · 17:12" + st + "\n" + mode); if (g.mapOpen()) g.redrawMap(); }
    }

    // ---------- карта ----------
    @Override void drawMap(Canvas c, int W, int H, float dpi) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG); float sc = Math.min(1.6f, W / 900f) ; float cur = on ? tram.s : in != null ? in.s : -pz;
        float sA = (float) ((Math.floor(cur / STEP) - 1) * STEP), sZ = sA + 4 * STEP, pad = 80 * sc;
        p.setColor(0xFFFFFFFF); p.setTextSize(20 * sc); p.setFakeBoldText(true); c.drawText("Схема маршрутов · СТ и наземный транспорт", 24 * sc, 36 * sc, p);
        p.setFakeBoldText(false); p.setTextSize(13 * sc); p.setColor(0xFF9AA4B4); c.drawText("тап — закрыть · пересадка: выйди из СТ, перейди пути к остановке у дороги · маршрутка — по просьбе (E)", 24 * sc, 58 * sc, p);
        int n = RT.length + 1; float[] ys = new float[n]; ys[0] = H * 0.3f; for (int i = 1; i < n; i++) ys[i] = H * 0.44f + (i - 1) * H * 0.095f;
        p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(1); p.setColor(0x40FFFFFF); p.setPathEffect(new DashPathEffect(new float[]{4, 5}, 0));
        for (int k = (int) Math.ceil(sA / STEP); stS(k) <= sZ; k++) { float x = X(stS(k), sA, sZ, pad, W); c.drawLine(x, ys[0], x, ys[n - 1], p); } p.setPathEffect(null);
        for (int i = 0; i < n; i++) { int col = i == 0 ? 0xFFFF8A20 : RT[i - 1].col; p.setStyle(Paint.Style.STROKE); p.setColor(col); p.setStrokeWidth((i == 0 ? 9 : 5) * sc); if (i > 0 && RT[i - 1].demand) p.setPathEffect(new DashPathEffect(new float[]{10 * sc, 6 * sc}, 0));
            c.drawLine(X(sA, sA, sZ, pad, W), ys[i], X(sZ, sA, sZ, pad, W), ys[i], p); p.setPathEffect(null);
            p.setStyle(Paint.Style.FILL); p.setTextSize(15 * sc); p.setFakeBoldText(true); p.setTextAlign(Paint.Align.RIGHT); c.drawText(i == 0 ? "СТ" : RT[i - 1].shrt, pad - 12 * sc, ys[i] + 5 * sc, p); p.setTextAlign(Paint.Align.LEFT); p.setFakeBoldText(false);
            if (i == 0) { for (int k = Math.max(0, (int) Math.ceil(sA / STEP)); stS(k) <= sZ; k++) stop(c, p, X(stS(k), sA, sZ, pad, W), ys[0], 8 * sc, col, NAMES[nIdx(k)], -1, sc); }
            else for (int j = Math.max(0, (int) Math.ceil(sA / (STEP / 2))); sB(j) <= sZ; j++) stop(c, p, X(sB(j), sA, sZ, pad, W), ys[i], 5 * sc, col, i == n - 1 ? NAMES[rIdx(j)] : null, 1, sc); }
        dot(c, p, tram.s, ys[0], 0xFFFFB060, "СТ", sA, sZ, pad, W, sc);
        for (Veh V : rvs) for (int i = 0; i < RT.length; i++) if (V.sp == RT[i]) dot(c, p, V.s, ys[i + 1], V.sp.col, V.sp.shrt, sA, sZ, pad, W, sc);
        float ry = on || (in == null && px > 0) ? ys[0] : in != null ? ys[1 + java.util.Arrays.asList(RT).indexOf(in.sp)] : ys[1] - H * 0.05f;
        float x = X(cur, sA, sZ, pad, W); p.setStyle(Paint.Style.FILL); p.setColor(0xFFFF2A4A); c.drawCircle(x, ry, 9 * sc, p); p.setColor(0xFFFFFFFF); p.setTextAlign(Paint.Align.CENTER); p.setTextSize(14 * sc); p.setFakeBoldText(true); c.drawText("ТЫ", x, ry - 14 * sc, p); p.setTextAlign(Paint.Align.LEFT);
    }
    float X(float s, float sA, float sZ, float pad, int W) { return pad + (s - sA) / (sZ - sA) * (W - pad * 1.4f); }
    void stop(Canvas c, Paint p, float x, float y, float r, int col, String name, int dir, float sc) { p.setStyle(Paint.Style.FILL); p.setColor(0xFFFFFFFF); c.drawCircle(x, y, r, p); p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(3 * sc); p.setColor(col); c.drawCircle(x, y, r, p);
        if (name != null) { c.save(); c.translate(x, y + dir * 18 * sc); c.rotate(dir * 28); p.setStyle(Paint.Style.FILL); p.setColor(0xFFE8ECF4); p.setTextSize(13 * sc); p.setFakeBoldText(false); c.drawText(name, 0, 0, p); c.restore(); } }
    void dot(Canvas c, Paint p, float s, float y, int col, String t, float sA, float sZ, float pad, int W, float sc) { if (s < sA || s > sZ) return; float x = X(s, sA, sZ, pad, W); p.setStyle(Paint.Style.FILL); p.setColor(col); c.drawRect(x - 14 * sc, y - 9 * sc, x + 14 * sc, y + 9 * sc, p);
        p.setColor(0xFF111111); p.setTextSize(11 * sc); p.setFakeBoldText(true); p.setTextAlign(Paint.Align.CENTER); c.drawText(t, x, y + 4 * sc, p); p.setTextAlign(Paint.Align.LEFT); }
}
