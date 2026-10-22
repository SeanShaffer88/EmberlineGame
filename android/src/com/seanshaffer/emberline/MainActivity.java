package com.seanshaffer.emberline;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** Local-only Android shell. No INTERNET or storage permission is requested. */
public final class MainActivity extends Activity {
    private static final String ORIGIN = "emberline.local";
    private static final int EXPORT = 10, IMPORT = 11, MAX_SAVE = 500000;
    private WebView web;
    private SharedPreferences prefs;
    private String pendingExport;
    private boolean resumed;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        prefs = getSharedPreferences("emberline", MODE_PRIVATE);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(195, 220, 229));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        // Android 15 can enforce edge-to-edge. Apply insets explicitly for camera and navigation safety.
        web.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        WebView.setWebContentsDebuggingEnabled(false);
        web.addJavascriptInterface(new LocalBridge(), "EmberlineNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // All documents are bundled. The game has no external navigation.
                return true;
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !ORIGIN.equals(uri.getHost()) || !"GET".equals(request.getMethod())) return denied();
                String path = uri.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                if (path.contains("..") || path.contains("\\") || path.indexOf('\0') >= 0) return denied();
                String mime = path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : path.endsWith(".svg") ? "image/svg+xml" : "text/plain";
                try {
                    return new WebResourceResponse(mime, "UTF-8", 200, "OK", Collections.singletonMap("Cache-Control", "no-store"), getAssets().open(path.substring(1)));
                } catch (Exception ignored) { return denied(); }
            }
        });
        setContentView(web);
        web.loadUrl("https://" + ORIGIN + "/index.html");
    }
    private WebResourceResponse denied() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private void message(String text) { runOnUiThread(() -> Toast.makeText(this, text, Toast.LENGTH_LONG).show()); }
    private boolean validSave(String data) {
        try { return data != null && data.length() <= MAX_SAVE && new JSONObject(data).getInt("version") == 1; }
        catch (Exception e) { return false; }
    }
    public final class LocalBridge {
        @JavascriptInterface public String load() { return prefs.getString("save", ""); }
        @JavascriptInterface public String loadBackup() { return prefs.getString("backup", ""); }
        @JavascriptInterface public synchronized boolean save(String data) {
            if (!validSave(data)) return false;
            SharedPreferences.Editor editor = prefs.edit();
            String previous = prefs.getString("save", "");
            if (validSave(previous)) editor.putString("backup", previous);
            return editor.putString("save", data).commit();
        }
        @JavascriptInterface public void exportSave(String data) {
            if (!validSave(data)) return;
            runOnUiThread(() -> {
                pendingExport = data;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "emberline-save.json");
                try { startActivityForResult(intent, EXPORT); } catch (Exception e) { message("No document picker is available."); }
            });
        }
        @JavascriptInterface public void importSave() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try { startActivityForResult(intent, IMPORT); } catch (Exception e) { message("No document picker is available."); }
            });
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null || data.getData() == null) { pendingExport = null; return; }
        Uri uri = data.getData();
        try {
            if (request == EXPORT && pendingExport != null) {
                try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                    if (out == null) throw new Exception();
                    out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                }
                message("Emberline backup saved.");
            } else if (request == IMPORT) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in == null) throw new Exception();
                    byte[] buffer = new byte[8192]; int count;
                    while ((count = in.read(buffer)) != -1) {
                        if (out.size() + count > MAX_SAVE) throw new Exception();
                        out.write(buffer, 0, count);
                    }
                }
                String json = out.toString("UTF-8");
                if (!validSave(json)) throw new Exception();
                web.evaluateJavascript("window.importEmberlineSave(" + JSONObject.quote(json) + ")", null);
            }
        } catch (Exception e) { message("Could not read or write this backup. Your current save is unchanged."); }
        finally { pendingExport = null; }
    }
    @Override public void onBackPressed() { web.evaluateJavascript("window.emberlineBack && window.emberlineBack()", null); }
    @Override protected void onPause() {
        resumed = false;
        web.evaluateJavascript("window.emberlinePause && window.emberlinePause()", ignored -> { if (!resumed) web.onPause(); });
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume(); resumed = true;
        if (web != null) {
            web.onResume();
            web.evaluateJavascript("window.emberlineResume && window.emberlineResume()", null);
        }
    }
    @Override protected void onDestroy() { if (web != null) {web.removeJavascriptInterface("EmberlineNative");web.destroy();} super.onDestroy(); }
}
