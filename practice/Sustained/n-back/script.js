const config = {
  totalRounds: 32,
  minDelay: 800,
  maxDelay: 2200,
  minVisible: 700,
  maxVisible: 1300,
  debounceMs: 140,
  matchChance: 0.3,
};

const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

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
  soundOn: false,
  history: [],
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

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function waitMs(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function estimateDuration() {
  const avgDelay = (config.minDelay + config.maxDelay) / 2;
  const avgVisible = (config.minVisible + config.maxVisible) / 2;
  const totalMs = (avgDelay + avgVisible) * config.totalRounds;
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

function randomSymbol(exclude) {
  const options = symbols.filter((symbol) => symbol !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

function pickStimulus() {
  if (state.history.length >= 2 && Math.random() < config.matchChance) {
    return { symbol: state.history[state.history.length - 2], isMatch: true };
  }
  const lastSymbol = state.history[state.history.length - 1];
  return { symbol: randomSymbol(lastSymbol), isMatch: false };
}

function playTone(type) {
  if (!state.soundOn) return;
  const ctx = window.__nbackAudio || new (window.AudioContext || window.webkitAudioContext)();
  window.__nbackAudio = ctx;
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
  ui.statusLine.textContent = message;
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

function handleResponse(key) {
  if (!state.running || state.paused) return;
  const now = performance.now();
  if (now - state.lastInputAt < config.debounceMs) return;
  state.lastInputAt = now;

  const pressed = key.toLowerCase();
  if (pressed !== 'f') return;

  if (state.stimulusActive) {
    if (state.responded) return;
    state.responded = true;
    const reaction = now - state.stimulusStart;
    if (state.currentRule === 'match') {
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

  const stimulus = pickStimulus();
  state.currentRound += 1;
  state.currentRule = stimulus.isMatch ? 'match' : 'none';
  state.responded = false;
  state.stimulusActive = true;
  if (stimulus.isMatch) state.requiredCount += 1;

  ui.stimulus.textContent = stimulus.symbol;
  ui.stimulus.classList.add('show');
  state.stimulusStart = performance.now();
  setStatus('Hold 2-back in mind.');

  const visible = randomBetween(config.minVisible, config.maxVisible);
  await pauseableWait(visible);

  ui.stimulus.classList.remove('show');
  state.stimulusActive = false;

  if (stimulus.isMatch && !state.responded) {
    state.missed += 1;
  }

  state.history.push(stimulus.symbol);
}

async function runTest() {
  resetState();
  await runCountdown();
  showScreen(ui.screenTest);

  state.running = true;
  state.testStart = performance.now();
  updateElapsed();

  for (let i = 0; i < config.totalRounds; i += 1) {
    if (!state.running) break;
    await runStimulusRound();
  }

  state.running = false;
  showResults();
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
  if (accuracy >= 0.85 && attentionIndex >= 80 && falsePos <= 2) {
    return {
      title: 'Excellent Working Memory',
      detail: 'High accuracy and controlled responses under load.',
    };
  }
  if (accuracy >= 0.7 && attentionIndex >= 65) {
    return {
      title: 'Good Focus Retention',
      detail: 'Stable results. Reduce false triggers to improve precision.',
    };
  }
  if (falsePos >= 5) {
    return {
      title: 'High False Trigger Rate',
      detail: 'Slow slightly and confirm the 2-back match before responding.',
    };
  }
  return {
    title: 'Moderate Memory Stability',
    detail: 'Consistent practice improves retention and response control.',
  };
}

function initControls() {
  const requestFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    }
  };

  ui.statRounds.textContent = config.totalRounds;
  ui.statDuration.textContent = estimateDuration();

  ui.startBtn.addEventListener('click', () => {
    config.totalRounds = 32;
    ui.statRounds.textContent = config.totalRounds;
    ui.statDuration.textContent = estimateDuration();
    requestFullscreen();
    runTest();
  });

  ui.practiceBtn.addEventListener('click', () => {
    config.totalRounds = 12;
    ui.statRounds.textContent = config.totalRounds;
    ui.statDuration.textContent = estimateDuration();
    requestFullscreen();
    runTest();
  });

  ui.restartBtn.addEventListener('click', () => {
    config.totalRounds = 32;
    showScreen(ui.screenLanding);
    resetState();
  });

  ui.pauseBtn.addEventListener('click', () => togglePause());
  ui.resumeBtn.addEventListener('click', () => togglePause(false));

  ui.soundToggle.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    ui.soundToggle.textContent = `Sound: ${state.soundOn ? 'On' : 'Off'}`;
    if (state.soundOn) playTone('tick');
  });

  ui.fullscreenToggle.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.key.toLowerCase() === 'p' && state.running) {
      togglePause();
      return;
    }
    handleResponse(event.key);
  });

  ui.mobileControls.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-key]');
    if (!btn) return;
    btn.classList.add('is-pressed');
    setTimeout(() => btn.classList.remove('is-pressed'), 120);
    handleResponse(btn.dataset.key);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) handleFocusLoss();
  });

  window.addEventListener('blur', handleFocusLoss);
  window.addEventListener('focus', resetFocusAlert);
}

initControls();
showScreen(ui.screenLanding);
resetState();
