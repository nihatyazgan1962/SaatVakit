// RadiiGo-Style Categorized Radio Modal with Live Recording & Playback Support
import { radioService, RADIO_CATEGORIES } from '../services/radioService.js';
import { recordService } from '../services/recordService.js';

export class RadioModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.showAddCustom = false;
    this.showRecordings = false;
    this.showAlarmPanel = false;
    this.isOpenState = false;
    this.editingCustomId = null;

    // Listen to recordService changes to update UI
    recordService.onStateChange(() => {
      if (this.isOpen()) {
        this.updateRecordUi();
        this.renderRecordingsList();
      }
    });

    this.render();
  }

  render() {
    const state = radioService.getState();
    const recState = recordService.getState();
    const alarmState = radioService.getRadioAlarm();
    const allStations = radioService.stations;
    const selectedAlarmStation = allStations.find(s => s.id === alarmState.stationId) || allStations[0];
    const selectedStationName = selectedAlarmStation ? selectedAlarmStation.name : 'Radyo';

    const categoriesHtml = RADIO_CATEGORIES.map(cat => {
      const isFav = cat.id === 'fav';
      const badge = isFav && state.favoritesCount > 0 ? `(${state.favoritesCount})` : '';
      return `
        <button class="radio-cat-chip ${cat.id === this.selectedCategory ? 'active' : ''} ${isFav ? 'fav-chip' : ''}" data-cat="${cat.id}">
          <span>${cat.icon}</span> ${cat.name} ${badge}
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="modal-overlay ${this.isOpenState ? 'open' : ''}" id="radio-modal-overlay">
        <div class="modal-content radio-modal-content" style="max-width: 680px;">
          
          <!-- Header -->
          <div class="modal-header" style="border-bottom: 1px solid rgba(223, 175, 82, 0.2); padding-bottom: 0.8rem;">
            <div class="modal-title" style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.5rem;">📻</span>
              <div>
                <div style="font-weight: 800; font-size: 1.15rem; color: #ffd700; display: flex; align-items: center; gap: 0.5rem;">
                  RADYOM • Radyo Listesi
                </div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">Risale-i Nur, Dini, İlahi, Kur'an-ı Kerim, Haber & Türkü</div>
              </div>
            </div>
            <button class="btn-icon" id="btn-close-radio-modal" aria-label="Kapat">✕</button>
          </div>

          <div class="modal-body" style="padding: 0.85rem 1.1rem;">
            
            <!-- 1. Search & Filter Bar (Yukarı Çekildi) -->
            <div class="radio-search-box" style="margin-top: 0; margin-bottom: 0.65rem;">
              <span class="search-icon">🔍</span>
              <input type="text" id="input-radio-search" placeholder="Radyo kanalı, ilahi veya sohbet ara..." value="${this.searchQuery}">
              ${this.searchQuery ? `<button id="btn-clear-radio-search" class="btn-clear-search">✕</button>` : ''}
            </div>

            <!-- 2. Tools: Uyku Modu + Radyo Ekle & Yayını Kaydet + Kayıt Dinle -->
            <div class="radiigo-tools-container">
              <!-- Row 1: Uyku Modu & Radyo Ekle Yan Yana -->
              <div class="radiigo-tools-row">
                <div class="sleep-timer-box">
                  <span style="font-size: 0.78rem; color: #a1b0cb; display: flex; align-items: center; gap: 0.3rem;">
                    ⏱️ <b>Uyku:</b>
                  </span>
                  <select id="select-sleep-timer" class="form-select select-sleep-dropdown">
                    <option value="0" ${state.sleepTimerMinutes === 0 ? 'selected' : ''}>Kapalı</option>
                    <option value="15" ${state.sleepTimerMinutes === 15 ? 'selected' : ''}>15 Dk</option>
                    <option value="30" ${state.sleepTimerMinutes === 30 ? 'selected' : ''}>30 Dk</option>
                    <option value="45" ${state.sleepTimerMinutes === 45 ? 'selected' : ''}>45 Dk</option>
                    <option value="60" ${state.sleepTimerMinutes === 60 ? 'selected' : ''}>60 Dk</option>
                  </select>
                  ${state.sleepRemaining > 0 ? `<span class="sleep-countdown-tag">⏳ ${state.sleepRemaining} dk</span>` : ''}
                </div>

                <button id="btn-toggle-custom-add" class="btn-add-custom-radio">
                  <span>➕</span> Radyo Ekle
                </button>
              </div>

              <!-- Row 2: Yayını Kaydet & Kayıt Dinle Yan Yana -->
              <div class="radiigo-tools-row">
                <button id="btn-modal-record" class="btn-modal-record ${recState.isRecording ? 'recording' : ''}">
                  <span class="modal-rec-dot ${recState.isRecording ? 'pulse-rec' : ''}"></span>
                  <span id="modal-rec-text">${recState.isRecording ? `🔴 ${recState.formattedDuration} Kaydediliyor` : '🔴 Yayını Kaydet'}</span>
                </button>

                <button id="btn-toggle-recordings" class="btn-open-recordings ${this.showRecordings ? 'active' : ''}">
                  <span>🎵</span> Kayıt Dinle ${recState.recordings.length > 0 ? `<span class="rec-badge-count">${recState.recordings.length}</span>` : ''}
                </button>
              </div>
            </div>

            <!-- Custom Radio Add / Edit Drawer (Collapsible) -->
            <div id="box-custom-radio-add" class="custom-radio-form-box" style="display: ${this.showAddCustom ? 'block' : 'none'};">
              <div id="custom-form-title" style="font-weight: 800; color: #00e5ff; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                <span>📻 Özel Radyo Ekle & Düzenle</span>
                ${this.editingCustomId ? `<span style="font-size: 0.75rem; color: #ffd700;">(Düzenleme Modunda)</span>` : ''}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1.5fr auto auto; gap: 0.45rem; align-items: center;">
                <input type="text" id="input-custom-radio-name" placeholder="Radyo Adı (Örn: Dost FM)" class="form-input-clean">
                <input type="url" id="input-custom-radio-url" placeholder="Yayın Linki (https://.../stream.mp3)" class="form-input-clean">
                <button id="btn-save-custom-radio" class="btn-save-custom">
                  ${this.editingCustomId ? '💾 Güncelle' : '➕ Ekle'}
                </button>
                <button id="btn-cancel-custom-edit" class="btn-cancel-custom" style="display: ${this.editingCustomId ? 'block' : 'none'};">
                  ✕ Vazgeç
                </button>
              </div>

              <!-- List of Added Custom Radios for Managing (Edit / Delete) -->
              <div id="custom-stations-manage-list" class="custom-stations-manage-list">
                <!-- Dynamically rendered -->
              </div>
            </div>

            <!-- Recordings Player Drawer (Collapsible) -->
            <div id="box-recordings-player" class="recordings-panel-box" style="display: ${this.showRecordings ? 'block' : 'none'};">
              <div class="rec-panel-header">
                <div style="font-weight: 800; color: #ff5252; font-size: 0.92rem; display: flex; align-items: center; gap: 0.4rem;">
                  <span>🎵</span> Kaydedilen Radyo Yayınları
                </div>
                <label class="btn-upload-rec-file" title="Cihazınızdaki daha önce kaydedilmiş ses dosyasını dinleyin">
                  <span>📂</span> Cihazdan Ses Seç
                  <input type="file" id="input-upload-recording" accept="audio/*" style="display: none;">
                </label>
              </div>

              <div id="recordings-items-list" class="recordings-items-list">
                <!-- Dynamically rendered -->
              </div>
            </div>

            <!-- 3. Category Header with Radio Alarm Across from It (Kategorilerin Karşısına Alarm) -->
            <div class="radio-category-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
              <div style="font-size: 0.78rem; font-weight: 800; color: #dfaf52; display: flex; align-items: center; gap: 0.35rem;">
                <span>📂</span> Kategoriler
              </div>
              <button id="btn-toggle-radio-alarm" class="btn-radio-alarm-trigger ${alarmState.enabled ? 'alarm-active' : ''}" title="Radyo ile Uyanma / Alarm Ayarla">
                <span>⏰</span> Radyo Alarmı ${alarmState.enabled ? `<span class="alarm-tag-pill">🔔 ${alarmState.time}</span>` : ''}
              </button>
            </div>

            <!-- Radio Alarm Drawer (Collapsible) -->
            <div id="box-radio-alarm" class="radio-alarm-panel-box" style="display: ${this.showAlarmPanel ? 'block' : 'none'};">
              <div class="alarm-panel-header">
                <div style="font-weight: 800; color: #ffd700; font-size: 0.92rem; display: flex; align-items: center; gap: 0.4rem;">
                  <span>⏰</span> Radyo ile Uyanma Alarmı
                </div>
                <label class="alarm-switch-container">
                  <input type="checkbox" id="check-radio-alarm-enable" ${alarmState.enabled ? 'checked' : ''}>
                  <span class="alarm-switch-slider"></span>
                  <span id="txt-alarm-switch-status" style="font-weight: 700; font-size: 0.8rem; color: ${alarmState.enabled ? '#00ff9d' : '#a1b0cb'}; margin-left: 0.4rem;">
                    ${alarmState.enabled ? 'AÇIK' : 'KAPALI'}
                  </span>
                </label>
              </div>

              <div class="alarm-panel-body">
                <div class="alarm-form-row">
                  <div class="alarm-form-group" style="min-width: 110px;">
                    <label style="font-size: 0.75rem; color: #a1b0cb; font-weight: 700; margin-bottom: 0.2rem; display: block;">⏰ Alarm Saati</label>
                    <input type="time" id="input-radio-alarm-time" value="${alarmState.time}" class="form-input-clean" style="font-size: 1.05rem; font-weight: bold; text-align: center; color: #ffd700;">
                  </div>

                  <div class="alarm-form-group" style="flex: 2;">
                    <label style="font-size: 0.75rem; color: #a1b0cb; font-weight: 700; margin-bottom: 0.2rem; display: block;">📻 Çalınacak Radyo</label>
                    <select id="select-radio-alarm-station" class="form-select-clean">
                      ${allStations.map(s => `<option value="${s.id}" ${s.id === alarmState.stationId ? 'selected' : ''}>${s.badge ? '[' + s.badge + '] ' : ''}${s.name}</option>`).join('')}
                    </select>
                  </div>

                  <div class="alarm-form-group" style="flex: 1.2;">
                    <label style="font-size: 0.75rem; color: #a1b0cb; font-weight: 700; margin-bottom: 0.2rem; display: block;">⏱️ Otomatik Kapanma</label>
                    <select id="select-radio-alarm-autostop" class="form-select-clean">
                      <option value="15" ${alarmState.autoStopMinutes === 15 ? 'selected' : ''}>15 Dk Sonra Kapat</option>
                      <option value="30" ${alarmState.autoStopMinutes === 30 ? 'selected' : ''}>30 Dk Sonra Kapat</option>
                      <option value="45" ${alarmState.autoStopMinutes === 45 ? 'selected' : ''}>45 Dk Sonra Kapat</option>
                      <option value="60" ${alarmState.autoStopMinutes === 60 ? 'selected' : ''}>60 Dk Sonra Kapat</option>
                      <option value="0" ${alarmState.autoStopMinutes === 0 ? 'selected' : ''}>Sürekli Çalsın</option>
                    </select>
                  </div>
                </div>

                <!-- Quick Presets -->
                <div class="alarm-presets-row">
                  <span style="font-size: 0.72rem; color: #dfaf52; font-weight: 700;">⚡ Hızlı Saat:</span>
                  <button type="button" class="btn-alarm-preset" data-time="05:15">🌅 05:15 (Sahur)</button>
                  <button type="button" class="btn-alarm-preset" data-time="06:30">🌞 06:30 (Sabah)</button>
                  <button type="button" class="btn-alarm-preset" data-time="07:30">⏰ 07:30 (Gündüz)</button>
                  <button type="button" class="btn-alarm-preset" data-time="17:00">🕌 17:00 (İkindi)</button>
                </div>

                <div id="alarm-status-banner-el" class="alarm-status-banner ${alarmState.enabled ? 'active' : 'inactive'}">
                  ${alarmState.enabled 
                    ? `✅ Alarm <b>Aktif (Kilit Ekranı Destekli)</b>: Her gün saat <b>${alarmState.time}</b> vaktinde telefon kilitli veya uyku modunda olsa dahi <b>${selectedStationName}</b> otomatik olarak çalacaktır.`
                    : `ℹ️ Radyo alarmı kapalı. Açmak için yukarıdaki anahtarı aktif edip "💾 Alarmı Kaydet" butonuna basınız. (Ekran kilitliyken çalma desteklidir).`}
                </div>

                <div class="alarm-actions-row">
                  <button id="btn-save-radio-alarm" class="btn-save-alarm">💾 Alarmı Kaydet</button>
                  <button id="btn-test-radio-alarm" class="btn-test-alarm">🔔 Test Et (Dinle)</button>
                  <button id="btn-close-alarm-box" class="btn-close-alarm-box">✕ Kapat</button>
                </div>
              </div>
            </div>

            <!-- Categories Tabs -->
            <div class="radio-category-tabs">
              ${categoriesHtml}
            </div>

            <!-- Station List Container -->
            <div class="radio-stations-grid" id="radio-stations-list">
              <!-- Dynamically populated -->
            </div>

          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderStations();
    this.renderCustomStationsList();
    this.renderRecordingsList();
  }

  updateRecordUi() {
    const recBtn = this.container.querySelector('#btn-modal-record');
    const recText = this.container.querySelector('#modal-rec-text');
    const recDot = this.container.querySelector('.modal-rec-dot');
    const recState = recordService.getState();

    if (recBtn && recText) {
      if (recState.isRecording) {
        recBtn.classList.add('recording');
        recText.textContent = `🔴 ${recState.formattedDuration} Kaydediliyor (Durdur)`;
        if (recDot) recDot.classList.add('pulse-rec');
      } else {
        recBtn.classList.remove('recording');
        recText.textContent = '🔴 Yayını Kaydet';
        if (recDot) recDot.classList.remove('pulse-rec');
      }
    }
  }

  renderRecordingsList() {
    const listEl = this.container.querySelector('#recordings-items-list');
    if (!listEl) return;

    const recState = recordService.getState();
    const recordings = recState.recordings;

    if (!recordings || recordings.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
          <div>🎙️ Henüz kayıtlı radyo yayını bulunmuyor.</div>
          <div style="font-size: 0.78rem; margin-top: 0.3rem; color: #a1b0cb;">
            Kanalların başındaki <b>🔴 REC</b> butonuna basarak canlı yayınları kaydedebilir veya yukarıdaki <b>"📂 Cihazdan Ses Seç"</b> butonu ile telefonunuzdaki kayıtları dinleyebilirsiniz.
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = recordings.map(rec => {
      const isThisActive = recState.activePlaybackId === rec.id;
      const isPlaying = isThisActive && recState.isPlaybackPlaying;

      return `
        <div class="recording-item-card ${isThisActive ? 'active' : ''}">
          <button class="btn-rec-play ${isPlaying ? 'playing' : ''}" data-id="${rec.id}">
            ${isPlaying ? '⏸' : '▶'}
          </button>
          
          <div class="rec-item-info">
            <div class="rec-item-title">${rec.name}</div>
            <div class="rec-item-meta">
              <span>📅 ${rec.date} ${rec.time}</span>
              ${rec.sizeStr ? `<span>💾 ${rec.sizeStr}</span>` : ''}
              ${isThisActive ? `<span style="color: #00ff9d; font-weight: 700;">⏱️ ${recState.formattedPlaybackTime}</span>` : ''}
            </div>
          </div>

          <button class="btn-rec-delete" data-id="${rec.id}" title="Kaydı Listeden Kaldır">
            🗑️
          </button>
        </div>
      `;
    }).join('');

    // Bind play / delete events
    listEl.querySelectorAll('.btn-rec-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        // Pause live radio if starting playback
        if (radioService.isPlaying) {
          radioService.pause();
        }
        recordService.playRecording(id);
      });
    });

    listEl.querySelectorAll('.btn-rec-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        recordService.deleteRecording(id);
      });
    });
  }

  renderStations() {
    const listEl = this.container.querySelector('#radio-stations-list');
    if (!listEl) return;

    let stations = radioService.getStationsByCategory(this.selectedCategory);
    
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      stations = stations.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.frequency.toLowerCase().includes(q) ||
        (s.badge && s.badge.toLowerCase().includes(q))
      );
    }

    const state = radioService.getState();
    const currentId = state.currentStation ? state.currentStation.id : null;
    const isPlaying = state.isPlaying;
    const isLoading = state.isLoading;
    const recState = recordService.getState();
    const isRecording = recState.isRecording;

    if (stations.length === 0) {
      const isFavCat = this.selectedCategory === 'fav';
      listEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${isFavCat ? '⭐' : '📻'}</div>
          <div style="font-weight: 700; color: #fff6cc;">
            ${isFavCat ? 'Henüz favori radyo eklemediniz' : 'Aramanıza uygun radyo kanalı bulunamadı'}
          </div>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">
            ${isFavCat ? 'Kanalların yanındaki yıldız (★) simgesine dokunarak favorilerinize ekleyebilirsiniz.' : 'Farklı bir arama terimi veya kategori seçebilirsiniz.'}
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = stations.map(st => {
      const isSelected = st.id === currentId;
      const isThisPlaying = isSelected && isPlaying;
      const isThisLoading = isSelected && isLoading;
      const isThisRecording = isSelected && isRecording;
      const isFav = radioService.isFavorite(st.id);

      return `
        <div class="radio-station-card ${isSelected ? 'active' : ''} ${isThisPlaying ? 'playing' : ''}" data-id="${st.id}">
          
          <div class="radio-card-left">
            <!-- REC Butonu (Başta - Radyo simgesi yerine) -->
            <button class="btn-card-rec ${isThisRecording ? 'recording' : ''}" data-id="${st.id}" title="${isThisRecording ? 'Kaydı Durdur' : 'Bu Yayını Kaydet (REC)'}">
              <span class="rec-dot-card ${isThisRecording ? 'pulse-rec' : ''}"></span>
              <span class="rec-card-text">${isThisRecording ? recState.formattedDuration : 'REC'}</span>
            </button>

            <div class="radio-card-meta">
              <div class="radio-card-title">
                ${st.name}
                ${st.badge ? `<span class="radio-badge">${st.badge}</span>` : ''}
              </div>
              <div class="radio-card-desc">${st.frequency}</div>
            </div>
          </div>

          <div class="radio-card-action" style="display: flex; align-items: center; gap: 0.35rem;">
            ${st.isCustom ? `
              <button class="btn-card-edit-custom btn-card-edit-trigger" data-id="${st.id}" title="Özel Radyoyu Düzenle">
                ✏️
              </button>
              <button class="btn-card-delete-custom btn-card-del-trigger" data-id="${st.id}" title="Özel Radyoyu Sil">
                🗑️
              </button>
            ` : ''}

            <!-- Favorite Toggle Button -->
            <button class="btn-fav-toggle ${isFav ? 'favorited' : ''}" data-id="${st.id}" title="${isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}">
              ${isFav ? '★' : '☆'}
            </button>

            <!-- Play Button -->
            <button class="btn-station-play ${isThisPlaying ? 'active' : ''}" data-id="${st.id}" title="${isThisPlaying ? 'Durdur' : 'Dinle'}">
              ${isThisLoading ? '⏳' : (isThisPlaying ? '⏹' : '▶')}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind custom edit/delete on cards
    listEl.querySelectorAll('.btn-card-edit-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.startEditCustomStation(id);
      });
    });

    listEl.querySelectorAll('.btn-card-del-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Bu özel radyoyu silmek istediğinize emin misiniz?')) {
          radioService.removeCustomStation(id);
          if (this.editingCustomId === id) {
            this.cancelEditCustomStation();
          } else {
            this.renderStations();
            this.renderCustomStationsList();
          }
        }
      });
    });

    // Bind REC button on each station card
    listEl.querySelectorAll('.btn-card-rec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const targetStation = radioService.stations.find(s => s.id === id);
        
        if (recordService.isRecording) {
          if (id === currentId) {
            recordService.stopRecording();
          } else {
            recordService.stopRecording();
            radioService.setStation(id);
            radioService.play();
            setTimeout(() => {
              recordService.startRecording(radioService.audio, targetStation ? targetStation.name : 'Radyo');
            }, 300);
          }
        } else {
          if (id !== currentId || !radioService.isPlaying) {
            radioService.setStation(id);
            radioService.play();
          }
          recordService.startRecording(radioService.audio, targetStation ? targetStation.name : 'Radyo');
        }
        this.renderStations();
      });
    });

    // Bind station card click events
    listEl.querySelectorAll('.radio-card-meta').forEach(metaEl => {
      metaEl.addEventListener('click', (e) => {
        const card = metaEl.closest('.radio-station-card');
        const id = card.dataset.id;
        if (id === currentId) {
          radioService.togglePlay();
        } else {
          radioService.setStation(id);
          radioService.play();
        }
        this.renderStations();
      });
    });

    listEl.querySelectorAll('.btn-station-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (id === currentId) {
          radioService.togglePlay();
        } else {
          radioService.setStation(id);
          radioService.play();
        }
        this.renderStations();
      });
    });

    listEl.querySelectorAll('.btn-fav-toggle').forEach(favBtn => {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = favBtn.dataset.id;
        radioService.toggleFavorite(id);
        this.render();
      });
    });
  }

  renderCustomStationsList() {
    const listEl = this.container.querySelector('#custom-stations-manage-list');
    if (!listEl) return;

    const customStations = radioService.customStations || [];
    if (customStations.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; font-size: 0.76rem; color: var(--text-muted); padding: 0.35rem;">
          Henüz özel radyo eklenmedi. Yukarıdan radyo adı ve yayın linki girerek ekleyebilirsiniz.
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div style="font-size: 0.78rem; font-weight: 800; color: #a1b0cb; margin-bottom: 0.3rem;">
        Eklediğiniz Özel Radyolar (${customStations.length})
      </div>
      ` + customStations.map(st => `
        <div class="custom-station-manage-item">
          <div class="custom-station-meta-box">
            <span class="custom-station-meta-name">${st.name}</span>
            <span class="custom-station-meta-url">${st.streamUrl}</span>
          </div>
          <div class="custom-station-manage-actions">
            <button class="btn-card-edit-custom btn-edit-station" data-id="${st.id}" title="Düzenle">
              ✏️ Düzenle
            </button>
            <button class="btn-card-delete-custom btn-delete-station" data-id="${st.id}" title="Sil">
              🗑️ Sil
            </button>
          </div>
        </div>
      `).join('');

    // Bind Edit button
    listEl.querySelectorAll('.btn-edit-station').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.startEditCustomStation(id);
      });
    });

    // Bind Delete button
    listEl.querySelectorAll('.btn-delete-station').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Bu özel radyoyu silmek istediğinize emin misiniz?')) {
          radioService.removeCustomStation(id);
          if (this.editingCustomId === id) {
            this.cancelEditCustomStation();
          } else {
            this.renderCustomStationsList();
            this.renderStations();
          }
        }
      });
    });
  }

  startEditCustomStation(id) {
    const station = radioService.customStations.find(s => s.id === id);
    if (!station) return;

    this.editingCustomId = id;
    this.showAddCustom = true;
    const customBox = this.container.querySelector('#box-custom-radio-add');
    if (customBox) customBox.style.display = 'block';

    const nameInput = this.container.querySelector('#input-custom-radio-name');
    const urlInput = this.container.querySelector('#input-custom-radio-url');
    const saveBtn = this.container.querySelector('#btn-save-custom-radio');
    const cancelBtn = this.container.querySelector('#btn-cancel-custom-edit');
    const titleEl = this.container.querySelector('#custom-form-title');

    if (nameInput) nameInput.value = station.name;
    if (urlInput) urlInput.value = station.streamUrl;
    if (saveBtn) saveBtn.textContent = '💾 Güncelle';
    if (cancelBtn) cancelBtn.style.display = 'block';
    if (titleEl) titleEl.innerHTML = `<span>✏️ Özel Radyoyu Düzenle</span> <span style="font-size: 0.75rem; color: #ffd700;">(${station.name})</span>`;

    if (nameInput) nameInput.focus();
  }

  cancelEditCustomStation() {
    this.editingCustomId = null;
    const nameInput = this.container.querySelector('#input-custom-radio-name');
    const urlInput = this.container.querySelector('#input-custom-radio-url');
    const saveBtn = this.container.querySelector('#btn-save-custom-radio');
    const cancelBtn = this.container.querySelector('#btn-cancel-custom-edit');
    const titleEl = this.container.querySelector('#custom-form-title');

    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
    if (saveBtn) saveBtn.textContent = '➕ Ekle';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (titleEl) titleEl.innerHTML = `<span>📻 Özel Radyo Ekle & Düzenle</span>`;

    this.renderCustomStationsList();
    this.renderStations();
  }

  bindEvents() {
    this.overlay = this.container.querySelector('#radio-modal-overlay');
    const closeBtn = this.container.querySelector('#btn-close-radio-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    // Modal Record Button
    const modalRecBtn = this.container.querySelector('#btn-modal-record');
    if (modalRecBtn) {
      modalRecBtn.addEventListener('click', () => {
        const currentStation = radioService.getCurrentStation();
        if (recordService.isRecording) {
          recordService.stopRecording();
        } else {
          if (!radioService.isPlaying) {
            radioService.play();
          }
          recordService.startRecording(radioService.audio, currentStation ? currentStation.name : 'Radyo');
        }
        this.updateRecordUi();
      });
    }

    // Sleep Timer Dropdown
    const sleepSelect = this.container.querySelector('#select-sleep-timer');
    if (sleepSelect) {
      sleepSelect.addEventListener('change', (e) => {
        const mins = parseInt(e.target.value, 10);
        radioService.setSleepTimer(mins);
      });
    }

    // Toggle Custom Add Box
    const toggleCustomBtn = this.container.querySelector('#btn-toggle-custom-add');
    const customBox = this.container.querySelector('#box-custom-radio-add');
    if (toggleCustomBtn && customBox) {
      toggleCustomBtn.addEventListener('click', () => {
        this.showAddCustom = !this.showAddCustom;
        customBox.style.display = this.showAddCustom ? 'block' : 'none';
        if (this.showAddCustom && this.showRecordings) {
          this.showRecordings = false;
          const recBox = this.container.querySelector('#box-recordings-player');
          if (recBox) recBox.style.display = 'none';
        }
        if (this.showAddCustom) {
          this.renderCustomStationsList();
        }
      });
    }

    // Toggle Recordings Drawer (Kayıt Dinle)
    const toggleRecBtn = this.container.querySelector('#btn-toggle-recordings');
    const recBox = this.container.querySelector('#box-recordings-player');
    if (toggleRecBtn && recBox) {
      toggleRecBtn.addEventListener('click', () => {
        this.showRecordings = !this.showRecordings;
        recBox.style.display = this.showRecordings ? 'block' : 'none';
        toggleRecBtn.classList.toggle('active', this.showRecordings);
        if (this.showRecordings) {
          this.showAddCustom = false;
          if (customBox) customBox.style.display = 'none';
          this.showAlarmPanel = false;
          const alarmBox = this.container.querySelector('#box-radio-alarm');
          if (alarmBox) alarmBox.style.display = 'none';
        }
        this.renderRecordingsList();
      });
    }

    // Toggle Radio Alarm Drawer (Kategorilerin Karşısındaki Buton)
    const toggleAlarmBtn = this.container.querySelector('#btn-toggle-radio-alarm');
    const alarmBox = this.container.querySelector('#box-radio-alarm');
    if (toggleAlarmBtn && alarmBox) {
      toggleAlarmBtn.addEventListener('click', () => {
        this.showAlarmPanel = !this.showAlarmPanel;
        alarmBox.style.display = this.showAlarmPanel ? 'block' : 'none';
        if (this.showAlarmPanel) {
          this.showAddCustom = false;
          if (customBox) customBox.style.display = 'none';
          this.showRecordings = false;
          if (recBox) recBox.style.display = 'none';
        }
      });
    }

    // Alarm Switch Toggle (Açık / Kapalı)
    const alarmCheck = this.container.querySelector('#check-radio-alarm-enable');
    const alarmStatusTxt = this.container.querySelector('#txt-alarm-switch-status');
    const alarmStatusBanner = this.container.querySelector('#alarm-status-banner-el');
    if (alarmCheck && alarmStatusTxt) {
      alarmCheck.addEventListener('change', () => {
        const isChecked = alarmCheck.checked;
        alarmStatusTxt.textContent = isChecked ? 'AÇIK' : 'KAPALI';
        alarmStatusTxt.style.color = isChecked ? '#00ff9d' : '#a1b0cb';
        if (alarmStatusBanner) {
          alarmStatusBanner.className = `alarm-status-banner ${isChecked ? 'active' : 'inactive'}`;
          const timeVal = this.container.querySelector('#input-radio-alarm-time')?.value || '06:30';
          const stationSelect = this.container.querySelector('#select-radio-alarm-station');
          const stName = stationSelect ? stationSelect.options[stationSelect.selectedIndex]?.text : 'Radyo';
          alarmStatusBanner.innerHTML = isChecked 
            ? `✅ Alarm <b>Aktif</b>: Her gün saat <b>${timeVal}</b> vaktinde <b>${stName}</b> ile otomatik başlayacaktır.`
            : `ℹ️ Radyo alarmı kapalı. Açmak için yukarıdaki anahtarı aktif edip "💾 Alarmı Kaydet" butonuna basınız.`;
        }
      });
    }

    // Alarm Presets Click
    this.container.querySelectorAll('.btn-alarm-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const t = e.currentTarget.dataset.time;
        const timeInput = this.container.querySelector('#input-radio-alarm-time');
        if (timeInput && t) {
          timeInput.value = t;
          if (alarmCheck && !alarmCheck.checked) {
            alarmCheck.checked = true;
            alarmCheck.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Save Radio Alarm
    const saveAlarmBtn = this.container.querySelector('#btn-save-radio-alarm');
    if (saveAlarmBtn) {
      saveAlarmBtn.addEventListener('click', () => {
        const isEnabled = this.container.querySelector('#check-radio-alarm-enable')?.checked || false;
        const timeVal = this.container.querySelector('#input-radio-alarm-time')?.value || '06:30';
        const stationId = this.container.querySelector('#select-radio-alarm-station')?.value || 'risale_radyo';
        const autoStop = parseInt(this.container.querySelector('#select-radio-alarm-autostop')?.value || '30', 10);

        radioService.setRadioAlarm({
          enabled: isEnabled,
          time: timeVal,
          stationId: stationId,
          autoStopMinutes: autoStop
        });

        // Request browser notification permission if enabling
        if (isEnabled && 'Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission().catch(() => {});
        }

        saveAlarmBtn.textContent = '✅ Kaydedildi!';
        setTimeout(() => {
          this.render();
        }, 600);
      });
    }

    // Test Radio Alarm
    const testAlarmBtn = this.container.querySelector('#btn-test-radio-alarm');
    if (testAlarmBtn) {
      testAlarmBtn.addEventListener('click', () => {
        const stationId = this.container.querySelector('#select-radio-alarm-station')?.value || 'risale_radyo';
        const autoStop = parseInt(this.container.querySelector('#select-radio-alarm-autostop')?.value || '30', 10);
        
        radioService.setRadioAlarm({
          stationId: stationId,
          autoStopMinutes: autoStop
        });

        radioService.triggerAlarm(true);
      });
    }

    // Close Radio Alarm Box
    const closeAlarmBoxBtn = this.container.querySelector('#btn-close-alarm-box');
    if (closeAlarmBoxBtn && alarmBox) {
      closeAlarmBoxBtn.addEventListener('click', () => {
        this.showAlarmPanel = false;
        alarmBox.style.display = 'none';
      });
    }

    // Upload Recording File Input
    const uploadInput = this.container.querySelector('#input-upload-recording');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          recordService.addRecordingFromFile(e.target.files[0]);
          this.renderRecordingsList();
        }
      });
    }

    // Save / Update Custom Radio
    const saveCustomBtn = this.container.querySelector('#btn-save-custom-radio');
    if (saveCustomBtn) {
      saveCustomBtn.addEventListener('click', () => {
        const nameInput = this.container.querySelector('#input-custom-radio-name');
        const urlInput = this.container.querySelector('#input-custom-radio-url');
        if (nameInput && urlInput && nameInput.value.trim() && urlInput.value.trim()) {
          if (this.editingCustomId) {
            radioService.updateCustomStation(this.editingCustomId, nameInput.value, urlInput.value, 'dini');
            this.cancelEditCustomStation();
          } else {
            radioService.addCustomStation(nameInput.value, urlInput.value, 'dini');
            nameInput.value = '';
            urlInput.value = '';
            this.renderCustomStationsList();
            this.renderStations();
            radioService.play();
          }
        }
      });
    }

    // Cancel Custom Edit Button
    const cancelCustomBtn = this.container.querySelector('#btn-cancel-custom-edit');
    if (cancelCustomBtn) {
      cancelCustomBtn.addEventListener('click', () => {
        this.cancelEditCustomStation();
      });
    }

    // Category Tabs
    this.container.querySelectorAll('.radio-cat-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.cat;
        this.selectedCategory = cat;
        this.container.querySelectorAll('.radio-cat-chip').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.renderStations();
      });
    });

    // Search Input
    const searchInput = this.container.querySelector('#input-radio-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderStations();
      });
    }

    const clearSearchBtn = this.container.querySelector('#btn-clear-radio-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        if (searchInput) searchInput.value = '';
        this.renderStations();
      });
    }

    // Subscribe to radio state changes
    radioService.onStateChange(() => {
      if (this.isOpen()) {
        this.renderStations();
      }
    });
  }

  isOpen() {
    return this.isOpenState;
  }

  open() {
    this.isOpenState = true;
    this.render();
    if (this.overlay) {
      this.overlay.classList.add('open');
    }
  }

  close() {
    this.isOpenState = false;
    if (this.overlay) {
      this.overlay.classList.remove('open');
    }
  }
}
