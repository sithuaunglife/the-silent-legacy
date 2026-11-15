// =========================================================================
    // 1. STATE & BILINGUAL DIALOGUE DATA (ENGLISH & MYANMAR)
    // =========================================================================
    let currentLang = 'en'; // 'en' or 'my'
    let autoStage = true;
    let sfxEnabled = true;

    // Physics & Mission State
    const MISSION = {
      phase: 'PAD', // 'PAD', 'IGNITION', 'STAGE1_ASCENT', 'STAGE2_ASCENT', 'ORBIT'
      time: 0,
      altitudeKm: 0,
      velocityMs: 0,
      massTons: 540, // Dynamically calculated from SHIP_DESIGN
      accelG: 1.0,
      cameraY: 0,
      shakeIntensity: 0,
      shipX: 0,
      shipY: 0,
      shipAngle: -Math.PI / 2, // Pointing straight up initially, tilts gradually (gravity turn)
      hasSideBoosters: true,
      hasCoreStage: true,
      hasFairings: true,
      wingDeployProgress: 0, // 0 = folded inside fairing shroud, 1 = fully unfolded orbital solar wings
      detachedParts: [],
      particles: [],
      stars: [],
      crowd: []
    };

    // Custom Spacecraft Configuration State
    const SHIP_DESIGN = {
      hull: 'shuttle',      // 2.5D pixel spaceplane reference
      fairing: true,        // Clamshell aerodynamic payload fairing halves encasing folded wings
      wings: 'delta',       // dark aircraft wings
      boosters: 'twin',     // 'twin', 'quad', 'single'
      paint: 'navy',        // navy/orange reference
      flame: 'cyan',        // blue pixel thrusters
      customSpriteImg: null // Optional HTMLImageElement uploaded by user
    };

    // Exact supplied spaceship art: two transparent views.
    const SPACEPLANE_SPRITES = { upright: new Image(), cruise: new Image() };
    SPACEPLANE_SPRITES.upright.src = './assets/spacecraft-upright.png';
    SPACEPLANE_SPRITES.cruise.src = './assets/spacecraft-cruise.png';
    let orbitHandoffTimer = null;
    let orbitHandoffSent = false;

    const PAINT_PALETTES = {
      msa: { primary: '#e2e8f0', highlight: '#ffffff', trim: '#f97316', dark: '#334155', accent: '#1e293b' },
      ruby: { primary: '#dc2626', highlight: '#f87171', trim: '#fbbf24', dark: '#450a0a', accent: '#fef08a' },
      emerald: { primary: '#059669', highlight: '#34d399', trim: '#fbbf24', dark: '#064e3b', accent: '#fef08a' },
      navy: { primary: '#1e293b', highlight: '#475569', trim: '#38bdf8', dark: '#020617', accent: '#f59e0b' }
    };

    const FLAME_PALETTES = {
      amber: { core: '#fef08a', mid: '#f97316', outer: '#dc2626' },
      cyan: { core: '#ffffff', mid: '#38bdf8', outer: '#1d4ed8' },
      emerald: { core: '#ecfccb', mid: '#4ade80', outer: '#15803d' }
    };

    let previewStageMode = 0; // 0 = Full Stack, 1 = Boosters Detached, 2 = Fairing Split & Core Separation, 3 = Orbit Capsule

    function getDesignMetrics() {
      const orbiterMass = SHIP_DESIGN.hull === 'lander' ? 85 : SHIP_DESIGN.hull === 'capsule' ? 65 : 60;
      const coreMass = 180;
      const boosterMass = SHIP_DESIGN.boosters === 'quad' ? 460 : SHIP_DESIGN.boosters === 'twin' ? 300 : 0;

      const totalPadMass = orbiterMass + coreMass + boosterMass;
      const stage2Mass = orbiterMass + coreMass;
      const maxThrust = SHIP_DESIGN.boosters === 'quad' ? 1320 : SHIP_DESIGN.boosters === 'twin' ? 920 : 620;
      const liftoffG = 1.0 + Math.max(0.2, (maxThrust / totalPadMass) - 0.5) * 0.55;

      return {
        orbiterMass,
        coreMass,
        boosterMass,
        totalPadMass,
        stage2Mass,
        maxThrust,
        liftoffG
      };
    }

    // Bilingual UI Strings
    const UI_TEXT = {
      en: {
        subtitle: "Maha Bandula Park & Sule Pagoda • Safe Viewing Perimeter Active",
        lblAlt: "ALTITUDE",
        lblVel: "VELOCITY",
        lblMass: "TOTAL MASS",
        lblTwr: "ACCELERATION",
        lblStage: "STAGE STATUS",
        btnLaunch: "🚀 IGNITE & LAUNCH",
        btnStage1: "⚡ DETACH BOOSTERS (STAGE 1)",
        btnStage2: "🛰️ SEPARATE CORE (STAGE 2)",
        btnReset: "↺ RESET",
        placeholder: "Type a custom greeting or radio message for KyawGyi...",
        camGround: "CAM-01: BANDULA PARK SAFE ZONE",
        camSky: "CAM-02: YANGON STRATOSPHERE TRACKING",
        camOrbit: "CAM-03: LOW EARTH ORBIT INSERTION",
        stages: {
          PAD: "PAD READY",
          IGNITION: "IGNITION",
          STAGE1_ASCENT: "STAGE 1 BURN",
          STAGE2_ASCENT: "BOOSTERS FREE",
          ORBIT: "ORBIT ACHIEVED"
        }
      },
      my: {
        subtitle: "မဟာဗန္ဓုလပန်းခြံနှင့် ဆူးလေစေတီတော် • ဘေးကင်းလုံခြုံရေးဇုန် အသင့်ရှိသည်",
        lblAlt: "အမြင့်ပေ (Altitude)",
        lblVel: "အမြန်နှုန်း (Velocity)",
        lblMass: "အလေးချိန် (Mass)",
        lblTwr: "အရှိန်မြှင့်နှုန်း",
        lblStage: "ဒုံးပျံအဆင့်",
        btnLaunch: "🚀 စတင်လွှတ်တင်မည်",
        btnStage1: "⚡ လောင်စာအိုးဖြုတ်မည် (Stage 1)",
        btnStage2: "🛰️ ပင်မကိုယ်ထည်ဖြုတ်မည် (Stage 2)",
        btnReset: "↺ ပြန်စမည်",
        placeholder: "ကျော်ကြီးထံသို့ နှုတ်ခွန်းဆက်စကား ရေးသားပေးပို့ပါ...",
        camGround: "ကင်မရာ-၀၁: မဟာဗန္ဓုလပန်းခြံ ဘေးကင်းဇုန်",
        camSky: "ကင်မရာ-၀၂: ရန်ကုန်ကောင်းကင်ယံ ခြေရာခံစနစ်",
        camOrbit: "ကင်မရာ-၀၃: ကမ္ဘာပတ်လမ်းကြောင်း ရောက်ရှိ",
        stages: {
          PAD: "အသင့်အနေအထား",
          IGNITION: "မီးစတင်ရှို့နေသည်",
          STAGE1_ASCENT: "အဆင့် (၁) ပျံတက်နေသည်",
          STAGE2_ASCENT: "လောင်စာအိုး ဖြုတ်ချပြီး",
          ORBIT: "ပတ်လမ်းကြောင်း ရောက်ရှိပြီ"
        }
      }
    };

    // Rich Greeting & Mission Dialogue Script
    const DIALOGUE_SCRIPT = [
      {
        en: 'KyawGyi: "Mingalaba, Yangon! Welcome to Maha Bandula Park! Looking out at golden Sule Pagoda and City Hall—what a historic evening for Myanmar spaceflight!"',
        my: 'ကျော်ကြီး: "မင်္ဂလာပါ ရန်ကုန်မြို့ကြီးခင်ဗျာ! မဟာဗန္ဓုလပန်းခြံကနေ ကြိုဆိုပါတယ်။ ရွှေရောင်တောက်ပနေတဲ့ ဆူးလေစေတီတော်ကြီးနဲ့ မြို့တော်ခန်းမရှေ့မှာ သမိုင်းဝင် အာကာသခရီးစဉ် စတင်ပါတော့မယ်!"'
      },
      {
        en: 'KyawGyi: "To everyone watching from behind the Police safety barricades in Bandula Park—thank you for keeping the launch perimeter clear and safe! Wave your cameras!"',
        my: 'ကျော်ကြီး: "မဟာဗန္ဓုလပန်းခြံ ရဲတပ်ဖွဲ့အကာအရံ နောက်ကွယ်ကနေ ဘေးကင်းလုံခြုံစွာ ကြည့်ရှုအားပေးနေကြတဲ့ ပြည်သူအားလုံးကို အထူးကျေးဇူးတင်ပါတယ်ခင်ဗျာ!"'
      },
      {
        en: 'KyawGyi: "Physics Check: Once we lift off and burn our side fuel boosters, we will jettison the empty fuel tanks away! Shedding heavy dead weight lets our ship accelerate much faster!"',
        my: 'ကျော်ကြီး: "သိပ္ပံနည်းကျ လုပ်ဆောင်ချက် - အာကာသယာဉ် ပျံတက်ပြီး လောင်စာကုန်သွားတဲ့ ဘေးတွဲလောင်စာအိုးတွေကို ဖြုတ်ချပစ်ပါမယ်။ အလေးချိန် လျှော့ချလိုက်မှ အရှိန်ပိုမြန်မြန် ပျံသန်းနိုင်မှာ ဖြစ်ပါတယ်!"'
      },
      {
        en: 'KyawGyi: "All systems green! Press [IGNITE & LAUNCH] whenever you are ready, and watch the live telemetry as we climb above Yangon into orbit!"',
        my: 'ကျော်ကြီး: "စနစ်အားလုံး အဆင်သင့်ဖြစ်ပါပြီ! [စတင်လွှတ်တင်မည်] ခလုတ်ကို နှိပ်ပြီး ရန်ကုန်ကောင်းကင်ယံကနေ အာကာသထဲ ပျံတက်ကြပါစို့!"'
      }
    ];

    let dialogueIndex = 0;
    let currentFullText = "";
    let displayedChars = 0;
    let typewriterTimer = null;

    // =========================================================================
    // 2. RETRO 8-BIT / 16-BIT WEB AUDIO SYNTHESIZER
    // =========================================================================
    let audioCtx = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function playBlip() {
      if (!sfxEnabled) return;
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(760, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    }

    function playIgnitionSound() {
      if (!sfxEnabled) return;
      initAudio();
      // White noise rumble + low sawtooth thrust
      const duration = 2.4;
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 1.4));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, audioCtx.currentTime);
      filter.frequency.linearRampToValueAtTime(480, audioCtx.currentTime + 0.8);
      filter.frequency.linearRampToValueAtTime(140, audioCtx.currentTime + duration);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    }

    function playSeparationSound() {
      if (!sfxEnabled) return;
      initAudio();
      // Mechanical clunk + pneumatic whoosh
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);

      // Rising boost chime
      setTimeout(() => {
        if (!sfxEnabled) return;
        const chime = audioCtx.createOscillator();
        const cGain = audioCtx.createGain();
        chime.type = 'square';
        chime.frequency.setValueAtTime(440, audioCtx.currentTime);
        chime.frequency.setValueAtTime(660, audioCtx.currentTime + 0.08);
        chime.frequency.setValueAtTime(880, audioCtx.currentTime + 0.16);
        cGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        cGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        chime.connect(cGain);
        cGain.connect(audioCtx.destination);
        chime.start();
        chime.stop(audioCtx.currentTime + 0.35);
      }, 150);
    }

    function toggleAudio() {
      sfxEnabled = !sfxEnabled;
      document.getElementById('audioBtn').textContent = sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      if (sfxEnabled) playBlip();
    }

    // =========================================================================
    // 3. PIXEL-ART PORTRAIT RENDERER (KYAW-GYI ASTRONAUT)
    // =========================================================================
    function drawKyawGyiPortrait(frameTick) {
      const pCanvas = document.getElementById('portraitCanvas');
      const ctx = pCanvas.getContext('2d');
      ctx.clearRect(0, 0, 48, 48);

      const bob = Math.sin(frameTick * 0.12) > 0 ? 0 : 1;
      const wave = Math.sin(frameTick * 0.2) > 0 ? -1 : 0;

      // Jetpack
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(10, 20 + bob, 5, 12);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(11, 21 + bob, 2, 10);

      // Helmet Outer (White & Light Blue Shading)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(15, 8 + bob, 18, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, 7 + bob, 14, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(15, 22 + bob, 18, 2);

      // Visor (Dark Navy Glass + Crisp Highlight)
      ctx.fillStyle = '#090f26';
      ctx.fillRect(19, 11 + bob, 12, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(28, 12 + bob, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(27, 13 + bob, 2, 3);

      // Torso Suit
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(15, 24 + bob, 16, 12);
      // Chest Control Box
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(19, 27 + bob, 8, 6);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(21, 28 + bob, 4, 2);

      // Left Arm (Waving Greeting!)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(31, 23 + bob + wave, 5, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(34, 20 + bob + wave, 4, 4);

      // Right Arm
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(11, 25 + bob, 4, 7);

      // Legs & Boots
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(16, 36 + bob, 6, 5);
      ctx.fillRect(24, 36 + bob, 6, 5);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(15, 40, 7, 2);
      ctx.fillRect(24, 40, 7, 2);
    }

    // =========================================================================
    // 4. DIALOGUE & BILINGUAL SYSTEM
    // =========================================================================
    function setDialogueText(entryObjOrString) {
      if (typewriterTimer) clearInterval(typewriterTimer);

      if (typeof entryObjOrString === 'string') {
        currentFullText = entryObjOrString;
      } else {
        currentFullText = entryObjOrString[currentLang] || entryObjOrString.en;
      }

      const el = document.getElementById('dialogueText');
      if (currentLang === 'my') {
        el.classList.add('lang-my');
        document.documentElement.lang = 'my';
      } else {
        el.classList.remove('lang-my');
        document.documentElement.lang = 'en';
      }

      displayedChars = 0;
      el.textContent = '';

      typewriterTimer = setInterval(() => {
        displayedChars += 2;
        el.textContent = currentFullText.slice(0, displayedChars);
        if (displayedChars % 8 === 0) playBlip();
        if (displayedChars >= currentFullText.length) {
          el.textContent = currentFullText;
          clearInterval(typewriterTimer);
          typewriterTimer = null;
        }
      }, 22);
    }

    function advanceDialogue() {
      if (typewriterTimer) {
        // Finish current line immediately
        clearInterval(typewriterTimer);
        typewriterTimer = null;
        document.getElementById('dialogueText').textContent = currentFullText;
        return;
      }
      dialogueIndex = (dialogueIndex + 1) % DIALOGUE_SCRIPT.length;
      setDialogueText(DIALOGUE_SCRIPT[dialogueIndex]);
    }

    function sendCustomDialogue() {
      const input = document.getElementById('customDialogueInput');
      const val = input.value.trim();
      if (!val) return;
      const prefix = currentLang === 'my' ? 'ကျော်ကြီး: "' : 'KyawGyi: "';
      setDialogueText(`${prefix}${val}"`);
      input.value = '';
    }

    function toggleLanguage() {
      currentLang = currentLang === 'en' ? 'my' : 'en';
      const t = UI_TEXT[currentLang];

      document.getElementById('locationSubtitle').textContent = t.subtitle;
      document.getElementById('lblAlt').textContent = t.lblAlt;
      document.getElementById('lblVel').textContent = t.lblVel;
      document.getElementById('lblMass').textContent = t.lblMass;
      document.getElementById('lblTwr').textContent = t.lblTwr;
      document.getElementById('lblStage').textContent = t.lblStage;
      document.getElementById('btnLaunch').textContent = t.btnLaunch;
      document.getElementById('btnStage1').textContent = t.btnStage1;
      document.getElementById('btnStage2').textContent = t.btnStage2;
      document.getElementById('btnReset').textContent = t.btnReset;
      document.getElementById('customDialogueInput').placeholder = t.placeholder;

      // Apply Myanmar font class if needed
      const subEl = document.getElementById('locationSubtitle');
      if (currentLang === 'my') {
        subEl.classList.add('lang-my');
      } else {
        subEl.classList.remove('lang-my');
      }

      setDialogueText(DIALOGUE_SCRIPT[dialogueIndex]);
      updateTelemetryUI();
    }

    function showEventBanner(text) {
      const banner = document.getElementById('eventBanner');
      banner.textContent = text;
      banner.style.opacity = '1';
      setTimeout(() => {
        banner.style.opacity = '0';
      }, 2800);
    }

    // =========================================================================
    // 5. ROCKET LAUNCH & REALISTIC MASS-SHEDDING PHYSICS
    // =========================================================================
    function toggleAutoStage() {
      autoStage = !autoStage;
      const dot = document.getElementById('autoStageDot');
      const lbl = document.getElementById('autoStageLabel');
      dot.className = autoStage
        ? 'inline-block w-2 h-2 rounded-full bg-emerald-400'
        : 'inline-block w-2 h-2 rounded-full bg-slate-500';
      lbl.textContent = autoStage ? 'AUTO-STAGE: ON' : 'AUTO-STAGE: OFF';
      playBlip();
    }

    function startLaunch() {
      if (MISSION.phase !== 'PAD') return;
      document.querySelector('footer')?.classList.add('launch-dismissed');
      MISSION.phase = 'IGNITION';
      MISSION.time = 0;
      MISSION.shakeIntensity = 6;

      playIgnitionSound();
      document.getElementById('btnLaunch').disabled = true;

      showEventBanner(currentLang === 'my' ? 'မီးစတင်ရှို့နေပါပြီ - LIFTOFF!' : 'MAIN ENGINES IGNITED - LIFTOFF!');
      setDialogueText({
        en: 'KyawGyi: "Ignition confirmed! Feel the rumble across Maha Bandula Park! We are lifting off cleanly from downtown Yangon!"',
        my: 'ကျော်ကြီး: "အင်ဂျင်မီးစတင်ရှို့လိုက်ပါပြီ! မဟာဗန္ဓုလပန်းခြံတစ်ဝိုက် တုန်ခါသံနဲ့အတူ ရန်ကုန်မြို့ကနေ ဘေးကင်းစွာ စတင်ပျံတက်နေပါပြီ!"'
      });

      setTimeout(() => {
        if (MISSION.phase === 'IGNITION') {
          MISSION.phase = 'STAGE1_ASCENT';
          document.getElementById('btnStage1').disabled = false;
        }
      }, 1200);
    }

    function detachSideBoosters() {
      if (!MISSION.hasSideBoosters || MISSION.phase === 'PAD' || MISSION.phase === 'IGNITION') return;

      MISSION.hasSideBoosters = false;
      MISSION.phase = 'STAGE2_ASCENT';
      // Realistic Mass Shedding: Drop empty booster casings!
      // F = m * a => Dropping mass sharply increases acceleration (a = F / m)
      const metrics = getDesignMetrics();
      MISSION.massTons = metrics.stage2Mass;

      // Spawn tumbling pixel-art side boosters falling away realistically
      const offsets = SHIP_DESIGN.boosters === 'quad' ? [-22, -14, 14, 22] : [-15, 15];
      offsets.forEach((offsetX) => {
        const sideDir = offsetX < 0 ? -1 : 1;
        MISSION.detachedParts.push({
          type: 'BOOSTER',
          x: MISSION.shipX + Math.cos(MISSION.shipAngle + Math.PI / 2) * offsetX,
          y: MISSION.shipY + Math.sin(MISSION.shipAngle + Math.PI / 2) * offsetX,
          vx: sideDir * (38 + Math.abs(offsetX) * 0.8 + Math.random() * 12),
          vy: 28 + Math.random() * 14,
          angle: MISSION.shipAngle,
          vAngle: sideDir * 0.045,
          width: 10,
          height: 44
        });
      });

      playSeparationSound();
      document.getElementById('btnStage1').disabled = true;
      document.getElementById('btnStage2').disabled = false;

      showEventBanner(
        currentLang === 'my'
          ? `လောင်စာအိုးများ ဖြုတ်ချပြီး! အလေးချိန် -${metrics.boosterMass}t လျော့ကျသွားပြီ!`
          : `BOOSTERS JETTISONED! MASS DROPPED -${metrics.boosterMass}t -> ACCELERATION SURGING!`
      );

      setDialogueText({
        en: `KyawGyi: "Boosters detached! By shedding ${metrics.boosterMass} tons of empty fuel tanks, our thrust-to-weight ratio just surged—we are rocketing faster into the upper atmosphere!"`,
        my: `ကျော်ကြီး: "ဘေးတွဲလောင်စာအိုးတွေကို အောင်မြင်စွာ ဖြုတ်ချလိုက်ပါပြီ! တန်ချိန် ${metrics.boosterMass} လျှော့ချလိုက်တဲ့အတွက် အာကာသယာဉ်ဟာ အရှိန်ပိုမြန်ဆန်စွာ ပျံတက်နေပါပြီ!"`
      });
    }

    function detachCoreStage() {
      if (!MISSION.hasCoreStage || MISSION.hasSideBoosters) return;

      MISSION.hasCoreStage = false;
      MISSION.phase = 'ORBIT';
      MISSION.shakeIntensity = 3.5;
      // Keep the jettison and orbital sprite visible before transitioning scenes.
      clearTimeout(orbitHandoffTimer);
      orbitHandoffSent = false;
      orbitHandoffTimer = window.setTimeout(() => {
        if (MISSION.phase !== 'ORBIT' || orbitHandoffSent) return;
        orbitHandoffSent = true;
        window.parent.postMessage({ type: 'silent-launch-orbit' }, window.location.origin);
      }, 3400);

      // Shed main external tank / core stage, leaving agile orbiter
      const metrics = getDesignMetrics();
      MISSION.massTons = metrics.orbiterMass;

      // 1. Spawn the tall white/orange core booster separating backward
      MISSION.detachedParts.push({
        type: 'CORE',
        x: MISSION.shipX - Math.cos(MISSION.shipAngle) * 28,
        y: MISSION.shipY - Math.sin(MISSION.shipAngle) * 28,
        vx: -24,
        vy: 38,
        angle: MISSION.shipAngle,
        vAngle: -0.022,
        width: 16,
        height: 54
      });

      // 2. If clamshell payload fairings were attached, split both halves outward!
      if (MISSION.hasFairings) {
        MISSION.hasFairings = false;
        [-1, 1].forEach((sideDir) => {
          MISSION.detachedParts.push({
            type: sideDir < 0 ? 'FAIRING_L' : 'FAIRING_R',
            x: MISSION.shipX + Math.cos(MISSION.shipAngle + Math.PI / 2) * (sideDir * 11),
            y: MISSION.shipY + Math.sin(MISSION.shipAngle + Math.PI / 2) * (sideDir * 11) - 10,
            vx: sideDir * 44,
            vy: 14,
            angle: MISSION.shipAngle,
            vAngle: sideDir * 0.055
          });
        });
      }

      playSeparationSound();
      document.getElementById('btnStage2').disabled = true;

      showEventBanner(
        currentLang === 'my'
          ? 'ပင်မလောင်စာကန်နှင့် အကာအရံခွံများ ဖြုတ်ချပြီး! ဆိုလာတောင်ပံများ ဖြန့်ကျက်နေပြီ!'
          : 'CORE & FAIRINGS SEPARATED! SPACEPLANE STABLE IN ORBIT!'
      );

      setDialogueText({
        en: 'KyawGyi: "Core stage and clamshell fairings jettisoned! Look at the Zawgyi-01 capsule unfolding its twin blue solar array wings in orbit—greetings to Yangon and all of Myanmar!"',
        my: 'ကျော်ကြီး: "ပင်မလောင်စာကန်နဲ့ အကာအရံခွံတွေကို ဖြုတ်ချပြီး ဇော်ဂျီ-၀၁ အာကာသယာဉ်ရဲ့ ဆိုလာတောင်ပံနှစ်ဖက် ဖြန့်ကျက်လိုက်ပါပြီ! ရန်ကုန်မြို့နဲ့ မြန်မာပြည်သူအားလုံးကို အာကာသကနေ နှုတ်ဆက်ပါတယ်!"'
      });
    }

    function resetSimulation() {
      clearTimeout(orbitHandoffTimer);
      orbitHandoffTimer = null;
      orbitHandoffSent = false;
      document.querySelector('footer')?.classList.remove('launch-dismissed');
      const metrics = getDesignMetrics();
      MISSION.phase = 'PAD';
      MISSION.time = 0;
      MISSION.altitudeKm = 0;
      MISSION.velocityMs = 0;
      MISSION.massTons = metrics.totalPadMass;
      MISSION.accelG = 1.0;
      MISSION.cameraY = 0;
      MISSION.shakeIntensity = 0;
      MISSION.shipAngle = -Math.PI / 2;
      MISSION.hasSideBoosters = SHIP_DESIGN.boosters !== 'single';
      MISSION.hasCoreStage = true;
      MISSION.hasFairings = Boolean(SHIP_DESIGN.fairing);
      MISSION.wingDeployProgress = SHIP_DESIGN.fairing ? 0 : 1;
      MISSION.detachedParts = [];
      MISSION.particles = [];

      document.getElementById('btnLaunch').disabled = false;
      document.getElementById('btnStage1').disabled = true;
      document.getElementById('btnStage2').disabled = true;

      dialogueIndex = 0;
      setDialogueText(DIALOGUE_SCRIPT[0]);
      playBlip();
      updateTelemetryUI();
      updateShipSpecBadge();
    }

    function updateShipSpecBadge() {
      const hullNames = {
        capsule: 'ZAWGYI-01 CAPSULE',
        shuttle: 'BAGAN SPACEPLANE',
        lander: 'PYU HEAVY LANDER'
      };
      const boosterNames = {
        twin: 'TWIN BOOSTERS',
        quad: 'QUAD HEAVY',
        single: 'SINGLE CORE'
      };
      const label = SHIP_DESIGN.customSpriteImg
        ? `CUSTOM PNG SPRITE // ${boosterNames[SHIP_DESIGN.boosters]}`
        : `SILENT LEGACY SPACEPLANE // ${boosterNames[SHIP_DESIGN.boosters]}`;
      document.getElementById('shipSpecLabel').textContent = label;
    }

    function updateTelemetryUI() {
      const t = UI_TEXT[currentLang];
      document.getElementById('valAlt').textContent = `${MISSION.altitudeKm.toFixed(1)} km`;
      document.getElementById('valVel').textContent = `${Math.round(MISSION.velocityMs).toLocaleString()} m/s`;
      document.getElementById('valMass').textContent = `${MISSION.massTons} t`;
      document.getElementById('valTwr').textContent = `${MISSION.accelG.toFixed(2)} G`;
      document.getElementById('valStage').textContent = t.stages[MISSION.phase] || MISSION.phase;

      const camEl = document.getElementById('camLabel');
      if (MISSION.altitudeKm < 5) {
        camEl.textContent = t.camGround;
      } else if (MISSION.altitudeKm < 65) {
        camEl.textContent = t.camSky;
      } else {
        camEl.textContent = t.camOrbit;
      }
    }

    // =========================================================================
    // 5B. INTERACTIVE HANGAR & SPACECRAFT DESIGNER CONTROLS
    // =========================================================================
    function openShipDesigner() {
      playBlip();
      const modal = document.getElementById('hangarModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      syncDesignerButtons();
      renderPreviewShip();
    }

    function closeShipDesigner() {
      playBlip();
      const modal = document.getElementById('hangarModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function updateShipConfig(key, value) {
      SHIP_DESIGN[key] = value;
      playBlip();
      syncDesignerButtons();
      renderPreviewShip();
    }

    function setPreviewStage(stageNum) {
      previewStageMode = stageNum;
      playBlip();
      syncDesignerButtons();
      renderPreviewShip();
    }

    function syncDesignerButtons() {
      const highlightActive = (selector, attr, activeVal) => {
        document.querySelectorAll(selector).forEach((btn) => {
          const isMatch = btn.getAttribute(attr) === String(activeVal);
          btn.classList.toggle('border-amber-400', isMatch);
          btn.classList.toggle('bg-[#132657]', isMatch);
          btn.classList.toggle('border-blue-800', !isMatch);
          btn.classList.toggle('bg-[#0a1636]', !isMatch);
        });
      };

      highlightActive('.cfg-hull-btn', 'data-hull', SHIP_DESIGN.hull);
      highlightActive('.cfg-fairing-btn', 'data-fairing', SHIP_DESIGN.fairing);
      highlightActive('.cfg-wings-btn', 'data-wings', SHIP_DESIGN.wings);
      highlightActive('.cfg-boosters-btn', 'data-boosters', SHIP_DESIGN.boosters);
      highlightActive('.cfg-paint-btn', 'data-paint', SHIP_DESIGN.paint);
      highlightActive('.cfg-flame-btn', 'data-flame', SHIP_DESIGN.flame);

      document.querySelectorAll('.pstage-btn').forEach((btn) => {
        const isMatch = Number(btn.getAttribute('data-pstage')) === previewStageMode;
        btn.className = isMatch
          ? 'pstage-btn px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] cursor-pointer'
          : 'pstage-btn px-1.5 py-0.5 rounded bg-slate-800 text-sky-200 font-bold text-[10px] cursor-pointer';
      });

      const captions = [
        'STAGE 0: FULL LIFTOFF STACK + FAIRINGS',
        'STAGE 1: SIDE BOOSTERS DETACHED',
        'STAGE 2: FAIRING SPLIT & CORE SEPARATION',
        'STAGE 3: ORBITAL CAPSULE + SOLAR ARRAYS'
      ];
      const capEl = document.getElementById('previewStageCaption');
      if (capEl) capEl.textContent = captions[previewStageMode] || captions[0];

      const metrics = getDesignMetrics();
      document.getElementById('specMass').textContent = `${metrics.totalPadMass} t`;
      document.getElementById('specThrust').textContent = `${metrics.maxThrust} kN`;
      document.getElementById('specTwr').textContent = `${metrics.liftoffG.toFixed(2)} G`;
    }

    function handleCustomSpriteUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          SHIP_DESIGN.customSpriteImg = img;
          document.getElementById('clearSpriteBtn').classList.remove('hidden');
          renderPreviewShip();
          playBlip();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function clearCustomSprite() {
      SHIP_DESIGN.customSpriteImg = null;
      document.getElementById('customSpriteInput').value = '';
      document.getElementById('clearSpriteBtn').classList.add('hidden');
      renderPreviewShip();
      playBlip();
    }

    function renderPreviewShip() {
      const pCanvas = document.getElementById('shipPreviewCanvas');
      if (!pCanvas) return;
      const pCtx = pCanvas.getContext('2d');
      pCtx.imageSmoothingEnabled = false;
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      // Subtle blueprint grid background
      pCtx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      pCtx.lineWidth = 1;
      for (let x = 0; x < pCanvas.width; x += 16) {
        pCtx.beginPath();
        pCtx.moveTo(x, 0);
        pCtx.lineTo(x, pCanvas.height);
        pCtx.stroke();
      }
      for (let y = 0; y < pCanvas.height; y += 16) {
        pCtx.beginPath();
        pCtx.moveTo(0, y);
        pCtx.lineTo(pCanvas.width, y);
        pCtx.stroke();
      }

      const fPal = FLAME_PALETTES[SHIP_DESIGN.flame];
      const pal = PAINT_PALETTES[SHIP_DESIGN.paint] || PAINT_PALETTES.msa;

      pCtx.save();
      pCtx.translate(pCanvas.width / 2, pCanvas.height / 2 + (previewStageMode === 3 ? 8 : 22));
      const previewScale = previewStageMode === 3 ? 2.05 : 1.30;
      pCtx.scale(previewScale, previewScale);

      if (previewStageMode === 0) {
        // Stage 0: Full Liftoff Stack
        drawRocketStageRect(pCtx, -5, 31, 10, 8, fPal.outer);
        drawRocketStageRect(pCtx, -3, 31, 6, 6, fPal.mid);
        drawRocketStageRect(pCtx, -2, 31, 4, 3, fPal.core);
        drawCustomShipAssembly(pCtx, {
          hasSideBoosters: SHIP_DESIGN.boosters !== 'single',
          hasCoreStage: true,
          hasFairings: Boolean(SHIP_DESIGN.fairing),
          wingDeploy: SHIP_DESIGN.fairing ? 0 : 1
        });
      } else if (previewStageMode === 1) {
        // Stage 1: Side boosters detaching outward
        drawRocketStageRect(pCtx, -5, 31, 10, 9, fPal.outer);
        drawRocketStageRect(pCtx, -3, 31, 6, 6, fPal.mid);
        drawCustomShipAssembly(pCtx, {
          hasSideBoosters: false,
          hasCoreStage: true,
          hasFairings: Boolean(SHIP_DESIGN.fairing),
          wingDeploy: SHIP_DESIGN.fairing ? 0 : 1
        });
        // Draw separating boosters flanking lower right/left
        if (SHIP_DESIGN.boosters !== 'single') {
          [-24, 24].forEach((bx) => {
            pCtx.save();
            pCtx.translate(bx, 18);
            pCtx.rotate(bx < 0 ? -0.18 : 0.18);
            drawSingleBoosterSprite(pCtx, pal);
            pCtx.restore();
          });
        }
      } else if (previewStageMode === 2) {
        // Stage 2: Clamshell fairings splitting & core stage separating below
        drawRocketStageRect(pCtx, -4, -10, 8, 7, fPal.mid);
        drawCustomShipAssembly(pCtx, {
          hasSideBoosters: false,
          hasCoreStage: false,
          hasFairings: false,
          wingDeploy: 0.85
        });
        // Clamshell fairing halves drifting outward
        if (SHIP_DESIGN.fairing) {
          [-18, 18].forEach((fx) => {
            pCtx.save();
            pCtx.translate(fx, -14);
            pCtx.rotate(fx < 0 ? -0.24 : 0.24);
            drawClamshellHalfSprite(pCtx, fx < 0 ? -1 : 1, pal);
            pCtx.restore();
          });
        }
        // Core booster dropping away below
        pCtx.save();
        pCtx.translate(-4, 26);
        pCtx.rotate(-0.15);
        drawCoreBoosterSprite(pCtx, pal);
        pCtx.restore();
      } else {
        // Stage 3: Pure Orbital Capsule with fully unfolded solar array wings
        drawRocketStageRect(pCtx, -4, 12, 8, 8, fPal.outer);
        drawRocketStageRect(pCtx, -2.5, 12, 5, 5, fPal.mid);
        drawRocketStageRect(pCtx, -1.5, 12, 3, 2.5, fPal.core);
        drawCustomShipAssembly(pCtx, {
          hasSideBoosters: false,
          hasCoreStage: false,
          hasFairings: false,
          wingDeploy: 1
        });
      }

      pCtx.restore();
    }

    function applyShipDesign(autoLaunchNow) {
      closeShipDesigner();
      resetSimulation();

      const hullLabels = {
        capsule: 'Zawgyi-01 Capsule',
        shuttle: 'Bagan Spaceplane',
        lander: 'Pyu Heavy Lander'
      };
      const chosenName = SHIP_DESIGN.customSpriteImg ? 'Custom Uploaded Spacecraft' : 'Silent Legacy Pixel Spaceplane';

      setDialogueText({
        en: `KyawGyi: "New spacecraft rolled out to Bandula Pad-01! ${chosenName} is fueled, telemetry calibrated, and ready for test launch!"`,
        my: `ကျော်ကြီး: "အာကာသယာဉ်ပုံစံအသစ်ကို ပစ်လွှတ်စင်ပေါ် တင်ဆောင်ပြီးပါပြီ! စမ်းသပ်ပျံသန်းဖို့ အသင့်ဖြစ်နေပါပြီခင်ဗျာ!"`
      });

      if (autoLaunchNow) {
        setTimeout(() => startLaunch(), 250);
      }
    }

    // =========================================================================
    // 6. PIXEL-ART CANVAS RENDERING ENGINE (BANDULA PARK, SULE PAGODA, CITY HALL)
    // =========================================================================
    const canvas = document.getElementById('spaceCanvas');
    const ctx = canvas.getContext('2d');

    // Logical pixel resolution (crisp 16-bit aesthetic scaled smoothly)
    const LOGICAL_W = 640;
    let LOGICAL_H = 340;

    function resizeCanvas() {
      const wrapper = document.getElementById('canvasWrapper');
      const rect = wrapper.getBoundingClientRect();
      const aspect = rect.height / Math.max(rect.width, 1);
      LOGICAL_H = Math.max(260, Math.round(LOGICAL_W * aspect));
      canvas.width = LOGICAL_W;
      canvas.height = LOGICAL_H;
      ctx.imageSmoothingEnabled = false;
      initEnvironmentEntities();
    }

    function initEnvironmentEntities() {
      // Generate starry night sky
      MISSION.stars = [];
      for (let i = 0; i < 110; i++) {
        MISSION.stars.push({
          x: Math.random() * LOGICAL_W,
          y: Math.random() * (LOGICAL_H * 2.5) - LOGICAL_H * 1.5,
          size: Math.random() > 0.82 ? 2 : 1,
          twinkle: Math.random() * Math.PI * 2
        });
      }

      // Generate diverse spectators watching safely behind Bandula Park Police Barricades
      MISSION.crowd = [];
      const longyiColors = ['#7f1d1d', '#1e3a8a', '#065f46', '#581c87', '#9a3412', '#115e59'];
      const shirtColors = ['#f8fafc', '#fde047', '#38bdf8', '#fb7185', '#a7f3d0', '#e2e8f0'];

      // Left safe viewing zone spectators (x: 15 to 230)
      for (let x = 18; x <= 225; x += 14) {
        MISSION.crowd.push({
          x: x + (Math.random() * 4 - 2),
          y: LOGICAL_H - 36 + (Math.random() * 6 - 3),
          longyi: longyiColors[Math.floor(Math.random() * longyiColors.length)],
          shirt: shirtColors[Math.floor(Math.random() * shirtColors.length)],
          hasPhone: Math.random() > 0.68,
          isPolice: false,
          phase: Math.random() * 6
        });
      }

      // Center-right Police Officers & Spectators behind barricade (x: 375 to 615)
      for (let x = 380; x <= 615; x += 15) {
        const isPolice = x > 545 || (x > 375 && x < 415);
        MISSION.crowd.push({
          x: x + (Math.random() * 4 - 2),
          y: LOGICAL_H - 36 + (Math.random() * 6 - 3),
          longyi: isPolice ? '#1e293b' : longyiColors[Math.floor(Math.random() * longyiColors.length)],
          shirt: isPolice ? '#334155' : shirtColors[Math.floor(Math.random() * shirtColors.length)],
          hasPhone: !isPolice && Math.random() > 0.6,
          isPolice,
          phase: Math.random() * 6
        });
      }
    }

    // Helper for crisp integer pixel rectangles
    function pxRect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function drawSkyAndStars(camY) {
      // Transition sky gradient from Yangon Dusk/Night to Deep Orbital Space
      const spaceFactor = Math.min(1, MISSION.altitudeKm / 60);
      const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);

      if (spaceFactor < 0.7) {
        grad.addColorStop(0, '#060c21');
        grad.addColorStop(0.55, '#101f4a');
        grad.addColorStop(1, '#1e3a6e');
      } else {
        grad.addColorStop(0, '#02040a');
        grad.addColorStop(0.6, '#050b1c');
        grad.addColorStop(1, '#0b1838');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Twinkling Pixel Stars
      MISSION.stars.forEach((s) => {
        const screenY = ((s.y + camY * 0.25) % LOGICAL_H + LOGICAL_H) % LOGICAL_H;
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(MISSION.time * 2 + s.twinkle));
        ctx.fillStyle = `rgba(255, 255, 240, ${alpha.toFixed(2)})`;
        ctx.fillRect(Math.round(s.x), Math.round(screenY), s.size, s.size);
      });

      // Curved Earth Horizon Glow when high in orbit
      if (MISSION.altitudeKm > 35) {
        const horizonY = LOGICAL_H + (MISSION.altitudeKm - 35) * 2.2;
        if (horizonY < LOGICAL_H + 140) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.beginPath();
          ctx.arc(LOGICAL_W / 2, horizonY + 420, 445, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f294a';
          ctx.beginPath();
          ctx.arc(LOGICAL_W / 2, horizonY + 420, 435, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawYangonLandmarks(camY) {
      const groundBase = LOGICAL_H + camY;
      if (groundBase > LOGICAL_H + 260) return; // Off-screen when high in space

      // 1. Distant Downtown Yangon High-Rise Buildings (Left & Center-Left)
      const buildings = [
        { x: 35, w: 46, h: 115, c: '#162447' },
        { x: 92, w: 54, h: 145, c: '#1b2d56' },
        { x: 155, w: 38, h: 95, c: '#132040' },
        { x: 285, w: 34, h: 85, c: '#17274d' }
      ];
      buildings.forEach((b) => {
        const by = groundBase - 42 - b.h;
        pxRect(b.x, by, b.w, b.h, b.c);
        // Lit office windows
        for (let wy = by + 8; wy < groundBase - 50; wy += 9) {
          for (let wx = b.x + 5; wx < b.x + b.w - 6; wx += 7) {
            if ((wx + wy) % 3 !== 0) {
              pxRect(wx, wy, 3, 4, '#fde68a');
            }
          }
        }
      });

      // 2. GOLDEN SULE PAGODA (Right Background - Iconic Yangon Landmark)
      const suleX = 535;
      const suleBaseY = groundBase - 45;
      // Terraced octagonal golden base
      pxRect(suleX - 44, suleBaseY - 22, 88, 22, '#b45309');
      pxRect(suleX - 38, suleBaseY - 34, 76, 12, '#d97706');
      pxRect(suleX - 30, suleBaseY - 46, 60, 12, '#f59e0b');
      // Bell dome & rings
      pxRect(suleX - 22, suleBaseY - 64, 44, 18, '#fbbf24');
      pxRect(suleX - 15, suleBaseY - 82, 30, 18, '#fcd34d');
      pxRect(suleX - 9, suleBaseY - 102, 18, 20, '#fde047');
      // Spire & Hti umbrella
      pxRect(suleX - 4, suleBaseY - 124, 8, 22, '#fef08a');
      pxRect(suleX - 1, suleBaseY - 140, 2, 16, '#ffffff');
      // Golden Aura Glow
      ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
      ctx.beginPath();
      ctx.arc(suleX, suleBaseY - 70, 62, 0, Math.PI * 2);
      ctx.fill();

      // 3. YANGON CITY HALL (White Burmese-Colonial Architecture behind Park)
      const hallX = 345;
      const hallY = groundBase - 115;
      pxRect(hallX, hallY + 25, 195, 50, '#e2e8f0');
      pxRect(hallX + 4, hallY + 29, 187, 46, '#f8fafc');
      // Traditional tiered Pyatthat roofs
      pxRect(hallX + 6, hallY + 15, 22, 10, '#cbd5e1');
      pxRect(hallX + 11, hallY + 7, 12, 8, '#f1f5f9');
      pxRect(hallX + 16, hallY, 2, 7, '#fbbf24');

      pxRect(hallX + 75, hallY + 10, 45, 15, '#cbd5e1');
      pxRect(hallX + 85, hallY + 1, 25, 9, '#f8fafc');
      pxRect(hallX + 96, hallY - 8, 3, 9, '#fbbf24');

      // Arched colonnade windows
      for (let wx = hallX + 14; wx < hallX + 180; wx += 16) {
        pxRect(wx, hallY + 38, 8, 16, '#1e3a8a');
        pxRect(wx + 1, hallY + 39, 6, 6, '#38bdf8');
      }

      // 4. INDEPENDENCE MONUMENT OBELISK (Maha Bandula Park Centerpiece)
      const obX = 458;
      const obBaseY = groundBase - 40;
      // Pedestal
      pxRect(obX - 16, obBaseY - 18, 32, 18, '#cbd5e1');
      pxRect(obX - 12, obBaseY - 26, 24, 8, '#f8fafc');
      // Tall white obelisk shaft + golden emblem
      pxRect(obX - 7, obBaseY - 125, 14, 99, '#f1f5f9');
      pxRect(obX - 4, obBaseY - 140, 8, 15, '#ffffff');
      pxRect(obX - 2, obBaseY - 148, 4, 8, '#e2e8f0');
      pxRect(obX - 3, obBaseY - 48, 6, 14, '#f59e0b');

      // 5. LUSH MAHA BANDULA PARK TREES & FOREGROUND FOLIAGE
      const treeClusters = [
        { x: 18, y: groundBase - 78, r: 28 },
        { x: 52, y: groundBase - 68, r: 22 },
        { x: 120, y: groundBase - 64, r: 20 },
        { x: 175, y: groundBase - 62, r: 19 },
        { x: 315, y: groundBase - 56, r: 17 },
        { x: 615, y: groundBase - 76, r: 28 }
      ];
      treeClusters.forEach((tr) => {
        pxRect(tr.x - 3, tr.y, 6, groundBase - 40 - tr.y, '#451a03');
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(tr.x - 4, tr.y - 4, tr.r * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(tr.x - 6, tr.y - 7, tr.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. PARK LAWN, WALKWAY & LAUNCHPAD (Center-Left Safe Launch Zone)
      pxRect(0, groundBase - 42, LOGICAL_W, 12, '#166534');
      pxRect(0, groundBase - 30, LOGICAL_W, 30, '#1e293b'); // Paved stone plaza

      // Launchpad Concrete Blast Deflector & Gantry Tower
      const padX = 248;
      pxRect(padX - 32, groundBase - 44, 64, 8, '#475569');
      pxRect(padX - 24, groundBase - 48, 48, 4, '#94a3b8');
      // Red/White Steel Launch Tower
      pxRect(padX - 28, groundBase - 118, 6, 70, '#dc2626');
      pxRect(padX - 22, groundBase - 102, 14, 3, '#cbd5e1');
      pxRect(padX - 22, groundBase - 76, 14, 3, '#cbd5e1');

      // 7. GLOWING PARK STREETLAMPS
      [78, 210, 415, 575].forEach((lx) => {
        pxRect(lx, groundBase - 88, 2, 54, '#64748b');
        pxRect(lx - 2, groundBase - 90, 6, 3, '#fef08a');
        ctx.fillStyle = 'rgba(254, 240, 138, 0.16)';
        ctx.beginPath();
        ctx.arc(lx + 1, groundBase - 86, 18, 0, Math.PI * 2);
        ctx.fill();
      });

      // 8. SAFE VIEWING AREA: METAL POLICE BARRICADES & CHEERING SPECTATORS
      drawSpectatorsAndBarricades(groundBase);
    }

    function drawSpectatorsAndBarricades(groundBase) {
      // Draw Spectators behind the barricades
      MISSION.crowd.forEach((p) => {
        const py = p.y + (groundBase - LOGICAL_H);
        const cheerOffset =
          MISSION.phase !== 'PAD' ? Math.round(Math.sin(MISSION.time * 9 + p.phase) * 2) : 0;

        // Head
        pxRect(p.x, py - 15 + cheerOffset, 4, 4, '#d97706');
        // Hair or Police Cap
        if (p.isPolice) {
          pxRect(p.x - 1, py - 17 + cheerOffset, 6, 2, '#1e3a8a');
        } else {
          pxRect(p.x, py - 16 + cheerOffset, 4, 2, '#0f172a');
        }

        // Shirt / Jacket
        pxRect(p.x - 1, py - 11 + cheerOffset, 6, 6, p.shirt);
        // Traditional Longyi or Trousers
        pxRect(p.x - 1, py - 5 + cheerOffset, 6, 7, p.longyi);

        // Waving Arms or Holding Smartphone taking photos!
        if (p.hasPhone) {
          pxRect(p.x + 5, py - 13 + cheerOffset, 3, 2, '#38bdf8'); // Glowing camera screen
        } else if (MISSION.phase !== 'PAD') {
          pxRect(p.x - 3, py - 15 + cheerOffset, 2, 5, p.shirt);
          pxRect(p.x + 5, py - 15 + cheerOffset, 2, 5, p.shirt);
        }
      });

      // Draw Metal Safety Barricades in front of crowd (Left & Right Safe Zones)
      const drawFenceSegment = (startX, endX) => {
        const fy = groundBase - 31;
        pxRect(startX, fy, endX - startX, 2, '#cbd5e1');
        pxRect(startX, fy + 7, endX - startX, 2, '#94a3b8');
        for (let bx = startX; bx <= endX; bx += 8) {
          pxRect(bx, fy, 2, 10, '#cbd5e1');
        }
      };

      drawFenceSegment(12, 232);
      drawFenceSegment(372, 625);

      // "POLICE / SAFE ZONE" Signboards on Barricades
      pxRect(425, groundBase - 32, 34, 9, '#1d4ed8');
      ctx.fillStyle = '#ffffff';
      ctx.font = '6px monospace';
      ctx.fillText('POLICE', 428, groundBase - 25);

      pxRect(555, groundBase - 32, 38, 9, '#1d4ed8');
      ctx.fillText('SAFE ZONE', 557, groundBase - 25);
    }

    // =========================================================================
    // 7. MULTI-STAGE SPACECRAFT, SEPARATING BOOSTERS & EXHAUST PARTICLES
    // =========================================================================
    function drawRocketStageRect(ctx, x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function drawSingleBoosterSprite(targetCtx, pal) {
      // Cylindrical white/painted booster with twin orange rings & black nozzle
      drawRocketStageRect(targetCtx, -3.5, -13, 7, 39, pal.primary);
      drawRocketStageRect(targetCtx, -2.5, -13, 2, 39, pal.highlight);
      drawRocketStageRect(targetCtx, -3.5, -6, 7, 4, pal.trim);
      drawRocketStageRect(targetCtx, -3.5, 18, 7, 4, pal.trim);
      drawRocketStageRect(targetCtx, -1, 2, 2, 12, pal.dark);
      // Conical nosecone
      drawRocketStageRect(targetCtx, -2.5, -18, 5, 5, pal.highlight);
      drawRocketStageRect(targetCtx, -1.5, -21, 3, 3, pal.primary);
      // Engine bell
      drawRocketStageRect(targetCtx, -2.5, 26, 5, 4, '#0f172a');
      drawRocketStageRect(targetCtx, -2, 27, 4, 1, pal.trim);
    }

    function drawCoreBoosterSprite(targetCtx, pal) {
      // Tall white core stage with upper & lower orange bands + vertical dark instrumentation stripe
      drawRocketStageRect(targetCtx, -7, -22, 14, 48, pal.primary);
      drawRocketStageRect(targetCtx, -5, -22, 3, 48, pal.highlight);
      // Upper & lower orange-gold stage bands
      drawRocketStageRect(targetCtx, -7, -14, 14, 6, pal.trim);
      drawRocketStageRect(targetCtx, -7, 17, 14, 5, pal.trim);
      // Vertical dark grey avionics raceway panel
      drawRocketStageRect(targetCtx, -2, -4, 4, 17, pal.dark);
      drawRocketStageRect(targetCtx, -1, -2, 2, 13, '#64748b');
      // Twin main engine nozzles
      drawRocketStageRect(targetCtx, -6, 26, 5, 5, '#0f172a');
      drawRocketStageRect(targetCtx, 1, 26, 5, 5, '#0f172a');
      drawRocketStageRect(targetCtx, -5, 27, 3, 1, pal.trim);
      drawRocketStageRect(targetCtx, 2, 27, 3, 1, pal.trim);
    }

    function drawClamshellHalfSprite(targetCtx, sideDir, pal) {
      // Curved aerodynamic clamshell fairing half that encases the folded solar panels
      if (sideDir < 0) {
        drawRocketStageRect(targetCtx, -9, -4, 6, 17, pal.primary);
        drawRocketStageRect(targetCtx, -8, -9, 5, 5, pal.highlight);
        drawRocketStageRect(targetCtx, -6, -13, 4, 4, pal.primary);
        drawRocketStageRect(targetCtx, -4, -4, 1, 17, pal.dark);
      } else {
        drawRocketStageRect(targetCtx, 3, -4, 6, 17, pal.primary);
        drawRocketStageRect(targetCtx, 3, -9, 5, 5, pal.highlight);
        drawRocketStageRect(targetCtx, 2, -13, 4, 4, pal.primary);
        drawRocketStageRect(targetCtx, 3, -4, 1, 17, pal.dark);
      }
    }

    function drawCustomShipAssembly(targetCtx, opts) {
      const pal = PAINT_PALETTES[SHIP_DESIGN.paint] || PAINT_PALETTES.navy;
      const hasBoosters = opts.hasSideBoosters && SHIP_DESIGN.boosters !== 'single';
      const hasCore = Boolean(opts.hasCoreStage);
      // Rocket stages fall away but the reference spaceplane remains intact.
      if (hasCore) {
        targetCtx.save();
        targetCtx.translate(0, 32);
        drawCoreBoosterSprite(targetCtx, pal);
        targetCtx.restore();
      }
      if (hasBoosters) {
        const offsets = SHIP_DESIGN.boosters === 'quad' ? [-32, -23, 23, 32] : [-29, 29];
        for (const offset of offsets) {
          targetCtx.save();
          targetCtx.translate(offset, 35);
          drawSingleBoosterSprite(targetCtx, pal);
          targetCtx.restore();
        }
      }
      const uploaded = SHIP_DESIGN.customSpriteImg;
      const orbital = !hasCore && !hasBoosters && !uploaded;
      const ship = uploaded || (orbital ? SPACEPLANE_SPRITES.cruise : SPACEPLANE_SPRITES.upright);
      if (ship && ship.complete && ship.naturalWidth > 0) {
        targetCtx.save();
        targetCtx.imageSmoothingEnabled = false;
        if (orbital) {
          targetCtx.rotate(Math.PI / 2);
          targetCtx.drawImage(ship, -43, -31, 86, 62);
        } else {
          targetCtx.drawImage(ship, -37, -64, 74, 78);
        }
        targetCtx.restore();
      } else {
        drawRocketStageRect(targetCtx, -17, -39, 34, 33, '#28345e');
        drawRocketStageRect(targetCtx, -12, -47, 24, 13, '#454e80');
        drawRocketStageRect(targetCtx, -7, -43, 14, 18, '#2385ef');
        drawRocketStageRect(targetCtx, -29, -24, 58, 8, '#35426c');
      }
      if (opts.hasFairings && hasCore) {
        drawRocketStageRect(targetCtx, -39, -15, 3, 12, '#fb923c');
        drawRocketStageRect(targetCtx, 36, -15, 3, 12, '#fb923c');
      }
    }

    function drawSpacecraft() {
      ctx.save();
      ctx.translate(Math.round(MISSION.shipX), Math.round(MISSION.shipY));
      // Rotate so 0 rad = pointing right, -PI/2 = pointing straight up
      ctx.rotate(MISSION.shipAngle + Math.PI / 2);

      drawCustomShipAssembly(ctx, {
        hasSideBoosters: MISSION.hasSideBoosters,
        hasCoreStage: MISSION.hasCoreStage,
        hasFairings: MISSION.hasFairings,
        wingDeploy: MISSION.wingDeployProgress
      });

      ctx.restore();
    }

    function drawDetachedParts() {
      const pal = PAINT_PALETTES[SHIP_DESIGN.paint] || PAINT_PALETTES.msa;
      MISSION.detachedParts.forEach((part) => {
        ctx.save();
        ctx.translate(Math.round(part.x), Math.round(part.y));
        ctx.rotate(part.angle + Math.PI / 2);

        if (part.type === 'BOOSTER') {
          drawSingleBoosterSprite(ctx, pal);
        } else if (part.type === 'FAIRING_L') {
          drawClamshellHalfSprite(ctx, -1, pal);
        } else if (part.type === 'FAIRING_R') {
          drawClamshellHalfSprite(ctx, 1, pal);
        } else {
          drawCoreBoosterSprite(ctx, pal);
        }

        ctx.restore();
      });
    }

    function spawnExhaustAndSmoke() {
      if (MISSION.phase === 'PAD') return;

      const tailDist = MISSION.hasCoreStage ? 63 : 27;
      const exhaustX = MISSION.shipX - Math.cos(MISSION.shipAngle) * tailDist;
      const exhaustY = MISSION.shipY - Math.sin(MISSION.shipAngle) * tailDist;

      // Bright Rocket Flame Plume
      const flameCount = MISSION.hasSideBoosters ? 6 : 4;
      for (let i = 0; i < flameCount; i++) {
        const spread = (Math.random() - 0.5) * (MISSION.hasSideBoosters ? 24 : 10);
        const perpX = Math.cos(MISSION.shipAngle + Math.PI / 2) * spread;
        const perpY = Math.sin(MISSION.shipAngle + Math.PI / 2) * spread;

        MISSION.particles.push({
          x: exhaustX + perpX,
          y: exhaustY + perpY,
          vx: -Math.cos(MISSION.shipAngle) * (90 + Math.random() * 60) + (Math.random() - 0.5) * 20,
          vy: -Math.sin(MISSION.shipAngle) * (90 + Math.random() * 60) + (Math.random() - 0.5) * 20,
          size: Math.random() > 0.5 ? 5 : 4,
          life: 0.35 + Math.random() * 0.2,
          maxLife: 0.55,
          kind: 'FLAME'
        });
      }

      // Volumetric Pixel Smoke Plumes near Ground / Atmosphere
      if (MISSION.altitudeKm < 45) {
        for (let i = 0; i < 3; i++) {
          MISSION.particles.push({
            x: exhaustX + (Math.random() - 0.5) * 22,
            y: exhaustY + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 55,
            vy: (Math.random() - 0.3) * 35,
            size: 8 + Math.random() * 10,
            life: 1.1 + Math.random() * 0.7,
            maxLife: 1.8,
            kind: 'SMOKE'
          });
        }
      }
    }

    function updateAndDrawParticles(dt) {
      const fPal = FLAME_PALETTES[SHIP_DESIGN.flame] || FLAME_PALETTES.amber;
      for (let i = MISSION.particles.length - 1; i >= 0; i--) {
        const p = MISSION.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          MISSION.particles.splice(i, 1);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const ratio = p.life / p.maxLife;
        if (p.kind === 'FLAME') {
          ctx.fillStyle = ratio > 0.6 ? fPal.core : ratio > 0.3 ? fPal.mid : fPal.outer;
          const sz = Math.max(2, Math.round(p.size * ratio));
          ctx.fillRect(Math.round(p.x - sz / 2), Math.round(p.y - sz / 2), sz, sz);
        } else {
          // Billowing pixel smoke cloud
          ctx.fillStyle = `rgba(226, 232, 240, ${(ratio * 0.55).toFixed(2)})`;
          const sz = Math.round(p.size * (1.4 - ratio * 0.4));
          ctx.fillRect(Math.round(p.x - sz / 2), Math.round(p.y - sz / 2), sz, sz);
        }
      }
    }

    // =========================================================================
    // 8. MAIN SIMULATION & ANIMATION LOOP
    // =========================================================================
    let lastTimestamp = 0;
    let frameCounter = 0;

    function updatePhysics(dt) {
      MISSION.time += dt;
      frameCounter++;

      const padX = 248;
      const padStandY = LOGICAL_H - 76;

      if (MISSION.phase === 'PAD') {
        MISSION.shipX = padX;
        MISSION.shipY = padStandY;
        MISSION.shipAngle = -Math.PI / 2;
        MISSION.cameraY = 0;
      } else {
        // Thrust & Realistic Tsiolkovsky Mass-Shedding Acceleration!
        const metrics = getDesignMetrics();
        const thrustForce = MISSION.hasCoreStage ? metrics.maxThrust : Math.round(metrics.maxThrust * 0.63);
        const netAccel = Math.max(0.4, (thrustForce / MISSION.massTons) - 0.5);
        MISSION.accelG = 1.0 + netAccel * 0.55;

        if (MISSION.phase === 'IGNITION') {
          MISSION.velocityMs += netAccel * 12 * dt;
          MISSION.altitudeKm += (MISSION.velocityMs / 1000) * dt * 2.5;
        } else {
          MISSION.velocityMs += netAccel * 85 * dt;
          MISSION.altitudeKm += (MISSION.velocityMs / 1000) * dt * 6.5;

          // Gradual orbital gravity turn pitch over Yangon skyline
          const targetAngle = -Math.PI / 2 + Math.min(1.08, MISSION.altitudeKm * 0.016);
          MISSION.shipAngle += (targetAngle - MISSION.shipAngle) * dt * 1.4;
        }

        // Camera smoothly tracks the climbing spacecraft while keeping Bandula Park visible early on
        const climbPixels = MISSION.altitudeKm * 18;
        MISSION.cameraY = climbPixels;

        // Ship screen position smoothly transitions from pad to upper-center flight framing
        const targetScreenX = Math.min(LOGICAL_W * 0.54, padX + MISSION.altitudeKm * 2.4);
        const targetScreenY = Math.max(LOGICAL_H * 0.34, padStandY - Math.min(LOGICAL_H * 0.45, climbPixels * 0.85));

        MISSION.shipX += (targetScreenX - MISSION.shipX) * dt * 3;
        MISSION.shipY += (targetScreenY - MISSION.shipY) * dt * 3;

        // Automatic realistic staging if AUTO-STAGE is enabled
        if (autoStage) {
          if (MISSION.hasSideBoosters && MISSION.altitudeKm >= 14.0) {
            detachSideBoosters();
          } else if (!MISSION.hasSideBoosters && MISSION.hasCoreStage && MISSION.altitudeKm >= 46.0) {
            detachCoreStage();
          }
        }

        // Smoothly unfold solar array wings once fairings are detached!
        if (!MISSION.hasFairings && MISSION.wingDeployProgress < 1) {
          MISSION.wingDeployProgress = Math.min(1, MISSION.wingDeployProgress + dt * 1.45);
        }

        // Decay camera shake
        if (MISSION.shakeIntensity > 0) {
          MISSION.shakeIntensity = Math.max(0, MISSION.shakeIntensity - dt * 2.2);
        }

        spawnExhaustAndSmoke();
      }

      // Update detached boosters / core stage tumbling backward & downward
      for (let i = MISSION.detachedParts.length - 1; i >= 0; i--) {
        const part = MISSION.detachedParts[i];
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.vy += 42 * dt; // Gravity pull
        part.angle += part.vAngle;

        if (part.y > LOGICAL_H + 120 || part.x < -100 || part.x > LOGICAL_W + 100) {
          MISSION.detachedParts.splice(i, 1);
        }
      }

      if (frameCounter % 4 === 0) {
        updateTelemetryUI();
      }
    }

    function renderFrame(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      updatePhysics(dt);

      ctx.save();
      // Apply subtle camera rumble during launch/staging
      if (MISSION.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * MISSION.shakeIntensity;
        const sy = (Math.random() - 0.5) * MISSION.shakeIntensity;
        ctx.translate(Math.round(sx), Math.round(sy));
      }

      drawSkyAndStars(MISSION.cameraY);
      drawYangonLandmarks(MISSION.cameraY);
      updateAndDrawParticles(dt);
      drawDetachedParts();
      drawSpacecraft();

      ctx.restore();

      // Animate Kyaw-Gyi Copilot Pixel Portrait
      drawKyawGyiPortrait(frameCounter);

      requestAnimationFrame(renderFrame);
    }

    // Keyboard Support: Spacebar advances dialogue (when not typing in custom input)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.activeElement.id !== 'customDialogueInput') {
        e.preventDefault();
        advanceDialogue();
      }
    });

    window.addEventListener('resize', resizeCanvas);

    // =========================================================================
    // 9. BUILT-IN ZERO-DEPENDENCY ZIP ARCHIVE GENERATOR & DOWNLOADER
    // =========================================================================
    function downloadProjectZip() {
      playBlip();

      // 1. Extract clean separated style.css, script.js, and index.html
      const styleEl = document.querySelector('head style');
      const cssContent = styleEl ? styleEl.textContent.trim() + '\n' : '';

      const scripts = document.querySelectorAll('body script');
      const mainScriptEl = scripts[scripts.length - 1];
      const jsContent = mainScriptEl ? mainScriptEl.textContent.trim() + '\n' : '';

      const clonedDoc = document.documentElement.cloneNode(true);
      const clonedStyle = clonedDoc.querySelector('head style');
      if (clonedStyle) {
        const linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'stylesheet');
        linkEl.setAttribute('href', 'style.css');
        clonedStyle.replaceWith(linkEl);
      }
      const clonedScripts = clonedDoc.querySelectorAll('body script');
      if (clonedScripts.length > 0) {
        const lastScript = clonedScripts[clonedScripts.length - 1];
        const extScript = document.createElement('script');
        extScript.setAttribute('src', 'script.js');
        lastScript.replaceWith(extScript);
      }
      const htmlContent = '<!DOCTYPE html>\n' + clonedDoc.outerHTML + '\n';

      // 2. Build a standard uncompressed (STORE) PKZIP archive in-browser
      const encoder = new TextEncoder();
      const files = [
        { name: 'index.html', data: encoder.encode(htmlContent) },
        { name: 'style.css', data: encoder.encode(cssContent) },
        { name: 'script.js', data: encoder.encode(jsContent) }
      ];

      const crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c;
      }
      const crc32 = (bytes) => {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) {
          crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
      };

      const localChunks = [];
      const centralChunks = [];
      let offset = 0;

      files.forEach((f) => {
        const nameBytes = encoder.encode(f.name);
        const crc = crc32(f.data);
        const size = f.data.length;

        // Local File Header (30 bytes + filename)
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const lv = new DataView(localHeader.buffer);
        lv.setUint32(0, 0x04034b50, true); // Local file header signature
        lv.setUint16(4, 20, true);         // Version needed
        lv.setUint16(6, 0x0800, true);     // UTF-8 flag
        lv.setUint16(8, 0, true);          // Compression method: STORE
        lv.setUint16(10, 0, true);         // Mod time
        lv.setUint16(12, 0, true);         // Mod date
        lv.setUint32(14, crc, true);       // CRC-32
        lv.setUint32(18, size, true);      // Compressed size
        lv.setUint32(22, size, true);      // Uncompressed size
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true);
        localHeader.set(nameBytes, 30);

        localChunks.push(localHeader, f.data);

        // Central Directory Header (46 bytes + filename)
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(centralHeader.buffer);
        cv.setUint32(0, 0x02014b50, true); // Central directory signature
        cv.setUint16(4, 20, true);         // Version made by
        cv.setUint16(6, 20, true);         // Version needed
        cv.setUint16(8, 0x0800, true);     // UTF-8 flag
        cv.setUint16(10, 0, true);         // Compression method: STORE
        cv.setUint16(12, 0, true);         // Mod time
        cv.setUint16(14, 0, true);         // Mod date
        cv.setUint32(16, crc, true);       // CRC-32
        cv.setUint32(20, size, true);      // Compressed size
        cv.setUint32(24, size, true);      // Uncompressed size
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);         // Extra field length
        cv.setUint16(32, 0, true);         // Comment length
        cv.setUint16(34, 0, true);         // Disk number start
        cv.setUint16(36, 0, true);         // Internal attributes
        cv.setUint32(38, 0, true);         // External attributes
        cv.setUint32(42, offset, true);    // Relative offset of local header
        centralHeader.set(nameBytes, 46);

        centralChunks.push(centralHeader);
        offset += localHeader.length + size;
      });

      const centralSize = centralChunks.reduce((acc, c) => acc + c.length, 0);
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, 0x06054b50, true);        // End of central directory signature
      ev.setUint16(4, 0, true);                 // Disk number
      ev.setUint16(6, 0, true);                 // Disk with central dir
      ev.setUint16(8, files.length, true);      // Entries on this disk
      ev.setUint16(10, files.length, true);     // Total entries
      ev.setUint32(12, centralSize, true);      // Size of central directory
      ev.setUint32(16, offset, true);           // Offset of central directory
      ev.setUint16(20, 0, true);                // Comment length

      const zipBlob = new Blob([...localChunks, ...centralChunks, eocd], { type: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yangon_spaceport_kyaw_gyi_launch.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      showEventBanner('📦 DOWNLOADING ZIP: index.html + style.css + script.js');
    }

    // Initialize Everything on Window Load
    window.onload = function () {
      resizeCanvas();
      resetSimulation();
      requestAnimationFrame(renderFrame);
    };
