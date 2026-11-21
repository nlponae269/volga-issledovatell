package ru.volga.tishina.n;

/** Мир игры. init() и update() вызываются в GL-потоке. */
abstract class World {
    Engine e; Game g; Snd snd;
    abstract void init();
    abstract void update(float dt);
    /** кнопка на экране нажата (id из buttons()) */
    void button(String id) {}
    /** кнопки справа, сверху вниз: подпись */
    String[] buttons() { return new String[]{"E"}; }
    /** вызывается, когда игрок нажал «назад» в мире; true — обработали сами */
    boolean back() { return false; }
    void destroy() {}
    /** карта (если есть) — рисуется Canvas'ом в UI-потоке */
    void drawMap(android.graphics.Canvas c, int w, int h, float dpi) {}
    static float clamp(float v, float a, float b) { return v < a ? a : v > b ? b : v; }
    /** детерминированный генератор (как rng() в JS) */
    static final class Rng { private int a; Rng(int seed) { a = seed; }
        float f() { a += 0x6D2B79F5; int t = a; t = (t ^ (t >>> 15)) * (t | 1); t ^= t + (t ^ (t >>> 7)) * (t | 61); return ((t ^ (t >>> 14)) & 0xffffffffL) / 4294967296f; }
        int i(int n) { return (int) (f() * n); } }
}
