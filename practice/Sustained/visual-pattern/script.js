const difficultyMap = {
  easy: { size: 4, minCells: 5, maxCells: 7, observeMs: 2000, rounds: 3 },
  medium: { size: 5, minCells: 8, maxCells: 11, observeMs: 2500, rounds: 4 },
  hard: { size: 6, minCells: 12, maxCells: 15, observeMs: 3200, rounds: 5 },
};

const state = {
  difficulty: 'easy',
  pattern: new Set(),
  user: new Set(),
  observing: false,
  recallStart: 0,
  focusLoss: 0,
  paused: false,
  pauseStart: 0,
  totalPaused: 0,
  round: 1,
  totalRounds: 3,
  levelIndex: 0,
  levelOrder: ['easy', 'medium', 'hard'],
  aggregate: {
    correct: 0,
    missed: 0,
    extra: 0,
    accuracySum: 0,
    precisionSum: 0,
    speedSum: 0,
    scoreSum: 0,
  },
};

const ui = {
  screenLanding: document.getElementById('screen-landing'),
  screenCountdown: document.getElementById('screen-countdown'),
  screenTest: document.getElementById('screen-test'),
  screenResults: document.getElementById('screen-results'),
  startBtn: document.getElementById('startBtn'),
  practiceBtn: document.getElementById('practiceBtn'),
  countdownText: document.getElementById('countdownText'),
  phaseLabel: document.getElementById('phaseLabel'),
  phaseHint: document.getElementById('phaseHint'),
  gridWrap: document.getElementById('gridWrap'),
  recallActions: document.getElementById('recallActions'),
  submitBtn: document.getElementById('submitBtn'),
  resetBtn: document.getElementById('resetBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resumeBtn: document.getElementById('resumeBtn'),
  pauseOverlay: document.getElementById('pauseOverlay'),
  fullscreenToggle: document.getElementById('fullscreenToggle'),
  focusAlert: document.getElementById('focusAlert'),
  statGrid: document.getElementById('statGrid'),
  statCells: document.getElementById('statCells'),
  statObserve: document.getElementById('statObserve'),
  resultScore: document.getElementById('resultScore'),
  resultAccuracy: document.getElementById('resultAccuracy'),
  resultSpeed: document.getElementById('resultSpeed'),
  resultCorrect: document.getElementById('resultCorrect'),
  resultMissed: document.getElementById('resultMissed'),
  resultExtra: document.getElementById('resultExtra'),
  resultMemory: document.getElementById('resultMemory'),
  resultObservation: document.getElementById('resultObservation'),
  resultPrecision: document.getElementById('resultPrecision'),
  resultInsight: document.getElementById('resultInsight'),
  resultAdvice: document.getElementById('resultAdvice'),
  resultSubtitle: document.getElementById('resultSubtitle'),
  restartBtn: document.getElementById('restartBtn'),
};

const patternTemplates = {
  3: [
    [0, 4, 8],
    [2, 4, 6],
    [1, 3, 4, 5],
    [0, 2, 6, 8],
  ],
  4: [
    [0, 5, 10, 15],
    [3, 6, 9, 12],
    [1, 5, 9, 13],
    [4, 5, 6, 9],
  ],
  5: [
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
    [2, 7, 12, 17, 22],
    [10, 11, 12, 13, 14],
  ],
  6: [
    [0, 7, 14, 21, 28, 35],
    [5, 10, 15, 20, 25, 30],
    [2, 9, 16, 23, 30, 33],
    [15, 16, 17, 18, 19, 20],
  ],
};

function updateDifficultyStats() {
  const diff = difficultyMap[state.difficulty];
  ui.statGrid.textContent = `${diff.size} x ${diff.size}`;
  ui.statCells.textContent = `${diff.minCells}-${diff.maxCells}`;
  ui.statObserve.textContent = `${(diff.observeMs / 1000).toFixed(1)}s`;
  state.totalRounds = diff.rounds;
}

function showScreen(target) {
  [ui.screenLanding, ui.screenCountdown, ui.screenTest, ui.screenResults].forEach((screen) => {
    screen.classList.toggle('is-active', screen === target);
  });
}

function waitMs(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function buildGrid(size) {
  ui.gridWrap.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

  for (let i = 0; i < size * size; i += 1) {
    const cell = document.createElement('button');
    cell.className = 'grid-cell';
    cell.type = 'button';
    cell.dataset.index = String(i);
    grid.appendChild(cell);
  }

  ui.gridWrap.appendChild(grid);
  return grid;
}

function applyPattern(pattern) {
  const cells = ui.gridWrap.querySelectorAll('.grid-cell');
  cells.forEach((cell) => {
    const index = Number(cell.dataset.index);
    cell.classList.toggle('active', pattern.has(index));
  });
}

function setGridInteractive(enabled) {
  const cells = ui.gridWrap.querySelectorAll('.grid-cell');
  cells.forEach((cell) => {
    cell.classList.toggle('locked', !enabled);
    cell.classList.toggle('selectable', enabled);
  });
}

function generatePattern(size, count) {
  const total = size * size;
  const picks = new Set();
  const templates = patternTemplates[size] || [];
  if (templates.length && Math.random() < 0.5) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    template.forEach((idx) => picks.add(idx));
  }

  const available = shuffle([...Array(total).keys()]);
  for (const idx of available) {
    if (picks.size >= count) break;
    picks.add(idx);
  }
  if (picks.size > count) {
    const trimmed = shuffle([...picks]).slice(0, count);
    return new Set(trimmed);
  }
  return picks;
}

function updatePhase(phase) {
  const roundLabel = `Round ${state.round}/${state.totalRounds}`;
  if (phase === 'observe') {
    ui.phaseLabel.textContent = `Observation · ${roundLabel}`;
    ui.phaseHint.textContent = 'Memorize the pattern.';
    ui.recallActions.classList.remove('show');
  } else if (phase === 'recall') {
    ui.phaseLabel.textContent = `Recall · ${roundLabel}`;
    ui.phaseHint.textContent = 'Recreate the pattern from memory.';
    ui.recallActions.classList.add('show');
  }
}

function togglePause(force) {
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
  if (state.paused || ui.screenResults.classList.contains('is-active')) return;
  state.focusLoss += 1;
  ui.focusAlert.textContent = 'Focus interrupted. Stay on task.';
  ui.focusAlert.classList.add('is-warning');
  togglePause(true);
}

function resetFocusAlert() {
  ui.focusAlert.textContent = 'Focus intact.';
  ui.focusAlert.classList.remove('is-warning');
}

async function runCountdown() {
  showScreen(ui.screenCountdown);
  const steps = ['3', '2', '1', 'START'];
  for (const step of steps) {
    ui.countdownText.textContent = step;
    await waitMs(750);
  }
}

function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  }
}

