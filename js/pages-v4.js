/*
  v4 colouring pages — the first production batch in the selected house style
  (ART_PIPELINE.md, "Decision"): Premium Cute, drawn with the lab rig and the recurring cast.
    Easy      8-unit line, `simple` rig, few big regions            (Big Bubble, Jelly Hello)
    Medium    scenery 4 / characters 6 / detail 2.5, `mid` rig       (Treasure Map, Hide and Seek)
    Advanced  same line hierarchy, richer scenes, pinch-zoom assumed  (Shipwreck, Glow Parade)
  Every page hides Inky somewhere. Every page must pass its tier in js/audit.js
  (check with tools/workbench.html?set=v4). Keys are permanent: new artwork needs new keys.
*/
(function () {
  'use strict';
  const { starPoints, heartPath } = Art.kit;
  const { cast, peek } = LabArt;
  const { n, R, deco, bg, shine, bubbles, grp, eyeDot, paleEye, fish, lanternFish, crab, flowers, glowStalk, glowCap } = LabArt.kit;
  const reg = Art.registerPage;
  const INK = Art.INK;

  /* ── more of the kit ── */
  const star5 = (f, id, x, y, r) => R(f, id, `<polygon points="${starPoints(x, y, r, r * .5, 5)}"/>`) +
    deco(`<circle cx="${n(x - r * .2)}" cy="${n(y - r * .05)}" r="2" fill="${INK}" stroke="none"/><circle cx="${n(x + r * .2)}" cy="${n(y - r * .05)}" r="2" fill="${INK}" stroke="none"/><path d="M${n(x - r * .16)} ${n(y + r * .2)} Q${x} ${n(y + r * .34)} ${n(x + r * .16)} ${n(y + r * .2)}"/>`, 2.5, true);
  const shell = (f, id, x, y, w) => R(f, id, `<path d="M${x} ${y} C${x - 4} ${n(y - w * .8)} ${x + w} ${n(y - w * .8)} ${x + w} ${y} Q${n(x + w / 2)} ${n(y + w * .14)} ${x} ${y} Z"/>`) +
    deco([.25, .5, .75].map(k => `<path d="M${n(x + w / 2)} ${y + 2} L${n(x + w * k)} ${n(y - w * .5)}"/>`).join(''), 2.5);
  const sparkle4 = (list) => list.map(([x, y, r]) => `<polygon points="${starPoints(x, y, r, r * .36, 4)}"/>`);
  const twinkles = list => deco(list.map(([x, y]) => `<path d="M${x - 6} ${y} L${x + 6} ${y} M${x} ${y - 6} L${x} ${y + 6}"/>`).join(''), 2.5);

  // A round, scalloped bush (dense coral) sitting flat on the sand at `floor`.
  function bush(f, id, cx, cy, rx, ry, bumps, floor) {
    const pt = (t, k) => [n(cx + Math.cos(t) * rx * k), n(Math.min(floor, cy + Math.sin(t) * ry * k))];
    const t0 = Math.PI * 0.62, t1 = Math.PI * 2.38;          // skip the flat bottom
    let d = 'M' + pt(t0, 1).join(' ');
    for (let i = 1; i <= bumps; i++) {
      const a = t0 + (t1 - t0) * i / bumps, m = t0 + (t1 - t0) * (i - .5) / bumps;
      d += ` Q${pt(m, 1.2).join(' ')} ${pt(a, 1).join(' ')}`;
    }
    return R(f, id, `<path d="${d} Z"/>`);
  }
  // A friendly jellyfish: scalloped dome with a face, wavy ribbon tentacles (one region).
  // `w`: ribbon width — wider on small jellies so each ribbon still takes a fingertip.
  function jelly(f, id, x, y, s, lw, w) {
    w = w || 18;
    const xs = w > 24 ? [-42, -w / 2, 42 - w] : [-44, -18 - w / 4, 8 - w / 4, 44 - w];
    const tent = xs.map(x0 => `<path d="M${n(x0)} 0 C${n(x0 - 12)} 30 ${n(x0 + 14)} 54 ${n(x0)} 92 L${n(x0 + w)} 92 C${n(x0 + w + 14)} 54 ${n(x0 + w - 12)} 30 ${n(x0 + w)} 0 Z"/>`).join('');
    return grp(x, y, s, false, lw,
      R(f, id + '-tentacles', tent) +
      R(f, id, '<path d="M-62 6 C-64 -72 64 -72 62 6 C46 16 32 0 16 10 C0 0 -16 16 -30 6 C-44 16 -52 2 -62 6 Z"/>') +
      deco('<path d="M-40 -30 C-34 -46 -18 -54 -4 -54"/>', 3) +
      deco(eyeDot(-18, -20, 7) + eyeDot(18, -20, 7) + '<path d="M-9 -6 Q0 3 9 -6"/><path d="M-36 -8 l5 -5 M-30 -6 l5 -5 M30 -8 l5 -5 M36 -6 l5 -5" stroke-width="2.5"/>', 3.5, true));
  }
  // A curly octopus: round head, four rolling arms (one region).
  function octopus(f, x, y, s, lw) {
    const arms = '<path d="M-34 -8 C-62 16 -86 8 -86 -16 C-74 -10 -62 -14 -50 -28 Z"/><path d="M-14 0 C-20 36 -48 48 -64 34 C-48 30 -38 18 -38 -4 Z"/>' +
      '<path d="M14 0 C20 36 48 48 64 34 C48 30 38 18 38 -4 Z"/><path d="M34 -8 C62 16 86 8 86 -16 C74 -10 62 -14 50 -28 Z"/>';
    return grp(x, y, s, false, lw,
      R(f, 'octopus-arms', arms) +
      R(f, 'octopus', '<path d="M-46 -4 C-52 -74 52 -74 46 -4 C30 6 -30 6 -46 -4 Z"/>') +
      deco('<circle cx="-24" cy="-50" r="6"/><circle cx="26" cy="-56" r="4"/>', 2.5) +
      deco(paleEye(-16, -28, 10, 2) + paleEye(16, -28, 10, 2) + '<path d="M-8 -12 Q0 -6 8 -12"/>', 3.5, true));
  }
  const jellyRef = (id, c) => ({ [id]: c, [id + '-tentacles']: c });

  /* ─────────────────────────────── EASY ─────────────────────────────── */

  /* 1. Big Bubble — Sunny reaches for a giant bubble. Inky peeks over the rock. */
  reg('v4/big-bubble', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[44, 50, 22], [92, 26, 13], [372, 30, 15]], 4.5) +
    R(f, 'seaweed', '<path d="M8 330 C-12 280 26 246 6 196 C-4 170 10 140 30 128 C38 160 26 186 42 214 C62 256 36 292 56 330 Z"/>') +
    R(f, 'bubble', '<circle cx="334" cy="150" r="64"/>') +
    deco('<path d="M294 128 A46 46 0 0 1 332 98"/><path d="M368 188 A44 44 0 0 1 356 200"/>', 6) +
    R(f, 'sand', '<path d="M-10 330 C80 314 160 336 240 326 C310 318 360 312 410 320 L410 410 L-10 410 Z"/>') +
    peek(f, 326, 278, 0.5, 8, 0, 46) +
    R(f, 'rock', '<path d="M244 410 C240 360 262 326 318 318 C370 312 408 334 412 360 L412 410 Z"/>') +
    star5(f, 'starfish', 70, 370, 28) +
    shell(f, 'shell', 150, 386, 52) +
    cast(f, { who: 'sunny', x: -26, y: 130, s: 0.78, pose: 'reach', tail: 'wave', mouth: 'grin', look: 'up', simple: true, lw: 8, rig: { held: null } }) +
    '</g>');

  /* 2. Jelly Hello — Penny high-fives a jellyfish. Inky peeks over the sand dune. */
  reg('v4/jelly-hello', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[40, 40, 18], [84, 82, 12], [176, 30, 14]], 4.5) +
    jelly(f, 'jelly', 300, 122, 1.15, 8, 30) +
    R(f, 'sand', '<path d="M-10 334 C80 318 160 338 240 330 C310 324 360 318 410 324 L410 410 L-10 410 Z"/>') +
    peek(f, 346, 290, 0.5, 8, 0, 46) +
    R(f, 'dune', '<path d="M236 410 C246 352 312 326 410 334 L410 410 Z"/>') +
    star5(f, 'starfish', 186, 378, 26) +
    cast(f, { who: 'penny', x: -6, y: 154, s: 0.66, pose: 'reach', tail: 'swish', mouth: 'grin', look: 'up', simple: true, lw: 8 }) +
    '</g>');

  /* ─────────────────────────────── MEDIUM ─────────────────────────────── */

  /* 3. Treasure Map — Pip studies the map, Penny swims in to look. Inky is behind the signpost. */
  reg('v4/treasure-map', f =>
    `<g stroke-width="4">` +
    bg(f) +
    R(f, 'far-kelp', '<path d="M150 300 C140 240 166 190 150 120 C170 160 182 220 172 300 Z"/><path d="M214 300 C222 250 200 210 214 150 C232 200 238 250 232 300 Z"/>') +
    bubbles(f, 'bubbles', [[372, 40, 13], [352, 74, 9], [384, 100, 7]], 2.5) +
    R(f, 'sand', '<path d="M-10 298 C90 284 200 304 300 296 C350 292 390 288 410 294 L410 410 L-10 410 Z"/>') +
    deco('<path d="M30 330 q14 -6 28 0 M300 370 q14 -6 28 0 M20 392 q14 -6 28 0"/>', 2.5) +
    peek(f, 334, 132, 0.44, 4) +
    R(f, 'post', '<path d="M330 316 L334 166 L350 166 L348 316 Z"/>') +
    R(f, 'sign-1', '<path d="M286 172 L372 166 L398 190 L374 214 L288 218 Z"/>') + deco('<path d="M300 186 L362 182 M302 200 L356 198"/>', 2.5) +
    R(f, 'sign-2', '<path d="M300 236 L384 232 L386 268 L302 272 L280 254 Z"/>') + deco('<path d="M306 250 L370 246"/>', 2.5) +
    R(f, 'chest', '<path d="M346 322 C346 296 404 296 404 322 Z"/>') + deco('<path d="M360 302 L362 322 M388 302 L386 322"/>', 2.5) +
    R(f, 'map', '<path d="M126 352 C150 340 248 340 270 350 L262 394 C238 384 152 384 132 396 Z"/>') +
    deco('<path d="M146 382 Q170 356 196 374 T244 360" stroke-dasharray="2 9" stroke-width="4"/><path d="M238 352 L252 366 M252 352 L238 366" stroke-width="4"/><path d="M152 364 C156 354 172 354 176 362 C170 368 158 370 152 364 Z"/>', 2.5) +
    R(f, 'map-rolls', '<rect x="114" y="346" width="18" height="54" rx="9" transform="rotate(-8 123 373)"/><rect x="262" y="342" width="18" height="54" rx="9" transform="rotate(6 271 369)"/>') +
    star5(f, 'starfish', 44, 368, 22) +
    shell(f, 'shell', 296, 396, 40) +
    cast(f, { who: 'penny', pre: 'penny-', x: -20, y: 40, s: 0.48, pose: 'swim', tail: 'swish', mouth: 'grin', look: 'down', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'pip', pre: 'pip-', x: 52, y: 166, s: 0.54, pose: 'reach', tail: 'wave', mouth: 'wow', look: 'down', detail: 'mid', lw: 6 }) +
    '</g>');

  /* 4. Hide and Seek — Sunny counts against the rock; Pip "hides" behind the coral with their
        tail showing; Inky has found the best spot of all, inside the old pot. */
  reg('v4/hide-and-seek', f =>
    `<g stroke-width="4">` +
    bg(f) +
    bubbles(f, 'bubbles', [[330, 40, 12], [360, 66, 8], [306, 74, 7]], 2.5) +
    R(f, 'rock', '<path d="M-10 316 L-10 90 C10 56 70 44 106 66 C134 84 144 130 142 180 C140 240 132 290 136 316 Z"/>') +
    deco('<path d="M30 130 q12 -6 22 2 M70 230 q10 8 22 0 M20 280 l12 -6 M96 90 l10 6"/>', 2.5) +
    R(f, 'sand', '<path d="M-10 306 C90 292 200 312 300 304 C350 300 390 296 410 302 L410 410 L-10 410 Z"/>') +
    deco('<path d="M150 300 q14 -6 28 0 M300 386 q14 -6 28 0 M80 392 q14 -6 28 0"/>', 2.5) +
    R(f, 'seaweed', '<path d="M378 304 C358 260 388 230 370 190 C392 214 400 250 392 304 Z"/>') +
    // Pip "hides" behind the coral bush: face out one side, tail out the other
    cast(f, { who: 'pip', pre: 'pip-', x: 150, y: 166, s: 0.6, flip: true, pose: 'stand', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6, omit: ['body', 'bag'] }) +
    bush(f, 'coral', 292, 254, 62, 58, 11, 304) +
    deco('<circle cx="262" cy="210" r="5"/><circle cx="304" cy="194" r="4"/><circle cx="322" cy="240" r="5"/><circle cx="276" cy="266" r="4"/><circle cx="310" cy="284" r="5"/><circle cx="248" cy="248" r="4"/>', 2.5) +
    peek(f, 196, 290, 0.46, 4, 0, 40) +
    R(f, 'pot', '<path d="M162 400 C134 386 128 344 154 326 L166 318 L166 310 L226 310 L226 318 L238 326 C264 344 258 386 230 400 Z"/>') +
    deco('<path d="M146 352 C134 346 132 332 144 326 M246 352 C258 346 260 332 248 326 M156 364 L236 364" stroke-width="3"/>', 3) +
    shell(f, 'shell', 30, 380, 44) +
    star5(f, 'starfish', 360, 364, 22) +
    // Sunny counts, face to the rock, eyes shut
    cast(f, { who: 'sunny', pre: 'sunny-', x: 132, y: 40, s: 0.5, flip: true, pose: 'stand', tail: 'wave', mouth: 'smile', eyes: 'closed', detail: 'mid', lw: 6, rig: { held: null } }) +
    '</g>');

  /* ─────────────────────────────── ADVANCED ─────────────────────────────── */

  /* 5. Shipwreck — Pip and a lantern fish explore an old wreck; old coins drift to Penny
        (copper axolotls draw metal to them, as in Axolotl Odyssey). Inky is in a porthole. */
  reg('v4/shipwreck', f =>
    `<g stroke-width="4">` +
    bg(f) +
    deco('<path d="M60 -10 L150 230 M120 -10 L196 190" stroke-dasharray="26 14"/>', 2.5) +
    R(f, 'mast', '<path d="M276 160 L304 20 L320 24 L294 162 Z"/>') +
    R(f, 'sail', '<path d="M302 40 C340 56 360 80 352 116 L336 104 L326 122 L314 106 L298 110 Z"/>') +
    R(f, 'flag', '<path d="M306 26 C320 16 330 34 346 24 L342 44 C328 52 318 36 304 44 Z"/>') +
    R(f, 'hull', '<path d="M150 318 L160 196 C230 170 330 152 414 140 L414 318 Z"/>') +
    deco('<path d="M160 230 C240 206 330 190 414 178 M158 268 C240 246 330 232 414 220 M156 300 C240 284 330 270 414 262"/><path d="M220 196 l4 30 M300 180 l4 30 M380 166 l4 30 M260 232 l4 34 M350 214 l4 34"/>', 2.5) +
    R(f, 'rail', '<path d="M156 196 C230 168 330 150 414 138 L414 124 C330 136 230 154 158 182 Z"/>') +
    R(f, 'porthole', '<circle cx="232" cy="252" r="22"/>') + deco(shine(232, 252, 22) + '<circle cx="232" cy="252" r="28"/>', 3) +
    R(f, 'inky-peek', '<circle cx="332" cy="232" r="24"/>') + deco('<circle cx="332" cy="232" r="30"/>', 3) +
    deco(paleEye(322, 232, 8, -2) + paleEye(342, 232, 8, -2), 3, true) +
    octopus(f, 380, 126, 0.58, 4) +
    R(f, 'sand', '<path d="M-10 312 C90 296 200 318 300 308 C350 304 390 300 410 306 L410 410 L-10 410 Z"/>') +
    deco('<path d="M30 380 q14 -6 28 0 M230 392 q14 -6 28 0"/>', 2.5) +
    `<g transform="translate(76 0)">` + R(f, 'anchor', '<path d="M98 290 L110 290 L110 360 C126 358 138 346 140 332 L132 332 L146 318 L156 336 L148 334 C144 360 126 376 104 378 C82 376 64 360 60 334 L52 336 L62 318 L76 332 L68 332 C70 346 82 358 98 360 Z"/>') +
    R(f, 'anchor-ring', '<circle cx="104" cy="278" r="15"/>') + '</g>' +
    R(f, 'barrel', '<path d="M330 386 C318 362 318 330 330 306 L384 306 C396 330 396 362 384 386 Z"/>') + deco('<path d="M324 326 L390 326 M324 366 L390 366"/>', 3) +
    R(f, 'coins', [[256, 346, 12], [284, 330, 12], [310, 352, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)) +
    deco('<path d="M240 340 l-14 -2 M268 326 l-14 -2 M294 354 l-14 -2"/>', 2.5) +
    R(f, 'seaweed', '<path d="M6 312 C-8 270 18 240 4 200 C22 222 30 262 26 312 Z"/><path d="M30 312 C24 280 40 260 36 230 C52 250 54 286 48 312 Z"/>') +
    crab(f, 360, 392, 0.34, 4) +
    lanternFish(f, 226, 104, 0.46, false, 4) +
    cast(f, { who: 'pip', pre: 'pip-', x: -4, y: 92, s: 0.5, rot: -4, pose: 'swim', tail: 'swish', mouth: 'wow', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'penny', pre: 'penny-', x: 30, y: 270, s: 0.42, pose: 'reach', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6 }) +
    '</g>');

  /* 6. Glow Parade — night on the reef. Sunny's pearl leads the way, Pip and Penny follow,
        jellyfish glow like lanterns. Inky is in the dark crack in the rock. */
  reg('v4/glow-parade', f =>
    `<g stroke-width="4">` +
    bg(f) +
    deco('<circle cx="40" cy="120" r="2" fill="' + INK + '" stroke="none"/><circle cx="130" cy="40" r="2" fill="' + INK + '" stroke="none"/><circle cx="210" cy="150" r="2" fill="' + INK + '" stroke="none"/><circle cx="380" cy="230" r="2" fill="' + INK + '" stroke="none"/><circle cx="260" cy="28" r="2" fill="' + INK + '" stroke="none"/>', 2) +
    twinkles([[90, 70], [176, 104], [360, 160]]) +
    jelly(f, 'jelly-1', 54, 52, 0.44, 4, 30) + jelly(f, 'jelly-2', 226, 44, 0.5, 4, 30) + jelly(f, 'jelly-3', 356, 76, 0.42, 4, 30) +
    R(f, 'rock', '<path d="M260 330 C250 280 280 236 330 230 C380 226 414 252 414 280 L414 330 Z"/>') +
    R(f, 'inky-peek-gills', LabArt.frond(318, 262, 248, 28, 16, 0, 4) + LabArt.frond(330, 260, 272, 28, 16, 0, 4) + LabArt.frond(342, 262, 296, 28, 16, 0, 4)) +
    R(f, 'crack', '<path d="M300 300 C302 276 314 262 330 262 C346 262 360 276 362 300 C344 294 318 294 300 300 Z"/>') +
    deco(paleEye(320, 282, 8, 2) + paleEye(342, 282, 8, 2), 3, true) +
    R(f, 'sand', '<path d="M-10 322 C90 306 200 330 300 320 C350 316 390 312 410 318 L410 410 L-10 410 Z"/>') +
    R(f, 'anemone', [-56, -28, 0, 28, 56].map(a => `<path d="M-8 0 C-12 -30 -6 -50 0 -60 C6 -50 12 -30 8 0 Z" transform="translate(70 352) rotate(${a})"/>`)) +
    R(f, 'anemone-base', '<path d="M34 362 C36 340 104 340 106 362 Z"/>') +
    deco('<circle cx="70" cy="282" r="4"/><circle cx="20" cy="304" r="4"/><circle cx="120" cy="304" r="4"/>', 2.5) +
    R(f, 'tubes', '<path d="M150 360 L154 300 L170 300 L168 360 Z"/><path d="M174 360 L180 284 L196 284 L192 360 Z"/><path d="M198 360 L204 310 L218 310 L216 360 Z"/>') +
    R(f, 'tube-tips', '<ellipse cx="162" cy="300" rx="11" ry="6"/><ellipse cx="188" cy="284" rx="11" ry="6"/><ellipse cx="211" cy="310" rx="10" ry="6"/>') +
    R(f, 'brain-coral', '<path d="M250 372 C248 342 290 330 316 334 C344 338 362 352 360 372 Z"/>') +
    deco('<path d="M262 362 C270 348 280 358 288 346 C296 336 306 352 314 342 C322 334 334 348 342 356"/>', 2.5) +
    flowers(f, 'flowers', [[36, 390, 11], [384, 378, 12]]) +
    star5(f, 'starfish', 120, 386, 18) +
    cast(f, { who: 'penny', pre: 'penny-', x: -10, y: 186, s: 0.38, rot: -10, pose: 'swim', tail: 'wave', mouth: 'smile', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'pip', pre: 'pip-', x: 92, y: 136, s: 0.42, rot: -10, pose: 'swim', tail: 'swish', mouth: 'wow', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'sunny', pre: 'sunny-', x: 196, y: 92, s: 0.44, rot: -8, pose: 'reach', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6 }) +
    deco('<circle cx="356" cy="188" r="30" stroke-dasharray="4 8"/><circle cx="356" cy="188" r="44" stroke-dasharray="3 12"/>', 2.5) +
    '</g>');


  /* ═══════════════════════════ batch 2 ═══════════════════════════ */

  const zzz = (x, y) => deco([[0, 0, 12], [22, -26, 16], [50, -60, 20]].map(([dx, dy, k]) =>
    `<path d="M${x + dx} ${y + dy} l${k} 0 l${-k} ${n(k * 1.1)} l${k} 0"/>`).join(''), 5);
  const ribbonSeaweed = (f, id, x, flip) => R(f, id, `<path d="M${x} 330 C${x - 20} 280 ${x + 14} 240 ${x - 4} 190 C${x - 14} 160 ${x} 130 ${x + 18} 118 C${x + 26} 150 ${x + 16} 176 ${x + 30} 206 C${x + 50} 250 ${x + 24} 290 ${x + 42} 330 Z"${flip ? ` transform="translate(${2 * x + 22} 0) scale(-1 1)"` : ''}/>`);
  const sandAt = (f, y) => R(f, 'sand', `<path d="M-10 ${y} C80 ${y - 14} 160 ${y + 6} 240 ${y - 2} C310 ${y - 8} 360 ${y - 14} 410 ${y - 8} L410 410 L-10 410 Z"/>`);

  /* 7. Sweet Dreams (Easy) — Pip asleep in a leaf hammock. Inky peeks over the sand mound. */
  reg('v4/sweet-dreams', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[150, 40, 14], [182, 66, 9], [240, 30, 11]], 4.5) +
    ribbonSeaweed(f, 'seaweed-left', 22) + ribbonSeaweed(f, 'seaweed-right', 356, true) +
    deco('<path d="M44 186 L30 150 M356 186 L370 150"/>', 6) +
    R(f, 'hammock', '<path d="M40 182 C110 306 290 306 360 182 C296 262 104 262 40 182 Z"/>') +
    deco('<path d="M92 230 Q100 246 112 252 M200 262 L200 276 M290 246 Q300 240 308 230"/>', 3.5) +
    sandAt(f, 340) +
    peek(f, 112, 304, 0.5, 8, 0, 46) +
    R(f, 'mound', '<path d="M20 410 C28 356 86 334 146 340 C196 346 220 380 222 410 Z"/>') +
    star5(f, 'starfish', 330, 376, 26) +
    shell(f, 'shell', 240, 394, 48) +
    cast(f, { who: 'pip', x: 82, y: 100, s: 0.6, pose: 'stand', tail: 'wave', mouth: 'smile', eyes: 'closed', simple: true, lw: 8 }) +
    zzz(318, 112) +
    '</g>');

  /* 8. Puffer Surprise (Easy) — a pufferfish puffs up right in front of Penny. Inky hides behind the coral. */
  function puffer(f, x, y, r, lw) {
    // short spikes all round, a big tail fin and a top fin, and spots — a fish, not a sun
    const spikes = Array.from({ length: 12 }, (_, i) => {
      const a = (i + 0.5) / 12 * Math.PI * 2, c = Math.cos(a), s2 = Math.sin(a);
      if (c > 0.75) return '';                                   // no spikes where the tail joins
      return `M${n(x + c * (r + 3))} ${n(y + s2 * (r + 3))} L${n(x + c * (r + 13))} ${n(y + s2 * (r + 13))}`;
    }).join(' ');
    return deco(`<path d="${spikes}"/>`, 6) +
      R(f, 'puffer-fins', `<path d="M${x + r - 10} ${y - 4} C${x + r + 30} ${y - 54} ${x + r + 52} ${y - 40} ${x + r + 46} ${y - 14} C${x + r + 42} ${y} ${x + r + 42} ${y + 6} ${x + r + 46} ${y + 20} C${x + r + 52} ${y + 46} ${x + r + 30} ${y + 56} ${x + r - 10} ${y + 10} Z"/>` +
        `<path d="M${x - 10} ${y - r + 6} C${x - 4} ${y - r - 30} ${x + 30} ${y - r - 30} ${x + 36} ${y - r + 14} Z"/>`) +
      R(f, 'puffer', `<circle cx="${x}" cy="${y}" r="${r}"/>`) +
      deco(`<circle cx="${x + 30}" cy="${y - 34}" r="6"/><circle cx="${x + 46}" cy="${y - 6}" r="5"/><circle cx="${x + 20}" cy="${y + 44}" r="6"/><circle cx="${x + 44}" cy="${y + 26}" r="4"/><circle cx="${x - 6}" cy="${y + 54}" r="4"/>` +
        `<path d="M${x + 4} ${y + 12} C${x + 20} ${y + 32} ${x + 38} ${y + 30} ${x + 40} ${y + 14}"/>`, 3.5) +
      deco(paleEye(x - 34, y - 16, 15, -3) + paleEye(x - 2, y - 20, 13, -3) +
        `<ellipse cx="${x - 30}" cy="${y + 22}" rx="7" ry="9" fill="${INK}" stroke="none"/><path d="M${x - 60} ${y + 8} l6 -6 M${x - 52} ${y + 10} l6 -6"/>`, 4, true);
  }
  reg('v4/puffer', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[190, 40, 14], [222, 22, 9], [40, 50, 12]], 4.5) +
    ribbonSeaweed(f, 'seaweed', 8) +
    puffer(f, 284, 180, 70, 8) +
    sandAt(f, 336) +
    peek(f, 338, 284, 0.5, 8, 0, 46) +
    bush(f, 'coral', 340, 372, 58, 42, 9, 410) +
    star5(f, 'starfish', 60, 376, 26) +
    shell(f, 'shell', 150, 392, 48) +
    cast(f, { who: 'penny', x: -28, y: 146, s: 0.64, pose: 'stand', tail: 'swish', mouth: 'wow', simple: true, lw: 8 }) +
    '</g>');

  /* 9. Picnic (Medium) — Sunny and Penny share tea and cupcakes. Inky is in the picnic basket. */
  const quad = pts => `<polygon points="${pts.map(p => p.join(',')).join(' ')}"/>`;
  reg('v4/picnic', f =>
    `<g stroke-width="4">` +
    bg(f) +
    deco('<path d="M40 -10 L120 220 M110 -10 L176 180" stroke-dasharray="26 14"/>', 2.5) +
    R(f, 'far-kelp', '<path d="M118 300 C108 240 134 190 118 120 C138 160 150 220 140 300 Z"/><path d="M280 300 C288 250 266 210 280 150 C298 200 304 250 298 300 Z"/>') +
    fish(f, 'fish', 326, 72, 0.62, true, 4) +
    bubbles(f, 'bubbles', [[60, 50, 12], [84, 80, 8], [52, 100, 6]], 2.5) +
    sandAt(f, 300) +
    R(f, 'blanket-a', quad([[80, 316], [200, 316], [200, 350], [50, 350]]) + quad([[200, 350], [350, 350], [380, 384], [200, 384]])) +
    R(f, 'blanket-b', quad([[200, 316], [320, 316], [350, 350], [200, 350]]) + quad([[50, 350], [200, 350], [200, 384], [20, 384]])) +
    cast(f, { who: 'sunny', pre: 'sunny-', x: -30, y: 200, s: 0.5, pose: 'stand', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6, rig: { held: null } }) +
    cast(f, { who: 'penny', pre: 'penny-', x: 232, y: 200, s: 0.5, flip: true, pose: 'stand', tail: 'swish', mouth: 'smile', detail: 'mid', lw: 6 }) +
    R(f, 'teapot', '<path d="M178 330 C168 304 184 286 206 286 C228 286 244 304 234 330 Z"/><path d="M180 314 C166 310 160 298 154 288 L146 294 C152 310 162 324 178 326 Z"/>') +
    deco('<path d="M234 302 C250 300 252 320 236 322"/>', 4) +
    R(f, 'teapot-lid', '<path d="M184 292 C186 266 226 266 228 292 Z"/>') + deco('<circle cx="206" cy="264" r="6"/>', 3) +
    peek(f, 100, 318, 0.42, 4, 0, 40) +
    R(f, 'basket', '<path d="M58 352 L142 352 L132 400 L68 400 Z"/>') +
    deco('<path d="M62 368 L138 368 M66 384 L134 384 M84 352 L82 400 M100 352 L100 400 M116 352 L118 400" stroke-width="2.5"/>', 2.5) +
    R(f, 'basket-lid', '<path d="M54 352 C54 326 146 326 146 352 Z" transform="rotate(-24 146 352)"/>') +
    R(f, 'cupcakes', '<path d="M252 368 L284 368 L280 396 L256 396 Z"/><path d="M300 360 L332 360 L328 388 L304 388 Z"/>') +
    deco('<path d="M262 370 L264 394 M272 370 L272 394 M310 362 L312 386 M320 362 L320 386"/>', 2.5) +
    R(f, 'frosting', '<path d="M248 370 C244 350 258 338 268 338 C278 338 292 350 288 370 Z"/><path d="M296 362 C292 342 306 330 316 330 C326 330 340 342 336 362 Z"/>') +
    deco('<circle cx="268" cy="334" r="5"/><circle cx="316" cy="326" r="5"/>', 3) +
    '</g>');

  /* 10. New Home (Medium) — Sunny helps a hermit crab choose a bigger shell. One is taken: Inky's inside. */
  function hermit(f, x, y, s, lw) {
    return grp(x, y, s, false, lw,
      R(f, 'hermit-claws', '<path d="M-40 -18 C-66 -24 -72 2 -54 10 L-44 0 L-40 12 C-26 8 -26 -10 -40 -18 Z"/>') +
      R(f, 'hermit', '<path d="M8 -6 C-8 -2 -34 -6 -40 -22 C-32 -36 -12 -34 6 -28 Z"/>') +
      deco('<path d="M-22 -30 L-28 -52 M-12 -30 L-12 -54 M-30 -8 l-14 14 M-18 -6 l-10 16"/>' + paleEye(-29, -56, 7, -2) + paleEye(-12, -58, 7, -2), 3.5, true) +
      R(f, 'hermit-shell', '<path d="M0 2 C-6 -42 30 -66 58 -50 C78 -38 76 -8 60 2 Z"/>') +
      deco('<path d="M36 -10 C28 -12 26 -26 36 -28 C48 -30 52 -14 42 -6 C26 4 14 -14 18 -30 C24 -48 52 -50 62 -32"/>', 3));
  }
  reg('v4/new-home', f =>
    `<g stroke-width="4">` +
    bg(f) +
    deco('<path d="M260 -10 L330 200 M320 -10 L372 150" stroke-dasharray="26 14"/>', 2.5) +
    bubbles(f, 'bubbles', [[40, 40, 12], [64, 66, 8], [30, 92, 7]], 2.5) +
    R(f, 'rock', '<path d="M250 304 C246 244 296 212 348 216 C388 220 414 250 414 304 Z"/>') +
    deco('<path d="M290 250 q12 -6 22 2 M370 240 q-10 8 -4 18"/>', 2.5) +
    ribbonSeaweed(f, 'seaweed', 380) +
    sandAt(f, 302) +
    deco('<path d="M30 340 q14 -6 28 0 M180 392 q14 -6 28 0"/>', 2.5) +
    hermit(f, 236, 352, 1.15, 4) +
    R(f, 'conch', '<path d="M296 382 C290 352 316 334 344 342 C358 346 366 360 356 374 C346 388 306 394 296 382 Z"/>') +
    deco('<path d="M344 342 L330 384 M352 352 L320 386 M316 340 C326 352 336 360 356 364"/>', 2.5) +
    R(f, 'snail-shell', '<circle cx="384" cy="380" r="24"/>') +
    deco('<path d="M386 380 C386 374 378 374 378 381 C378 390 394 390 394 379 C394 364 370 364 370 382 C370 398 398 400 400 380"/>', 2.5) +
    R(f, 'big-shell', '<path d="M88 396 C76 352 106 318 150 324 C190 330 202 372 184 396 Z"/>') +
    deco('<path d="M138 362 L104 336 M138 360 L126 326 M138 360 L152 326 M138 360 L178 340"/>', 2.5) +
    R(f, 'inky-peek', '<ellipse cx="138" cy="378" rx="30" ry="18"/>') +
    deco(paleEye(126, 378, 9, 3) + paleEye(150, 378, 9, 3), 3, true) +
    star5(f, 'starfish', 36, 380, 22) +
    cast(f, { who: 'pip', pre: 'pip-', x: 196, y: 24, s: 0.52, flip: true, pose: 'swim', tail: 'swish', mouth: 'wow', look: 'down', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'sunny', pre: 'sunny-', x: -14, y: 136, s: 0.52, pose: 'reach', tail: 'wave', mouth: 'smile', detail: 'mid', lw: 6, rig: { held: null } }) +
    '</g>');

  /* 11. The Old Temple (Advanced) — ruins with a giant stone axolotl. A golden key drifts to Penny
         (copper draws metal, as in Axolotl Odyssey); Pip swims in. Inky is behind the broken column. */
  function column(f, id, x, top, w) {
    return R(f, id, `<path d="M${x + 4} 322 L${x + 8} ${top + 18} L${x + w - 8} ${top + 18} L${x + w - 4} 322 Z"/>`) +
      deco(`<path d="M${x + w * .33} ${top + 26} L${x + w * .33} 316 M${x + w * .66} ${top + 26} L${x + w * .66} 316"/>`, 2.5) +
      R(f, id + '-top', `<path d="M${x - 6} ${top + 18} L${x + w + 6} ${top + 18} L${x + w + 2} ${top} L${x - 2} ${top} Z"/>`);
  }
  reg('v4/temple', f =>
    `<g stroke-width="4">` +
    bg(f) +
    deco('<path d="M150 -10 L230 220 M210 -10 L276 170" stroke-dasharray="26 14"/>', 2.5) +
    R(f, 'far-rocks', '<path d="M-10 236 C40 206 80 220 120 202 C160 186 200 200 240 188 L240 330 L-10 330 Z"/>') +
    bubbles(f, 'bubbles', [[230, 40, 11], [254, 64, 7]], 2.5) +
    column(f, 'column', 30, 112, 52) +
    R(f, 'leaves', '<path d="M60 160 C76 144 96 148 100 158 C86 164 74 166 60 160 Z"/><path d="M52 220 C36 206 18 210 14 220 C28 226 40 226 52 220 Z"/><path d="M64 270 C80 256 98 260 102 270 C88 276 76 278 64 270 Z"/>') +
    deco('<path d="M56 140 C80 170 34 190 58 220 C80 246 40 260 62 290"/>', 3) +
    peek(f, 168, 186, 0.4, 4, 0, 40) +
    R(f, 'broken-column', '<path d="M146 322 L150 214 L160 204 L168 216 L178 202 L188 212 L192 322 Z"/>') +
    deco('<path d="M162 224 L162 316 M176 222 L176 316 M150 260 l10 -6"/>', 2.5) +
    R(f, 'statue-gills', [[268, 196, 220, 70], [262, 226, 196, 64], [384, 196, 320, 70], [390, 226, 344, 64]].map(([x, y, a, l]) => LabArt.frond(x, y, a, l, 30, 0, 5)).join('')) +
    R(f, 'statue-head', '<path d="M260 270 C252 210 288 168 326 168 C364 168 400 210 392 270 Z"/>') +
    deco('<circle cx="300" cy="222" r="12"/><circle cx="352" cy="222" r="12"/><path d="M300 252 Q326 268 352 252"/><path d="M276 196 l10 10 l-4 12 M376 244 l-10 6"/>', 3) +
    R(f, 'pedestal', '<path d="M240 330 L248 270 L404 270 L412 330 Z"/>') +
    deco('<path d="M262 290 L392 290"/>', 2.5) +
    R(f, 'sand', '<path d="M-10 322 C60 312 140 326 214 320 L214 410 L-10 410 Z"/>') +
    deco('<path d="M30 360 q14 -6 28 0 M120 392 q14 -6 28 0"/>', 2.5) +
    R(f, 'step-1', '<path d="M228 330 L412 330 L412 352 L222 352 Z"/>') +
    R(f, 'step-2', '<path d="M216 352 L412 352 L412 376 L208 376 Z"/>') +
    R(f, 'step-3', '<path d="M200 376 L412 376 L412 412 L190 412 Z"/>') +
    R(f, 'key', '<circle cx="232" cy="300" r="14"/><path d="M244 306 L290 322 L286 332 L276 328 L272 338 L264 336 L266 326 L240 316 Z"/>') +
    deco('<circle cx="232" cy="300" r="6"/><path d="M212 292 l-12 -4 M214 308 l-12 2"/>', 2.5) +
    fish(f, 'fish-1', 326, 66, 0.54, true, 4) + fish(f, 'fish-2', 262, 126, 0.52, true, 4) +
    cast(f, { who: 'pip', pre: 'pip-', x: -12, y: 16, s: 0.46, rot: 6, pose: 'swim', tail: 'swish', mouth: 'wow', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'penny', pre: 'penny-', x: 6, y: 228, s: 0.44, pose: 'reach', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6 }) +
    '</g>');

  /* 12. Party (Advanced) — it's Sunny's birthday! A cake with glowing candles, presents, balloons.
         Inky is hiding in the present with the lid off. */
  function bunting(f) {
    const pt = t => [n(-10 + 420 * t), n(14 + 4 * 40 * t * (1 - t))];
    const flags = [0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.94].map(t => { const [x, y] = pt(t); return `<path d="M${x - 18} ${y} L${x + 18} ${y + 2} L${x} ${y + 34} Z"/>`; });
    return deco('<path d="M-10 14 Q200 94 410 14"/>', 3) + R(f, 'flags-a', flags.filter((_, i) => i % 2 === 0)) + R(f, 'flags-b', flags.filter((_, i) => i % 2));
  }
  reg('v4/party', f =>
    `<g stroke-width="4">` +
    bg(f) +
    bunting(f) +
    deco('<path d="M56 154 C60 200 50 250 64 330 M100 134 C96 200 104 260 92 330 M352 140 C346 210 356 260 340 326"/>', 2.5) +
    R(f, 'balloon-1', '<path d="M56 154 C30 150 26 110 50 98 C74 88 90 120 74 142 C68 150 62 154 56 154 Z"/>') +
    R(f, 'balloon-2', '<path d="M100 134 C76 130 72 92 94 80 C118 70 134 100 118 122 C112 130 106 134 100 134 Z"/>') +
    R(f, 'balloon-3', '<path d="M352 140 C326 136 322 96 346 84 C370 74 386 106 370 128 C364 136 358 140 352 140 Z"/>') +
    deco(shine(52, 120, 18) + shine(96, 102, 18) + shine(348, 108, 18), 3) +
    sandAt(f, 318) +
    R(f, 'table', '<path d="M118 340 C112 306 130 294 200 294 C270 294 288 306 282 340 Z"/>') +
    R(f, 'cake', '<path d="M146 296 L146 248 C146 240 254 240 254 248 L254 296 Z"/>') +
    R(f, 'cake-top', '<path d="M166 246 L166 212 C166 206 234 206 234 212 L234 246 Z"/>') +
    R(f, 'frosting', '<path d="M160 216 C160 200 240 200 240 216 C234 228 226 216 220 228 C212 238 204 222 196 232 C188 240 182 224 174 230 C166 234 162 226 160 216 Z"/>') +
    deco('<path d="M150 270 C170 262 186 278 206 268 C226 258 238 276 250 268"/><circle cx="168" cy="282" r="4"/><circle cx="232" cy="284" r="4"/><circle cx="200" cy="286" r="4"/>', 2.5) +
    R(f, 'candles', '<rect x="176" y="176" width="12" height="30" rx="4"/><rect x="194" y="170" width="12" height="36" rx="4"/><rect x="212" y="176" width="12" height="30" rx="4"/>') +
    R(f, 'flames', [[182, 166], [200, 160], [218, 166]].map(([x, y]) => `<path d="M${x} ${y - 16} C${x + 10} ${y - 4} ${x + 9} ${y + 6} ${x} ${y + 8} C${x - 9} ${y + 6} ${x - 10} ${y - 4} ${x} ${y - 16} Z"/>`)) +
    cast(f, { who: 'penny', pre: 'penny-', x: 124, y: 44, s: 0.38, rot: 10, pose: 'swim', tail: 'swish', mouth: 'grin', look: 'down', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'pip', pre: 'pip-', x: -30, y: 176, s: 0.46, pose: 'stand', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'sunny', pre: 'sunny-', x: 246, y: 162, s: 0.46, flip: true, pose: 'stand', tail: 'wave', mouth: 'wow', detail: 'mid', lw: 6, rig: { held: null, hat: 'party' } }) +
    R(f, 'present-1', '<rect x="14" y="334" width="84" height="60" rx="5"/>') +
    R(f, 'ribbon-1', '<path d="M48 334 L64 334 L64 394 L48 394 Z"/><path d="M56 334 C40 312 24 322 36 334 Z M56 334 C72 312 88 322 76 334 Z"/>') +
    peek(f, 346, 322, 0.44, 4, 0, 40) +
    R(f, 'present-2', '<rect x="300" y="340" width="92" height="58" rx="5"/>') +
    deco('<path d="M300 362 L392 362"/>', 3) +
    R(f, 'present-2-lid', '<rect x="292" y="320" width="108" height="20" rx="5" transform="rotate(28 292 340)"/>') +
    deco('<path d="M150 70 l8 8 M240 110 l-8 8 M300 60 l6 10 M30 220 l10 -4 M380 220 l-8 -6 M170 130 l0 10"/>', 3.5) +
    '</g>');


  /* ═══════════════════════════ batch 3 ═══════════════════════════
     Inky hides a different way on every page this time, and the Odyssey category starts:
     Golden Glow and Vermillion's Caravan are drawn with the Odyssey rig (no hats, no props). */

  // A thicker glowspore stalk (Medium pages need more room than glowStalk gives).
  const fatStalk = (x, y, h, lean) => `<path d="M${x - 10} ${y} C${x - 10} ${y - h * .5} ${x + lean - 8} ${y - h * .8} ${x + lean - 8} ${y - h} L${x + lean + 8} ${y - h} C${x + lean + 8} ${y - h * .8} ${x + 10} ${y - h * .5} ${x + 10} ${y} Z"/>`;
  // A rubber duck, facing right, centred on (0, 0).
  const duck = (f, x, y, s, lw) => grp(x, y, s, false, lw,
    R(f, 'duck', '<path d="M-46 4 C-52 -14 -40 -20 -30 -10 C-20 -4 0 -6 14 -6 C30 -6 40 2 38 14 C36 28 20 32 0 32 L-30 32 C-44 32 -48 18 -46 4 Z"/><circle cx="18" cy="-24" r="20"/>') +
    R(f, 'beak', '<path d="M32 -36 C60 -44 76 -24 64 -10 C56 -2 42 -4 32 -12 Z"/>') +
    deco('<path d="M-20 8 C-10 20 8 20 14 8"/>', 3.5) + deco(eyeDot(22, -30, 4.5), 3, true));
  // Inky's pale eyes looking out of a dark opening (any closed path).
  const eyesIn = (f, id, path, x1, x2, y, r) => R(f, id, path) + deco(paleEye(x1, y, r, 2) + paleEye(x2, y, r, 2), 3, true);

  /* 13. Seahorse Hello (Easy) — Penny meets a seahorse nose to nose. Inky's eyes shine from a hole in the rock. */
  reg('v4/seahorse', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[200, 40, 14], [228, 66, 9], [50, 56, 12]], 4.5) +
    ribbonSeaweed(f, 'seaweed', 6) +
    R(f, 'seahorse-fin', '<path d="M346 168 C380 160 392 196 360 214 Z"/>') +
    R(f, 'seahorse', '<path d="M282 112 L250 118 C242 120 240 136 250 138 L284 136 C290 150 304 158 316 160 C306 182 304 214 316 240 C324 262 314 284 300 296 C282 312 296 336 320 330 C342 324 344 300 326 296 C318 296 314 306 320 310 C334 290 350 262 350 230 C350 200 342 178 332 162 C352 152 356 120 340 102 C326 86 296 88 282 112 Z"/>') +
    deco('<path d="M300 92 l-4 -14 M318 88 l2 -14 M334 96 l8 -12 M322 186 q14 4 22 0 M320 206 q14 4 24 0 M322 226 q14 4 22 0"/>', 4) +
    deco(paleEye(312, 118, 11, -3) + '<path d="M296 132 Q302 138 308 134"/>', 4, true) +
    sandAt(f, 340) +
    R(f, 'rock', '<path d="M196 410 C200 356 262 330 322 336 C374 342 410 372 412 410 Z"/>') +
    eyesIn(f, 'inky-peek', '<ellipse cx="300" cy="380" rx="30" ry="18"/>', 288, 312, 380, 10) +
    star5(f, 'starfish', 60, 378, 26) +
    shell(f, 'shell', 130, 392, 46) +
    cast(f, { who: 'penny', x: -30, y: 124, s: 0.65, pose: 'stand', tail: 'wave', mouth: 'smile', simple: true, lw: 8 }) +
    '</g>');

  /* 14. Bubble Bath (Easy) — Pip in a clam-shell tub with a rubber duck. Inky's gill tips poke out of the foam. */
  reg('v4/bubble-bath', f =>
    `<g stroke-width="8">` +
    bg(f) +
    bubbles(f, 'bubbles', [[60, 60, 16], [96, 30, 10], [340, 40, 18], [372, 84, 11]], 4.5) +
    sandAt(f, 336) +
    R(f, 'clam-lid', '<path d="M70 290 C44 60 356 60 330 290 Z"/>') +
    deco('<path d="M200 290 L200 104 M200 290 L120 126 M200 290 L280 126 M200 290 L76 196 M200 290 L324 196"/>', 4) +
    cast(f, { who: 'pip', x: 30, y: 128, s: 0.62, pose: 'stand', tail: 'swish', mouth: 'grin', eyes: 'closed', simple: true, lw: 8, omit: ['body'] }) +
    R(f, 'inky-peek-gills', LabArt.frond(316, 262, 246, 44, 34, 0, 4) + LabArt.frond(334, 258, 270, 44, 34, 0, 4) + LabArt.frond(352, 262, 294, 44, 34, 0, 4)) +
    bush(f, 'foam', 200, 268, 150, 42, 13, 300) +
    duck(f, 254, 240, 1.15, 8) +
    R(f, 'tub', '<path d="M66 296 C78 380 322 380 334 296 Z"/>') +
    deco('<path d="M110 320 Q120 340 140 350 M200 360 L200 330 M290 320 Q280 340 260 350"/>', 4) +
    star5(f, 'starfish', 360, 380, 24) +
    '</g>');

  /* 15. Golden Glow (Medium · Odyssey) — a Golden Albino lights a pitch-black tunnel, as it does in
         Axolotl Odyssey. Inky's eyes look out of a burrow in the floor. */
  reg('v4/golden-glow', f =>
    `<g stroke-width="4">` +
    bg(f) +
    R(f, 'ceiling', '<path d="M-10 -10 L410 -10 L410 70 C370 86 340 60 300 74 C260 88 226 64 190 78 C150 92 120 66 80 80 C40 94 20 74 -10 82 Z"/>') +
    R(f, 'roots', '<path d="M90 76 C84 104 102 122 90 150 C104 136 112 116 108 96 L112 76 Z"/><path d="M306 72 C314 96 300 116 310 138 C324 120 328 98 326 72 Z"/>') +
    deco('<circle cx="210" cy="184" r="128" stroke-dasharray="4 14"/><circle cx="210" cy="184" r="156" stroke-dasharray="3 18"/>', 2.5) +
    grp(352, 136, 1.35, false, 4,
      R(f, 'shrimp-bubble', '<circle cx="0" cy="0" r="32"/>') + deco(shine(0, 0, 32), 3) +
      R(f, 'shrimp', '<path d="M-20 8 C-16 -12 10 -18 22 -4 C12 -6 0 -2 -6 8 C-8 16 -14 18 -20 8 Z"/>') +
      deco(eyeDot(14, -6, 2.5) + '<path d="M20 -8 C28 -16 34 -18 40 -16"/>', 2)) +
    R(f, 'floor', '<path d="M-10 304 C40 290 90 306 150 298 C210 290 280 306 330 296 C370 290 396 296 410 300 L410 410 L-10 410 Z"/>') +
    deco('<path d="M30 340 q14 -6 28 0 M150 380 q14 -6 28 0 M320 352 q14 -6 28 0"/>', 2.5) +
    R(f, 'stalks', fatStalk(40, 302, 52, -6) + fatStalk(372, 298, 58, 8)) +
    glowCap(f, 'spore-cap-1', 34, 250, 22) + glowCap(f, 'spore-cap-2', 380, 240, 24) +
    R(f, 'pebbles', '<ellipse cx="110" cy="330" rx="14" ry="9"/><ellipse cx="300" cy="372" rx="14" ry="9"/><ellipse cx="380" cy="340" rx="14" ry="9"/>') +
    eyesIn(f, 'inky-peek', '<ellipse cx="206" cy="364" rx="40" ry="22"/>', 192, 220, 362, 10) +
    LabArt.odysseyAt(f, { x: 6, y: 104, s: 0.9, rot: -4, legW: 14 }) +
    '</g>');

  /* 16. Sandcastle (Medium) — Pip pats the castle wall, Penny adds a flag. Inky is in the castle doorway. */
  reg('v4/sandcastle', f =>
    `<g stroke-width="4">` +
    bg(f) +
    deco('<path d="M40 -10 L120 220 M100 -10 L170 180" stroke-dasharray="26 14"/>', 2.5) +
    bubbles(f, 'bubbles', [[340, 40, 12], [366, 66, 8]], 2.5) +
    fish(f, 'fish', 96, 70, 0.6, false, 4) +
    sandAt(f, 318) +
    R(f, 'castle', '<path d="M150 336 L150 216 L162 216 L162 204 L176 204 L176 216 L188 216 L188 204 L200 204 L200 216 L212 216 L212 204 L224 204 L224 216 L238 216 L238 204 L250 204 L250 216 L262 216 L262 336 Z"/>') +
    deco('<path d="M160 260 q8 -4 16 0 M232 280 q8 -4 16 0 M180 312 q8 -4 16 0"/>', 2.5) +
    R(f, 'towers', '<path d="M120 336 L124 168 L132 168 L132 156 L142 156 L142 168 L150 168 L150 156 L160 156 L160 168 L166 168 L170 336 Z"/><path d="M242 336 L246 168 L252 168 L252 156 L262 156 L262 168 L270 168 L270 156 L280 156 L280 168 L288 168 L292 336 Z"/>') +
    deco('<path d="M145 156 L145 112 M267 156 L267 112"/>', 4) +
    R(f, 'flags', '<path d="M145 112 L184 126 L145 142 Z"/><path d="M267 112 L306 126 L267 142 Z"/>') +
    eyesIn(f, 'inky-peek', '<path d="M184 336 L184 290 C184 266 228 266 228 290 L228 336 Z"/>', 196, 216, 300, 9) +
    R(f, 'bucket', '<path d="M30 340 L82 340 L76 398 L36 398 Z"/>') + deco('<path d="M30 340 C30 310 82 310 82 340"/><path d="M34 356 L78 356"/>', 4) +
    R(f, 'spade', '<path d="M340 330 L352 330 L350 370 L368 374 C366 396 326 396 324 374 L342 370 Z"/>') +
    shell(f, 'shell', 110, 392, 40) + star5(f, 'starfish', 380, 392, 18) +
    cast(f, { who: 'pip', pre: 'pip-', x: -24, y: 164, s: 0.52, pose: 'reach', tail: 'wave', mouth: 'grin', detail: 'mid', lw: 6 }) +
    cast(f, { who: 'penny', pre: 'penny-', x: 214, y: 10, s: 0.5, flip: true, pose: 'swim', tail: 'swish', mouth: 'smile', look: 'down', detail: 'mid', lw: 6 }) +
    '</g>');

  /* 17. Vermillion's Caravan (Advanced · Odyssey) — the dragon merchant's wagon in the canal cave.
         Vermillion leans out of the window; the axolotl swims up with a pebble to trade.
         Inky's eyes are in the barrel. */
  reg('v4/caravan', f =>
    `<g stroke-width="4">` +
    bg(f) +
    R(f, 'ceiling', '<path d="M-10 -10 L410 -10 L410 50 C376 62 350 42 316 54 C280 66 250 46 214 58 C176 70 150 48 114 60 C76 72 40 52 -10 62 Z"/>') +
    R(f, 'stalks', glowStalk(30, 300, 60, -8)) + glowCap(f, 'spore-cap', 22, 240, 22) +
    R(f, 'silt', '<path d="M-10 300 C70 288 150 304 230 298 C310 292 360 288 410 294 L410 410 L-10 410 Z"/>') +
    deco('<path d="M40 340 q14 -6 28 0 M120 384 q14 -6 28 0 M260 380 q14 -6 28 0"/>', 2.5) +
    R(f, 'wagon-top', '<path d="M178 200 C176 120 386 120 384 200 Z"/>') +
    deco('<path d="M216 198 C214 150 222 136 236 130 M278 198 L280 126 M344 198 C346 150 338 136 326 130"/>', 2.5) +
    R(f, 'wagon', '<path d="M170 198 L392 198 L392 288 L170 288 Z"/>') +
    deco('<path d="M170 220 L392 220 M184 288 L184 222 M378 288 L378 222"/>', 2.5) +
    deco('<path d="M246 284 L246 238 C246 222 306 222 306 238 L306 284"/>', 4) +
    R(f, 'horns', '<path d="M240 192 C240 162 262 140 290 140 C272 152 262 170 262 196 Z"/><path d="M262 200 C268 174 292 160 318 166 C298 174 286 188 282 206 Z"/>') +
    R(f, 'frill', '<path d="M288 214 C306 202 324 210 326 228 C312 224 300 228 290 236 Z"/>') +
    R(f, 'vermillion', '<path d="M306 284 L298 240 C292 210 268 192 236 192 C206 192 172 200 160 218 C152 232 160 246 178 248 C196 250 214 244 230 250 C246 258 256 270 260 284 Z"/>') +
    R(f, 'vermillion-eye', '<ellipse cx="232" cy="214" rx="11" ry="9"/>') +
    deco(`<ellipse cx="232" cy="214" rx="2.6" ry="7.5" fill="${INK}" stroke="none"/><circle cx="172" cy="220" r="2.5" fill="${INK}" stroke="none"/><path d="M178 236 Q198 244 216 234"/>`, 3, true) +
    R(f, 'sign', '<path d="M310 238 L370 234 L372 266 L312 270 Z"/>') +
    deco('<circle cx="330" cy="252" r="7"/><circle cx="352" cy="250" r="7"/><path d="M318 238 L330 222 L340 236 M362 234 L352 222"/>', 2.5) +
    R(f, 'wheels', '<circle cx="214" cy="292" r="30"/><circle cx="350" cy="292" r="30"/>') +
    deco('<circle cx="214" cy="292" r="8"/><circle cx="350" cy="292" r="8"/><path d="M214 262 L214 322 M184 292 L244 292 M350 262 L350 322 M320 292 L380 292"/>', 3) +
    deco('<path d="M384 160 L394 160 L394 172"/>', 3) +
    R(f, 'lantern', '<path d="M376 172 L412 172 L414 226 L374 226 Z"/>') +
    R(f, 'lantern-glow', '<path d="M394 178 C410 192 410 210 394 218 C378 210 378 192 394 178 Z"/>') +
    R(f, 'barrel', '<path d="M26 404 C16 378 16 350 26 326 L84 326 C94 350 94 378 84 404 Z"/>') +
    eyesIn(f, 'inky-peek', '<ellipse cx="55" cy="326" rx="29" ry="12"/>', 44, 66, 326, 7) +
    deco('<path d="M20 352 L90 352 M20 382 L90 382"/>', 3) +
    R(f, 'jars', '<path d="M386 300 C400 300 404 330 396 346 L370 346 C362 330 366 300 380 300 Z"/>') +
    R(f, 'pebbles', '<ellipse cx="150" cy="380" rx="13" ry="9"/><ellipse cx="184" cy="394" rx="13" ry="9"/><ellipse cx="300" cy="366" rx="13" ry="9"/>') +
    deco('<path d="M150 364 l0 -6 M300 350 l0 -6"/>', 2.5) +
    LabArt.odysseyAt(f, { x: -30, y: 196, s: 0.54, rot: -12, legW: 22 }) +
    '</g>');

  /* 18. Market Day (Advanced) — Penny keeps the shell stall, Pip buys sea-grapes, Sunny swims by with a
         basket. Inky's eyes peek from under the fruit stall's tablecloth. */
  function stall(f, id, x, w, stripes) {
    const top = 96, bot = 136, sw = w / stripes;
    const st = i => `<path d="M${n(x + i * sw)} ${top} L${n(x + (i + 1) * sw)} ${top} L${n(x + (i + 1) * sw)} ${bot} C${n(x + (i + .75) * sw)} ${bot + 12} ${n(x + (i + .25) * sw)} ${bot + 12} ${n(x + i * sw)} ${bot} Z"/>`;
    return R(f, id + '-posts', `<rect x="${x + 6}" y="${bot}" width="12" height="${300 - bot}"/><rect x="${x + w - 18}" y="${bot}" width="12" height="${300 - bot}"/>`) +
      R(f, id + '-awning-a', Array.from({ length: stripes }, (_, i) => i).filter(i => i % 2 === 0).map(st)) +
      R(f, id + '-awning-b', Array.from({ length: stripes }, (_, i) => i).filter(i => i % 2).map(st));
  }
  reg('v4/market', f =>
    `<g stroke-width="4">` +
    bg(f) +
    bubbles(f, 'bubbles', [[200, 170, 13], [196, 206, 10]], 2.5) +
    sandAt(f, 318) +
    stall(f, 'stall-1', 8, 168, 5) +
    stall(f, 'stall-2', 224, 168, 5) +
    // Penny behind her shell stall
    cast(f, { who: 'penny', pre: 'penny-', x: -6, y: 150, s: 0.44, pose: 'stand', tail: 'swish', mouth: 'grin', detail: 'mid', lw: 6, omit: ['body'] }) +
    R(f, 'counter-1', '<rect x="8" y="232" width="168" height="72" rx="6"/>') +
    deco('<path d="M8 252 L176 252"/>', 2.5) +
    R(f, 'shells', '<path d="M24 232 C22 210 56 210 54 232 Z"/><path d="M76 232 C70 204 112 200 108 232 Z"/><path d="M126 232 C126 214 156 214 156 232 Z"/>') +
    deco('<path d="M39 230 L32 216 M39 230 L46 216 M92 230 L84 210 M92 230 L100 210 M141 230 L136 218 M141 230 L148 218"/>', 2.5) +
    R(f, 'counter-2', '<rect x="224" y="232" width="168" height="40" rx="6"/>') +
    R(f, 'grapes', [[250, 214], [264, 206], [276, 216], [262, 222], [330, 210], [344, 202], [356, 212], [342, 220]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`)) +
    R(f, 'jar', '<path d="M296 232 L296 200 L322 200 L322 232 Z"/>') + deco('<path d="M292 200 L326 200"/>', 4) +
    eyesIn(f, 'inky-peek', '<path d="M236 272 L380 272 L380 322 C340 310 276 310 236 322 Z"/>', 294, 318, 304, 9) +
    R(f, 'tablecloth', '<path d="M224 272 L392 272 L392 290 C380 302 368 290 356 300 C344 310 334 294 322 302 L300 302 C288 294 278 310 266 300 C254 290 242 302 224 290 Z"/>') +
    fish(f, 'fish', 350, 170, 0.62, true, 4) +
    cast(f, { who: 'sunny', pre: 'sunny-', x: 120, y: 2, s: 0.42, rot: 6, pose: 'swim', tail: 'wave', mouth: 'smile', detail: 'mid', lw: 6, rig: { held: null } }) +
    cast(f, { who: 'pip', pre: 'pip-', x: 30, y: 264, s: 0.48, pose: 'reach', tail: 'swish', mouth: 'wow', detail: 'mid', lw: 6 }) +
    '</g>');

  window.PagesV4 = { jellyRef };
})();
