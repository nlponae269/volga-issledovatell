package ru.volga.tishina.n;

import android.opengl.Matrix;

/** Отрисовываемый объект: меш + материал + своя матрица (относительно группы). */
final class Obj {
    Mesh mesh; Mat mat; boolean vis = true;
    /** «картонная» фигура, всегда повёрнута к камере: позиция, ширина, высота */
    boolean bill; float bx, by, bz, bw, bh;
    final float[] M = new float[16];
    Obj(Mesh m, Mat mat) { mesh = m; this.mat = mat; Matrix.setIdentityM(M, 0); }
    Obj at(float x, float y, float z) { Matrix.setIdentityM(M, 0); Matrix.translateM(M, 0, x, y, z); return this; }
}
