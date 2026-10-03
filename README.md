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

## 📞 İletişim

<div align="center">

[![E-posta](https://img.shields.io/badge/E--posta-yazganbilisim2026@gmail.com-00b4d8?style=for-the-badge&logo=gmail&logoColor=white&labelColor=0d1117)](mailto:yazganbilisim2026@gmail.com)
[![Diğer Uygulamalarımız](https://img.shields.io/badge/Diğer_Uygulamalarımız-Tüm_Projeler-00b4d8?style=for-the-badge&logo=android&logoColor=white&labelColor=0d1117)](https://github.com/nihatyazgan1962?tab=repositories)

**Yazgan Bilişim**

</div>
