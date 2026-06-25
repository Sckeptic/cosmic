/**
 * signal.js — Signal Lost
 * Fake phone calling interface with glitch effects.
 */

import { shared } from './script.js';

export function init() {
  const phone      = document.getElementById('phone-ui');
  const callStatus = document.getElementById('call-status');
  const callTimer  = document.getElementById('call-timer');
  const retryBtn   = document.getElementById('retry-btn');
  const glitchOv   = document.getElementById('glitch-overlay');
  const scanlines  = document.getElementById('scanlines');

  if (!phone) return;

  let timerInterval  = null;
  let glitchTimeout  = null;
  let elapsedSeconds = 0;
  let callActive     = false;
  let hasFailed      = false;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function startCall() {
    hasFailed = false;
    callActive = true;
    elapsedSeconds = 0;

    callStatus.textContent = 'Calling…';
    callStatus.style.color = '';
    callTimer.textContent  = '0:00';
    callTimer.style.display = 'block';

    // Remove failed state
    const failedEl = phone.querySelector('.call-failed-text');
    if (failedEl) failedEl.remove();
    phone.classList.remove('chromatic');
    glitchOv.classList.remove('active');
    scanlines.classList.remove('active');

    // Start timer
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!callActive) return;
      elapsedSeconds++;
      callTimer.textContent = formatTime(elapsedSeconds);
    }, 1000);

    // Random glitch delay 2500–3500 ms
    const delay = 2500 + Math.random() * 1000;
    clearTimeout(glitchTimeout);
    glitchTimeout = setTimeout(() => triggerFailure(), delay);
  }

  function triggerFailure() {
    callActive = false;
    clearInterval(timerInterval);

    // Shake
    phone.classList.remove('shaking');
    void phone.offsetWidth;
    phone.classList.add('shaking');
    setTimeout(() => phone.classList.remove('shaking'), 600);

    // Glitch overlay
    glitchOv.style.background = randomGlitchColor();
    glitchOv.classList.add('active');
    scanlines.classList.add('active');

    // Chromatic aberration
    setTimeout(() => {
      phone.classList.add('chromatic');
    }, 80);

    // Static shimmer phase
    let shimmers = 0;
    const shimmerInterval = setInterval(() => {
      glitchOv.style.background = randomGlitchColor();
      shimmers++;
      if (shimmers > 10) {
        clearInterval(shimmerInterval);
        showFailed();
      }
    }, 60 + Math.random() * 40);
  }

  function randomGlitchColor() {
    const colors = [
      'rgba(255,52,102,0.15)',
      'rgba(79,142,247,0.12)',
      'rgba(255,255,255,0.05)',
      'rgba(0,0,0,0.3)',
    ];
    const hPos = Math.random() * 80 + 10;
    return `linear-gradient(rgba(0,0,0,0) 0%, ${colors[Math.floor(Math.random() * colors.length)]} ${hPos}%, rgba(0,0,0,0) 100%)`;
  }

  function showFailed() {
    hasFailed = true;
    phone.classList.remove('chromatic');
    glitchOv.classList.remove('active');
    scanlines.classList.remove('active');

    callStatus.textContent = 'Call Failed';
    callStatus.style.color = 'var(--glitch-red)';

    // Timer shows last time then fades
    callTimer.style.opacity = '0.4';

    // Insert failed text
    const existing = phone.querySelector('.call-failed-text');
    if (!existing) {
      const failEl = document.createElement('div');
      failEl.className = 'call-failed-text';
      failEl.textContent = 'Call Failed';
      failEl.style.animation = 'fade-in-up 0.5s ease forwards';
      callTimer.insertAdjacentElement('afterend', failEl);
    }

    // Reset opacity after a beat
    setTimeout(() => {
      callTimer.style.opacity = '';
    }, 1200);
  }

  retryBtn.addEventListener('click', () => {
    callTimer.style.opacity = '';
    startCall();
  });

  retryBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      retryBtn.click();
    }
  });

  // Auto-start when section is visible
  const section = document.getElementById('signal');
  if (section) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !callActive && !hasFailed) {
        startCall();
      }
    }, { threshold: 0.3 });
    obs.observe(section);
  } else {
    startCall();
  }
}
