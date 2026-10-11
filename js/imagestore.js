/*
  Picture storage (IndexedDB). Finished pictures and drafts are PNGs of 25–270 KB each,
  far too big for localStorage's ~5 MB limit on iPad Safari, where the Nth picture would
  silently fail to save. IndexedDB has a much larger quota.

  Tiny promise wrapper: open / get / put / del / clear. If IndexedDB is unavailable or
  refuses to open, `available` stays false and the Store keeps images inline instead.
*/
(function () {
  'use strict';

  const DB = 'axolotl-colouring', STORE = 'images';
  let db = null;

  function req(r) {
    return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  }
  function tx(mode) { return db.transaction(STORE, mode).objectStore(STORE); }

  const ImageStore = {
    available: false,

    open() {
      return new Promise(resolve => {
        try {
          if (!window.indexedDB) return resolve(false);
          const r = indexedDB.open(DB, 1);
          r.onupgradeneeded = () => r.result.createObjectStore(STORE);
          r.onsuccess = () => { db = r.result; ImageStore.available = true; resolve(true); };
          r.onerror = () => resolve(false);
          r.onblocked = () => resolve(false);
          setTimeout(() => resolve(ImageStore.available), 3000); // never hang the app start
        } catch (e) { resolve(false); }
      });
    },
    getAll() { // → Map(key → dataURL)
      return new Promise((resolve, reject) => {
        const out = new Map(), cur = tx('readonly').openCursor();
        cur.onsuccess = () => { const c = cur.result; if (c) { out.set(c.key, c.value); c.continue(); } else resolve(out); };
        cur.onerror = () => reject(cur.error);
      });
    },
    put(key, value) { return req(tx('readwrite').put(value, key)); },
    del(key) { return req(tx('readwrite').delete(key)); },
    clear() { return req(tx('readwrite').clear()); },
  };

  window.ImageStore = ImageStore;
})();
