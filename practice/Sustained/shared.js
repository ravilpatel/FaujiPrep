(() => {
  const root = document.body;
  const testType = root.dataset.test;
  if (!testType) return;

  const configMap = {
    attention: {
      totalRounds: 30,
      minDelay: 800,
      maxDelay: 2500,
      minVisible: 700,
      maxVisible: 1500,
      debounceMs: 140,
      rule1Chance: 0.2,
      rule2Chance: 0.2,
      soundOn: false,
    },
    shape: {
      totalRounds: 28,
      minDelay: 800,
      maxDelay: 2300,
      minVisible: 700,
      maxVisible: 1300,
      debounceMs: 140,
      soundOn: false,
    },
    count: {
      totalRounds: 24,
      minDelay: 800,
      maxDelay: 2200,
      minVisible: 700,
      maxVisible: 1400,
      debounceMs: 140,
      soundOn: false,
    },
    nback: {
      totalRounds: 32,
      minDelay: 800,
      maxDelay: 2200,
      minVisible: 700,
      maxVisible: 1300,
      debounceMs: 140,
      matchChance: 0.3,
      soundOn: false,
    },
    audio: {
      totalRounds: 30,
      minDelay: 900,
      maxDelay: 2300,
      minVisible: 800,
      maxVisible: 1400,
      debounceMs: 160,
      matchChance: 0.3,
      minGap: 1250,
      soundOn: true,
    },
  };

  const config = configMap[testType];
  if (!config) return;

  const colors = [
    { name: 'red', hex: '#cf3b3b' },
    { name: 'blue', hex: '#2f6fb8' },
    { name: 'green', hex: '#2c8a4b' },
    { name: 'yellow', hex: '#c4a136' },
    { name: 'white', hex: '#e2e6ea' },
  ];

  const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const digits = ['4', '5', '6'];
  const audioFiles = ['1.mp3', '2.mp3', '3.mp3', '4.mp3', '5.mp3'];

  const ruleMap = {
    rule1: { border: 'red', fill: 'blue', key: 'f' },
    rule2: { border: 'blue', fill: 'red', key: 'j' },
  };

  const state = {
    running: false,
    paused: false,
    currentRound: 0,
    stimulusActive: false,
    responded: false,
    currentRule: 'none',
    requiredCount: 0,
    correct: 0,
    wrong: 0,
    missed: 0,
    falsePos: 0,
    reactionTimes: [],
    focusLoss: 0,
    lastInputAt: 0,
    testStart: 0,
    pauseStart: 0,
    totalPaused: 0,
    lastCombo: null,
    history: [],
    soundOn: config.soundOn,
    audioEnabled: false,
  };

  const ui = {
    screenLanding: document.getElementById('screen-landing'),
    screenCountdown: document.getElementById('screen-countdown'),
    screenTest: document.getElementById('screen-test'),
    screenResults: document.getElementById('screen-results'),
    startBtn: document.getElementById('startBtn'),
    practiceBtn: document.getElementById('practiceBtn'),
    countdownText: document.getElementById('countdownText'),
    stimulus: document.getElementById('stimulus'),
    stimulusGlow: document.getElementById('stimulusGlow'),
    statusLine: document.getElementById('statusLine'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    mobileControls: document.getElementById('mobileControls'),
    soundToggle: document.getElementById('soundToggle'),
    fullscreenToggle: document.getElementById('fullscreenToggle'),
    resultScore: document.getElementById('resultScore'),
    resultAccuracy: document.getElementById('resultAccuracy'),
    resultAvg: document.getElementById('resultAvg'),
    resultFast: document.getElementById('resultFast'),
    resultSlow: document.getElementById('resultSlow'),
    resultCorrect: document.getElementById('resultCorrect'),
    resultWrong: document.getElementById('resultWrong'),
    resultMissed: document.getElementById('resultMissed'),
    resultIndex: document.getElementById('resultIndex'),
    resultInsight: document.getElementById('resultInsight'),
    resultSubtitle: document.getElementById('resultSubtitle'),
    focusNote: document.getElementById('focusNote'),
    restartBtn: document.getElementById('restartBtn'),
    focusAlert: document.getElementById('focusAlert'),
    statRounds: document.getElementById('statRounds'),
    statDuration: document.getElementById('statDuration'),
  };

  const audioMap = new Map();

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function waitMs(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  function estimateDuration(rounds) {
    const avgDelay = (config.minDelay + config.maxDelay) / 2;
    const avgVisible = (config.minVisible + config.maxVisible) / 2;
    const totalMs = (avgDelay + avgVisible) * rounds;
    return formatTime(totalMs);
  }

  function showScreen(target) {
    [ui.screenLanding, ui.screenCountdown, ui.screenTest, ui.screenResults].forEach((screen) => {
      screen.classList.toggle('is-active', screen === target);
    });
  }

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function playTone(type) {
    if (!state.soundOn) return;
    const ctx = window.__sharedTone || new (window.AudioContext || window.webkitAudioContext)();
    window.__sharedTone = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const settings = {
      correct: { freq: 520, gain: 0.08, duration: 0.12 },
      wrong: { freq: 200, gain: 0.1, duration: 0.16 },
      tick: { freq: 380, gain: 0.05, duration: 0.08 },
    };
    const chosen = settings[type] || settings.tick;
    osc.frequency.value = chosen.freq;
    osc.type = 'sine';
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    gain.gain.linearRampToValueAtTime(chosen.gain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + chosen.duration);
    osc.stop(now + chosen.duration + 0.02);
  }

  function avg(list) {
    if (!list.length) return 0;
    return list.reduce((sum, value) => sum + value, 0) / list.length;
  }

  function stdDev(list) {
    if (list.length < 2) return 0;
    const mean = avg(list);
    const variance = list.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / list.length;
    return Math.sqrt(variance);
  }

  function updateElapsed() {
    if (!state.running) return;
    const now = performance.now();
    const pausedMs = state.totalPaused + (state.paused ? now - state.pauseStart : 0);
    const elapsed = now - state.testStart - pausedMs;
    if (ui.hudTime) ui.hudTime.textContent = formatTime(elapsed);
    requestAnimationFrame(updateElapsed);
  }

  function togglePause(force) {
    if (!state.running) return;
    const nextState = force !== undefined ? force : !state.paused;
    state.paused = nextState;
    ui.pauseOverlay.classList.toggle('active', state.paused);
    ui.pauseOverlay.setAttribute('aria-hidden', String(!state.paused));
    ui.pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    if (state.paused) {
      state.pauseStart = performance.now();
    } else {
      state.totalPaused += performance.now() - state.pauseStart;
    }
  }

  function handleFocusLoss() {
    if (!state.running || state.paused) return;
    state.focusLoss += 1;
    ui.focusAlert.textContent = 'Focus interrupted. Stay on task.';
    ui.focusAlert.classList.add('is-warning');
    togglePause(true);
  }

  function resetFocusAlert() {
    ui.focusAlert.textContent = 'Focus intact.';
    ui.focusAlert.classList.remove('is-warning');
  }

  function setStatus(message) {
    if (ui.statusLine) ui.statusLine.textContent = message;
  }

  function resetState() {
    Object.assign(state, {
      running: false,
      paused: false,
      currentRound: 0,
      stimulusActive: false,
      responded: false,
      currentRule: 'none',
      requiredCount: 0,
      correct: 0,
      wrong: 0,
      missed: 0,
      falsePos: 0,
      reactionTimes: [],
      focusLoss: 0,
      lastInputAt: 0,
      testStart: 0,
      pauseStart: 0,
      totalPaused: 0,
      lastCombo: null,
      history: [],
    });
    resetFocusAlert();
  }

  async function runCountdown() {
    showScreen(ui.screenCountdown);
    const steps = ['3', '2', '1', 'START'];
    for (const step of steps) {
      ui.countdownText.textContent = step;
      playTone('tick');
      await waitMs(750);
    }
  }

  function pauseableWait(duration) {
    return new Promise((resolve) => {
      let elapsed = 0;
      let last = performance.now();

      function tick(now) {
        if (!state.running) return resolve();
        if (state.paused) {
          last = now;
          return requestAnimationFrame(tick);
        }
        elapsed += now - last;
        last = now;
        if (elapsed >= duration) return resolve();
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }

  function scoreTest() {
    const accuracy = state.requiredCount ? state.correct / state.requiredCount : 0;
    const avgRt = avg(state.reactionTimes);
    const rtScore = avgRt ? Math.max(0, 600 - avgRt) : 0;
    const rawScore = Math.round(state.correct * 10 - state.wrong * 4 - state.missed * 3 + rtScore);
    const consistencyPenalty = stdDev(state.reactionTimes) / 25;
    const attentionIndex = Math.max(0, Math.min(100, Math.round(accuracy * 100 - state.falsePos * 4 - consistencyPenalty)));
    return { accuracy, avgRt, attentionIndex, rawScore };
  }

  function showResults() {
    const { accuracy, avgRt, attentionIndex, rawScore } = scoreTest();
    const fastest = state.reactionTimes.length ? Math.min(...state.reactionTimes) : 0;
    const slowest = state.reactionTimes.length ? Math.max(...state.reactionTimes) : 0;

    ui.resultScore.textContent = rawScore;
    ui.resultAccuracy.textContent = `${Math.round(accuracy * 100)}%`;
    ui.resultAvg.textContent = avgRt ? `${Math.round(avgRt)} ms` : '0 ms';
    ui.resultFast.textContent = fastest ? `${Math.round(fastest)} ms` : '0 ms';
    ui.resultSlow.textContent = slowest ? `${Math.round(slowest)} ms` : '0 ms';
    ui.resultCorrect.textContent = state.correct;
    ui.resultWrong.textContent = state.wrong;
    ui.resultMissed.textContent = state.missed;
    ui.resultIndex.textContent = attentionIndex;
    ui.focusNote.textContent = `Focus interruptions: ${state.focusLoss}`;

    const insight = getInsight(accuracy, attentionIndex, state.falsePos);
    ui.resultInsight.textContent = insight.detail;
    ui.resultSubtitle.textContent = insight.title;

    showScreen(ui.screenResults);
  }

  function getInsight(accuracy, attentionIndex, falsePos) {
    if (testType === 'shape') {
      if (accuracy >= 0.9 && attentionIndex >= 85 && falsePos <= 2) {
        return { title: 'Excellent Shape Discrimination', detail: 'Strong recognition speed with disciplined responses. Maintain this standard.' };
      }
      if (accuracy >= 0.75 && attentionIndex >= 70) {
        return { title: 'Good Reflex Accuracy', detail: 'Consistent responses. Reduce misses to reach elite performance.' };
      }
    }
    if (testType === 'count') {
      if (accuracy >= 0.9 && attentionIndex >= 85 && falsePos <= 2) {
        return { title: 'Excellent Counting Precision', detail: 'Fast counting with controlled responses. Maintain this standard.' };
      }
      if (accuracy >= 0.75 && attentionIndex >= 70) {
        return { title: 'Good Reflex Accuracy', detail: 'Consistent counting. Reduce misses to reach elite performance.' };
      }
    }
    if (testType === 'nback') {
      if (accuracy >= 0.85 && attentionIndex >= 80 && falsePos <= 2) {
        return { title: 'Excellent Working Memory', detail: 'High accuracy and controlled responses under load.' };
      }
      if (accuracy >= 0.7 && attentionIndex >= 65) {
        return { title: 'Good Focus Retention', detail: 'Stable results. Reduce false triggers to improve precision.' };
      }
    }
    if (testType === 'audio') {
      if (accuracy >= 0.85 && attentionIndex >= 80 && falsePos <= 2) {
        return { title: 'Excellent Auditory Working Memory', detail: 'High accuracy and controlled responses under auditory load.' };
      }
      if (accuracy >= 0.7 && attentionIndex >= 65) {
        return { title: 'Good Focus Retention', detail: 'Stable results. Reduce false triggers to improve precision.' };
      }
    }
    if (accuracy >= 0.85 && attentionIndex >= 80 && falsePos <= 2) {
      return { title: 'Excellent Attention Control', detail: 'Your accuracy and response stability indicate strong operational focus under pressure.' };
    }
    if (accuracy >= 0.7 && attentionIndex >= 65) {
      return { title: 'Good Reflex Accuracy', detail: 'Maintain this focus level and reduce false triggers to reach elite performance.' };
    }
    if (falsePos >= 4) {
      return { title: 'Impulsive Response Pattern', detail: 'Slow slightly and confirm the stimulus before responding.' };
    }
    return { title: 'Moderate Attention Stability', detail: 'Consistency training will improve both response speed and accuracy.' };
  }

  function requestFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    }
  }

  function initAudio() {
    audioFiles.forEach((file) => {
      const audio = new Audio(`audio/${file}`);
      audio.preload = 'auto';
      audioMap.set(file, audio);
    });
  }

  function enableAudio() {
    if (state.audioEnabled) return;
    state.audioEnabled = true;
    audioMap.forEach((audio) => {
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {
        audio.muted = false;
      });
    });
  }

  function playAudio(file) {
    const audio = audioMap.get(file);
    if (!audio || !state.soundOn) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (err) {
      console.warn('Audio play failed', err);
    }
  }

  function pickColor(excludeName) {
    const options = colors.filter((color) => color.name !== excludeName);
    return options[Math.floor(Math.random() * options.length)];
  }

  const handlers = {
    attention: {
      getStimulus() {
        const roll = Math.random();
        if (roll < config.rule1Chance) {
          return { type: 'rule1', ...ruleMap.rule1, isTarget: true };
        }
        if (roll < config.rule1Chance + config.rule2Chance) {
          return { type: 'rule2', ...ruleMap.rule2, isTarget: true };
        }
        let attempts = 0;
        let border = pickColor();
        let fill = pickColor();
        while (attempts < 10) {
          const isRule1 = border.name === ruleMap.rule1.border && fill.name === ruleMap.rule1.fill;
          const isRule2 = border.name === ruleMap.rule2.border && fill.name === ruleMap.rule2.fill;
          const tooSimilar = border.name === fill.name && Math.random() < 0.7;
          const sameAsLast = state.lastCombo && state.lastCombo.border === border.name && state.lastCombo.fill === fill.name;
          if (!isRule1 && !isRule2 && !tooSimilar && !sameAsLast) break;
          border = pickColor();
          fill = pickColor();
          attempts += 1;
        }
        return { type: 'ignore', border: border.name, fill: fill.name, key: null, isTarget: false };
      },
      apply(stimulus) {
        const border = colors.find((color) => color.name === stimulus.border);
        const fill = colors.find((color) => color.name === stimulus.fill);
        if (!border || !fill) return;
        ui.stimulus.style.borderColor = border.hex;
        ui.stimulus.style.backgroundColor = fill.hex;
        if (ui.stimulusGlow) {
          ui.stimulusGlow.style.background = `radial-gradient(circle at center, ${fill.hex}66, transparent 65%)`;
        }
        state.lastCombo = { border: stimulus.border, fill: stimulus.fill };
      },
      after(stimulus) {
        return stimulus.key ? `Respond now: ${stimulus.key.toUpperCase()}` : 'Ignore this stimulus.';
      },
      keys: ['f', 'j'],
    },
    shape: {
      getStimulus() {
        const shape = Math.random() < 0.5 ? 'circle' : 'square';
        return { shape, isTarget: true, key: shape === 'circle' ? 'f' : 'j' };
      },
      apply(stimulus) {
        ui.stimulus.classList.toggle('circle', stimulus.shape === 'circle');
      },
      after(stimulus) {
        return stimulus.shape === 'circle' ? 'Circle: Press F' : 'Square: Press J';
      },
      keys: ['f', 'j'],
    },
    count: {
      getStimulus() {
        const length = 4 + Math.floor(Math.random() * 3);
        const digit = digits[Math.floor(Math.random() * digits.length)];
        return { text: digit.repeat(length), key: String(length), isTarget: true };
      },
      apply(stimulus) {
        ui.stimulus.textContent = stimulus.text;
      },
      after() {
        return 'Count the digits now.';
      },
      keys: ['4', '5', '6'],
    },
    nback: {
      getStimulus() {
        if (state.history.length >= 2 && Math.random() < config.matchChance) {
          return { symbol: state.history[state.history.length - 2], isTarget: true, key: 'f' };
        }
        const lastSymbol = state.history[state.history.length - 1];
        const options = symbols.filter((symbol) => symbol !== lastSymbol);
        return { symbol: options[Math.floor(Math.random() * options.length)], isTarget: false, key: null };
      },
      apply(stimulus) {
        ui.stimulus.textContent = stimulus.symbol;
      },
      after() {
        return 'Hold 2-back in mind.';
      },
      postRound(stimulus) {
        state.history.push(stimulus.symbol);
      },
      keys: ['f'],
    },
    audio: {
      getStimulus() {
        if (state.history.length >= 2 && Math.random() < config.matchChance) {
          return { file: state.history[state.history.length - 2], isTarget: true, key: 'f' };
        }
        const exclude = new Set(state.history.slice(-2));
        const options = audioFiles.filter((file) => !exclude.has(file));
        return { file: options[Math.floor(Math.random() * options.length)], isTarget: false, key: null };
      },
      apply(stimulus) {
        playAudio(stimulus.file);
      },
      after() {
        return 'Listen and compare 2-back.';
      },
      postRound(stimulus) {
        state.history.push(stimulus.file);
      },
      keys: ['f'],
      gap: config.minGap,
    },
  };

  const handler = handlers[testType];

  function handleResponse(key) {
    if (!state.running || state.paused) return;
    const now = performance.now();
    if (now - state.lastInputAt < config.debounceMs) return;
    state.lastInputAt = now;

    const pressed = key.toLowerCase();
    if (!handler.keys.includes(pressed)) return;

    if (state.stimulusActive) {
      if (state.responded) return;
      state.responded = true;
      const reaction = now - state.stimulusStart;
      if (state.currentRule === pressed) {
        state.correct += 1;
        state.reactionTimes.push(reaction);
        playTone('correct');
      } else {
        state.wrong += 1;
        state.falsePos += 1;
        playTone('wrong');
      }
    } else {
      state.wrong += 1;
      state.falsePos += 1;
      playTone('wrong');
    }
  }

  async function runStimulusRound() {
    const delay = randomBetween(config.minDelay, config.maxDelay);
    setStatus('Stand by...');
    await pauseableWait(delay);

    const stimulus = handler.getStimulus();
    state.currentRound += 1;
    state.currentRule = stimulus.key || 'none';
    state.responded = false;
    state.stimulusActive = true;
    if (stimulus.isTarget) state.requiredCount += 1;

    handler.apply(stimulus);
    if (ui.stimulus) ui.stimulus.classList.add('show');
    if (ui.stimulusGlow) ui.stimulusGlow.classList.add('show');
    state.stimulusStart = performance.now();
    setStatus(handler.after(stimulus));

    const visible = randomBetween(config.minVisible, config.maxVisible);
    await pauseableWait(visible);

    if (ui.stimulus) ui.stimulus.classList.remove('show');
    if (ui.stimulusGlow) ui.stimulusGlow.classList.remove('show');
    state.stimulusActive = false;

    if (stimulus.isTarget && !state.responded) {
      state.missed += 1;
    }

    if (handler.postRound) handler.postRound(stimulus);
    if (handler.gap) await pauseableWait(handler.gap);
  }

  async function runTest(rounds) {
    resetState();
    await runCountdown();
    showScreen(ui.screenTest);

    state.running = true;
    state.testStart = performance.now();
    updateElapsed();

    for (let i = 0; i < rounds; i += 1) {
      if (!state.running) break;
      await runStimulusRound();
    }

    state.running = false;
    showResults();
  }

  function initControls() {
    if (ui.statRounds) ui.statRounds.textContent = config.totalRounds;
    if (ui.statDuration) ui.statDuration.textContent = estimateDuration(config.totalRounds);
    if (ui.soundToggle) ui.soundToggle.textContent = `Sound: ${state.soundOn ? 'On' : 'Off'}`;

    ui.startBtn.addEventListener('click', () => {
      const rounds = config.totalRounds;
      if (ui.statRounds) ui.statRounds.textContent = rounds;
      if (ui.statDuration) ui.statDuration.textContent = estimateDuration(rounds);
      if (testType === 'audio') enableAudio();
      requestFullscreen();
      runTest(rounds);
    });

    ui.practiceBtn.addEventListener('click', () => {
      const rounds = testType === 'audio' ? 12 : testType === 'nback' ? 12 : 10;
      if (ui.statRounds) ui.statRounds.textContent = rounds;
      if (ui.statDuration) ui.statDuration.textContent = estimateDuration(rounds);
      if (testType === 'audio') enableAudio();
      requestFullscreen();
      runTest(rounds);
    });

    ui.restartBtn.addEventListener('click', () => {
      showScreen(ui.screenLanding);
      resetState();
      if (ui.statRounds) ui.statRounds.textContent = config.totalRounds;
      if (ui.statDuration) ui.statDuration.textContent = estimateDuration(config.totalRounds);
    });

    ui.pauseBtn.addEventListener('click', () => togglePause());
    ui.resumeBtn.addEventListener('click', () => togglePause(false));

    if (ui.soundToggle) {
      ui.soundToggle.addEventListener('click', () => {
        state.soundOn = !state.soundOn;
        ui.soundToggle.textContent = `Sound: ${state.soundOn ? 'On' : 'Off'}`;
      });
    }

    if (ui.fullscreenToggle) {
      ui.fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      if (event.key.toLowerCase() === 'p' && state.running) {
        togglePause();
        return;
      }
      handleResponse(event.key);
    });

    if (ui.mobileControls) {
      ui.mobileControls.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-key]');
        if (!btn) return;
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 120);
        handleResponse(btn.dataset.key);
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) handleFocusLoss();
    });

    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('focus', resetFocusAlert);
  }

  if (testType === 'audio') initAudio();
  initControls();
  showScreen(ui.screenLanding);
  resetState();
})();
