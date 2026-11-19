package ru.volga.tishina.n;

import android.opengl.Matrix;
import java.util.Arrays;

/** Сборщик геометрии: склеивает много коробок/цилиндров в один меш (как Bag/Batch в JS). */
final class MB {
    float[] d = new float[8 * 600];
    int n = 0;
    /** 0 — uv 0..1 на грань; >0 — сколько метров на одно повторение текстуры. */
    float tile = 0;
    private final float[] M = new float[16], R = new float[16], t = new float[16];

    void ensure(int k) { if (n + k > d.length) d = Arrays.copyOf(d, Math.max(d.length * 2, n + k)); }
    boolean empty() { return n == 0; }

    private void mat(float x, float y, float z, float sx, float sy, float sz, float rx, float ry, float rz) {
        Matrix.setIdentityM(R, 0);
        if (ry != 0) Matrix.rotateM(R, 0, (float) Math.toDegrees(ry), 0, 1, 0);
        if (rx != 0) Matrix.rotateM(R, 0, (float) Math.toDegrees(rx), 1, 0, 0);
        if (rz != 0) Matrix.rotateM(R, 0, (float) Math.toDegrees(rz), 0, 0, 1);
        System.arraycopy(R, 0, M, 0, 16);
        Matrix.scaleM(M, 0, sx, sy, sz);
        Matrix.setIdentityM(t, 0); Matrix.translateM(t, 0, x, y, z);
        float[] o = new float[16]; Matrix.multiplyMM(o, 0, t, 0, M, 0); System.arraycopy(o, 0, M, 0, 16);
    }
    private void v(float x, float y, float z, float nx, float ny, float nz, float u, float w) {
        ensure(8);
        d[n++] = M[0] * x + M[4] * y + M[8] * z + M[12];
        d[n++] = M[1] * x + M[5] * y + M[9] * z + M[13];
        d[n++] = M[2] * x + M[6] * y + M[10] * z + M[14];
        float a = R[0] * nx + R[4] * ny + R[8] * nz, b = R[1] * nx + R[5] * ny + R[9] * nz, c = R[2] * nx + R[6] * ny + R[10] * nz;
        float l = (float) Math.sqrt(a * a + b * b + c * c); if (l < 1e-6f) l = 1;
        d[n++] = a / l; d[n++] = b / l; d[n++] = c / l; d[n++] = u; d[n++] = w;
    }
    /** четырёхугольник в локальных единичных координатах */
    private void quad(float[] p, float nx, float ny, float nz, float[] uv) {
        v(p[0], p[1], p[2], nx, ny, nz, uv[0], uv[1]); v(p[3], p[4], p[5], nx, ny, nz, uv[2], uv[3]); v(p[6], p[7], p[8], nx, ny, nz, uv[4], uv[5]);
        v(p[0], p[1], p[2], nx, ny, nz, uv[0], uv[1]); v(p[6], p[7], p[8], nx, ny, nz, uv[4], uv[5]); v(p[9], p[10], p[11], nx, ny, nz, uv[6], uv[7]);
    }
    private float[] uv(float w, float h) { float U = tile > 0 ? w / tile : 1, V = tile > 0 ? h / tile : 1; return new float[]{0, 0, U, 0, U, V, 0, V}; }

