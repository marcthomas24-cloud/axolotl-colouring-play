/*
  Completion — the "bring to life" moment (GDD §8).

  Timeline (≈3.5s, never blocking — the buttons work from the first frame):
    0.0  picture reframes in                 0.3  bubbles rise, soft pops
    0.45 blink                               0.55 gills wiggle
    1.0  hop + tail swish                    1.1  sparkle confetti + chime
    1.2  cheer ("Amazing!" etc.)             2.3  heart flies into My Axolotls → "Saved"
    3.4  settles into idle life (occasional blink + gill sway)
    3.7  if this was the 3rd Easy picture: a one-time "New friends to colour!" card appears (tap to go and colour them)
  Tapping the picture replays it. The picture was saved before we got here,
  so leaving early never loses it.

  What comes next is icon-led, no reading needed: a big "Try another!" card showing the next picture
  in the category the child hasn't finished (Easy → the next Easy page), a grid button back to the
  category's pictures, and My Axolotls.
*/
(function () {
  'use strict';
  const { h } = U;

  Screens.complete = {
    render(entryId) {
      const entry = Store.getCompletion(entryId);
      const page = entry && Content.getPage(entry.pageId);
      if (!entry || !page) { Router.replace('collection'); return null; }

      // The plain picture shows at once; the living version swaps in when its sprites are built.
      const still = h('div', { class: 'art-holder', html: UI.artStack(Content.artFor(entry), entry.image, page.title) });
      const bubbleLayer = h('div', { class: 'fx-bubbles', 'aria-hidden': 'true' });
      const frame = h('button', { type: 'button', class: 'complete-art', 'aria-label': 'Play again', onClick: () => celebrate(false) },
        still, bubbleLayer);
      let alive = null, started = false, gone = false;
      const fx = h('div', { class: 'fx', 'aria-hidden': 'true' });
      const cheer = h('p', { class: 'complete-cheer', 'aria-live': 'polite' });
      const note = h('p', { class: 'complete-note' }, U.icon('heart'), ' Saved to My Axolotls');
      const collectionBtn = UI.button({ icon: 'heart', label: 'My Axolotls', variant: 'primary', colour: 'purple', size: 'xl', to: 'collection' });

      let timers = [];
      const later = (ms, fn) => timers.push(setTimeout(fn, ms));

      // The Friends taster: shown once, ever, and only when the pages it celebrates really are open
      // (Store.tasterToCelebrate), so it never leads to a padlock.
      const tasters = Store.tasterToCelebrate(entry.id);
      const unlockSlot = h('div', { class: 'unlock-slot' });
      function revealTaster() {
        if (!tasters.length) return;
        const first = tasters[0];
        Store.markTasterCelebrated();
        unlockSlot.appendChild(h('button', { type: 'button', class: 'unlock-card taster-card', 'aria-label': 'New friends to colour!',
          onClick: () => UI.go('gallery/' + first.category) },
          h('span', { class: 'unlock-thumb', html: UI.artStack(first.lineArt, null, first.title) }),
          h('span', { class: 'unlock-text' }, U.icon('create'), 'New friends to colour!'),
        ));
        Sound.play('sparkle');
        Speech.say('New friends to colour!');
      }

      // "Try another!": the next picture in this category that the child can open and hasn't finished.
      const next = Content.nextPage(page, p => Store.isPageUnlocked(p), p => Store.isPageCompleted(p.id));
      const tryCard = h('button', { type: 'button', class: 'try-card', 'aria-label': next ? 'Try another: ' + next.title : 'See all the pictures',
        onClick: () => UI.go(next ? 'colour/' + next.id : 'gallery/' + page.category) },
        h('span', { class: 'try-thumb', html: next ? UI.artStack(next.lineArt, null, next.title) : '' }, next ? null : U.icon('palette')),
        h('span', { class: 'try-text' }, 'Try another!'),
        U.icon('next'));
      const gridBtn = UI.button({ icon: 'grid', variant: 'primary', colour: 'teal', size: 'xl', ariaLabel: 'All the pictures', to: 'gallery/' + page.category, className: 'grid-btn' });

      // The finished picture "goes into" My Axolotls: a heart flies to the button.
      function flyHeart() {
        Fx.flyTo(frame, collectionBtn, 'heart', () => {
          Fx.restart(collectionBtn, 'boing');
          note.classList.add('show');
          Sound.play('tap');
          later(500, revealTaster);
        });
      }

      function celebrate(first) {
        started = true;
        timers.forEach(clearTimeout);
        timers = [];
        if (alive) alive.play();
        Fx.restart(frame, 'reframe');
        cheer.textContent = Fx.pick(Content.CHEERS);
        cheer.classList.remove('show');
        later(300, () => Fx.bubbles(bubbleLayer));
        later(1100, () => { Fx.confetti(fx, frame); Sound.play('chime'); Sound.play('sparkle', 0.4); });
        later(1200, () => { Fx.restart(cheer, 'show'); Speech.say(cheer.textContent); });
        if (first) later(2300, flyHeart);
        later(3400, () => alive && alive.idle());
      }

      const el = UI.screen('complete',
        UI.topBar({ back: 'home', backIcon: 'home', title: '', srTitle: page.title + ' is finished' }),
        h('div', { class: 'complete-body' },
          frame,
          h('div', { class: 'complete-side' },
            cheer,
            note,
            unlockSlot,
            h('div', { class: 'complete-actions' },
              tryCard,
              h('div', { class: 'complete-actions-row' }, gridBtn, collectionBtn),
            ),
          ),
        ),
        fx,
      );

      // Start once the living picture is ready — or after a short wait regardless, so a slow
      // device still celebrates straight away (the axolotl then joins in when it's ready).
      const fallback = setTimeout(() => { if (!started) celebrate(true); }, 700);
      Alive.build(Content.artFor(entry), entry.image, page.title).then(a => {
        if (gone) return;
        alive = a;
        still.replaceWith(a.el);
        if (!started) { clearTimeout(fallback); celebrate(true); }
        else a.idle();
      }).catch(() => { /* keep the still picture */ });
      el._destroy = () => {
        gone = true;
        clearTimeout(fallback);
        timers.forEach(clearTimeout);
        Fx.clearFlying();
      };
      return el;
    },
  };
})();
