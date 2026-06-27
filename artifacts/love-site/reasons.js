/* reasons.js — "Reasons I Love You" page */

const REASONS = [
  { emoji: '✨', text: 'Tum kindness karte nahi — tum hote hi ho woh, bina dikhaye.' },
  { emoji: '🤍', text: 'Doosron ke liye space rakhti ho, tab bhi jab tumhe khud zaroorat ho.' },
  { emoji: '🐻', text: 'Bholu ke liye tera pyaar. Yeh gentleness andar se aati hai.' },
  { emoji: '💬', text: 'Jo dil mein hota hai woh kehti ho seedha. Is duniya mein yeh rare hai.' },
  { emoji: '🌙', text: 'Shor aur dikhave ke paar dekh leti ho. Seedha asli tak.' },
  { emoji: '🌍', text: 'Tumhara sochne ka andaz — jaise har ladki ko aisa hi sochna chahiye.' },
  { emoji: '💫', text: 'Aam baatein bhi tumhare saath khaas lagti hain.' },
  { emoji: '🌸', text: 'Tumhari maujoodgi kuch maangti nahi. Bas sab shant ho jaata hai.' },
  { emoji: '🔥', text: 'Uncomfortable sach bhi bol deti ho. Bahut kam log yeh kar paate hain.' },
  { emoji: '🫀', text: 'Jab pyaar karti ho toh sach mein karti ho. Koi act nahi, koi shart nahi.' },
  { emoji: '🌟', text: 'Teri apni ek grace hai jo log poori zindagi dhundhte hain.' },
  { emoji: '☕', text: 'Teri chhoti-chhoti cheezein ghar jaisi lagti hain. Bahut waqt baad mila yeh.' },
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
