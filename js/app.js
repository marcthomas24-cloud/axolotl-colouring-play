(function () {
  'use strict';

  // Stop iOS Safari pinch-zooming the whole app (double-tap zoom is handled by
  // `touch-action: manipulation` in CSS, which doesn't swallow fast repeat taps).
  // The colouring canvas gets its own zoom in Pass 2.
  ['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));

  // Offline support when hosted (service workers don't run from file://).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* optional */ }));
  }

  // Pictures load from IndexedDB first, so no screen ever shows a missing picture.
  Store.ready.then(() => Router.start(), () => Router.start());
})();
