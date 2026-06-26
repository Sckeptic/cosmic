/* starmap.js — Cinematic realistic space: NASA / JWST / Apple aesthetic */

import { initPortal } from './portal.js';

let _shared;

/* ── Edge-only nebula wisps — cosmic blue & purple ── */
const WISPS_L = [
  { cx:0.04, cy:0.94, rx:0.36, ry:0.16, a:-0.22, r: 60, g: 80, b:200, o:0.055 },
  { cx:0.96, cy:0.90, rx:0.30, ry:0.15, a: 0.32, r: 90, g: 40, b:220, o:0.042 },
  { cx:0.06, cy:0.10, rx:0.26, ry:0.12, a:-0.28, r: 40, g:100, b:240, o:0.038 },
  { cx:0.94, cy:0.06, rx:0.22, ry:0.11, a: 0.38, r:120, g: 60, b:255, o:0.030 },
  { cx:0.50, cy:0.97, rx:0.52, ry:0.14, a: 0.00, r: 70, g: 60, b:210, o:0.034 },
];
const WISPS_R = [
  { cx:0.96, cy:0.90, rx:0.34, ry:0.17, a: 0.36, r: 80, g:200, b:240, o:0.048 },
  { cx:0.04, cy:0.92, rx:0.28, ry:0.15, a:-0.28, r: 60, g:180, b:220, o:0.038 },
  { cx:0.92, cy:0.08, rx:0.24, ry:0.11, a: 0.40, r:100, g:160, b:255, o:0.030 },
  { cx:0.06, cy:0.06, rx:0.20, ry:0.10, a:-0.18, r: 40, g:140, b:200, o:0.022 },
  { cx:0.50, cy:0.96, rx:0.48, ry:0.13, a: 0.00, r: 70, g:180, b:230, o:0.030 },
];

/* ── Orion — unchanged positions ── */
const ORION = [
  { name: 'Betelgeuse', x: 0.26, y: 0.23, mag: 1.0, temp: 'warm' },
  { name: 'Bellatrix',  x: 0.68, y: 0.22, mag: 1.2, temp: 'cool' },
  { name: 'Mintaka',    x: 0.38, y: 0.49, mag: 1.6, temp: 'cool' },
  { name: 'Alnilam',    x: 0.50, y: 0.51, mag: 1.5, temp: 'cool' },
  { name: 'Alnitak',    x: 0.62, y: 0.53, mag: 1.5, temp: 'cool' },
  { name: 'Saiph',      x: 0.28, y: 0.77, mag: 1.6, temp: 'cool' },
  { name: 'Rigel',      x: 0.72, y: 0.76, mag: 0.8, temp: 'blue' },
];
const ORION_LINES = [[0,1],[0,2],[1,3],[2,3],[3,4],[0,5],[1,6],[5,6]];

