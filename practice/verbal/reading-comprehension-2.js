const rcPassage = `
<p>The ancient library had survived countless centuries, its weathered stones bearing witness to the rise and fall of civilizations. Scholars from across the world traveled great distances to access its vast collection of manuscripts and scrolls. Yet, the head librarian maintained a peculiar tradition: she refused to digitize the collection, arguing that the tactile experience of handling aged parchment connected readers to history in a way that screens could never replicate. Some criticized her stance as impractical, but visitors often found themselves transformed by the ritual of gently turning the pages of documents that had survived empires.</p>
`;

const synqQuestions = [
  {
    prompt: "What can we infer about the librarian's views on technology?",
    options: [
      "She believes technology is superior to traditional methods",
      "She values the human connection to history over convenience",
      "She is afraid of change and unable to adapt",
      "She thinks digitization is too expensive for the library"
    ],
    answer: 1,
    difficulty: "Easy",
    timeLimit: 21,
  },
  {
    prompt: "What is the author's tone toward the librarian's decision?",
    options: [
      "Disapproving and mocking",
      "Neutral and factual",
      "Respectful and somewhat admiring",
      "Impatient and frustrated"
    ],
    answer: 2,
    difficulty: "Easy",
    timeLimit: 20,
  },
  {
    prompt: "Why do visitors find themselves 'transformed' by the experience?",
    options: [
      "The manuscripts are valuable and expensive",
      "The library building is architecturally stunning",
      "The direct contact with historical documents creates a meaningful connection to the past",
      "The head librarian gives them personalized tours"
    ],
    answer: 2,
    difficulty: "Easy",
    timeLimit: 21,
  },
  {
    prompt: "How does the passage characterize the criticism of the librarian's stance?",
    options: [
      "As entirely justified and valid",
      "As coming from people who understand the value of tradition",
      "As being based on practicality rather than appreciation for history",
      "As equally important as supporting her decision"
    ],
    answer: 2,
    difficulty: "Easy",
    timeLimit: 20,
  },
  {
    prompt: "What does 'bearing witness to the rise and fall of civilizations' suggest?",
    options: [
      "The library has been destroyed many times",
      "The library's age and lasting presence through historical changes",
      "Only ancient civilizations used libraries",
      "The library is crumbling and in danger"
    ],
    answer: 1,
    difficulty: "Easy",
    timeLimit: 20,
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
const rcPassageContainer = document.getElementById("rc-passage-container");

function downloadSynqQuestionsPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF service is not available right now. Please refresh and try again.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const heading = document.querySelector(".synq-head h1")?.textContent?.trim() || "Reading Comprehension";
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
  doc.text(heading + " - Questions", marginX, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Total Questions: " + synqQuestions.length, marginX, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Passage:", marginX, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const passageLines = doc.splitTextToSize(rcPassage.replace(/<[^>]*>/g, ""), lineWidth);
  doc.text(passageLines, marginX, y);
  y += passageLines.length * 13 + 12;

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
    if (row.total === 0) return;
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + labels[key] + "</td>" +
      "<td>" + row.attempted + "</td>" +
      "<td>" + row.right + "</td>" +
      "<td>" + row.wrong + "</td>" +
      "<td>" + row.notAttempted + "</td>";
    synqReportBody.appendChild(tr);
  });
}

function renderSynqNav() {
  synqGrid.innerHTML = "";
  const filtered = synqNavOrder.filter((idx) => {
    if (synqActiveFilter === "all") return true;
    const difficulty = (synqQuestions[idx].difficulty || "easy").toLowerCase();
    return difficulty === synqActiveFilter;
  });

  filtered.forEach((idx) => {
    const btn = document.createElement("button");
    const answer = synqAnswers[idx];
    let className = "synq-qnum unattempted";

    if (answer === -1 || answer === null) {
      className = "synq-qnum unattempted";
    } else if (answer === synqQuestions[idx].answer) {
      className = "synq-qnum correct";
    } else {
      className = "synq-qnum wrong";
    }

    btn.className = className + (idx === synqCurrent ? " current" : "");
    btn.textContent = idx + 1;
    btn.type = "button";
    btn.addEventListener("click", () => {
      synqCurrent = idx;
      renderSynqQuestion();
      renderSynqNav();
    });

    synqGrid.appendChild(btn);
  });
}

function renderSynqStatus() {
  const totalAttempted = synqAnswers.filter((a) => a !== null).length;
  const totalCorrect = synqAnswers.filter((a, idx) => a === synqQuestions[idx].answer).length;
  synqStatus.textContent = "Attempted: " + totalAttempted + "/" + synqQuestions.length + " | Correct: " + totalCorrect;
}

function renderSynqQuestion() {
  const question = synqQuestions[synqCurrent];

  synqQuestionText.textContent = question.prompt;
  synqDifficulty.textContent = "Difficulty: " + question.difficulty;
  rcPassageContainer.innerHTML = rcPassage;
  synqOptions.innerHTML = "";

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "synq-option";
    btn.type = "button";
    btn.textContent = option;

    if (synqAnswers[synqCurrent] === index) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      synqAnswers[synqCurrent] = index;
      renderSynqQuestion();
      renderSynqStatus();
      renderSynqNav();

      if (isSynqQuizComplete()) {
        stopSynqTimer();
        setTimeout(finishSynqQuiz, 500);
      } else {
        if (synqCurrent < synqQuestions.length - 1) {
          synqCurrent += 1;
          renderSynqQuestion();
          renderSynqNav();
        }
      }
    });

    synqOptions.appendChild(btn);
  });

  synqPrev.disabled = synqCurrent === 0;
  synqNext.disabled = synqCurrent === synqQuestions.length - 1;

  renderSynqTimer(synqCurrent);
}

function finishSynqQuiz() {
  stopSynqTimer();
  synqQuestionBlock.hidden = true;
  synqControls.hidden = true;
  synqTimer.hidden = true;
  synqStatus.hidden = true;
  synqNav.hidden = true;
  renderSynqReport();
  synqReport.hidden = false;
}

synqPrev.addEventListener("click", () => {
  if (synqCurrent > 0) {
    synqCurrent -= 1;
    renderSynqQuestion();
    renderSynqNav();
  }
});

synqNext.addEventListener("click", () => {
  if (synqCurrent < synqQuestions.length - 1) {
    synqCurrent += 1;
    renderSynqQuestion();
    renderSynqNav();
  }
});

synqStartBtn.addEventListener("click", () => {
  synqQuizStarted = true;
  synqStartPanel.hidden = true;
  synqQuestionBlock.hidden = false;
  synqControls.hidden = false;
  synqTimer.hidden = false;
  synqStatus.hidden = false;
  synqNav.hidden = false;
  renderSynqQuestion();
  renderSynqNav();

  synqTimerId = setInterval(() => {
    synqRemaining[synqCurrent] -= 1;
    renderSynqTimer(synqCurrent);

    if (synqRemaining[synqCurrent] <= 0) {
      handleSynqTimeout(synqCurrent);
    }
  }, 1000);
});

synqFilterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    synqFilterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    synqActiveFilter = btn.dataset.filter;
    renderSynqNav();
  });
});

if (synqDownloadPdfBtn) {
  synqDownloadPdfBtn.addEventListener("click", downloadSynqQuestionsPdf);
}
