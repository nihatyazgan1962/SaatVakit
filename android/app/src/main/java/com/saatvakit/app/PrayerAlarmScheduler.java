package com.saatvakit.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class PrayerAlarmScheduler {

    public static final String PREFS_NAME = "SaatVakitAlarmPrefs";

    private static final Map<String, Integer> PRAYER_REQ_CODES = new HashMap<String, Integer>() {{
        put("imsak", 1001);
        put("fajr", 1001);
        put("gunes", 1002);
        put("sunrise", 1002);
        put("ogle", 1003);
        put("dhuhr", 1003);
        put("ikindi", 1004);
        put("asr", 1004);
        put("aksam", 1005);
        put("maghrib", 1005);
        put("yatsi", 1006);
        put("isha", 1006);
    }};

    private static final Map<String, String> PRAYER_TR_NAMES = new HashMap<String, String>() {{
        put("imsak", "İmsak Vakti");
        put("fajr", "İmsak Vakti");
        put("gunes", "Güneş Doğuşu");
        put("sunrise", "Güneş Doğuşu");
        put("ogle", "Öğle Ezanı");
        put("dhuhr", "Öğle Ezanı");
        put("ikindi", "İkindi Ezanı");
        put("asr", "İkindi Ezanı");
        put("aksam", "Akşam Ezanı");
        put("maghrib", "Akşam Ezanı");
        put("yatsi", "Yatsı Ezanı");
        put("isha", "Yatsı Ezanı");
    }};

    public static void scheduleAllFromJson(Context context, String timingsJson, String alarmsJson, String cityName) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            if (timingsJson != null && !timingsJson.isEmpty()) {
                editor.putString("last_timings_json", timingsJson);
            }
            if (alarmsJson != null && !alarmsJson.isEmpty()) {
                editor.putString("last_alarms_json", alarmsJson);
            }
            if (cityName != null && !cityName.isEmpty()) {
                editor.putString("last_city_name", cityName);
            }
            editor.apply();

            rescheduleAll(context);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void rescheduleAll(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String timingsJson = prefs.getString("last_timings_json", null);
            String alarmsJson = prefs.getString("last_alarms_json", null);
            String cityName = prefs.getString("last_city_name", "İstanbul");

            if (timingsJson == null || timingsJson.isEmpty()) return;

            JSONObject timingsObj = new JSONObject(timingsJson);
            JSONObject alarmsObj = (alarmsJson != null && !alarmsJson.isEmpty()) ? new JSONObject(alarmsJson) : new JSONObject();

            Iterator<String> keys = timingsObj.keys();
            while (keys.hasNext()) {
                String rawKey = keys.next();
                if ("raw".equalsIgnoreCase(rawKey)) continue;

                String normKey = rawKey.toLowerCase();
                String timeStr = timingsObj.optString(rawKey, "").split(" ")[0].trim();
                if (timeStr.isEmpty() || !timeStr.contains(":")) continue;

                // Check if alarm is enabled for this prayer (default true except sunrise)
                boolean isEnabled = alarmsObj.optBoolean(normKey, !"gunes".equals(normKey) && !"sunrise".equals(normKey));
                if (!isEnabled) {
                    cancelAlarm(context, normKey);
                    continue;
                }

                String prayerName = PRAYER_TR_NAMES.containsKey(normKey) ? PRAYER_TR_NAMES.get(normKey) : normKey.toUpperCase();
                scheduleExactPrayerAlarm(context, normKey, timeStr, prayerName, cityName, false);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void reschedulePrayerForTomorrow(Context context, String normKey, String timeStr, String prayerName, String cityName) {
        scheduleExactPrayerAlarm(context, normKey, timeStr, prayerName, cityName, true);
    }

    private static void scheduleExactPrayerAlarm(Context context, String normKey, String timeStr, String prayerName, String cityName, boolean forceTomorrow) {
        try {
            String[] parts = timeStr.split(":");
            int hour = Integer.parseInt(parts[0].trim());
            int minute = Integer.parseInt(parts[1].trim());

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, minute);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);

            long now = System.currentTimeMillis();
            if (forceTomorrow || cal.getTimeInMillis() <= now) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            int reqCode = PRAYER_REQ_CODES.containsKey(normKey) ? PRAYER_REQ_CODES.get(normKey) : normKey.hashCode();

            Intent intent = new Intent(context, PrayerAlarmReceiver.class);
            intent.setAction("com.saatvakit.app.PRAYER_ALARM_" + normKey.toUpperCase());
            intent.putExtra("prayerKey", normKey);
            intent.putExtra("prayerName", prayerName);
            intent.putExtra("prayerTime", timeStr);
            intent.putExtra("cityName", cityName);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    reqCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerAtMillis = cal.getTimeInMillis();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void cancelAlarm(Context context, String normKey) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            int reqCode = PRAYER_REQ_CODES.containsKey(normKey) ? PRAYER_REQ_CODES.get(normKey) : normKey.hashCode();

            Intent intent = new Intent(context, PrayerAlarmReceiver.class);
            intent.setAction("com.saatvakit.app.PRAYER_ALARM_" + normKey.toUpperCase());

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    reqCode,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );

            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
