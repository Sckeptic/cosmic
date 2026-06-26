/* starmap.js — Dual night sky with Orion + golden thread + easter egg */

let _shared;

export function init(shared) {
  _shared = shared;
  const skyL   = document.getElementById('sky-left');
  const skyR   = document.getElementById('sky-right');
  const thread = document.getElementById('thread-canvas');
  const easter = document.getElementById('easter-panel');
  const eText  = document.getElementById('easter-text');
  const plane  = document.getElementById('plane-canvas');
  if (!skyL || !skyR || !thread) return;

  function mkRng(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  const ORION = [
    { name: 'Betelgeuse', x: 0.30, y: 0.28, mag: 2.2 },
    { name: 'Bellatrix',  x: 0.65, y: 0.28, mag: 2.4 },
    { name: 'Mintaka',    x: 0.40, y: 0.50, mag: 2.9 },
    { name: 'Alnilam',    x: 0.50, y: 0.52, mag: 2.8 },
    { name: 'Alnitak',    x: 0.60, y: 0.54, mag: 2.8 },
    { name: 'Saiph',      x: 0.35, y: 0.75, mag: 2.9 },
    { name: 'Rigel',      x: 0.70, y: 0.74, mag: 1.8 },
  ];
  const ORION_LINES = [[0,1],[0,2],[1,3],[2,3],[3,4],[0,5],[1,6],[5,6]];

  function drawSky(canvas, rng, tintR, tintG, tintB) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    if (W < 4 || H < 4) return;

    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7);
    bg.addColorStop(0, `rgba(${tintR},${tintG},${tintB},0.08)`);
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const COUNT = Math.floor((W * H) / 3200);
    for (let i = 0; i < COUNT; i++) {
      const sx = rng() * W, sy = rng() * H;
      const sr = 0.4 + rng() * 1.1;
      const sa = 0.15 + rng() * 0.7;

      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5);
      sg.addColorStop(0,   `rgba(200,220,255,${sa})`);
      sg.addColorStop(0.5, `rgba(140,180,255,${sa * 0.3})`);
      sg.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,240,255,${sa})`;
      ctx.fill();
    }

    ctx.save();
    ctx.strokeStyle = `rgba(${tintR},${tintG},${tintB},0.22)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (const [a, b] of ORION_LINES) {
      const ax = ORION[a].x * W, ay = ORION[a].y * H;
      const bx = ORION[b].x * W, by = ORION[b].y * H;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.restore();

    for (const star of ORION) {
      const sx = star.x * W, sy = star.y * H;
      const br = (3.5 - star.mag) * 3.5;

      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 2.5);
      sg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.9)`);
      sg.addColorStop(0.5, `rgba(${tintR},${tintG},${tintB},0.25)`);
      sg.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(sx, sy, br * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sx, sy, br * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.save();
      ctx.font = '400 9px "Space Grotesk", system-ui';
      ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},0.5)`;
      ctx.textAlign = 'center';
      ctx.fillText(star.name, sx, sy - br * 2.5 - 4);
      ctx.restore();
    }
  }

  let shootL = null, shootR = null;
  function spawnShoot(canvas) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const angle = (25 + Math.random() * 30) * Math.PI / 180;
    return {
      x: Math.random() * W * 0.5,
      y: Math.random() * H * 0.3,
      dx: Math.cos(angle) * 7,
      dy: Math.sin(angle) * 7,
      life: 0, maxLife: 30 + Math.random() * 20,
      canvas,
    };
  }
  setInterval(() => {
    if (!shootL) shootL = spawnShoot(skyL);
    if (!shootR) shootR = spawnShoot(skyR);
  }, 28000 + Math.random() * 12000);

  /* ── Thread animation ── */
  let threadPhase = 0;
  let threadClicks = 0;
  let threadClickTimer = null;

  function animateThread() {
    const ctx = thread.getContext('2d');
    const W = thread.width  = thread.clientWidth;
    const H = thread.height = thread.clientHeight;
    if (W < 2 || H < 2) { requestAnimationFrame(animateThread); return; }
    ctx.clearRect(0, 0, W, H);

    threadPhase += 0.03;
    const pulse = 0.6 + 0.4 * Math.sin(threadPhase) + (_shared?.musicReactive ?? 0) * 0.4;

    const cx = W / 2;
    const grd = ctx.createLinearGradient(cx, 0, cx, H);
    grd.addColorStop(0,   'transparent');
    grd.addColorStop(0.2, `rgba(247,201,72,${0.08 * pulse})`);
    grd.addColorStop(0.5, `rgba(247,201,72,${0.14 * pulse})`);
    grd.addColorStop(0.8, `rgba(247,201,72,${0.08 * pulse})`);
    grd.addColorStop(1,   'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.shadowBlur  = 14 * pulse;
    ctx.shadowColor = 'rgba(247,201,72,0.6)';
    const lineGrd = ctx.createLinearGradient(cx, 0, cx, H);
    lineGrd.addColorStop(0,   'transparent');
    lineGrd.addColorStop(0.1, `rgba(247,201,72,${0.7 * pulse})`);
    lineGrd.addColorStop(0.5, `rgba(255,220,80,${pulse})`);
    lineGrd.addColorStop(0.9, `rgba(247,201,72,${0.7 * pulse})`);
    lineGrd.addColorStop(1,   'transparent');
    ctx.strokeStyle = lineGrd;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();
    ctx.restore();

    const particleY = ((threadPhase * 12) % H);
    const pg = ctx.createRadialGradient(cx, particleY, 0, cx, particleY, 6);
    pg.addColorStop(0,   `rgba(255,240,120,${0.9 * pulse})`);
    pg.addColorStop(0.5, 'rgba(247,201,72,0.3)');
    pg.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(cx, particleY, 6, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();

    requestAnimationFrame(animateThread);
  }

  thread.style.cursor = 'pointer';
  thread.addEventListener('click', () => {
    threadClicks++;
    clearTimeout(threadClickTimer);
    threadClickTimer = setTimeout(() => { threadClicks = 0; }, 2800);
    if (threadClicks >= 3) { threadClicks = 0; triggerEasterEgg(); }
  });

  /* ── Easter egg ── */
  const MEMORY = `Remember Katogdham?\nWhere we first realised\nthe stars don't care\nabout the distance—\njust like us.`;

  function triggerEasterEgg() {
    if (!easter) return;
    easter.setAttribute('aria-hidden', 'false');
    easter.classList.add('show');
    eText.textContent = '';

    let i = 0;
    const chars = MEMORY.split('');
    const typeInterval = setInterval(() => {
      if (i < chars.length) {
        eText.textContent += chars[i] === '\n' ? '\n' : chars[i];
        i++;
      } else {
        clearInterval(typeInterval);
        launchPlane();
        setTimeout(() => {
          easter.classList.remove('show');
          easter.setAttribute('aria-hidden', 'true');
        }, 5000);
      }
    }, 58);

    easter.addEventListener('click', () => {
      clearInterval(typeInterval);
      easter.classList.remove('show');
      easter.setAttribute('aria-hidden', 'true');
    }, { once: true });
  }

  function launchPlane() {
    if (!plane) return;
    plane.width  = window.innerWidth;
    plane.height = window.innerHeight;
    const ctx = plane.getContext('2d');
    const particles = [];
    let px = -40, py = plane.height * 0.5;
    const tvx = 9, tvy = -2.5;
    const angle = Math.atan2(tvy, tvx);

    function drawPlane(x, y, a) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.strokeStyle = 'rgba(247,201,72,0.95)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(247,201,72,0.7)';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function animPlane() {
      ctx.clearRect(0, 0, plane.width, plane.height);
      px += tvx; py += tvy;
      if (Math.random() < 0.4) {
        particles.push({ x: px, y: py, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, life: 40, r: 2 + Math.random() * 3 });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        const a = p.life / 40;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(247,201,72,${a * 0.7})`;
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
      }
      drawPlane(px, py, angle);
      if (px < plane.width + 80) requestAnimationFrame(animPlane);
      else ctx.clearRect(0, 0, plane.width, plane.height);
    }
    requestAnimationFrame(animPlane);
  }

  /* ── Main render loop ── */
  let frame = 0;
  let loopStarted = false;

  function renderAll() {
    frame++;
    if (frame % 8 === 0 || frame === 1) {
      drawSky(skyL, mkRng(20240101), 79,  142, 247);
      drawSky(skyR, mkRng(20240102), 247, 201, 72);

      for (const shoot of [{ s: shootL, cv: skyL }, { s: shootR, cv: skyR }]) {
        if (!shoot.s) continue;
        const sc = shoot.cv.getContext('2d');
        const ss = shoot.s;
        ss.x += ss.dx; ss.y += ss.dy; ss.life++;
        const sa = 1 - ss.life / ss.maxLife;
        sc.save();
        sc.globalAlpha = sa;
        sc.strokeStyle = 'rgba(230,240,255,0.9)';
        sc.lineWidth = 1.5;
        sc.shadowBlur = 8;
        sc.shadowColor = 'rgba(200,220,255,0.8)';
        sc.beginPath();
        sc.moveTo(ss.x, ss.y);
        sc.lineTo(ss.x - ss.dx * 5, ss.y - ss.dy * 5);
        sc.stroke();
        sc.restore();
        if (ss.life >= ss.maxLife) {
          if (shoot.s === shootL) shootL = null;
          else shootR = null;
        }
      }
    }
    requestAnimationFrame(renderAll);
  }

  function startLoop() {
    if (loopStarted) return;
    if (skyL.clientWidth < 4) { requestAnimationFrame(startLoop); return; }
    loopStarted = true;
    renderAll();
    animateThread();
  }

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      frame = 0;
      startLoop();
    });
    ro.observe(skyL);
  } else {
    setTimeout(startLoop, 200);
  }

  window.addEventListener('resize', () => { frame = 0; }, { passive: true });
}

export function onEnter() {
  // Canvases are always full-size now (fixed sections), nothing extra needed
}
