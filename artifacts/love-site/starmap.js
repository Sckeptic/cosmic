/* starmap.js — Authentic planisphere-style real star charts */

let _shared;

/* ── Edge nebula wisps ── */
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

/* ─────────────────────────────────────────────────────────────────────
   REAL CONSTELLATION DATA — Winter sky (Orion region, looking south)
   Positions normalized [0,1] on canvas. Both maps show same sky but
   Prince's is facing SW and KP's is facing SE (mirrored horizontally).
───────────────────────────────────────────────────────────────────── */

const CONSTELLATIONS = [
  /* ── Orion ── centre piece of the winter sky */
  {
    name: 'Orion',
    lineColor: [100, 160, 255],
    stars: [
      { name: 'Betelgeuse', x: 0.35, y: 0.25, mag: 0.4,  temp: 'warm' },  // α — red supergiant
      { name: 'Bellatrix',  x: 0.60, y: 0.24, mag: 1.6,  temp: 'cool' },  // γ — blue giant
      { name: 'Mintaka',    x: 0.42, y: 0.46, mag: 2.2,  temp: 'cool' },  // δ — belt
      { name: 'Alnilam',    x: 0.50, y: 0.48, mag: 1.7,  temp: 'cool' },  // ε — belt centre
      { name: 'Alnitak',    x: 0.58, y: 0.50, mag: 1.8,  temp: 'cool' },  // ζ — belt
      { name: 'Saiph',      x: 0.37, y: 0.72, mag: 2.1,  temp: 'cool' },  // κ
      { name: 'Rigel',      x: 0.64, y: 0.71, mag: 0.1,  temp: 'blue' },  // β — brightest
    ],
    lines: [[0,1],[0,2],[1,3],[2,3],[3,4],[0,5],[1,6],[5,6]],
  },

  /* ── Canis Major — Sirius is the brightest star in the night sky ── */
  {
    name: 'Canis Major',
    lineColor: [120, 180, 255],
    stars: [
      { name: 'Sirius',  x: 0.56, y: 0.88, mag: -1.4, temp: 'blue'  }, // α — brightest star
      { name: 'Adhara',  x: 0.50, y: 0.95, mag:  1.5, temp: 'blue'  }, // ε
      { name: 'Wezen',   x: 0.62, y: 0.93, mag:  1.8, temp: 'warm'  }, // δ
      { name: 'Mirzam',  x: 0.42, y: 0.83, mag:  2.0, temp: 'blue'  }, // β
      { name: 'Aludra',  x: 0.66, y: 0.97, mag:  2.5, temp: 'blue'  }, // η
    ],
    lines: [[0,1],[0,2],[0,3],[2,4]],
  },

  /* ── Canis Minor ── */
  {
    name: 'Canis Minor',
    lineColor: [140, 200, 255],
    stars: [
      { name: 'Procyon',  x: 0.78, y: 0.47, mag: 0.4, temp: 'warm' }, // α
      { name: 'Gomeisa',  x: 0.82, y: 0.40, mag: 2.9, temp: 'cool' }, // β
    ],
    lines: [[0,1]],
  },

  /* ── Gemini ── */
  {
    name: 'Gemini',
    lineColor: [100, 210, 255],
    stars: [
      { name: 'Pollux', x: 0.72, y: 0.09, mag: 1.1, temp: 'warm' }, // β — actually brighter
      { name: 'Castor',  x: 0.78, y: 0.04, mag: 1.6, temp: 'cool' }, // α
      { name: 'Alhena',  x: 0.68, y: 0.23, mag: 1.9, temp: 'cool' }, // γ
      { name: 'Wasat',   x: 0.74, y: 0.30, mag: 3.5, temp: 'cool' }, // δ (fainter)
      { name: 'Mekbuda', x: 0.66, y: 0.35, mag: 3.8, temp: 'cool' }, // ζ (fainter)
    ],
    lines: [[0,2],[2,3],[3,4],[0,1]],
  },

  /* ── Taurus ── */
  {
    name: 'Taurus',
    lineColor: [160, 140, 255],
    stars: [
      { name: 'Aldebaran', x: 0.18, y: 0.30, mag: 0.9, temp: 'warm' }, // α — deep orange
      { name: 'Elnath',    x: 0.28, y: 0.12, mag: 1.7, temp: 'cool' }, // β
      { name: 'Heka',      x: 0.14, y: 0.20, mag: 3.4, temp: 'cool' }, // λ
      { name: 'δ Tau',     x: 0.20, y: 0.25, mag: 3.8, temp: 'cool' },
    ],
    lines: [[0,1],[0,2],[2,3]],
  },

  /* ── Lepus (Hare, directly below Orion) ── */
  {
    name: 'Lepus',
    lineColor: [100, 140, 220],
    stars: [
      { name: 'Arneb',  x: 0.40, y: 0.85, mag: 2.6, temp: 'warm' }, // α
      { name: 'Nihal',  x: 0.46, y: 0.82, mag: 2.8, temp: 'warm' }, // β
      { name: 'ε Lep',  x: 0.36, y: 0.90, mag: 3.2, temp: 'warm' }, // ε
      { name: 'μ Lep',  x: 0.44, y: 0.90, mag: 3.3, temp: 'cool' }, // μ
    ],
    lines: [[0,1],[0,2],[1,3]],
  },
];

