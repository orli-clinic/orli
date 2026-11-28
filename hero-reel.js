/* The home hero's reel (index.html [data-reel]): Orli's solutions one after
   another on one card. Each scene plays its moment (every element with
   data-at appears that many ms into the scene, data-on lights up then,
   data-until leaves then), then the card shrinks into the scene's tile in
   the dock below and the tile fills. When all four are filled the card
   opens once more on the day in one calendar, holds, and the reel starts
   again.

   It plays only while on screen. Without script, under reduced motion and
   with the accessibility menu's motion off it rests on that calendar with
   every tile filled (the markup's own state).

   Also arms the lock screen in #anywhere: its notifications wait, then land
   one by one once the phone is on screen (styles.css "Lock screen"). */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function still() {
    return reduced.matches || document.documentElement.classList.contains('a11y-still');
  }

  // The lock screen.
  var lock = document.querySelector('.lock-phone');
  if (lock && 'IntersectionObserver' in window && !still()) {
    lock.classList.add('is-armed');
    var lockSeen = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        lock.classList.add('is-live');
        lockSeen.disconnect();
      }
    }, { threshold: 0.45 });
    lockSeen.observe(lock);
  }

  var reel = document.querySelector('[data-reel]');
  if (!reel) return;
  var card = reel.querySelector('.hr-card');
  var ORDER = ['chat', 'book', 'call', 'form'];
  // How long each scene stays open before it shrinks away (ms).
  var HOLD = { chat: 5400, book: 4300, call: 4800, form: 4200 };
  var scenes = {};
  var tiles = {};
  scenes.cal = reel.querySelector('[data-scene="cal"]');
  ORDER.forEach(function (key) {
    scenes[key] = reel.querySelector('[data-scene="' + key + '"]');
    tiles[key] = reel.querySelector('[data-tile="' + key + '"]');
  });

  var timers = [];
  var running = false;
  var onScreen = false;
  var EASE = 'cubic-bezier(.65, 0, .25, 1)';

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; }
  function cancelCard() {
    if (card.getAnimations) card.getAnimations().forEach(function (a) { a.cancel(); });
  }

  // The markup's own state: the day in one calendar, every tile filled.
  function rest() {
    stopTimers();
    cancelCard();
    dropGhost();
    card.style.visibility = '';
    card.classList.remove('is-folding');
    running = false;
    reel.classList.remove('is-playing');
    card.className = 'hr-card is-cal';
    scenes.cal.classList.add('is-on');
    ORDER.forEach(function (key) {
      scenes[key].classList.remove('is-on');
      tiles[key].classList.add('is-filled');
      tiles[key].classList.remove('is-next');
    });
    reel.querySelectorAll('.is-shown').forEach(function (el) { el.classList.remove('is-shown'); });
  }

  function show(key) {
    var scene = scenes[key];
    card.style.visibility = '';
    card.classList.remove('is-folding');
    Object.keys(scenes).forEach(function (k) { scenes[k].classList.toggle('is-on', k === key); });
    ORDER.forEach(function (k) { tiles[k].classList.toggle('is-next', k === key); });
    card.className = 'hr-card is-' + key;
    scene.querySelectorAll('.is-shown').forEach(function (el) { el.classList.remove('is-shown'); });
    scene.querySelectorAll('[data-at], [data-on]').forEach(function (el) {
      later(function () { el.classList.add('is-shown'); }, Number(el.getAttribute('data-at') || el.getAttribute('data-on')));
      if (el.hasAttribute('data-until')) {
        later(function () { el.classList.remove('is-shown'); }, Number(el.getAttribute('data-until')));
      }
    });
    cancelCard();
    if (card.animate) {
      card.animate(
        [{ opacity: 0, transform: 'translateY(10px) scale(.96)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, easing: EASE }
      );
    }
  }

  function openScene(i) {
    show(ORDER[i]);
    later(function () { shrink(i); }, HOLD[ORDER[i]]);
  }

  // After the fourth: the day in one calendar, then fade, empty the dock
  // and start over.
  function finale() {
    show('cal');
    later(function () {
      if (card.animate) card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'forwards' });
      ORDER.forEach(function (k) { tiles[k].classList.remove('is-filled'); });
      later(function () { openScene(0); }, 650);
    }, 5200);
  }

  // Where an element sits inside the reel, in the reel's own (unzoomed)
  // pixels, so a zoomed reel on a phone folds just the same.
  function box(el) {
    var x = 0, y = 0, n = el;
    while (n && n !== reel) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }

  var ghost = null;
  function dropGhost() { if (ghost) { ghost.remove(); ghost = null; } }

  // The card folds into its tile. Its content fades first; then an empty
  // card (a real box, so its corners and hairline stay true) moves and
  // resizes onto the tile, and the tile fills under it.
  function shrink(i) {
    var key = ORDER[i];
    var tile = tiles[key];
    var done = function () {
      tile.classList.remove('is-next');
      tile.classList.add('is-filled');
      dropGhost();
      if (i + 1 < ORDER.length) later(function () { openScene(i + 1); }, 180);
      else later(finale, 260);
    };
    card.classList.add('is-folding');
    if (!reel.animate) { later(done, 250); return; }
    later(function () {
      var from = box(card);
      var to = box(tile);
      var cs = getComputedStyle(card);
      var surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#fffdf8';
      var line = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#e4ddcf';
      dropGhost();
      ghost = document.createElement('div');
      ghost.className = 'hr-ghost';
      ghost.style.cssText = 'left:' + from.x + 'px;top:' + from.y + 'px;width:' + from.w + 'px;height:' + from.h + 'px;background-color:' + cs.backgroundColor + ';border-color:' + cs.borderTopColor;
      reel.appendChild(ghost);
      card.style.visibility = 'hidden';
      card.classList.remove('is-folding');
      ghost.animate(
        [
          { left: from.x + 'px', top: from.y + 'px', width: from.w + 'px', height: from.h + 'px', borderRadius: '22px', backgroundColor: cs.backgroundColor, borderColor: cs.borderTopColor },
          { left: to.x + 'px', top: to.y + 'px', width: to.w + 'px', height: to.h + 'px', borderRadius: '16px', backgroundColor: surface, borderColor: line }
        ],
        { duration: 640, easing: EASE, fill: 'forwards' }
      ).onfinish = done;
    }, 230);
  }

  function start() {
    if (running || still()) return;
    running = true;
    reel.classList.add('is-playing');
    ORDER.forEach(function (k) { tiles[k].classList.remove('is-filled'); });
    openScene(0);
  }

  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    onScreen = entries.some(function (e) { return e.isIntersecting; });
    if (onScreen) start();
    else rest();
  }, { threshold: 0.35 }).observe(reel);

  window.addEventListener('orli:motion-still', rest);
  window.addEventListener('orli:motion-go', function () { if (onScreen) start(); });
  reduced.addEventListener && reduced.addEventListener('change', function () {
    if (reduced.matches) rest();
    else if (onScreen) start();
  });
})();
