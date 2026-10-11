/*
  Grown-ups area — kept apart from the child flow.
  Reached from a small, quiet button on Home, and always behind the parent gate
  (also when the #/parents address is opened directly). Leaving it returns to Home,
  and the gate is asked again next time.
*/
(function () {
  'use strict';
  const { h } = U;
  const VERSION = 'Release prototype (Pass 11: categories, free Easy pack, Friends taster)';

  function kb(bytes) { return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'; }

  function switchRow(icon, label, hint, key, onChange) {
    const sw = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-label': label });
    const paint = () => sw.setAttribute('aria-checked', String(!!Store.settings[key]));
    sw.addEventListener('click', () => { Store.setSetting(key, !Store.settings[key]); paint(); if (onChange) onChange(Store.settings[key]); });
    paint();
    const row = h('div', { class: 'switch-row' },
      h('span', { class: 'label' }, U.icon(icon), h('span', null, label, hint ? h('small', { class: 'hint' }, hint) : null)),
      sw);
    row._switch = sw;
    return row;
  }

  function renderArea(el) {
    const body = h('div', { class: 'scroll parents-body' });

    /* sound */
    const voiceRow = switchRow('tag', 'Spoken words', 'Reads out cheers and names for children who can’t read yet.', 'voice',
      on => { if (on) Speech.say('Hello!'); });
    const soundRow = switchRow('sound', 'Sounds', 'Turns off every sound, including spoken words.', 'sound', on => {
      if (on) Sound.play('chime'); else Speech.stop();
      voiceRow._switch.disabled = !on;
    });
    voiceRow._switch.disabled = !Store.settings.sound;

    /* pictures */
    const unlockRow = switchRow('lock', 'Unlock all content (testing)', 'For testing only: opens every category and picture, including the premium ones that are locked for children.', 'unlockAll');

    /* saved work */
    const manage = h('div', { class: 'manage-grid' });
    const summary = h('p', { class: 'panel-note' });
    const resetBtn = UI.button({ icon: 'trash', label: 'Delete everything', variant: 'secondary', size: 'md', className: 'danger-btn', onClick: async () => {
      if (await UI.confirm({ title: 'Delete everything?', text: 'All pictures, axolotls and unfinished drawings will be removed from this device. This can’t be undone.', confirmLabel: 'Delete everything', danger: true })) {
        Store.resetAll();
        paintSaved();
        unlockRow._switch.setAttribute('aria-checked', 'false');
      }
    } });
    function paintSaved() {
      const pics = Store.completed.slice().reverse(), axos = Store.characters.slice().reverse();
      summary.textContent = `${pics.length} picture${pics.length === 1 ? '' : 's'} · ${axos.length} axolotl${axos.length === 1 ? '' : 's'} · ${kb(Store.storageBytes())} on this device`;
      manage.innerHTML = '';
      const tile = (art, title, onDelete) => h('div', { class: 'manage-tile' },
        h('div', { class: 'manage-art', html: art }),
        h('span', { class: 'manage-name' }, title),
        h('button', { type: 'button', class: 'manage-delete', 'aria-label': 'Delete ' + title, onClick: onDelete }, U.icon('trash')));
      pics.forEach(p => {
        const page = Content.getPage(p.pageId);
        if (!page) return;
        manage.appendChild(tile(UI.artStack(Content.artFor(p), p.image, page.title), page.title, async () => {
          if (await UI.confirm({ title: 'Delete this picture?', text: `“${page.title}” will be removed from My Axolotls. This can’t be undone.`, confirmLabel: 'Delete', danger: true })) {
            Store.deleteCompletion(p.id);
            paintSaved();
          }
        }));
      });
      axos.forEach(c => manage.appendChild(tile(Art.character(c), c.name, async () => {
        if (await UI.confirm({ title: `Delete ${c.name}?`, text: 'This axolotl will be removed from My Axolotls. This can’t be undone.', confirmLabel: 'Delete', danger: true })) {
          Store.deleteCharacter(c.id);
          paintSaved();
        }
      })));
      if (!pics.length && !axos.length) manage.appendChild(h('p', { class: 'panel-note' }, 'Nothing saved yet.'));
      resetBtn.disabled = !pics.length && !axos.length && !Object.keys(Store.drafts || {}).length;
    }
    paintSaved();

    U.append(body, [
      h('div', { class: 'panel' }, h('h2', { class: 'section-title' }, 'Sound'), soundRow, voiceRow),
      h('div', { class: 'panel' }, h('h2', { class: 'section-title' }, 'Pictures'), unlockRow),
      h('div', { class: 'panel' },
        h('h2', { class: 'section-title' }, 'Style Lab'),
        h('p', null, 'Five art styles for the same picture. Compare them, and let your child try each one.'),
        UI.button({ icon: 'palette', label: 'Open the Style Lab', variant: 'secondary', size: 'md', onClick: () => { Screens.lab.trusted = true; UI.go('lab'); } })),
      h('div', { class: 'panel' }, h('h2', { class: 'section-title' }, 'Saved work'), summary, manage, resetBtn),
      h('div', { class: 'panel' },
        h('h2', { class: 'section-title' }, 'Privacy & safety'),
        h('ul', { class: 'facts' },
          h('li', null, 'Everything stays on this device. Nothing is uploaded, shared or collected.'),
          h('li', null, 'No accounts, no ads, no chat and no links to other websites.'),
          h('li', null, 'Works without an internet connection. Spoken words use this device’s own voice.'),
          h('li', null, 'Names your child types are only used on this device.'),
          h('li', null, 'This area is behind a grown-ups question and isn’t part of the children’s screens.'))),
      h('div', { class: 'panel' }, h('h2', { class: 'section-title' }, 'About'), h('p', null, 'Axolotl Colouring · ' + VERSION)),
    ]);
    el.appendChild(body);
  }

  Screens.parents = {
    render() {
      const el = UI.screen('parents', UI.topBar({ back: 'home', backIcon: 'home', title: 'Grown-ups' }));
      // Always gated — including when the address is typed or reloaded directly.
      setTimeout(async () => {
        if (await UI.parentGate()) renderArea(el);
        else if (location.hash === '#/parents') Router.replace('home');
      }, 0);
      return el;
    },
  };
})();
