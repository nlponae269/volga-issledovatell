package ru.volga.tishina.n;

/** Материал: цвет (задаётся в sRGB, хранится линейным), текстура, свечение, режимы. */
final class Mat {
    float r = 1, g = 1, b = 1, a = 1, er, eg, eb, rx = 1, ry = 1, spec = 0;
    int tex = 0;
    boolean unlit, blend, additive, twoSided, noFog;
    static float lin(float c) { return (float) Math.pow(c, 2.2); }
    static Mat c(int rgb) { Mat m = new Mat(); m.col(rgb); return m; }
    static Mat unlit(int rgb) { Mat m = c(rgb); m.unlit = true; return m; }
    Mat col(int rgb) { r = lin(((rgb >> 16) & 255) / 255f); g = lin(((rgb >> 8) & 255) / 255f); b = lin((rgb & 255) / 255f); return this; }
    Mat tex(int t) { tex = t; return this; }
    Mat rep(float x, float y) { rx = x; ry = y; return this; }
    Mat emis(int rgb, float k) { er = lin(((rgb >> 16) & 255) / 255f) * k; eg = lin(((rgb >> 8) & 255) / 255f) * k; eb = lin((rgb & 255) / 255f) * k; return this; }
    Mat alpha(float al) { a = al; blend = true; return this; }
    Mat add() { additive = true; blend = true; return this; }
    Mat two() { twoSided = true; return this; }
    Mat spec(float s) { spec = s; return this; }
}
