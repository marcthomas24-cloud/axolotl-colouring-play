/*
  Colour entry: a category picker (#/gallery) and, inside a category, its page grid (#/gallery/<categoryId>).

  The picker is one big card per visible category (Content.CATEGORIES, in sortOrder; a category with no
  pages is hidden). It must work without reading: the thumbnail and the open / padlock bubble do the
  talking, Easy is first and biggest. A premium category is a LOCKED STATE only — tapping it opens a calm
  "coming soon, ask a grown-up" panel with one Close button; the only way on from there is a small grown-ups
  link behind the parent gate, which leads to a placeholder (no purchase flow exists yet).
  A premium category with an earned taster page ('peek') opens its grid, where the open pages are playable
  and the rest are padlocks that raise the same calm panel.
*/
(function () {
  'use strict';
  const { h } = U;

  // A category's picture: the page's finished colouring where it has one (Easy — the inviting, coloured-in
  // look), otherwise its line art.
  const thumbFor = cat => {
    const page = cat.thumbnail && Content.getPage(cat.thumbnail.page);
    if (!page) return '';
    return page.reference && !Art.isRaster(page.lineArt) ? Art.coloured(page.lineArt, page.reference, cat.displayName)
      : UI.artStack(page.lineArt, null, cat.displayName);
  };

  /* ── the calm "coming soon" panel ── */
  function showLocked(cat) {
    const close = () => m.close();
    const m = UI.modal([
      h('div', { class: 'locked-thumb', html: thumbFor(cat) }),
      h('div', { class: 'locked-lock' }, U.icon('lock')),
      h('h2', { class: 'modal-title' }, 'Coming soon!'),
      h('p', { class: 'modal-text' }, 'Ask a grown-up.'),
      UI.button({ icon: 'close', label: 'Close', variant: 'primary', colour: 'pink', size: 'lg', className: 'locked-close', onClick: close }),
      // The only way to an unlock route: behind the parent gate, and it leads to a placeholder.
      h('button', { type: 'button', class: 'grownups-link', onClick: async () => { if (await UI.parentGate()) showUnlockPlaceholder(); } },
        U.icon('lock'), 'For grown-ups'),
    ], { label: cat.displayName + ' — coming soon', onDismiss: close });
    m.card.classList.add('locked-card');
    m.card.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    Sound.play('tap');
  }

  // Placeholder only: no pricing, no store, nothing to buy (GDD §16).
  function showUnlockPlaceholder() {
    const m = UI.modal([
      h('div', { class: 'locked-lock' }, U.icon('lock')),
      h('h2', { class: 'modal-title' }, 'Unlocking isn’t ready yet'),
      h('p', { class: 'modal-text' }, 'There is nothing to buy in this prototype. To try every picture, turn on “Unlock all content (testing)” in the grown-ups area.'),
      UI.button({ icon: 'close', label: 'Close', variant: 'primary', colour: 'pink', size: 'lg', className: 'locked-close', onClick: () => m.close() }),
    ], { label: 'Unlocking placeholder', onDismiss: () => m.close() });
    m.card.addEventListener('keydown', e => { if (e.key === 'Escape') m.close(); });
  }

  /* ── the category picker ── */
  function categoryCard(cat, hero) {
    const state = Store.categoryState(cat);           // open | peek | locked
    const pages = Content.categoryPages(cat.id);
    const done = pages.filter(p => Store.isPageCompleted(p.id)).length;
    const open = state === 'open';
    const fresh = state === 'peek' && Store.hasNewTasters(cat);
    const el = h('button', {
      type: 'button',
      class: 'cat-card' + (hero ? ' cat-hero' : '') + ' is-' + state,
      style: { '--accent': cat.accentColour },
      'aria-label': `${cat.displayName}, ${pages.length} ${pages.length === 1 ? 'picture' : 'pictures'}` + (state === 'locked' ? ', coming soon' : state === 'peek' ? ', some pictures open' : ''),
      onClick: () => {
        if (state === 'locked') { Fx.restart(el, 'wiggle'); showLocked(cat); return; }
        UI.go('gallery/' + cat.id);
      },
    },
      h('div', { class: 'cat-frame', html: thumbFor(cat) }),
      // open (free) or padlock: the child's cue, no reading needed
      h('span', { class: 'cat-state ' + (open ? 'is-open' : 'is-shut'), 'aria-hidden': 'true' }, U.icon(open ? 'unlock' : 'lock')),
      fresh ? h('span', { class: 'cat-fresh', 'aria-hidden': 'true' }, U.icon('create')) : null,
      h('div', { class: 'cat-text' },
        h('span', { class: 'cat-name' }, cat.displayName),
        // progress as dots (readable without numbers); the count is secondary
        open && pages.length <= 12
          ? h('span', { class: 'cat-dots', 'aria-hidden': 'true' }, pages.map((p, i) => h('i', { class: i < done ? 'is-full' : '' })))
          : h('span', { class: 'cat-count' }, pages.length + (pages.length === 1 ? ' picture' : ' pictures'))),
    );
    return el;
  }

  function renderPicker() {
    const cats = Content.visibleCategories();
    return UI.screen('gallery',
      UI.topBar({ back: 'home', backIcon: 'home', title: 'Pick a picture' }),
      h('div', { class: 'scroll' }, h('div', { class: 'cat-grid' }, cats.map((c, i) => categoryCard(c, i === 0)))),
    );
  }

  /* ── one category's pages ── */
  function renderCategory(cat) {
    const grid = h('div', { class: 'card-grid' });
    Content.categoryPages(cat.id).forEach(page => grid.appendChild(card(page)));

    function card(page) {
      const unlocked = Store.isPageUnlocked(page);
      const draft = Store.getDraft(page.id);
      const el = UI.artCard({
        svg: UI.artStack(page.lineArt, draft && draft.image, page.title),
        title: page.title,
        locked: !unlocked,
        done: Store.isPageCompleted(page.id),
        fresh: Store.isNewlyOpen(page),
        stars: page.difficulty,
        devFlag: Content.DEV && page.artReviewed === false,
        ariaLabel: unlocked ? page.title : page.title + ' (coming soon)',
        onClick: () => {
          if (unlocked) return UI.go('colour/' + page.id);
          Fx.restart(el, 'nope');      // locked: a gentle wiggle and the calm panel, never a dead end
          showLocked(cat);
        },
      });
      return el;
    }

    return UI.screen('gallery',
      UI.topBar({ back: 'gallery', title: cat.displayName }),
      h('div', { class: 'scroll' }, grid),
    );
  }

  Screens.gallery = {
    showLocked,
    render(catId) {
      const cat = catId && Content.getCategory(catId);
      // Unknown, hidden or fully locked category (e.g. a stale link): back to the picker.
      if (cat && Content.categoryPages(cat.id).length && Store.categoryState(cat) !== 'locked') return renderCategory(cat);
      if (catId) { Router.replace('gallery'); return null; }
      return renderPicker();
    },
  };
})();