/* Pleiades cluster — rendered separately as a tight group */
const PLEIADES = [
  { x: 0.10, y: 0.17, r: 1.8 },
  { x: 0.12, y: 0.14, r: 2.2 },
  { x: 0.08, y: 0.13, r: 1.4 },
  { x: 0.14, y: 0.12, r: 1.6 },
  { x: 0.09, y: 0.10, r: 1.0 },
  { x: 0.11, y: 0.09, r: 1.2 },
  { x: 0.13, y: 0.08, r: 0.9 },
];

/* ── Mirror a constellation's x-coordinate for KP's sky ── */
function mirrorConst(c) {
  return {
    ...c,
    stars: c.stars.map(s => ({ ...s, x: 1 - s.x })),
  };
}
const CONSTELLATIONS_R = CONSTELLATIONS.map(mirrorConst);
const PLEIADES_R = PLEIADES.map(p => ({ ...p, x: 1 - p.x }));

/* ════════════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════════════ */
export function init(shared) {
  _shared = shared;
  const skyL  = document.getElementById('sky-left');
  const skyR  = document.getElementById('sky-right');
  const easter = document.getElementById('easter-panel');
  const eText  = document.getElementById('easter-text');
  const plane  = document.getElementById('plane-canvas');
  if (!skyL || !skyR) return;

  /* ── Seeded RNG ── */
  function mkRng(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ── Dense background star field ── */
  function buildStarData(rng, W, H) {
    const TOTAL = Math.floor(W * H / 100);
    const stars = [];
    for (let i = 0; i < TOTAL; i++) {
      const roll = rng();
      let size, alpha, tier;
      if (roll < 0.68) {
        size = 0.15 + rng() * 0.55; alpha = 0.15 + rng() * 0.40; tier = 0;
      } else if (roll < 0.91) {
        size = 0.45 + rng() * 0.75; alpha = 0.28 + rng() * 0.42; tier = 1;
      } else {
        size = 0.90 + rng() * 1.10; alpha = 0.48 + rng() * 0.38; tier = 2;
      }
      stars.push({
        x: rng() * W, y: rng() * H, size, alpha,
        phase: rng() * Math.PI * 2, speed: 0.00012 + rng() * 0.00090,
        tier, depth: 0.06 + rng() * 0.94,
        warm: rng() < 0.09, blue: rng() < 0.08,
      });
    }
    return stars;
  }

  function initSkyData(canvas, seed) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (W < 4 || H < 4) return null;
    return { stars: buildStarData(mkRng(seed), W, H), W, H };
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
      g.addColorStop(1.00, 'transparent');
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
  }

  /* ── Draw one star (background field) ── */
  function drawBgStar(ctx, s, t, px, py) {
    const tw = 0.82 + 0.18 * Math.sin(t * s.speed + s.phase);
    const a  = s.alpha * tw;
    const sx = s.x + px * s.depth;
    const sy = s.y + py * s.depth;
    const cr = s.warm ? '255,224,182' : s.blue ? '172,202,255' : '215,230,255';
    if (s.tier === 0) {
      ctx.fillStyle = `rgba(${cr},${a.toFixed(3)})`;
      ctx.fillRect(sx - s.size * 0.5, sy - s.size * 0.5, s.size, s.size);
    } else if (s.tier === 1) {
      const hw = s.size * 2.0;
      const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, hw);
      g.addColorStop(0,    `rgba(${cr},${(a * 0.88).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(${cr},${(a * 0.14).toFixed(3)})`);
      g.addColorStop(1,    'transparent');
      ctx.beginPath(); ctx.arc(sx, sy, hw, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = `rgba(${cr},${a.toFixed(3)})`;
      ctx.fillRect(sx - s.size*0.4, sy - s.size*0.4, s.size*0.8, s.size*0.8);
    } else {
      const hw = s.size * 3.0;
      const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, hw);
      g.addColorStop(0,    `rgba(${cr},${(a * 0.48).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(${cr},${(a * 0.09).toFixed(3)})`);
      g.addColorStop(1,    'transparent');
      ctx.beginPath(); ctx.arc(sx, sy, hw, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr},${Math.min(a, 0.90).toFixed(3)})`; ctx.fill();
    }
  }

  /* ── Draw named constellation stars ── */
  function starRadius(mag) {
    // Brighter = bigger. mag range roughly -1.4 to 3.8
    return Math.max(0.8, (4.2 - mag) * 2.2);
  }

  function starColor(temp) {
    switch (temp) {
      case 'warm': return { core: '255,200,130', halo: '255,170,80'  };  // orange/red
      case 'blue': return { core: '180,210,255', halo: '140,190,255' };  // blue-white
      default:     return { core: '240,245,255', halo: '200,220,255' };  // white/cool
    }
  }

  function drawConstellationStar(ctx, sx, sy, mag, temp, name, t, labelAlpha) {
    const br  = starRadius(mag);
    const tw  = 0.96 + 0.04 * Math.sin(t * 0.0011 + sx * 0.009);
    const col = starColor(temp);

    /* Outer halo */
    const h1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 4.5 * tw);
    h1.addColorStop(0,    `rgba(${col.halo},0.06)`);
    h1.addColorStop(0.55, `rgba(${col.halo},0.01)`);
    h1.addColorStop(1,    'transparent');
    ctx.beginPath(); ctx.arc(sx, sy, br * 4.5 * tw, 0, Math.PI * 2);
    ctx.fillStyle = h1; ctx.fill();

    /* Soft corona */
    const h2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 2.0 * tw);
    h2.addColorStop(0,    'rgba(255,255,255,0.92)');
    h2.addColorStop(0.28, `rgba(${col.halo},0.55)`);
    h2.addColorStop(0.65, `rgba(${col.halo},0.08)`);
    h2.addColorStop(1,    'transparent');
    ctx.beginPath(); ctx.arc(sx, sy, br * 2.0 * tw, 0, Math.PI * 2);
    ctx.fillStyle = h2; ctx.fill();

    /* Coloured disc */
    const h3 = ctx.createRadialGradient(sx, sy, 0, sx, sy, br * 0.7 * tw);
    h3.addColorStop(0, `rgba(${col.core},0.97)`);
    h3.addColorStop(1, `rgba(${col.core},0.18)`);
    ctx.beginPath(); ctx.arc(sx, sy, br * 0.7 * tw, 0, Math.PI * 2);
    ctx.fillStyle = h3; ctx.fill();

    /* White-hot pinpoint */
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.5, br * 0.22 * tw), 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();

    /* Star label */
    if (name && br > 2.5) {
      ctx.save();
      ctx.font = `400 7px "Space Grotesk",system-ui`;
      ctx.fillStyle = `rgba(180,210,255,${(labelAlpha * 0.60).toFixed(3)})`;
      ctx.textAlign = 'center';
      ctx.fillText(name, sx, sy - br * 2.6 - 2);
      ctx.restore();
    }
  }

  /* ── Draw constellation lines ── */
  function drawConstellationLines(ctx, W, H, consts, t) {
    const lb = 0.18 + 0.06 * Math.sin(t * 0.00045);
    for (const c of consts) {
      const [r, g, b] = c.lineColor;
      for (const [a, bb] of c.lines) {
        const sa = c.stars[a], sb = c.stars[bb];
        const ax = sa.x * W, ay = sa.y * H;
        const bx = sb.x * W, by = sb.y * H;
        /* Outer whisper */
        ctx.lineWidth   = 2.0;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.012)`;
        ctx.shadowBlur  = 0;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        /* Filament core */
        ctx.lineWidth   = 0.5;
        ctx.strokeStyle = `rgba(${r},${g},${b},${lb.toFixed(3)})`;
        ctx.shadowBlur  = 3.0;
        ctx.shadowColor = `rgba(${r},${g},${b},0.25)`;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
  }

  /* ── Draw all named stars for a set of constellations ── */
  function drawConstellationStars(ctx, W, H, consts, t) {
    for (const c of consts) {
      for (const s of c.stars) {
        drawConstellationStar(ctx, s.x * W, s.y * H, s.mag, s.temp, s.name, t, 1.0);
      }
    }
  }

  /* ── Draw Pleiades cluster ── */
  function drawPleiades(ctx, W, H, pleiades, t) {
    /* Soft cluster glow */
    const cx = pleiades.reduce((s, p) => s + p.x, 0) / pleiades.length * W;
    const cy = pleiades.reduce((s, p) => s + p.y, 0) / pleiades.length * H;
    const nebG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    nebG.addColorStop(0,   'rgba(120,160,255,0.07)');
    nebG.addColorStop(0.6, 'rgba(80,120,220,0.03)');
    nebG.addColorStop(1,   'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = nebG; ctx.fill();

    for (const p of pleiades) {
      const tw = 0.88 + 0.12 * Math.sin(t * 0.00080 + p.x * 12);
      const a  = 0.65 * tw;
      const sx = p.x * W, sy = p.y * H;
      const hw = p.r * 2.2;
      const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, hw);
      g.addColorStop(0,   `rgba(200,220,255,${(a * 0.85).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(160,200,255,${(a * 0.20).toFixed(3)})`);
      g.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(sx, sy, hw, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, p.r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,240,255,${a.toFixed(3)})`; ctx.fill();
    }

    /* Label */
    ctx.save();
    ctx.font = '400 6.5px "Space Grotesk",system-ui';
    ctx.fillStyle = 'rgba(160,200,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('Pleiades', cx, cy - 18);
    ctx.restore();
  }

  /* ── Compass rose (N/S/E/W) ── */
  function drawCompass(ctx, W, H) {
    const m = 10;
    const dirs = [
      { label: 'N', x: W * 0.50, y: m + 8      },
      { label: 'S', x: W * 0.50, y: H - m - 2  },
      { label: 'E', x: W - m - 4, y: H * 0.50  },
      { label: 'W', x: m + 4,    y: H * 0.50   },
    ];
    ctx.save();
    ctx.font = 'bold 8px "Space Grotesk",system-ui';
    ctx.fillStyle = 'rgba(120,180,255,0.28)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of dirs) ctx.fillText(d.label, d.x, d.y);
    ctx.restore();
  }

  /* ── Grid — altitude circles & azimuth lines ── */
  function drawGrid(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(80,120,200,0.06)';
    ctx.lineWidth = 0.5;
    /* Altitude circles */
    for (let r of [0.25, 0.50, 0.75]) {
      ctx.beginPath();
      ctx.arc(W/2, H/2, Math.min(W, H) * r * 0.48, 0, Math.PI * 2);
      ctx.stroke();
    }
    /* Azimuth lines every 45° */
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      const rx = Math.cos(a) * W * 0.48, ry = Math.sin(a) * H * 0.48;
      ctx.beginPath();
      ctx.moveTo(W/2 - rx, H/2 - ry);
      ctx.lineTo(W/2 + rx, H/2 + ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Circular vignette (planisphere border) ── */
  function drawVignette(ctx, W, H) {
    const cx = W/2, cy = H/2, rMax = Math.max(W, H) * 0.72;
    const vig = ctx.createRadialGradient(cx, cy, Math.min(W,H)*0.28, cx, cy, rMax);
    vig.addColorStop(0,    'transparent');
    vig.addColorStop(0.55, 'rgba(0,0,0,0.04)');
    vig.addColorStop(1,    'rgba(0,0,0,0.82)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  /* ── Main sky draw ── */
  function drawSkyFull(canvas, data, tR, tG, tB, t, wisps, consts, pleiades) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;
    if (W < 4 || H < 4) return;

    /* 1. Deep black base */
    ctx.fillStyle = '#010108';
    ctx.fillRect(0, 0, W, H);

    /* 2. Edge nebula */
    drawNebula(ctx, W, H, wisps, t);

    /* 3. Milky Way hint */
    const mw = ctx.createLinearGradient(W*0.08, H*0.05, W*0.92, H*0.95);
    mw.addColorStop(0,    'transparent');
    mw.addColorStop(0.35, `rgba(${tR},${tG},${tB},0.006)`);
    mw.addColorStop(0.50, `rgba(${tR},${tG},${tB},0.012)`);
    mw.addColorStop(0.65, `rgba(${tR},${tG},${tB},0.006)`);
    mw.addColorStop(1,    'transparent');
    ctx.fillStyle = mw; ctx.fillRect(0, 0, W, H);

    /* 4. Background star field with parallax */
    const px = (mouseX - 0.5) * 5.0;
    const py = (mouseY - 0.5) * 3.0;
    if (data?.stars) {
      for (const s of data.stars) drawBgStar(ctx, s, t, px, py);
    }

    /* 5. Grid & compass (subtle) */
    drawGrid(ctx, W, H);
    drawCompass(ctx, W, H);

    /* 6. Constellation lines */
    ctx.save();
    drawConstellationLines(ctx, W, H, consts, t);
    ctx.restore();

    /* 7. Pleiades cluster */
    drawPleiades(ctx, W, H, pleiades, t);

    /* 8. Named constellation stars */
    drawConstellationStars(ctx, W, H, consts, t);

    /* 9. Vignette */
    drawVignette(ctx, W, H);

    /* 10. Glass highlight */
    const glass = ctx.createLinearGradient(0, 0, W * 0.35, H * 0.18);
    glass.addColorStop(0,   'rgba(255,255,255,0.012)');
    glass.addColorStop(0.5, 'rgba(255,255,255,0.004)');
    glass.addColorStop(1,   'transparent');
    ctx.fillStyle = glass; ctx.fillRect(0, 0, W, H);
  }

  /* ── Shooting stars ── */
  let shootL = null, shootR = null;
  function spawnShoot(canvas) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const angle = (8 + Math.random() * 30) * Math.PI / 180;
    const spd   = 5 + Math.random() * 7;
    return {
      x: Math.random() * W * 0.6, y: Math.random() * H * 0.40,
      dx: Math.cos(angle) * spd, dy: Math.sin(angle) * spd,
      life: 0, maxLife: 20 + Math.random() * 26, trail: [],
    };
  }
  function scheduleShoot() {
    setTimeout(() => {
      if (!shootL) shootL = spawnShoot(skyL);
      if (!shootR) shootR = spawnShoot(skyR);
      scheduleShoot();
    }, 16000 + Math.random() * 14000);
  }
  scheduleShoot();

  function drawShootStar(shoot, canvas) {
    if (!shoot) return;
    const sc = canvas.getContext('2d');
    shoot.trail.push({ x: shoot.x, y: shoot.y });
    if (shoot.trail.length > 9) shoot.trail.shift();
    shoot.x += shoot.dx; shoot.y += shoot.dy; shoot.life++;
    const sa = 1 - shoot.life / shoot.maxLife;
    for (let i = 1; i < shoot.trail.length; i++) {
      const ta = sa * (i / shoot.trail.length) * 0.70;
      sc.save();
      sc.globalAlpha  = ta;
      sc.lineWidth    = Math.max(0.2, 1.5 - i * 0.15);
      sc.strokeStyle  = 'rgba(228,240,255,0.90)';
      sc.shadowBlur   = 5; sc.shadowColor = 'rgba(200,220,255,0.70)';
      sc.beginPath(); sc.moveTo(shoot.trail[i-1].x, shoot.trail[i-1].y);
      sc.lineTo(shoot.trail[i].x, shoot.trail[i].y); sc.stroke();
      sc.restore();
    }
    sc.save(); sc.globalAlpha = sa;
    const hg = sc.createRadialGradient(shoot.x, shoot.y, 0, shoot.x, shoot.y, 4);
    hg.addColorStop(0, 'rgba(255,255,255,0.97)'); hg.addColorStop(1, 'transparent');
    sc.beginPath(); sc.arc(shoot.x, shoot.y, 4, 0, Math.PI * 2);
    sc.fillStyle = hg; sc.fill();
    sc.restore();
  }

  /* ── Same Sky Moment (9 PM) ── */
  const bodyWrap  = document.querySelector('.starmap-body-wrap');
  const smSection = document.getElementById('starmap');
  const sameOverlay = document.createElement('div');
  sameOverlay.className = 'same-sky-overlay';
  sameOverlay.innerHTML =
    `<div class="same-sky-msg"><span class="same-sky-star">✦</span><br>` +
    `Look up.<br>She's watching the same stars right now.<br>` +
    `<span class="same-sky-star">✦</span></div>`;
  bodyWrap?.appendChild(sameOverlay);

  let sameSkyActive = false, sameSkyTimer = null;
  function checkSameSky() {
    const now = new Date();
    const inWindow = now.getHours() === 21 && now.getMinutes() < 5;
    if (inWindow && !sameSkyActive) {
      sameSkyActive = true;
      smSection?.classList.add('same-sky-glow');
      sameOverlay.classList.add('visible');
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

  /* ── Easter egg (triple-click either sky) ── */
  const MEMORY = `Remember Katogdham?\nWhere we first realised\nthe stars don't care\nabout the distance—\njust like us.`;
  let eggClicks = 0, eggTimer = null;
  function handleEggClick() {
    eggClicks++;
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => { eggClicks = 0; }, 2800);
    if (eggClicks >= 3) { eggClicks = 0; triggerEasterEgg(); }
  }
  skyL.addEventListener('click', handleEggClick);
  skyR.addEventListener('click', handleEggClick);

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
        setTimeout(() => {
          easter.classList.remove('show');
          easter.setAttribute('aria-hidden', 'true');
        }, 5000);
      }
    }, 58);
    easter.addEventListener('click', () => {
      clearInterval(ti);
      easter.classList.remove('show');
      easter.setAttribute('aria-hidden', 'true');
    }, { once: true });
  }

  function launchPlane() {
    if (!plane) return;
    plane.width = window.innerWidth; plane.height = window.innerHeight;
    const ctx = plane.getContext('2d');
    const parts = []; let px = -40, py = plane.height * 0.5;
    const tvx = 9, tvy = -2.5, ang = Math.atan2(tvy, tvx);
    function drawP(x, y, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.strokeStyle = 'rgba(247,201,72,0.95)'; ctx.lineWidth = 2;
      ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(247,201,72,0.7)';
      ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-10,8); ctx.lineTo(-6,0);
      ctx.lineTo(-10,-8); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    function anim() {
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
      drawP(px, py, ang);
      if (px < plane.width + 80) requestAnimationFrame(anim);
      else ctx.clearRect(0, 0, plane.width, plane.height);
    }
    requestAnimationFrame(anim);
  }

  /* ── Render loop ── */
  let loopStarted = false, startTime = 0, dataL = null, dataR = null;

  function renderAll(ts) {
    const t = ts - startTime;

    if (!dataL || dataL.W !== skyL.clientWidth || dataL.H !== skyL.clientHeight)
      dataL = initSkyData(skyL, 20240101);
    if (!dataR || dataR.W !== skyR.clientWidth || dataR.H !== skyR.clientHeight)
      dataR = initSkyData(skyR, 20240102);

    drawSkyFull(skyL, dataL, 80, 140, 255, t, WISPS_L, CONSTELLATIONS,   PLEIADES);
    drawSkyFull(skyR, dataR, 100, 200, 255, t, WISPS_R, CONSTELLATIONS_R, PLEIADES_R);

    /* Shooting stars */
    if (shootL) { drawShootStar(shootL, skyL); if (shootL.life >= shootL.maxLife) shootL = null; }
    if (shootR) { drawShootStar(shootR, skyR); if (shootR.life >= shootR.maxLife) shootR = null; }

    requestAnimationFrame(renderAll);
  }

  function startLoop(ts) {
    if (loopStarted) return;
    if (skyL.clientWidth < 4) { requestAnimationFrame(startLoop); return; }
    loopStarted = true;
    startTime   = ts || performance.now();
    renderAll(startTime);
  }

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => { dataL = null; dataR = null; if (!loopStarted) startLoop(); });
    ro.observe(skyL);
  } else {
    setTimeout(startLoop, 200);
  }

  window.addEventListener('resize', () => { dataL = null; dataR = null; }, { passive: true });
}

export function onEnter() {}
