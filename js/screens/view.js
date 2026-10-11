/*
  Viewer for one collection item — #/view/pic/<id> or #/view/axo/<id>.
  The picture (or created axolotl) comes alive on open; tapping it plays again.
  One clear next step: colour this page again / make another axolotl.
  #/view/axo/<id>/new is the "Meet <name>!" moment straight after Create's Save:
  a full celebration, and a heart that flies into My Axolotls.
*/
(function () {
  'use strict';
  const { h } = U;

  Screens.view = {
    render(kind, id, flag) {
      const isPic = kind === 'pic';
      const isNew = !isPic && flag === 'new';
      const entry = isPic ? Store.getCompletion(id) : Store.getCharacter(id);
      const page = isPic && entry ? Content.getPage(entry.pageId) : null;
      if (!entry || (isPic && !page)) { Router.replace('collection'); return null; }

      const title = isPic ? page.title : entry.name;
      const bubbleLayer = h('div', { class: 'fx-bubbles', 'aria-hidden': 'true' });
      const still = isPic ? h('div', { class: 'art-holder', html: UI.artStack(Content.artFor(entry), entry.image, title) }) : null;
      let alive = isPic ? null : Alive.character(entry);
      const frame = h('button', { type: 'button', class: 'complete-art view-art' + (isPic ? '' : ' is-character'), 'aria-label': 'Play again', onClick: play },
        isPic ? still : alive.el, bubbleLayer);
      const fx = h('div', { class: 'fx', 'aria-hidden': 'true' });

      let timers = [], gone = false;
      const later = (ms, fn) => timers.push(setTimeout(fn, ms));
      function play() {
        timers.forEach(clearTimeout);
        timers = [];
        if (alive) alive.play();
        Fx.restart(frame, 'reframe');
        later(250, () => Fx.bubbles(bubbleLayer, 10));
        later(1050, () => {
          Fx.confetti(fx, frame, isNew ? 28 : 18);
          if (isNew) { Sound.play('chime'); Speech.say(`Meet ${title}!`); }
          Sound.play('sparkle', isNew ? 0.4 : 0);
        });
        if (isNew && !announced) later(2300, () => {
          announced = true;
          Fx.flyTo(frame, collectionBtn, 'heart', () => { Fx.restart(collectionBtn, 'boing'); Sound.play('tap'); });
        });
        later(3400, () => alive && alive.idle());
      }
      let announced = false;

      // Carry on colouring this picture (a copy — the finished one stays in the collection).
      // Also the way back from an accidental Done. An unfinished draft of the page wins,
      // and a picture made on older artwork can't be continued (it wouldn't line up).
      function colourMore() {
        if (!Store.getDraft(page.id) && Content.artFor(entry) === page.lineArt && entry.image) {
          Store.saveDraft(page.id, entry.image);
        }
        UI.go('colour/' + page.id);
      }

      const collectionBtn = UI.button({ icon: 'heart', label: 'My Axolotls', variant: 'primary', colour: 'purple', size: 'xl', to: 'collection/' + entry.id });
      const action = isPic
        ? UI.button({ icon: 'palette', label: 'Colour more', variant: 'primary', colour: 'pink', size: 'xl', onClick: colourMore })
        : UI.button({ icon: 'create', label: 'Make another', variant: 'primary', colour: 'teal', size: 'xl', to: 'create' });

      const el = UI.screen('view',
        UI.topBar({ back: isNew ? 'home' : 'collection', backIcon: isNew ? 'home' : 'back', title: '', srTitle: isNew ? `Meet ${title}` : title }),
        h('div', { class: 'complete-body' },
          frame,
          h('div', { class: 'complete-side' },
            h('p', { class: 'view-title' + (isNew ? ' is-meet' : '') }, isNew ? `Meet ${title}!` : title),
            h('div', { class: 'complete-actions' }, action, isNew ? collectionBtn : null),
          ),
        ),
        fx,
      );

      if (isPic) {
        Alive.build(Content.artFor(entry), entry.image, title).then(a => {
          if (gone) return;
          alive = a;
          still.replaceWith(a.el);
          play();
        }).catch(() => play());
      } else {
        timers.push(setTimeout(play, 60));
      }
      el._destroy = () => { gone = true; timers.forEach(clearTimeout); Fx.clearFlying(); };
      return el;
    },
  };
})();
