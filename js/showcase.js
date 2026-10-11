/*
  Home-screen showcase: the illustrated (benchmark) pages colour themselves in, one area at a
  time, then the next page takes over. It shows what the app does before a child has done
  anything, using the real artwork rather than a stand-in mascot.

  - Colours come from the app's own palette; the biggest area (the water or the sky) is light
    blue, the rest are spread across the palette. Fixed per page, so a page always looks the same.
  - Tiny areas don't get a step of their own: each is coloured along with the bigger area next
    to it, so the finished picture has no white specks. (A highlight sitting in solid ink, like
    the sparkle in an eye, stays white.)
  - The paint is drawn at the colouring screen's own resolution when the picture is shown
    larger than 512 device pixels, so its edges stay under the lines on high-density screens;
    that map is the one the colouring screen then reuses if the child taps the picture.
  - The frame takes each picture's own shape: the drawing's outer frame is found in the line art and
    the picture is cropped to it (within MIN_ASPECT..MAX_ASPECT), so the wooden frame has the same
    padding all round and no white bars, whatever the page.
  - Tapping the picture opens that page to colour (only pages that are open are shown).
  - prefers-reduced-motion: one page, fully coloured, no cycling.
  - Stops when the screen goes away (returns a stop function for the screen's _destroy) and
    pauses while the app is in the background.

  Also used by tools that render coloured pages (store screenshots): Showcase.paint().
*/
(function () {
  'use strict';

  const SMALL = 512;                  // paint size when the picture is shown this small or smaller (device px)
  // Light blue is kept for the biggest area (water, sky), so nothing else can vanish into it.
  const PALETTE = ['#ffb3d1', '#ffd84a', '#8fe07a', '#c9a7ff', '#ff9f45', '#ff6fa8', '#2fbf71', '#c8a26b', '#ff5a5a', '#8b5cf6'];
  const MIN_AREA = 0.0009;           // areas under ~0.09% of the picture are coloured with a neighbour
  const MIN_ASPECT = 0.7, MAX_ASPECT = 1.6;   // width / height the frame may take
  const SPARKLE_INK = 6;              // px of ink (on a 1024 map) around a tiny area that marks it as a highlight
  const STEP_MS = 110, HOLD_MS = 3200, FADE_MS = 450;

  /* The order and colour each area gets: biggest first; the biggest is the water/sky.
     Each step is [label, colour, tiny]: `tiny` lists the small areas coloured in the same step. */
  function plan(map) {
    const total = map.size * map.size, regions = map.regions;
    const big = l => regions[l].n / total >= MIN_AREA;
    const order = regions.map((r, l) => [l, r.n]).slice(1).filter(([l]) => big(l)).sort((a, b) => b[1] - a[1]);
    const steps = order.map(([l], k) => [l, k === 0 ? '#7fd3ff' : PALETTE[(l * 7) % PALETTE.length], []]);
    const stepOf = new Map(steps.map(st => [st[0], st]));
    const sparkle = SPARKLE_INK * map.size / 1024;
    for (let l = 1; l < regions.length; l++) {
      if (!regions[l].n || big(l) || regions[l].inkGap >= sparkle) continue;
      // nearest bigger neighbour, through other tiny areas if need be
      let h = regions[l].host;
      for (let hops = 0; h && !stepOf.has(h) && hops < 6; hops++) h = regions[h].host;
      const st = stepOf.get(h);
      if (st) st[2].push(l);
      else { const own = [l, PALETTE[(l * 7) % PALETTE.length], []]; steps.push(own); stepOf.set(l, own); }
    }
    return steps;
  }
  // Colour one step into `u32` (the pixels of an image `map.size` wide); returns the box it touched.
  function fillStep(u32, map, [l, hex, tiny]) {
    const rgba = ColouringEngine.packColour(hex), box = { x0: map.size, y0: map.size, x1: -1, y1: -1 };
    [l].concat(tiny || []).forEach(k => {
      const r = map.regions[k];
      ColouringEngine.paintRegion(u32, map.size, map, k, rgba);
      box.x0 = Math.min(box.x0, r.x0); box.y0 = Math.min(box.y0, r.y0); box.x1 = Math.max(box.x1, r.x1); box.y1 = Math.max(box.y1, r.y1);
    });
    return box;
  }

  // A fully coloured page as a canvas of `size` px: paint under the multiply-blended line art.
  async function paint(lineArtKey, size) {
    const map = await ColouringEngine.buildRasterMap(Art.RASTER[lineArtKey], size);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), img = x.createImageData(size, size), u32 = new Uint32Array(img.data.buffer);
    plan(map).forEach(step => fillStep(u32, map, step));
    x.fillStyle = '#fff'; x.fillRect(0, 0, size, size);
    const t = document.createElement('canvas'); t.width = t.height = size; t.getContext('2d').putImageData(img, 0, 0);
    x.drawImage(t, 0, 0);
    const line = new Image(); line.src = Art.RASTER[lineArtKey]; await line.decode();
    x.globalCompositeOperation = 'multiply'; x.drawImage(line, 0, 0, size, size);
    return c;
  }

  /* Where the drawing sits inside its square image, as fractions: ink (dark pixels) bounding box,
     widened a little so the mat doesn't cover the drawing's own frame line, then cut to a shape
     the frame can take. Returns { aspect, x, y, w, h } (x, y, w, h as fractions of the image). */
  function artBox(img) {
    const S = 160, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, S, S); x.drawImage(img, 0, 0, S, S);
    const d = x.getImageData(0, 0, S, S).data;
    let x0 = S, y0 = S, x1 = -1, y1 = -1;
    for (let i = 0; i < S * S; i++) if (d[i * 4] < 120) { const X = i % S, Y = (i / S) | 0; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
    if (x1 < 0) return { aspect: 1.2, x: 0, y: 0.0833, w: 1, h: 0.8333 };
    const pad = 0.02;
    let bx = Math.max(0, x0 / S - pad), by = Math.max(0, y0 / S - pad);
    let bw = Math.min(1, (x1 + 1) / S + pad) - bx, bh = Math.min(1, (y1 + 1) / S + pad) - by;
    const aspect = Math.max(MIN_ASPECT, Math.min(MAX_ASPECT, bw / bh));
    if (bw / bh < aspect) { const nh = bw / aspect; by += (bh - nh) / 2; bh = nh; }        // too tall: trim top and bottom
    else if (bw / bh > aspect) { const nw = bh * aspect; bx += (bw - nw) / 2; bw = nw; }    // too wide: trim the sides
    return { aspect, x: bx, y: by, w: bw, h: bh };
  }
  // Show only that part of the square canvas and image, filling the frame.
  function crop(holder, canvas, line, b) {
    holder.style.setProperty('--art-aspect', b.aspect.toFixed(4));
    [canvas, line].forEach(el => {
      el.style.left = (-b.x / b.w * 100).toFixed(3) + '%'; el.style.top = (-b.y / b.h * 100).toFixed(3) + '%';
      el.style.width = (100 / b.w).toFixed(3) + '%'; el.style.height = (100 / b.h).toFixed(3) + '%';
    });
  }

  function mount(holder, pages) {
    const { h } = U;
    const canvas = h('canvas', { class: 'showcase-paint', width: SMALL, height: SMALL, 'aria-hidden': 'true' });
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
      // Shape the frame to this picture first (the paint canvas and the line art are both squares).
      line.src = Art.RASTER[page.lineArt];
      try { await line.decode(); crop(holder, canvas, line, artBox(line)); } catch (e) { /* keep the last shape */ }
      if (stopped) return;
      // Paint at the size the picture is really shown at, in device pixels. (The first call
      // comes before the home screen is on the page, when the frame has no size yet.)
      for (let tries = 0; !frame.offsetWidth && tries < 20 && !stopped; tries++) await wait(50);
      if (stopped) return;
      const shown = frame.offsetWidth / (parseFloat(canvas.style.width) / 100 || 1) * (window.devicePixelRatio || 1);
      const SIZE = shown > SMALL * 1.1 ? ColouringEngine.SIZE : SMALL;
      const map = await ColouringEngine.buildRasterMap(Art.RASTER[page.lineArt], SIZE);
      if (stopped) return;
      if (canvas.width !== SIZE) canvas.width = canvas.height = SIZE;
      const img = ctx.createImageData(SIZE, SIZE), u32 = new Uint32Array(img.data.buffer);
      ctx.clearRect(0, 0, SIZE, SIZE);
      frame.classList.remove('is-fading');
      const steps = plan(map);
      if (still) { steps.forEach(step => fillStep(u32, map, step)); ctx.putImageData(img, 0, 0); return; }
      for (const step of steps) {
        if (stopped) return;
        await visible();
        const b = fillStep(u32, map, step);
        ctx.putImageData(img, 0, 0, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1);   // only the part that changed
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

  window.Showcase = { mount, paint, plan, fillStep };
})();
