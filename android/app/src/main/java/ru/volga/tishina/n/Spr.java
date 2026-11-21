package ru.volga.tishina.n;

/** Светящаяся точка-блик (фонарь, фара), всегда лицом к камере, аддитивно. */
final class Spr {
    float x, y, z, s, r, g, b, a = 1; boolean vis = true; Group grp;
    Spr(float x, float y, float z, float s, int rgb, float a) { this.x = x; this.y = y; this.z = z; this.s = s; col(rgb); this.a = a; }
    Spr col(int rgb) { r = ((rgb >> 16) & 255) / 255f; g = ((rgb >> 8) & 255) / 255f; b = (rgb & 255) / 255f; return this; }
}
