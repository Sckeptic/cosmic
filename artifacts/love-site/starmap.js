/* starmap.js — Cinematic Realism: NASA / JWST / Interstellar aesthetic */

import { initPortal } from './portal.js';

let _shared;

/* ── Nebula wisps — muted, barely perceptible, real-space palette ── */
const WISPS_L = [
  { cx:0.07, cy:0.90, rx:0.58, ry:0.26, a:-0.28, r:195, g:55,  b:135, o:0.044 },
  { cx:0.91, cy:0.85, rx:0.50, ry:0.24, a: 0.38, r:140, g:22,  b:170, o:0.034 },
  { cx:0.50, cy:1.04, rx:0.74, ry:0.36, a: 0.06, r:110, g:12,  b:165, o:0.028 },
  { cx:0.20, cy:0.58, rx:0.38, ry:0.22, a:-0.45, r:185, g:55,  b:148, o:0.022 },
  { cx:0.76, cy:0.36, rx:0.30, ry:0.17, a: 0.42, r:110, g:12,  b:155, o:0.015 },
  { cx:0.36, cy:0.92, rx:0.24, ry:0.14, a:-0.18, r:210, g:72,  b:165, o:0.030 },
  { cx:0.50, cy:0.70, rx:0.88, ry:0.56, a: 0.00, r:55,  g:8,   b:85,  o:0.014 },
  { cx:0.14, cy:0.28, rx:0.26, ry:0.15, a:-0.30, r:165, g:28,  b:148, o:0.012 },
];
const WISPS_R = [
  { cx:0.88, cy:0.68, rx:0.50, ry:0.36, a: 0.42, r:188, g:105, b:22,  o:0.040 },
  { cx:0.11, cy:0.87, rx:0.48, ry:0.24, a:-0.32, r:195, g:118, b:28,  o:0.032 },
  { cx:0.50, cy:1.02, rx:0.66, ry:0.30, a: 0.08, r:158, g:65,  b:10,  o:0.028 },
  { cx:0.66, cy:0.26, rx:0.34, ry:0.18, a: 0.28, r:185, g:158, b:55,  o:0.018 },
  { cx:0.94, cy:0.46, rx:0.32, ry:0.18, a: 0.50, r:196, g:105, b:18,  o:0.034 },
  { cx:0.50, cy:0.66, rx:0.86, ry:0.52, a: 0.00, r:82,  g:37,  b:5,   o:0.013 },
  { cx:0.22, cy:0.50, rx:0.28, ry:0.16, a:-0.20, r:168, g:85,  b:10,  o:0.016 },
  { cx:0.80, cy:0.19, rx:0.22, ry:0.13, a: 0.35, r:205, g:150, b:48,  o:0.010 },
];

