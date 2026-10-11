/*
  Placeholder artwork. TEMPORARY — replace with final illustrations.

  Contract that the rest of the app relies on (keep it when swapping in final art):
  - Every artwork is a 400×400 SVG string.
  - Every colourable area is a <g class="region" data-region="<id>" fill="…"> wrapping
    one or more shapes without their own fill. Colouring = setting that group's fill.
  - Decorative line work (eyes, mouth, glasses) carries class "deco" and ignores taps,
    so tapping an eye colours the face underneath rather than doing nothing.
  - `fills` is a plain { regionId: colour } map. Missing ids render white.
  - Colouring pages render via `lines()` (multiply-blended line art) over the child's paint image;
    the colouring engine reads the same `.region` shapes to know where fills go.
  - Completion animation hooks (optional; art without them simply doesn't move those parts):
      data-anim="gill" data-dir="-1|1" data-pivot="x y"  on each gill region (pivot in local units)
      data-anim="tail" data-pivot="x y"                   on the tail region
      <g class="eye">                                      around each eye, inside the face deco
      <g class="hop" data-pivot="x y">                     wrapping a whole character (no transform on it)
*/
(function () {
  'use strict';

  const INK = '#2b2238';
  const BLANK = '#ffffff';

  function regionRaw(id, fills, shapes, extra) {
    const f = (fills && fills[id]) || BLANK;
    return `<g class="region" data-region="${id}" fill="${f}"${extra ? ' ' + extra : ''}>${shapes}</g>`;
  }

  const region = regionRaw;

  function starPoints(cx, cy, rOuter, rInner, points) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? rInner : rOuter;
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }

  /* ── accessories (drawn on the axolotl's own coordinate space) ── */
  // Each takes R(id, shapes) — the axolotl's region maker (it applies any id prefix).
  const ACCESSORIES = {
    crown: R => R('crown', '<path d="M138 98 L146 38 L178 72 L200 26 L222 72 L254 38 L262 98 Z"/>'),
    wizard: R =>
      R('wizard-hat', '<path d="M128 96 L214 6 L272 96 Z"/>') +
      R('wizard-brim', '<ellipse cx="200" cy="98" rx="98" ry="17"/>'),
    pirate: R =>
      R('pirate-hat', '<path d="M104 102 Q200 8 296 102 Q200 78 104 102 Z"/>'),
    explorer: R =>
      R('explorer-hat', '<path d="M138 96 Q200 18 262 96 Z"/>') +
      R('explorer-brim', '<ellipse cx="200" cy="96" rx="96" ry="15"/>'),
    glasses: () =>
      `<g class="deco" fill="none"><circle cx="152" cy="150" r="27"/><circle cx="248" cy="150" r="27"/><path d="M179 148 Q200 138 221 148"/></g>`,
  };

  /* ── gills ──
     Each side is three fronds in one region (one tap colours a whole side).
     Styles are Create-mode options; colouring pages use the default 'fronds'. */
  // A leaf with a scalloped (feathery) edge, centred on 0,0 along the x axis.
  function scallopLeaf(len, wid, bumps) {
    const x = i => -len / 2 + (len * i) / bumps;
    const env = t => Math.sin(Math.PI * t);
    let d = `M${x(0)} 0`;
    for (let i = 0; i < bumps; i++) {
      const tm = (i + 0.5) / bumps;
      d += ` Q${(x(i) + x(i + 1)) / 2} ${(-wid / 2 * env(tm) - wid * 0.32 * env(tm)).toFixed(1)} ${x(i + 1)} ${(-wid / 2 * env((i + 1) / bumps)).toFixed(1)}`;
    }
    for (let i = bumps; i > 0; i--) {
      const tm = (i - 0.5) / bumps;
      d += ` Q${(x(i) + x(i - 1)) / 2} ${(wid / 2 * env(tm) + wid * 0.32 * env(tm)).toFixed(1)} ${x(i - 1)} ${(wid / 2 * env((i - 1) / bumps)).toFixed(1)}`;
    }
    return d + ' Z';
  }
  // Frond centres/angles for the left side; the right side mirrors them.
  const FRONDS = [[68, 104, 32], [52, 164, 0], [68, 224, -32]];
  function gillShapes(style, side) {
    const mirror = side === 'right';
    return FRONDS.map(([cx, cy, a]) => {
      if (mirror) { cx = 400 - cx; a = -a; }
      switch (style) {
        case 'round':
          return `<circle cx="${mirror ? cx - 8 : cx + 8}" cy="${cy}" r="27"/>`;
        case 'long': { // longer, slimmer, fanned a little wider
          const x = cx + (mirror ? 10 : -10);
          return `<ellipse cx="${x}" cy="${cy}" rx="64" ry="16" transform="rotate(${a * 1.3} ${x} ${cy})"/>`;
        }
        case 'feathery':
          return `<path d="${scallopLeaf(108, 34, 5)}" transform="translate(${cx} ${cy}) rotate(${a})"/>`;
        default: // 'fronds'
          return a ? `<ellipse cx="${cx}" cy="${cy}" rx="50" ry="21" transform="rotate(${a} ${cx} ${cy})"/>` : `<ellipse cx="${cx}" cy="${cy}" rx="50" ry="21"/>`;
      }
    }).join('');
  }

  /* ── eyes ── each eye is its own <g class="eye"> so it can blink. */
  function eyeShapes(style) {
    return [152, 248].map((cx, i) => {
      const cy = 150;
      let e;
      switch (style) {
        case 'big':
          e = `<circle cx="${cx}" cy="${cy}" r="21" fill="${INK}"/><circle cx="${cx - 7}" cy="${cy - 7}" r="7" fill="#fff" stroke="none"/><circle cx="${cx + 7}" cy="${cy + 7}" r="3" fill="#fff" stroke="none"/>`;
          break;
        case 'small': // a small, simple eye with one glint of light tucked into its upper corner
          e = `<circle cx="${cx}" cy="${cy}" r="12" fill="${INK}"/><circle cx="${cx - 4.5}" cy="${cy - 4.5}" r="3.4" fill="#fff" stroke="none"/>`;
          break;
        case 'happy':
          e = `<path d="M${cx - 16} ${cy + 6} Q${cx} ${cy - 16} ${cx + 16} ${cy + 6}" fill="none" stroke-width="8"/>`;
          break;
        case 'sleepy':
          e = `<path d="M${cx - 17} ${cy - 2} Q${cx} ${cy + 12} ${cx + 17} ${cy - 2}" fill="none" stroke-width="7"/>` +
              `<path d="M${cx - 12} ${cy + 7} l-4 7 M${cx} ${cy + 10} l0 8 M${cx + 12} ${cy + 7} l4 7" fill="none" stroke-width="4"/>`;
          break;
        case 'starry':
          e = `<circle cx="${cx}" cy="${cy}" r="20" fill="${INK}"/><polygon points="${starPoints(cx, cy, 12, 5, 5)}" fill="#ffe27a" stroke="none"/>`;
          break;
        case 'silly': {
          const [dx, dy] = i ? [-6, 7] : [7, -6]; // pupils looking different ways
          e = `<circle cx="${cx}" cy="${cy}" r="20" fill="#fff" stroke-width="5"/><circle cx="${cx + dx}" cy="${cy + dy}" r="9" fill="${INK}" stroke="none"/>`;
          break;
        }
        default: // 'classic' — the colouring pages' eyes
          e = `<circle cx="${cx}" cy="${cy}" r="15" fill="${INK}"/><circle cx="${cx - 5}" cy="${cy - 6}" r="5" fill="#fff" stroke="none"/>`;
      }
      return `<g class="eye">${e}</g>`;
    }).join('');
  }

  /* ── patterns (Create mode) ── drawn in the gill colour, clipped to head / body / tail. */
  function heartPath(x, y, r) {
    return `M${x} ${y + r * 0.9} C${x - r * 1.6} ${y - r * 0.2} ${x - r * 0.7} ${y - r * 1.4} ${x} ${y - r * 0.4} C${x + r * 0.7} ${y - r * 1.4} ${x + r * 1.6} ${y - r * 0.2} ${x} ${y + r * 0.9} Z`;
  }
  const PATTERN_SPOTS = {
    head: [[162, 96, 10], [232, 90, 8], [272, 118, 9], [110, 132, 7], [196, 234, 0]].filter(p => p[2]),
    body: [[156, 280, 11], [238, 292, 9], [196, 322, 7], [124, 306, 6], [276, 318, 6]],
    tail: [[318, 290, 9], [352, 262, 7], [372, 232, 5]],
  };
  const PATTERN_STRIPES = {
    head: ['M176 78 Q182 96 176 112', 'M200 74 Q205 94 200 110', 'M224 78 Q218 96 224 112'],
    body: ['M140 240 Q128 292 142 346', 'M178 236 Q168 292 180 350', 'M222 236 Q232 292 220 350', 'M260 240 Q272 292 258 346'],
    tail: ['M300 296 Q312 314 306 334', 'M336 276 Q352 292 348 314', 'M364 246 Q378 258 378 280'],
  };
  function patternLayer(kind, part, colour, clipId) {
    if (!kind || kind === 'none') return '';
    if (kind === 'stripes') {
      return `<g clip-path="url(#${clipId})" fill="none" stroke="${colour}" stroke-width="13" stroke-opacity=".85">${PATTERN_STRIPES[part].map(d => `<path d="${d}"/>`).join('')}</g>`;
    }
    const shapes = PATTERN_SPOTS[part].map(([x, y, r]) => {
      if (kind === 'stars') return `<polygon points="${starPoints(x, y, r * 1.5, r * 0.7, 5)}"/>`;
      if (kind === 'hearts') return `<path d="${heartPath(x, y, r * 1.1)}"/>`;
      return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    }).join('');
    return `<g clip-path="url(#${clipId})" fill="${colour}" fill-opacity=".85" stroke="none">${shapes}</g>`;
  }

  /* ── the axolotl ──
     opts: { accessory, shine, gillStyle, eyes, pattern, patternColour, uid, prefix, simple }
     `simple` is for small axolotls on busy pages: cheeks become drawn lines (they'd be too
     small to tap) and the feet colour together with the body.
     With no opts it's the plain colouring-page axolotl. `prefix` keeps region ids unique
     when a page has more than one axolotl (e.g. 'baby-'). Pattern needs a `uid` (unique per SVG)
     for its clip paths. Behind-the-head accessories (helmet) are drawn first. */
  const HEAD = '<ellipse cx="200" cy="166" rx="112" ry="90"/>';
  const BODY = '<ellipse cx="200" cy="292" rx="96" ry="58"/>';
  const TAIL = '<path d="M262 300 C326 296 368 256 386 204 C388 282 344 338 262 336 Z"/>';

  function axolotl(fills, opts) {
    opts = opts || {};
    if (opts.v3) return axolotlV3(fills, opts);
    if (opts.v2) return axolotlV2(fills, opts);
    const acc = opts.accessory;
    const pre = opts.prefix || '';
    const region = (id, f, shapes, extra) => regionRaw(pre + id, f, shapes, extra);
    const R = (id, shapes, extra) => region(id, fills, shapes, extra);
    const pat = opts.pattern && opts.pattern !== 'none' && opts.uid ? opts.pattern : null;
    // A patterned part: fill, pattern clipped inside it, then its outline again on top.
    const part = (shape, name) => pat
      ? shape + patternLayer(pat, name, opts.patternColour || INK, `${opts.uid}-${name}`) + shape.replace('/>', ' fill="none"/>')
      : shape;
    let s = '';

    if (pat) {
      s += `<defs><clipPath id="${opts.uid}-head">${HEAD}</clipPath><clipPath id="${opts.uid}-body">${BODY}</clipPath><clipPath id="${opts.uid}-tail">${TAIL}</clipPath></defs>`;
    }
    if (acc === 'helmet') {
      s += region('helmet', fills, '<circle cx="200" cy="186" r="172"/>', 'fill-opacity="0.9"');
    }

    // Tail sweeps up and to the right behind the body.
    s += region('tail', fills, part(TAIL, 'tail'), 'data-anim="tail" data-pivot="266 318"');
    const FEET = '<ellipse cx="148" cy="344" rx="30" ry="18"/><ellipse cx="252" cy="344" rx="30" ry="18"/>';
    s += region('body', fills, part(BODY, 'body') + (opts.simple ? FEET : ''));

    s += region('gill-left', fills, gillShapes(opts.gillStyle, 'left'), 'data-anim="gill" data-dir="-1" data-pivot="118 164"');
    s += region('gill-right', fills, gillShapes(opts.gillStyle, 'right'), 'data-anim="gill" data-dir="1" data-pivot="282 164"');

    s += region('head', fills, part(HEAD, 'head'));
    // Glossy highlight — characters only; colouring pages stay plain line art.
    if (opts.shine) s += '<ellipse class="deco" cx="150" cy="104" rx="34" ry="14" transform="rotate(-18 150 104)" fill="#fff" fill-opacity=".45" stroke="none"/>';
    const CHEEKS = '<ellipse cx="136" cy="198" rx="20" ry="13"/><ellipse cx="264" cy="198" rx="20" ry="13"/>';
    if (!opts.simple) {
      s += region('cheek-left', fills, '<ellipse cx="136" cy="198" rx="20" ry="13"/>');
      s += region('cheek-right', fills, '<ellipse cx="264" cy="198" rx="20" ry="13"/>');
    }

    // Face (not colourable).
    s += `<g class="deco">${eyeShapes(opts.eyes)}<path d="M180 192 Q200 210 220 192" fill="none"/>${opts.simple ? CHEEKS.replace(/\/>/g, ' fill="none"/>') : ''}</g>`;

    if (!opts.simple) {
      s += region('foot-left', fills, '<ellipse cx="148" cy="344" rx="30" ry="18"/>');
      s += region('foot-right', fills, '<ellipse cx="252" cy="344" rx="30" ry="18"/>');
    }

    if (acc && acc !== 'helmet' && ACCESSORIES[acc]) s += ACCESSORIES[acc](R);
    return s;
  }

  /* ── the second-generation axolotl (Pass 11 artwork) ──
     Same head, gills, face, hats, eyes and patterns as axolotl(), plus a rounder body with a
     belly, feet, little arms in a pose, and optionally a prop held in both hands.
     A separate function on purpose: art keys are permanent, so axolotl() must never change.
     opts: everything axolotl() takes, plus
       pose: 'down' | 'wave' | 'hold'   (default 'down')
       held: a HELD prop id (implies 'hold') */
  const BODY2 = '<path d="M122 236 C104 292 128 358 200 362 C272 358 296 292 278 236 Z"/>';
  const BELLY2 = '<ellipse cx="200" cy="314" rx="52" ry="38"/>';
  const TAIL2 = '<path d="M256 312 C318 318 362 286 386 222 C400 262 394 314 356 340 C330 358 290 362 256 352 Z"/>';
  const FEET2 = ['<ellipse cx="152" cy="360" rx="32" ry="16"/>', '<ellipse cx="248" cy="360" rx="32" ry="16"/>'];
  // Arms are rounded capsules hanging from the shoulders; rotate(0) points straight down.
  const arm = (x, y, deg) => `<rect x="-15" y="-8" width="30" height="64" rx="15" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  const POSES = {
    down: { left: 18, right: -18 },
    hold: { left: -54, right: 54 },     // hands meet in front of the belly, around (200, 298)
    wave: { left: 18, right: -150 },    // right hand up beside the face
  };

  // Props held in both hands (axolotl coordinates; drawn between the body and the arms).
  const HELD = {
    map: R =>
      R('map-1', '<polygon points="134,268 178,260 182,338 130,346"/>') +
      R('map-2', '<polygon points="178,260 222,268 226,346 182,338"/>') +
      R('map-3', '<polygon points="222,268 266,260 270,338 226,346"/>') +
      '<g class="deco" fill="none"><path d="M146 326 Q178 288 206 314 T252 292" stroke-dasharray="2 12" stroke-width="6"/><path d="M244 280 L262 298 M262 280 L244 298"/></g>',
    telescope: R =>
      R('telescope', '<rect x="-20" y="-128" width="40" height="160" rx="10" transform="translate(196 304) rotate(62)"/>') +
      R('telescope-end', '<rect x="-29" y="-162" width="58" height="40" rx="10" transform="translate(196 304) rotate(62)"/>') +
      '<g class="deco" fill="none" stroke-width="4"><path d="M-20 -60 L20 -60" transform="translate(196 304) rotate(62)"/></g>',
    book: R =>
      R('book-cover', '<path d="M130 336 L130 272 L200 282 L270 272 L270 336 L200 346 Z"/>') +
      R('book-left', '<path d="M200 334 L200 276 Q168 262 140 270 L140 328 Q170 320 200 334 Z"/>') +
      R('book-right', '<path d="M200 334 L200 276 Q232 262 260 270 L260 328 Q230 320 200 334 Z"/>') +
      '<g class="deco" fill="none" stroke-width="4"><path d="M152 290 Q170 284 188 292 M152 306 Q170 300 188 308 M212 292 Q230 284 248 290 M212 308 Q230 300 248 306"/></g>',
    flower: R =>
      R('flower-stem', '<rect x="190" y="262" width="20" height="84" rx="10"/>') +
      R('flower-petals', [[200, 222], [224, 240], [216, 268], [184, 268], [176, 240]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20"/>`).join('')) +
      R('flower-middle', '<circle cx="200" cy="247" r="17"/>'),
    // A ship's wheel: handles, rim, inner disc and hub, with spokes drawn on top.
    wheel: R =>
      R('wheel-handles', Array.from({ length: 8 }, (_, i) => {
        const a = i * Math.PI / 4, x = 200 + Math.cos(a) * 66, y = 298 + Math.sin(a) * 66;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11"/>`;
      }).join('')) +
      R('wheel', '<circle cx="200" cy="298" r="56"/>') +
      R('wheel-inner', '<circle cx="200" cy="298" r="38"/>') +
      `<g class="deco" fill="none">${Array.from({ length: 4 }, (_, i) => {
        const a = i * Math.PI / 4, dx = Math.cos(a) * 38, dy = Math.sin(a) * 38;
        return `<path d="M${(200 - dx).toFixed(1)} ${(298 - dy).toFixed(1)} L${(200 + dx).toFixed(1)} ${(298 + dy).toFixed(1)}"/>`;
      }).join('')}</g>` +
      R('wheel-hub', '<circle cx="200" cy="298" r="18"/>'),
    coin: R =>
      R('coin', '<circle cx="200" cy="296" r="44"/>') +
      `<g class="deco"><polygon points="${starPoints(200, 296, 22, 10, 5)}" fill="none"/><circle cx="200" cy="296" r="34" fill="none" stroke-width="4"/></g>`,
    lantern: R =>
      R('lantern-top', '<polygon points="160,272 200,238 240,272"/>') +
      R('lantern', '<rect x="168" y="268" width="64" height="70" rx="12"/>') +
      R('lantern-base', '<rect x="162" y="334" width="76" height="16" rx="6"/>') +
      '<g class="deco" fill="none" stroke-width="4"><path d="M186 286 L186 322 M214 286 L214 322"/></g>',
  };

  function axolotlV2(fills, opts) {
    const acc = opts.accessory;
    const pre = opts.prefix || '';
    const region = (id, f, shapes, extra) => regionRaw(pre + id, f, shapes, extra);
    const R = (id, shapes, extra) => region(id, fills, shapes, extra);
    const pat = opts.pattern && opts.pattern !== 'none' && opts.uid ? opts.pattern : null;
    const part = (shape, name) => pat
      ? shape + patternLayer(pat, name, opts.patternColour || INK, `${opts.uid}-${name}`) + shape.replace('/>', ' fill="none"/>')
      : shape;
    const pose = POSES[opts.held ? 'hold' : (opts.pose || 'down')] || POSES.down;
    let s = '';

    if (pat) {
      s += `<defs><clipPath id="${opts.uid}-head">${HEAD}</clipPath><clipPath id="${opts.uid}-body">${BODY2}</clipPath><clipPath id="${opts.uid}-tail">${TAIL2}</clipPath></defs>`;
    }
    if (acc === 'helmet') s += region('helmet', fills, '<circle cx="200" cy="190" r="176"/>', 'fill-opacity="0.9"');

    s += region('tail', fills, part(TAIL2, 'tail'), 'data-anim="tail" data-pivot="262 334"');
    // Small axolotls (opts.simple) colour their feet and arms together with the body,
    // so nothing on the page is too small to tap.
    s += region('body', fills, part(BODY2, 'body') + (opts.simple ? FEET2.join('') + arm(128, 262, pose.left) + arm(272, 262, pose.right) : ''));
    // A held prop covers the belly, so then it isn't a separate (too small to tap) region.
    if (!opts.held) s += region('belly', fills, BELLY2);

    s += region('gill-left', fills, gillShapes(opts.gillStyle, 'left'), 'data-anim="gill" data-dir="-1" data-pivot="118 164"');
    s += region('gill-right', fills, gillShapes(opts.gillStyle, 'right'), 'data-anim="gill" data-dir="1" data-pivot="282 164"');
    s += region('head', fills, part(HEAD, 'head'));
    if (opts.shine) s += '<ellipse class="deco" cx="150" cy="104" rx="34" ry="14" transform="rotate(-18 150 104)" fill="#fff" fill-opacity=".45" stroke="none"/>';
    const CHEEKS = '<ellipse cx="136" cy="198" rx="20" ry="13"/><ellipse cx="264" cy="198" rx="20" ry="13"/>';
    if (!opts.simple) {
      s += region('cheek-left', fills, '<ellipse cx="136" cy="198" rx="20" ry="13"/>');
      s += region('cheek-right', fills, '<ellipse cx="264" cy="198" rx="20" ry="13"/>');
    }
    s += `<g class="deco">${eyeShapes(opts.eyes)}<path d="M180 192 Q200 210 220 192" fill="none"/>${opts.simple ? CHEEKS.replace(/\/>/g, ' fill="none"/>') : ''}</g>`;

    if (!opts.simple) {
      s += region('foot-left', fills, FEET2[0]);
      s += region('foot-right', fills, FEET2[1]);
    }
    if (opts.held && HELD[opts.held]) s += HELD[opts.held](R);
    if (!opts.simple) {
      s += region('arm-left', fills, arm(128, 262, pose.left));
      s += region('arm-right', fills, arm(272, 262, pose.right), opts.pose === 'wave' && !opts.held ? 'data-anim="wave" data-pivot="272 262"' : '');
    }

    if (acc && acc !== 'helmet' && ACCESSORIES[acc]) s += ACCESSORIES[acc](R);
    return s;
  }

  /* ── the third-generation axolotl (v3 artwork) ──
     Drawn from hand-tuned curves rather than circles and ellipses: a soft mochi head,
     tapered feathery gills, chubby bean body, three-fingered hands, toe-bumped feet,
     S-curved tail, sparkly eyes and a "w" mouth. Outer shapes use the page's bold line;
     inner details (belly, cheeks, face) use a thinner one, like an illustrator's inking.
     A separate function so earlier art keys stay pixel-identical.
     opts: everything axolotlV2() takes, plus
       tilt: degrees to tilt the head (gives a pose some personality)
       pose: 'down' | 'wave' | 'hold' | 'cheer' */
  const P = n => n.toFixed(1);
  const HEAD3 = '<path d="M200 82 C268 82 322 112 324 170 C326 226 274 258 200 258 C126 258 74 226 76 170 C78 112 132 82 200 82 Z"/>';
  const BODY3 = '<path d="M138 232 C114 282 124 354 200 356 C276 354 286 282 262 232 Z"/>';
  const BELLY3 = '<path d="M164 274 C156 304 166 340 200 342 C234 340 244 304 236 274 C220 262 180 262 164 274 Z"/>';
  const TAIL3 = '<path d="M250 330 C300 342 340 322 362 284 C380 252 382 216 372 188 C398 212 408 262 388 306 C364 354 302 372 248 358 Z"/>';
  const INNER = 'stroke-width="4"';
  // A foot with three toe bumps, centred at (x, y).
  const foot3 = (x, y) => `<path d="M${x - 32} ${y} C${x - 32} ${y - 16} ${x + 32} ${y - 16} ${x + 32} ${y} C${x + 32} ${y + 9} ${x + 24} ${y + 13} ${x + 17} ${y + 11} C${x + 12} ${y + 18} ${x + 4} ${y + 18} ${x} ${y + 12} C${x - 4} ${y + 18} ${x - 12} ${y + 18} ${x - 17} ${y + 11} C${x - 24} ${y + 13} ${x - 32} ${y + 9} ${x - 32} ${y} Z"/>`;
  // A stubby arm with a three-fingered hand, hanging from (x, y), rotated by deg (0 = straight down).
  const arm3 = (x, y, deg) => `<path d="M-14 0 L-14 40 C-17 52 -8 60 -4 54 C-2 61 5 62 7 55 C12 60 18 52 14 42 L14 0 Z" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  const POSES3 = {
    down: { left: 24, right: -24 },
    hold: { left: -58, right: 58 },
    wave: { left: 24, right: -150 },
    cheer: { left: 150, right: -150 },
  };

  // One gill frond: a tapered, gently curved feather with scalloped edges.
  // Base at (bx, by) (tucked under the head), pointing along `deg`, curling by `bend`.
  function frond(bx, by, deg, len, wid, bend, bumps) {
    const a = deg * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    const c = t => [bx + dx * len * t + nx * bend * Math.sin(Math.PI * t), by + dy * len * t + ny * bend * Math.sin(Math.PI * t)];
    const w = t => wid * Math.pow(Math.sin(Math.PI * (0.22 + 0.78 * t)), 0.9) / 2;
    const edge = (side, t) => { const [x, y] = c(t); return [x + nx * w(t) * side, y + ny * w(t) * side]; };
    const n = bumps;
    let d = '';
    [1, -1].forEach(side => {
      const ts = Array.from({ length: n + 1 }, (_, i) => side === 1 ? i / n : 1 - i / n);
      ts.forEach((t, i) => {
        const [x, y] = edge(side, t);
        if (i === 0) { d += (side === 1 ? 'M' : 'L') + P(x) + ' ' + P(y); return; }
        const tm = (t + ts[i - 1]) / 2, [mx, my] = c(tm), push = w(tm) * 1.28;
        d += ` Q${P(mx + nx * push * side)} ${P(my + ny * push * side)} ${P(x)} ${P(y)}`;
      });
    });
    return `<path d="${d} Z"/>`;
  }
  // Left-side fronds: [baseX, baseY, angle]; the right side mirrors them.
  const FRONDS3 = [[106, 120, 216], [94, 170, 184], [106, 220, 152]];
  function gills3(style, side) {
    const m = side === 'right';
    return FRONDS3.map(([x, y, deg], i) => {
      if (m) { x = 400 - x; deg = 180 - deg; }
      const bend = (m ? 1 : -1) * (i === 0 ? 12 : i === 2 ? -12 : 4);
      switch (style) {
        case 'round': { const a = deg * Math.PI / 180; return `<circle cx="${P(x + Math.cos(a) * 52)}" cy="${P(y + Math.sin(a) * 52)}" r="28"/>`; }
        case 'long': return frond(x, y, deg, 118, 30, bend * 1.4, 6);
        default: return frond(x, y, deg, 104, 38, bend, 4); // 'fronds' / 'feathery'
      }
    }).join('');
  }

  function axolotlV3(fills, opts) {
    const acc = opts.accessory;
    const pre = opts.prefix || '';
    const region = (id, f, shapes, extra) => regionRaw(pre + id, f, shapes, extra);
    const R = (id, shapes, extra) => region(id, fills, shapes, extra);
    const pat = opts.pattern && opts.pattern !== 'none' && opts.uid ? opts.pattern : null;
    const part = (shape, name) => pat
      ? shape + patternLayer(pat, name, opts.patternColour || INK, `${opts.uid}-${name}`) + shape.replace('/>', ' fill="none"/>')
      : shape;
    const pose = POSES3[opts.held ? 'hold' : (opts.pose || 'down')] || POSES3.down;
    const tilt = opts.tilt || 0;
    let s = '';

    if (pat) {
      s += `<defs><clipPath id="${opts.uid}-head">${HEAD3}</clipPath><clipPath id="${opts.uid}-body">${BODY3}</clipPath><clipPath id="${opts.uid}-tail">${TAIL3}</clipPath></defs>`;
    }
    if (acc === 'helmet') s += region('helmet', fills, '<circle cx="200" cy="196" r="178"/>', 'fill-opacity="0.9"');

    s += region('tail', fills, part(TAIL3, 'tail'), 'data-anim="tail" data-pivot="256 340"');
    const feetInBody = opts.simple || HELD3_COVERS_FEET[opts.held];
    s += region('body', fills, part(BODY3, 'body') + (feetInBody ? foot3(164, 352) + foot3(236, 352) : '') +
      (opts.simple ? arm3(146, 262, pose.left) + arm3(254, 262, pose.right) : ''));
    if (!opts.held) s += region('belly', fills, BELLY3, INNER);
    if (!feetInBody) {
      s += region('foot-left', fills, foot3(164, 352));
      s += region('foot-right', fills, foot3(236, 352));
    }

    // Head cluster (gills, head, face, hat) tilts together around the neck.
    let head = '';
    head += region('gill-left', fills, gills3(opts.gillStyle, 'left'), 'data-anim="gill" data-dir="-1" data-pivot="112 170"');
    head += region('gill-right', fills, gills3(opts.gillStyle, 'right'), 'data-anim="gill" data-dir="1" data-pivot="288 170"');
    head += region('head', fills, part(HEAD3, 'head'));
    if (opts.shine) head += '<path class="deco top" d="M128 118 C142 102 166 94 188 94" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="9"/>';
    const CHEEKS = '<ellipse cx="136" cy="206" rx="21" ry="13"/><ellipse cx="264" cy="206" rx="21" ry="13"/>';
    if (!opts.simple) {
      head += region('cheek-left', fills, '<ellipse cx="136" cy="206" rx="21" ry="13"/>', INNER);
      head += region('cheek-right', fills, '<ellipse cx="264" cy="206" rx="21" ry="13"/>', INNER);
    }
    // "deco top": the face is redrawn above the colouring so eye sparkles stay white.
    head += `<g class="deco top"><g transform="translate(0 12)">${eyeShapes(opts.eyes || 'big')}</g>` +
      `<path d="M184 204 Q192 214 200 205 Q208 214 216 204" fill="none" ${INNER}/>` +
      (opts.simple ? CHEEKS.replace(/\/>/g, ` fill="none" ${INNER}/>`) : '') + '</g>';
    if (acc && HATS3[acc]) head += HATS3[acc](R, opts.simple);
    s += tilt ? `<g transform="rotate(${tilt} 200 250)">${head}</g>` : head;

    if (opts.held && HELD3[opts.held]) s += HELD3[opts.held](R);
    if (!opts.simple) {
      s += region('arm-left', fills, arm3(146, 262, pose.left));
      s += region('arm-right', fills, arm3(254, 262, pose.right), opts.pose === 'wave' && !opts.held ? 'data-anim="wave" data-pivot="254 262"' : '');
    }
    return s;
  }

  // v3 hats (head top is y≈82). Each takes R(id, shapes) like ACCESSORIES.
  const HATS3 = {
    crown: R =>
      R('crown', '<path d="M132 108 L268 108 L274 64 L242 86 L222 44 L200 76 L178 44 L158 86 L126 64 Z"/>') +
      `<g class="deco" fill="none" stroke-width="3.5"><circle cx="200" cy="96" r="6"/><circle cx="164" cy="98" r="5"/><circle cx="236" cy="98" r="5"/><circle cx="126" cy="60" r="6"/><circle cx="178" cy="40" r="6"/><circle cx="222" cy="40" r="6"/><circle cx="274" cy="60" r="6"/></g>`,
    wizard: R =>
      R('wizard-hat', '<path d="M122 102 C150 88 168 40 192 10 C210 -8 244 0 254 20 C234 16 222 28 226 50 C234 76 258 90 280 102 Z"/>') +
      R('wizard-brim', '<ellipse cx="200" cy="104" rx="108" ry="18"/>') +
      `<g class="deco" fill="none" stroke-width="3.5"><polygon points="${starPoints(186, 64, 11, 5, 5)}"/><path d="M220 72 A10 10 0 1 0 226 86 A8 8 0 1 1 220 72 Z"/></g>`,
    pirate: R =>
      R('pirate-hat', '<path d="M128 102 C120 36 280 36 272 102 Z"/>') +
      R('pirate-brim', '<path d="M66 118 C66 60 118 62 148 92 C168 64 232 64 252 92 C282 62 334 60 334 118 C290 138 110 138 66 118 Z"/>') +
      '<g class="deco" fill="none" stroke-width="4"><path d="M200 74 L200 108 M188 82 L212 82 M184 98 Q200 116 216 98"/><circle cx="200" cy="70" r="5"/></g>',
    // On small axolotls (simple) the band is a drawn line rather than a separate area.
    explorer: (R, simple) =>
      R('explorer-hat', '<path d="M136 100 C138 30 262 30 264 100 Z"/>') +
      (simple ? '<g class="deco" fill="none" stroke-width="4"><path d="M136 88 C170 80 230 80 264 88"/></g>'
              : R('explorer-band', '<path d="M136 86 C170 78 230 78 264 86 L266 100 C230 92 170 92 134 100 Z"/>')) +
      R('explorer-brim', '<ellipse cx="200" cy="104" rx="110" ry="17"/>'),
    helmet: () => '',
    glasses: () => `<g class="deco" fill="none"><circle cx="152" cy="172" r="29"/><circle cx="248" cy="172" r="29"/><path d="M181 170 Q200 160 219 170"/></g>`,
  };

  // Held props that hide the feet: then the feet colour with the body (too little would show).
  const HELD3_COVERS_FEET = { lantern: true };

  // Props held in both hands (v3), with illustrative detail as thin deco lines.
  const DECO = (inner, w) => `<g class="deco" fill="none" stroke-width="${w || 3.5}">${inner}</g>`;
  const HELD3 = {
    map: R =>
      R('map', '<path d="M128 262 L176 254 L224 264 L272 254 L276 334 L228 344 L180 334 L132 344 Z"/>') +
      DECO('<path d="M176 254 L180 334 M224 264 L228 344"/><path d="M146 322 Q170 290 196 310 T242 292" stroke-dasharray="1 10" stroke-width="5"/><path d="M240 282 L256 298 M256 282 L240 298" stroke-width="5"/>'),
    wheel: R =>
      R('wheel-handles', Array.from({ length: 8 }, (_, i) =>
        `<rect x="-9" y="-80" width="18" height="30" rx="9" transform="translate(200 300) rotate(${i * 45})"/>`).join('')) +
      R('wheel', '<circle cx="200" cy="300" r="56"/>') +
      R('wheel-inner', '<circle cx="200" cy="300" r="40"/>') +
      DECO(Array.from({ length: 4 }, (_, i) => `<path d="M200 260 L200 340" transform="rotate(${i * 45} 200 300)"/>`).join(''), 5) +
      R('wheel-hub', '<circle cx="200" cy="300" r="21"/>'),
    book: R =>
      R('book-cover', '<path d="M126 340 L126 270 Q164 260 200 280 Q236 260 274 270 L274 340 Q236 330 200 350 Q164 330 126 340 Z"/>') +
      R('book-pages', '<path d="M136 330 L136 272 Q168 264 200 282 Q232 264 264 272 L264 330 Q232 322 200 340 Q168 322 136 330 Z"/>') +
      DECO('<path d="M200 282 L200 340"/><path d="M150 288 Q168 284 186 292 M150 302 Q168 298 186 306 M150 316 Q168 312 186 320 M214 292 Q232 284 250 288 M214 306 Q232 298 250 302 M214 320 Q232 312 250 316"/>'),
    flower: R =>
      R('flower-leaves', '<path d="M200 316 C178 300 160 304 152 318 C170 326 186 324 200 316 Z"/><path d="M200 300 C222 284 240 288 248 302 C230 310 214 308 200 300 Z"/>') +
      R('flower-stem', '<path d="M194 258 C192 290 196 320 194 350 L206 350 C208 320 204 290 206 258 Z"/>') +
      R('flower-petals', Array.from({ length: 6 }, (_, i) => `<ellipse cx="200" cy="216" rx="15" ry="24" transform="rotate(${i * 60} 200 240)"/>`).join('')) +
      R('flower-middle', '<circle cx="200" cy="240" r="16"/>') +
      DECO('<circle cx="195" cy="236" r="2"/><circle cx="205" cy="242" r="2"/>', 3),
    coin: R =>
      R('coin', '<circle cx="200" cy="298" r="46"/>') +
      DECO(`<circle cx="200" cy="298" r="34"/><polygon points="${starPoints(200, 298, 20, 9, 5)}"/>`, 4),
    // Held by its handle, hanging below the hands so the whole lantern shows.
    lantern: R =>
      R('lantern', '<path d="M156 302 Q200 266 244 302 Z"/><path d="M164 300 L236 300 C250 326 250 344 236 366 L164 366 C150 344 150 326 164 300 Z"/>') +
      R('lantern-base', '<rect x="154" y="362" width="92" height="18" rx="8"/>') +
      R('lantern-flame', '<path d="M200 306 C222 326 222 350 200 360 C178 350 178 326 200 306 Z"/>') +
      DECO('<path d="M180 286 Q200 260 220 286" stroke-width="5"/><path d="M146 318 L132 312 M144 340 L128 342 M254 318 L268 312 M256 340 L272 342"/>'),
  };

  /* An axolotl placed on a page at (x, y), scaled by s. Line weight stays the same as the
     page's (stroke is rescaled), and it's wrapped in a `.hop` for the completion animation. */
  function placeAxolotl(fills, x, y, s, opts) {
    const py0 = opts && opts.v3 ? 364 : opts && opts.v2 ? 360 : 344;
    const px = (x + 200 * s).toFixed(1), py = (y + py0 * s).toFixed(1);
    return `<g class="hop" data-pivot="${px} ${py}"><g transform="translate(${x} ${y}) scale(${s})" stroke-width="${(6 / s).toFixed(2)}">${axolotl(fills, opts)}</g></g>`;
  }

  function svgWrap(inner, label, cls) {
    return `<svg class="${cls || 'art'}" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label || 'axolotl picture'}">` +
      `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;
  }

  /* Registry of colouring-page line art (pages are defined in js/pages.js).
     A page is a function(fills) → inner SVG, or a plain inner-SVG string (e.g. final art
     exported from an illustration tool, with its colourable areas tagged as regions). */
  const LINE_ART = {};
  function registerPage(key, art) {
    LINE_ART[key] = typeof art === 'function' ? art : () => art;
  }

  /* Raster line art (an illustrated page delivered as an image, e.g. art/pages/final-*.png,
     wrapped as a data: URI by tools/prep-raster.js so it works from file://). It has no
     .region shapes: the colouring engine finds its colourable areas from the pixels
     (ColouringEngine.buildRasterMap). Reference colourings don't apply. */
  const RASTER = {};
  // opts.gap: px of gap-closing the region finder applies to this image (default 2). Raise it
  // for art whose outlines have small breaks, after checking the region map in the workbench.
  function registerRaster(key, src, opts) {
    RASTER[key] = src;
    if (opts && opts.gap != null && window.ColouringEngine) ColouringEngine.RASTER_GAP[src] = opts.gap;
    else if (opts && opts.gap != null) (window.__rasterGap = window.__rasterGap || {})[src] = opts.gap;
    LINE_ART[key] = () => `<image class="raster" href="${src}" x="0" y="0" width="400" height="400" preserveAspectRatio="none"/>`;
  }
  const isRaster = key => !!RASTER[key];

  /* Line art to lay over the child's paint layer. Two stacked SVGs:
     - art-lines: the blank page (white shapes, dark outlines) blended with `multiply`,
       so white lets paint through, outlines stay dark, and shapes behind others stay hidden.
     - art-deco: only the face/decoration, drawn normally so eye sparkles stay white. */
  function lines(lineArtKey, label) {
    // Raster pages are one multiply-blended image: nothing needs redrawing above the paint.
    if (RASTER[lineArtKey]) return svgWrap(LINE_ART[lineArtKey](), label, 'art art-lines');
    const fn = LINE_ART[lineArtKey];
    const inner = fn ? fn({}) : '';
    // Art that marks its face details "deco top" only redraws those on top; texture lines
    // stay in stacking order. Older art (no marker) keeps redrawing all deco, as before.
    const layered = inner.includes('class="deco top"');
    return svgWrap(inner, label, 'art art-lines') + svgWrap(inner, '', 'art art-deco' + (layered ? ' layered' : '')).replace('role="img"', 'aria-hidden="true"');
  }

  /* The same page as one plain SVG — the completion animation rebuilds it with the
     child's paint clipped into each region (see alive.js). */
  function plain(lineArtKey, label) {
    const fn = LINE_ART[lineArtKey];
    return svgWrap(fn ? fn({}) : '', label, 'art art-alive');
  }

  /* The page fully coloured from a { regionId: colour } map — the reference/preview image
     (Content page `reference`). Same art function, so it can never drift from the line art. */
  function coloured(lineArtKey, fills, label) {
    const fn = LINE_ART[lineArtKey];
    return svgWrap(fn ? fn(fills || {}) : '', label, 'art art-reference');
  }

  /* A created character, fully coloured.
     ch: { body, gills, gillStyle, eyes, pattern, accessory, name, pose }
     opts.crop = 'head' frames just the head, gills and hat (for Create's option tiles). */
  let uidSeq = 0;
  // A paler version of a colour, for a created axolotl's belly.
  function lighten(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    const mix = c => Math.round(c + (255 - c) * 0.55);
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => mix(c).toString(16).padStart(2, '0')).join('');
  }
  function character(ch, opts) {
    opts = opts || {};
    const body = ch.body || '#ffb3d1';
    const gills = ch.gills || '#ff6fa8';
    const fills = {
      body, head: body, tail: body, 'foot-left': body, 'foot-right': body,
      'gill-left': gills, 'gill-right': gills,
      'cheek-left': '#ff9cc2', 'cheek-right': '#ff9cc2',
      crown: '#ffd84a', 'wizard-hat': '#8b5cf6', 'wizard-brim': '#8b5cf6',
      'pirate-hat': '#3a3340', 'explorer-hat': '#c8a26b', 'explorer-brim': '#a9844f', helmet: '#e6f6ff',
      belly: lighten(body), 'arm-left': body, 'arm-right': body,
      'pirate-brim': '#3a3340', 'explorer-band': '#8a6a52',
    };
    const look = {
      v3: true, pose: ch.pose, tilt: ch.pose === 'wave' ? -5 : 0,
      accessory: ch.accessory, shine: true,
      gillStyle: ch.gillStyle, eyes: ch.eyes || 'classic',
      pattern: ch.pattern, patternColour: gills, uid: 'axo' + (++uidSeq),
    };
    const shadow = opts.crop ? '' : '<ellipse cx="200" cy="372" rx="120" ry="14" fill="#2b2238" fill-opacity=".10" stroke="none"/>';
    const inner = shadow + `<g class="hop" data-pivot="200 342"><g transform="translate(20 14) scale(0.9)">${axolotl(fills, look)}</g></g>`;
    const svg = svgWrap(inner, ch.name ? 'Axolotl called ' + U.escapeHtml(ch.name) : 'axolotl');
    return opts.crop === 'head' ? svg.replace('viewBox="0 0 400 400"', 'viewBox="18 -2 364 258"') : svg;
  }

  window.Art = {
    lines, plain, coloured, character, registerPage, registerRaster, isRaster, RASTER, LINE_ART, ACCESSORIES, INK,
    // Drawing kit for page definitions (js/pages.js).
    kit: { region: regionRaw, starPoints, heartPath, axolotl, placeAxolotl, INK },
  };
})();
