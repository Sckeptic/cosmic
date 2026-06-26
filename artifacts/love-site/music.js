/* music.js — Generative ambient music for "274 km Apart"
   Key: A minor  |  66 BPM  |  Cinematic, longing, bittersweet
   Chord loop: Am → F → C → G  (2 bars each, ~29s full cycle)
*/

const BPM       = 66;
const BEAT      = 60 / BPM;          // 0.909 s
const BAR       = BEAT * 4;          // 3.636 s
const HALF      = BEAT / 2;          // 0.454 s
const AHEAD     = 1.2;               // lookahead window (s)
const TICK_MS   = 100;               // scheduler poll (ms)

/* Chord progression – each chord lasts 2 bars
   [bass Hz, [note Hz × 3]]                               */
const CHORDS = [
  { bass: 55.00, notes: [110.00, 130.81, 164.81] },  // Am
  { bass: 43.65, notes: [87.31,  110.00, 130.81] },  // F
  { bass: 65.41, notes: [130.81, 164.81, 196.00] },  // C
  { bass: 49.00, notes: [98.00,  123.47, 146.83] },  // G
];

/* Melody — half-beat steps (16 steps = 2 bars per chord)
   0 = rest                                              */
const MELODY = [
  // Am: A4 . G4 F4 . E4  /  D4 . E4 . F4 G4 . A4 . .
  440, 0, 392, 349, 0, 330,  294, 0, 330, 0, 349, 392, 0, 440, 0, 0,
  // F:  C5 . A4 . F4 .   /  G4 A4 . F4 . . E4 . . .
  523, 0, 440, 0, 349, 0,    392, 440, 0, 349, 0, 0, 330, 0, 0, 0,
  // C:  E4 G4 . A4 . G4  /  E4 . D4 E4 . G4 . A4 . .
  330, 392, 0, 440, 0, 392,  330, 0, 294, 330, 0, 392, 0, 440, 0, 0,
  // G:  D4 . E4 . G4 .   /  A4 B4 . A4 . G4 . . E4 .
  294, 0, 330, 0, 392, 0,    440, 494, 0, 440, 0, 392, 0, 0, 330, 0,
];

