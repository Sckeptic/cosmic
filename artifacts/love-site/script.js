import { init as initHero,      onEnter as heroEnter      } from '/hero.js';
import { init as initSignal,    onEnter as signalEnter    } from '/signal.js';
import { init as initMessages,  onEnter as messagesEnter  } from '/messages.js';
import { init as initStarmap,   onEnter as starmapEnter   } from '/starmap.js';
import { init as initCountdown, onEnter as countdownEnter } from '/countdown.js';

/* ── Shared reactive state ── */
export const shared = {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  musicPlaying:  false,
  musicReactive: 0,
};

/* ══════════════════════════════════════════════
   GLOBAL STAR CANVAS
══════════════════════════════════════════════ */
const starCanvas = document.getElementById('star-canvas');
const starCtx    = starCanvas.getContext('2d');
const STAR_COUNT = 280;
const stars = [];

function seedRng(s) {
  let x = s;
  return () => { x = (x * 16807 + 0) % 2147483647; return (x - 1) / 2147483646; };
}
const rng = seedRng(20240314);

function resizeStars() {
  starCanvas.width  = window.innerWidth;
  starCanvas.height = window.innerHeight;
  stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = rng();
    stars.push({
      x:     rng() * starCanvas.width,
      y:     rng() * starCanvas.height,
      r:     0.3 + r * 1.2,
      sp:    0.06 + rng() * 0.14,
      tw:    rng() * Math.PI * 2,
      twSpd: 0.008 + rng() * 0.018,
      vy:    0.04 + rng() * 0.08,
      alpha: 0.2 + rng() * 0.6,
    });
  }
}

