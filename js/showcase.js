/*
  Home-screen showcase: the illustrated (benchmark) pages colour themselves in, one area at a
  time, then the next page takes over. It shows what the app does before a child has done
  anything, using the real artwork rather than a stand-in mascot.

  - Colours come from the app's own palette; the biggest area (the water or the sky) is light
    blue, the rest are spread across the palette. Fixed per page, so a page always looks the same.
  - Tapping the picture opens that page to colour (only pages that are open are shown).
  - prefers-reduced-motion: one page, fully coloured, no cycling.
  - Stops when the screen goes away (returns a stop function for the screen's _destroy) and
    pauses while the app is in the background.

  Also used by tools that render coloured pages (store screenshots): Showcase.paint().
*/
(function () {
  'use strict';

  const SIZE = 512;                   // the showcase is small; a 512 map builds quickly
  // Light blue is kept for the biggest area (water, sky), so nothing else can vanish into it.
  const PALETTE = ['#ffb3d1', '#ffd84a', '#8fe07a', '#c9a7ff', '#ff9f45', '#ff6fa8', '#2fbf71', '#c8a26b', '#ff5a5a', '#8b5cf6'];
  const MIN_AREA = 0.0009;           // skip crumbs: areas under ~0.09% of the picture stay white
  const STEP_MS = 110, HOLD_MS = 3200, FADE_MS = 450;

  const rgb = hex => { const v = parseInt(hex.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };

  // The order and colour each area gets: biggest first; the biggest is the water/sky.
  function plan(map) {
    const total = map.size * map.size;
    const order = map.regions.map((r, l) => [l, r.n]).slice(1).filter(([, n]) => n / total >= MIN_AREA).sort((a, b) => b[1] - a[1]);
    return order.map(([l], k) => [l, k === 0 ? '#7fd3ff' : PALETTE[(l * 7) % PALETTE.length]]);
  }
  function fillArea(img, region, hex) {
    const [R, G, B] = rgb(hex), d = img.data;
    for (let j = 0; j < region.n; j++) { const q = region.pixels[j] * 4; d[q] = R; d[q + 1] = G; d[q + 2] = B; d[q + 3] = 255; }
  }

  // A fully coloured page as a canvas of `size` px: paint under the multiply-blended line art.
  async function paint(lineArtKey, size) {
    const map = await ColouringEngine.buildRasterMap(Art.RASTER[lineArtKey], size);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), img = x.createImageData(size, size);
    plan(map).forEach(([l, hex]) => fillArea(img, map.regions[l], hex));
    x.fillStyle = '#fff'; x.fillRect(0, 0, size, size);
    const t = document.createElement('canvas'); t.width = t.height = size; t.getContext('2d').putImageData(img, 0, 0);
    x.drawImage(t, 0, 0);
    const line = new Image(); line.src = Art.RASTER[lineArtKey]; await line.decode();
    x.globalCompositeOperation = 'multiply'; x.drawImage(line, 0, 0, size, size);
    return c;
  }

  function mount(holder, pages) {
    const { h } = U;
    const canvas = h('canvas', { class: 'showcase-paint', width: SIZE, height: SIZE, 'aria-hidden': 'true' });
    const line = h('img', { class: 'showcase-lines', alt: '', draggable: 'false' });
    const frame = h('button', { type: 'button', class: 'showcase-frame' }, canvas, line);
    holder.appendChild(frame);
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stopped = false, timer = 0, index = 0;
    const wait = ms => new Promise(r => { timer = setTimeout(r, ms); });
    const visible = async () => { while (document.hidden && !stopped) await wait(400); };

    async function show(page) {
      frame.setAttribute('aria-label', 'Colour ' + page.title);
      frame.onclick = () => UI.go('colour/' + page.id);
      const map = await ColouringEngine.buildRasterMap(Art.RASTER[page.lineArt], SIZE);
      if (stopped) return;
      const img = ctx.createImageData(SIZE, SIZE);
      line.src = Art.RASTER[page.lineArt];
      ctx.clearRect(0, 0, SIZE, SIZE);
      frame.classList.remove('is-fading');
      const steps = plan(map);
      if (still) { steps.forEach(([l, hex]) => fillArea(img, map.regions[l], hex)); ctx.putImageData(img, 0, 0); return; }
      for (const [l, hex] of steps) {
        if (stopped) return;
        await visible();
        fillArea(img, map.regions[l], hex);
        ctx.putImageData(img, 0, 0);
        await wait(STEP_MS);
      }
      await wait(HOLD_MS);
      if (stopped) return;
      frame.classList.add('is-fading');
      await wait(FADE_MS);
    }

    (async () => {
      if (!pages.length) return;
      do { await show(pages[index % pages.length]); index++; } while (!still && !stopped);
    })().catch(err => console.error('showcase', err));

    return () => { stopped = true; clearTimeout(timer); };
  }

  window.Showcase = { mount, paint, plan };
})();
