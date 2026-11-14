package ru.volga.tishina;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.net.Uri;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private WebView web;
    private static final String HOST = "appassets.androidplatform.net";
    private static String mime(String p) {
        String e = p.substring(p.lastIndexOf('.') + 1).toLowerCase();
        switch (e) {
            case "html": return "text/html"; case "js": case "mjs": return "text/javascript"; case "css": return "text/css"; case "json": return "application/json";
            case "jpg": case "jpeg": return "image/jpeg"; case "png": return "image/png"; case "webp": return "image/webp"; case "mp3": return "audio/mpeg"; case "ogg": return "audio/ogg";
            case "wav": return "audio/wav"; case "wasm": return "application/wasm"; case "svg": return "image/svg+xml"; default: return "application/octet-stream";
        }
    }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (android.os.Build.VERSION.SDK_INT >= 28) { WindowManager.LayoutParams lp = getWindow().getAttributes(); lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES; getWindow().setAttributes(lp); }   // на весь экран, включая вырез камеры
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        web.setBackgroundColor(0xFF000000);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        // игры отдаются по https-адресу из assets: так работают ES-модули и загрузка моделей (игра «Гаражи»)
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath(); if (path == null || path.equals("/")) path = "/index.html";
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    Map<String, String> h = new HashMap<>(); h.put("Access-Control-Allow-Origin", "*"); h.put("Cache-Control", "no-cache");
                    return new WebResourceResponse(mime(path), mime(path).startsWith("text") || mime(path).endsWith("javascript") ? "utf-8" : null, 200, "OK", h, in);
                } catch (Exception e) { return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<>(), null); }
            }
        });
        setContentView(web);
        web.loadUrl("https://" + HOST + "/index.html");
        immersive();
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }
    @Override protected void onPause() { super.onPause(); web.evaluateJavascript("window.__musicPause&&__musicPause()", null); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); web.evaluateJavascript("window.__musicResume&&__musicResume()", null); }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
