import { init as initHero,      onEnter as heroEnter      } from '/hero.js';
import { init as initSignal,    onEnter as signalEnter    } from '/signal.js';
import { init as initMessages,  onEnter as messagesEnter  } from '/messages.js';
import { init as initStarmap,   onEnter as starmapEnter   } from '/starmap.js';
import { init as initCountdown, onEnter as countdownEnter } from '/countdown.js';
import { init as initReasons,   onEnter as reasonsEnter   } from '/reasons.js';
import { createMusicEngine }                               from '/music.js';

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
    g.addColorStop(0,   `rgba(255,180,200,${a * 0.7})`);
    g.addColorStop(0.4, `rgba(200,140,200,${a * 0.25})`);
    g.addColorStop(1,   'transparent');

    starCtx.beginPath();
    starCtx.arc(s.x, s.y, glow, 0, Math.PI * 2);
    starCtx.fillStyle = g;
    starCtx.fill();

    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.r * boost, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(255,230,240,${a})`;
    starCtx.fill();
  }
}

let rafId;
function loop() {
  if (typeof window.__musicTick === 'function') window.__musicTick();
  if (typeof window.__cursorTick === 'function') window.__cursorTick();
  if (!shared.reducedMotion) drawStars();
  rafId = requestAnimationFrame(loop);
}

window.addEventListener('resize', resizeStars, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(rafId);
  else rafId = requestAnimationFrame(loop);
});


/* ══════════════════════════════════════════════
   FLOATING HEARTS OVERLAY
══════════════════════════════════════════════ */
function initFloatingHearts() {
  if (shared.reducedMotion) return;
  const overlay = document.getElementById('hearts-overlay');
  if (!overlay) return;

  const heartChars = ['♥', '♡', '❤', '✿'];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fh';
    const sz = 0.6 + Math.random() * 1.0;
    const left = 3 + Math.random() * 94;
    const dur  = 18 + Math.random() * 22;
    const del  = -(Math.random() * dur);
    const opacity = 0.15 + Math.random() * 0.25;
    el.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
    el.style.cssText = `
      left: ${left}%;
      font-size: ${sz}rem;
      animation-duration: ${dur}s;
      animation-delay: ${del}s;
      opacity: ${opacity};
      color: hsl(${330 + Math.random() * 30}deg, ${70 + Math.random() * 20}%, ${70 + Math.random() * 15}%);
    `;
    overlay.appendChild(el);
  }
}


/* ══════════════════════════════════════════════
   CURSOR TRAIL
══════════════════════════════════════════════ */
function initCursorTrail() {
  if (shared.reducedMotion) return;
  const canvas = document.getElementById('cursor-trail');
  if (!canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }, { passive: true });

  const ctx    = canvas.getContext('2d');
  const trails = [];
  let mx = -999, my = -999;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (Math.random() > 0.55) return;
    const hue = 330 + Math.random() * 40;
    trails.push({
      x: mx + (Math.random() - 0.5) * 6,
      y: my + (Math.random() - 0.5) * 6,
      r: 2 + Math.random() * 3,
      alpha: 0.7 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(0.3 + Math.random() * 0.8),
      hue,
    });
  }, { passive: true });

  window.__cursorTick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.x += t.vx; t.y += t.vy;
      t.alpha -= 0.03;
      t.r     -= 0.04;
      if (t.alpha <= 0 || t.r <= 0) { trails.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle   = `hsl(${t.hue}deg, 85%, 70%)`;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = `hsl(${t.hue}deg, 85%, 70%)`;

      /* Draw a tiny heart */
      const s = t.r;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + s * 0.4);
      ctx.bezierCurveTo(t.x, t.y, t.x - s * 1.2, t.y, t.x - s * 1.2, t.y + s * 0.5);
      ctx.bezierCurveTo(t.x - s * 1.2, t.y + s * 1.0, t.x, t.y + s * 1.4, t.x, t.y + s * 1.6);
      ctx.bezierCurveTo(t.x, t.y + s * 1.4, t.x + s * 1.2, t.y + s * 1.0, t.x + s * 1.2, t.y + s * 0.5);
      ctx.bezierCurveTo(t.x + s * 1.2, t.y, t.x, t.y, t.x, t.y + s * 0.4);
      ctx.fill();
      ctx.restore();
    }
  };
}


/* ══════════════════════════════════════════════
   TYPEWRITER QUOTE (hero)
══════════════════════════════════════════════ */
const QUOTES = [
  "distance is the space between heartbeats, not between people",
  "i don't miss you at night — i miss you at 2 AM, when everything goes quiet",
  "274 km. every single one of them knows your name",
  "some feelings don't travel by phone. they just arrive",
  "i think about you in a frequency only you can hear",
  "the stars don't care about distance. neither do i",
  "you're the reason silence doesn't feel empty anymore",
  "the signal drops. the feeling never does",
];

function initTypewriter() {
  const el = document.getElementById('hero-quote');
  if (!el) return;

  let qi = Math.floor(Math.random() * QUOTES.length);
  let ci = 0, deleting = false, pauseFor = 0;

  function tick() {
    if (pauseFor > 0) { pauseFor--; setTimeout(tick, 80); return; }

    const q = QUOTES[qi];
    if (!deleting) {
      el.textContent = q.slice(0, ++ci);
      if (ci >= q.length) { el.classList.add('done'); pauseFor = 38; deleting = true; }
      setTimeout(tick, 52 + Math.random() * 38);
    } else {
      el.classList.remove('done');
      el.textContent = q.slice(0, --ci);
      if (ci <= 0) {
        qi = (qi + 1) % QUOTES.length;
        deleting = false;
        pauseFor = 12;
      }
      setTimeout(tick, 22);
    }
  }
  setTimeout(tick, 1800);
}


/* ══════════════════════════════════════════════
   HEARTBEATS COUNTER (hero)
══════════════════════════════════════════════ */
function initHeartbeats() {
  const el = document.getElementById('hb-count');
  if (!el) return;

  const BPM = 72;
  const BEATS_PER_MS = BPM / 60000;

  /* Count heartbeats since midnight (romantic "today" framing) */
  function getCount() {
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return Math.floor((now - midnight.getTime()) * BEATS_PER_MS);
  }

  function fmt(n) {
    return n.toLocaleString();
  }

  let displayed = getCount();
  el.textContent = fmt(displayed);

  setInterval(() => {
    const real = getCount();
    /* Smooth the update — increment by 1 until caught up */
    if (displayed < real) {
      displayed++;
      el.textContent = fmt(displayed);
    }
  }, Math.round(60000 / BPM));
}


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

    this._activate(0, true);
  }

  buildNav() {
    this.dots    = Array.from(document.querySelectorAll('.page-dot'));
    this.prevBtn = document.getElementById('arrow-prev');
    this.nextBtn = document.getElementById('arrow-next');
    this.numEl   = document.getElementById('page-num');
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
      setTimeout(() => {
        next.el.classList.remove('page-leaving');
        next.el.classList.remove('page-entering');
        next.el.classList.add('page-active');
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
        if (prev && prev.el !== next.el) prev.el.classList.remove('page-leaving');
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
    this.dots.forEach((d, j) => d.classList.toggle('active', j === i));
    if (this.numEl) this.numEl.textContent = String(i + 1).padStart(2, '0');
    if (this.prevBtn) this.prevBtn.classList.toggle('hidden', i === 0);
    if (this.nextBtn) this.nextBtn.classList.toggle('hidden', i === n - 1);
  }

  bindKeys() {
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.next(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); this.prev(); }
    });
  }

  bindSwipe() {
    let startX = 0, startY = 0, startTime = 0;
    let locked = null; // 'h' | 'v' | null
    let activeDrag = false;
    const HORIZ_THRESHOLD = 48;   // min px to commit a swipe
    const HORIZ_BIAS      = 1.6;  // dx must be this times ady to count as horizontal
    const MAX_DURATION    = 520;  // ms — flicks only

    // ── Swipe hint indicator (two faint chevrons) ──
    const hint = document.createElement('div');
    hint.id = 'swipe-hint';
    hint.innerHTML = '<span>‹</span><span>›</span>';
    hint.style.cssText = [
      'position:fixed',
      'bottom:clamp(20px,4vh,36px)',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:201',
      'display:flex',
      'gap:6px',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.25s ease',
      'font-family:var(--font-head)',
      'font-size:1.1rem',
      'color:rgba(255,107,157,0.55)',
      'letter-spacing:4px',
    ].join(';');
    document.body.appendChild(hint);

    // Show hint briefly when drag starts horizontal
    let hintTimer;
    const showHint = () => {
      clearTimeout(hintTimer);
      hint.style.opacity = '1';
      hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 600);
    };

    // ── Track finger ──
    window.addEventListener('touchstart', e => {
      startX    = e.touches[0].clientX;
      startY    = e.touches[0].clientY;
      startTime = Date.now();
      locked    = null;
      activeDrag = false;
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (!locked) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 8 || dy > 8) {
          locked = (dx > dy * HORIZ_BIAS) ? 'h' : 'v';
          if (locked === 'h') { activeDrag = true; showHint(); }
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', e => {
      if (!activeDrag) return;
      activeDrag = false;
      hint.style.opacity = '0';

      if (Date.now() - startTime > MAX_DURATION) return;

      const dx  = e.changedTouches[0].clientX - startX;
      const dy  = e.changedTouches[0].clientY - startY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      // Must be clearly horizontal and past threshold
      if (adx < HORIZ_THRESHOLD) return;
      if (adx < ady * HORIZ_BIAS) return;

      // Don't navigate if the swipe started inside a scrollable element
      const target = e.changedTouches[0].target;
      const scrollable = target.closest('[data-swipe-ignore], .messages-input, textarea, input');
      if (scrollable) return;

      dx < 0 ? this.next() : this.prev();
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
      activeDrag = false;
      hint.style.opacity = '0';
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
    document.getElementById('key-hint')?.classList.add('hidden');
  }

  hideHintAfterDelay() { setTimeout(() => this.hideHint(), 5000); }
}


/* ══════════════════════════════════════════════
   MUSIC SYSTEM
══════════════════════════════════════════════ */
function initMusic() {
  const btn     = document.getElementById('music-btn');
  const btnText = btn.querySelector('.music-btn-text');
  const ripple  = btn.querySelector('.music-ripple');
  if (!btn) return;

  const engine      = createMusicEngine();
  let   engineReady = false;

  function ensureEngine() {
    if (engineReady) return;
    engine.init();
    engineReady = true;
  }

  window.__musicTick = () => {
    if (!shared.musicPlaying) {
      shared.musicReactive = Math.max(0, shared.musicReactive - 0.04);
      return;
    }
    shared.musicReactive = Math.min(1, engine.getLevel() * 1.6);
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
    ensureEngine();
    if (shared.musicPlaying) {
      engine.pause(); setPlaying(false);
    } else {
      await engine.play(); setPlaying(true);
    }
  }

  btn.addEventListener('click', toggle);

  const savedPlaying = localStorage.getItem('ls_music_playing') === '1';
  if (savedPlaying) {
    document.addEventListener('click', async function once() {
      document.removeEventListener('click', once);
      ensureEngine();
      await engine.play(); setPlaying(true);
    }, { once: true });
  }
}


/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
resizeStars();
rafId = requestAnimationFrame(loop);

document.addEventListener('DOMContentLoaded', () => {
  const curtain = document.getElementById('curtain');
  requestAnimationFrame(() => requestAnimationFrame(() => curtain?.classList.add('out')));

  const hint = document.getElementById('key-hint');
  if (hint && navigator.maxTouchPoints > 0) hint.textContent = 'swipe to explore';

  initHero(shared);
  initSignal(shared);
  initMessages(shared);
  initStarmap(shared);
  initCountdown(shared);
  initReasons(shared);
  initMusic();

  initFloatingHearts();
  initCursorTrail();
  initTypewriter();
  initHeartbeats();

  function letterEnter() {
    const el = document.getElementById('letter');
    if (!el) return;

    // Reset scroll
    el.scrollTop = 0;

    // Scroll progress bar
    const progress = document.getElementById('letter-progress');
    function updateProgress() {
      if (!el.classList.contains('page-active')) return;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      if (progress) progress.style.width = pct + '%';
    }
    el.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Cursor
    const cursor = document.getElementById('letter-cursor');
    const paras  = Array.from(el.querySelectorAll('.footer-letter p, .footer-signature'));
    paras.forEach(p => p.classList.remove('letter-visible'));
    if (cursor) { cursor.classList.remove('done'); cursor.classList.add('active'); }

    paras.forEach((p, i) => {
      setTimeout(() => {
        p.classList.add('letter-visible');
        // Move cursor just below this paragraph
        if (cursor && i < paras.length - 1) {
          const rect = p.getBoundingClientRect();
          const parentRect = el.getBoundingClientRect();
          cursor.style.top = (rect.bottom - parentRect.top + el.scrollTop + 4) + 'px';
        }
        // Hide cursor after last item
        if (i === paras.length - 1 && cursor) {
          setTimeout(() => { cursor.classList.remove('active'); cursor.classList.add('done'); }, 800);
        }
      }, 300 + i * 200);
    });

    // Ambient letter particles
    const canvas = document.getElementById('letter-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;
    const dots = [];

    function resizeCanvas() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();

    for (let i = 0; i < 28; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.5 + Math.random() * 1.2,
        vy: -(0.1 + Math.random() * 0.25),
        vx: (Math.random() - 0.5) * 0.15,
        alpha: 0.1 + Math.random() * 0.25,
        life: Math.random(),
      });
    }

    function drawParticles() {
      if (!el.classList.contains('page-active')) { cancelAnimationFrame(rafId); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.y  += d.vy;
        d.x  += d.vx;
        d.life += 0.003;
        const a = d.alpha * Math.abs(Math.sin(d.life * Math.PI));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,107,157,${a})`;
        ctx.fill();
        if (d.y < -10) { d.y = canvas.height + 10; d.x = Math.random() * canvas.width; }
      });
      rafId = requestAnimationFrame(drawParticles);
    }
    cancelAnimationFrame(rafId);
    drawParticles();
  }

  const pages = [
    { el: document.getElementById('hero'),      onEnter: heroEnter      },
    { el: document.getElementById('signal'),    onEnter: signalEnter    },
    { el: document.getElementById('messages'),  onEnter: messagesEnter  },
    { el: document.getElementById('starmap'),   onEnter: starmapEnter   },
    { el: document.getElementById('countdown'), onEnter: countdownEnter },
    { el: document.getElementById('reasons'),   onEnter: reasonsEnter   },
    { el: document.getElementById('letter'),    onEnter: letterEnter    },
  ];

  window.pageMgr = new PageManager(pages);
});
