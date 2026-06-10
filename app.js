/**
 * Daimoku Grow - App State & Logic Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- Constants & Database ---
  const GOAL_HOURS = 333;
  const REVIVAL_TARGET_SECONDS = 12000; // 3 hours 20 minutes (200 minutes)
  const DECAY_BUFFER_HOURS = 24; // 24 hours of healthy buffer before decay begins
  const DECAY_DURATION_HOURS = 72; // Takes 72 hours of neglect to go from 100% to 0% health
  
  const QUOTES = [
    { text: "Even one daimoku can pervade the entire universe. Truly heartfelt and determined daimoku, therefore, has the power to move everything.", author: "Daisaku Ikeda" },
    { text: "In times of suffering, chant daimoku. In times of joy, chant daimoku. Chanting daimoku is itself happiness.", author: "Daisaku Ikeda" },
    { text: "Nam-myoho-renge-kyo is the fundamental power of the universe. Please chant resounding daimoku morning and evening with the vibrant rhythm of majestic horses galloping through the heavens.", author: "Daisaku Ikeda" },
    { text: "Daimoku chanted with the deep conviction that one's life is the entity of the Mystic Law cannot fail to resonate with the universe. You will definitely attain complete freedom.", author: "Daisaku Ikeda" },
    { text: "The important thing is to continue chanting daimoku, no matter what. Whether our prayers are answered right away or not, we must keep chanting, without harboring any doubts.", author: "Daisaku Ikeda" },
    { text: "When we take our problems to the Gohonzon and chant Nam-myoho-renge-kyo, courage wells forth and hope begins to shine in our hearts.", author: "Daisaku Ikeda" },
    { text: "Nichiren Buddhism is about starting from today, starting from this very moment, with a fresh determination. A person of chanting is never defeated.", author: "Daisaku Ikeda" },
    { text: "No prayer is unanswered. Sometimes the answer is immediate; sometimes it is a deeper transformation of our lives, building an indestructible fortress of happiness.", author: "Daisaku Ikeda" },
    { text: "To chant daimoku is to tap the sun of Buddhahood within our own hearts. It dispels all darkness in our life and fills us with boundless joy and courage.", author: "Daisaku Ikeda" },
    { text: "Through chanting Nam-myoho-renge-kyo, we can transform any poison into medicine. Any adversity becomes a source of growth and victory.", author: "Daisaku Ikeda" },
    { text: "Nichiren writes: 'Nam-myoho-renge-kyo is like the roar of a lion.' No illness, no obstacle, can stand in the way of a lion's roar.", author: "Daisaku Ikeda" },
    { text: "Chanting is the key that opens the treasury of the cosmos within our own lives. It is the dialogue between our soul and the universe.", author: "Daisaku Ikeda" },
    { text: "A person of chanting is never defeated. Even if you fall seven times, rise an eighth time with a powerful, resounding daimoku!", author: "Daisaku Ikeda" },
    { text: "Your prayers are the engine of your victory. Chant with specific targets and determinations, and take courageous action in your daily life.", author: "Daisaku Ikeda" },
    { text: "Consistency is the path to mastership. Chanting daily, even for a short time, builds an invincible fortress in your heart.", author: "Daisaku Ikeda" }
  ];

  // --- App State ---
  let state = {
    totalSeconds: 0,
    health: 100,
    isDead: false,
    revivalSeconds: 0,
    lastChantedDate: new Date().toISOString(),
    sessions: [],
    streak: 0,
    targets: [], // [{ id, text, type, targetSeconds, accumulatedSeconds, completed }]
    lastNotifiedThreshold: 0, // Inactivity alerts: 0 (ok), 24, 72, 168 (7d), 360 (15d), 720 (30d)
    settings: {
      morningReminder: true,
      eveningReminder: true
    },
    theme: 'theme-sage-light'
  };

  // --- Timer Variables ---
  let timerInterval = null;
  let timerType = 'stopwatch'; // 'stopwatch' or 'countdown'
  let timerState = 'idle'; // 'idle', 'running', 'paused'
  let timerSecondsElapsed = 0;
  let countdownTargetSeconds = 1800; // Default 30 mins
  let timerStartTime = null;

  // --- DOM Elements ---
  const views = document.querySelectorAll('.content-view');
  const navItems = document.querySelectorAll('.nav-item');
  const notificationBanner = document.getElementById('app-notification-banner');
  const notificationBannerText = document.getElementById('notification-banner-text');
  const notificationBannerClose = document.getElementById('notification-banner-close');
  
  // Dashboard elements
  const plantStageBadge = document.getElementById('plant-stage-badge');
  const plantMoodBadge = document.getElementById('plant-mood-badge');
  const plantHealthPercent = document.getElementById('plant-health-percent');
  const plantHealthFill = document.getElementById('plant-health-fill');
  const headerHealthValue = document.getElementById('header-health-value');
  const statTotalHours = document.getElementById('stat-total-hours');
  const progressPercentLabel = document.getElementById('progress-percent-label');
  const progressRemainingLabel = document.getElementById('progress-remaining-label');
  const journeyProgressFill = document.getElementById('journey-progress-fill');
  
  // Revival elements
  const revivalProgressContainer = document.getElementById('revival-progress-container');
  const revivalTimeLabel = document.getElementById('revival-time-label');
  const revivalPercentLabel = document.getElementById('revival-percent-label');
  const revivalProgressFill = document.getElementById('revival-progress-fill');
  
  // Guidance
  const guidanceText = document.getElementById('guidance-text');
  const guidanceAuthor = document.getElementById('guidance-author');

  // Timer elements
  const btnTimerStopwatch = document.getElementById('btn-timer-stopwatch');
  const btnTimerCountdown = document.getElementById('btn-timer-countdown');
  const countdownPresets = document.getElementById('countdown-presets');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const presetCustomBtn = document.getElementById('preset-custom-btn');
  const customMinutesInputContainer = document.getElementById('custom-minutes-input-container');
  const customMinutesInput = document.getElementById('custom-minutes');
  const btnApplyCustomTime = document.getElementById('btn-apply-custom-time');
  const timerTimeDisplay = document.getElementById('timer-time-display');
  const timerStateLabel = document.getElementById('timer-state-label');
  const breathingGuide = document.getElementById('breathing-guide');
  const timerTargetSelect = document.getElementById('timer-target-select');
  
  // Timer Controls
  const btnTimerStart = document.getElementById('btn-timer-start');
  const btnTimerPause = document.getElementById('btn-timer-pause');
  const btnTimerStop = document.getElementById('btn-timer-stop');
  const btnTimerCancel = document.getElementById('btn-timer-cancel');
  
  // Manual Log
  const manualLogForm = document.getElementById('manual-log-form');
  const logHours = document.getElementById('log-hours');
  const logMinutes = document.getElementById('log-minutes');
  const logDateInput = document.getElementById('log-date');
  const manualTargetSelect = document.getElementById('manual-target-select');

  // Targets view elements
  const addTargetForm = document.getElementById('add-target-form');
  const targetText = document.getElementById('target-text');
  const targetTypeSelect = document.getElementById('target-type-select');
  const targetHoursInputGroup = document.getElementById('target-hours-input-group');
  const targetHoursInput = document.getElementById('target-hours');
  const activeTargetsList = document.getElementById('active-targets-list');
  const completedTargetsList = document.getElementById('completed-targets-list');
  const completedTargetsCount = document.getElementById('completed-targets-count');
  const btnToggleCompletedTargets = document.getElementById('btn-toggle-completed-targets');
  const completedTargetsCard = document.querySelector('.completed-targets-card');
  
  // History elements
  const btnClearHistory = document.getElementById('btn-clear-history');
  const logsListContainer = document.getElementById('logs-list-container');
  const analyticSessions = document.getElementById('analytic-sessions');
  const analyticStreak = document.getElementById('analytic-streak');
  const analyticAvgSession = document.getElementById('analytic-avg-session');
  
  // Settings elements
  const settingMorningReminder = document.getElementById('setting-morning-reminder');
  const settingEveningReminder = document.getElementById('setting-evening-reminder');
  const btnRequestNotifications = document.getElementById('btn-request-notifications');
  const btnTestGong = document.getElementById('btn-test-gong');
  const themeButtons = document.querySelectorAll('.theme-btn');

  // Debug Panel elements
  const btnToggleDebug = document.getElementById('btn-toggle-debug');
  const debugContent = document.getElementById('debug-content');
  const debugCard = document.querySelector('.debug-card');
  const btnDebugHours = document.querySelectorAll('.btn-debug');
  const btnDebugHealth = document.querySelectorAll('.btn-debug-health');
  const btnDebugDecay24h = document.getElementById('btn-debug-decay-24h');
  const btnDebugDecay72h = document.getElementById('btn-debug-decay-72h');
  const btnDebugDecay7d = document.getElementById('btn-debug-decay-7d');
  const btnDebugDecay15d = document.getElementById('btn-debug-decay-15d');
  const btnDebugDecay30d = document.getElementById('btn-debug-decay-30d');
  const btnDebugResetDate = document.getElementById('btn-debug-reset-date');
  const btnDebugTestMorning = document.getElementById('btn-debug-test-morning');
  const btnDebugTestEvening = document.getElementById('btn-debug-test-evening');

  // --- Web Audio API Gong Synthesizer ---
  function playGong() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Dynamic envelope
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.8, ctx.currentTime + 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5.5); // Decay over 5.5s
      
      // Warm lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 3.0);
      
      // Oscillators to model the gong structure (Fundamental + Overtones)
      const frequencies = [136.1, 218.4, 276.5, 345.2, 450.0];
      const gains = [0.8, 0.4, 0.2, 0.1, 0.05];
      const oscillators = [];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = index === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        oscGain.gain.setValueAtTime(gains[index], ctx.currentTime);
        
        // Slight frequency detuning over time for shimmering effect
        osc.frequency.linearRampToValueAtTime(freq + (Math.random() * 2 - 1), ctx.currentTime + 5);
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        oscillators.push(osc);
      });

      masterGain.connect(filter);
      filter.connect(ctx.destination);
      
      // Start/Stop
      oscillators.forEach(osc => osc.start());
      oscillators.forEach(osc => osc.stop(ctx.currentTime + 6.0));
    } catch (e) {
      console.warn("AudioContext failed to start. User interaction may be required:", e);
    }
  }

  // --- State Initialization & Storage Sync ---
  function loadState() {
    const saved = localStorage.getItem('daimoku_grow_state');
    if (saved) {
      try {
        state = JSON.parse(saved);
        // Ensure properties exist
        if (state.streak === undefined) state.streak = 0;
        if (state.revivalSeconds === undefined) state.revivalSeconds = 0;
        if (state.isDead === undefined) state.isDead = false;
        if (state.targets === undefined) state.targets = [];
        if (state.lastNotifiedThreshold === undefined) state.lastNotifiedThreshold = 0;
        
        // Apply saved theme
        document.body.className = state.theme || 'theme-sage-light';
      } catch (e) {
        console.error("Error loading state, resetting:", e);
      }
    }
    
    // Set manual form default date to today
    const today = new Date().toISOString().split('T')[0];
    logDateInput.value = today;
    
    // Calculate decay on start
    applyTimeDecay();
    updateUI();
  }

  function saveState() {
    localStorage.setItem('daimoku_grow_state', JSON.stringify(state));
    updateUI();
  }

  // --- Inactivity Alert Evaluator using Ikeda Quotes ---
  function checkDecayNotifications(diffHours) {
    const hours = Math.floor(diffHours);
    let threshold = 0;
    let title = "";
    let message = "";
    
    if (hours >= 720) { // 30 days
      threshold = 720;
      title = "A dormant seed awaits you...";
      message = "One month has passed. I am completely withered, but my roots remember your voice. Daisaku Ikeda guides: 'Sincere effort can bring any withered plant back to life.' I need a 3h 20m revival session! 🌱";
    } else if (hours >= 360) { // 15 days
      threshold = 360;
      title = "Save my life!";
      message = "15 days of silence. I have withered away. Daisaku Ikeda guides: 'No matter what, keep chanting Nam-myoho-renge-kyo.' Sowing a seed of determination can bring me back! ❤️";
    } else if (hours >= 168) { // 7 days (1 week)
      threshold = 168;
      title = "I am about to die...";
      message = "A whole week without Daimoku! I am drying up. Daisaku Ikeda reminds us: 'Consistent efforts yield beautiful blooms.' Please water me with your chanting! 🥀";
    } else if (hours >= 72) { // 3 days (72 hours)
      threshold = 72;
      title = "Oh no! I am weakening...";
      message = "It has been 72 hours. I am beginning to droop. Daisaku Ikeda teaches: 'Even one daimoku can pervade the entire universe.' Let's chant together and restore my life-force! 💧";
    } else if (hours >= 24) { // 24 hours
      threshold = 24;
      title = "Water me, please!";
      message = "It has been 24 hours. My leaves are getting thirsty. I miss the sound of your Daimoku—it is required for my sustenance! 🌿";
    }
    
    // Only notify if we crossed a new threshold level
    if (threshold > 0 && state.lastNotifiedThreshold < threshold) {
      state.lastNotifiedThreshold = threshold;
      triggerNotification(title, message);
      saveState();
    }
  }

  // --- Plant Health Time Decay Algorithm ---
  function applyTimeDecay() {
    const now = new Date();
    const lastChanted = new Date(state.lastChantedDate);
    const diffMs = now - lastChanted;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Trigger neglect warnings
    checkDecayNotifications(diffHours);
    
    if (state.isDead) return;
    
    if (diffHours > DECAY_BUFFER_HOURS) {
      const hoursToDecay = diffHours - DECAY_BUFFER_HOURS;
      // Health drops by (100 / DECAY_DURATION_HOURS) per hour after the 24h buffer
      const healthDrop = hoursToDecay * (100 / DECAY_DURATION_HOURS);
      state.health = Math.max(0, Math.round(100 - healthDrop));
      
      if (state.health <= 0) {
        state.isDead = true;
        state.health = 0;
        state.revivalSeconds = 0;
      }
    } else {
      state.health = 100; // Reset to 100% if within the 24h window
    }
  }

  // --- Navigation Router ---
  function initNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.id.replace('nav-', 'view-');
        
        // Switch nav active status
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Switch content view
        views.forEach(v => {
          if (v.id === viewId) {
            v.classList.add('active');
          } else {
            v.classList.remove('active');
          }
        });
        
        // Pause timer if user leaves Chant screen and it's running
        if (viewId !== 'view-chant' && timerState === 'running') {
          pauseTimer();
        }
        
        // Refresh history UI when entering history view
        if (viewId === 'view-history') {
          renderHistoryLogs();
        }
        
        // Refresh targets UI when entering targets view
        if (viewId === 'view-prayers') {
          renderTargetsList();
        }
      });
    });
  }

  // --- Daily Quotes Picker ---
  function updateQuote() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    const quoteIndex = day % QUOTES.length;
    
    guidanceText.textContent = `"${QUOTES[quoteIndex].text}"`;
    guidanceAuthor.textContent = `— ${QUOTES[quoteIndex].author}`;
  }

  // --- Rendering UI States ---
  function updateUI() {
    const totalHours = (state.totalSeconds / 3600).toFixed(1);
    const progressPercent = Math.min(100, Math.round((parseFloat(totalHours) / GOAL_HOURS) * 100));
    
    // Header & Vitality
    headerHealthValue.textContent = `${state.health}%`;
    plantHealthPercent.textContent = `${state.health}%`;
    plantHealthFill.style.width = `${state.health}%`;
    
    // Set health bar color warning states
    plantHealthFill.className = 'progress-bar-fill';
    if (state.health <= 10) {
      plantHealthFill.classList.add('danger-fill');
    } else if (state.health <= 40) {
      plantHealthFill.classList.add('warning-fill');
    }
    
    // Plant badges
    const stageInfo = PlantRenderer.getGrowthStage(parseFloat(totalHours));
    const moodInfo = PlantRenderer.getPlantMood(state.health, state.isDead);
    
    plantStageBadge.textContent = stageInfo.name;
    plantMoodBadge.textContent = moodInfo;
    
    // Apply badge styling based on mood
    plantMoodBadge.className = 'badge mood-badge';
    if (state.isDead) {
      plantMoodBadge.classList.add('dead-badge');
    } else if (state.health <= 40) {
      plantMoodBadge.classList.add('thirsty-badge');
    }
    
    // Progress Card
    statTotalHours.textContent = totalHours;
    progressPercentLabel.textContent = `${progressPercent}% of Journey`;
    const remaining = Math.max(0, GOAL_HOURS - parseFloat(totalHours)).toFixed(1);
    progressRemainingLabel.textContent = `${remaining}h remaining`;
    journeyProgressFill.style.width = `${progressPercent}%`;
    
    // Revival Card Visibility
    if (state.isDead) {
      revivalProgressContainer.classList.remove('hidden');
      const revivalMins = (state.revivalSeconds / 60).toFixed(0);
      const targetMins = (REVIVAL_TARGET_SECONDS / 60).toFixed(0);
      revivalTimeLabel.textContent = `${revivalMins} / ${targetMins} mins`;
      
      const revPercent = Math.min(100, Math.round((state.revivalSeconds / REVIVAL_TARGET_SECONDS) * 100));
      revivalPercentLabel.textContent = `${revPercent}%`;
      revivalProgressFill.style.width = `${revPercent}%`;
    } else {
      revivalProgressContainer.classList.add('hidden');
    }
    
    // Trigger canvas state updates
    PlantRenderer.updateState(parseFloat(totalHours), state.health, state.isDead);
    
    // In-App Alerts Banner
    updateNotificationBanner();
    
    // Populate dropdown elements
    populateTargetDropdowns();
    
    // Settings switches
    settingMorningReminder.checked = state.settings.morningReminder;
    settingEveningReminder.checked = state.settings.eveningReminder;
    
    // Update theme toggle buttons highlights
    themeButtons.forEach(btn => {
      if (btn.getAttribute('data-theme') === state.theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // History analytics
    updateHistoryAnalytics();
  }

  // --- In-App Notifications Drawer with Decay Milestones ---
  function updateNotificationBanner() {
    notificationBanner.className = 'notification-banner hidden';
    
    const now = new Date();
    const lastChanted = new Date(state.lastChantedDate);
    const diffMs = now - lastChanted;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (state.isDead) {
      if (diffHours >= 720) { // 30 days
        notificationBannerText.textContent = "My roots still remember your voice. Daisaku Ikeda guides: 'Sincere effort can bring any withered plant back to life.' I need a 3h 20m revival session! 🌱";
      } else if (diffHours >= 360) { // 15 days
        notificationBannerText.textContent = "Save my life! I have completely withered. Ikeda guides: 'No matter what, keep chanting Nam-myoho-renge-kyo.' Let's bring this garden back! ❤️";
      } else {
        notificationBannerText.textContent = "Your plant has withered from neglect! Chant 3h 20m to revive it.";
      }
      notificationBanner.classList.add('dead');
      notificationBanner.classList.remove('hidden');
    } else if (diffHours >= 168) { // 7 days
      notificationBannerText.textContent = "I am about to die! Please water me with your consistency. Ikeda reminds us: 'Consistent efforts yield beautiful blooms.' 🥀";
      notificationBanner.classList.add('dying');
      notificationBanner.classList.remove('hidden');
    } else if (diffHours >= 72) { // 72 hours
      notificationBannerText.textContent = "I am drooping and shrinking! Daisaku Ikeda teaches: 'Even one daimoku can pervade the entire universe.' Let's chant together and restore my vitality! 💧";
      notificationBanner.classList.add('dying');
      notificationBanner.classList.remove('hidden');
    } else if (diffHours >= 24) { // 24 hours
      notificationBannerText.textContent = "I miss the sound of your Daimoku! It is required for my sustenance... please water me! 🌿";
      notificationBanner.classList.add('thirsty');
      notificationBanner.classList.remove('hidden');
    }
  }

  notificationBannerClose.addEventListener('click', () => {
    notificationBanner.classList.add('hidden');
  });

  // --- Timer Operations (Stopwatch & Countdown) ---
  btnTimerStopwatch.addEventListener('click', () => {
    if (timerState !== 'idle') return;
    timerType = 'stopwatch';
    btnTimerStopwatch.classList.add('active');
    btnTimerCountdown.classList.remove('active');
    countdownPresets.classList.add('hidden');
    customMinutesInputContainer.classList.add('hidden');
    resetTimerDisplay();
  });

  btnTimerCountdown.addEventListener('click', () => {
    if (timerState !== 'idle') return;
    timerType = 'countdown';
    btnTimerCountdown.classList.add('active');
    btnTimerStopwatch.classList.remove('active');
    countdownPresets.classList.remove('hidden');
    resetTimerDisplay();
  });

  // Preset time selections
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (timerState !== 'idle') return;
      
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      customMinutesInputContainer.classList.add('hidden');
      
      if (btn.id === 'preset-custom-btn') {
        customMinutesInputContainer.classList.remove('hidden');
      } else {
        const mins = parseInt(btn.getAttribute('data-mins'));
        countdownTargetSeconds = mins * 60;
        resetTimerDisplay();
      }
    });
  });

  btnApplyCustomTime.addEventListener('click', () => {
    if (timerState !== 'idle') return;
    const mins = Math.max(1, Math.min(1440, parseInt(customMinutesInput.value || 30)));
    customMinutesInput.value = mins;
    countdownTargetSeconds = mins * 60;
    resetTimerDisplay();
  });

  function resetTimerDisplay() {
    if (timerType === 'stopwatch') {
      timerTimeDisplay.textContent = '00:00:00';
      timerSecondsElapsed = 0;
    } else {
      timerTimeDisplay.textContent = formatDuration(countdownTargetSeconds);
      timerSecondsElapsed = 0;
    }
    timerStateLabel.textContent = 'Ready';
    stopBreathingGuide();
  }

  function formatDuration(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }

  // Breathing focus helper triggers
  let breathingTimer = null;
  function startBreathingGuide() {
    stopBreathingGuide();
    
    let phase = 0; // 0 = inhale, 1 = hold, 2 = exhale
    breathingGuide.className = 'breathing-guide';
    
    function breathe() {
      if (timerState !== 'running') return;
      
      breathingGuide.className = 'breathing-guide';
      if (phase === 0) {
        timerStateLabel.textContent = 'Inhale...';
        breathingGuide.classList.add('inhale');
        phase = 1;
        breathingTimer = setTimeout(breathe, 4000); // 4s inhale
      } else if (phase === 1) {
        timerStateLabel.textContent = 'Hold Focus...';
        breathingGuide.classList.add('hold');
        phase = 2;
        breathingTimer = setTimeout(breathe, 2000); // 2s hold
      } else {
        timerStateLabel.textContent = 'Exhale...';
        breathingGuide.classList.add('exhale');
        phase = 0;
        breathingTimer = setTimeout(breathe, 4000); // 4s exhale
      }
    }
    breathe();
  }

  function stopBreathingGuide() {
    if (breathingTimer) {
      clearTimeout(breathingTimer);
      breathingTimer = null;
    }
    breathingGuide.className = 'breathing-guide';
  }

  // Start Chanting Timer
  btnTimerStart.addEventListener('click', () => {
    timerState = 'running';
    timerStartTime = new Date();
    
    btnTimerStart.classList.add('hidden');
    btnTimerPause.classList.remove('hidden');
    btnTimerStop.classList.remove('hidden');
    btnTimerCancel.classList.remove('hidden');
    
    btnTimerStopwatch.disabled = true;
    btnTimerCountdown.disabled = true;
    presetButtons.forEach(b => b.disabled = true);
    btnApplyCustomTime.disabled = true;
    
    startBreathingGuide();
    
    timerInterval = setInterval(() => {
      timerSecondsElapsed++;
      
      if (timerType === 'stopwatch') {
        timerTimeDisplay.textContent = formatDuration(timerSecondsElapsed);
      } else {
        const remaining = countdownTargetSeconds - timerSecondsElapsed;
        if (remaining <= 0) {
          // Timer finished!
          clearInterval(timerInterval);
          playGong();
          saveChantSession(countdownTargetSeconds, 'countdown');
          resetTimerControls();
          alert("Congratulations! Your chanting focus session is complete.");
        } else {
          timerTimeDisplay.textContent = formatDuration(remaining);
        }
      }
    }, 1000);
  });

  // Pause Timer
  btnTimerPause.addEventListener('click', pauseTimer);
  
  function pauseTimer() {
    timerState = 'paused';
    clearInterval(timerInterval);
    stopBreathingGuide();
    timerStateLabel.textContent = 'Paused';
    btnTimerPause.classList.add('hidden');
    btnTimerStart.classList.remove('hidden');
  }

  // Stop and record
  btnTimerStop.addEventListener('click', () => {
    const duration = timerSecondsElapsed;
    if (duration >= 5) { // Only log if at least 5 seconds
      saveChantSession(duration, timerType);
    }
    resetTimerControls();
  });

  // Reset controls
  btnTimerCancel.addEventListener('click', () => {
    resetTimerControls();
  });

  function resetTimerControls() {
    timerState = 'idle';
    clearInterval(timerInterval);
    stopBreathingGuide();
    
    btnTimerStart.classList.remove('hidden');
    btnTimerPause.classList.add('hidden');
    btnTimerStop.classList.add('hidden');
    btnTimerCancel.classList.add('hidden');
    
    btnTimerStopwatch.disabled = false;
    btnTimerCountdown.disabled = false;
    presetButtons.forEach(b => b.disabled = false);
    btnApplyCustomTime.disabled = false;
    
    resetTimerDisplay();
  }

  // --- Chanting Session Logic (Records hours & calculates revival) ---
  function saveChantSession(durationSeconds, method) {
    const now = new Date();
    
    // Read selected target ID and allocate time
    const selectedTargetId = timerTargetSelect.value;
    if (selectedTargetId) {
      accumulateTimeToTarget(selectedTargetId, durationSeconds);
    }
    
    // 1. Log Session Detail
    const session = {
      id: Date.now().toString(),
      date: now.toISOString(),
      durationSeconds: durationSeconds,
      method: method,
      targetId: selectedTargetId || null
    };
    
    state.sessions.unshift(session);
    
    // 2. Accumulate Chant Time
    state.lastNotifiedThreshold = 0; // Reset warning alert state
    if (state.isDead) {
      // Dead plant mode: Chant goes to revival bucket
      state.revivalSeconds += durationSeconds;
      
      if (state.revivalSeconds >= REVIVAL_TARGET_SECONDS) {
        // REVIVAL EVENT TRIGGERS!
        state.isDead = false;
        state.health = 100;
        state.revivalSeconds = 0;
        
        // Penalty: reset tree height back to 1 hour (Sprout stage)
        state.totalSeconds = 3600; // Reset to 1 hour (Stage 2)
        state.lastChantedDate = now.toISOString();
        
        alert("Wonderful! Your plant has been successfully revived. It starts fresh as a green sprout again. Keep it hydrated!");
      }
    } else {
      // Normal healthy mode
      state.totalSeconds += durationSeconds;
      state.health = 100; // Recover full hydration
      state.lastChantedDate = now.toISOString();
    }
    
    // 3. Streak Engine
    calculateStreak();
    
    saveState();
  }

  function calculateStreak() {
    if (state.sessions.length === 0) {
      state.streak = 0;
      return;
    }
    
    let activeStreak = 0;
    const uniqueChantDates = new Set(
      state.sessions.map(s => s.date.split('T')[0])
    );
    
    const checkDate = new Date();
    // Loop backwards day by day to check if they chanted
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueChantDates.has(dateStr)) {
        activeStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If they didn't chant today, check if they chanted yesterday. If they chanted yesterday, streak is still alive.
        if (activeStreak === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (uniqueChantDates.has(yesterdayStr)) {
            activeStreak = 1; // Start with yesterday
            checkDate.setDate(checkDate.getDate() - 2); // continue from day before
            continue;
          }
        }
        break;
      }
    }
    
    state.streak = activeStreak;
  }

  // --- 24-hour entry restriction: if hours = 24, disable minutes ---
  logHours.addEventListener('input', () => {
    const val = parseInt(logHours.value || 0);
    if (val >= 24) {
      logHours.value = 24;
      logMinutes.value = 0;
      logMinutes.disabled = true;
      logMinutes.title = 'Minutes are disabled when hours is 24';
    } else {
      logMinutes.disabled = false;
      logMinutes.title = '';
    }
  });

  // --- Manual Log Submission ---
  manualLogForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let hrs = parseInt(logHours.value || 0);
    let mins = parseInt(logMinutes.value || 0);
    
    // Enforce 24h cap: if hours = 24, minutes must be 0
    if (hrs >= 24) {
      hrs = 24;
      mins = 0;
    }
    const totalSecs = (hrs * 3600) + (mins * 60);
    
    if (totalSecs <= 0) {
      alert("Please enter a valid duration!");
      return;
    }
    
    // Construct manual date (noon of selected day)
    const selectedDate = new Date(logDateInput.value);
    selectedDate.setHours(12, 0, 0, 0);
    
    // Read selected target ID and allocate time
    const selectedTargetId = manualTargetSelect.value;
    if (selectedTargetId) {
      accumulateTimeToTarget(selectedTargetId, totalSecs);
    }
    
    const session = {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      durationSeconds: totalSecs,
      method: 'manual',
      targetId: selectedTargetId || null
    };
    
    state.sessions.unshift(session);
    
    // Recalculate states
    const now = new Date();
    // If the logged session is the newest session or logged today, reset the water lastChantedDate
    const isNewest = state.sessions.length === 1 || new Date(session.date) > new Date(state.lastChantedDate);
    
    state.lastNotifiedThreshold = 0; // Reset warning alert state
    if (state.isDead) {
      state.revivalSeconds += totalSecs;
      if (state.revivalSeconds >= REVIVAL_TARGET_SECONDS) {
        state.isDead = false;
        state.health = 100;
        state.revivalSeconds = 0;
        state.totalSeconds = 3600; // Reset sprout penalty
        if (isNewest) state.lastChantedDate = session.date;
        alert("Your plant has been successfully revived via manual log! It starts fresh as a green sprout.");
      }
    } else {
      state.totalSeconds += totalSecs;
      state.health = 100;
      if (isNewest) state.lastChantedDate = session.date;
    }
    
    calculateStreak();
    saveState();
    
    // Reset fields
    logHours.value = 0;
    logMinutes.value = 15;
    logMinutes.disabled = false;
    logMinutes.title = '';
    manualTargetSelect.value = '';
    
    alert(`Successfully logged ${hrs}h ${mins}m!`);
    
    // Auto redirect to dashboard
    document.getElementById('nav-dashboard').click();
  });

  // --- History Log Views Render ---
  function renderHistoryLogs() {
    logsListContainer.innerHTML = '';
    
    if (state.sessions.length === 0) {
      logsListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-seedling"></i>
          <p>No chanting sessions recorded yet. Start chanting to grow your plant!</p>
        </div>
      `;
      return;
    }
    
    state.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = 'log-item';
      
      const sessionDate = new Date(session.date);
      const dateString = sessionDate.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const durationMins = (session.durationSeconds / 60).toFixed(0);
      const hoursText = session.durationSeconds >= 3600 ? `${Math.floor(session.durationSeconds / 3600)}h ` : '';
      const minsText = `${durationMins % 60}m`;
      const durationText = `${hoursText}${minsText}`;
      
      let methodIcon = '<i class="fa-regular fa-clock" title="Stopwatch"></i>';
      if (session.method === 'countdown') {
        methodIcon = '<i class="fa-solid fa-hourglass-half" title="Focus Timer"></i>';
      } else if (session.method === 'manual') {
        methodIcon = '<i class="fa-solid fa-pen-to-square" title="Manual Log"></i>';
      }
      
      item.innerHTML = `
        <div class="log-info">
          <div class="log-time-amount">${methodIcon} ${durationText} chanted</div>
          <div class="log-date-label">${dateString}</div>
        </div>
        <div class="log-actions">
          <button class="btn-delete-log" data-id="${session.id}"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      `;
      
      // Delete Log event handler
      item.querySelector('.btn-delete-log').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this session? This will adjust your total chanting progress.")) {
          deleteChantSession(id);
        }
      });
      
      logsListContainer.appendChild(item);
    });
  }

  function deleteChantSession(id) {
    const idx = state.sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      const deleted = state.sessions[idx];
      state.sessions.splice(idx, 1);
      
      // Reduce total time if healthy, or reduce revival time if dead
      if (state.isDead) {
        state.revivalSeconds = Math.max(0, state.revivalSeconds - deleted.durationSeconds);
      } else {
        state.totalSeconds = Math.max(0, state.totalSeconds - deleted.durationSeconds);
      }
      
      // Recalculate states
      if (state.sessions.length > 0) {
        state.lastChantedDate = state.sessions[0].date;
      } else {
        state.lastChantedDate = new Date().toISOString();
      }
      
      applyTimeDecay();
      calculateStreak();
      saveState();
      renderHistoryLogs();
    }
  }

  // Clear all history
  btnClearHistory.addEventListener('click', () => {
    if (confirm("WARNING: This will delete ALL your chanting history and reset your plant to a seed. Proceed?")) {
      state.totalSeconds = 0;
      state.health = 100;
      state.isDead = false;
      state.revivalSeconds = 0;
      state.lastChantedDate = new Date().toISOString();
      state.sessions = [];
      state.streak = 0;
      saveState();
      renderHistoryLogs();
    }
  });

  function updateHistoryAnalytics() {
    analyticSessions.textContent = state.sessions.length;
    analyticStreak.textContent = `${state.streak} days`;
    
    if (state.sessions.length === 0) {
      analyticAvgSession.textContent = '0m';
      return;
    }
    
    const sum = state.sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const avgMins = Math.round((sum / state.sessions.length) / 60);
    analyticAvgSession.textContent = `${avgMins}m`;
  }

  // --- Setting Configurations ---
  settingMorningReminder.addEventListener('change', (e) => {
    state.settings.morningReminder = e.target.checked;
    saveState();
  });

  settingEveningReminder.addEventListener('change', (e) => {
    state.settings.eveningReminder = e.target.checked;
    saveState();
  });

  btnTestGong.addEventListener('click', () => {
    playGong();
  });

  // Web Notification Permissions Request
  btnRequestNotifications.addEventListener('click', () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        alert("Notification permissions granted!");
        new Notification("Daimoku Grow", {
          body: "Great! Reminders are now set up to keep your virtual plant healthy.",
          icon: "icons/icon-192.png"
        });
      } else {
        alert("Notification permissions denied. In-app alerts will still be shown.");
      }
    });
  });

  // Theme Swapper
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeClass = btn.getAttribute('data-theme');
      state.theme = themeClass;
      document.body.className = themeClass;
      saveState();
    });
  });

  // --- Reminder Check Mechanism (12:00 PM and 8:00 PM Checks) ---
  function runNotificationsChecks() {
    const now = new Date();
    const hours = now.getHours();
    
    // Format check string so we don't repeat notifications within the same hour
    const dateTodayStr = now.toISOString().split('T')[0];
    
    // Check Morning Reminder (12:00 PM / Noon onwards)
    if (state.settings.morningReminder && hours >= 12 && hours < 20) {
      // Find if we already checked morning today
      const alreadyChecked = localStorage.getItem(`morning_check_${dateTodayStr}`);
      if (!alreadyChecked) {
        // Has user chanted today (before 12 PM)?
        const chantedToday = state.sessions.some(s => {
          const sDate = new Date(s.date);
          return sDate.toISOString().split('T')[0] === dateTodayStr;
        });
        
        if (!chantedToday) {
          triggerNotification("Morning Chant Reminder", "It's past 12:00 PM! Don't forget to water your plant with morning chanting.");
        }
        localStorage.setItem(`morning_check_${dateTodayStr}`, 'done');
      }
    }

    // Check Evening Reminder (8:00 PM / 20:00 onwards)
    if (state.settings.eveningReminder && hours >= 20) {
      const alreadyChecked = localStorage.getItem(`evening_check_${dateTodayStr}`);
      if (!alreadyChecked) {
        // Has user chanted since noon (12:00 PM) today?
        const chantedSinceNoon = state.sessions.some(s => {
          const sDate = new Date(s.date);
          const sHours = sDate.getHours();
          return sDate.toISOString().split('T')[0] === dateTodayStr && sHours >= 12;
        });
        
        if (!chantedSinceNoon) {
          triggerNotification("Evening Chant Reminder", "It's evening! Water your plant with evening chanting to keep it healthy.");
        }
        localStorage.setItem(`evening_check_${dateTodayStr}`, 'done');
      }
    }
  }

  function triggerNotification(title, message) {
    // 1. Show Local Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: "icons/icon-192.png"
      });
    }
    
    // 2. Log in-app warning alerts
    console.log(`[Notification Triggered] ${title}: ${message}`);
  }

  // --- Developer Debug Panel Toggle & Functions ---
  btnToggleDebug.addEventListener('click', () => {
    debugCard.classList.toggle('open');
    debugContent.classList.toggle('collapsed');
  });

  btnDebugHours.forEach(btn => {
    btn.addEventListener('click', () => {
      const hrs = parseInt(btn.getAttribute('data-hours'));
      state.totalSeconds = hrs * 3600;
      if (state.isDead) {
        // If we are debugging plant hours, make it alive for testing
        state.isDead = false;
        state.health = 100;
      }
      saveState();
      alert(`Debug: set total chanting to ${hrs} hours.`);
    });
  });

  btnDebugHealth.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetHealth = parseInt(btn.getAttribute('data-health'));
      state.health = targetHealth;
      state.isDead = (targetHealth === 0);
      if (state.isDead) state.revivalSeconds = 0;
      saveState();
      alert(`Debug: set plant health to ${targetHealth}%.`);
    });
  });

  btnDebugDecay24h.addEventListener('click', () => {
    state.lastNotifiedThreshold = 0;
    simulateNeglect(0.5); // 0.5h beyond buffer = 24.5h neglect (Thirsty level notification)
  });

  btnDebugDecay72h.addEventListener('click', () => {
    state.lastNotifiedThreshold = 24;
    simulateNeglect(48.5); // 48.5h beyond buffer = 72.5h neglect (Sad/Shrinking level notification)
  });

  btnDebugDecay7d.addEventListener('click', () => {
    state.lastNotifiedThreshold = 72;
    simulateNeglect(144.5); // 144.5h beyond buffer = 168.5h neglect (7 days neglect - Dying)
  });

  btnDebugDecay15d.addEventListener('click', () => {
    state.lastNotifiedThreshold = 168;
    simulateNeglect(336.5); // 336.5h beyond buffer = 360.5h neglect (15 days neglect - Withered)
  });

  btnDebugDecay30d.addEventListener('click', () => {
    state.lastNotifiedThreshold = 360;
    simulateNeglect(696.5); // 696.5h beyond buffer = 720.5h neglect (30 days neglect - Dormant)
  });

  btnDebugResetDate.addEventListener('click', () => {
    state.lastChantedDate = new Date().toISOString();
    state.health = 100;
    state.isDead = false;
    state.lastNotifiedThreshold = 0;
    saveState();
    alert("Debug: Last chanted date reset to right now!");
  });

  function simulateNeglect(additionalHours) {
    const fakeChantedDate = new Date();
    fakeChantedDate.setHours(fakeChantedDate.getHours() - (DECAY_BUFFER_HOURS + additionalHours));
    
    state.lastChantedDate = fakeChantedDate.toISOString();
    applyTimeDecay();
    saveState();
    alert(`Debug: Simulated neglect. Health is now ${state.health}% (Mood: ${plantMoodBadge.textContent}).`);
  }

  btnDebugTestMorning.addEventListener('click', () => {
    const dateTodayStr = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`morning_check_${dateTodayStr}`);
    
    const originalHours = Date.prototype.getHours;
    Date.prototype.getHours = () => 13;
    
    runNotificationsChecks();
    
    Date.prototype.getHours = originalHours;
    alert("Debug: Triggered morning reminder evaluation (Mocked time: 1:00 PM). Check notifications if permission granted!");
  });

  btnDebugTestEvening.addEventListener('click', () => {
    const dateTodayStr = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`evening_check_${dateTodayStr}`);
    
    const originalHours = Date.prototype.getHours;
    Date.prototype.getHours = () => 21;
    
    runNotificationsChecks();
    
    Date.prototype.getHours = originalHours;
    alert("Debug: Triggered evening reminder evaluation (Mocked time: 9:00 PM). Check notifications if permission granted!");
  });


  // --- Targets & Determinations Manager ---
  
  // Toggle form input hours visibility
  targetTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'hours') {
      targetHoursInputGroup.classList.remove('hidden');
    } else {
      targetHoursInputGroup.classList.add('hidden');
    }
  });

  // Submit target form
  addTargetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = targetText.value.trim();
    const type = targetTypeSelect.value;
    const hours = parseInt(targetHoursInput.value || 10);
    
    if (!text) return;
    
    const newTarget = {
      id: Date.now().toString(),
      text: text,
      type: type,
      targetSeconds: type === 'hours' ? hours * 3600 : 0,
      accumulatedSeconds: 0,
      completed: false
    };
    
    state.targets.push(newTarget);
    saveState();
    
    // Reset form
    targetText.value = '';
    targetTypeSelect.value = 'none';
    targetHoursInputGroup.classList.add('hidden');
    
    renderTargetsList();
    alert("New determination created successfully!");
  });

  // Accumulate time to target
  function accumulateTimeToTarget(targetId, seconds) {
    const target = state.targets.find(t => t.id === targetId);
    if (target && !target.completed) {
      target.accumulatedSeconds += seconds;
      
      // Auto-complete check
      if (target.type === 'hours' && target.accumulatedSeconds >= target.targetSeconds) {
        target.completed = true;
        alert(`Congratulations! You have completed your target: "${target.text}"! 🎉`);
      }
    }
  }

  // Populate drop-down selectors
  function populateTargetDropdowns() {
    const prevTimerVal = timerTargetSelect.value;
    const prevManualVal = manualTargetSelect.value;
    
    timerTargetSelect.innerHTML = '<option value="">-- General Chanting (None) --</option>';
    manualTargetSelect.innerHTML = '<option value="">-- General Chanting (None) --</option>';
    
    const activeTargets = state.targets.filter(t => !t.completed);
    
    activeTargets.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      
      const hrsText = t.type === 'hours' ? ` (${(t.accumulatedSeconds/3600).toFixed(1)}h/${t.targetSeconds/3600}h)` : '';
      option.textContent = t.text + hrsText;
      
      timerTargetSelect.appendChild(option.cloneNode(true));
      manualTargetSelect.appendChild(option.cloneNode(true));
    });
    
    if (activeTargets.some(t => t.id === prevTimerVal)) {
      timerTargetSelect.value = prevTimerVal;
    }
    if (activeTargets.some(t => t.id === prevManualVal)) {
      manualTargetSelect.value = prevManualVal;
    }
  }

  // Render Targets View lists
  function renderTargetsList() {
    activeTargetsList.innerHTML = '';
    completedTargetsList.innerHTML = '';
    
    const active = state.targets.filter(t => !t.completed);
    const completed = state.targets.filter(t => t.completed);
    
    // 1. Active Targets
    if (active.length === 0) {
      activeTargetsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-bullseye"></i>
          <p>No active determinations. Set a target to focus your Daimoku!</p>
        </div>
      `;
    } else {
      active.forEach(t => {
        const item = document.createElement('div');
        item.className = 'target-item';
        
        let progressText = "Open-ended target";
        let progressBar = "";
        
        if (t.type === 'hours') {
          const accHours = (t.accumulatedSeconds / 3600).toFixed(1);
          const tgtHours = (t.targetSeconds / 3600).toFixed(0);
          const percent = Math.min(100, Math.round((t.accumulatedSeconds / t.targetSeconds) * 100));
          progressText = `${accHours} / ${tgtHours} hours chanting`;
          progressBar = `
            <div class="progress-bar-track" style="margin-top: 8px;">
              <div class="progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
          `;
        }
        
        item.innerHTML = `
          <div class="target-checkbox-container">
            <div class="target-checkbox" title="Mark Completed">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          <div class="target-content-box">
            <span class="target-title">${t.text}</span>
            <div class="target-meta-row">
              <span class="target-progress-text">${progressText}</span>
            </div>
            ${progressBar}
          </div>
          <button class="btn-delete-target" data-id="${t.id}" title="Delete Target"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        item.querySelector('.target-checkbox').addEventListener('click', () => {
          toggleTargetCompleted(t.id);
        });
        
        item.querySelector('.btn-delete-target').addEventListener('click', () => {
          deleteTarget(t.id);
        });
        
        activeTargetsList.appendChild(item);
      });
    }
    
    // 2. Completed Targets
    completedTargetsCount.textContent = completed.length;
    if (completed.length === 0) {
      completedTargetsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check"></i>
          <p>No completed targets yet. Stay consistent and win!</p>
        </div>
      `;
    } else {
      completed.forEach(t => {
        const item = document.createElement('div');
        item.className = 'target-item completed';
        
        let progressText = "Completed";
        if (t.type === 'hours') {
          progressText = `Completed (${(t.targetSeconds/3600).toFixed(0)}h logged)`;
        }
        
        item.innerHTML = `
          <div class="target-checkbox-container">
            <div class="target-checkbox" title="Reactivate Target">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          <div class="target-content-box">
            <span class="target-title">${t.text}</span>
            <span class="target-progress-text">${progressText}</span>
          </div>
          <button class="btn-delete-target" data-id="${t.id}" title="Delete Target"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        item.querySelector('.target-checkbox').addEventListener('click', () => {
          toggleTargetCompleted(t.id);
        });
        
        item.querySelector('.btn-delete-target').addEventListener('click', () => {
          deleteTarget(t.id);
        });
        
        completedTargetsList.appendChild(item);
      });
    }
  }

  function toggleTargetCompleted(id) {
    const target = state.targets.find(t => t.id === id);
    if (target) {
      target.completed = !target.completed;
      saveState();
      renderTargetsList();
    }
  }

  function deleteTarget(id) {
    if (confirm("Are you sure you want to delete this determination? This will remove it from your records.")) {
      state.targets = state.targets.filter(t => t.id !== id);
      saveState();
      renderTargetsList();
    }
  }

  // Toggle completed targets list collapse
  btnToggleCompletedTargets.addEventListener('click', () => {
    completedTargetsCard.classList.toggle('open');
    completedTargetsList.classList.toggle('collapsed');
  });

  // --- Boot Sequences ---
  loadState();
  initNavigation();
  updateQuote();
  renderTargetsList();
  populateTargetDropdowns();
  
  // Initialize Plant Canvas
  const canvasElement = document.getElementById('plant-canvas');
  PlantRenderer.init(canvasElement);
  
  // Run notification check immediately on boot, and check every 5 minutes
  runNotificationsChecks();
  setInterval(runNotificationsChecks, 1000 * 60 * 5);
  
  // Periodic decay check while app is open (every 10 seconds)
  setInterval(() => {
    if (!state.isDead && timerState !== 'running') {
      applyTimeDecay();
      updateUI();
    }
  }, 10000);
  
  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered successfully!', reg.scope))
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }
  
});
