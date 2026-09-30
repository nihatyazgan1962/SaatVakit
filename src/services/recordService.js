// Radio Broadcast Recorder & Player Service (MediaRecorder / Audio File Manager)

class RecordService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.timerInterval = null;
    this.currentDuration = 0;
    this.stationName = 'Radyo';

    this.audioCtx = null;
    this.sourceNode = null;
    this.destNode = null;
    this.listeners = new Set();

    // Saved recordings list
    this.recordings = [];
    this.activePlaybackId = null;
    this.isPlaybackPlaying = false;
    this.playbackCurrentTime = 0;
    this.playbackDuration = 0;

    this.playbackAudio = new Audio();
    this.setupPlaybackListeners();
  }

  setupPlaybackListeners() {
    this.playbackAudio.addEventListener('playing', () => {
      this.isPlaybackPlaying = true;
      this.notify();
    });

    this.playbackAudio.addEventListener('pause', () => {
      this.isPlaybackPlaying = false;
      this.notify();
    });

    this.playbackAudio.addEventListener('ended', () => {
      this.isPlaybackPlaying = false;
      this.playbackCurrentTime = 0;
      this.notify();
    });

    this.playbackAudio.addEventListener('timeupdate', () => {
      this.playbackCurrentTime = Math.floor(this.playbackAudio.currentTime);
      this.playbackDuration = Math.floor(this.playbackAudio.duration || 0);
      this.notify();
    });
  }

  startRecording(audioElement, stationName = 'Radyo') {
    if (this.isRecording) return;
    this.stationName = stationName;
    this.audioChunks = [];

    // Pause any recording playback if active
    if (this.isPlaybackPlaying) {
      this.pausePlayback();
    }

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Capture stream from audio element
      let stream;
      if (typeof audioElement.captureStream === 'function') {
        stream = audioElement.captureStream();
      } else if (typeof audioElement.mozCaptureStream === 'function') {
        stream = audioElement.mozCaptureStream();
      } else {
        if (!this.sourceNode) {
          try {
            audioElement.crossOrigin = 'anonymous';
            this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
            this.destNode = this.audioCtx.createMediaStreamDestination();
            this.sourceNode.connect(this.destNode);
            this.sourceNode.connect(this.audioCtx.destination);
          } catch (e) {
            console.warn('MediaElementSource error:', e);
          }
        }
        stream = this.destNode ? this.destNode.stream : null;
      }

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      if (stream && typeof MediaRecorder !== 'undefined') {
        const options = selectedMime ? { mimeType: selectedMime } : {};
        this.mediaRecorder = new MediaRecorder(stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.finishAndSaveRecording();
        };

        this.mediaRecorder.start(1000); // 1-second chunks
      }

      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.currentDuration = 0;

      this.timerInterval = setInterval(() => {
        if (this.isRecording) {
          this.currentDuration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
          this.notify();
        }
      }, 1000);

      this.notify();
    } catch (err) {
      console.error('Recording start error:', err);
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.currentDuration = 0;
      this.timerInterval = setInterval(() => {
        if (this.isRecording) {
          this.currentDuration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
          this.notify();
        }
      }, 1000);
      this.notify();
    }
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.timerInterval);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('MediaRecorder stop error:', e);
        this.finishAndSaveRecording();
      }
    } else {
      this.finishAndSaveRecording();
    }

    this.notify();
  }

  finishAndSaveRecording() {
    const safeName = (this.stationName || 'Radyo').replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_]/g, '_');
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR');
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const fileName = `SaatVakit_${safeName}_${now.toISOString().slice(0, 10)}_${now.toTimeString().slice(0, 8).replace(/:/g, '-')}.mp3`;

    let blobUrl = '';
    let fileSizeStr = '';

    if (this.audioChunks.length > 0) {
      const mime = this.mediaRecorder?.mimeType || 'audio/webm';
      const blob = new Blob(this.audioChunks, { type: mime });
      blobUrl = URL.createObjectURL(blob);
      const sizeKB = Math.round(blob.size / 1024);
      fileSizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      // Auto download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 2000);

      // Add to session recordings list
      const recItem = {
        id: 'rec_' + Date.now(),
        name: this.stationName,
        fileName: fileName,
        date: dateStr,
        time: timeStr,
        duration: this.currentDuration,
        formattedDuration: this.formatDuration(this.currentDuration),
        sizeStr: fileSizeStr,
        blobUrl: blobUrl
      };
      this.recordings.unshift(recItem);
    }

    this.audioChunks = [];
    this.currentDuration = 0;
    this.notify();
  }

  // Add recording from a chosen file on device
  addRecordingFromFile(file) {
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    const now = new Date();

    const recItem = {
      id: 'rec_' + Date.now(),
      name: file.name.replace(/\.[^/.]+$/, '').replace(/^SaatVakit_/, ''),
      fileName: file.name,
      date: now.toLocaleDateString('tr-TR'),
      time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      duration: 0,
      formattedDuration: 'Kayıt',
      sizeStr: sizeStr,
      blobUrl: blobUrl
    };

    this.recordings.unshift(recItem);
    this.playRecording(recItem.id);
    this.notify();
  }

  playRecording(recordingId) {
    const item = this.recordings.find(r => r.id === recordingId);
    if (!item || !item.blobUrl) return;

    if (this.activePlaybackId === recordingId && this.isPlaybackPlaying) {
      this.pausePlayback();
      return;
    }

    this.activePlaybackId = recordingId;
    this.playbackAudio.src = item.blobUrl;
    this.playbackAudio.load();
    this.playbackAudio.play().catch(e => console.warn('Recording playback error:', e));
    this.notify();
  }

  pausePlayback() {
    this.playbackAudio.pause();
    this.isPlaybackPlaying = false;
    this.notify();
  }

  deleteRecording(recordingId) {
    if (this.activePlaybackId === recordingId) {
      this.pausePlayback();
      this.activePlaybackId = null;
    }
    this.recordings = this.recordings.filter(r => r.id !== recordingId);
    this.notify();
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onStateChange(callback) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  getState() {
    return {
      isRecording: this.isRecording,
      duration: this.currentDuration,
      formattedDuration: this.formatDuration(this.currentDuration),
      stationName: this.stationName,
      recordings: this.recordings,
      activePlaybackId: this.activePlaybackId,
      isPlaybackPlaying: this.isPlaybackPlaying,
      playbackCurrentTime: this.playbackCurrentTime,
      playbackDuration: this.playbackDuration,
      formattedPlaybackTime: `${this.formatDuration(this.playbackCurrentTime)} / ${this.formatDuration(this.playbackDuration)}`
    };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error(err);
      }
    });
  }
}

export const recordService = new RecordService();
