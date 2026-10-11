/*
  "Bring to life": turns a finished picture into an animatable SVG.

  A finished picture is the child's paint (a PNG) under the page's line art. To move body
  parts independently, every `.region` is rebuilt from vector layers, per shape, in the
  original drawing order:
    1. white paper                                  (what the line art itself draws)
    2. the region's main colour, only where the shape is hidden behind later regions
    3. the child's paint, masked to exactly the area this region owns
    4. the outline
  Still, it looks identical to the page. When the axolotl hops or a gill sways, what's
  revealed behind is the colour of whatever is back there — never a ghost copy or a hole.
  Everything is vector masks over the one paint image: nothing is re-encoded, so it's quick.

  Motion itself is CSS (see "bring to life" in app.css), keyed off the art's hooks:
  data-anim / data-pivot / .eye / .hop — documented in art.js.
*/
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const SHAPES = 'path,circle,ellipse,rect,polygon,polyline';
  let seq = 0;

  const matrixAttr = m => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
  function setHref(el, v) { el.setAttribute('href', v); el.setAttributeNS(XLINK, 'xlink:href', v); }
  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  const PAGE = { x: 0, y: 0, width: 400, height: 400 };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Most common colour among the region's own painted pixels (coarsely bucketed), as a CSS colour.
  function dominantColour(paint, reg) {
    const counts = new Map();
    let best = -1, bestN = 0;
    const step = Math.max(1, Math.floor(reg.n / 4000)); // sampling is plenty
    for (let i = 0; i < reg.n; i += step) {
      const o = reg.pixels[i] * 4;
      if (paint[o + 3] < 200) continue;
      const key = ((paint[o] >> 3) << 10) | ((paint[o + 1] >> 3) << 5) | (paint[o + 2] >> 3);
      const n = (counts.get(key) || 0) + 1;
      counts.set(key, n);
      if (n > bestN) { bestN = n; best = o; }
    }
    // Only trust it if the region is mostly coloured; otherwise it's white paper.
    if (best < 0 || bestN * step < reg.n * 0.3) return null;
    return `rgb(${paint[best]},${paint[best + 1]},${paint[best + 2]})`;
  }

  async function readPaint(image, svg) {
    const img = await loadImage(image);
    const size = img.naturalWidth || 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    return { paint: ctx.getImageData(0, 0, size, size).data, map: ColouringEngine.buildRegionMap(svg, size) };
  }

  /* Builds the animatable picture. Resolves to a controller with `el`, play(), idle(), stop(). */
  async function build(lineArtKey, image, label) {
    const el = document.createElement('div');
    el.className = 'alive';
    const holder = document.createElement('div');
    holder.innerHTML = Art.plain(lineArtKey, label);
    const svg = holder.firstElementChild;
    el.appendChild(svg);
    const id = 'alive' + (++seq);
    const toRoot = ColouringEngine.matrixToRoot;
    const defs = svgEl('defs', {});
    svg.insertBefore(defs, svg.firstChild);

    // Raster page (one illustrated image, no vector regions): the child's paint goes under the
    // multiply-blended line art, and the whole picture does the hop. Parts can't move separately.
    const raster = svg.querySelector('image.raster');
    if (raster) {
      const hop = svgEl('g', { class: 'hop', 'data-pivot': '200 380' });
      if (image) {
        const paint = svgEl('image', Object.assign({ preserveAspectRatio: 'none' }, PAGE));
        setHref(paint, image);
        hop.appendChild(paint);
      }
      raster.style.mixBlendMode = 'multiply';
      raster.parentNode.insertBefore(hop, raster);
      hop.appendChild(raster);
      return controller(el, svg);
    }

    const groups = Array.from(svg.querySelectorAll('.region'));
    groups.forEach(g => g.setAttribute('fill', 'none'));
    // Every shape with its page-space transform, grouped by region, in drawing order.
    const shapes = groups.map(g => Array.from(g.querySelectorAll(SHAPES)).map(el => ({ el, m: matrixAttr(toRoot(el, svg)) })));
    const pageShape = (s, attrs) => { const c = s.el.cloneNode(false); c.setAttribute('transform', s.m); for (const k in attrs) c.setAttribute(k, attrs[k]); return c; };

    let colours = [];
    if (image) {
      const { paint, map } = await readPaint(image, svg);
      colours = groups.map((g, i) => (map.regions[i + 1] && map.regions[i + 1].group === g) ? dominantColour(paint, map.regions[i + 1]) : null);
      const img = svgEl('image', Object.assign({ id: id + '-paint', preserveAspectRatio: 'none' }, PAGE));
      setHref(img, image);
      defs.appendChild(img);
    }

    groups.forEach((g, r) => {
      const back = matrixAttr(toRoot(g, svg).inverse()); // page space → this region's local space
      const later = shapes.slice(r + 1).flat();

      // owned = this region's shapes minus everything drawn after it; hidden = the reverse.
      let ownedId = null, hiddenId = null;
      if (image) {
        ownedId = `${id}-own${r}`;
        const own = svgEl('mask', Object.assign({ id: ownedId, maskUnits: 'userSpaceOnUse' }, PAGE));
        shapes[r].forEach(s => own.appendChild(pageShape(s, { fill: '#fff', stroke: 'none' })));
        later.forEach(s => own.appendChild(pageShape(s, { fill: '#000', stroke: 'none' })));
        defs.appendChild(own);
      }
      if (colours[r] && later.length) {
        hiddenId = `${id}-hid${r}`;
        const hid = svgEl('mask', Object.assign({ id: hiddenId, maskUnits: 'userSpaceOnUse' }, PAGE));
        // A little outward overlap closes the anti-aliased seam where it meets the owned paint.
        later.forEach(s => hid.appendChild(pageShape(s, { fill: '#fff', stroke: '#fff', 'stroke-width': 6 })));
        defs.appendChild(hid);
      }

      shapes[r].forEach((s, k) => {
        const cid = `${id}-c${r}-${k}`;
        const clip = svgEl('clipPath', { id: cid });
        clip.appendChild(pageShape(s, {}));
        defs.appendChild(clip);

        const layers = [svgEl('rect', Object.assign({ transform: back, 'clip-path': `url(#${cid})`, fill: '#fff', stroke: 'none' }, PAGE))];
        if (hiddenId) layers.push(svgEl('rect', Object.assign({ transform: back, 'clip-path': `url(#${cid})`, mask: `url(#${hiddenId})`, fill: colours[r], stroke: 'none' }, PAGE)));
        if (ownedId) {
          const use = svgEl('use', { transform: back, 'clip-path': `url(#${cid})`, mask: `url(#${ownedId})` });
          setHref(use, '#' + id + '-paint');
          layers.push(use);
        }
        layers.forEach(layer => g.insertBefore(layer, s.el)); // then the shape's own outline on top
      });
    });

    return controller(el, svg);
  }

  function controller(el, svg) {
    // Pivots are in each element's local units; CSS rotates/squashes around them.
    svg.querySelectorAll('[data-pivot]').forEach(p => {
      const [x, y] = p.getAttribute('data-pivot').split(/\s+/);
      p.style.transformOrigin = `${x}px ${y}px`;
    });

    let reactTimer = 0;
    function restart(cls) {
      clearTimeout(reactTimer);
      el.classList.remove('play', 'idle', 'react');
      void el.offsetWidth; // restart CSS animations
      if (cls) el.classList.add(cls);
    }

    return {
      el,
      play: () => restart('play'),  // the ~3s celebration moves
      idle: () => restart('idle'),  // afterwards: an occasional blink and gill sway
      stop: () => restart(null),
      // A quick happy hop (e.g. when a Create option changes), then back to idle.
      react: () => { restart('react'); reactTimer = setTimeout(() => restart('idle'), 700); },
    };
  }

  /* A created character is already vector art with its colours in it — it just needs pivots. */
  function character(ch) {
    const el = document.createElement('div');
    el.className = 'alive';
    el.innerHTML = Art.character(ch);
    return controller(el, el.firstElementChild);
  }

  window.Alive = { build, character };
})();
