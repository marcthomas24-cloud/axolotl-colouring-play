/*
  Colouring engine.

  Layers (bottom → top) inside the stage:
    1. paint   — a SIZE×SIZE canvas holding everything the child has coloured
                 (fills, brush strokes; eraser makes pixels transparent = white paper).
    2. lines   — the line-art SVG multiply-blended on top (see Art.lines), so outlines
                 are always crisp and above the paint, even over brush strokes.

  Tap-to-fill never flood-fills pixels. At load we rasterise each SVG `.region` into a
  label map (which region owns each pixel). A fill paints exactly that region's pixels,
  so there are no leaks through gaps and tapping an eye (decoration) colours the face.
  Taps that land on an outline pick the nearest region.

  Undo stores only the rectangle an action touched (before pixels; after pixels are
  captured on undo for redo), and total history memory is capped.

  Gestures: 1 finger = current tool; 2 fingers = pinch-zoom + pan (cancels any stroke
  the first finger started). With the fill tool, 1-finger drag pans when zoomed in.
  Desktop (testing): wheel / trackpad-pinch zooms; drag with the fill tool pans.
*/
(function () {
  'use strict';

  const SIZE = 1024;                       // paint resolution (px, square)
  const DEFAULT_SIZE = SIZE;
  const BRUSH_SIZES = [14, 30, 60];        // in paint px — small / medium / big
  const HISTORY_BYTES = 64 * 1024 * 1024;  // cap on undo memory
  const TAP_SLOP = 14;                     // screen px a tap may wander before it's a drag
  const MAX_ZOOM = 4;
  const FILL_MS = 220;                     // radial fill reveal
  const SHAPES = 'path,circle,ellipse,rect,polygon,polyline';

  /* ── region label map ── */

  function shapeToPath(el) {
    const n = el.tagName.toLowerCase();
    const num = a => parseFloat(el.getAttribute(a)) || 0;
    const p = new Path2D();
    switch (n) {
      case 'path': return new Path2D(el.getAttribute('d') || '');
      case 'circle': p.arc(num('cx'), num('cy'), num('r'), 0, Math.PI * 2); return p;
      case 'ellipse': p.ellipse(num('cx'), num('cy'), num('rx'), num('ry'), 0, 0, Math.PI * 2); return p;
      case 'rect': {
        const x = num('x'), y = num('y'), w = num('width'), h = num('height');
        const r = Math.min(num('rx') || num('ry'), w / 2, h / 2);
        if (r > 0 && p.roundRect) p.roundRect(x, y, w, h, r); else p.rect(x, y, w, h);
        return p;
      }
      case 'polygon': case 'polyline': {
        const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
        for (let i = 0; i + 1 < pts.length; i += 2) i ? p.lineTo(pts[i], pts[i + 1]) : p.moveTo(pts[i], pts[i + 1]);
        p.closePath();
        return p;
      }
    }
    return null;
  }

  // Accumulated SVG transform from `el` up to (not including) the root <svg>.
  // Layout-independent, so it works before the stage has a size.
  function matrixToRoot(el, root) {
    let m = new DOMMatrix();
    for (let n = el; n && n !== root; n = n.parentNode) {
      const list = n.transform && n.transform.baseVal;
      const t = list && list.numberOfItems ? list.consolidate() : null;
      if (t) { const k = t.matrix; m = new DOMMatrix([k.a, k.b, k.c, k.d, k.e, k.f]).multiply(m); }
    }
    return m;
  }

  // Fill every shape of one region group into `ctx` (whose canvas is `size` px square).
  function drawRegion(ctx, g, svg, size) {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const vbW = (vb && vb.width) || 400, vbX = (vb && vb.x) || 0, vbY = (vb && vb.y) || 0;
    const k = size / vbW;
    const shapes = g.matches(SHAPES) ? [g] : g.querySelectorAll(SHAPES);
    shapes.forEach(s => {
      const path = shapeToPath(s);
      if (!path) return;
      const m = matrixToRoot(s, svg);
      ctx.setTransform(k * m.a, k * m.b, k * m.c, k * m.d, k * (m.e - vbX), k * (m.f - vbY));
      ctx.fill(path);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function buildRegionMap(svg, size) {
    const SIZE = size || DEFAULT_SIZE;
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d', { willReadFrequently: true });

    // Each region is painted in a grey whose value encodes its index (×4, so the
    // anti-aliased pixels between two regions don't decode as a real index).
    const groups = Array.from(svg.querySelectorAll('.region')).slice(0, 63);
    const ids = [null];
    groups.forEach((g, i) => {
      const v = (i + 1) * 4;
      ids.push(g.getAttribute('data-region'));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      drawRegion(ctx, g, svg, SIZE);
    });

    const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
    const labels = new Uint8Array(SIZE * SIZE);
    const count = new Uint32Array(ids.length);
    for (let i = 0, j = 0; i < labels.length; i++, j += 4) {
      const r = px[j];
      if (r && (r & 3) === 0 && px[j + 1] === r && px[j + 2] === r && px[j + 3] === 255) {
        const l = r >> 2;
        if (l < ids.length) { labels[i] = l; count[l]++; }
      }
    }

    // Per-region pixel lists + bounding boxes, so a fill never scans the whole canvas.
    const regions = ids.map((id, l) => ({ id, group: groups[l - 1] || null, pixels: new Uint32Array(count[l]), n: 0, x0: SIZE, y0: SIZE, x1: -1, y1: -1 }));
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      if (!l) continue;
      const r = regions[l];
      r.pixels[r.n++] = i;
      const x = i % SIZE, y = (i / SIZE) | 0;
      if (x < r.x0) r.x0 = x; if (x > r.x1) r.x1 = x;
      if (y < r.y0) r.y0 = y; if (y > r.y1) r.y1 = y;
    }
    return { size: SIZE, labels, regions };
  }

  /* ── region map from a raster line-art image ──
     For illustrated pages delivered as pixels (Art.registerRaster). Each enclosed paper area
     becomes a region:
       1. ink = dark pixels; the ink is thickened by GAP_CLOSE px first, so a hairline gap in the
          drawing can't let one area leak into its neighbour;
       2. connected paper areas are labelled; areas touching the canvas edge are "outside"
          (the frame drawn by tools/prep-raster.js keeps the padding out there) and areas
          smaller than CRUMB px are treated as ink;
       3. labels then grow outward under the ink, so a fill reaches right up to (and under)
          the line and no white halo is left along it.
     Labels are 32-bit: an illustrated page has hundreds of areas. Cached per image. */
  const GAP_CLOSE = 2, CRUMB = 14;
  let INK = 150;   // grey level below which a pixel is ink
  const rasterCache = new Map();
  function buildRasterMap(src, size, gap) {
    gap = gap == null ? (RASTER_GAP[src] != null ? RASTER_GAP[src] : GAP_CLOSE) : gap;
    const key = src + '|' + (size || DEFAULT_SIZE) + '|' + gap + '|' + INK;
    if (rasterCache.has(key)) return rasterCache.get(key);
    const job = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(labelRaster(img, size || DEFAULT_SIZE, gap));
      img.onerror = reject;
      img.src = src;
    });
    rasterCache.set(key, job);
    return job;
  }
  // Per-image gap closing, set by Art.registerRaster(key, src, { gap }) for art with looser lines.
  const RASTER_GAP = Object.assign({}, window.__rasterGap || {});   // set before the engine loaded
  function labelRaster(img, SIZE, gapClose) {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const px = ctx.getImageData(0, 0, SIZE, SIZE).data, N = SIZE * SIZE;

    // 1. ink, thickened to close hairline gaps
    let ink = new Uint8Array(N);
    for (let i = 0, j = 0; i < N; i++, j += 4) ink[i] = px[j] < INK ? 1 : 0;
    // "Outside" is decided on the ink as drawn, before it is thickened: the paper reachable from
    // the canvas edge. Otherwise the thickened frame swallows a few pixels just outside it and
    // fills would grow into them (a coloured fringe outside the picture's frame).
    const outside = new Uint8Array(N);
    {
      const st = new Int32Array(N); let top = 0;
      const seed = i => { if (!ink[i] && !outside[i]) { outside[i] = 1; st[top++] = i; } };
      for (let x = 0; x < SIZE; x++) { seed(x); seed((SIZE - 1) * SIZE + x); }
      for (let y = 0; y < SIZE; y++) { seed(y * SIZE); seed(y * SIZE + SIZE - 1); }
      while (top) {
        const i = st[--top], x = i % SIZE;
        if (x > 0) seed(i - 1); if (x < SIZE - 1) seed(i + 1);
        if (i >= SIZE) seed(i - SIZE); if (i < N - SIZE) seed(i + SIZE);
      }
    }
    for (let pass = 0; pass < gapClose; pass++) {
      const out = ink.slice();
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x;
        if (ink[i]) continue;
        if ((x > 0 && ink[i - 1]) || (x < SIZE - 1 && ink[i + 1]) || (y > 0 && ink[i - SIZE]) || (y < SIZE - 1 && ink[i + SIZE])) out[i] = 1;
      }
      ink = out;
    }

    // 2. label paper areas (4-connected); -1 = outside, 0 = ink / crumb
    const lab = new Int32Array(N), stack = new Int32Array(N), sizes = [0];
    const OUT = -1;
    let next = 1;
    for (let s0 = 0; s0 < N; s0++) {
      if (ink[s0] || lab[s0]) continue;
      let top = 0, n = 0, edge = false;
      const id = next;
      stack[top++] = s0; lab[s0] = id;
      const members = [];
      while (top) {
        const i = stack[--top]; n++; members.push(i);
        const x = i % SIZE, y = (i / SIZE) | 0;
        if (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1) edge = true;
        if (x > 0 && !ink[i - 1] && !lab[i - 1]) { lab[i - 1] = id; stack[top++] = i - 1; }
        if (x < SIZE - 1 && !ink[i + 1] && !lab[i + 1]) { lab[i + 1] = id; stack[top++] = i + 1; }
        if (y > 0 && !ink[i - SIZE] && !lab[i - SIZE]) { lab[i - SIZE] = id; stack[top++] = i - SIZE; }
        if (y < SIZE - 1 && !ink[i + SIZE] && !lab[i + SIZE]) { lab[i + SIZE] = id; stack[top++] = i + SIZE; }
      }
      if (edge) members.forEach(i => { lab[i] = OUT; });
      else if (n < CRUMB) members.forEach(i => { lab[i] = 0; });
      else { sizes.push(n); next++; }
    }

    // 3. grow labels under the ink (multi-source BFS; never into "outside")
    for (let i = 0; i < N; i++) if (outside[i] && lab[i] >= 0) lab[i] = -1;
    let head = 0, tail = 0;
    const queue = stack;
    for (let i = 0; i < N; i++) if (lab[i] > 0) queue[tail++] = i;
    while (head < tail) {
      const i = queue[head++], l = lab[i], x = i % SIZE;
      const visit = j => { if (lab[j] === 0) { lab[j] = l; queue[tail++] = j; } };
      if (x > 0) visit(i - 1);
      if (x < SIZE - 1) visit(i + 1);
      if (i >= SIZE) visit(i - SIZE);
      if (i < N - SIZE) visit(i + SIZE);
    }

    // Region table in the same shape buildRegionMap returns.
    const labels = new Uint32Array(N), count = new Uint32Array(next);
    for (let i = 0; i < N; i++) { const l = lab[i] > 0 ? lab[i] : 0; labels[i] = l; count[l]++; }
    const regions = Array.from({ length: next }, (_, l) => ({ id: l ? 'area-' + l : null, group: null,
      pixels: new Uint32Array(l ? count[l] : 0), n: 0, x0: SIZE, y0: SIZE, x1: -1, y1: -1 }));
    for (let i = 0; i < N; i++) {
      const l = labels[i];
      if (!l) continue;
      const r = regions[l];
      r.pixels[r.n++] = i;
      const x = i % SIZE, y = (i / SIZE) | 0;
      if (x < r.x0) r.x0 = x; if (x > r.x1) r.x1 = x;
      if (y < r.y0) r.y0 = y; if (y > r.y1) r.y1 = y;
    }
    return { size: SIZE, labels, regions, raster: true, paperSizes: sizes };
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function cropImageData(src, srcW, x, y, w, h) {
    const out = new ImageData(w, h);
    for (let row = 0; row < h; row++) {
      const start = ((y + row) * srcW + x) * 4;
      out.data.set(src.data.subarray(start, start + w * 4), row * w * 4);
    }
    return out;
  }

  /* ── engine ── */

  function createEngine(stage, opts) {
    const { h } = U;

    const canvas = h('canvas', { class: 'paint', width: SIZE, height: SIZE });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const lines = h('div', { class: 'lines', html: opts.linesSvg });
    const box = h('div', { class: 'canvas-box' }, canvas, lines);
    const zoomBtn = UI.button({ icon: 'zoomOut', variant: 'ghost', size: 'md', className: 'zoom-reset', ariaLabel: 'Zoom out', onClick: () => setView(1, 0, 0, true) });
    zoomBtn.hidden = true;
    // Keep the zoom button's own taps away from the stage's drawing handlers.
    zoomBtn.addEventListener('pointerdown', e => e.stopPropagation());
    stage.append(box, zoomBtn);

    // Vector pages: regions come from the SVG's .region shapes, straight away. Raster pages:
    // from the image's pixels, once it has decoded (taps wait until then — see `ready`).
    const linesSvg = lines.querySelector('svg.art-lines') || lines.querySelector('svg');
    const rasterEl = linesSvg && linesSvg.querySelector('image.raster');
    let map = rasterEl ? null : buildRegionMap(linesSvg);

    const s = {
      ready: false,
      tool: 'fill',
      colour: '#ff6fa8',
      sizeIndex: 1,
      blank: true,
      undo: [], redo: [],
      scale: 1, tx: 0, ty: 0,
    };
    let anim = null, animFrame = 0, stroke = null;

    function changed() { if (opts.onChange) opts.onChange(); }

    /* history */
    const bytesOf = e => e.before.data.length + (e.after ? e.after.data.length : 0);
    function pushHistory(entry) {
      s.undo.push(entry);
      s.redo.length = 0;
      let total = s.undo.reduce((t, e) => t + bytesOf(e), 0);
      while (total > HISTORY_BYTES && s.undo.length > 1) total -= bytesOf(s.undo.shift());
      s.blank = false;
    }
    function undo() {
      finishAnim();
      const e = s.undo.pop();
      if (!e) return;
      e.after = ctx.getImageData(e.x, e.y, e.w, e.h);
      ctx.putImageData(e.before, e.x, e.y);
      s.redo.push(e);
      s.blank = false;
      changed();
    }
    function redo() {
      finishAnim();
      const e = s.redo.pop();
      if (!e) return;
      ctx.putImageData(e.after, e.x, e.y);
      s.undo.push(e);
      s.blank = false;
      changed();
    }

    /* fill */
    function regionAt(x, y) {
      x = Math.max(0, Math.min(SIZE - 1, Math.round(x)));
      y = Math.max(0, Math.min(SIZE - 1, Math.round(y)));
      let l = map.labels[y * SIZE + x];
      if (l) return l;
      // On an outline or seam: search outward in rings for the nearest region.
      for (let r = 1; r <= 40; r++) {
        for (let d = -r; d <= r; d++) {
          const cands = [[x + d, y - r], [x + d, y + r], [x - r, y + d], [x + r, y + d]];
          for (const [cx, cy] of cands) {
            if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) continue;
            l = map.labels[cy * SIZE + cx];
            if (l) return l;
          }
        }
      }
      return 0;
    }

    function fillAt(x, y) {
      finishAnim();
      const l = regionAt(x, y);
      const reg = l && map.regions[l];
      if (!reg || !reg.n) return false;
      const bx = reg.x0, by = reg.y0, bw = reg.x1 - reg.x0 + 1, bh = reg.y1 - reg.y0 + 1;
      const before = ctx.getImageData(bx, by, bw, bh);

      // Final pixels for the region's bounding box: the old pixels with the region recoloured.
      const after = new ImageData(new Uint8ClampedArray(before.data), bw, bh);
      const d = after.data, [cr, cg, cb] = hexToRgb(s.colour), px = reg.pixels;
      for (let i = 0; i < reg.n; i++) {
        const g = px[i], gy = (g / SIZE) | 0, o = ((gy - by) * bw + (g - gy * SIZE - bx)) * 4;
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = 255;
      }
      pushHistory({ x: bx, y: by, w: bw, h: bh, before, after: null });

      // Reveal it as a quick ripple from the finger: draw `after` through a growing circle.
      const layer = document.createElement('canvas');
      layer.width = bw; layer.height = bh;
      layer.getContext('2d').putImageData(after, 0, 0);
      const far = Math.max(Math.hypot(x - bx, y - by), Math.hypot(x - bx - bw, y - by),
                           Math.hypot(x - bx, y - by - bh), Math.hypot(x - bx - bw, y - by - bh));
      anim = { after, layer, x: bx, y: by, cx: x, cy: y, far, t0: performance.now() };
      stepAnim();
      changed();
      return true;
    }

    function ripple(pt) {
      const r = stage.getBoundingClientRect();
      const el = h('span', { class: 'ripple', 'aria-hidden': 'true' });
      el.style.left = (pt.x - r.left) + 'px';
      el.style.top = (pt.y - r.top) + 'px';
      el.style.setProperty('--ripple', s.colour);
      stage.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
      setTimeout(() => el.remove(), 800); // in case animations are off
    }

    function stepAnim() {
      if (!anim) return;
      const t = Math.min(1, (performance.now() - anim.t0) / FILL_MS);
      if (t >= 1) return finishAnim();
      const r = Math.max(24, (1 - Math.pow(1 - t, 3)) * anim.far);
      ctx.save();
      ctx.beginPath();
      ctx.arc(anim.cx, anim.cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(anim.layer, anim.x, anim.y);
      ctx.restore();
      animFrame = requestAnimationFrame(stepAnim);
    }
    // Any other action first completes a running fill, so pixels are never half-written.
    function finishAnim() {
      if (!anim) return;
      cancelAnimationFrame(animFrame);
      ctx.putImageData(anim.after, anim.x, anim.y);
      anim = null;
    }

    /* brush + eraser */
    function applyStrokeStyle() {
      ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
      ctx.strokeStyle = ctx.fillStyle = stroke.erase ? '#000' : s.colour;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    function grow(p) {
      const r = stroke.size / 2 + 2;
      stroke.x0 = Math.min(stroke.x0, p.x - r); stroke.y0 = Math.min(stroke.y0, p.y - r);
      stroke.x1 = Math.max(stroke.x1, p.x + r); stroke.y1 = Math.max(stroke.y1, p.y + r);
    }
    function beginStroke(p) {
      finishAnim();
      stroke = {
        snap: ctx.getImageData(0, 0, SIZE, SIZE),
        erase: s.tool === 'eraser',
        size: BRUSH_SIZES[s.sizeIndex],
        last: p, mid: p,
        x0: SIZE, y0: SIZE, x1: 0, y1: 0,
      };
      ctx.save();
      applyStrokeStyle();
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      grow(p);
    }
    function extendStroke(p) {
      if (Math.hypot(p.x - stroke.last.x, p.y - stroke.last.y) < 1.5) return;
      const mid = { x: (stroke.last.x + p.x) / 2, y: (stroke.last.y + p.y) / 2 };
      ctx.save();
      applyStrokeStyle();
      ctx.beginPath();
      ctx.moveTo(stroke.mid.x, stroke.mid.y);
      ctx.quadraticCurveTo(stroke.last.x, stroke.last.y, mid.x, mid.y);
      ctx.stroke();
      ctx.restore();
      stroke.mid = mid;
      stroke.last = p;
      grow(p);
    }
    function endStroke(commit) {
      if (!stroke) return;
      if (!commit) {
        ctx.putImageData(stroke.snap, 0, 0);
        stroke = null;
        return;
      }
      ctx.save();
      applyStrokeStyle();
      ctx.beginPath();
      ctx.moveTo(stroke.mid.x, stroke.mid.y);
      ctx.lineTo(stroke.last.x, stroke.last.y);
      ctx.stroke();
      ctx.restore();
      const x = Math.max(0, Math.floor(stroke.x0)), y = Math.max(0, Math.floor(stroke.y0));
      const w = Math.min(SIZE, Math.ceil(stroke.x1)) - x, hh = Math.min(SIZE, Math.ceil(stroke.y1)) - y;
      if (w > 0 && hh > 0) pushHistory({ x, y, w, h: hh, before: cropImageData(stroke.snap, SIZE, x, y, w, hh), after: null });
      stroke = null;
      changed();
    }

    function reset() {
      if (s.blank) return;
      finishAnim();
      pushHistory({ x: 0, y: 0, w: SIZE, h: SIZE, before: ctx.getImageData(0, 0, SIZE, SIZE), after: null });
      ctx.clearRect(0, 0, SIZE, SIZE);
      s.blank = true;
      changed();
    }

    /* zoom + pan */
    function setView(scale, tx, ty, animate) {
      const W = stage.clientWidth, H = stage.clientHeight;
      scale = Math.max(1, Math.min(MAX_ZOOM, scale));
      s.scale = scale;
      s.tx = Math.min(0, Math.max(W - W * scale, tx));
      s.ty = Math.min(0, Math.max(H - H * scale, ty));
      box.classList.toggle('animating', !!animate);
      box.style.transform = `translate(${s.tx}px, ${s.ty}px) scale(${s.scale})`;
      zoomBtn.hidden = s.scale <= 1.01;
    }
    function zoomAround(pt, scale) {
      const cx = (pt.x - s.tx) / s.scale, cy = (pt.y - s.ty) / s.scale;
      const ns = Math.max(1, Math.min(MAX_ZOOM, scale));
      setView(ns, pt.x - cx * ns, pt.y - cy * ns);
    }

    /* input */
    const pointers = new Map();
    let mode = null, down = null, gesture = null, pan = null;

    function toPaint(e) {
      const r = box.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * SIZE, y: (e.clientY - r.top) / r.height * SIZE };
    }
    function toStage(p) {
      const r = stage.getBoundingClientRect();
      return { x: p.x - r.left, y: p.y - r.top };
    }
    function startGesture() {
      const [a, b] = Array.from(pointers.values()).map(toStage);
      gesture = {
        d0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)),
        m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        s0: s.scale, tx0: s.tx, ty0: s.ty,
      };
    }
    function updateGesture() {
      const [a, b] = Array.from(pointers.values()).map(toStage);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ns = Math.max(1, Math.min(MAX_ZOOM, gesture.s0 * d / gesture.d0));
      const cx = (gesture.m0.x - gesture.tx0) / gesture.s0, cy = (gesture.m0.y - gesture.ty0) / gesture.s0;
      setView(ns, m.x - cx * ns, m.y - cy * ns);
    }

    function onDown(e) {
      if (!s.ready) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* older Safari */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1) {
        down = { x: e.clientX, y: e.clientY, paint: toPaint(e) };
        if (s.tool === 'fill') mode = 'tap';
        else { mode = 'draw'; beginStroke(down.paint); }
      } else if (pointers.size === 2 && mode !== 'ignore') {
        if (mode === 'draw') endStroke(false); // second finger = zoom, not a smudge
        mode = 'gesture';
        startGesture();
      }
    }
    function onMove(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === 'draw') {
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        (evs.length ? evs : [e]).forEach(ev => extendStroke(toPaint(ev)));
      } else if (mode === 'tap') {
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        if (moved > TAP_SLOP && s.scale > 1) { mode = 'pan'; pan = { x: e.clientX, y: e.clientY, tx: s.tx, ty: s.ty }; }
      } else if (mode === 'pan') {
        setView(s.scale, pan.tx + e.clientX - pan.x, pan.ty + e.clientY - pan.y);
      } else if (mode === 'gesture' && pointers.size >= 2) {
        updateGesture();
      }
    }
    function onUp(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (mode === 'draw') { endStroke(true); mode = null; }
      else if (mode === 'tap' && pointers.size === 0) { if (fillAt(down.paint.x, down.paint.y)) ripple(down); }
      else if (mode === 'gesture' && pointers.size > 0) { mode = 'ignore'; } // wait for all fingers up
      if (pointers.size === 0) mode = null;
    }
    function onWheel(e) {
      e.preventDefault();
      const pt = toStage({ x: e.clientX, y: e.clientY });
      // Trackpad pinch arrives as ctrl+wheel with small deltas; a mouse notch is ~100.
      const rate = e.ctrlKey ? 0.01 : 0.002;
      zoomAround(pt, s.scale * Math.exp(-Math.max(-150, Math.min(150, e.deltaY)) * rate));
    }
    const onResize = () => setView(1, 0, 0);

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('resize', onResize);

    /* load a saved draft (and, for a raster page, its region map) — ready when both are in */
    // Only an asynchronous arrival announces itself: the screen that called create() hasn't
    // finished setting up yet, so a synchronous onChange would reach it half-built.
    let waiting = 1 + (rasterEl ? 1 : 0), building = true;
    const arrive = () => { if (--waiting === 0) { s.ready = true; if (!building) changed(); } };
    if (rasterEl) {
      buildRasterMap(rasterEl.getAttribute('href'), SIZE)
        .then(m => { map = m; arrive(); })
        .catch(err => { console.error('raster region map failed', err); map = { size: SIZE, labels: new Uint8Array(SIZE * SIZE), regions: [] }; arrive(); });
    }
    if (opts.image) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, SIZE, SIZE); s.blank = false; arrive(); };
      img.onerror = arrive;
      img.src = opts.image;
    } else {
      arrive();
    }
    building = false;

    return {
      get tool() { return s.tool; },
      get colour() { return s.colour; },
      get sizeIndex() { return s.sizeIndex; },
      get scale() { return s.scale; },
      BRUSH_SIZES,
      setTool(t) { s.tool = t; },
      setColour(c) { s.colour = c; },
      setSize(i) { s.sizeIndex = Math.max(0, Math.min(BRUSH_SIZES.length - 1, i)); },
      undo, redo, reset,
      canUndo: () => s.undo.length > 0,
      canRedo: () => s.redo.length > 0,
      isBlank: () => s.blank,
      // True if any paint is on the page (sampled; cheap enough to call on a button press).
      hasPaint() {
        finishAnim();
        const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
        for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 20) return true;
        return false;
      },
      zoomTo: (scale) => zoomAround({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 }, scale),
      exportImage(size) {
        finishAnim();
        if (!size || size === SIZE) return canvas.toDataURL('image/png');
        const c = document.createElement('canvas');
        c.width = c.height = size;
        c.getContext('2d').drawImage(canvas, 0, 0, size, size);
        return c.toDataURL('image/png');
      },
      // for debugging / tests
      _regionIdAt: (x, y) => { const l = regionAt(x, y); return l ? map.regions[l].id : null; },
      get _map() { return map; },
      destroy() {
        finishAnim();
        if (stroke) endStroke(true);
        window.removeEventListener('resize', onResize);
      },
    };
  }

  window.ColouringEngine = { create: createEngine, SIZE, matrixToRoot, buildRegionMap, buildRasterMap, RASTER_GAP, drawRegion, _setInk: v => { INK = v; } };
})();
