/*
  Hash router: #/home, #/gallery, #/colour/<pageId>, #/complete/<entryId>,
  #/collection, #/create, #/parents. Hash routes survive refresh and work from file://.
  Each screen module registers itself on window.Screens as { render(params) → Element }.
  An element may carry `_destroy` for cleanup (listeners, timers).
*/
(function () {
  'use strict';
  window.Screens = window.Screens || {};

  let current = null;

  function parse() {
    const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'home', params: parts.slice(1) };
  }

  function render() {
    const app = document.getElementById('app');
    let { name, params } = parse();
    if (!Screens[name]) name = 'home';

    let el;
    try {
      el = Screens[name].render(...params);
    } catch (err) {
      console.error(err);
      el = Screens.home.render();
    }
    // A screen may redirect instead of rendering (e.g. an unknown page id).
    if (!el) return;

    if (current && current._destroy) current._destroy();
    app.innerHTML = '';
    app.appendChild(el);
    document.body.dataset.screen = name;
    UI.onNavigate();
    current = el;
  }

  const Router = {
    go(route) {
      const target = '#/' + route.replace(/^#?\/?/, '');
      if (location.hash === target) render();
      else location.hash = target;
    },
    // Swap the URL without adding history (used for redirects).
    replace(route) {
      history.replaceState(null, '', '#/' + route.replace(/^#?\/?/, ''));
      render();
    },
    start() {
      window.addEventListener('hashchange', render);
      render();
    },
  };

  window.Router = Router;
})();
