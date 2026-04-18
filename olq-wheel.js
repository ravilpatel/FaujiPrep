// ─── DATA ───
const qualities = [
  { id: 1, icon: '⚡', name: 'Effective Intelligence', short: 'Intelligence', desc: 'The ability to understand rapidly, reason logically, and draw sound conclusions from available data — under pressure and without the luxury of time. Goes far beyond theoretical knowledge into applied, situational wisdom.', tags: ['Cognitive', 'Practical', 'Analytical'], link: 'opam/olq-effective-intelligence.html' },
  { id: 2, icon: '🧠', name: 'Reasoning Ability', short: 'Reasoning', desc: 'Systematic thinking that identifies patterns, causes, and solutions. An officer must diagnose problems correctly before acting — incomplete reasoning leads to catastrophic decisions.', tags: ['Logic', 'Critical Thinking', 'Problem Solving'], link: 'opam/olq-reasoning-ability.html' },
  { id: 3, icon: '🎯', name: 'Organising Ability', short: 'Organise', desc: 'The capacity to plan, delegate, prioritise, and coordinate resources and personnel efficiently towards a defined objective — even as conditions change.', tags: ['Planning', 'Execution', 'Systems'], link: 'opam/olq-organizing-ability.html' },
  { id: 4, icon: '🗣️', name: 'Power of Expression', short: 'Expression', desc: 'Communication that commands attention, inspires action, and transmits intent with precision. The officer who cannot express clearly cannot lead effectively — neither in briefing rooms nor on battlefields.', tags: ['Communication', 'Clarity', 'Persuasion'], link: 'opam/olq-power-of-expression.html' },
  { id: 5, icon: '🌐', name: 'Social Adaptability', short: 'Adaptable', desc: 'The ease with which an individual adjusts to new people, environments, and cultures — remaining effective, approachable, and influential across diverse teams and contexts.', tags: ['Empathy', 'Flexibility', 'Interpersonal'], link: 'opam/olq-social-adaptability.html' },
  { id: 6, icon: '🤝', name: 'Cooperation', short: 'Teamwork', desc: 'Not merely following orders, but actively contributing to collective success — subordinating personal ambition to the mission, and elevating the performance of all around them.', tags: ['Unity', 'Collaboration', 'Subordination'], link: 'opam/olq-cooperation.html' },
  { id: 7, icon: '⚖️', name: 'Sense of Responsibility', short: 'Responsibility', desc: 'Ownership of outcomes — positive and negative. The officer who deflects blame and claims only credit has no place in command. Accountability is the currency of trust.', tags: ['Integrity', 'Accountability', 'Ownership'], link: 'opam/olq-sense-of-responsibility.html' },
  { id: 8, icon: '💡', name: 'Initiative', short: 'Initiative', desc: 'The courage to act in the absence of orders — to identify what must be done and do it without waiting to be told. Initiative bridges the gap between plans and reality.', tags: ['Proactive', 'Leadership', 'Self-start'], link: 'opam/olq-initiative.html' },
  { id: 9, icon: '🦁', name: 'Self-Confidence', short: 'Confidence', desc: 'Quiet, grounded belief in one\'s own judgement — not arrogance. The officer who doubts themselves at the critical moment transfers that doubt to those they command.', tags: ['Mindset', 'Resolve', 'Conviction'], link: 'opam/olq-self-confidence.html' },
  { id: 10, icon: '⚔️', name: 'Speed of Decision', short: 'Decision', desc: 'In combat and crisis, delay is fatal. The ability to assess, decide, and commit with speed — accepting that an imperfect decision now beats a perfect one too late.', tags: ['Agility', 'Judgment', 'Urgency'], link: 'opam/olq-speed-of-decision.html' },
  { id: 11, icon: '👑', name: 'Ability to Influence', short: 'Influence', desc: 'The magnetic quality that makes others follow — not from obligation but from genuine respect and trust. Built through consistent character, not status or authority alone.', tags: ['Charisma', 'Authority', 'Inspiration'], link: 'opam/olq-ability-to-influence-group.html' },
  { id: 12, icon: '🔥', name: 'Liveliness', short: 'Liveliness', desc: 'Enthusiasm, energy, and a spirit that uplifts the morale of an entire unit. An officer\'s disposition is contagious — liveliness under hardship is a force-multiplier.', tags: ['Energy', 'Morale', 'Vitality'], link: 'opam/olq-liveliness.html' },
  { id: 13, icon: '🏔️', name: 'Determination', short: 'Determined', desc: 'Iron will that persists through setback, failure, and fatigue. The determined officer sees not walls but challenges — and through sheer persistence, finds a way.', tags: ['Grit', 'Persistence', 'Will'], link: 'opam/olq-determination.html' },
  { id: 14, icon: '🛡️', name: 'Courage', short: 'Courage', desc: 'Not the absence of fear, but the mastery of it. Physical courage on the field, and moral courage in the boardroom — both are indispensable to true leadership.', tags: ['Bravery', 'Risk', 'Valor'], link: 'opam/olq-courage.html' },
  { id: 15, icon: '💪', name: 'Stamina', short: 'Stamina', desc: 'Physical and mental endurance that allows the officer to outlast adversity — to remain functional, composed, and effective long after others have exhausted their resources.', tags: ['Endurance', 'Fitness', 'Resilience'], link: 'opam/olq-stamina.html' },
];

