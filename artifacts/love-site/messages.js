/* messages.js — Unsent messages as floating glowing bubbles */
export function init(shared) {
  const input  = document.getElementById('message-input');
  const canvas = document.getElementById('messages-canvas');
  if (!input || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const bubbles = [];
  const FONT    = '"Space Grotesk", system-ui, sans-serif';

  const COLORS = [
    { r: 79,  g: 142, b: 247 },
    { r: 120, g: 170, b: 255 },
    { r: 247, g: 201, b: 72  },
    { r: 200, g: 160, b: 255 },
    { r: 160, g: 220, b: 255 },
  ];

  function spawnBubble(text) {
    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    const fz  = Math.min(14, Math.max(11, 200 / (text.length + 8)));
    bubbles.push({
      text,
      x:     W * 0.15 + Math.random() * W * 0.7,
      y:     H * 0.82,
      vy:    -(0.5 + Math.random() * 0.8),
      vx:    (Math.random() - 0.5) * 0.4,
      alpha: 1,
      life:  0,
      maxLife: 260 + Math.random() * 120,
      col,
      fz,
      blur:  0,
      exploded: false,
    });
  }

  /* Pre-load a few ghost messages */
  const ghosts = [
    'miss you',
    'just one call',
    'good night, you',
    'be safe',
    'thinking about you',
    'come back soon',
    '274 km feels like forever',
    'i love you',
  ];
  let ghostIdx = 0;
  function drip() {
    if (bubbles.length < 14) {
      spawnBubble(ghosts[ghostIdx++ % ghosts.length]);
    }
    setTimeout(drip, 3500 + Math.random() * 4000);
  }
  setTimeout(drip, 1000);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const txt = input.value.trim();
      if (txt.length) { spawnBubble(txt); input.value = ''; }
    }
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.life++;
      b.y  += b.vy;
      b.x  += b.vx;
      b.vx += (Math.random() - 0.5) * 0.06;

      const progress = b.life / b.maxLife;

      /* fade in/out */
      if (progress < 0.08)      b.alpha = progress / 0.08;
      else if (progress > 0.75) b.alpha = 1 - (progress - 0.75) / 0.25;
      else                       b.alpha = 1;

      const { r, g, bl: bv } = { r: b.col.r, g: b.col.g, bl: b.col.b };

      ctx.save();
      ctx.globalAlpha = b.alpha * 0.88;

      /* Measure text */
      ctx.font = `300 ${b.fz}px ${FONT}`;
      const tw = ctx.measureText(b.text).width;
      const pw = tw + 28, ph = b.fz * 2.2;
      const bx = b.x - pw / 2, by = b.y - ph / 2;

      /* Pill background */
      ctx.shadowBlur  = 16;
      ctx.shadowColor = `rgba(${r},${g},${b.col.b},0.35)`;
      ctx.fillStyle   = `rgba(${r},${g},${b.col.b},0.09)`;
      ctx.beginPath();
      ctx.roundRect(bx, by, pw, ph, ph / 2);
      ctx.fill();

      /* Pill border */
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(${r},${g},${b.col.b},0.28)`;
      ctx.lineWidth   = 1;
      ctx.stroke();

      /* Text */
      ctx.fillStyle = `rgba(220,235,255,${b.alpha})`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur  = 8;
      ctx.shadowColor = `rgba(${r},${g},${b.col.b},0.4)`;
      ctx.fillText(b.text, b.x, b.y);

      ctx.restore();

      /* Remove spent bubbles */
      if (b.life >= b.maxLife || b.y < -40) {
        bubbles.splice(i, 1);
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
