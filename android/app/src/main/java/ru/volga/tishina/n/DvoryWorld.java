package ru.volga.tishina.n;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Random;
import java.util.Set;

/** Мир «Дворы»: 415-й микрорайон, Героев Тулы, 13. Ноябрь, 14:50, после дождя. */
final class DvoryWorld extends World {
    static final String[] LORE = {
        "«Обед на плите, разогрей. Ключ у тёти Вали из 45-й. Буду в шесть.\n— Мама»\n\nНа обороте твоим почерком: «Тёти Вали нет дома. Никого нет дома».",
        "Если ты читаешь это — значит, ты опять стоишь во дворе в 14:50.\nТы приходишь сюда каждый раз, когда засыпаешь.\nИ каждый раз не помнишь.",
        "Часы здесь не идут. Без десяти три, ноябрь, дождь только что кончился.\nЭто не день. Это фотография дня.",
        "Помнишь лужу у третьего подъезда? В ней вся девятиэтажка — вверх ногами.\nТы думал, что там, внизу, второй город.",
        "Весной вы уехали. Двор никуда не делся — это ты ушёл.\nА кусок тебя так и стоит здесь с рюкзаком и без ключа.",
        "Тропа, дача, школа, лагерь, электричка — всё это отсюда.\nКаждое место, куда ты так и не вернулся, прячет ключ.",
        "Подъезды открываются не все.\nТе, что открыты, ведут не домой.",
        "Не стой на дороге. Машины здесь не тормозят —\nим не для кого.",
        "В окнах горит свет. Из форточки первого этажа пахнет жареным луком.\nНи в одном окне тебя не ждут: там всё ещё 14:50.",
        "Один ключ — здесь, во дворах.\nИщи площадку, где у домика самая яркая крыша. Она к юго-западу: за детским садом, через дорогу.",
        "Бабушкины ворота на даче — единственная дверь, которая помнит, где ты живёшь на самом деле.",
        "Когда соберёшь все ключи и откроешь ворота — поднимись домой и ляг на свою кровать.\nМинута пойдёт дальше. Мама придёт в шесть. Ты проснёшься. Обещаю.\n— Ты"
    };
    static final String[] STREETS = {"Героев Тулы", "Академика Бардина", "Менжинского", "Жолудева", "Николая Отрады", "Мясникова", "Луговского", "Клименко"};
    static final float CS = 48, AVE = 110, R = 0.3f;
    static final float[][] SUP = {{-140, 140, -236, 140}};
    static final float[][] DRV = {{-140, 38, 8.8f, 13.2f}, {-57.2f, -52.8f, -188, 11}, {70.8f, 75.2f, -188, 140}, {-140, 100, -196, -188}, {-30, 30, -122, -96}, {-140, -52.8f, -2, 2.4f}};
    static boolean sup(float x, float z) { for (float[] r : SUP) if (x > r[0] && x < r[1] && z > r[2] && z < r[3]) return true; return false; }
    final Random rnd = new Random();
    float px = 8, pz = 2, bob, ambT = 4, clk; int cards, nuts; Set<String> got;
    Mat mMud, mMudWet, mAsph, mWalk, mCurb, mGrass, mLeaves, mPuddle, mPudRim, mDom13, mPanel, mFive, mBrick2, mEnd, mPlinth, mRoof, mDoor, mWhite, mGas, mBench, mCont, mPlay, mKiosk, mProf, mSchool, mSad, mConc, mDark, mGlassW, mBark, mBirch, mPop, mElm, mElmY, mBush, mCarW, mCarS, mCarD, mTire, mRust, mPigeon, mCrow, mCard, mNut, mPole, mWire, mBlueSign, mMetal, mRed, mBlue, mYel, mGreen;
    static final class Item { Obj o; float x, z; String key; boolean card, got; }
    static final class Entr { float x, z; int kind; String label; }   // 0 молчит, 1 открыт (случайный мир), 2 — домой (подъезд дома 13)
    static final class Flock { Group g; float x, z, cx, cz; boolean fly; float t; }
    final class Chunk { Group g; final ArrayList<float[]> boxes = new ArrayList<>(); final ArrayList<Item> items = new ArrayList<>(); final ArrayList<Entr> entr = new ArrayList<>(); final ArrayList<Flock> flocks = new ArrayList<>(); }
    final HashMap<Long, Chunk> chunks = new HashMap<>();
    static final class Car { Group g; float x, z, v; }
    final ArrayList<Car> cars = new ArrayList<>(); float hitT;
    static final String[] WORLDS_WEB = {"tishina.html", "shkola.html", "bolnica.html", "metro.html", "magazin.html", "plyazh.html", "lager.html", "pole.html", "elektrichka.html", "stroyka.html", "ostanovka.html", "dom.html"};

