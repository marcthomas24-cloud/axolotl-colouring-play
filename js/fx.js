/* Celebration effects shared by the completion screen and the collection viewer. */
(function () {
  'use strict';
  const { h } = U;

  const CONFETTI_COLOURS = ['#ff6fa8', '#ffd84a', '#7fd3ff', '#8fe07a', '#c9a7ff', '#ff9f45'];

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const rand = (a, b) => a + Math.random() * (b - a);

  // Re-trigger a CSS animation class on a node.
  function restart(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  // Bubbles rising inside `layer` (an .fx-bubbles element over a picture), with soft pops.
  function bubbles(layer, count) {
    for (let i = 0; i < (count || 12); i++) {
      const b = h('i', null);
      b.style.cssText = `--x:${rand(4, 92)}%;--s:${rand(12, 34)}px;--d:${rand(1.6, 2.6)}s;--delay:${rand(0, 0.9)}s;--sway:${rand(-18, 18)}px`;
      b.addEventListener('animationend', () => b.remove());
      layer.appendChild(b);
    }
    [0.35, 0.6, 0.8, 1.15].forEach(t => Sound.play('pop', t));
  }

  // Confetti + stars bursting from `from` (an element), drawn into `layer` (an .fx element).
  function confetti(layer, from, count) {
    const n = count || 28;
    const box = layer.getBoundingClientRect(), art = from.getBoundingClientRect();
    const cx = art.left + art.width / 2 - box.left, cy = art.top + art.height * 0.42 - box.top;
    const reach = Math.max(art.width, 240);
    for (let i = 0; i < n; i++) {
      const kind = i % 3 === 0 ? 'star' : (i % 3 === 1 ? 'dot' : 'bit');
      const p = kind === 'star' ? U.icon('create', 'confetti star') : h('i', { class: 'confetti ' + kind });
      const a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2), dist = rand(0.35, 0.7) * reach;
      p.style.cssText = `left:${cx}px;top:${cy}px;color:${pick(CONFETTI_COLOURS)};background-color:${kind === 'star' ? 'transparent' : 'currentColor'};` +
        `--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist * 0.8 - 30}px;--r:${rand(-260, 260)}deg;--delay:${rand(0, 0.12)}s`;
      if (kind === 'star') p.querySelector('svg').setAttribute('fill', 'currentColor');
      p.addEventListener('animationend', () => p.remove());
      layer.appendChild(p);
    }
  }

  // An icon that flies from one element to another (e.g. a heart into My Axolotls).
  function flyTo(fromEl, toEl, iconName, onDone) {
    const from = fromEl.getBoundingClientRect(), to = toEl.getBoundingClientRect();
    const icon = U.icon(iconName, 'flying-heart');
    icon.querySelector('svg').setAttribute('fill', 'currentColor');
    const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2;
    icon.style.left = x0 + 'px';
    icon.style.top = y0 + 'px';
    document.body.appendChild(icon);
    const dx = to.left + to.width / 2 - x0, dy = to.top + to.height / 2 - y0;
    // Land exactly once: when the flight finishes, or after a backstop timer — animations
    // don't advance while the page isn't being drawn (screen dimmed, app in background).
    let landed = false;
    const done = () => { if (landed) return; landed = true; icon.remove(); if (onDone) onDone(); };
    setTimeout(done, 1200);
    if (!icon.animate) return done();
    icon.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 1, offset: 0.25 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)`, opacity: 0.9 },
    ], { duration: 900, easing: 'cubic-bezier(.5,0,.5,1)' }).onfinish = done;
  }

  function clearFlying() { document.querySelectorAll('.flying-heart').forEach(n => n.remove()); }

  window.Fx = { pick, rand, restart, bubbles, confetti, flyTo, clearFlying };
})();
