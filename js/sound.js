/*
  Soft, synthesised sounds — no audio files, nothing loud or sudden.
  Every sound checks the Grown-ups sound switch at the moment it plays.
  iOS only allows audio after a touch, so the first tap anywhere unlocks it.
*/
(function () {
  'use strict';

  const MASTER_VOLUME = 0.22;
  let ctx = null, master = null, unlocked = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    const c = ensure();
    if (!c) return;
    // A silent one-sample buffer inside the gesture is what iOS needs.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
    unlocked = true;
  }

  // One gentle note: quick attack, soft exponential tail.
  function tone(freq, t0, dur, type, vol, glideTo) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  const SOUNDS = {
    // C major arpeggio with a soft octave shimmer.
    chime(t) {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(f, t + i * 0.11, 1.0, 'sine', 0.5);
        tone(f * 2, t + i * 0.11, 0.5, 'triangle', 0.06);
      });
    },
    pop(t) { tone(380 + Math.random() * 120, t, 0.13, 'sine', 0.28, 900 + Math.random() * 200); },
    sparkle(t) { [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, t + i * 0.05, 0.4, 'sine', 0.07)); },
    tap(t) { tone(660, t, 0.08, 'sine', 0.12); },
  };

  function play(name, delay) {
    if (!Store.settings.sound || !SOUNDS[name]) return;
    const c = ensure();
    if (!c) return;
    try { SOUNDS[name](c.currentTime + (delay || 0)); } catch (e) { /* audio is never worth a crash */ }
  }

  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });

  window.Sound = { play, unlock };
})();
