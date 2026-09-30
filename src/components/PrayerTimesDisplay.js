// Prayer Times Grid Display Component (6 Daily Prayers with icons and badges)

export class PrayerTimesDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.timings = null;
    this.status = null;
    this.render();
  }

  update(timings, status) {
    this.timings = timings;
    this.status = status;
    this.render();
  }

  render() {
    if (!this.timings || !this.status) {
      this.container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 2rem;">Vakitler yükleniyor...</div>`;
      return;
    }

    const icons = {
      imsak: `🌙`,
      gunes: `🌅`,
      ogle: `☀️`,
      ikindi: `🌤️`,
      aksam: `🌇`,
      yatsi: `✨`
    };

    const prayers = [
      { key: 'imsak', name: 'İmsak', time: this.timings.imsak },
      { key: 'gunes', name: 'Güneş', time: this.timings.gunes },
      { key: 'ogle', name: 'Öğle', time: this.timings.ogle },
      { key: 'ikindi', name: 'İkindi', time: this.timings.ikindi },
      { key: 'aksam', name: 'Akşam', time: this.timings.aksam },
      { key: 'yatsi', name: 'Yatsı', time: this.timings.yatsi }
    ];

    const currentKey = this.status.currentPrayer ? this.status.currentPrayer.key : '';
    const nextKey = this.status.nextPrayer ? this.status.nextPrayer.key : '';

    const cardsHtml = prayers.map(p => {
      const isActive = p.key === currentKey;
      const isNext = p.key === nextKey;

      let badge = '';
      if (isActive) {
        badge = `<span class="prayer-badge active-badge">Şu Anki Vakit</span>`;
      } else if (isNext) {
        badge = `<span class="prayer-badge next-badge">Sıradaki</span>`;
      }

      return `
        <div class="prayer-card ${isActive ? 'active' : ''} ${isNext ? 'next' : ''}">
          <div class="prayer-icon-wrap">${icons[p.key] || '🕌'}</div>
          <div class="prayer-card-name">${p.name}</div>
          <div class="prayer-card-time">${p.time}</div>
          ${badge}
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="prayer-cards-section">
        <div class="section-header">
          <div class="section-title">
            <span>🕌</span> Günlük Diyanet Namaz Vakitleri
          </div>
        </div>
        <div class="prayer-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  }
}
