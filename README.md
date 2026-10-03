# ⏰ SaatVakit — Saat, Namaz Vakti & Alarm

Dijital saat, namaz vakitleri ve alarm özelliklerini bir arada sunan sade ve şık bir Android uygulamasıdır.

## ✨ Özellikler

- 🕐 Gerçek zamanlı dijital saat
- 🕌 Namaz vakitleri (Türkiye il/ilçe bazlı)
- ⏰ Alarm kurma
- 📡 HLS radyo entegrasyonu
- 🗺️ Konum bazlı vakit hesaplama
- 🌙 Gece modu

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Ses Akışı | HLS.js |
| İkonlar | Lucide |
| Harita/Konum | Tarayıcı Geolocation API |
| Mobil Wrapper | Capacitor (Android) |
| Platform | Android APK |

## 📋 Gereksinimler

- Node.js 18+
- Android Studio
- Java 17+
- Android SDK 21+

## 🚀 Kurulum

```bash
npm install
npx cap sync android
npx cap open android
```

### APK Derleme
```powershell
.\apk_yap.ps1
# veya
.\apk_yap.bat
```

## 📁 Proje Yapısı

```
├── src/
│   ├── main.js
│   ├── style.css
│   ├── cities.json
│   ├── turkeyLocations.js
│   └── AlarmModal.js
├── public/
├── dist/
├── android/
└── package.json
```

## 👨‍💻 Geliştirici

**Yazgan Bilişim**  
E-posta: yazganbilisim2026@gmail.com
GitHub: [@nihatyazgan1962](https://github.com/nihatyazgan1962)
