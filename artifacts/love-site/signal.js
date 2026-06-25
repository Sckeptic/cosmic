/* signal.js — Fake phone call with glitch effects */
export function init(shared) {
  const phone    = document.getElementById('phone-ui');
  const glow     = document.getElementById('phone-glow');
  const status   = document.getElementById('call-status');
  const timer    = document.getElementById('call-timer');
  const glitchEl = document.getElementById('glitch-overlay');
  const scanEl   = document.getElementById('scanlines');
  const retryBtn = document.getElementById('retry-btn');
  if (!phone) return;

  let elapsed = 0;
  let tickId  = null;
  let glitchTimeout = null;
  let started = false;
  let failed  = false;

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  }

  function triggerGlitch() {
    if (failed) return;
    failed = true;

    /* 1. Shake */
    phone.classList.add('shaking');
    phone.classList.add('chromatic');
    phone.style.borderColor = 'rgba(255,52,102,0.4)';

    /* 2. Glitch overlay */
    glitchEl.classList.add('active');
    scanEl.classList.add('active');

    /* 3. Random horizontal slices */
    let sliceId = setInterval(() => {
      phone.style.transform = `translateX(${(Math.random() - 0.5) * 8}px) skewX(${(Math.random() - 0.5) * 1.5}deg)`;
    }, 40);

    /* 4. Status text change */
    setTimeout(() => {
      status.textContent = 'Call Failed';
      status.classList.add('failed');
      glow?.classList.add('failed');
    }, 200);

    /* 5. Freeze timer */
    clearInterval(tickId);

    /* 6. Stop everything */
    setTimeout(() => {
      clearInterval(sliceId);
      phone.style.transform = '';
      phone.classList.remove('shaking', 'chromatic');
      phone.style.borderColor = '';
    }, 600);

    /* 7. Glitch fades */
    setTimeout(() => {
      glitchEl.classList.remove('active');
      scanEl.classList.remove('active');
    }, 1200);
  }

  function startCall() {
    if (started) return;
    started = true;
    failed  = false;
    elapsed = 0;
    timer.textContent = '0:00';
    status.textContent = 'Calling…';
    status.classList.remove('failed');
    glow?.classList.remove('failed');
    phone.style.borderColor = '';

    tickId = setInterval(() => {
      elapsed++;
      timer.textContent = fmt(elapsed);
    }, 1000);

    /* Glitch fires at a random time between 2.5s and 4s */
    const delay = 2500 + Math.random() * 1500;
    glitchTimeout = setTimeout(triggerGlitch, delay);
  }

  function resetCall() {
    clearInterval(tickId);
    clearTimeout(glitchTimeout);
    started = false;
    failed  = false;
    elapsed = 0;
    status.textContent = 'Calling…';
    status.classList.remove('failed');
    glow?.classList.remove('failed');
    timer.textContent  = '0:00';
    phone.classList.remove('shaking', 'chromatic');
    glitchEl.classList.remove('active');
    scanEl.classList.remove('active');

    setTimeout(startCall, 600);
  }

  retryBtn?.addEventListener('click', resetCall);

  /* Auto-start when section enters viewport */
  const section = document.getElementById('signal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !started) startCall();
    });
  }, { threshold: 0.3 });
  if (section) obs.observe(section);
}
