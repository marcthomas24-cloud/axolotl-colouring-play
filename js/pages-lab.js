/*
  Stage 2 style experiments — five visual directions for ONE brief:
    "Axolotl Explorer discovers a mysterious underwater cave."
  They are registered under permanent keys lab/a-… to lab/e-… and listed in
  Content.LAB_PAGES (shown in the grown-ups' Style Lab, not in the children's gallery).

  Also here: the "lab rig", a new poseable axolotl drawn side-on / three-quarter so a
  character can swim, reach, peek and react instead of standing front-on. It draws the
  recurring cast (js/characters.js) and is the candidate rig for Stage 3 content.

  Region-id conventions (the colouring engine and alive.js read these):
    <g class="region" data-region="id">   one colourable area (one tap fills all its shapes)
    <g class="deco">                       line work that never takes paint (texture, filaments)
    <g class="deco top">                   redrawn above the paint (eye sparkles stay white)
    data-anim / data-pivot / .eye / .hop   completion-animation hooks (see art.js)
*/
(function () {
  'use strict';
  const { region, starPoints, heartPath } = Art.kit;
  const INK = Art.INK;
  const reg = Art.registerPage;

  /* ── kit ── */
  const n = v => +v.toFixed(1);
  const R = (f, id, shapes, extra) => region(id, f, Array.isArray(shapes) ? shapes.join('') : shapes, extra);
  const deco = (inner, w, top) => `<g class="deco${top ? ' top' : ''}" fill="none" stroke-width="${w || 3}">${inner}</g>`;
  const bg = (f, id) => R(f, id || 'water', '<rect x="-10" y="-10" width="420" height="420"/>', 'stroke="none"');
  const shine = (x, y, r) => `<path d="M${n(x - r * .55)} ${n(y + r * .05)} A${n(r * .6)} ${n(r * .6)} 0 0 1 ${n(x - r * .05)} ${n(y - r * .55)}"/>`;
  const bubbles = (f, id, list, w) => R(f, id, list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)) +
    deco(list.map(([x, y, r]) => shine(x, y, r)).join(''), w || 3.5);
  const rad = d => d * Math.PI / 180;

  /* ── gill fronds ──
     A frond is a tapered feather from a base (tucked under the head) along `deg`, curling by
     `bend`. Outline: a soft scalloped edge (one closed shape). Filaments: a midrib with
     comb ticks, drawn as deco — the Odyssey "pectinate gill" look without tiny regions. */
  function frondGeo(bx, by, deg, len, wid, bend) {
    const a = rad(deg), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    const c = t => [bx + dx * len * t + nx * bend * Math.sin(Math.PI * t), by + dy * len * t + ny * bend * Math.sin(Math.PI * t)];
    // Widest just past the middle; the tip stays rounded (never a spike).
    const w = t => wid * (0.32 + 0.68 * Math.pow(Math.sin(Math.PI * (0.2 + 0.68 * t)), 0.8)) / 2;
    return { c, w, nx, ny, dx, dy };
  }
  function frond(bx, by, deg, len, wid, bend, bumps) {
    const { c, w, nx, ny } = frondGeo(bx, by, deg, len, wid, bend);
    const [ex, ey] = c(1), [px, py] = c(0.97), tx = ex - px, ty = ey - py, tl = Math.hypot(tx, ty) || 1;
    let d = '';
    [1, -1].forEach(side => {
      const ts = Array.from({ length: bumps + 1 }, (_, i) => side === 1 ? i / bumps : 1 - i / bumps);
      ts.forEach((t, i) => {
        const [x, y] = c(t), wx = x + nx * w(t) * side, wy = y + ny * w(t) * side;
        if (i === 0) {
          if (side === 1) d += 'M' + n(wx) + ' ' + n(wy);
          else { const r = w(1) * 1.9; d += ` Q${n(ex + tx / tl * r)} ${n(ey + ty / tl * r)} ${n(wx)} ${n(wy)}`; } // round tip
          return;
        }
        const tm = (t + ts[i - 1]) / 2, [mx, my] = c(tm), push = w(tm) * 1.2;
        d += ` Q${n(mx + nx * push * side)} ${n(my + ny * push * side)} ${n(wx)} ${n(wy)}`;
      });
    });
    return `<path d="${d} Z"/>`;
  }
  // A fluffy round puff (Sunny's gill tufts): an oval with a cloud-scalloped edge.
  function puff(bx, by, deg, len, wid) {
    const a = rad(deg), cx = bx + Math.cos(a) * len * 0.5, cy = by + Math.sin(a) * len * 0.5;
    const rx = len * 0.55, ry = wid * 0.5, k = 9;
    const pt = (i, r) => { const t = i / k * Math.PI * 2; const x = Math.cos(t) * rx * r, y = Math.sin(t) * ry * r;
      return [n(cx + x * Math.cos(a) - y * Math.sin(a)), n(cy + x * Math.sin(a) + y * Math.cos(a))]; };
    let d = 'M' + pt(0, 1).join(' ');
    for (let i = 1; i <= k; i++) { const c = pt(i - 0.5, 1.28), p = pt(i, 1); d += ` Q${c[0]} ${c[1]} ${p[0]} ${p[1]}`; }
    return `<path d="${d} Z"/>`;
  }

  function frondLines(bx, by, deg, len, wid, bend, ticks) {
    const { c, w, nx, ny } = frondGeo(bx, by, deg, len, wid, bend);
    let d = '';
    for (let i = 1; i <= ticks; i++) {
      const t = 0.2 + 0.7 * i / (ticks + 1), [x, y] = c(t), [fx, fy] = c(t + 0.05), k = w(t);
      [1, -1].forEach(s => { d += ` M${n(x + nx * k * 0.15 * s)} ${n(y + ny * k * 0.15 * s)} L${n(fx + nx * k * 0.62 * s)} ${n(fy + ny * k * 0.62 * s)}`; });
    }
    return d ? `<path d="${d.trim()}"/>` : '';
  }

  /* ── the lab rig ──
     Local frame: 400 × 260, facing RIGHT. Head front-right, body and tail trailing left.
     Draw order (back → front): tail, far legs, body, hind leg, far gills, near gills,
     front leg, head, face, accessories. Region ids are prefixed (o.pre) so a page can
     hold several characters. */
  const HEAD = 'M214 84 C232 52 318 44 356 70 C386 92 390 150 366 176 C342 200 262 204 228 186 C198 170 196 112 214 84 Z';
  const BODIES = {
    classic: 'M252 118 C214 104 156 108 116 124 C84 138 76 176 102 192 C136 212 214 206 256 186 Z',
    round: 'M252 120 C222 106 182 110 152 124 C120 140 114 180 140 196 C170 212 222 204 256 186 Z',
  };
  const TAILS = {
    swish: ['M140 124 C104 116 66 100 30 76 C12 64 0 76 8 92 C30 128 70 162 118 186 Z', 'M124 146 C92 130 58 110 22 84'],
    wave: ['M140 126 C102 126 66 130 28 114 C10 106 0 120 8 132 C30 160 72 180 118 188 Z', 'M124 152 C92 150 58 144 18 124'],
    curl: ['M136 132 C100 146 66 168 46 200 C38 214 50 224 62 216 C82 200 102 192 122 190 Z', 'M124 160 C96 172 72 188 54 208'],
  };
  // A leg pointing "down" (rotate to aim it) with a three-toed hand at the end.
  function legPath(len, w) {
    return `M${-w} 0 L${-w} ${len} C${-w - 7} ${len + 3} ${-w - 7} ${len + 15} ${-w + 2} ${len + 13} ` +
      `C${-w + 2} ${len + 21} -2 ${len + 22} 0 ${len + 14} C2 ${len + 22} ${w - 2} ${len + 21} ${w - 2} ${len + 13} ` +
      `C${w + 7} ${len + 15} ${w + 7} ${len + 3} ${w} ${len} L${w} 0 Z`;
  }
  const leg = (x, y, deg, len, w) => `<path d="${legPath(len, w || 12)}" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  // An arm pointing "down" (rotate to aim it) ending in an open hand of round fingers,
  // fanned across ±spread degrees. Fingers are traced from the −x side to the +x side.
  function openHand(len, w, fingers, spread, fl) {
    const P = (a, r) => n(Math.sin(a) * r) + ' ' + n(len + Math.cos(a) * r);
    const step = 2 * spread / (fingers - 1), half = rad(step) * 0.42;
    let d = `M${-w} 0 L${-w} ${len}`;
    for (let i = 0; i < fingers; i++) {
      const a = rad(-spread + step * i);
      const next = i < fingers - 1 ? P(a + rad(step / 2), fl * 0.55) : `${w} ${len}`;
      d += ` Q${P(a - half * 1.2, fl * 0.8)} ${P(a - half, fl)} Q${P(a, fl * 1.25)} ${P(a + half, fl)} Q${P(a + half * 1.2, fl * 0.8)} ${next}`;
    }
    return d + ` L${w} 0 Z`;
  }
  const handAt = (x, y, deg, len) => [n(x - Math.sin(rad(deg)) * len), n(y + Math.cos(rad(deg)) * len)];

  const POSES = {
    // [front-near, front-far, hind-near, hind-far] angles; 0 = straight down, − = forward
    stand: [-24, -48, 30, 54],
    swim: [64, 52, 78, 86],          // legs tucked back along the body, streamlined
    reach: [-92, -60, 40, 62],       // front hand stretched forward under the chin (carrying / pointing)
  };
  const GILLS = {
    // near-side fronds [baseX, baseY, angle, length] and far-side fronds (peeking above)
    long: { near: [[230, 88, 236, 96], [218, 116, 208, 104], [216, 148, 182, 96]], far: [[268, 66, 262, 70], [248, 72, 246, 76]], wid: 28, ticks: 6 },
    fronds: { near: [[230, 90, 236, 82], [218, 118, 210, 88], [216, 148, 184, 82]], far: [[268, 66, 262, 60], [248, 72, 246, 64]], wid: 28, ticks: 5 },
    tufts: { near: [[228, 92, 236, 62], [218, 122, 208, 64], [218, 152, 182, 58]], far: [[266, 70, 262, 50], [248, 76, 246, 54]], wid: 46, ticks: 0, puff: true },
    short: { near: [[230, 92, 236, 60], [220, 120, 210, 64], [218, 148, 186, 60]], far: [[266, 68, 262, 46], [248, 74, 246, 50]], wid: 26, ticks: 3 },
  };

  function eyes(style, look) {
    const lx = look === 'up' || look === 'down' ? 0 : 3, ly = look === 'up' ? -5 : look === 'down' ? 5 : 0;
    return [[296, 122, 1], [352, 116, 0.86]].map(([x, y, k]) => {
      let e;
      switch (style) {
        case 'albino': // pale iris, pink pupil (real albino eyes) — drawn as rings in line art
          e = `<circle cx="${x}" cy="${y}" r="${n(16 * k)}" fill="#fff"/><circle cx="${x + lx}" cy="${y + ly}" r="${n(8 * k)}" fill="${INK}" stroke="none"/><circle cx="${x + lx - 3}" cy="${y + ly - 3}" r="${n(3 * k)}" fill="#fff" stroke="none"/>`;
          break;
        case 'pale': // Inky: huge pale-ringed eyes that read even from the dark
          e = `<circle cx="${x}" cy="${y}" r="${n(19 * k)}" fill="#fff"/><circle cx="${x + lx + 4}" cy="${y + ly}" r="${n(10 * k)}" fill="${INK}" stroke="none"/><circle cx="${x + lx + 1}" cy="${y + ly - 4}" r="${n(3.5 * k)}" fill="#fff" stroke="none"/>`;
          break;
        case 'closed': // eyes shut tight and happy (counting, sleeping, giggling)
          e = `<path d="M${n(x - 14 * k)} ${y} Q${x} ${n(y + 12 * k)} ${n(x + 14 * k)} ${y}" fill="none" stroke-width="5"/>`;
          break;
        default: // sparkle
          e = `<circle cx="${x}" cy="${y}" r="${n(17 * k)}" fill="${INK}" stroke="none"/><circle cx="${n(x - 5 * k + lx)}" cy="${n(y - 6 * k + ly)}" r="${n(6.5 * k)}" fill="#fff" stroke="none"/><circle cx="${n(x + 6 * k)}" cy="${n(y + 6 * k)}" r="${n(2.8 * k)}" fill="#fff" stroke="none"/>`;
      }
      return `<g class="eye">${e}</g>`;
    }).join('');
  }
  const MOUTHS = {
    smile: 'M312 152 Q322 162 330 154 Q338 162 348 152',
    grin: '<path d="M306 148 Q328 182 354 146 Z" fill="#fff"/>',
    wow: `<ellipse cx="330" cy="160" rx="8" ry="10" fill="${INK}" stroke="none"/>`,
    gasp: '<ellipse cx="330" cy="158" rx="6" ry="7" fill="#fff"/>',
  };
  const mouth = m => { const v = MOUTHS[m] || MOUTHS.smile; return v.startsWith('<') ? v : `<path d="${v}"/>`; };

  function axo(f, o) {
    const cast = (window.Characters && Characters.CAST[o.who]) || { rig: {} };
    const rig = Object.assign({}, cast.rig, o.rig || {});
    const pre = o.pre || '';
    // o.omit: region ids not to draw at all (parts fully hidden behind scenery — an
    // invisible region would only fail the audit and catch stray taps).
    const Rg = (id, shapes, extra) => (o.omit && o.omit.includes(id) ? '' : R(f, pre + id, shapes, extra));
    // Detail level. 'full': every part its own region (big characters).
    // 'mid': legs colour with the body and both gill sides together — for characters
    //        under ~0.6 scale, where separate legs would be too thin to tap.
    // 'simple': as mid, plus no filament lines, a drawn hat band and no satchel (Easy pages).
    const simple = !!o.simple || o.detail === 'simple';
    const merge = simple || o.detail === 'mid';
    const build = rig.build || 'classic';
    const dx = build === 'round' ? 34 : 0;             // round build: shorter body
    const pose = Array.isArray(o.pose) ? o.pose : (POSES[o.pose] || POSES.stand);
    const g = GILLS[rig.gills] || GILLS.fronds;
    const [lf, lff, lh, lhf] = pose;
    const tail = TAILS[o.tail || 'swish'];
    let s = '';

    // tail + far legs
    s += Rg('tail', `<path d="${tail[0]}" transform="translate(${dx} 0)"/>`, `data-anim="tail" data-pivot="${130 + dx} 160"`);
    const farLegs = leg(286, 182, lff, 34, 11) + leg(108 + dx, 180, lhf, 30, 11);
    if (!merge) s += Rg('leg-far', farLegs);
    s += deco(`<path d="${tail[1]}" transform="translate(${dx} 0)"/>`, 3);
    // body (+ legs when simple)
    // Reaching: a proper arm from under the chin, angled forward and a little down, ending
    // in an open four-fingered hand (the same splayed fan as the Odyssey rig's toes).
    const reaching = lf < -80;
    const fx = reaching ? 254 : 262, fy = reaching ? 196 : 192, ra = -74, rlen = 86;
    const rw = simple ? 17 : merge ? 15 : 13;
    const hind = leg(128 + dx, 190, lh, 36);
    const front = reaching ? `<path d="${openHand(rlen, rw, 4, 62, 24)}" transform="translate(${fx} ${fy}) rotate(${ra})"/>` : leg(fx, fy, lf, 40, 12);
    // Simple (Easy pages): every leg colours with the body — nothing too small to tap.
    s += Rg('body', `<path d="${BODIES[build]}"/>` + (merge ? farLegs + hind + (reaching ? '' : front) : ''));
    if (rig.bag && !simple) {
      s += deco('<path d="M150 124 C164 150 176 170 182 184"/>', 6);
      s += Rg('bag', '<path d="M156 168 L210 164 C216 182 214 198 206 206 L166 208 C156 198 152 184 156 168 Z"/>') +
        deco('<path d="M157 180 C176 184 196 182 212 176 M184 184 L184 192"/>', 3);
    }
    if (rig.belt && !merge) s += Rg('belt', '<path d="M124 150 C150 140 188 138 214 142 L218 160 C190 156 152 158 128 168 Z"/>') + deco('<rect x="160" y="146" width="16" height="14" rx="3"/>', 3);
    if (!merge) s += Rg('leg-hind', hind);
    // gills — far side peeking over the head, then the near side
    const gw = g.wid * (simple ? 1.45 : 1);   // Easy pages: fatter fronds, more room to tap
    const gl = (list, k) => list.map(([x, y, a, len], i) => g.puff ? puff(x, y, a, len * k, gw * k)
      : frond(x, y, a, len * k, gw * k, (i - 1) * 8, simple ? 4 : 6)).join('');
    const glLines = (list, k) => g.puff ? '' : list.map(([x, y, a, len], i) => frondLines(x, y, a, len * k, g.wid * k, (i - 1) * 8, simple ? 0 : g.ticks)).join('');
    const pivot = 'data-pivot="236 128"';
    if (merge) {
      s += Rg('gills', gl(g.far, 0.9) + gl(g.near, 1), `data-anim="gill" data-dir="-1" ${pivot}`);
      if (!simple) s += deco(glLines(g.far, 0.9), 2.5);
    } else {
      s += Rg('gills-far', gl(g.far, 0.9), `data-anim="gill" data-dir="1" ${pivot}`) + deco(glLines(g.far, 0.9), 2.5);
      s += Rg('gills-near', gl(g.near, 1), `data-anim="gill" data-dir="-1" ${pivot}`);
    }
    if (!simple) s += deco(glLines(g.near, 1), 2.5);
    // front leg / reaching arm: both tuck under the head (the head is drawn after them)
    if (!merge) s += Rg('leg-front', front);
    else if (reaching) s += Rg('arm', front);
    let arm = '';
    if (rig.held === 'pearl' && reaching) {   // held in the open hand, in front of everything
      const [hx, hy] = handAt(fx, fy, ra, rlen + 34);
      arm += Rg('pearl', `<circle cx="${hx}" cy="${hy}" r="22"/>`) +
        deco(`${shine(hx, hy, 22)}<path d="M${hx} ${n(hy - 34)} l0 -10 M${n(hx + 26)} ${n(hy - 24)} l8 -8 M${n(hx + 34)} ${hy} l10 0 M${n(hx + 26)} ${n(hy + 26)} l8 8"/>`, 3);
    }
    s += Rg('head', `<path d="${HEAD}"/>`);
    let face = eyes(o.eyes || rig.eyes, o.look) + mouth(o.mouth);
    face += `<path d="M262 150 l6 -7 M272 153 l6 -7 M282 155 l6 -7" stroke-width="2.5"/>`;            // blush
    if (rig.freckles) face += `<g fill="${INK}" stroke="none"><circle cx="318" cy="140" r="2"/><circle cx="326" cy="146" r="2"/><circle cx="312" cy="147" r="2"/><circle cx="364" cy="136" r="2"/><circle cx="370" cy="142" r="2"/></g>`;
    if (o.nostrils) face += `<g fill="${INK}" stroke="none"><circle cx="366" cy="134" r="2.4"/><circle cx="378" cy="130" r="2.2"/></g>`;
    s += deco(face, 3.5, true);
    if (reaching) s += arm;
    // headwear
    if (rig.hat === 'explorer') {
      s += Rg('hat', simple ? '<path d="M240 72 C226 -14 340 -26 346 58 Z"/>' : '<path d="M240 72 C230 6 336 -8 346 58 Z"/>');
      s += merge ? deco('<path d="M240 64 C268 50 318 44 344 52"/>', 3.5)
        : Rg('band', '<path d="M238 60 C266 46 318 40 345 47 L346 58 C318 51 266 58 240 72 Z"/>', 'stroke-width="4"');
      s += Rg('brim', `<ellipse cx="292" cy="66" rx="86" ry="${simple ? 19 : 14}" transform="rotate(-9 292 66)"/>`);
    } else if (rig.hat === 'party') {   // a cone party hat, tipped back on the crown
      s += Rg('party-hat', '<path d="M252 70 L292 -18 L340 60 C312 48 280 54 252 70 Z"/>') +
        deco('<path d="M262 50 L312 30 M274 26 L304 14"/><circle cx="292" cy="-22" r="9"/>', 3.5);
    } else if (rig.hat === 'goggles') {
      s += deco('<path d="M222 96 C240 70 330 52 372 80"/>', 6);
      s += Rg('goggles', '<circle cx="290" cy="68" r="19"/><circle cx="336" cy="64" r="17"/>') +
        deco(`${shine(290, 68, 19)}${shine(336, 64, 17)}<path d="M309 66 L319 65"/>`, 3);
    }
    return s;
  }

  /* Put a rig character on the page. o: { who, x, y, s, flip, rot, lw, ... rig options }.
     Line weight stays `lw` page units whatever the scale. */
  function cast(f, o) {
    const s = o.s || 0.5, lw = o.lw || 6;
    const sx = o.flip ? -s : s, tx = o.flip ? o.x + 400 * s : o.x;
    const rot = o.rot ? ` rotate(${o.rot} 200 140)` : '';
    const px = n(o.x + 200 * s), py = n(o.y + 210 * s);
    return `<g class="hop" data-pivot="${px} ${py}"><g transform="translate(${n(tx)} ${o.y}) scale(${sx} ${s})${rot}" stroke-width="${n(lw / s)}">${axo(f, o)}</g></g>`;
  }


  /* ── supporting cast & props (each takes an id prefix so a page can repeat them) ── */
  const T = (x, y, s, flip, rot) => `translate(${x} ${y}) scale(${flip ? -s : s} ${s})${rot ? ` rotate(${rot})` : ''}`;
  const grp = (x, y, s, flip, lw, inner, rot) => `<g transform="${T(x, y, s, flip, rot)}" stroke-width="${n((lw || 6) / s)}">${inner}</g>`;
  const eyeDot = (x, y, r) => `<g class="eye"><circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/><circle cx="${n(x - r * .35)}" cy="${n(y - r * .4)}" r="${n(r * .38)}" fill="#fff" stroke="none"/></g>`;
  const paleEye = (x, y, r, dx) => `<g class="eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${n(x + (dx || 0))}" cy="${n(y + r * .1)}" r="${n(r * .52)}" fill="${INK}" stroke="none"/><circle cx="${n(x + (dx || 0) - r * .2)}" cy="${n(y - r * .2)}" r="${n(r * .18)}" fill="#fff" stroke="none"/></g>`;

  // Inky peeking over an edge: head top, three gill tips, big pale eyes. Draw it BEFORE the
  // thing it hides behind. (x, y) = centre of the head's top edge.
  function peek(f, x, y, s, lw, look, gillWidth) {
    const gills = [[-36, 26, 236, 44], [0, 8, 270, 44], [36, 26, 304, 44]].map(([gx, gy, a, len]) => frond(gx, gy, a, len, gillWidth || 34, 0, 5)).join('');
    return grp(x, y, s, false, lw,
      R(f, 'inky-peek-gills', gills) +
      R(f, 'inky-peek', '<path d="M-62 90 C-64 30 -30 10 0 10 C30 10 64 30 62 90 Z"/>') +
      deco(paleEye(-22, 46, 15, look || 4) + paleEye(24, 46, 15, look || 4), 4, true));
  }
  // A round little fish facing right.
  function fish(f, id, x, y, s, flip, lw) {
    return grp(x, y, s, flip, lw,
      R(f, id + '-tail', '<path d="M-30 0 C-52 -26 -70 -24 -66 -10 C-62 0 -62 0 -66 10 C-70 24 -52 26 -30 0 Z"/>') +
      R(f, id, '<path d="M-38 0 C-38 -30 4 -40 30 -16 C40 -8 40 8 30 16 C4 40 -38 30 -38 0 Z"/>') +
      deco(eyeDot(14, -6, 6) + '<path d="M-8 -22 Q2 0 -8 22"/><path d="M24 10 Q30 12 33 8"/>', 3.5, true));
  }
  // The lantern fish: a round deep-sea friend whose glowing lure lights the way.
  function lanternFish(f, x, y, s, flip, lw) {
    return grp(x, y, s, flip, lw,
      R(f, 'angler-tail', '<path d="M-44 -2 C-70 -34 -92 -26 -88 -12 C-84 0 -84 4 -88 16 C-90 32 -70 34 -44 8 Z"/>') +
      R(f, 'angler', '<path d="M-50 2 C-52 -40 0 -54 34 -30 C54 -16 58 14 44 30 C24 52 -46 50 -50 2 Z"/>') +
      deco(`<path d="M-14 8 C-4 30 18 32 22 18"/><path d="M6 -44 C12 -78 50 -86 62 -70"/>` + eyeDot(22, -14, 9) +
        `<path d="M24 22 Q40 30 52 12"/><path d="M30 22 l2 6 M38 23 l2 6 M46 19 l1 6"/>`, 4, true) +
      R(f, 'lure', '<circle cx="68" cy="-62" r="19"/>') +
      deco('<path d="M68 -90 l0 -10 M96 -62 l10 0 M88 -82 l7 -7 M88 -42 l7 7"/>', 3.5));
  }
  // A crab with claws up — excited.
  function crab(f, x, y, s, lw) {
    return grp(x, y, s, false, lw,
      deco('<path d="M-36 4 l-26 10 l-6 16 M-30 12 l-20 16 l-2 14 M36 4 l26 10 l6 16 M30 12 l20 16 l2 14"/><path d="M-36 -10 C-56 -24 -60 -44 -58 -58 M36 -10 C56 -24 60 -44 58 -58"/>', 7) +
      R(f, 'crab-claws', '<path d="M-58 -46 C-96 -52 -100 -100 -66 -108 L-60 -84 L-40 -96 C-28 -70 -36 -48 -58 -46 Z"/><path d="M58 -46 C96 -52 100 -100 66 -108 L60 -84 L40 -96 C28 -70 36 -48 58 -46 Z"/>') +
      R(f, 'crab', '<path d="M-48 4 C-50 -34 50 -34 48 4 C46 22 -46 22 -48 4 Z"/>') +
      deco('<path d="M-14 -24 L-16 -44 M14 -24 L16 -44"/>' + paleEye(-16, -50, 10, 2) + paleEye(16, -50, 10, 2) + '<path d="M-12 0 Q0 10 12 0"/>', 4, true));
  }
  // A snail: shell with a spiral, soft body with eye stalks.
  function snail(f, x, y, s, flip, lw) {
    return grp(x, y, s, flip, lw,
      R(f, 'snail', '<path d="M-44 2 C-46 -18 30 -20 38 -10 C42 -26 44 -38 54 -40 C64 -36 62 -12 56 2 Z"/>') +
      R(f, 'snail-shell', '<circle cx="0" cy="-26" r="26"/>') +
      deco('<path d="M2 -26 C2 -32 -8 -32 -8 -24 C-8 -14 10 -14 10 -26 C10 -40 -16 -42 -18 -24"/><path d="M48 -36 L44 -50 M54 -36 L58 -50"/>' + eyeDot(44, -52, 3.5) + eyeDot(58, -52, 3.5), 3.5, true));
  }
  // A sea flower: five round petals (one region) and a middle (another).
  const flowers = (f, id, list) => R(f, id, list.map(([x, y, r]) => Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      return `<circle cx="${n(x + Math.cos(a) * r)}" cy="${n(y + Math.sin(a) * r)}" r="${n(r * .78)}"/>`; }).join(''))) +
    R(f, id + '-middles', list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${n(r * .62)}"/>`));
  // A cluster of faceted crystals standing on (x, y). sizes: [[dx, w, h, tilt], …]
  function crystals(f, id, x, y, sizes, s, lw) {
    const shapes = [], lines = [];
    sizes.forEach(([dx, w, h, tilt]) => {
      const t = `translate(${dx} 0) rotate(${tilt || 0})`;
      shapes.push(`<path d="M${-w / 2} 0 L${-w / 2} ${-h} L0 ${n(-h - w * .7)} L${w / 2} ${-h} L${w / 2} 0 Z" transform="${t}"/>`);
      lines.push(`<path d="M0 ${n(-h - w * .7)} L0 -4 M${-w / 2} ${-h} L0 ${n(-h + w * .3)} L${w / 2} ${-h}" transform="${t}"/>`);
    });
    return grp(x, y, s || 1, false, lw, R(f, id, shapes) + deco(lines.join(''), 3));
  }
  // A glowspore (Odyssey's Glowspore Deep): a stalk and a glowing round cap, with spore dots.
  const glowStalk = (x, y, h, lean) => `<path d="M${x - 6} ${y} C${x - 6} ${y - h * .5} ${x + lean - 5} ${y - h * .8} ${x + lean - 5} ${y - h} L${x + lean + 5} ${y - h} C${x + lean + 5} ${y - h * .8} ${x + 6} ${y - h * .5} ${x + 6} ${y} Z"/>`;
  const glowCap = (f, id, x, y, r) => R(f, id, `<path d="M${x - r} ${y} C${x - r} ${n(y - r * 1.5)} ${x + r} ${n(y - r * 1.5)} ${x + r} ${y} C${x + r * .5} ${y + 6} ${x - r * .5} ${y + 6} ${x - r} ${y} Z"/>`) +
    deco(`<circle cx="${n(x - r * .4)}" cy="${n(y - r * .6)}" r="3"/><circle cx="${n(x + r * .3)}" cy="${n(y - r * .8)}" r="2.5"/>`, 2.5) +
    deco(`<circle cx="${n(x - r * .9)}" cy="${n(y - r * 1.7)}" r="2.5" fill="${INK}" stroke="none"/><circle cx="${n(x + r * .7)}" cy="${n(y - r * 1.9)}" r="2" fill="${INK}" stroke="none"/><circle cx="${n(x + r * 1.3)}" cy="${n(y - r * 1.2)}" r="2" fill="${INK}" stroke="none"/>`, 2);

  /* ── the Odyssey axolotl ──
     Drawn to the game's own model (Axolotl Odyssey: drawMorphFace + the in-game profile):
     a flat, broad head; small eyes with an iris ring; nostril dots; a wide gentle smile;
     comb-fringed gills fanning up from the back of the head; a long body; thin legs with
     splayed toes; a long finned tail. No hats or props — the game's hero wears nothing.
     Its regions are the game's SEVEN directional parts (gill-left/right, fore-left/right,
     hind-left/right, tail) plus head and body, so the colouring page speaks the same
     language as the limb-loss system. Facing right; "left" parts are the far side. */
  function fan(len, w, toes, spread, toeLen) {
    let d = `M${-w} 0 L${-w} ${len}`;
    const tip = (a, r) => [n(Math.sin(a) * r), n(len + Math.cos(a) * r)];
    for (let i = 0; i < toes; i++) {
      const a = rad(spread - (2 * spread) * i / (toes - 1));
      const [tx, ty] = tip(a, toeLen), [cx, cy] = tip(a, toeLen * 1.35);
      const [vx, vy] = i < toes - 1 ? tip(rad(spread - (2 * spread) * (i + .5) / (toes - 1)), toeLen * .45) : [w, len];
      d += ` Q${n((tx + cx) / 2 - Math.cos(a) * 3)} ${n((ty + cy) / 2 + Math.sin(a) * 3)} ${tx} ${ty} Q${cx} ${cy} ${vx} ${vy}`;
    }
    return d + ` L${w} 0 Z`;
  }
  const odyLeg = (x, y, deg, len, w) => `<path d="${fan(len, w || 11, 4, 62, 20)}" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  function odyssey(f, o) {
    const pre = o.pre || '';
    const Rg = (id, shapes, extra) => R(f, pre + id, shapes, extra);
    const gN = [[312, 86, 252, 80], [300, 92, 226, 84], [292, 104, 200, 74]];
    const gF = [[322, 84, 270, 64], [308, 88, 242, 70], [298, 98, 216, 64]];
    const gills = list => list.map(([x, y, a, len], i) => frond(x, y, a, len, 26, (i - 1) * 6, 7)).join('');
    const combs = list => list.map(([x, y, a, len], i) => frondLines(x, y, a, len, 26, (i - 1) * 6, 7)).join('');
    let s = '';
    s += Rg('tail', '<path d="M156 96 C112 80 60 70 10 82 C-2 86 -2 98 8 104 C56 124 110 136 156 138 Z"/>', 'data-anim="tail" data-pivot="150 118"');
    s += deco('<path d="M140 104 C100 96 60 90 18 92"/><path d="M118 98 l-6 30 M92 92 l-8 30 M66 88 l-8 26 M40 88 l-8 20"/>', 2.5);
    const w = o.legW;   // thicker legs for pages whose tier needs more fingertip room
    s += Rg('fore-left', odyLeg(304, 138, -38, 42, w)) + Rg('hind-left', odyLeg(186, 138, -26, 40, w));
    s += Rg('gill-left', gills(gF), 'data-anim="gill" data-dir="1" data-pivot="306 100"') + deco(combs(gF), 2);
    s += Rg('body', '<path d="M318 94 C270 78 196 80 146 92 C118 98 112 134 140 142 C196 156 270 154 318 140 Z"/>');
    s += deco('<path d="M160 140 C210 150 260 150 300 142"/>', 2.5);
    s += Rg('hind-right', odyLeg(158, 140, 14, 36, w)) + Rg('fore-right', odyLeg(282, 142, 8, 36, w));
    s += Rg('gill-right', gills(gN), 'data-anim="gill" data-dir="-1" data-pivot="300 100"') + deco(combs(gN), 2);
    s += Rg('head', '<path d="M292 84 C320 68 376 70 400 94 C418 112 416 140 396 152 C368 166 312 164 290 150 C272 138 272 96 292 84 Z"/>');
    s += deco(`<g class="eye"><circle cx="356" cy="104" r="12" fill="#fff"/><circle cx="358" cy="104" r="7"/><circle cx="359" cy="104" r="4" fill="${INK}" stroke="none"/><circle cx="355" cy="100" r="2.4" fill="#fff" stroke="none"/></g>` +
      `<circle cx="398" cy="114" r="2" fill="${INK}" stroke="none"/><circle cx="406" cy="118" r="1.8" fill="${INK}" stroke="none"/>` +
      `<path d="M334 136 Q372 148 404 128"/><path d="M332 132 l3 6 M406 124 l-1 6" stroke-width="2.5"/>` +
      `<path d="M318 120 l5 -6 M326 122 l5 -6" stroke-width="2.5"/>`, 3.5, true);
    return s;
  }
  function odysseyAt(f, o) {
    const s = o.s || 0.6, lw = o.lw || 5;
    return `<g class="hop" data-pivot="${n(o.x + 210 * s)} ${n(o.y + 170 * s)}"><g transform="translate(${o.x} ${o.y}) scale(${s})${o.rot ? ` rotate(${o.rot} 210 110)` : ''}" stroke-width="${n(lw / s)}">${odyssey(f, o)}</g></g>`;
  }

  /* ─────────────────────────────────────────────────────────────────────
     A. SIMPLE CUTE — Easy. Big shapes, thick 8-unit line, one idea:
        Pip swims up to a round cave; two eyes blink back from the dark.
     ───────────────────────────────────────────────────────────────────── */
  reg('lab/a-simple', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[54, 54, 26], [112, 28, 15], [356, 40, 20]], 4.5) +
    R(f, 'seaweed', '<path d="M30 340 C4 290 40 250 18 200 C6 170 20 140 40 128 C46 160 34 186 50 214 C72 256 44 292 64 340 Z"/>') +
    R(f, 'cave-rock', '<path d="M168 334 C160 236 210 128 306 116 C372 108 418 150 418 210 L418 334 Z"/>') +
    R(f, 'cave-inside', '<path d="M228 334 C222 268 256 214 304 212 C352 210 378 266 372 334 Z"/>') +
    deco(`<g class="eye"><ellipse cx="290" cy="270" rx="13" ry="16" fill="#fff"/><circle cx="294" cy="273" r="7" fill="${INK}" stroke="none"/></g>` +
      `<g class="eye"><ellipse cx="324" cy="270" rx="13" ry="16" fill="#fff"/><circle cx="328" cy="273" r="7" fill="${INK}" stroke="none"/></g>`, 4, true) +
    R(f, 'sand', '<path d="M-10 326 C60 306 130 330 200 324 C270 318 340 302 410 318 L410 410 L-10 410 Z"/>') +
    R(f, 'starfish', `<polygon points="${starPoints(350, 368, 26, 13, 5)}"/>`) +
    R(f, 'shell', '<path d="M86 372 C80 334 138 334 132 372 Q109 384 86 372 Z"/>') + deco('<path d="M109 376 L109 344 M109 376 L94 350 M109 376 L124 350"/>', 3.5) +
    cast(f, { who: 'pip', x: 6, y: 128, s: 0.6, rot: -6, pose: 'swim', tail: 'swish', mouth: 'wow', simple: true, lw: 8 }) +
    '</g>');


  /* ─────────────────────────────────────────────────────────────────────
     B. STORYBOOK — Medium. Picture-book composition: the cave is the subject, Pip is
        small at its threshold, a lantern fish lights the way, light falls from above.
        Organic, slightly irregular shapes; 5-unit line, thin texture lines.
     ───────────────────────────────────────────────────────────────────── */
  reg('lab/b-storybook', f =>
    `<g stroke-width="5">` +
    bg(f) +
    deco('<path d="M30 -10 L128 270 M96 -10 L178 214 M156 -10 L214 156" stroke-dasharray="30 14"/>', 2.5) +
    bubbles(f, 'bubbles', [[178, 40, 11], [196, 18, 7], [60, 70, 9]], 3) +
    R(f, 'far-rocks', '<path d="M-10 262 C20 236 52 244 76 226 C100 210 128 222 150 208 C166 198 180 204 190 214 L190 330 L-10 330 Z"/>') +
    deco('<path d="M40 262 q10 -6 20 0 M120 240 q10 -6 20 0"/>', 2.5) +
    peek(f, 320, 66, 0.52, 5) +
    R(f, 'cave-rock', '<path d="M170 326 C160 262 176 190 214 148 C250 108 298 92 352 96 C384 98 404 108 414 118 L414 326 Z"/>') +
    deco('<path d="M196 196 q10 -6 18 2 M380 150 q8 8 0 16 M226 128 q12 -4 20 4 M396 250 q-10 6 -4 16 M190 240 l10 4 M188 252 l10 4 M400 200 l-8 6 M402 212 l-8 6"/><circle cx="392" cy="186" r="5"/><circle cx="210" cy="290" r="5"/>', 2.5) +
    R(f, 'cave-dark', '<path d="M214 326 C206 270 222 214 262 188 C298 164 350 172 370 214 C384 244 384 290 380 326 Z"/>') +
    R(f, 'door', '<path d="M262 326 L262 266 C262 230 336 230 336 266 L336 326 Z"/>') +
    deco('<path d="M299 290 C299 284 291 284 291 291 C291 300 307 300 307 289 C307 274 283 274 283 292 C283 310 315 312 316 288"/><path d="M262 266 C262 230 336 230 336 266" stroke-dasharray="2 9"/>', 2.5) +
    crystals(f, 'crystals', 232, 326, [[-6, 16, 28, -10], [10, 14, 44, 6]], 1, 5) +
    crystals(f, 'crystals-2', 352, 326, [[0, 24, 40, 8], [-22, 18, 22, -14]], 1, 5) +
    lanternFish(f, 238, 186, 0.5, true, 5) +
    R(f, 'kelp', '<path d="M8 330 C16 290 4 250 18 200 C26 170 20 130 30 96 C40 130 44 170 36 204 C26 250 36 290 28 330 Z"/>') +
    R(f, 'kelp-leaves', '<path d="M26 146 C42 120 70 122 80 134 C62 144 44 152 26 164 Z"/><path d="M20 206 C0 186 -14 188 -18 196 C-6 206 6 216 20 226 Z"/><path d="M28 246 C46 228 70 232 78 244 C60 250 44 258 28 266 Z"/>') +
    deco('<path d="M20 316 C26 280 16 250 26 210 C32 180 28 150 30 120"/>', 2.5) +
    R(f, 'sand', '<path d="M-10 318 C70 306 150 330 230 322 C300 316 360 310 410 318 L410 410 L-10 410 Z"/>') +
    deco('<path d="M150 360 q14 -6 28 0 M240 392 q14 -6 28 0 M330 352 q14 -6 28 0"/>', 2.5) +
    R(f, 'ledge', '<path d="M-10 410 L-10 300 C20 288 80 284 120 296 C144 304 150 324 144 342 C138 362 144 388 150 410 Z"/>') +
    deco('<path d="M20 330 l10 6 M30 322 l10 6 M80 360 q12 8 24 0 M40 380 q12 -8 24 0 M110 316 l8 8"/>', 2.5) +
    R(f, 'plants', '<path d="M330 330 C324 304 334 292 340 280 C346 296 346 312 344 330 Z"/><path d="M350 330 C350 300 364 294 372 286 C374 304 366 318 362 330 Z"/>') +
    R(f, 'pebbles', '<ellipse cx="300" cy="376" rx="22" ry="13"/><ellipse cx="390" cy="390" rx="18" ry="11"/>') +
    snail(f, 206, 372, 0.7, false, 5) +
    cast(f, { who: 'pip', x: 0, y: 176, s: 0.52, pose: 'reach', tail: 'wave', mouth: 'gasp', detail: 'mid', lw: 5 }) +
    '</g>');

  /* ─────────────────────────────────────────────────────────────────────
     C. CHARACTER GAME — Medium. Bold 7-unit line, chunky faceted rock, a big dynamic
        hero mid-dash, a collectible trail, a sidekick reacting, a treasure reveal.
     ───────────────────────────────────────────────────────────────────── */
  reg('lab/c-game', f =>
    `<g stroke-width="7">` +
    bg(f) +
    R(f, 'cave-dark', '<polygon points="236,150 352,128 372,330 232,330"/>') +
    R(f, 'sparkle', `<polygon points="${starPoints(334, 190, 24, 9, 4)}"/>`) +
    deco('<path d="M300 176 l-10 -6 M366 176 l10 -6 M334 156 l0 -10"/>', 4) +
    // Inky hides in the treasure chest, peeking out under the lid
    R(f, 'inky-peek', '<path d="M268 286 C268 248 340 248 340 286 Z"/>') +
    deco(paleEye(290, 270, 11, 3) + paleEye(318, 270, 11, 3), 4, true) +
    R(f, 'chest', '<path d="M262 330 L262 284 L346 284 L346 330 Z"/>') +
    deco('<path d="M262 306 L346 306"/><rect x="296" y="296" width="16" height="18" rx="4"/>', 4) +
    R(f, 'chest-lid', '<path d="M258 284 C258 248 350 248 350 284 Z" transform="rotate(-36 350 284)"/>') +
    R(f, 'rock-top', '<polygon points="196,52 284,22 380,26 412,40 412,150 352,128 236,150 210,116"/>') +
    deco('<path d="M284 22 L292 88 L352 128 M292 88 L236 150 M380 26 L360 92 L412 112"/>', 3.5) +
    R(f, 'rock-left', '<polygon points="190,126 236,150 246,330 168,330 160,230"/>') +
    deco('<path d="M236 150 L204 226 L246 330 M204 226 L160 230"/>', 3.5) +
    R(f, 'rock-right', '<polygon points="352,128 412,148 412,330 366,330"/>') +
    deco('<path d="M352 128 L384 220 L366 330 M384 220 L412 214"/>', 3.5) +
    R(f, 'pebbles', [[50, 70, 16], [104, 44, 16], [160, 36, 16]].map(([x, y, r]) => `<path d="M${x - r} ${y} L${x} ${y - r * 1.3} L${x + r} ${y} L${x} ${y + r * 1.3} Z"/>`)) +
    deco([[50, 70], [104, 44], [160, 36]].map(([x, y]) => `<path d="M${x - 16} ${y} L${x + 16} ${y} M${x} ${y - 21} L${x + 7} ${y}"/>`).join(''), 3) +
    R(f, 'sand', '<polygon points="-10,330 110,316 210,334 300,322 410,332 410,410 -10,410"/>') +
    R(f, 'boulder', '<polygon points="-10,410 -10,350 30,330 84,342 104,380 96,410"/>') +
    deco('<path d="M30 330 L44 372 L96 380 M44 372 L20 410"/>', 3.5) +
    R(f, 'grass', '<path d="M106 346 L110 300 L128 336 L140 290 L150 336 L168 306 L166 350 Z"/>') +
    crab(f, 334, 382, 0.5, 7) +
    bubbles(f, 'bubbles', [[22, 120, 14], [50, 96, 9]], 4) +
    deco('<path d="M10 268 L58 248 M2 304 L62 278 M24 334 L80 306"/>', 6) +
    cast(f, { who: 'pip', x: 20, y: 150, s: 0.62, rot: -22, pose: 'swim', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 7, look: 'up' }) +
    '</g>');

  /* ─────────────────────────────────────────────────────────────────────
     D. AXOLOTL ODYSSEY — Advanced. Glowspore Deep, drawn as a colouring page: stepped
        ledges, hanging roots, glowspores, golden pebbles, a crayfish in its burrow, a
        shrimp in a bubble — and an old arched tunnel with something horned inside.
        The hero is the game's own axolotl, its seven parts each a region.
     ───────────────────────────────────────────────────────────────────── */
  reg('lab/d-odyssey', f =>
    `<g stroke-width="5">` +
    bg(f) +
    R(f, 'ceiling', '<path d="M-10 -10 L410 -10 L410 58 C380 70 356 50 330 62 C300 76 270 54 240 66 C212 78 186 56 156 68 C126 80 96 60 68 72 C40 84 18 66 -10 74 Z"/>') +
    deco('<path d="M40 30 q12 -8 24 0 M200 24 q12 -8 24 0 M320 34 q12 -8 24 0"/>', 2.5) +
    R(f, 'root-1', '<path d="M100 64 C92 96 116 114 102 146 C94 166 100 190 110 204 C118 188 120 170 126 154 C138 122 118 96 128 66 Z"/>') +
    R(f, 'root-2', '<path d="M218 68 C226 94 210 114 220 138 C224 150 220 162 212 170 C230 166 242 150 240 132 C236 108 250 90 244 66 Z"/>') +
    deco('<path d="M108 120 l-12 10 M114 176 l12 8 M226 108 l12 6"/>', 3) +
    // the old tunnel — something horned waits inside (Vermillion's caravan is beyond)
    R(f, 'tunnel-rock', '<path d="M246 330 L246 206 C246 154 290 120 342 120 C384 120 410 140 412 150 L412 330 Z"/>') +
    deco('<path d="M262 220 l14 4 M270 270 l12 -6 M394 180 l-10 8 M396 280 l-12 4"/>', 2.5) +
    R(f, 'tunnel', '<path d="M280 330 L280 226 C280 194 306 172 338 172 C370 172 390 196 390 226 L390 330 Z"/>') +
    deco('<path d="M280 226 C280 194 306 172 338 172 C370 172 390 196 390 226" stroke-dasharray="1 12" stroke-width="5"/>', 5) +
    R(f, 'horns', '<path d="M346 222 C342 202 330 190 316 188 C330 202 334 214 334 228 Z"/><path d="M366 222 C370 202 382 190 396 188 C382 202 378 214 378 228 Z"/>') +
    deco(`<g class="eye"><ellipse cx="344" cy="246" rx="8" ry="6" fill="#fff"/><ellipse cx="344" cy="246" rx="2" ry="5" fill="${INK}" stroke="none"/></g>` +
      `<g class="eye"><ellipse cx="370" cy="246" rx="8" ry="6" fill="#fff"/><ellipse cx="370" cy="246" rx="2" ry="5" fill="${INK}" stroke="none"/></g>`, 3, true) +
    R(f, 'shrimp-bubble', '<circle cx="326" cy="74" r="40"/>') +
    deco(shine(326, 74, 40), 3) +
    R(f, 'shrimp', '<path d="M300 84 C304 58 338 50 352 68 C340 66 326 70 318 84 C314 94 306 98 300 84 Z"/><path d="M300 84 C288 88 286 100 292 108 C296 100 300 94 306 92 Z"/>') +
    deco('<path d="M350 66 C358 56 364 52 372 54 M348 70 C358 66 364 66 370 70"/>' + eyeDot(342, 66, 2.8), 2) +
    fish(f, 'fish', 176, 110, 0.5, true, 5) +
    R(f, 'ledge-high', '<path d="M-10 226 C8 214 48 212 68 218 C82 222 88 234 86 252 L-10 252 Z"/>') +
    R(f, 'ledge-mid', '<path d="M-10 252 L104 252 C122 252 134 262 134 278 L134 294 L-10 294 Z"/>') +
    deco('<path d="M20 276 l12 0 M60 270 l14 0 M96 282 l14 0 M30 238 l12 0"/>', 2.5) +
    deco('<path d="M0 222 l2 -8 l4 8 M44 216 l2 -8 l4 8 M66 220 l2 -8 l4 8"/>', 2.5) +
    R(f, 'stalks', glowStalk(30, 226, 52, -8) + glowStalk(206, 334, 58, -6)) +
    glowCap(f, 'spore-cap-1', 22, 176, 20) + glowCap(f, 'spore-cap-3', 200, 278, 22) +
    R(f, 'silt', '<path d="M-10 294 L150 294 C170 294 180 304 200 320 C220 332 300 328 410 330 L410 410 L-10 410 Z"/>') +
    deco('<path d="M30 340 q14 -6 28 0 M226 380 q14 -6 28 0 M340 362 q14 -6 28 0 M60 390 q14 -6 28 0"/>', 2.5) +
    R(f, 'pebbles', '<ellipse cx="50" cy="246" rx="13" ry="9"/><ellipse cx="270" cy="352" rx="13" ry="9"/><ellipse cx="306" cy="374" rx="13" ry="9"/><ellipse cx="376" cy="350" rx="13" ry="9"/>') +
    deco('<path d="M50 230 l0 -6 M270 336 l0 -6 M306 358 l0 -6 M376 334 l0 -6"/>', 2.5) +
    // a crayfish (the Matriarch's kin) watching from its burrow
    R(f, 'burrow', '<ellipse cx="128" cy="364" rx="54" ry="22"/>') +
    deco('<path d="M124 300 C110 270 90 262 64 262 M132 300 C146 270 166 262 192 258"/>', 2.5) +
    R(f, 'crayfish', '<path d="M102 366 C100 340 110 324 122 316 L128 296 L134 316 C146 324 156 340 154 366 Z"/>') +
    deco('<path d="M110 340 Q128 348 146 340 M106 354 Q128 362 150 354 M128 318 L128 334"/>', 2.5) +
    R(f, 'crayfish-claws', '<path d="M100 352 C78 344 70 322 82 306 C86 300 96 300 96 308 L90 318 L104 314 C110 330 108 346 100 352 Z"/><path d="M156 352 C178 344 186 322 174 306 C170 300 160 300 160 308 L166 318 L152 314 C146 330 148 346 156 352 Z"/>') +
    deco('<path d="M118 322 L112 314 M138 322 L144 314"/>' + eyeDot(111, 312, 4.5) + eyeDot(145, 312, 4.5), 2.5, true) +
    bubbles(f, 'bubbles', [[262, 150, 9], [250, 128, 6]], 2.5) +
    odysseyAt(f, { x: 8, y: 140, s: 0.76, rot: -6 }) +
    '</g>');

  /* ─────────────────────────────────────────────────────────────────────
     E. PREMIUM CUTE — Advanced. A polished picture: a crystal grotto with a glowing pearl
        in a giant clam. Pip gasps; Sunny lights the way with her own pearl; Inky hides
        behind the crystals; a tiny crab has found the clam first.
     ───────────────────────────────────────────────────────────────────── */
  reg('lab/e-premium', f =>
    `<g stroke-width="4">` +
    bg(f) +
    R(f, 'hearts', [heartPath(30, 30, 14), heartPath(66, 16, 9)].map(d => `<path d="${d}"/>`)) +
    R(f, 'sparkles', [[150, 34, 18], [376, 40, 14]].map(([x, y, r]) => `<polygon points="${starPoints(x, y, r, r * .36, 4)}"/>`)) +
    deco('<path d="M206 40 l0 14 M199 47 l14 0 M336 80 l0 10 M331 85 l10 0 M110 70 l0 10 M105 75 l10 0"/>', 2.5) +
    peek(f, 342, 68, 0.48, 4) +
    R(f, 'cave-rock', '<path d="M118 330 C104 240 150 140 244 112 C318 90 392 116 414 150 L414 330 Z"/>') +
    deco('<path d="M150 230 q10 -8 20 0 M392 200 q-10 8 -4 18 M220 130 q12 -6 22 0"/><circle cx="160" cy="292" r="5"/><circle cx="402" cy="270" r="6"/>', 2.5) +
    R(f, 'cave-inside', '<path d="M168 330 C160 262 196 196 262 184 C330 172 384 222 386 330 Z"/>') +
    deco('<path d="M278 250 L278 214 M244 262 L222 236 M312 262 L334 236 M230 288 L200 280 M326 288 L356 280" stroke-dasharray="8 8"/>', 2.5) +
    R(f, 'clam-top', '<path d="M218 300 C214 236 338 236 338 300 Z"/>') +
    deco('<path d="M278 298 L278 250 M278 298 L254 254 M278 298 L302 254 M278 298 L236 268 M278 298 L320 268"/>', 2.5) +
    R(f, 'pearl', '<circle cx="278" cy="294" r="22"/>') +
    deco(shine(278, 294, 22), 3) +
    R(f, 'clam', '<path d="M206 304 C226 338 330 338 350 304 C334 314 222 314 206 304 Z"/>') +
    crystals(f, 'crystal-left', 176, 336, [[0, 28, 56, -10], [26, 20, 30, 10], [-22, 18, 24, -26]], 1, 4) +
    crystals(f, 'crystal-top', 266, 122, [[-18, 22, 32, -18], [6, 26, 52, 2], [32, 20, 28, 20]], 1, 4) +
    crystals(f, 'crystal-right', 388, 196, [[0, 28, 50, 10], [-24, 20, 30, -10]], 1, 4) +
    R(f, 'coral', '<path d="M24 330 C22 300 10 286 12 266 C14 252 28 254 30 268 C32 280 36 290 40 294 C42 274 40 250 46 236 C52 222 68 228 64 242 C60 258 56 280 58 300 C64 290 74 284 82 286 C94 290 90 304 80 306 C70 308 64 318 64 330 Z"/>') +
    R(f, 'sand', '<path d="M-10 324 C80 310 160 334 240 326 C300 320 360 316 410 322 L410 410 L-10 410 Z"/>') +
    deco('<path d="M120 372 q14 -6 28 0 M250 388 q14 -6 28 0 M300 360 q14 -6 28 0"/>', 2.5) +
    crab(f, 362, 330, 0.42, 4) +
    flowers(f, 'flowers', [[204, 366, 13], [240, 384, 10]]) +
    R(f, 'starfish', `<polygon points="${starPoints(362, 374, 24, 12, 5)}"/>`) +
    deco('<circle cx="357" cy="372" r="2" fill="' + INK + '" stroke="none"/><circle cx="367" cy="372" r="2" fill="' + INK + '" stroke="none"/><path d="M357 379 Q362 383 367 379"/>', 2.5, true) +
    cast(f, { who: 'sunny', pre: 'sunny-', x: 22, y: 246, s: 0.44, pose: 'reach', tail: 'wave', mouth: 'smile', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'pip', pre: 'pip-', x: 4, y: 60, s: 0.54, rot: 4, pose: 'swim', tail: 'swish', mouth: 'gasp', detail: 'mid', lw: 6 }) +
    '</g>');

  window.LabArt = { axo, cast, odyssey, odysseyAt, peek, frond, frondLines, POSES,
    // the drawing kit, for page sets built on the lab rig (js/pages-v4.js)
    kit: { n, R, deco, bg, shine, bubbles, grp, eyeDot, paleEye, fish, lanternFish, crab, snail, crystals, flowers, glowStalk, glowCap } };
})();
