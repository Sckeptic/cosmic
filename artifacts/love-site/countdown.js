/* countdown.js — Countdown to next call with romantic particle burst at zero */

export function init(shared) {
  const dateInput  = document.getElementById('countdown-date');
  const elDays     = document.getElementById('cd-days');
  const elHours    = document.getElementById('cd-hours');
  const elMins     = document.getElementById('cd-mins');
  const elSecs     = document.getElementById('cd-secs');
  const zeroMsg    = document.getElementById('countdown-zero-msg');
  const partCanvas = document.getElementById('countdown-particles');
  if (!dateInput || !elDays) return;

  dateInput.addEventListener('keydown', e => e.stopPropagation());

  const LS_KEY = 'ls_countdown_date';
  const saved  = localStorage.getItem(LS_KEY);
  if (saved && !isNaN(new Date(saved).getTime())) {
    dateInput.value = saved;
  } else {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    dateInput.value = d.toISOString().slice(0, 16);
    if (saved) localStorage.removeItem(LS_KEY);
  }

  const WA_NUMBER = '918178804731';

  function formatDateLovingly(raw) {
    const d = new Date(raw);
    const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} at ${timeStr}`;
  }

  function sendCallDateToWhatsApp(raw) {
    const d = new Date(raw);
    const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg =
      `Prince ♥\n\n` +
      `Mujhe pata hai beech mein thodi dikkat hui,\n` +
      `par tension mat lena — kuch dino mein sab theek ho jayega.\n\n` +
      `📅 ${dateStr}\n` +
      `🕐 ${timeStr}\n\n` +
      `Is din se, is waqt se — wapas aa jaana.\n` +
      `Main yahan hoon. Hamesha. 🌙\n\n` +
      `— Kp 👀 ♥`;
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
  }

  dateInput.addEventListener('change', () => {
    localStorage.setItem(LS_KEY, dateInput.value);
    if (dateInput.value) {
      setTimeout(() => sendCallDateToWhatsApp(dateInput.value), 400);
    }
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

    /* Romantic particle palette: rose + gold + lavender */
    const palette = [
      { r: 255, g: 107, b: 157, name: 'rose' },
      { r: 247, g: 201, b:  72, name: 'gold' },
      { r: 255, g: 150, b: 180, name: 'pink' },
      { r: 200, g: 130, b: 255, name: 'lavender' },
      { r: 255, g: 200, b: 120, name: 'peach' },
    ];

    const parts = Array.from({ length: 100 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 3 + Math.random() * 9;
      const col   = palette[Math.floor(Math.random() * palette.length)];
      const isHeart = Math.random() > 0.6;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 80 + Math.random() * 60,
        maxLife: 80 + Math.random() * 60,
        r: 2 + Math.random() * 4,
        col, isHeart,
      };
    });

    function drawHeart(ctx, x, y, size, alpha, col) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${col.r},${col.g},${col.b},0.6)`;
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.4);
      ctx.bezierCurveTo(x - size, y + size * 0.8, x, y + size * 1.1, x, y + size * 1.3);
      ctx.bezierCurveTo(x, y + size * 1.1, x + size, y + size * 0.8, x + size, y + size * 0.4);
      ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
      ctx.fill();
      ctx.restore();
    }

    function animBurst() {
      ctx.clearRect(0, 0, partCanvas.width, partCanvas.height);
      let alive = false;
      for (const p of parts) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.10;
        p.vx *= 0.99; p.life--;
        const a = p.life / p.maxLife;
        const { r, g, b } = p.col;
        if (p.isHeart) {
          drawHeart(ctx, p.x, p.y, p.r * a * 1.5, a * 0.85, p.col);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.shadowBlur  = 8;
          ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
          ctx.fill();
        }
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

export function onEnter() {}
