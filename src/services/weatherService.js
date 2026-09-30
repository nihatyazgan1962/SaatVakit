// Weather Service using Open-Meteo (No API key needed, high reliability)

class WeatherService {
  constructor() {
    this.weatherCache = null;
    this.lastFetchTime = 0;
  }

  // WMO Weather code to Turkish Description & Icon
  getWeatherInfo(code) {
    const map = {
      0: { text: 'Açık / Güneşli', icon: '☀️' },
      1: { text: 'Çoğunlukla Açık', icon: '🌤️' },
      2: { text: 'Parçalı Bulutlu', icon: '⛅' },
      3: { text: 'Bulutlu', icon: '☁️' },
      45: { text: 'Sisli', icon: '🌫️' },
      48: { text: 'Kırağı / Sis', icon: '🌫️' },
      51: { text: 'Hafif Çisenti', icon: '🌦️' },
      53: { text: 'Çisenti', icon: '🌦️' },
      55: { text: 'Yoğun Çisenti', icon: '🌧️' },
      61: { text: 'Hafif Yağmurlu', icon: '🌧️' },
      63: { text: 'Yağmurlu', icon: '🌧️' },
      65: { text: 'Kuvvetli Yağmur', icon: '⛈️' },
      71: { text: 'Hafif Kar Yağışlı', icon: '🌨️' },
      73: { text: 'Kar Yağışlı', icon: '❄️' },
      75: { text: 'Yoğun Kar Yağışlı', icon: '❄️' },
      80: { text: 'Sağanak Yağış', icon: '🌧️' },
      81: { text: 'Kuvvetli Sağanak', icon: '⛈️' },
      82: { text: 'Şiddetli Sağanak', icon: '⛈️' },
      95: { text: 'Gök Gürültülü Fırtına', icon: '⚡' }
    };
    return map[code] || { text: 'Açık', icon: '🌤️' };
  }

  async getCurrentWeather(lat = 41.0082, lng = 28.9784) {
    const now = Date.now();
    // Cache for 15 minutes
    if (this.weatherCache && (now - this.lastFetchTime < 15 * 60 * 1000)) {
      return this.weatherCache;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const current = data.current_weather;
        const info = this.getWeatherInfo(current.weathercode);
        this.weatherCache = {
          temp: Math.round(current.temperature),
          windSpeed: Math.round(current.windspeed),
          text: info.text,
          icon: info.icon,
          time: current.time
        };
        this.lastFetchTime = now;
        return this.weatherCache;
      }
    } catch (e) {
      console.warn('Weather fetch error:', e);
    }

    // Fallback if network is slow/offline
    return this.weatherCache || {
      temp: 22,
      windSpeed: 10,
      text: 'Parçalı Bulutlu',
      icon: '⛅'
    };
  }
}

export const weatherService = new WeatherService();
