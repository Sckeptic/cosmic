/* starmap.js — Premium AAA Dual Night Sky */

import { initPortal } from './portal.js';

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

  function buildStarData(rng, W, H) {
    const COUNT = Math.floor((W * H) / 2650);
    const stars = [];
    for (let i = 0; i < COUNT; i++) {
      const r = 0.35 + rng() * 1.15;
      stars.push({
        x: rng() * W,
        y: rng() * H,
        r,
        baseAlpha: 0.18 + rng() * 0.68,
        phase:  rng() * Math.PI * 2,
        speed:  0.0006 + rng() * 0.0022,
        bright: rng() < 0.045,
        depth:  0.4 + rng() * 0.6,
      });
    }
    return stars;
  }

  function buildDust(rng, W, H) {
    const COUNT = Math.floor((W * H) / 14000);
    const dust = [];
    for (let i = 0; i < COUNT; i++) {
      dust.push({
        x:     rng() * W,
        y:     rng() * H,
        r:     0.6 + rng() * 1.8,
        alpha: 0.025 + rng() * 0.07,
        vx:    (rng() - 0.5) * 0.07,
        vy:    (rng() - 0.28) * 0.045,
        phase: rng() * Math.PI * 2,
      });
    }
    return dust;
  }

  function buildGalaxies(rng, W, H) {
    const positions = [
      { x: W * (0.03 + rng() * 0.10), y: H * (0.04 + rng() * 0.14) },
      { x: W * (0.87 + rng() * 0.10), y: H * (0.03 + rng() * 0.12) },
      { x: W * (0.02 + rng() * 0.09), y: H * (0.80 + rng() * 0.14) },
      { x: W * (0.88 + rng() * 0.09), y: H * (0.82 + rng() * 0.12) },
      { x: W * (0.04 + rng() * 0.08), y: H * (0.42 + rng() * 0.16) },
    ];
    return positions.map(p => ({
      ...p,
      rx:    20 + rng() * 30,
      ry:     9 + rng() * 18,
      angle:  rng() * Math.PI,
      alpha:  0.038 + rng() * 0.058,
    }));
  }

  function initSkyData(canvas, seed) {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W < 4 || H < 4) return null;
    const rng = mkRng(seed);
    return { stars: buildStarData(rng, W, H), dust: buildDust(rng, W, H), galaxies: buildGalaxies(rng, W, H), W, H };
  }

  let mouseX = 0.5, mouseY = 0.5;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }, { passive: true });

  function drawSkyFull(canvas, data, tintR, tintG, tintB, t) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    if (W < 4 || H < 4) return;

    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    bg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.065)`);
    bg.addColorStop(0.5, `rgba(${Math.floor(tintR*0.35)},${Math.floor(tintG*0.25)},${Math.floor(tintB*0.55)},0.025)`);
    bg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const nebulaBreath = 0.72 + 0.28 * Math.sin(t * 0.00028);
    const corners = [
      { cx: 0,   cy: 0   },
      { cx: W,   cy: 0   },
      { cx: 0,   cy: H   },
      { cx: W,   cy: H   },
    ];
    const nebulaR = Math.min(W, H) * 0.46;
    for (const nb of corners) {
      const ng = ctx.createRadialGradient(nb.cx, nb.cy, 0, nb.cx, nb.cy, nebulaR);
      ng.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${0.052 * nebulaBreath})`);
      ng.addColorStop(0.45,`rgba(${tintR},${tintG},${tintB},${0.016 * nebulaBreath})`);
      ng.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(nb.cx, nb.cy, nebulaR, 0, Math.PI * 2);
      ctx.fillStyle = ng;
      ctx.fill();
    }

    if (data?.galaxies) {
      for (const g of data.galaxies) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.angle);
        ctx.scale(1, g.ry / g.rx);
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.rx);
        gg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${g.alpha * 1.6})`);
        gg.addColorStop(0.38,`rgba(${tintR},${tintG},${tintB},${g.alpha * 0.55})`);
        gg.addColorStop(1,   'transparent');
        ctx.beginPath();
        ctx.arc(0, 0, g.rx, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
        ctx.restore();
      }
    }

    const px = (mouseX - 0.5) * 7;
    const py = (mouseY - 0.5) * 4.5;

    if (data?.stars) {
      for (const s of data.stars) {
        const alpha = s.baseAlpha * (0.62 + 0.38 * Math.sin(t * s.speed + s.phase));
        const sx = s.x + px * s.depth;
        const sy = s.y + py * s.depth;

        if (s.bright) {
          const bloomR = s.r * 6;
          const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomR);
          bloom.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${alpha * 0.45})`);
          bloom.addColorStop(0.35,`rgba(${tintR},${tintG},${tintB},${alpha * 0.10})`);
          bloom.addColorStop(1,   'transparent');
          ctx.beginPath();
          ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
          ctx.fillStyle = bloom;
          ctx.fill();
        }

        const glowR = s.r * 3.4;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        glow.addColorStop(0,   `rgba(210,228,255,${alpha * 0.85})`);
        glow.addColorStop(0.5, `rgba(150,188,255,${alpha * 0.18})`);
        glow.addColorStop(1,   'transparent');
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235,242,255,${alpha})`;
        ctx.fill();
      }
    }

    if (data?.dust) {
      for (const d of data.dust) {
        d.x = (d.x + d.vx + W) % W;
        d.y = (d.y + d.vy + H) % H;
        const da = d.alpha * (0.48 + 0.52 * Math.sin(t * 0.00072 + d.phase));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},${da})`;
        ctx.fill();
      }
    }

    const lineBreath = 0.16 + 0.07 * Math.sin(t * 0.0009);
    ctx.save();
    for (const [a, b] of ORION_LINES) {
      const ax = ORION[a].x * W + px * 0.55, ay = ORION[a].y * H + py * 0.55;
      const bx = ORION[b].x * W + px * 0.55, by = ORION[b].y * H + py * 0.55;

      ctx.lineWidth = 2.8;
      ctx.strokeStyle = `rgba(${tintR},${tintG},${tintB},${lineBreath * 0.28})`;
      ctx.shadowBlur = 7;
      ctx.shadowColor = `rgba(${tintR},${tintG},${tintB},0.5)`;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      const lg = ctx.createLinearGradient(ax, ay, bx, by);
      lg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${lineBreath})`);
      lg.addColorStop(0.5, `rgba(${tintR},${tintG},${tintB},${lineBreath * 1.45})`);
      lg.addColorStop(1,   `rgba(${tintR},${tintG},${tintB},${lineBreath})`);
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = lg;
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    for (const star of ORION) {
      const sx = star.x * W + px * 0.55, sy = star.y * H + py * 0.55;
      const br = (3.5 - star.mag) * 3.9;
      const tw = 0.88 + 0.12 * Math.sin(t * 0.0018 + star.x * 12);

      const layers = [[br * 5.5, 0.055], [br * 3.2, 0.14], [br * 1.9, 0.32]];
      for (const [radius, baseA] of layers) {
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * tw);
        sg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${baseA})`);
        sg.addColorStop(0.5, `rgba(${tintR},${tintG},${tintB},${baseA * 0.35})`);
        sg.addColorStop(1,   'transparent');
        ctx.beginPath();
        ctx.arc(sx, sy, radius * tw, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, br * 0.44 * tw, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.save();
      ctx.font = '400 9px "Space Grotesk", system-ui';
      ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},0.42)`;
      ctx.textAlign = 'center';
      ctx.fillText(star.name, sx, sy - br * 2.9 - 4);
      ctx.restore();
    }

    const fog = ctx.createLinearGradient(0, H * 0.70, 0, H);
    fog.addColorStop(0, 'transparent');
    fog.addColorStop(1, `rgba(${tintR},${tintG},${tintB},0.055)`);
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, W, H);

    const glassHi = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.32);
    glassHi.addColorStop(0,   'rgba(255,255,255,0.022)');
    glassHi.addColorStop(0.3, 'rgba(255,255,255,0.007)');
    glassHi.addColorStop(1,   'transparent');
    ctx.fillStyle = glassHi;
    ctx.fillRect(0, 0, W, H);

    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.80);
    vig.addColorStop(0,   'transparent');
    vig.addColorStop(0.65,'rgba(0,0,0,0.06)');
    vig.addColorStop(1,   'rgba(0,0,0,0.58)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  let shootL = null, shootR = null;

  function spawnShoot(canvas) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const angle = (18 + Math.random() * 38) * Math.PI / 180;
    const speed = 5.5 + Math.random() * 5;
    return {
      x: Math.random() * W * 0.55,
      y: Math.random() * H * 0.38,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 0, maxLife: 26 + Math.random() * 24,
      trail: [],
    };
  }

  function scheduleShoot() {
    const delay = 15000 + Math.random() * 10000;
    setTimeout(() => {
      if (!shootL) shootL = spawnShoot(skyL);
      if (!shootR) shootR = spawnShoot(skyR);
      scheduleShoot();
    }, delay);
  }
  scheduleShoot();

  let portalInstance  = null;
  let threadClicks    = 0;
  let threadClickTimer = null;

  function startPortal() {
    if (portalInstance) return;
    portalInstance = initPortal(thread, () => _shared);
  }

  thread.style.cursor = 'pointer';
  thread.addEventListener('click', () => {
    threadClicks++;
    clearTimeout(threadClickTimer);
    threadClickTimer = setTimeout(() => { threadClicks = 0; }, 2800);
    if (threadClicks >= 3) { threadClicks = 0; triggerEasterEgg(); }
  });

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

  let loopStarted = false;
  let startTime   = 0;
  let dataL = null, dataR = null;

  function renderAll(ts) {
    const t = ts - startTime;

    if (!dataL || dataL.W !== skyL.clientWidth || dataL.H !== skyL.clientHeight) {
      dataL = initSkyData(skyL, 20240101);
    }
    if (!dataR || dataR.W !== skyR.clientWidth || dataR.H !== skyR.clientHeight) {
      dataR = initSkyData(skyR, 20240102);
    }

    drawSkyFull(skyL, dataL, 255, 107, 157, t);
    drawSkyFull(skyR, dataR, 247, 201,  72, t);

    for (const shoot of [{ s: shootL, cv: skyL }, { s: shootR, cv: skyR }]) {
      if (!shoot.s) continue;
      const sc  = shoot.cv.getContext('2d');
      const ss  = shoot.s;

      ss.trail.push({ x: ss.x, y: ss.y });
      if (ss.trail.length > 10) ss.trail.shift();
      ss.x += ss.dx; ss.y += ss.dy; ss.life++;

      const sa = 1 - ss.life / ss.maxLife;
      if (ss.trail.length > 1) {
        for (let i = 1; i < ss.trail.length; i++) {
          const ta = sa * (i / ss.trail.length) * 0.85;
          sc.save();
          sc.globalAlpha = ta;
          sc.lineWidth = Math.max(0.3, 2.2 - i * 0.22);
          sc.strokeStyle = 'rgba(235,245,255,0.95)';
          sc.shadowBlur = 9;
          sc.shadowColor = 'rgba(200,225,255,0.85)';
          sc.beginPath();
          sc.moveTo(ss.trail[i - 1].x, ss.trail[i - 1].y);
          sc.lineTo(ss.trail[i].x, ss.trail[i].y);
          sc.stroke();
          sc.restore();
        }
      }

      sc.save();
      sc.globalAlpha = sa;
      const hg = sc.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 7);
      hg.addColorStop(0,   'rgba(255,255,255,0.95)');
      hg.addColorStop(0.5, 'rgba(200,225,255,0.4)');
      hg.addColorStop(1,   'transparent');
      sc.beginPath();
      sc.arc(ss.x, ss.y, 7, 0, Math.PI * 2);
      sc.fillStyle = hg;
      sc.fill();
      sc.restore();

      if (ss.life >= ss.maxLife) {
        if (shoot.s === shootL) shootL = null;
        else                    shootR = null;
      }
    }

    requestAnimationFrame(renderAll);
  }

  function startLoop(ts) {
    if (loopStarted) return;
    if (skyL.clientWidth < 4) { requestAnimationFrame(startLoop); return; }
    loopStarted = true;
    startTime = ts || performance.now();
    renderAll(startTime);
    startPortal();
  }

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      dataL = null; dataR = null;
      if (!loopStarted) startLoop();
    });
    ro.observe(skyL);
  } else {
    setTimeout(startLoop, 200);
  }

  window.addEventListener('resize', () => { dataL = null; dataR = null; }, { passive: true });
}

export function onEnter() {}
