package ru.volga.tishina.n;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Random;

/** Мир «Тропа»: ноябрь, густой туман, грунтовая тропа вдоль трассы, тополя, столбы с проводами, сельские магазины с монетами. */
final class TropaWorld extends World {
    static final float CS = 48, ROAD_C = -35, ROAD_HW = 5, R = 0.3f;
    static float pathC(float x) { return 2.2f * (float) Math.sin(x * 0.011f) + 0.9f * (float) Math.sin(x * 0.037f + 1.3f); }
    static float ihash(int a, int b, int s) { int h = a * 374761393 + b * 668265263 + s * 2246822519L > 0 ? 1 : 0; Rng r = new Rng(a * 73856093 ^ b * 19349663 ^ s * 83492791); r.f(); return r.f(); }
    final Random rnd = new Random();
    float px = 0, pz = pathC(0), bob; int money; float ambT = 4, hitT;
    Mat mGrass, mPath, mRoad, mLine, mFence, mPole, mWood, mWire, mBrick, mConc, mProf, mWhite, mDark, mBrown, mGalv, mGlass, mLog, mRoofR, mRoofG, mBark, mPoplar, mElm, mShrubY, mShrubG, mSticks, mStone, mGarage, mGold, mStripe, mLampHead, mWin;
    static final class Coin { Obj o; float x, z, y; int val; String key; boolean got; }
    final class Chunk { Group g; final ArrayList<float[]> boxes = new ArrayList<>(); final ArrayList<Coin> coins = new ArrayList<>(); final ArrayList<Light> lights = new ArrayList<>(); }
    final HashMap<Long, Chunk> chunks = new HashMap<>();
    static final class Car { Group g; float x, z, v; }
    final ArrayList<Car> cars = new ArrayList<>();
    java.util.Set<String> got;