function drawStars() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  const boost = 1 + shared.musicReactive * 0.6;
  for (const s of stars) {
    s.tw += s.twSpd;
    s.y  += s.vy * 0.4;
    if (s.y > starCanvas.height + 2) s.y = -2;

    const a = s.alpha * (0.5 + 0.5 * Math.sin(s.tw)) * boost;
    const glow = s.r * 3.5 * boost;

    const g = starCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glow);
    g.addColorStop(0,   `rgba(200,220,255,${a * 0.9})`);
    g.addColorStop(0.4, `rgba(140,180,255,${a * 0.3})`);
    g.addColorStop(1,   'transparent');

    starCtx.beginPath();
    starCtx.arc(s.x, s.y, glow, 0, Math.PI * 2);
    starCtx.fillStyle = g;
    starCtx.fill();

    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.r * boost, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(230,240,255,${a})`;
    starCtx.fill();
  }
}

let rafId;
function loop() {
  if (typeof window.__musicTick === 'function') window.__musicTick();
  if (!shared.reducedMotion) drawStars();
  rafId = requestAnimationFrame(loop);
}

window.addEventListener('resize', resizeStars, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(rafId);
  else rafId = requestAnimationFrame(loop);
});


/* ══════════════════════════════════════════════
   PAGE MANAGER
══════════════════════════════════════════════ */
class PageManager {
  constructor(pages) {
    this.pages = pages;
    this.current = 0;
    this.transitioning = false;
    this.dots = [];
    this.hintHidden = false;

    this.buildNav();
    this.bindKeys();
    this.bindSwipe();
    this.bindArrows();
    this.bindDots();
    this.hideHintAfterDelay();

    // Activate first page
    this._activate(0, true);
  }

  buildNav() {
    this.dots = Array.from(document.querySelectorAll('.page-dot'));
    this.prevBtn  = document.getElementById('arrow-prev');
    this.nextBtn  = document.getElementById('arrow-next');
    this.numEl    = document.getElementById('page-num');
  }

  _activate(index, instant = false) {
    const prev = this.pages[this.current];
    const next = this.pages[index];

    if (prev && prev.el !== next.el && !instant) {
      prev.el.classList.remove('page-entering');
      prev.el.classList.add('page-leaving');
      prev.el.classList.remove('page-active');
    }

    if (!instant && prev && prev.el !== next.el) {
      // Brief delay so leaving transition starts first
      setTimeout(() => {
        next.el.classList.remove('page-leaving');
        next.el.classList.remove('page-entering');
        next.el.classList.add('page-active');
        // Force reflow then add entering class to restart animations
        void next.el.offsetWidth;
        next.el.classList.add('page-entering');
        if (next.onEnter) next.onEnter();
      }, 40);
    } else {
      next.el.classList.remove('page-leaving');
      next.el.classList.add('page-active');
      void next.el.offsetWidth;
      next.el.classList.add('page-entering');
      if (next.onEnter) next.onEnter();
    }

    this.current = index;
    this.updateUI();

    if (!instant) {
      this.transitioning = true;
      setTimeout(() => {
        this.transitioning = false;
        if (prev && prev.el !== next.el) {
          prev.el.classList.remove('page-leaving');
        }
      }, 950);
    }
  }

  goTo(index) {
    if (this.transitioning) return;
    if (index < 0 || index >= this.pages.length) return;
    if (index === this.current) return;
    document.documentElement.dataset.navDir = index > this.current ? 'forward' : 'back';
    this._activate(index);
    this.hideHint();
  }

  next() { this.goTo(this.current + 1); }
  prev() { this.goTo(this.current - 1); }

  updateUI() {
    const i = this.current;
    const n = this.pages.length;

    // Dots
    this.dots.forEach((d, j) => d.classList.toggle('active', j === i));

    // Counter
    if (this.numEl) this.numEl.textContent = String(i + 1).padStart(2, '0');

    // Arrows
    if (this.prevBtn) this.prevBtn.classList.toggle('hidden', i === 0);
    if (this.nextBtn) this.nextBtn.classList.toggle('hidden', i === n - 1);
  }

  bindKeys() {
    window.addEventListener('keydown', e => {
      // Don't intercept when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.next(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); this.prev(); }
    });
  }

  bindSwipe() {
    let startX = 0, startY = 0, startTime = 0;
    const threshold = 50;

    window.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    window.addEventListener('touchend', e => {
      if (Date.now() - startTime > 500) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < threshold) return;

      if (adx > ady) {
        dx < 0 ? this.next() : this.prev();
      } else {
        dy < 0 ? this.next() : this.prev();
      }
    }, { passive: true });

    // Mouse wheel (debounced)
    let wheelTimer = null;
    window.addEventListener('wheel', e => {
      // Don't trigger if in messages input area
      if (e.target.closest('.messages-input-bar')) return;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        e.deltaY > 0 ? this.next() : this.prev();
      }, 80);
    }, { passive: true });
  }

  bindArrows() {
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());
  }

  bindDots() {
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goTo(i));
    });
  }

  hideHint() {
    if (this.hintHidden) return;
    this.hintHidden = true;
    const hint = document.getElementById('key-hint');
    hint?.classList.add('hidden');
  }

  hideHintAfterDelay() {
    setTimeout(() => this.hideHint(), 5000);
  }
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

  const savedPos     = parseFloat(localStorage.getItem('ls_music_pos') || '0');
  const savedPlaying = localStorage.getItem('ls_music_playing') === '1';
  if (savedPos > 0) audio.currentTime = savedPos;

  let analyser, dataArr, audioCtx, source, connected = false;

  function connectAnalyser() {
    if (connected) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      source   = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      dataArr  = new Uint8Array(analyser.frequencyBinCount);
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
    btnText.textContent = play ? 'Now Playing' : 'Play Our Song';
    btn.querySelector('.music-btn-icon').textContent = play ? '♪' : '🎵';
    localStorage.setItem('ls_music_playing', play ? '1' : '0');
  }

  function triggerRipple(e) {
    ripple.classList.remove('active');
    const rect = btn.getBoundingClientRect();
    ripple.style.left = `${(e?.clientX ?? rect.left + rect.width / 2) - rect.left}px`;
    ripple.style.top  = `${(e?.clientY ?? rect.top  + rect.height / 2) - rect.top}px`;
    void ripple.offsetWidth;
    ripple.classList.add('active');
  }

  async function toggle(e) {
    triggerRipple(e);
    connectAnalyser();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    if (shared.musicPlaying) {
      audio.pause(); setPlaying(false);
    } else {
      try {
        await audio.play(); setPlaying(true);
        if (blocked) blocked.hidden = true;
      } catch {
        if (blocked) { blocked.hidden = false; setTimeout(() => { blocked.hidden = true; }, 4000); }
      }
    }
  }

  btn.addEventListener('click', toggle);

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
resizeStars();
rafId = requestAnimationFrame(loop);

document.addEventListener('DOMContentLoaded', () => {
  // Cinematic curtain — lift after a short delay
  const curtain = document.getElementById('curtain');
  requestAnimationFrame(() => requestAnimationFrame(() => curtain?.classList.add('out')));

  // Adapt nav hint to touch vs keyboard
  const hint = document.getElementById('key-hint');
  if (hint && navigator.maxTouchPoints > 0) hint.textContent = 'swipe to explore';

  // Init all modules
  initHero(shared);
  initSignal(shared);
  initMessages(shared);
  initStarmap(shared);
  initCountdown(shared);
  initMusic();

  // Build page list with onEnter callbacks
  const pages = [
    { el: document.getElementById('hero'),      onEnter: heroEnter      },
    { el: document.getElementById('signal'),    onEnter: signalEnter    },
    { el: document.getElementById('messages'),  onEnter: messagesEnter  },
    { el: document.getElementById('starmap'),   onEnter: starmapEnter   },
    { el: document.getElementById('countdown'), onEnter: countdownEnter },
  ];

  window.pageMgr = new PageManager(pages);
});
