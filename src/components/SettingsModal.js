import { ALL_TURKEY_CITIES } from '../assets/turkeyLocations.js';
import { soundManager } from '../services/soundManager.js';
import { wakeLockService } from '../services/wakeLock.js';

export class SettingsModal {
  constructor(containerId, prayerService, notificationManager, onCityChanged, onColorsChanged) {
    this.container = document.getElementById(containerId);
    this.prayerService = prayerService;
    this.notificationManager = notificationManager;
    this.onCityChanged = onCityChanged;
    this.onColorsChanged = onColorsChanged;
    this.activeTestingKey = null;
    this.render();
  }

  render() {
    const currentLoc = this.prayerService.getCity();
    const volume = Math.round(soundManager.volume * 100);
    const isWakeLockActive = wakeLockService.isEnabled;

    const hourColor = localStorage.getItem('saatvakit_color_hour') || '#00e5ff';
    const minColor = localStorage.getItem('saatvakit_color_minute') || '#00ff9d';
    const secColor = localStorage.getItem('saatvakit_color_second') || '#ff4081';

    // Current city & district
    const selectedCityObj = ALL_TURKEY_CITIES.find(c => c.id === (currentLoc.cityId || currentLoc.id)) || ALL_TURKEY_CITIES.find(c => c.name === currentLoc.cityName || c.name === currentLoc.name) || ALL_TURKEY_CITIES.find(c => c.id === 'istanbul');

    const cityOptions = ALL_TURKEY_CITIES.map(c => `
      <option value="${c.id}" ${c.id === selectedCityObj.id ? 'selected' : ''}>${c.name}</option>
    `).join('');

    const districtOptions = (selectedCityObj.districts || [{ id: `${selectedCityObj.id}-merkez`, name: 'Merkez' }]).map(d => `
      <option value="${d.id}" ${d.id === (currentLoc.districtId || currentLoc.id) ? 'selected' : ''}>${d.name}</option>
    `).join('');

    const prayerList = [
      { key: 'imsak', name: 'İmsak Vakti', icon: '🌙' },
      { key: 'gunes', name: 'Güneş Doğuşu', icon: '🌅' },
      { key: 'ogle', name: 'Öğle Ezanı', icon: '☀️' },
      { key: 'ikindi', name: 'İkindi Ezanı', icon: '🌤️' },
      { key: 'aksam', name: 'Akşam Ezanı', icon: '🌇' },
      { key: 'yatsi', name: 'Yatsı Ezanı', icon: '✨' }
    ];

    const prayerAudioRowsHtml = prayerList.map(p => {
      const isAlarmOn = this.notificationManager.alarms[p.key] ?? true;
      const currentSoundType = soundManager.prayerSounds[p.key] || 'ezan_makam';
      const customFileName = soundManager.customFileNames[p.key] || '';

      return `
        <div class="prayer-sound-card" data-prayer="${p.key}">
          <div class="prayer-sound-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.2rem;">${p.icon}</span>
              <span style="font-weight: 700; font-size: 0.95rem;">${p.name}</span>
            </div>
            
            <label class="toggle-switch">
              <input type="checkbox" class="chk-prayer-alarm" data-prayer="${p.key}" ${isAlarmOn ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div class="prayer-sound-body">
            <!-- Sound Mode Selector -->
            <select class="form-select select-prayer-sound-type" data-prayer="${p.key}">
              <option value="ezan_makam" ${currentSoundType === 'ezan_makam' ? 'selected' : ''}>Dahili Ezan Makamı</option>
              <option value="ney_melodi" ${currentSoundType === 'ney_melodi' ? 'selected' : ''}>Huzurlu Ney Melodisi</option>
              <option value="beep" ${currentSoundType === 'beep' ? 'selected' : ''}>Modern Melodik Çan</option>
              <option value="custom" ${currentSoundType === 'custom' ? 'selected' : ''}>📁 Dosyadan Özel Ses</option>
            </select>

            <!-- File Upload & Test Buttons -->
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="file" class="input-prayer-file" data-prayer="${p.key}" accept="audio/*" style="display: none;">
              
              <button type="button" class="btn-prayer-upload btn-sub" data-prayer="${p.key}" title="Telefondan ses dosyası seç">
                📁 Dosya Seç
              </button>

              <button type="button" class="btn-prayer-test btn-sub" data-prayer="${p.key}" title="Bu vaktin sesini test et">
                ▶ Dinle
              </button>
            </div>
          </div>

          <!-- Uploaded file name indicator -->
          <div class="prayer-file-status" id="file-status-${p.key}">
            ${customFileName ? `<span style="color: #00ff9d; font-size: 0.8rem; font-weight: 600;">✓ Ses: ${customFileName}</span>` : `<span style="color: #64748b; font-size: 0.75rem;">Özel ses seçilmedi</span>`}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="modal-overlay" id="settings-modal-overlay">
        <div class="modal-content" style="max-width: 620px;">
          <div class="modal-header">
            <div class="modal-title">
              <span>⚙️</span> Ayarlar & Seçimler
            </div>
            <button class="btn-icon" id="btn-close-settings-modal" aria-label="Kapat">✕</button>
          </div>
          <div class="modal-body">
            
            <!-- İL VE İLÇE SEÇİMİ -->
            <div class="form-group" style="background: rgba(0, 229, 255, 0.04); border: 1px solid rgba(0, 229, 255, 0.2); padding: 1rem; border-radius: 16px;">
              <label class="form-label" style="color: #00e5ff; font-weight: 800; margin-bottom: 0.4rem;">📍 İl ve İlçe Seçimi (Diyanet Vakitleri)</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
                <div>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">İl Seçin:</span>
                  <select id="select-city" class="form-select" style="width: 100%; margin-top: 0.2rem;">
                    ${cityOptions}
                  </select>
                </div>
                <div>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">İlçe Seçin:</span>
                  <select id="select-district" class="form-select" style="width: 100%; margin-top: 0.2rem;">
                    ${districtOptions}
                  </select>
                </div>
              </div>
            </div>

            <!-- VAKİTLERE ÖZEL DOSYADAN SES EKLEME -->
            <div class="form-group" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 1.1rem; border-radius: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div>
                  <div style="font-weight: 800; font-size: 1rem; color: #ffd700;">🎵 Vakitlere Dosyadan Ses Ekleme</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Her namaz vaktine telefonunuzdan farklı bir MP3/WAV ses dosyası atayabilirsiniz</div>
                </div>
              </div>

              <!-- General Volume Slider -->
              <div style="margin: 0.8rem 0; padding: 0.7rem; background: rgba(0,0,0,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                <span style="font-size: 0.82rem; color: var(--text-secondary);">Ana Ses Seviyesi: <b>%<span id="vol-text">${volume}</span></b></span>
                <input type="range" id="input-volume" min="0" max="100" value="${volume}" style="accent-color: var(--accent-cyan); width: 140px;">
              </div>

              <!-- Per-Prayer Audio Rows -->
              <div class="prayers-audio-list">
                ${prayerAudioRowsHtml}
              </div>
            </div>

            <!-- SAAT RENKLERİ -->
            <div class="form-group">
              <label class="form-label">🎨 Kadran Dijital Saat Renkleri</label>
              <div class="color-picker-grid">
                <div class="color-item">
                  <span style="font-size: 0.8rem; font-weight: 700; color: ${hourColor};" id="label-hour-color">SAAT</span>
                  <input type="color" id="input-hour-color" class="color-preview-input" value="${hourColor}">
                </div>
                <div class="color-item">
                  <span style="font-size: 0.8rem; font-weight: 700; color: ${minColor};" id="label-min-color">DAKİKA</span>
                  <input type="color" id="input-min-color" class="color-preview-input" value="${minColor}">
                </div>
                <div class="color-item">
                  <span style="font-size: 0.8rem; font-weight: 700; color: ${secColor};" id="label-sec-color">SANİYE</span>
                  <input type="color" id="input-sec-color" class="color-preview-input" value="${secColor}">
                </div>
              </div>
            </div>

            <!-- AÇILIŞTA SAATİ SESLİ SÖYLE -->
            <div class="form-group">
              <div class="toggle-row">
                <div>
                  <div style="font-weight: 700; color: #fff6cc;">🔊 Uygulama Açıldığında Saati Söyle</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Uygulamayı açtığınızda güncel saati Türkçe seslendirir</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-speak-on-open" ${soundManager.speakOnOpen ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- HAKKINDA BÖLÜMÜ -->
            <div class="form-group about-app-card" style="background: rgba(223, 175, 82, 0.06); border: 1px solid rgba(223, 175, 82, 0.2); padding: 1.1rem; border-radius: 18px; text-align: center;">
              <div style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 900; color: #fff6cc; letter-spacing: 2px;">✦ NİHAT YAZGAN ✦</div>
              <div style="font-size: 0.84rem; color: #a1b0cb; margin-top: 0.3rem;">Lüks Analog & Dijital Saat ve Diyanet Namaz Vakitleri</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.5rem;">Sürüm 2.0 • Tüm Hakları Saklıdır</div>
            </div>

            <!-- EKRANI AÇIK TUT (WAKE LOCK) -->
            <div class="form-group">
              <div class="toggle-row">
                <div>
                  <div style="font-weight: 700;">🌙 Ekranı Sürekli Açık Tut</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Masa veya başucu saati olarak kullanırken ekran kapanmaz</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-wakelock" ${isWakeLockActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- KAYDET BUTONU -->
            <div style="margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid rgba(223, 175, 82, 0.25);">
              <button id="btn-save-all-settings" class="btn-primary" style="width: 100%; padding: 0.85rem; font-size: 0.95rem; font-weight: 900; background: linear-gradient(135deg, #dfaf52, #ffd700); color: #04060b; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(223, 175, 82, 0.4);">
                <span>💾</span> Tüm Ayarları Kaydet ve Kapat
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.overlay = this.container.querySelector('#settings-modal-overlay');
    this.container.querySelector('#btn-close-settings-modal').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // City & District Change
    const citySelect = this.container.querySelector('#select-city');
    const districtSelect = this.container.querySelector('#select-district');

    if (citySelect && districtSelect) {
      citySelect.addEventListener('change', (e) => {
        const cityId = e.target.value;
        const cityObj = ALL_TURKEY_CITIES.find(c => c.id === cityId);
        if (cityObj) {
          // Update district dropdown
          const dList = cityObj.districts || [{ id: `${cityObj.id}-merkez`, name: 'Merkez', lat: cityObj.lat, lng: cityObj.lng }];
          districtSelect.innerHTML = dList.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
          
          // Set first district as default
          const firstDistrict = dList[0];
          const newLocation = {
            id: firstDistrict.id,
            name: `${cityObj.name} - ${firstDistrict.name}`,
            cityName: cityObj.name,
            districtName: firstDistrict.name,
            cityId: cityObj.id,
            districtId: firstDistrict.id,
            lat: firstDistrict.lat,
            lng: firstDistrict.lng
          };
          this.prayerService.setCity(newLocation);
          if (this.onCityChanged) this.onCityChanged(newLocation);
        }
      });

      districtSelect.addEventListener('change', (e) => {
        const cityId = citySelect.value;
        const districtId = e.target.value;
        const cityObj = ALL_TURKEY_CITIES.find(c => c.id === cityId);
        if (cityObj) {
          const dList = cityObj.districts || [];
          const distObj = dList.find(d => d.id === districtId) || dList[0] || { id: cityId, name: 'Merkez', lat: cityObj.lat, lng: cityObj.lng };
          const newLocation = {
            id: distObj.id,
            name: `${cityObj.name} - ${distObj.name}`,
            cityName: cityObj.name,
            districtName: distObj.name,
            cityId: cityObj.id,
            districtId: distObj.id,
            lat: distObj.lat,
            lng: distObj.lng
          };
          this.prayerService.setCity(newLocation);
          if (this.onCityChanged) this.onCityChanged(newLocation);
        }
      });
    }

    // Volume Slider
    const volInput = this.container.querySelector('#input-volume');
    const volText = this.container.querySelector('#vol-text');
    volInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      volText.textContent = val;
      soundManager.setVolume(val / 100);
    });

    // Per-Prayer Audio Event Listeners
    this.container.querySelectorAll('.chk-prayer-alarm').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const prayerKey = e.target.dataset.prayer;
        const timings = this.prayerService.todayTimings;
        const city = this.prayerService.getCity();
        this.notificationManager.setAlarm(prayerKey, e.target.checked, timings, city?.name);
      });
    });

    this.container.querySelectorAll('.select-prayer-sound-type').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const prayerKey = e.target.dataset.prayer;
        soundManager.setPrayerSoundType(prayerKey, e.target.value);
      });
    });

    this.container.querySelectorAll('.btn-prayer-upload').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prayerKey = e.currentTarget.dataset.prayer;
        const fileInput = this.container.querySelector(`.input-prayer-file[data-prayer="${prayerKey}"]`);
        if (fileInput) fileInput.click();
      });
    });

    this.container.querySelectorAll('.input-prayer-file').forEach(fileInput => {
      fileInput.addEventListener('change', async (e) => {
        const prayerKey = e.target.dataset.prayer;
        const file = e.target.files[0];
        if (file) {
          const statusEl = this.container.querySelector(`#file-status-${prayerKey}`);
          if (statusEl) statusEl.innerHTML = `<span style="color: #ffd700; font-size: 0.8rem;">⏳ Yükleniyor...</span>`;
          
          try {
            await soundManager.saveCustomAudioForPrayer(prayerKey, file);
            soundManager.setPrayerSoundType(prayerKey, 'custom');
            if (statusEl) statusEl.innerHTML = `<span style="color: #00ff9d; font-size: 0.8rem; font-weight: 600;">✓ Ses: ${file.name}</span>`;
            
            const selectEl = this.container.querySelector(`.select-prayer-sound-type[data-prayer="${prayerKey}"]`);
            if (selectEl) selectEl.value = 'custom';
          } catch (err) {
            console.error(err);
            if (statusEl) statusEl.innerHTML = `<span style="color: #ff6b6b; font-size: 0.8rem;">❌ Hata oluştu</span>`;
          }
        }
      });
    });

    this.container.querySelectorAll('.btn-prayer-test').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prayerKey = e.currentTarget.dataset.prayer;
        if (this.activeTestingKey === prayerKey) {
          soundManager.stop();
          this.activeTestingKey = null;
          e.currentTarget.textContent = '▶ Dinle';
        } else {
          // Reset previous buttons
          this.container.querySelectorAll('.btn-prayer-test').forEach(b => b.textContent = '▶ Dinle');
          
          soundManager.playForPrayer(prayerKey);
          this.activeTestingKey = prayerKey;
          e.currentTarget.textContent = '⏹ Durdur';
          
          setTimeout(() => {
            if (this.activeTestingKey === prayerKey) {
              this.activeTestingKey = null;
              e.currentTarget.textContent = '▶ Dinle';
            }
          }, 6000);
        }
      });
    });

    // Color Pickers
    const hInput = this.container.querySelector('#input-hour-color');
    const mInput = this.container.querySelector('#input-min-color');
    const sInput = this.container.querySelector('#input-sec-color');

    const updateColors = () => {
      const hc = hInput.value;
      const mc = mInput.value;
      const sc = sInput.value;

      document.documentElement.style.setProperty('--color-hour', hc);
      document.documentElement.style.setProperty('--color-minute', mc);
      document.documentElement.style.setProperty('--color-second', sc);

      localStorage.setItem('saatvakit_color_hour', hc);
      localStorage.setItem('saatvakit_color_minute', mc);
      localStorage.setItem('saatvakit_color_second', sc);

      const hLabel = this.container.querySelector('#label-hour-color');
      const mLabel = this.container.querySelector('#label-min-color');
      const sLabel = this.container.querySelector('#label-sec-color');
      if (hLabel) hLabel.style.color = hc;
      if (mLabel) mLabel.style.color = mc;
      if (sLabel) sLabel.style.color = sc;

      if (this.onColorsChanged) this.onColorsChanged({ hour: hc, minute: mc, second: sc });
    };

    hInput.addEventListener('input', updateColors);
    mInput.addEventListener('input', updateColors);
    sInput.addEventListener('input', updateColors);

    // Wake Lock Toggle
    const wakeChk = this.container.querySelector('#toggle-wakelock');
    if (wakeChk) {
      wakeChk.addEventListener('change', async (e) => {
        if (e.target.checked) {
          await wakeLockService.request();
        } else {
          wakeLockService.release();
        }
      });
    }

    // Speak On Open Toggle
    const speakOpenChk = this.container.querySelector('#toggle-speak-on-open');
    if (speakOpenChk) {
      speakOpenChk.addEventListener('change', (e) => {
        soundManager.setSpeakOnOpen(e.target.checked);
      });
    }

    // Save All Settings Button
    const saveAllBtn = this.container.querySelector('#btn-save-all-settings');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', () => {
        saveAllBtn.innerHTML = `<span>✅</span> Ayarlar Kaydedildi!`;
        saveAllBtn.style.background = 'linear-gradient(135deg, #00ff9d, #00b36b)';
        setTimeout(() => {
          this.close();
          saveAllBtn.innerHTML = `<span>💾</span> Tüm Ayarları Kaydet ve Kapat`;
          saveAllBtn.style.background = 'linear-gradient(135deg, #dfaf52, #ffd700)';
        }, 500);
      });
    }
  }

  open() {
    this.overlay.classList.add('open');
  }

  close() {
    this.overlay.classList.remove('open');
    soundManager.stop();
    this.activeTestingKey = null;
  }
}
