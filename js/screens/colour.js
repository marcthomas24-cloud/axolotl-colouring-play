/*
  Colouring screen: stage (ColouringEngine), tool rail, palette, undo/redo, Done.
  Work in progress autosaves as a draft (debounced, and flushed on leave/background),
  so a child can wander off mid-picture and come back to it.

  Made for 4-year-olds (Pass 8):
  - a blank page shows a "tap here" hand until the first touch;
  - Done on a blank page doesn't save an empty picture — it wiggles and shows the hand;
  - after plenty of colouring, Done gently pulses ("you can finish now");
  - Start again needs a short press-and-hold (a ring fills), so a stray tap can't wipe
    the page; after it, Undo glows so the way back is obvious.
*/
(function () {
  'use strict';
  const { h } = U;

  const DRAFT_DELAY = 800;
  const THUMB_SIZE = 512; // finished pictures are stored smaller than the working canvas
  const HINT_DELAY = 2000;
  const NUDGE_AFTER = 8;  // colouring actions before Done starts to pulse
  const HOLD_MS = 700;    // press-and-hold for Start again

  Screens.colour = {
    render(pageId) {
      const page = Content.getPage(pageId);
      if (!page || !Store.isPageUnlocked(page)) {
        // A locked or unknown page (e.g. a stale link): back to its pictures if some are open, else the picker.
        const cat = page && Content.getCategory(page.category);
        Router.replace(cat && Store.categoryState(cat) !== 'locked' ? 'gallery/' + cat.id : 'gallery');
        return null;
      }

      const draft = Store.getDraft(page.id);
      Store.markSeen(page.id);
      let el = null;
      const stage = h('div', { class: 'stage', 'aria-label': page.title + ' colouring page' });

      /* tools */
      const toolButtons = {};
      let lastPaintTool = 'fill';
      function selectTool(t) {
        engine.setTool(t);
        if (t !== 'eraser') lastPaintTool = t;
        Object.entries(toolButtons).forEach(([k, b]) => {
          b.classList.toggle('is-active', k === t);
          b.setAttribute('aria-pressed', String(k === t));
        });
        sizeBtn.classList.toggle('is-muted', t === 'fill');
      }
      [['fill', 'Fill'], ['brush', 'Brush'], ['eraser', 'Eraser']].forEach(([t, label]) => {
        toolButtons[t] = UI.button({ icon: t, variant: 'tool', size: 'lg', ariaLabel: label, onClick: () => selectTool(t) });
        if (t !== 'eraser') toolButtons[t].appendChild(h('span', { class: 'tool-chip', 'aria-hidden': 'true' }));
      });

      // One button cycles small → medium → big; its dot shows the current size.
      const sizeDot = h('span', { class: 'size-dot', 'aria-hidden': 'true' });
      const sizeBtn = h('button', { type: 'button', class: 'btn btn-tool btn-lg btn-icon-only size-btn', 'aria-label': 'Brush size',
        onClick: () => {
          engine.setSize((engine.sizeIndex + 1) % engine.BRUSH_SIZES.length);
          if (engine.tool === 'fill') selectTool(lastPaintTool === 'fill' ? 'brush' : lastPaintTool);
          paintSize();
        } }, sizeDot);
      function paintSize() {
        sizeDot.style.setProperty('--dot', [10, 18, 30][engine.sizeIndex] + 'px');
      }

      const undoBtn = UI.button({ icon: 'undo', variant: 'tool', size: 'lg', ariaLabel: 'Undo', onClick: () => engine.undo() });
      const redoBtn = UI.button({ icon: 'redo', variant: 'tool', size: 'lg', ariaLabel: 'Redo', onClick: () => engine.redo() });
      // Start again: press and hold (no dialog to read). Keyboard activation resets directly.
      const resetBtn = UI.button({ icon: 'reset', variant: 'tool', size: 'lg', ariaLabel: 'Start again (press and hold)', className: 'hold-btn',
        onClick: e => { if (e.detail === 0) doReset(); } });
      let holdTimer = 0;
      function doReset() {
        if (engine.isBlank()) return;
        engine.reset();
        Sound.play('pop');
        Fx.restart(undoBtn, 'glow');
      }
      resetBtn.addEventListener('pointerdown', () => {
        if (resetBtn.disabled) return;
        resetBtn.classList.add('holding');
        holdTimer = setTimeout(() => { resetBtn.classList.remove('holding'); doReset(); }, HOLD_MS);
      });
      const cancelHold = e => {
        if (!resetBtn.classList.contains('holding')) return;
        clearTimeout(holdTimer);
        resetBtn.classList.remove('holding');
        if (e.type === 'pointerup') Fx.restart(resetBtn, 'wiggle'); // a quick tap: "hold me"
      };
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => resetBtn.addEventListener(t, cancelHold));

      const tools = h('div', { class: 'tool-rail', role: 'toolbar', 'aria-label': 'Tools' },
        toolButtons.fill, toolButtons.brush, toolButtons.eraser, sizeBtn, resetBtn,
      );
      // Undo/redo live in the top bar so they're always one tap away in every orientation.
      const history = h('div', { class: 'history' }, undoBtn, redoBtn);

      /* palette */
      const palette = h('div', { class: 'palette', role: 'radiogroup', 'aria-label': 'Colours' });
      function renderPalette() {
        palette.innerHTML = '';
        Content.PALETTE.forEach(c => palette.appendChild(UI.swatch({
          colour: c,
          selected: c === engine.colour,
          onClick: () => {
            engine.setColour(c);
            // Picking a colour while erasing means "I want to colour again".
            if (engine.tool === 'eraser') selectTool(lastPaintTool);
            renderPalette();
          },
        })));
        if (el) el.style.setProperty('--current', engine.colour);
      }

      /* drafts */
      let draftTimer = 0, dirty = false, finished = false;
      function saveDraftNow() {
        clearTimeout(draftTimer);
        if (!dirty || finished) return;
        dirty = false;
        if (engine.isBlank() && !engine.canUndo()) return;
        if (engine.isBlank()) Store.clearDraft(page.id);
        else Store.saveDraft(page.id, engine.exportImage());
      }
      let actions = 0;
      function onChange() {
        hideHint();
        if (++actions >= NUDGE_AFTER) finish.classList.add('nudge');
        undoBtn.disabled = !engine.canUndo();
        redoBtn.disabled = !engine.canRedo();
        resetBtn.disabled = engine.isBlank();
        dirty = true;
        clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraftNow, DRAFT_DELAY);
      }

      const engine = ColouringEngine.create(stage, {
        linesSvg: Art.lines(page.lineArt, page.title),
        image: draft && draft.image,
        onChange,
      });
      engine.setColour(Content.PALETTE[1]);
      dirty = false;
      undoBtn.disabled = redoBtn.disabled = true;
      resetBtn.disabled = !draft;
      selectTool('fill');
      paintSize();

      const finish = UI.button({
        icon: 'check', label: 'Done', variant: 'primary', colour: 'green', size: 'lg', className: 'finish-btn',
        onClick: () => {
          // Nothing coloured yet? Don't make an empty picture — show where to tap instead.
          if (!engine.hasPaint()) { Fx.restart(finish, 'wiggle'); showHint(); return; }
          finished = true;
          clearTimeout(draftTimer);
          const entry = Store.completePage(page.id, engine.exportImage(THUMB_SIZE));
          UI.go('complete/' + entry.id);
        },
      });

      /* "tap here" hand for a blank page */
      const hint = h('div', { class: 'tap-hint', 'aria-hidden': 'true' }, h('span', { class: 'tap-ring' }), U.icon('tap'));
      function showHint() { hint.classList.add('show'); }
      function hideHint() { clearTimeout(hintTimer); hint.classList.remove('show'); }
      const hintTimer = draft ? 0 : setTimeout(showHint, HINT_DELAY);
      stage.addEventListener('pointerdown', hideHint);

      const onHide = () => { if (document.visibilityState === 'hidden') saveDraftNow(); };
      document.addEventListener('visibilitychange', onHide);
      window.addEventListener('pagehide', saveDraftNow);

      el = UI.screen('colour',
        UI.topBar({ back: 'gallery/' + page.category, title: history, srTitle: 'Colour ' + page.title, right: finish }),
        h('div', { class: 'colour-layout' },
          tools,
          h('div', { class: 'stage-wrap' }, stage, hint),
          h('div', { class: 'palette-wrap' }, palette),
        ),
      );
      renderPalette();
      el._engine = engine; // debugging / tests
      el._destroy = () => {
        hideHint();
        clearTimeout(holdTimer);
        saveDraftNow();
        engine.destroy();
        document.removeEventListener('visibilitychange', onHide);
        window.removeEventListener('pagehide', saveDraftNow);
      };
      return el;
    },
  };
})();
