/**
 * script.js — Main orchestrator
 * Initializes all modules, shared canvas, scroll reveals, music system.
 */

import { init as initHero }      from './hero.js';
import { init as initSignal }    from './signal.js';
import { init as initMessages }  from './messages.js';
import { init as initStarmap }   from './starmap.js';
import { init as initCountdown } from './countdown.js';

/* ─── Shared state exposed to all modules ─── */
export const shared = {
  reducedMotion: false,
  musicPlaying: false,
  musicReactive: 0,    // 0..1, driven by audio analyzer
};

/* ─── Reduced motion ─── */
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
shared.reducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', e => { shared.reducedMotion = e.matches; });

/* ─── Global star canvas ─── */
let starCtx, stars = [], dpr = 1;

function initStarCanvas() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  starCtx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generateStars();
  }

  function generateStars() {
    const W = window.innerWidth, H = window.innerHeight;
    stars = [];
    const count = Math.min(Math.round(W * H / 4000), 300);
    for (let i = 0; i < count; i++) {
      stars.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.2 + 0.2,
        base:  Math.random() * 0.6 + 0.15,
        speed: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.08,
      });
    }
  }

  let t = 0;
  function drawStars() {
    const W = window.innerWidth, H = window.innerHeight;
    starCtx.clearRect(0, 0, W, H);

    const boost = shared.musicReactive * 0.35;

    for (const s of stars) {
      const twinkle = s.base + Math.sin(t * s.speed + s.phase) * (0.15 + boost * 0.2);
      starCtx.beginPath();
      starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      starCtx.fillStyle = `rgba(232,232,240,${Math.max(0, Math.min(1, twinkle))})`;
      starCtx.fill();
      // Drift
      if (!shared.reducedMotion) {
        s.x += s.drift;
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
      }
    }
    t += 0.016;
  }

  let rafId;
  function loop() {
    // Drive music reactivity from the main RAF loop
    if (typeof window.__musicTick === 'function') window.__musicTick();
    if (!shared.reducedMotion) drawStars();
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); }
    else { loop(); }
  });

  resize();
  loop();
}

/* ─── Scroll reveal (IntersectionObserver) ─── */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal-fade');
  if (shared.reducedMotion) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    obs.observe(el);
  });
}

/* ─── Music system ─── */
function initMusic() {
  const btn       = document.getElementById('music-btn');
  const audio     = document.getElementById('our-song');
  const blocked   = document.getElementById('music-blocked');
  const rippleEl  = btn?.querySelector('.music-ripple');
  const iconEl    = btn?.querySelector('.music-btn-icon');
  const textEl    = btn?.querySelector('.music-btn-text');

  if (!btn || !audio) return;

  // Restore saved state
  const savedTime = parseFloat(localStorage.getItem('ls_music_pos') || '0');
  const wasPlaying = localStorage.getItem('ls_music_playing') === '1';
  if (savedTime > 0) audio.currentTime = savedTime;

  // Web Audio for reactivity
  let analyser, dataArray, audioCtx;

  function setupAnalyser() {
    try {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (_) {}
  }

  function updateReactivity() {
    if (!analyser || !shared.musicPlaying) {
      shared.musicReactive = Math.max(0, shared.musicReactive - 0.04);
      return;
    }
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += dataArray[i];
    const avg = sum / (10 * 255);
    shared.musicReactive += (avg - shared.musicReactive) * 0.15;
  }

  // Attach to star loop tick
  const _origDraw = window.__loveDrawTick;
  window.__musicTick = updateReactivity;

  // Fade helpers
  let fadeTimer = null;
  function fadeVolume(from, to, durationMs, cb) {
    clearInterval(fadeTimer);
    audio.volume = Math.max(0, Math.min(1, from));
    const steps   = 40;
    const stepMs  = durationMs / steps;
    const delta   = (to - from) / steps;
    let step = 0;
    fadeTimer = setInterval(() => {
      step++;
      audio.volume = Math.max(0, Math.min(1, from + delta * step));
      if (step >= steps) {
        clearInterval(fadeTimer);
        audio.volume = to;
        if (cb) cb();
      }
    }, stepMs);
  }

  function setPlayingUI(playing) {
    shared.musicPlaying = playing;
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    if (iconEl) iconEl.textContent = playing ? '⏸' : '🎵';
    if (textEl) textEl.textContent = playing ? 'Pause Our Song' : 'Play Our Song';
  }

  async function play() {
    setupAnalyser();
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
    audio.volume = 0;
    try {
      await audio.play();
      if (blocked) blocked.hidden = true;
      setPlayingUI(true);
      fadeVolume(0, 0.3, 2000);
      localStorage.setItem('ls_music_playing', '1');
    } catch (err) {
      if (err.name === 'NotAllowedError' && blocked) blocked.hidden = false;
    }
  }

  function pause() {
    fadeVolume(audio.volume, 0, 1000, () => {
      audio.pause();
      setPlayingUI(false);
      localStorage.setItem('ls_music_playing', '0');
    });
  }

  // Save position periodically
  setInterval(() => {
    if (!audio.paused) localStorage.setItem('ls_music_pos', audio.currentTime.toFixed(1));
  }, 5000);

  // Reset position on loop
  audio.addEventListener('ended', () => {
    localStorage.setItem('ls_music_pos', '0');
  });

  // Ripple on click
  btn.addEventListener('click', (e) => {
    if (rippleEl) {
      const rect = btn.getBoundingClientRect();
      rippleEl.style.left = (e.clientX - rect.left) + 'px';
      rippleEl.style.top  = (e.clientY - rect.top)  + 'px';
      rippleEl.classList.remove('active');
      void rippleEl.offsetWidth;
      rippleEl.classList.add('active');
    }
    if (audio.paused) play(); else pause();
  });

  // Keyboard
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });

  // Auto-resume if was playing
  if (wasPlaying) {
    document.addEventListener('click', () => play(), { once: true });
    if (blocked) {
      blocked.hidden = false;
      setTimeout(() => { if (blocked) blocked.hidden = true; }, 6000);
    }
  }
}

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => {
  initStarCanvas();
  initScrollReveal();
  initMusic();

  initHero();
  initSignal();
  initMessages();
  initStarmap();
  initCountdown();
});
