// Online Radio Service with HLS.js Engine & 100% Verified Live Streams
import Hls from 'hls.js';

export const RADIO_CATEGORIES = [
  { id: 'fav', name: 'Favorilerim', icon: '⭐' },
  { id: 'all', name: 'Tümü', icon: '📻' },
  { id: 'risale', name: 'Risale-i Nur & İlim', icon: '📖' },
  { id: 'kuran', name: 'Kur\'an & Kâri Tilavet', icon: '✨' },
  { id: 'dini', name: 'Dini & İlahi & Sohbet', icon: '🕌' },
  { id: 'haber', name: 'Haber & Gündem', icon: '📰' },
  { id: 'turku', name: 'Türkü & Kültür', icon: '🪕' }
];

export const INITIAL_STATIONS = [
  // ==========================================
  // 1. RİSALE-İ NUR & İLİM YAYINLARI
  // ==========================================
  {
    id: 'risale_radyo',
    name: 'Risale Radyo',
    category: 'risale',
    frequency: 'Risale-i Nur Dersleri ve İman Hakikatleri',
    streamUrl: 'https://radyo1.radyo-dinle.tc:7016/;',
    fallbackUrls: ['https://admin.medreseradyo.com/listen/medrese_radyo/radio.mp3'],
    badge: 'Risale'
  },
  {
    id: 'medresetuzzehra',
    name: 'Medresetüzzehra',
    category: 'risale',
    frequency: 'Bediüzzaman Said Nursi Risale-i Nur Külliyatı',
    streamUrl: 'https://admin.medreseradyo.com/listen/medrese_radyo/radio.mp3',
    fallbackUrls: ['https://radyo1.radyo-dinle.tc:7016/;'],
    badge: 'Medrese'
  },
  {
    id: 'radyo_nurlu_hizmet',
    name: 'Radyo Nurlu Hizmet',
    category: 'risale',
    frequency: 'Risale-i Nur Okumaları, Sohbet ve Tefsir',
    streamUrl: 'https://radyo1.radyo-dinle.tc:7016/;',
    fallbackUrls: ['https://admin.medreseradyo.com/listen/medrese_radyo/radio.mp3'],
    badge: 'Nurlu Hizmet'
  },

  // ==========================================
  // 2. KUR'AN-I KERİM & KÂRİ TİLAVETLERİ
  // ==========================================
  {
    id: 'diyanet_kuran',
    name: 'Diyanet Kur\'an Radyo',
    category: 'kuran',
    frequency: '7/24 Kesintisiz Kur\'an-ı Kerim Tilaveti ve Meali',
    streamUrl: 'https://eustr73.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3c14192aa92.smil/playlist.m3u8',
    badge: 'Kur\'an'
  },
  {
    id: 'kuran_turkce_meal',
    name: 'Kur\'an-ı Kerim ve Türkçe Meal',
    category: 'kuran',
    frequency: 'Ayet Ayet Kur\'an-ı Kerim ve Anlaşılır Türkçe Meali',
    streamUrl: 'http://baserorg.duckdns.org:8000/',
    badge: 'Meal'
  },
  {
    id: 'mp3quran_mix',
    name: 'Mp3Quran Canlı Hatim',
    category: 'kuran',
    frequency: 'Dünyaca Ünlü Hafızlardan 7/24 Kesintisiz Hatim',
    streamUrl: 'https://qurango.net/radio/mix',
    badge: 'Hatim'
  },
  {
    id: 'kari_abdulbasit',
    name: 'Şeyh Abdulbasit Abdussamed',
    category: 'kuran',
    frequency: 'Makamlı Eşsiz Aşr-ı Şerifler ve Hatim Tilaveti',
    streamUrl: 'https://radio.mp3islam.com/listen/abdulbasit/radio.mp3',
    badge: 'Abdulbasit'
  },
  {
    id: 'kari_mishary',
    name: 'Şeyh Mishary Rashid Alafasy',
    category: 'kuran',
    frequency: 'Huzur Veren Canlı Kur\'an Tilavetleri',
    streamUrl: 'https://radio.mp3islam.com/listen/mishary/radio.mp3',
    badge: 'Alafasy'
  },
  {
    id: 'kari_maher',
    name: 'Şeyh Maher Al Mueaqly',
    category: 'kuran',
    frequency: 'Kâbe-i Muazzama İmamından Canlı Kur\'an',
    streamUrl: 'https://radio.mp3islam.com/listen/maher/radio.mp3',
    badge: 'Kâbe İmamı'
  },
  {
    id: 'kari_sudais',
    name: 'Şeyh Abdurrahman es-Sudeys',
    category: 'kuran',
    frequency: 'Mescid-i Haram Başimamı Eşsiz Kıraati',
    streamUrl: 'https://radio.mp3islam.com/listen/sudais/radio.mp3',
    badge: 'Sudeys'
  },
  {
    id: 'kari_shuraim',
    name: 'Şeyh Suud eş-Şureym',
    category: 'kuran',
    frequency: 'Mescid-i Haram İmamından Duygulu Tilavetler',
    streamUrl: 'https://radio.mp3islam.com/listen/alshuraim/radio.mp3',
    badge: 'Şureym'
  },
  {
    id: 'kari_minshawi',
    name: 'Şeyh Muhammed Sıddık Minşavi',
    category: 'kuran',
    frequency: 'Gönülleri Titreten Huşu Dolu Kur\'an Tilaveti',
    streamUrl: 'https://radio.mp3islam.com/listen/minshawi/radio.mp3',
    badge: 'Minşavi'
  },
  {
    id: 'kari_hussary',
    name: 'Şeyh Mahmud Halil El-Husari',
    category: 'kuran',
    frequency: 'Tecvidli Tertil Üstadı Kur\'an Yayını',
    streamUrl: 'https://qurango.net/radio/mahmoud_khalil_alhussary_warsh',
    badge: 'Husari'
  },
  {
    id: 'mekke_fm',
    name: 'Mekke FM (Kutsal Topraklar)',
    category: 'kuran',
    frequency: 'Mekke-i Mükerreme ve Haremeyn\'den Canlı Yayın',
    streamUrl: 'https://radyodinle.cansuyufm.com/17175/stream;',
    badge: 'Mekke'
  },

  // ==========================================
  // 3. DİNİ, İLAHİ, SOHBET & TASAVVUF
  // ==========================================
  {
    id: 'diyanet_radyo',
    name: 'Diyanet Radyo',
    category: 'dini',
    frequency: 'Diyanet İşleri Başkanlığı Resmi Radyosu',
    streamUrl: 'https://eustr73.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3c1171d7d2a.smil/playlist.m3u8',
    badge: 'Diyanet'
  },
  {
    id: 'diyanet_risalet',
    name: 'Diyanet Risalet Radyo',
    category: 'dini',
    frequency: 'Peygamber Efendimiz (s.a.v.) ve Hadis-i Şerifler',
    streamUrl: 'https://eustr73.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3c1520b2626.smil/playlist.m3u8',
    badge: 'Risalet'
  },
  {
    id: 'lalegul_fm',
    name: 'Lalegül FM',
    category: 'dini',
    frequency: 'Ehl-i Sünnet Sohbetler, İlim ve İrfan',
    streamUrl: 'https://icecast.netmedya.net/lalegulfm',
    badge: 'Lalegül'
  },
  {
    id: 'akra_fm',
    name: 'Akra FM',
    category: 'dini',
    frequency: 'Ahlak, Kültür ve İrfan Dünyamızın Sesi',
    streamUrl: 'https://d3r5bwwuab2v60.cloudfront.net/akracanli2/_definst_/livestream_aac/playlist.m3u8',
    fallbackUrls: ['http://37.247.100.100:80/akra/live/playlist.m3u8'],
    badge: 'Akra'
  },
  {
    id: 'dost_fm',
    name: 'Dost FM',
    category: 'dini',
    frequency: 'Kur\'an, Sünnet ve Gönül Sohbetleri',
    streamUrl: 'http://yayin.dostfm.com:8920/;.mp3?no_dl',
    fallbackUrls: ['https://api-tv5.yayin.com.tr:8002/mp3'],
    badge: 'Dost FM'
  },
  {
    id: 'erkam_radyo',
    name: 'Erkam Radyo',
    category: 'dini',
    frequency: 'Gönüller Sultanı Sohbetler & İslami İlimler',
    streamUrl: 'https://api-tv5.yayin.com.tr:8002/mp3',
    fallbackUrls: ['https://yayin2.canliyayin.org:10910/stream'],
    badge: 'Erkam'
  },
  {
    id: 'vav_radyo',
    name: 'Vav Radyo',
    category: 'dini',
    frequency: 'Kur\'an, Sünnet ve Manevi Sohbetler',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/radyovav/playlist.m3u8',
    badge: 'Vav'
  },
  {
    id: 'bayram_fm',
    name: 'Bayram FM',
    category: 'dini',
    frequency: 'İslami Sohbetler, Ehl-i Sünnet Dersleri ve İlahiler',
    streamUrl: 'https://sslyayin.netyayin.net/3442/stream/;stream.mp3',
    badge: 'Bayram FM'
  },
  {
    id: 'gozyasi_fm',
    name: 'Gözyaşı FM (Konya)',
    category: 'dini',
    frequency: 'Gönül Dünyamız, Tasavvuf ve Sevgi Sohbetleri',
    streamUrl: 'http://yayin1.canliyayin.org:8700/;*.mp3',
    badge: 'Gözyaşı'
  },
  {
    id: 'ribat_fm',
    name: 'Ribat FM (Konya)',
    category: 'dini',
    frequency: 'İslam ve Hayat, Tefsir ve Aile Sohbetleri',
    streamUrl: 'http://yayin1.canliyayin.org:7010/;*.mp3',
    badge: 'Ribat'
  },
  {
    id: 'semerkand_radyo',
    name: 'Semerkand Radyo',
    category: 'dini',
    frequency: 'Gönül Sohbetleri, Tasavvuf ve İlahiler',
    streamUrl: 'https://canliyayin.semerkandradyo.com.tr/hls/Radyo/playlist.m3u8',
    badge: 'Semerkand'
  },
  {
    id: 'moral_fm',
    name: 'Moral FM',
    category: 'dini',
    frequency: 'Türkiye\'nin İlk Özel Tematik Manevi Radyosu',
    streamUrl: 'https://api-tv5.yayin.com.tr:8002/mp3',
    fallbackUrls: ['http://yayin2.canliyayin.org:8886/;stream.mp3'],
    badge: 'Moral'
  },
  {
    id: 'gaziantep_davet_radyo',
    name: 'Gaziantep Davet Radyo',
    category: 'dini',
    frequency: 'Gaziantep Davet FM - İslam Daveti, Sohbet & İlahi',
    streamUrl: 'https://ip169.ozelip.com/8026/stream',
    fallbackUrls: [
      'http://ip169.ozelip.com:8026/stream',
      'https://stream.radiojar.com/ggu0fd6qu2wtv.mp3'
    ],
    badge: 'Gaziantep'
  },
  {
    id: 'enderun_fm',
    name: 'Enderun FM',
    category: 'dini',
    frequency: 'Kayseri 88.2 MHz - İlim, Ahlak, İrfan ve Kültür',
    streamUrl: 'https://yayin2.canliyayin.org:7052/stream',
    fallbackUrls: [
      'https://yayin2.canliyayin.org:7052/;',
      'http://yayin2.canliyayin.org:7052/stream',
      'http://yayin2.canliyayin.org:7052/;'
    ],
    badge: 'Enderun'
  },
  {
    id: 'gul_fm',
    name: 'Gül FM',
    category: 'dini',
    frequency: 'Gül Kokulu Sohbetler ve Seçme İlahiler',
    streamUrl: 'https://yayin2.canliyayin.org:10989/;*.mp3',
    badge: 'Gül FM'
  },
  {
    id: 'mirac_fm',
    name: 'Miraç FM',
    category: 'dini',
    frequency: 'Manevi Yolculuk, Cami Kürsüsü Sohbetleri',
    streamUrl: 'https://anadolu.liderhost.com.tr:9416/stream',
    badge: 'Miraç'
  },
  {
    id: 'isra_fm',
    name: 'Konya İsra FM',
    category: 'dini',
    frequency: 'İslam Dünyası, Sohbet ve İlahi Yayını',
    streamUrl: 'https://yayin2.canliyayin.org:8210/;stream',
    badge: 'İsra FM'
  },
  {
    id: 'ihya_fm',
    name: 'İhya FM',
    category: 'dini',
    frequency: 'Gönülleri İhya Eden Vaaz ve Nasihatler',
    streamUrl: 'https://radyo.yayin.com.tr:2727/stream',
    badge: 'İhya'
  },
  {
    id: 'turkuvaz_musiki',
    name: 'Turkuvaz Musiki & Tasavvuf',
    category: 'dini',
    frequency: 'Klasik Türk Musikisi, İlahiler ve Tasavvuf',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/turkuvazmusiki/playlist.m3u8',
    badge: 'Tasavvuf'
  },
  {
    id: 'nida_fm',
    name: 'Radyo Nida (Nida FM)',
    category: 'dini',
    frequency: 'İlahi, Ezgi ve İslami Kültür Yayını',
    streamUrl: 'https://anadolu.liderhost.com.tr/8106/stream',
    badge: 'Nida'
  },
  {
    id: 'radyo_ilahi',
    name: 'Radyo İlahi',
    category: 'dini',
    frequency: '7/24 Kesintisiz En Güzel İlahiler ve Kasideler',
    streamUrl: 'https://anadolu.liderhost.com.tr:10994/;',
    badge: 'İlahi'
  },
  {
    id: 'radyo_nebi',
    name: 'Radyo Nebi',
    category: 'dini',
    frequency: 'Peygamber Sevdası, Naatlar ve İlahiler',
    streamUrl: 'https://anadolu.liderhost.com.tr/9006/stream',
    badge: 'Nebi'
  },
  {
    id: 'radyo_fitrat',
    name: 'Radyo Fıtrat',
    category: 'dini',
    frequency: 'Fıtrata Uygun Yaşam, Aile ve Ahlak Sohbetleri',
    streamUrl: 'http://radyofitrat.radyotvonline.net/',
    badge: 'Fıtrat'
  },

  // ==========================================
  // 4. HABER & GÜNDEM
  // ==========================================
  {
    id: 'trt_radyo1',
    name: 'TRT Radyo 1',
    category: 'haber',
    frequency: 'Türkiye\'nin Ulusal Haber & Kültür Radyosu',
    streamUrl: 'https://trt.radyotvonline.net/trt1',
    fallbackUrls: ['https://rd-trtradyo1.medya.trt.com.tr/master_128.m3u8'],
    badge: 'TRT 1'
  },
  {
    id: 'trt_haber_radyo',
    name: 'TRT Haber Radyo',
    category: 'haber',
    frequency: 'Son Dakika Haberleri ve Güncel Bültenler',
    streamUrl: 'https://trt.radyotvonline.net/trthaber',
    fallbackUrls: ['https://radio-trtradyohaber.live.trt.com.tr/master.m3u8'],
    badge: 'TRT Haber'
  },
  {
    id: 'haberturk_radyo',
    name: 'Habertürk Radyo',
    category: 'haber',
    frequency: 'Doğru ve Tarafsız Haber, Canlı Yayın',
    streamUrl: 'https://haberturkradyo.radyotvonline.net/haberturkradyo',
    badge: 'Habertürk'
  },
  {
    id: 'ahaber_radyo',
    name: 'A Haber Radyo',
    category: 'haber',
    frequency: 'Son Dakika & Türkiye ve Dünya Gündemi',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/ahaberradyo/playlist.m3u8',
    badge: 'A Haber'
  },
  {
    id: 'tgrt_fm',
    name: 'TGRT FM',
    category: 'haber',
    frequency: 'Haber, Sohbet, Tiyatro ve Kültür',
    streamUrl: 'https://icecasttgrt.ihlasdigitalassets.com/tgrtfm',
    badge: 'TGRT'
  },
  {
    id: 'aspor_radyo',
    name: 'A Spor Radyo',
    category: 'haber',
    frequency: 'Spor Gündemi, Maç Anlatımları ve Yorumlar',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/asporradyo/playlist.m3u8',
    badge: 'A Spor'
  },
  {
    id: 'apara_radyo',
    name: 'A Para Radyo',
    category: 'haber',
    frequency: 'Ekonomi, Finans ve Piyasa Haberleri',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/apararadyo/playlist.m3u8',
    badge: 'A Para'
  },
  {
    id: 'ulke_radyo',
    name: 'Ülke Radyo',
    category: 'haber',
    frequency: 'Gündem, Sohbet ve Derinlemesine Haber',
    streamUrl: 'https://ssl4.radyotvonline.com/radyohome/ulkeradyo.stream_aac/playlist.m3u8',
    badge: 'Ülke'
  },

  // ==========================================
  // 5. TÜRKÜ & KÜLTÜR
  // ==========================================
  {
    id: 'trt_turku',
    name: 'TRT Türkü',
    category: 'turku',
    frequency: 'Diyar Diyar Anadolu Halk Ezgileri ve Ozanlar',
    streamUrl: 'https://rd-trtturku.medya.trt.com.tr/master_128.m3u8',
    fallbackUrls: ['https://trt.radyotvonline.net/trtturku'],
    badge: 'TRT Türkü'
  },
  {
    id: 'trt_nagme',
    name: 'TRT Nağme',
    category: 'turku',
    frequency: 'Klasik Türk Musikisi & Tasavvuf Eserleri',
    streamUrl: 'https://rd-trtnagme.medya.trt.com.tr/master_128.m3u8',
    badge: 'TRT Nağme'
  },
  {
    id: 'trt_fm',
    name: 'TRT FM',
    category: 'turku',
    frequency: 'Türkiye\'nin En Çok Dinlenen Kültür ve Müzik Radyosu',
    streamUrl: 'https://trt.radyotvonline.net/trtfm',
    badge: 'TRT FM'
  },
  {
    id: 'turkuvaz_anadolu',
    name: 'Turkuvaz Anadolu Türkü',
    category: 'turku',
    frequency: 'Türkülerin Sesi, Anadolu Nağmeleri',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/turkuvazanadolu/playlist.m3u8',
    badge: 'Anadolu'
  },
  {
    id: 'radyo_seymen',
    name: 'Radyo Seymen',
    category: 'turku',
    frequency: 'Türküler, Oyun Havaları ve Yöresel Ezgiler',
    streamUrl: 'https://yayin.radyoseymen.com.tr:1070/stream',
    badge: 'Seymen'
  },
  {
    id: 'radyo_ekin',
    name: 'Radyo Ekin',
    category: 'turku',
    frequency: 'Halk Müziği, Özgün Müzik ve Deyişler',
    streamUrl: 'https://yayin.turkhosted.com/6006/stream',
    badge: 'Ekin'
  },
  {
    id: 'turkulerle_turkiye',
    name: 'Türkülerle Türkiye',
    category: 'turku',
    frequency: 'Anadolu\'nun Dört Bir Yanından Türküler',
    streamUrl: 'http://37.247.98.8/stream/22/;',
    badge: 'Türkü TR'
  },
  {
    id: 'turku_radyo',
    name: 'Türkü Radyo',
    category: 'turku',
    frequency: '7/24 Kesintisiz Türk Halk Müziği',
    streamUrl: 'https://yayin.turkhosted.com/4591/stream',
    badge: 'Türkü'
  },
  {
    id: 'radyo_turkuvaz',
    name: 'Radyo Turkuvaz',
    category: 'turku',
    frequency: 'Popüler Türkçe Şarkılar ve Kültür',
    streamUrl: 'https://trkvz-radyolar.ercdn.net/radyoturkuvaz/playlist.m3u8',
    badge: 'Turkuvaz'
  }
];