async function runObservation() {
  const diff = difficultyMap[state.difficulty];
  const cells = randomBetween(diff.minCells, diff.maxCells);
  state.pattern = generatePattern(diff.size, cells);
  state.user = new Set();
  state.totalPaused = 0;

  buildGrid(diff.size);
  setGridInteractive(false);
  applyPattern(state.pattern);
  updatePhase('observe');

  state.observing = true;
  await waitMs(diff.observeMs);
  state.observing = false;

  applyPattern(new Set());
  setGridInteractive(true);
  updatePhase('recall');
  state.recallStart = performance.now();
}

function collectUserPattern() {
  const cells = ui.gridWrap.querySelectorAll('.grid-cell');
  const selection = new Set();
  cells.forEach((cell) => {
    if (cell.classList.contains('active')) selection.add(Number(cell.dataset.index));
  });
  return selection;
}

function scoreRecall(recallMs) {
  const target = state.pattern;
  const user = state.user;
  let correct = 0;
  let missed = 0;
  let extra = 0;

  target.forEach((idx) => {
    if (user.has(idx)) correct += 1;
    else missed += 1;
  });
  user.forEach((idx) => {
    if (!target.has(idx)) extra += 1;
  });

  const accuracy = target.size ? Math.round((correct / target.size) * 100) : 0;
  const precision = user.size ? Math.round((correct / user.size) * 100) : 0;
  const speedSec = Math.max(0.5, recallMs / 1000);
  const speedScore = Math.max(0, 12 - speedSec) * 8;
  const rawScore = Math.max(0, Math.round(correct * 12 - missed * 6 - extra * 5 + speedScore));

  return { correct, missed, extra, accuracy, precision, speedSec, rawScore };
}

function resetAggregate() {
  state.aggregate = {
    correct: 0,
    missed: 0,
    extra: 0,
    accuracySum: 0,
    precisionSum: 0,
    speedSum: 0,
    scoreSum: 0,
  };
}

function addAggregate(metrics) {
  state.aggregate.correct += metrics.correct;
  state.aggregate.missed += metrics.missed;
  state.aggregate.extra += metrics.extra;
  state.aggregate.accuracySum += metrics.accuracy;
  state.aggregate.precisionSum += metrics.precision;
  state.aggregate.speedSum += metrics.speedSec;
  state.aggregate.scoreSum += metrics.rawScore;
}

function ratingFrom(value) {
  if (value >= 85) return 'Excellent';
  if (value >= 70) return 'Good';
  if (value >= 55) return 'Moderate';
  return 'Needs Work';
}