export function init(shared) {
  _shared = shared;
  const skyL   = document.getElementById('sky-left');
  const skyR   = document.getElementById('sky-right');
  const thread = document.getElementById('thread-canvas');
  const easter = document.getElementById('easter-panel');
  const eText  = document.getElementById('easter-text');
  const plane  = document.getElementById('plane-canvas');
  if (!skyL || !skyR || !thread) return;

  /* ── Seeded RNG ── */
  function mkRng(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ── Build star data — rich density ── */
  function buildStarData(rng, W, H) {
    /* ~2000+ stars for a 500×400 card = real deep-field density */
    const TOTAL = Math.floor(W * H / 110);
    const stars = [];

    for (let i = 0; i < TOTAL; i++) {
      const roll = rng();
      let size, alpha, tier;

      if (roll < 0.68) {
        /* Distant — sub-pixel to 0.7px points, many */
        size  = 0.15 + rng() * 0.55;
        alpha = 0.18 + rng() * 0.44;
        tier  = 0;
      } else if (roll < 0.91) {
        /* Mid-field — 0.5–1.2px with faint halo */
        size  = 0.45 + rng() * 0.75;
        alpha = 0.32 + rng() * 0.42;
        tier  = 1;
      } else {
        /* Foreground — 1–2px with soft bloom */
        size  = 0.90 + rng() * 1.10;
        alpha = 0.52 + rng() * 0.38;
        tier  = 2;
      }

      stars.push({
        x: rng() * W, y: rng() * H,
        size, alpha,
        phase: rng() * Math.PI * 2,
        speed: 0.00012 + rng() * 0.00090,
        tier,
        depth: 0.06 + rng() * 0.94,
        warm:  rng() < 0.09,
        blue:  rng() < 0.08,
      });
    }

    /* Star clusters — edge-biased, not center */
    for (let c = 0; c < 3; c++) {
      const edge = rng();
      let cx, cy;
      if (edge < 0.25)      { cx = rng() * 0.22 * W;          cy = rng() * H; }
      else if (edge < 0.50) { cx = (0.78 + rng() * 0.22) * W; cy = rng() * H; }
      else if (edge < 0.75) { cx = rng() * W; cy = rng() * 0.22 * H; }
      else                  { cx = rng() * W; cy = (0.78 + rng() * 0.22) * H; }

      const cr = (0.04 + rng() * 0.06) * Math.min(W, H);
      const n  = 12 + Math.floor(rng() * 14);
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2;
        const d = Math.sqrt(rng()) * cr;
        stars.push({
          x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
          size:  0.12 + rng() * 0.38,
          alpha: 0.22 + rng() * 0.38,
          phase: rng() * Math.PI * 2,
          speed: 0.00010 + rng() * 0.00060,
          tier: 0, depth: 0.05 + rng() * 0.14,
          warm: false, blue: rng() < 0.30,
        });
      }
    }

    return stars;
  }

  /* ── Cosmic dust (very few, subtle drift) ── */
  function buildDust(rng, W, H) {
    const COUNT = Math.floor(W * H / 12000);
    return Array.from({ length: COUNT }, () => ({
      x:     rng() * W,
      y:     rng() * H,
      r:     0.6 + rng() * 1.3,
      alpha: 0.006 + rng() * 0.022,
      vx:    (rng() - 0.5) * 0.036,
      vy:    (rng() - 0.32) * 0.022,
      phase: rng() * Math.PI * 2,
    }));
  }

  function initSkyData(canvas, seed) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (W < 4 || H < 4) return null;
    const rng = mkRng(seed);
    return { stars: buildStarData(rng, W, H), dust: buildDust(rng, W, H), W, H };
  }

  let mouseX = 0.5, mouseY = 0.5;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }, { passive: true });

  /* ── Edge nebula ── */
  function drawNebula(ctx, W, H, wisps, t) {
    const breath = 0.95 + 0.05 * Math.sin(t * 0.00015);
    for (const w of wisps) {
      const cx = w.cx * W, cy = w.cy * H;
      const rx = w.rx * W, ry = w.ry * H;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(w.a); ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      const o = w.o * breath;
      g.addColorStop(0.00, `rgba(${w.r},${w.g},${w.b},${o.toFixed(4)})`);
      g.addColorStop(0.42, `rgba(${w.r},${w.g},${w.b},${(o*0.38).toFixed(4)})`);
      g.addColorStop(0.75, `rgba(${w.r},${w.g},${w.b},${(o*0.07).toFixed(4)})`);
      g.addColorStop(1.00, 'transparent');
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
  }

  /* ── Main draw ── */
  function drawSkyFull(canvas, data, tR, tG, tB, t, wisps) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    if (W < 4 || H < 4) return;

    /* 1 · Solid deep-space black — no CSS bleed */
    ctx.fillStyle = '#020107';
    ctx.fillRect(0, 0, W, H);

    /* 2 · Corner nebula — edges only */
    drawNebula(ctx, W, H, wisps, t);

    /* 3 · Milky Way dust band — diagonal, barely there */
    const mw = ctx.createLinearGradient(W*0.05, H*0.05, W*0.95, H*0.95);
    mw.addColorStop(0,    'transparent');
    mw.addColorStop(0.30, `rgba(${tR},${tG},${tB},0.006)`);
    mw.addColorStop(0.50, `rgba(${tR},${tG},${tB},0.011)`);
    mw.addColorStop(0.70, `rgba(${tR},${tG},${tB},0.006)`);
    mw.addColorStop(1,    'transparent');
    ctx.fillStyle = mw; ctx.fillRect(0, 0, W, H);

    /* 4 · Stars — depth-layered with parallax */
    const px = (mouseX - 0.5) * 6.0;
    const py = (mouseY - 0.5) * 3.5;

    if (data?.stars) {
      for (const s of data.stars) {
        const tw = 0.82 + 0.18 * Math.sin(t * s.speed + s.phase);
        const a  = s.alpha * tw;
        const sx = s.x + px * s.depth;
        const sy = s.y + py * s.depth;
        const cr = s.warm ? '255,224,182' : s.blue ? '172,202,255' : '215,230,255';

        if (s.tier === 0) {
          /* Distant — single crisp point, no overhead */
          ctx.fillStyle = `rgba(${cr},${a.toFixed(3)})`;
          ctx.fillRect(sx - s.size * 0.5, sy - s.size * 0.5, s.size, s.size);
        } else if (s.tier === 1) {
          /* Mid-field — arc with tiny diffuse halo */
          const hw = s.size * 2.0;
          const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, hw);
          g.addColorStop(0,    `rgba(${cr},${(a * 0.88).toFixed(3)})`);
          g.addColorStop(0.55, `rgba(${cr},${(a * 0.14).toFixed(3)})`);
          g.addColorStop(1,    'transparent');
          ctx.beginPath(); ctx.arc(sx, sy, hw, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
          /* Bright core */
          ctx.fillStyle = `rgba(${cr},${a.toFixed(3)})`;
          ctx.fillRect(sx - s.size*0.4, sy - s.size*0.4, s.size*0.8, s.size*0.8);
        } else {
          /* Foreground — restrained soft bloom */
          const hw = s.size * 3.0;
          const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, hw);
          g.addColorStop(0,    `rgba(${cr},${(a * 0.48).toFixed(3)})`);
          g.addColorStop(0.50, `rgba(${cr},${(a * 0.09).toFixed(3)})`);
          g.addColorStop(1,    'transparent');
          ctx.beginPath(); ctx.arc(sx, sy, hw, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${Math.min(a, 0.90).toFixed(3)})`; ctx.fill();
        }
      }
    }

    /* 5 · Cosmic dust — drifting micro-particles */
    if (data?.dust) {
      for (const d of data.dust) {
        d.x = (d.x + d.vx + W) % W;
        d.y = (d.y + d.vy + H) % H;
        const da = d.alpha * (0.5 + 0.5 * Math.sin(t * 0.00050 + d.phase));
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tR},${tG},${tB},${da.toFixed(4)})`; ctx.fill();
      }
    }

    /* 6 · Constellation filaments — thin, elegant, not neon */
    ctx.save();
    const lb = 0.20 + 0.08 * Math.sin(t * 0.00045);
    for (const [a, b] of ORION_LINES) {
      const ax = ORION[a].x * W + px * 0.50, ay = ORION[a].y * H + py * 0.50;
      const bx = ORION[b].x * W + px * 0.50, by = ORION[b].y * H + py * 0.50;

      /* Outer whisper */
      ctx.lineWidth   = 2.5;
      ctx.strokeStyle = `rgba(${tR},${tG},${tB},0.018)`;
      ctx.shadowBlur  = 0;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

      /* Filament core */
      ctx.lineWidth   = 0.5;
      ctx.strokeStyle = `rgba(${tR},${tG},${tB},${lb.toFixed(3)})`;
      ctx.shadowBlur  = 2.0;
      ctx.shadowColor = `rgba(${tR},${tG},${tB},0.30)`;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    /* 7 · Orion stars — realistic restrained HDR */
    for (const star of ORION) {
      const sx   = star.x * W + px * 0.50;
      const sy   = star.y * H + py * 0.50;
      const br   = (3.0 - star.mag) * 4.2;
      const tw   = 0.96 + 0.04 * Math.sin(t * 0.0011 + star.x * 9);
      const cClr = star.temp === 'warm' ? '255,206,145'
                 : star.temp === 'blue' ? '174,206,255'
                 : '252,252,255';

      /* Outer halo — broad but almost invisible */
      const h1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 4.0 * tw);
      h1.addColorStop(0,    `rgba(${tR},${tG},${tB},0.038)`);
      h1.addColorStop(0.55, `rgba(${tR},${tG},${tB},0.006)`);
      h1.addColorStop(1,    'transparent');
      ctx.beginPath(); ctx.arc(sx, sy, br * 4.0 * tw, 0, Math.PI * 2);
      ctx.fillStyle = h1; ctx.fill();

      /* Soft corona */
      const h2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 1.85 * tw);
      h2.addColorStop(0,    'rgba(255,255,255,0.94)');
      h2.addColorStop(0.26, `rgba(${tR},${tG},${tB},0.52)`);
      h2.addColorStop(0.65, `rgba(${tR},${tG},${tB},0.07)`);
      h2.addColorStop(1,    'transparent');
      ctx.beginPath(); ctx.arc(sx, sy, br * 1.85 * tw, 0, Math.PI * 2);
      ctx.fillStyle = h2; ctx.fill();

      /* Temperature disc */
      const h3 = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 0.65 * tw);
      h3.addColorStop(0, `rgba(${cClr},0.97)`);
      h3.addColorStop(1, `rgba(${cClr},0.16)`);
      ctx.beginPath(); ctx.arc(sx, sy, br * 0.65 * tw, 0, Math.PI * 2);
      ctx.fillStyle = h3; ctx.fill();

      /* White-hot pinpoint */
      ctx.beginPath(); ctx.arc(sx, sy, br * 0.20 * tw, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();

      /* Label */
      ctx.save();
      ctx.font      = '400 7.5px "Space Grotesk",system-ui';
      ctx.fillStyle = `rgba(${tR},${tG},${tB},0.30)`;
      ctx.textAlign = 'center';
      ctx.fillText(star.name, sx, sy - br * 2.3 - 3);
      ctx.restore();
    }

    /* 8 · Deep vignette */
    const vig = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.18, W/2, H/2, Math.max(W,H)*0.82);
    vig.addColorStop(0,    'transparent');
    vig.addColorStop(0.48, 'rgba(0,0,0,0.02)');
    vig.addColorStop(1,    'rgba(0,0,0,0.75)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

    /* 9 · Glass highlight — top-left only */
    const glass = ctx.createLinearGradient(0, 0, W * 0.38, H * 0.20);
    glass.addColorStop(0,   'rgba(255,255,255,0.014)');
    glass.addColorStop(0.5, 'rgba(255,255,255,0.004)');
    glass.addColorStop(1,   'transparent');
    ctx.fillStyle = glass; ctx.fillRect(0, 0, W, H);
  }

  /* ── Shooting stars ── */
  let shootL = null, shootR = null;
  function spawnShoot(canvas) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const angle = (12 + Math.random() * 36) * Math.PI / 180;
    const spd   = 5 + Math.random() * 6;
    return {
      x: Math.random() * W * 0.55, y: Math.random() * H * 0.40,
      dx: Math.cos(angle) * spd, dy: Math.sin(angle) * spd,
      life: 0, maxLife: 20 + Math.random() * 26, trail: [],
    };
  }
  function scheduleShoot() {
    setTimeout(() => {
      if (!shootL) shootL = spawnShoot(skyL);
      if (!shootR) shootR = spawnShoot(skyR);
      scheduleShoot();
    }, 15000 + Math.random() * 13000);
  }
  scheduleShoot();

  /* ── Same Sky Moment — 9 PM local ── */
  const SAME_SKY_HOUR = 21;
  const bodyWrap  = document.querySelector('.starmap-body-wrap');
  const smSection = document.getElementById('starmap');

  const sameOverlay = document.createElement('div');
  sameOverlay.className = 'same-sky-overlay';
  sameOverlay.innerHTML =
    `<div class="same-sky-msg">` +
    `<span class="same-sky-star">✦</span><br>` +
    `Look up.<br>She's watching the same stars right now.<br>` +
    `<span class="same-sky-star">✦</span>` +
    `</div>`;
  bodyWrap?.appendChild(sameOverlay);

  let sameSkyActive = false, sameSkyTimer = null;
  function checkSameSky() {
    const now = new Date();
    const inWindow = now.getHours() === SAME_SKY_HOUR && now.getMinutes() < 5;
    if (inWindow && !sameSkyActive) {
      sameSkyActive = true;
      smSection?.classList.add('same-sky-glow');
      sameOverlay.classList.add('visible');
      clearTimeout(sameSkyTimer);
      sameSkyTimer = setTimeout(() => {
        sameSkyActive = false;
        smSection?.classList.remove('same-sky-glow');
        sameOverlay.classList.remove('visible');
      }, 5 * 60 * 1000);
    } else if (!inWindow && sameSkyActive) {
      sameSkyActive = false;
      smSection?.classList.remove('same-sky-glow');
      sameOverlay.classList.remove('visible');
    }
  }
  checkSameSky();
  setInterval(checkSameSky, 60000);

  /* ── WebGL Portal ── */
  let portalInstance = null, threadClicks = 0, threadClickTimer = null;
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

  /* ── Easter egg ── */
  const MEMORY = `Remember Katogdham?\nWhere we first realised\nthe stars don't care\nabout the distance—\njust like us.`;
  function triggerEasterEgg() {
    if (!easter) return;
    easter.setAttribute('aria-hidden', 'false');
    easter.classList.add('show');
    eText.textContent = '';
    let i = 0;
    const chars = MEMORY.split('');
    const ti = setInterval(() => {
      if (i < chars.length) {
        eText.textContent += chars[i] === '\n' ? '\n' : chars[i]; i++;
      } else {
        clearInterval(ti);
        launchPlane();
        setTimeout(() => { easter.classList.remove('show'); easter.setAttribute('aria-hidden', 'true'); }, 5000);
      }
    }, 58);
    easter.addEventListener('click', () => {
      clearInterval(ti); easter.classList.remove('show'); easter.setAttribute('aria-hidden', 'true');
    }, { once: true });
  }

  function launchPlane() {
    if (!plane) return;
    plane.width = window.innerWidth; plane.height = window.innerHeight;
    const ctx = plane.getContext('2d');
    const parts = []; let px = -40, py = plane.height * 0.5;
    const tvx = 9, tvy = -2.5, ang = Math.atan2(tvy, tvx);
    function drawPlane(x, y, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.strokeStyle = 'rgba(247,201,72,0.95)'; ctx.lineWidth = 2;
      ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(247,201,72,0.7)';
      ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-10,8); ctx.lineTo(-6,0); ctx.lineTo(-10,-8); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    function animPlane() {
      ctx.clearRect(0, 0, plane.width, plane.height);
      px += tvx; py += tvy;
      if (Math.random() < 0.4) parts.push({ x:px, y:py, vx:(Math.random()-.5)*2, vy:Math.random()*1.5, life:40, r:2+Math.random()*3 });
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.x += p.vx; p.y += p.vy; p.life--;
        const a = p.life / 40;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(247,201,72,${(a * 0.7).toFixed(3)})`; ctx.fill();
        if (p.life <= 0) parts.splice(i, 1);
      }
      drawPlane(px, py, ang);
      if (px < plane.width + 80) requestAnimationFrame(animPlane);
      else ctx.clearRect(0, 0, plane.width, plane.height);
    }
    requestAnimationFrame(animPlane);
  }

  /* ── Render loop ── */
  let loopStarted = false, startTime = 0, dataL = null, dataR = null;

  function renderAll(ts) {
    const t = ts - startTime;

    if (!dataL || dataL.W !== skyL.clientWidth || dataL.H !== skyL.clientHeight)
      dataL = initSkyData(skyL, 20240101);
    if (!dataR || dataR.W !== skyR.clientWidth || dataR.H !== skyR.clientHeight)
      dataR = initSkyData(skyR, 20240102);

    drawSkyFull(skyL, dataL,  80, 140, 255, t, WISPS_L);
    drawSkyFull(skyR, dataR, 100, 200, 255, t, WISPS_R);

    /* Shooting star overlay */
    for (const shoot of [{ s: shootL, cv: skyL }, { s: shootR, cv: skyR }]) {
      if (!shoot.s) continue;
      const sc = shoot.cv.getContext('2d'), ss = shoot.s;
      ss.trail.push({ x: ss.x, y: ss.y });
      if (ss.trail.length > 9) ss.trail.shift();
      ss.x += ss.dx; ss.y += ss.dy; ss.life++;
      const sa = 1 - ss.life / ss.maxLife;
      for (let i = 1; i < ss.trail.length; i++) {
        const ta = sa * (i / ss.trail.length) * 0.72;
        sc.save();
        sc.globalAlpha  = ta;
        sc.lineWidth    = Math.max(0.2, 1.5 - i * 0.15);
        sc.strokeStyle  = 'rgba(228,240,255,0.90)';
        sc.shadowBlur   = 5; sc.shadowColor = 'rgba(200,220,255,0.70)';
        sc.beginPath(); sc.moveTo(ss.trail[i-1].x, ss.trail[i-1].y); sc.lineTo(ss.trail[i].x, ss.trail[i].y); sc.stroke();
        sc.restore();
      }
      sc.save(); sc.globalAlpha = sa;
      const hg = sc.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 4);
      hg.addColorStop(0, 'rgba(255,255,255,0.97)'); hg.addColorStop(1, 'transparent');
      sc.beginPath(); sc.arc(ss.x, ss.y, 4, 0, Math.PI * 2); sc.fillStyle = hg; sc.fill();
      sc.restore();
      if (ss.life >= ss.maxLife) {
        if (shoot.s === shootL) shootL = null; else shootR = null;
      }
    }

    requestAnimationFrame(renderAll);
  }

  function startLoop(ts) {
    if (loopStarted) return;
    if (skyL.clientWidth < 4) { requestAnimationFrame(startLoop); return; }
    loopStarted = true;
    startTime   = ts || performance.now();
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
