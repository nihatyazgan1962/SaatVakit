// Screen Wake Lock API service to keep the phone/browser screen on continuously
class WakeLockService {
  constructor() {
    this.wakeLock = null;
    this.isEnabled = localStorage.getItem('saatvakit_wakelock') === 'true';

    // Re-acquire lock if visibility changes back to visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isEnabled) {
        this.request();
      }
    });
  }

  async request() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.isEnabled = true;
        localStorage.setItem('saatvakit_wakelock', 'true');
        return true;
      } catch (err) {
        console.warn('Wake Lock request error:', err);
        return false;
      }
    }
    return false;
  }

  release() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(console.warn);
      this.wakeLock = null;
    }
    this.isEnabled = false;
    localStorage.setItem('saatvakit_wakelock', 'false');
  }

  toggle() {
    if (this.isEnabled) {
      this.release();
      return false;
    } else {
      return this.request();
    }
  }
}

export const wakeLockService = new WakeLockService();
