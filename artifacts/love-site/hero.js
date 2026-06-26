/* hero.js — Realistic ECG heartbeat between two glowing nodes */

let _shared, _canvas, _ctx, _W, _H, _rafId;

/*
  Real ECG waveform: flat → P wave → PR interval → QRS complex → ST → T wave → flat
  Each segment: { dx: horizontal fraction, dy: amplitude (-1 to 1, 0 = baseline) }
  Positive dy = above baseline (upward), negative = below
*/
const SEGMENTS = [
  { dx: 0.07,  dy:  0     },  // flat baseline
  { dx: 0.025, dy:  0.08  },  // P wave rise
  { dx: 0.02,  dy:  0.14  },  // P wave peak
  { dx: 0.025, dy:  0.08  },  // P wave descent
  { dx: 0.02,  dy:  0     },  // back to baseline
  { dx: 0.04,  dy:  0     },  // PR interval (flat)
  { dx: 0.012, dy: -0.10  },  // Q dip (small down)
  { dx: 0.018, dy:  0.92  },  // R spike — tall upward peak (the real heartbeat spike)
  { dx: 0.018, dy: -0.22  },  // S dip below baseline
  { dx: 0.018, dy:  0     },  // return to baseline
  { dx: 0.04,  dy:  0     },  // ST segment (flat)
  { dx: 0.035, dy:  0.18  },  // T wave rise
  { dx: 0.045, dy:  0.28  },  // T wave peak (gentle hump)
  { dx: 0.035, dy:  0.18  },  // T wave descent
  { dx: 0.025, dy:  0     },  // back to baseline
  { dx: 0.08,  dy:  0     },  // flat after T (inter-beat silence)
];

function buildBeat() {
  const pts = [{ x: 0, y: 0 }];
  let cx = 0;
  for (const seg of SEGMENTS) {
    cx += seg.dx;
    pts.push({ x: cx, y: seg.dy });
  }
  const mx = pts[pts.length - 1].x;
  pts.forEach(p => p.x /= mx);
  return pts;
}
const beatPts = buildBeat();

function sampleBeat(t) {
  t = ((t % 1) + 1) % 1;
  for (let i = 1; i < beatPts.length; i++) {
    if (t <= beatPts[i].x) {
      const a = beatPts[i - 1], b = beatPts[i];
      const f = (t - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * f;
    }
  }
  return 0;
}

function resize() {
  if (!_canvas) return;
  const wrap = _canvas.parentElement;
  _W = _canvas.width  = wrap.clientWidth  || window.innerWidth;
  _H = _canvas.height = wrap.clientHeight || 110;
}

let offset = 0;
const STEPS = 700;

/* Track peak (R-spike) position for the glowing dot */
let peakT = 0;
function findPeakT() {
  let maxY = -Infinity, best = 0;
  for (let i = 0; i < 200; i++) {
    const t = i / 200;
    const y = sampleBeat(t);
    if (y > maxY) { maxY = y; best = t; }
  }
  peakT = best;
}
findPeakT();

function draw() {
  if (!_canvas || !_ctx) { _rafId = requestAnimationFrame(draw); return; }
  if (_shared?.reducedMotion) { _rafId = requestAnimationFrame(draw); return; }

  _ctx.clearRect(0, 0, _W, _H);

  const amp   = _H * 0.38 * (1 + (_shared?.musicReactive || 0) * 0.45);
  const speed = 0.0012 + (_shared?.musicReactive || 0) * 0.0006;
  offset = (offset + speed) % 1;
  const midY = _H * 0.55;

  /* ── Soft ambient glow behind the line ── */
  _ctx.save();
  _ctx.filter = 'blur(6px)';
  _ctx.globalAlpha = 0.18;
  _ctx.lineWidth   = 8;
  _ctx.strokeStyle = '#FF6B9D';
  _ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const nx = i / STEPS;
    const y  = midY - sampleBeat((nx + offset) % 1) * amp;
    i === 0 ? _ctx.moveTo(0, y) : _ctx.lineTo(nx * _W, y);
  }
  _ctx.stroke();
  _ctx.restore();

  /* ── Main ECG line with gradient ── */
  _ctx.save();
  _ctx.lineWidth = 1.8;
  _ctx.lineJoin  = 'round';
  _ctx.lineCap   = 'round';
  _ctx.shadowBlur  = 16;
  _ctx.shadowColor = 'rgba(255,100,160,0.6)';

  const grad = _ctx.createLinearGradient(0, 0, _W, 0);
  grad.addColorStop(0,    'rgba(255,107,157,0.0)');
  grad.addColorStop(0.05, 'rgba(255,107,157,0.9)');
  grad.addColorStop(0.35, 'rgba(255,80,140,1)');
  grad.addColorStop(0.50, 'rgba(255,160,190,1)');
  grad.addColorStop(0.65, 'rgba(247,201,72,0.9)');
  grad.addColorStop(0.95, 'rgba(255,107,157,0.9)');
  grad.addColorStop(1,    'rgba(255,107,157,0.0)');
  _ctx.strokeStyle = grad;

  _ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const nx = i / STEPS;
    const y  = midY - sampleBeat((nx + offset) % 1) * amp;
    i === 0 ? _ctx.moveTo(0, y) : _ctx.lineTo(nx * _W, y);
  }
  _ctx.stroke();
  _ctx.restore();

  /* ── Travelling glowing dot — rides the waveform ── */
  const dotFrac = 0.62;
  const hx = _W * dotFrac;
  const hy = midY - sampleBeat((dotFrac + offset) % 1) * amp;
  const sampleVal = sampleBeat((dotFrac + offset) % 1);
  /* Make glow pulse brightest at the R-spike */
  const glowBoost = 1 + Math.max(0, sampleVal) * 2.5;

  const rg = _ctx.createRadialGradient(hx, hy, 0, hx, hy, 14 * glowBoost);
  rg.addColorStop(0,    'rgba(255,255,255,1)');
  rg.addColorStop(0.2,  'rgba(255,200,220,0.9)');
  rg.addColorStop(0.5,  `rgba(255,107,157,${0.45 * glowBoost})`);
  rg.addColorStop(1,    'transparent');
  _ctx.beginPath();
  _ctx.arc(hx, hy, 14 * glowBoost, 0, Math.PI * 2);
  _ctx.fillStyle = rg;
  _ctx.fill();

  _ctx.beginPath();
  _ctx.arc(hx, hy, 2, 0, Math.PI * 2);
  _ctx.fillStyle = '#fff';
  _ctx.shadowBlur  = 10;
  _ctx.shadowColor = '#fff';
  _ctx.fill();

  _rafId = requestAnimationFrame(draw);
}

export function init(shared) {
  _shared = shared;
  _canvas = document.getElementById('ekg-canvas');
  if (!_canvas) return;
  _ctx = _canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize, { passive: true });

  _rafId = requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(_rafId);
    else _rafId = requestAnimationFrame(draw);
  });
}

export function onEnter() {
  resize();
}
