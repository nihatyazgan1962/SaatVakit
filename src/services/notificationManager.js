import { soundManager } from './soundManager.js';

class NotificationManager {
  constructor() {
    this.alarms = JSON.parse(localStorage.getItem('saatvakit_alarms') || JSON.stringify({
      imsak: true,
      gunes: false,
      ogle: true,
      ikindi: true,
      aksam: true,
      yatsi: true
    }));
    this.lastTriggered = localStorage.getItem('saatvakit_last_triggered') || '';
    this.alarmCallback = null;
  }

  setAlarmCallback(cb) {
    this.alarmCallback = cb;
  }

  setAlarm(prayerKey, enabled, timings, cityName) {
    this.alarms[prayerKey] = enabled;
    localStorage.setItem('saatvakit_alarms', JSON.stringify(this.alarms));
    if (timings) {
      this.syncNativeAlarms(timings, cityName);
    }
  }

  syncNativeAlarms(timings, cityName) {
    if (!timings) return;
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.schedulePrayerAlarms === 'function') {
      try {
        const timingsObj = {
          imsak: timings.Fajr || timings.imsak || '',
          gunes: timings.Sunrise || timings.gunes || '',
          ogle: timings.Dhuhr || timings.ogle || '',
          ikindi: timings.Asr || timings.ikindi || '',
          aksam: timings.Maghrib || timings.aksam || '',
          yatsi: timings.Isha || timings.yatsi || ''
        };
        window.AndroidNativeTTS.schedulePrayerAlarms(
          JSON.stringify(timingsObj),
          JSON.stringify(this.alarms),
          cityName || 'İstanbul'
        );
      } catch (err) {
        console.warn('Native alarm sync error:', err);
      }
    }
  }

  async requestPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  }

  sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/app-icon.png',
          tag: 'namaz-vakti-alarm',
          renotify: true
        });
      } catch (e) {
        console.warn('Notification display error:', e);
      }
    }
  }

  // Check every second if an alarm needs to trigger
  checkAlarms(timings, currentStatus) {
    if (!timings) return;

    const now = new Date();
    const curHour = now.getHours().toString().padStart(2, '0');
    const curMin = now.getMinutes().toString().padStart(2, '0');
    const timeKey = `${curHour}:${curMin}`;

    const prayerNames = {
      imsak: 'İmsak Vakti',
      gunes: 'Güneş Doğuşu',
      ogle: 'Öğle Ezanı',
      ikindi: 'İkindi Ezanı',
      aksam: 'Akşam Ezanı',
      yatsi: 'Yatsı Ezanı'
    };

    for (const [key, prayerTime] of Object.entries(timings)) {
      if (key === 'raw') continue;
      if (!this.alarms[key]) continue;

      const triggerKey = `${key}_${prayerTime}_${now.toDateString()}`;
      if (timeKey === prayerTime && this.lastTriggered !== triggerKey) {
        this.lastTriggered = triggerKey;
        localStorage.setItem('saatvakit_last_triggered', triggerKey);

        const name = prayerNames[key] || key.toUpperCase();
        this.triggerAlarm(name, prayerTime, key);
        break;
      }
    }
  }

  triggerAlarm(prayerName, time, key) {
    // 1. Android & Browser Push Notification
    this.sendBrowserNotification(
      `🕌 ${prayerName} Girdi! (${time})`,
      `${prayerName} vakti girdi. Haydi namaza, haydi kurtuluşa!`
    );

    // 2. Play Selected / Custom Sound for this specific prayer
    soundManager.playForPrayer(key);

    // 3. Turkish Voice Announcement after short delay
    setTimeout(() => {
      soundManager.speakCurrentTime(`${prayerName} vakti girdi`);
    }, 2500);

    // 4. Trigger In-App Fullscreen Modal Alert
    if (this.alarmCallback) {
      this.alarmCallback({
        prayerName,
        time,
        key
      });
    }
  }
}

export const notificationManager = new NotificationManager();
