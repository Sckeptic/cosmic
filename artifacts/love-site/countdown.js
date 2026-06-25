/**
 * countdown.js — Countdown to Next Call
 * Stores date in localStorage. Particle explosion at zero.
 */

import { shared } from './script.js';

export function init() {
  const dateInput  = document.getElementById('countdown-date');
  const cdDays     = document.getElementById('cd-days');
  const cdHours    = document.getElementById('cd-hours');
  const cdMins     = document.getElementById('cd-mins');
  const cdSecs     = document.getElementById('cd-secs');
  const zeroMsg    = document.getElementById('countdown-zero-msg');
  const partCanvas = document.getElementById('countdown-particles');
  const section    = document.getElementById('countdown');

  if (!dateInput || !cdDays) return;

  const LS_KEY = 'ls_countdown_date';
  let targetTime = null;
  let ticker     = null;
  let hasExploded = false;

  // ── Restore saved date ──
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    dateInput.value = saved;
    targetTime = new Date(saved).getTime();
  }

  dateInput.addEventListener('change', () => {
    const val = dateInput.value;
    if (!val) return;
    localStorage.setItem(LS_KEY, val);
    targetTime = new Date(val).getTime();
    hasExploded = false;
    zeroMsg && (zeroMsg.classList.remove('visible'));
    startTicker();
  });

  function pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(2, '0');
  }

  function pulseNum(el) {
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  // Background transition as countdown nears zero
  function updateBgProgress(diffMs) {
    if (!section) return;
    const total = 7 * 24 * 3600 * 1000; // 7 days reference
    const frac  = Math.max(0, Math.min(1, 1 - diffMs / total));
    // Transition from #050510 toward #0A1628
    const r1 = 5,  g1 = 5,  b1 = 16;
    const r2 = 10, g2 = 22, b2 = 40;
    const r = Math.round(r1 + (r2 - r1) * frac);
    const g = Math.round(g1 + (g2 - g1) * frac);
    const b = Math.round(b1 + (b2 - b1) * frac);
    section.style.background = `rgb(${r},${g},${b})`;

    // Make countdown numbers glow warmer approaching zero
    const glowAlpha = 0.4 + frac * 0.4;
    const glowColor = frac > 0.8
      ? `rgba(247,201,72,${glowAlpha})`
      : `rgba(79,142,247,${glowAlpha})`;
    [cdDays, cdHours, cdMins, cdSecs].forEach(el => {
      if (el) el.style.textShadow = `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`;
    });
  }

  function tick() {
    if (!targetTime) return;
    const now    = Date.now();
    const diffMs = targetTime - now;

    if (diffMs <= 0) {
      // Zero!
      [cdDays, cdHours, cdMins, cdSecs].forEach(el => { if (el) el.textContent = '00'; });
      updateBgProgress(0);
      if (!hasExploded) {
        hasExploded = true;
        triggerExplosion();
        if (zeroMsg) zeroMsg.classList.add('visible');
      }
      return;
    }

    const totalSecs  = Math.floor(diffMs / 1000);
    const days  = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins  = Math.floor((totalSecs % 3600) / 60);
    const secs  = totalSecs % 60;

    const prevSecs = cdSecs ? parseInt(cdSecs.textContent || '-1') : -1;

    if (cdDays)  cdDays.textContent  = pad(days);
    if (cdHours) cdHours.textContent = pad(hours);
    if (cdMins)  cdMins.textContent  = pad(mins);
    if (cdSecs)  { cdSecs.textContent  = pad(secs); }

    // Pulse seconds digit each second
    if (cdSecs && prevSecs !== secs && !shared.reducedMotion) {
      pulseNum(cdSecs);
    }

    updateBgProgress(diffMs);
  }

  function startTicker() {
    clearInterval(ticker);
    tick();
    ticker = setInterval(tick, 1000);
  }

  if (targetTime) startTicker();

  // ── Particle explosion ──
  let particles = [];
  let explRafId;

  function triggerExplosion() {
    if (!partCanvas) return;
    const W = window.innerWidth, H = window.innerHeight;
    const ctx = partCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    partCanvas.width  = W * dpr;
    partCanvas.height = H * dpr;
    partCanvas.style.width  = W + 'px';
    partCanvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Spawn burst
    const cx = W / 2, cy = H / 2;
    particles = [];
    for (let i = 0; i < (shared.reducedMotion ? 20 : 120); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const isGold = Math.random() > 0.35;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  Math.random() * 3 + 1,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        color: isGold
          ? `rgba(247,201,72,1)`
          : `rgba(79,142,247,1)`,
      });
    }

    // Bloom flash
    ctx.fillStyle = 'rgba(247,201,72,0.12)';
    ctx.fillRect(0, 0, W, H);

    function explLoop() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.98;
        p.life++;
        const frac = 1 - p.life / p.maxLife;
        if (frac > 0) {
          alive = true;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * frac, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(',1)', `,${frac * 0.9})`);
          ctx.shadowBlur  = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      if (alive) explRafId = requestAnimationFrame(explLoop);
      else {
        ctx.clearRect(0, 0, W, H);
        // Brighten stars briefly
        shared.musicReactive = Math.max(shared.musicReactive, 0.8);
        setTimeout(() => { shared.musicReactive = 0; }, 2000);
      }
    }

    cancelAnimationFrame(explRafId);
    explRafId = requestAnimationFrame(explLoop);
  }

  // Pause ticker when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(ticker);
    else if (targetTime) startTicker();
  });
}
