import './style.css';
import { prayerService } from './services/prayerApi.js';
import { soundManager } from './services/soundManager.js';
import { notificationManager } from './services/notificationManager.js';
import { weatherService } from './services/weatherService.js';
import { AnalogClock } from './components/AnalogClock.js';
import { MonthlyCalendarModal } from './components/MonthlyCalendarModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { AlarmModal } from './components/AlarmModal.js';
import { RadioModal } from './components/RadioModal.js';
import { radioService } from './services/radioService.js';
import { recordService } from './services/recordService.js';

class App {
  constructor() {
    this.currentTimings = null;
    this.currentStatus = null;
    this.hasSpokenOnOpen = false;
    this.init();
  }

  async init() {
    // 1. Restore Custom Clock Colors
    const hourColor = localStorage.getItem('saatvakit_color_hour') || '#00e5ff';
    const minColor = localStorage.getItem('saatvakit_color_minute') || '#00ff9d';
    const secColor = localStorage.getItem('saatvakit_color_second') || '#ff4081';
    document.documentElement.style.setProperty('--color-hour', hourColor);
    document.documentElement.style.setProperty('--color-minute', minColor);
    document.documentElement.style.setProperty('--color-second', secColor);

    // 2. Initialize Master Clock & Modals
    this.masterClock = new AnalogClock('master-clock-mount');
    this.monthlyModal = new MonthlyCalendarModal('monthly-modal-mount', prayerService);
    this.alarmModal = new AlarmModal('alarm-modal-mount');
    this.radioModal = new RadioModal('radio-modal-mount');

    this.settingsModal = new SettingsModal(
      'settings-modal-mount',
      prayerService,
      notificationManager,
      (newCity) => this.onCityChanged(newCity),
      (newColors) => this.onColorsChanged(newColors)
    );

    // Connect Alarm Trigger callback
    notificationManager.setAlarmCallback((alarmData) => {
      this.alarmModal.show(alarmData);
    });

    this.bindHeaderActions();
    this.initMiniRadio();
    this.refreshWeather();

    // 4. Load Initial Prayer Data
    await this.refreshPrayerData();

    // 5. Start Prayer Countdown & Alarm Loop
    this.startMainLoop();

    // 6. Speak time automatically on launch + request notification permission
    const attemptSpeak = () => {
      if (!this.hasSpokenOnOpen && soundManager.speakOnOpen) {
        this.hasSpokenOnOpen = true;
        soundManager.speakCurrentTime('');
      }
      notificationManager.requestPermission();
    };

        // 6. Speak time EXACTLY ONCE on opening (Auto or on first tap)
    const speakOnceOnOpen = () => {
      if (this.hasSpokenOnOpen) return;
      this.hasSpokenOnOpen = true;

      if (soundManager.speakOnOpen) {
        soundManager.speakCurrentTime();
      }
      notificationManager.requestPermission();
    };

    // Immediate attempt
    setTimeout(() => {
      speakOnceOnOpen();
    }, 400);

    // If browser/Android blocks 0-interaction autoplay, trigger seamlessly on very first touch/click
    document.addEventListener('touchstart', () => {
      speakOnceOnOpen();
    }, { once: true, passive: true });

    document.addEventListener('click', () => {
      speakOnceOnOpen();
    }, { once: true });
  }

  bindHeaderActions() {
    const cityBadge = document.getElementById('btn-header-location');
    const cityText = document.getElementById('txt-header-city');
    const monthlyBtn = document.getElementById('btn-open-monthly');
    const settingsBtn = document.getElementById('btn-open-settings');
    const fullscreenBtn = document.getElementById('btn-toggle-fullscreen');
    const speakBtn = document.getElementById('btn-speak-time');

    if (cityText) {
      cityText.textContent = prayerService.getCity().name;
    }

    if (cityBadge) {
      cityBadge.addEventListener('click', () => this.settingsModal.open());
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.settingsModal.open());
    }

    // Dial Bottom Actions (Saatin İçindeki Butonlar)
    const dialSpeakBtn = document.getElementById('btn-dial-speak');
    const dialMonthlyBtn = document.getElementById('btn-dial-monthly');
    const dialFullscreenBtn = document.getElementById('btn-dial-fullscreen');

    if (dialSpeakBtn) {
      dialSpeakBtn.addEventListener('click', () => {
        soundManager.speakCurrentTime();
      });
    }

