(function () {
  'use strict';
  // The films on features.html ([data-film]). Each is one frame that plays
  // its scene while mostly on screen, holds the last picture for a beat,
  // then plays again; scrolling away stops and clears it, so coming back
  // always starts at the first beat. Same rules as the home page's journey
  // film in script.js: under prefers-reduced-motion or the accessibility
  // menu's "motion off" (a11y.js, orli:motion-still) the frame shows the
  // finished picture once; motion on again restarts it.
  //
  // A film is a list of beats: [ms, fn]. `settle` is the finished picture,
  // `reset` clears every class the beats add. Everything a beat does is a
  // class on the film root or on one element, so films.css owns the look.

  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function countUp(el, to, ms) {
    var start = null;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * e)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (p < 1) el._raf = requestAnimationFrame(tick);
    }
    cancelAnimationFrame(el._raf);
    el._raf = requestAnimationFrame(tick);
  }

  var FILMS = {
    // Orli says hello; the patient writes a question in the box and sends it;
    // Orli answers from the clinic's approved facts behind typing dots and
    // offers the day's free times; a time is tapped and the booking lands.
    // The thread scrolls as it grows, like the real widget's.
    chat: function (root) {
      var body = root.querySelector('.fc-body');
      var msgs = Array.prototype.slice.call(root.querySelectorAll('.fc-msg'));
      var box = root.querySelector('.fc-input span');
      var send = root.querySelector('.fc-input i');
      var pick = root.querySelector('[data-pick]');
      var hint = box.textContent;
      var beats = [];
      function down() {
        if (body.scrollTo && !still.matches) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
        else body.scrollTop = body.scrollHeight;
      }
      // The ring blooms again on every tap, so the class is taken off and put back.
      function tap(el) { el.classList.remove('is-tapping'); void el.offsetWidth; el.classList.add('is-tapping'); }
      // Paced for reading: Orli's dots run about as long as her line takes to
      // write, then it stays up long enough to be read; the patient's line is
      // typed into the box a letter at a time, then sent.
      var t = 800;
      msgs.forEach(function (m) {
        var bot = m.classList.contains('bot');
        var text = m.textContent.trim();
        var words = text.split(/\s+/).length;
        if (bot) {
          beats.push([t, function () { root.classList.add('is-typing'); down(); }]);
          t += Math.min(2800, 700 + words * 80);
          beats.push([t, function () { root.classList.remove('is-typing'); m.classList.add('is-in'); down(); }]);
        } else {
          t += 500;
          beats.push([t, function () { root.classList.add('is-writing'); }]);
          for (var n = 1; n <= text.length; n++) {
            (function (k) { beats.push([t + k * 55, function () { box.textContent = text.slice(0, k); }]); })(n);
          }
          t += text.length * 55 + 350;
          beats.push([t, function () { tap(send); }]);
          t += 250;
          beats.push([t, function () { root.classList.remove('is-writing'); box.textContent = hint; m.classList.add('is-in'); down(); }]);
        }
        if (m.hasAttribute('data-pick-after')) {
          t += 1800;
          beats.push([t, function () { tap(pick); }]);
          t += 250;
          beats.push([t, function () { root.classList.add('is-picked'); }]);
        }
        t += bot ? Math.min(2400, 600 + words * 80) : 300;
      });
      return {
        beats: beats,
        hold: 4500,
        reset: function () {
          root.classList.remove('is-typing', 'is-writing', 'is-picked');
          box.textContent = hint;
          send.classList.remove('is-tapping'); pick.classList.remove('is-tapping');
          msgs.forEach(function (m) { m.classList.remove('is-in'); });
          body.scrollTop = 0;
        },
        settle: function () {
          root.classList.remove('is-typing', 'is-writing'); root.classList.add('is-picked');
          box.textContent = hint;
          msgs.forEach(function (m) { m.classList.add('is-in'); });
          body.scrollTop = body.scrollHeight;
        }
      };
    },

    // A phone call: it rings with nobody free, Orli picks up, the clock runs
    // and each side's words show one line at a time; the meeting is booked,
    // the call ends and the text arrives.
    //
    // One timeline, in seconds of assets/audio/sample-call.mp3: `at(t)` draws
    // the picture at any moment of the call, so the silent loop and the call
    // played aloud (the film's button) show the same thing. The times are
    // where each line starts in the recording; remake them with the audio.
    call: function (root) {
      var lines = Array.prototype.slice.call(root.querySelectorAll('.fp-line'));
      var time = root.querySelector('.fp-time');
      var PICK = 2.5, TEXT = 29.2, BOOK = 31.9, END = 32.5;
      var STARTS = [2.5, 8.49, 12.23, 19.61, 21.2, 22.99, 23.99, 27.34, 28.51];
      function at(t) {
        var on = t >= PICK, booked = t >= BOOK, i = -1;
        if (on && !booked) STARTS.forEach(function (s, n) { if (t >= s) i = n; });
        root.classList.toggle('is-ringing', t > 0.05 && !on);
        root.classList.toggle('is-on', on);
        root.classList.toggle('is-booked', booked);
        root.classList.toggle('is-texted', t >= TEXT);
        lines.forEach(function (l, n) { l.classList.toggle('is-in', n === i); });
        root.classList.toggle('is-talking', i >= 0);
        root.classList.toggle('is-caller', i >= 0 && lines[i].classList.contains('me'));
        var s = on ? Math.floor(t - PICK) : 0;
        time.textContent = '00:' + (s < 10 ? '0' : '') + s;
      }
      var marks = [0.3, PICK, TEXT, BOOK].concat(STARTS);
      for (var s = 1; PICK + s < BOOK; s++) marks.push(PICK + s);
      return {
        beats: marks.map(function (m) { return [Math.round(m * 1000), function () { at(m); }]; }),
        hold: 4500,
        at: at,
        audio: root.querySelector('.fp-audio'),
        button: root.querySelector('.fp-listen'),
        reset: function () { at(0); },
        settle: function () { at(END); }
      };
    },

    // A visit ends, the months pass on the rail, the clinic's own email
    // arrives with one button, a tap, the booking panel with the treatment
    // already chosen, a time, booked.
    remind: function (root) {
      var mail = root.querySelector('.fr-mail');
      var btn = root.querySelector('.fr-btn');
      var fill = root.querySelector('.fr-rail-fill');
      return {
        beats: [
          [800, function () { root.classList.add('is-b1'); }],
          [1500, function () { root.classList.add('is-b2'); }],
          [4300, function () { root.classList.add('is-b3'); mail.classList.add('is-in'); }],
          [6200, function () { root.classList.add('is-b4'); btn.classList.add('is-tapping'); }],
          [6900, function () { root.classList.add('is-b5'); }],
          [8500, function () { root.classList.add('is-b6'); }],
          [9700, function () { root.classList.add('is-b7'); }]
        ],
        hold: 3000,
        reset: function () {
          root.classList.remove('is-b1', 'is-b2', 'is-b3', 'is-b4', 'is-b5', 'is-b6', 'is-b7');
          mail.classList.remove('is-in'); btn.classList.remove('is-tapping');
          // Restart the rail from empty without a backwards sweep.
          fill.style.transition = 'none'; void fill.offsetWidth; fill.style.transition = '';
        },
        settle: function () { root.classList.add('is-b1', 'is-b2', 'is-b3', 'is-b5', 'is-b6', 'is-b7'); mail.classList.add('is-in'); }
      };
    },

    // Three screens of the dashboard: the month's tiles count up and the
    // days' bars rise with the average line; then where the bookings came
    // from (a donut) and what was booked; then when patients book, with
    // the evening peak called out, and who showed up.
    stats: function (root) {
      var vals = Array.prototype.slice.call(root.querySelectorAll('[data-count]'));
      var bars = Array.prototype.slice.call(root.querySelectorAll('.fs-bars i'));
      bars.forEach(function (b, i) { b.style.transitionDelay = ((i % 14) * 60) + 'ms'; });
      var ALL = ['is-s1', 'is-s2', 'is-s3', 'is-b1', 'is-b2', 'is-b3', 'is-b4', 'is-b5', 'is-b6', 'is-b7'];
      function screen(n) { root.classList.remove('is-s1', 'is-s2', 'is-s3'); root.classList.add('is-s' + n); }
      return {
        beats: [
          [0, function () { screen(1); }],
          [700, function () { root.classList.add('is-b1'); vals.forEach(function (v) { countUp(v, +v.getAttribute('data-count'), 1300); }); }],
          [1500, function () { root.classList.add('is-b2'); }],
          [3200, function () { root.classList.add('is-b3'); }],
          [6800, function () { screen(2); }],
          [7400, function () { root.classList.add('is-b4'); }],
          [8300, function () { root.classList.add('is-b5'); }],
          [12800, function () { screen(3); }],
          [13400, function () { root.classList.add('is-b6'); }],
          [15000, function () { root.classList.add('is-b7'); }]
        ],
        hold: 4500,
        reset: function () {
          root.classList.remove.apply(root.classList, ALL);
          vals.forEach(function (v) { cancelAnimationFrame(v._raf); v.textContent = '0'; });
          bars.forEach(function (b) { b.style.transition = 'none'; });
          void root.offsetWidth;
          bars.forEach(function (b) { b.style.transition = ''; });
        },
        settle: function () {
          root.classList.add('is-s1', 'is-b1', 'is-b2', 'is-b3');
          vals.forEach(function (v) { v.textContent = String(+v.getAttribute('data-count')).replace(/\B(?=(\d{3})+(?!\d))/g, ','); });
        }
      };
    },

    // Optima stops answering: the dot turns red, a booking made meanwhile
    // waits in the calendar with its mark, the patient is told nothing but
    // "booked"; Optima is back, the booking is written and the mark goes.
    outage: function (root) {
      return {
        beats: [
          [1200, function () { root.classList.add('is-down', 'is-b1'); }],
          [2600, function () { root.classList.add('is-b2'); }],
          [3600, function () { root.classList.add('is-b3'); }],
          [6400, function () { root.classList.remove('is-down'); root.classList.add('is-b4'); }],
          [7300, function () { root.classList.add('is-b5'); }]
        ],
        hold: 3200,
        reset: function () { root.classList.remove('is-down', 'is-b1', 'is-b2', 'is-b3', 'is-b4', 'is-b5'); },
        settle: function () { root.classList.add('is-b2', 'is-b3', 'is-b4', 'is-b5'); }
      };
    }
  };

  function mount(root) {
    var make = FILMS[root.getAttribute('data-film')];
    if (!make) return;
    var film = make(root);
    var timers = [];
    var visible = false;
    var playing = false;
    var listening = false;
    var after = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    function clear() { timers.forEach(clearTimeout); timers = []; playing = false; }
    function stop() {
      clear();
      if (listening) { listening = false; film.audio.pause(); }
      film.reset();
    }
    function play() {
      if (playing || listening) return;
      playing = true;
      var last = 0;
      film.beats.forEach(function (b) { after(b[0], b[1]); last = Math.max(last, b[0]); });
      after(last + film.hold, function () {
        film.reset();
        playing = false;
        if (visible) after(700, play);
      });
    }
    function settle() { if (listening) return; stop(); film.settle(); root.classList.add('is-done'); }
    function isStill() { return still.matches || document.documentElement.classList.contains('a11y-still'); }

    // A film with a recording (the call) has a button that plays it aloud:
    // the loop stops, and the picture follows the sound frame by frame.
    // At the end it rests on the finished picture, then the loop resumes.
    if (film.audio && film.button) {
      var audio = film.audio, button = film.button;
      var idle = 'השמעת השיחה בקול';
      button.hidden = false;
      button.setAttribute('aria-label', idle);
      var follow = function () {
        if (!listening || audio.paused) return;
        film.at(audio.currentTime);
        requestAnimationFrame(follow);
      };
      button.addEventListener('click', function () {
        if (listening && !audio.paused) { audio.pause(); return; }
        if (!listening) {
          clear();
          root.classList.remove('is-done');
          listening = true;
          audio.currentTime = 0;
          film.reset();
        }
        audio.play().catch(function () { listening = false; root.classList.remove('is-listening'); });
      });
      audio.addEventListener('play', function () {
        root.classList.add('is-listening'); button.setAttribute('aria-label', 'עצירת השיחה'); follow();
      });
      audio.addEventListener('pause', function () {
        root.classList.remove('is-listening'); button.setAttribute('aria-label', idle);
      });
      audio.addEventListener('ended', function () {
        listening = false;
        film.settle();
        if (isStill()) { root.classList.add('is-done'); return; }
        after(film.hold, function () { if (!listening && visible) { film.reset(); play(); } });
      });
    }

    window.addEventListener('orli:motion-still', settle);
    window.addEventListener('orli:motion-go', function () {
      if (still.matches || listening) return;
      root.classList.remove('is-done');
      stop();
      if (visible) play();
    });

    if (isStill()) {
      settle();
    } else if ('IntersectionObserver' in window) {
      var need = Math.min(0.6, Math.max(0.2, (window.innerHeight * 0.7) / Math.max(1, root.offsetHeight)));
      // Leaving is debounced: a resize or an address bar sliding away can
      // report the film gone and back within a frame, which would restart
      // it mid-scene for no reason the viewer can see.
      var leaving = null;
      var io = new IntersectionObserver(function (entries) {
        visible = entries.some(function (e) { return e.isIntersecting; });
        clearTimeout(leaving);
        if (!visible) { leaving = setTimeout(stop, 300); return; }
        if (!playing) play();
      }, { threshold: need });
      io.observe(root);
    } else {
      play();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-film]'), mount);

  // The home page's phone: the same sample call as the call film, played
  // from the round button, its clock counting the call. The native player
  // stays for a page without JS.
  Array.prototype.forEach.call(document.querySelectorAll('[data-call-play]'), function (root) {
    var audio = root.querySelector('.phone-audio');
    var button = root.querySelector('.phone-play');
    var clock = root.querySelector('.phone-clock');
    var idle = clock.textContent;
    function show(s) { s = Math.floor(s); clock.textContent = '00:' + (s < 10 ? '0' : '') + s; }
    audio.controls = false;
    button.hidden = false;
    root.classList.add('is-ready');
    button.addEventListener('click', function () {
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener('play', function () { root.classList.add('is-playing'); button.setAttribute('aria-label', 'עצירת השיחה'); });
    audio.addEventListener('pause', function () { root.classList.remove('is-playing'); button.setAttribute('aria-label', 'השמעת שיחה לדוגמה'); });
    audio.addEventListener('timeupdate', function () { show(audio.currentTime); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; clock.textContent = idle; });
  });


  // The chapter links under the title: the word of the chapter on screen
  // is marked, and one teal line slides under it from word to word, so the
  // row doubles as a progress line down the page.
  var links = Array.prototype.slice.call(document.querySelectorAll('.chapter-nav a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var wrap = links[0].parentNode;
    var ind = document.createElement('span');
    ind.className = 'chapter-ind'; ind.setAttribute('aria-hidden', 'true');
    wrap.appendChild(ind);
    var here = null;
    function place() {
      if (!here) return;
      ind.style.left = here.offsetLeft + 'px';
      ind.style.width = here.offsetWidth + 'px';
      ind.classList.add('is-on');
      // Keep the current word in view on a phone, where the row scrolls.
      var l = here.offsetLeft, r = l + here.offsetWidth;
      if (l < wrap.scrollLeft || r > wrap.scrollLeft + wrap.clientWidth) wrap.scrollTo({ left: l - 24, behavior: 'smooth' });
    }
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = byId[e.target.id]; if (!a) return;
        links.forEach(function (x) { x.classList.remove('is-here'); });
        a.classList.add('is-here'); here = a; place();
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) seen.observe(el); });
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }
})();
