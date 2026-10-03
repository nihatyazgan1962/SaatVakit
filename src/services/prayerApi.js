// Prayer API Service: Diyanet calculation, monthly fetch, local cache and offline astronomical calculation fallback

export class PrayerService {
  constructor() {
    this.selectedCity = JSON.parse(localStorage.getItem('saatvakit_city') || JSON.stringify({
      id: "istanbul",
      name: "İstanbul",
      lat: 41.0082,
      lng: 28.9784
    }));
  }

  getCity() {
    return this.selectedCity;
  }

  setCity(cityObj) {
    this.selectedCity = cityObj;
    localStorage.setItem('saatvakit_city', JSON.stringify(cityObj));
  }

  // Generate cache key for city and year-month (distinct per district)
  getCacheKey(cityOrId, year, month) {
    const locId = typeof cityOrId === 'object' && cityOrId !== null
      ? (cityOrId.districtId || cityOrId.id || 'istanbul')
      : (this.selectedCity?.districtId || this.selectedCity?.id || cityOrId || 'istanbul');
    return `saatvakit_v2_monthly_${locId}_${year}_${month}`;
  }

  // Offline astronomical prayer calculator for Diyanet (Method 13)
  calculateDayOffline(date, lat, lng) {
    // Diyanet parameters: Fajr 18°, Isha 17°
    const d = new Date(date);
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // Solar declination & Equation of time approximation
    const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
    const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // in minutes
    const decl = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180)); // degrees

    const timezone = 3; // Turkey UTC+3 permanent
    const solarNoon = 12 + (4 * (timezone * 15 - lng) - EoT) / 60; // in hours

    const rad = Math.PI / 180;
    const latRad = lat * rad;
    const declRad = decl * rad;

    const hourAngle = (angle) => {
      const cosH = (Math.sin(-angle * rad) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));
      if (cosH > 1) return 0;
      if (cosH < -1) return 180;
      return Math.acos(cosH) * (180 / Math.PI);
    };

    // Sunrise/Sunset (Sun zenith 90.833°)
    const sunAngle = 0.833;
    const H_sun = hourAngle(sunAngle) / 15;
    const sunrise = solarNoon - H_sun;
    const sunset = solarNoon + H_sun;

    // Fajr (İmsak) - 18°
    const H_fajr = hourAngle(18) / 15;
    const fajr = solarNoon - H_fajr;

    // Asr (İkindi - Shafi'i/Hanafi standard: shadow = object + noon shadow)
    const noonAlt = 90 - Math.abs(lat - decl);
    const noonShadow = 1 / Math.tan(noonAlt * rad);
    const asrAlt = (Math.atan(1 / (1 + noonShadow))) * (180 / Math.PI);
    const H_asr = hourAngle(90 - asrAlt) / 15;
    const asr = solarNoon + H_asr;

    // Isha (Yatsı) - 17°
    const H_isha = hourAngle(17) / 15;
    const isha = solarNoon + H_isha;

    const toHHMM = (hrs) => {
      let totalMins = Math.round(hrs * 60);
      if (totalMins < 0) totalMins += 24 * 60;
      totalMins = totalMins % (24 * 60);
      const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
      const m = (totalMins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    return {
      date: {
        readable: `${d.getDate().toString().padStart(2, '0')} ${['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][d.getMonth()]} ${d.getFullYear()}`,
        timestamp: d.getTime().toString(),
        gregorian: {
          day: d.getDate().toString().padStart(2, '0'),
          month: { number: d.getMonth() + 1 },
          year: d.getFullYear().toString(),
          weekday: { en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()] }
        }
      },
      timings: {
        Imsak: toHHMM(fajr),
        Fajr: toHHMM(fajr),
        Sunrise: toHHMM(sunrise),
        Dhuhr: toHHMM(solarNoon + (2/60)), // +2 min safety temkin
        Asr: toHHMM(asr),
        Sunset: toHHMM(sunset),
        Maghrib: toHHMM(sunset + (3/60)),  // +3 min safety temkin
        Isha: toHHMM(isha)
      }
    };
  }

  // Generate complete fallback offline month
  generateOfflineMonth(year, month, city) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      days.push(this.calculateDayOffline(date, city.lat, city.lng));
    }
    return days;
  }

  // Helper: Decode HTML entities from Diyanet page
  decodeHtmlEntities(str) {
    if (!str) return '';
    return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&uuml;/gi, 'ü').replace(/&ouml;/gi, 'ö').replace(/&ccedil;/gi, 'ç')
      .replace(/&Uuml;/gi, 'Ü').replace(/&Ouml;/gi, 'Ö').replace(/&Ccedil;/gi, 'Ç')
      .replace(/&nbsp;/gi, ' ');
  }

  // Get official Diyanet ID & slug for city/district
  getDiyanetLocationMeta(city) {
    const dMap = {
      'istanbul-esenyurt': { id: 9540, slug: 'esenyurt-icin-namaz-vakti' },
      'istanbul-arnavutkoy': { id: 9535, slug: 'arnavutkoy-icin-namaz-vakti' },
      'istanbul-avcilar': { id: 17865, slug: 'avcilar-icin-namaz-vakti' },
      'istanbul-basaksehir': { id: 17866, slug: 'basaksehir-icin-namaz-vakti' },
      'istanbul-beylikduzu': { id: 9536, slug: 'beylikduzu-icin-namaz-vakti' },
      'istanbul-buyukcekmece': { id: 9537, slug: 'buyukcekmece-icin-namaz-vakti' },
      'istanbul-catalca': { id: 9538, slug: 'catalca-icin-namaz-vakti' },
      'istanbul-cekmekoy': { id: 9539, slug: 'cekmekoy-icin-namaz-vakti' },
      'istanbul-kartal': { id: 9542, slug: 'kartal-icin-namaz-vakti' },
      'istanbul-kucukcekmece': { id: 9543, slug: 'kucukcekmece-icin-namaz-vakti' },
      'istanbul-maltepe': { id: 9544, slug: 'maltepe-icin-namaz-vakti' },
      'istanbul-pendik': { id: 9545, slug: 'pendik-icin-namaz-vakti' },
      'istanbul-sancaktepe': { id: 9546, slug: 'sancaktepe-icin-namaz-vakti' },
      'istanbul-sile': { id: 9547, slug: 'sile-icin-namaz-vakti' },
      'istanbul-silivri': { id: 9548, slug: 'silivri-icin-namaz-vakti' },
      'istanbul-sultanbeyli': { id: 9549, slug: 'sultanbeyli-icin-namaz-vakti' },
      'istanbul-sultangazi': { id: 9550, slug: 'sultangazi-icin-namaz-vakti' },
      'istanbul-tuzla': { id: 9551, slug: 'tuzla-icin-namaz-vakti' },
      'istanbul': { id: 9541, slug: 'istanbul-icin-namaz-vakti' },
      'ankara': { id: 9206, slug: 'ankara-icin-namaz-vakti' },
      'izmir': { id: 9560, slug: 'izmir-icin-namaz-vakti' },
      'bursa': { id: 9335, slug: 'bursa-icin-namaz-vakti' },
      'antalya': { id: 9225, slug: 'antalya-icin-namaz-vakti' },
      'adana': { id: 9158, slug: 'adana-icin-namaz-vakti' },
      'konya': { id: 9638, slug: 'konya-icin-namaz-vakti' },
      'gaziantep': { id: 9450, slug: 'gaziantep-icin-namaz-vakti' },
      'sanliurfa': { id: 9840, slug: 'sanliurfa-icin-namaz-vakti' },
      'kocaeli': { id: 9622, slug: 'kocaeli-icin-namaz-vakti' },
      'mersin': { id: 9692, slug: 'mersin-icin-namaz-vakti' },
      'diyarbakir': { id: 9394, slug: 'diyarbakir-icin-namaz-vakti' },
      'hatay': { id: 9495, slug: 'hatay-icin-namaz-vakti' },
      'manisa': { id: 9678, slug: 'manisa-icin-namaz-vakti' },
      'kayseri': { id: 9604, slug: 'kayseri-icin-namaz-vakti' },
      'samsun': { id: 9804, slug: 'samsun-icin-namaz-vakti' },
      'balikesir': { id: 9270, slug: 'balikesir-icin-namaz-vakti' },
      'kahramanmaras': { id: 9580, slug: 'kahramanmaras-icin-namaz-vakti' },
      'van': { id: 9912, slug: 'van-icin-namaz-vakti' },
      'aydin': { id: 9252, slug: 'aydin-icin-namaz-vakti' },
      'denizli': { id: 9385, slug: 'denizli-icin-namaz-vakti' },
      'sakarya': { id: 9788, slug: 'sakarya-icin-namaz-vakti' },
      'tekirdag': { id: 9854, slug: 'tekirdag-icin-namaz-vakti' },
      'mugla': { id: 9712, slug: 'mugla-icin-namaz-vakti' },
      'eskisehir': { id: 9434, slug: 'eskisehir-icin-namaz-vakti' },
      'mardin': { id: 9685, slug: 'mardin-icin-namaz-vakti' },
      'malatya': { id: 9666, slug: 'malatya-icin-namaz-vakti' },
      'trabzon': { id: 9881, slug: 'trabzon-icin-namaz-vakti' },
      'erzurum': { id: 9426, slug: 'erzurum-icin-namaz-vakti' },
      'ordu': { id: 9748, slug: 'ordu-icin-namaz-vakti' },
      'sivas': { id: 9825, slug: 'sivas-icin-namaz-vakti' }
    };

    const targetKey = (city.districtId || city.id || city.cityId || 'istanbul-esenyurt').toLowerCase();
    const found = dMap[targetKey] || dMap[city.cityId] || dMap['istanbul-esenyurt'] || dMap['istanbul'];
    return found;
  }

  // Get Diyanet Haber URL slug for city/district
  getDiyanetHaberSlug(city) {
    const slugMap = {
      'istanbul-esenyurt': 'istanbul-esenyurt-namaz-vakitleri',
      'istanbul-arnavutkoy': 'istanbul-arnavutkoy-namaz-vakitleri',
      'istanbul-avcilar': 'istanbul-avcilar-namaz-vakitleri',
      'istanbul-basaksehir': 'istanbul-basaksehir-namaz-vakitleri',
      'istanbul-beylikduzu': 'istanbul-beylikduzu-namaz-vakitleri',
      'istanbul-buyukcekmece': 'istanbul-buyukcekmece-namaz-vakitleri',
      'istanbul-catalca': 'istanbul-catalca-namaz-vakitleri',
      'istanbul-cekmekoy': 'istanbul-cekmekoy-namaz-vakitleri',
      'istanbul-kartal': 'istanbul-kartal-namaz-vakitleri',
      'istanbul-kucukcekmece': 'istanbul-kucukcekmece-namaz-vakitleri',
      'istanbul-maltepe': 'istanbul-maltepe-namaz-vakitleri',
      'istanbul-pendik': 'istanbul-pendik-namaz-vakitleri',
      'istanbul-sancaktepe': 'istanbul-sancaktepe-namaz-vakitleri',
      'istanbul-sile': 'istanbul-sile-namaz-vakitleri',
      'istanbul-silivri': 'istanbul-silivri-namaz-vakitleri',
      'istanbul-sultanbeyli': 'istanbul-sultanbeyli-namaz-vakitleri',
      'istanbul-sultangazi': 'istanbul-sultangazi-namaz-vakitleri',
      'istanbul-tuzla': 'istanbul-tuzla-namaz-vakitleri',
      'istanbul': 'istanbul-namaz-vakitleri',
      'ankara': 'ankara-namaz-vakitleri',
      'izmir': 'izmir-namaz-vakitleri',
      'bursa': 'bursa-namaz-vakitleri',
      'antalya': 'antalya-namaz-vakitleri',
      'adana': 'adana-namaz-vakitleri',
      'konya': 'konya-namaz-vakitleri',
      'gaziantep': 'gaziantep-namaz-vakitleri',
      'sanliurfa': 'sanliurfa-namaz-vakitleri'
    };

    const targetKey = (city.districtId || city.id || city.cityId || 'istanbul-esenyurt').toLowerCase();
    return slugMap[targetKey] || `${targetKey.replace(/_/g, '-')}-namaz-vakitleri`;
  }

  // 1. ÖNCELİKLİ KAYNAK: https://www.diyanethaber.com.tr/istanbul-esenyurt-namaz-vakitleri
  async fetchFromDiyanetHaber(city) {
    const slug = this.getDiyanetHaberSlug(city);
    const primaryUrl = `https://www.diyanethaber.com.tr/${slug}`;
    const proxyUrls = [
      primaryUrl,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(primaryUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(primaryUrl)}`
    ];

    let html = null;
    for (const url of proxyUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const txt = await res.text();
          if (txt && (txt.includes('time-box') || txt.includes('diyanethaber'))) {
            html = txt;
            break;
          }
        }
      } catch (err) {
        // try next proxy
      }
    }

    if (!html) throw new Error('Diyanethaber içeriği alınamadı');

    const monthlyBuckets = {};
    const trMonths = {
      'ocak': 1, 'oca': 1, 'subat': 2, 'şubat': 2, 'sub': 2, 'şub': 2,
      'mart': 3, 'mar': 3, 'nisan': 4, 'nis': 4, 'mayis': 5, 'mayıs': 5, 'may': 5,
      'haziran': 6, 'haz': 6, 'temmuz': 7, 'tem': 7, 'agustos': 8, 'ağustos': 8, 'agu': 8, 'ağu': 8,
      'eylul': 9, 'eylül': 9, 'eyl': 9, 'ekim': 10, 'eki': 10,
      'kasim': 11, 'kasım': 11, 'kas': 11, 'aralik': 12, 'aralık': 12, 'ara': 12
    };

    const currentYear = new Date().getFullYear();

    // Parse Hadith & Hijri Date
    const hadithMatch = html.match(/class="hadith[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (hadithMatch) {
      const hadithTxt = hadithMatch[1].replace(/<[^>]+>/g, '').trim();
      localStorage.setItem('saatvakit_daily_hadith', hadithTxt);
    }
    const hijriMatch = html.match(/<span class="text-success">([^<]+)<\/span>/i);
    if (hijriMatch) {
      localStorage.setItem('saatvakit_hijri_date', hijriMatch[1].trim());
    }

    // Parse Monthly Table
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rows) {
      const tds = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
      if (tds && tds.length >= 8) {
        const clean = tds.map(td => td.replace(/<[^>]+>/g, '').trim());
        const dateParts = clean[0].split(/\s+/);
        if (dateParts.length >= 2) {
          const day = parseInt(dateParts[0], 10);
          const mKey = dateParts[1].toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü]/g, '');
          const month = trMonths[mKey];
          if (day && month) {
            const weekday = dateParts[2] || '';
            const hijri = clean[1];
            const bucketKey = `${currentYear}-${month}`;
            if (!monthlyBuckets[bucketKey]) monthlyBuckets[bucketKey] = [];

            const exists = monthlyBuckets[bucketKey].some(item => parseInt(item.date.gregorian.day, 10) === day);
            if (!exists) {
              monthlyBuckets[bucketKey].push({
                date: {
                  readable: `${day.toString().padStart(2, '0')} ${dateParts[1]} ${currentYear}`,
                  timestamp: new Date(currentYear, month - 1, day).getTime().toString(),
                  hijri: hijri,
                  gregorian: {
                    day: day.toString().padStart(2, '0'),
                    month: { number: month },
                    year: currentYear.toString(),
                    weekday: { en: weekday }
                  }
                },
                timings: {
                  Imsak: clean[2],
                  Fajr: clean[2],
                  Sunrise: clean[3],
                  Dhuhr: clean[4],
                  Asr: clean[5],
                  Sunset: clean[6],
                  Maghrib: clean[6],
                  Isha: clean[7]
                }
              });
            }
          }
        }
      }
    }

    // Parse Today's Exact Box if present
    const timeBoxMatches = [...html.matchAll(/<h4 class="text-uppercase">\s*([^<]+)\s*<\/h4>\s*<div class="h3">\s*(\d{2}:\d{2})\s*<\/div>/gi)];
    if (timeBoxMatches.length >= 6) {
      const todayMap = {};
      timeBoxMatches.forEach(m => {
        const label = m[1].trim().toLocaleLowerCase('tr-TR');
        const time = m[2].trim();
        if (label.includes('imsak')) todayMap.Imsak = todayMap.Fajr = time;
        else if (label.includes('güneş') || label.includes('gunes')) todayMap.Sunrise = time;
        else if (label.includes('öğle') || label.includes('ogle')) todayMap.Dhuhr = time;
        else if (label.includes('ikindi')) todayMap.Asr = time;
        else if (label.includes('akşam') || label.includes('aksam')) todayMap.Sunset = todayMap.Maghrib = time;
        else if (label.includes('yatsı') || label.includes('yatsi')) todayMap.Isha = time;
      });

      const today = new Date();
      const tDay = today.getDate();
      const tMonth = today.getMonth() + 1;
      const tKey = `${currentYear}-${tMonth}`;
      if (!monthlyBuckets[tKey]) monthlyBuckets[tKey] = [];

      const todayEntry = monthlyBuckets[tKey].find(item => parseInt(item.date.gregorian.day, 10) === tDay);
      if (todayEntry) {
        todayEntry.timings = { ...todayEntry.timings, ...todayMap };
      }
      localStorage.setItem('saatvakit_diyanethaber_today', JSON.stringify(todayMap));
    }

    // Save all months to cache
    Object.keys(monthlyBuckets).forEach(key => {
      monthlyBuckets[key].sort((a, b) => parseInt(a.date.gregorian.day, 10) - parseInt(b.date.gregorian.day, 10));
      const [y, m] = key.split('-');
      const cacheKey = this.getCacheKey(city, y, m);
      localStorage.setItem(cacheKey, JSON.stringify(monthlyBuckets[key]));
    });

    return monthlyBuckets;
  }

  // Directly fetch & parse official 365-day Diyanet Web Page (namazvakitleri.diyanet.gov.tr)
  async fetchFromDiyanetWeb(city) {
    const meta = this.getDiyanetLocationMeta(city);
    const url = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${meta.id}/${meta.slug}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const trMonths = {
      'ocak': 1, 'subat': 2, 'mart': 3, 'nisan': 4, 'mayis': 5,
      'haziran': 6, 'temmuz': 7, 'agustos': 8, 'eylul': 9,
      'ekim': 10, 'kasim': 11, 'aralik': 12
    };

    const normalizeTr = (s) => this.decodeHtmlEntities(s).toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

    // Match all vakit tables from Diyanet page (Weekly, Monthly, Yearly)
    const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    if (!tables || tables.length === 0) throw new Error('Diyanet vakit tablosu bulunamadı');

    const monthlyBuckets = {};

    tables.forEach(table => {
      const rows = table.match(/<tr[\s\S]*?<\/tr>/gi);
      if (!rows || rows.length < 2) return;

      for (let i = 1; i < rows.length; i++) {
        const tds = rows[i].match(/<td[\s\S]*?<\/td>/gi);
        if (tds && tds.length >= 8) {
          const clean = tds.map(td => this.decodeHtmlEntities(td.replace(/<[^>]+>/g, '')).trim());
          const dateParts = clean[0].split(/\s+/);
          if (dateParts.length >= 3) {
            const dayNum = parseInt(dateParts[0], 10);
            const monthNormalized = normalizeTr(dateParts[1]);
            const monthNum = trMonths[monthNormalized] || 1;
            const yearNum = parseInt(dateParts[2], 10);

            const bucketKey = `${yearNum}-${monthNum}`;
            if (!monthlyBuckets[bucketKey]) monthlyBuckets[bucketKey] = [];

            // Avoid duplicate days in the same bucket
            const exists = monthlyBuckets[bucketKey].some(item => parseInt(item.date.gregorian.day, 10) === dayNum);
            if (!exists) {
              monthlyBuckets[bucketKey].push({
                date: {
                  readable: `${dayNum.toString().padStart(2, '0')} ${this.decodeHtmlEntities(dateParts[1])} ${yearNum}`,
                  timestamp: new Date(yearNum, monthNum - 1, dayNum).getTime().toString(),
                  gregorian: {
                    day: dayNum.toString().padStart(2, '0'),
                    month: { number: monthNum },
                    year: yearNum.toString(),
                    weekday: { en: dateParts[3] || '' }
                  }
                },
                timings: {
                  Imsak: clean[2],
                  Fajr: clean[2],
                  Sunrise: clean[3],
                  Dhuhr: clean[4],
                  Asr: clean[5],
                  Sunset: clean[6],
                  Maghrib: clean[6],
                  Isha: clean[7]
                }
              });
            }
          }
        }
      }
    });

    // Sort each monthly bucket chronologically
    Object.keys(monthlyBuckets).forEach(key => {
      monthlyBuckets[key].sort((a, b) => parseInt(a.date.gregorian.day, 10) - parseInt(b.date.gregorian.day, 10));
    });

    // Save all parsed months to localStorage cache
    Object.keys(monthlyBuckets).forEach(key => {
      const [y, m] = key.split('-');
      const cacheKey = this.getCacheKey(city, y, m);
      localStorage.setItem(cacheKey, JSON.stringify(monthlyBuckets[key]));
    });

    return monthlyBuckets;
  }

  // Fetch monthly prayer calendar (Diyanet Official Website / Aladhan Method 13)
  async getMonthlyPrayerTimes(year, month) {
    const city = this.selectedCity;
    const cacheKey = this.getCacheKey(city, year, month);
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }

    // 1. ÖNCELİKLİ KAYNAK: Diyanet Haber (diyanethaber.com.tr)
    try {
      const haberBuckets = await this.fetchFromDiyanetHaber(city);
      const targetBucket = haberBuckets[`${year}-${month}`];
      if (targetBucket && targetBucket.length > 0) {
        return targetBucket;
      }
    } catch (haberErr) {
      console.log('Diyanet Haber fetch note, trying Diyanet Web fallback:', haberErr.message);
    }

    // 2. Try Direct Diyanet Official Website (namazvakitleri.diyanet.gov.tr)
    try {
      const diyanetBuckets = await this.fetchFromDiyanetWeb(city);
      const targetBucket = diyanetBuckets[`${year}-${month}`];
      if (targetBucket && targetBucket.length > 0) {
        return targetBucket;
      }
    } catch (diyanetErr) {
      console.log('Direct Diyanet website fetch note, trying Aladhan/Offline fallback:', diyanetErr.message);
    }

    // 3. Try Aladhan API with Diyanet Method 13
    try {
      const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${city.lat}&longitude=${city.lng}&method=13`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.code === 200 && Array.isArray(json.data)) {
          localStorage.setItem(cacheKey, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Network fetch fallback to offline Diyanet calculation:', err);
    }

    // 3. Fallback: Compute offline month with exact coordinates and Diyanet angles
    const offlineMonth = this.generateOfflineMonth(year, month, city);
    localStorage.setItem(cacheKey, JSON.stringify(offlineMonth));
    return offlineMonth;
  }

  // Download and cache all 12 months of the year from Diyanet
  async downloadFullYear(year, onProgress) {
    const city = this.selectedCity;

    // 1. Try Direct Diyanet Web Page Fetch (Provides all 365 days in one single official request)
    try {
      if (onProgress) onProgress(1, 2);
      const buckets = await this.fetchFromDiyanetWeb(city);
      if (buckets && Object.keys(buckets).length > 0) {
        if (onProgress) onProgress(2, 2);
        const locId = city.districtId || city.id || 'istanbul';
        localStorage.setItem(`saatvakit_yearly_downloaded_${locId}_${year}`, Date.now().toString());
        return buckets;
      }
    } catch (e) {
      console.log('Direct Diyanet year fetch, trying monthly sync:', e.message);
    }

    // 2. Monthly fallback
    const results = {};
    for (let m = 1; m <= 12; m++) {
      if (onProgress) onProgress(m, 12);
      try {
        const url = `https://api.aladhan.com/v1/calendar/${year}/${m}?latitude=${city.lat}&longitude=${city.lng}&method=13`;
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          if (json.code === 200 && Array.isArray(json.data)) {
            const cacheKey = this.getCacheKey(city, year, m);
            localStorage.setItem(cacheKey, JSON.stringify(json.data));
            results[m] = json.data;
            continue;
          }
        }
      } catch (err) {
        console.warn(`Year fetch error for month ${m}:`, err);
      }

      // Fallback offline calculation for month m
      const offlineMonth = this.generateOfflineMonth(year, m, city);
      const cacheKey = this.getCacheKey(city, year, m);
      localStorage.setItem(cacheKey, JSON.stringify(offlineMonth));
      results[m] = offlineMonth;
    }
    const locId = city.districtId || city.id || 'istanbul';
    localStorage.setItem(`saatvakit_yearly_downloaded_${locId}_${year}`, Date.now().toString());
    return results;
  }

  // Get Today's 6 standard Prayer Times
  async getTodayTimings() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const monthlyData = await this.getMonthlyPrayerTimes(year, month);
    const todayData = monthlyData.find(item => {
      const g = item.date.gregorian;
      return parseInt(g.day) === day && parseInt(g.month.number) === month && parseInt(g.year) === year;
    }) || monthlyData[day - 1] || monthlyData[0];

    // Clean HH:MM format (remove (EET) etc if any)
    const cleanTime = (t) => {
      if (!t) return '00:00';
      const match = t.match(/(\d{2}:\d{2})/);
      return match ? match[1] : t.substring(0, 5);
    };

    // If Diyanet Haber Today box is saved in localStorage, prioritize it for today!
    let dhToday = null;
    try {
      dhToday = JSON.parse(localStorage.getItem('saatvakit_diyanethaber_today') || 'null');
    } catch (e) {}

    const timings = todayData.timings;
    return {
      imsak: cleanTime(dhToday?.Imsak || dhToday?.Fajr || timings.Fajr || timings.Imsak),
      gunes: cleanTime(dhToday?.Sunrise || timings.Sunrise),
      ogle: cleanTime(dhToday?.Dhuhr || timings.Dhuhr),
      ikindi: cleanTime(dhToday?.Asr || timings.Asr),
      aksam: cleanTime(dhToday?.Maghrib || dhToday?.Sunset || timings.Maghrib || timings.Sunset),
      yatsi: cleanTime(dhToday?.Isha || timings.Isha),
      raw: todayData
    };
  }

  // Compute Active Prayer & Countdown to Next Prayer
  calculateStatus(timings) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const prayers = [
      { key: 'imsak', name: 'İmsak', time: timings.imsak, mins: toMinutes(timings.imsak), icon: 'moon' },
      { key: 'gunes', name: 'Güneş', time: timings.gunes, mins: toMinutes(timings.gunes), icon: 'sun-dim' },
      { key: 'ogle', name: 'Öğle', time: timings.ogle, mins: toMinutes(timings.ogle), icon: 'sun' },
      { key: 'ikindi', name: 'İkindi', time: timings.ikindi, mins: toMinutes(timings.ikindi), icon: 'cloud-sun' },
      { key: 'aksam', name: 'Akşam', time: timings.aksam, mins: toMinutes(timings.aksam), icon: 'sunset' },
      { key: 'yatsi', name: 'Yatsı', time: timings.yatsi, mins: toMinutes(timings.yatsi), icon: 'moon-star' }
    ];

    let currentPrayer = prayers[prayers.length - 1]; // Default Yatsı (after midnight until imsak)
    let nextPrayer = prayers[0];                    // Next is İmsak

    for (let i = 0; i < prayers.length; i++) {
      if (nowMins >= prayers[i].mins) {
        currentPrayer = prayers[i];
        nextPrayer = prayers[(i + 1) % prayers.length];
      }
    }

    // Calculate remaining seconds to next prayer
    let targetMins = nextPrayer.mins;
    if (targetMins <= nowMins) {
      targetMins += 24 * 60; // Next day
    }

    const diffSeconds = Math.max(0, Math.floor((targetMins - nowMins) * 60));
    const hoursRemaining = Math.floor(diffSeconds / 3600);
    const minsRemaining = Math.floor((diffSeconds % 3600) / 60);
    const secsRemaining = diffSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');
    const remainingFormatted = `${pad(hoursRemaining)}:${pad(minsRemaining)}:${pad(secsRemaining)}`;

    return {
      currentPrayer,
      nextPrayer,
      remainingSeconds: diffSeconds,
      remainingFormatted,
      prayers
    };
  }
}

export const prayerService = new PrayerService();
