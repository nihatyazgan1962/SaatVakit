import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// 1. Update soundManager.js to import and use TextToSpeech from @capacitor-community/text-to-speech
const soundManagerPath = path.resolve(srcDir, 'services/soundManager.js');

const soundManagerCode = `import { TextToSpeech } from '@capacitor-community/text-to-speech';

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.currentAudio = null;
    this.volume = parseFloat(localStorage.getItem('saatvakit_volume') || '0.85');
    this.speakOnOpen = localStorage.getItem('saatvakit_speak_on_open') !== 'false';
    
    this.prayerSounds = JSON.parse(localStorage.getItem('saatvakit_prayer_sounds') || JSON.stringify({
      imsak: 'ezan_makam',
      gunes: 'ney_melodi',
      ogle: 'ezan_makam',
      ikindi: 'ezan_makam',
      aksam: 'ezan_makam',
      yatsi: 'ezan_makam'
    }));

    this.customFileNames = JSON.parse(localStorage.getItem('saatvakit_custom_names') || '{}');
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('SaatVakitAudioDB_V2', 2);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('prayer_sounds')) {
          db.createObjectStore('prayer_sounds', { keyPath: 'prayerKey' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e);
    });
  }

  async saveCustomAudioForPrayer(prayerKey, file) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result;
        const tx = db.transaction('prayer_sounds', 'readwrite');
        const store = tx.objectStore('prayer_sounds');
        store.put({
          prayerKey: prayerKey,
          name: file.name,
          type: file.type || 'audio/mpeg',
          data: buffer,
          updatedAt: Date.now()
        });
        tx.oncomplete = () => {
          this.customFileNames[prayerKey] = file.name;
          this.prayerSounds[prayerKey] = 'custom';
          localStorage.setItem('saatvakit_custom_names', JSON.stringify(this.customFileNames));
          localStorage.setItem('saatvakit_prayer_sounds', JSON.stringify(this.prayerSounds));
          resolve({ success: true, name: file.name });
        };
        tx.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  async getCustomAudioForPrayer(prayerKey) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('prayer_sounds', 'readonly');
      const store = tx.objectStore('prayer_sounds');
      const req = store.get(prayerKey);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  setPrayerSoundType(prayerKey, soundType) {
    this.prayerSounds[prayerKey] = soundType;
    localStorage.setItem('saatvakit_prayer_sounds', JSON.stringify(this.prayerSounds));
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('saatvakit_volume', this.volume.toString());
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  setSpeakOnOpen(enabled) {
    this.speakOnOpen = enabled;
    localStorage.setItem('saatvakit_speak_on_open', enabled ? 'true' : 'false');
  }

  // Speak Current Time in Turkish using Native Android TTS + Web Fallback
  async speakCurrentTime(customPrefix = '') {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let text = \`Saat \${hours}\`;
    if (minutes === 0) {
      text += ' tam';
    } else if (minutes < 10) {
      text += \` sıfır \${minutes}\`;
    } else {
      text += \` \${minutes}\`;
    }

    if (customPrefix && customPrefix.trim() !== '') {
      text = \`\${customPrefix}, \${text}\`;
    }

    // 1. Try Native Android TextToSpeech plugin (100% reliable on all phones)
    try {
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text: text,
        lang: 'tr-TR',
        rate: 0.95,
        pitch: 1.0,
        volume: Math.max(0.7, this.volume),
        category: 'ambient'
      });
      return;
    } catch (nativeErr) {
      console.warn('Native TTS not available or error, falling back to Web Speech:', nativeErr);
    }

    // 2. Web Speech API Fallback
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        
        const executeSpeak = () => {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'tr-TR';
          u.rate = 0.90;
          u.pitch = 1.0;
          u.volume = Math.max(0.7, this.volume);

          const allVoices = window.speechSynthesis.getVoices();
          const tr = allVoices.find(v => v.lang && (v.lang.toLowerCase().includes('tr') || v.lang.toLowerCase().includes('tur')));
          if (tr) u.voice = tr;

          window.speechSynthesis.speak(u);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => executeSpeak();
          setTimeout(executeSpeak, 100);
        } else {
          executeSpeak();
        }
      } catch (e) {
        console.warn('Web Speech error:', e);
      }
    }
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playSynthesizedMelody(type = 'ezan_makam') {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.45, now);
    masterGain.connect(ctx.destination);

    if (type === 'beep') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.5, now + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.8);
      });
      return;
    }

    if (type === 'ney_melodi') {
      const notes = [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 587.33];
      const pattern = [0, 2, 3, 4, 3, 2, 0, 4, 6, 4, 2, 0];
      pattern.forEach((noteIdx, step) => {
        const freq = notes[noteIdx % notes.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + step * 0.45);
        
        gain.gain.setValueAtTime(0.001, now + step * 0.45);
        gain.gain.linearRampToValueAtTime(0.4, now + step * 0.45 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + step * 0.45 + 0.55);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + step * 0.45);
        osc.stop(now + step * 0.45 + 0.6);
      });
      return;
    }

    const adhanMotif = [
      { f: 293.66, d: 0.8 },
      { f: 311.13, d: 0.6 },
      { f: 369.99, d: 1.0 },
      { f: 392.00, d: 1.2 },
      { f: 369.99, d: 0.8 },
      { f: 311.13, d: 0.8 },
      { f: 293.66, d: 1.8 }
    ];

    let t = now;
    adhanMotif.forEach((n) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, t);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(n.f * 2, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + n.d);
      osc2.stop(t + n.d);

      t += n.d * 0.85;
    });
  }

  async playForPrayer(prayerKey = 'ogle') {
    this.stop();
    const soundType = this.prayerSounds[prayerKey] || 'ezan_makam';

    if (soundType === 'custom') {
      try {
        const item = await this.getCustomAudioForPrayer(prayerKey);
        if (item && item.data) {
          const blob = new Blob([item.data], { type: item.type || 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          this.currentAudio = new Audio(url);
          this.currentAudio.volume = this.volume;
          this.currentAudio.onended = () => {
            URL.revokeObjectURL(url);
            this.currentAudio = null;
          };
          await this.currentAudio.play();
          return;
        }
      } catch (e) {
        console.warn('Prayer custom audio error, fallback to synthetic:', e);
      }
    }

    this.playSynthesizedMelody(soundType);
  }

  async stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    try {
      await TextToSpeech.stop();
    } catch (e) {}
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }
}

export const soundManager = new SoundManager();
`;

fs.writeFileSync(soundManagerPath, soundManagerCode, 'utf8');
console.log('Native Android TTS integration written!');
