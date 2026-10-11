/* Reusable UI building blocks. Screens compose these; they don't hand-roll buttons. */
(function () {
  'use strict';
  const { h, icon } = U;

  function go(route) { Router.go(route); }

  /* Button. variant: primary | secondary | ghost | tool. size: md | lg | xl. */
  function button(o) {
    const cls = ['btn', 'btn-' + (o.variant || 'secondary'), 'btn-' + (o.size || 'md')];
    if (o.colour) cls.push('btn-colour-' + o.colour);
    if (!o.label) cls.push('btn-icon-only');
    if (o.className) cls.push(o.className);
    const el = h('button', {
      type: 'button',
      class: cls.join(' '),
      'aria-label': o.ariaLabel || o.label || o.icon,
      'aria-pressed': o.pressed == null ? null : String(!!o.pressed),
      disabled: o.disabled || null,
      onClick: e => {
        if (el.disabled) return;
        if (o.to) go(o.to);
        if (o.onClick) o.onClick(e);
      },
    },
      o.icon ? icon(o.icon) : null,
      o.label ? h('span', { class: 'btn-label' }, o.label) : null,
    );
    return el;
  }

  /* Action button for polished screens (docs/POLISH_BRIEF.md). variant: primary | secondary | icon.
     primary: large, yellow, ink label, icon on the left; one per screen.
     secondary: smaller; colour: pink | teal.
     icon: round, 56px, no label; needs `ariaLabel`. colour is optional (white if left out). */
  function actionButton(o) {
    const variant = o.variant || 'secondary';
    const colour = variant === 'primary' ? null : o.colour || (variant === 'secondary' ? 'pink' : null);
    const cls = ['action-btn', 'action-btn-' + variant];
    if (colour) cls.push('action-btn-' + colour);
    if (o.className) cls.push(o.className);
    const label = variant === 'icon' ? null : o.label;
    const el = h('button', {
      type: 'button',
      class: cls.join(' '),
      'aria-label': o.ariaLabel || o.label || o.icon,
      'aria-pressed': o.pressed == null ? null : String(!!o.pressed),
      disabled: o.disabled || null,
      onClick: e => {
        if (el.disabled) return;
        if (o.to) go(o.to);
        if (o.onClick) o.onClick(e);
      },
    },
      o.icon ? icon(o.icon) : null,
      label ? h('span', { class: 'btn-label' }, label) : null,
    );
    return el;
  }

  /* Top bar: explicit back destination (never history.back — it could leave the app).
     Every screen gets an <h1>: the visible title, or `srTitle` for screen readers only. */
  function topBar(o) {
    const visible = typeof o.title === 'string' && o.title;
    return h('header', { class: 'topbar' },
      h('div', { class: 'topbar-side' },
        o.back ? button({ icon: o.backIcon || 'back', variant: 'ghost', size: 'lg', ariaLabel: o.backIcon === 'home' ? 'Home' : 'Back', to: o.back }) : null),
      visible
        ? h('h1', { class: 'topbar-title', tabindex: '-1' }, o.title)
        : h('div', { class: 'topbar-centre' },
            h('h1', { class: 'sr-only', tabindex: '-1' }, o.srTitle || ''),
            o.title && typeof o.title !== 'string' ? o.title : null),
      h('div', { class: 'topbar-side topbar-right' }, o.right || null),
    );
  }

  function screen(name, ...kids) {
    return h('section', { class: 'screen screen-' + name, 'data-screen': name }, ...kids);
  }

  /* Artwork card used by Gallery and My Axolotls. */
  function artCard(o) {
    const el = h(o.onClick ? 'button' : 'div', {
      type: o.onClick ? 'button' : null,
      class: 'art-card' + (o.className ? ' ' + o.className : '') + (o.locked ? ' is-locked' : '') + (o.done ? ' is-done' : '') + (o.highlight ? ' is-new' : ''),
      'aria-label': o.ariaLabel || o.title,
      onClick: o.onClick || null,
    },
      h('div', { class: 'art-card-frame', html: o.svg }),
      o.locked ? h('div', { class: 'art-card-lock' }, icon('lock'),
        // Visual progress towards opening it: filled dot = a picture already done.
        o.need ? h('div', { class: 'need-dots', 'aria-hidden': 'true' },
          Array.from({ length: o.need.total }, (_, i) => h('i', { class: i < o.need.have ? 'is-full' : '' }))) : null) : null,
      o.done ? h('div', { class: 'art-card-badge' }, icon('check')) : null,
      o.fresh ? h('div', { class: 'art-card-fresh', 'aria-hidden': 'true' }, icon('create')) : null,
      // difficulty as 1–3 small stars: purely visual, never needed to read
      o.stars ? h('div', { class: 'art-card-stars', 'aria-hidden': 'true' }, [1, 2, 3].map(i => icon('create', i <= o.stars ? 'on' : 'off'))) : null,
      o.devFlag ? h('div', { class: 'art-card-dev' }, 'art unreviewed') : null,
      o.title ? h('div', { class: 'art-card-title' }, o.title) : null,
    );
    return el;
  }

  /* A colouring page as the child left it: their paint image under the line art. */
  function artStack(lineArt, image, label) {
    const img = image ? `<img src="${image}" alt="" draggable="false">` : '';
    return `<div class="art-stack">${img}${Art.lines(lineArt, label)}</div>`;
  }

  function swatch(o) {
    return h('button', {
      type: 'button',
      class: 'swatch' + (o.selected ? ' is-selected' : ''),
      style: { '--swatch': o.colour },
      'aria-label': o.ariaLabel || (Content.COLOUR_NAMES[o.colour] || 'colour ' + o.colour),
      'aria-pressed': String(!!o.selected),
      onClick: o.onClick,
    });
  }

  function emptyState(o) {
    return h('div', { class: 'empty' },
      o.svg ? h('div', { class: 'empty-art', html: o.svg }) : null,
      h('p', { class: 'empty-text' }, o.text),
      o.action ? button(Object.assign({ variant: 'primary', size: 'lg' }, o.action)) : null,
    );
  }

  let toastTimer = null;
  function toast(text) {
    const layer = document.getElementById('toast-layer');
    layer.innerHTML = '';
    layer.appendChild(h('div', { class: 'toast' }, text));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { layer.innerHTML = ''; }, 2200);
  }

  /* ── modal dialogs (grown-up screens) ── */
  let openModal = null;
  function modal(content, o) {
    closeModal();
    const card = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': (o && o.label) || 'Dialog' }, content);
    const layer = h('div', { class: 'modal-layer' }, card);
    layer.addEventListener('pointerdown', e => { if (e.target === layer && o && o.onDismiss) o.onDismiss(); });
    document.body.appendChild(layer);
    openModal = layer;
    card.setAttribute('tabindex', '-1');
    setTimeout(() => { try { card.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 0);
    return { close: () => { if (openModal === layer) closeModal(); else layer.remove(); }, card };
  }
  function closeModal() { if (openModal) { openModal.remove(); openModal = null; } }

  // Yes/no question. Resolves true only if the grown-up confirms.
  function confirm(o) {
    return new Promise(resolve => {
      const done = v => { m.close(); resolve(v); };
      const m = modal([
        h('h2', { class: 'modal-title' }, o.title),
        o.text ? h('p', { class: 'modal-text' }, o.text) : null,
        h('div', { class: 'modal-actions' },
          button({ label: o.cancelLabel || 'Cancel', variant: 'secondary', size: 'md', onClick: () => done(false) }),
          button({ label: o.confirmLabel || 'OK', variant: 'primary', colour: o.danger ? 'danger' : 'green', size: 'md', onClick: () => done(true) })),
      ], { label: o.title, onDismiss: () => done(false) });
    });
  }

  /* Parent gate: an addition question written in words, answered on a number pad.
     Easy for an adult, not for a 4–8 year old (they'd need to read the words and add
     two-digit numbers). A wrong answer just brings a new question. */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty'];
  // (non-breaking hyphen, so "twenty-five" never splits across lines)
  const inWords = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '\u2011' + ONES[n % 10] : '');
  function parentGate() {
    return new Promise(resolve => {
      let a, b, typed = '';
      const question = h('p', { class: 'gate-question' });
      const display = h('div', { class: 'gate-display', 'aria-live': 'polite' });
      function newQuestion() {
        a = 11 + Math.floor(Math.random() * 9);
        b = 12 + Math.floor(Math.random() * 18);
        typed = '';
        question.textContent = `What is ${inWords(a)} plus ${inWords(b)}?`;
        paint();
      }
      function paint() { display.textContent = typed || ' '; }
      function key(k) {
        if (k === 'back') typed = typed.slice(0, -1);
        else if (k === 'ok') {
          if (Number(typed) === a + b) { m.close(); resolve(true); return; }
          Fx.restart(m.card, 'nope-card');
          newQuestion();
          return;
        } else if (typed.length < 3) typed += k;
        paint();
      }
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'].map(k => {
        return h('button', { type: 'button', class: 'gate-key' + (k === 'ok' ? ' is-ok' : ''), 'aria-label': k === 'back' ? 'Delete' : k === 'ok' ? 'Done' : k,
          onClick: () => key(k) }, k === 'back' ? icon('backspace') : k === 'ok' ? icon('check') : k);
      });
      const m = modal([
        h('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close', onClick: () => { m.close(); resolve(false); } }, icon('close')),
        h('h2', { class: 'modal-title' }, 'For grown-ups'),
        h('p', { class: 'modal-text' }, 'Please ask a grown-up to help.'),
        question, display,
        h('div', { class: 'gate-pad' }, keys),
      ], { label: 'For grown-ups', onDismiss: () => { m.close(); resolve(false); } });
      m.card.classList.add('gate-card');   // short landscape screens lay it out side by side (CSS)
      // A grown-up with a keyboard can just type the answer.
      m.card.addEventListener('keydown', e => {
        if (/^[0-9]$/.test(e.key)) key(e.key);
        else if (e.key === 'Backspace') key('back');
        else if (e.key === 'Enter' && e.target === m.card) key('ok');
        else if (e.key === 'Escape') { m.close(); resolve(false); }
        else return;
        e.preventDefault();
      });
      newQuestion();
    });
  }

  // Called by the router on every screen change: stale toasts go, a queued flash shows.
  let pendingFlash = null;
  function flash(text) { pendingFlash = text; }
  function onNavigate() {
    Speech.stop();
    closeModal();
    // Move focus to the new screen's heading, so keyboard and screen-reader users start
    // at the top of it (programmatic focus doesn't show a ring for touch users).
    const h1 = document.querySelector('#app .screen h1');
    if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); try { h1.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    clearTimeout(toastTimer);
    document.getElementById('toast-layer').innerHTML = '';
    if (pendingFlash) { toast(pendingFlash); pendingFlash = null; }
  }

  window.UI = { go, button, actionButton, topBar, screen, artCard, artStack, swatch, emptyState, toast, flash, onNavigate, modal, confirm, parentGate };
})();
