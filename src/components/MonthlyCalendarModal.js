// Monthly & Yearly Calendar Modal: Full Responsive Vertical Screen Fit & 365-Day Diyanet Fetch

export class MonthlyCalendarModal {
  constructor(containerId, prayerService) {
    this.container = document.getElementById(containerId);
    this.prayerService = prayerService;
    this.isOpen = false;
    
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth() + 1; // 1-12
    this.isDownloadingYear = false;

    this.render();
  }

  render() {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const currentCity = this.prayerService.getCity();

    const monthOptions = months.map((mName, idx) => `
      <option value="${idx + 1}" ${idx + 1 === this.viewMonth ? 'selected' : ''}>${mName}</option>
    `).join('');

    const yearOptions = [this.viewYear - 1, this.viewYear, this.viewYear + 1].map(y => `
      <option value="${y}" ${y === this.viewYear ? 'selected' : ''}>${y}</option>
    `).join('');

    this.container.innerHTML = `
      <div class="modal-overlay" id="monthly-modal-overlay">
        <div class="modal-content monthly-modal-responsive" style="max-width: 680px; padding: 0.8rem 0.6rem;">
          
          <!-- Modal Header -->
          <div class="modal-header" style="border-bottom: 1px solid rgba(223, 175, 82, 0.25); padding-bottom: 0.6rem; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">📅</span>
              <div>
                <div id="monthly-modal-city-title" style="font-weight: 800; font-size: 0.95rem; color: #ffd700; line-height: 1.2;">
                  ${currentCity.name || 'İstanbul'} Diyanet İmsakiyesi
                </div>
                <div style="font-size: 0.72rem; color: #00ff9d; display: flex; align-items: center; gap: 0.3rem;">
                  <span>🌐 Kaynak:</span> <b>namazvakitleri.diyanet.gov.tr</b>
                </div>
              </div>
            </div>
            <button class="btn-icon" id="btn-close-monthly-modal" aria-label="Kapat">✕</button>
          </div>

          <div class="modal-body" style="padding: 0;">
            
            <!-- Month & Year Navigation Bar -->
            <div class="imsakiye-nav-bar">
              <button id="btn-prev-month" class="btn-imsakiye-nav" title="Önceki Ay">◀</button>
              
              <div class="imsakiye-select-group">
                <select id="select-imsakiye-month" class="select-imsakiye-dropdown">
                  ${monthOptions}
                </select>
                <select id="select-imsakiye-year" class="select-imsakiye-dropdown">
                  ${yearOptions}
                </select>
              </div>

              <button id="btn-next-month" class="btn-imsakiye-nav" title="Sonraki Ay">▶</button>
            </div>

            <!-- Download 1 Year Button / Progress Banner -->
            <div class="imsakiye-action-bar">
              <button id="btn-download-full-year" class="btn-download-year">
                <span>📥</span> <span id="txt-download-year-btn">365 Günlük Yıllık İmsakiyeyi Çevrimdışı İndir</span>
              </button>
            </div>

            <div id="imsakiye-download-status" class="imsakiye-download-status" style="display: none;"></div>

            <!-- Responsive Table Container -->
            <div class="monthly-table-wrapper">
              <table class="monthly-table">
                <thead>
                  <tr>
                    <th style="width: 17%;">Tarih</th>
                    <th style="width: 13.5%;">İmsak</th>
                    <th style="width: 13.5%;">Güneş</th>
                    <th style="width: 13.5%;">Öğle</th>
                    <th style="width: 13.5%;">İkindi</th>
                    <th style="width: 14%;">Akşam</th>
                    <th style="width: 15%;">Yatsı</th>
                  </tr>
                </thead>
                <tbody id="monthly-table-body">
                  <tr><td colspan="7" style="padding: 2.5rem 1rem; text-align: center; color: #a1b0cb;">⏳ Vakitler yükleniyor...</td></tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#monthly-modal-overlay');
    this.tableBody = this.container.querySelector('#monthly-table-body');
    this.cityTitle = this.container.querySelector('#monthly-modal-city-title');
    
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#btn-close-monthly-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    // Prev Month
    const prevBtn = this.container.querySelector('#btn-prev-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.viewMonth--;
        if (this.viewMonth < 1) {
          this.viewMonth = 12;
          this.viewYear--;
        }
        this.updateViewSelects();
        this.loadTableData();
      });
    }

    // Next Month
    const nextBtn = this.container.querySelector('#btn-next-month');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.viewMonth++;
        if (this.viewMonth > 12) {
          this.viewMonth = 1;
          this.viewYear++;
        }
        this.updateViewSelects();
        this.loadTableData();
      });
    }

    // Month & Year Selectors
    const monthSelect = this.container.querySelector('#select-imsakiye-month');
    const yearSelect = this.container.querySelector('#select-imsakiye-year');
    
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.viewMonth = parseInt(e.target.value, 10);
        this.loadTableData();
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.viewYear = parseInt(e.target.value, 10);
        this.loadTableData();
      });
    }

    // Download Full Year (365 Gün)
    const downloadBtn = this.container.querySelector('#btn-download-full-year');
    const statusEl = this.container.querySelector('#imsakiye-download-status');
    const btnText = this.container.querySelector('#txt-download-year-btn');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        if (this.isDownloadingYear) return;
        this.isDownloadingYear = true;
        downloadBtn.classList.add('loading');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = `⏳ <b>${this.viewYear}</b> Yılı Diyanet imsakiye verileri indiriliyor (12 Ay)...`;
        }

        try {
          await this.prayerService.downloadFullYear(this.viewYear, (curMonth, total) => {
            if (btnText) btnText.textContent = `İndiriliyor: %${Math.round((curMonth / total) * 100)} (${curMonth}/${total} Ay)`;
          });

          if (statusEl) {
            statusEl.className = 'imsakiye-download-status success';
            statusEl.innerHTML = `✅ <b>${this.viewYear}</b> Yılı (365 Gün) Diyanet İmsakiyesi başarıyla indirildi ve kaydedildi!`;
          }
          if (btnText) btnText.textContent = `✓ ${this.viewYear} Yıllık İmsakiye Çevrimdışı Hazır`;
        } catch (err) {
          if (statusEl) {
            statusEl.className = 'imsakiye-download-status error';
            statusEl.innerHTML = `❌ İndirme tamamlanamadı: ${err.message || 'Bağlantı hatası'}`;
          }
          if (btnText) btnText.textContent = '365 Günlük Yıllık İmsakiyeyi Çevrimdışı İndir';
        } finally {
          this.isDownloadingYear = false;
          downloadBtn.classList.remove('loading');
          this.loadTableData();
        }
      });
    }
  }

  updateViewSelects() {
    const monthSelect = this.container.querySelector('#select-imsakiye-month');
    const yearSelect = this.container.querySelector('#select-imsakiye-year');
    if (monthSelect) monthSelect.value = this.viewMonth.toString();
    if (yearSelect) yearSelect.value = this.viewYear.toString();
  }

  async loadTableData() {
    const city = this.prayerService.getCity();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const shortDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    if (this.cityTitle) {
      this.cityTitle.textContent = `${city.name} - ${months[this.viewMonth - 1]} ${this.viewYear} İmsakiyesi`;
    }

    if (this.tableBody) {
      this.tableBody.innerHTML = `<tr><td colspan="7" style="padding: 2.5rem 1rem; text-align: center; color: #ffd700;">⏳ ${months[this.viewMonth - 1]} ${this.viewYear} Vakitleri Yükleniyor...</td></tr>`;
    }

    try {
      const data = await this.prayerService.getMonthlyPrayerTimes(this.viewYear, this.viewMonth);
      
      const cleanTime = (t) => {
        if (!t) return '--:--';
        const match = t.match(/(\d{2}:\d{2})/);
        return match ? match[1] : t.substring(0, 5);
      };

      const isViewingCurrentMonth = (this.viewYear === currentYear && this.viewMonth === currentMonth);

      const rowsHtml = data.map((item, index) => {
        const dayNum = parseInt(item.date?.gregorian?.day || (index + 1), 10);
        const isToday = isViewingCurrentMonth && (dayNum === currentDay);
        
        // Calculate day of week
        const itemDate = new Date(this.viewYear, this.viewMonth - 1, dayNum);
        const dayOfWeekIdx = itemDate.getDay();
        const shortDayName = shortDays[dayOfWeekIdx] || '';
        const isFriday = dayOfWeekIdx === 5; // Cuma
        const isWeekend = (dayOfWeekIdx === 0 || dayOfWeekIdx === 6);

        const t = item.timings || {};

        const dayFormatted = `${dayNum.toString().padStart(2, '0')} ${shortDayName}`;

        return `
          <tr class="${isToday ? 'today-row' : ''} ${isFriday ? 'friday-row' : ''} ${isWeekend ? 'weekend-row' : ''}">
            <td class="col-date ${isFriday ? 'txt-friday' : ''}">
              ${isToday ? '<span class="today-star">⭐</span>' : ''}${dayFormatted}
            </td>
            <td class="col-time">${cleanTime(t.Fajr || t.Imsak)}</td>
            <td class="col-time">${cleanTime(t.Sunrise)}</td>
            <td class="col-time">${cleanTime(t.Dhuhr)}</td>
            <td class="col-time">${cleanTime(t.Asr)}</td>
            <td class="col-time">${cleanTime(t.Maghrib || t.Sunset)}</td>
            <td class="col-time">${cleanTime(t.Isha)}</td>
          </tr>
        `;
      }).join('');

      if (this.tableBody) {
        this.tableBody.innerHTML = rowsHtml;

        // Auto scroll to today row if viewing current month
        if (isViewingCurrentMonth) {
          setTimeout(() => {
            const todayRowEl = this.tableBody.querySelector('.today-row');
            if (todayRowEl) {
              todayRowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }
      }
    } catch (e) {
      if (this.tableBody) {
        this.tableBody.innerHTML = `<tr><td colspan="7" style="color: #ff6b6b; padding: 2rem; text-align: center;">Aylık imsakiye vakitleri yüklenemedi.</td></tr>`;
      }
    }
  }

  async open() {
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth() + 1;

    this.render();
    this.overlay.classList.add('open');
    this.isOpen = true;

    await this.loadTableData();
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('open');
    }
    this.isOpen = false;
  }
}
