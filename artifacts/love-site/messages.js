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
  'i keep replaying the last thing you said',
  'goodnight — even if you can\'t hear it',
  'i almost called. then didn\'t. then almost did again',
  'the quiet after a missed call is the loudest thing',
  'are you awake too?',
  'i\'m okay. i just miss you',
  '274 km and i still feel you next to me',
  'don\'t overthink. just call',
  'i saved your voice note just to hear your voice',
  'same moon tonight. i checked',
  'you don\'t have to say anything. just be there',
  'the signal drops. the feeling never does',
  'i wish you could hear how much i mean this',
  'some days the distance weighs more than others',
  'you make everything quieter in the best way',
  'i\'m still here. always',
  'waiting feels different when it\'s for you',
  'come back soon — the stars aren\'t the same without you',
];
let ghostIdx = 0;
let dripTimer = null;
let _zoneIdx  = 0; // cycles through horizontal zones so bubbles don't pile up

function resize() {
  if (!_canvas) return;
  const w = _canvas.offsetWidth  || _canvas.parentElement?.offsetWidth  || window.innerWidth;
  const h = _canvas.offsetHeight || _canvas.parentElement?.offsetHeight || window.innerHeight;
  _W = _canvas.width  = w;
  _H = _canvas.height = h;
}

/* Split the canvas into 4 horizontal lanes — pick the next one in order */
function nextZoneX() {
  const ZONES = 4;
  const lane  = _zoneIdx % ZONES;
  _zoneIdx++;
  // Each lane is 25% wide; centre the bubble in the lane with a small random offset
  const laneW   = _W / ZONES;
  const centreX = laneW * lane + laneW / 2;
  return centreX + (Math.random() - 0.5) * laneW * 0.55;
}

function spawnBubble(text) {
  if (!_W || !_H) resize();
  if (!_W || !_H) return;
  const col = COLORS[Math.floor(Math.random() * COLORS.length)];
  const fz  = Math.min(15, Math.max(11, 200 / (text.length + 8)));
  bubbles.push({
    text,
    x:       nextZoneX(),
    y:       _H * 0.82 + (Math.random() - 0.5) * _H * 0.06,
    vy:     -(0.70 + Math.random() * 0.70),   // rise faster → clears before next spawn
    vx:      (Math.random() - 0.5) * 0.50,
    alpha:   1,
    life:    0,
    maxLife: 220 + Math.random() * 100,        // shorter life so sky stays clear
    col, fz,
  });
}

function drip() {
  // BUG FIX: only spawn bubbles when the messages page is actually visible
  if (_isActive() && bubbles.length < 6) spawnBubble(ghosts[ghostIdx++ % ghosts.length]);
  dripTimer = setTimeout(drip, 4800 + Math.random() * 4400);
}

function _isActive() {
  return _canvas?.closest('.section')?.classList.contains('page-active') ?? false;
}

let _rafId = null;
function draw() {
  if (!_ctx) { _rafId = requestAnimationFrame(draw); return; }

  // BUG FIX: skip drawing when messages page is not visible (saves GPU on other pages)
  if (!_isActive()) { _rafId = requestAnimationFrame(draw); return; }

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
        _input.value = '';
        if (counter) { counter.textContent = '200'; counter.classList.remove('near-limit'); }
        setTimeout(() => sendToWhatsApp(txt), 300);
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
