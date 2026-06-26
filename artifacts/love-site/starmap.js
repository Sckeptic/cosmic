/* starmap.js — Cinematic AAA Night Sky (Interstellar / NASA quality) */

import { initPortal } from './portal.js';

let _shared;

/* ── Nebula wisp definitions ── */
const WISPS_L = [
  { cx:0.08, cy:0.88, rx:0.60, ry:0.28, a:-0.28, r:255, g:40,  b:150, o:0.30 },
  { cx:0.90, cy:0.84, rx:0.52, ry:0.26, a: 0.38, r:180, g:0,   b:200, o:0.24 },
  { cx:0.50, cy:1.02, rx:0.75, ry:0.38, a: 0.06, r:150, g:0,   b:210, o:0.20 },
  { cx:0.22, cy:0.60, rx:0.40, ry:0.24, a:-0.45, r:255, g:60,  b:180, o:0.16 },
  { cx:0.78, cy:0.38, rx:0.32, ry:0.18, a: 0.42, r:140, g:0,   b:190, o:0.10 },
  { cx:0.38, cy:0.90, rx:0.26, ry:0.16, a:-0.18, r:255, g:80,  b:200, o:0.22 },
  { cx:0.50, cy:0.72, rx:0.90, ry:0.58, a: 0.00, r:80,  g:0,   b:100, o:0.10 },
  { cx:0.15, cy:0.30, rx:0.28, ry:0.16, a:-0.30, r:200, g:20,  b:180, o:0.08 },
];
const WISPS_R = [
  { cx:0.88, cy:0.70, rx:0.52, ry:0.38, a: 0.42, r:255, g:120, b:0,   o:0.28 },
  { cx:0.12, cy:0.86, rx:0.50, ry:0.26, a:-0.32, r:255, g:150, b:0,   o:0.22 },
  { cx:0.50, cy:1.00, rx:0.68, ry:0.32, a: 0.08, r:200, g:80,  b:0,   o:0.20 },
  { cx:0.68, cy:0.28, rx:0.36, ry:0.20, a: 0.28, r:247, g:200, b:60,  o:0.12 },
  { cx:0.95, cy:0.48, rx:0.34, ry:0.20, a: 0.50, r:255, g:130, b:20,  o:0.24 },
  { cx:0.50, cy:0.68, rx:0.88, ry:0.54, a: 0.00, r:100, g:45,  b:0,   o:0.09 },
  { cx:0.25, cy:0.52, rx:0.30, ry:0.18, a:-0.20, r:220, g:100, b:0,   o:0.10 },
  { cx:0.82, cy:0.20, rx:0.24, ry:0.14, a: 0.35, r:255, g:180, b:40,  o:0.07 },
];

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
    { name: 'Betelgeuse', x: 0.26, y: 0.23, mag: 1.0 },
    { name: 'Bellatrix',  x: 0.68, y: 0.22, mag: 1.2 },
    { name: 'Mintaka',    x: 0.38, y: 0.49, mag: 1.6 },
    { name: 'Alnilam',    x: 0.50, y: 0.51, mag: 1.5 },
    { name: 'Alnitak',    x: 0.62, y: 0.53, mag: 1.5 },
    { name: 'Saiph',      x: 0.28, y: 0.77, mag: 1.6 },
    { name: 'Rigel',      x: 0.72, y: 0.76, mag: 0.8 },
  ];
  const ORION_LINES = [[0,1],[0,2],[1,3],[2,3],[3,4],[0,5],[1,6],[5,6]];

  function buildStarData(rng, W, H) {
    const COUNT = Math.floor((W * H) / 2200);
    const stars = [];
    for (let i = 0; i < COUNT; i++) {
      const r = 0.28 + rng() * 1.3;
      stars.push({
        x: rng() * W, y: rng() * H, r,
        baseAlpha: 0.20 + rng() * 0.70,
        phase:     rng() * Math.PI * 2,
        speed:     0.0005 + rng() * 0.002,
        bright:    rng() < 0.055,
        depth:     0.3 + rng() * 0.7,
      });
    }
    return stars;
  }

  function buildDust(rng, W, H) {
    const COUNT = Math.floor((W * H) / 11000);
    const dust = [];
    for (let i = 0; i < COUNT; i++) {
      dust.push({
        x: rng() * W, y: rng() * H,
        r: 0.7 + rng() * 2.2,
        alpha: 0.02 + rng() * 0.08,
        vx: (rng() - 0.5) * 0.06,
        vy: (rng() - 0.3) * 0.04,
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

  function drawNebula(ctx, W, H, wisps, t) {
    const breath = 0.88 + 0.12 * Math.sin(t * 0.00024);
    for (const w of wisps) {
      const cx = w.cx * W, cy = w.cy * H;
      const rx = w.rx * W, ry = w.ry * H;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(w.a);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0,    `rgba(${w.r},${w.g},${w.b},${w.o * breath})`);
      g.addColorStop(0.35, `rgba(${w.r},${w.g},${w.b},${w.o * 0.50 * breath})`);
      g.addColorStop(0.65, `rgba(${w.r},${w.g},${w.b},${w.o * 0.16 * breath})`);
      g.addColorStop(1,    'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawSkyFull(canvas, data, tintR, tintG, tintB, t, wisps) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    if (W < 4 || H < 4) return;

    ctx.clearRect(0, 0, W, H);

    /* ── 1. Deep space background ── */
    const bg = ctx.createRadialGradient(W*0.5, H*0.4, 0, W*0.5, H*0.5, Math.max(W,H)*0.9);
    bg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.04)`);
    bg.addColorStop(0.6, `rgba(4,1,10,0.5)`);
    bg.addColorStop(1,   `rgba(2,0,6,0.8)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* ── 2. Rich nebula wisps ── */
    drawNebula(ctx, W, H, wisps, t);

    /* ── 3. Background stars with twinkle + parallax ── */
    const px = (mouseX - 0.5) * 8, py = (mouseY - 0.5) * 5;
    if (data?.stars) {
      for (const s of data.stars) {
        const alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * s.speed + s.phase));
        const sx = s.x + px * s.depth, sy = s.y + py * s.depth;

        if (s.bright) {
          const br = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 7);
          br.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${alpha * 0.40})`);
          br.addColorStop(0.4, `rgba(${tintR},${tintG},${tintB},${alpha * 0.08})`);
          br.addColorStop(1,   'transparent');
          ctx.beginPath(); ctx.arc(sx, sy, s.r * 7, 0, Math.PI*2);
          ctx.fillStyle = br; ctx.fill();
        }

        const gw = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 3.5);
        gw.addColorStop(0,   `rgba(215,232,255,${alpha * 0.90})`);
        gw.addColorStop(0.5, `rgba(160,195,255,${alpha * 0.20})`);
        gw.addColorStop(1,   'transparent');
        ctx.beginPath(); ctx.arc(sx, sy, s.r * 3.5, 0, Math.PI*2);
        ctx.fillStyle = gw; ctx.fill();

        ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(238,245,255,${alpha})`;
        ctx.fill();
      }
    }

    /* ── 4. Cosmic dust ── */
    if (data?.dust) {
      for (const d of data.dust) {
        d.x = (d.x + d.vx + W) % W;
        d.y = (d.y + d.vy + H) % H;
        const da = d.alpha * (0.45 + 0.55 * Math.sin(t * 0.00068 + d.phase));
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},${da})`;
        ctx.fill();
      }
    }

    /* ── 5. Constellation energy threads ── */
    const lineBreath = 0.82 + 0.18 * Math.sin(t * 0.0007);
    ctx.save();
    for (const [a, b] of ORION_LINES) {
      const ax = ORION[a].x * W + px * 0.6, ay = ORION[a].y * H + py * 0.6;
      const bx = ORION[b].x * W + px * 0.6, by = ORION[b].y * H + py * 0.6;

      ctx.shadowBlur = 0;
      /* Wide outer glow */
      ctx.lineWidth = 16;
      ctx.strokeStyle = `rgba(${tintR},${tintG},${tintB},${0.06 * lineBreath})`;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();

      /* Medium glow */
      ctx.lineWidth = 6;
      ctx.strokeStyle = `rgba(${tintR},${tintG},${tintB},${0.22 * lineBreath})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${tintR},${tintG},${tintB},0.7)`;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();

      /* Bright inner core */
      const lg = ctx.createLinearGradient(ax, ay, bx, by);
      lg.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},${0.75 * lineBreath})`);
      lg.addColorStop(0.5, `rgba(255,255,255,${0.90 * lineBreath})`);
      lg.addColorStop(1,   `rgba(${tintR},${tintG},${tintB},${0.75 * lineBreath})`);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = lg;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    /* ── 6. Orion constellation stars — HDR multi-layer bloom ── */
    for (const star of ORION) {
      const sx = star.x * W + px * 0.6, sy = star.y * H + py * 0.6;
      const br = (3.0 - star.mag) * 8.5;
      const tw = 0.90 + 0.10 * Math.sin(t * 0.0016 + star.x * 14);

      /* Outer ultra-wide halo */
      const h1 = ctx.createRadialGradient(sx,sy,0, sx,sy, br*6.5*tw);
      h1.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.12)`);
      h1.addColorStop(0.4, `rgba(${tintR},${tintG},${tintB},0.04)`);
      h1.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(sx,sy, br*6.5*tw, 0, Math.PI*2);
      ctx.fillStyle = h1; ctx.fill();

      /* Mid bloom */
      const h2 = ctx.createRadialGradient(sx,sy,0, sx,sy, br*3.5*tw);
      h2.addColorStop(0,   `rgba(${tintR},${tintG},${tintB},0.35)`);
      h2.addColorStop(0.5, `rgba(${tintR},${tintG},${tintB},0.10)`);
      h2.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(sx,sy, br*3.5*tw, 0, Math.PI*2);
      ctx.fillStyle = h2; ctx.fill();

      /* Inner corona */
      const h3 = ctx.createRadialGradient(sx,sy,0, sx,sy, br*1.8*tw);
      h3.addColorStop(0,   `rgba(255,255,255,0.95)`);
      h3.addColorStop(0.3, `rgba(${tintR},${tintG},${tintB},0.75)`);
      h3.addColorStop(0.7, `rgba(${tintR},${tintG},${tintB},0.25)`);
      h3.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(sx,sy, br*1.8*tw, 0, Math.PI*2);
      ctx.fillStyle = h3; ctx.fill();

      /* White-hot core */
      ctx.beginPath(); ctx.arc(sx,sy, br*0.42*tw, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff'; ctx.fill();

      /* Star name label */
      ctx.save();
      ctx.font = '500 10px "Space Grotesk", system-ui';
      ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},0.65)`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${tintR},${tintG},${tintB},0.8)`;
      ctx.fillText(star.name, sx, sy - br * 2.2 - 6);
      ctx.restore();
    }

    /* ── 7. Atmospheric fog at bottom ── */
    const fog = ctx.createLinearGradient(0, H*0.68, 0, H);
    fog.addColorStop(0, 'transparent');
    fog.addColorStop(1, `rgba(${tintR},${tintG},${tintB},0.04)`);
    ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H);

    /* ── 8. Glass reflection shimmer ── */
    const glass = ctx.createLinearGradient(0, 0, W*0.5, H*0.28);
    glass.addColorStop(0,   'rgba(255,255,255,0.028)');
    glass.addColorStop(0.4, 'rgba(255,255,255,0.009)');
    glass.addColorStop(1,   'transparent');
    ctx.fillStyle = glass; ctx.fillRect(0, 0, W, H);

    /* ── 9. Vignette ── */
    const vig = ctx.createRadialGradient(W/2,H/2, Math.min(W,H)*0.25, W/2,H/2, Math.max(W,H)*0.82);
    vig.addColorStop(0,    'transparent');
    vig.addColorStop(0.60, 'rgba(0,0,0,0.05)');
    vig.addColorStop(1,    'rgba(0,0,0,0.65)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  /* ── Shooting stars ── */
  let shootL = null, shootR = null;
  function spawnShoot(canvas) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const angle = (18 + Math.random() * 35) * Math.PI / 180;
    const spd   = 6 + Math.random() * 6;
    return { x: Math.random()*W*0.55, y: Math.random()*H*0.38,
             dx: Math.cos(angle)*spd, dy: Math.sin(angle)*spd,
             life: 0, maxLife: 26+Math.random()*24, trail: [] };
  }
  function scheduleShoot() {
    setTimeout(() => {
      if (!shootL) shootL = spawnShoot(skyL);
      if (!shootR) shootR = spawnShoot(skyR);
      scheduleShoot();
    }, 15000 + Math.random()*10000);
  }
  scheduleShoot();

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
      if (i < chars.length) { eText.textContent += chars[i]==='\n' ? '\n' : chars[i]; i++; }
      else { clearInterval(ti); launchPlane(); setTimeout(() => { easter.classList.remove('show'); easter.setAttribute('aria-hidden','true'); }, 5000); }
    }, 58);
    easter.addEventListener('click', () => { clearInterval(ti); easter.classList.remove('show'); easter.setAttribute('aria-hidden','true'); }, { once:true });
  }

  function launchPlane() {
    if (!plane) return;
    plane.width = window.innerWidth; plane.height = window.innerHeight;
    const ctx = plane.getContext('2d');
    const parts = []; let px=-40, py=plane.height*0.5;
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
      if (Math.random()<0.4) parts.push({x:px,y:py,vx:(Math.random()-0.5)*2,vy:Math.random()*1.5,life:40,r:2+Math.random()*3});
      for (let i=parts.length-1;i>=0;i--) {
        const p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.life--;
        const a=p.life/40;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2);
        ctx.fillStyle=`rgba(247,201,72,${a*0.7})`; ctx.fill();
        if (p.life<=0) parts.splice(i,1);
      }
      drawPlane(px,py,ang);
      if (px<plane.width+80) requestAnimationFrame(animPlane);
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

    /* Shooting star compositing */
    for (const shoot of [{s:shootL,cv:skyL},{s:shootR,cv:skyR}]) {
      if (!shoot.s) continue;
      const sc=shoot.cv.getContext('2d'), ss=shoot.s;
      ss.trail.push({x:ss.x,y:ss.y});
      if (ss.trail.length>12) ss.trail.shift();
      ss.x+=ss.dx; ss.y+=ss.dy; ss.life++;
      const sa=1-ss.life/ss.maxLife;
      for (let i=1;i<ss.trail.length;i++) {
        const ta=sa*(i/ss.trail.length)*0.9;
        sc.save();
        sc.globalAlpha=ta;
        sc.lineWidth=Math.max(0.3,2.5-i*0.2);
        sc.strokeStyle='rgba(240,248,255,0.95)';
        sc.shadowBlur=12; sc.shadowColor='rgba(210,230,255,0.9)';
        sc.beginPath(); sc.moveTo(ss.trail[i-1].x,ss.trail[i-1].y); sc.lineTo(ss.trail[i].x,ss.trail[i].y); sc.stroke();
        sc.restore();
      }
      sc.save(); sc.globalAlpha=sa;
      const hg=sc.createRadialGradient(ss.x,ss.y,0,ss.x,ss.y,8);
      hg.addColorStop(0,'rgba(255,255,255,0.98)');
      hg.addColorStop(0.5,'rgba(200,228,255,0.4)');
      hg.addColorStop(1,'transparent');
      sc.beginPath(); sc.arc(ss.x,ss.y,8,0,Math.PI*2);
      sc.fillStyle=hg; sc.fill(); sc.restore();
      if (ss.life>=ss.maxLife) { if(shoot.s===shootL) shootL=null; else shootR=null; }
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
