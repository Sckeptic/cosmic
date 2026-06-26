/* signal.js — Fake phone call: ringing → calling → glitch fail → auto-retry */

const RING_MS    = 3000;                       // "Ringing…" phase length
const FAIL_MIN   = 10000;                      // earliest the call drops
const FAIL_RANGE = 7000;                       // random range above min
const RETRY_SEC  = 6;                          // seconds before auto-retry

let _started = false;
let _failed  = false;
let _elapsed = 0;
let _tickId        = null;
let _glitchTimeout = null;
let _retryCountId  = null;

let phone, glow, status, timer, glitchEl, scanEl, endBtn, endLabel, endIcon;

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function setStatus(text, failed = false) {
  if (!status) return;
  status.textContent = text;
  status.classList.toggle('failed', failed);
}

function setEndMode(mode) {
  if (!endBtn) return;
  const isRetry = mode === 'retry';
  endBtn.classList.toggle('retry-mode', isRetry);
  if (endLabel) endLabel.textContent = isRetry ? 'Retry' : 'End';
  if (endIcon) {
    endIcon.innerHTML = isRetry
      ? `<path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>`
      : `<path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.37 19.79 19.79 0 01.36 .72 2 2 0 012.34 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11z"/><line x1="23" y1="1" x2="1" y2="23"/>`;
  }
}

function triggerGlitch() {
  if (_failed) return;
  _failed = true;
  clearInterval(_tickId);

  phone.classList.add('shaking', 'chromatic');
  phone.style.borderColor = 'rgba(255,52,102,0.4)';
  glitchEl?.classList.add('active');
  scanEl?.classList.add('active');

  const sliceId = setInterval(() => {
    if (phone) {
      phone.style.transform =
        `translateX(${(Math.random() - 0.5) * 8}px) skewX(${(Math.random() - 0.5) * 1.5}deg)`;
    }
  }, 40);

  setTimeout(() => {
    setStatus('Call Failed', true);
    glow?.classList.add('failed');
    setEndMode('retry');
  }, 220);

  setTimeout(() => {
    clearInterval(sliceId);
    if (phone) {
      phone.style.transform = '';
      phone.classList.remove('shaking', 'chromatic');
      phone.style.borderColor = '';
    }
  }, 650);

  setTimeout(() => {
    glitchEl?.classList.remove('active');
    scanEl?.classList.remove('active');
  }, 1300);

  // Auto-retry countdown
  let count = RETRY_SEC;
  _retryCountId = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(_retryCountId);
      resetCall();
    } else {
      setStatus(`Call Failed — retrying in ${count}…`, true);
    }
  }, 1000);
}

function startCall() {
  if (_started) return;
  _started = true;
  _failed  = false;
  _elapsed = 0;
  if (timer) timer.textContent = '0:00';
  setStatus('Ringing…');
  glow?.classList.remove('failed');
  if (phone) phone.style.borderColor = '';
  setEndMode('end');

  // Ringing → Calling after ring phase
  setTimeout(() => {
    if (!_failed && _started) setStatus('Calling…');
  }, RING_MS);

  // Elapsed timer
  _tickId = setInterval(() => {
    _elapsed++;
    if (timer) timer.textContent = fmt(_elapsed);
  }, 1000);

  // Schedule the drop
  _glitchTimeout = setTimeout(triggerGlitch, FAIL_MIN + Math.random() * FAIL_RANGE);
}

function resetCall() {
  clearInterval(_tickId);
  clearTimeout(_glitchTimeout);
  clearInterval(_retryCountId);
  _started = false;
  _failed  = false;
  _elapsed = 0;
  setStatus('Calling…');
  glow?.classList.remove('failed');
  if (timer) timer.textContent = '0:00';
  if (phone) {
    phone.classList.remove('shaking', 'chromatic');
    phone.style.transform = '';
    phone.style.borderColor = '';
  }
  glitchEl?.classList.remove('active');
  scanEl?.classList.remove('active');
  setEndMode('end');

  setTimeout(startCall, 900);
}

export function init(shared) {
  phone    = document.getElementById('phone-ui');
  glow     = document.getElementById('phone-glow');
  status   = document.getElementById('call-status');
  timer    = document.getElementById('call-timer');
  glitchEl = document.getElementById('glitch-overlay');
  scanEl   = document.getElementById('scanlines');
  endBtn   = document.getElementById('retry-btn');
  endLabel = document.getElementById('call-end-label');
  endIcon  = document.getElementById('end-icon');
  if (!phone) return;

  endBtn?.addEventListener('click', resetCall);

  // Live clock in the status bar
  const clockEl = phone.querySelector('.status-time');
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      clockEl.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    };
    updateClock();
    setInterval(updateClock, 15000);
  }
}

export function onEnter() {
  resetCall();
}
