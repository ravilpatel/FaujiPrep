import { hashSeed, createRng, randomChoice } from "./utils/rng.js";
import { svgWrapper, renderPolygon, renderFoldLine, renderHoles } from "./utils/svg.js";
import { createQuestion, unfoldWithSkip } from "./engine/generator.js";
import { ensureUniqueOptions } from "./engine/validator.js";
import { holesEqual, clipPolygon, makeSquare, lineFromPoints } from "./engine/geometry.js";
import { exportTest, importTest } from "./exporters/json.js";

const homePanel = document.getElementById("home");
const testPanel = document.getElementById("test");
const resultPanel = document.getElementById("result");

const difficultySelect = document.getElementById("difficulty");
const questionCountSelect = document.getElementById("question-count");
const seedInput = document.getElementById("seed");
const timerInput = document.getElementById("timer-min");

const generateBtn = document.getElementById("generate");
const randomSeedBtn = document.getElementById("random-seed");
const exportJsonBtn = document.getElementById("export-json");
const importJsonInput = document.getElementById("import-json");
const exportPdfBtn = document.getElementById("export-pdf");

const qIndex = document.getElementById("q-index");
const qTotal = document.getElementById("q-total");
const difficultyLabel = document.getElementById("difficulty-label");
const timerDisplay = document.getElementById("timer");
const foldSequence = document.getElementById("fold-sequence");
const holePunch = document.getElementById("hole-punch");
const optionsEl = document.getElementById("options");
const progressBar = document.getElementById("progress-bar");
const questionNav = document.getElementById("question-nav");

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");
const timeTakenEl = document.getElementById("time-taken");
const reviewEl = document.getElementById("review");
const restartBtn = document.getElementById("restart");

let testState = null;
let timerId = null;
let startTime = null;

function showPanel(panel) {
  homePanel.classList.remove("active");
  testPanel.classList.remove("active");
  resultPanel.classList.remove("active");
  panel.classList.add("active");
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const sec = String(total % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function buildSequence(question) {
  const steps = [];
  let currentPoly = makeSquare();

  const baseSvg = svgWrapper(renderPolygon(currentPoly));
  steps.push(`<div>${baseSvg}<div class="muted">Original</div></div>`);

  question.folds.forEach((fold, index) => {
    currentPoly = clipPolygon(currentPoly, fold.line, fold.keepSide);
    const foldSvg = svgWrapper(
      renderPolygon(currentPoly) + renderFoldLine(fold.line)
    );
    steps.push(`<div>${foldSvg}<div class="muted">Fold ${index + 1}</div></div>`);
  });

  const finalSvg = svgWrapper(renderPolygon(currentPoly, "#e9e9e4"));
  steps.push(`<div>${finalSvg}<div class="muted">Final</div></div>`);

  return steps.join("");
}

function buildHolePunch(question) {
  const svg = svgWrapper(
    renderPolygon(question.foldedPolygon, "#f3f3ef") + renderHoles(question.foldedHoles),
    140
  );
  return svg;
}

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

function buildOptions(question) {
  const options = question.options
    .map((option, index) => {
      const svg = svgWrapper(renderHoles(option.holes), 140);
      return `
        <div class="option" data-index="${index}">
          <div class="label">${optionLabel(index)}</div>
          ${svg}
        </div>
      `;
    })
    .join("");
  return options;
}

function renderQuestion() {
  const question = testState.questions[testState.currentIndex];
  qIndex.textContent = testState.currentIndex + 1;
  qTotal.textContent = testState.questions.length;
  difficultyLabel.textContent = question.difficulty.toUpperCase();

  foldSequence.innerHTML = buildSequence(question);
  holePunch.innerHTML = buildHolePunch(question);
  optionsEl.innerHTML = buildOptions(question);

  optionsEl.querySelectorAll(".option").forEach((option) => {
    const index = Number(option.dataset.index);
    if (question.selected === index) {
      option.classList.add("selected");
    }
    option.addEventListener("click", () => {
      question.selected = index;
      renderQuestion();
      updateProgress();
    });
  });

  questionNav.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.index) === testState.currentIndex);
  });
}

function updateProgress() {
  const answered = testState.questions.filter((q) => q.selected !== null).length;
  progressBar.style.width = `${(answered / testState.questions.length) * 100}%`;
}

function generateOptions(question, rng) {
  const correct = { holes: question.unfoldedHoles, label: "correct" };
  const options = [correct];

  const missingFold = () => {
    const skipIndex = Math.max(0, question.folds.length - 1);
    return { holes: unfoldWithSkip(question.foldedHoles, question.folds, skipIndex), label: "missing" };
  };

  const extraReflection = () => {
    const axis = randomChoice(rng, ["v", "h"]);
    const line = axis === "v"
      ? lineFromPoints({ x: 0.5, y: 0 }, { x: 0.5, y: 1 })
      : lineFromPoints({ x: 0, y: 0.5 }, { x: 1, y: 0.5 });
    const holes = question.unfoldedHoles
      .concat(question.unfoldedHoles.map((hole) => {
        const d = line.a * hole.x + line.b * hole.y + line.c;
        return { ...hole, x: hole.x - 2 * line.a * d, y: hole.y - 2 * line.b * d };
      }));
    return { holes, label: "extra" };
  };

  const rotated = () => {
    const holes = question.unfoldedHoles.map((hole) => ({
      ...hole,
      x: 1 - hole.y,
      y: hole.x,
    }));
    return { holes, label: "rotated" };
  };

  const candidates = [missingFold(), extraReflection(), rotated()];
  candidates.forEach((candidate) => options.push(candidate));

  return ensureUniqueOptions(options).slice(0, 4);
}

