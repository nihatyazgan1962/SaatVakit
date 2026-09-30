package com.saatvakit.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class RadioAlarmPlaybackService extends Service {

    public static final String ACTION_START_RADIO = "com.saatvakit.app.ACTION_START_RADIO_ALARM";
    public static final String ACTION_STOP_RADIO = "com.saatvakit.app.ACTION_STOP_RADIO_ALARM";

    public static final String CHANNEL_ID = "saat_vakit_radio_alarm_channel";
    public static final String CHANNEL_NAME = "Radyo Çalar Saat Alarmları";
    private static final int NOTIFICATION_ID = 8888;

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private Handler handler;
    private Runnable stopRunnable;

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_RADIO.equals(action)) {
            stopRadioAndService();
            return START_NOT_STICKY;
        }

        if (ACTION_START_RADIO.equals(action)) {
            String stationName = intent.getStringExtra("stationName");
            String streamUrl = intent.getStringExtra("streamUrl");
            int autoStopMinutes = intent.getIntExtra("autoStopMinutes", 30);

            if (stationName == null || stationName.isEmpty()) stationName = "Radyo Yayını";

            // Acquire CPU WakeLock so device stays active while playing
            acquireWakeLock();

            // Start Foreground immediately with high priority notification
            startForegroundNotification(stationName);

            // Play radio stream via native MediaPlayer
            playStream(streamUrl);

            // Setup auto-stop timer if configured
            if (autoStopMinutes > 0) {
                if (stopRunnable != null) handler.removeCallbacks(stopRunnable);
                stopRunnable = this::stopRadioAndService;
                handler.postDelayed(stopRunnable, (long) autoStopMinutes * 60 * 1000);
            }
        }

        return START_NOT_STICKY;
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = pm.newWakeLock(
                        PowerManager.PARTIAL_WAKE_LOCK,
                        "SaatVakit:RadioAlarmPlaybackWakeLock"
                );
                wakeLock.acquire(60 * 60 * 1000); // 60 min max timeout
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startForegroundNotification(String stationName) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Kilit ekranında canlı çalan radyo alarmı");
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 300, 150, 300});
            nm.createNotificationChannel(channel);
        }

        // Tap notification -> open app
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pOpenApp = PendingIntent.getActivity(
                this, 101, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Stop button
        Intent stopIntent = new Intent(this, RadioAlarmPlaybackService.class);
        stopIntent.setAction(ACTION_STOP_RADIO);
        PendingIntent pStop = PendingIntent.getService(
                this, 102, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("⏰ Radyo Alarmı Çalıyor: " + stationName)
                .setContentText("Canlı radyo yayını başlatıldı. Kapatmak için dokunun.")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setContentIntent(pOpenApp)
                .setFullScreenIntent(pOpenApp, true) // Heads-up over locked screen
                .addAction(android.R.drawable.ic_media_pause, "⏹ Radyoyu Kapat", pStop)
                .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    private void playStream(String streamUrl) {
        if (streamUrl == null || streamUrl.trim().isEmpty()) {
            return;
        }

        releaseMediaPlayer();

        try {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_ALARM) // Alarm audio stream bypasses silent mode
                    .build());

            mediaPlayer.setDataSource(this, Uri.parse(streamUrl.trim()));
            mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);

            mediaPlayer.setOnPreparedListener(mp -> {
                try {
                    mp.start();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                // If stream fails, release
                releaseMediaPlayer();
                return true;
            });

            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
            mediaPlayer = null;
        }
    }

    private void stopRadioAndService() {
        if (stopRunnable != null) {
            handler.removeCallbacks(stopRunnable);
            stopRunnable = null;
        }
        releaseMediaPlayer();
        releaseWakeLock();
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopRadioAndService();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
