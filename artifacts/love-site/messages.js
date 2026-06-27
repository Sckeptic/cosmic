/* messages.js — Unsent messages as floating glowing bubbles (romantic palette) */

let _canvas, _ctx, _W, _H, _input, _active = false;
const bubbles = [];
const FONT = '"Space Grotesk", system-ui, sans-serif';
const COLORS = [
  { r: 255, g: 107, b: 157 },  /* rose */
  { r: 255, g: 150, b: 180 },  /* light rose */
  { r: 247, g: 201, b:  72 },  /* gold */
  { r: 200, g: 130, b: 255 },  /* lavender */
  { r: 255, g: 180, b: 120 },  /* peach */
];

/* Safe rounded rect */
function pillPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const ghosts = [
  'miss you', 'just one call', 'good night, my love',
  'be safe', 'thinking about you always', 'come back soon ❤️',
  '274 km feels like forever', 'i love you so much',
  'are you sleeping?', 'wish i was right there',
  'same moon, different sky', 'call me when you can',
  'you make everything better', 'i carry you with me',
  'distance means so little', 'my heart is with you',
  'you are my home', 'forever isn\'t long enough',
];
let ghostIdx = 0;
let dripTimer = null;

function resize() {
  if (!_canvas) return;
  /* Bug fix: use window dimensions as fallback if canvas has no layout size */
  const w = _canvas.offsetWidth  || _canvas.parentElement?.offsetWidth  || window.innerWidth;
  const h = _canvas.offsetHeight || _canvas.parentElement?.offsetHeight || window.innerHeight;
  _W = _canvas.width  = w;
  _H = _canvas.height = h;
}

function spawnBubble(text) {
  if (!_W || !_H) resize();
  if (!_W || !_H) return;
  const col = COLORS[Math.floor(Math.random() * COLORS.length)];
  const fz  = Math.min(15, Math.max(11, 200 / (text.length + 8)));
  bubbles.push({
    text,
    x:       _W * 0.12 + Math.random() * _W * 0.76,
    y:       _H * 0.85,
    vy:     -(0.45 + Math.random() * 0.75),
    vx:      (Math.random() - 0.5) * 0.35,
    alpha:   1,
    life:    0,
    maxLife: 280 + Math.random() * 140,
    col, fz,
  });
}

function drip() {
  if (bubbles.length < 16) spawnBubble(ghosts[ghostIdx++ % ghosts.length]);
  dripTimer = setTimeout(drip, 3200 + Math.random() * 3800);
}

let _rafId = null;
function draw() {
  if (!_ctx) { _rafId = requestAnimationFrame(draw); return; }

  /* Re-check canvas dimensions in case resize was needed */
  if (!_W || !_H) resize();

  _ctx.clearRect(0, 0, _W, _H);

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.life++;
    b.y  += b.vy;
    b.x  += b.vx;
    b.vx += (Math.random() - 0.5) * 0.05;

    const progress = b.life / b.maxLife;
    if (progress < 0.08)      b.alpha = progress / 0.08;
    else if (progress > 0.75) b.alpha = 1 - (progress - 0.75) / 0.25;
    else                       b.alpha = 1;

    const { r, g, b: bc } = b.col;

    _ctx.save();
    _ctx.globalAlpha = b.alpha * 0.9;
    _ctx.font = `300 ${b.fz}px ${FONT}`;
    const tw = _ctx.measureText(b.text).width;
    const pw = tw + 32, ph = b.fz * 2.4;
    const bx = b.x - pw / 2, by = b.y - ph / 2;

    /* Bubble glow */
    _ctx.shadowBlur  = 20;
    _ctx.shadowColor = `rgba(${r},${g},${bc},0.4)`;

    /* Bubble background */
    _ctx.fillStyle = `rgba(${r},${g},${bc},0.08)`;
    pillPath(_ctx, bx, by, pw, ph, ph / 2);
    _ctx.fill();

    /* Bubble border */
    _ctx.shadowBlur = 0;
    _ctx.strokeStyle = `rgba(${r},${g},${bc},0.32)`;
    _ctx.lineWidth   = 1;
    _ctx.stroke();

    /* Bubble shimmer highlight */
    const shimGrad = _ctx.createLinearGradient(bx, by, bx, by + ph * 0.4);
    shimGrad.addColorStop(0, `rgba(255,255,255,${b.alpha * 0.12})`);
    shimGrad.addColorStop(1, 'rgba(255,255,255,0)');
    _ctx.fillStyle = shimGrad;
    pillPath(_ctx, bx, by, pw, ph * 0.5, ph / 2);
    _ctx.fill();

    /* Text */
    _ctx.fillStyle   = `rgba(255,240,248,${b.alpha})`;
    _ctx.textAlign   = 'center';
    _ctx.textBaseline = 'middle';
    _ctx.shadowBlur  = 10;
    _ctx.shadowColor = `rgba(${r},${g},${bc},0.5)`;
    _ctx.fillText(b.text, b.x, b.y);
    _ctx.restore();

    if (b.life >= b.maxLife || b.y < -60) bubbles.splice(i, 1);
  }

  _rafId = requestAnimationFrame(draw);
}

export function init(shared) {
  _input  = document.getElementById('message-input');
  _canvas = document.getElementById('messages-canvas');
  if (!_input || !_canvas) return;
  _ctx = _canvas.getContext('2d');

  /* Bug fix: ensure canvas fills its parent by observing size changes */
  resize();
  window.addEventListener('resize', resize, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(resize);
    ro.observe(_canvas.parentElement || _canvas);
  }

  /* Stop arrow keys from triggering page navigation while typing */
  function heartBurst(inputEl) {
    const wrap = inputEl.closest('.messages-input-bar') || inputEl.parentElement;
    if (!wrap) return;
    const hearts = ['♥', '❤', '♡', '✿'];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('span');
      el.className = 'msg-heart-burst';
      el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      el.style.left = `${20 + Math.random() * 60}%`;
      el.style.bottom = '100%';
      el.style.animationDelay = `${i * 60}ms`;
      const hue = 330 + Math.random() * 30;
      el.style.color = `hsl(${hue}deg, 85%, 70%)`;
      el.style.fontSize = `${0.9 + Math.random() * 0.7}rem`;
      wrap.style.position = 'relative';
      wrap.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  const WA_NUMBER = '918178804731';
  const counter = document.getElementById('msg-char-counter');

  function sendToWhatsApp(txt) {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`;
    window.open(url, '_blank', 'noopener');
  }

  _input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const txt = _input.value.trim();
      if (txt.length) {
        spawnBubble(txt);
        heartBurst(_input);
        sendToWhatsApp(txt);
        _input.value = '';
        if (counter) { counter.textContent = '200'; counter.classList.remove('near-limit'); }
      }
    }
  });

  /* Character counter */
  if (counter) {
    _input.addEventListener('input', () => {
      const rem = 200 - _input.value.length;
      counter.textContent = rem;
      counter.classList.toggle('near-limit', rem <= 30);
    });
  }

  _rafId = requestAnimationFrame(draw);
  setTimeout(drip, 800);
}

export function onEnter() {
  /* Bug fix: re-size canvas when entering the page, as it may have been 0x0 */
  resize();
}
