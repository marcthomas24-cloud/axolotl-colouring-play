/*
  Content catalogue. Data only — screens never hard-code pages.
  Field set follows GDD §14, extended in Stage 2 (see ART_PIPELINE.md §4):
    id, title, category, sortOrder
    category      a CATEGORIES id (easy, fun, friends, underwater, adventure, sports, halloween, christmas, village, odyssey).
    difficulty    1–3, purely visual (stars on the page card). Defaults from `complexity`.
    access        'free' | 'premium' — omitted = inherits from the category (see accessOf).
    tasterUnlock  optional { afterEasyCompletions: n }: a premium page that genuinely opens once the
                  child has finished n different Easy pages (the Friends taster, Pass 11).
    artReviewed   false until a human has approved the page's art; shown on cards in dev builds only
                  (?dev in the address). Easy pages ship false by default (GDD v0.2 §11).
    lineArt       a key registered in js/pages*.js. Keys are permanent — new artwork gets a new
                  key (finished pictures remember the key they were coloured on; see artFor).
    thumbnail     null → generated live from lineArt (shows the child's own colours).
    reference     { regionId: colour } — the finished/preview colouring, rendered from the same
                  art function as the line art (Art.coloured), so the two can never drift apart.
                  null → no reference yet.
    complexity    'easy' | 'medium' | 'advanced' | 'detailed' — sets the region-audit budget (js/audit.js).
                  'detailed' = illustrated benchmark-quality raster pages (final/…): many small areas,
                  pinch-zoom expected.
    lineWeight    outline width in page units (default 6) — the audit needs it.
    characters    recurring-cast ids that appear (js/characters.js).
    easterEggs    optional small discoveries: [{ what, region? }] — never required to finish.
    completionAnimation  'default' (the bring-to-life sequence keys off the art's hooks).
*/
(function () {
  'use strict';

  const DIFFICULTY = { easy: 1, medium: 2, advanced: 3, detailed: 3 };
  function withDefaults(p) {
    const q = Object.assign({ thumbnail: null, reference: null, complexity: 'medium', lineWeight: 6, characters: [],
      easterEggs: [], completionAnimation: 'default', access: null, tasterUnlock: null, artReviewed: true }, p);
    if (!q.difficulty) q.difficulty = DIFFICULTY[q.complexity] || 2;
    return q;
  }
  const cast = (id, pre) => (window.Characters ? Characters.fillsFor(id, pre) : {});
  const EASY_REF = (window.EasyArt && window.EasyArt.REFS) || {};   // finished colourings live beside the art (js/pages-easy.js)

  // Pages 2–6, 8 and 10 use illustrated art (art/pages/final-*.png, js/raster/). Their
  // earlier v3 keys stay registered, so pictures already coloured on them still open correctly.
  const ALL_MAIN = [
    { id: 'baby', title: 'Baby Axolotl', category: 'friends', lineArt: 'final/baby', sortOrder: 1, complexity: 'detailed' },
    { id: 'explorer',  title: 'Explorer',     category: 'adventure', lineArt: 'final/explorer', sortOrder: 2, complexity: 'detailed' },
    { id: 'pirate',    title: 'Pirate',       category: 'adventure',   lineArt: 'final/pirate', sortOrder: 3, complexity: 'detailed' },
    { id: 'wizard',    title: 'Wizard',       category: 'adventure',   lineArt: 'final/wizard', sortOrder: 4, complexity: 'detailed' },
    { id: 'astronaut', title: 'Astronaut',    category: 'adventure',     lineArt: 'final/astronaut', sortOrder: 5, complexity: 'detailed' },
    { id: 'princess',  title: 'Princess',     category: 'adventure',   lineArt: 'final/princess', sortOrder: 6, complexity: 'detailed' },
    { id: 'treasure',  title: 'Treasure',     category: 'adventure',   lineArt: 'final/treasure',  sortOrder: 7,  complexity: 'detailed' },
    { id: 'coral',     title: 'Coral Reef Explorer', category: 'underwater', lineArt: 'final/coral-2', sortOrder: 8, complexity: 'detailed',
      characters: ['pip', 'inky'], easterEggs: [{ what: 'Inky peeking out of the coral cave' }] },
    { id: 'village',   title: 'Village',      category: 'village',   lineArt: 'final/village',   sortOrder: 9,  complexity: 'detailed' },
    { id: 'odyssey',   title: 'Odyssey',      category: 'odyssey',   lineArt: 'final/odyssey', sortOrder: 10, complexity: 'detailed' },
    // v4 — first production batch in the house style (ART_PIPELINE.md, "Decision"). Every page hides Inky.
    { id: 'big-bubble', title: 'Big Bubble', category: 'underwater', lineArt: 'final/big-bubble', sortOrder: 11, complexity: 'detailed' },
    { id: 'jelly-hello', title: 'Jelly Hello', category: 'underwater', lineArt: 'final/jelly-hello', sortOrder: 12, complexity: 'detailed' },
    { id: 'treasure-map', title: 'Treasure Map', category: 'adventure', lineArt: 'final/treasure-map', sortOrder: 13,
      complexity: 'detailed', characters: ['pip', 'inky'],
      easterEggs: [{ what: 'Inky peeking out of the coral cave' }, { what: 'A shell hiding among the rocks' }] },
    { id: 'hide-and-seek', title: 'Hide and Seek', category: 'friends', lineArt: 'final/hide-and-seek', sortOrder: 14, complexity: 'detailed' },
    { id: 'shipwreck', title: 'Shipwreck', category: 'adventure', lineArt: 'final/shipwreck', sortOrder: 15,
      complexity: 'detailed', lineWeight: 5, characters: ['pip', 'penny', 'inky'],
      easterEggs: [{ what: 'Inky looking out of a porthole' }, { what: 'An octopus on the deck' }, { what: 'A crab on the barrel' }],
      reference: Object.assign(cast('pip', 'pip-'), cast('penny', 'penny-'), { water: '#3d8bff', mast: '#8a6a52', sail: '#ffffff', flag: '#ff5a5a',
        hull: '#c8a26b', rail: '#8a6a52', porthole: '#7fd3ff', 'inky-peek': '#3a3340', octopus: '#c9a7ff', 'octopus-arms': '#8b5cf6',
        sand: '#ffd84a', anchor: '#9aa3ad', 'anchor-ring': '#9aa3ad', barrel: '#8a6a52', coins: '#ffd84a', seaweed: '#2fbf71',
        crab: '#ff5a5a', 'crab-claws': '#ff5a5a', angler: '#ff9f45', 'angler-tail': '#ff9f45', lure: '#ffd84a' }) },
    { id: 'glow-parade', title: 'Glow Parade', category: 'underwater', lineArt: 'final/glow-parade', sortOrder: 16, complexity: 'detailed' },
    { id: 'sweet-dreams', title: 'Sweet Dreams', category: 'friends', lineArt: 'final/sweet-dreams', sortOrder: 17, complexity: 'detailed' },
    { id: 'puffer', title: 'Puffer Surprise', category: 'underwater', lineArt: 'final/puffer', sortOrder: 18, complexity: 'detailed' },
    { id: 'picnic', title: 'Underwater Picnic', category: 'friends', lineArt: 'final/picnic', sortOrder: 19, complexity: 'detailed' },
    { id: 'new-home', title: 'New Home', category: 'friends', lineArt: 'final/new-home', sortOrder: 20, complexity: 'detailed' },
    { id: 'temple', title: 'The Old Temple', category: 'adventure', lineArt: 'final/temple', sortOrder: 21, complexity: 'detailed' },
    { id: 'party', title: 'Party', category: 'friends', lineArt: 'final/party', sortOrder: 22, complexity: 'detailed' },
    { id: 'seahorse', title: 'Seahorse Hello', category: 'underwater', lineArt: 'final/seahorse', sortOrder: 23, complexity: 'detailed' },
    { id: 'bubble-bath', title: 'Bubble Bath', category: 'friends', lineArt: 'final/bubble-bath', sortOrder: 24, complexity: 'detailed', tasterUnlock: { afterEasyCompletions: 3 } },
    { id: 'golden-glow', retired: true, title: 'Golden Glow', category: 'odyssey', lineArt: 'v4/golden-glow', sortOrder: 25,
      complexity: 'medium', lineWeight: 5, characters: [], easterEggs: [{ what: 'Inky\'s eyes in the burrow' }, { what: 'A shrimp in a bubble' }],
      reference: { water: '#3d8bff', ceiling: '#9aa3ad', roots: '#8a6a52', 'shrimp-bubble': '#7fd3ff', shrimp: '#ff9f45',
        floor: '#8a6a52', stalks: '#8fe07a', 'spore-cap-1': '#7fd3ff', 'spore-cap-2': '#7fd3ff', pebbles: '#ffd84a', 'inky-peek': '#3a3340',
        head: '#ffd84a', body: '#ffd84a', tail: '#ffd84a', 'fore-left': '#ffd84a', 'fore-right': '#ffd84a', 'hind-left': '#ffd84a',
        'hind-right': '#ffd84a', 'gill-left': '#ff9f45', 'gill-right': '#ff9f45' } },
    { id: 'sandcastle', title: 'Sandcastle', category: 'friends', lineArt: 'final/sandcastle', sortOrder: 26, complexity: 'detailed', tasterUnlock: { afterEasyCompletions: 3 } },
    { id: 'caravan', retired: true, title: 'Vermillion\'s Caravan', category: 'odyssey', lineArt: 'v4/caravan', sortOrder: 27,
      complexity: 'advanced', lineWeight: 5, characters: [], easterEggs: [{ what: 'Inky\'s eyes in the barrel' }, { what: 'Vermillion\'s shop sign' }],
      reference: { water: '#3d8bff', ceiling: '#9aa3ad', stalks: '#8fe07a', 'spore-cap': '#7fd3ff', silt: '#8a6a52',
        'wagon-top': '#ffffff', wagon: '#ff5a5a', horns: '#c9a7ff', frill: '#c9a7ff', vermillion: '#8b5cf6', 'vermillion-eye': '#ffd84a', sign: '#c8a26b',
        wheels: '#c8a26b', lantern: '#9aa3ad', 'lantern-glow': '#ffd84a', barrel: '#8a6a52', 'inky-peek': '#3a3340', jars: '#7fd3ff',
        pebbles: '#ffd84a', head: '#ffb3d1', body: '#ffb3d1', tail: '#ffb3d1', 'fore-left': '#ffb3d1', 'fore-right': '#ffb3d1',
        'hind-left': '#ffb3d1', 'hind-right': '#ffb3d1', 'gill-left': '#ff6fa8', 'gill-right': '#ff6fa8' } },
    { id: 'market', title: 'Market Day', category: 'village', lineArt: 'final/market', sortOrder: 28, complexity: 'detailed' },
    { id: 'jungle-waterfall', title: 'Jungle Waterfall', category: 'adventure', lineArt: 'final/jungle-waterfall', sortOrder: 29, complexity: 'detailed' },
    { id: 'space-adventure', title: 'Space Adventure', category: 'adventure', lineArt: 'final/space-adventure', sortOrder: 30, complexity: 'detailed' },
    { id: 'crystal-cave', title: 'Crystal Cave', category: 'adventure', lineArt: 'final/crystal-cave', sortOrder: 31, complexity: 'detailed' },
    { id: 'magic-reef', title: 'Magic Reef', category: 'adventure', lineArt: 'final/magic-reef', sortOrder: 32, complexity: 'detailed' },
    { id: 'market-square', title: 'Market Square', category: 'village', lineArt: 'final/market-square', sortOrder: 33, complexity: 'detailed' },
    { id: 'star-city', title: 'Star City', category: 'adventure', lineArt: 'final/star-city', sortOrder: 34, complexity: 'detailed' },
    { id: 'diving-for-treasure', title: 'Diving for Treasure', category: 'adventure', lineArt: 'final/diving-for-treasure', sortOrder: 35, complexity: 'detailed' },
    { id: 'manta-ride', title: 'Manta Ride', category: 'underwater', lineArt: 'final/manta-ride', sortOrder: 36, complexity: 'detailed' },
    { id: 'lantern-cave', title: 'Lantern Cave', category: 'adventure', lineArt: 'final/lantern-cave', sortOrder: 37, complexity: 'detailed' },
    { id: 'lighthouse-cove', title: 'Lighthouse Cove', category: 'adventure', lineArt: 'final/lighthouse-cove', sortOrder: 38, complexity: 'detailed' },
    { id: 'snorkel-ruins', title: 'Snorkel Ruins', category: 'underwater', lineArt: 'final/snorkel-ruins', sortOrder: 39, complexity: 'detailed' },
    { id: 'crystal-treasure', title: 'Crystal Treasure', category: 'adventure', lineArt: 'final/crystal-treasure', sortOrder: 40, complexity: 'detailed' },
    { id: 'polar-pals', title: 'Polar Pals', category: 'adventure', lineArt: 'final/polar-pals', sortOrder: 41, complexity: 'detailed' },
    { id: 'pirate-cove', title: 'Pirate Cove', category: 'adventure', lineArt: 'final/pirate-cove', sortOrder: 42, complexity: 'detailed' },
    { id: 'waterfall-splash', title: 'Waterfall Splash', category: 'adventure', lineArt: 'final/waterfall-splash', sortOrder: 43, complexity: 'detailed' },
    { id: 'bat-cave', title: 'Bat Cave', category: 'adventure', lineArt: 'final/bat-cave', sortOrder: 44, complexity: 'detailed' },
    { id: 'jungle-swing', title: 'Jungle Swing', category: 'adventure', lineArt: 'final/jungle-swing', sortOrder: 45, complexity: 'detailed' },
    { id: 'desert-dinosaur', title: 'Desert Dinosaur', category: 'adventure', lineArt: 'final/desert-dinosaur', sortOrder: 46, complexity: 'detailed' },
    { id: 'volcano-trek', title: 'Volcano Trek', category: 'adventure', lineArt: 'final/volcano-trek', sortOrder: 47, complexity: 'detailed' },
    { id: 'submarine', title: 'Submarine', category: 'underwater', lineArt: 'final/submarine', sortOrder: 48, complexity: 'detailed' },
    { id: 'pearl-garden', title: 'Pearl Garden', category: 'underwater', lineArt: 'final/pearl-garden', sortOrder: 49, complexity: 'detailed' },
    { id: 'wizards-arch', title: 'Wizard\'s Arch', category: 'adventure', lineArt: 'final/wizards-arch', sortOrder: 50, complexity: 'detailed' },
    { id: 'sea-castle', title: 'Sea Castle', category: 'adventure', lineArt: 'final/sea-castle', sortOrder: 51, complexity: 'detailed' },
    { id: 'castle-bridge', title: 'Castle Bridge', category: 'village', lineArt: 'final/castle-bridge', sortOrder: 52, complexity: 'detailed' },
    { id: 'market-bridge', title: 'Market Bridge', category: 'village', lineArt: 'final/market-bridge', sortOrder: 53, complexity: 'detailed' },
    { id: 'shell-fountain', title: 'Shell Fountain', category: 'village', lineArt: 'final/shell-fountain', sortOrder: 54, complexity: 'detailed' },
    { id: 'waterfall-picnic', title: 'Waterfall Picnic', category: 'friends', lineArt: 'final/waterfall-picnic', sortOrder: 55, complexity: 'detailed' },
    { id: 'treehouse-picnic', title: 'Treehouse Picnic', category: 'friends', lineArt: 'final/treehouse-picnic', sortOrder: 56, complexity: 'detailed' },
    { id: 'woodland-picnic', title: 'Woodland Picnic', category: 'friends', lineArt: 'final/woodland-picnic', sortOrder: 57, complexity: 'detailed' },
    { id: 'kelp-picnic', title: 'Kelp Picnic', category: 'friends', lineArt: 'final/kelp-picnic', sortOrder: 58, complexity: 'detailed' },
    { id: 'moonlit-nap', title: 'Moonlit Nap', category: 'friends', lineArt: 'final/moonlit-nap', sortOrder: 59, complexity: 'detailed' },
    { id: 'home-sweet-home', title: 'Home Sweet Home', category: 'village', lineArt: 'final/home-sweet-home', sortOrder: 60, complexity: 'detailed' },
    { id: 'clam-cottage', title: 'Clam Cottage', category: 'village', lineArt: 'final/clam-cottage', sortOrder: 61, complexity: 'detailed' },
    { id: 'moving-in', title: 'Moving In', category: 'village', lineArt: 'final/moving-in', sortOrder: 62, complexity: 'detailed' },
    { id: 'open-door', title: 'Open Door', category: 'village', lineArt: 'final/open-door', sortOrder: 63, complexity: 'detailed' },
    { id: 'puffer-wow', title: 'Puffer Wow', category: 'underwater', lineArt: 'final/puffer-wow', sortOrder: 64, complexity: 'detailed' },
    // Easy pack (Pass 11): code-authored vector art (js/pages-easy.js), final quality, pending human art review.
    // Each entry stays on its own line(s) starting `{ id:` so tools/add-illustration.js --page <id> can swap its art.
    { id: 'easy-happy-axolotl', title: 'Happy Axolotl', category: 'easy', lineArt: 'easy/happy-axolotl', sortOrder: 201, difficulty: 1,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-happy-axolotl'] },
    { id: 'easy-starfish', title: 'Axolotl & Starfish', category: 'easy', lineArt: 'easy/starfish', sortOrder: 202, difficulty: 1,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-starfish'] },
    { id: 'easy-fish-friend', title: 'Little Fish Friend', category: 'easy', lineArt: 'easy/fish-friend', sortOrder: 203, difficulty: 1,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-fish-friend'] },
    { id: 'easy-big-bubble', title: 'Big Bubble', category: 'easy', lineArt: 'easy/big-bubble', sortOrder: 204, difficulty: 1,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-big-bubble'] },
    { id: 'easy-jellyfish', title: 'Jellyfish Hello', category: 'easy', lineArt: 'easy/jellyfish', sortOrder: 205, difficulty: 1,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-jellyfish'] },
    { id: 'easy-seahorse', title: 'Seahorse Friend', category: 'easy', lineArt: 'easy/seahorse', sortOrder: 206, difficulty: 2,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-seahorse'] },
    { id: 'easy-treasure', title: 'Tiny Treasure', category: 'easy', lineArt: 'easy/treasure', sortOrder: 207, difficulty: 2,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-treasure'] },
    { id: 'easy-sandcastle', title: 'Sandcastle', category: 'easy', lineArt: 'easy/sandcastle', sortOrder: 208, difficulty: 2,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-sandcastle'] },
    { id: 'easy-balloon', title: 'Axolotl Balloon', category: 'easy', lineArt: 'easy/balloon', sortOrder: 209, difficulty: 2,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-balloon'] },
    { id: 'easy-party', title: 'Axolotl Party', category: 'easy', lineArt: 'easy/party', sortOrder: 210, difficulty: 2,
      complexity: 'easy', lineWeight: 8, artReviewed: false, reference: EASY_REF['easy-party'] },
    { id: 'football', title: 'Football', category: 'sports', lineArt: 'final/football', sortOrder: 65, complexity: 'detailed' },
    { id: 'surfing', title: 'Surfing', category: 'sports', lineArt: 'final/surfing', sortOrder: 66, complexity: 'detailed' },
    { id: 'basketball', title: 'Basketball', category: 'sports', lineArt: 'final/basketball', sortOrder: 67, complexity: 'detailed' },
    { id: 'tennis', title: 'Tennis', category: 'sports', lineArt: 'final/tennis', sortOrder: 68, complexity: 'detailed' },
    { id: 'skateboarding', title: 'Skateboarding', category: 'sports', lineArt: 'final/skateboarding', sortOrder: 69, complexity: 'detailed' },
    { id: 'swimming', title: 'Swimming', category: 'sports', lineArt: 'final/swimming', sortOrder: 70, complexity: 'detailed' },
    { id: 'cycling', title: 'Cycling', category: 'sports', lineArt: 'final/cycling', sortOrder: 71, complexity: 'detailed' },
    { id: 'snowboarding', title: 'Snowboarding', category: 'sports', lineArt: 'final/snowboarding', sortOrder: 72, complexity: 'detailed' },
    { id: 'running', title: 'Running', category: 'sports', lineArt: 'final/running', sortOrder: 73, complexity: 'detailed' },
    { id: 'golf', title: 'Golf', category: 'sports', lineArt: 'final/golf', sortOrder: 74, complexity: 'detailed' },
    { id: 'trick-or-treat', title: 'Trick or Treat', category: 'halloween', lineArt: 'final/trick-or-treat', sortOrder: 75, complexity: 'medium' },
    { id: 'pumpkin-peekaboo', title: 'Pumpkin Peekaboo', category: 'halloween', lineArt: 'final/pumpkin-peekaboo', sortOrder: 76, complexity: 'medium' },
    { id: 'broomstick-ride', title: 'Broomstick Ride', category: 'halloween', lineArt: 'final/broomstick-ride', sortOrder: 77, complexity: 'medium' },
    { id: 'ghost-costume', title: 'Ghost Costume', category: 'halloween', lineArt: 'final/ghost-costume', sortOrder: 78, complexity: 'medium' },
    { id: 'little-vampire', title: 'Little Vampire', category: 'halloween', lineArt: 'final/little-vampire', sortOrder: 79, complexity: 'medium' },
    { id: 'moonlight-castle', title: 'Moonlight Castle', category: 'halloween', lineArt: 'final/moonlight-castle', sortOrder: 80, complexity: 'medium' },
    { id: 'easy-pumpkin', title: 'Happy Pumpkin', category: 'easy', lineArt: 'final/easy-pumpkin', sortOrder: 211, complexity: 'easy' },
    { id: 'christmas-present', title: 'Christmas Present', category: 'christmas', lineArt: 'final/christmas-present', sortOrder: 81, complexity: 'easy' },
    { id: 'christmas-tree', title: 'Christmas Tree', category: 'christmas', lineArt: 'final/christmas-tree', sortOrder: 82, complexity: 'easy' },
    { id: 'candy-cane', title: 'Candy Cane', category: 'christmas', lineArt: 'final/candy-cane', sortOrder: 83, complexity: 'easy' },
    { id: 'christmas-stocking', title: 'Christmas Stocking', category: 'christmas', lineArt: 'final/christmas-stocking', sortOrder: 84, complexity: 'easy' },
    { id: 'snowman-friend', title: 'Snowman Friend', category: 'christmas', lineArt: 'final/snowman-friend', sortOrder: 85, complexity: 'easy' },
    { id: 'christmas-star', title: 'Christmas Star', category: 'christmas', lineArt: 'final/christmas-star', sortOrder: 86, complexity: 'easy' },
    { id: 'sleigh-ride', title: 'Sleigh Ride', category: 'christmas', lineArt: 'final/sleigh-ride', sortOrder: 87, complexity: 'medium' },
    { id: 'ice-skating', title: 'Ice Skating', category: 'christmas', lineArt: 'final/ice-skating', sortOrder: 88, complexity: 'medium' },
    { id: 'decorating-the-tree', title: 'Decorating the Tree', category: 'christmas', lineArt: 'final/decorating-the-tree', sortOrder: 89, complexity: 'medium' },
    { id: 'penguin-hug', title: 'Penguin Hug', category: 'christmas', lineArt: 'final/penguin-hug', sortOrder: 90, complexity: 'medium' },
    { id: 'reindeer-antlers', title: 'Reindeer Antlers', category: 'christmas', lineArt: 'final/reindeer-antlers', sortOrder: 91, complexity: 'medium' },
    { id: 'snow-globe', title: 'Snow Globe', category: 'christmas', lineArt: 'final/snow-globe', sortOrder: 92, complexity: 'medium' },
    { id: 'christmas-cottage', title: 'Christmas Cottage', category: 'christmas', lineArt: 'final/christmas-cottage', sortOrder: 93, complexity: 'advanced' },
    { id: 'around-the-tree', title: 'Around the Tree', category: 'christmas', lineArt: 'final/around-the-tree', sortOrder: 94, complexity: 'advanced' },
    { id: 'reef-sleigh', title: 'Reef Sleigh', category: 'christmas', lineArt: 'final/reef-sleigh', sortOrder: 95, complexity: 'advanced' },
    { id: 'christmas-eve', title: 'Christmas Eve', category: 'christmas', lineArt: 'final/christmas-eve', sortOrder: 96, complexity: 'advanced' },
    { id: 'christmas-market', title: 'Christmas Market', category: 'christmas', lineArt: 'final/christmas-market', sortOrder: 97, complexity: 'advanced' },
    { id: 'tree-of-lights', title: 'Tree of Lights', category: 'christmas', lineArt: 'final/tree-of-lights', sortOrder: 98, complexity: 'advanced' },
    { id: 'halloween-parade', title: 'Halloween Parade', category: 'halloween', lineArt: 'final/halloween-parade', sortOrder: 99, complexity: 'medium' },
    { id: 'pumpkin-parade', title: 'Pumpkin Parade', category: 'halloween', lineArt: 'final/pumpkin-parade', sortOrder: 100, complexity: 'medium' },
    { id: 'sweet-treats', title: 'Sweet Treats', category: 'halloween', lineArt: 'final/sweet-treats', sortOrder: 101, complexity: 'medium' },
    { id: 'haunted-castle', title: 'Haunted Castle', category: 'halloween', lineArt: 'final/haunted-castle', sortOrder: 102, complexity: 'advanced' },
    { id: 'ghost-treats', title: 'Ghost Treats', category: 'halloween', lineArt: 'final/ghost-treats', sortOrder: 103, complexity: 'medium' },
    { id: 'vampire-night', title: 'Vampire Night', category: 'halloween', lineArt: 'final/vampire-night', sortOrder: 104, complexity: 'medium' },
    { id: 'jellyfish-boo', title: 'Jellyfish Boo', category: 'halloween', lineArt: 'final/jellyfish-boo', sortOrder: 105, complexity: 'medium' },
    { id: 'pumpkin-patch', title: 'Pumpkin Patch', category: 'halloween', lineArt: 'final/pumpkin-patch', sortOrder: 106, complexity: 'medium' },
    { id: 'lantern-walk', title: 'Lantern Walk', category: 'halloween', lineArt: 'final/lantern-walk', sortOrder: 107, complexity: 'medium' },
    { id: 'little-monster', title: 'Little Monster', category: 'halloween', lineArt: 'final/little-monster', sortOrder: 108, complexity: 'medium' },
    { id: 'bat-wings', title: 'Bat Wings', category: 'halloween', lineArt: 'final/bat-wings', sortOrder: 109, complexity: 'medium' },
    { id: 'sharing-treats', title: 'Sharing Treats', category: 'halloween', lineArt: 'final/sharing-treats', sortOrder: 110, complexity: 'medium' },
    { id: 'pumpkin-costume', title: 'Pumpkin Costume', category: 'halloween', lineArt: 'final/pumpkin-costume', sortOrder: 111, complexity: 'medium' },
    { id: 'witchs-cauldron', title: 'Witch\'s Cauldron', category: 'halloween', lineArt: 'final/witchs-cauldron', sortOrder: 112, complexity: 'medium' },
    { id: 'witch-and-pumpkin', title: 'Witch and Pumpkin', category: 'halloween', lineArt: 'final/witch-and-pumpkin', sortOrder: 113, complexity: 'medium' },
    { id: 'friendly-ghost', title: 'Friendly Ghost', category: 'halloween', lineArt: 'final/friendly-ghost', sortOrder: 114, complexity: 'medium' },
    { id: 'count-axolotl', title: 'Count Axolotl', category: 'halloween', lineArt: 'final/count-axolotl', sortOrder: 115, complexity: 'medium' },
    { id: 'pumpkin-hat', title: 'Pumpkin Hat', category: 'halloween', lineArt: 'final/pumpkin-hat', sortOrder: 116, complexity: 'medium' },
    { id: 'castle-lookout', title: 'Castle Lookout', category: 'halloween', lineArt: 'final/castle-lookout', sortOrder: 117, complexity: 'medium' },
    { id: 'pirate-treats', title: 'Pirate Treats', category: 'halloween', lineArt: 'final/pirate-treats', sortOrder: 118, complexity: 'medium' },
    { id: 'halloween-party', title: 'Halloween Party', category: 'halloween', lineArt: 'final/halloween-party', sortOrder: 119, complexity: 'medium' },
    { id: 'big-pumpkin', title: 'Big Pumpkin', category: 'halloween', lineArt: 'final/big-pumpkin', sortOrder: 120, complexity: 'medium' },
    { id: 'bat-flight', title: 'Bat Flight', category: 'halloween', lineArt: 'final/bat-flight', sortOrder: 121, complexity: 'medium' },
    { id: 'wizard-treats', title: 'Wizard Treats', category: 'halloween', lineArt: 'final/wizard-treats', sortOrder: 122, complexity: 'medium' },
    { id: 'witchs-castle', title: 'Witch\'s Castle', category: 'halloween', lineArt: 'final/witchs-castle', sortOrder: 123, complexity: 'medium' },
    { id: 'costume-party', title: 'Costume Party', category: 'halloween', lineArt: 'final/costume-party', sortOrder: 124, complexity: 'medium' },
  ].map(withDefaults).sort((a, b) => a.sortOrder - b.sortOrder);
  // Retired pages are out of the gallery, counts and unlocks, but still resolve by id so a picture already
  // coloured on one keeps opening (golden-glow, caravan: parked until Odyssey art matches the game).
  const PAGES = ALL_MAIN.filter(p => !p.retired);
  const RETIRED = ALL_MAIN.filter(p => p.retired);

  // Curated palette (GDD §7), grouped light → dark within each hue.
  const PALETTE = [
    '#ffb3d1', '#ff6fa8', '#ff5a5a', '#ff9f45',
    '#ffd84a', '#8fe07a', '#2fbf71', '#7fd3ff',
    '#3d8bff', '#c9a7ff', '#8b5cf6', '#c8a26b',
    '#8a6a52', '#9aa3ad', '#3a3340', '#ffffff',
  ];

  // Spoken names for colours (screen readers), never shown on screen.
  const COLOUR_NAMES = {
    '#ffb3d1': 'light pink', '#ff6fa8': 'pink', '#ff5a5a': 'red', '#ff9f45': 'orange',
    '#ffd84a': 'yellow', '#8fe07a': 'light green', '#2fbf71': 'green', '#7fd3ff': 'light blue',
    '#3d8bff': 'blue', '#c9a7ff': 'lilac', '#8b5cf6': 'purple', '#c8a26b': 'sand',
    '#8a6a52': 'brown', '#9aa3ad': 'grey', '#3a3340': 'black', '#ffffff': 'white',
  };

  // Create-mode options (all data — art.js knows how to draw each id).
  // Body colours include real axolotl morphs: leucistic (white), melanistic (dark), copper (peach).
  const CREATE_OPTIONS = {
    body: [
      { id: 'pink',   colour: '#ffb3d1', gills: '#ff6fa8' },
      { id: 'white',  colour: '#fff7fa', gills: '#ff8fb8' },
      { id: 'yellow', colour: '#ffe27a', gills: '#ff9f45' },
      { id: 'peach',  colour: '#ffc9a8', gills: '#ff5a5a' },
      { id: 'green',  colour: '#b6ec9f', gills: '#2fbf71' },
      { id: 'blue',   colour: '#9fdcff', gills: '#3d8bff' },
      { id: 'purple', colour: '#d7c2ff', gills: '#8b5cf6' },
      { id: 'dark',   colour: '#6b6485', gills: '#c9a7ff' },
    ],
    gillColours: ['#ff6fa8', '#ff5a5a', '#ff9f45', '#ffd84a', '#2fbf71', '#3d8bff', '#8b5cf6', '#3a3340'],
    gillStyles: ['fronds', 'feathery', 'round', 'long'],
    eyes: ['big', 'small', 'happy', 'sleepy', 'starry', 'silly'],
    patterns: ['none', 'spots', 'stripes', 'stars', 'hearts'],
    accessories: ['none', 'crown', 'wizard', 'pirate', 'explorer', 'helmet', 'glasses'],
  };

  // Name suggestions — tappable, so non-readers can still name their axolotl.
  const NAMES = ['Bubbles', 'Pip', 'Coral', 'Wiggles', 'Mochi', 'Splash', 'Pebble', 'Sunny', 'Noodle', 'Biscuit',
    'Pickle', 'Squish', 'Blossom', 'Ziggy', 'Waffles', 'Pudding', 'Twinkle', 'Nemo', 'Lulu', 'Bean',
    'Sprout', 'Jellybean', 'Puddle', 'Muffin', 'Flip', 'Dotty', 'Gilly', 'Mango', 'Tofu', 'Starla'];

  // Completion cheers — one is picked at random each time.
  const CHEERS = ['Amazing!', 'Beautiful!', 'Wonderful!', 'So colourful!', 'Brilliant!', 'Gorgeous!'];

  /* Categories — DATA ONLY. Adding, renaming or reordering one is an edit here and nothing else:
     the Colour picker draws whatever is listed, in sortOrder, and hides any category with no pages.
       id            the value pages use in `category`
       displayName   shown under the picture (secondary: the thumbnail and padlock do the talking)
       sortOrder     order in the picker; Easy first
       access        'free' | 'premium' (a premium category is a locked state only — no purchase flow yet)
       thumbnail     { page: <page id> } — drawn live from that page's line art; or { svg } later
       icon          a U.icon name, used on the category's page grid heading
       accentColour  the card's tint
     Fun has no artwork yet, so it is configured but stays hidden until a page is filed under it. */
  const CATEGORIES = [
    { id: 'easy',       displayName: 'Easy',       sortOrder: 1, access: 'free',    thumbnail: { page: 'easy-happy-axolotl' }, icon: 'heart',  accentColour: '#ff8fb8' },
    { id: 'fun',        displayName: 'Fun',        sortOrder: 2, access: 'free',    thumbnail: { page: null },                 icon: 'create', accentColour: '#ffc94a' },
    { id: 'friends',    displayName: 'Friends',    sortOrder: 3, access: 'premium', thumbnail: { page: 'baby' },               icon: 'heart',  accentColour: '#8fe07a' },
    { id: 'underwater', displayName: 'Underwater', sortOrder: 4, access: 'premium', thumbnail: { page: 'jelly-hello' },        icon: 'fish',   accentColour: '#7fd3ff' },
    { id: 'adventure',  displayName: 'Adventure',  sortOrder: 5, access: 'premium', thumbnail: { page: 'explorer' },           icon: 'create', accentColour: '#ff9f45' },
    { id: 'sports',     displayName: 'Sports',     sortOrder: 6, access: 'premium', thumbnail: { page: 'football' },           icon: 'crown',  accentColour: '#4fd1b8' },
    { id: 'halloween',  displayName: 'Halloween',  sortOrder: 7, access: 'premium', thumbnail: { page: 'trick-or-treat' },     icon: 'pumpkin', accentColour: '#ff7a1a' },
    { id: 'christmas',  displayName: 'Christmas',  sortOrder: 8, access: 'premium', thumbnail: { page: 'christmas-present' },  icon: 'tree',   accentColour: '#f0575c' },
    { id: 'village',    displayName: 'Village',    sortOrder: 9, access: 'premium', thumbnail: { page: 'market' },             icon: 'home',   accentColour: '#c9a7ff' },
    { id: 'odyssey',    displayName: 'Odyssey',    sortOrder: 10, access: 'premium', thumbnail: { page: 'odyssey' },           icon: 'gills',  accentColour: '#6fa8ff' },
  ].sort((a, b) => a.sortOrder - b.sortOrder);
  const getCategory = id => CATEGORIES.find(c => c.id === id) || null;
  // The pages in one category, in sortOrder (retired and Style Lab pages are never in PAGES).
  const categoryPages = id => PAGES.filter(p => p.category === id);
  // Categories the child can see: those with at least one page.
  const visibleCategories = () => CATEGORIES.filter(c => categoryPages(c.id).length);
  // A page's access: its own `access`, else its category's. Unknown category → premium (never free by accident).
  const accessOf = page => page.access || (getCategory(page.category) || { access: 'premium' }).access;
  // Where "Try another!" goes: the next page in the same category the child hasn't finished (wrapping),
  // among those they can open. `canOpen(page)` and `isDone(page)` come from the caller (Store).
  function nextPage(page, canOpen, isDone) {
    const list = categoryPages(page.category), at = list.findIndex(p => p.id === page.id);
    for (let i = 1; i < list.length; i++) {
      const p = list[(at + i) % list.length];
      if (canOpen(p) && !isDone(p)) return p;
    }
    return null;
  }
  // The Easy-completion threshold a premium page waits on, if it is a taster.
  const tasterThreshold = page => (page.tasterUnlock && page.tasterUnlock.afterEasyCompletions) || 0;

  /* Stage 2 style experiments — one brief, five visual directions (js/pages-lab.js).
     A separate shelf: shown in the grown-ups' Style Lab, never in the children's gallery,
     collection meter or unlock count. `labTitle`, `direction` and `notes` are for the comparison
     sheet; `title` is what a child sees (e.g. in My Axolotls) and is the same for all five. */
  const LAB_PAGES = LAB_DEFS().map(withDefaults).sort((a, b) => a.sortOrder - b.sortOrder);
  function LAB_DEFS() {
    return [
      { id: 'lab-a', title: 'Secret Cave', labTitle: 'A · Simple Cute', category: 'Style Lab', lineArt: 'lab/a-simple', sortOrder: 101,
        complexity: 'easy', lineWeight: 8, characters: ['pip', 'inky'],
        direction: 'Simple Cute',
        notes: 'One idea, huge shapes, 8-unit line. Pip swims up to a round cave; two eyes blink back from the dark.',
        easterEggs: [{ what: 'Inky\'s eyes, watching from inside the cave' }],
        reference: Object.assign(cast('pip', ''), {
          water: '#7fd3ff', bubbles: '#ffffff', seaweed: '#2fbf71', 'cave-rock': '#9aa3ad', 'cave-inside': '#3a3340',
          sand: '#ffd84a', starfish: '#ff9f45', shell: '#ffb3d1', gills: '#ff6fa8', body: '#ffb3d1' }) },

      { id: 'lab-b', title: 'Secret Cave', labTitle: 'B · Storybook', category: 'Style Lab', lineArt: 'lab/b-storybook', sortOrder: 102,
        complexity: 'medium', lineWeight: 5, characters: ['pip', 'inky'],
        direction: 'Storybook',
        notes: 'Picture-book staging: the cave is the subject and Pip is small at its threshold. A lantern fish lights the way; light falls from above; texture in thin lines.',
        easterEggs: [{ what: 'Inky peeking over the cave roof' }, { what: 'A snail on the sand' }],
        reference: Object.assign(cast('pip', ''), cast('inky', 'inky-'), {
          water: '#7fd3ff', bubbles: '#ffffff', 'cave-rock': '#9aa3ad', 'cave-dark': '#8b5cf6', door: '#c8a26b',
          crystals: '#c9a7ff', 'crystals-2': '#7fd3ff', angler: '#3d8bff', 'angler-tail': '#3d8bff', lure: '#ffd84a',
          kelp: '#2fbf71', 'kelp-leaves': '#8fe07a', 'far-rocks': '#c9a7ff', sand: '#ffd84a', ledge: '#8a6a52', plants: '#8fe07a', pebbles: '#9aa3ad', snail: '#ffb3d1', 'snail-shell': '#ff9f45' }) },

      { id: 'lab-c', title: 'Secret Cave', labTitle: 'C · Character Game', category: 'Style Lab', lineArt: 'lab/c-game', sortOrder: 103,
        complexity: 'medium', lineWeight: 7, characters: ['pip', 'inky'],
        direction: 'Character Game',
        notes: 'Bold 7-unit line, chunky faceted rock, a big hero mid-dash on a diagonal, a trail of collectibles, a sidekick reacting, a treasure reveal.',
        easterEggs: [{ what: 'Inky hiding in the treasure chest' }],
        reference: Object.assign(cast('pip', ''), cast('inky', 'inky-'), {
          water: '#3d8bff', 'cave-dark': '#3a3340', chest: '#ff9f45', 'chest-lid': '#ff5a5a', sparkle: '#ffd84a', boulder: '#9aa3ad', grass: '#8fe07a',
          'rock-top': '#8b5cf6', 'rock-left': '#c9a7ff', 'rock-right': '#c9a7ff', pebbles: '#ff6fa8',
          sand: '#ffd84a', crab: '#ff5a5a', 'crab-claws': '#ff5a5a', bubbles: '#ffffff' }) },

      { id: 'lab-d', title: 'Secret Cave', labTitle: 'D · Axolotl Odyssey', category: 'Style Lab', lineArt: 'lab/d-odyssey', sortOrder: 104,
        complexity: 'advanced', lineWeight: 5, characters: [],
        direction: 'Axolotl Odyssey',
        notes: 'Glowspore Deep as a colouring page, with the game\'s own axolotl (flat broad head, iris eyes, comb gills, splayed toes, no costume). Its seven body parts are seven regions — the limb-loss system made visible.',
        easterEggs: [{ what: 'Something horned in the old tunnel — Vermillion?' }, { what: 'A shrimp in a bubble' }, { what: 'A crayfish watching from its burrow' }],
        reference: {
          water: '#3d8bff', ceiling: '#9aa3ad', 'root-1': '#8a6a52', 'root-2': '#8a6a52', 'tunnel-rock': '#9aa3ad', tunnel: '#3a3340',
          horns: '#8b5cf6', 'ledge-high': '#c8a26b', 'ledge-mid': '#c8a26b', moss: '#2fbf71', stalks: '#8fe07a',
          'spore-cap-1': '#7fd3ff', 'spore-cap-3': '#7fd3ff', pebbles: '#ffd84a', silt: '#8a6a52',
          burrow: '#3a3340', crayfish: '#ff5a5a', 'crayfish-claws': '#ff5a5a', 'shrimp-bubble': '#7fd3ff', shrimp: '#ff9f45',
          fish: '#c8a26b', 'fish-tail': '#c8a26b', bubbles: '#7fd3ff',
          head: '#ffb3d1', body: '#ffb3d1', tail: '#ffb3d1', 'fore-left': '#ffb3d1', 'fore-right': '#ffb3d1',
          'hind-left': '#ffb3d1', 'hind-right': '#ffb3d1', 'gill-left': '#ff6fa8', 'gill-right': '#ff6fa8' } },

      { id: 'lab-e', title: 'Secret Cave', labTitle: 'E · Premium Cute', category: 'Style Lab', lineArt: 'lab/e-premium', sortOrder: 105,
        complexity: 'advanced', lineWeight: 5, characters: ['pip', 'sunny', 'inky'],
        direction: 'Premium Cute',
        notes: 'A polished, decorative picture: a crystal grotto with a glowing pearl in a giant clam. Pip gasps, Sunny lights the way, Inky peeks over the top, and a crab got there first.',
        easterEggs: [{ what: 'Inky peeking over the cave' }, { what: 'A crab who found the pearl first' }],
        reference: Object.assign(cast('pip', 'pip-'), cast('sunny', 'sunny-'), cast('inky', 'inky-'), {
          water: '#7fd3ff', hearts: '#ff6fa8', sparkles: '#ffd84a', 'cave-rock': '#c9a7ff', 'cave-inside': '#8b5cf6', 'clam-top': '#ffb3d1', clam: '#ff6fa8',
          pearl: '#ffffff', crab: '#ff5a5a', 'crab-claws': '#ff5a5a', 'crystal-left': '#7fd3ff', 'crystal-top': '#8fe07a',
          'crystal-right': '#ffb3d1', coral: '#ff9f45', sand: '#ffd84a', flowers: '#ff6fa8', 'flowers-middles': '#ffd84a', starfish: '#ff9f45' }) },
    ];
  }

  const ALL_PAGES = PAGES.concat(RETIRED, LAB_PAGES);
  function getPage(id) { return ALL_PAGES.find(p => p.id === id) || null; }

  // The line art a finished picture was coloured on. Pictures from before Pass 7 didn't
  // record it; they were all made on the original placeholder pages.
  function artFor(entry) { return (entry && entry.lineArt) || 'placeholder/' + (entry && entry.pageId); }

  // Dev builds (open the app with ?dev in the address) show art-review flags; a child's copy never does.
  const DEV = /[?&]dev(=|&|$)/.test((window.location && window.location.search) || '');

  window.Content = { DEV, PAGES, LAB_PAGES, ALL_PAGES, CATEGORIES, getCategory, categoryPages, visibleCategories, accessOf, nextPage, tasterThreshold, PALETTE, COLOUR_NAMES, CREATE_OPTIONS, CHEERS, NAMES, getPage, artFor };
})();
