/**
 * hero.js — Distance as Art
 * EKG heartbeat canvas between two glowing nodes.
 * Drifting stars, parallax, breathing glow.
 */

import { shared } from './script.js';

export function init() {
  const canvas = document.getElementById('ekg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let t = 0;
  let rafId;

  // EKG waveform state
  let wavePoints = [];
  const POINT_COUNT = 300;

  // Waveform parameters — vary organically over time
  let speed     = 0.018;
  let amplitude = 0.55;
  let beatPhase = 0;
  let nextBeat  = 0;
  let beatIntensity = 0;

  function resize() {
    const wrap = canvas.parentElement;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wavePoints = new Array(POINT_COUNT).fill(H / 2);
  }

  // Seeded pseudo-random for organic waveform variation
  let seed = 42;
  function rand() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function generateEKGSample(phase) {
    // Base noise
    const noise = Math.sin(phase * 0.7) * 0.08
                + Math.sin(phase * 1.3) * 0.06
                + Math.sin(phase * 2.1) * 0.04;

    // P wave
    const pWave = Math.exp(-Math.pow((phase % (Math.PI * 2)) - 0.6, 2) * 18) * 0.18;

    // QRS complex
    const relPhase = ((phase % (Math.PI * 2)) - Math.PI * 0.95);
    const qWave  = -Math.exp(-Math.pow(relPhase + 0.12, 2) * 280) * 0.12;
    const rPeak  =  Math.exp(-Math.pow(relPhase, 2) * 220) * (amplitude + beatIntensity);
    const sPart  = -Math.exp(-Math.pow(relPhase - 0.1, 2) * 200) * 0.09;

    // T wave
    const tWave  =  Math.exp(-Math.pow(relPhase - 0.55, 2) * 28) * 0.22;

    return noise + pWave + qWave + rPeak + sPart + tWave;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (shared.reducedMotion) {
      // Static flat line in reduced motion
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.strokeStyle = 'rgba(79,142,247,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return;
    }

    // Advance beat
    beatPhase += speed + shared.musicReactive * 0.008;
    t += 0.016;

    // Organic parameter drift
    if (Math.random() < 0.002) speed = 0.015 + Math.random() * 0.01;
    if (Math.random() < 0.003) amplitude = 0.4 + Math.random() * 0.35;

    // Beat impulse
    if (t > nextBeat) {
      beatIntensity = 0.3 + Math.random() * 0.3 + shared.musicReactive * 0.4;
      nextBeat = t + 0.6 + Math.random() * 0.4;
    }
    beatIntensity *= 0.92;

    // Push new sample
    const sample = generateEKGSample(beatPhase);
    const cy = H / 2 - sample * H * 0.42;
    wavePoints.push(cy);
    if (wavePoints.length > POINT_COUNT) wavePoints.shift();

    // Draw glow layers
    const xStep = W / (POINT_COUNT - 1);

    for (let pass = 0; pass < 3; pass++) {
      const glowSizes  = [12, 4, 1.5];
      const glowAlphas = [0.06, 0.14, 0.9];
      const glowColors = [
        `rgba(79,142,247,${glowAlphas[pass]})`,
        `rgba(79,142,247,${glowAlphas[pass]})`,
        `rgba(160,210,255,${glowAlphas[pass]})`,
      ];

      ctx.beginPath();
      ctx.moveTo(0, wavePoints[0]);
      for (let i = 1; i < wavePoints.length; i++) {
        const x0 = (i - 1) * xStep, y0 = wavePoints[i - 1];
        const x1 = i * xStep,       y1 = wavePoints[i];
        const cpx = (x0 + x1) / 2;
        ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
      }
      ctx.strokeStyle  = glowColors[pass];
      ctx.lineWidth    = glowSizes[pass];
      ctx.lineCap      = 'round';
      ctx.lineJoin     = 'round';
      ctx.shadowBlur   = pass === 0 ? 0 : 8;
      ctx.shadowColor  = 'rgba(79,142,247,0.4)';
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Trailing glow dot at current position
    const lastX = (wavePoints.length - 1) * xStep;
    const lastY = wavePoints[wavePoints.length - 1];
    const grad = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 8 + beatIntensity * 10);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.3, `rgba(79,142,247,${0.5 + beatIntensity * 0.3})`);
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(lastX, lastY, 8 + beatIntensity * 10, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function handleVisibility() {
    if (document.hidden) cancelAnimationFrame(rafId);
    else loop();
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibility);

  // Parallax on hero section
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking && !shared.reducedMotion) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const offset = scrollY * 0.25;
          heroSection.style.setProperty('--parallax-y', `-${offset}px`);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  resize();
  loop();
}
