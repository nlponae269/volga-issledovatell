package ru.volga.tishina.n;

/** Точечный свет. Движок каждый кадр берёт до 8 ближайших к камере. */
final class Light {
    float x, y, z, r, g, b, range; boolean on = true; Group grp;
    Light(float x, float y, float z, int rgb, float k, float range) { this.x = x; this.y = y; this.z = z; this.range = range; set(rgb, k); }
    Light set(int rgb, float k) { r = Mat.lin(((rgb >> 16) & 255) / 255f) * k; g = Mat.lin(((rgb >> 8) & 255) / 255f) * k; b = Mat.lin((rgb & 255) / 255f) * k; return this; }
}
