/*
  My Axolotls — the child's collection, built to feel like a reward:
  a bubble meter of pages coloured, a shelf of picture "snapshots", a shelf of
  created axolotl portraits, and a "+" tile on each shelf inviting another.
  Every card opens the viewer, where it comes alive.
*/
(function () {
  'use strict';
  const { h } = U;

  // One bubble per page, filled (in a cheerful colour) once that page has been finished.
  function progressMeter() {
    const done = Store.completedPageIds();
    const colours = ['#ff6fa8', '#ffd84a', '#7fd3ff', '#8fe07a', '#c9a7ff', '#ff9f45'];
    // One bubble per picture the child can reach (open now, or already finished) — never a wall of padlocked ones.
    const reach = Content.PAGES.filter(p => Store.isPageUnlocked(p) || done.has(p.id));
    const bubbles = reach.map((p, i) => h('span', {
      class: 'meter-bubble' + (done.has(p.id) ? ' is-full' : ''),
      style: done.has(p.id) ? { '--c': colours[i % colours.length], animationDelay: (i * 0.05) + 's' } : null,
    }));
    const n = reach.filter(p => done.has(p.id)).length;
    return h('div', { class: 'meter', role: 'img', 'aria-label': `${n} of ${reach.length} pictures coloured` },
      h('div', { class: 'meter-art', html: Art.character({ body: '#ffb3d1', gills: '#ff6fa8' }) }),
      h('div', { class: 'meter-bubbles' }, bubbles),
      h('span', { class: 'meter-count', 'aria-hidden': 'true' }, `${n}/${reach.length}`),
    );
  }

  function addTile(icon, label, to, colour) {
    return h('button', { type: 'button', class: 'add-tile add-' + colour, 'aria-label': label, onClick: () => UI.go(to) },
      h('span', { class: 'add-plus' }, U.icon('plus')),
      h('span', { class: 'add-label' }, U.icon(icon), label));
  }

  function shelf(iconName, title, count, body) {
    return h('section', { class: 'collection-section' },
      h('h2', { class: 'section-title' }, U.icon(iconName), ' ' + title,
        count ? h('span', { class: 'count-badge', 'aria-label': count + ' items' }, String(count)) : null),
      body);
  }

  Screens.collection = {
    render(highlightId) {
      const pictures = Store.completed.slice().reverse();
      const characters = Store.characters.slice().reverse();

      const picCards = pictures.map(p => {
        const page = Content.getPage(p.pageId);
        if (!page) return null;
        return UI.artCard({
          className: 'snapshot',
          svg: UI.artStack(Content.artFor(p), p.image, page.title),
          title: page.title,
          highlight: p.id === highlightId,
          onClick: () => UI.go('view/pic/' + p.id),
        });
      });
      const charCards = characters.map(c => UI.artCard({
        className: 'portrait',
        svg: Art.character(c),
        title: c.name,
        highlight: c.id === highlightId,
        onClick: () => UI.go('view/axo/' + c.id),
      }));

      const pics = shelf('palette', 'Pictures', pictures.length, pictures.length
        ? h('div', { class: 'card-grid' }, picCards, addTile('palette', 'Colour', 'gallery', 'pink'))
        : UI.emptyState({ svg: Art.character({ body: '#ffe27a', gills: '#ff9f45' }), text: 'Your pictures will live here.', action: { icon: 'palette', label: 'Colour', colour: 'pink', to: 'gallery' } }));

      const axos = shelf('create', 'My axolotls', characters.length, characters.length
        ? h('div', { class: 'card-grid' }, charCards, addTile('create', 'Create', 'create', 'teal'))
        : UI.emptyState({ svg: Art.character({ body: '#d7c2ff', gills: '#8b5cf6' }), text: 'Make your own axolotl!', action: { icon: 'create', label: 'Create', colour: 'teal', to: 'create' } }));

      const el = UI.screen('collection',
        UI.topBar({ back: 'home', backIcon: 'home', title: 'My Axolotls' }),
        h('div', { class: 'scroll' }, progressMeter(), pics, axos),
      );

      // Bring a just-added card into view.
      if (highlightId) setTimeout(() => {
        const card = el.querySelector('.art-card.is-new');
        if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 350);
      return el;
    },
  };
})();
