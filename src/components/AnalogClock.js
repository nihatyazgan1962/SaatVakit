export class AnalogClock {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.timings = null;
    this.status = null;
    this.lastRenderedState = null;
    this.dateSet = false;
    this.render();
    this.initClockLoop();
  }

  updateData(timings, status) {
    this.timings = timings;
    this.status = status;
    this.updateDialPrayers();
    this.updateNextCountdown();
  }

  render() {
    this.container.innerHTML = `
      <div class="master-clock-wrapper">
        <svg class="master-clock-svg" viewBox="0 0 500 500" id="clock-svg">
          <defs>
            <!-- Obsidian & Sunburst Dial -->
            <radialGradient id="luxDialGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#141c2e" />
              <stop offset="50%" stop-color="#0a101d" />
              <stop offset="80%" stop-color="#05080f" />
              <stop offset="100%" stop-color="#010204" />
            </radialGradient>

            <!-- Ultra Premium Rose-Gold & Platinum Outer Bezel -->
            <linearGradient id="luxGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff6cc" />
              <stop offset="20%" stop-color="#dfaf52" />
              <stop offset="40%" stop-color="#8a611c" />
              <stop offset="60%" stop-color="#dfaf52" />
              <stop offset="80%" stop-color="#fff8db" />
              <stop offset="100%" stop-color="#9a7126" />
            </linearGradient>

            <linearGradient id="roseBezelGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#e2ba7e" />
              <stop offset="35%" stop-color="#916c35" />
              <stop offset="70%" stop-color="#fcedc9" />
              <stop offset="100%" stop-color="#735222" />
            </linearGradient>

            <!-- Approaching Next Prayer Pulsating Glow Filter -->
            <filter id="nextPrayerPulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <!-- Inner Accent Neon Arc -->
            <linearGradient id="neonCyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.8" />
              <stop offset="50%" stop-color="#ffd700" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#00ff9d" stop-opacity="0.8" />
            </linearGradient>

            <!-- Sapphire Glass Reflection Overlay -->
            <linearGradient id="sapphireGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14" />
              <stop offset="30%" stop-color="#00e5ff" stop-opacity="0.05" />
              <stop offset="50%" stop-color="#ffffff" stop-opacity="0.0" />
              <stop offset="100%" stop-color="#ffd700" stop-opacity="0.03" />
            </linearGradient>

            <!-- Dynamic Glow Filters -->
            <filter id="glowHandH" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowHandM" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowHandS" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Clean Borderless Obsidian Dial with Emerald Ring -->
          <circle cx="250" cy="250" r="242" fill="url(#luxDialGrad)" stroke="#00ff9d" stroke-width="2" stroke-opacity="0.85" filter="drop-shadow(0 0 6px rgba(0, 255, 157, 0.4))" />

          <!-- 🌟 BACKGROUND DIAL SEGMENT SECTORS (SAATİN İÇİNDEKİ VAKİT DİLİMLERİ) 🌟 -->
          <g id="dial-sectors-group"></g>

          <!-- High-End Circular Inner Track (Zümrüt Yeşili Şık Dış ve İç Bölme Çemberleri) -->
          <circle cx="250" cy="250" r="236" fill="none" stroke="#00ff9d" stroke-width="1.2" opacity="0.6" />
          <circle cx="250" cy="250" r="214" fill="none" stroke="#00ff9d" stroke-width="1.5" stroke-dasharray="2,4" opacity="0.8" />
          <circle cx="250" cy="250" r="172" fill="none" stroke="rgba(0, 255, 157, 0.25)" stroke-width="1" stroke-dasharray="1,4" />

          <!-- Dial Ticks Group (Yeşil Çizgi Bölmeleri) -->
          <g id="dial-ticks"></g>

          <!-- Arabic Numbers (1 to 12) with 3D embossed gold style -->
          <g id="dial-arabic-numbers" font-family="'Outfit', sans-serif" font-weight="900" font-size="21" fill="url(#luxGoldGrad)" text-anchor="middle" dominant-baseline="central" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"></g>

          <!-- TOP DIGITAL COMPLICATION: LUXURY HUD DISPLAY (KOMPAKT & FERAH) -->
          <g id="top-digital-area" transform="translate(250, 132)">
            <!-- Date & City Subtext -->
            <text id="svg-date-text" x="0" y="-33" font-family="'Outfit', sans-serif" font-weight="700" font-size="11" fill="#e2ba7e" text-anchor="middle" letter-spacing="1">📅 YÜKLENİYOR...</text>

            <!-- Digital Display Chassis Pill with Glassmorphism -->
            <rect x="-118" y="-23" width="236" height="46" rx="14" fill="rgba(4, 7, 14, 0.88)" stroke="url(#luxGoldGrad)" stroke-width="1.2" filter="drop-shadow(0 6px 16px rgba(0,0,0,0.85))" />
            <rect x="-115" y="-20" width="230" height="40" rx="11" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

            <!-- Luxury Chrono Icon -->
            <text x="-96" y="8" font-size="17" text-anchor="middle">⏱️</text>

            <!-- HIGH-CONTRAST NEON DIGITAL TIME (Saat, Dk, Sn) -->
            <text x="-52" y="9" font-family="'Orbitron', monospace" font-weight="900" font-size="25" fill="var(--color-hour, #00e5ff)" text-anchor="middle" id="svg-hour" filter="drop-shadow(0 0 8px rgba(0,229,255,0.4))">00</text>
            <text x="-24" y="7" font-family="'Orbitron', monospace" font-weight="700" font-size="20" fill="rgba(255,255,255,0.7)" text-anchor="middle">:</text>
            
            <text x="6" y="9" font-family="'Orbitron', monospace" font-weight="900" font-size="25" fill="var(--color-minute, #00ff9d)" text-anchor="middle" id="svg-minute" filter="drop-shadow(0 0 8px rgba(0,255,157,0.4))">00</text>
            <text x="36" y="7" font-family="'Orbitron', monospace" font-weight="700" font-size="20" fill="rgba(255,255,255,0.7)" text-anchor="middle">:</text>
            
            <text x="68" y="9" font-family="'Orbitron', monospace" font-weight="900" font-size="21" fill="var(--color-second, #ff4081)" text-anchor="middle" id="svg-second" filter="drop-shadow(0 0 8px rgba(255,64,129,0.4))">00</text>
          </g>

          <!-- 6 LUXURY PRAYER COMPARTMENTS (KADRAN İÇİ VAKİT BÖLÜMLERİ) -->
          <g id="dial-prayers-group"></g>

          <!-- NEXT PRAYER COUNTDOWN PILL (Öğle ve Yatsı arasına tam sığacak zarif kompakt pill - SABİT IŞIK, DİK YAZI) -->
          <g id="next-prayer-subdial" transform="translate(250, 324)">
            <rect x="-59" y="-23" width="118" height="46" rx="12" fill="rgba(6, 10, 18, 0.92)" stroke="url(#luxGoldGrad)" stroke-width="1.4" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.8))" />
            <rect x="-56" y="-20" width="112" height="40" rx="9" fill="none" stroke="rgba(255, 215, 0, 0.3)" stroke-width="1" />
            
            <!-- ÜSTTE: SIRADA İKİNDİ (veya ilgili vakit) - Sarı, DİK YAZI -->
            <text id="svg-next-prayer-name" x="0" y="-6" font-family="'Outfit', sans-serif" font-weight="900" font-style="normal" font-size="9.5" fill="#ffe600" text-anchor="middle" letter-spacing="0.5">⏳ SIRADA: VAKİT</text>
            
            <!-- ALTTA: KALAN SÜRE - Sarı, DİK YAZI -->
            <text id="svg-next-prayer-remaining" x="0" y="11" font-family="'Orbitron', monospace" font-weight="900" font-style="normal" font-size="11" fill="#ffd700" text-anchor="middle" letter-spacing="0.6">KALAN: 00:00:00</text>
          </g>

          <!-- BOTTOM CONTROLS AREA (SAATİ SÖYLE, İMSAKİYE, TAM EKRAN BUTONLARI) -->
          <g id="dial-bottom-actions" transform="translate(250, 396)">
            <!-- 1. Speak Time Button (Sol) -->
            <g id="btn-dial-speak" style="cursor: pointer;" transform="translate(-48, 0)">
              <circle cx="0" cy="0" r="14.5" fill="rgba(12, 18, 30, 0.92)" stroke="url(#luxGoldGrad)" stroke-width="1.2" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.8))" />
              <text x="0" y="4.5" font-size="12.5" text-anchor="middle">🔊</text>
            </g>

            <!-- 2. Monthly Calendar Button (Orta) -->
            <g id="btn-dial-monthly" style="cursor: pointer;" transform="translate(0, 0)">
              <circle cx="0" cy="0" r="14.5" fill="rgba(12, 18, 30, 0.92)" stroke="url(#luxGoldGrad)" stroke-width="1.2" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.8))" />
              <text x="0" y="4.5" font-size="12.5" text-anchor="middle">📅</text>
            </g>

            <!-- 3. Fullscreen Button (Sağ) -->
            <g id="btn-dial-fullscreen" style="cursor: pointer;" transform="translate(48, 0)">
              <circle cx="0" cy="0" r="14.5" fill="rgba(12, 18, 30, 0.92)" stroke="url(#luxGoldGrad)" stroke-width="1.2" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.8))" />
              <text x="0" y="4.5" font-size="12.5" text-anchor="middle">⛶</text>
            </g>
          </g>

          <!-- SAPPHIRE CRYSTAL FACET REFLECTION -->
          <path d="M 45,180 A 233,233 0 0,1 420,70 A 233,233 0 0,0 45,180 Z" fill="url(#sapphireGlass)" pointer-events="none" />

          <!-- HIGH PRECISION TIMEPIECE HANDS -->
          <g id="master-hands-group">
            <!-- Hour Hand (Akrep) -->
            <g id="hand-hour-group">
              <polygon points="245,268 243,165 250,146 257,165 255,268" fill="url(#luxGoldGrad)" stroke="#050811" stroke-width="1.2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.95))" />
              <line x1="250" y1="262" x2="250" y2="155" stroke="var(--color-hour, #00e5ff)" stroke-width="3.5" stroke-linecap="round" filter="url(#glowHandH)" />
              <line x1="250" y1="262" x2="250" y2="158" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
            </g>
            
            <!-- Minute Hand (Yelkovan) -->
            <g id="hand-min-group">
              <polygon points="246,278 245,108 250,86 255,108 254,278" fill="url(#luxGoldGrad)" stroke="#050811" stroke-width="1.2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.95))" />
              <line x1="250" y1="272" x2="250" y2="94" stroke="var(--color-minute, #00ff9d)" stroke-width="3" stroke-linecap="round" filter="url(#glowHandM)" />
              <line x1="250" y1="272" x2="250" y2="97" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" />
            </g>
            
            <!-- Second Hand (Belirgin Kırmızı Düz Çizgi İbre) -->
            <g id="hand-sec-group">
              <!-- Arka denge kuyruğu -->
              <line x1="250" y1="285" x2="250" y2="42" stroke="#ff2a55" stroke-width="2.5" stroke-linecap="round" />
              <line x1="250" y1="270" x2="250" y2="45" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />
              <!-- Küçük şık arka denge noktası -->
              <circle cx="250" cy="285" r="3.5" fill="#ff2a55" />
            </g>

            <!-- Center Jewel Pivot -->
            <circle cx="250" cy="250" r="10" fill="url(#luxGoldGrad)" stroke="#010204" stroke-width="1.5" />
            <circle cx="250" cy="250" r="5.5" fill="#141c2e" />
            <circle cx="250" cy="250" r="3" fill="#ff2a55" />
          </g>
        </svg>
      </div>
    `;

    this.renderTicksAndNumbers();
  }

  renderTicksAndNumbers() {
    const ticksGroup = this.container.querySelector('#dial-ticks');
    const numbersGroup = this.container.querySelector('#dial-arabic-numbers');

    let ticksHtml = '';
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6) * (Math.PI / 180);
      const isMajor = i % 5 === 0;
      const r1 = 234;
      const r2 = isMajor ? 218 : 225;
      const x1 = 250 + r1 * Math.sin(angle);
      const y1 = 250 - r1 * Math.cos(angle);
      const x2 = 250 + r2 * Math.sin(angle);
      const y2 = 250 - r2 * Math.cos(angle);

      const stroke = isMajor ? '#00ff00' : 'rgba(0, 255, 0, 0.45)';
      const width = isMajor ? '3' : '1.3';
      const shadow = isMajor ? 'filter="drop-shadow(0 0 3px rgba(0,255,0,0.7))"' : '';
      ticksHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${shadow} />`;
    }
    ticksGroup.innerHTML = ticksHtml;

    const arabicNums = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    let numbersHtml = '';
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const r = 198;
      const x = 250 + r * Math.sin(angle);
      const y = 250 - r * Math.cos(angle);
      numbersHtml += `<text x="${x}" y="${y}">${arabicNums[i]}</text>`;
    }
    numbersGroup.innerHTML = numbersHtml;
  }

  // Convert time "HH:MM" to dial angle in degrees (12-hour analog clock: 0 to 360 deg)
  timeToClockAngle(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const totalHours = (h % 12) + (m / 60);
    return totalHours * 30; // 360 / 12 = 30 deg per hour
  }

  // Create SVG arc path between two angles on clock dial
  describeArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
    let sweep = endAngle - startAngle;
    if (sweep < 0) sweep += 360;
    const largeArc = sweep > 180 ? 1 : 0;

    const rad = (deg) => (deg - 90) * (Math.PI / 180);
    const startRad = rad(startAngle);
    const endRad = rad(endAngle);

    const x1 = cx + rOuter * Math.cos(startRad);
    const y1 = cy + rOuter * Math.sin(startRad);
    const x2 = cx + rOuter * Math.cos(endRad);
    const y2 = cy + rOuter * Math.sin(endRad);

    const x3 = cx + rInner * Math.cos(endRad);
    const y3 = cy + rInner * Math.sin(endRad);
    const x4 = cx + rInner * Math.cos(startRad);
    const y4 = cy + rInner * Math.sin(startRad);

    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  updateDialPrayers() {
    const prayersGroup = this.container.querySelector('#dial-prayers-group');
    if (!prayersGroup || !this.timings) return;

    const currentKey = this.status?.currentPrayer?.key || '';
    const nextKey = this.status?.nextPrayer?.key || '';
    const stateKey = `${currentKey}_${nextKey}_${this.timings.imsak}_${this.timings.yatsi}`;

    // Skip DOM recreation if prayer keys haven't changed (prevents 1-sec jitter/shaking)
    if (this.lastRenderedState === stateKey) {
      return;
    }
    this.lastRenderedState = stateKey;

    // 6 Prayers list with optimized positions (Rakamlara ve kollarla mesafeli, ferah düzen)
    const prayerSlots = [
      { key: 'imsak', label: 'İMSAK', time: this.timings.imsak, x: 124, y: 216, icon: '🌙' },
      { key: 'gunes', label: 'GÜNEŞ', time: this.timings.gunes, x: 108, y: 268, icon: '🌅' },
      { key: 'ogle', label: 'ÖĞLE', time: this.timings.ogle, x: 124, y: 320, icon: '☀️' },
      { key: 'ikindi', label: 'İKİNDİ', time: this.timings.ikindi, x: 376, y: 216, icon: '🌤️' },
      { key: 'aksam', label: 'AKŞAM', time: this.timings.aksam, x: 392, y: 268, icon: '🌇' },
      { key: 'yatsi', label: 'YATSI', time: this.timings.yatsi, x: 376, y: 320, icon: '✨' }
    ];

    // RENDER 6 PRAYER BADGES WITH REFINED GLASSMORPHIC CARDS
    let prayersHtml = '';
    prayerSlots.forEach(p => {
      const isActive = p.key === currentKey;
      const isNext = p.key === nextKey;

      // Sadece ve sadece sıradaki yaklaşan vakit yanıp söner
      const blinkClass = isNext ? 'approaching-prayer-blink' : '';
      const cardFill = isNext ? 'rgba(255, 215, 0, 0.22)' : (isActive ? 'rgba(0, 229, 255, 0.16)' : 'rgba(8, 14, 26, 0.76)');
      const cardStroke = isNext ? '#ffd700' : (isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.14)');
      const textFill = isNext ? '#ffffff' : (isActive ? '#00e5ff' : '#ffffff');
      const labelFill = isNext ? '#ffd700' : (isActive ? '#00e5ff' : '#94a3b8');

      prayersHtml += `
        <g transform="translate(${p.x}, ${p.y})" class="${blinkClass}">
          <!-- Glowing Outer Aura for Approaching Prayer Only -->
          ${isNext ? `<rect x="-41" y="-20" width="82" height="40" rx="12" fill="none" stroke="#ffd700" stroke-width="1.8" class="prayer-aura-pulse" />` : ''}

          <!-- Main Prayer Badge Card -->
          <rect x="-38" y="-17" width="76" height="34" rx="10" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${isNext ? '2' : (isActive ? '1.6' : '1')}" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.7))" />
          ${isActive || isNext ? `<rect x="-36" y="-15" width="72" height="30" rx="8" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1" />` : ''}
          
          <!-- Approaching indicator beacon icon -->
          ${isNext ? `<circle cx="-27" cy="-7" r="2.8" fill="#00ff9d" class="beacon-pulse" />` : ''}

          <text x="0" y="-4" font-family="'Outfit', sans-serif" font-weight="900" font-size="9" fill="${labelFill}" text-anchor="middle" letter-spacing="0.6">${p.icon} ${p.label}</text>
          <text x="0" y="10" font-family="'Orbitron', monospace" font-weight="900" font-size="11.5" fill="${textFill}" text-anchor="middle">${p.time}</text>
        </g>
      `;
    });

    prayersGroup.innerHTML = prayersHtml;
  }

  updateNextCountdown() {
    const nextNameEl = this.container.querySelector('#svg-next-prayer-name');
    const nextRemEl = this.container.querySelector('#svg-next-prayer-remaining');
    const legacyEl = this.container.querySelector('#svg-next-prayer-info');
    if (!this.status) return;

    const nextP = this.status.nextPrayer;
    const remaining = this.status.remainingFormatted;

    if (nextNameEl) {
      nextNameEl.textContent = `⏳ SIRADA: ${nextP.name.toUpperCase()} (${nextP.time})`;
    }
    if (nextRemEl) {
      nextRemEl.textContent = `KALAN: ${remaining}`;
    }
    if (legacyEl && !nextNameEl) {
      legacyEl.textContent = `⏳ SIRADA: ${nextP.name.toUpperCase()} (${nextP.time}) • KALAN: ${remaining}`;
    }
  }

  initClockLoop() {
    const hourGroup = this.container.querySelector('#hand-hour-group');
    const minGroup = this.container.querySelector('#hand-min-group');
    const secGroup = this.container.querySelector('#hand-sec-group');

    const hourEl = this.container.querySelector('#svg-hour');
    const minEl = this.container.querySelector('#svg-minute');
    const secEl = this.container.querySelector('#svg-second');
    const dateEl = this.container.querySelector('#svg-date-text');

    const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
    const days = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];

    const tick = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      const s = now.getSeconds() + ms / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      const secDeg = s * 6;
      const minDeg = m * 6;
      const hourDeg = h * 30;

      if (secGroup) secGroup.setAttribute('transform', `rotate(${secDeg} 250 250)`);
      if (minGroup) minGroup.setAttribute('transform', `rotate(${minDeg} 250 250)`);
      if (hourGroup) hourGroup.setAttribute('transform', `rotate(${hourDeg} 250 250)`);

      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');

      if (hourEl && hourEl.textContent !== hh) hourEl.textContent = hh;
      if (minEl && minEl.textContent !== mm) minEl.textContent = mm;
      if (secEl) secEl.textContent = ss;

      if (dateEl && !this.dateSet) {
        dateEl.textContent = `📅 ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} • ${days[now.getDay()]}`;
        this.dateSet = true;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}
