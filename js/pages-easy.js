/*
  Easy pack — ten very simple colouring pages for the youngest children (GDD v0.2 §4, Pass 11).

  Authored in code as final-quality vector line art, in the SAME format as every other SVG page
  (a 400×400 page whose colourable areas are <g class="region">), so the fill engine, audit,
  completion animation and workbench all treat them like any other page. Keys are permanent
  ('easy/…'); if a page is later replaced by illustrated art it gets a new key (see
  assets/easy/README.md).

  The Easy line-art rules these pages are built to (checked by js/audit.js at 'easy'):
    · bold 8-unit outlines, every outline closed
    · ≤ 24 colourable regions, none smaller than a fingertip (24pt of room on an iPad)
    · one clear main character filling roughly 50–70% of the page
    · background = a few large shapes, never texture

  The character is `EasyArt.cast`: the front-facing chibi axolotl of the illustrated library (big
  round head, feathery gills fanning from both sides, big glossy eyes, open smile, chubby body,
  little three-fingered paws), with pose / mouth / eye / hat variants so one construction serves
  every page. `simple: true` is for the smaller axolotls on a busy page (gills, tail, arms and body
  each colour as one piece, so nothing is too small to tap).
  Layer order in every page: background → props → character → front props. Each scene below is
  one function per page; assets/easy/svg/<id>.svg is exported from them with those layers named.
*/
(function () {
  'use strict';
  const { starPoints } = Art.kit;
  const { frond, frondLines } = LabArt;
  const { n, R, deco, bg, shine, bubbles } = LabArt.kit;
  const INK = Art.INK;
  const reg = Art.registerPage;
  const LW = 8;                       // Easy outline weight, page units
  const P = d => `<path d="${d}"/>`;
  const dot = (x, y, r) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${INK}" stroke="none"/>`;
  // A named layer, so the exported SVGs open in a vector editor with background / props / character grouped.
  const layer = (name, inner) => `<g class="layer" data-layer="${name}" id="${name}">${inner}</g>`;

  /* ═══════════════════════════ the shared axolotl ═══════════════════════════
     Local frame 400 × 400, facing the viewer. Region ids (prefix o.pre):
       tail, gills-l, gills-r, body, head, mouth, arm-l, arm-r  (+ party-hat)
     o: { x, y, s, pose, mouth, eyes, look, tail, flip, pre, hat, simple, mid } */
  const HEAD = 'M92 158 C86 96 138 56 200 56 C262 56 314 96 308 158 C304 212 258 240 200 240 C142 240 96 212 92 158 Z';
  const BODY = 'M142 226 C112 264 112 324 142 348 C172 368 228 368 258 348 C288 324 288 264 258 226 Z';
  const TAILS = {
    // curls out to the side and up — one big, fat, friendly shape (thick enough to tap even on a small axolotl)
    right: ['M246 320 C306 346 372 324 390 254 C396 226 374 220 362 242 C340 286 296 286 248 270 Z', 'M268 304 C312 308 348 292 368 262'],
    left: ['M154 320 C94 346 28 324 10 254 C4 226 26 220 38 242 C60 286 104 286 152 270 Z', 'M132 304 C88 308 52 292 32 262'],
    low: ['M246 340 C304 368 368 354 392 318 C402 302 386 284 372 292 C342 308 298 304 248 284 Z', 'M268 336 C308 346 344 340 368 320'],
  };
  // A paw: an arm hanging down from (0,0) ending in three round fingers. Rotate to aim it.
  function arm(len, w) {
    return `M${-w} 0 L${-w} ${len} C${-w - 9} ${len + 3} ${-w - 9} ${len + 19} ${-w + 3} ${len + 15} ` +
      `C${-w + 3} ${len + 26} -3 ${len + 27} 0 ${len + 17} C3 ${len + 27} ${w - 3} ${len + 26} ${w - 3} ${len + 15} ` +
      `C${w + 9} ${len + 19} ${w + 9} ${len + 3} ${w} ${len} L${w} 0 Z`;
  }
  const armAt = (x, y, deg) => `<path d="${arm(52, 17)}" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  // [left arm, right arm] in degrees from "hanging down": the left swings out with +, the right with −.
  const POSES = {
    rest: [24, -24],
    wave: [24, -128],            // right arm up, waving
    cheer: [128, -128],          // both arms up
    hold: [-22, 22],             // both paws reaching in to the middle (holding a prop in front)
    out: [70, -70],              // arms wide, "ta-da"
    point: [24, -80],
  };
  // The open mouths are colourable: `shape` becomes the region `mouth`, `lines` are drawn over it.
  const MOUTHS = {
    grin: { shape: P('M168 180 C172 232 228 232 232 180 Q200 192 168 180 Z'), lines: '<path d="M186 212 Q200 204 214 212" fill="none" stroke-width="5"/>' },
    smile: { lines: '<path d="M170 184 Q185 206 200 186 Q215 206 230 184" fill="none"/>' },
    wow: { shape: '<ellipse cx="200" cy="198" rx="14" ry="18"/>' },
    giggle: { shape: P('M172 180 C178 220 222 220 228 180 Z') },
  };
  function eyes(style, look) {
    const dx = look === 'left' ? -5 : look === 'right' ? 5 : 0, dy = look === 'up' ? -5 : look === 'down' ? 5 : 0;
    return [150, 250].map(cx => {
      const cy = 150;
      if (style === 'happy') {   // closed, laughing eyes
        return `<g class="eye"><path d="M${cx - 21} ${cy + 8} Q${cx} ${cy - 20} ${cx + 21} ${cy + 8}" fill="none" stroke-width="8"/></g>`;
      }
      return `<g class="eye"><circle cx="${cx}" cy="${cy}" r="27" fill="${INK}" stroke="none"/>` +
        `<circle cx="${cx - 8 + dx}" cy="${cy - 9 + dy}" r="9.5" fill="#fff" stroke="none"/><circle cx="${cx + 9 + dx}" cy="${cy + 10 + dy}" r="4.2" fill="#fff" stroke="none"/></g>`;
    }).join('');
  }

  // Returns the character in two parts so a prop held in front can sit BETWEEN them: `back`
  // is everything up to the face, `arms` the paws that go over the prop.
  function axoParts(f, o) {
    const pre = o.pre || '', simple = !!o.simple, mergeArms = simple || !!o.mergeArms;   // mergeArms: paws colour with the body (smaller axolotls)
    const pose = Array.isArray(o.pose) ? o.pose : (POSES[o.pose] || POSES.rest);
    const Rg = (id, shapes, extra) => R(f, pre + id, shapes, extra);
    const tail = TAILS[o.tail || 'right'];
    const feet = '<ellipse cx="164" cy="354" rx="36" ry="18"/><ellipse cx="236" cy="354" rx="36" ry="18"/>';
    const armShapes = armAt(142, 256, pose[0]) + armAt(258, 256, pose[1]);
    let back = '';
    // the tail is its own region on a big axolotl; on a small one it colours with the body
    if (!simple) back += Rg('tail', P(tail[0]), 'data-anim="tail" data-pivot="200 300"');
    back += deco(P(tail[1]), 4);
    // gills fan from both sides of the head, tucked behind it: three plump fronds a side.
    const L = [[112, 104, 218, 100], [102, 148, 186, 106], [112, 194, 152, 96]];
    const gl = (list, mirror) => list.map(([x, y, a, len], i) => mirror ? frond(400 - x, y, 180 - a, len, 46, -(i - 1) * 9, 5) : frond(x, y, a, len, 46, (i - 1) * 9, 5)).join('');
    const gline = (list, mirror) => list.map(([x, y, a, len], i) => mirror ? frondLines(400 - x, y, 180 - a, len, 46, -(i - 1) * 9, 4) : frondLines(x, y, a, len, 46, (i - 1) * 9, 4)).join('');
    if (simple) back += Rg('gills', gl(L, false) + gl(L, true), 'data-anim="gill" data-dir="-1" data-pivot="200 150"');
    else back += Rg('gills-l', gl(L, false), 'data-anim="gill" data-dir="-1" data-pivot="120 150"') +
      Rg('gills-r', gl(L, true), 'data-anim="gill" data-dir="1" data-pivot="280 150"');
    back += deco(gline(L, false) + gline(L, true), 3);
    // body (+ feet, + tail and arms when simple): one region
    back += Rg('body', P(BODY) + feet + (simple ? P(tail[0]) : '') + (mergeArms ? armShapes : ''));
    back += deco('<path d="M152 298 C172 326 228 326 248 298"/><path d="M164 360 l0 -9 M236 360 l0 -9 M146 362 l-3 -9 M182 362 l3 -9 M218 362 l-3 -9 M254 362 l3 -9"/>', 4);
    back += Rg('head', P(HEAD));
    const mouth = MOUTHS[o.mouth || 'grin'] || MOUTHS.grin;
    if (mouth.shape) back += Rg('mouth', mouth.shape);
    let face = eyes(o.eyes, o.look) + (mouth.lines || '');
    face += '<path d="M106 188 l-9 -10 M120 195 l-9 -10 M294 188 l9 -10 M280 195 l9 -10" stroke-width="4"/>'; // blush
    back += deco(face, 5, true);
    if (o.hat === 'party') {
      back += Rg('party-hat', P('M156 76 L202 -22 L248 70 C218 54 184 56 156 76 Z') + `<circle cx="202" cy="-26" r="17"/>`) +
        deco('<path d="M172 54 L224 30 M186 28 L212 14"/>', 5);
    }
    const arms = mergeArms ? '' : Rg('arm-l', armAt(142, 256, pose[0])) + Rg('arm-r', armAt(258, 256, pose[1]));
    return { back, arms };
  }

  /* Put an axolotl on the page: (x, y) is where its local origin lands, s = scale. Line weight
     stays LW page units at any scale. Wrapped in a .hop so it hops when the picture is finished.
     o.mid = page-space markup drawn between the character and its paws (a held prop). */
  function cast(f, o) {
    const s = o.s || 0.8, sx = o.flip ? -s : s, tx = o.flip ? o.x + 400 * s : o.x;
    const px = n(o.x + 200 * s), py = n(o.y + 356 * s);
    const tf = `transform="translate(${n(tx)} ${o.y}) scale(${sx} ${s})" stroke-width="${n(LW / s)}"`;
    const part = axoParts(f, o);
    return `<g class="hop" data-pivot="${px} ${py}"><g ${tf}>${part.back}</g>${o.mid || ''}${part.arms ? `<g ${tf}>${part.arms}</g>` : ''}</g>`;
  }
  // Any prop, placed with a transform but drawn at the page's own line weight.
  const prop = (x, y, s, inner, flip, rot) => `<g transform="translate(${x} ${y})${rot ? ` rotate(${rot})` : ''} scale(${flip ? -s : s} ${s})" stroke-width="${n(LW / s)}">${inner}</g>`;

  /* ═══════════════════════════ props ═══════════════════════════
     Each prop is drawn around (0,0) at a natural size and placed with prop(). */
  const eye2 = (x, y, r) => `<g class="eye"><circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/><circle cx="${n(x - r * .35)}" cy="${n(y - r * .4)}" r="${n(r * .38)}" fill="#fff" stroke="none"/></g>`;
  const cheeks = (x, y, w) => `<path d="M${x - w} ${y} l-6 -7 M${x - w + 12} ${y + 5} l-6 -7 M${x + w} ${y} l6 -7 M${x + w - 12} ${y + 5} l6 -7" stroke-width="4"/>`;

  const starfish = (f, id, r) => R(f, id, `<polygon points="${starPoints(0, 0, r, r * 0.56, 5)}"/>`) +
    deco(eye2(-r * .22, -r * .08, r * .08) + eye2(r * .22, -r * .08, r * .08) + `<path d="M${n(-r * .2)} ${n(r * .16)} Q0 ${n(r * .38)} ${n(r * .2)} ${n(r * .16)}"/>`, 4, true);
  const shell = (f, id, w) => R(f, id, `<path d="M${-w} 0 C${-w - 4} ${-w * 1.05} ${w + 4} ${-w * 1.05} ${w} 0 Q0 ${n(w * .3)} ${-w} 0 Z"/>`) +
    deco([-0.45, 0, 0.45].map(k => `<path d="M0 ${n(w * .06)} L${n(w * k * 1.5)} ${n(-w * .78)}"/>`).join(''), 4);
  // A kelp blade: base at (0,0), up to height h, leaning by `lean`.
  const kelp = (f, id, h, w, lean) => R(f, id, `<path d="M${-w / 2} 0 C${n(-w / 2 + lean * .1)} ${n(-h * .35)} ${n(lean * .9 - w * .55)} ${n(-h * .62)} ${lean} ${-h} C${n(lean * 1.1 + w * .7)} ${n(-h * .66)} ${n(w * .6 + lean * .1)} ${n(-h * .3)} ${w / 2} 0 Z"/>`) +
    deco(`<path d="M0 -6 C${n(lean * .1)} ${n(-h * .4)} ${n(lean * .5)} ${n(-h * .65)} ${n(lean * .9)} ${n(-h * .86)}"/>`, 4);
  const rock = (f, id, w, h) => R(f, id, `<path d="M${-w} 0 C${-w} ${-h * .55} ${-w * .45} ${-h} 0 ${-h} C${w * .5} ${-h} ${w} ${-h * .5} ${w} 0 Z"/>`) +
    deco(`<path d="M${n(-w * .45)} ${n(-h * .55)} q${n(w * .14)} ${n(-h * .18)} ${n(w * .3)} ${n(-h * .12)} M${n(w * .3)} ${n(-h * .42)} q${n(w * .12)} ${n(h * .12)} ${n(w * .26)} ${n(h * .06)}"/>`, 4);
  // A big friendly fish facing right: body, tail and a fin as three regions.
  const fish = (f, id) =>
    R(f, id + '-tail', P('M-56 0 C-92 -44 -140 -66 -148 -30 C-134 -10 -134 10 -148 30 C-140 66 -92 44 -56 0 Z')) +
    R(f, id + '-fin', P('M-24 -52 C-16 -112 44 -122 58 -68 C30 -68 2 -62 -24 -52 Z')) +
    R(f, id, P('M-76 0 C-76 -52 -8 -76 50 -36 C80 -16 80 16 50 36 C-8 76 -76 52 -76 0 Z')) +
    deco(eye2(34, -10, 11) + '<path d="M44 20 Q56 28 66 18" stroke-width="5"/><path d="M-14 -40 Q-2 0 -14 40 M-40 -30 Q-30 0 -40 30"/><path d="M12 6 Q6 24 -6 28" stroke-width="5"/>', 4, true);
  const jelly = (f, id) =>
    R(f, id + '-tentacles', [-58, -14, 30].map(x0 => P(`M${x0} 14 C${x0 - 16} 44 ${x0 + 18} 80 ${x0} 124 L${x0 + 28} 124 C${x0 + 46} 80 ${x0 + 12} 44 ${x0 + 28} 14 Z`)).join('')) +
    R(f, id, P('M-92 16 C-104 -98 104 -98 92 16 Q70 36 46 14 Q23 36 0 14 Q-23 36 -46 14 Q-70 36 -92 16 Z')) +
    deco(eye2(-30, -22, 12) + eye2(30, -22, 12) + '<path d="M-14 0 Q0 14 14 0" stroke-width="5"/>' + cheeks(0, -2, 60), 4, true) +
    deco('<path d="M-66 -34 C-60 -56 -42 -68 -22 -70"/>', 5);
  // A band that spirals inward (the seahorse's curled tail): centre (cx, cy), radius R0 → R1, width w0 → w1.
  function spiralBand(cx, cy, R0, R1, th0, turns, w0, w1, steps) {
    const out = [], back = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, th = th0 + turns * 2 * Math.PI * t, r = R0 + (R1 - R0) * t, w = (w0 + (w1 - w0) * t) / 2;
      const nx = Math.cos(th), ny = Math.sin(th);
      out.push([cx + (r + w) * nx, cy + (r + w) * ny]); back.push([cx + (r - w) * nx, cy + (r - w) * ny]);
    }
    return 'M' + out.concat(back.reverse()).map(p => n(p[0]) + ' ' + n(p[1])).join(' L') + ' Z';
  }
  // The seahorse faces left: head with a snout and crest, round tummy, a fin, a fat curled tail.
  const seahorse = (f, id) =>
    R(f, id + '-fin', P('M46 -44 C116 -64 140 34 68 52 C76 16 66 -14 46 -44 Z')) +
    R(f, id, P(spiralBand(34, 160, 70, 22, -2.1, 1.05, 38, 20, 40)) + P('M-34 -56 C-84 -14 -80 56 -40 92 C-12 116 44 106 54 66 C64 28 46 -22 30 -56 Z') +
      P('M-8 -138 C28 -138 54 -112 50 -78 C46 -50 16 -40 -8 -42 L-42 -56 L-98 -60 C-114 -62 -116 -92 -100 -96 L-46 -100 C-42 -124 -28 -138 -8 -138 Z')) +
    deco('<path d="M-2 -138 C-6 -156 8 -162 14 -150 M20 -134 C20 -152 36 -154 38 -140"/>' + eye2(-12, -88, 14) + '<path d="M-98 -80 Q-82 -72 -66 -80" stroke-width="5"/><path d="M-40 -10 C-20 0 -14 30 -22 60 M-30 30 C-12 40 -8 56 -16 76" stroke-width="4"/>', 4, true);
  // A sea fan: a friendly reef coral on a short stem.
  const fanCoral = (f, id) => R(f, id, P('M-16 0 L-12 -52 C-66 -62 -98 -112 -84 -152 Q-60 -182 -34 -166 Q-18 -194 10 -188 Q34 -188 44 -168 Q74 -180 88 -148 C102 -106 66 -60 14 -52 L18 0 Z')) +
    deco('<path d="M0 -58 L-62 -140 M0 -58 L-26 -150 M0 -58 L14 -156 M0 -58 L58 -146 M0 -58 L74 -118"/>', 5);
  // An open treasure chest, base on the line y = 74: lid standing behind, gems heaped over the rim, a lock.
  const gem = (f, id, x, y) => R(f, id, `<polygon points="${[[0, -30], [25, -13], [25, 14], [0, 32], [-25, 14], [-25, -13]].map(p => (p[0] + x) + ',' + (p[1] + y)).join(' ')}"/>`) +
    deco(`<path d="M${x - 25} ${y - 13} L${x} ${y + 2} L${x + 25} ${y - 13} M${x} ${y + 2} L${x} ${y + 32}"/>`, 4);
  const chest = f =>
    R(f, 'lid', P('M-78 -4 C-86 -82 -40 -108 0 -108 C40 -108 86 -82 78 -4 Z')) + deco('<path d="M-22 -104 L-22 -12 M22 -104 L22 -12"/>', 5) +
    gem(f, 'gem-1', -40, -22) + gem(f, 'gem-2', 6, -44) + gem(f, 'gem-3', 46, -20) +
    R(f, 'chest', P('M-82 -2 L-82 62 Q-82 74 -70 74 L70 74 Q82 74 82 62 L82 -2 Z')) + deco('<path d="M-46 -2 L-46 74 M46 -2 L46 74"/>', 5) +
    R(f, 'lock', '<rect x="-18" y="10" width="36" height="38" rx="9"/>') + deco('<circle cx="0" cy="26" r="5" fill="#2b2238"/><path d="M0 30 L0 40"/>', 4);
  const coins = (f, list) => R(f, 'coins', list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')) +
    deco(list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${n(r * .55)}"/>`).join(''), 4);
  // A sandcastle with a flag, bottom centre on (0, 0): wings, a taller keep, a door.
  const sandcastle = f =>
    R(f, 'castle', P('M-92 0 L-92 -98 L-70 -98 L-70 -82 L-50 -82 L-50 -98 L-28 -98 L-28 -170 L-10 -170 L-10 -154 L10 -154 L10 -170 L28 -170 L28 -98 L50 -98 L50 -82 L70 -82 L70 -98 L92 -98 L92 0 Z')) +
    deco('<path d="M-92 -50 L-28 -50 M28 -50 L92 -50 M-28 -120 L28 -120"/>', 4) +
    R(f, 'door', P('M-19 0 L-19 -38 A19 19 0 0 1 19 -38 L19 0 Z')) +
    deco('<path d="M0 -170 L0 -232"/>', 6) +
    R(f, 'flag', P('M2 -232 L58 -210 L2 -188 Z'));
  const bucket = f => R(f, 'bucket', P('M-36 0 L-46 -56 L46 -56 L36 0 Z')) + deco('<path d="M-46 -56 C-34 -100 34 -100 46 -56 M-40 -34 L40 -34"/>', 5);
  // A balloon with a little face (centre 0,0), a knot and a string end at (0, 120).
  const balloon = (f, id) => R(f, id, P('M0 -104 C54 -104 92 -62 90 -10 C88 44 44 92 8 102 L14 112 L-14 112 L-8 102 C-44 92 -88 44 -90 -10 C-92 -62 -54 -104 0 -104 Z')) +
    deco(eye2(-28, -14, 11) + eye2(28, -14, 11) + '<path d="M-18 14 Q0 34 18 14" stroke-width="5"/>' + cheeks(0, 8, 54), 4, true) +
    deco('<path d="M-62 -52 C-56 -72 -40 -84 -22 -88" stroke-width="7"/>', 7);
  const cake = f =>
    R(f, 'cake', '<rect x="-74" y="0" width="148" height="58" rx="14"/>') +
    R(f, 'cake-top', '<rect x="-48" y="-42" width="96" height="46" rx="12"/>') +
    deco('<path d="M-74 22 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0 q12 14 24 0" stroke-width="5"/><path d="M-48 -18 q12 12 24 0 q12 12 24 0 q12 12 24 0 q12 12 24 0" stroke-width="5"/>' +
      '<path d="M-22 -44 L-22 -62 M0 -44 L0 -64 M22 -44 L22 -62" stroke-width="8"/><path d="M-22 -66 C-33 -75 -22 -82 -22 -90 C-14 -81 -11 -73 -22 -66 Z M0 -68 C-11 -77 0 -84 0 -92 C8 -83 11 -75 0 -68 Z M22 -66 C11 -75 22 -82 22 -90 C30 -81 33 -73 22 -66 Z" stroke-width="4"/>', 5);
  const balloons = (f, id, list) => R(f, id, list.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${n(r * 1.14)}"/>`).join('')) +
    deco(list.map(([x, y, r]) => `<path d="M${x} ${n(y + r * 1.14)} q${x < 200 ? 10 : -10} 24 0 44 t0 40"/><path d="M${n(x - r * .55)} ${n(y - r * .35)} A${n(r * .6)} ${n(r * .6)} 0 0 1 ${n(x - r * .1)} ${n(y - r * .8)}" stroke-width="6"/>`).join(''), 4);
  const bubbleHi = (r, k) => `<path d="M${n(-r * .62)} ${n(-r * .1)} A${n(r * .66)} ${n(r * .66)} 0 0 1 ${n(-r * .1)} ${n(-r * .62)}" stroke-width="${k || 7}"/>`;

  // The floor: a soft rolling sand shape across the bottom.
  const sand = (f, y, id) => R(f, id || 'sand', P(`M-10 ${y + 16} C70 ${y - 12} 150 ${y + 18} 230 ${y + 2} C300 ${y - 10} 360 ${y - 6} 410 ${y + 8} L410 410 L-10 410 Z`));

  /* ═════════════ 1 · Happy Axolotl ═════════════
     One axolotl on a rock, waving. Big gills, three bubbles, two plants. */
  reg('easy/happy-axolotl', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 356)) +
    layer('props',
      bubbles(f, 'bubbles', [[44, 40, 17], [356, 44, 22], [322, 92, 12]], 5) +
      prop(34, 376, 1, kelp(f, 'kelp-l', 150, 52, 14)) +
      prop(370, 376, 1, kelp(f, 'kelp-r', 126, 50, -16)) +
      prop(200, 398, 1, rock(f, 'rock', 118, 82))) +
    layer('character', cast(f, { x: 46, y: 40, s: 0.77, pose: 'wave', mouth: 'grin' })) +
    '</g>');

  /* ═════════════ 2 · Axolotl & Starfish ═════════════
     Axolotl hugging a huge smiling starfish. Bubbles, shells, seaweed. */
  reg('easy/starfish', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 364)) +
    layer('props',
      bubbles(f, 'bubbles', [[352, 38, 22], [314, 80, 13]], 5) +
      prop(34, 376, 1, kelp(f, 'kelp-l', 130, 48, 16)) +
      prop(378, 376, 1, kelp(f, 'kelp-r', 118, 46, -14)) +
      prop(66, 394, 1.2, shell(f, 'shell-l', 28)) +
      prop(338, 396, 1.2, shell(f, 'shell-r', 26), true)) +
    layer('character', cast(f, { x: 62, y: 0, s: 0.69, pose: 'hold', tail: 'low', mouth: 'grin',
      mid: prop(200, 294, 1, starfish(f, 'starfish', 108), false, -8) })) +
    '</g>');

  /* ═════════════ 3 · Little Fish Friend ═════════════
     Axolotl swimming beside one big friendly fish; simple coral behind. */
  reg('easy/fish-friend', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 360)) +
    layer('props',
      prop(340, 388, 0.7, fanCoral(f, 'coral')) +
      bubbles(f, 'bubbles', [[44, 50, 20], [92, 26, 11], [354, 56, 15]], 5) +
      prop(40, 376, 1, kelp(f, 'kelp', 120, 46, 14)) +
      prop(324, 190, 0.7, fish(f, 'fish'))) +
    layer('character', cast(f, { x: -8, y: 90, s: 0.62, mergeArms: true, pose: 'out', mouth: 'grin', look: 'right' })) +
    '</g>');

  /* ═════════════ 4 · Big Bubble ═════════════
     Axolotl floating inside one enormous bubble. A few small bubbles around. */
  reg('easy/big-bubble', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f)) +
    layer('props',
      R(f, 'bubble', '<circle cx="200" cy="204" r="176"/>') +
      deco('<path d="M92 130 A126 126 0 0 1 168 58"/><path d="M304 322 A128 128 0 0 1 258 356"/>', 10) +
      bubbles(f, 'bubbles', [[44, 44, 24], [358, 52, 18], [40, 352, 20], [364, 350, 24]], 5)) +
    layer('character', cast(f, { x: 56, y: 56, s: 0.72, pose: 'cheer', mouth: 'grin', tail: 'right' })) +
    '</g>');

  /* ═════════════ 5 · Jellyfish Hello ═════════════
     Axolotl waving at one big friendly jellyfish. Four bubbles. */
  reg('easy/jellyfish', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 368)) +
    layer('props',
      bubbles(f, 'bubbles', [[44, 50, 22], [92, 100, 13], [366, 296, 18], [338, 350, 11]], 5) +
      prop(276, 88, 0.98, jelly(f, 'jelly'))) +
    layer('character', cast(f, { x: 8, y: 98, s: 0.7, pose: 'wave', mouth: 'grin', look: 'up', tail: 'left' })) +
    '</g>');

  /* ═════════════ 6 · Seahorse Friend ═════════════
     Axolotl meeting one large cute seahorse; very simple reef floor. */
  reg('easy/seahorse', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 362)) +
    layer('props',
      bubbles(f, 'bubbles', [[44, 40, 20], [92, 78, 12], [364, 44, 14]], 5) +
      prop(52, 398, 1, rock(f, 'rock', 56, 40)) +
      prop(314, 182, 0.72, seahorse(f, 'seahorse'))) +
    layer('character', cast(f, { x: -14, y: 84, s: 0.58, pose: 'point', mergeArms: true, mouth: 'grin', look: 'right', tail: 'left' })) +
    '</g>');

  /* ═════════════ 7 · Tiny Treasure ═════════════
     Axolotl at an open chest with a few big gems; shells and coins. */
  reg('easy/treasure', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 352)) +
    layer('props',
      bubbles(f, 'bubbles', [[40, 46, 18], [356, 40, 14]], 5) +
      coins(f, [[170, 374, 17], [206, 380, 15], [132, 380, 14]]) +
      prop(56, 384, 1.1, shell(f, 'shell', 28)) +
      prop(302, 268, 0.9, chest(f))) +
    layer('character', cast(f, { x: -2, y: 74, s: 0.66, pose: 'point', mouth: 'wow', look: 'right', tail: 'left' })) +
    '</g>');

  /* ═════════════ 8 · Sandcastle ═════════════
     Axolotl beside a sandcastle with a flag; bucket, shell and starfish on the sand. */
  reg('easy/sandcastle', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f, 'sky') + R(f, 'sea', P('M-10 150 C60 134 130 166 200 150 C270 134 340 164 410 148 L410 410 L-10 410 Z')) + sand(f, 280)) +
    layer('props',
      bubbles(f, 'clouds', [[322, 56, 28], [366, 88, 16]], 5) +
      prop(318, 352, 0.82, sandcastle(f)) +
      prop(346, 388, 0.62, bucket(f)) +
      prop(172, 380, 1, starfish(f, 'starfish', 36), false, 12) +
      prop(244, 392, 1, shell(f, 'shell', 34))) +
    layer('character', cast(f, { x: -8, y: 96, s: 0.68, pose: 'out', mouth: 'grin', look: 'right' })) +
    '</g>');

  /* ═════════════ 9 · Axolotl Balloon ═════════════
     Axolotl holding a giant bubble-balloon with a little face. */
  reg('easy/balloon', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f) + sand(f, 366)) +
    layer('props',
      bubbles(f, 'bubbles', [[44, 56, 17], [78, 104, 10], [360, 340, 16]], 5) +
      prop(278, 116, 1, balloon(f, 'balloon'))) +
    layer('character', cast(f, { x: 0, y: 114, s: 0.7, pose: 'wave', mouth: 'grin', look: 'up', tail: 'left' })) +
    layer('front', deco('<path d="M278 230 C268 244 248 244 234 258"/>', 6)) +
    '</g>');

  /* ═════════════ 10 · Axolotl Party ═════════════
     Two axolotls in party hats either side of a cake, with balloons. (A third axolotl was tried and
     dropped: at that size its gills and hat were smaller than a fingertip — the Easy rule wins.) */
  reg('easy/party', f =>
    `<g stroke-width="${LW}">` +
    layer('background', bg(f)) +
    layer('props', balloons(f, 'balloons', [[48, 54, 27], [96, 34, 22], [352, 54, 27]])) +
    layer('character',
      cast(f, { pre: 'l-', x: 6, y: 112, s: 0.46, pose: 'cheer', mouth: 'grin', hat: 'party', tail: 'left', look: 'right', mergeArms: true }) +
      cast(f, { pre: 'r-', x: 214, y: 112, s: 0.46, pose: 'cheer', mouth: 'grin', hat: 'party', tail: 'left', flip: true, eyes: 'happy', mergeArms: true })) +
    layer('front', prop(200, 348, 0.86, cake(f))) +
    '</g>');

  /* ── finished reference colourings (the contact sheet and the workbench; { regionId: colour }) ── */
  const axoRef = (pre, body, gills) => {
    const o = {}, b = body || '#ffb3d1', g = gills || '#ff6fa8';
    ['body', 'head', 'tail', 'arm-l', 'arm-r'].forEach(k => { o[(pre || '') + k] = b; });
    ['gills-l', 'gills-r', 'gills'].forEach(k => { o[(pre || '') + k] = g; });
    o[(pre || '') + 'mouth'] = '#ff5a5a';
    return o;
  };
  const WATER = '#7fd3ff', SAND = '#ffe27a';
  const REFS = {
    'easy-happy-axolotl': Object.assign(axoRef(''), { water: WATER, sand: SAND, bubbles: '#ffffff', 'kelp-l': '#2fbf71', 'kelp-r': '#8fe07a', rock: '#9aa3ad' }),
    'easy-starfish': Object.assign(axoRef(''), { water: WATER, sand: SAND, bubbles: '#ffffff', 'kelp-l': '#2fbf71', 'kelp-r': '#8fe07a', 'shell-l': '#ffb3d1', 'shell-r': '#c9a7ff', starfish: '#ff9f45' }),
    'easy-fish-friend': Object.assign(axoRef(''), { water: WATER, sand: SAND, bubbles: '#ffffff', kelp: '#2fbf71', coral: '#ff7a7a', fish: '#ff9f45', 'fish-tail': '#ffd84a', 'fish-fin': '#ffd84a' }),
    'easy-big-bubble': Object.assign(axoRef('', '#ffe27a', '#ff9f45'), { water: '#3d8bff', bubble: '#d9f1ff', bubbles: '#ffffff' }),
    'easy-jellyfish': Object.assign(axoRef(''), { water: '#3d8bff', sand: SAND, bubbles: '#ffffff', jelly: '#c9a7ff', 'jelly-tentacles': '#8b5cf6' }),
    'easy-seahorse': Object.assign(axoRef(''), { water: WATER, sand: SAND, bubbles: '#ffffff', kelp: '#2fbf71', rock: '#9aa3ad', seahorse: '#ffd84a', 'seahorse-fin': '#ff9f45' }),
    'easy-treasure': Object.assign(axoRef('', '#c9a7ff', '#8b5cf6'), { water: WATER, sand: SAND, bubbles: '#ffffff', coins: '#ffd84a', shell: '#ffb3d1', lid: '#c8a26b', chest: '#8a6a52', lock: '#ffd84a',
      'gem-1': '#ff6fa8', 'gem-2': '#7fd3ff', 'gem-3': '#8fe07a' }),
    'easy-sandcastle': Object.assign(axoRef('', '#7fd3ff', '#3d8bff'), { sky: '#d9f1ff', sea: '#3d8bff', sand: SAND, clouds: '#ffffff', castle: '#f0d28c', door: '#8a6a52', flag: '#ff5a5a', bucket: '#ff9f45', starfish: '#ff6fa8', shell: '#ffb3d1' }),
    'easy-balloon': Object.assign(axoRef(''), { water: WATER, sand: SAND, bubbles: '#ffffff', balloon: '#ff9fc8' }),
    'easy-party': Object.assign(axoRef('l-', '#ffe27a', '#ff9f45'), axoRef('r-', '#b6ec9f', '#2fbf71'), { water: '#3d8bff', balloons: '#ff6fa8', cake: '#ffd1e8', 'cake-top': '#fff3b0',
      'l-party-hat': '#8b5cf6', 'r-party-hat': '#ff5a5a' }),
  };
  window.EasyArt = { cast, prop, REFS, LW, POSES };
})();
