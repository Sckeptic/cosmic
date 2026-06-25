/**
 * starmap.js — Star Map
 * Two synchronized star canvases with Orion constellation.
 * Golden thread, shooting stars, easter egg.
 */

import { shared } from './script.js';

export function init() {
  const canvasL  = document.getElementById('sky-left');
  const canvasR  = document.getElementById('sky-right');
  const threadC  = document.getElementById('thread-canvas');
  const easterP  = document.getElementById('easter-panel');
  const easterT  = document.getElementById('easter-text');
  const planeC   = document.getElementById('plane-canvas');
  const starmapW = document.querySelector('.starmap-wrap');

  if (!canvasL || !canvasR || !threadC) return;

  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // ── Seeded PRNG (date-based) ──
  const today = new Date();
  let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  function rng() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // ── Orion star positions (normalised 0..1 within canvas) ──
  const ORION = [
    { name: 'Betelgeuse', x: 0.30, y: 0.28, r: 2.6, color: '#FF9966' },
    { name: 'Bellatrix',  x: 0.62, y: 0.28, r: 2.0, color: '#99CCFF' },
    { name: 'Alnilam',    x: 0.48, y: 0.50, r: 1.9, color: '#AACCFF' },
    { name: 'Alnitak',    x: 0.38, y: 0.53, r: 1.8, color: '#AACCFF' },
    { name: 'Mintaka',    x: 0.57, y: 0.47, r: 1.7, color: '#AACCFF' },
    { name: 'Rigel',      x: 0.62, y: 0.73, r: 2.4, color: '#CCDDFF' },
    { name: 'Saiph',      x: 0.30, y: 0.73, r: 1.9, color: '#CCDDFF' },
    { name: "Meissa",     x: 0.48, y: 0.17, r: 1.5, color: '#DDEEFF' },
  ];

  const ORION_LINES = [
    [0, 1], [0, 3], [1, 4], [2, 3], [2, 4],
    [3, 6], [4, 5], [0, 7], [1, 7],
  ];

  // ── Generate background stars (seeded) ──
  function genStars(W, H, count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x:     rng() * W,
        y:     rng() * H,
        r:     rng() * 1.0 + 0.25,
        base:  rng() * 0.55 + 0.15,
        speed: rng() * 0.5 + 0.2,
        phase: rng() * Math.PI * 2,
        twinkle: rng() > 0.7,
      });
    }
    return arr;
  }

  // ── Per-panel state ──
  function makePanel(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, stars = [], t = 0;
    let shooter = null, shooterTimer = 0;

    return {
      canvas, ctx,
      get W() { return W; },
      get H() { return H; },
      resize() {
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars = genStars(W, H, Math.min(Math.round(W * H / 1800), 140));
      },
      spawnShooter() {
        shooter = {
          x:  rng() * W * 0.6,
          y:  rng() * H * 0.4,
          vx: 3 + rng() * 4,
          vy: 1.5 + rng() * 2,
          tail: [],
          life: 0,
          maxLife: 40 + rng() * 30,
        };
      },
      draw() {
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = 'rgba(5,5,16,0.95)';
        ctx.fillRect(0, 0, W, H);

        const boost = shared.musicReactive * 0.25;

        // Stars
        for (const s of stars) {
          const twinkle = s.twinkle
            ? s.base + Math.sin(t * s.speed + s.phase) * (0.2 + boost)
            : s.base;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(210,220,255,${Math.max(0, Math.min(1, twinkle))})`;
          ctx.fill();
        }

        // Shooting star
        shooterTimer++;
        if (shooterTimer > 1800 && !shooter) {
          this.spawnShooter();
          shooterTimer = 0;
        }
        if (shooter) {
          shooter.tail.push({ x: shooter.x, y: shooter.y });
          if (shooter.tail.length > 20) shooter.tail.shift();
          shooter.x += shooter.vx;
          shooter.y += shooter.vy;
          shooter.life++;

          // Draw tail
          for (let i = 0; i < shooter.tail.length; i++) {
            const frac = i / shooter.tail.length;
            ctx.beginPath();
            ctx.arc(shooter.tail[i].x, shooter.tail[i].y, 1 * frac, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${frac * 0.7})`;
            ctx.fill();
          }

          if (shooter.life > shooter.maxLife || shooter.x > W + 40 || shooter.y > H + 40) {
            shooter = null;
          }
        }

        t += 0.016;
      },
      drawOrion(threadGlow) {
        const orionPts = ORION.map(s => ({
          ...s,
          px: s.x * W,
          py: s.y * H,
        }));

        // Constellation lines
        for (const [a, b] of ORION_LINES) {
          ctx.beginPath();
          ctx.moveTo(orionPts[a].px, orionPts[a].py);
          ctx.lineTo(orionPts[b].px, orionPts[b].py);
          ctx.strokeStyle = 'rgba(79,142,247,0.18)';
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }

        // Stars
        for (const s of orionPts) {
          // Outer glow halo
          ctx.beginPath();
          ctx.arc(s.px, s.py, s.r * 7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(79,142,247,0.04)`;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(s.px, s.py, s.r + shared.musicReactive * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();

          // Name label
          if (s.r > 1.8) {
            ctx.font = '500 9px Inter, sans-serif';
            ctx.fillStyle = 'rgba(165,168,184,0.6)';
            ctx.textBaseline = 'top';
            ctx.fillText(s.name, s.px + s.r + 4, s.py - 5);
          }
        }

        return orionPts;
      },
    };
  }

  const left  = makePanel(canvasL);
  const right = makePanel(canvasR);

  // ── Thread canvas ──
  const threadCtx = threadC.getContext('2d');
  let threadT = 0;

  function resizeThread() {
    const wrap = document.querySelector('.starmap-thread-wrap');
    if (!wrap) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    threadC.width  = W * dpr;
    threadC.height = H * dpr;
    threadC.style.width  = W + 'px';
    threadC.style.height = H + 'px';
    threadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let threadClickCount = 0;
  let lastClickTime = 0;
  let easterActive = false;

  function drawThread() {
    const wrap = document.querySelector('.starmap-thread-wrap');
    if (!wrap) return;
    const W = threadC.clientWidth, H = threadC.clientHeight;
    threadCtx.clearRect(0, 0, W, H);

    threadT += 0.016;
    const pulse = 0.6 + Math.sin(threadT * 2) * 0.25 + shared.musicReactive * 0.35;

    // Vertical golden thread
    const cx = W / 2;
    threadCtx.beginPath();
    for (let y = 0; y <= H; y += 4) {
      const wave = Math.sin(y / 15 + threadT * 1.5) * 2;
      if (y === 0) threadCtx.moveTo(cx + wave, y);
      else         threadCtx.lineTo(cx + wave, y);
    }
    const grad = threadCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   `rgba(247,201,72,${pulse * 0.6})`);
    grad.addColorStop(0.5, `rgba(247,201,72,${pulse})`);
    grad.addColorStop(1,   `rgba(247,201,72,${pulse * 0.6})`);
    threadCtx.strokeStyle = grad;
    threadCtx.lineWidth   = 1.5;
    threadCtx.shadowBlur  = 8 + shared.musicReactive * 8;
    threadCtx.shadowColor = 'rgba(247,201,72,0.6)';
    threadCtx.stroke();
    threadCtx.shadowBlur  = 0;

    // Particle drops
    if (!shared.reducedMotion && Math.random() < 0.15) {
      const py = Math.random() * H;
      threadCtx.beginPath();
      threadCtx.arc(cx, py, 1.5, 0, Math.PI * 2);
      threadCtx.fillStyle = `rgba(247,201,72,${Math.random() * 0.6 + 0.1})`;
      threadCtx.fill();
    }
  }

  // Click easter egg on thread canvas
  threadC.style.cursor = 'pointer';
  threadC.setAttribute('role', 'button');
  threadC.setAttribute('aria-label', 'Click 3 times for a hidden memory');
  threadC.setAttribute('tabindex', '0');

  function handleThreadClick() {
    if (easterActive) return;
    const now = Date.now();
    if (now - lastClickTime > 3000) threadClickCount = 0;
    lastClickTime = now;
    threadClickCount++;
    if (threadClickCount >= 3) {
      threadClickCount = 0;
      triggerEasterEgg();
    }
  }

  threadC.addEventListener('click', handleThreadClick);
  threadC.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleThreadClick(); }
  });

  // ── Easter Egg ──
  const EASTER_LINES = [
    'Remember Katogdham?',
    'Ghumi ghumi gaye the…',
    'Lost.',
    'Together.',
    'Happy.',
    'That day proved 274 km means nothing.',
  ];

  let paperPlane = null;
  let planeParticles = [];
  let easterRaf = null;

  function triggerEasterEgg() {
    easterActive = true;
    easterP.setAttribute('aria-hidden', 'false');
    easterP.classList.add('visible');
    easterT.textContent = '';

    resizePlanCanvas();
    typewriterLines(EASTER_LINES, 0, () => {
      setTimeout(() => launchPaperPlane(), 800);
    });
  }

  function resizePlanCanvas() {
    if (!planeC) return;
    const W = window.innerWidth, H = window.innerHeight;
    planeC.width  = W * dpr;
    planeC.height = H * dpr;
    planeC.style.width  = W + 'px';
    planeC.style.height = H + 'px';
    planeC.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function typewriterLines(lines, lineIdx, onDone) {
    if (lineIdx >= lines.length) {
      setTimeout(onDone, 600);
      return;
    }
    const line = lines[lineIdx];
    let charIdx = 0;
    const existingText = easterT.innerHTML;
    const lineDiv = document.createElement('div');
    easterT.appendChild(lineDiv);

    const interval = setInterval(() => {
      charIdx++;
      lineDiv.textContent = line.slice(0, charIdx);
      if (charIdx >= line.length) {
        clearInterval(interval);
        setTimeout(() => typewriterLines(lines, lineIdx + 1, onDone), 500);
      }
    }, 45 + Math.random() * 30);
  }

  function launchPaperPlane() {
    const pCtx = planeC.getContext('2d');
    const W = planeC.clientWidth, H = planeC.clientHeight;

    paperPlane = {
      x: -40,
      y: H / 2 + (Math.random() - 0.5) * H * 0.3,
      angle: Math.PI * 0.04,
      speed: 6,
      t: 0,
    };
    planeParticles = [];

    function planeDraw() {
      pCtx.clearRect(0, 0, W, H);

      if (!paperPlane) return;
      paperPlane.x += paperPlane.speed;
      paperPlane.t += 0.06;
      paperPlane.y += Math.sin(paperPlane.t) * 0.5;

      // Particle trail
      planeParticles.push({
        x: paperPlane.x - 8,
        y: paperPlane.y,
        vx: -1 + (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        r: Math.random() * 2.5 + 0.5,
      });

      for (let i = planeParticles.length - 1; i >= 0; i--) {
        const p = planeParticles[i];
        p.x += p.vx; p.y += p.vy; p.life++;
        const frac = 1 - p.life / p.maxLife;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.r * frac, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(247,201,72,${frac * 0.7})`;
        pCtx.fill();
        if (p.life >= p.maxLife) planeParticles.splice(i, 1);
      }

      // Draw paper plane
      pCtx.save();
      pCtx.translate(paperPlane.x, paperPlane.y);
      pCtx.rotate(paperPlane.angle);
      pCtx.fillStyle = 'rgba(247,201,72,0.9)';
      pCtx.shadowBlur  = 12;
      pCtx.shadowColor = 'rgba(247,201,72,0.7)';
      pCtx.beginPath();
      pCtx.moveTo(20, 0);
      pCtx.lineTo(-10, -8);
      pCtx.lineTo(-5, 0);
      pCtx.lineTo(-10, 8);
      pCtx.closePath();
      pCtx.fill();
      pCtx.restore();

      if (paperPlane.x > W + 60) {
        paperPlane = null;
        // Fade out and reset
        setTimeout(() => {
          easterP.classList.remove('visible');
          setTimeout(() => {
            easterP.setAttribute('aria-hidden', 'true');
            easterT.textContent = '';
            pCtx.clearRect(0, 0, W, H);
            easterActive = false;
          }, 900);
        }, 600);
        return;
      }

      easterRaf = requestAnimationFrame(planeDraw);
    }

    easterRaf = requestAnimationFrame(planeDraw);
  }

  // ── Main loop ──
  let rafId;

  function loop() {
    left.draw();
    right.draw();

    const lpL = left.drawOrion();
    const lpR = right.drawOrion();

    drawThread();

    rafId = requestAnimationFrame(loop);
  }

  function handleVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(easterRaf);
    } else {
      loop();
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    left.resize();
    right.resize();
    resizeThread();
    resizePlanCanvas();
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibility);

  resize();
  loop();
}
