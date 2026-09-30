package com.saatvakit.app;

import android.os.Bundle;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private boolean isTtsReady = false;
    private String pendingText = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request Notification Permission on Android 13+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // Show over lock screen if triggered
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }

        // Native Android TextToSpeech Engine with Turkish Locale and fallback
        tts = new TextToSpeech(getApplicationContext(), status -> {
            if (status == TextToSpeech.SUCCESS) {
                Locale trLocale = new Locale("tr", "TR");
                int result = tts.setLanguage(trLocale);
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    // Try general Turkish
                    tts.setLanguage(new Locale("tr"));
                }
                isTtsReady = true;
                tts.setSpeechRate(0.95f);
                tts.setPitch(1.0f);

                // If app requested speech before TTS finished initializing
                if (pendingText != null) {
                    speakNative(pendingText);
                    pendingText = null;
                }
            }
        });

        // Inject Native Bridge to WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void speakText(String text) {
                    runOnUiThread(() -> speakNative(text));
                }

                @JavascriptInterface
                public void stopSpeaking() {
                    runOnUiThread(() -> {
                        if (tts != null) {
                            tts.stop();
                        }
                    });
                }



                @JavascriptInterface
                public void updateWidgetData(String jsonString) {
                    try {
                        if (jsonString == null || jsonString.isEmpty()) return;
                        org.json.JSONObject obj = new org.json.JSONObject(jsonString);
                        android.content.SharedPreferences prefs = getSharedPreferences(SaatVakitWidgetProvider.PREFS_NAME, android.content.Context.MODE_PRIVATE);
                        android.content.SharedPreferences.Editor editor = prefs.edit();

                        if (obj.has("city")) editor.putString("city", obj.getString("city"));
                        if (obj.has("date")) editor.putString("date", obj.getString("date"));
                        if (obj.has("active_vakit")) editor.putString("active_vakit", obj.getString("active_vakit"));
                        if (obj.has("active_vakit_time")) editor.putString("active_vakit_time", obj.getString("active_vakit_time"));
                        if (obj.has("next_vakit")) editor.putString("next_vakit", obj.getString("next_vakit"));
                        if (obj.has("countdown")) editor.putString("countdown", obj.getString("countdown"));
                        if (obj.has("active_key")) editor.putString("active_key", obj.getString("active_key"));

                        if (obj.has("fajr")) editor.putString("fajr", obj.getString("fajr"));
                        if (obj.has("sunrise")) editor.putString("sunrise", obj.getString("sunrise"));
                        if (obj.has("dhuhr")) editor.putString("dhuhr", obj.getString("dhuhr"));
                        if (obj.has("asr")) editor.putString("asr", obj.getString("asr"));
                        if (obj.has("maghrib")) editor.putString("maghrib", obj.getString("maghrib"));
                        if (obj.has("isha")) editor.putString("isha", obj.getString("isha"));

                        editor.apply();

                        // Notify widget provider to refresh RemoteViews immediately
                        SaatVakitWidgetProvider.updateAllWidgets(MainActivity.this);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                @JavascriptInterface
                public void schedulePrayerAlarms(String timingsJson, String alarmsJson, String cityName) {
                    try {
                        PrayerAlarmScheduler.scheduleAllFromJson(MainActivity.this, timingsJson, alarmsJson, cityName);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                @JavascriptInterface
                public void scheduleRadioAlarm(String configJson) {
                    try {
                        RadioAlarmReceiver.saveAndSchedule(MainActivity.this, configJson);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                @JavascriptInterface
                public void cancelRadioAlarm() {
                    try {
                        RadioAlarmReceiver.cancelAlarm(MainActivity.this);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                @JavascriptInterface
                public void toggleFullscreen(boolean enable) {
                    runOnUiThread(() -> {
                        try {
                            android.view.Window window = getWindow();
                            if (window != null) {
                                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                                    android.view.WindowInsetsController controller = window.getInsetsController();
                                    if (controller != null) {
                                        if (enable) {
                                            controller.hide(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                                            controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                                        } else {
                                            controller.show(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                                        }
                                    }
                                } else {
                                    int flags = android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                            | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                            | android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                            | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                            | android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                                            | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
                                    window.getDecorView().setSystemUiVisibility(enable ? flags : android.view.View.SYSTEM_UI_FLAG_VISIBLE);
                                }
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
                }
            }, "AndroidNativeTTS");
        }
    }



    private void speakNative(String text) {
        if (text == null || text.trim().isEmpty()) return;
        if (tts != null && isTtsReady) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "SaatVakitTTS");
        } else {
            pendingText = text;
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
