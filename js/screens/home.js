(function () {
  'use strict';
  const { h } = U;

  function sparkle(pos) {
    const s = U.icon('create', 'sparkle');
    Object.assign(s.style, pos);
    s.querySelector('svg').setAttribute('fill', 'currentColor');
    return s;
  }

  // Quick mute for the back of the car: one tap, no gate (muting is always safe).
  function muteButton() {
    const btn = UI.button({ icon: Store.settings.sound ? 'sound' : 'mute', variant: 'ghost', size: 'md', className: 'parents-link',
      ariaLabel: Store.settings.sound ? 'Turn sound off' : 'Turn sound on',
      onClick: () => {
        Store.setSetting('sound', !Store.settings.sound);
        if (Store.settings.sound) Sound.play('pop'); else Speech.stop();
        btn.replaceWith(muteButton());
      } });
    btn.setAttribute('aria-pressed', String(!Store.settings.sound));
    return btn;
  }

  // Swap a button's icon for a small picture (a 4-year-old reads pictures, not words).
  function withArt(btn, svg) {
    const icon = btn.querySelector('.icon');
    icon.classList.add('art-chip');
    icon.innerHTML = svg;
    return btn;
  }

  // A little count bubble on a button (hidden at zero).
  function withCount(btn, n) {
    if (n > 0) btn.appendChild(h('span', { class: 'count-badge on-button', 'aria-label': n + ' saved' }, String(n)));
    return btn;
  }

  Screens.home = {
    render() {
      // The hero is the real artwork colouring itself in (js/showcase.js): every illustrated page,
      // starting from a different one each visit. (A picture to look at, not a door: premium pages
      // are still locked in the picker.)
      const showcase = h('div', { class: 'home-hero-art showcase' });
      const pages = Content.PAGES.filter(p => Art.isRaster(p.lineArt));
      const start = pages.length ? Math.floor(Math.random() * pages.length) : 0;
      const stop = Showcase.mount(showcase, pages.slice(start).concat(pages.slice(0, start)));
      const el = UI.screen('home',
        h('div', { class: 'home-mute' }, muteButton()),
        h('div', { class: 'home-parents' },
          UI.button({ icon: 'settings', variant: 'ghost', size: 'md', ariaLabel: 'Grown-ups', to: 'parents', className: 'parents-link' })),
        h('div', { class: 'home-hero' },
          showcase,
          sparkle({ top: '4%', left: '8%' }), sparkle({ top: '14%', right: '6%' }), sparkle({ top: '46%', left: '0%' }),
          // Sticker wordmark; "Colouring" letters take turns through the palette.
          h('h1', { class: 'wordmark', 'aria-label': 'Axolotl Colouring', tabindex: '-1' },
            h('span', { class: 'w1', 'aria-hidden': 'true', 'data-text': 'Axolotl' }, 'Axolotl'),
            h('span', { class: 'w2', 'aria-hidden': 'true', 'data-text': 'Colouring' }, Array.from('Colouring').map(c => h('b', null, c)))),
        ),
        h('nav', { class: 'home-actions', 'aria-label': 'Main' },
          UI.button({ icon: 'palette', label: 'Colour', variant: 'primary', colour: 'pink', size: 'xl', to: 'gallery' }),
          withArt(UI.button({ icon: 'create', label: 'Create', variant: 'primary', colour: 'teal', size: 'xl', to: 'create' }),
            Art.character({ body: '#fff7fa', gills: '#ff8fb8' }, { crop: 'head' })),
          withCount(UI.button({ icon: 'heart', label: 'My Axolotls', variant: 'primary', colour: 'purple', size: 'xl', to: 'collection' }),
            Store.completed.length + Store.characters.length),
        ),
      );
      el._destroy = stop;
      return el;
    },
  };
})();