    MB box(float x, float y, float z, float sx, float sy, float sz) { return box(x, y, z, sx, sy, sz, 0, 0, 0); }
    MB box(float x, float y, float z, float sx, float sy, float sz, float rx, float ry, float rz) {
        mat(x, y, z, sx, sy, sz, rx, ry, rz);
        float h = 0.5f;
        quad(new float[]{h, -h, h, h, -h, -h, h, h, -h, h, h, h}, 1, 0, 0, uv(sz, sy));
        quad(new float[]{-h, -h, -h, -h, -h, h, -h, h, h, -h, h, -h}, -1, 0, 0, uv(sz, sy));
        quad(new float[]{-h, h, h, h, h, h, h, h, -h, -h, h, -h}, 0, 1, 0, uv(sx, sz));
        quad(new float[]{-h, -h, -h, h, -h, -h, h, -h, h, -h, -h, h}, 0, -1, 0, uv(sx, sz));
        quad(new float[]{-h, -h, h, h, -h, h, h, h, h, -h, h, h}, 0, 0, 1, uv(sx, sy));
        quad(new float[]{h, -h, -h, -h, -h, -h, -h, h, -h, h, h, -h}, 0, 0, -1, uv(sx, sy));
        return this;
    }
    /** плоскость XY с нормалью +Z (как PlaneGeometry), повёрнутая ry, rx */
    MB plane(float x, float y, float z, float sx, float sy, float ry, float rx) {
        mat(x, y, z, sx, sy, 1, rx, ry, 0);
        quad(new float[]{-0.5f, -0.5f, 0, 0.5f, -0.5f, 0, 0.5f, 0.5f, 0, -0.5f, 0.5f, 0}, 0, 0, 1, uv(sx, sy));
        return this;
    }
    /** горизонтальная плоскость (пол/земля), нормаль вверх */
    MB floor(float x, float y, float z, float sx, float sz) { return plane(x, y, z, sx, sz, 0, (float) (-Math.PI / 2)); }
    MB cyl(float x, float y, float z, float r, float h) { return cyl(x, y, z, r, r, h, 0, 0, 10); }
    MB cyl(float x, float y, float z, float r0, float r1, float h, float rx, float rz, int seg) {
        mat(x, y, z, 1, h, 1, rx, 0, rz);
        for (int i = 0; i < seg; i++) {
            double a0 = i * Math.PI * 2 / seg, a1 = (i + 1) * Math.PI * 2 / seg;
            float c0 = (float) Math.cos(a0), s0 = (float) Math.sin(a0), c1 = (float) Math.cos(a1), s1 = (float) Math.sin(a1);
            float u0 = (float) i / seg, u1 = (float) (i + 1) / seg;
            v(c0 * r0, -0.5f, s0 * r0, c0, 0, s0, u0, 0); v(c1 * r1, 0.5f, s1 * r1, c1, 0, s1, u1, 1); v(c1 * r0, -0.5f, s1 * r0, c1, 0, s1, u1, 0);
            v(c0 * r0, -0.5f, s0 * r0, c0, 0, s0, u0, 0); v(c0 * r1, 0.5f, s0 * r1, c0, 0, s0, u0, 1); v(c1 * r1, 0.5f, s1 * r1, c1, 0, s1, u1, 1);
            if (r1 > 0) { v(0, 0.5f, 0, 0, 1, 0, .5f, .5f); v(c1 * r1, 0.5f, s1 * r1, 0, 1, 0, 0, 0); v(c0 * r1, 0.5f, s0 * r1, 0, 1, 0, 0, 0); }
        }
        return this;
    }
    MB sphere(float x, float y, float z, float sx, float sy, float sz) {
        mat(x, y, z, sx, sy, sz, 0, 0, 0);
        int W = 10, H = 7;
        for (int j = 0; j < H; j++) for (int i = 0; i < W; i++) {
            float[][] q = new float[4][];
            int[][] k = {{i, j}, {i + 1, j}, {i + 1, j + 1}, {i, j + 1}};
            for (int m = 0; m < 4; m++) { double th = k[m][1] * Math.PI / H, ph = k[m][0] * Math.PI * 2 / W;
                q[m] = new float[]{(float) (Math.sin(th) * Math.cos(ph)) * .5f, (float) Math.cos(th) * .5f, (float) (Math.sin(th) * Math.sin(ph)) * .5f, (float) k[m][0] / W, (float) k[m][1] / H}; }
            int[] o = {0, 1, 2, 0, 2, 3};
            for (int m : o) v(q[m][0], q[m][1], q[m][2], q[m][0] * 2, q[m][1] * 2, q[m][2] * 2, q[m][3], q[m][4]);
        }
        return this;
    }
    /** готовый меш (вызывать в GL-потоке) */
    Mesh build() { return new Mesh(d, n); }
}
