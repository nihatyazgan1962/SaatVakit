package com.saatvakit.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class SaatVakitWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_AUTO_UPDATE = "com.saatvakit.app.UPDATE_WIDGET";
    public static final String PREFS_NAME = "SaatVakitWidgetPrefs";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_AUTO_UPDATE.equals(intent.getAction()) ||
            AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            updateAllWidgets(context);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, SaatVakitWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int appWidgetId : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, appWidgetId);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String cleanTime(String raw, String fallback) {
        if (raw == null || raw.trim().isEmpty() || raw.contains("--")) return fallback;
        // Strip out any suffix like (EET)
        String cleaned = raw.split(" ")[0].trim();
        return cleaned.isEmpty() ? fallback : cleaned;
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            String cityName = prefs.getString("city", "İstanbul");
            String dateStr = prefs.getString("date", "");
            if (dateStr == null || dateStr.isEmpty()) {
                SimpleDateFormat sdf = new SimpleDateFormat("d MMMM EEEE", new Locale("tr", "TR"));
                dateStr = sdf.format(new Date());
            }

            String activeVakitName = prefs.getString("active_vakit", "İkindi");
            String nextVakitName = prefs.getString("next_vakit", "Akşam");
            String countdown = prefs.getString("countdown", "01:25:30");
            String activeKey = prefs.getString("active_key", "asr").toLowerCase(Locale.ROOT);

            String fajr = cleanTime(prefs.getString("fajr", "05:22"), "05:22");
            String sunrise = cleanTime(prefs.getString("sunrise", "06:45"), "06:45");
            String dhuhr = cleanTime(prefs.getString("dhuhr", "13:05"), "13:05");
            String asr = cleanTime(prefs.getString("asr", "16:32"), "16:32");
            String maghrib = cleanTime(prefs.getString("maghrib", "19:15"), "19:15");
            String isha = cleanTime(prefs.getString("isha", "20:32"), "20:32");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.saat_vakit_widget);

            // 1. Header Information
            views.setTextViewText(R.id.widget_city_name, "📍 " + cityName);
            views.setTextViewText(R.id.widget_date_text, dateStr);

            if (!activeVakitName.isEmpty()) {
                views.setTextViewText(R.id.widget_active_vakit, "🕌 " + activeVakitName + " Vakti");
            } else {
                views.setTextViewText(R.id.widget_active_vakit, "🕌 Saat & Vakit");
            }

            if (!countdown.isEmpty() && !nextVakitName.isEmpty()) {
                views.setTextViewText(R.id.widget_countdown_text, "⏳ " + nextVakitName + ": " + countdown);
            } else {
                views.setTextViewText(R.id.widget_countdown_text, "⏳ Vakit Takibi");
            }

            // 2. Set Prayer Times
            views.setTextViewText(R.id.widget_time_fajr, fajr);
            views.setTextViewText(R.id.widget_time_sunrise, sunrise);
            views.setTextViewText(R.id.widget_time_dhuhr, dhuhr);
            views.setTextViewText(R.id.widget_time_asr, asr);
            views.setTextViewText(R.id.widget_time_maghrib, maghrib);
            views.setTextViewText(R.id.widget_time_isha, isha);

            // 3. Highlight Active Column with Gold Background
            boolean isFajr = "fajr".equals(activeKey) || "imsak".equals(activeKey);
            boolean isSunrise = "sunrise".equals(activeKey) || "gunes".equals(activeKey);
            boolean isDhuhr = "dhuhr".equals(activeKey) || "ogle".equals(activeKey);
            boolean isAsr = "asr".equals(activeKey) || "ikindi".equals(activeKey);
            boolean isMaghrib = "maghrib".equals(activeKey) || "aksam".equals(activeKey);
            boolean isIsha = "isha".equals(activeKey) || "yatsi".equals(activeKey);

            views.setInt(R.id.widget_vakit_col_fajr, "setBackgroundResource", isFajr ? R.drawable.widget_active_badge : R.drawable.widget_item_bg);
            views.setInt(R.id.widget_vakit_col_sunrise, "setBackgroundResource", isSunrise ? R.drawable.widget_active_badge : R.drawable.widget_item_bg);
            views.setInt(R.id.widget_vakit_col_dhuhr, "setBackgroundResource", isDhuhr ? R.drawable.widget_active_badge : R.drawable.widget_item_bg);
            views.setInt(R.id.widget_vakit_col_asr, "setBackgroundResource", isAsr ? R.drawable.widget_active_badge : R.drawable.widget_item_bg);
            views.setInt(R.id.widget_vakit_col_maghrib, "setBackgroundResource", isMaghrib ? R.drawable.widget_active_badge : R.drawable.widget_item_bg);
            views.setInt(R.id.widget_vakit_col_isha, "setBackgroundResource", isIsha ? R.drawable.widget_active_badge : R.drawable.widget_item_bg);

            // Set text colors for active/inactive for crisp contrast
            views.setTextColor(R.id.widget_time_fajr, isFajr ? Color.parseColor("#120F1D") : Color.WHITE);
            views.setTextColor(R.id.widget_time_sunrise, isSunrise ? Color.parseColor("#120F1D") : Color.WHITE);
            views.setTextColor(R.id.widget_time_dhuhr, isDhuhr ? Color.parseColor("#120F1D") : Color.WHITE);
            views.setTextColor(R.id.widget_time_asr, isAsr ? Color.parseColor("#120F1D") : Color.WHITE);
            views.setTextColor(R.id.widget_time_maghrib, isMaghrib ? Color.parseColor("#120F1D") : Color.WHITE);
            views.setTextColor(R.id.widget_time_isha, isIsha ? Color.parseColor("#120F1D") : Color.WHITE);

            // 4. Tap anywhere on widget to open the app
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

            // Apply updates to the widget manager
            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
