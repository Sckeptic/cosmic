/* messages.js — Unsent messages as floating glowing bubbles */

let _canvas, _ctx, _W, _H, _input;
const bubbles = [];
const FONT = '"Space Grotesk", system-ui, sans-serif';
const COLORS = [
  { r: 79,  g: 142, b: 247 },
  { r: 120, g: 170, b: 255 },
  { r: 247, g: 201, b: 72  },
  { r: 200, g: 160, b: 255 },
  { r: 160, g: 220, b: 255 },
];

const ghosts = [
  'miss you', 'just one call', 'good night, you',
  'be safe', 'thinking about you', 'come back soon',
  '274 km feels like forever', 'i love you',
  'are you sleeping?', 'wish i was there',
  'same moon, different city', 'call me when you can',
];
let ghostIdx = 0;
let dripTimer = null;

function resize() {
  if (!_canvas) return;
  _W = _canvas.width  = _canvas.offsetWidth;
  _H = _canvas.height = _canvas.offsetHeight;
}

function spawnBubble(text) {
  if (!_W || !_H) return;
  const col = COLORS[Math.floor(Math.random() * COLORS.length)];
  const fz  = Math.min(14, Math.max(11, 200 / (text.length + 8)));
  bubbles.push({
    text,
    x:       _W * 0.15 + Math.random() * _W * 0.7,
    y:       _H * 0.82,
    vy:     -(0.5 + Math.random() * 0.8),
    vx:      (Math.random() - 0.5) * 0.4,
    alpha:   1,
    life:    0,
    maxLife: 260 + Math.random() * 120,
    col, fz,
  });
}

function drip() {
  if (bubbles.length < 14) spawnBubble(ghosts[ghostIdx++ % ghosts.length]);
  dripTimer = setTimeout(drip, 3500 + Math.random() * 4000);
}

function draw() {
  if (!_ctx) return;
  _ctx.clearRect(0, 0, _W, _H);

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.life++;
    b.y  += b.vy;
    b.x  += b.vx;
    b.vx += (Math.random() - 0.5) * 0.06;

    const progress = b.life / b.maxLife;
    if (progress < 0.08)      b.alpha = progress / 0.08;
    else if (progress > 0.75) b.alpha = 1 - (progress - 0.75) / 0.25;
    else                       b.alpha = 1;

    const { r, g, b: bc } = b.col;

    _ctx.save();
    _ctx.globalAlpha = b.alpha * 0.88;
    _ctx.font = `300 ${b.fz}px ${FONT}`;
    const tw = _ctx.measureText(b.text).width;
    const pw = tw + 28, ph = b.fz * 2.2;
    const bx = b.x - pw / 2, by = b.y - ph / 2;

    _ctx.shadowBlur  = 16;
    _ctx.shadowColor = `rgba(${r},${g},${bc},0.35)`;
    _ctx.fillStyle   = `rgba(${r},${g},${bc},0.09)`;
    _ctx.beginPath();
    _ctx.roundRect(bx, by, pw, ph, ph / 2);
    _ctx.fill();

    _ctx.shadowBlur = 0;
    _ctx.strokeStyle = `rgba(${r},${g},${bc},0.28)`;
    _ctx.lineWidth   = 1;
    _ctx.stroke();

    _ctx.fillStyle   = `rgba(220,235,255,${b.alpha})`;
    _ctx.textAlign   = 'center';
    _ctx.textBaseline = 'middle';
    _ctx.shadowBlur  = 8;
    _ctx.shadowColor = `rgba(${r},${g},${bc},0.4)`;
    _ctx.fillText(b.text, b.x, b.y);
    _ctx.restore();

    if (b.life >= b.maxLife || b.y < -40) bubbles.splice(i, 1);
  }

  requestAnimationFrame(draw);
}

export function init(shared) {
  _input  = document.getElementById('message-input');
  _canvas = document.getElementById('messages-canvas');
  if (!_input || !_canvas) return;
  _ctx = _canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Stop arrow keys from triggering page navigation while typing
  _input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const txt = _input.value.trim();
      if (txt.length) { spawnBubble(txt); _input.value = ''; }
    }
  });

  requestAnimationFrame(draw);
  setTimeout(drip, 1000);
}

export function onEnter() {
  resize();
}
