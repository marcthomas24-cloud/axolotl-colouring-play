/*
  Spoken words for non-readers: the cheer, "Meet Pip!", name choices, "New picture!".
  Uses the device's built-in voice (works offline); silent if sound or spoken words are off
  in the grown-ups area, or if the device has no voice.
  Like audio, iOS only allows speech after a touch, so the first tap primes it.
*/
(function () {
  'use strict';

  const synth = window.speechSynthesis;
  let voice = null, primed = false;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    // Prefer a friendly English voice; fall back to whatever the device has.
    voice = voices.find(v => /en-GB/i.test(v.lang) && /female|samantha|serena|kate|martha|daniel/i.test(v.name)) ||
            voices.find(v => /^en/i.test(v.lang)) || null;
  }
  if (synth) {
    pickVoice();
    if ('onvoiceschanged' in synth) synth.onvoiceschanged = pickVoice;
  }

  function prime() {
    if (primed || !synth) return;
    primed = true;
    try { const u = new SpeechSynthesisUtterance(''); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ }
  }
  document.addEventListener('pointerdown', prime, { capture: true, passive: true });

  function say(text) {
    if (!synth || !Store.settings.sound || !Store.settings.voice || !text) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = 0.92;
      u.pitch = 1.15;
      u.volume = 0.9;
      synth.speak(u);
    } catch (e) { /* speech is a nicety, never a crash */ }
  }

  function stop() { try { if (synth) synth.cancel(); } catch (e) { /* ignore */ } }

  window.Speech = { say, stop };
})();
