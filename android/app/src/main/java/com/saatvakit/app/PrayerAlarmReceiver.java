package com.saatvakit.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class PrayerAlarmReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "saat_vakit_prayer_channel_v2";
    public static final String CHANNEL_NAME = "Namaz Vakti Bildirimleri";

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Acquire WakeLock to wake CPU if device is in Doze mode or locked
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "SaatVakit:PrayerAlarmWakeLock"
            );
            wakeLock.acquire(15000); // 15 seconds timeout
        }

        try {
            String prayerName = intent.getStringExtra("prayerName");
            String prayerTime = intent.getStringExtra("prayerTime");
            String prayerKey = intent.getStringExtra("prayerKey");
            String cityName = intent.getStringExtra("cityName");

            if (prayerName == null || prayerName.isEmpty()) prayerName = "Namaz Vakti";
            if (prayerTime == null) prayerTime = "";
            if (cityName == null || cityName.isEmpty()) cityName = "İstanbul";

            showNotification(context, prayerName, prayerTime, cityName, prayerKey);

            // 2. Reschedule next alarm for this specific prayer for tomorrow
            PrayerAlarmScheduler.reschedulePrayerForTomorrow(context, prayerKey, prayerTime, prayerName, cityName);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }

    private void showNotification(Context context, String prayerName, String prayerTime, String cityName, String prayerKey) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        // Create High Importance Notification Channel for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Ezan ve Namaz Vakti Giriş Uyarıları (Kilit Ekranı Destekli)");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 600, 200, 600, 200, 600});
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
            channel.setSound(defaultSoundUri, audioAttributes);

            notificationManager.createNotificationChannel(channel);
        }

        // Tap action -> Open MainActivity
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launchIntent.putExtra("fromNotification", true);
        launchIntent.putExtra("prayerKey", prayerKey);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                (int) System.currentTimeMillis(),
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String title = "🕌 " + prayerName + " Girdi! (" + prayerTime + ")";
        String body = cityName + " için " + prayerName.toLowerCase() + " vakti girdi. Haydi namaza, haydi kurtuluşa!";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setVibrate(new long[]{0, 600, 200, 600, 200, 600})
                .setContentIntent(pendingIntent)
                .setFullScreenIntent(pendingIntent, true); // Heads-up display over lock screen

        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, builder.build());
    }
}
