// ─── OLQ DATA ───
const olqData = [
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

// ─── BUILD WHEEL ───
function buildOLQWheel() {
  const container = document.getElementById('olq-nodes-container');
  if (!container) return;

  olqData.forEach((item, index) => {
    const node = document.createElement('div');
    node.className = 'olq-node';
    node.dataset.index = index;
    node.innerHTML = `
      <div class="olq-node-inner">
        <span class="olq-node-icon">${item.icon}</span>
        <span class="olq-node-label">${item.short}</span>
      </div>
    `;
    
    node.addEventListener('click', () => showOLQDetail(index));
    container.appendChild(node);
  });

  // Position nodes after they're in the DOM
  setTimeout(positionOLQNodes, 0);
}

function isMobileOLQLayout() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function positionOLQNodes() {
  const container = document.getElementById('olq-nodes-container');
  const wheelContainer = document.querySelector('.olq-wheel-container');
  if (!container || !wheelContainer) return;

  const nodes = container.querySelectorAll('.olq-node');

  if (isMobileOLQLayout()) {
    nodes.forEach((node) => {
      node.style.left = '';
      node.style.top = '';
    });
    return;
  }

  const containerWidth = wheelContainer.offsetWidth;
  const containerHeight = wheelContainer.offsetHeight;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const radius = Math.min(containerWidth, containerHeight) * 0.32;
  const totalItems = olqData.length;

  nodes.forEach((node, index) => {
    const angle = (index / totalItems) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  });
}

// Reposition on window resize
window.addEventListener('resize', positionOLQNodes);

// ─── SHOW DETAIL ───
function showOLQDetail(idx) {
  if (!olqData[idx]) return;

  const modal = document.getElementById('olq-modal');
  const modalNumber = document.getElementById('olq-modal-number');
  const modalTitle = document.getElementById('olq-modal-title');
  const modalDesc = document.getElementById('olq-modal-desc');
  const modalTags = document.getElementById('olq-modal-tags');
  const modalLink = document.getElementById('olq-modal-link');

  const item = olqData[idx];
  
  if (modalNumber) modalNumber.textContent = String(item.id).padStart(2, '0');
  if (modalTitle) modalTitle.textContent = item.name;
  if (modalDesc) modalDesc.textContent = item.desc;
  if (modalTags) modalTags.innerHTML = item.tags.map(t => `<span class="detail-tag">${t}</span>`).join('');
  if (modalLink) modalLink.setAttribute('href', item.link);
  
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

// ─── CLOSE DETAIL ───
function closeOLQModal() {
  const modal = document.getElementById('olq-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// ─── MODAL EVENTS ───
document.addEventListener('DOMContentLoaded', () => {
  buildOLQWheel();

  const modalClose = document.querySelector('.olq-modal-close');
  const modal = document.getElementById('olq-modal');

  if (modalClose) {
    modalClose.addEventListener('click', closeOLQModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeOLQModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOLQModal();
    }
  });
});
