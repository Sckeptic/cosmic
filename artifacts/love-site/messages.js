/**
 * messages.js — Unsent Messages
 * Floating bubble messages that drift up and fade into stars.
 */

import { shared } from './script.js';

export function init() {
  const canvas = document.getElementById('messages-canvas');
  const input  = document.getElementById('message-input');
  if (!canvas || !input) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let bubbles = [];
  let rafId;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const section = canvas.closest('.messages-section') || document.getElementById('messages');
    W = section ? section.clientWidth  : window.innerWidth;
    H = section ? section.clientHeight : window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createBubble(text) {
    const maxW = Math.min(W * 0.6, 320);
    const fontSize = 13 + Math.random() * 4;

    ctx.font = `${fontSize}px Inter, sans-serif`;
    const measured = ctx.measureText(text);
    const bW = Math.min(measured.width + 32, maxW);

    // Approximate multi-line height
    const lines = Math.ceil(measured.width / (maxW - 32));
    const bH = fontSize * 1.4 * Math.max(1, lines) + 24;

    const speed  = 0.4 + Math.random() * 0.7;
    const drift  = (Math.random() - 0.5) * 0.6;
    const wobble = Math.random() * Math.PI * 2;
    const wobbleAmt = 0.3 + Math.random() * 0.5;
    const alpha = 0.85 + Math.random() * 0.15;

    // Start near bottom centre with some spread
    const startX = W * 0.5 + (Math.random() - 0.5) * W * 0.5 - bW / 2;
    const startY = H - 120;

    const music = shared.musicReactive;

    bubbles.push({
      text,
      x: startX,
      y: startY,
      w: bW,
      h: bH,
      speed: speed + music * 0.3,
      drift,
      wobble,
      wobbleAmt,
      opacity: alpha,
      fontSize,
      age: 0,
      maxAge: 280 + Math.random() * 120,
      lines,
      maxW,
    });
  }

  function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const result = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth - 32) {
        if (line) result.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) result.push(line);
    return result;
  }

  function drawBubble(b) {
    const progress = b.age / b.maxAge; // 0..1
    const fadeIn   = Math.min(1, b.age / 20);
    const fadeOut  = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
    const alpha    = b.opacity * fadeIn * fadeOut;

    if (alpha <= 0) return;

    // Wobble drift
    const wobbleX = Math.sin(b.wobble + b.age * 0.04) * b.wobbleAmt;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Bubble background
    const radius = 16;
    ctx.beginPath();
    ctx.roundRect(b.x + wobbleX, b.y, b.w, b.h, radius);
    ctx.fillStyle = `rgba(10,22,40,0.72)`;
    ctx.fill();

    // Glow border
    const glowAlpha = 0.25 + shared.musicReactive * 0.2;
    ctx.strokeStyle = `rgba(79,142,247,${glowAlpha * alpha})`;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Text
    ctx.font = `300 ${b.fontSize}px Inter, sans-serif`;
    ctx.fillStyle = `rgba(232,232,240,${alpha * 0.9})`;
    ctx.textBaseline = 'top';

    const wrapped = wrapText(b.text, b.w);
    const lineH = b.fontSize * 1.45;
    const totalH = wrapped.length * lineH;
    let ty = b.y + (b.h - totalH) / 2;
    for (const ln of wrapped) {
      ctx.fillText(ln, b.x + wobbleX + 16, ty);
      ty += lineH;
    }

    // Shimmer while music plays
    if (shared.musicReactive > 0.1) {
      ctx.beginPath();
      ctx.roundRect(b.x + wobbleX, b.y, b.w, b.h, radius);
      ctx.fillStyle = `rgba(79,142,247,${shared.musicReactive * 0.06 * alpha})`;
      ctx.fill();
    }

    ctx.restore();
  }

  function drawParticles(b) {
    if (b.age < b.maxAge * 0.8) return;
    const dissolveFrac = (b.age - b.maxAge * 0.8) / (b.maxAge * 0.2);
    const count = Math.floor(dissolveFrac * 8);
    for (let i = 0; i < count; i++) {
      const px = b.x + Math.random() * b.w;
      const py = b.y + Math.random() * b.h;
      const r  = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79,142,247,${Math.random() * 0.4 * (1 - dissolveFrac)})`;
      ctx.fill();
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.age++;
      b.y -= b.speed;
      drawParticles(b);
      drawBubble(b);
      if (b.age >= b.maxAge) bubbles.splice(i, 1);
    }

    rafId = requestAnimationFrame(loop);
  }

  function handleVisibility() {
    if (document.hidden) cancelAnimationFrame(rafId);
    else loop();
  }

  // Keyboard handler
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const text = input.value.trim();
    if (!text) return;
    e.preventDefault();

    // Up to 5 simultaneous bubbles
    if (bubbles.length < 5) createBubble(text);
    input.value = '';

    // Brief glow flash on input
    input.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.25), 0 0 32px rgba(79,142,247,0.2)';
    setTimeout(() => { input.style.boxShadow = ''; }, 600);
  });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibility);

  resize();
  loop();
}
