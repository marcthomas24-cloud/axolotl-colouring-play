/*
  Offline support when the prototype is hosted on a website (a service worker can't run
  from file://, where the app already works offline). Every app file is cached at install;
  requests go to the network first so an online device always gets the latest version,
  and fall back to the cache when there's no connection (e.g. in the car).

  When adding a file to index.html, add it to FILES too and bump VERSION.
*/
const VERSION = 'axolotl-colouring-v100';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/util.js',
  'js/art.js',
  'js/raster/final-explorer.js',
  'js/raster/final-pirate.js',
  'js/raster/final-wizard.js',
  'js/raster/final-astronaut.js',
  'js/raster/final-princess.js',
  'js/raster/final-odyssey.js',
  'js/raster/final-coral.js',
  'js/raster/final-coral-2.js',
  'js/raster/final-treasure-map.js',
  'js/raster/final-treasure.js',
  'js/raster/final-jungle-waterfall.js',
  'js/raster/final-shipwreck.js',
  'js/raster/final-village.js',
  'js/raster/final-space-adventure.js',
  'js/raster/final-crystal-cave.js',
  'js/raster/final-magic-reef.js',
  'js/raster/final-market-square.js',
  'js/raster/final-star-city.js',
  'js/raster/final-diving-for-treasure.js',
  'js/raster/final-manta-ride.js',
  'js/raster/final-lantern-cave.js',
  'js/raster/final-lighthouse-cove.js',
  'js/raster/final-snorkel-ruins.js',
  'js/raster/final-crystal-treasure.js',
  'js/raster/final-polar-pals.js',
  'js/raster/final-pirate-cove.js',
  'js/raster/final-waterfall-splash.js',
  'js/raster/final-bat-cave.js',
  'js/raster/final-jungle-swing.js',
  'js/raster/final-desert-dinosaur.js',
  'js/raster/final-volcano-trek.js',
  'js/raster/final-submarine.js',
  'js/raster/final-pearl-garden.js',
  'js/raster/final-wizards-arch.js',
  'js/raster/final-sea-castle.js',
  'js/raster/final-castle-bridge.js',
  'js/raster/final-market-bridge.js',
  'js/raster/final-shell-fountain.js',
  'js/raster/final-picnic.js',
  'js/raster/final-waterfall-picnic.js',
  'js/raster/final-treehouse-picnic.js',
  'js/raster/final-woodland-picnic.js',
  'js/raster/final-kelp-picnic.js',
  'js/raster/final-sweet-dreams.js',
  'js/raster/final-moonlit-nap.js',
  'js/raster/final-new-home.js',
  'js/raster/final-hide-and-seek.js',
  'js/raster/final-home-sweet-home.js',
  'js/raster/final-clam-cottage.js',
  'js/raster/final-moving-in.js',
  'js/raster/final-open-door.js',
  'js/raster/final-puffer.js',
  'js/raster/final-puffer-wow.js',
  'js/raster/final-bubble-bath.js',
  'js/raster/final-big-bubble.js',
  'js/raster/final-jelly-hello.js',
  'js/raster/final-seahorse.js',
  'js/raster/final-glow-parade.js',
  'js/raster/final-baby.js',
  'js/raster/final-party.js',
  'js/raster/final-sandcastle.js',
  'js/raster/final-temple.js',
  'js/raster/final-market.js',
  'js/raster/final-football.js',
  'js/raster/final-surfing.js',
  'js/raster/final-basketball.js',
  'js/raster/final-tennis.js',
  'js/raster/final-skateboarding.js',
  'js/raster/final-swimming.js',
  'js/raster/final-cycling.js',
  'js/raster/final-snowboarding.js',
  'js/raster/final-running.js',
  'js/raster/final-golf.js',
  'js/raster/final-trick-or-treat.js',
  'js/raster/final-pumpkin-peekaboo.js',
  'js/raster/final-broomstick-ride.js',
  'js/raster/final-ghost-costume.js',
  'js/raster/final-little-vampire.js',
  'js/raster/final-moonlight-castle.js',
  'js/pages.js',
  'js/pages-v3.js',
  'js/characters.js',
  'js/pages-lab.js',
  'js/pages-v4.js',
  'js/pages-easy.js',
  'js/content.js',
  'js/imagestore.js',
  'js/store.js',
  'js/components.js',
  'js/engine.js',
  'js/audit.js',
  'js/sound.js',
  'js/speech.js',
  'js/alive.js',
  'js/fx.js',
  'js/showcase.js',
  'js/screens/home.js',
  'js/screens/gallery.js',
  'js/screens/colour.js',
  'js/screens/complete.js',
  'js/screens/collection.js',
  'js/screens/view.js',
  'js/screens/create.js',
  'js/screens/parents.js',
  'js/screens/lab.js',
  'js/router.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
  );
});