/* ── Orion constellation ── */
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

  function mkRng(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ── Stars: three depth tiers + embedded clusters ── */
  function buildStarData(rng, W, H) {
    const TOTAL = Math.floor((W * H) / 1650);
    const stars = [];

    for (let i = 0; i < TOTAL; i++) {
      const roll = rng();
      let r, baseAlpha, speed, tier;
      if (roll < 0.63) {
        r = 0.10 + rng() * 0.28; baseAlpha = 0.08 + rng() * 0.24;
        speed = 0.0002 + rng() * 0.0010; tier = 0;
      } else if (roll < 0.90) {
        r = 0.28 + rng() * 0.44; baseAlpha = 0.18 + rng() * 0.36;
        speed = 0.0003 + rng() * 0.0013; tier = 1;
      } else {
        r = 0.58 + rng() * 0.72; baseAlpha = 0.35 + rng() * 0.38;
        speed = 0.0004 + rng() * 0.0018; tier = 2;
      }
      stars.push({
        x: rng() * W, y: rng() * H, r, baseAlpha,
        phase: rng() * Math.PI * 2, speed, tier,
        depth: 0.12 + rng() * 0.88,
        warm: rng() < 0.12,
      });
    }

    /* Star clusters — dense pockets of tiny stars */
    const nClusters = 3 + Math.floor(rng() * 3);
    for (let c = 0; c < nClusters; c++) {
      const cx = (0.06 + rng() * 0.88) * W;
      const cy = (0.06 + rng() * 0.88) * H;
      const cr = (0.035 + rng() * 0.065) * Math.min(W, H);
      const n  = 8 + Math.floor(rng() * 13);
      for (let i = 0; i < n; i++) {
        const ang = rng() * Math.PI * 2;
        const d   = Math.sqrt(rng()) * cr;
        stars.push({
          x: cx + Math.cos(ang) * d, y: cy + Math.sin(ang) * d,
          r: 0.09 + rng() * 0.20, baseAlpha: 0.10 + rng() * 0.26,
          phase: rng() * Math.PI * 2, speed: 0.0002 + rng() * 0.0008,
          tier: 0, depth: 0.08 + rng() * 0.18, warm: false,
        });
      }
    }
    return stars;
  }

  /* ── Cosmic dust ── */
  function buildDust(rng, W, H) {
    const COUNT = Math.floor((W * H) / 18000);
    const dust = [];
    for (let i = 0; i < COUNT; i++) {
      dust.push({
        x: rng() * W, y: rng() * H,
        r: 0.4 + rng() * 1.1,
        alpha: 0.010 + rng() * 0.038,
        vx: (rng() - 0.5) * 0.045, vy: (rng() - 0.28) * 0.030,
        phase: rng() * Math.PI * 2,
      });
    }
    return dust;
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

  /* ── Nebula wisps ── */
  function drawNebula(ctx, W, H, wisps, t) {
    const breath = 0.92 + 0.08 * Math.sin(t * 0.00022);
    for (const w of wisps) {
      const cx = w.cx * W, cy = w.cy * H;
      const rx = w.rx * W, ry = w.ry * H;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(w.a); ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0,    `rgba(${w.r},${w.g},${w.b},${w.o * breath})`);
      g.addColorStop(0.38, `rgba(${w.r},${w.g},${w.b},${w.o * 0.44 * breath})`);
      g.addColorStop(0.68, `rgba(${w.r},${w.g},${w.b},${w.o * 0.12 * breath})`);
      g.addColorStop(1,    'transparent');
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
  }

  /* ── Main sky renderer ── */
  function drawSkyFull(canvas, data, tintR, tintG, tintB, t, wisps) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    if (W < 4 || H < 4) return;

    ctx.clearRect(0, 0, W, H);

    /* 1 · Deep black space background */
    const bg = ctx.createRadialGradient(W*0.5, H*0.38, 0, W*0.5, H*0.5, Math.max(W,H)*0.85);
    bg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.030)`);
    bg.addColorStop(0.7, 'rgba(3,1,8,0.60)');
    bg.addColorStop(1,   'rgba(1,0,4,0.85)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* 2 · Nebula wisps (very subtle) */
    drawNebula(ctx, W, H, wisps, t);

    /* 3 · Milky Way dust band (faint diagonal) */
    const mw = ctx.createLinearGradient(0, H * 0.08, W, H * 0.92);
    mw.addColorStop(0,    'transparent');
    mw.addColorStop(0.32, `rgba(${tintR},${tintG},${tintB},0.010)`);
    mw.addColorStop(0.46, `rgba(${tintR},${tintG},${tintB},0.018)`);
    mw.addColorStop(0.58, `rgba(${tintR},${tintG},${tintB},0.010)`);
    mw.addColorStop(1,    'transparent');
    ctx.fillStyle = mw; ctx.fillRect(0, 0, W, H);

    /* 4 · Background stars — depth tiers */
    const px = (mouseX - 0.5) * 7, py = (mouseY - 0.5) * 4.5;
    if (data?.stars) {
      for (const s of data.stars) {
        const tw = 0.76 + 0.24 * Math.sin(t * s.speed + s.phase);
        const alpha = s.baseAlpha * tw;
        const sx = s.x + px * s.depth, sy = s.y + py * s.depth;

        if (s.tier === 0) {
          /* Distant: single pixel-like point, no gradient overhead */
          ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
          ctx.fillStyle = s.warm
            ? `rgba(255,232,195,${alpha})`
            : `rgba(208,228,255,${alpha})`;
          ctx.fill();
        } else if (s.tier === 1) {
          /* Mid-distance: tiny diffuse halo */
          const hw = s.r * 2.4;
          const gw = ctx.createRadialGradient(sx,sy,0,sx,sy,hw);
          gw.addColorStop(0,   `rgba(215,232,255,${alpha * 0.72})`);
          gw.addColorStop(0.6, `rgba(200,220,255,${alpha * 0.15})`);
          gw.addColorStop(1,   'transparent');
          ctx.beginPath(); ctx.arc(sx,sy,hw,0,Math.PI*2);
          ctx.fillStyle = gw; ctx.fill();
          ctx.beginPath(); ctx.arc(sx,sy,s.r*0.55,0,Math.PI*2);
          ctx.fillStyle = `rgba(232,244,255,${alpha})`; ctx.fill();
        } else {
          /* Closer: soft restrained bloom */
          const hw = s.r * 3.6;
          const gw = ctx.createRadialGradient(sx,sy,0,sx,sy,hw);
          gw.addColorStop(0,   `rgba(220,236,255,${alpha * 0.60})`);
          gw.addColorStop(0.5, `rgba(200,222,255,${alpha * 0.12})`);
          gw.addColorStop(1,   'transparent');
          ctx.beginPath(); ctx.arc(sx,sy,hw,0,Math.PI*2);
          ctx.fillStyle = gw; ctx.fill();
          ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2);
          ctx.fillStyle = `rgba(238,247,255,${alpha})`; ctx.fill();
        }
      }
    }

    /* 5 · Cosmic dust drift */
    if (data?.dust) {
      for (const d of data.dust) {
        d.x = (d.x + d.vx + W) % W;
        d.y = (d.y + d.vy + H) % H;
        const da = d.alpha * (0.5 + 0.5 * Math.sin(t * 0.00060 + d.phase));
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},${da})`; ctx.fill();
      }
    }

    /* 6 · Constellation lines — thin elegant optical filaments */
    const lineBreath = 0.24 + 0.10 * Math.sin(t * 0.0006);
    ctx.save();
    for (const [a, b] of ORION_LINES) {
      const ax = ORION[a].x*W+px*0.6, ay = ORION[a].y*H+py*0.6;
      const bx = ORION[b].x*W+px*0.6, by = ORION[b].y*H+py*0.6;

      /* Outer diffusion — barely visible */
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = `rgba(${tintR},${tintG},${tintB},0.030)`;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();

      /* Sharp filament core */
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = `rgba(${tintR},${tintG},${tintB},${lineBreath})`;
      ctx.shadowBlur = 3;
      ctx.shadowColor = `rgba(${tintR},${tintG},${tintB},0.40)`;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    /* 7 · Orion stars — realistic, restrained HDR */
    for (const star of ORION) {
      const sx = star.x*W+px*0.6, sy = star.y*H+py*0.6;
      const br = (3.0 - star.mag) * 4.4;
      const tw = 0.94 + 0.06 * Math.sin(t * 0.0013 + star.x * 12);

      /* Star color based on temperature */
      const coreClr = star.temp === 'warm' ? '255,210,155'
                    : star.temp === 'blue'  ? '180,210,255'
                    : '255,255,255';

      /* Outer halo — very faint falloff */
      const h1 = ctx.createRadialGradient(sx,sy,0, sx,sy, br*4.8*tw);
      h1.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.055)`);
      h1.addColorStop(0.45,`rgba(${tintR},${tintG},${tintB},0.012)`);
      h1.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(sx,sy, br*4.8*tw, 0, Math.PI*2);
      ctx.fillStyle = h1; ctx.fill();

      /* Soft corona */
      const h2 = ctx.createRadialGradient(sx,sy,0, sx,sy, br*2.2*tw);
      h2.addColorStop(0,   `rgba(255,255,255,0.88)`);
      h2.addColorStop(0.30,`rgba(${tintR},${tintG},${tintB},0.48)`);
      h2.addColorStop(0.68,`rgba(${tintR},${tintG},${tintB},0.09)`);
      h2.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(sx,sy, br*2.2*tw, 0, Math.PI*2);
      ctx.fillStyle = h2; ctx.fill();

      /* Temperature-tinted inner disc */
      const h3 = ctx.createRadialGradient(sx,sy,0, sx,sy, br*0.75*tw);
      h3.addColorStop(0,   `rgba(${coreClr},0.95)`);
      h3.addColorStop(1,   `rgba(${coreClr},0.20)`);
      ctx.beginPath(); ctx.arc(sx,sy, br*0.75*tw, 0, Math.PI*2);
      ctx.fillStyle = h3; ctx.fill();

      /* White-hot pinpoint */
      ctx.beginPath(); ctx.arc(sx,sy, br*0.26*tw, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff'; ctx.fill();

      /* Label */
      ctx.save();
      ctx.font = '400 8px "Space Grotesk", system-ui';
      ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},0.38)`;
      ctx.textAlign = 'center';
      ctx.fillText(star.name, sx, sy - br*2.6 - 4);
      ctx.restore();
    }

    /* 8 · Atmospheric bottom haze */
    const fog = ctx.createLinearGradient(0, H*0.72, 0, H);
    fog.addColorStop(0, 'transparent');
    fog.addColorStop(1, `rgba(${tintR},${tintG},${tintB},0.030)`);
    ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H);

    /* 9 · Subtle glass highlight */
    const glass = ctx.createLinearGradient(0, 0, W*0.48, H*0.26);
    glass.addColorStop(0,   'rgba(255,255,255,0.020)');
    glass.addColorStop(0.4, 'rgba(255,255,255,0.006)');
    glass.addColorStop(1,   'transparent');
    ctx.fillStyle = glass; ctx.fillRect(0, 0, W, H);

    /* 10 · Deep edge vignette */
    const vig = ctx.createRadialGradient(W/2,H/2, Math.min(W,H)*0.22, W/2,H/2, Math.max(W,H)*0.84);
    vig.addColorStop(0,    'transparent');
    vig.addColorStop(0.55, 'rgba(0,0,0,0.04)');
    vig.addColorStop(1,    'rgba(0,0,0,0.68)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  /* ── Shooting stars ── */
  let shootL = null, shootR = null;
  function spawnShoot(canvas) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const angle = (16 + Math.random() * 36) * Math.PI / 180;
    const spd   = 5 + Math.random() * 6;
    return { x: Math.random()*W*0.55, y: Math.random()*H*0.38,
             dx: Math.cos(angle)*spd, dy: Math.sin(angle)*spd,
             life: 0, maxLife: 24+Math.random()*26, trail: [] };
  }
  function scheduleShoot() {
    setTimeout(() => {
      if (!shootL) shootL = spawnShoot(skyL);
      if (!shootR) shootR = spawnShoot(skyR);
      scheduleShoot();
    }, 15000 + Math.random() * 10000);
  }
  scheduleShoot();

  /* ── Same Sky Moment ── */
  const SAME_SKY_HOUR = 21; // 9 PM local time
  const bodyWrap = document.querySelector('.starmap-body-wrap');
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
    easter.setAttribute('aria-hidden','false'); easter.classList.add('show');
    eText.textContent = '';
    let i = 0;
    const chars = MEMORY.split('');
    const ti = setInterval(() => {
      if (i < chars.length) { eText.textContent += chars[i]==='\n'?'\n':chars[i]; i++; }
      else { clearInterval(ti); launchPlane(); setTimeout(()=>{ easter.classList.remove('show'); easter.setAttribute('aria-hidden','true'); }, 5000); }
    }, 58);
    easter.addEventListener('click', ()=>{ clearInterval(ti); easter.classList.remove('show'); easter.setAttribute('aria-hidden','true'); }, {once:true});
  }

  function launchPlane() {
    if (!plane) return;
    plane.width = window.innerWidth; plane.height = window.innerHeight;
    const ctx = plane.getContext('2d');
    const parts=[]; let px=-40, py=plane.height*0.5;
    const tvx=9, tvy=-2.5, ang=Math.atan2(tvy,tvx);
    function drawPlane(x,y,a) {
      ctx.save(); ctx.translate(x,y); ctx.rotate(a);
      ctx.strokeStyle='rgba(247,201,72,0.95)'; ctx.lineWidth=2;
      ctx.shadowBlur=14; ctx.shadowColor='rgba(247,201,72,0.7)';
      ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-10,8); ctx.lineTo(-6,0); ctx.lineTo(-10,-8); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    function animPlane() {
      ctx.clearRect(0,0,plane.width,plane.height);
      px+=tvx; py+=tvy;
      if (Math.random()<0.4) parts.push({x:px,y:py,vx:(Math.random()-.5)*2,vy:Math.random()*1.5,life:40,r:2+Math.random()*3});
      for (let i=parts.length-1;i>=0;i--) {
        const p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.life--;
        const a=p.life/40;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2);
        ctx.fillStyle=`rgba(247,201,72,${a*0.7})`; ctx.fill();
        if(p.life<=0) parts.splice(i,1);
      }
      drawPlane(px,py,ang);
      if(px<plane.width+80) requestAnimationFrame(animPlane);
      else ctx.clearRect(0,0,plane.width,plane.height);
    }
    requestAnimationFrame(animPlane);
  }

  /* ── Main render loop ── */
  let loopStarted=false, startTime=0, dataL=null, dataR=null;

  function renderAll(ts) {
    const t = ts - startTime;

    if (!dataL || dataL.W!==skyL.clientWidth || dataL.H!==skyL.clientHeight)
      dataL = initSkyData(skyL, 20240101);
    if (!dataR || dataR.W!==skyR.clientWidth || dataR.H!==skyR.clientHeight)
      dataR = initSkyData(skyR, 20240102);

    drawSkyFull(skyL, dataL, 255, 107, 157, t, WISPS_L);
    drawSkyFull(skyR, dataR, 247, 201,  72, t, WISPS_R);

    /* Shooting star overlay */
    for (const shoot of [{s:shootL,cv:skyL},{s:shootR,cv:skyR}]) {
      if (!shoot.s) continue;
      const sc=shoot.cv.getContext('2d'), ss=shoot.s;
      ss.trail.push({x:ss.x,y:ss.y});
      if(ss.trail.length>10) ss.trail.shift();
      ss.x+=ss.dx; ss.y+=ss.dy; ss.life++;
      const sa=1-ss.life/ss.maxLife;
      for(let i=1;i<ss.trail.length;i++){
        const ta=sa*(i/ss.trail.length)*0.80;
        sc.save(); sc.globalAlpha=ta;
        sc.lineWidth=Math.max(0.2, 1.8-i*0.18);
        sc.strokeStyle='rgba(235,245,255,0.90)';
        sc.shadowBlur=8; sc.shadowColor='rgba(210,228,255,0.80)';
        sc.beginPath(); sc.moveTo(ss.trail[i-1].x,ss.trail[i-1].y); sc.lineTo(ss.trail[i].x,ss.trail[i].y); sc.stroke();
        sc.restore();
      }
      sc.save(); sc.globalAlpha=sa;
      const hg=sc.createRadialGradient(ss.x,ss.y,0,ss.x,ss.y,5);
      hg.addColorStop(0,'rgba(255,255,255,0.95)'); hg.addColorStop(1,'transparent');
      sc.beginPath(); sc.arc(ss.x,ss.y,5,0,Math.PI*2); sc.fillStyle=hg; sc.fill();
      sc.restore();
      if(ss.life>=ss.maxLife){ if(shoot.s===shootL) shootL=null; else shootR=null; }
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
      dataL=null; dataR=null;
      if (!loopStarted) startLoop();
    });
    ro.observe(skyL);
  } else {
    setTimeout(startLoop, 200);
  }

  window.addEventListener('resize', () => { dataL=null; dataR=null; }, { passive:true });
}

export function onEnter() {}
