/*
  Colouring-page artwork. PROTOTYPE ART — clearly temporary; final illustrations replace it.

  Current pages: the 'v2/…' set (Pass 11) — the second-generation axolotl in poses holding
  props, in richer scenes. 'page/…' (Pass 7) and 'placeholder/…' (Passes 1–6) stay
  registered only so pictures already coloured on them keep rendering.

  Each page is registered under a key that content.js refers to. Keys are PERMANENT:
  finished pictures remember the key they were coloured on, so new artwork must get a
  NEW key (e.g. 'final/pirate') and the old one must stay registered — otherwise a
  child's saved picture would no longer line up with its outlines.

  Swapping in final art:
    Art.registerPage('final/pirate', '<g class="region" data-region="sky" …>…</g> …');
  (400×400 viewBox; colourable areas as <g class="region" data-region="unique-id">;
   face details as class="deco"; see art.js for the full contract and animation hooks.)
  Then point the page's `lineArt` in content.js at the new key.

  Line-art rules (ART_CONTENT_SPEC.md): bold outlines, big regions, no tiny gaps,
  friendly faces. Page drawing order = stacking order (later shapes sit in front).
*/
(function () {
  'use strict';
  const { region, starPoints, heartPath, axolotl, placeAxolotl } = Art.kit;
  const reg = Art.registerPage;

  /* ── shared scenery ── */
  const bg = (f, id) => region(id || 'water', f, '<rect x="0" y="0" width="400" height="400"/>', 'stroke="none"');
  const circle = (f, id, x, y, r) => region(id, f, `<circle cx="${x}" cy="${y}" r="${r}"/>`);
  const star = (f, id, x, y, r) => region(id, f, `<polygon points="${starPoints(x, y, r, r * 0.48, 5)}"/>`);
  const heart = (f, id, x, y, r) => region(id, f, `<path d="${heartPath(x, y, r)}"/>`);
  const path = (f, id, d) => region(id, f, `<path d="${d}"/>`);
  const poly = (f, id, pts) => region(id, f, `<polygon points="${pts}"/>`);
  const rect = (f, id, x, y, w, h, r) => region(id, f, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 0}"/>`);
  const deco = (inner, extra) => `<g class="deco" fill="none"${extra ? ' ' + extra : ''}>${inner}</g>`;
  const cloud = (f, id, x, y, s) => path(f, id,
    `M${x} ${y} a${22 * s} ${22 * s} 0 0 1 ${10 * s} ${-34 * s} a${26 * s} ${26 * s} 0 0 1 ${48 * s} ${-8 * s} a${22 * s} ${22 * s} 0 0 1 ${38 * s} ${18 * s} a${18 * s} ${18 * s} 0 0 1 ${-4 * s} ${34 * s} Z`);
  const seaweed = (f, id, x, y, h) => path(f, id,
    `M${x} ${y} C${x - 18} ${y - h * 0.3} ${x + 18} ${y - h * 0.5} ${x - 2} ${y - h * 0.75} C${x - 12} ${y - h * 0.9} ${x + 4} ${y - h} ${x + 12} ${y - h} ` +
    `C${x + 26} ${y - h * 0.8} ${x + 12} ${y - h * 0.62} ${x + 26} ${y - h * 0.45} C${x + 38} ${y - h * 0.25} ${x + 16} ${y - h * 0.12} ${x + 26} ${y} Z`);

  /* ── 1. Baby Axolotl — simple portrait (the easiest page) ── */
  reg('page/baby', f =>
    bg(f) +
    path(f, 'sand', 'M-10 366 Q200 336 410 366 L410 410 L-10 410 Z') +
    circle(f, 'bubble-1', 46, 48, 26) +
    circle(f, 'bubble-2', 364, 44, 20) +
    circle(f, 'bubble-3', 92, 18 + 12, 14) +
    placeAxolotl(f, 20, 22, 0.9));

  /* ── 2. Explorer — backpack and map ── */
  reg('page/explorer', f =>
    bg(f) +
    seaweed(f, 'seaweed', 30, 330, 190) +
    path(f, 'sand', 'M-10 318 Q120 292 220 314 T410 306 L410 410 L-10 410 Z') +
    region('rock', f, '<ellipse cx="352" cy="360" rx="54" ry="32"/>') +
    placeAxolotl(f, 72, 46, 0.7, { accessory: 'explorer' }) +
    // backpack resting beside the explorer
    rect(f, 'backpack', 12, 262, 86, 106, 22) +
    path(f, 'backpack-flap', 'M12 298 Q55 242 98 298 Z') +
    rect(f, 'backpack-pocket', 28, 316, 54, 36, 10) +
    // a folded treasure map in front
    poly(f, 'map-1', '114,304 172,294 176,376 112,386') +
    poly(f, 'map-2', '172,294 228,304 232,384 176,376') +
    poly(f, 'map-3', '228,304 286,294 290,376 232,384') +
    deco('<path d="M132 362 Q170 322 208 352 T266 326" stroke-dasharray="2 12" stroke-width="5"/><path d="M258 314 L278 334 M278 314 L258 334" stroke-width="6"/>'));

  /* ── 3. Pirate — hat, treasure and ship ── */
  reg('page/pirate', f =>
    bg(f, 'sky') +
    cloud(f, 'cloud', 250, 92, 1) +
    path(f, 'sea', 'M-10 200 Q25 186 60 200 T130 200 T200 200 T270 200 T340 200 T410 200 L410 410 L-10 410 Z') +
    rect(f, 'mast', 90, 50, 10, 130) +
    path(f, 'sail-back', 'M88 70 Q36 112 88 156 Z') +
    path(f, 'sail', 'M102 60 Q162 108 102 158 Z') +
    path(f, 'flag', 'M100 58 L142 44 L100 26 Z') +
    path(f, 'ship', 'M12 172 L182 172 L160 216 L34 216 Z') +
    deco('<circle cx="62" cy="192" r="7"/><circle cx="96" cy="192" r="7"/><circle cx="130" cy="192" r="7"/>', 'stroke-width="5"') +
    path(f, 'island', 'M-10 356 Q90 334 190 358 L190 410 L-10 410 Z') +
    placeAxolotl(f, 142, 96, 0.64, { accessory: 'pirate' }) +
    path(f, 'chest-lid', 'M20 324 Q20 284 72 284 Q124 284 124 324 Z') +
    rect(f, 'chest', 20, 320, 104, 62, 10) +
    circle(f, 'coin-1', 146, 372, 17) +
    circle(f, 'coin-2', 176, 386, 15));

  /* ── 4. Wizard — wand, stars and potion ── */
  reg('page/wizard', f =>
    bg(f, 'sky') +
    path(f, 'moon', 'M74 26 A44 44 0 1 0 122 96 A34 34 0 1 1 74 26 Z') +
    star(f, 'star-1', 334, 50, 26) +
    star(f, 'star-2', 376, 124, 18) +
    path(f, 'floor', 'M-10 342 Q200 310 410 342 L410 410 L-10 410 Z') +
    placeAxolotl(f, 82, 62, 0.7, { accessory: 'wizard' }) +
    poly(f, 'wand', '32,338 48,340 82,198 66,195') +
    star(f, 'wand-star', 76, 178, 28) +
    rect(f, 'cork', 330, 262, 34, 18, 6) +
    rect(f, 'potion-neck', 336, 276, 22, 32, 4) +
    circle(f, 'potion', 347, 342, 38) +
    path(f, 'potion-liquid', 'M311 348 Q347 330 383 348 A36 36 0 0 1 311 348 Z') +
    deco('<circle cx="338" cy="322" r="5"/><circle cx="356" cy="312" r="4"/>', 'stroke-width="4"'));

  /* ── 5. Astronaut — helmet, rocket and planets ── */
  reg('page/astronaut', f =>
    bg(f, 'space') +
    circle(f, 'planet', 76, 76, 50) +
    circle(f, 'crater', 60, 62, 14) +
    circle(f, 'planet-2', 362, 352, 26) +
    star(f, 'star-1', 226, 40, 20) +
    star(f, 'star-2', 376, 64, 21) +
    path(f, 'ground', 'M-10 362 Q140 338 300 360 T410 358 L410 410 L-10 410 Z') +
    placeAxolotl(f, 46, 116, 0.6, { accessory: 'helmet', simple: true }) +
    path(f, 'flame', 'M312 288 Q332 356 352 288 Z') +
    path(f, 'fin-left', 'M294 232 L268 300 L298 290 Z') +
    path(f, 'fin-right', 'M370 232 L396 300 L366 290 Z') +
    path(f, 'rocket', 'M332 116 Q378 166 372 292 L292 292 Q286 166 332 116 Z') +
    circle(f, 'window', 332, 196, 21));

  /* ── 6. Princess — crown and castle ── */
  reg('page/princess', f =>
    bg(f, 'sky') +
    heart(f, 'heart-1', 200, 44, 20) +
    heart(f, 'heart-2', 150, 86, 14) +
    path(f, 'flag-left', 'M54 8 L94 24 L54 40 Z') +
    path(f, 'flag-right', 'M346 8 L386 24 L346 40 Z') +
    deco('<path d="M54 40 L54 6 M346 40 L346 6" stroke-width="6"/>') +
    rect(f, 'castle', 62, 168, 276, 170) +
    rect(f, 'tower-left', 22, 110, 64, 230) +
    rect(f, 'tower-right', 314, 110, 64, 230) +
    path(f, 'roof-left', 'M12 116 L54 38 L96 116 Z') +
    path(f, 'roof-right', 'M304 116 L346 38 L388 116 Z') +
    path(f, 'window-left', 'M38 196 L38 172 Q54 152 70 172 L70 196 Z') +
    path(f, 'window-right', 'M330 196 L330 172 Q346 152 362 172 L362 196 Z') +
    path(f, 'grass', 'M-10 330 Q200 292 410 330 L410 410 L-10 410 Z') +
    placeAxolotl(f, 74, 110, 0.64, { accessory: 'crown' }));

  /* ── 7. Treasure — chest, coins, bubbles ── */
  reg('page/treasure', f =>
    bg(f) +
    circle(f, 'bubble-1', 352, 42, 22) +
    circle(f, 'bubble-2', 372, 96, 19) +
    path(f, 'sand', 'M-10 318 Q100 298 200 316 T410 310 L410 410 L-10 410 Z') +
    star(f, 'starfish', 336, 356, 34) +
    placeAxolotl(f, 160, 36, 0.6, { simple: true }) +
    // the axolotl peeks out from behind an open treasure chest
    path(f, 'chest-lid', 'M36 252 L58 176 L234 176 L256 252 Z') +
    poly(f, 'gem', '146,194 168,216 146,240 124,216') +
    circle(f, 'coin-1', 84, 248, 21) +
    circle(f, 'coin-2', 126, 240, 21) +
    circle(f, 'coin-3', 168, 246, 21) +
    circle(f, 'coin-4', 210, 252, 19) +
    rect(f, 'chest', 36, 252, 220, 108, 12) +
    rect(f, 'chest-band', 36, 290, 220, 22) +
    rect(f, 'lock', 130, 282, 32, 40, 7));

  /* ── 8. Coral Reef — several simple underwater friends ── */
  reg('page/coral', f =>
    bg(f) +
    path(f, 'fish-2-tail', 'M110 52 L138 30 L138 74 Z') +
    region('fish-2', f, '<ellipse cx="80" cy="52" rx="36" ry="22"/>') +
    path(f, 'fish-tail', 'M290 82 L332 54 L332 110 Z') +
    region('fish', f, '<ellipse cx="248" cy="82" rx="48" ry="30"/>') +
    path(f, 'fish-fin', 'M228 58 Q252 22 280 58 Z') +
    deco(`<circle cx="220" cy="76" r="6" fill="${Art.INK}"/><circle cx="60" cy="48" r="5" fill="${Art.INK}"/><path d="M212 92 Q222 98 230 92"/>`) +
    path(f, 'coral', 'M350 334 L350 262 L318 222 L332 212 L354 246 L354 186 L370 186 L370 236 L390 204 L402 214 L374 264 L374 334 Z') +
    seaweed(f, 'seaweed', 224, 330, 160) +
    path(f, 'sand', 'M-10 330 Q120 306 240 328 T410 322 L410 410 L-10 410 Z') +
    path(f, 'shell', 'M22 388 Q22 334 68 334 Q114 334 114 388 Z') +
    deco('<path d="M68 388 L68 340 M44 386 L54 344 M92 386 L82 344"/>') +
    star(f, 'starfish', 196, 368, 30) +
    placeAxolotl(f, 12, 116, 0.52, { simple: true }) +
    placeAxolotl(f, 262, 232, 0.34, { prefix: 'baby-', simple: true }));

  /* ── 9. Village — houses and village square ── */
  reg('page/village', f =>
    bg(f, 'sky') +
    circle(f, 'sun', 46, 46, 28) +
    cloud(f, 'cloud', 262, 72, 0.9) +
    path(f, 'grass', 'M-10 252 Q200 222 410 252 L410 410 L-10 410 Z') +
    region('square', f, '<ellipse cx="200" cy="354" rx="176" ry="44"/>') +
    rect(f, 'house-1', 14, 150, 112, 112) +
    poly(f, 'roof-1', '2,154 70,94 138,154') +
    path(f, 'door-1', 'M34 262 L34 222 Q50 202 66 222 L66 262 Z') +
    rect(f, 'window-1', 84, 174, 30, 30, 4) +
    rect(f, 'house-2', 276, 140, 112, 122) +
    poly(f, 'roof-2', '264,144 332,84 400,144') +
    path(f, 'door-2', 'M346 262 L346 222 Q362 202 378 222 L378 262 Z') +
    rect(f, 'window-2', 290, 166, 30, 30, 4) +
    placeAxolotl(f, 92, 124, 0.56, { accessory: 'explorer', simple: true }) +
    region('flower-1', f, [[40, 328], [60, 343], [53, 366], [27, 366], [20, 343]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15"/>`).join('')) +
    circle(f, 'flower-1-middle', 40, 350, 14) +
    region('flower-2', f, [[360, 328], [380, 343], [373, 366], [347, 366], [340, 343]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15"/>`).join('')) +
    circle(f, 'flower-2-middle', 360, 350, 14));

  /* ── 10. Odyssey — a cave adventure from the Axolotl Odyssey world ── */
  reg('page/odyssey', f =>
    bg(f, 'cave') +
    path(f, 'rock-left', 'M-10 -10 L96 -10 Q42 150 72 340 L-10 340 Z') +
    path(f, 'rock-right', 'M410 -10 L304 -10 Q358 150 328 340 L410 340 Z') +
    path(f, 'rock-top', 'M-10 -10 L410 -10 L410 50 Q200 14 -10 50 Z') +
    path(f, 'root-1', 'M140 30 C132 70 156 96 142 138 C128 112 118 76 118 34 Z') +
    path(f, 'root-2', 'M262 28 C272 64 252 92 266 126 C248 116 238 72 240 30 Z') +
    circle(f, 'glow-1', 112, 178, 19) +
    circle(f, 'glow-2', 294, 150, 19) +
    path(f, 'floor', 'M-10 330 Q200 298 410 330 L410 410 L-10 410 Z') +
    placeAxolotl(f, 82, 132, 0.6, { accessory: 'explorer', simple: true }) +
    poly(f, 'crystal-1', '22,356 44,268 68,352') +
    poly(f, 'crystal-2', '56,356 86,250 112,350') +
    poly(f, 'crystal-3', '100,360 118,300 138,358') +
    poly(f, 'lantern-top', '308,298 342,272 376,298') +
    rect(f, 'lantern', 316, 296, 52, 58, 10) +
    rect(f, 'lantern-base', 310, 350, 64, 14, 5) +
    deco('<path d="M324 276 Q342 244 360 276" stroke-width="6"/>'));

  /* ════════════════════════════════════════════════════════════════════════════
     v2 pages (Pass 11): richer, more cheerful scenes, and the second-generation
     axolotl in a pose that holds its prop. The 'page/…' art above stays registered
     so pictures coloured on it keep lining up.
     ════════════════════════════════════════════════════════════════════════════ */
  const ax = (f, x, y, sc, o) => placeAxolotl(f, x, y, sc, Object.assign({ v2: true }, o));
  const group = (f, id, shapes) => region(id, f, shapes.join(''));
  const circles = list => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`);
  // Sun rays: n rounded triangles around (cx, cy), all one region.
  const rays = (f, id, cx, cy, n, r1, r2, spread) => group(f, id, Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, w = spread || 0.2;
    const p = (ang, r) => `${(cx + Math.cos(ang) * r).toFixed(1)},${(cy + Math.sin(ang) * r).toFixed(1)}`;
    return `<polygon points="${p(a - w, r1)} ${p(a, r2)} ${p(a + w, r1)}"/>`;
  }));
  // Upper half-ring (rainbow band) centred on (cx, cy).
  const arcBand = (f, id, cx, cy, rOut, rIn) => path(f, id,
    `M${cx - rOut} ${cy} A${rOut} ${rOut} 0 0 1 ${cx + rOut} ${cy} L${cx + rIn} ${cy} A${rIn} ${rIn} 0 0 0 ${cx - rIn} ${cy} Z`);
  // Half of a tilted elliptical ring (planet rings): back = upper half, front = lower half.
  const ringHalf = (f, id, cx, cy, rx, ry, t, front, tilt) => region(id, f,
    `<path d="M${cx - rx} ${cy} A${rx} ${ry} 0 0 ${front ? 0 : 1} ${cx + rx} ${cy} L${cx + rx - t} ${cy} A${rx - t} ${ry - t / 3} 0 0 ${front ? 1 : 0} ${cx - rx + t} ${cy} Z" transform="rotate(${tilt} ${cx} ${cy})"/>`);
  // A pointed leaf of length len, width wid, from (x, y) at angle deg.
  const leaf = (len, wid, x, y, deg) => `<path d="M0 0 Q${len / 2} ${-wid} ${len} 0 Q${len / 2} ${wid} 0 0 Z" transform="translate(${x} ${y}) rotate(${deg})"/>`;
  // A leafy plant: several leaves fanning up from (x, y), one region, with centre veins.
  const plant = (f, id, x, y, angles) =>
    region(id, f, angles.map((a, i) => leaf(150 - i * 18, 34, x, y, a)).join('')) +
    deco(angles.map((a, i) => `<path d="M8 0 L${138 - i * 18} 0" transform="translate(${x} ${y}) rotate(${a})"/>`).join(''), 'stroke-width="4"');
  const fish = (f, id, x, y, sc, flip) => {
    const t = `translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})`;
    const fin = `<path d="M-18 -26 Q4 -62 30 -24 Z" transform="${t}"/>`, body = `<ellipse cx="0" cy="0" rx="50" ry="32" transform="${t}"/>`;
    // Small fish colour their fin with the body (a separate fin would be too small to tap).
    return region(id + '-tail', f, `<polygon points="38,0 76,-28 76,28" transform="${t}"/>`) +
      (sc < 0.75 ? region(id, f, fin + body) : region(id, f, body) + region(id + '-fin', f, fin)) +
      `<g class="deco" transform="${t}"><circle cx="-26" cy="-6" r="7" fill="${Art.INK}" stroke="none"/><path d="M-36 12 Q-26 20 -16 12" fill="none" stroke-width="${5 / sc}"/></g>`;
  };
  const mushroom = (f, id, x, y, r) =>
    rect(f, id + '-stem', x - r * 0.35, y - r * 0.15, r * 0.7, r * 1.1, r * 0.25) +
    path(f, id, `M${x - r} ${y} A${r} ${r * 0.85} 0 0 1 ${x + r} ${y} Z`) +
    deco(`<circle cx="${x - r * 0.4}" cy="${y - r * 0.45}" r="${r * 0.14}"/><circle cx="${x + r * 0.3}" cy="${y - r * 0.55}" r="${r * 0.11}"/>`, 'stroke-width="4"');

  /* ── 1. Baby Axolotl — a big waving portrait (still the easiest page) ── */
  reg('v2/baby', f =>
    bg(f) +
    circle(f, 'bubble-1', 50, 58, 26) +
    circle(f, 'bubble-2', 352, 44, 22) +
    group(f, 'bubbles', circles([[96, 24, 13], [378, 100, 13], [26, 120, 12]])) +
    path(f, 'sand', 'M-10 358 Q120 332 220 352 T410 344 L410 410 L-10 410 Z') +
    group(f, 'pebbles', ['<ellipse cx="46" cy="378" rx="28" ry="14"/>', '<ellipse cx="96" cy="388" rx="18" ry="10"/>']) +
    star(f, 'starfish', 354, 370, 24) +
    ax(f, 40, 26, 0.8, { pose: 'wave' }));

  /* ── 2. Explorer — holding a treasure map, with a signpost and jungle leaves ── */
  reg('v2/explorer', f =>
    bg(f) +
    plant(f, 'plant-left', 24, 330, [-100, -72, -44]) +
    plant(f, 'plant-right', 380, 330, [-136, -108, -80]) +
    path(f, 'sand', 'M-10 326 Q120 300 220 322 T410 316 L410 410 L-10 410 Z') +
    fish(f, 'fish', 92, 70, 0.62, false) +
    group(f, 'bubbles', circles([[330, 40, 18], [362, 80, 14], [300, 86, 12]])) +
    rect(f, 'post', 334, 196, 18, 150, 4) +
    poly(f, 'sign', '292,184 372,184 396,208 372,232 292,232') +
    region('rock', f, '<ellipse cx="52" cy="366" rx="54" ry="28"/>') +
    ax(f, 58, 60, 0.72, { accessory: 'explorer', held: 'map' }));

  /* ── 3. Pirate — at the ship's wheel, with a ship, palm island and a treasure chest ── */
  reg('v2/pirate', f =>
    bg(f, 'sky') +
    rays(f, 'sun-rays', 340, 58, 10, 34, 56) +
    circle(f, 'sun', 340, 58, 28) +
    cloud(f, 'cloud', 150, 78, 0.9) +
    path(f, 'sea', 'M-10 214 Q25 200 60 214 T130 214 T200 214 T270 214 T340 214 T410 214 L410 410 L-10 410 Z') +
    rect(f, 'mast', 74, 72, 9, 124) +
    path(f, 'sail', 'M86 80 Q138 124 86 170 Z') +
    path(f, 'flag', 'M84 74 L120 60 L84 44 Z') +
    path(f, 'ship', 'M4 192 L154 192 L134 230 L24 230 Z') +
    deco('<circle cx="50" cy="210" r="7"/><circle cx="82" cy="210" r="7"/><circle cx="114" cy="210" r="7"/>', 'stroke-width="5"') +
    path(f, 'island', 'M226 410 Q296 330 410 338 L410 410 Z') +
    path(f, 'palm-trunk', 'M360 352 C352 300 362 262 380 234 L394 242 C378 270 372 306 378 352 Z') +
    group(f, 'palm-leaves', [leaf(70, 20, 386, 238, -150), leaf(70, 20, 386, 238, -100), leaf(64, 18, 386, 238, -30), leaf(60, 18, 386, 238, 20)]) +
    ax(f, 62, 112, 0.66, { accessory: 'pirate', held: 'wheel' }) +
    path(f, 'chest-lid', 'M274 350 Q274 322 310 322 Q346 322 346 350 Z') +
    rect(f, 'chest', 274, 346, 72, 42, 8));

  /* ── 4. Wizard — spell book, floating wand, moon and potions ── */
  reg('v2/wizard', f =>
    bg(f, 'sky') +
    circle(f, 'moon', 334, 72, 44) +
    deco('<path d="M314 70 Q322 62 330 70 M340 70 Q348 62 356 70 M318 88 Q334 100 350 88"/>', 'stroke-width="5"') +
    star(f, 'star', 56, 56, 28) +
    group(f, 'stars', [[146, 34, 16], [250, 34, 15], [382, 160, 15]].map(([x, y, r]) => `<polygon points="${starPoints(x, y, r, r * 0.48, 5)}"/>`)) +
    path(f, 'floor', 'M-10 346 Q200 318 410 346 L410 410 L-10 410 Z') +
    region('rug', f, '<ellipse cx="200" cy="378" rx="160" ry="24"/>') +
    poly(f, 'wand', '52,262 64,266 110,150 98,146') +
    star(f, 'wand-star', 106, 134, 26) +
    ax(f, 66, 90, 0.68, { accessory: 'wizard', held: 'book' }) +
    rect(f, 'cork', 28, 284, 34, 22, 6) +
    rect(f, 'potion-neck', 34, 300, 22, 24, 4) +
    circle(f, 'potion', 45, 352, 34) +
    path(f, 'potion-liquid', 'M13 358 Q45 342 77 358 A32 32 0 0 1 13 358 Z') +
    rect(f, 'bottle-cork', 338, 256, 34, 24, 6) +
    rect(f, 'bottle', 326, 276, 58, 92, 18));

  /* ── 5. Astronaut — waving from a helmet, ringed planet and rocket ── */
  reg('v2/astronaut', f =>
    bg(f, 'space') +
    ringHalf(f, 'ring-back', 88, 92, 80, 22, 16, false, -14) +
    circle(f, 'planet', 88, 92, 44) +
    ringHalf(f, 'ring-front', 88, 92, 80, 22, 16, true, -14) +
    group(f, 'stars', [[230, 40, 18], [382, 54, 16], [200, 110, 13]].map(([x, y, r]) => `<polygon points="${starPoints(x, y, r, r * 0.48, 5)}"/>`)) +
    path(f, 'ground', 'M-10 358 Q140 334 300 356 T410 352 L410 410 L-10 410 Z') +
    deco('<ellipse cx="80" cy="384" rx="26" ry="8"/><ellipse cx="330" cy="386" rx="20" ry="7"/>', 'stroke-width="5"') +
    ax(f, 34, 108, 0.62, { accessory: 'helmet', pose: 'wave' }) +
    path(f, 'flame', 'M320 300 Q340 366 360 300 Z') +
    path(f, 'fin-left', 'M302 244 L276 312 L306 302 Z') +
    path(f, 'fin-right', 'M378 244 L404 312 L374 302 Z') +
    path(f, 'rocket', 'M340 120 Q388 172 380 304 L300 304 Q292 172 340 120 Z') +
    circle(f, 'window', 340, 202, 22));

  /* ── 6. Princess — holding a flower under a rainbow, castle behind ── */
  reg('v2/princess', f =>
    bg(f, 'sky') +
    arcBand(f, 'rainbow-1', 200, 262, 196, 172) +
    arcBand(f, 'rainbow-2', 200, 262, 172, 148) +
    arcBand(f, 'rainbow-3', 200, 262, 148, 124) +
    cloud(f, 'cloud-left', 2, 270, 0.9) +
    cloud(f, 'cloud-right', 318, 270, 0.9) +
    path(f, 'flag-left', 'M54 44 L90 58 L54 72 Z') +
    path(f, 'flag-right', 'M346 44 L382 58 L346 72 Z') +
    deco('<path d="M54 118 L54 40 M346 118 L346 40" stroke-width="6"/>') +
    rect(f, 'castle', 62, 196, 276, 150) +
    rect(f, 'tower-left', 22, 140, 64, 206) +
    rect(f, 'tower-right', 314, 140, 64, 206) +
    path(f, 'roof-left', 'M12 146 L54 74 L96 146 Z') +
    path(f, 'roof-right', 'M304 146 L346 74 L388 146 Z') +
    path(f, 'window-left', 'M38 224 L38 200 Q54 180 70 200 L70 224 Z') +
    path(f, 'window-right', 'M330 224 L330 200 Q346 180 362 200 L362 224 Z') +
    path(f, 'grass', 'M-10 334 Q200 298 410 334 L410 410 L-10 410 Z') +
    ax(f, 70, 104, 0.66, { accessory: 'crown', held: 'flower' }));

  /* ── 7. Treasure — holding a big coin in front of an overflowing chest ── */
  reg('v2/treasure', f =>
    bg(f) +
    seaweed(f, 'seaweed', 20, 330, 190) +
    group(f, 'bubbles', circles([[372, 40, 20], [346, 88, 14], [380, 128, 12]])) +
    path(f, 'sand', 'M-10 330 Q100 306 200 326 T410 320 L410 410 L-10 410 Z') +
    path(f, 'chest-lid', 'M196 238 L214 150 L382 150 L400 238 Z') +
    group(f, 'coins', circles([[236, 234, 22], [278, 222, 22], [320, 228, 22], [360, 236, 20]])) +
    poly(f, 'gem', '296,172 322,198 296,226 270,198') +
    rect(f, 'chest', 196, 238, 204, 112, 12) +
    rect(f, 'chest-band', 196, 276, 204, 22) +
    rect(f, 'lock', 282, 268, 32, 40, 7) +
    star(f, 'starfish', 348, 378, 24) +
    ax(f, 4, 96, 0.64, { held: 'coin' }));

  /* ── 8. Coral Reef — a waving grown-up and a baby on a brain coral, fish friends ── */
  reg('v2/coral', f =>
    bg(f) +
    fish(f, 'fish', 290, 76, 0.8, false) +
    fish(f, 'fish-2', 74, 50, 0.62, true) +
    path(f, 'coral', 'M212 344 L212 262 L178 214 L194 204 L218 242 L218 176 L236 176 L236 234 L258 198 L272 208 L240 264 L240 344 Z') +
    path(f, 'sand', 'M-10 336 Q120 312 240 332 T410 326 L410 410 L-10 410 Z') +
    path(f, 'brain-coral', 'M246 356 A76 58 0 0 1 398 356 Z') +
    deco('<path d="M268 340 Q284 322 300 338 T332 336 T364 334 M284 316 Q304 300 324 314 T356 312" stroke-width="5"/>') +
    group(f, 'anemone', [-60, -30, 0, 30, 60].map(a => `<rect x="-9" y="-58" width="18" height="58" rx="9" transform="translate(226 370) rotate(${a})"/>`)) +
    path(f, 'anemone-base', 'M186 382 A40 22 0 0 1 266 382 Z') +
    star(f, 'starfish', 110, 380, 24) +
    ax(f, 6, 104, 0.52, { pose: 'wave', simple: true }) +
    ax(f, 262, 184, 0.34, { prefix: 'baby-', simple: true }));

  /* ── 9. Village — waving in the square: cottages, bunting, fountain, sunshine ── */
  reg('v2/village', f =>
    bg(f, 'sky') +
    rays(f, 'sun-rays', 48, 46, 9, 32, 52) +
    circle(f, 'sun', 48, 46, 26) +
    cloud(f, 'cloud', 250, 70, 0.9) +
    path(f, 'grass', 'M-10 254 Q200 224 410 254 L410 410 L-10 410 Z') +
    region('square', f, '<ellipse cx="200" cy="360" rx="180" ry="40"/>') +
    rect(f, 'house-1', 14, 152, 112, 110) +
    poly(f, 'roof-1', '2,156 70,96 138,156') +
    path(f, 'door-1', 'M34 262 L34 222 A16 16 0 0 1 66 222 L66 262 Z') +
    circle(f, 'window-1', 98, 194, 17) +
    rect(f, 'house-2', 276, 142, 112, 120) +
    poly(f, 'roof-2', '264,146 332,86 400,146') +
    path(f, 'door-2', 'M346 262 L346 222 A16 16 0 0 1 378 222 L378 262 Z') +
    circle(f, 'window-2', 304, 186, 17) +
    deco('<path d="M70 104 Q200 146 332 94" stroke-width="4"/>') +
    group(f, 'bunting', [[110, 116], [155, 126], [200, 128], [245, 122], [290, 110]].map(([x, y]) => `<polygon points="${x - 14},${y - 3} ${x + 14},${y + 1} ${x},${y + 28}"/>`)) +
    ax(f, 96, 132, 0.56, { pose: 'wave', accessory: 'explorer', simple: true }) +
    region('fountain', f, '<ellipse cx="62" cy="362" rx="56" ry="20"/><rect x="10" y="322" width="104" height="40" rx="8"/>') +
    region('fountain-water', f, '<path d="M24 322 Q62 270 100 322 Z"/>') +
    region('flowers', f, circles([[350, 330, 14], [370, 344, 14], [362, 366, 14], [338, 366, 14], [330, 344, 14]]).join('')) +
    circle(f, 'flower-middle', 350, 350, 13));

  /* ── 10. Odyssey — lantern in hand, exploring a glowing cave ── */
  reg('v2/odyssey', f =>
    bg(f, 'cave') +
    path(f, 'rock-left', 'M-10 -10 L96 -10 Q42 150 72 340 L-10 340 Z') +
    path(f, 'rock-right', 'M410 -10 L304 -10 Q358 150 328 340 L410 340 Z') +
    path(f, 'rock-top', 'M-10 -10 L410 -10 L410 50 Q200 14 -10 50 Z') +
    path(f, 'root-1', 'M140 30 C132 70 156 96 142 138 C128 112 118 76 118 34 Z') +
    path(f, 'root-2', 'M262 28 C272 64 252 92 266 126 C248 116 238 72 240 30 Z') +
    group(f, 'glow', circles([[178, 74, 16], [222, 104, 14], [196, 44, 11]])) +
    path(f, 'floor', 'M-10 332 Q200 300 410 332 L410 410 L-10 410 Z') +
    region('pool', f, '<ellipse cx="200" cy="384" rx="110" ry="16"/>') +
    ax(f, 76, 112, 0.62, { accessory: 'explorer', held: 'lantern' }) +
    poly(f, 'crystal-1', '22,358 44,270 68,354') +
    poly(f, 'crystal-2', '56,358 86,252 112,352') +
    mushroom(f, 'mushroom-1', 340, 342, 36) +
    mushroom(f, 'mushroom-2', 382, 354, 28));

  /* ── legacy: Pass 1–6 placeholder pages ──
     Kept only so pictures finished on them still render; no longer offered in the gallery. */
  const LEGACY_SCENERY = {
    sand: f => path(f, 'sand', 'M-10 352 Q100 322 200 346 T410 338 L410 410 L-10 410 Z'),
    bubbles: f => circle(f, 'bubble-1', 346, 46, 26) + circle(f, 'bubble-2', 372, 110, 18),
    stars: f =>
      region('star-1', f, `<polygon points="${starPoints(46, 50, 32, 15, 5)}"/>`) +
      region('star-2', f, `<polygon points="${starPoints(356, 58, 26, 12, 5)}"/>`),
    chest: f => rect(f, 'chest', 14, 318, 104, 66, 8) + path(f, 'chest-lid', 'M14 322 Q14 278 66 278 Q118 278 118 322 Z'),
  };
  function legacyPage(spec) {
    return fills => {
      const sc = spec.scenery || [];
      let s = bg(fills);
      sc.filter(k => k === 'sand').forEach(k => { s += LEGACY_SCENERY[k](fills); });
      sc.filter(k => k !== 'sand' && k !== 'chest').forEach(k => { s += LEGACY_SCENERY[k](fills); });
      s += `<g class="hop" data-pivot="200 326"><g transform="translate(46 44) scale(0.77)">${axolotl(fills, { accessory: spec.accessory })}</g></g>`;
      if (sc.includes('chest')) s += LEGACY_SCENERY.chest(fills);
      return s;
    };
  }
  reg('placeholder/baby',      legacyPage({ scenery: ['bubbles'] }));
  reg('placeholder/explorer',  legacyPage({ accessory: 'explorer', scenery: ['sand'] }));
  reg('placeholder/pirate',    legacyPage({ accessory: 'pirate', scenery: ['sand', 'bubbles'] }));
  reg('placeholder/wizard',    legacyPage({ accessory: 'wizard', scenery: ['stars'] }));
  reg('placeholder/astronaut', legacyPage({ accessory: 'helmet', scenery: ['stars'] }));
  reg('placeholder/princess',  legacyPage({ accessory: 'crown', scenery: ['bubbles'] }));
  reg('placeholder/treasure',  legacyPage({ scenery: ['sand', 'chest', 'bubbles'] }));
  reg('placeholder/coral',     legacyPage({ accessory: 'glasses', scenery: ['sand', 'bubbles'] }));
  reg('placeholder/village',   legacyPage({ accessory: 'explorer', scenery: ['sand', 'stars'] }));
  reg('placeholder/odyssey',   legacyPage({ accessory: 'pirate', scenery: ['sand', 'chest'] }));
})();
