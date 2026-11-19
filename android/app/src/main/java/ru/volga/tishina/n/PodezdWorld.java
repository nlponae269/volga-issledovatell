package ru.volga.tishina.n;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Random;

/** Мир «Подъезд»: новогодняя ночь, лестница без конца, лифт с вводом любого этажа (переполнение int32). */
final class PodezdWorld extends World {
    static final float FH = 2.8f, PW = 2.7f, PL = 2.7f, WELL0 = 1.28f, WELL1 = 1.42f, MIDD = 1.5f, LAND = 2.0f, LX0 = -1.6f, LX1 = 4.3f;
    static final float EX0 = 2.95f, EX1 = 4.15f, EXC = (EX0 + EX1) / 2, EZ1 = -LAND - 1.45f, R = 0.24f;
    static final String[] SCRIB = {"Цой жив", "ЛЁХА", "Здесь был Вася", "Спартак", "КИНО", "не курить!!!", "2007", "Катя + Дима", "АУ", "выхода нет", "13"};
    final Random rnd = new Random();
    BigInteger base = BigInteger.ZERO;             // настоящий этаж = base + n + 1
    float px = PW / 2 + 0.3f, py = 0, pz = -1.0f, bob; boolean flash = true;
    int trash; float ambT = 6, saluteT = 3, glitchT;
    Mat[] mWall; Mat mTile, mTile2, mConc, mCeil, mPaint, mFrame, mGlass, mRad, mBars, mRail, mDerm, mDermRed, mMetal, mMetalGrey, mWood, mMail, mBoard, mShield, mChute, mLiftDoor, mLiftWall, mLiftFloor, mLiftPanel, mLiftLamp, mDisp, mBulb, mBulbOff, mBlack, mNight, mChrome, mGalv, mBag, mPaper, mBottle, mCan, mFlake, mNotice, mPot, mLeaf;
    Mat[] mTinsel;

    static final class Door { float x, z; int apt; boolean party, home; }
    static final class Trash { Obj o; float x, z; boolean got; }
    final class Floor { int n; Group g; Obj dl, dr; Light bulb, cab; boolean flick; float ph; boolean openW; final ArrayList<Door> doors = new ArrayList<>(); final ArrayList<Trash> trash = new ArrayList<>(); }
    final HashMap<Integer, Floor> floors = new HashMap<>();
    // лифт
    int liftN = 0; float liftOpen = 0, liftTgt = 0, liftT, liftDur; String liftSt = "idle"; BigInteger liftFrom = BigInteger.ONE, liftDest = BigInteger.ONE; String liftShow = ""; boolean glitch;
    // коллизии (одинаковы на всех этажах): x, z, hx, hz
    final float[][] cols = {
        {-0.12f, (PL + MIDD) / 2, 0.12f, (PL + MIDD) / 2}, {PW + 0.12f, (PL + MIDD) / 2, 0.12f, (PL + MIDD) / 2}, {PW / 2, PL + MIDD + 0.1f, PW / 2, 0.12f},
        {(WELL0 + WELL1) / 2, PL / 2 + 0.02f, (WELL1 - WELL0) / 2 + 0.02f, PL / 2 + 0.02f},
        {(LX0 + EX0) / 2, -LAND - 0.1f, (EX0 - LX0) / 2, 0.12f}, {(EX1 + LX1) / 2, -LAND - 0.1f, (LX1 - EX1) / 2, 0.12f},
        {EX0 - 0.08f, (EZ1 - LAND) / 2, 0.08f, 0.8f}, {EX1 + 0.08f, (EZ1 - LAND) / 2, 0.08f, 0.8f}, {EXC, EZ1 - 0.08f, 0.7f, 0.08f},
        {LX0 - 0.1f, -LAND / 2, 0.12f, LAND / 2 + 0.1f}, {LX1 + 0.1f, -LAND / 2, 0.12f, LAND / 2 + 0.1f}, {LX0 / 2, 0.1f, -LX0 / 2, 0.12f}, {(PW + LX1) / 2, 0.1f, (LX1 - PW) / 2, 0.12f},
        {EXC, -LAND - 0.1f, (EX1 - EX0) / 2, 0.12f}};   // последняя — проём лифта (снимается, когда двери открыты)

    @Override String[] buttons() { return new String[]{"E", "🔦"}; }
    static float podLocal(float x, float z) { if (z < 0) return 0; if (z > PL) return FH / 2; return x < (WELL0 + WELL1) / 2 ? (z / PL) * FH / 2 : FH / 2 + (1 - z / PL) * FH / 2; }
    static float podSurface(float x, float z, float y) { float s = podLocal(x, z); float n = (float) Math.floor((y + 0.45f - s) / FH); return n * FH + s; }
    BigInteger real(int n) { return base.add(BigInteger.valueOf(n + 1)); }

