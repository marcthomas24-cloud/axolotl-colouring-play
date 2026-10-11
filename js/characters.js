/*
  The recurring cast. DATA ONLY — the drawing rig in js/pages-lab.js reads these fields,
  pages reference characters by id, and nothing else hard-codes how a character looks.

  Each one is a real axolotl morph, the same four the Axolotl Odyssey game ships with
  (Leucistic, Golden Albino, Melanistic, Copper), so the two products share one cast of
  colours. They are told apart in black-and-white line art too — by silhouette and
  accessory, not by colour alone — because a colouring page has no colour until the
  child adds it.

  Fields:
    name, morph            display name; Odyssey MORPHS key it borrows its colours from
    personality            one line — what they DO in a picture (drives pose choices)
    silhouette             the line-art tell, readable at thumbnail size
    rig                    options for the drawing rig: hat, eyes, build, extras
    reference              { part: palette colour } for reference colourings
                           (part names are the rig's region ids without the prefix)
*/
(function () {
  'use strict';

  const CAST = {
    pip: {
      name: 'Pip', morph: 'leucistic',
      personality: 'The explorer. Curious, first through every door, never without a map.',
      silhouette: 'Wide-brimmed explorer hat and a satchel; the longest, most sweeping gills.',
      rig: { hat: 'explorer', bag: true, eyes: 'sparkle', build: 'classic', gills: 'long' },
      reference: { body: '#ffb3d1', arm: '#ffb3d1', head: '#ffb3d1', tail: '#ffb3d1', 'leg-front': '#ffb3d1', 'leg-hind': '#ffb3d1', 'leg-far': '#ff6fa8',
        'gills-near': '#ff6fa8', 'gills-far': '#ff6fa8', gills: '#ff6fa8', hat: '#c8a26b', brim: '#c8a26b', band: '#8a6a52', bag: '#8a6a52' },
    },
    sunny: {
      name: 'Sunny', morph: 'albino',
      personality: 'The light-bringer. Golden and glowing; brave in the dark so others don\'t have to be.',
      silhouette: 'Short and round, with fat fluffy gill-tufts and a glow-pearl carried in front.',
      rig: { eyes: 'albino', build: 'round', gills: 'tufts', held: 'pearl' },
      reference: { body: '#ffd84a', arm: '#ffd84a', head: '#ffd84a', tail: '#ffd84a', 'leg-front': '#ffd84a', 'leg-hind': '#ffd84a', 'leg-far': '#ff9f45',
        'gills-near': '#ff9f45', 'gills-far': '#ff9f45', gills: '#ff9f45', pearl: '#ffffff' },
    },
    inky: {
      name: 'Inky', morph: 'melanistic',
      personality: 'The shy one. Hides somewhere in every picture — finding Inky is the game.',
      silhouette: 'Only ever half-seen: big pale-ringed eyes and three gill tips peeking out.',
      rig: { eyes: 'pale', build: 'classic', gills: 'short' },
      reference: { body: '#3a3340', arm: '#3a3340', head: '#3a3340', tail: '#3a3340', 'leg-front': '#3a3340', 'leg-hind': '#3a3340', 'leg-far': '#3a3340',
        'gills-near': '#c9a7ff', 'gills-far': '#8b5cf6', gills: '#c9a7ff', peek: '#3a3340', 'peek-gills': '#c9a7ff' },
    },
    penny: {
      name: 'Penny', morph: 'copper',
      personality: 'The tinkerer. Freckled and practical; metal things drift to her and she fixes them.',
      silhouette: 'Swim goggles pushed up on her head, freckles, a little tool belt.',
      rig: { hat: 'goggles', eyes: 'sparkle', build: 'classic', gills: 'fronds', freckles: true, belt: true },
      reference: { body: '#ff9f45', arm: '#ff9f45', head: '#ff9f45', tail: '#ff9f45', 'leg-front': '#ff9f45', 'leg-hind': '#ff9f45', 'leg-far': '#ff5a5a',
        'gills-near': '#ff5a5a', 'gills-far': '#ff5a5a', gills: '#ff5a5a', goggles: '#7fd3ff', strap: '#8a6a52', belt: '#8a6a52' },
    },
  };

  // Reference fills for one character placed with a region-id prefix (e.g. 'pip-').
  function fillsFor(id, prefix) {
    const c = CAST[id], out = {};
    if (!c) return out;
    Object.keys(c.reference).forEach(k => { out[(prefix || '') + k] = c.reference[k]; });
    return out;
  }

  window.Characters = { CAST, fillsFor };
})();
