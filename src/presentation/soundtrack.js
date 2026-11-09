/**
 * Original procedural soundtrack (Web Audio, no audio files to license or
 * download): a warm detuned drone through a slowly breathing low-pass,
 * plus a filtered-noise "whoosh" on every scene cut.
 *
 * The presentation starts muted (autoplay policy); the AudioContext is
 * only created when the visitor turns sound on, which is a user gesture.
 */
export function createSoundtrack() {
  let ctx = null;
  let master = null;
  let noise = null;
  let muted = true;
  const sources = [];

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Drone: root, fifth and octave, slightly detuned, into a resonant LPF.
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 480;
    lpf.Q.value = 5;
    lpf.connect(master);
    [
      [55, 'triangle', 0.55, 0],
      [82.41, 'sawtooth', 0.14, -6],
      [110, 'sawtooth', 0.12, 7],
      [164.8, 'sine', 0.08, 3],
    ].forEach(([hz, type, level, detune]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(lpf);
      o.start();
      sources.push(o);
    });
    // Slow "breathing" of the filter.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const depth = ctx.createGain();
    depth.gain.value = 300;
    lfo.connect(depth).connect(lpf.frequency);
    lfo.start();
    sources.push(lfo);

    // One second of white noise, reused by every whoosh.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function ramp(value, seconds = 0.6) {
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + seconds);
  }

  return {
    get muted() {
      return muted;
    },
    setMuted(next) {
      muted = next;
      if (!muted && !ctx && !build()) {
        muted = true;
        return;
      }
      ctx?.resume();
      ramp(muted ? 0 : 0.2);
    },
    /** Cut transition: a short band-passed noise sweep. */
    whoosh(strength = 1) {
      if (muted || !ctx || ctx.state !== 'running') return;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      const now = ctx.currentTime;
      bp.frequency.setValueAtTime(260, now);
      bp.frequency.exponentialRampToValueAtTime(2600, now + 0.55);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.32 * strength, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      src.connect(bp).connect(g).connect(master);
      src.start(now);
      src.stop(now + 0.75);
    },
    pause() {
      ctx?.suspend();
    },
    resume() {
      if (!muted) ctx?.resume();
    },
    dispose() {
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      ctx?.close();
      ctx = null;
    },
  };
}
