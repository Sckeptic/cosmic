/* countdown.js — Countdown to next call with gold particle burst at zero */

export function init(shared) {
  const dateInput  = document.getElementById('countdown-date');
  const elDays     = document.getElementById('cd-days');
  const elHours    = document.getElementById('cd-hours');
  const elMins     = document.getElementById('cd-mins');
  const elSecs     = document.getElementById('cd-secs');
  const zeroMsg    = document.getElementById('countdown-zero-msg');
  const partCanvas = document.getElementById('countdown-particles');
  if (!dateInput || !elDays) return;

  // Stop arrow keys from triggering page navigation in the date input
  dateInput.addEventListener('keydown', e => e.stopPropagation());

  const LS_KEY = 'ls_countdown_date';
  const saved  = localStorage.getItem(LS_KEY);
  if (saved) dateInput.value = saved;

  dateInput.addEventListener('change', () => {
    localStorage.setItem(LS_KEY, dateInput.value);
  });

  function pad2(n) { return String(n).padStart(2, '0'); }

  function setDigit(el, val) {
    const s = pad2(val);
    if (el.textContent !== s) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.textContent = s;
      el.style.animation = 'cd-tick 0.25s cubic-bezier(0.22,1,0.36,1) both';
    }
  }

  function burst() {
    if (!partCanvas) return;
    const ctx = partCanvas.getContext('2d');
    partCanvas.width  = window.innerWidth;
    partCanvas.height = window.innerHeight;
    const cx = partCanvas.width  / 2;
    const cy = partCanvas.height / 2;

    const parts = Array.from({ length: 80 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 3 + Math.random() * 8;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 80 + Math.random() * 60,
        maxLife: 80 + Math.random() * 60,
        r: 2 + Math.random() * 4,
        gold: Math.random() > 0.35,
      };
    });

    function animBurst() {
      ctx.clearRect(0, 0, partCanvas.width, partCanvas.height);
      let alive = false;
      for (const p of parts) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.98; p.life--;
        const a = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(247,201,72,${a})` : `rgba(255,255,200,${a * 0.7})`;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = p.gold ? 'rgba(247,201,72,0.5)' : 'rgba(255,255,200,0.3)';
        ctx.fill();
      }
      if (alive) requestAnimationFrame(animBurst);
      else ctx.clearRect(0, 0, partCanvas.width, partCanvas.height);
    }
    requestAnimationFrame(animBurst);
  }

  let zeroed = false;

  function tick() {
    const raw = dateInput.value;
    if (!raw) {
      [elDays, elHours, elMins, elSecs].forEach(el => { el.textContent = '--'; el.classList.remove('urgent'); });
      return;
    }

    const target = new Date(raw).getTime();
    const diff   = target - Date.now();

    if (diff <= 0) {
      setDigit(elDays, 0); setDigit(elHours, 0);
      setDigit(elMins, 0); setDigit(elSecs,  0);
      [elDays, elHours, elMins, elSecs].forEach(el => el.classList.add('urgent'));
      if (!zeroed) { zeroed = true; zeroMsg?.classList.add('visible'); burst(); }
      return;
    }

    zeroed = false;
    zeroMsg?.classList.remove('visible');

    const totalSecs = Math.floor(diff / 1000);
    setDigit(elDays,  Math.floor(totalSecs / 86400));
    setDigit(elHours, Math.floor((totalSecs % 86400) / 3600));
    setDigit(elMins,  Math.floor((totalSecs % 3600)  / 60));
    setDigit(elSecs,  totalSecs % 60);

    const nearZero = diff < 86400000;
    [elDays, elHours, elMins, elSecs].forEach(el => el.classList.toggle('urgent', nearZero));
  }

  tick();
  setInterval(tick, 1000);
}

export function onEnter() {
  // Numbers are always live — nothing extra needed on page enter
}
