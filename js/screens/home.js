(function () {
  'use strict';
  const { h } = U;

  // Sound: one tap, no gate (muting is always safe). Quick mute for the back of the car.
  function muteButton() {
    const on = Store.settings.sound;
    const btn = UI.actionButton({ variant: 'icon', colour: 'navy', icon: on ? 'solid-sound' : 'solid-mute',
      ariaLabel: on ? 'Turn sound off' : 'Turn sound on',
      onClick: () => {
        Store.setSetting('sound', !Store.settings.sound);
        if (Store.settings.sound) Sound.play('pop'); else Speech.stop();
        btn.replaceWith(muteButton());
      } });
    btn.setAttribute('aria-pressed', String(!on));
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
        // top-right: sound and the grown-ups area (the gate is on that screen)
        h('div', { class: 'home-corner' }, muteButton(),
          UI.actionButton({ variant: 'icon', colour: 'navy', icon: 'solid-lock', ariaLabel: 'Grown-ups', to: 'parents' })),
        h('div', { class: 'home-main' },
          // Logo lockup: a placeholder slot (see .home-logo in css/app.css); the wordmark stands in for now.
          h('div', { class: 'home-logo', 'data-slot': 'logo' },
            h('h1', { class: 'wordmark', 'aria-label': 'Axolotl Colouring', tabindex: '-1' },
              h('span', { class: 'w1', 'aria-hidden': 'true', 'data-text': 'Axolotl' }, 'Axolotl'),
              h('span', { class: 'w2', 'aria-hidden': 'true', 'data-text': 'Colouring' }, Array.from('Colouring').map(c => h('b', null, c))))),
          h('nav', { class: 'home-actions', 'aria-label': 'Main' },
            UI.actionButton({ variant: 'primary', icon: 'solid-crayon', label: 'Colour!', to: 'gallery' }),
            h('div', { class: 'home-actions-row' },
              UI.actionButton({ variant: 'secondary', colour: 'teal', icon: 'solid-axolotl', label: 'Create', to: 'create' }),
              withCount(UI.actionButton({ variant: 'secondary', colour: 'pink', icon: 'solid-heart', label: 'My Axolotls', to: 'collection' }),
                Store.completed.length + Store.characters.length))),
          h('div', { class: 'home-art' }, showcase)),
      );
      el._destroy = stop;
      return el;
    },
  };
})();
