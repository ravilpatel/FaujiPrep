const synqQuestions = [
  {
    prompt: "Choose the synonym of BRIGHT.",
    options: ["Dull", "Luminous", "Opaque", "Pale"],
    answer: 1,
    difficulty: "Easy",
    timeLimit: 16,
  },
  {
    prompt: "Choose the synonym of GENEROUS.",
    options: ["Selfish", "Liberal", "Mean", "Narrow"],
    answer: 1,
    difficulty: "Easy",
    timeLimit: 18,
  },
  {
    prompt: "Choose the synonym of QUICK.",
    options: ["Swift", "Slow", "Steady", "Calm"],
    answer: 0,
    difficulty: "Easy",
    timeLimit: 17,
  },
  {
    prompt: "Choose the synonym of CLEAN.",
    options: ["Dirty", "Neat", "Smudged", "Grimy"],
    answer: 1,
    difficulty: "Easy",
    timeLimit: 17,
  },
  {
    prompt: "Choose the synonym of STRONG.",
    options: ["Weak", "Powerful", "Frail", "Soft"],
    answer: 1,
    difficulty: "Easy",
    timeLimit: 18,
  },
  {
    prompt: "Choose the synonym of RARE.",
    options: ["Common", "Unusual", "Frequent", "Routine"],
    answer: 1,
    difficulty: "Medium",
    timeLimit: 21,
  },
  {
    prompt: "Choose the synonym of VAST.",
    options: ["Tiny", "Narrow", "Immense", "Low"],
    answer: 2,
    difficulty: "Medium",
    timeLimit: 21,
  },
  {
    prompt: "Choose the synonym of MATURE.",
    options: ["Juvenile", "Adult", "Raw", "Immature"],
    answer: 1,
    difficulty: "Medium",
    timeLimit: 20,
  },
  {
    prompt: "Choose the synonym of ESSENTIAL.",
    options: ["Optional", "Trivial", "Vital", "Secondary"],
    answer: 2,
    difficulty: "Medium",
    timeLimit: 22,
  },
  {
    prompt: "Choose the synonym of INTEGRITY.",
    options: ["Corruption", "Honesty", "Weakness", "Bias"],
    answer: 1,
    difficulty: "Hard",
    timeLimit: 27,
  },
];

const synqAnswers = Array(synqQuestions.length).fill(null);
const synqRemaining = synqQuestions.map((q) => q.timeLimit || 20);
let synqCurrent = 0;
let synqActiveFilter = "all";
let synqQuizStarted = false;
let synqTimerId = null;
let synqActiveTimerIndex = null;

const synqDifficultyRank = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const synqNavOrder = synqQuestions
  .map((q, index) => ({
    index,
    rank: synqDifficultyRank[(q.difficulty || "easy").toLowerCase()] || 99,
  }))
  .sort((a, b) => a.rank - b.rank || a.index - b.index)
  .map((item) => item.index);

const synqQuestionText = document.getElementById("synq-question-text");
const synqDifficulty = document.getElementById("synq-difficulty");
const synqOptions = document.getElementById("synq-options");
const synqGrid = document.getElementById("synq-grid");
const synqStatus = document.getElementById("synq-status");
const synqTimer = document.getElementById("synq-timer");
const synqPrev = document.getElementById("synq-prev");
const synqNext = document.getElementById("synq-next");
const synqStartPanel = document.getElementById("synq-start-panel");
const synqStartBtn = document.getElementById("synq-start-btn");
const synqQuestionBlock = document.getElementById("synq-question-block");
const synqControls = document.getElementById("synq-controls");
const synqNav = document.getElementById("synq-nav");
const synqReport = document.getElementById("synq-report");
const synqReportScore = document.getElementById("synq-report-score");
const synqReportBody = document.getElementById("synq-report-body");
const synqFilterButtons = document.querySelectorAll(".synq-filter-btn");
const synqDownloadPdfBtn = document.getElementById("synq-download-pdf");

function downloadSynqQuestionsPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF service is not available right now. Please refresh and try again.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const heading = document.querySelector(".synq-head h1")?.textContent?.trim() || "Synonyms Quiz";
  const marginX = 40;
  const lineWidth = 515;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 44;

  const ensureSpace = (requiredHeight) => {
    if (y + requiredHeight > pageHeight - 44) {
      doc.addPage();
      y = 44;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(heading + " - Question Bank", marginX, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Total Questions: " + synqQuestions.length, marginX, y);
  y += 20;

  synqQuestions.forEach((q, index) => {
    const qLine = `Q${index + 1}. ${q.prompt}`;
    const qLines = doc.splitTextToSize(qLine, lineWidth);
    const optionLines = q.options.map((opt, i) =>
      doc.splitTextToSize(`${String.fromCharCode(65 + i)}. ${opt}`, lineWidth - 20)
    );
    const answerLine = `Answer: ${String.fromCharCode(65 + q.answer)} | Difficulty: ${q.difficulty}`;
    const answerLines = doc.splitTextToSize(answerLine, lineWidth);

    let blockHeight = qLines.length * 14 + 4;
    optionLines.forEach((lines) => {
      blockHeight += lines.length * 13;
    });
    blockHeight += answerLines.length * 13 + 10;

    ensureSpace(blockHeight);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(qLines, marginX, y);
    y += qLines.length * 14 + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    optionLines.forEach((lines) => {
      doc.text(lines, marginX + 12, y);
      y += lines.length * 13;
    });

    doc.setFont("helvetica", "italic");
    doc.text(answerLines, marginX, y);
    y += answerLines.length * 13 + 10;
  });

  const fileName = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-questions.pdf";
  doc.save(fileName);
}

function formatSynqTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return mins + ":" + secs;
}

function stopSynqTimer() {
  if (synqTimerId) {
    clearInterval(synqTimerId);
    synqTimerId = null;
  }
  synqActiveTimerIndex = null;
}

function renderSynqTimer(index) {
  const remaining = synqRemaining[index];
  synqTimer.classList.remove("warn", "critical");
  if (remaining <= 5) {
    synqTimer.classList.add("critical");
  } else if (remaining <= 10) {
    synqTimer.classList.add("warn");
  }
  synqTimer.textContent = "Time Left: " + formatSynqTime(remaining);
}

function handleSynqTimeout(index) {
  if (synqAnswers[index] === null) {
    synqAnswers[index] = -1;
  }
  synqRemaining[index] = 0;
  renderSynqStatus();
  renderSynqNav();

  if (isSynqQuizComplete()) {
    finishSynqQuiz();
    return;
  }

  if (index < synqQuestions.length - 1) {
    synqCurrent = index + 1;
    renderSynqQuestion();
    renderSynqNav();
    return;
  }

  finishSynqQuiz();
}

function isSynqQuizComplete() {
  return synqAnswers.every((ans) => ans !== null);
}

function getSynqReportData() {
  const breakdown = {
    easy: { total: 0, attempted: 0, right: 0, wrong: 0, notAttempted: 0 },
    medium: { total: 0, attempted: 0, right: 0, wrong: 0, notAttempted: 0 },
    hard: { total: 0, attempted: 0, right: 0, wrong: 0, notAttempted: 0 },
  };

  let totalRight = 0;
  synqQuestions.forEach((q, index) => {
    const level = (q.difficulty || "easy").toLowerCase();
    const bucket = breakdown[level] || breakdown.easy;
    const marked = synqAnswers[index];

    bucket.total += 1;

    if (marked === null) {
      bucket.notAttempted += 1;
      return;
    }

    if (marked === -1) {
      bucket.notAttempted += 1;
      return;
    }

    bucket.attempted += 1;
    if (marked === q.answer) {
      bucket.right += 1;
      totalRight += 1;
    } else {
      bucket.wrong += 1;
    }
  });

  return {
    totalQuestions: synqQuestions.length,
    totalRight,
    breakdown,
  };
}

function renderSynqReport() {
  const data = getSynqReportData();
  synqReportScore.textContent =
    "Score: " + data.totalRight + "/" + data.totalQuestions;

  const difficultyOrder = ["easy", "medium", "hard"];
  const labels = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  };

  synqReportBody.innerHTML = "";
  difficultyOrder.forEach((key) => {
    const row = data.breakdown[key];
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + labels[key] + "</td>" +
      "<td>" + row.attempted + "</td>" +
      "<td>" + row.right + "</td>" +
      "<td>" + row.wrong + "</td>" +
      "<td>" + row.notAttempted + "</td>";
    synqReportBody.appendChild(tr);
  });

  synqReport.hidden = false;
}

function startSynqTimer(index) {
  stopSynqTimer();

  if (!synqQuizStarted || synqAnswers[index] !== null) {
    renderSynqTimer(index);
    return;
  }

  if (synqRemaining[index] <= 0) {
    handleSynqTimeout(index);
    return;
  }

  synqActiveTimerIndex = index;
  renderSynqTimer(index);

  synqTimerId = setInterval(() => {
    if (synqActiveTimerIndex !== index) {
      stopSynqTimer();
      return;
    }

    synqRemaining[index] -= 1;
    renderSynqTimer(index);

    if (synqRemaining[index] <= 0) {
      stopSynqTimer();
      handleSynqTimeout(index);
    }
  }, 1000);
}

function finishSynqQuiz() {
  stopSynqTimer();
  synqQuestionText.textContent = "Quiz Completed";
  synqDifficulty.textContent = "All questions finished.";
  synqDifficulty.classList.remove("easy", "medium", "hard");
  synqOptions.innerHTML =
    '<p class="synq-complete">Time is up or all questions are attempted. Review your answers from the navigator.</p>';
  synqPrev.disabled = true;
  synqNext.disabled = true;
  synqTimer.textContent = "Time Left: 00:00";
  renderSynqReport();
}

