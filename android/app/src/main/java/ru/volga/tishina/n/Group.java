package ru.volga.tishina.n;

import android.opengl.Matrix;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;

/** Группа объектов с общей позицией (вагон, сегмент города). Пока строится — копит геометрию по материалам. */
final class Group {
    final ArrayList<Obj> objs = new ArrayList<>();
    final ArrayList<Spr> sprs = new ArrayList<>();
    final float[] M = new float[16];
    float x, y, z, ry, rz; boolean vis = true;
    private final LinkedHashMap<Mat, MB> pend = new LinkedHashMap<>();
    float tile = 0;
    Group() { Matrix.setIdentityM(M, 0); }
    MB mb(Mat m) { MB b = pend.get(m); if (b == null) { b = new MB(); pend.put(m, b); } b.tile = tile; return b; }
    MB mb(Mat m, float tl) { MB b = mb(m); b.tile = tl; return b; }
    Group box(Mat m, float x, float y, float z, float sx, float sy, float sz) { mb(m).box(x, y, z, sx, sy, sz); return this; }
    Group cyl(Mat m, float x, float y, float z, float r, float h) { mb(m).cyl(x, y, z, r, h); return this; }
    Group plane(Mat m, float x, float y, float z, float sx, float sy, float ry) { mb(m).plane(x, y, z, sx, sy, ry, 0); return this; }
    Spr spr(Spr s) { s.grp = this; sprs.add(s); return s; }
    /** собрать накопленное в меши (GL-поток) */
    Group done() { for (java.util.Map.Entry<Mat, MB> e : pend.entrySet()) if (!e.getValue().empty()) objs.add(new Obj(e.getValue().build(), e.getKey())); pend.clear(); upd(); return this; }
    Obj add(Mesh m, Mat mat) { Obj o = new Obj(m, mat); objs.add(o); return o; }
    void upd() { Matrix.setIdentityM(M, 0); Matrix.translateM(M, 0, x, y, z); if (ry != 0) Matrix.rotateM(M, 0, (float) Math.toDegrees(ry), 0, 1, 0); if (rz != 0) Matrix.rotateM(M, 0, (float) Math.toDegrees(rz), 0, 0, 1); }
    void free() { for (Obj o : objs) o.mesh.free(); objs.clear(); }
}
