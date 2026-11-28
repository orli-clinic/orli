/* The phone on the home page (#anywhere): it works like one.
   Lock screen -> swipe up (or tap) -> home screen with Orli installed beside
   the phone's own apps -> the admin inside it (its own bottom bar and an
   appointment's own actions), the patient's text messages, and a call that
   Orli answers, which then lands in the calendar. The other apps answer with
   a line about Orli, or just jiggle. Without this file the phone is its lock
   screen with the notifications. */
(function () {
  'use strict';

  var phone = document.querySelector('[data-phone]');
  if (!phone) return;
  var screen = phone.querySelector('.ph-screen');
  var $ = function (sel, root) { return (root || phone).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || phone).querySelectorAll(sel)); };
  var views = {};
  $$('[data-view]').forEach(function (v) { views[v.getAttribute('data-view')] = v; });
  var current = 'lock';
  var toast = $('[data-toast]');
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function still() {
    return document.documentElement.classList.contains('a11y-still') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // The real time, so the phone is "now".
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function tick() {
    var d = new Date();
    var hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    $$('[data-clock], [data-bigclock]').forEach(function (el) { el.textContent = hm; });
    var date = $('[data-date]');
    try {
      if (date) date.textContent = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    } catch (e) { /* keep the written date */ }
  }
  tick();
  setInterval(tick, 20000);

  var LIGHT = { app: true, sms: true };
  function go(name) {
    if (!views[name] || name === current) return;
    var from = views[current];
    from.hidden = true;
    from.classList.remove('is-entering');
    var to = views[name];
    to.hidden = false;
    to.style.transform = ''; to.style.opacity = '';
    if (!still()) { to.classList.remove('is-entering'); void to.offsetWidth; to.classList.add('is-entering'); }
    screen.classList.toggle('is-light', !!LIGHT[name]);
    toast.classList.remove('is-on');
    if (current === 'call') hangUp(true);
    current = name;
    if (name === 'home' && !rangOnce) { rangOnce = true; later(function () { if (current === 'home') ring(); }, 7000); }
  }

  // ---- Toast ----
  var toastT;
  function say(text) {
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
  }

  // ---- Banner (an Orli notification while the phone is open) ----
  var banner = $('[data-banner]');
  var bannerT;
  function notify(title, body, then) {
    $('[data-b-title]', banner).textContent = title;
    $('[data-b-body]', banner).textContent = body;
    banner.hidden = false;
    banner.onclick = function () { banner.hidden = true; then && then(); };
    clearTimeout(bannerT);
    bannerT = setTimeout(function () { banner.hidden = true; }, 5200);
  }

  // ---- Lock screen: swipe up, or tap ----
  var lock = views.lock;
  var y0 = null, dy = 0;
  lock.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.hp-note')) return;
    y0 = e.clientY; dy = 0;
    lock.setPointerCapture && lock.setPointerCapture(e.pointerId);
  });
  lock.addEventListener('pointermove', function (e) {
    if (y0 === null) return;
    dy = Math.min(0, e.clientY - y0);
    lock.style.transition = 'none';
    lock.style.transform = 'translateY(' + dy + 'px)';
    lock.style.opacity = String(1 + dy / 400);
  });
  function release() {
    if (y0 === null) return;
    y0 = null;
    lock.style.transition = '';
    if (dy < -60) { go('home'); }
    lock.style.transform = ''; lock.style.opacity = '';
  }
  lock.addEventListener('pointerup', release);
  lock.addEventListener('pointercancel', release);

  // ---- Home screen apps that are not Orli ----
  var LINES = {
    'לוח שנה': 'היומן כבר באורלי, מעודכן מהאופטימה.',
    'דואר': 'אורלי כבר שלחה את אישורי הפגישות במייל.',
    'שעון': 'תזכורות יוצאות רק בין 08:00 ל־20:00, ולא בשבת.',
    'הגדרות': 'שעות, מטפלים ונוסחים מגדירים באורלי.'
  };
  $$('[data-jiggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      b.classList.remove('is-jiggle'); void b.offsetWidth; b.classList.add('is-jiggle');
      var line = LINES[b.textContent.trim()];
      if (line) say(line);
    });
  });

  // ---- Orli: the admin ----
  var title = $('[data-pa-title]'), sub = $('[data-pa-sub]');
  function tab(name) {
    $$('.pa-bar button').forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.classList.toggle('is-on', on);
      if (on) title.textContent = b.getAttribute('data-title');
    });
    $$('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== name; });
    sub.textContent = name === 'cal' ? 'היום' : '';
    closeSheet();
  }
  $$('.pa-bar button').forEach(function (b) {
    b.addEventListener('click', function () { tab(b.getAttribute('data-tab')); });
  });
  function openApp(paneName) {
    go('app');
    tab(paneName || 'cal');
    var badge = $('.ph-badge');
    badge && badge.remove();
  }

  // An appointment's own sheet: שינוי מועד, הגעה, ביטול הפגישה.
  var sheet = $('[data-sheet]'), row = null;
  var sTreat = $('[data-s-treat]'), sTime = $('[data-s-time]'), sWho = $('[data-s-who]'), sNote = $('[data-s-note]');
  var sSlots = $('[data-s-slots]'), sActions = $('[data-s-actions]'), sConfirm = $('[data-s-confirm]');
  function openSheet(r) {
    row = r;
    sTreat.textContent = r.getAttribute('data-treat');
    sTime.textContent = $('time', r).textContent;
    sWho.textContent = r.getAttribute('data-patient') + ' · ' + r.getAttribute('data-doc');
    sNote.hidden = true; sSlots.hidden = true; sConfirm.hidden = true; sActions.hidden = false;
    var arrived = $('[data-act="arrived"]', sheet);
    arrived.hidden = r.classList.contains('is-cancelled');
    $('[data-act="move"]', sheet).hidden = r.classList.contains('is-cancelled');
    $('[data-act="cancel"]', sheet).hidden = r.classList.contains('is-cancelled');
    arrived.textContent = r.classList.contains('is-arrived') ? 'ביטול הסימון' : 'הגעה';
    if (r.classList.contains('is-cancelled')) { sNote.hidden = false; sNote.textContent = 'הפגישה בוטלה.'; }
    sheet.hidden = false;
  }
  function closeSheet() { sheet.hidden = true; row = null; }
  function settle(text) {
    sActions.hidden = true; sSlots.hidden = true; sConfirm.hidden = true;
    sNote.hidden = false; sNote.textContent = text;
    later(closeSheet, 1300);
  }
  phone.addEventListener('click', function (e) {
    var r = e.target.closest('.pa-row');
    if (r) { openSheet(r); return; }
    var act = e.target.closest('[data-act]');
    if (act && row) {
      var a = act.getAttribute('data-act');
      if (a === 'close' || a === 'no') { if (a === 'no') { sConfirm.hidden = true; sActions.hidden = false; } else closeSheet(); }
      else if (a === 'move') { sActions.hidden = true; sSlots.hidden = false; }
      else if (a === 'arrived') {
        var on = !row.classList.contains('is-arrived');
        row.classList.toggle('is-arrived', on);
        settle(on ? 'סומן שהמטופל הגיע.' : 'הסימון בוטל.');
      }
      else if (a === 'cancel') { sActions.hidden = true; sConfirm.hidden = false; }
      else if (a === 'yes') { row.classList.add('is-cancelled'); row.classList.remove('is-arrived'); settle('הפגישה בוטלה, והשעה פנויה שוב לקביעה.'); }
      return;
    }
    var slot = e.target.closest('[data-s-slots] button');
    if (slot && row) {
      $('time', row).textContent = slot.textContent;
      row.classList.add('is-moved');
      var list = row.parentNode, rows = $$('.pa-row', list);
      rows.sort(function (x, y) { return $('time', x).textContent < $('time', y).textContent ? -1 : 1; });
      rows.forEach(function (x) { if (!x.closest('[data-later]')) list.appendChild(x); });
      var lateDay = $('.pa-day', list); if (lateDay) { list.appendChild(lateDay); $$('[data-later]', list).forEach(function (x) { list.appendChild(x); }); }
      settle('המועד שונה ל־' + slot.textContent + '.');
    }
  });

  // The inbox: a callback the agent left for the team.
  var cb = $('[data-callback]'), empty = $('[data-empty]'), dot = $('[data-inbox-dot]');
  $('[data-done]', cb).addEventListener('click', function () {
    cb.remove(); empty.hidden = false; dot.hidden = true;
  });

  // ---- A call: let it ring and Orli answers ----
  var call = views.call, rangOnce = false;
  var state = $('[data-c-state]'), timer = $('[data-c-timer]'), orli = $('[data-c-orli]'), hint = $('[data-c-hint]');
  var ringBtns = $('[data-c-ring]'), liveBtns = $('[data-c-live]'), listen = $('[data-call="listen"]');
  var answerT = null, clockT = null, endT = null, audio = null, booked = false;
  function ring() {
    if (current === 'call') return;
    state.textContent = 'שיחה נכנסת · מרפאת סמיילי';
    timer.hidden = true; orli.hidden = true; hint.hidden = false; ringBtns.hidden = false; liveBtns.hidden = true;
    hint.textContent = 'אף אחד לא פנוי? חכו רגע.';
    call.setAttribute('data-ringing', '');
    go('call');
    answerT = later(orliAnswers, 4200);
  }
  function runClock() {
    var t0 = Date.now();
    timer.hidden = false; timer.textContent = '00:00';
    clockT = setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      timer.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }, 500);
  }
  function orliAnswers() {
    clearTimeout(answerT);
    call.removeAttribute('data-ringing');
    state.textContent = 'מרפאת סמיילי';
    orli.hidden = false; hint.hidden = true; ringBtns.hidden = true; liveBtns.hidden = false;
    runClock();
    endT = later(finishByOrli, 9000);
  }
  function finishByOrli() {
    if (audio && !audio.paused) return; // listening: ends with the recording
    booked = true;
    go('home');
    later(function () {
      notify('פגישה חדשה ביומן', 'ניקוי שיניים, יום רביעי 10:30 · נקבעה בשיחת טלפון', function () { addBooking(); openApp('cal'); });
    }, 500);
  }
  function hangUp(silent) {
    clearTimeout(answerT); clearTimeout(endT); clearInterval(clockT);
    call.removeAttribute('data-ringing');
    if (audio) { audio.pause(); listen.classList.remove('is-on'); listen.textContent = 'להאזין לשיחה'; }
    if (!silent && current === 'call') go('home');
  }
  $('[data-call="decline"]').addEventListener('click', function () { orliAnswers(); });
  $('[data-call="accept"]').addEventListener('click', function () {
    clearTimeout(answerT);
    call.removeAttribute('data-ringing');
    state.textContent = 'בשיחה · מרפאת סמיילי';
    hint.hidden = true; ringBtns.hidden = true; liveBtns.hidden = false;
    runClock();
  });
  $('[data-call="end"]').addEventListener('click', function () {
    var byOrli = !orli.hidden;
    hangUp();
    if (byOrli && !booked) finishByOrli();
  });
  listen.addEventListener('click', function () {
    if (!audio) {
      audio = new Audio('assets/audio/sample-call.mp3');
      audio.addEventListener('ended', function () { listen.classList.remove('is-on'); listen.textContent = 'להאזין לשיחה'; if (current === 'call') finishByOrli(); });
    }
    if (audio.paused) { audio.currentTime = 0; audio.play().catch(function () {}); listen.classList.add('is-on'); listen.textContent = 'השתקה'; clearTimeout(endT); }
    else { audio.pause(); listen.classList.remove('is-on'); listen.textContent = 'להאזין לשיחה'; endT = later(finishByOrli, 1500); }
  });

  function addBooking() {
    var list = $('[data-pane="cal"]');
    if ($('[data-later]', list)) return;
    var day = document.createElement('p');
    day.className = 'pa-day'; day.textContent = 'יום רביעי';
    var src = $('.pa-row[data-appt="1"] .pa-src', list);
    var r = document.createElement('button');
    r.type = 'button'; r.className = 'pa-row is-new'; r.setAttribute('data-later', '');
    r.setAttribute('data-treat', 'ניקוי שיניים'); r.setAttribute('data-patient', 'מטופל חדש'); r.setAttribute('data-doc', 'ד״ר שגיא');
    r.innerHTML = '<time>10:30</time><span class="pa-what"><b>ניקוי שיניים</b><small>מטופל חדש · ד״ר שגיא</small></span>' +
      (src ? src.outerHTML : '') + '<i class="pa-arrived" aria-hidden="true">' + ($('.pa-arrived', list) ? $('.pa-arrived', list).innerHTML : '') + '</i>';
    list.appendChild(day); list.appendChild(r);
  }

  // ---- Wiring: everything with data-go ----
  phone.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]');
    if (!g) return;
    var to = g.getAttribute('data-go');
    if (to === 'home') {
      if (current === 'call') { hangUp(); return; }
      go('home');
    }
    else if (to === 'app') openApp('cal');
    else if (to === 'inbox') openApp('inbox');
    else if (to === 'outcall') { say('מתקשרים לנועה מהטלפון שלכם.'); }
    else if (to.indexOf('appt:') === 0) {
      openApp('cal');
      var r = $('.pa-row[data-appt="' + to.slice(5) + '"]');
      if (r) openSheet(r);
    }
    else if (to === 'sms') go('sms');
    else if (to === 'dial') { say('השיחות של המרפאה? אורלי עונה להן.'); later(ring, 1400); }
  });

  // The side button locks it.
  $('[data-lock]').addEventListener('click', function () {
    hangUp(true);
    banner.hidden = true;
    go('lock');
  });
})();
