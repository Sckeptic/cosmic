/* reasons.js — "Reasons I Love You" page */

const REASONS = [
  { emoji: '✨', text: 'You don\'t perform kindness. You just are it — quietly, without needing anyone to notice.' },
  { emoji: '🤍', text: 'The way you hold space for people, even when you\'re the one who needs holding.' },
  { emoji: '🐻', text: 'The love you have for Bholu. That kind of gentleness doesn\'t come from nowhere.' },
  { emoji: '💬', text: 'You say what\'s actually on your mind. In a world full of half-truths, that\'s everything.' },
  { emoji: '🌙', text: 'You see through the pretense and the noise. You go straight to what\'s real.' },
  { emoji: '🌍', text: 'There\'s something in the way you think that feels universal — like every girl should think like you.' },
  { emoji: '💫', text: 'You make the ordinary feel significant. A conversation with you never feels small.' },
  { emoji: '🌸', text: 'Your presence doesn\'t demand anything. It just makes everything calmer.' },
  { emoji: '🔥', text: 'You tell the truth even when it\'s uncomfortable. That takes more courage than people realize.' },
  { emoji: '🫀', text: 'When you love something, you really love it. No performance. No conditions.' },
  { emoji: '🌟', text: 'The way you carry yourself — there\'s a grace there that most people spend their whole lives looking for.' },
  { emoji: '☕', text: 'Even the small things you do feel like being home. And I\'ve been looking for that for a long time.' },
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
