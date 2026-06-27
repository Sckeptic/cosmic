/* music.js — plays "Agar Tum Saath Ho" from 26 s
   Web Audio MediaElementSource keeps the level analyser working
   so all music-reactive visuals (hearts, signal, etc.) still pulse.
*/

export function createMusicEngine() {
  let ctx, master, analyserNode, dataArray, sourceNode;
  let audio  = null;
  let playing = false;

  function buildAudio() {
    audio          = new Audio('/assets/music/our-song.mp3');
    audio.loop     = false;
    audio.preload  = 'none';
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('ended', () => {
      audio.currentTime = 26;
      audio.play();
    });
  }

  return {
    init() {
      ctx     = new (window.AudioContext || window.webkitAudioContext)();
      master  = ctx.createGain();
      master.gain.value = 0;

      analyserNode           = ctx.createAnalyser();
      analyserNode.fftSize   = 64;
      dataArray              = new Uint8Array(analyserNode.frequencyBinCount);

      master.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      buildAudio();
      sourceNode = ctx.createMediaElementSource(audio);
      sourceNode.connect(master);
    },

    get analyser()  { return analyserNode; },
    get dataArr()   { return dataArray; },
    get audioCtx()  { return ctx; },
    get isPlaying() { return playing; },

    async play() {
      if (playing) return;
      if (ctx.state === 'suspended') await ctx.resume();

      audio.currentTime = 26;
      await audio.play();
      playing = true;

      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.85, now + 2.5);
    },

    pause() {
      if (!playing) return;
      playing = false;

      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 1.2);
      setTimeout(() => {
        audio.pause();
        ctx.suspend();
      }, 1300);
    },

    getLevel() {
      if (!analyserNode || !playing) return 0;
      analyserNode.getByteFrequencyData(dataArray);
      const s = dataArray.slice(0, 8);
      return s.reduce((a, b) => a + b, 0) / (s.length * 128);
    },
  };
}
