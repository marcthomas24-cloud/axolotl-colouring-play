/*
  v3 colouring pages — the current set. PROTOTYPE ART (code-drawn), richer than v2:
  the hand-curved v3 axolotl, organic scenery, and illustrative detail drawn as thin
  "deco" lines (texture, shine, grain) that never create tiny colouring areas.
  Earlier keys (v2/…, page/…, placeholder/…) stay registered in pages.js for pictures
  already coloured on them. Keys are permanent: new artwork needs new keys.
*/
(function () {
  'use strict';
  const { region, starPoints, heartPath, placeAxolotl } = Art.kit;
  const reg = Art.registerPage;
  const INK = Art.INK;

  /* ── kit ── */
  const R = (f, id, shapes, extra) => region(id, f, Array.isArray(shapes) ? shapes.join('') : shapes, extra);
  const bg = (f, id) => R(f, id || 'water', '<rect x="0" y="0" width="400" height="400"/>', 'stroke="none"');
  const deco = (inner, w) => `<g class="deco" fill="none" stroke-width="${w || 3.5}">${inner}</g>`;
  const ax = (f, x, y, s, o) => placeAxolotl(f, x, y, s, Object.assign({ v3: true }, o));
  const n = v => +v.toFixed(1);

  // A lumpy cloud sitting on (x, y), w wide.
  function cloud(f, id, x, y, w) {
    const h = w * 0.42;
    return R(f, id, `<path d="M${x} ${y} C${n(x - w * .1)} ${y} ${n(x - w * .08)} ${n(y - h * .55)} ${n(x + w * .12)} ${n(y - h * .5)} ` +
      `C${n(x + w * .14)} ${n(y - h)} ${n(x + w * .42)} ${n(y - h * 1.05)} ${n(x + w * .48)} ${n(y - h * .75)} ` +
      `C${n(x + w * .56)} ${n(y - h * 1.25)} ${n(x + w * .92)} ${n(y - h * 1.1)} ${n(x + w * .86)} ${n(y - h * .55)} ` +
      `C${n(x + w * 1.08)} ${n(y - h * .55)} ${n(x + w * 1.08)} ${y} ${x + w} ${y} Z"/>`) +
      deco(`<path d="M${n(x + w * .2)} ${n(y - h * .45)} Q${n(x + w * .3)} ${n(y - h * .7)} ${n(x + w * .42)} ${n(y - h * .55)}"/>`);
  }
  // A smiling sun with wavy rays.
  function sun(f, x, y, r) {
    const rays = Array.from({ length: 10 }, (_, i) => {
      const a = i / 10 * Math.PI * 2, p = (ang, rr) => `${n(x + Math.cos(ang) * rr)} ${n(y + Math.sin(ang) * rr)}`;
      return `<path d="M${p(a - .18, r + 6)} Q${p(a - .05, r + 22)} ${p(a, r + 30)} Q${p(a + .05, r + 22)} ${p(a + .18, r + 6)} Z"/>`;
    });
    return R(f, 'sun-rays', rays) + R(f, 'sun', `<circle cx="${x}" cy="${y}" r="${r}"/>`) +
      deco(`<path d="M${x - r * .45} ${y - r * .1} q${r * .15} ${-r * .18} ${r * .3} 0 M${x + r * .15} ${y - r * .1} q${r * .15} ${-r * .18} ${r * .3} 0 M${x - r * .35} ${y + r * .25} Q${x} ${y + r * .55} ${x + r * .35} ${y + r * .25}"/>`, 4);
  }
  // A bubble with a shine.
  const shine = (x, y, r) => `<path d="M${n(x - r * .55)} ${n(y + r * .05)} A${n(r * .6)} ${n(r * .6)} 0 0 1 ${n(x - r * .05)} ${n(y - r * .55)}"/>`;
  const bubble = (f, id, x, y, r) => R(f, id, `<circle cx="${x}" cy="${y}" r="${r}"/>`) + deco(shine(x, y, r), 4);
  const bubbles = (f, id, list) => R(f, id, list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)) + deco(list.map(([x, y, r]) => shine(x, y, r)).join(''), 3.5);
  // Sand with ripples and pebbles drawn on it.
  const sand = (f, d, ripples) => R(f, 'sand', `<path d="${d}"/>`) + deco((ripples || []).map(([x, y]) => `<path d="M${x} ${y} q12 -6 24 0"/>`).join(''), 3.5);
  // Wavy seaweed ribbon from (x, y) up h, swaying `lean`.
  function seaweed(f, id, x, y, h, lean) {
    const l = lean || 0;
    return R(f, id, `<path d="M${x} ${y} C${x - 22} ${y - h * .25} ${x + 20 + l} ${y - h * .45} ${x - 4 + l} ${y - h * .7} C${x - 16 + l} ${y - h * .85} ${x + 4 + l} ${y - h} ${x + 14 + l} ${y - h} ` +
      `C${x + 30 + l} ${y - h * .82} ${x + 12 + l} ${y - h * .66} ${x + 30 + l} ${y - h * .46} C${x + 44} ${y - h * .26} ${x + 18} ${y - h * .12} ${x + 30} ${y} Z"/>`) +
      deco(`<path d="M${x + 15} ${y - 6} C${x + 6} ${y - h * .3} ${x + 24 + l} ${y - h * .5} ${x + 10 + l} ${y - h * .8}"/>`, 3);
  }
  // An irregular rock with a crack.
  const rock = (f, id, x, y, w, h) => R(f, id, `<path d="M${x} ${y} C${x - 4} ${y - h * .7} ${x + w * .2} ${y - h} ${x + w * .45} ${y - h * .95} C${x + w * .7} ${y - h * 1.05} ${x + w} ${y - h * .7} ${x + w} ${y} Z"/>`) +
    deco(`<path d="M${x + w * .35} ${y - h * .55} l${w * .08} ${h * .2} l${w * .1} ${-h * .05}"/>`, 3.5);
  // A friendly fish: curved body, forked tail, fin; scales and gill line as deco.
  function fish(f, id, x, y, s, flip) {
    const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
    const body = `<path d="M-56 0 C-46 -36 14 -40 42 -6 C46 -2 46 2 42 6 C14 40 -46 36 -56 0 Z" transform="${t}"/>`;
    const fin = `<path d="M-14 -30 C-6 -58 26 -54 30 -22 Z" transform="${t}"/>`;
    const tail = `<path d="M38 0 C52 -26 70 -34 82 -30 C72 -14 72 14 82 30 C70 34 52 26 38 0 Z" transform="${t}"/>`;
    return R(f, id + '-tail', tail) + (s < 0.75 ? R(f, id, [fin, body]) : R(f, id + '-fin', fin) + R(f, id, body)) +
      `<g class="deco" transform="${t}" fill="none" stroke-width="${n(3.5 / s)}"><circle cx="-30" cy="-6" r="9" fill="${INK}" stroke="none"/><circle cx="-33" cy="-9" r="3" fill="#fff" stroke="none"/>` +
      `<path d="M-14 -16 Q-6 0 -14 16"/><path d="M2 -10 q6 6 0 12 M14 -12 q6 7 0 14 M26 -8 q5 5 0 10"/><path d="M-44 14 Q-38 18 -32 14"/></g>`;
  }
  // A starfish with a little face.
  const starfish = (f, id, x, y, r) => R(f, id, `<polygon points="${starPoints(x, y, r, r * 0.52, 5)}"/>`) +
    deco(`<circle cx="${x - r * .18}" cy="${y - r * .05}" r="1.8" fill="${INK}"/><circle cx="${x + r * .18}" cy="${y - r * .05}" r="1.8" fill="${INK}"/><path d="M${x - r * .15} ${y + r * .15} Q${x} ${y + r * .3} ${x + r * .15} ${y + r * .15}"/>`, 3);
  // A scallop shell with ridges.
  const shell = (f, id, x, y, w) => R(f, id, `<path d="M${x} ${y} C${x - 4} ${y - w * .8} ${x + w} ${y - w * .8} ${x + w} ${y} Q${x + w / 2} ${y + w * .14} ${x} ${y} Z"/>`) +
    deco([.2, .4, .6, .8].map(k => `<path d="M${x + w / 2} ${y + 2} L${n(x + w * k)} ${n(y - w * .55)}"/>`).join(''), 3);
  const rstar = (x, y, r) => `<polygon points="${starPoints(x, y, r, r * 0.5, 5)}"/>`;
  const twinkles = list => deco(list.map(([x, y]) => `<path d="M${x - 7} ${y} L${x + 7} ${y} M${x} ${y - 7} L${x} ${y + 7}"/>`).join(''), 3);

  /* ── 1. Baby Axolotl ── */
  reg('v3/baby', f =>
    bg(f) +
    seaweed(f, 'seaweed-left', 22, 360, 170, -6) +
    seaweed(f, 'seaweed-right', 342, 360, 150, 8) +
    bubble(f, 'bubble-1', 62, 62, 28) + bubble(f, 'bubble-2', 340, 52, 24) +
    bubbles(f, 'bubbles', [[110, 30, 14], [372, 112, 14], [24, 132, 13]]) +
    sand(f, 'M-10 352 Q120 326 220 346 T410 338 L410 410 L-10 410 Z', [[40, 380], [140, 392], [300, 378]]) +
    starfish(f, 'starfish', 356, 372, 26) + shell(f, 'shell', 30, 392, 46) +
    ax(f, 40, 30, 0.8, { pose: 'wave', tilt: -6 }));

  /* ── 2. Explorer ── */
  const bigLeaf = (f, id, x, y, len, deg) => R(f, id, `<path d="M0 0 C${len * .3} ${-len * .38} ${len * .8} ${-len * .3} ${len} 0 C${len * .8} ${len * .3} ${len * .3} ${len * .38} 0 0 Z" transform="translate(${x} ${y}) rotate(${deg})"/>`) +
    deco(`<g transform="translate(${x} ${y}) rotate(${deg})"><path d="M6 0 L${len * .9} 0"/>${[.3, .5, .7].map(k => `<path d="M${len * k} 0 l${len * .1} ${-len * .14} M${len * k} 0 l${len * .1} ${len * .14}"/>`).join('')}</g>`, 3);
  reg('v3/explorer', f =>
    bg(f) +
    bigLeaf(f, 'leaf-left', -10, 330, 150, -58) +
    bigLeaf(f, 'leaf-right', 410, 334, 120, -120) +
    fish(f, 'fish', 108, 64, 0.62, false) +
    bubbles(f, 'bubbles', [[318, 36, 16], [350, 72, 13], [296, 80, 11]]) +
    sand(f, 'M-10 330 Q120 304 220 324 T410 318 L410 410 L-10 410 Z', [[60, 370], [250, 384], [330, 364]]) +
    R(f, 'post', '<path d="M330 352 L334 196 L352 196 L350 352 Z"/>') +
    R(f, 'sign', '<path d="M290 186 L372 180 L396 202 L374 226 L292 228 Z"/>') + deco('<path d="M304 198 L364 196 M306 214 L360 212"/>', 3) +
    rock(f, 'rock', 8, 384, 96, 46) +
    ax(f, 56, 54, 0.72, { accessory: 'explorer', held: 'map', tilt: 5 }));

  /* ── 3. Pirate ── */
  reg('v3/pirate', f =>
    bg(f, 'sky') + sun(f, 344, 58, 26) + cloud(f, 'cloud', 150, 92, 110) +
    R(f, 'sea', '<path d="M-10 212 C10 196 30 196 44 208 C52 196 70 196 80 208 C94 196 114 196 128 210 C140 196 160 196 172 210 C186 196 206 196 218 210 C232 196 252 196 264 210 C278 196 298 196 310 210 C324 196 344 196 356 210 C370 196 392 196 410 210 L410 410 L-10 410 Z"/>') +
    deco('<path d="M30 250 q14 -8 28 0 M120 238 q14 -8 28 0 M60 300 q14 -8 28 0"/>', 3.5) +
    R(f, 'mast', '<rect x="74" y="64" width="10" height="136" rx="3"/>') +
    R(f, 'sail', '<path d="M86 76 C136 92 142 150 86 170 C98 140 98 104 86 76 Z"/>') +
    R(f, 'flag', '<path d="M84 66 C96 56 108 74 124 62 L124 46 C108 58 96 40 84 50 Z"/>') +
    R(f, 'ship', '<path d="M0 188 L158 188 C152 214 132 232 104 234 L40 234 C18 230 6 212 0 188 Z"/>') +
    deco('<path d="M8 204 L150 204 M18 220 L140 220"/><circle cx="52" cy="196" r="5"/><circle cx="84" cy="196" r="5"/><circle cx="116" cy="196" r="5"/>', 3.5) +
    R(f, 'island', '<path d="M224 410 C250 352 330 330 410 336 L410 410 Z"/>') +
    R(f, 'palm-trunk', '<path d="M358 350 C350 300 360 262 380 232 L394 240 C378 270 370 304 378 350 Z"/>') +
    deco('<path d="M360 330 l16 -2 M358 306 l17 -1 M362 282 l16 0 M368 258 l15 2"/>', 3) +
    R(f, 'palm-leaves', [[-160, 74], [-120, 70], [-60, 66], [-20, 64], [20, 56]].map(([a, l]) =>
      `<path d="M0 0 C${l * .3} ${-l * .32} ${l * .75} ${-l * .28} ${l} 0 C${l * .7} ${-l * .06} ${l * .3} ${l * .06} 0 0 Z" transform="translate(386 236) rotate(${a})"/>`)) +
    ax(f, 60, 110, 0.66, { accessory: 'pirate', held: 'wheel', tilt: -4 }) +
    R(f, 'chest-lid', '<path d="M272 352 C272 320 348 320 348 352 Z"/>') +
    R(f, 'chest', '<rect x="272" y="348" width="76" height="44" rx="8"/>') +
    deco('<path d="M296 348 L296 392 M324 348 L324 392"/><rect x="304" y="356" width="12" height="14" rx="3"/>', 3.5));

  /* ── 4. Wizard ── */
  reg('v3/wizard', f =>
    bg(f, 'sky') +
    R(f, 'moon', '<path d="M330 22 A54 54 0 1 0 384 100 A44 44 0 1 1 330 22 Z"/>') +
    deco('<path d="M318 78 q6 -6 12 0 M318 96 q8 6 16 0"/>', 4) +
    R(f, 'star', rstar(62, 62, 30)) + R(f, 'stars', [rstar(150, 34, 17), rstar(250, 30, 16), rstar(382, 168, 15)]) +
    twinkles([[110, 110], [210, 70], [290, 120]]) +
    R(f, 'floor', '<path d="M-10 344 Q200 318 410 344 L410 410 L-10 410 Z"/>') +
    deco('<path d="M40 362 L70 400 M140 352 L150 400 M250 352 L240 400 M350 360 L320 400"/>', 3) +
    R(f, 'rug', '<ellipse cx="200" cy="380" rx="150" ry="22"/>') + deco('<ellipse cx="200" cy="380" rx="120" ry="13"/>', 3) +
    R(f, 'wand', '<path d="M54 262 L66 266 L112 150 L100 146 Z"/>') + R(f, 'wand-star', rstar(108, 132, 26)) +
    deco('<path d="M140 118 l8 -8 M146 140 l12 0 M80 104 l-6 -10"/>', 4) +
    ax(f, 64, 86, 0.68, { accessory: 'wizard', held: 'book', tilt: 5 }) +
    R(f, 'potion-cork', '<rect x="28" y="282" width="34" height="22" rx="6"/>') +
    R(f, 'potion', '<path d="M34 302 L56 302 L56 318 C78 326 84 360 66 376 C54 388 36 388 24 376 C6 360 12 326 34 318 Z"/>') +
    R(f, 'potion-liquid', '<path d="M16 348 C30 340 60 356 76 346 C80 364 72 380 45 383 C20 380 12 364 16 348 Z"/>') +
    deco('<circle cx="40" cy="362" r="4"/><circle cx="54" cy="354" r="3"/>', 3) +
    R(f, 'bottle-cork', '<rect x="338" y="256" width="34" height="24" rx="6"/>') +
    R(f, 'bottle', '<path d="M344 278 L366 278 L366 292 C384 298 386 312 386 324 L386 370 C386 380 380 384 372 384 L338 384 C330 384 324 380 324 370 L324 324 C324 312 326 298 344 292 Z"/>') +
    R(f, 'bottle-label', '<rect x="334" y="322" width="42" height="30" rx="6"/>', 'stroke-width="4"'));

  /* ── 5. Astronaut ── */
  const ringHalf = (cx, cy, rx, ry, t, front, tilt) =>
    `<path d="M${cx - rx} ${cy} A${rx} ${ry} 0 0 ${front ? 0 : 1} ${cx + rx} ${cy} L${cx + rx - t} ${cy} A${rx - t} ${n(ry - t / 3)} 0 0 ${front ? 1 : 0} ${cx - rx + t} ${cy} Z" transform="rotate(${tilt} ${cx} ${cy})"/>`;
  reg('v3/astronaut', f =>
    bg(f, 'space') +
    R(f, 'ring-back', ringHalf(90, 92, 82, 22, 16, false, -14)) +
    R(f, 'planet', '<circle cx="90" cy="92" r="46"/>') + deco('<path d="M52 76 Q90 66 128 78 M48 100 Q90 92 132 104"/><circle cx="104" cy="118" r="7"/>', 3.5) +
    R(f, 'ring-front', ringHalf(90, 92, 82, 22, 16, true, -14)) +
    R(f, 'stars', [rstar(232, 40, 18), rstar(380, 58, 16), rstar(200, 120, 13)]) + twinkles([[300, 30], [160, 70], [370, 150]]) +
    R(f, 'ground', '<path d="M-10 356 Q140 332 300 354 T410 350 L410 410 L-10 410 Z"/>') +
    deco('<ellipse cx="70" cy="384" rx="26" ry="8"/><ellipse cx="330" cy="386" rx="20" ry="7"/><ellipse cx="200" cy="396" rx="14" ry="5"/>', 3.5) +
    ax(f, 30, 104, 0.62, { accessory: 'helmet', pose: 'wave', tilt: -5 }) +
    R(f, 'flame', '<path d="M318 300 C320 330 330 352 340 368 C350 352 360 330 362 300 Z"/>') +
    R(f, 'flame-inner', '<path d="M330 300 C332 318 336 330 340 340 C344 330 348 318 350 300 Z"/>', 'stroke-width="4"') +
    R(f, 'fin-left', '<path d="M302 236 C284 252 274 282 278 310 L306 300 Z"/>') +
    R(f, 'fin-right', '<path d="M378 236 C396 252 406 282 402 310 L374 300 Z"/>') +
    R(f, 'rocket', '<path d="M340 112 C380 140 392 210 380 304 L300 304 C288 210 300 140 340 112 Z"/>') +
    deco('<path d="M304 268 L376 268"/><circle cx="318" cy="284" r="3"/><circle cx="340" cy="286" r="3"/><circle cx="362" cy="284" r="3"/>', 3.5) +
    R(f, 'window', '<circle cx="340" cy="196" r="24"/>') + deco('<path d="M326 190 A14 14 0 0 1 340 178"/>', 4));

  /* ── 6. Princess ── */
  const arcBand = (cx, cy, rOut, rIn) => `<path d="M${cx - rOut} ${cy} A${rOut} ${rOut} 0 0 1 ${cx + rOut} ${cy} L${cx + rIn} ${cy} A${rIn} ${rIn} 0 0 0 ${cx - rIn} ${cy} Z"/>`;
  const tower = (f, side, x) =>
    R(f, 'tower-' + side, `<path d="M${x} 340 L${x} 150 L${x + 10} 150 L${x + 10} 138 L${x + 22} 138 L${x + 22} 150 L${x + 42} 150 L${x + 42} 138 L${x + 54} 138 L${x + 54} 150 L${x + 64} 150 L${x + 64} 340 Z"/>`) +
    R(f, 'roof-' + side, `<path d="M${x - 8} 140 C${x + 14} 120 ${x + 26} 92 ${x + 32} 66 C${x + 38} 92 ${x + 50} 120 ${x + 72} 140 Z"/>`) +
    R(f, 'flag-' + side, `<path d="M${x + 32} 66 L${x + 32} 40 C${x + 44} 34 ${x + 52} 50 ${x + 66} 42 L${x + 66} 62 C${x + 52} 70 ${x + 44} 54 ${x + 32} 60 Z"/>`) +
    R(f, 'window-' + side, `<path d="M${x + 18} 228 L${x + 18} 204 C${x + 18} 184 ${x + 46} 184 ${x + 46} 204 L${x + 46} 228 Z"/>`) +
    deco(`<path d="M${x} 262 l14 0 M${x + 30} 262 l20 0 M${x + 14} 282 l22 0 M${x + 44} 282 l20 0 M${x} 302 l18 0 M${x + 32} 302 l18 0"/><path d="M${x + 14} 128 l6 -10 M${x + 40} 116 l4 -8"/>`, 3);
  reg('v3/princess', f =>
    bg(f, 'sky') +
    R(f, 'rainbow-1', arcBand(200, 270, 196, 172)) + R(f, 'rainbow-2', arcBand(200, 270, 172, 148)) + R(f, 'rainbow-3', arcBand(200, 270, 148, 124)) +
    cloud(f, 'cloud-left', -4, 280, 86) + cloud(f, 'cloud-right', 318, 280, 86) +
    R(f, 'hearts', [`<path d="${heartPath(176, 38, 16)}"/>`, `<path d="${heartPath(226, 52, 12)}"/>`]) +
    R(f, 'castle', '<rect x="66" y="198" width="268" height="148"/>') + deco('<path d="M86 230 l24 0 M140 230 l24 0 M240 230 l24 0 M290 230 l24 0"/>', 3) +
    tower(f, 'left', 20) + tower(f, 'right', 316) +
    R(f, 'grass', '<path d="M-10 334 Q200 298 410 334 L410 410 L-10 410 Z"/>') +
    deco('<path d="M40 372 l4 -10 l4 10 M90 388 l4 -10 l4 10 M310 384 l4 -10 l4 10 M356 368 l4 -10 l4 10"/>', 3) +
    ax(f, 66, 100, 0.68, { accessory: 'crown', held: 'flower', tilt: -5 }));

  /* ── 7. Treasure ── */
  reg('v3/treasure', f =>
    bg(f) +
    seaweed(f, 'seaweed', 16, 336, 200, 6) +
    bubbles(f, 'bubbles', [[372, 40, 20], [346, 88, 14], [382, 128, 12]]) +
    sand(f, 'M-10 330 Q100 306 200 326 T410 320 L410 410 L-10 410 Z', [[40, 370], [160, 392], [270, 372]]) +
    R(f, 'chest-lid', '<path d="M196 238 L214 146 C250 128 346 128 382 146 L400 238 Z"/>') + deco('<path d="M226 150 L216 236 M370 150 L380 236"/>', 4) +
    R(f, 'coins', [[232, 232, 22], [274, 220, 22], [316, 226, 22], [358, 234, 20], [252, 248, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)) +
    deco('<circle cx="274" cy="220" r="12"/><circle cx="316" cy="226" r="12"/><circle cx="232" cy="232" r="12"/>', 3) +
    R(f, 'gem', '<path d="M282 176 L308 160 L334 176 L308 210 Z"/>') + deco('<path d="M282 176 L334 176 M296 176 L308 210 M320 176 L308 210 M296 176 L308 160 L320 176"/>', 3) +
    R(f, 'chest', '<path d="M196 238 L400 238 L400 344 C400 352 394 356 386 356 L210 356 C202 356 196 352 196 344 Z"/>') +
    R(f, 'chest-band', '<rect x="196" y="278" width="204" height="24"/>', 'stroke-width="5"') +
    R(f, 'lock', '<path d="M284 270 L316 270 L316 304 C316 312 284 312 284 304 Z"/>') + deco('<circle cx="300" cy="286" r="4"/><path d="M300 290 L300 298"/>', 3) +
    R(f, 'spilled-coins', '<ellipse cx="372" cy="378" rx="20" ry="9"/><ellipse cx="214" cy="380" rx="18" ry="8"/>') +
    starfish(f, 'starfish', 120, 380, 22) +
    ax(f, 2, 94, 0.64, { held: 'coin', tilt: 5 }));

  /* ── 8. Coral Reef ── */
  reg('v3/coral', f =>
    bg(f) +
    fish(f, 'fish', 296, 74, 0.8, false) + fish(f, 'fish-2', 80, 48, 0.62, true) +
    bubbles(f, 'bubbles', [[190, 30, 13], [214, 60, 10], [180, 90, 9]]) +
    R(f, 'coral', '<path d="M214 346 C212 300 206 270 186 244 C176 232 182 218 194 224 C206 232 214 252 220 262 C222 230 222 204 230 186 C236 174 250 178 248 192 C244 214 238 236 238 258 C248 238 262 222 272 214 C282 208 290 218 282 228 C266 244 250 270 244 300 C242 318 242 334 244 346 Z"/>') +
    sand(f, 'M-10 336 Q120 312 240 332 T410 326 L410 410 L-10 410 Z', [[30, 372], [130, 388], [200, 368]]) +
    R(f, 'brain-coral', '<path d="M244 358 C240 316 290 296 322 300 C356 304 398 322 398 358 Z"/>') +
    deco('<path d="M260 346 C268 328 284 340 290 326 C298 312 310 330 318 318 C326 306 340 324 350 314 M266 334 C278 318 292 316 300 306 M326 344 C336 330 352 340 362 328 C370 318 382 332 388 340"/>', 3.5) +
    R(f, 'anemone', [-60, -32, -6, 20, 46].map(a => `<path d="M-9 0 C-12 -30 -6 -50 0 -60 C6 -50 12 -30 9 0 Z" transform="translate(150 376) rotate(${a})"/>`)) +
    R(f, 'anemone-base', '<path d="M110 388 C112 364 188 364 190 388 Z"/>') +
    shell(f, 'shell', 24, 392, 50) +
    starfish(f, 'starfish', 92, 344, 22) +
    ax(f, 8, 98, 0.54, { pose: 'wave', tilt: -6, simple: true }) +
    ax(f, 260, 178, 0.34, { prefix: 'baby-', tilt: 6, simple: true }));

  /* ── 9. Village ── */
  const cottage = (f, k, x, w, h, roofH, doorX, winX) =>
    R(f, 'house-' + k, `<path d="M${x} 262 L${x + 4} ${262 - h} L${x + w - 4} ${262 - h} L${x + w} 262 Z"/>`) +
    R(f, 'roof-' + k, `<path d="M${x - 14} ${266 - h} C${x + w * .2} ${262 - h - roofH * .6} ${x + w * .35} ${262 - h - roofH} ${x + w / 2} ${262 - h - roofH} C${x + w * .65} ${262 - h - roofH} ${x + w * .8} ${262 - h - roofH * .6} ${x + w + 14} ${266 - h} Z"/>`) +
    deco(`<path d="M${x + 4} ${n(262 - h - roofH * .3)} q12 8 24 0 q12 8 24 0 q12 8 24 0 q12 8 24 0"/>`, 3) +
    R(f, 'door-' + k, `<path d="M${doorX} 262 L${doorX} 228 C${doorX} 208 ${doorX + 34} 208 ${doorX + 34} 228 L${doorX + 34} 262 Z"/>`) + deco(`<circle cx="${doorX + 26}" cy="240" r="3"/>`, 3) +
    R(f, 'window-' + k, `<circle cx="${winX}" cy="${266 - h + 34}" r="18"/>`) + deco(`<path d="M${winX - 18} ${266 - h + 34} L${winX + 18} ${266 - h + 34} M${winX} ${266 - h + 16} L${winX} ${266 - h + 52}"/>`, 3);
  reg('v3/village', f =>
    bg(f, 'sky') + sun(f, 50, 50, 24) + cloud(f, 'cloud', 236, 78, 100) +
    R(f, 'hills', '<path d="M-10 254 C60 222 130 236 200 246 C270 236 340 222 410 254 L410 410 L-10 410 Z"/>') +
    R(f, 'square', '<ellipse cx="200" cy="362" rx="182" ry="40"/>') +
    deco('<path d="M60 352 q14 -6 28 0 M130 372 q14 -6 28 0 M240 374 q14 -6 28 0 M300 350 q14 -6 28 0 M180 346 q14 -6 28 0"/>', 3) +
    cottage(f, '1', 14, 112, 108, 64, 30, 98) +
    cottage(f, '2', 274, 114, 120, 64, 344, 304) +
    R(f, 'chimney', '<rect x="356" y="92" width="22" height="40" rx="3"/>') + deco('<path d="M366 84 C356 72 376 64 366 52 C358 42 372 34 366 24"/>', 3.5) +
    deco('<path d="M70 102 C130 142 270 142 332 94"/>', 3.5) +
    R(f, 'bunting', [[106, 116], [150, 128], [196, 132], [242, 128], [288, 114]].map(([x, y]) => `<path d="M${x - 15} ${y - 2} L${x + 15} ${y + 2} L${x + 1} ${y + 30} Z"/>`)) +
    ax(f, 94, 128, 0.58, { pose: 'wave', accessory: 'explorer', tilt: -5, simple: true }) +
    // A small apple tree in front of the square (kept low so the cottage door stays visible).
    `<g transform="translate(-4 74) scale(0.8)" stroke-width="7.5">` +
    R(f, 'tree-trunk', '<path d="M48 380 C54 350 52 322 50 300 L74 300 C72 322 70 350 78 380 Z"/>') +
    R(f, 'tree', '<path d="M16 300 C-2 290 2 256 26 252 C24 226 56 212 72 226 C86 208 120 222 114 246 C134 254 130 290 108 296 C100 314 72 316 62 304 C50 316 24 314 16 300 Z"/>') +
    deco('<circle cx="40" cy="270" r="7"/><circle cx="84" cy="254" r="7"/><circle cx="96" cy="286" r="7"/><circle cx="58" cy="292" r="6"/>', 3.5) +
    '</g>' +
    R(f, 'flowers', [[350, 330], [370, 344], [362, 366], [338, 366], [330, 344]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14"/>`)) +
    R(f, 'flower-middle', '<circle cx="350" cy="350" r="13"/>'));

  /* ── 10. Odyssey ── */
  reg('v3/odyssey', f =>
    bg(f, 'cave') +
    R(f, 'rock-left', '<path d="M-10 -10 L96 -10 C70 60 52 120 60 190 C66 250 58 300 72 340 L-10 340 Z"/>') +
    deco('<path d="M20 120 l14 10 l-4 16 M30 240 l12 -8 l10 6"/>', 3.5) +
    R(f, 'rock-right', '<path d="M410 -10 L304 -10 C330 60 348 120 340 190 C334 250 342 300 328 340 L410 340 Z"/>') +
    deco('<path d="M376 100 l-12 12 l6 14 M366 250 l-14 -6 l-6 12"/>', 3.5) +
    R(f, 'rock-top', '<path d="M-10 -10 L410 -10 L410 46 C380 50 370 70 360 54 C340 40 300 52 280 40 C250 28 230 56 200 40 C170 26 150 54 120 40 C96 30 70 58 50 44 C30 34 10 54 -10 46 Z"/>') +
    R(f, 'root-1', '<path d="M140 36 C130 70 158 96 142 140 C128 112 116 76 118 40 Z"/>') +
    R(f, 'root-2', '<path d="M262 34 C274 64 252 92 266 128 C248 118 236 72 240 36 Z"/>') +
    R(f, 'glow', [[178, 76, 16], [222, 104, 14], [196, 50, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)) +
    deco('<path d="M160 76 l-8 0 M196 76 l8 0 M222 84 l0 -8 M240 104 l8 0"/>', 3) +
    R(f, 'floor', '<path d="M-10 334 Q200 302 410 334 L410 410 L-10 410 Z"/>') +
    R(f, 'pool', '<ellipse cx="200" cy="384" rx="112" ry="17"/>') + deco('<ellipse cx="200" cy="384" rx="70" ry="8"/>', 3) +
    ax(f, 74, 108, 0.64, { accessory: 'explorer', held: 'lantern', tilt: -4 }) +
    R(f, 'crystal-1', '<path d="M22 358 L36 286 L48 268 L60 286 L70 356 Z"/>') + deco('<path d="M48 268 L46 358 M36 286 L60 286"/>', 3) +
    R(f, 'crystal-2', '<path d="M60 360 L80 270 L94 248 L108 270 L114 354 Z"/>') + deco('<path d="M94 248 L90 360 M80 270 L108 270"/>', 3) +
    R(f, 'mushroom-stem', '<path d="M332 344 L336 312 L354 312 L358 344 Z"/>') +
    R(f, 'mushroom', '<path d="M304 316 C306 278 384 278 386 316 Z"/>') + deco('<circle cx="330" cy="298" r="6"/><circle cx="360" cy="294" r="5"/><circle cx="346" cy="306" r="4"/>', 3) +
    R(f, 'mushroom-2-stem', '<path d="M368 364 L371 336 L395 336 L398 364 Z"/>') +
    R(f, 'mushroom-2', '<path d="M356 344 C358 318 408 318 410 344 Z"/>'));
})();