    int blobTex(boolean rim) { Bitmap bm = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(bm); Paint p = new Paint(Paint.ANTI_ALIAS_FLAG); Random r = new Random(rim ? 7 : 3);
        for (int i = 0; i < 9; i++) { float x = 128 + (r.nextFloat() - 0.5f) * 90, y = 128 + (r.nextFloat() - 0.5f) * 90, s = 45 + r.nextFloat() * 50;
            p.setShader(new RadialGradient(x, y, s, new int[]{rim ? 0xCC000000 : 0xFFFFFFFF, rim ? 0xCC000000 : 0xFFFFFFFF, 0x00000000}, new float[]{0, rim ? 0.75f : 0.6f, 1}, Shader.TileMode.CLAMP)); c.drawCircle(x, y, s, p); }
        int id = Tex.up(bm, true, false); bm.recycle(); return id; }
    int cardTex() { Bitmap bm = Bitmap.createBitmap(128, 160, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(bm); c.drawColor(0xFFEEEADE); Paint p = new Paint(); p.setColor(0x805A78AA); for (int i = 8; i < 128; i += 8) c.drawLine(i, 0, i, 160, p); for (int i = 8; i < 160; i += 8) c.drawLine(0, i, 128, i, p);
        p.setColor(0xFF3A3A6A); p.setStrokeWidth(2); for (int i = 0; i < 9; i++) c.drawLine(12, 24 + i * 14, 12 + 30 + (i * 37 % 70), 24 + i * 14, p); int id = Tex.up(bm, true, false); bm.recycle(); return id; }

    @Override void init() {
        e.fogD = 0.0065f; e.col3(e.fogC, 0xc4c8ce, 1); e.col3(e.clear, 0xc4c8ce, 1); e.col3(e.sky, 0xd2d6dc, 0.85f); e.col3(e.gnd, 0x5e564c, 0.55f); e.col3(e.dirC, 0xfff0dc, 0.55f); e.dirD = new float[]{-0.45f, -1f, -0.35f};
        e.exposure = 1.05f; e.vig = 0.42f; e.fov = 68; e.shadows = true; e.shR = 48;
        e.skyDome(new int[]{0xffa8adb5, 0xffbcc1c8, 0xffc8ccd2, 0xffc4c8ce}, new float[]{0, 0.3f, 0.48f, 1});
        String T = "res/tex/ai/";
        mMud = Mat.c(0xb0a898).tex(Tex.file(T + "ground_mud.jpg")); mMudWet = Mat.c(0x8a8278).tex(Tex.file(T + "dv_mud_wet.jpg")).spec(0.35f); mAsph = Mat.c(0x9a9aa0).tex(Tex.file(T + "dv_asph.jpg")).spec(0.25f);
        mWalk = Mat.c(0xa8a8a4).tex(Tex.file(T + "dv_walk.jpg")); mCurb = Mat.c(0xc8c6c0).tex(Tex.file(T + "dv_curb_side.jpg")); mGrass = Mat.c(0xb8b088).tex(Tex.file(T + "dv_grass.jpg"));
        mLeaves = Mat.c(0xffffff).tex(Tex.file(T + "dv_leaves_decal.png")); mLeaves.blend = true;
        mPuddle = Mat.unlit(0xa4aab2).tex(blobTex(false)).spec(0); mPuddle.blend = true; mPuddle.a = 0.85f; mPudRim = Mat.c(0x2a2622).tex(blobTex(true)); mPudRim.blend = true;
        mDom13 = Mat.c(0xffffff).tex(Tex.file(T + "dom13_facade_atlas.jpg")).rep(1 / 24.8f, 1 / 11.2f); mPanel = Mat.c(0xffffff).tex(Tex.file(T + "panel_atlas.jpg")).rep(1 / 36f, 1 / 11.2f);
        mFive = Mat.c(0xffffff).tex(Tex.file(T + "facade_5et.jpg")).rep(1 / 6f, 1 / 5.6f); mBrick2 = Mat.c(0xffffff).tex(Tex.file(T + "facade_brick2.jpg")).rep(1 / 6f, 1 / 5.6f);
        mEnd = Mat.c(0xcdcac2).tex(Tex.file("res/tex/brick_wall_003_diff.jpg")).rep(1 / 2.5f, 1 / 2.5f); mPlinth = Mat.c(0xffffff).tex(Tex.file(T + "dv_plinth.jpg")).rep(1 / 3f, 1 / 1.6f); mRoof = Mat.c(0xffffff).tex(Tex.file(T + "dv_roof.jpg")).rep(1 / 3f, 1 / 3f);
        mDoor = Mat.c(0xffffff).tex(Tex.file(T + "dv_entr_door.jpg")); mWhite = Mat.c(0xe8e6e0).tex(Tex.file(T + "dv_whitewash.jpg")); mGas = Mat.c(0xe0b828).spec(0.4f); mBench = Mat.c(0xffffff).tex(Tex.file(T + "dv_bench.jpg"));
        mCont = Mat.c(0xffffff).tex(Tex.file(T + "dv_container.jpg")).spec(0.3f); mPlay = Mat.c(0xffffff).tex(Tex.file(T + "dv_playground.jpg")); mKiosk = Mat.c(0xffffff).tex(Tex.file(T + "dv_kiosk.jpg")); mProf = Mat.c(0x7ab07a).tex(Tex.file(T + "dv_prof.jpg"));
        mSchool = Mat.c(0xffffff).tex(Tex.file(T + "facade_school.jpg")).rep(1 / 6f, 1 / 5.6f); mSad = Mat.c(0xffffff).tex(Tex.file(T + "facade_sad.jpg")).rep(1 / 6f, 1 / 5.6f);
        mConc = Mat.c(0xb8b6b0).tex(Tex.file(T + "dv_conc.jpg")); mDark = Mat.c(0x24262a); mGlassW = Mat.c(0x2a3038).spec(0.8f);
        mBark = Mat.c(0xffffff).tex(Tex.file(T + "bark_poplar.jpg")); mBirch = Mat.c(0xffffff).tex(Tex.file(T + "bark_birch.jpg")); mPop = Mat.c(0x6a7044); mElm = Mat.c(0x7a7440); mElmY = Mat.c(0xb8962e); mBush = Mat.c(0x8a7a3a);
        mCarW = Mat.c(0xe4e4e0).spec(0.5f); mCarS = Mat.c(0xa8acb0).spec(0.6f); mCarD = Mat.c(0x3a3e44).spec(0.5f); mTire = Mat.c(0x141414); mRust = Mat.c(0x6a4a32); mPigeon = Mat.c(0x6a6e78); mCrow = Mat.c(0x1a1a1c);
        mCard = Mat.c(0xffffff).tex(cardTex()); mNut = Mat.c(0x5a2a12).spec(0.7f); mPole = Mat.c(0x8a8a86); mWire = Mat.c(0x1a1a1a); mBlueSign = Mat.c(0x1d4fa8); mMetal = Mat.c(0x8a8e90).spec(0.4f);
        mRed = Mat.c(0xb03a2a); mBlue = Mat.c(0x2a5ab0); mYel = Mat.c(0xe0b030); mGreen = Mat.c(0x3a7a3a);
        got = new HashSet<>(g.prefs().getStringSet("dvory_got", new HashSet<>())); cards = g.prefs().getInt("dvory_cards", 0); nuts = g.prefs().getInt("dvory_nuts", 0);
        snd.windG = 0.35f; snd.noiseG = 0.012f; snd.noiseCut = 180;
        streamAll(); g.yaw = 0; g.pitch = -0.04f;
        g.toast("Героев Тулы, 13. Ноябрь, 14:50.\nКлюча нет. Домофон молчит.", 3800);
    }

    // ---------- дом ----------
    /** дом: центр, длина вдоль оси (alongZ), глубина, этажи, фасад, сторона подъездов (+1/−1 по поперечной оси), адрес, homeLast */
    void house(Chunk C, Group g, float x, float z, float len, float dep, int floors, boolean alongZ, Mat fac, int side, String addr, boolean homeLast, Rng r) {
        float FH = 2.8f, PL = floors >= 9 ? 1.6f : 1.2f, H = PL + floors * FH, hl = len / 2, hd = dep / 2;
        float sx = alongZ ? dep : len, sz = alongZ ? len : dep;
        g.box(mDark, x, H / 2, z, sx - 0.2f, H, sz - 0.2f);
        g.mb(mPlinth, 1).box(x, PL / 2, z, sx + 0.1f, PL, sz + 0.1f);
        g.mb(mRoof, 1).box(x, H + 0.05f, z, sx, 0.12f, sz); g.box(mConc, x, H + 0.4f, z - sz / 2, sx, 0.7f, 0.2f); g.box(mConc, x, H + 0.4f, z + sz / 2, sx, 0.7f, 0.2f); g.box(mConc, x - sx / 2, H + 0.4f, z, 0.2f, 0.7f, sz); g.box(mConc, x + sx / 2, H + 0.4f, z, 0.2f, 0.7f, sz);
        g.box(mConc, x + (r.f() - 0.5f) * sx * 0.5f, H + 1.2f, z + (r.f() - 0.5f) * sz * 0.5f, 3, 2.2f, 3);   // будка выхода
        for (int i = 0; i < 4; i++) g.cyl(mMetal, x + (r.f() - 0.5f) * sx * 0.8f, H + 1.5f, z + (r.f() - 0.5f) * sz * 0.8f, 0.03f, 3);
        float fh = H - PL;
        MB fm = g.mb(fac, 1);
        if (alongZ) { fm.plane(x + hd + 0.02f, PL + fh / 2, z, len, fh, (float) Math.PI / 2, 0); fm.plane(x - hd - 0.02f, PL + fh / 2, z, len, fh, (float) -Math.PI / 2, 0); g.mb(mEnd, 1).plane(x, H / 2, z + hl + 0.02f, dep, H, 0, 0); g.mb(mEnd, 1).plane(x, H / 2, z - hl - 0.02f, dep, H, (float) Math.PI, 0); }
        else { fm.plane(x, PL + fh / 2, z + hd + 0.02f, len, fh, 0, 0); fm.plane(x, PL + fh / 2, z - hd - 0.02f, len, fh, (float) Math.PI, 0); g.mb(mEnd, 1).plane(x + hl + 0.02f, H / 2, z, dep, H, (float) Math.PI / 2, 0); g.mb(mEnd, 1).plane(x - hl - 0.02f, H / 2, z, dep, H, (float) -Math.PI / 2, 0); }
        // адрес на торце
        Mat am = Mat.c(0xffffff).tex(Tex.text(addr, 0x1d4fa8, 0xffffff, 1024, 160, 80)); if (alongZ) g.mb(am).plane(x + hd - 1.5f, 3.6f, z + hl + 0.05f, 2.4f, 0.38f, 0, 0); else g.mb(am).plane(x + hl + 0.05f, 3.6f, z - hd + 1.5f, 2.4f, 0.38f, (float) Math.PI / 2, 0);
        // газовая труба вдоль стороны подъездов
        float fo = (alongZ ? hd : hd) + 0.12f;
        if (alongZ) g.mb(mGas).cyl(x + side * fo, 2.95f, z, 0.05f, 0.05f, len, (float) Math.PI / 2, 0, 8); else g.mb(mGas).cyl(x, 2.95f, z + side * fo, 0.05f, 0.05f, len, 0, (float) Math.PI / 2, 8);
        // подъезды
        int ne = Math.max(1, Math.round(len / 13f)); float step = len / ne;
        for (int i = 0; i < ne; i++) { float t = -hl + step * (i + 0.5f); float ex = alongZ ? x + side * hd : x + t, ez = alongZ ? z + t : z + side * hd;
            float nx = alongZ ? side : 0, nz = alongZ ? 0 : side; float ry = alongZ ? (side > 0 ? (float) Math.PI / 2 : (float) -Math.PI / 2) : (side > 0 ? 0 : (float) Math.PI);
            float tx = alongZ ? 0 : 1, tz = alongZ ? 1 : 0;   // вдоль фасада
            // портал, дверь, козырёк, ступени
            g.mb(mWhite, 1).box(ex + nx * 0.15f + tx * 1.0f, 1.3f, ez + nz * 0.15f + tz * 1.0f, alongZ ? 0.3f : 0.35f, 2.6f, alongZ ? 0.35f : 0.3f);
            g.mb(mWhite, 1).box(ex + nx * 0.15f - tx * 1.0f, 1.3f, ez + nz * 0.15f - tz * 1.0f, alongZ ? 0.3f : 0.35f, 2.6f, alongZ ? 0.35f : 0.3f);
            g.mb(mWhite, 1).box(ex + nx * 0.15f, 2.75f, ez + nz * 0.15f, alongZ ? 0.3f : 2.4f, 0.3f, alongZ ? 2.4f : 0.3f);
            g.mb(mDoor).plane(ex + nx * 0.04f, 1.2f, ez + nz * 0.04f, 1.25f, 2.3f, ry, 0);
            g.box(mConc, ex + nx * 0.8f, 3.0f, ez + nz * 0.8f, alongZ ? 1.6f : 2.6f, 0.14f, alongZ ? 2.6f : 1.6f); g.box(mWhite, ex + nx * 1.6f, 3.0f, ez + nz * 1.6f, alongZ ? 0.04f : 2.6f, 0.15f, alongZ ? 2.6f : 0.04f);
            for (int k = 0; k < 3; k++) g.box(mConc, ex + nx * (0.55f + k * 0.3f), 0.08f + (2 - k) * 0.15f, ez + nz * (0.55f + k * 0.3f), alongZ ? 0.32f : 2.2f, 0.16f, alongZ ? 2.2f : 0.32f);
            g.mb(mGas).cyl(ex + nx * 0.12f + tx * 1.4f, 1.5f, ez + nz * 0.12f + tz * 1.4f, 0.04f, 3.0f);
            Mat nm = Mat.c(0xffffff).tex(Tex.text(String.valueOf(i + 1), 0x1d4fa8, 0xffffff, 128, 128, 90)); g.mb(nm).plane(ex + nx * 0.32f, 2.75f, ez + nz * 0.32f, 0.3f, 0.3f, ry, 0);
            g.spr(new Spr(ex + nx * 0.5f, 2.6f, ez + nz * 0.5f, 0.8f, 0xfff2d8, 0.5f));
            if (r.f() < 0.85f) { float bx = ex + nx * 2.4f + tx * 2.6f, bz = ez + nz * 2.4f + tz * 2.6f; g.mb(mBench).box(bx, 0.45f, bz, alongZ ? 0.45f : 1.6f, 0.08f, alongZ ? 1.6f : 0.45f); g.box(mDark, bx, 0.22f, bz, alongZ ? 0.3f : 1.4f, 0.44f, alongZ ? 1.4f : 0.3f); }
            if (r.f() < 0.8f) g.mb(mGreen).cyl(ex + nx * 2.0f - tx * 1.8f, 0.35f, ez + nz * 2.0f - tz * 1.8f, 0.22f, 0.18f, 0.7f, 0, 0, 10);
            if (r.f() < 0.55f) for (int k = 0; k < 5; k++) { float a = k / 5f * 6.28f; g.mb(new Mat[]{mWhite, mRed, mYel, mBlue}[k % 4]).cyl(ex + nx * 4.2f + (float) Math.cos(a) * 0.9f, 0.15f, ez + nz * 4.2f + (float) Math.sin(a) * 0.9f, 0.35f, 0.35f, 0.18f, (float) Math.PI / 2, a, 10); }
            Entr en = new Entr(); en.x = ex + nx * 0.9f; en.z = ez + nz * 0.9f; boolean last = homeLast && i == ne - 1; en.kind = last ? 2 : r.f() < 0.2f ? 1 : 0; en.label = last ? "E — домой (подъезд " + (i + 1) + ")" : "E — открыть дверь"; C.entr.add(en);
            C.boxes.add(new float[]{ex + nx * 0.8f, ez + nz * 0.8f, alongZ ? 0.8f : 1.3f, alongZ ? 1.3f : 0.8f, 1}); }
        C.boxes.add(new float[]{x, z, sx / 2, sz / 2});
    }
    void lowBuilding(Chunk C, Group g, float x, float z, float sx, float sz, float H, Mat fac, String sign, Rng r) {
        g.box(mDark, x, H / 2, z, sx - 0.2f, H, sz - 0.2f); g.mb(mRoof, 1).box(x, H + 0.05f, z, sx, 0.12f, sz);
        MB fm = g.mb(fac, 1); fm.plane(x, H / 2, z + sz / 2 + 0.02f, sx, H, 0, 0); fm.plane(x, H / 2, z - sz / 2 - 0.02f, sx, H, (float) Math.PI, 0); fm.plane(x + sx / 2 + 0.02f, H / 2, z, sz, H, (float) Math.PI / 2, 0); fm.plane(x - sx / 2 - 0.02f, H / 2, z, sz, H, (float) -Math.PI / 2, 0);
        if (sign != null) { int[] cols = {0xd81e1e, 0x1e8a3a, 0x1d4fa8, 0x2a9a4a, 0xd84a8a}; Mat sm = Mat.unlit(0xeeeeee).tex(Tex.text(sign, cols[Math.abs(sign.hashCode()) % cols.length], 0xffffff, 1024, 200, 120));
            g.mb(sm).plane(x, H - 0.6f, z + sz / 2 + 0.08f, Math.min(sx - 1, 8), 1.4f, 0, 0); g.box(mGlassW, x, 1.4f, z + sz / 2 + 0.05f, Math.min(sx - 2, 10), 2.2f, 0.05f); }
        C.boxes.add(new float[]{x, z, sx / 2, sz / 2});
    }
    // ---------- двор ----------
    void tree(Group g, Rng r, float x, float z) { float t = r.f(), s = 0.8f + r.f() * 0.5f;
        if (t < 0.4f) { float h = 16 * s; g.mb(mBark, 1.5f).cyl(x, h * 0.35f, z, 0.3f * s, 0.15f * s, h * 0.7f, 0, 0, 8); g.mb(mPop).sphere(x, h * 0.66f, z, 3.2f * s, h * 0.7f, 3.2f * s); g.mb(mElmY).sphere(x + 0.8f, h * 0.55f, z, 2.2f * s, h * 0.35f, 2.2f * s); }
        else if (t < 0.7f) { float h = 10 * s; g.mb(mBark, 1.5f).cyl(x, h * 0.3f, z, 0.28f * s, 0.16f * s, h * 0.6f, 0, 0, 8); for (int k = 0; k < 6; k++) g.mb(mBark, 1.5f).cyl(x + (r.f() - 0.5f) * 2, h * 0.68f, z + (r.f() - 0.5f) * 2, 0.06f, 0.02f, h * 0.45f, (r.f() - 0.5f) * 0.9f, (r.f() - 0.5f) * 0.9f, 5);
            for (int k = 0; k < 3; k++) g.mb(r.f() < 0.6f ? mElmY : mElm).sphere(x + (r.f() - 0.5f) * 3.5f * s, h * (0.7f + r.f() * 0.2f), z + (r.f() - 0.5f) * 3.5f * s, 2.4f * s, 1.5f * s, 2.4f * s); }
        else { float h = 11 * s; g.mb(mBirch, 1.2f).cyl(x, h * 0.4f, z, 0.17f * s, 0.08f * s, h * 0.8f, 0, 0, 8); for (int k = 0; k < 4; k++) g.mb(mElmY).sphere(x + (r.f() - 0.5f) * 2.5f, h * (0.6f + r.f() * 0.3f), z + (r.f() - 0.5f) * 2.5f, 1.8f * s, 1.4f * s, 1.8f * s); }
        g.mb(mLeaves).floor(x, 0.018f, z, 6 * s, 6 * s); }
    void car(Group g, Rng r, float x, float z, boolean alongZ) { Mat b = r.f() < 0.45f ? mCarW : r.f() < 0.8f ? mCarS : mCarD; float L = 4.3f, W = 1.75f; float sx = alongZ ? W : L, sz = alongZ ? L : W;
        g.box(b, x, 0.7f, z, sx, 0.75f, sz); g.box(mGlassW, x, 1.3f, z, alongZ ? W - 0.15f : 2.2f, 0.5f, alongZ ? 2.2f : W - 0.15f); g.box(b, x, 1.57f, z, alongZ ? W - 0.2f : 2.0f, 0.05f, alongZ ? 2.0f : W - 0.2f);
        for (int i = -1; i <= 1; i += 2) for (int j = -1; j <= 1; j += 2) g.mb(mTire).cyl(x + (alongZ ? i * 0.8f : j * 1.35f), 0.33f, z + (alongZ ? j * 1.35f : i * 0.8f), 0.33f, 0.33f, 0.22f, alongZ ? 0 : (float) Math.PI / 2, alongZ ? (float) Math.PI / 2 : 0, 10);
        g.box(Mat.c(0x6a5a48), x, 0.42f, z, sx + 0.02f, 0.2f, sz + 0.02f); }
    void playground(Group g, Rng r, float x, float z) { g.mb(mPlay, 4).floor(x, 0.015f, z, 14, 10);
        g.box(mRed, x - 3, 1.1f, z, 0.08f, 2.2f, 0.08f); g.box(mRed, x - 1, 1.1f, z, 0.08f, 2.2f, 0.08f); g.box(mRed, x - 2, 2.2f, z, 2.1f, 0.08f, 0.08f); g.box(mDark, x - 2, 0.55f, z, 0.5f, 0.05f, 0.25f);
        g.mb(mBlue).box(x + 2, 0.9f, z + 2, 0.9f, 0.08f, 3.2f, 0.45f, 0, 0); g.box(mYel, x + 2, 0.9f, z + 0.3f, 1.2f, 1.8f, 1.2f); g.box(mRed, x + 2, 1.95f, z + 0.3f, 1.4f, 0.1f, 1.4f);
        g.box(mYel, x, 0.15f, z - 3, 3, 0.3f, 3); g.mb(Mat.c(0xd8c49a)).floor(x, 0.31f, z - 3, 2.8f, 2.8f); }
    void containers(Group g, float x, float z) { g.mb(mConc, 2).floor(x, 0.02f, z, 7, 3); for (int i = 0; i < 3; i++) g.mb(mCont).box(x - 2.2f + i * 2.2f, 0.65f, z, 1.8f, 1.3f, 1.1f); g.box(mProf, x, 1.0f, z - 1.4f, 7, 2, 0.05f); }
    // ---------- дороги ----------
    void roadX(Chunk C, Group g, float x0, float x1, float z, float hw) { g.mb(mAsph, 6).floor((x0 + x1) / 2, 0.01f, z, x1 - x0, hw * 2); g.mb(mCurb, 1).box((x0 + x1) / 2, 0.15f, z - hw - 0.15f, x1 - x0, 0.3f, 0.3f); g.mb(mCurb, 1).box((x0 + x1) / 2, 0.15f, z + hw + 0.15f, x1 - x0, 0.3f, 0.3f);
        g.mb(mWalk, 3).floor((x0 + x1) / 2, 0.02f, z - hw - 1.35f, x1 - x0, 2.1f); g.mb(mWalk, 3).floor((x0 + x1) / 2, 0.02f, z + hw + 1.35f, x1 - x0, 2.1f); for (float x = x0 + 2; x < x1; x += 8) g.box(Mat.c(0xd8d8d0), x, 0.016f, z, 3.5f, 0.01f, 0.12f); }
    void roadZ(Chunk C, Group g, float z0, float z1, float x, float hw) { g.mb(mAsph, 6).floor(x, 0.01f, (z0 + z1) / 2, hw * 2, z1 - z0); g.mb(mCurb, 1).box(x - hw - 0.15f, 0.15f, (z0 + z1) / 2, 0.3f, 0.3f, z1 - z0); g.mb(mCurb, 1).box(x + hw + 0.15f, 0.15f, (z0 + z1) / 2, 0.3f, 0.3f, z1 - z0);
        g.mb(mWalk, 3).floor(x - hw - 1.35f, 0.02f, (z0 + z1) / 2, 2.1f, z1 - z0); g.mb(mWalk, 3).floor(x + hw + 1.35f, 0.02f, (z0 + z1) / 2, 2.1f, z1 - z0); for (float z = z0 + 2; z < z1; z += 8) g.box(Mat.c(0xd8d8d0), x, 0.016f, z, 0.12f, 0.01f, 3.5f); }
    // ---------- чанк ----------
    Chunk build(int cx, int cz) {
        Chunk C = new Chunk(); Group g = new Group(); C.g = g; float x0 = cx * CS, z0 = cz * CS, x1 = x0 + CS, z1 = z0 + CS, xc = x0 + CS / 2, zc = z0 + CS / 2; Rng r = new Rng((cx * 73856093) ^ (cz * 19349663) ^ 0x5d1);
        g.mb(mMud, 7).floor(xc, 0, zc, CS, CS);
        boolean S = sup(xc, zc);
        // дороги
        if (!S) { if (((Math.round(x0) - 48) % 96 + 96) % 96 == 0) roadZ(C, g, z0, z1, x0, 4); if (((Math.round(z0) - 48) % 96 + 96) % 96 == 0) roadX(C, g, x0, x1, z0, 4); }
        if (AVE > x0 - 10 && AVE < x1 + 10) { float a = Math.max(x0, AVE - 10), b = Math.min(x1, AVE + 10); if (b > a) g.mb(mAsph, 6).floor((a + b) / 2, 0.012f, zc, b - a, CS); }
        for (float[] d : DRV) { float a = Math.max(x0, d[0]), b = Math.min(x1, d[1]), c = Math.max(z0, d[2]), e2 = Math.min(z1, d[3]); if (b > a && e2 > c) g.mb(mAsph, 6).floor((a + b) / 2, 0.011f, (c + e2) / 2, b - a, e2 - c); }
        // постройки
        if (S) district(C, g, r, x0, z0, x1, z1);
        else { int bx = (int) Math.floor((cx - 1) / 2.0), bz = (int) Math.floor((cz - 1) / 2.0); float h = hash(cx, cz, 77); float ix = xc + (((cx - 1) % 2 + 2) % 2 == 0 ? 3 : -3), iz = zc + (((cz - 1) % 2 + 2) % 2 == 0 ? 3 : -3);
            if (bx <= -11) { for (int i = 0; i < 6; i++) g.mb(mGrass, 4).floor(x0 + r.f() * CS, 0.008f, z0 + r.f() * CS, 6 + r.f() * 10, 6 + r.f() * 10); }
            else if (bx <= -6) { for (int i = 0; i < 2; i++) { float hx = ix + (i - 0.5f) * 18; lowBuilding(C, g, hx, iz, 8, 7, 3.2f, mBrick2, null, r); g.mb(mRust).box(hx, 3.9f, iz, 8.6f, 1.4f, 7.6f, 0, 0, 0); for (float k = -10; k <= 10; k += 0.4f) g.box(Mat.c(0x6a5038), hx + k * 0.8f, 0.7f, iz + 6, 0.07f, 1.4f, 0.03f); } }
            else if (h < 0.5f) house(C, g, ix, iz, 40, 12, 9, r.f() < 0.5f, r.f() < 0.5f ? mPanel : mBrick2, r.f() < 0.5f ? 1 : -1, "ул. " + STREETS[Math.abs(bx * 7 + bz) % STREETS.length] + ", " + (Math.abs(bx * 13 + bz * 5) % 60 + 1), false, r);
            else if (h < 0.72f) house(C, g, ix, iz, 40, 11, 5, r.f() < 0.5f, mFive, r.f() < 0.5f ? 1 : -1, "ул. " + STREETS[Math.abs(bx * 3 + bz) % STREETS.length] + ", " + (Math.abs(bx * 11 + bz * 3) % 60 + 1), false, r);
            else if (h < 0.86f) { String[] sh = {"Пятёрочка", "Магнит", "Продукты", "Аптека", "Цветы"}; lowBuilding(C, g, ix, iz, 20, 12, 4.2f, mBrick2, sh[r.i(sh.length)], r); }
            else if (h < 0.93f) { lowBuilding(C, g, ix, iz, 26, 12, 6, mSad, null, r); for (float k = -16; k <= 16; k += 4) g.mb(mProf, 1).box(ix + k, 0.8f, iz + 12, 4, 1.6f, 0.05f); }
            else { lowBuilding(C, g, ix, iz, 34, 14, 12, mSchool, null, r); g.mb(Mat.c(0x8a6a4a)).floor(ix, 0.012f, iz + 17, 26, 12); } }
        // двор: деревья, машины, лом, лужи, листья, предметы
        int nt = S ? 6 : 5; for (int i = 0; i < nt; i++) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; if (blocked(C, x, z, 2.5f) || onRoad(x, z)) continue; tree(g, r, x, z); C.boxes.add(new float[]{x, z, 0.35f, 0.35f}); }
        for (int i = 0; i < 4; i++) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; if (blocked(C, x, z, 1) || onRoad(x, z)) continue; g.mb(mGrass, 3).floor(x, 0.008f, z, 3 + r.f() * 6, 3 + r.f() * 6); }
        for (int i = 0; i < 5; i++) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; if (blocked(C, x, z, 0.5f)) continue; float s = 1.5f + r.f() * 4; g.mb(mPudRim).floor(x, 0.02f, z, s * 1.35f, s * 1.1f); g.mb(mPuddle).floor(x, 0.026f, z, s, s * 0.8f); }
        if (r.f() < 0.5f) { float x = x0 + 6 + r.f() * (CS - 12), z = z0 + 6 + r.f() * (CS - 12); if (!blocked(C, x, z, 2) && !onRoad(x, z)) { boolean az = r.f() < 0.5f; car(g, r, x, z, az); C.boxes.add(new float[]{x, z, az ? 1 : 2.3f, az ? 2.3f : 1}); } }
        if (r.f() < 0.35f) { float x = x0 + 6 + r.f() * (CS - 12), z = z0 + 6 + r.f() * (CS - 12); if (!blocked(C, x, z, 4)) for (int k = 0; k < 5; k++) g.mb(mConc, 1).box(x + k * 1.1f, 0.2f + (k % 2) * 0.05f, z + (r.f() - 0.5f) * 0.4f, 1.0f, 0.35f, 0.3f, (r.f() - 0.5f) * 0.3f, (r.f() - 0.5f) * 0.4f, (r.f() - 0.5f) * 0.3f); }
        // столб с фонарём
        if (r.f() < 0.6f) { float x = x0 + 4 + r.f() * (CS - 8), z = z0 + 4 + r.f() * (CS - 8); if (!blocked(C, x, z, 1)) { g.cyl(mPole, x, 4.5f, z, 0.12f, 9); g.box(mPole, x + 0.7f, 8.8f, z, 1.4f, 0.08f, 0.08f); g.box(mDark, x + 1.4f, 8.7f, z, 0.5f, 0.15f, 0.25f); C.boxes.add(new float[]{x, z, 0.2f, 0.2f}); } }
        // записка и каштаны
        if (r.f() < 0.33f) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; String key = "c" + cx + "," + cz; if (!got.contains(key) && !blocked(C, x, z, 0.6f)) item(C, g, x, z, key, true, r); }
        for (int i = 0; i < 3; i++) { float x = x0 + r.f() * CS, z = z0 + r.f() * CS; String key = "n" + cx + "," + cz + "," + i; if (r.f() < 0.5f && !got.contains(key) && !blocked(C, x, z, 0.4f)) item(C, g, x, z, key, false, r); }
        // голуби
        if (r.f() < 0.4f || (cx == 0 && cz == -1)) { float x = x0 + 10 + r.f() * 28, z = z0 + 10 + r.f() * 28; if (!blocked(C, x, z, 4)) flock(C, x, z, r); }
        g.done(); e.groups.add(g); for (Flock f : C.flocks) e.groups.add(f.g); return C;
    }
    void item(Chunk C, Group g, float x, float z, String key, boolean card, Rng r) { Item it = new Item(); it.x = x; it.z = z; it.key = key; it.card = card; MB m = new MB();
        if (card) m.box(0, 0.02f, 0, 0.15f, 0.006f, 0.19f, 0, r.f() * 6, 0); else m.sphere(0, 0.035f, 0, 0.06f, 0.055f, 0.06f); it.o = g.add(m.build(), card ? mCard : mNut); it.o.at(x, 0, z); C.items.add(it); }
    void flock(Chunk C, float x, float z, Rng r) { Flock f = new Flock(); f.x = f.cx = x; f.z = f.cz = z; Group g = new Group(); MB b = new MB(), cr = new MB(); int n = 12 + r.i(10);
        for (int i = 0; i < n; i++) { float a = r.f() * 6.28f, d = r.f() * 3.5f, bx = (float) Math.cos(a) * d, bz = (float) Math.sin(a) * d, ry = r.f() * 6.28f; MB m = r.f() < 0.07f ? cr : b;
            m.sphere(bx, 0.13f, bz, 0.16f, 0.13f, 0.28f); m.sphere(bx + (float) Math.sin(ry) * 0.14f, 0.24f, bz + (float) Math.cos(ry) * 0.14f, 0.09f, 0.09f, 0.09f); }
        g.add(b.build(), mPigeon); if (!cr.empty()) g.add(cr.build(), mCrow); g.x = x; g.z = z; g.upd(); f.g = g; C.flocks.add(f); }
    boolean onRoad(float x, float z) { if (Math.abs(x - AVE) < 11) return true; for (float[] d : DRV) if (x > d[0] - 1 && x < d[1] + 1 && z > d[2] - 1 && z < d[3] + 1) return true;
        if (!sup(x, z)) { float u = ((x - 48) % 96 + 96) % 96, v = ((z - 48) % 96 + 96) % 96; if (Math.min(u, 96 - u) < 6.6f || Math.min(v, 96 - v) < 6.6f) return true; } return false; }
    boolean blocked(Chunk C, float x, float z, float pad) { for (float[] b : C.boxes) if (Math.abs(x - b[0]) < b[2] + pad && Math.abs(z - b[1]) < b[3] + pad) return true; return false; }
    float hash(int a, int b, int s) { Rng r = new Rng(a * 73856093 ^ b * 19349663 ^ s * 83492791); r.f(); return r.f(); }
    /** ручной район вокруг спавна (координаты со спутника) */
    void district(Chunk C, Group g, Rng r, float x0, float z0, float x1, float z1) {
        float[][] H = { // x, z, длина, вдольZ(1/0), этажи, фасад(0 кирпич13 / 1 панель), сторона подъездов, дом
            {46, -102.75f, 40.5f, 1, 9, 0, -1, 13}, {46, -62.25f, 40.5f, 1, 9, 0, -1, 13}, {46, -21.75f, 40.5f, 1, 9, 0, -1, 13}, {46, 18.75f, 40.5f, 1, 9, 0, -1, 13},
            {-39, -117, 46, 1, 9, 1, 1, 11}, {-39, -71, 46, 1, 9, 1, 1, 11}, {-39, -25, 46, 1, 9, 1, 1, 11},
            {-36, -146, 48, 0, 9, 1, 1, 9}, {12, -146, 48, 0, 9, 1, 1, 9}, {40, 74, 40, 1, 9, 1, -1, 15}, {40, 114, 40, 1, 9, 1, -1, 15}};
        for (float[] h : H) if (h[0] >= x0 && h[0] < x1 && h[1] >= z0 && h[1] < z1) house(C, g, h[0], h[1], h[2], 12, (int) h[4], h[3] > 0, h[5] == 0 ? mDom13 : mPanel, (int) h[6], "ул. Героев Тулы, " + (int) h[7], h[7] == 13 && h[1] > 18, r);
        float[][] P = {{8, -40}, {-8, -95}, {12, 60}};       // площадки
        for (float[] p : P) if (p[0] >= x0 && p[0] < x1 && p[1] >= z0 && p[1] < z1) { playground(g, r, p[0], p[1]); C.boxes.add(new float[]{p[0] - 2, p[1], 1.2f, 0.4f}); C.boxes.add(new float[]{p[0] + 2, p[1] + 0.3f, 0.7f, 0.7f}); }
        float[][] K = {{-12, 24}, {28, -125}};
        for (float[] p : K) if (p[0] >= x0 && p[0] < x1 && p[1] >= z0 && p[1] < z1) { containers(g, p[0], p[1]); C.boxes.add(new float[]{p[0], p[1], 3.5f, 0.8f}); }
        float[][] CAR = {{36, -80, 1}, {36, -40, 1}, {34, 0, 1}, {-28, -60, 1}, {-28, -100, 1}, {0, 11, 0}, {-20, 11, 0}, {73, -50, 1}};
        for (float[] p : CAR) if (p[0] >= x0 && p[0] < x1 && p[1] >= z0 && p[1] < z1) { car(g, r, p[0], p[1], p[2] > 0); C.boxes.add(new float[]{p[0], p[1], p[2] > 0 ? 1 : 2.3f, p[2] > 0 ? 2.3f : 1}); }
    }
    void stream() { int cx = (int) Math.floor(px / CS), cz = (int) Math.floor(pz / CS);
        for (int i = cx - 3; i <= cx + 3; i++) for (int j = cz - 3; j <= cz + 3; j++) { long k = ((long) i << 32) ^ (j & 0xffffffffL); if (!chunks.containsKey(k)) { chunks.put(k, build(i, j)); return; } }   // по одному чанку за кадр — без рывков
        Iterator<Map.Entry<Long, Chunk>> it = chunks.entrySet().iterator(); while (it.hasNext()) { Map.Entry<Long, Chunk> en = it.next(); int i = (int) (en.getKey() >> 32), j = en.getKey().intValue();
            if (Math.abs(i - cx) > 4 || Math.abs(j - cz) > 4) { Chunk C = en.getValue(); e.groups.remove(C.g); C.g.free(); for (Flock f : C.flocks) { e.groups.remove(f.g); f.g.free(); } it.remove(); } } }
    void streamAll() { for (int k = 0; k < 64; k++) stream(); }


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
    boolean walkable(float x, float z) { for (Chunk C : chunks.values()) for (float[] b : C.boxes) if (Math.abs(x - b[0]) < b[2] + 0.6f && Math.abs(z - b[1]) < b[3] + 0.6f) return false; return true; }
    // ---------- кадр ----------
    Object near; String nearLabel = "";
    @Override void button(String id) {
        if (near instanceof Item) { Item it = (Item) near; it.got = true; it.o.vis = false; got.add(it.key);
            if (it.card) { snd.tone(659, 0.15f, 0.05f); g.h.postDelayed(() -> snd.tone(988, 0.2f, 0.05f), 120); if (cards < LORE.length) { g.toast("Записка " + (cards + 1) + " / " + LORE.length + "\n\n" + LORE[cards], 9000); cards++; } else g.toast("Ещё одна записка. Почерк твой. Пусто.", 3000); }
            else { nuts++; snd.tone(784, 0.18f, 0.05f); g.toast("Каштан +1", 1200); }
            g.prefs().edit().putStringSet("dvory_got", new HashSet<>(got)).putInt("dvory_cards", cards).putInt("dvory_nuts", nuts).apply(); return; }
        if (near instanceof Entr) { Entr en = (Entr) near; snd.tone(880, 0.1f, 0.05f);
            if (en.kind == 2) { snd.thump(0.4f, 90, 0.2f); g.toast("Дверь подъезда открыта.", 1500); g.go("podezd"); }
            else if (en.kind == 1) { snd.thump(0.4f, 90, 0.2f); g.toast("Дверь поддаётся…", 1500); g.goWeb(WORLDS_WEB[rnd.nextInt(WORLDS_WEB.length)]); }
            else { g.h.postDelayed(() -> snd.tone(440, 0.4f, 0.04f), 200); g.toast("Домофон молчит.", 1600); } }
    }
    @Override void update(float dt) {
        clk += dt; hitT -= dt;
        float fx = g.sx, fz = g.sy, fl = (float) Math.hypot(fx, fz); if (fl > 1) { fx /= fl; fz /= fl; }
        if (fl > 0.05f) { float sp = (1.7f + Math.max(0, fl - 0.9f) * 14) * dt; float cs = (float) Math.cos(g.yaw), sn = (float) Math.sin(g.yaw); float dx = (fx * cs + fz * sn) * sp, dz = (-fx * sn + fz * cs) * sp;
            float nx = px + dx, nz = pz + dz; for (Chunk C : chunks.values()) for (float[] b : C.boxes) { if (b.length > 4) continue; if (Math.abs(nx - b[0]) < b[2] + R && Math.abs(nz - b[1]) < b[3] + R) { if (Math.abs(px - b[0]) < b[2] + R) nz = pz; else nx = px; } }
            px = nx; pz = nz; float ob = bob; bob += fl * dt * 9; if ((int) (ob / Math.PI) != (int) (bob / Math.PI)) { boolean road = onRoad(px, pz); snd.noise(0.09f, road ? 0.06f : 0.045f, road ? 0.6f : 0.15f); } }
        stream(); walkTick(dt, 4, 25, 65, 11);
        // голуби
        for (Chunk C : chunks.values()) for (Flock f : C.flocks) { float d = (float) Math.hypot(px - f.cx, pz - f.cz);
            if (!f.fly && d < (fl > 0.95f ? 6.5f : 3.6f) + 3.5f) { f.fly = true; f.t = 0; for (int k = 0; k < 4; k++) { final int kk = k; g.h.postDelayed(() -> snd.noise(0.25f, 0.08f, 0.8f), kk * 60); } }
            if (f.fly) { f.t += dt; float ax = f.cx - px, az = f.cz - pz, al = (float) Math.max(0.1, Math.hypot(ax, az)); f.g.x = f.cx + ax / al * f.t * 8; f.g.z = f.cz + az / al * f.t * 8; f.g.y = f.t * f.t * 2.5f; if (f.t > 9) { f.fly = false; f.g.y = 0; f.g.x = f.cx; f.g.z = f.cz; f.g.vis = d > 25; } }
            else { f.g.vis = true; f.g.y = (float) Math.abs(Math.sin(clk * 3 + f.cx)) * 0.02f; } f.g.upd(); }
        // машины на проспекте
        if (cars.size() < 4 && rnd.nextFloat() < dt * 0.2f && Math.abs(px - AVE) < 150) { Car c = new Car(); boolean n = rnd.nextBoolean(); c.v = (n ? -1 : 1) * (12 + rnd.nextFloat() * 6); c.x = AVE + (n ? -3 : 3); c.z = pz - Math.signum(c.v) * 140; Group cg = new Group(); car(cg, new Rng(rnd.nextInt()), 0, 0, true); cg.done(); c.g = cg; e.groups.add(cg); cars.add(c); }
        float bd = 1e9f; for (int i = cars.size() - 1; i >= 0; i--) { Car c = cars.get(i); c.z += c.v * dt; c.g.x = c.x; c.g.z = c.z; c.g.upd(); float d = (float) Math.hypot(c.x - px, c.z - pz); bd = Math.min(bd, d);
            if (Math.abs(c.x - px) < 1.2f && Math.abs(c.z - pz) < 2.4f && hitT <= 0) { hitT = 3; snd.thump(0.9f, 60, 0.4f); g.toast("Всё сначала.", 2500); px = 8; pz = 2; g.yaw = 0; }
            if (Math.abs(c.z - pz) > 220) { e.groups.remove(c.g); c.g.free(); cars.remove(i); } }
        snd.motorF = 45; snd.motorG = Math.max(0, 1 - bd / 80) * 0.05f;
        // звуки района
        ambT -= dt; if (ambT < 0) { ambT = 5 + rnd.nextFloat() * 15; float t = rnd.nextFloat();
            if (t < 0.25f) { for (int k = 0; k < 2 + rnd.nextInt(3); k++) { final int kk = k; g.h.postDelayed(() -> { snd.tone(420 + rnd.nextInt(80), 0.12f, 0.03f); snd.noise(0.1f, 0.03f, 0.4f); }, kk * 330); } }   // собака
            else if (t < 0.45f) snd.thump(0.25f, 80, 0.25f);                                                           // дверь подъезда
            else if (t < 0.6f) { for (int k = 0; k < 6; k++) { final int kk = k; g.h.postDelayed(() -> snd.tone(kk % 2 == 0 ? 880 : 660, 0.25f, 0.015f), kk * 260); } }   // сигнализация
            else if (t < 0.72f) { snd.tone(180, 1.6f, 0.03f); g.h.postDelayed(() -> snd.tone(150, 1.4f, 0.03f), 1700); }   // поезд
            else if (t < 0.86f) { for (int k = 0; k < 3; k++) { final int kk = k; g.h.postDelayed(() -> snd.noise(0.2f, 0.05f, 0.9f), kk * 450); } }   // ворона
            else snd.noise(0.05f, 0.04f, 0.9f); }
        // что рядом
        near = null; nearLabel = ""; float best = 1.6f;
        for (Chunk C : chunks.values()) { for (Item it : C.items) if (!it.got) { float d = (float) Math.hypot(px - it.x, pz - it.z); if (d < best) { best = d; near = it; nearLabel = it.card ? "E — поднять записку" : "E — каштан"; } }
            for (Entr en : C.entr) { float d = (float) Math.hypot(px - en.x, pz - en.z); if (d < best + 0.4f) { best = d; near = en; nearLabel = en.label; } } }
        g.prompt(nearLabel);
        float cy = 1.64f + (float) Math.sin(bob) * 0.035f + (float) Math.sin(clk * 0.7f) * 0.008f;
        e.cx = px; e.cy = cy; e.cz = pz; e.yaw = g.yaw + (float) Math.sin(clk * 0.37f) * 0.004f; e.pitch = g.pitch + (float) Math.sin(clk * 0.53f) * 0.003f; e.roll = (float) Math.sin(bob * 0.5f) * 0.006f;
        int sec = (int) (clk % 60); g.hud("ноябрь · 14:50:" + (sec < 10 ? "0" : "") + sec + "\n📝 " + Math.min(cards, LORE.length) + "/" + LORE.length + " · 🌰 " + nuts);
    }
}
