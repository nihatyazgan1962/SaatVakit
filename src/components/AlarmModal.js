import { soundManager } from '../services/soundManager.js';

export class AlarmModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="alarm-overlay" id="alarm-overlay-screen" style="display: none;">
        <div class="alarm-icon-big">🕌</div>
        <div>
          <div style="font-size: 1.2rem; color: var(--accent-gold); font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Vakit Geldi</div>
          <h1 id="alarm-prayer-title" style="font-size: 3rem; font-weight: 900; margin: 0.5rem 0; color: #ffffff;">Öğle Vakti</h1>
          <div id="alarm-prayer-time-sub" style="font-family: var(--font-digital); font-size: 2.2rem; color: var(--accent-cyan);">13:12</div>
          <p style="color: var(--text-secondary); margin-top: 1rem; font-size: 1.1rem;">"Namaz müminlerin üzerine vakitleri belirlenmiş bir farzdır."</p>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button id="btn-dismiss-alarm" class="btn-primary" style="font-size: 1.2rem; padding: 1.2rem 3rem;">
            ✓ Bildirimi Kapat
          </button>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#alarm-overlay-screen');
    this.titleEl = this.container.querySelector('#alarm-prayer-title');
    this.timeEl = this.container.querySelector('#alarm-prayer-time-sub');

    this.container.querySelector('#btn-dismiss-alarm').addEventListener('click', () => this.dismiss());
  }

  show(data) {
    if (this.titleEl) this.titleEl.textContent = data.prayerName;
    if (this.timeEl) this.timeEl.textContent = data.time;
    if (this.overlay) this.overlay.style.display = 'flex';
  }

  dismiss() {
    if (this.overlay) this.overlay.style.display = 'none';
    soundManager.stop();
  }
}