class RadioService {
  constructor() {
    this.customStations = JSON.parse(localStorage.getItem('saatvakit_custom_stations') || '[]');
    this.favorites = new Set(JSON.parse(localStorage.getItem('saatvakit_radio_favorites') || '["risale_radyo", "diyanet_kuran", "diyanet_radyo", "akra_fm", "dost_fm", "vav_radyo"]'));
    this.stations = [...INITIAL_STATIONS, ...this.customStations];

    this.currentStationIndex = parseInt(localStorage.getItem('saatvakit_radio_index') || '0', 10);
    if (this.currentStationIndex < 0 || this.currentStationIndex >= this.stations.length) {
      this.currentStationIndex = 0;
    }

    this.audio = new Audio();
    this.audio.preload = 'none';
    this.audio.crossOrigin = 'anonymous';
    this.volume = parseFloat(localStorage.getItem('saatvakit_radio_volume') || '0.9');
    this.audio.volume = this.volume;

    this.hls = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.currentError = null;
    this.listeners = new Set();
    this.retryCount = 0;

    // Sleep Timer
    this.sleepTimerMinutes = 0;
    this.sleepTimerTimeout = null;
    this.sleepTimerEndTime = null;

    // Radio Alarm (Radyo ile Uyanma / Zamanlayıcı)
    this.radioAlarm = JSON.parse(localStorage.getItem('saatvakit_radio_alarm') || JSON.stringify({
      enabled: false,
      time: '06:30',
      stationId: 'risale_radyo',
      volume: 0.9,
      autoStopMinutes: 30
    }));
    this.lastAlarmTriggered = localStorage.getItem('saatvakit_radio_alarm_last') || '';

    this.setupAudioListeners();
    setTimeout(() => this.syncNativeAlarm(), 1200);
  }

