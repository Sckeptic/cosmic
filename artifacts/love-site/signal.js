/* signal.js — Fake phone call with glitch effects */

let _started = false;
let _failed  = false;
let _elapsed = 0;
let _tickId  = null;
let _glitchTimeout = null;

let phone, glow, status, timer, glitchEl, scanEl, retryBtn;

function fmt(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function triggerGlitch() {
  if (_failed) return;
  _failed = true;

  phone.classList.add('shaking');
  phone.classList.add('chromatic');
  phone.style.borderColor = 'rgba(255,52,102,0.4)';
  glitchEl.classList.add('active');
  scanEl.classList.add('active');

  let sliceId = setInterval(() => {
    phone.style.transform = `translateX(${(Math.random() - 0.5) * 8}px) skewX(${(Math.random() - 0.5) * 1.5}deg)`;
  }, 40);

  setTimeout(() => {
    status.textContent = 'Call Failed';
    status.classList.add('failed');
    glow?.classList.add('failed');
  }, 200);

  clearInterval(_tickId);

  setTimeout(() => {
    clearInterval(sliceId);
    phone.style.transform = '';
    phone.classList.remove('shaking', 'chromatic');
    phone.style.borderColor = '';
  }, 600);

  setTimeout(() => {
    glitchEl.classList.remove('active');
    scanEl.classList.remove('active');
  }, 1200);
}

function startCall() {
  if (_started) return;
  _started = true;
  _failed  = false;
  _elapsed = 0;
  if (timer) timer.textContent = '0:00';
  if (status) {
    status.textContent = 'Calling…';
    status.classList.remove('failed');
  }
  glow?.classList.remove('failed');
  if (phone) phone.style.borderColor = '';

  _tickId = setInterval(() => {
    _elapsed++;
    if (timer) timer.textContent = fmt(_elapsed);
  }, 1000);

  const delay = 2500 + Math.random() * 1500;
  _glitchTimeout = setTimeout(triggerGlitch, delay);
}

function resetCall() {
  clearInterval(_tickId);
  clearTimeout(_glitchTimeout);
  _started = false;
  _failed  = false;
  _elapsed = 0;
  if (status) { status.textContent = 'Calling…'; status.classList.remove('failed'); }
  glow?.classList.remove('failed');
  if (timer) timer.textContent = '0:00';
  if (phone) {
    phone.classList.remove('shaking', 'chromatic');
    phone.style.transform = '';
    phone.style.borderColor = '';
  }
  glitchEl?.classList.remove('active');
  scanEl?.classList.remove('active');

  setTimeout(startCall, 600);
}

export function init(shared) {
  phone    = document.getElementById('phone-ui');
  glow     = document.getElementById('phone-glow');
  status   = document.getElementById('call-status');
  timer    = document.getElementById('call-timer');
  glitchEl = document.getElementById('glitch-overlay');
  scanEl   = document.getElementById('scanlines');
  retryBtn = document.getElementById('retry-btn');
  if (!phone) return;

  retryBtn?.addEventListener('click', resetCall);
}

export function onEnter() {
  resetCall();
}
