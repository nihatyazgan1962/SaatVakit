// Digital Clock Component: EXTRA LARGE Display with Independent Customizable Colors for Hour, Minute, and Second

export class DigitalClock {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.status = null;
    this.render();
    this.startLoop();
  }

  setStatus(status) {
    this.status = status;
    this.updateStatusDisplay();
  }

  render() {
    this.container.innerHTML = `
      <div class="digital-clock-card">
        <!-- Date Header Banner -->
        <div class="date-banner">
          <div class="date-gregorian">
            <span id="txt-day-name">Pazartesi</span>,
            <span id="txt-full-date" style="color: #94a3b8; font-weight: 500;">18 Eylül 2026</span>
          </div>
          <div class="date-hijri" id="txt-hijri-date">
            6 Rebiülevvel 1448
          </div>
        </div>

        <!-- HUGE DIGITAL DISPLAY (Hours, Minutes, Seconds with distinct vibrant colors) -->
        <div class="big-digital-display" aria-label="Dijital Saat Göstergesi">
          <!-- Hour Block -->
          <div class="digit-block">
            <span class="digit-val hour" id="val-hour">00</span>
            <span class="digit-label hour-label">SAAT</span>
          </div>

          <div class="digit-colon">:</div>

          <!-- Minute Block -->
          <div class="digit-block">
            <span class="digit-val minute" id="val-min">00</span>
            <span class="digit-label minute-label">DAKİKA</span>
          </div>

          <div class="digit-colon">:</div>

          <!-- Second Block -->
          <div class="digit-block">
            <span class="digit-val second" id="val-sec">00</span>
            <span class="digit-label second-label">SANİYE</span>
          </div>
        </div>

        <!-- Next Prayer Countdown Banner -->
        <div class="next-prayer-banner" id="next-prayer-widget">
          <div class="next-prayer-info">
            <span class="next-prayer-title">Sıradaki Vakit</span>
            <span class="next-prayer-name" id="next-prayer-name-display">Öğle Vakti</span>
            <span class="next-prayer-time" id="next-prayer-time-display">13:12</span>
          </div>
          <div class="countdown-box">
            <div class="countdown-label">Kalan Süre</div>
            <div class="countdown-digits" id="countdown-val">00:00:00</div>
          </div>
        </div>
      </div>
    `;

    this.hourEl = this.container.querySelector('#val-hour');
    this.minEl = this.container.querySelector('#val-min');
    this.secEl = this.container.querySelector('#val-sec');
    this.dayNameEl = this.container.querySelector('#txt-day-name');
    this.fullDateEl = this.container.querySelector('#txt-full-date');
    this.hijriEl = this.container.querySelector('#txt-hijri-date');
    
    this.nextNameEl = this.container.querySelector('#next-prayer-name-display');
    this.nextTimeEl = this.container.querySelector('#next-prayer-time-display');
    this.countdownEl = this.container.querySelector('#countdown-val');
  }

  updateDates() {
    const now = new Date();
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    if (this.dayNameEl) this.dayNameEl.textContent = days[now.getDay()];
    if (this.fullDateEl) this.fullDateEl.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    // Hijri date estimation / format
    try {
      const hijriFormatter = new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (this.hijriEl) this.hijriEl.textContent = hijriFormatter.format(now);
    } catch (e) {
      if (this.hijriEl) this.hijriEl.textContent = 'Hicri Takvim';
    }
  }

  updateStatusDisplay() {
    if (!this.status) return;

    if (this.nextNameEl) this.nextNameEl.textContent = `${this.status.nextPrayer.name} Vakti`;
    if (this.nextTimeEl) this.nextTimeEl.textContent = this.status.nextPrayer.time;
    if (this.countdownEl) this.countdownEl.textContent = this.status.remainingFormatted;
  }

  startLoop() {
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');

      if (this.hourEl && this.hourEl.textContent !== h) this.hourEl.textContent = h;
      if (this.minEl && this.minEl.textContent !== m) this.minEl.textContent = m;
      if (this.secEl) this.secEl.textContent = s;

      // Update dates once per minute
      if (s === '00' || !this.lastDateUpdated) {
        this.updateDates();
        this.lastDateUpdated = true;
      }
    };

    update();
    setInterval(update, 1000);
  }
}