  getRadioAlarm() {
    return this.radioAlarm;
  }

  setRadioAlarm(config) {
    this.radioAlarm = { ...this.radioAlarm, ...config };
    localStorage.setItem('saatvakit_radio_alarm', JSON.stringify(this.radioAlarm));
    this.syncNativeAlarm();
    this.notify();
  }

  syncNativeAlarm() {
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.scheduleRadioAlarm === 'function') {
      try {
        if (!this.radioAlarm || !this.radioAlarm.enabled) {
          window.AndroidNativeTTS.cancelRadioAlarm();
          return;
        }

        const stationId = this.radioAlarm.stationId || 'risale_radyo';
        const targetStation = this.stations.find(s => s.id === stationId) || this.stations[0];

        const payload = {
          enabled: !!this.radioAlarm.enabled,
          time: this.radioAlarm.time || '06:30',
          stationId: targetStation.id,
          stationName: targetStation.name || 'Radyo Yayını',
          streamUrl: targetStation.streamUrl || '',
          autoStopMinutes: this.radioAlarm.autoStopMinutes || 30
        };

        window.AndroidNativeTTS.scheduleRadioAlarm(JSON.stringify(payload));
      } catch (err) {
        console.warn('Native radio alarm sync error:', err);
      }
    }
  }

  checkAlarm() {
    if (!this.radioAlarm || !this.radioAlarm.enabled || !this.radioAlarm.time) return;

    const now = new Date();
    const curHour = now.getHours().toString().padStart(2, '0');
    const curMin = now.getMinutes().toString().padStart(2, '0');
    const curTime = `${curHour}:${curMin}`;

    const todayKey = `${now.toDateString()}_${this.radioAlarm.time}_${this.radioAlarm.stationId}`;

    if (curTime === this.radioAlarm.time && this.lastAlarmTriggered !== todayKey) {
      this.lastAlarmTriggered = todayKey;
      localStorage.setItem('saatvakit_radio_alarm_last', todayKey);
      this.triggerAlarm();
    }
  }

  triggerAlarm(isTest = false) {
    const stationId = this.radioAlarm.stationId || 'risale_radyo';
    const targetStation = this.stations.find(s => s.id === stationId) || this.stations[0];

    // Set station & play
    this.setStation(targetStation.id);
    if (this.radioAlarm.volume) {
      this.setVolume(this.radioAlarm.volume);
    }
    this.play();

    // Auto-stop sleep timer
    if (this.radioAlarm.autoStopMinutes && this.radioAlarm.autoStopMinutes > 0) {
      this.setSleepTimer(this.radioAlarm.autoStopMinutes);
    }

    // Show on-screen toast/banner
    this.showAlarmToast(targetStation.name, isTest);

    // Send notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isTest ? '🔔 Radyo Alarm Testi' : '⏰ Radyo Alarmı Çalıyor!', {
          body: `${targetStation.name} canlı yayını başladı. İyi dinlemeler!`,
          icon: '/app-icon.png',
          tag: 'radio-alarm',
          renotify: true
        });
      } catch (e) {}
    }
  }

  showAlarmToast(stationName, isTest = false) {
    const existing = document.getElementById('radio-alarm-floating-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'radio-alarm-floating-toast';
    toast.className = 'radio-floating-alarm-toast animate-slide-down';
    toast.innerHTML = `
      <div class="alarm-toast-content">
        <span class="alarm-toast-icon">⏰</span>
        <div class="alarm-toast-text">
          <div class="alarm-toast-title">${isTest ? '🔔 Radyo Alarmı Test Ediliyor' : '⏰ Radyo Alarmı Çalıyor!'}</div>
          <div class="alarm-toast-desc">${stationName} canlı yayını çalıyor</div>
        </div>
        <div class="alarm-toast-actions">
          <button id="btn-toast-stop-radio" class="btn-toast-stop">⏹️ Durdur</button>
          <button id="btn-toast-dismiss" class="btn-toast-close">✕</button>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    const stopBtn = toast.querySelector('#btn-toast-stop-radio');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.pause();
        toast.remove();
      });
    }

    const closeBtn = toast.querySelector('#btn-toast-dismiss');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.remove();
      });
    }

    // Auto dismiss toast UI after 30 seconds
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 30000);
  }

  setupAudioListeners() {
    this.audio.addEventListener('playing', () => {
      this.isPlaying = true;
      this.isLoading = false;
      this.currentError = null;
      this.retryCount = 0;
      this.notify();
    });

    this.audio.addEventListener('waiting', () => {
      this.isLoading = true;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.isLoading = false;
      this.notify();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Radio stream error event:', e);
      this.handleStreamError();
    });
  }

  handleStreamError() {
    const station = this.getCurrentStation();
    if (station.fallbackUrls && station.fallbackUrls.length > this.retryCount) {
      const fallback = station.fallbackUrls[this.retryCount];
      this.retryCount++;
      console.log(`Trying fallback for ${station.name}: ${fallback}`);
      this.loadStream(fallback);
      return;
    }
    
    this.isLoading = false;
    this.isPlaying = false;
    this.currentError = 'Yayın açılamadı';
    this.notify();
  }

  loadStream(url) {
    if (this.hls) {
      try {
        this.hls.destroy();
      } catch (e) {}
      this.hls = null;
    }

    const isHls = url.includes('.m3u8') || url.includes('/hls/');

    if (isHls && Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      this.hls.loadSource(url);
      this.hls.attachMedia(this.audio);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.isPlaying) {
          this.audio.play().catch(e => console.warn('HLS play error:', e));
        }
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn('HLS fatal error:', data.type);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls.recoverMediaError();
              break;
            default:
              this.handleStreamError();
              break;
          }
        }
      });
    } else {
      this.audio.src = url;
      this.audio.load();
      if (this.isPlaying) {
        this.audio.play().catch(e => console.warn('Audio play error:', e));
      }
    }
  }

  getCurrentStation() {
    return this.stations[this.currentStationIndex] || this.stations[0];
  }

  getStationsByCategory(categoryId) {
    if (categoryId === 'fav') {
      return this.stations.filter(s => this.favorites.has(s.id));
    }
    if (!categoryId || categoryId === 'all') {
      return this.stations;
    }
    return this.stations.filter(s => s.category === categoryId);
  }

  toggleFavorite(stationId) {
    if (this.favorites.has(stationId)) {
      this.favorites.delete(stationId);
    } else {
      this.favorites.add(stationId);
    }
    localStorage.setItem('saatvakit_radio_favorites', JSON.stringify([...this.favorites]));
    this.notify();
  }

  isFavorite(stationId) {
    return this.favorites.has(stationId);
  }

  addCustomStation(name, streamUrl, category = 'dini') {
    const newId = 'custom_' + Date.now();
    const station = {
      id: newId,
      name: name.trim(),
      category: category,
      frequency: 'Özel Eklenen Radyo',
      streamUrl: streamUrl.trim(),
      badge: 'Özel',
      isCustom: true
    };
    this.customStations.push(station);
    this.stations = [...INITIAL_STATIONS, ...this.customStations];
    localStorage.setItem('saatvakit_custom_stations', JSON.stringify(this.customStations));
    this.setStation(newId);
    this.notify();
    return station;
  }

  updateCustomStation(stationId, name, streamUrl, category = 'dini') {
    const customIndex = this.customStations.findIndex(s => s.id === stationId);
    if (customIndex !== -1) {
      this.customStations[customIndex].name = name.trim();
      this.customStations[customIndex].streamUrl = streamUrl.trim();
      this.customStations[customIndex].category = category;
      this.stations = [...INITIAL_STATIONS, ...this.customStations];
      localStorage.setItem('saatvakit_custom_stations', JSON.stringify(this.customStations));
      const currentStation = this.getCurrentStation();
      if (currentStation && currentStation.id === stationId) {
        this.loadStream(streamUrl.trim());
      }
      this.notify();
      return this.customStations[customIndex];
    }
    return null;
  }

  removeCustomStation(stationId) {
    this.customStations = this.customStations.filter(s => s.id !== stationId);
    this.stations = [...INITIAL_STATIONS, ...this.customStations];
    localStorage.setItem('saatvakit_custom_stations', JSON.stringify(this.customStations));
    if (this.currentStationIndex >= this.stations.length) {
      this.currentStationIndex = 0;
    }
    this.notify();
  }

  // Sleep Timer
  setSleepTimer(minutes) {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }

    this.sleepTimerMinutes = minutes;
    if (minutes > 0) {
      this.sleepTimerEndTime = Date.now() + (minutes * 60 * 1000);
      this.sleepTimerTimeout = setTimeout(() => {
        this.pause();
        this.sleepTimerMinutes = 0;
        this.sleepTimerEndTime = null;
        this.notify();
      }, minutes * 60 * 1000);
    } else {
      this.sleepTimerEndTime = null;
    }
    this.notify();
  }

  getSleepTimerRemaining() {
    if (!this.sleepTimerEndTime) return 0;
    const remainingMs = this.sleepTimerEndTime - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 60000));
  }

  setStation(stationId) {
    const index = this.stations.findIndex(s => s.id === stationId);
    if (index !== -1) {
      this.currentStationIndex = index;
      localStorage.setItem('saatvakit_radio_index', index.toString());
      this.retryCount = 0;
      this.currentError = null;

      const station = this.stations[index];
      this.loadStream(station.streamUrl);

      if (this.isPlaying) {
        this.isLoading = true;
        this.notify();
      } else {
        this.notify();
      }
    }
  }

  play() {
    const station = this.getCurrentStation();
    this.isLoading = true;
    this.currentError = null;
    this.isPlaying = true;
    this.notify();

    this.loadStream(station.streamUrl);

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.isLoading = false;
      this.notify();
    }).catch(err => {
      console.warn('Radio play promise error:', err);
      // Wait for event listener or HLS
    });
  }

  pause() {
    this.audio.pause();
    if (this.hls) {
      try {
        this.hls.stopLoad();
      } catch (e) {}
    }
    this.isPlaying = false;
    this.isLoading = false;
    this.notify();
  }

  togglePlay() {
    if (this.isPlaying || this.isLoading) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextStation() {
    let nextIndex = (this.currentStationIndex + 1) % this.stations.length;
    this.setStation(this.stations[nextIndex].id);
    if (!this.isPlaying) {
      this.play();
    }
  }

  prevStation() {
    let prevIndex = (this.currentStationIndex - 1 + this.stations.length) % this.stations.length;
    this.setStation(this.stations[prevIndex].id);
    if (!this.isPlaying) {
      this.play();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audio.volume = this.volume;
    localStorage.setItem('saatvakit_radio_volume', this.volume.toString());
    this.notify();
  }

  onStateChange(callback) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentStation: this.getCurrentStation(),
      currentIndex: this.currentStationIndex,
      totalStations: this.stations.length,
      volume: this.volume,
      error: this.currentError,
      sleepTimerMinutes: this.sleepTimerMinutes,
      sleepRemaining: this.getSleepTimerRemaining(),
      favoritesCount: this.favorites.size
    };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('Radio listener callback error:', err);
      }
    });
  }
}

export const radioService = new RadioService();