// ─── WHEEL ───
const wc = document.getElementById('wheelContainer');

if (wc) {
  qualities.forEach((q, i) => {
    const node = document.createElement('div');
    node.className = 'quality-node';
    node.dataset.id = i;
    node.style.cssText = 'transform: translate(-50%, -50%); animation: wheelSpin 120s linear infinite reverse;';
    node.innerHTML = `
      <div class="quality-node-inner">
        <span class="node-icon">${q.icon}</span>
        <span class="node-label">${q.short}</span>
      </div>
    `;
    node.addEventListener('click', () => showDetail(i));
    wc.appendChild(node);
  });
}

function showDetail(idx) {
  const nodes = document.querySelectorAll('.quality-node');
  const modal = document.getElementById('olq-modal');
  const modalNumber = document.getElementById('olq-modal-number');
  const modalTitle = document.getElementById('olq-modal-title');
  const modalDesc = document.getElementById('olq-modal-desc');
  const modalTags = document.getElementById('olq-modal-tags');
  const modalLink = document.getElementById('olq-modal-link');

  if (!nodes.length || !modal || !modalNumber || !modalTitle || !modalDesc || !modalTags || !modalLink || !qualities[idx]) {
    return;
  }

  nodes.forEach(n => n.classList.remove('active'));
  nodes[idx].classList.add('active');
  const q = qualities[idx];

  modalNumber.textContent = String(q.id).padStart(2, '0');
  modalTitle.textContent = q.name;
  modalDesc.textContent = q.desc;
  modalTags.innerHTML = q.tags.map(t => `<span class="detail-tag">${t}</span>`).join('');
  modalLink.setAttribute('href', q.link || 'opam/olqs.html');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeOlqModal() {
  const modal = document.getElementById('olq-modal');
  if (!modal) {
    return;
  }
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

// ─── RESPONSIVE WHEEL ───
function resizeWheel() {
  const wheel = document.getElementById('wheelContainer');
  if (!wheel) {
    return;
  }

  const nodes = document.querySelectorAll('.quality-node');
  const isMobile = window.innerWidth <= 900;

  if (isMobile) {
    nodes.forEach((node) => {
      node.style.left = '';
      node.style.top = '';
      node.style.transform = '';
      node.style.animation = '';
    });
    return;
  }

  const width = wheel.offsetWidth;
  const height = wheel.offsetHeight;
  const cxR = width / 2;
  const cyR = height / 2;
  const rad = Math.min(width, height) * 0.35;

  nodes.forEach((node, i) => {
    const angle = (i / qualities.length) * Math.PI * 2 - Math.PI / 2;
    const xR = cxR + Math.cos(angle) * rad;
    const yR = cyR + Math.sin(angle) * rad;
    node.style.left = `${xR}px`;
    node.style.top = `${yR}px`;
    node.style.transform = 'translate(-50%, -50%)';
    node.style.animation = 'wheelSpin 120s linear infinite reverse';
  });
}

window.addEventListener('resize', resizeWheel);
resizeWheel();

const modal = document.getElementById('olq-modal');
const modalClose = document.querySelector('.olq-modal-close');

if (modalClose) {
  modalClose.addEventListener('click', closeOlqModal);
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeOlqModal();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeOlqModal();
  }
});