function buildInsight(metrics) {
  if (metrics.accuracy >= 85 && metrics.precision >= 85) {
    return {
      title: 'Strong Visual Memory',
      suggestion: 'Push to a harder grid or add sequential recall for advanced training.',
    };
  }
  if (metrics.missed >= metrics.extra && metrics.missed >= 2) {
    return {
      title: 'Observation Retention Gap',
      suggestion: 'Focus on longer observation and chunk the pattern into sections.',
    };
  }
  if (metrics.extra >= metrics.missed && metrics.extra >= 2) {
    return {
      title: 'Guess-Based Recall',
      suggestion: 'Slow down recall and only select cells you clearly remember.',
    };
  }
  return {
    title: 'Balanced Recall Pattern',
    suggestion: 'Maintain consistency and increase difficulty gradually.',
  };
}

function showResults(metrics) {
  const average = {
    correct: state.aggregate.correct,
    missed: state.aggregate.missed,
    extra: state.aggregate.extra,
    accuracy: Math.round(state.aggregate.accuracySum / state.totalRounds),
    precision: Math.round(state.aggregate.precisionSum / state.totalRounds),
    speedSec: state.aggregate.speedSum / state.totalRounds,
    rawScore: Math.round(state.aggregate.scoreSum / state.totalRounds),
  };

  ui.resultScore.textContent = average.rawScore;
  ui.resultAccuracy.textContent = `${average.accuracy}%`;
  ui.resultSpeed.textContent = `${average.speedSec.toFixed(1)}s`;
  ui.resultCorrect.textContent = average.correct;
  ui.resultMissed.textContent = average.missed;
  ui.resultExtra.textContent = average.extra;
  ui.resultPrecision.textContent = `${average.precision}%`;
  ui.resultMemory.textContent = ratingFrom(average.accuracy);
  ui.resultObservation.textContent = ratingFrom(100 - average.missed * 8);

  const insight = buildInsight(average);
  ui.resultSubtitle.textContent = insight.title;
  ui.resultInsight.textContent = insight.title;
  ui.resultAdvice.textContent = insight.suggestion;

  showScreen(ui.screenResults);
}

function bindGridInteractions() {
  ui.gridWrap.addEventListener('click', (event) => {
    const cell = event.target.closest('.grid-cell');
    if (!cell || state.observing) return;
    cell.classList.toggle('active');
    state.user = collectUserPattern();
  });
}

function advanceLevel() {
  state.levelIndex = Math.min(state.levelIndex + 1, state.levelOrder.length - 1);
  state.difficulty = state.levelOrder[state.levelIndex];
  state.round = 1;
  updateDifficultyStats();
}

function initControls() {
  updateDifficultyStats();
  bindGridInteractions();

  ui.startBtn.addEventListener('click', async () => {
    requestFullscreen();
    state.levelIndex = 0;
    state.difficulty = state.levelOrder[state.levelIndex];
    state.round = 1;
    updateDifficultyStats();
    resetAggregate();
    await runCountdown();
    showScreen(ui.screenTest);
    await runObservation();
  });

  ui.practiceBtn.addEventListener('click', async () => {
    requestFullscreen();
    state.levelIndex = 0;
    state.difficulty = state.levelOrder[state.levelIndex];
    state.round = 1;
    updateDifficultyStats();
    resetAggregate();
    await runCountdown();
    showScreen(ui.screenTest);
    await runObservation();
  });

  ui.resetBtn.addEventListener('click', () => {
    state.user = new Set();
    applyPattern(new Set());
  });

  ui.submitBtn.addEventListener('click', () => {
    state.user = collectUserPattern();
    const recallMs = performance.now() - state.recallStart - state.totalPaused;
    const metrics = scoreRecall(recallMs);
    addAggregate(metrics);
    if (state.round < state.totalRounds) {
      state.round += 1;
      runObservation();
      return;
    }
    if (state.levelIndex < state.levelOrder.length - 1) {
      advanceLevel();
      runObservation();
      return;
    }
    showResults(metrics);
  });

  ui.restartBtn.addEventListener('click', () => {
    state.user = new Set();
    state.pattern = new Set();
    state.totalPaused = 0;
    state.round = 1;
    state.levelIndex = 0;
    state.difficulty = state.levelOrder[state.levelIndex];
    resetAggregate();
    showScreen(ui.screenLanding);
    resetFocusAlert();
  });

  ui.pauseBtn.addEventListener('click', () => togglePause());
  ui.resumeBtn.addEventListener('click', () => togglePause(false));

  ui.fullscreenToggle.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) handleFocusLoss();
  });

  window.addEventListener('blur', handleFocusLoss);
  window.addEventListener('focus', resetFocusAlert);
}

initControls();
showScreen(ui.screenLanding);
