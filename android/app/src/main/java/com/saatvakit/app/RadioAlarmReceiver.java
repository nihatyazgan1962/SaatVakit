package com.saatvakit.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;
import org.json.JSONObject;

import java.util.Calendar;

public class RadioAlarmReceiver extends BroadcastReceiver {

    public static final String ACTION_TRIGGER_RADIO_ALARM = "com.saatvakit.app.ACTION_TRIGGER_RADIO_ALARM";
    public static final String PREFS_RADIO_ALARM = "SaatVakitRadioAlarmPrefs";
    private static final int RADIO_ALARM_REQ_CODE = 9999;

    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "SaatVakit:RadioAlarmReceiverWakeLock"
            );
            wakeLock.acquire(15000); // 15s
        }

        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_RADIO_ALARM, Context.MODE_PRIVATE);
            String jsonStr = prefs.getString("alarm_config", null);
            if (jsonStr == null || jsonStr.isEmpty()) return;

            JSONObject config = new JSONObject(jsonStr);
            boolean enabled = config.optBoolean("enabled", false);
            if (!enabled) return;

            String stationName = config.optString("stationName", "Radyo Yayını");
            String streamUrl = config.optString("streamUrl", "");
            int autoStopMinutes = config.optInt("autoStopMinutes", 30);
            String timeStr = config.optString("time", "06:30");

            // 1. Start Native Foreground Audio Service (Plays even if locked!)
            Intent serviceIntent = new Intent(context, RadioAlarmPlaybackService.class);
            serviceIntent.setAction(RadioAlarmPlaybackService.ACTION_START_RADIO);
            serviceIntent.putExtra("stationName", stationName);
            serviceIntent.putExtra("streamUrl", streamUrl);
            serviceIntent.putExtra("autoStopMinutes", autoStopMinutes);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // 2. Schedule for tomorrow at same time
            scheduleNextDay(context, timeStr);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }

    public static void saveAndSchedule(Context context, String configJson) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_RADIO_ALARM, Context.MODE_PRIVATE);
            prefs.edit().putString("alarm_config", configJson).apply();

            if (configJson == null || configJson.isEmpty()) {
                cancelAlarm(context);
                return;
            }

            JSONObject config = new JSONObject(configJson);
            boolean enabled = config.optBoolean("enabled", false);
            String time = config.optString("time", "06:30");

            if (!enabled) {
                cancelAlarm(context);
                return;
            }

            scheduleAlarmInternal(context, time, false);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void rescheduleIfEnabled(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_RADIO_ALARM, Context.MODE_PRIVATE);
            String configJson = prefs.getString("alarm_config", null);
            if (configJson != null) {
                JSONObject config = new JSONObject(configJson);
                if (config.optBoolean("enabled", false)) {
                    String time = config.optString("time", "06:30");
                    scheduleAlarmInternal(context, time, false);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void scheduleNextDay(Context context, String timeStr) {
        scheduleAlarmInternal(context, timeStr, true);
    }

    private static void scheduleAlarmInternal(Context context, String timeStr, boolean forceTomorrow) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

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

            Intent intent = new Intent(context, RadioAlarmReceiver.class);
            intent.setAction(ACTION_TRIGGER_RADIO_ALARM);

            PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    RADIO_ALARM_REQ_CODE,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerAt = cal.getTimeInMillis();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void cancelAlarm(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, RadioAlarmReceiver.class);
            intent.setAction(ACTION_TRIGGER_RADIO_ALARM);

            PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    RADIO_ALARM_REQ_CODE,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );

            if (pi != null) {
                alarmManager.cancel(pi);
                pi.cancel();
            }

            // Also stop any playing radio alarm service
            Intent stopIntent = new Intent(context, RadioAlarmPlaybackService.class);
            stopIntent.setAction(RadioAlarmPlaybackService.ACTION_STOP_RADIO);
            context.stopService(stopIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
