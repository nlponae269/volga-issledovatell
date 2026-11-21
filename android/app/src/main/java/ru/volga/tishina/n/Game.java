package ru.volga.tishina.n;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.opengl.GLSurfaceView;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Экран мира: GL-поверхность, джойстик, обзор пальцем, кнопки, надписи. */
public class Game extends Activity {
    GLSurfaceView gv; Engine e; World w; Snd snd;
    TextView hud, prompt, toast, sub; View fadeV; MapV map; Joy joy; LinearLayout btns;
    // ввод (пишется в UI-потоке, читается в GL)
    volatile float sx, sy; volatile float yaw, pitch; volatile boolean run;
    final Handler h = new Handler(Looper.getMainLooper());
    private int lookId = -1; private float lx, ly;
    private final java.util.concurrent.ConcurrentLinkedQueue<String> presses = new java.util.concurrent.ConcurrentLinkedQueue<>();

    static World make(String id) {
        switch (id) {
            case "tramvay": return new TramWorld();
            case "podezd": return new PodezdWorld();
            case "tropa": return new TropaWorld();
            case "dvory": return new DvoryWorld();
            default: return new TramWorld();
        }
    }
    float dp(float v) { return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }
    TextView tv(float size, int gravity) { TextView t = new TextView(this); t.setTextColor(Color.WHITE); t.setTextSize(size); t.setGravity(gravity); t.setShadowLayer(6, 0, 2, Color.BLACK); return t; }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        Tex.am = getAssets();
        FrameLayout root = new FrameLayout(this);
        gv = new GLSurfaceView(this); gv.setEGLContextClientVersion(3); gv.setEGLConfigChooser(8, 8, 8, 8, 24, 0); gv.setPreserveEGLContextOnPause(true);
        e = new Engine(); e.game = this; snd = new Snd(); snd.start();
        w = make(getIntent().getStringExtra("world")); w.e = e; w.g = this; w.snd = snd; e.world = w;
        gv.setRenderer(e); gv.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        root.addView(gv);
        gv.setOnTouchListener((v, ev) -> { touch(ev); return true; });
        joy = new Joy(); root.addView(joy, new FrameLayout.LayoutParams((int) dp(130), (int) dp(130), Gravity.BOTTOM | Gravity.START)); ((FrameLayout.LayoutParams) joy.getLayoutParams()).setMargins((int) dp(26), 0, 0, (int) dp(26));
        hud = tv(14, Gravity.END); FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-2, -2, Gravity.TOP | Gravity.END); lp.setMargins(0, (int) dp(10), (int) dp(16), 0); root.addView(hud, lp);
        prompt = tv(17, Gravity.CENTER); lp = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER); lp.topMargin = (int) dp(70); root.addView(prompt, lp);
        toast = tv(19, Gravity.CENTER); lp = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_HORIZONTAL | Gravity.TOP); lp.topMargin = (int) dp(90); root.addView(toast, lp); toast.setAlpha(0);
        sub = tv(15, Gravity.CENTER); sub.setTextColor(0xFFFFC86A); lp = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM); lp.bottomMargin = (int) dp(30); root.addView(sub, lp); sub.setAlpha(0);
        btns = new LinearLayout(this); btns.setOrientation(LinearLayout.VERTICAL); lp = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.END); lp.setMargins(0, 0, (int) dp(24), (int) dp(24)); root.addView(btns, lp);
        for (String id : w.buttons()) { Button bt = new Button(this); bt.setText(id); bt.setTextColor(Color.WHITE); bt.setTextSize(id.length() > 2 ? 13 : 20); bt.setAllCaps(false);
            android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable(); bg.setShape(android.graphics.drawable.GradientDrawable.OVAL); bg.setColor(0x66000000); bg.setStroke((int) dp(2), 0x55FFFFFF); bt.setBackground(bg);
            LinearLayout.LayoutParams bl = new LinearLayout.LayoutParams((int) dp(70), (int) dp(70)); bl.topMargin = (int) dp(12); btns.addView(bt, 0, bl);
            bt.setOnClickListener(v -> presses.add(id)); }
        map = new MapV(); map.setVisibility(View.GONE); root.addView(map, new FrameLayout.LayoutParams(-1, -1)); map.setOnClickListener(v -> map.setVisibility(View.GONE));
        fadeV = new View(this); fadeV.setBackgroundColor(Color.BLACK); fadeV.setClickable(false); root.addView(fadeV, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        fadeV.animate().alpha(0).setDuration(1200).setStartDelay(600).start();
        run = true;
    }
    /** вызывается движком каждый кадр (GL-поток) */
    void tick(float dt) { String p; while ((p = presses.poll()) != null) w.button(p); }
    private void touch(MotionEvent ev) {
        int a = ev.getActionMasked(), i = ev.getActionIndex(), id = ev.getPointerId(i);
        if (a == MotionEvent.ACTION_DOWN || a == MotionEvent.ACTION_POINTER_DOWN) { if (lookId < 0) { lookId = id; lx = ev.getX(i); ly = ev.getY(i); } }
        else if (a == MotionEvent.ACTION_MOVE) { for (int k = 0; k < ev.getPointerCount(); k++) if (ev.getPointerId(k) == lookId) { float x = ev.getX(k), y = ev.getY(k);
            yaw -= (x - lx) * 0.0045f; pitch = Math.max(-1.3f, Math.min(1.3f, pitch - (y - ly) * 0.0045f)); lx = x; ly = y; } }
        else if (a == MotionEvent.ACTION_UP || a == MotionEvent.ACTION_POINTER_UP || a == MotionEvent.ACTION_CANCEL) { if (id == lookId || a == MotionEvent.ACTION_CANCEL) lookId = -1; }
    }
    // --- API для миров (можно звать из GL-потока) ---
    private String lastHud = "", lastPrompt = "";
    void hud(String s) { if (s.equals(lastHud)) return; lastHud = s; h.post(() -> hud.setText(s)); }
    void prompt(String s) { if (s.equals(lastPrompt)) return; lastPrompt = s; h.post(() -> { prompt.setText(s); prompt.setAlpha(s.isEmpty() ? 0 : 1); }); }
    private int toastN = 0, subN = 0;
    void toast(String s, int ms) { final int k = ++toastN; h.post(() -> { toast.setText(s); toast.animate().alpha(1).setDuration(250).start(); }); h.postDelayed(() -> { if (k == toastN) toast.animate().alpha(0).setDuration(400).start(); }, ms); }
    void sub(String s, int ms) { final int k = ++subN; h.post(() -> { sub.setText(s); sub.animate().alpha(1).setDuration(250).start(); }); h.postDelayed(() -> { if (k == subN) sub.animate().alpha(0).setDuration(400).start(); }, ms); }
    void fadeOut(Runnable then) { h.post(() -> fadeV.animate().alpha(1).setDuration(1100).setStartDelay(0).withEndAction(then).start()); }
    void showMap() { h.post(() -> { map.setVisibility(map.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE); map.invalidate(); }); }
    /** спросить число (лифт); ответ приходит в GL-поток */
    void askNumber(String title, String hint, java.util.function.Consumer<String> done) { h.post(() -> {
        android.widget.EditText in = new android.widget.EditText(this); in.setInputType(android.text.InputType.TYPE_CLASS_NUMBER | android.text.InputType.TYPE_NUMBER_FLAG_SIGNED); in.setTextSize(26); in.setTextColor(0xFFFF5A3A); in.setBackgroundColor(0xFF0B0B0B); in.setGravity(Gravity.CENTER); in.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(22)});
        android.app.AlertDialog d = new android.app.AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert).setTitle(title).setMessage(hint).setView(in)
            .setPositiveButton("Поехать", (x, y) -> { String v = in.getText().toString().trim(); gv.queueEvent(() -> done.accept(v)); }).setNegativeButton("Отмена", null).create();
        d.show(); in.requestFocus(); d.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE); }); }
    android.content.SharedPreferences prefs() { return getSharedPreferences("tishina", MODE_PRIVATE); }
    boolean mapOpen() { return map.getVisibility() == View.VISIBLE; }
    void redrawMap() { h.post(() -> map.invalidate()); }
    /** перейти в другой нативный мир */
    void go(String world) { fadeOut(() -> { Intent it = new Intent(this, Game.class); it.putExtra("world", world); startActivity(it); finish(); overridePendingTransition(0, 0); }); }
    /** в «старую» (веб) версию — для миров, которые ещё не перенесены */
    void goWeb(String page) { fadeOut(() -> { Intent it = new Intent(this, ru.volga.tishina.MainActivity.class); it.putExtra("page", page); it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP); startActivity(it); finish(); }); }
    /** назад в HTML-меню (WebView-активность уже под нами в стеке) */
    void menu() { fadeOut(() -> { finish(); overridePendingTransition(0, 0); }); }

    @Override public void onBackPressed() { if (mapOpen()) { map.setVisibility(View.GONE); return; } gv.queueEvent(() -> { if (!w.back()) menu(); }); }
    @Override protected void onPause() { super.onPause(); gv.onPause(); snd.pause(true); }
    @Override protected void onResume() { super.onResume(); gv.onResume(); snd.pause(false); getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY); }
    @Override protected void onDestroy() { super.onDestroy(); run = false; w.destroy(); snd.stop(); }

    /** джойстик */
    final class Joy extends View {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG); float kx, ky; int pid = -1;
        Joy() { super(Game.this); }
        @Override protected void onDraw(Canvas c) { float r = getWidth() / 2f; p.setStyle(Paint.Style.FILL); p.setColor(0x33000000); c.drawCircle(r, r, r - 2, p); p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(dp(2)); p.setColor(0x44FFFFFF); c.drawCircle(r, r, r - 3, p);
            p.setStyle(Paint.Style.FILL); p.setColor(0x55FFFFFF); c.drawCircle(r + kx * r * 0.6f, r + ky * r * 0.6f, r * 0.38f, p); }
        @Override public boolean onTouchEvent(MotionEvent ev) {
            float r = getWidth() / 2f; int a = ev.getActionMasked();
            if (a == MotionEvent.ACTION_UP || a == MotionEvent.ACTION_CANCEL) { kx = ky = 0; sx = sy = 0; invalidate(); return true; }
            kx = Math.max(-1, Math.min(1, (ev.getX() - r) / (r * 0.7f))); ky = Math.max(-1, Math.min(1, (ev.getY() - r) / (r * 0.7f))); sx = kx; sy = ky; invalidate(); return true; }
    }
    /** карта (рисует мир) */
    final class MapV extends View { MapV() { super(Game.this); } @Override protected void onDraw(Canvas c) { c.drawColor(0xF20D1119); w.drawMap(c, getWidth(), getHeight(), getResources().getDisplayMetrics().density); } }
}
