/*
  Create mode — build your own axolotl (GDD §10).
  Six icon tabs; every option is a picture of the result, so no reading is needed.
  The big preview hops each time something changes. Save → "Meet <name>!".
  An unfinished axolotl is kept in memory while the app is open, so popping back
  to Home and returning doesn't lose it.
*/
(function () {
  'use strict';
  const { h } = U;
  const O = () => Content.CREATE_OPTIONS;

  const TABS = [
    { id: 'colour',  icon: 'palette', label: 'Colour' },
    { id: 'gills',   icon: 'gills',   label: 'Gills' },
    { id: 'eyes',    icon: 'eye',     label: 'Eyes' },
    { id: 'pattern', icon: 'spots',   label: 'Pattern' },
    { id: 'hat',     icon: 'crown',   label: 'Hat' },
    { id: 'name',    icon: 'tag',     label: 'Name' },
  ];

  function randomName(except) {
    const pool = Content.NAMES.filter(n => n !== except);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function fresh() {
    const b = O().body[0];
    return { body: b.colour, gills: b.gills, gillStyle: 'fronds', eyes: 'big', pattern: 'none', accessory: 'none', name: randomName() };
  }
  // Big tiles in balanced rows: up to 4 in a row, otherwise two rows (5 → 3 + 2, 7 → 4 + 3).
  function tileRow(tiles) {
    const cols = tiles.length <= 4 ? tiles.length : Math.ceil(tiles.length / 2);
    return h('div', { class: 'tile-row', style: { '--cols': cols, '--count': tiles.length } }, tiles);
  }
  function cleanName(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 14); }

  let draft = null;   // survives leaving the screen, not an app restart
  let lastTab = 'colour';

  Screens.create = {
    render() {
      const ch = draft || (draft = fresh());
      let tab = lastTab;

      /* preview */
      const stageEl = h('div', { class: 'create-preview' });
      const nameTag = h('div', { class: 'name-tag' });
      let alive = null;
      function renderPreview(react) {
        const next = Alive.character(ch);
        if (alive) alive.el.replaceWith(next.el); else stageEl.appendChild(next.el);
        alive = next;
        if (react) alive.react(); else alive.idle();
        nameTag.textContent = ch.name;
      }
      // Tap the preview for a hop, just because.
      stageEl.addEventListener('click', () => { alive.react(); Sound.play('pop'); });

      /* option tiles */
      const panel = h('div', { class: 'create-options', role: 'group' });
      const tile = (look, selected, label, onPick, crop) => {
        const b = h('button', { type: 'button', class: 'option-tile' + (selected ? ' is-selected' : ''), 'aria-label': label, 'aria-pressed': String(selected),
          html: Art.character(Object.assign({}, ch, look, { name: '' }), { crop }) });
        b.addEventListener('click', () => { onPick(); Sound.play('tap'); renderPreview(true); renderPanel(); });
        return b;
      };
      const noneTile = (selected, label, onPick) => {
        const b = h('button', { type: 'button', class: 'option-tile none-tile' + (selected ? ' is-selected' : ''), 'aria-label': label, 'aria-pressed': String(selected) }, U.icon('none'));
        b.addEventListener('click', () => { onPick(); Sound.play('tap'); renderPreview(true); renderPanel(); });
        return b;
      };
      const swatches = (list, current, onPick, labelFor) => h('div', { class: 'swatch-row' }, list.map(c => UI.swatch({
        colour: c.colour || c, selected: (c.colour || c) === current, ariaLabel: labelFor(c),
        onClick: () => { onPick(c); Sound.play('tap'); renderPreview(true); renderPanel(); },
      })));

      const PANELS = {
        colour: () => swatches(O().body, ch.body, b => { ch.body = b.colour; ch.gills = b.gills; }, b => b.id + ' axolotl'),
        gills: () => [
          tileRow(O().gillStyles.map(g => tile({ gillStyle: g }, ch.gillStyle === g, g + ' gills', () => { ch.gillStyle = g; }, 'head'))),
          swatches(O().gillColours, ch.gills, c => { ch.gills = c; }, c => (Content.COLOUR_NAMES[c] || c) + ' gills'),
        ],
        eyes: () => tileRow(O().eyes.map(e => tile({ eyes: e }, ch.eyes === e, e + ' eyes', () => { ch.eyes = e; }, 'head'))),
        pattern: () => tileRow(O().patterns.map(p => p === 'none'
          ? noneTile(ch.pattern === 'none', 'no pattern', () => { ch.pattern = 'none'; })
          : tile({ pattern: p }, ch.pattern === p, p, () => { ch.pattern = p; }))),
        hat: () => tileRow(O().accessories.map(a => a === 'none'
          ? noneTile(ch.accessory === 'none', 'no hat', () => { ch.accessory = 'none'; })
          : tile({ accessory: a }, ch.accessory === a, a, () => { ch.accessory = a; }, 'head'))),
        name: () => {
          const input = h('input', { class: 'name-input', type: 'text', maxlength: '14', value: ch.name, 'aria-label': 'Name',
            autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done' });
          input.addEventListener('input', () => { ch.name = cleanName(input.value) || ch.name; nameTag.textContent = cleanName(input.value) || '…'; });
          input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
          input.addEventListener('blur', () => { ch.name = cleanName(input.value) || randomName(); input.value = ch.name; nameTag.textContent = ch.name; });
          const dice = UI.button({ icon: 'dice', variant: 'secondary', size: 'lg', ariaLabel: 'New name', onClick: () => {
            ch.name = randomName(ch.name); Sound.play('tap'); Speech.say(ch.name); renderPreview(true); renderPanel();
          } });
          const chips = h('div', { class: 'name-chips' }, pickSome(ch.name).map(n => h('button', { type: 'button', class: 'name-chip', onClick: () => {
            ch.name = n; Sound.play('tap'); Speech.say(n); renderPreview(true); renderPanel();
          } }, n)));
          return [h('div', { class: 'name-row' }, input, dice), chips];
        },
      };
      function pickSome(current) {
        const pool = Content.NAMES.filter(n => n !== current).sort(() => Math.random() - 0.5);
        return pool.slice(0, 6);
      }

      /* tabs */
      const tabButtons = {};
      const tabBar = h('div', { class: 'create-tabs', role: 'tablist' }, TABS.map(t => {
        const b = h('button', { type: 'button', class: 'create-tab', role: 'tab', 'aria-label': t.label,
          onClick: () => { tab = lastTab = t.id; Sound.play('tap'); renderPanel(); } },
          U.icon(t.icon), h('span', { class: 'create-tab-label' }, t.label));
        tabButtons[t.id] = b;
        return b;
      }));

      function renderPanel() {
        Object.entries(tabButtons).forEach(([id, b]) => {
          b.classList.toggle('is-active', id === tab);
          b.setAttribute('aria-selected', String(id === tab));
        });
        panel.innerHTML = '';
        U.append(panel, [PANELS[tab]()]);
        panel.setAttribute('aria-label', TABS.find(t => t.id === tab).label);
      }

      const saveBtn = UI.button({
        icon: 'check', label: 'Save', variant: 'primary', colour: 'green', size: 'lg', className: 'finish-btn',
        onClick: () => {
          ch.name = cleanName(ch.name) || randomName();
          const saved = Store.addCharacter(Object.assign({}, ch));
          draft = null;
          lastTab = 'colour';
          UI.go('view/axo/' + saved.id + '/new');
        },
      });

      renderPreview(false);
      renderPanel();

      return UI.screen('create',
        UI.topBar({ back: 'home', backIcon: 'home', title: '', srTitle: 'Create an axolotl', right: saveBtn }),
        h('div', { class: 'create-layout' },
          h('div', { class: 'create-stage' }, stageEl, nameTag),
          h('div', { class: 'create-panel' }, tabBar, panel),
        ),
      );
    },
  };
})();
