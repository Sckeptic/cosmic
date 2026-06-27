/* reasons.js — "Reasons I Love You" page */

const REASONS = [
  { emoji: '✨', text: 'You are simple — no drama, no games, just real.' },
  { emoji: '🤍', text: 'Your kindness is quiet but it reaches everywhere.' },
  { emoji: '🐻', text: 'You always support Bholu, no matter what.' },
  { emoji: '💬', text: 'You share everything on your mind — and that takes courage.' },
  { emoji: '🌙', text: 'You say what you feel instead of hiding it.' },
  { emoji: '🌍', text: 'The way you see the world is universal — every girl wishes she thought like you.' },
  { emoji: '💫', text: 'You make ordinary moments feel like they matter.' },
  { emoji: '🌸', text: 'Your presence calms every storm inside me.' },
  { emoji: '🔥', text: 'You are honest even when it is hard. That is rare.' },
  { emoji: '🫀', text: 'You love with your whole heart, not just words.' },
  { emoji: '🌟', text: 'You carry yourself with a grace that most people never learn.' },
  { emoji: '☕', text: 'Even the small things you do feel like home.' },
];

let _revealed = 0;
let _started  = false;

function buildCards() {
  const grid = document.getElementById('reasons-grid');
  if (!grid) return;
  grid.innerHTML = '';
  REASONS.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'reason-card reason-hidden';
    card.dataset.idx = i;
    card.innerHTML = `
      <span class="reason-emoji" aria-hidden="true">${r.emoji}</span>
      <p class="reason-text">${r.text}</p>
    `;
    grid.appendChild(card);
  });
}

function revealNext() {
  const cards = document.querySelectorAll('.reason-card.reason-hidden');
  if (!cards.length) return;
  const card = cards[0];
  card.classList.remove('reason-hidden');
  card.classList.add('reason-visible');
  _revealed++;
}

function revealAll() {
  document.querySelectorAll('.reason-card.reason-hidden').forEach(c => {
    c.classList.remove('reason-hidden');
    c.classList.add('reason-visible');
  });
  _revealed = REASONS.length;
}

function startReveal() {
  if (_started) return;
  _started = true;
  let i = 0;
  function step() {
    if (i < REASONS.length) {
      revealNext();
      i++;
      setTimeout(step, 320);
    }
  }
  setTimeout(step, 400);
}

export function init(shared) {
  buildCards();

  const btn = document.getElementById('reasons-reveal-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (_revealed < REASONS.length) {
        revealAll();
      }
    });
  }
}

export function onEnter() {
  _revealed = 0;
  _started  = false;
  document.querySelectorAll('.reason-card').forEach(c => {
    c.classList.add('reason-hidden');
    c.classList.remove('reason-visible');
  });
  startReveal();
}
