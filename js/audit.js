/*
  Region audit — measures a colouring page against the colouring-region rules
  (see ART_PIPELINE.md §5). Used by the Style Lab and the art workbench; never by the
  child flow.

  It reads the same label map the colouring engine fills from, so what it measures is
  exactly what a tap does. Per region:
    area   — pixels the region owns on the 1024 paint canvas
    reach  — radius of the biggest circle that fits in the region's visible part
             (distance-transform max, minus the half of the outline that covers its edge).
             This is "can a fingertip land in it", which area alone doesn't capture:
             a long thin sliver can have a big area and no room for a finger.
    pieces — separate visible islands (a bubbles group is meant to have several;
             a single shape split into slivers by something drawn over it is a smell)

  Sizes are reported in iPad points too: the colouring stage is about 700pt wide on an
  iPad in portrait, so 1 canvas px ≈ 0.68pt.
*/
(function () {
  'use strict';

  const PT_PER_PX = 700 / 1024;

  // Per complexity level. minRoomPt: the smallest fingertip room (diameter, iPad points)
  // any region may have; minArea in canvas px². Calibrated against the ten Stage 1 pages
  // that children have already coloured happily (most regions ≥ 18pt, a few 6–12pt bits).
  // Easy targets a fingertip with no zoom; Advanced assumes the child may pinch-zoom.
  const RULES = {
    easy:     { label: 'Easy',     maxRegions: 24, minArea: 5000, minRoomPt: 24 },
    medium:   { label: 'Medium',   maxRegions: 40, minArea: 1800, minRoomPt: 16 },
    advanced: { label: 'Advanced', maxRegions: 63, minArea: 700,  minRoomPt: 10 },
    // Illustrated (raster) pages at the benchmark level of detail. Small areas are part of the
    // style — the child zooms in or uses the brush — so they're counted, not failed. What does
    // fail: an area so big it has swallowed its neighbours (a leak through a gap in the line).
    detailed: { label: 'Detailed', maxRegions: Infinity, minArea: 0, minRoomPt: 0, maxShare: 0.45 },
  };
  const ENGINE_MAX_REGIONS = 63; // label map encodes region index in one 8-bit channel (×4)

  // Chamfer (3-4) distance from every labelled pixel to the nearest pixel of another label.
  function distanceMap(labels, size) {
    const INF = 1 << 14;
    const d = new Uint16Array(labels.length);
    for (let i = 0; i < d.length; i++) d[i] = labels[i] ? INF : 0;
    const at = (x, y) => y * size + x;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = at(x, y), l = labels[i];
        if (!l) continue;
        let v = d[i];
        const look = (xx, yy, w) => {
          if (xx < 0 || yy < 0 || xx >= size) { v = Math.min(v, w); return; }
          const j = at(xx, yy);
          v = Math.min(v, labels[j] === l ? d[j] + w : w);
        };
        look(x - 1, y, 3); look(x - 1, y - 1, 4); look(x, y - 1, 3); look(x + 1, y - 1, 4);
        d[i] = v;
      }
    }
    for (let y = size - 1; y >= 0; y--) {
      for (let x = size - 1; x >= 0; x--) {
        const i = at(x, y), l = labels[i];
        if (!l) continue;
        let v = d[i];
        const look = (xx, yy, w) => {
          if (xx >= size || yy >= size || xx < 0) { v = Math.min(v, w); return; }
          const j = at(xx, yy);
          v = Math.min(v, labels[j] === l ? d[j] + w : w);
        };
        look(x + 1, y, 3); look(x + 1, y + 1, 4); look(x, y + 1, 3); look(x - 1, y + 1, 4);
        d[i] = v;
      }
    }
    return d;
  }

  // Count 4-connected islands per label, ignoring crumbs smaller than `minPiece` px.
  function pieces(labels, size, nLabels, minPiece) {
    const seen = new Uint8Array(labels.length);
    const out = new Uint16Array(nLabels);
    const stack = new Int32Array(labels.length);
    for (let s = 0; s < labels.length; s++) {
      const l = labels[s];
      if (!l || seen[s]) continue;
      let top = 0, n = 0;
      stack[top++] = s; seen[s] = 1;
      while (top) {
        const i = stack[--top]; n++;
        const x = i % size;
        if (x > 0 && !seen[i - 1] && labels[i - 1] === l) { seen[i - 1] = 1; stack[top++] = i - 1; }
        if (x < size - 1 && !seen[i + 1] && labels[i + 1] === l) { seen[i + 1] = 1; stack[top++] = i + 1; }
        if (i >= size && !seen[i - size] && labels[i - size] === l) { seen[i - size] = 1; stack[top++] = i - size; }
        if (i < labels.length - size && !seen[i + size] && labels[i + size] === l) { seen[i + size] = 1; stack[top++] = i + size; }
      }
      if (n >= minPiece) out[l]++;
    }
    return out;
  }

  /* Audit one line-art key. complexity: 'easy' | 'medium' | 'advanced'.
     lineWeight: the page's outline width in SVG units (400-unit page); default 6. */
  function auditArt(lineArtKey, complexity, lineWeight) {
    const holder = document.createElement('div');
    holder.innerHTML = Art.plain(lineArtKey, '');
    const svg = holder.querySelector('svg');
    const total = svg.querySelectorAll('.region').length;
    const map = ColouringEngine.buildRegionMap(svg, 1024);
    const size = map.size;
    const rule = RULES[complexity] || RULES.medium;
    const halfLine = (lineWeight || 6) * size / 400 / 2;
    const dist = distanceMap(map.labels, size);
    const isl = pieces(map.labels, size, map.regions.length, Math.max(40, rule.minArea / 20));

    const maxD = new Uint16Array(map.regions.length);
    for (let i = 0; i < map.labels.length; i++) {
      const l = map.labels[i];
      if (l && dist[i] > maxD[l]) maxD[l] = dist[i];
    }

    const regions = map.regions.slice(1).map((r, k) => {
      const l = k + 1;
      const reach = Math.max(0, maxD[l] / 3 - halfLine);
      const issues = [];
      if (!r.n) issues.push('hidden — fully covered by later shapes');
      else {
        if (r.n < rule.minArea) issues.push('small area');
        if (reach * 2 * PT_PER_PX < rule.minRoomPt) issues.push('too thin for a fingertip');
      }
      return { id: r.id, area: r.n, reach: Math.round(reach), reachPt: Math.round(reach * 2 * PT_PER_PX), pieces: isl[l], issues };
    });
    const flagged = regions.filter(r => r.issues.length);
    const problems = [];
    if (total > ENGINE_MAX_REGIONS) problems.push(`${total} regions — the engine only reads the first ${ENGINE_MAX_REGIONS}`);
    if (total > rule.maxRegions) problems.push(`${total} regions is above the ${rule.label} budget of ${rule.maxRegions}`);
    const ids = regions.map(r => r.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) problems.push('duplicate region ids: ' + Array.from(new Set(dupes)).join(', '));

    return {
      key: lineArtKey, complexity: rule.label, count: total, rule, regions, flagged, problems,
      smallestReachPt: regions.reduce((m, r) => r.area ? Math.min(m, r.reachPt) : m, Infinity),
      pass: !problems.length && !flagged.length,
      map,
    };
  }

  /* Audit an illustrated (raster) page. Resolves to the same shape as auditArt, plus
     `tiny` (areas under 10pt of fingertip room) and `largestShare` (biggest area / picture). */
  function auditRaster(lineArtKey) {
    return ColouringEngine.buildRasterMap(Art.RASTER[lineArtKey], 1024).then(map => {
      const size = map.size, rule = RULES.detailed;
      const dist = distanceMap(map.labels, size);
      const maxD = new Uint16Array(map.regions.length);
      for (let i = 0; i < map.labels.length; i++) { const l = map.labels[i]; if (l && dist[i] > maxD[l]) maxD[l] = dist[i]; }
      let inside = 0;
      map.regions.forEach(r => { inside += r.n; });
      const regions = map.regions.slice(1).map((r, k) => {
        const reachPt = Math.round(maxD[k + 1] / 3 * 2 * PT_PER_PX);
        return { id: r.id, area: r.n, reach: maxD[k + 1] / 3, reachPt, pieces: 1, issues: [] };
      });
      const largest = regions.reduce((m, r) => Math.max(m, r.area), 0);
      const problems = [];
      if (largest / inside > rule.maxShare) problems.push(`one area covers ${Math.round(largest / inside * 100)}% of the picture — check for a gap in the lines`);
      return {
        key: lineArtKey, complexity: rule.label, count: regions.length, rule, regions, flagged: [], problems,
        tiny: regions.filter(r => r.reachPt < 10).length, largestShare: largest / inside,
        smallestReachPt: regions.reduce((m, r) => Math.min(m, r.reachPt), Infinity),
        pass: !problems.length, map,
      };
    });
  }
  // Either kind of page → Promise of its audit.
  function auditPage(page) {
    return Art.isRaster(page.lineArt) ? auditRaster(page.lineArt) : Promise.resolve(auditArt(page.lineArt, page.complexity, page.lineWeight));
  }

  // A false-colour image of the label map (each region its own hue) — shows at a glance
  // which shapes belong together and where slivers hide.
  function regionMapImage(map, outSize) {
    const size = map.size, c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size), d = img.data;
    const col = map.regions.map((r, i) => {
      const hue = (i * 137.508) % 360, s = 0.62, v = i % 2 ? 0.95 : 0.78;
      const f = n => { const k = (n + hue / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))); };
      return [f(5), f(3), f(1)];
    });
    for (let i = 0, j = 0; i < map.labels.length; i++, j += 4) {
      const l = map.labels[i];
      if (!l) { d[j] = d[j + 1] = d[j + 2] = 30; d[j + 3] = 255; continue; }
      const [r, g, b] = col[l];
      d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (!outSize || outSize === size) return c.toDataURL();
    const o = document.createElement('canvas');
    o.width = o.height = outSize;
    o.getContext('2d').drawImage(c, 0, 0, outSize, outSize);
    return o.toDataURL();
  }

  window.Audit = { RULES, ENGINE_MAX_REGIONS, PT_PER_PX, auditArt, auditRaster, auditPage, regionMapImage };
})();
