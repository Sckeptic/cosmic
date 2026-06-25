/* hero.js — EKG heartbeat between two glowing nodes */
export function init(shared) {
  const canvas = document.getElementById('ekg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  function resize() {
    const wrap = canvas.parentElement;
    W = canvas.width  = wrap.clientWidth;
    H = canvas.height = wrap.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ECG QRS complex as normalised segment list */
  const SEGMENTS = [
    { dx: 0.06, dy: 0 },
    { dx: 0.04, dy:-0.10 },
    { dx: 0.03, dy: 0.10 },
    { dx: 0.02, dy: 0 },
    { dx: 0.02, dy:-0.55 },
    { dx: 0.025,dy: 1.0 },
    { dx: 0.02, dy:-0.95 },
    { dx: 0.03, dy: 0.50 },
    { dx: 0.07, dy: 0 },
    { dx: 0.045,dy:-0.20 },
    { dx: 0.05, dy: 0.20 },
    { dx: 0.09, dy: 0 },
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

  let offset = 0;
  let rafId;
  const STEPS = 600;

  function draw() {
    if (shared.reducedMotion) return;
    ctx.clearRect(0, 0, W, H);

    const amp   = H * 0.36 * (1 + shared.musicReactive * 0.45);
    const speed = 0.0015 + shared.musicReactive * 0.0008;
    offset = (offset + speed) % 1;

    const midY = H * 0.52;

    /* Soft glow underline */
    ctx.save();
    ctx.lineWidth   = 5;
    ctx.strokeStyle = 'rgba(79,142,247,0.06)';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = 'rgba(79,142,247,0.2)';
    ctx.filter = 'blur(3px)';
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const nx = i / STEPS;
      const y  = midY - sampleBeat((nx + offset) % 1) * amp;
      i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(nx * W, y);
    }
    ctx.stroke();
    ctx.restore();

    /* Main line with gradient fade-in from edges */
    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineJoin  = 'round';
    ctx.shadowBlur  = 18;
    ctx.shadowColor = 'rgba(100,180,255,0.7)';

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,    'rgba(79,142,247,0.0)');
    grad.addColorStop(0.08, 'rgba(79,142,247,1)');
    grad.addColorStop(0.5,  'rgba(150,200,255,1)');
    grad.addColorStop(0.92, 'rgba(79,142,247,1)');
    grad.addColorStop(1,    'rgba(79,142,247,0.0)');
    ctx.strokeStyle = grad;

    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const nx = i / STEPS;
      const y  = midY - sampleBeat((nx + offset) % 1) * amp;
      i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(nx * W, y);
    }
    ctx.stroke();
    ctx.restore();

    /* Travelling glow head */
    const hx = W * 0.68;
    const hy = midY - sampleBeat((0.68 + offset) % 1) * amp;

    const rg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
    rg.addColorStop(0,   'rgba(255,255,255,1)');
    rg.addColorStop(0.25,'rgba(160,210,255,0.9)');
    rg.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.arc(hx, hy, 14, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else rafId = requestAnimationFrame(draw);
  });
}