    @Override void init() {
        e.fogD = 0.034f; e.col3(e.fogC, 0xc4c8cc, 1); e.col3(e.clear, 0xc4c8cc, 1); e.col3(e.sky, 0xd8dce0, 0.95f); e.col3(e.gnd, 0x6a6458, 0.55f); e.col3(e.dirC, 0xfff4e8, 0.3f); e.dirD = new float[]{-0.3f, -1, -0.4f}; e.exposure = 1.0f; e.vig = 0.45f; e.fov = 70;
        e.skyDome(new int[]{0xffb8bcc2, 0xffc4c8cc, 0xffc4c8cc}, new float[]{0, 0.45f, 1});
        mGrass = Mat.c(0x9a9a7a).tex(Tex.file("res/tex/withered_grass_diff.jpg")); mPath = Mat.c(0xb8aa98).tex(Tex.file("res/tex/brown_mud_dry_diff.jpg")); mRoad = Mat.c(0x8a8a8e).tex(Tex.file("res/tex/asphalt_02_diff.jpg"));
        mLine = Mat.c(0xd8d8d0); mFence = Mat.c(0xa8aaa8).spec(0.4f); mPole = Mat.c(0x5a4a3a); mWood = Mat.c(0x6a5038); mWire = Mat.c(0x222222);
        mBrick = Mat.c(0xd8c8b8).tex(Tex.file("res/tex/brick_wall_003_diff.jpg")); mConc = Mat.c(0xa8a8a0).tex(Tex.file("res/tex/chipped_concrete_diff.jpg")); mProf = Mat.c(0x7a4a32).tex(Tex.file("res/tex/ai/dv_prof.jpg"));
        mWhite = Mat.c(0xe8e6e0); mDark = Mat.c(0x22262a); mBrown = Mat.c(0x5a3a24); mGalv = Mat.c(0x9aa0a0).spec(0.4f); mGlass = Mat.c(0x3a4048).spec(0.6f); mLog = Mat.c(0x7a5a3a).tex(Tex.file("res/tex/ai/dv_woodfence.jpg"));
        mRoofR = Mat.c(0x6a3a2a); mRoofG = Mat.c(0x4a5a4a); mBark = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/bark_poplar.jpg")); mPoplar = Mat.c(0x4a5a34); mElm = Mat.c(0x6a6a3a); mShrubY = Mat.c(0x9a7a3a); mShrubG = Mat.c(0x4a5a2a); mSticks = Mat.c(0x5a4a3a);
        mStone = Mat.c(0x8a8a84); mGarage = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/dv_garage_door.jpg")); mGold = Mat.c(0xffcc40).emis(0xffaa20, 0.35f).spec(1f); mStripe = Mat.c(0xeeeeee); mLampHead = Mat.unlit(0xffd8a0); mWin = Mat.c(0x2a3038).spec(0.8f);
        got = new java.util.HashSet<>(g.prefs().getStringSet("tropa_got", new java.util.HashSet<>())); money = g.prefs().getInt("tropa_money", 0);
        snd.windG = 0.6f;
        stream(); g.yaw = (float) -Math.PI / 2; g.pitch = 0;
        g.toast("Ноябрь. Туман.\nТропа вдоль трассы.", 3000);
    }
    // ---------- постройки ----------
    void shop(Chunk C, Group g, Rng r, float x, float z, boolean north) {
        float W = 9, D = 6.5f, H = 3.3f, f = north ? -1 : 1;   // north: фасад смотрит на тропу (−z)
        g.mb(mConc, 2).box(x, 0.2f, z, W + 0.2f, 0.45f, D + 0.2f); g.mb(mBrick, 2.5f).box(x, 0.4f + H / 2, z, W, H, D);
        g.mb(mProf, 1).box(x, 0.4f + H + 0.25f, z, W + 0.6f, 0.04f, D + 0.8f);
        float fz = z + f * (D / 2 + 0.06f);
        g.box(mWhite, x, 0.4f + H - 0.1f, z + f * (D / 2 + 0.1f), W + 0.2f, 0.9f, 0.12f);
        String[] names = {"МАГАЗИН", "ПРОДУКТЫ", "ХОЗТОВАРЫ", "У ДОРОГИ", "СЕЛЬМАГ"}; Mat sm = Mat.unlit(0xdddddd).tex(Tex.text(names[r.i(names.length)], 0xe8e6e0, 0x2a5a8a, 768, 128, 90));
        g.mb(sm).plane(x, 0.4f + H - 0.1f, z + f * (D / 2 + 0.17f), 4.2f, 0.7f, north ? (float) Math.PI : 0, 0);
        for (float wx : new float[]{-2.6f, 2.6f}) { g.box(mWin, x + wx, 0.4f + 1.55f, fz, 2.4f, 1.5f, 0.05f); for (int k = -5; k <= 5; k++) g.box(mDark, x + wx + k * 0.22f, 0.4f + 1.55f, fz + f * 0.1f, 0.02f, 1.6f, 0.02f); }
        g.box(mBrown, x, 0.4f + 1.1f, fz, 1.05f, 2.15f, 0.06f); g.box(mConc, x, 0.18f, z + f * (D / 2 + 1.0f), 3.2f, 0.36f, 1.6f);
        g.box(mGalv, x, 0.4f + 2.55f, z + f * (D / 2 + 0.9f), 3.0f, 0.03f, 1.6f); g.cyl(mGalv, x - 1.4f, 1.5f, z + f * (D / 2 + 1.6f), 0.04f, 2.9f); g.cyl(mGalv, x + 1.4f, 1.5f, z + f * (D / 2 + 1.6f), 0.04f, 2.9f);
        Light L = new Light(x, 2.9f, z + f * (D / 2 + 1.0f), 0xffe0b0, 0.9f, 7); C.lights.add(L); g.spr(new Spr(x, 2.9f, z + f * (D / 2 + 0.95f), 1.2f, 0xffe0b0, 0.7f));
        C.boxes.add(new float[]{x, z, W / 2 + 0.2f, D / 2 + 0.2f});
        // монеты у магазина
        int[] vals = {5, 5, 5, 50, 100};
        for (int i = 0; i < 4; i++) { float cx = x + (r.f() - 0.5f) * 8, cz = z + f * (D / 2 + 2.5f + r.f() * 4); String key = (int) x + "," + (int) z + "," + i; int val = vals[r.i(vals.length)]; if (got.contains(key)) continue;
            Coin c = new Coin(); c.x = cx; c.z = cz; c.val = val; c.key = key; c.y = 0.3f; MB m = new MB(); if (val == 100) m.box(0, 0, 0, 0.24f, 0.08f, 0.12f); else if (val == 50) { for (int k = 0; k < 5; k++) m.cyl((k % 3 - 1) * 0.07f, k / 3 * 0.03f, (k / 2 - 1) * 0.05f, 0.05f, 0.05f, 0.015f, 0, 0, 12); } else m.cyl(0, 0, 0, 0.07f, 0.07f, 0.015f, (float) Math.PI / 2, 0, 14);
            c.o = g.add(m.build(), mGold); c.o.at(cx, c.y, cz); C.coins.add(c); }
    }
    void shed(Chunk C, Group g, Rng r, float x, float z) { g.mb(mLog, 2).box(x, 1.2f, z, 6, 2.4f, 4); g.mb(mProf, 1).box(x, 2.5f, z, 6.6f, 0.05f, 4.6f, 0.08f, 0, 0); g.box(mBrown, x, 0.95f, z - 2.02f, 1.0f, 1.9f, 0.04f); C.boxes.add(new float[]{x, z, 3.1f, 2.1f}); }
    void house(Chunk C, Group g, Rng r, float x, float z, boolean north) {
        float W = 7, D = 6, H = 2.8f, f = north ? -1 : 1; Mat wall = r.f() < 0.5f ? mLog : Mat.c(new int[]{0x8aa0b0, 0xb0a070, 0x9ab08a, 0xc8b8a0}[r.i(4)]);
        g.mb(mConc, 2).box(x, 0.25f, z, W + 0.2f, 0.5f, D + 0.2f); g.mb(wall, 2).box(x, 0.5f + H / 2, z, W, H, D);
        Mat roof = r.f() < 0.5f ? mRoofR : mRoofG; float rh = 1.8f, rl = (float) Math.hypot(rh, D / 2 + 0.4f), ang = (float) Math.atan2(rh, D / 2 + 0.4f);
        g.mb(roof).box(x, 0.5f + H + rh / 2, z - (D / 4 + 0.2f), W + 0.6f, 0.08f, rl, ang, 0, 0); g.mb(roof).box(x, 0.5f + H + rh / 2, z + (D / 4 + 0.2f), W + 0.6f, 0.08f, rl, -ang, 0, 0);
        g.mb(wall, 2).box(x - W / 2 + 0.05f, 0.5f + H + rh / 2 - 0.3f, z, 0.1f, rh - 0.4f, D * 0.6f); g.mb(wall, 2).box(x + W / 2 - 0.05f, 0.5f + H + rh / 2 - 0.3f, z, 0.1f, rh - 0.4f, D * 0.6f);
        for (float wx : new float[]{-2.2f, 0, 2.2f}) { g.box(mWin, x + wx, 0.5f + 1.5f, z + f * (D / 2 + 0.03f), 1.0f, 1.2f, 0.04f); g.box(mWhite, x + wx, 0.5f + 1.5f, z + f * (D / 2 + 0.06f), 1.2f, 0.08f, 0.04f); g.box(mWhite, x + wx, 0.5f + 0.85f, z + f * (D / 2 + 0.08f), 1.2f, 0.06f, 0.1f);
            if (r.f() < 0.4f) { Light L = new Light(x + wx, 1.9f, z + f * (D / 2 + 0.6f), 0xffc880, 0.5f, 5); C.lights.add(L); g.box(Mat.unlit(0xffd090), x + wx, 0.5f + 1.5f, z + f * (D / 2 + 0.01f), 0.9f, 1.1f, 0.03f); } }
        g.box(mPole, x - 0.6f, 0.6f, z + f * (D / 2 + 4), 0.06f, 1.2f, 0.06f);
        for (float k = -W / 2 - 1; k <= W / 2 + 1; k += 0.35f) g.box(mWood, x + k, 0.55f, z + f * (D / 2 + 3.5f), 0.08f, 1.1f, 0.03f);   // палисадник
        g.box(mWood, x, 0.85f, z + f * (D / 2 + 3.5f), W + 2, 0.06f, 0.04f); g.box(mWood, x, 0.35f, z + f * (D / 2 + 3.5f), W + 2, 0.06f, 0.04f);
        C.boxes.add(new float[]{x, z, W / 2 + 0.2f, D / 2 + 0.2f}); C.boxes.add(new float[]{x, z + f * (D / 2 + 3.5f), W / 2 + 1, 0.1f});
    }
    void garages(Chunk C, Group g, Rng r, float x, float z) { int n = 3 + r.i(3); float w = 3.4f; for (int i = 0; i < n; i++) { float gx = x + (i - (n - 1) / 2f) * w; g.mb(mBrick, 2.5f).box(gx, 1.3f, z, w - 0.05f, 2.6f, 6); g.mb(mGarage).plane(gx, 1.05f, z + 3.01f, 2.6f, 2.1f, 0, 0); }
        g.mb(mProf, 1).box(x, 2.65f, z, n * w + 0.4f, 0.06f, 6.4f); C.boxes.add(new float[]{x, z, n * w / 2, 3.1f}); }
    void pole(Group g, float x, float z) { g.cyl(mPole, x, 4.6f, z, 0.13f, 9.4f); g.box(mPole, x, 8.9f, z, 0.12f, 0.12f, 1.8f); for (float dz : new float[]{-0.7f, 0, 0.7f}) g.cyl(mWhite, x, dz == 0 ? 9.3f : 8.98f, z + dz, 0.04f, 0.1f); }
    void wire(Group g, float xa, float za, float xb, float zb, float h) { float dx = xb - xa, dz = zb - za, l = (float) Math.hypot(dx, dz), ang = (float) Math.atan2(dx, dz);
        int N = 6; for (int i = 0; i < N; i++) { float t0 = i / (float) N, t1 = (i + 1f) / N; float s0 = 0.85f * 4 * t0 * (1 - t0), s1 = 0.85f * 4 * t1 * (1 - t1);
            float mx = xa + dx * (t0 + t1) / 2, mz = za + dz * (t0 + t1) / 2, my = h - (s0 + s1) / 2, seg = l / N; float tilt = (float) Math.atan2(s1 - s0, seg);
            g.mb(mWire).box(mx, my, mz, 0.02f, 0.02f, seg * 1.02f, tilt, ang, 0); } }
    void tree(Group g, Rng r, int kind, float x, float z, float s) {
        if (kind == 0) { float h = (13 + r.f() * 6) * s; g.mb(mBark, 1.5f).cyl(x, h * 0.35f, z, 0.22f * s, 0.12f * s, h * 0.7f, 0, 0, 8); g.mb(mPoplar).sphere(x, h * 0.62f, z, 2.6f * s, h * 0.75f, 2.6f * s); g.mb(mElm).sphere(x + 0.6f, h * 0.5f, z - 0.4f, 1.8f * s, h * 0.4f, 1.8f * s); }
        else if (kind == 1) { float h = (8 + r.f() * 4) * s; g.mb(mBark, 1.5f).cyl(x, h * 0.3f, z, 0.25f * s, 0.15f * s, h * 0.6f, 0, 0, 8); for (int k = 0; k < 4; k++) g.mb(r.f() < 0.5f ? mElm : mShrubY).sphere(x + (r.f() - 0.5f) * 3 * s, h * (0.55f + r.f() * 0.3f), z + (r.f() - 0.5f) * 3 * s, 2.4f * s, 1.8f * s, 2.4f * s); }
        else if (kind == 2) { g.mb(r.f() < 0.5f ? mShrubY : mShrubG).sphere(x, 0.6f * s, z, 1.8f * s, 1.3f * s, 1.8f * s); }
        else { for (int k = 0; k < 7; k++) { float a = r.f() * 6.28f; g.mb(mSticks).cyl(x + (float) Math.cos(a) * 0.2f, 0.7f * s, z + (float) Math.sin(a) * 0.2f, 0.015f, 0.008f, 1.4f * s, (r.f() - 0.5f) * 0.5f, (r.f() - 0.5f) * 0.5f, 4); } }
    }
    // ---------- чанк ----------
    Chunk build(int cx, int cz) {
        Chunk C = new Chunk(); Group g = new Group(); C.g = g; Rng r = new Rng((cx * 73856093) ^ (cz * 19349663) ^ 0x7a11); float x0 = cx * CS, z0 = cz * CS, x1 = x0 + CS, z1 = z0 + CS;
        g.mb(mGrass, 5).floor(x0 + CS / 2, 0, z0 + CS / 2, CS, CS);
        boolean inz = false;
        // тропа
        if (z0 < 6 && z1 > -6) { int N = 24; float[] xs = new float[N + 1], zs = new float[N + 1]; for (int i = 0; i <= N; i++) { xs[i] = x0 + CS * i / N; zs[i] = pathC(xs[i]); } g.mb(mPath, 3).ribbonX(xs, zs, 1.25f, 0.012f); }
        // трасса
        if (z0 < ROAD_C + ROAD_HW && z1 > ROAD_C - ROAD_HW) { g.mb(mRoad, 6).floor(x0 + CS / 2, 0.01f, ROAD_C, CS, ROAD_HW * 2);
            for (float x = (float) Math.ceil(x0 / 9) * 9; x < x1; x += 9) g.box(mLine, x + 2, 0.018f, ROAD_C, 4, 0.01f, 0.14f);
            for (float zz : new float[]{ROAD_C - ROAD_HW + 0.3f, ROAD_C + ROAD_HW - 0.3f}) g.box(mLine, x0 + CS / 2, 0.018f, zz, CS, 0.01f, 0.12f); }
        // северная сторона: магазины, сараи, дома
        if (13 >= z0 && 13 < z1) { float roll = cx == 0 ? 0 : hash(cx, 5, 11); float x = x0 + 24 + (r.f() - 0.5f) * 8, z = pathC(x) + 13 + r.f() * 3;
            if (roll < 0.34f) shop(C, g, r, x, z, true); else if (roll < 0.58f) shed(C, g, r, x, z - 3); else { house(C, g, r, x, z + 3, true); if (r.f() < 0.6f) house(C, g, r, x + 18 * (r.f() < 0.5f ? -1 : 1), z + 5, true); } }
        if (-12 >= z0 && -12 < z1 && hash(cx, 9, 0) < 0.3f) shed(C, g, r, x0 + 24, -13);
        if (-54 >= z0 && -54 < z1) { float roll = hash(cx, 3, 7); if (roll < 0.28f) shop(C, g, r, x0 + 24, -53, false); else if (roll < 0.55f) garages(C, g, r, x0 + 14 + r.f() * 18, -52);
            for (int k = 0; k < 2; k++) { float x = x0 + 8 + k * 26 + r.f() * 6; if (roll >= 0.28f || Math.abs(x - (x0 + 24)) > 9) house(C, g, r, x, -60, false); } }
        if (z0 >= 48 || z1 <= -80) for (int k = 0; k < 2; k++) { float x = x0 + 8 + r.f() * 32, z = z0 + 8 + r.f() * 32; float t = r.f(); if (t < 0.45f) house(C, g, r, x, z, r.f() < 0.5f); else if (t < 0.6f) garages(C, g, r, x, z); }
        // столбы с проводами
        if (z0 < 0 && z1 > -12) { for (float x = (float) Math.floor(x0 / 34) * 34; x < x1; x += 34) { if (x < x0) continue; float z = pathC(x) - 5.5f; pole(g, x, z); C.boxes.add(new float[]{x, z, 0.2f, 0.2f});
            float xn = x + 34, zn = pathC(xn) - 5.5f; for (float[] q : new float[][]{{-0.7f, 8.93f}, {0.7f, 8.93f}, {0, 9.32f}}) wire(g, x, z + q[0], xn, zn + q[0], q[1]); } }
        // фонари, ограждения, столбики
        for (float[] side : new float[][]{{-28, -1, 0}, {-42, 1, 21}}) if (side[0] >= z0 && side[0] < z1) { for (float x = (float) Math.ceil((x0 - side[2]) / 42) * 42 + side[2]; x < x1; x += 42) { g.cyl(mGalv, x, 4.5f, side[0], 0.09f, 9); g.box(mGalv, x, 8.9f, side[0] + side[1] * 1.2f, 0.1f, 0.1f, 2.4f); g.box(mLampHead, x, 8.8f, side[0] + side[1] * 2.3f, 0.3f, 0.12f, 0.6f); g.spr(new Spr(x, 8.7f, side[0] + side[1] * 2.3f, 3, 0xffd8a0, 0.7f)); C.lights.add(new Light(x, 8.5f, side[0] + side[1] * 2.3f, 0xffc880, 1.2f, 16)); }
            float fzz = side[0] - side[1] * 0.6f; g.box(mFence, x0 + CS / 2, 0.6f, fzz, CS, 0.3f, 0.05f); for (float x = (float) Math.ceil(x0 / 4) * 4; x < x1; x += 4) g.box(mFence, x, 0.35f, fzz + side[1] * 0.08f, 0.1f, 0.7f, 0.1f); }
        if (-27.4f >= z0 && -27.4f < z1) for (float x = (float) Math.ceil(x0 / 21) * 21 + 7; x < x1; x += 63) { g.box(mStripe, x, 0.6f, -27.4f, 0.12f, 1.2f, 0.12f); for (int k = 0; k < 3; k++) g.box(mDark, x, 0.3f + k * 0.35f, -27.4f, 0.13f, 0.1f, 0.13f); }
        // тополя вдоль трассы
        if (z0 < -14 && z1 > -27) { float rowZ = -21 + (float) Math.sin(cx * 1.7f) * 2; float x = x0 + r.f() * 4; boolean dense = hash(cx, 21, 0) < 0.7f;
            while (x < x1) { if (dense || r.f() < 0.4f) tree(g, r, 0, x, rowZ + (r.f() - 0.5f) * 1.2f, 0.85f + r.f() * 0.35f); x += 4.5f + r.f() * (dense ? 3 : 12); } }
        // разное
        for (int i = 0; i < 22; i++) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; if (Math.abs(z - pathC(x)) < 2.8f || Math.abs(z - ROAD_C) < ROAD_HW + 2.5f || blocked(C, x, z, 3)) continue; float p = r.f();
            boolean mid = z > -26 && z < -3; int kind = mid ? (p < 0.45f ? 2 : p < 0.65f ? 3 : p < 0.78f ? 1 : -1) : (p < 0.3f ? 2 : p < 0.45f ? 1 : p < 0.55f ? 0 : -1); if (kind < 0) continue; tree(g, r, kind, x, z, 0.8f + r.f() * 0.5f); }
        for (int i = 0; i < 3; i++) { float x = x0 + r.f() * CS, z = pathC(x) + (r.f() < 0.5f ? -1 : 1) * (3.2f + r.f() * 2.5f); if (z >= z0 && z < z1 && r.f() < 0.5f) tree(g, r, 3, x, z, 0.7f + r.f() * 0.4f); }
        for (int i = 0; i < 5; i++) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; if (Math.abs(z - pathC(x)) < 2 || Math.abs(z - ROAD_C) < ROAD_HW + 1) continue; float t = r.f();
            if (t < 0.3f) g.mb(mBark, 1).cyl(x, 0.15f, z, 0.3f, 0.26f, 0.4f, 0, 0, 10); else if (t < 0.6f) g.mb(mStone).sphere(x, 0.1f, z, 0.5f + r.f() * 0.5f, 0.35f, 0.5f + r.f() * 0.4f); else g.box(mBrick, x, 0.06f, z, 0.25f, 0.12f, 0.12f); }
        g.done(); e.groups.add(g); e.lights.addAll(C.lights); return C;
    }
    float hash(int a, int b, int s) { Rng r = new Rng(a * 73856093 ^ b * 19349663 ^ s * 83492791); return r.f(); }
    boolean blocked(Chunk C, float x, float z, float pad) { for (float[] b : C.boxes) if (Math.abs(x - b[0]) < b[2] + pad && Math.abs(z - b[1]) < b[3] + pad) return true; return false; }
    void stream() { int cx = (int) Math.floor(px / CS), cz = (int) Math.floor(pz / CS);
        for (int i = cx - 2; i <= cx + 2; i++) for (int j = cz - 2; j <= cz + 2; j++) { long k = ((long) i << 32) ^ (j & 0xffffffffL); if (!chunks.containsKey(k)) chunks.put(k, build(i, j)); }
        Iterator<Map.Entry<Long, Chunk>> it = chunks.entrySet().iterator(); while (it.hasNext()) { Map.Entry<Long, Chunk> en = it.next(); int i = (int) (en.getKey() >> 32), j = (int) (long) en.getKey().intValue(); if (Math.abs(i - cx) > 3 || Math.abs(j - cz) > 3) { e.groups.remove(en.getValue().g); en.getValue().g.free(); e.lights.removeAll(en.getValue().lights); it.remove(); } } }

    // ---------- машины ----------
    void carTick(float dt) {
        if (cars.size() < 4 && rnd.nextFloat() < dt * 0.25f) { Car c = new Car(); boolean east = rnd.nextBoolean(); c.v = (east ? 1 : -1) * (14 + rnd.nextFloat() * 8); c.z = east ? ROAD_C + 2.5f : ROAD_C - 2.5f; c.x = px - Math.signum(c.v) * 140;
            Group g = new Group(); int[] cols = {0xd0d0d0, 0x2a2a2e, 0x8a1a1a, 0x6a7a8a, 0xe8e8e0, 0x3a5a3a}; Mat body = Mat.c(cols[rnd.nextInt(cols.length)]).spec(0.4f);
            g.box(body, 0, 0.75f, 0, 4.2f, 0.8f, 1.8f); g.box(mGlass, -0.2f, 1.35f, 0, 2.2f, 0.5f, 1.6f); for (float sx : new float[]{-1.3f, 1.3f}) for (float sz : new float[]{-0.8f, 0.8f}) g.mb(mDark).cyl(sx, 0.35f, sz, 0.35f, 0.35f, 0.25f, (float) Math.PI / 2, 0, 10);
            float dir = Math.signum(c.v); for (float sz : new float[]{-0.65f, 0.65f}) { g.spr(new Spr(dir * 2.15f, 0.75f, sz, 1.6f, 0xfff4e0, 0.9f)); g.spr(new Spr(-dir * 2.15f, 0.8f, sz, 0.7f, 0xff3020, 0.8f)); }
            g.done(); c.g = g; e.groups.add(g); cars.add(c); }
        float bd = 1e9f;
        for (int i = cars.size() - 1; i >= 0; i--) { Car c = cars.get(i); c.x += c.v * dt; c.g.x = c.x; c.g.z = c.z; c.g.upd(); float d = (float) Math.hypot(c.x - px, c.z - pz); if (d < bd) bd = d;
            if (Math.abs(c.x - px) < 2.4f && Math.abs(c.z - pz) < 1.2f && hitT <= 0) { hitT = 3; snd.thump(0.9f, 60, 0.4f); g.toast("Всё сначала.", 2500); px = 0; pz = pathC(0); g.yaw = (float) -Math.PI / 2; }
            if (Math.abs(c.x - px) > 220) { e.groups.remove(c.g); c.g.free(); cars.remove(i); } }
        snd.motorF = 45; snd.motorG = Math.max(0, 1 - bd / 90) * 0.06f; snd.noiseG = Math.max(0, 1 - bd / 70) * 0.05f; snd.noiseCut = 500;
    }

    // ---------- прохожие (фото людей) ----------
    static final class Walker { Obj o; float x, z, dx, dz, h, t; }
    final ArrayList<Walker> walkers = new ArrayList<>(); Group wg; float walkT = 2;
    static final int[] WALK_IDS = {0, 1, 2, 3, 4, 5, 6, 7};
    void walkTick(float dt, int max, float minD, float maxD, float vanish) {
        if (wg == null) { wg = new Group(); e.groups.add(wg); }
        walkT -= dt;
        if (walkers.size() < max && walkT < 0) { walkT = 1.5f + rnd.nextFloat() * 3;
            for (int tries = 0; tries < 8; tries++) { float a = rnd.nextFloat() * 6.283f, d = minD + rnd.nextFloat() * (maxD - minD); float x = px + (float) Math.sin(a) * d, z = pz + (float) Math.cos(a) * d; if (!walkable(x, z)) continue;
                Walker w = new Walker(); int id = WALK_IDS[rnd.nextInt(WALK_IDS.length)]; w.h = id == 5 ? 1.3f : 1.66f + rnd.nextFloat() * 0.12f; w.x = x; w.z = z; float b = rnd.nextFloat() * 6.283f; w.dx = (float) Math.sin(b) * 1.15f; w.dz = (float) Math.cos(b) * 1.15f;
                w.o = Engine.person(wg, id, x, 0, z, w.h); walkers.add(w); break; } }
        for (int i = walkers.size() - 1; i >= 0; i--) { Walker w = walkers.get(i); w.t += dt; float nx = w.x + w.dx * dt, nz = w.z + w.dz * dt; if (!walkable(nx, nz)) { w.dx = -w.dx; w.dz = -w.dz; } else { w.x = nx; w.z = nz; }
            float d = (float) Math.hypot(w.x - px, w.z - pz); w.o.bx = w.x; w.o.bz = w.z; w.o.by = (float) Math.abs(Math.sin(w.t * 5.5f)) * 0.025f;
            if (d < vanish || d > maxD + 30 || w.t > 90) { w.o.vis = false; wg.objs.remove(w.o); walkers.remove(i); } } }
    boolean walkable(float x, float z) { if (Math.abs(z - ROAD_C) < ROAD_HW + 1) return false; for (Chunk C : chunks.values()) for (float[] b : C.boxes) if (Math.abs(x - b[0]) < b[2] + 0.6f && Math.abs(z - b[1]) < b[3] + 0.6f) return false; return true; }
    // ---------- кадр ----------
    @Override void button(String id) { if (!id.equals("E")) return; for (Chunk C : chunks.values()) for (Coin c : C.coins) if (!c.got && Math.hypot(c.x - px, c.z - pz) < 1.4f) { take(c); return; } }
    void take(Coin c) { c.got = true; c.o.vis = false; money += c.val; got.add(c.key); g.prefs().edit().putInt("tropa_money", money).putStringSet("tropa_got", new java.util.HashSet<>(got)).apply(); snd.tone(1320, 0.12f, 0.06f); g.h.postDelayed(() -> snd.tone(1760, 0.18f, 0.05f), 90); g.toast("+" + c.val + " ₽", 1000); }
    @Override void update(float dt) {
        hitT -= dt;
        float fx = g.sx, fz = g.sy, fl = (float) Math.hypot(fx, fz); if (fl > 1) { fx /= fl; fz /= fl; }
        if (fl > 0.05f) { float sp = (1.7f + Math.max(0, fl - 0.9f) * 12) * dt; float cs = (float) Math.cos(g.yaw), sn = (float) Math.sin(g.yaw); float dx = (fx * cs + fz * sn) * sp, dz = (-fx * sn + fz * cs) * sp;
            float nx = px + dx, nz = pz + dz; for (Chunk C : chunks.values()) for (float[] b : C.boxes) if (Math.abs(nx - b[0]) < b[2] + R && Math.abs(nz - b[1]) < b[3] + R) { if (Math.abs(px - b[0]) < b[2] + R) nz = pz; else nx = px; }
            px = nx; pz = nz; float ob = bob; bob += fl * dt * 9; if ((int) (ob / Math.PI) != (int) (bob / Math.PI)) { boolean onPath = Math.abs(pz - pathC(px)) < 1.3f; snd.noise(0.09f, onPath ? 0.06f : 0.035f, onPath ? 0.5f : 0.2f); } }
        stream(); carTick(dt); walkTick(dt, 2, 30, 55, 14);
        // монеты крутятся, подсказка
        float tt = System.nanoTime() / 1e9f; String pr = "";
        for (Chunk C : chunks.values()) for (Coin c : C.coins) { if (c.got) continue; c.o.at(c.x, c.y + (float) Math.sin(tt * 2 + c.x) * 0.05f, c.z); android.opengl.Matrix.rotateM(c.o.M, 0, tt * 90 % 360, 0, 1, 0); if (Math.hypot(c.x - px, c.z - pz) < 1.4f) pr = "E — подобрать " + (c.val == 100 ? "слиток" : c.val == 50 ? "горстку монет" : "монету"); }
        g.prompt(pr);
        ambT -= dt; if (ambT < 0) { ambT = 5 + rnd.nextFloat() * 12; float t = rnd.nextFloat(); if (t < 0.4f) { for (int k = 0; k < 2 + rnd.nextInt(2); k++) { final int kk = k; g.h.postDelayed(() -> snd.noise(0.25f, 0.06f, 0.6f), kk * 400); } } else if (t < 0.7f) snd.thump(0.06f, 50, 0.8f); }
        float cy = 1.64f + (float) Math.sin(bob) * 0.035f;
        e.cx = px; e.cy = cy; e.cz = pz; e.yaw = g.yaw; e.pitch = g.pitch; e.roll = (float) Math.sin(bob * 0.5f) * 0.004f;
        g.hud("ноябрь · туман\n🪙 " + money + " ₽");
    }
}