function buildTest(rng, difficulty, count) {
  const questions = [];
  const seen = new Set();
  let attempts = 0;
  while (questions.length < count && attempts < count * 8) {
    const question = createQuestion(rng, difficulty);
    const signature = `${difficulty}-${question.folds.map((f) => `${f.type}${f.offset}`).join("-")}-${question.foldedHoles
      .map((h) => `${h.shape}${h.x.toFixed(2)}${h.y.toFixed(2)}`)
      .join("|")}`;
    if (seen.has(signature)) {
      attempts += 1;
      continue;
    }
    const options = generateOptions(question, rng);
    if (options.length < 4) {
      attempts += 1;
      continue;
    }
    question.options = options;
    question.correctIndex = options.findIndex((opt) => holesEqual(opt.holes, question.unfoldedHoles));
    question.selected = null;
    seen.add(signature);
    questions.push(question);
  }
  return questions;
}

function startTimer() {
  const minutes = Number(timerInput.value || 15);
  startTime = Date.now();
  const totalMs = minutes * 60 * 1000;
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = totalMs - elapsed;
    timerDisplay.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(timerId);
      showResults();
    }
  }, 1000);
}

function buildQuestionNav() {
  questionNav.innerHTML = "";
  testState.questions.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.textContent = index + 1;
    btn.dataset.index = index;
    btn.addEventListener("click", () => {
      testState.currentIndex = index;
      renderQuestion();
    });
    questionNav.appendChild(btn);
  });
}

function showResults() {
  if (timerId) clearInterval(timerId);
  const correct = testState.questions.filter((q) => q.selected === q.correctIndex).length;
  scoreEl.textContent = `${correct}/${testState.questions.length}`;
  accuracyEl.textContent = `${Math.round((correct / testState.questions.length) * 100)}%`;
  timeTakenEl.textContent = formatTime(Date.now() - startTime);

  reviewEl.innerHTML = testState.questions
    .map((q, i) => {
      const status = q.selected === q.correctIndex ? "Correct" : "Wrong";
      return `
        <div class="review-item">
          <strong>Q${i + 1}</strong> - ${status} (Correct: ${optionLabel(q.correctIndex)})
        </div>
      `;
    })
    .join("");

  showPanel(resultPanel);
}

function startTest(test) {
  testState = {
    ...test,
    currentIndex: 0,
  };
  buildQuestionNav();
  renderQuestion();
  updateProgress();
  startTimer();
  showPanel(testPanel);
}

function handleGenerate() {
  const difficulty = difficultySelect.value;
  const count = Number(questionCountSelect.value);
  const seed = hashSeed(seedInput.value.trim());
  const rng = createRng(seed);
  const questions = buildTest(rng, difficulty, count);
  startTest({
    questions,
    seed,
    difficulty,
    createdAt: new Date().toISOString(),
  });
}

function handleExportPdf() {
  if (!testState) return;
  const html = buildPrintHtml(testState);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function handleExportJson() {
  if (!testState) return;
  exportTest(testState);
}

function handleImportJson(file) {
  importTest(file)
    .then((data) => {
      if (!data.questions) return;
      startTest(data);
    })
    .catch(() => {
      alert("Invalid JSON file.");
    });
}

function buildPrintHtml(test) {
  const styles = `
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 18px; }
    .question { border: 1px solid #000; padding: 12px; margin-bottom: 16px; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .cell { min-width: 120px; }
    .options { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .label { font-weight: bold; margin-top: 6px; }
  `;
  const questionsHtml = test.questions
    .map((question, index) => {
      const sequence = buildSequence(question);
      const punch = buildHolePunch(question);
      const options = buildOptions(question);
      return `
        <div class="question">
          <div class="label">Q${index + 1}</div>
          <div class="row">
            <div class="cell">
              <div>Section A</div>
              ${sequence}
            </div>
            <div class="cell">
              <div>Section B</div>
              ${punch}
            </div>
          </div>
          <div class="label">Section C - Options</div>
          <div class="options">${options}</div>
        </div>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <title>Paper Folding Test</title>
        <style>${styles}</style>
      </head>
      <body>
        <h1>Paper Folding Aptitude Test</h1>
        <div class="meta">Difficulty: ${test.difficulty} | Questions: ${test.questions.length}</div>
        ${questionsHtml}
      </body>
    </html>
  `;
}

function handleNavigation(direction) {
  if (direction === "next" && testState.currentIndex < testState.questions.length - 1) {
    testState.currentIndex += 1;
  }
  if (direction === "prev" && testState.currentIndex > 0) {
    testState.currentIndex -= 1;
  }
  renderQuestion();
}

randomSeedBtn.addEventListener("click", () => {
  seedInput.value = Math.random().toString(36).slice(2, 10);
});

generateBtn.addEventListener("click", handleGenerate);
prevBtn.addEventListener("click", () => handleNavigation("prev"));
nextBtn.addEventListener("click", () => {
  if (testState.currentIndex === testState.questions.length - 1) {
    showResults();
  } else {
    handleNavigation("next");
  }
});

exportJsonBtn.addEventListener("click", handleExportJson);
exportPdfBtn.addEventListener("click", handleExportPdf);
importJsonInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) handleImportJson(file);
});

restartBtn.addEventListener("click", () => showPanel(homePanel));

showPanel(homePanel);