export function createMusicEngine() {
  let ctx, master, analyserNode, dataArray;
  let playing    = false;
  let nextTime   = 0;
  let chordIdx   = 0;
  let scheduler  = null;
  let fadeTimer  = null;

  /* ── audio helpers ─────────────────────────────────── */

  function mkOsc(type, freq, detune = 0) {
    const o = ctx.createOscillator();
    o.type            = type;
    o.frequency.value = freq;
    o.detune.value    = detune;
    return o;
  }

  function mkFilter(type, freq, q = 1) {
    const f = ctx.createBiquadFilter();
    f.type            = type;
    f.frequency.value = freq;
    f.Q.value         = q;
    return f;
  }

  /* ── pad chord (lush detuned sawtooths) ─────────────── */

  function pad(chord, t) {
    const dur = BAR * 2;
    const g   = ctx.createGain();
    const lp  = mkFilter('lowpass', 750, 0.6);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.048, t + dur * 0.2);
    g.gain.setValueAtTime(0.048, t + dur * 0.76);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.3);
    g.connect(lp);
    lp.connect(master);

    chord.notes.forEach(f => {
      [-8, 0, 8].forEach(dt => {
        const o = mkOsc('sawtooth', f, dt);
        o.connect(g); o.start(t); o.stop(t + dur + 0.5);
      });
      const sine = mkOsc('sine', f);
      const sg   = ctx.createGain(); sg.gain.value = 0.2;
      sine.connect(sg); sg.connect(g);
      sine.start(t); sine.stop(t + dur + 0.5);
    });
  }

  /* ── bass (sine, 2 pulses per chord) ────────────────── */

  function bass(freq, t, dur) {
    const g  = ctx.createGain();
    const lp = mkFilter('lowpass', 240, 0.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.24, t + 0.07);
    g.gain.setValueAtTime(0.24, t + dur * 0.55);
    g.gain.linearRampToValueAtTime(0, t + dur);
    g.connect(lp); lp.connect(master);

    const o  = mkOsc('sine', freq);
    const o2 = mkOsc('sine', freq * 2);
    const g2 = ctx.createGain(); g2.gain.value = 0.09;
    o.connect(g); o2.connect(g2); g2.connect(g);
    o.start(t); o2.start(t);
    o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }

  /* ── plucked melody (triangle + AR envelope) ────────── */

  function note(freq, t) {
    if (!freq) return;
    const dur = HALF * 1.7;
    const g   = ctx.createGain();
    const lp  = mkFilter('lowpass', 4200, 1.1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.028);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(lp); lp.connect(master);

    const o   = mkOsc('triangle', freq);
    const vib = mkOsc('sine', 5.4);
    const vg  = ctx.createGain(); vg.gain.value = 2.8;
    vib.connect(vg); vg.connect(o.frequency);
    o.connect(g);
    o.start(t); vib.start(t);
    o.stop(t + dur); vib.stop(t + dur);
  }

  /* ── reverb via feedback delay network ──────────────── */

  function buildReverb() {
    const send  = ctx.createGain(); send.gain.value = 0.26;
    const d1    = ctx.createDelay(0.38); d1.delayTime.value = 0.31;
    const d2    = ctx.createDelay(0.46); d2.delayTime.value = 0.43;
    const fb1   = ctx.createGain(); fb1.gain.value = 0.40;
    const fb2   = ctx.createGain(); fb2.gain.value = 0.36;
    const wet   = ctx.createGain(); wet.gain.value = 0.32;
    const damp  = mkFilter('lowpass', 2800, 0.5);

    master.connect(send);
    send.connect(d1); d1.connect(fb1); fb1.connect(d1);
    send.connect(d2); d2.connect(fb2); fb2.connect(d2);
    d1.connect(damp); d2.connect(damp);
    damp.connect(wet); wet.connect(analyserNode);
  }

  /* ── schedule one chord slot ─────────────────────────── */

  function scheduleChord() {
    const chord = CHORDS[chordIdx];
    const t     = nextTime;
    const dur   = BAR * 2;

    pad(chord, t);
    bass(chord.bass, t,           dur * 0.54);
    bass(chord.bass, t + dur * 0.5, dur * 0.48);

    const off = chordIdx * 16;
    for (let i = 0; i < 16; i++) {
      note(MELODY[off + i], t + i * HALF);
    }

    nextTime += dur;
    chordIdx  = (chordIdx + 1) % CHORDS.length;
  }

  /* ── lookahead tick ─────────────────────────────────── */

  function tick() {
    while (nextTime < ctx.currentTime + AHEAD) scheduleChord();
  }

  /* ── public API ─────────────────────────────────────── */

  return {
    init() {
      ctx          = new (window.AudioContext || window.webkitAudioContext)();
      master       = ctx.createGain();
      master.gain.value = 0;

      analyserNode           = ctx.createAnalyser();
      analyserNode.fftSize   = 64;
      dataArray              = new Uint8Array(analyserNode.frequencyBinCount);

      master.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      buildReverb();
    },

    get analyser()  { return analyserNode; },
    get dataArr()   { return dataArray; },
    get audioCtx()  { return ctx; },
    get isPlaying() { return playing; },

    async play() {
      if (playing) return;
      if (ctx.state === 'suspended') await ctx.resume();
      playing  = true;
      nextTime = ctx.currentTime + 0.05;
      tick();
      scheduler = setInterval(tick, TICK_MS);

      clearTimeout(fadeTimer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.44, now + 2.8);
    },

    pause() {
      playing = false;
      clearInterval(scheduler);
      scheduler = null;
      clearTimeout(fadeTimer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 1.4);
      fadeTimer = setTimeout(() => ctx.suspend(), 1600);
    },

    getLevel() {
      if (!analyserNode || !playing) return 0;
      analyserNode.getByteFrequencyData(dataArray);
      const s = dataArray.slice(0, 8);
      return s.reduce((a, b) => a + b, 0) / (s.length * 128);
    },
  };
}
