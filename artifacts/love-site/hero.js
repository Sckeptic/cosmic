/* hero.js — EKG heartbeat between two glowing nodes */

let _shared, _canvas, _ctx, _W, _H, _rafId;

const SEGMENTS = [
  { dx: 0.06, dy: 0    },
  { dx: 0.04, dy:-0.10 },
  { dx: 0.03, dy: 0.10 },
  { dx: 0.02, dy: 0    },
  { dx: 0.02, dy:-0.55 },
  { dx: 0.025,dy: 1.0  },
  { dx: 0.02, dy:-0.95 },
  { dx: 0.03, dy: 0.50 },
  { dx: 0.07, dy: 0    },
  { dx: 0.045,dy:-0.20 },
  { dx: 0.05, dy: 0.20 },
  { dx: 0.09, dy: 0    },
];

function buildBeat() {
  const pts = [{ x: 0, y: 0 }];
  let cx = 0;
  for (const seg of SEGMENTS) { cx += seg.dx; pts.push({ x: cx, y: seg.dy }); }
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
  _W = _canvas.width  = wrap.clientWidth;
  _H = _canvas.height = wrap.clientHeight;
}

let offset = 0;
const STEPS = 600;

function draw() {
  if (!_canvas || !_ctx || _shared?.reducedMotion) { _rafId = requestAnimationFrame(draw); return; }
  _ctx.clearRect(0, 0, _W, _H);

  const amp   = _H * 0.36 * (1 + _shared.musicReactive * 0.45);
  const speed = 0.0015 + _shared.musicReactive * 0.0008;
  offset = (offset + speed) % 1;
  const midY = _H * 0.52;

  /* Soft glow underline */
  _ctx.save();
  _ctx.lineWidth   = 5;
  _ctx.strokeStyle = 'rgba(79,142,247,0.06)';
  _ctx.shadowBlur  = 30;
  _ctx.shadowColor = 'rgba(79,142,247,0.2)';
  _ctx.filter = 'blur(3px)';
  _ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const nx = i / STEPS;
    const y  = midY - sampleBeat((nx + offset) % 1) * amp;
    i === 0 ? _ctx.moveTo(0, y) : _ctx.lineTo(nx * _W, y);
  }
  _ctx.stroke();
  _ctx.restore();

  /* Main line */
  _ctx.save();
  _ctx.lineWidth = 2;
  _ctx.lineJoin  = 'round';
  _ctx.shadowBlur  = 18;
  _ctx.shadowColor = 'rgba(100,180,255,0.7)';

  const grad = _ctx.createLinearGradient(0, 0, _W, 0);
  grad.addColorStop(0,    'rgba(79,142,247,0.0)');
  grad.addColorStop(0.08, 'rgba(79,142,247,1)');
  grad.addColorStop(0.5,  'rgba(150,200,255,1)');
  grad.addColorStop(0.92, 'rgba(79,142,247,1)');
  grad.addColorStop(1,    'rgba(79,142,247,0.0)');
  _ctx.strokeStyle = grad;

  _ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const nx = i / STEPS;
    const y  = midY - sampleBeat((nx + offset) % 1) * amp;
    i === 0 ? _ctx.moveTo(0, y) : _ctx.lineTo(nx * _W, y);
  }
  _ctx.stroke();
  _ctx.restore();

  /* Travelling glow head */
  const hx = _W * 0.68;
  const hy = midY - sampleBeat((0.68 + offset) % 1) * amp;

  const rg = _ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
  rg.addColorStop(0,    'rgba(255,255,255,1)');
  rg.addColorStop(0.25, 'rgba(160,210,255,0.9)');
  rg.addColorStop(1,    'transparent');
  _ctx.beginPath();
  _ctx.arc(hx, hy, 14, 0, Math.PI * 2);
  _ctx.fillStyle = rg;
  _ctx.fill();
  _ctx.beginPath();
  _ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
  _ctx.fillStyle = '#fff';
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
