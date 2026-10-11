/*
  Style Lab (grown-ups only) — Stage 2's art-direction comparison sheet.
  One brief ("Axolotl Explorer discovers a mysterious underwater cave") in five visual
  directions, side by side as line art and as a finished reference, with each page's
  region audit, its hidden discoveries, and a button to colour it for real. Also shows
  the recurring cast and an audit of every live gallery page.

  Reached from the Grown-ups area. Like it, always behind the parent gate — except when
  arriving straight from the Grown-ups area, which has just asked.
*/
(function () {
  'use strict';
  const { h } = U;
  const castSvg = inner => `<svg class="art" viewBox="-10 -14 420 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<g stroke="${Art.INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

  function chip(text, kind) { return h('span', { class: 'lab-chip' + (kind ? ' is-' + kind : '') }, text); }

  // Region audit, measured after the screen is up (it rasterises each page once).
  function auditInto(slot, page) {
    setTimeout(() => {
      try {
        const a = Audit.auditArt(page.lineArt, page.complexity, page.lineWeight);
        slot.textContent = '';
        U.append(slot, [
          chip(`${a.count} regions`),
          chip(`fingertip room ≥ ${a.smallestReachPt}pt`),
          a.pass ? chip('passes region rules', 'ok') : chip(`${a.problems.length + a.flagged.length} region issue(s)`, 'bad'),
        ]);
        if (!a.pass) slot.title = a.problems.concat(a.flagged.map(r => `${r.id}: ${r.issues.join(', ')}`)).join('\n');
      } catch (e) { slot.textContent = 'Audit unavailable'; }
    }, 30);
  }

  function experimentCard(page) {
    const draft = Store.getDraft(page.id);
    const facts = h('div', { class: 'lab-facts' }, chip('Measuring…'));
    auditInto(facts, page);
    const cast = page.characters.map(id => Characters.CAST[id] && Characters.CAST[id].name).filter(Boolean);
    return h('article', { class: 'panel lab-card' },
      h('div', { class: 'lab-card-head' },
        h('h2', { class: 'section-title' }, page.labTitle),
        chip(Audit.RULES[page.complexity].label, page.complexity)),
      h('div', { class: 'lab-pair' },
        h('figure', null, h('div', { class: 'lab-art', html: UI.artStack(page.lineArt, draft && draft.image, page.title) }), h('figcaption', null, draft ? 'Being coloured' : 'Line art')),
        h('figure', null, h('div', { class: 'lab-art', html: Art.coloured(page.lineArt, page.reference, page.title + ' finished') }), h('figcaption', null, 'Finished reference'))),
      h('p', null, page.notes),
      facts,
      h('ul', { class: 'facts' },
        cast.length ? h('li', null, 'Cast: ' + cast.join(', ')) : h('li', null, 'Cast: the Axolotl Odyssey hero (Leucistic)'),
        page.easterEggs.map(e => h('li', null, 'Hidden: ' + e.what))),
      UI.button({ icon: 'brush', label: 'Colour this one', variant: 'primary', size: 'md', onClick: () => UI.go('colour/' + page.id) }));
  }

  function castCard(id, c) {
    const pose = { pip: ['reach', 'gasp', 'wave'], sunny: ['reach', 'smile', 'wave'], inky: ['stand', 'smile', 'swish'], penny: ['stand', 'grin', 'curl'] }[id] || ['stand', 'smile', 'swish'];
    const art = LabArt.axo(Characters.fillsFor(id, ''), { who: id, pose: pose[0], mouth: pose[1], tail: pose[2] });
    return h('div', { class: 'lab-cast' },
      h('div', { class: 'lab-cast-art', html: castSvg(art) }),
      h('h3', null, c.name, h('small', null, ' · ' + c.morph)),
      h('p', null, c.personality),
      h('p', { class: 'lab-cast-tell' }, c.silhouette));
  }

  function liveAudit() {
    const body = h('tbody');
    const table = h('table', { class: 'lab-table' },
      h('thead', null, h('tr', null, h('th', null, 'Page'), h('th', null, 'Level'), h('th', null, 'Regions'), h('th', null, 'Room'), h('th', null, ''))), body);
    setTimeout(async () => {
      for (const p of Content.PAGES) {
        const a = await Audit.auditPage(p);
        const status = a.pass ? (a.tiny ? `✓ (${a.tiny} tiny)` : '✓') : (a.flagged.length + a.problems.length) + ' to fix';
        body.appendChild(h('tr', null, h('td', null, p.title), h('td', null, a.complexity), h('td', null, String(a.count)),
          h('td', null, a.smallestReachPt + 'pt'),
          h('td', { title: a.problems.concat(a.flagged.map(r => r.id + ': ' + r.issues.join(', '))).join('\n') }, status)));
      }
    }, 60);
    return h('details', { class: 'lab-details' }, h('summary', null, 'Region audit of every live page'), table);
  }

  function renderLab(el) {
    const body = h('div', { class: 'scroll parents-body lab-body' });
    U.append(body, [
      h('div', { class: 'panel' },
        h('h2', { class: 'section-title' }, 'Five directions, one brief'),
        h('p', null, '“Axolotl Explorer discovers a mysterious underwater cave.” Each version below is a real, colourable page. ' +
          'Compare them here, then hand the tablet over: which does your child pick, which do they finish, and where do they get stuck?'),
        h('p', { class: 'panel-note' }, 'Finished pictures go into My Axolotls like any other page.')),
      Content.LAB_PAGES.map(experimentCard),
      h('div', { class: 'panel' },
        h('h2', { class: 'section-title' }, 'The recurring cast'),
        h('p', null, 'Four axolotls who can appear across pages — the same four real colour morphs as Axolotl Odyssey. Each is recognisable in plain line art by shape alone.'),
        h('div', { class: 'lab-cast-grid' }, Object.entries(Characters.CAST).map(([id, c]) => castCard(id, c)))),
      h('div', { class: 'panel' }, liveAudit()),
    ]);
    el.appendChild(body);
  }

  Screens.lab = {
    trusted: false, // set by the Grown-ups area just before it opens the lab
    render() {
      const el = UI.screen('lab', UI.topBar({ back: 'home', backIcon: 'home', title: 'Style Lab' }));
      const trusted = Screens.lab.trusted;
      Screens.lab.trusted = false;
      if (trusted) renderLab(el);
      else setTimeout(async () => {
        if (await UI.parentGate()) renderLab(el);
        else if (location.hash === '#/lab') Router.replace('home');
      }, 0);
      return el;
    },
  };
})();