function getSynqDifficulty(index) {
  return (synqQuestions[index].difficulty || "easy").toLowerCase();
}

function getFilteredNavOrder() {
  return synqNavOrder.filter((index) => {
    if (synqActiveFilter === "all") {
      return true;
    }
    return getSynqDifficulty(index) === synqActiveFilter;
  });
}

function renderSynqFilterButtons() {
  synqFilterButtons.forEach((btn) => {
    const isActive = btn.dataset.filter === synqActiveFilter;
    btn.classList.toggle("active", isActive);
  });
}

function getSynqState(index) {
  const marked = synqAnswers[index];
  if (marked === null) {
    return "unattempted";
  }
  return marked === synqQuestions[index].answer ? "correct" : "wrong";
}

function renderSynqNav() {
  if (!synqQuizStarted) {
    return;
  }

  synqGrid.innerHTML = "";
  const filteredOrder = getFilteredNavOrder();

  if (!filteredOrder.includes(synqCurrent) && filteredOrder.length > 0) {
    synqCurrent = filteredOrder[0];
    renderSynqQuestion();
  }

  filteredOrder.forEach((index) => {
    const btn = document.createElement("button");
    const state = getSynqState(index);
    btn.type = "button";
    btn.textContent = String(index + 1);
    btn.className = "synq-qnum " + state + (index === synqCurrent ? " current" : "");
    btn.addEventListener("click", () => {
      synqCurrent = index;
      renderSynqQuestion();
      renderSynqNav();
    });
    synqGrid.appendChild(btn);
  });

  renderSynqFilterButtons();
}

function renderSynqQuestion() {
  if (!synqQuizStarted) {
    return;
  }

  const item = synqQuestions[synqCurrent];
  const chosen = synqAnswers[synqCurrent];
  const difficultyLevel = (item.difficulty || "Easy").toLowerCase();

  synqQuestionText.textContent = "Q" + String(synqCurrent + 1) + ". " + item.prompt;
  synqDifficulty.textContent = "Difficulty: " + (item.difficulty || "Easy");
  synqDifficulty.classList.remove("easy", "medium", "hard");
  synqDifficulty.classList.add(difficultyLevel);

  synqOptions.innerHTML = "";
  item.options.forEach((opt, optionIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "synq-option";
    btn.textContent = String.fromCharCode(65 + optionIndex) + ". " + opt;

    if (chosen !== null) {
      btn.disabled = true;
      if (optionIndex === item.answer) {
        btn.classList.add("correct");
      } else if (optionIndex === chosen) {
        btn.classList.add("wrong");
      }
    } else {
      btn.addEventListener("click", () => {
        synqAnswers[synqCurrent] = optionIndex;
        stopSynqTimer();

        if (isSynqQuizComplete()) {
          renderSynqStatus();
          renderSynqNav();
          finishSynqQuiz();
          return;
        }

        renderSynqQuestion();
        renderSynqNav();
        renderSynqStatus();
      });
    }

    synqOptions.appendChild(btn);
  });

  synqPrev.disabled = synqCurrent === 0;
  synqNext.disabled = synqCurrent === synqQuestions.length - 1;
  startSynqTimer(synqCurrent);
}

function renderSynqStatus() {
  const attempted = synqAnswers.filter((ans) => ans !== null).length;
  const correct = synqAnswers.filter(
    (ans, i) => ans !== null && ans === synqQuestions[i].answer
  ).length;
  synqStatus.textContent =
    "Attempted: " + attempted + "/" + synqQuestions.length + " | Correct: " + correct;
}

synqPrev.addEventListener("click", () => {
  if (!synqQuizStarted) {
    return;
  }

  if (synqCurrent > 0) {
    stopSynqTimer();
    synqCurrent -= 1;
    renderSynqQuestion();
    renderSynqNav();
  }
});

synqNext.addEventListener("click", () => {
  if (!synqQuizStarted) {
    return;
  }

  if (synqCurrent < synqQuestions.length - 1) {
    stopSynqTimer();
    synqCurrent += 1;
    renderSynqQuestion();
    renderSynqNav();
  }
});

synqFilterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!synqQuizStarted) {
      return;
    }

    synqActiveFilter = btn.dataset.filter || "all";
    renderSynqNav();
  });
});

if (synqDownloadPdfBtn) {
  synqDownloadPdfBtn.addEventListener("click", downloadSynqQuestionsPdf);
}

synqStartBtn.addEventListener("click", () => {
  if (synqQuizStarted) {
    return;
  }

  synqQuizStarted = true;
  synqStartPanel.hidden = true;
  synqStartPanel.style.display = "none";
  synqStatus.hidden = false;
  synqTimer.hidden = false;
  synqQuestionBlock.hidden = false;
  synqControls.hidden = false;
  synqNav.hidden = false;

  renderSynqStatus();
  renderSynqQuestion();
  renderSynqNav();
});