    if (dialMonthlyBtn) {
      dialMonthlyBtn.addEventListener('click', () => {
        this.monthlyModal.open();
      });
    }

    if (dialFullscreenBtn) {
      let isAppFullscreen = false;
      dialFullscreenBtn.addEventListener('click', () => {
        isAppFullscreen = !isAppFullscreen;

        // 1. Android Native Immersive Fullscreen
        if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.toggleFullscreen === 'function') {
          try {
            window.AndroidNativeTTS.toggleFullscreen(isAppFullscreen);
          } catch (e) {
            console.warn('Native fullscreen error:', e);
          }
        }

        // 2. Standard Web Fullscreen API
        if (isAppFullscreen) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          dialFullscreenBtn.setAttribute('opacity', '0.7');
        } else {
          if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          dialFullscreenBtn.setAttribute('opacity', '1');
        }
      });
    }

    // Fallback if elements exist
    if (monthlyBtn) monthlyBtn.addEventListener('click', () => this.monthlyModal.open());
    if (speakBtn) speakBtn.addEventListener('click', () => soundManager.speakCurrentTime());
  }

  async refreshPrayerData() {
    try {
      const timings = await prayerService.getTodayTimings();
      this.currentTimings = timings;
      const city = prayerService.getCity();
      notificationManager.syncNativeAlarms(timings, city?.name || 'İstanbul');
      this.updateLoop();
    } catch (e) {
      console.error('Prayer data refresh error:', e);
    }
  }

  updateLoop() {
    if (!this.currentTimings) return;

    this.currentStatus = prayerService.calculateStatus(this.currentTimings);
    this.masterClock.updateData(this.currentTimings, this.currentStatus);
    notificationManager.checkAlarms(this.currentTimings, this.currentStatus);
    radioService.checkAlarm();

    // Sync data to Android Home Screen Widget
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.updateWidgetData === 'function') {
      try {
        const city = prayerService.getCity();
        const now = new Date();
        const trMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const trDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const dateFormatted = `${now.getDate()} ${trMonths[now.getMonth()]} ${trDays[now.getDay()]}`;

        const widgetPayload = {
          city: city?.name || 'İstanbul',
          date: dateFormatted,
          active_vakit: this.currentStatus?.current?.name || '',
          active_vakit_time: this.currentStatus?.current?.time || '',
          next_vakit: this.currentStatus?.next?.name || '',
          countdown: this.currentStatus?.remaining || '',
          active_key: this.currentStatus?.current?.key || '',
          fajr: this.currentTimings?.Fajr || '--:--',
          sunrise: this.currentTimings?.Sunrise || '--:--',
          dhuhr: this.currentTimings?.Dhuhr || '--:--',
          asr: this.currentTimings?.Asr || '--:--',
          maghrib: this.currentTimings?.Maghrib || '--:--',
          isha: this.currentTimings?.Isha || '--:--'
        };

        window.AndroidNativeTTS.updateWidgetData(JSON.stringify(widgetPayload));
      } catch (err) {
        console.warn('Widget update sync error:', err);
      }
    }
  }

  startMainLoop() {
    setInterval(() => {
      this.updateLoop();
    }, 1000);
  }

  initMiniRadio() {
    const radioCard = document.getElementById('mini-radio-widget');
    const playBtn = document.getElementById('btn-radio-play-pause');
    const playIcon = document.getElementById('mini-play-icon');
    const prevBtn = document.getElementById('btn-radio-prev');
    const nextBtn = document.getElementById('btn-radio-next');
    const listBtn = document.getElementById('btn-radio-list');
    const recBtn = document.getElementById('btn-radio-record');
    const recLabel = document.getElementById('mini-rec-label');
    const openChannelsLeft = document.getElementById('btn-open-radio-channels');

    const nameEl = document.getElementById('mini-radio-name');
    const catEl = document.getElementById('mini-radio-category');
    const statusEl = document.getElementById('mini-radio-status');
    const iconEl = document.getElementById('mini-radio-icon');
    const pulseEl = document.getElementById('mini-radio-pulse');

    if (!radioCard) return;

    // Open Radio Modal
    if (openChannelsLeft) {
      openChannelsLeft.addEventListener('click', () => this.radioModal.open());
    }
    if (listBtn) {
      listBtn.addEventListener('click', () => this.radioModal.open());
    }

    // Play/Pause
    if (playBtn) {
      playBtn.addEventListener('click', () => radioService.togglePlay());
    }

    // Next / Prev
    if (nextBtn) {
      nextBtn.addEventListener('click', () => radioService.nextStation());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => radioService.prevStation());
    }

    // Broadcast Recording (REC) Button
    if (recBtn) {
      recBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentStation = radioService.getCurrentStation();
        if (recordService.isRecording) {
          recordService.stopRecording();
        } else {
          if (!radioService.isPlaying) {
            radioService.play();
          }
          recordService.startRecording(radioService.audio, currentStation ? currentStation.name : 'Radyo');
        }
      });
    }

    // Subscribe to Record State
    recordService.onStateChange((recState) => {
      if (recBtn && recLabel) {
        if (recState.isRecording) {
          recBtn.classList.add('recording');
          recLabel.textContent = recState.formattedDuration;
          recBtn.title = `Kayıt Yapılıyor (${recState.formattedDuration}) - Durdurmak için dokunun`;
        } else {
          recBtn.classList.remove('recording');
          recLabel.textContent = 'REC';
          recBtn.title = 'Canlı Yayını Kaydet (REC)';
        }
      }
    });

    // Subscribe to Radio State
    radioService.onStateChange((state) => {
      const { isPlaying, isLoading, currentStation, error } = state;

      if (currentStation) {
        if (nameEl) nameEl.textContent = currentStation.name;
        if (catEl) catEl.textContent = currentStation.badge || currentStation.frequency || 'Radyo';
        if (iconEl) iconEl.textContent = currentStation.icon || '📻';
      }

      if (isLoading) {
        if (playIcon) playIcon.textContent = '⏳';
        if (statusEl) statusEl.textContent = 'Bağlanıyor & Yükleniyor...';
        radioCard.classList.add('loading');
        radioCard.classList.remove('playing');
        if (pulseEl) pulseEl.classList.add('loading');
      } else if (isPlaying) {
        if (playIcon) playIcon.textContent = '⏸';
        if (statusEl) statusEl.textContent = '🔴 Canlı Yayında';
        radioCard.classList.add('playing');
        radioCard.classList.remove('loading');
        if (pulseEl) pulseEl.classList.add('playing');
      } else {
        if (playIcon) playIcon.textContent = '▶';
        if (statusEl) statusEl.textContent = error ? `⚠️ ${error}` : 'Dinlemek için dokunun';
        radioCard.classList.remove('playing', 'loading');
        if (pulseEl) pulseEl.classList.remove('playing', 'loading');
      }
    });
  }

  async refreshWeather() {
    const city = prayerService.getCity();
    const cityEl = document.getElementById('weather-city-name');
    const tempEl = document.getElementById('weather-temp');
    const iconEl = document.getElementById('weather-icon');
    const condEl = document.getElementById('weather-condition');
    const windEl = document.getElementById('weather-wind');
    const weatherBanner = document.getElementById('weather-banner');

    if (cityEl) cityEl.textContent = city.name;

    try {
      const data = await weatherService.getCurrentWeather(city.lat, city.lng);
      if (data) {
        if (tempEl) tempEl.textContent = `${data.temp}°C`;
        if (iconEl) iconEl.textContent = data.icon;
        if (condEl) condEl.textContent = data.text;
        if (windEl) windEl.innerHTML = `<span>💨 ${data.windSpeed} km/s</span>`;
      }
    } catch (e) {
      console.warn('Weather error:', e);
    }

    if (weatherBanner && !weatherBanner.dataset.bound) {
      weatherBanner.dataset.bound = 'true';
      weatherBanner.addEventListener('click', async () => {
        if (condEl) condEl.textContent = 'Güncelleniyor...';
        weatherService.weatherCache = null; // Force fresh fetch
        await this.refreshWeather();
        // Sesli hava durumu anonsu
        const currentData = weatherService.weatherCache;
        if (currentData) {
          soundManager.speakCurrentTime(`${city.name} hava durumu: ${currentData.text}, sıcaklık ${currentData.temp} derece`);
        }
      });
    }
  }

  async onCityChanged(newCity) {
    const cityText = document.getElementById('txt-header-city');
    if (cityText) cityText.textContent = newCity.name;
    await this.refreshPrayerData();
    await this.refreshWeather();
  }

  onColorsChanged(colors) {
    // CSS Vars updated
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
