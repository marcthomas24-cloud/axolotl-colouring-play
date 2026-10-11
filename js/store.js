/*
  Local save state. No backend, no accounts, nothing leaves the device.

  Small data (settings, lists, names) lives in localStorage. Picture PNGs live in
  IndexedDB (see imagestore.js) because localStorage is ~5 MB on iPad Safari — only a few
  dozen busy pictures — and a failed save would silently lose a finished picture.
  Images are kept in memory too, so screens read them synchronously.

  `Store.ready` resolves once pictures are loaded (the app waits for it before the first
  screen). Pictures saved inline by earlier versions are moved into IndexedDB then.
  If IndexedDB isn't available, everything stays inline in localStorage as before.
  Every storage access is guarded; the app keeps working in memory if saving fails.
*/
(function () {
  'use strict';

  const KEY = 'axolotl-colouring:v1';   // the storage key stays put; `state.version` tracks the shape (see migrate)
  const VERSION = 2;
  const picKey = id => 'pic:' + id;
  const draftKey = pageId => 'draft:' + pageId;

  function empty() {
    return {
      version: VERSION,
      completed: [],   // { id, pageId, lineArt, image (PNG data URL), completedAt }
      characters: [],  // { id, name, body, gills, eyes, pattern, accessory, createdAt }
      drafts: {},      // pageId → { lineArt, image (PNG data URL), updatedAt }
      seen: {},        // pageId → true once opened (drives the "new" sparkle on a freshly opened taster page)
      taster: {        // the Friends taster (Pass 11)
        unlocked: {},  //   pageId → true once the child has earned it (stays true: nothing re-locks)
        due: false,    //   earned but not yet celebrated
        celebrated: false, // "New friends to colour!" has been shown — once only, ever
      },
      settings: { sound: true, voice: true, unlockAll: false },
    };
  }

  let state = load();
  let idb = false; // true once pictures are safely in IndexedDB

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return empty();
      return migrate(JSON.parse(raw));
    } catch (e) {
      return empty();
    }
  }

  /* Bring saved state of any older shape up to VERSION 2. Nothing the child made is ever touched:
     pictures, drafts, characters, `seen` and the sound settings carry straight over.
       v1 → v2: adds `taster`; drops `announced` (the old "colour N pictures to open this page" gates are gone —
       premium pages open through a category's access or a taster, never by grinding). */
  function migrate(parsed) {
    const base = empty();
    const st = Object.assign(base, parsed, { settings: Object.assign(base.settings, parsed.settings) });
    st.completed = Array.isArray(st.completed) ? st.completed : [];
    st.characters = Array.isArray(st.characters) ? st.characters : [];
    st.drafts = st.drafts && typeof st.drafts === 'object' ? st.drafts : {};
    st.seen = st.seen || {};
    st.taster = Object.assign(empty().taster, st.taster);
    delete st.announced;
    st.version = VERSION;
    return st;
  }

  // Drop drafts that can't be resumed: Pass 1 per-region fills, missing images, or started
  // on artwork that has since been replaced (their paint wouldn't line up any more).
  function cleanDrafts() {
    Object.keys(state.drafts).forEach(k => {
      const d = state.drafts[k], page = Content.getPage(k);
      if (!d || !d.image || !page || d.lineArt !== page.lineArt) { delete state.drafts[k]; delImage(draftKey(k)); }
    });
  }

  function serialise() {
    // With IndexedDB, images are stored there, not in the localStorage copy.
    return idb ? JSON.stringify(state, (k, v) => (k === 'image' ? undefined : v)) : JSON.stringify(state);
  }

  // Saves; if storage is full, drops the oldest unfinished drafts (never finished
  // pictures, never `keepDraft`) and retries. Returns false if it still can't save.
  function save(keepDraft) {
    for (;;) {
      try { window.localStorage.setItem(KEY, serialise()); return true; }
      catch (e) {
        const victims = Object.keys(state.drafts)
          .filter(k => k !== keepDraft)
          .sort((a, b) => state.drafts[a].updatedAt - state.drafts[b].updatedAt);
        if (!victims.length) return false;
        delete state.drafts[victims[0]];
        delImage(draftKey(victims[0]));
      }
    }
  }

  function putImage(key, image) {
    if (!idb || !image) return;
    ImageStore.put(key, image).catch(() => {
      // IndexedDB refused (full, or gone): fall back to keeping pictures inline.
      idb = false;
      save();
    });
  }
  function delImage(key) { if (idb) ImageStore.del(key).catch(() => {}); }

  const ready = (async () => {
    try {
      if (await ImageStore.open()) {
        const images = await ImageStore.getAll();
        const used = new Set();
        let migrated = false;
        for (const c of state.completed) {
          const k = picKey(c.id);
          used.add(k);
          if (c.image) { await ImageStore.put(k, c.image); migrated = true; } // saved inline by an older version
          else c.image = images.get(k) || null;
        }
        for (const [pageId, d] of Object.entries(state.drafts)) {
          const k = draftKey(pageId);
          used.add(k);
          if (d && d.image) { await ImageStore.put(k, d.image); migrated = true; }
          else if (d) d.image = images.get(k) || null;
        }
        idb = true;
        // Tidy pictures whose entries are gone (e.g. deleted while saving was interrupted).
        for (const k of images.keys()) if (!used.has(k)) ImageStore.del(k).catch(() => {});
        if (migrated) save();
      }
    } catch (e) {
      idb = false;
    }
    cleanDrafts();
    // Ask the browser not to clear our storage under pressure (where supported).
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* ignore */ }
  })();

  // Distinct pages finished in one category (a page coloured twice counts once).
  const doneInCategory = catId => new Set(state.completed.map(c => c.pageId).filter(id => {
    const p = Content.getPage(id);
    return p && p.category === catId;
  })).size;
  // Pages that wait on Easy completions and have now earned them; remembers each so nothing re-locks.
  function earnTasters() {
    const easy = doneInCategory('easy');
    let earned = false;
    Content.PAGES.forEach(p => {
      const need = Content.tasterThreshold(p);
      if (need && easy >= need && !state.taster.unlocked[p.id]) { state.taster.unlocked[p.id] = true; earned = true; }
    });
    if (earned && !state.taster.celebrated) state.taster.due = true;
  }
  earnTasters();   // state loaded from an earlier session may already have earned them

  const Store = {
    ready,
    get completed() { return state.completed; },
    get characters() { return state.characters; },
    get settings() { return state.settings; },
    get usingIndexedDB() { return idb; },

    completedCount() { return state.completed.length; },
    // Distinct pages finished at least once (for the collection's progress meter).
    completedPageIds() { return new Set(state.completed.map(c => c.pageId)); },
    doneInCategory,

    /* ── access ──
       A page opens when: the grown-up has switched on "unlock all" (testing), or its access is free,
       or it is a taster the child has earned. Nothing else — grinding never opens premium art. */
    isPageUnlocked(page) {
      if (state.settings.unlockAll) return true;
      if (Content.accessOf(page) === 'free') return true;
      return !!state.taster.unlocked[page.id];
    },
    // 'open' (free, or unlock-all) · 'peek' (premium, but at least one page opens) · 'locked'.
    categoryState(cat) {
      if (state.settings.unlockAll || cat.access === 'free' || cat.testFree) return 'open';
      return Content.categoryPages(cat.id).some(p => this.isPageUnlocked(p)) ? 'peek' : 'locked';
    },

    /* ── the Friends taster ── */
    // The pages to celebrate right now: earned, never celebrated, and `entryId` is the newest picture
    // (so a revisit of an old completion doesn't replay it). Marking it shown is a separate call.
    tasterToCelebrate(entryId) {
      const last = state.completed[state.completed.length - 1];
      if (!state.taster.due || state.taster.celebrated || !last || last.id !== entryId) return [];
      return Content.PAGES.filter(p => state.taster.unlocked[p.id] && Content.tasterThreshold(p));
    },
    markTasterCelebrated() { state.taster.due = false; state.taster.celebrated = true; save(); },
    // Has the child not yet looked at this category's opened taster pages? (drives a gentle sparkle)
    hasNewTasters(cat) {
      return Content.categoryPages(cat.id).some(p => this.isNewlyOpen(p));
    },
    // A taster page that has opened but hasn't been visited yet.
    isNewlyOpen(page) {
      return !!Content.tasterThreshold(page) && !!state.taster.unlocked[page.id] && !state.seen[page.id] && !this.isPageCompleted(page.id);
    },
    markSeen(pageId) { if (!state.seen[pageId]) { state.seen[pageId] = true; save(); } },
    isPageCompleted(pageId) { return state.completed.some(c => c.pageId === pageId); },
    getCompletion(id) { return state.completed.find(c => c.id === id) || null; },

    // A draft only counts if it was started on the page's current artwork.
    getDraft(pageId) {
      const d = state.drafts[pageId], page = Content.getPage(pageId);
      return d && d.image && page && d.lineArt === page.lineArt ? d : null;
    },
    saveDraft(pageId, image) {
      const page = Content.getPage(pageId);
      state.drafts[pageId] = { lineArt: page && page.lineArt, image, updatedAt: Date.now() };
      putImage(draftKey(pageId), image);
      return save(pageId);
    },
    clearDraft(pageId) { delete state.drafts[pageId]; delImage(draftKey(pageId)); save(); },

    completePage(pageId, image) {
      const page = Content.getPage(pageId);
      const entry = { id: U.uid('pic'), pageId, lineArt: page && page.lineArt, image, completedAt: Date.now() };
      state.completed.push(entry);
      earnTasters();
      putImage(picKey(entry.id), image);
      if (state.drafts[pageId]) { delete state.drafts[pageId]; delImage(draftKey(pageId)); }
      save();
      return entry;
    },

    addCharacter(ch) {
      const entry = Object.assign({ id: U.uid('axo'), createdAt: Date.now() }, ch);
      state.characters.push(entry);
      save();
      return entry;
    },
    getCharacter(id) { return state.characters.find(c => c.id === id) || null; },

    setSetting(key, value) { state.settings[key] = value; save(); },

    /* grown-ups area */
    deleteCompletion(id) { state.completed = state.completed.filter(c => c.id !== id); delImage(picKey(id)); save(); },
    deleteCharacter(id) { state.characters = state.characters.filter(c => c.id !== id); save(); },
    // Approximate bytes this app keeps on the device (pictures + everything else).
    storageBytes() {
      let n = 0;
      try { n = (window.localStorage.getItem(KEY) || '').length * 2; } catch (e) { /* ignore */ }
      if (idb) {
        state.completed.forEach(c => { n += (c.image || '').length; });
        Object.values(state.drafts).forEach(d => { n += ((d && d.image) || '').length; });
      }
      return n;
    },
    // Everything goes, but the grown-up's sound choices stay.
    resetAll() {
      const settings = Object.assign({}, state.settings, { unlockAll: false });
      state = empty();
      state.settings = settings;
      if (idb) ImageStore.clear().catch(() => {});
      save();
    },
  };

  window.Store = Store;
})();
