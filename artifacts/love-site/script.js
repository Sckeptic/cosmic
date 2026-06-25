import { init as initHero }      from '/hero.js';
import { init as initSignal }    from '/signal.js';
import { init as initMessages }  from '/messages.js';
import { init as initStarmap }   from '/starmap.js';
import { init as initCountdown } from '/countdown.js';

/* ── Shared reactive state ── */
export const shared = {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  musicPlaying:  false,
  musicReactive: 0,   // 0..1 from audio analyser
};

/* ══════════════════════════════════════════════
   GLOBAL STAR CANVAS
══════════════════════════════════════════════ */
const canvas = document.getElementById('star-canvas');
const ctx    = canvas.getContext('2d');

const STAR_COUNT = 260;
const stars = [];

function seedRng(s) {
  let x = s;
  return () => { x = (x * 16807 + 0) % 2147483647; return (x - 1) / 2147483646; };
}
const rng = seedRng(20240314);

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  stars.length  = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = rng();
    stars.push({
      x: rng() * canvas.width,
      y: rng() * canvas.height,
      r: 0.3 + r * 1.2,
      sp: 0.06 + rng() * 0.14,
      tw: rng() * Math.PI * 2,
      twSpd: 0.008 + rng() * 0.018,
      vy: 0.04 + rng() * 0.08,
      alpha: 0.2 + rng() * 0.6,
    });
  }
}

let t = 0;
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const boost = 1 + shared.musicReactive * 0.6;
  for (const s of stars) {
    s.tw += s.twSpd;
    s.y  += s.vy * 0.4;
    if (s.y > canvas.height + 2) s.y = -2;

    const a = s.alpha * (0.5 + 0.5 * Math.sin(s.tw)) * boost;
    const glow = s.r * 3.5 * boost;

    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow);
    g.addColorStop(0, `rgba(200,220,255,${a * 0.9})`);
    g.addColorStop(0.4, `rgba(140,180,255,${a * 0.3})`);
    g.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(s.x, s.y, glow, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * boost, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(230,240,255,${a})`;
    ctx.fill();
  }
  t += 0.016;
}

let rafId;
function loop() {
  if (typeof window.__musicTick === 'function') window.__musicTick();
  if (!shared.reducedMotion) drawStars();
  rafId = requestAnimationFrame(loop);
}

window.addEventListener('resize', resize, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(rafId); }
  else { rafId = requestAnimationFrame(loop); }
});

/* ══════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════ */
function initReveal() {
  const targets = document.querySelectorAll('.reveal-fade, .reveal-scale');
  const delays  = [0, 0.1, 0.2, 0.32, 0.44, 0.56];

  // stagger siblings within known parent containers
  document.querySelectorAll('.hero-inner, .signal-inner, .countdown-inner, .starmap-header, .starmap-footer').forEach(parent => {
    let i = 0;
    parent.querySelectorAll('.reveal-fade, .reveal-scale').forEach(el => {
      if (!el.style.transitionDelay) {
        el.style.transitionDelay = `${delays[i] || 0}s`;
        i++;
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '80px 0px 80px 0px' });

  targets.forEach(el => observer.observe(el));

  // Reveal elements already in/near viewport — run at multiple intervals
  // because hash-navigation scroll can complete after DOMContentLoaded
  function revealVisible() {
    targets.forEach(el => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 120 && rect.bottom > -120) {
        el.classList.add('visible');
        observer.unobserve(el);
      }
    });
  }

  requestAnimationFrame(revealVisible);
  setTimeout(revealVisible, 100);
  setTimeout(revealVisible, 350);
  setTimeout(revealVisible, 700);

  window.addEventListener('scroll', revealVisible, { passive: true, once: true });
}

/* ══════════════════════════════════════════════
   MUSIC SYSTEM
══════════════════════════════════════════════ */
function initMusic() {
  const btn     = document.getElementById('music-btn');
  const btnText = btn.querySelector('.music-btn-text');
  const ripple  = btn.querySelector('.music-ripple');
  const blocked = document.getElementById('music-blocked');
  const audio   = document.getElementById('our-song');

  if (!audio) return;

  // restore state
  const savedPos     = parseFloat(localStorage.getItem('ls_music_pos') || '0');
  const savedPlaying = localStorage.getItem('ls_music_playing') === '1';
  if (savedPos > 0) audio.currentTime = savedPos;

  // Analyser
  let analyser, dataArr;
  let audioCtx, source, connected = false;

  function connectAnalyser() {
    if (connected) return;
    try {
      audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      source    = audioCtx.createMediaElementSource(audio);
      analyser  = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      dataArr   = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      connected = true;
    } catch {}
  }

  window.__musicTick = () => {
    if (!analyser || !shared.musicPlaying) {
      shared.musicReactive = Math.max(0, shared.musicReactive - 0.04);
      return;
    }
    analyser.getByteFrequencyData(dataArr);
    const avg = dataArr.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
    shared.musicReactive = Math.min(1, (avg / 128) * 1.4);
  };

  function setPlaying(play) {
    shared.musicPlaying = play;
    btn.setAttribute('aria-pressed', String(play));
    btnText.textContent  = play ? 'Now Playing' : 'Play Our Song';
    btn.querySelector('.music-btn-icon').textContent = play ? '♪' : '🎵';
    localStorage.setItem('ls_music_playing', play ? '1' : '0');
  }

  function triggerRipple(e) {
    const r = ripple;
    r.classList.remove('active');
    const rect = btn.getBoundingClientRect();
    r.style.left = `${(e?.clientX ?? rect.left + rect.width / 2) - rect.left}px`;
    r.style.top  = `${(e?.clientY ?? rect.top + rect.height / 2) - rect.top}px`;
    void r.offsetWidth;
    r.classList.add('active');
  }

  async function toggle(e) {
    triggerRipple(e);
    connectAnalyser();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();

    if (shared.musicPlaying) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
        if (blocked) blocked.hidden = true;
      } catch {
        if (blocked) {
          blocked.hidden = false;
          setTimeout(() => { blocked.hidden = true; }, 4000);
        }
      }
    }
  }

  btn.addEventListener('click', toggle);

  // save position
  setInterval(() => {
    if (shared.musicPlaying && !audio.paused) {
      localStorage.setItem('ls_music_pos', String(audio.currentTime));
    }
  }, 3000);

  if (savedPlaying) {
    document.addEventListener('click', async function once() {
      document.removeEventListener('click', once);
      connectAnalyser();
      try { await audio.play(); setPlaying(true); } catch {}
    }, { once: true });
  }
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
resize();
rafId = requestAnimationFrame(loop);

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initHero(shared);
  initSignal(shared);
  initMessages(shared);
  initStarmap(shared);
  initCountdown(shared);
  initMusic();
});
