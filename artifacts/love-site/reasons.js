/* reasons.js — "Reasons I Love You" page */

const REASONS = [
  { emoji: '✨', text: 'Aap kindness dikhate nahi. Aap bas hote hi hain woh — bina awaaz ke, bina kisi ki notice ki zaroorat ke.' },
  { emoji: '🤍', text: 'Aap doosron ke liye space rakhte ho, tab bhi jab aapko khud sahare ki zaroorat hoti hai.' },
  { emoji: '🐻', text: 'Bholu ke liye aapka pyaar — yeh gentleness andar se aati hai. Aisi cheez kahi se nahi milti.' },
  { emoji: '💬', text: 'Aap woh kehte ho jo sach mein dil mein hota hai. Aadhe-sacch ki is duniya mein yeh sab kuch hai.' },
  { emoji: '🌙', text: 'Aap dikhave aur shor ke paar dekh lete ho. Seedha asli cheez tak pahunch jaate ho.' },
  { emoji: '🌍', text: 'Aapke sochne ka andaz kuch aisa hai — jaise har ladki ko aisi hi sochni chahiye.' },
  { emoji: '💫', text: 'Aap aam cheezein bhi khaas bana dete ho. Aapke saath baat kabhi chhoti nahi lagti.' },
  { emoji: '🌸', text: 'Aapki maujoodgi kuch maangti nahi. Bas sab kuch shant kar deti hai.' },
  { emoji: '🔥', text: 'Aap sach bolte ho chahe woh uncomfortable ho. Iske liye jitni himmat chahiye — log samjhte nahi.' },
  { emoji: '🫀', text: 'Jab aap kisi cheez se pyaar karte ho, toh sach mein karte ho. Koi dikhawa nahi. Koi shart nahi.' },
  { emoji: '🌟', text: 'Aapka apne aap ko sambhalna — us mein ek woh khamoshi hai jo zyaadatar log poori zindagi dhundhte rehte hain.' },
  { emoji: '☕', text: 'Aap jo chhoti-chhoti cheezein karte ho, woh ghar jaisi lagti hain. Aur main yeh kaafi waqt se dhundh raha tha.' },
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