    @Override void init() {
        e.fogD = 0.09f; e.col3(e.fogC, 0x06070a, 1); e.col3(e.clear, 0x050608, 1); e.col3(e.sky, 0x2a2c34, 0.18f); e.col3(e.gnd, 0x141210, 0.18f); e.dirC = new float[]{0, 0, 0}; e.exposure = 1.35f; e.vig = 0.65f; e.fov = 72;
        String[] wl = {"podezd_wall_1", "podezd_wall_2", "podezd_wall_3", "podezd_wall_4", "podezd_wall_5", "podezd_wall_6"}; mWall = new Mat[wl.length];
        for (int i = 0; i < wl.length; i++) mWall[i] = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/" + wl[i] + ".jpg"));
        mTile = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_floor.jpg")).spec(0.3f); mTile2 = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_floor2.jpg")).spec(0.3f);
        mConc = Mat.c(0xd8d8d8).tex(Tex.file("res/tex/ai/pod_steps.jpg")); mCeil = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_ceil.jpg"));
        mPaint = Mat.c(0x4c4033); mFrame = Mat.c(0xb8ae9a); mGlass = Mat.c(0xb8c0b8).alpha(0.35f).spec(0.6f); mRad = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_radiator.jpg"));
        mBars = Mat.c(0x2a2c2c).spec(0.4f); mRail = Mat.c(0x4a2c1e).spec(0.5f);
        mDerm = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/door_derm.jpg")); mDermRed = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/door_derm_red.jpg")); mMetal = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/door_metal.jpg")).spec(0.4f);
        mMetalGrey = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/door_metal_grey.jpg")).spec(0.4f); mWood = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/door_wood.jpg"));
        mMail = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/mailboxes.jpg")); mBoard = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_notices.jpg")); mShield = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_shchitok.jpg")); mChute = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/pod_chute.jpg"));
        mLiftDoor = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/lift_door.jpg")).spec(0.4f); mLiftWall = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/lift_wall.jpg")); mLiftFloor = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/lift_floor.jpg")); mLiftPanel = Mat.c(0xffffff).tex(Tex.file("res/tex/ai/lift_panel.jpg"));
        mLiftLamp = Mat.unlit(0xfff0d0); mDisp = Mat.unlit(0xff3010); mBulb = Mat.unlit(0xfff2c8); mBulbOff = Mat.c(0x8a8478); mBlack = Mat.c(0x0a0a0a); mNight = Mat.unlit(0x0a0c14); mChrome = Mat.c(0xc8c8c8).spec(0.8f); mGalv = Mat.c(0x9aa0a0).spec(0.4f);
        mBag = Mat.c(0x1e1e1e).spec(0.5f); mPaper = Mat.c(0xd8d4c8); mBottle = Mat.c(0x2a6a3a).spec(0.8f); mCan = Mat.c(0xa8aab0).spec(0.8f); mPot = Mat.c(0x8a4a30); mLeaf = Mat.c(0x4a6a2a);
        mFlake = Mat.unlit(0xf2f2ec).tex(Tex.text("❄", 0x0b0b0b, 0xf2f2ec, 128, 128, 110)).two();
        mNotice = Mat.c(0xffffff).tex(noticeTex());
        mTinsel = new Mat[]{Mat.c(0xd8b030).emis(0xd8b030, 0.25f).spec(0.8f), Mat.c(0xc02828).emis(0xc02828, 0.25f).spec(0.8f), Mat.c(0x2aa048).emis(0x2aa048, 0.25f).spec(0.8f), Mat.c(0x3a6ad8).emis(0x3a6ad8, 0.25f).spec(0.8f)};
        trash = g.prefs().getInt("podezd_trash", 0);
        stream();
        g.yaw = (float) Math.PI; g.pitch = 0;
        g.toast("Новогодняя ночь. Подъезд.\nКвартира 47 — на третьем этаже.", 3500);
    }
    int noticeTex() { android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(256, 340, android.graphics.Bitmap.Config.ARGB_8888); android.graphics.Canvas c = new android.graphics.Canvas(bm); c.drawColor(0xFFECE6D6);
        android.graphics.Paint p = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG); p.setColor(0xFF222222); p.setTextAlign(android.graphics.Paint.Align.CENTER); p.setTypeface(android.graphics.Typeface.SERIF); p.setTextSize(26); p.setFakeBoldText(true); c.drawText("ОБЪЯВЛЕНИЕ", 128, 44, p); p.setFakeBoldText(false); p.setTextSize(18);
        String[] t = {"Уважаемые жильцы!", "1 января с 00:24", "до 00:25", "будет отключено", "время.", "Приносим извинения", "за неудобства.", "", "ЖЭУ № 3"}; for (int i = 0; i < t.length; i++) c.drawText(t[i], 128, 90 + i * 25, p);
        int id = Tex.up(bm, true, false); bm.recycle(); return id; }

    // ---------- этаж ----------
    Floor build(int n) {
        Floor F = new Floor(); F.n = n; Group g = new Group(); F.g = g; g.y = n * FH; BigInteger RB = real(n); int FD = RB.intValue(); Rng r = new Rng(FD * 7919 + 31);
        Mat wallM = mWall[((FD % 6) + 6) % 6];
        g.mb(FD % 2 != 0 ? mTile2 : mTile, 1.2f).box((LX0 + LX1) / 2, -0.06f, -LAND / 2, LX1 - LX0, 0.12f, LAND);
        g.mb(mCeil, 2).box((LX0 + LX1) / 2, FH - 0.2f, -LAND / 2, LX1 - LX0, 0.16f, LAND);
        g.mb(mConc, 1).box(PW / 2, FH / 2 - 0.1f, PL + MIDD / 2, PW, 0.2f, MIDD);
        int NS = 9; float rise = FH / 2 / NS, tread = PL / NS;
        for (int k = 0; k < NS; k++) { float topA = (k + 1) * rise, zA = k * tread + tread / 2; g.mb(mConc, 1).box(WELL0 / 2, topA - 0.12f, zA, WELL0, 0.24f, tread + 0.01f);
            float topB = FH / 2 + (k + 1) * rise, zB = PL - k * tread - tread / 2; g.mb(mConc, 1).box((WELL1 + PW) / 2, topB - 0.12f, zB, PW - WELL1, 0.24f, tread + 0.01f); }
        float slope = (float) Math.atan2(FH / 2, PL), sl = (float) Math.hypot(FH / 2, PL);
        g.mb(mConc, 1).box(WELL0 / 2, FH / 4 - 0.25f, PL / 2, WELL0, 0.12f, sl, -slope, 0, 0); g.mb(mConc, 1).box((WELL1 + PW) / 2, FH * 0.75f - 0.25f, PL / 2, PW - WELL1, 0.12f, sl, slope, 0, 0);
        MB W = g.mb(wallM, 2.8f);
        W.box(-0.06f, FH / 2, (PL + MIDD) / 2, 0.12f, FH, PL + MIDD); W.box(PW + 0.06f, FH / 2, (PL + MIDD) / 2, 0.12f, FH, PL + MIDD);
        float WZ = PL + MIDD + 0.06f, wy0 = FH / 2 + 0.9f, wy1 = FH / 2 + 2.2f, wx0 = PW / 2 - 0.65f, wx1 = PW / 2 + 0.65f;
        W.box(wx0 / 2, FH / 2, WZ, wx0, FH, 0.12f); W.box((wx1 + PW) / 2, FH / 2, WZ, PW - wx1, FH, 0.12f); W.box(PW / 2, wy0 / 2, WZ, wx1 - wx0, wy0, 0.12f); W.box(PW / 2, (wy1 + FH) / 2 + 0.02f, WZ, wx1 - wx0, FH - wy1 + 0.04f, 0.12f);
        g.box(mFrame, PW / 2, wy0 + 0.02f, WZ - 0.1f, 1.45f, 0.05f, 0.3f); g.box(mFrame, wx0, (wy0 + wy1) / 2, WZ, 0.07f, wy1 - wy0, 0.16f); g.box(mFrame, wx1, (wy0 + wy1) / 2, WZ, 0.07f, wy1 - wy0, 0.16f); g.box(mFrame, PW / 2, wy1, WZ, 1.4f, 0.07f, 0.16f); g.box(mFrame, PW / 2, (wy0 + wy1) / 2, WZ, 0.05f, wy1 - wy0, 0.12f);
        g.mb(mNight).plane(PW / 2, (wy0 + wy1) / 2, WZ + 0.4f, 1.6f, 1.6f, (float) Math.PI, 0);   // ночь за окном
        F.openW = r.f() < 0.55f;
        if (!F.openW) g.box(mGlass, PW / 2, (wy0 + wy1) / 2, WZ, 1.26f, wy1 - wy0 - 0.06f, 0.01f);
        else { g.box(mGlass, PW / 2 - 0.33f, (wy0 + wy1) / 2, WZ, 0.6f, wy1 - wy0 - 0.06f, 0.01f); g.mb(mFrame).box(wx1 - 0.3f * (float) Math.cos(1.1), (wy0 + wy1) / 2, WZ - 0.05f - 0.3f * (float) Math.sin(1.1), 0.6f, wy1 - wy0 - 0.08f, 0.03f, 0, -1.1f, 0); }
        g.box(mRad, PW / 2, FH / 2 + 0.42f, WZ - 0.2f, 1.0f, 0.55f, 0.12f);
        g.cyl(mGalv, PW / 2 + 0.45f, wy0 + 0.1f, WZ - 0.12f, 0.05f, 0.12f);
        if (r.f() < 0.5f) { g.cyl(mPot, PW / 2 - 0.4f, wy0 + 0.09f, WZ - 0.12f, 0.07f, 0.13f); g.mb(mLeaf).sphere(PW / 2 - 0.4f, wy0 + 0.25f, WZ - 0.12f, 0.24f, 0.2f, 0.24f); }
        W.box((LX0 + EX0) / 2, FH / 2, -LAND - 0.06f, EX0 - LX0, FH, 0.12f); W.box((EX1 + LX1) / 2, FH / 2, -LAND - 0.06f, LX1 - EX1, FH, 0.12f); W.box(EXC, (2.15f + FH) / 2, -LAND - 0.06f, EX1 - EX0, FH - 2.15f, 0.12f);
        W.box(LX0 - 0.06f, FH / 2, -LAND / 2, 0.12f, FH, LAND); W.box(LX1 + 0.06f, FH / 2, -LAND / 2, 0.12f, FH, LAND);
        W.box(LX0 / 2, FH / 2, 0.06f, -LX0, FH, 0.12f); W.box((PW + LX1) / 2, FH / 2, 0.06f, LX1 - PW, FH, 0.12f);
        // лифт
        for (float[] q : new float[][]{{EX0 + 0.03f, 1.07f, 0.08f, 2.14f}, {EX1 - 0.03f, 1.07f, 0.08f, 2.14f}, {EXC, 2.14f, EX1 - EX0, 0.08f}}) g.box(mGalv, q[0], q[1], -LAND + 0.01f, q[2], q[3], 0.04f);
        g.box(mLiftFloor, EXC, -0.05f, (EZ1 - LAND) / 2, EX1 - EX0, 0.1f, -LAND - EZ1);
        g.box(mLiftWall, EX0 - 0.02f, 1.2f, (EZ1 - LAND) / 2 - 0.06f, 0.04f, 2.4f, -LAND - EZ1 - 0.12f); g.box(mLiftWall, EX1 + 0.02f, 1.2f, (EZ1 - LAND) / 2 - 0.06f, 0.04f, 2.4f, -LAND - EZ1 - 0.12f); g.box(mLiftWall, EXC, 1.2f, EZ1, EX1 - EX0, 2.4f, 0.04f);
        g.box(mPaint, EXC, 2.38f, (EZ1 - LAND) / 2, EX1 - EX0, 0.04f, -LAND - EZ1); g.box(mLiftLamp, EXC, 2.35f, (EZ1 - LAND) / 2, 0.5f, 0.02f, 0.3f);
        g.box(mLiftPanel, EX1 - 0.03f, 1.35f, -LAND - 0.45f, 0.04f, 0.5f, 0.22f); g.box(mDisp, EX1 - 0.055f, 1.52f, -LAND - 0.45f, 0.01f, 0.08f, 0.16f); g.box(Mat.unlit(0xff2010), EX0 - 0.2f, 1.2f, -LAND + 0.02f, 0.06f, 0.06f, 0.03f);
        // объявление, мишура, снежинки
        g.mb(mNotice).plane(2.7f, 1.5f, -LAND + 0.01f, 0.3f, 0.4f, 0, 0);
        for (int k = 0; k < 12; k++) { float t = k / 12f; g.mb(mTinsel[k % 4]).box(WELL0, 0.95f + t * FH / 2 + (float) Math.sin(t * 25) * 0.03f, t * PL, 0.025f, 0.025f, 0.2f, 0.4f * k, 0, 0); }
        for (int k = 0; k < 2; k++) g.mb(mFlake).plane(PW / 2 - 0.3f + k * 0.55f, FH / 2 + 1.5f + r.f() * 0.4f, PL + MIDD - 0.005f, 0.2f, 0.2f, (float) Math.PI, 0);
        // номер этажа
        String ns = RB.toString(); g.mb(Mat.unlit(0xffffff).tex(Tex.text(ns, 0x3a3630, 0xf0ebdc, Math.max(128, 64 * ns.length()), 128, 88))).plane(LX0 / 2, 1.75f, 0.0f, ns.length() > 3 ? 0.22f * Math.min(ns.length(), 22) : 0.45f, 0.45f, (float) Math.PI, 0);
        g.mb(mShield).plane(LX1 - 0.012f, 1.5f, -1.45f, 0.5f, 0.66f, (float) -Math.PI / 2, 0);
        if (FD % 2 != 0) g.mb(mChute).plane(LX0 + 0.012f, 0.9f, -1.45f, 0.5f, 0.5f, (float) Math.PI / 2, 0);
        g.mb(mBoard).plane(1.25f, 1.55f, -LAND + 0.012f, 0.7f, 0.7f, 0, 0);
        if (FD == 1) g.mb(mMail).plane(LX0 / 2, 1.05f, -0.006f, 0.9f, 0.6f, (float) Math.PI, 0);
        // надпись маркером
        if (r.f() < 0.6f) g.mb(Mat.unlit(0xffffff).tex(scribble(SCRIB[r.i(SCRIB.length)])).alpha(0.85f)).plane(LX0 + 0.007f, 1.0f + r.f() * 0.4f, -0.4f - r.f() * 1.0f, 0.7f, 0.25f, (float) Math.PI / 2, 0);
        // двери квартир
        int pk = r.f() < 0.35f ? r.i(4) : -1;
        float[][] doors = {{0.25f, -LAND, 0}, {PW - 0.25f - 0.9f, -LAND, 0}, {LX0, -LAND / 2 - 0.45f, 1}, {LX1, -LAND / 2 + 0.45f, -1}};
        for (int k = 0; k < 4; k++) { float dx = doors[k][0], dz = doors[k][1]; int side = (int) doors[k][2];
            boolean metal = r.f() < 0.3f, wood = !metal && r.f() < 0.3f; Mat DM = metal ? (r.f() < 0.4f ? mMetalGrey : mMetal) : wood ? mWood : r.f() < 0.35f ? mDermRed : mDerm;
            if (side == 0) { g.box(mPaint, dx + 0.45f, 1.06f, dz + 0.02f, 1.02f, 2.14f, 0.05f); g.box(DM, dx + 0.45f, 1.02f, dz + 0.05f, 0.9f, 2.04f, 0.04f); g.box(mChrome, dx + 0.8f, 1.0f, dz + 0.09f, 0.03f, 0.14f, 0.03f); g.box(Mat.c(0xeeeeee), dx + 1.03f, 1.45f, dz + 0.04f, 0.05f, 0.08f, 0.02f); }
            else { float xx = dx + side * 0.02f; g.box(mPaint, xx, 1.06f, dz, 0.05f, 2.14f, 1.02f); g.box(DM, xx + side * 0.03f, 1.02f, dz, 0.04f, 2.04f, 0.9f); g.box(mChrome, xx + side * 0.07f, 1.0f, dz - side * 0.35f, 0.03f, 0.14f, 0.03f); }
            Door d = new Door(); d.x = side == 0 ? dx + 0.45f : dx + side * 0.3f; d.z = side == 0 ? dz + 0.3f : dz; d.apt = 36 + (FD - 1) * 4 + k + 1; d.home = FD == 3 && k == 2 && RB.equals(BigInteger.valueOf(3)); d.party = k == pk && !d.home; F.doors.add(d);
            // номер квартиры
            g.mb(Mat.unlit(0xffffff).tex(Tex.text(String.valueOf(d.apt), 0xd8c890, 0x222222, 192, 96, 64))).plane(side == 0 ? dx + 0.45f : dx + side * 0.075f, 1.75f, side == 0 ? dz + 0.075f : dz, 0.14f, 0.07f, side == 0 ? 0 : (float) (side * Math.PI / 2), 0); }
        // перила
        float[][] rails = {{WELL0, 0, PL, 0, FH / 2}, {WELL1, PL, 0, FH / 2, FH}};
        for (float[] q : rails) { float x = q[0], zs = q[1], ze = q[2], ys = q[3], ye = q[4];
            for (int k = 0; k <= 10; k++) { float t = k / 10f, z = zs + (ze - zs) * t, yb = ys + (ye - ys) * t; g.box(mBars, x, yb + 0.45f, z, 0.02f, 0.9f, 0.02f); }
            pipe(g, mRail, x, ys + 0.92f, zs, x, ye + 0.92f, ze, 0.03f); pipe(g, mBars, x, ys + 0.12f, zs, x, ye + 0.12f, ze, 0.01f); }
        pipe(g, mRail, WELL0, FH / 2 + 0.92f, PL, WELL1, FH / 2 + 0.92f, PL, 0.03f);
        // лампочка
        boolean on = r.f() < 0.7f; float bx = (LX0 + LX1) / 2 + 0.3f, bz = -LAND / 2; g.box(mBlack, bx, FH - 0.26f, bz, 0.01f, 0.28f, 0.01f); g.mb(on ? mBulb : mBulbOff).sphere(bx, FH - 0.45f, bz, 0.07f, 0.09f, 0.07f);
        if (on) { F.bulb = new Light(bx, FH - 0.55f, bz, 0xffd8a0, 1.5f, 7.5f); F.bulb.grp = g; F.flick = r.f() < 0.3f; F.ph = r.f() * 100; e.lights.add(F.bulb); }
        F.cab = new Light(EXC, 2.2f, (EZ1 - LAND) / 2, 0xfff0d0, 1.0f, 4.5f); F.cab.grp = g; e.lights.add(F.cab);
        // хлам
        if (r.f() < 0.35f) g.box(mBag, LX0 + 0.4f, 0.25f, -LAND + 0.4f, 0.5f, 0.5f, 0.45f);
        if (r.f() < 0.3f) g.box(Mat.c(0x8a6a4a), PW / 2 + 0.6f, FH / 2 + 0.2f, PL + MIDD - 0.4f, 0.45f, 0.4f, 0.35f);
        // мусор (коллекция)
        float[][] spots = {{LX0 + 0.5f + r.f() * 4.5f, -0.3f - r.f() * 1.4f, 0}, {0.3f + r.f() * 0.7f, PL + 0.3f + r.f() * 1, FH / 2}, {PW / 2 + (r.f() - 0.5f) * 1.6f, PL + 0.4f + r.f() * 0.9f, FH / 2}};
        String done = g.vis ? "" : ""; java.util.Set<String> got = g == null ? null : this.g.prefs().getStringSet("podezd_got", new java.util.HashSet<>());
        for (int k = 0; k < 3; k++) { if (r.f() >= 0.45f) continue; String key = RB + "," + k; if (got.contains(key)) continue; float[] sp = spots[k]; Trash t = new Trash(); t.x = sp[0]; t.z = sp[1];
            MB m = new MB(); int kind = r.i(3); Mat tm; if (kind == 0) { m.sphere(0, 0.06f, 0, 0.14f, 0.11f, 0.13f); tm = mPaper; } else if (kind == 1) { m.cyl(0, 0.04f, 0, 0.035f, 0.035f, 0.26f, 0, (float) Math.PI / 2, 10); tm = mBottle; } else { m.cyl(0, 0.06f, 0, 0.035f, 0.035f, 0.12f, 0, 0, 10); tm = mCan; }
            t.o = g.add(m.build(), tm); t.o.at(sp[0], sp[2], sp[1]); t.z = sp[1]; trashY.put(t, sp[2]); trashKey.put(t, key); F.trash.add(t); }
        g.done(); e.groups.add(g);
        // двери лифта
        MB dm = new MB(); dm.box(0, 0, 0, (EX1 - EX0) / 2, 2.08f, 0.04f); Mesh dmm = dm.build(); F.dl = g.add(dmm, mLiftDoor); F.dr = g.add(dmm, mLiftDoor);
        return F;
    }
    final HashMap<Trash, Float> trashY = new HashMap<>(); final HashMap<Trash, String> trashKey = new HashMap<>();
    int scribble(String t) { String key = "scr:" + t; Integer c = Tex.cache.get(key); if (c != null) return c; android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(512, 180, android.graphics.Bitmap.Config.ARGB_8888); android.graphics.Canvas cv = new android.graphics.Canvas(bm);
        android.graphics.Paint p = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG); p.setColor(new int[]{0xE0141414, 0xD08C1414, 0xD0141E5A}[Math.abs(t.hashCode()) % 3]); p.setTextSize(78); p.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.SANS_SERIF, android.graphics.Typeface.ITALIC)); cv.rotate(-4, 256, 90); cv.drawText(t, 20, 120, p);
        int id = Tex.up(bm, true, false); bm.recycle(); Tex.cache.put(key, id); return id; }
    void pipe(Group g, Mat m, float x0, float y0, float z0, float x1, float y1, float z1, float r) { float dy = y1 - y0, dz = z1 - z0, dx = x1 - x0; float l = (float) Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dx) > Math.abs(dz)) g.mb(m).cyl((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, r, r, l, 0, (float) -Math.atan2(dx, dy), 8);
        else g.mb(m).cyl((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, r, r, l, (float) Math.atan2(dz, dy), 0, 8); }
    void freeFloor(Floor F) { e.groups.remove(F.g); F.g.free(); if (F.bulb != null) e.lights.remove(F.bulb); e.lights.remove(F.cab); }
    int curN() { return (int) Math.floor((py + 0.5f) / FH); }
    void stream() { int c = curN(); for (int n = c - 2; n <= c + 2; n++) if (!floors.containsKey(n)) floors.put(n, build(n));
        Iterator<Map.Entry<Integer, Floor>> it = floors.entrySet().iterator(); while (it.hasNext()) { Map.Entry<Integer, Floor> en = it.next(); if (Math.abs(en.getKey() - c) > 3) { freeFloor(en.getValue()); it.remove(); } } }
    void clearAll() { for (Floor F : floors.values()) freeFloor(F); floors.clear(); }

    // ---------- взаимодействие ----------
    boolean inCabin() { return px > EX0 && px < EX1 && pz < -LAND - 0.15f && pz > EZ1; }
    Object nearest; String nearLabel = "";
    void findNear() {
        nearest = null; nearLabel = ""; int c = curN(); Floor F = floors.get(c); if (F == null) return; float ly = py - c * FH; float best = 1.2f;
        if (liftSt.equals("idle") && inCabin()) { nearest = "dial"; nearLabel = "E — набрать этаж"; return; }
        if (!inCabin() && liftSt.equals("idle") && !(liftN == c && liftOpen > 0.5f) && Math.hypot(px - EXC, pz - (-LAND + 0.55f)) < 1.1f && ly < 0.5f) { nearest = "call"; nearLabel = "E — вызвать лифт"; return; }
        for (Trash t : F.trash) { if (t.got) continue; float d = (float) Math.hypot(px - t.x, pz - t.z); if (d < best && Math.abs(ly - trashY.get(t)) < 1) { best = d; nearest = t; nearLabel = "E — подобрать мусор"; } }
        if (ly < 0.5f) for (Door d : F.doors) { float dd = (float) Math.hypot(px - d.x, pz - d.z); if (dd < best) { best = dd; nearest = d; nearLabel = d.home ? "E — домой, кв. 47" : "E — постучать"; } }
        if (Math.hypot(px - PW / 2, pz - (PL + MIDD - 0.3f)) < 1.0f && ly > 0.9f && F.openW) { nearest = "win"; nearLabel = "E — вылезти в окно (во двор)"; }
    }
    void act() {
        if (nearest == null) return;
        if (nearest instanceof Trash) { Trash t = (Trash) nearest; t.got = true; t.o.vis = false; trash++; java.util.Set<String> got = new java.util.HashSet<>(g.prefs().getStringSet("podezd_got", new java.util.HashSet<>())); got.add(trashKey.get(t));
            g.prefs().edit().putInt("podezd_trash", trash).putStringSet("podezd_got", got).apply(); snd.noise(0.15f, 0.12f, 0.5f); g.toast("Мусор: " + trash, 1200); return; }
        if (nearest instanceof Door) { Door d = (Door) nearest; for (int k = 0; k < 3; k++) { final int kk = k; g.h.postDelayed(() -> snd.thump(0.35f, 140, 0.08f), kk * 180); }
            if (d.home) { g.toast("Дверь квартиры не заперта.", 2000); g.goWeb("kvartira.html"); return; }
            String[] a = d.party ? new String[]{"За дверью музыка и смех. «…С Новым годом!» — но не тебе.", "Музыку сделали тише. Шаги к двери… и обратно.", "— Кто там? — Из-за двери пахнет мандаринами. Не открывают."}
                : new String[]{"Тишина.", "За дверью кто-то есть. Но не открывают.", "Никого.", "Где-то за дверью работает телевизор.", "Шаги… и снова тишина."};
            String msg = a[rnd.nextInt(a.length)] + "\nкв. " + d.apt; g.h.postDelayed(() -> g.toast(msg, 3200), 900); return; }
        if ("call".equals(nearest)) { int c = curN(); snd.tone(660, 0.15f, 0.06f); if (liftN == c) { liftTgt = 1; clank(); } else { liftSt = "coming"; liftT = 2 + Math.min(5, Math.abs(liftN - c) * 0.6f); snd.motorF = 55; snd.motorG = 0.05f; } return; }
        if ("dial".equals(nearest)) { g.askNumber("ЛИФТ · наберите этаж", "грузоподъёмность 320 кг · 4 человека · не курить", this::liftGo); return; }
        if ("win".equals(nearest)) { g.toast("Прыгаешь в сугроб под окном…", 2200); g.go("dvory"); }
    }
    void clank() { snd.thump(0.4f, 90, 0.2f); g.h.postDelayed(() -> snd.noise(0.12f, 0.08f, 0.7f), 120); }
    void liftGo(String v) {
        v = v.replaceAll("\\s+", ""); if (!v.matches("-?\\d{1,22}")) { g.toast("Лифт не знает такого этажа.", 2000); return; }
        BigInteger T = new BigInteger(v), cur = real(curN()); if (T.equals(cur)) { g.toast("Ты и так на этом этаже.", 2000); return; }
        liftDest = T; liftFrom = cur; liftTgt = 0; liftSt = "closing"; clank(); }
    @Override void button(String id) { if (id.equals("E")) act(); else { flash = !flash; snd.tone(1800, 0.03f, 0.05f); } }

    // ---------- кадр ----------
    @Override void update(float dt) {
        int c = curN();
        // лифт
        liftOpen += (liftTgt - liftOpen) * Math.min(1, dt * 4.4f);
        for (Floor F : floors.values()) { float o = F.n == liftN ? liftOpen : 0, w = (EX1 - EX0) / 4; F.dl.at(EX0 + w - o * w * 1.9f, 1.05f, -LAND - 0.08f); F.dr.at(EX1 - w + o * w * 1.9f, 1.05f, -LAND - 0.08f); }
        boolean gapOff = liftOpen > 0.75f && liftN == c;
        if (liftSt.equals("coming")) { liftT -= dt; if (liftT <= 0) { liftN = c; liftSt = "idle"; liftTgt = 1; snd.motorG = 0; snd.tone(988, 0.35f, 0.05f); g.h.postDelayed(() -> snd.tone(784, 0.5f, 0.05f), 300); clank(); } }
        else if (liftSt.equals("closing")) { if (liftOpen < 0.03f) { liftSt = "ride"; double dd = liftDest.subtract(liftFrom).abs().doubleValue(); liftDur = (float) Math.min(9, 2 + Math.log10(dd + 1) * 0.9); liftT = 0; snd.motorF = 55; snd.motorG = 0.06f; snd.noiseG = 0.03f; snd.noiseCut = 160; } }
        else if (liftSt.equals("ride")) { liftT += dt; float k = Math.min(1, liftT / liftDur), ee = k * k * (3 - 2 * k);
            java.math.BigDecimal from = new java.math.BigDecimal(liftFrom), span = new java.math.BigDecimal(liftDest.subtract(liftFrom)); liftShow = from.add(span.multiply(java.math.BigDecimal.valueOf(ee))).setScale(0, java.math.RoundingMode.HALF_UP).toBigInteger().toString();
            bob += dt * 2;
            if (k >= 1) { float ly = py - c * FH; clearAll(); base = liftDest.subtract(BigInteger.ONE); py = ly; liftN = 0; liftSt = "idle"; liftTgt = 1; snd.motorG = 0; snd.noiseG = 0; snd.tone(988, 0.35f, 0.05f); clank();
                int disp = liftDest.intValue(); glitch = !BigInteger.valueOf(disp).equals(liftDest);
                if (glitch) g.toast("ПЕРЕПОЛНЕНИЕ\nэтаж " + liftDest + " не помещается в int32\nтабло показывает " + disp, 5000);
                else if (liftDest.abs().compareTo(BigInteger.valueOf(1000000)) > 0) g.toast("Этаж " + liftDest + ".\nЗдесь тоже кто-то живёт.", 3500);
                stream(); c = curN(); } }
        // ходьба
        float fx = g.sx, fz = g.sy, fl = (float) Math.hypot(fx, fz); if (fl > 1) { fx /= fl; fz /= fl; }
        if (!liftSt.equals("ride") && fl > 0.05f) { float sp = (1.5f + Math.max(0, fl - 0.9f) * 9) * dt; float cs = (float) Math.cos(g.yaw), sn = (float) Math.sin(g.yaw);
            float dx = (fx * cs + fz * sn) * sp, dz = (-fx * sn + fz * cs) * sp; move(dx, dz, gapOff); float ob = bob; bob += fl * dt * 9;
            if ((int) (ob / Math.PI) != (int) (bob / Math.PI)) snd.noise(0.07f, 0.09f, 0.35f); }
        float sy = podSurface(px, pz, py); if (inCabin() || pz < -0.05f) { float base0 = (float) Math.floor((py + 0.45f) / FH) * FH; sy = base0; }
        py += (sy - py) * Math.min(1, dt * 14);
        stream();
        // переполнение пешком
        BigInteger rc = real(curN()); boolean gl = !BigInteger.valueOf(rc.intValue()).equals(rc);
        if (gl != glitch && !liftSt.equals("ride")) { glitch = gl; if (gl) g.toast("ЭТАЖ " + rc.intValue() + "\nТак не бывает.", 3000); }
        // свет: мерцание лампочек, глитч
        float tt = System.nanoTime() / 1e9f;
        for (Floor F : floors.values()) { if (F.bulb == null) continue; float k = 1.5f; if (F.flick) k *= (Math.sin(tt * 13 + F.ph) > 0.85 || Math.sin(tt * 7.3 + F.ph) > 0.97) ? 0.15f : 1; if (glitch) { F.bulb.set(0xff2014, rnd.nextFloat() < 0.05f ? 0.2f : 1.6f); } else F.bulb.set(0xffd8a0, k); }
        e.exposure = glitch && rnd.nextFloat() < 0.04f ? 0.4f + rnd.nextFloat() * 1.6f : 1.35f;
        // вечеринка за стеной
        float best = 99; for (Floor F : floors.values()) for (Door d : F.doors) if (d.party) { float dd = (float) Math.hypot(d.x - px, d.z - pz) + Math.abs(F.n * FH - py) * 5; if (dd < best) best = dd; }
        snd.partyG = clamp(1 - best / 16, 0, 1) * 0.45f;
        // звуки дома
        ambT -= dt; if (ambT < 0) { ambT = 6 + rnd.nextFloat() * 14; float t = rnd.nextFloat(); if (t < 0.4f) snd.thump(0.35f, 70, 0.3f); else if (t < 0.75f) { for (int k = 0; k < 6; k++) { final int kk = k; g.h.postDelayed(() -> snd.noise(0.06f, 0.05f, 0.4f), kk * 520); } } else snd.noise(0.6f, 0.04f, 0.05f); }
        // салют за окном
        saluteT -= dt; if (saluteT < 0) { saluteT = 2 + rnd.nextFloat() * 6; Floor F = floors.get(curN()); if (F != null && Math.abs(py - c * FH - FH / 2) < 2.5f) { int[] cols = {0xff4a3a, 0x4aff7a, 0xffd23a, 0x7ab0ff, 0xff6ad8}; final Spr s = new Spr(PW / 2 + (rnd.nextFloat() - 0.5f) * 8, c * FH + FH / 2 + 2 + rnd.nextFloat() * 4, PL + MIDD + 12 + rnd.nextFloat() * 10, 6, cols[rnd.nextInt(5)], 1); e.loose.add(s); salutes.add(s); snd.thump(0.08f, 60, 0.4f); } }
        for (int i = salutes.size() - 1; i >= 0; i--) { Spr s = salutes.get(i); s.a -= dt * 0.7f; s.s += dt * 3; s.y -= dt * 0.6f; if (s.a <= 0) { e.loose.remove(s); salutes.remove(i); } }
        // камера, фонарик
        findNear(); g.prompt(liftSt.equals("ride") ? "" : nearLabel);
        float cy = py + 1.62f + (float) Math.sin(bob) * 0.03f;
        e.cx = px; e.cy = cy; e.cz = pz; e.yaw = g.yaw; e.pitch = g.pitch; e.roll = 0;
        if (flash) { float cp = (float) Math.cos(g.pitch); e.spP[0] = px + 0.15f; e.spP[1] = cy - 0.2f; e.spP[2] = pz; e.spD[0] = (float) -Math.sin(g.yaw) * cp; e.spD[1] = (float) Math.sin(g.pitch); e.spD[2] = (float) -Math.cos(g.yaw) * cp; e.col3(e.spC, 0xfff2dc, 2.2f); e.spCos = 0.88f; }
        else e.spC[0] = e.spC[1] = e.spC[2] = 0;
        String fl2 = liftSt.equals("ride") ? liftShow : real(c).toString();
        g.hud("этаж " + fl2 + "\n🗑 мусор: " + trash);
    }
    final ArrayList<Spr> salutes = new ArrayList<>();
    void move(float dx, float dz, boolean gapOff) {
        float ly = py - curN() * FH; float nx = px + dx, nz = pz + dz;
        for (int i = 0; i < cols.length; i++) { if (i == cols.length - 1 && gapOff) continue; float[] q = cols[i];
            // колодец и площадка — только у пола модуля; наружные стены — всегда
            if (Math.abs(nx - q[0]) < q[2] + R && Math.abs(nz - q[1]) < q[3] + R) { if (!(Math.abs(px - q[0]) < q[2] + R && Math.abs(pz - q[1]) < q[3] + R)) { if (Math.abs(px - q[0]) < q[2] + R) nz = pz; else nx = px; } } }
        if (inCabin() && !gapOff && !(px > EX0 && px < EX1 && pz < -LAND - 0.15f)) { }
        px = nx; pz = nz;
    }
    @Override void destroy() { snd.partyG = 0; }
}
