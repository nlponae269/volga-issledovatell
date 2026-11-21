package ru.volga.tishina.n;

import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.opengl.GLES30;
import android.opengl.GLUtils;
import java.io.InputStream;
import java.util.HashMap;

/** Текстуры: из assets, надписи (Canvas), процедурные. */
final class Tex {
    static AssetManager am;
    static final HashMap<String, Integer> cache = new HashMap<>();
    static int up(Bitmap bm, boolean mip, boolean repeat) {
        int[] t = new int[1]; GLES30.glGenTextures(1, t, 0);
        GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, t[0]);
        GLUtils.texImage2D(GLES30.GL_TEXTURE_2D, 0, bm, 0);
        int wrap = repeat ? GLES30.GL_REPEAT : GLES30.GL_CLAMP_TO_EDGE;
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_S, wrap);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_WRAP_T, wrap);
        GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MAG_FILTER, GLES30.GL_LINEAR);
        if (mip) { GLES30.glGenerateMipmap(GLES30.GL_TEXTURE_2D); GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MIN_FILTER, GLES30.GL_LINEAR_MIPMAP_LINEAR); GLES30.glTexParameterf(GLES30.GL_TEXTURE_2D, 0x84FE, 4f); }
        else GLES30.glTexParameteri(GLES30.GL_TEXTURE_2D, GLES30.GL_TEXTURE_MIN_FILTER, GLES30.GL_LINEAR);
        return t[0];
    }
    /** картинка из assets (res/...). 0 — если нет файла. */
    static int file(String path) {
        Integer c = cache.get(path); if (c != null) return c;
        int id = 0;
        try (InputStream in = am.open(path)) { Bitmap bm = BitmapFactory.decodeStream(in); if (bm != null) { id = up(bm, true, true); bm.recycle(); } } catch (Exception e) { id = 0; }
        cache.put(path, id); return id;
    }
    static Bitmap textBmp(String text, int bg, int fg, int w, int h, int font, boolean frame) {
        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(bm);
        c.drawColor(bg | 0xFF000000);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG); p.setColor(fg | 0xFF000000);
        if (frame) { p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(8); c.drawRect(14, 14, w - 14, h - 14, p); p.setStyle(Paint.Style.FILL); }
        p.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD)); float f = font; p.setTextSize(f);
        while (p.measureText(text) > w - 70 && f > 24) { f -= 4; p.setTextSize(f); }
        p.setTextAlign(Paint.Align.CENTER);
        Paint.FontMetrics fm = p.getFontMetrics(); c.drawText(text, w / 2f, h / 2f - (fm.ascent + fm.descent) / 2, p);
        return bm;
    }
    /** табличка с текстом: фон, цвет букв (0xRRGGBB) */
    static int text(String text, int bg, int fg, int w, int h, int font) {
        String key = "t:" + text + bg + "/" + fg + w + "x" + h; Integer c = cache.get(key); if (c != null) return c;
        Bitmap bm = textBmp(text, bg, fg, w, h, font, true); int id = up(bm, true, false); bm.recycle(); cache.put(key, id); return id;
    }
    static int star() {
        Integer c = cache.get("star"); if (c != null) return c;
        Bitmap bm = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888); Canvas cv = new Canvas(bm); Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new RadialGradient(64, 64, 64, new int[]{Color.WHITE, Color.argb(128, 255, 255, 255), Color.argb(0, 255, 255, 255)}, new float[]{0, .15f, 1}, Shader.TileMode.CLAMP));
        cv.drawRect(0, 0, 128, 128, p); int id = up(bm, false, false); bm.recycle(); cache.put("star", id); return id;
    }
    static void update(int id, Bitmap bm) { GLES30.glBindTexture(GLES30.GL_TEXTURE_2D, id); GLUtils.texSubImage2D(GLES30.GL_TEXTURE_2D, 0, 0, 0, bm); }
    static int dyn(Bitmap bm) { return up(bm, false, false); }
    static void clear() { for (int id : cache.values()) if (id != 0) GLES30.glDeleteTextures(1, new int[]{id}, 0); cache.clear(); }
}
