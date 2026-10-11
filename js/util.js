/* Tiny DOM + icon helpers shared by every screen. */
(function () {
  'use strict';

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') {
          // setProperty so CSS custom properties (--x) work too.
          for (const [prop, val] of Object.entries(v)) el.style.setProperty(prop.startsWith('--') ? prop : prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), val);
        }
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, kids);
    return el;
  }

  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }

  // 24×24 stroke icons. Kept inline so the app has no external assets.
  const ICONS = {
    home:     '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    back:     '<path d="M15 5l-7 7 7 7"/>',
    palette:  '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.6 1.6-2.6H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="11" r="1.3"/><circle cx="10" cy="7" r="1.3"/><circle cx="14.5" cy="7" r="1.3"/>',
    create:   '<path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.3L12 15.4 7.1 18.1l1.1-5.3-4-3.7 5.4-.6z"/>',
    fish:     '<path d="M3 12c2.4-3.8 6.8-5.8 10.8-4.6 2.2.7 3.8 2.4 4.7 4.6-.9 2.2-2.5 3.9-4.7 4.6C9.8 17.8 5.4 15.8 3 12z"/><path d="M18.5 12l3-3.6v7.2z"/><circle cx="8.2" cy="11.2" r="1.1"/>',
    heart:    '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    fill:     '<path d="M5 12.5 11.5 6l6.5 6.5-6.5 6.5z"/><path d="M8.5 3.5 11.5 6"/><path d="M5 12.5h13"/><path d="M20 15.5s1.5 1.9 1.5 3a1.5 1.5 0 0 1-3 0c0-1.1 1.5-3 1.5-3z"/>',
    brush:    '<path d="M19.5 3.5 10 13"/><path d="M10 13c-2.5 0-4 1.6-4 4 0 1.5-1 2.5-2.5 2.5 3.5 1.5 9 .5 9-3.5 0-1.3-1-2.5-2.5-3z"/>',
    eraser:   '<path d="M8 20h12"/><path d="M4.6 14.6 13.5 5.7a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L11 20H8.2l-3.6-3.6a1.3 1.3 0 0 1 0-1.8z"/><path d="M9.5 10.8l4.7 4.7"/>',
    undo:     '<path d="M9 7 4.5 11.5 9 16"/><path d="M4.5 11.5H15a5 5 0 0 1 0 10h-3"/>',
    redo:     '<path d="M15 7l4.5 4.5L15 16"/><path d="M19.5 11.5H9a5 5 0 0 0 0 10h3"/>',
    reset:    '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
    check:    '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock:     '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    unlock:   '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.4-2.1"/>',
    next:     '<path d="M5 12h13"/><path d="M12.5 6l6 6-6 6"/>',
    grid:     '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"/>',
    sound:    '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute:     '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    zoomIn:   '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8M10.5 7.5v6M7.5 10.5h6"/>',
    zoomOut:  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8M7.5 10.5h6"/>',
    gills:    '<circle cx="12" cy="13" r="5.5"/><path d="M7 11C5 9.5 3.5 8 3 5.5M6.6 13.5H2.5M7 16c-2 1.2-3 2.5-3.8 4.5M17 11c2-1.5 3.5-3 4-5.5M17.4 13.5h4.1M17 16c2 1.2 3 2.5 3.8 4.5"/>',
    eye:      '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/>',
    spots:    '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.8"/><circle cx="15.5" cy="10" r="1.3"/><circle cx="11" cy="15.5" r="1.5"/>',
    crown:    '<path d="M4 18h16M5.2 18 4 7.5l4.8 4L12 5l3.2 6.5 4.8-4L18.8 18"/>',
    pumpkin:  '<path d="M12 7.5c-4.6 0-8 2.8-8 6.5s3.4 6.5 8 6.5 8-2.8 8-6.5-3.4-6.5-8-6.5z"/><path d="M12 7.5c.2-1.8 1.100-3 2.800-3.500"/><path d="M8.5 12l1.2 1.8H7.3zM15.5 12l1.2 1.8h-2.4z"/><path d="M8.5 16.5h7"/>',
    tag:      '<path d="M3 12.5V4h8.5L21 13.5 13.5 21 3 12.5z"/><circle cx="7.6" cy="7.6" r="1.6"/>',
    dice:     '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/><circle cx="8.5" cy="15.5" r="1.2"/>',
    tap:      '<path d="M9.5 11.5V4.8a1.6 1.6 0 0 1 3.2 0v5.4m0-1.2a1.6 1.6 0 0 1 3.2 0v1.8m0-.6a1.6 1.6 0 0 1 3.1 0v4.3a6.3 6.3 0 0 1-6.3 6.3h-1.1a5.3 5.3 0 0 1-4.1-2L4.3 15.6a1.7 1.7 0 0 1 2.6-2.1l2.6 2.4"/>',
    trash:    '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9L17.5 7M10 11v5M14 11v5"/>',
    close:    '<path d="M6 6l12 12M18 6 6 18"/>',
    backspace:'<path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
    none:     '<circle cx="12" cy="12" r="8.5"/><path d="M6 18 18 6"/>',
    save:     '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/><path d="M12 10.5v5M9.5 13h5"/>',
  };

  function icon(name, extraClass) {
    const span = document.createElement('span');
    span.className = 'icon' + (extraClass ? ' ' + extraClass : '');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
    return span;
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.U = { h, append, icon, uid, escapeHtml };
  // Screen registry — screen files register here; the router reads it.
  window.Screens = window.Screens || {};
})();
