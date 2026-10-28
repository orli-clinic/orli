/* ============================================================
   Live Orli booking widget — interactive demo.

   A static, dependency-free reproduction of the real Vue widget, so
   this page never depends on the booking service being reachable.
   Flow: practitioner → treatment → date → time → patient → confirm
   (OTP) → success. No backend. OTP accepts any 6 digits.

   ------------------------------------------------------------
   HOW TO REFRESH THIS AGAINST THE REAL WIDGET
   ------------------------------------------------------------
   Every block below is marked with a SOURCE: comment naming the
   file it mirrors. All paths are relative to the sibling repo:

       ../orli-calendar/widget/src/

   Read the named file, diff it against the block underneath the
   comment, and port the differences. The map:

     App.vue                        — step order, progress bar, flow,
                                      the ?demo scene jumps
     i18n.ts                        — the S string table, WEEKDAYS,
                                      formatDate, formatMonth, formatPrice
     demo.ts                        — CARDS, availability, DEMO_PREFILL
     style.css                      — mirrored in this repo's widget.css
     components/BiText.vue          — bi()
     components/PractitionerStep.vue — practitionerHtml()
     components/TreatmentStep.vue   — treatmentHtml()
     components/DateStep.vue        — dateHtml() + calendarHtml()
     components/TimeStep.vue        — timeHtml()
     components/PatientStep.vue     — patientHtml() + field validation
     components/ConfirmStep.vue     — confirmHtml()
     components/SuccessStep.vue     — successHtml()
     components/ChatStep.vue        — chatHtml(): the clinic agent's panel,
                                      reached from practitionerHtml()'s
                                      "ask the clinic" entry; the two
                                      replies here are canned (DEMO_CHAT)

   ManageStep.vue (reschedule/cancel) is deliberately NOT mirrored:
   it is reached from an emailed link, never from the booking flow
   this demo walks. Nor are the loading/error states — the static
   demo never enters them.
   ============================================================ */
(function () {
  'use strict';

  // SOURCE: i18n.ts — `strings`. Only the keys this demo can actually
  // reach are mirrored. Keys marked DEMO-ONLY have no counterpart in
  // i18n.ts and exist for this page.
  var S = {
    progressStep: ['שלב {n} מתוך {total}', 'Step {n} of {total}'],
    bookTitle: ['לקביעת פגישה', 'Book an appointment'],
    treatment: ['טיפול', 'Treatment'],
    practitioner: ['מטפל/ת', 'Practitioner'],
    price: ['מחיר', 'Price'],
    freePrice: ['חינם', 'Free'],
    when: ['תאריך ושעה', 'Date and time'],
    chooseTreatment: ['בחרו טיפול', 'Choose a treatment'],
    chooseDate: ['בחרו תאריך', 'Choose a date'],
    chooseTime: ['בחרו שעה', 'Choose a time'],
    yourDetails: ['הפרטים שלכם', 'Your details'],
    // DELIBERATE DIVERGENCE: i18n.ts still says "התור" here; the site's word
    // for a booking is "פגישה" everywhere, so the demo follows the site until
    // the real widget's strings catch up.
    confirmTitle: ['אישור הפגישה', 'Confirm appointment'],
    bookedTitle: ['הפגישה נקבעה!', 'Appointment booked!'],
    firstName: ['שם פרטי', 'First name'],
    lastName: ['שם משפחה', 'Last name'],
    fullName: ['שם מלא', 'Full name'],
    phone: ['מספר טלפון', 'Phone number'],
    email: ['אימייל', 'Email'],
    marketingConsent: [
      'אני מעוניין/ת לקבל עדכונים והצעות מהמרפאה',
      'I would like to receive updates and offers from the clinic',
    ],
    requiredFieldError: ['שדה חובה', 'This field is required'],
    phoneTooShortError: ['מספר הטלפון קצר מדי', 'Phone number is too short'],
    invalidEmailError: ['כתובת אימייל לא תקינה', 'Please enter a valid email address'],
    back: ['חזרה', 'Back'],
    continue: ['המשך', 'Continue'],
    confirm: ['אישור הזמנה', 'Confirm booking'],
    // Same divergence as confirmTitle: the site says פגישה, never תור.
    booking: ['קובע פגישה…', 'Booking…'],
    nextMonth: ['חודש הבא', 'Next month'],
    prevMonth: ['חודש קודם', 'Previous month'],
    noSlots: [
      'אין זמנים פנויים בטווח התאריכים הזמין לקביעה.',
      'No available times in the bookable date range.',
    ],
    showNextMonth: ['הצג את החודש הבא', 'Show next month'],
    otpSentTo: ['שלחנו קוד אימות לאימייל {email}', 'We sent a verification code to {email}'],
    otpCode: ['קוד אימות', 'Verification code'],
    sendOtp: ['שלח קוד לאימות', 'Send code to my email'],
    sendingOtp: ['שולח…', 'Sending…'],
    resendCode: ['שליחת קוד חדש', 'Send a new code'],
    // DEMO-ONLY: the real widget checks the code against the server; here any
    // 6 digits pass, so the visitor has to be told that.
    otpDemoHint: ['לצורך ההדגמה: כל 6 ספרות יתקבלו', 'Demo: any 6-digit code works'],
    // SOURCE: i18n.ts — the clinic agent's chat panel (orli-calendar #279).
    askClinic: ['שאל/י את המרפאה', 'Ask the clinic'],
    askClinicHint: ['שאלות על טיפולים, שעות ומחירים — ותורים פנויים', 'Treatments, hours and prices — and free times'],
    chatTitle: ['שיחה עם המרפאה', 'Chat with the clinic'],
    chatPlaceholder: ['כתבו הודעה…', 'Write a message…'],
    chatSend: ['שליחה', 'Send'],
    chatTyping: ['מקליד/ה…', 'Typing…'],
    chatBookThisTime: ['לקביעת התור הזה', 'Book this time'],
    // DEMO-ONLY: the real SuccessStep.vue ends the flow with no controls,
    // because there the patient is finished and closes the widget. On a
    // marketing page the success scene is a dead end instead, so the demo
    // gets a way back to the start. Do not port this upstream.
    restartDemo: ['להתחיל את ההדגמה מחדש', 'Restart the demo'],
  };

  // SOURCE: i18n.ts — calendarWeekdays.
  var WEEKDAYS = [
    ['א׳', 'Sun'], ['ב׳', 'Mon'], ['ג׳', 'Tue'], ['ד׳', 'Wed'],
    ['ה׳', 'Thu'], ['ו׳', 'Fri'], ['ש׳', 'Sat'],
  ];

  // SOURCE: demo.ts — getBookingSettings() returns booking_months_ahead: 2,
  // which App.vue passes straight through as the calendar's max month offset.
  // demoAvailability() returns [] for any monthOffset > 1, so the last
  // reachable month renders the real widget's empty-month panel.
  var MAX_MONTH_OFFSET = 2;
  var LAST_MONTH_WITH_SLOTS = 1;

  // SOURCE: demo.ts — CATALOG / APPOINTMENT_TYPES / PRACTITIONERS.
  // One card per practitioner, each with their own treatments — the shape
  // GET /clinics/{id}/catalog returns for real (see api.ts).
  // DELIBERATE DIVERGENCE: demo.ts prices these (150.00 / 0). Here price is
  // null, which the real widget handles the same way it does for a clinic
  // that lists none: no price line on the treatment and no price row in the
  // summaries. The marketing demo is not the place to put a number on a visit.
  var CARDS = [
    {
      practitioner: { id: 'demo-prac-1', he: 'ד"ר כהן', en: 'Dr. Cohen' },
      treatments: [
        {
          id: 'demo-apt-1', he: 'ייעוץ', en: 'Consultation',
          descriptionHe: 'שיחת ייעוץ ראשונית להכרת הצרכים שלך',
          descriptionEn: 'An initial consultation to understand your needs',
          price: null,
        },
      ],
    },
    {
      practitioner: { id: 'demo-prac-2', he: 'ד"ר לוי', en: 'Dr. Levi' },
      treatments: [
        { id: 'demo-apt-2', he: 'ניקוי שיניים', en: 'Cleaning', price: null },
      ],
    },
  ];

  // SOURCE: demo.ts — demoAvailability(). DELIBERATE DIVERGENCE: demo.ts picks
  // fixed days-of-month (3, 5, 8, 12, 19, 26) and only slides a weekend hit
  // forward to the next working day, so its demo months look sparse and
  // uneven. An Israeli clinic works Sunday to Thursday, so these are
  // generated from the real calendar instead: every other open day, up to
  // six, which reads like a real diary without listing every weekday.
  var CLINIC_DAYS = [0, 1, 2, 3, 4]; // Sun–Thu. Fri/Sat closed.
  var SLOT_SETS = [
    [{ start: '09:00', end: '09:30' }, { start: '11:00', end: '11:30' }, { start: '14:00', end: '14:30' }],
    [{ start: '10:30', end: '11:00' }, { start: '15:00', end: '15:30' }],
    [{ start: '09:30', end: '10:00' }, { start: '13:00', end: '13:30' }, { start: '16:00', end: '16:30' }],
  ];

  function availabilityFor(monthOffset) {
    if (monthOffset > LAST_MONTH_WITH_SLOTS) return [];
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + monthOffset;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var day = monthOffset === 0 ? now.getDate() + 1 : 1;
    var out = [];
    var open = 0;
    for (; day <= daysInMonth && out.length < 6; day++) {
      var date = new Date(year, month, day);
      if (CLINIC_DAYS.indexOf(date.getDay()) < 0) continue;
      if (open++ % 2) continue;
      out.push({ date: iso(date), slots: SLOT_SETS[out.length % SLOT_SETS.length] });
    }
    return out;
  }

  function demoDate(daysFromNow) {
    var d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return iso(d);
  }

  // The first genuinely bookable day, so the booking the demo walks through is
  // never on a day the clinic is shut. The fallback only fires if a month
  // somehow yields no open days.
  var DEMO_DAY = availabilityFor(0)[0] || availabilityFor(1)[0] || { date: demoDate(3), slots: SLOT_SETS[0] };

  // SOURCE: demo.ts — DEMO_PREFILL, plus createAppointment()'s returned id.
  // Pre-made selections so any step can be jumped straight to (see setScene),
  // and so the visitor never has to type to reach the end of the flow.
  var DEMO_PREFILL = {
    cardIndex: 0,
    treatmentIndex: 0,
    day: DEMO_DAY,
    time: (DEMO_DAY.slots[1] || DEMO_DAY.slots[0]).start,
    firstName: 'ישראל',
    lastName: 'ישראלי',
    phone: '050-123-4567',
    email: 'demo@orliclinic.com',
    bookingId: 'demo-booking-001',
  };

  // SOURCE: demo.ts — the canned two-turn conversation the demo page's chat
  // plays: no backend, whatever the visitor types gets the next reply. The
  // second reply carries the booking link, which jumps into the wizard the
  // way the real widget's ChatStep does.
  var DEMO_CHAT = {
    opening: ['שלום! אני העוזר הדיגיטלי של המרפאה. איך אפשר לעזור?', "Hi! I'm the clinic's virtual assistant. How can I help?"],
    replies: [
      ['ייעוץ ראשוני נמשך כ-30 דקות ואפשר לקבוע אותו אונליין. רוצים שאבדוק מתי ד"ר כהן פנוי/ה?', 'An initial consultation takes about 30 minutes and can be booked online. Shall I check when Dr. Cohen is free?'],
      ['יש תור פנוי ב-{time}. אפשר לקבוע אותו כאן:', 'There is a free time at {time}. You can book it here:'],
    ],
  };

  function iso(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + m + '-' + d;
  }

  // SOURCE: i18n.ts — formatDate / formatMonth / formatPrice.
  var DATE_FMT = { weekday: 'long', day: 'numeric', month: 'long' };
  function formatDate(dateStr) {
    var parsed = new Date(dateStr + 'T00:00:00');
    return [parsed.toLocaleDateString('he', DATE_FMT), parsed.toLocaleDateString('en', DATE_FMT)];
  }
  var MONTH_FMT = { month: 'long', year: 'numeric' };
  function formatMonth(monthOffset) {
    var now = new Date();
    var month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return [month.toLocaleDateString('he', MONTH_FMT), month.toLocaleDateString('en', MONTH_FMT)];
  }
  function formatPrice(price) {
    if (Number(price) === 0) return S.freePrice;
    return [price + ' ₪', '₪' + price];
  }

  // ---- tiny DOM helpers ----
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // The widget owns its own language, exactly like the real product does: the
  // marketing site around it is Hebrew-only with no toggle (see PRODUCT.md),
  // so there is no site language to follow. he → rtl, en → ltr; one value,
  // the whole layout follows.
  var LANG = 'he';
  function dir() { return LANG === 'he' ? 'rtl' : 'ltr'; }

  // SOURCE: BiText.vue — renders ONLY the current language (Hebrew falling
  // back to English and vice versa), never both. Extra classes land on the
  // .obw-bi root, as a `class` on <BiText> does.
  function bi(pair, cls) {
    var he = pair[0], en = pair[1];
    var text = LANG === 'he' ? (he || en) : (en || he);
    return '<span class="obw-bi' + (cls ? ' ' + cls : '') + '"><span>' + esc(text) + '</span></span>';
  }
  function fill(pair, vars) {
    return [pair[0].replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; }),
            pair[1].replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; })];
  }

  var EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // ---- widget instance ----
  function mount(root) {
    var st = null;
    function reset() {
      st = {
        step: 'practitioner',
        // The chat's canned transcript (ChatStep.vue's messages) and typing state.
        chat: [],
        chatPending: false,
        practitioner: null, treatments: [], treatment: null,
        monthOffset: 0, day: null, time: '',
        // Pre-filled with the real demo build's placeholder identity so this
        // needs zero typing — the Israeli "John Doe". Editable, but ready to
        // click straight through. Stays Hebrew in both languages, matching
        // demo.ts, which does not translate it either.
        firstName: DEMO_PREFILL.firstName,
        lastName: DEMO_PREFILL.lastName,
        phone: DEMO_PREFILL.phone,
        email: DEMO_PREFILL.email,
        consent: false,
        touched: {},
        confirmedEmail: null,
        otp: '', otpSent: false, sendingOtp: false, resendWait: 0, submitting: false, bookingId: null,
      };
    }
    reset();

    var timer = null;
    function startResend() {
      st.resendWait = 90;
      clearInterval(timer);
      timer = setInterval(function () {
        st.resendWait -= 1;
        if (st.resendWait <= 0) clearInterval(timer);
        var el = root.querySelector('[data-resend-wait]');
        if (el) el.textContent = st.resendWait > 0 ? ' (' + st.resendWait + ')' : '';
        var btn = root.querySelector('[data-resend]');
        if (btn) btn.disabled = st.resendWait > 0;
      }, 1000);
    }

    // SOURCE: App.vue — STEP_ORDER. 'success' sits outside it: the progress
    // rail has nothing left to count there.
    var STEP_ORDER = ['practitioner', 'treatment', 'date', 'time', 'patient', 'confirm'];

    var lastStep = null;

    // Each render replaces the widget's markup wholesale, which takes the
    // focused element with it — a keyboard visitor who picked a time slot
    // landed back on <body> and had to tab in from the top of the page again,
    // once per step. Two things fix that, and both need to outlive the
    // markup, so they live on nodes created once:
    //
    //   shell  the render target, so `root` itself is never emptied
    //   live   a status region announcing each new step, which would never be
    //          heard if it were rebuilt along with everything else
    //
    // The shell is display:contents (widget.css), so it adds no box and the
    // pinned #demo frame still sizes .obw-widget directly.
    var shell = document.createElement('div');
    shell.className = 'obw-shell';
    var live = document.createElement('p');
    live.className = 'obw-visually-hidden';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    root.appendChild(shell);
    root.appendChild(live);

    // True while a host (scrolly.js) is driving us. Scroll- and stepper-driven
    // changes must not pull focus into the widget — that would fight the page
    // for the scroll position and yank the reader mid-sentence. The step text
    // beside the widget already narrates those. Only a step the visitor caused
    // from inside the widget moves focus and announces.
    var hostDriven = false;

    function announceStep() {
      var heading = shell.querySelector('.obw-title');
      if (!heading) return;
      var label = heading.textContent.trim();
      live.textContent = label;
      heading.setAttribute('tabindex', '-1');
      // preventScroll: the widget is already in view; scrolling to the heading
      // would move the page out from under the visitor.
      try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); }
    }

    // SOURCE: App.vue — template.
    function render() {
      // SOURCE: App.vue — showControls / showProgress: the chat keeps the
      // language toggle but has no progress position.
      var showControls = st.step !== 'success';
      var showProgress = showControls && st.step !== 'chat';
      var idx = STEP_ORDER.indexOf(st.step);
      var controls = '';
      if (showControls) {
        var segs = '';
        for (var n = 0; n < STEP_ORDER.length; n++) {
          segs += '<span class="obw-progress-seg' + (n < idx ? ' is-on' : '') + '"></span>';
        }
        var globeSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
        var progressLabel = fill(S.progressStep, { n: String(idx + 1), total: String(STEP_ORDER.length) });
        var labelText = LANG === 'he' ? progressLabel[0] : progressLabel[1];
        controls = '<div class="obw-controls">' +
          '<button class="obw-lang-btn" type="button" data-lang aria-label="' +
            (LANG === 'he' ? 'Switch to English' : 'החלף לעברית') + '">' +
            globeSvg + '<span>' + (LANG === 'he' ? 'עב' : 'EN') + '</span></button>' +
          (showProgress
            ? '<div class="obw-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + STEP_ORDER.length + '"' +
              ' aria-valuenow="' + idx + '" aria-valuetext="' + esc(labelText) + '">' +
              segs + '<span class="obw-visually-hidden">' + esc(labelText) + '</span></div>'
            : '') +
        '</div>';
      }
      var stepClass = 'obw-step' +
        (st.step === 'date' ? ' obw-step--date' : '') +
        (st.step === 'time' ? ' obw-step--time' : '');
      // Mirror direction and language to match the toggle. lang matters as
      // much as dir: without it a screen reader reads the English strings
      // with a Hebrew voice, because the host page is <html lang="he">.
      root.setAttribute('dir', dir());
      root.setAttribute('lang', LANG);
      shell.innerHTML =
        '<div class="obw-widget">' +
          controls +
          '<main class="' + stepClass + '">' + stepHtml() + '</main>' +
        '</div>';
      wire();
      // Let a host (scrolly.js) follow along when the visitor clicks their own
      // way through the widget. Fires only on an actual step change, so a
      // host that drives us via setScene() can ignore the echo of its own
      // call by tracking the step it last asked for.
      if (st.step !== lastStep) {
        var first = lastStep === null;
        lastStep = st.step;
        if (!first && !hostDriven) announceStep();
        if (typeof handle.onStep === 'function') handle.onStep(st.step);
      }
    }

    function stepHtml() {
      switch (st.step) {
        case 'practitioner': return practitionerHtml();
        case 'treatment': return treatmentHtml();
        case 'date': return dateHtml();
        case 'time': return timeHtml();
        case 'patient': return patientHtml();
        case 'confirm': return confirmHtml();
        case 'success': return successHtml();
        case 'chat': return chatHtml();
      }
      return '';
    }

    // The real widget is a standalone surface, so its step title is an <h1>
    // and the calendar's month heading an <h2>. Mounted inside a marketing
    // page that already has an h1, that yields a second <h1> and an h1 -> h3
    // jump, so the demo mount steps both down one level.
    var IN_PAGE = root.hasAttribute('data-scrolly');
    var TITLE_TAG = IN_PAGE ? 'h2' : 'h1';
    var SUB_TAG = IN_PAGE ? 'h3' : 'h2';
    function title(inner, cls) {
      return '<' + TITLE_TAG + ' class="obw-title' + (cls ? ' ' + cls : '') + '">' + inner + '</' + TITLE_TAG + '>';
    }

    // SOURCE: every step component's "‹ Back" button. The literal ‹ is what
    // the real markup carries; the bidi algorithm mirrors it under RTL.
    function backBtn() {
      return '<button class="obw-back-btn" data-back>‹ ' + bi(S.back) + '</button>';
    }

    // SOURCE: .obw-step-header — the title on the start edge, Back on the
    // opposite one, so titles stay level across steps.
    function header(titleInner, withBack, subtitle) {
      var t = title(titleInner);
      if (subtitle) t = '<div>' + t + '<p class="obw-step-subtitle">' + subtitle + '</p></div>';
      return '<div class="obw-step-header">' + t + (withBack ? backBtn() : '') + '</div>';
    }

    // SOURCE: PractitionerStep.vue
    function practitionerHtml() {
      var list = CARDS.map(function (card, i) {
        var p = card.practitioner;
        var description = p.descriptionHe || p.descriptionEn
          ? bi([p.descriptionHe || '', p.descriptionEn || ''], 'obw-option-description')
          : '';
        return '<button class="obw-option" data-card="' + i + '">' +
          '<span class="obw-option-content">' + bi([p.he, p.en]) + description + '</span>' +
        '</button>';
      }).join('');
      // SOURCE: PractitionerStep.vue — the "ask the clinic" entry the real
      // widget shows when the clinic's agent is on (orli-calendar #279).
      var chatEntry = '<button class="obw-option obw-chat-entry" type="button" data-chat>' +
        '<span class="obw-option-content">' + bi(S.askClinic) + bi(S.askClinicHint, 'obw-option-description') + '</span>' +
      '</button>';
      return '<div>' + header(bi(S.bookTitle)) + chatEntry + '<div class="obw-list">' + list + '</div></div>';
    }

    // SOURCE: ChatStep.vue — message list, composer, typing indicator, and
    // the booking link a reply can carry. Canned here (DEMO_CHAT).
    function chatHtml() {
      var bubbles = st.chat.map(function (m) {
        var action = m.bookingLink
          ? '<button class="obw-primary-btn obw-primary-btn--compact obw-chat-action" type="button" data-chat-book>' + bi(S.chatBookThisTime) + '</button>'
          : '';
        return '<div class="obw-chat-msg obw-chat-msg--' + m.role + '"><p class="obw-chat-bubble">' + esc(LANG === 'he' ? m.he : m.en) + '</p>' + action + '</div>';
      }).join('');
      var typing = st.chatPending ? '<p class="obw-chat-typing obw-muted">' + bi(S.chatTyping) + '</p>' : '';
      var placeholder = LANG === 'he' ? S.chatPlaceholder[0] : S.chatPlaceholder[1];
      return '<div class="obw-chat-step">' + header(bi(S.chatTitle), true) +
        '<div class="obw-chat-list" role="log">' + bubbles + typing + '</div>' +
        '<form class="obw-chat-composer" data-chat-form>' +
          '<input class="obw-chat-input" data-chat-input aria-label="' + esc(placeholder) + '" placeholder="' + esc(placeholder) + '" maxlength="2000" autocomplete="off"' + (st.chatPending ? ' disabled' : '') + '>' +
          '<button class="obw-primary-btn obw-primary-btn--compact" type="submit"' + (st.chatPending ? ' disabled' : '') + '>' + bi(S.chatSend) + '</button>' +
        '</form>' +
      '</div>';
    }

    // SOURCE: TreatmentStep.vue
    function treatmentHtml() {
      var p = st.practitioner;
      var subtitle = bi(S.practitioner) + ': ' + bi([p.he, p.en]);
      var list = st.treatments.map(function (tr, i) {
        var description = tr.descriptionHe || tr.descriptionEn
          ? bi([tr.descriptionHe || '', tr.descriptionEn || ''], 'obw-option-description')
          : '';
        var price = tr.price != null ? bi(formatPrice(tr.price), 'obw-option-price') : '';
        return '<button class="obw-option" data-treatment="' + i + '">' +
          '<span class="obw-option-content">' + bi([tr.he, tr.en]) + description + price + '</span>' +
        '</button>';
      }).join('');
      return '<div>' + header(bi(S.chooseTreatment), true, subtitle) +
        '<div class="obw-list">' + list + '</div></div>';
    }

    // SOURCE: DateStep.vue — calendarCells: a fixed 6-week (42 cell) grid
    // starting on the Sunday of the viewed month's first week.
    function calendarHtml(days) {
      var now = new Date();
      var viewed = new Date(now.getFullYear(), now.getMonth() + st.monthOffset, 1);
      var year = viewed.getFullYear();
      var month = viewed.getMonth();
      var leadingDays = viewed.getDay();
      var todayKey = iso(now);
      var byDate = {};
      days.forEach(function (d) { byDate[d.date] = d; });

      var weekdays = '<div class="obw-calendar-weekdays" aria-hidden="true">' +
        WEEKDAYS.map(function (w) { return '<span>' + bi(w) + '</span>'; }).join('') + '</div>';
      var cells = '';
      for (var i = 0; i < 42; i++) {
        var date = new Date(year, month, i - leadingDays + 1);
        var key = iso(date);
        var inMonth = date.getFullYear() === year && date.getMonth() === month;
        var available = inMonth && !!byDate[key];
        var isToday = key === todayKey;
        var label = formatDate(key);
        cells += '<button class="obw-calendar-cell obw-calendar-day' +
          (inMonth ? '' : ' is-adjacent') + (available ? ' is-available' : '') + (isToday ? ' is-today' : '') + '"' +
          ' data-obw-date="' + key + '" aria-label="' + esc(label[0] + ' / ' + label[1]) + '"' +
          (isToday ? ' aria-current="date"' : '') + (available ? '' : ' disabled') + '>' +
          date.getDate() + '</button>';
      }
      return weekdays +
        '<div class="obw-calendar-grid" aria-label="' + esc(formatMonth(st.monthOffset)[1]) + '">' + cells + '</div>';
    }

    // SOURCE: DateStep.vue — template.
    function dateHtml() {
      var days = availabilityFor(st.monthOffset);
      st._days = days;
      var body;
      if (!days.length) {
        body = '<div class="obw-calendar-empty">' +
          '<p class="obw-muted">' + bi(S.noSlots) + '</p>' +
          (st.monthOffset < MAX_MONTH_OFFSET
            ? '<button class="obw-nav-btn" data-month="1">' + bi(S.showNextMonth) + '</button>'
            : '') +
        '</div>';
      } else {
        body = calendarHtml(days);
      }
      return '<div class="obw-date-step">' + header(bi(S.chooseDate), true) +
        '<div class="obw-date-results">' +
          '<section class="obw-calendar">' +
            '<header class="obw-month-nav">' +
              '<button class="obw-calendar-nav obw-calendar-nav--previous" data-month="-1" aria-label="' + S.prevMonth[1] + '"' +
                (st.monthOffset === 0 ? ' disabled' : '') + '>' +
                '<span class="obw-nav-arrow obw-nav-arrow--previous" aria-hidden="true"></span></button>' +
              '<' + SUB_TAG + ' class="obw-current-month">' + bi(formatMonth(st.monthOffset)) + '</' + SUB_TAG + '>' +
              '<button class="obw-calendar-nav obw-calendar-nav--next" data-month="1" aria-label="' + S.nextMonth[1] + '"' +
                (st.monthOffset >= MAX_MONTH_OFFSET ? ' disabled' : '') + '>' +
                '<span class="obw-nav-arrow obw-nav-arrow--next" aria-hidden="true"></span></button>' +
            '</header>' +
            '<div class="obw-calendar-body">' + body + '</div>' +
          '</section>' +
        '</div></div>';
    }

    // SOURCE: TimeStep.vue
    function timeHtml() {
      var slots = st.day.slots.map(function (slot) {
        return '<button class="obw-slot" data-time="' + slot.start + '">' + slot.start + '</button>';
      }).join('');
      return '<div class="obw-time-step">' + header(bi(S.chooseTime), true) +
        '<p class="obw-date-summary obw-muted">' + bi(formatDate(st.day.date)) + '</p>' +
        '<div class="obw-slots">' + slots + '</div></div>';
    }

    // SOURCE: PatientStep.vue — fields, autocomplete hints and per-field
    // validity rules. A field only shows its Invalid state once the visitor
    // has left it (blur); submit marks every field touched so the problem
    // ones light up instead of the button silently doing nothing.
    var FIELDS = [
      { name: 'firstName', input: 'first_name', type: 'text', autocomplete: 'given-name', error: 'requiredFieldError' },
      { name: 'lastName', input: 'last_name', type: 'text', autocomplete: 'family-name', error: 'requiredFieldError' },
      { name: 'phone', input: 'phone', type: 'tel', autocomplete: 'tel', error: 'phoneTooShortError' },
      { name: 'email', input: 'email', type: 'email', autocomplete: 'email', error: 'invalidEmailError' },
    ];
    function fieldValid(f) {
      var v = String(st[f.name]).trim();
      if (f.name === 'phone') return v.length >= 7;
      if (f.name === 'email') return EMAIL_PATTERN.test(v);
      return v.length > 0;
    }
    function fieldInvalid(f) { return !!st.touched[f.name] && !fieldValid(f); }
    function fieldHtml(f) {
      var invalid = fieldInvalid(f);
      return '<label class="obw-field' + (invalid ? ' is-invalid' : '') + '" data-field-wrap="' + f.name + '">' +
        bi(S[f.name]) +
        '<input data-field="' + f.name + '" name="' + f.input + '" type="' + f.type + '"' +
          ' autocomplete="' + f.autocomplete + '" required value="' + esc(st[f.name]) + '" />' +
        (invalid ? '<p class="obw-field-error">' + bi(S[f.error]) + '</p>' : '') +
      '</label>';
    }
    // Updates one field's Invalid state in place. A full re-render on blur
    // would tear down the input the visitor is tabbing into.
    function refreshField(f) {
      var wrap = root.querySelector('[data-field-wrap="' + f.name + '"]');
      if (!wrap) return;
      var invalid = fieldInvalid(f);
      wrap.classList.toggle('is-invalid', invalid);
      var err = wrap.querySelector('.obw-field-error');
      if (invalid && !err) wrap.insertAdjacentHTML('beforeend', '<p class="obw-field-error">' + bi(S[f.error]) + '</p>');
      else if (!invalid && err) err.parentNode.removeChild(err);
    }

    function patientHtml() {
      return '<div class="obw-patient-step">' +
        '<div class="obw-patient-header obw-step-header">' + title(bi(S.yourDetails)) + backBtn() + '</div>' +
        '<form class="obw-patient-form" data-patient novalidate>' +
          FIELDS.map(fieldHtml).join('') +
          '<label class="obw-consent"><input data-field="consent" name="marketing_consent" type="checkbox"' +
            (st.consent ? ' checked' : '') + ' />' + bi(S.marketingConsent) + '</label>' +
          '<button type="submit" class="obw-primary-btn obw-primary-btn--compact">' + bi(S.continue) + '</button>' +
        '</form></div>';
    }

    // SOURCE: ConfirmStep.vue + SuccessStep.vue — the same <dl> on both.
    function summaryHtml(date, time) {
      var tr = st.treatment;
      var p = st.practitioner;
      return '<dl class="obw-summary">' +
        '<dt>' + bi(S.treatment) + '</dt><dd>' + bi([tr.he, tr.en]) + '</dd>' +
        (tr.price != null ? '<dt>' + bi(S.price) + '</dt><dd>' + bi(formatPrice(tr.price)) + '</dd>' : '') +
        '<dt>' + bi(S.practitioner) + '</dt><dd>' + bi([p.he, p.en]) + '</dd>' +
        '<dt>' + bi(S.when) + '</dt><dd>' + bi(formatDate(date)) + ' · <span class="obw-tabular">' + esc(time) + '</span></dd>' +
        '<dt>' + bi(S.fullName) + '</dt><dd>' + esc(st.firstName + ' ' + st.lastName) + '</dd>' +
        '<dt>' + bi(S.phone) + '</dt><dd>' + esc(st.phone) + '</dd>' +
        '<dt>' + bi(S.email) + '</dt><dd>' + esc(st.email) + '</dd>' +
      '</dl>';
    }

    // SOURCE: ConfirmStep.vue
    function confirmHtml() {
      var otpBox = st.otpSent ? (
        '<div class="obw-otp">' +
          '<p class="obw-otp-hint">' + bi(fill(S.otpSentTo, { email: st.email })) + '</p>' +
          '<label class="obw-field">' + bi(S.otpCode) +
            '<input data-otp name="otp_code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required value="' + esc(st.otp) + '" /></label>' +
          '<button type="button" class="obw-resend-btn" data-resend' + (st.resendWait > 0 ? ' disabled' : '') + '>' +
            bi(S.resendCode) + '<span data-resend-wait>' + (st.resendWait > 0 ? ' (' + st.resendWait + ')' : '') + '</span></button>' +
          // DEMO-ONLY, and on the resend row rather than a line of its own so
          // the step stays exactly the real widget's height: style.css sizes
          // the 580px frame to fit this block with no inner scrollbar.
          bi(S.otpDemoHint, 'obw-demo-hint') +
        '</div>'
      ) : '';
      var canConfirm = st.otpSent && /^\d{6}$/.test(st.otp.trim());
      var footer = '<div class="obw-confirm-footer">' + (
        !st.otpSent
          ? '<button type="button" class="obw-primary-btn obw-primary-btn--compact" data-send-otp' + (st.sendingOtp ? ' disabled' : '') + '>' +
              bi(st.sendingOtp ? S.sendingOtp : S.sendOtp) + '</button>'
          : '<button class="obw-primary-btn obw-primary-btn--compact" data-confirm' + (st.submitting || !canConfirm ? ' disabled' : '') + '>' +
              bi(st.submitting ? S.booking : S.confirm) + '</button>'
      ) + '</div>';
      return '<div class="obw-confirm-step">' + header(bi(S.confirmTitle), true) +
        summaryHtml(st.day.date, st.time) + otpBox + footer + '</div>';
    }

    // SOURCE: SuccessStep.vue. The real svg carries no stroke attribute, so
    // in production the check mark is invisible and only the tinted circle
    // shows — an upstream bug; stroke="currentColor" here is the fix it
    // wants, not a divergence to preserve.
    function successHtml() {
      return '<div class="obw-success-step">' +
        '<div class="obw-success-mark" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
        '</div>' +
        title(bi(S.bookedTitle), 'obw-success-title') +
        summaryHtml(st.day.date, st.time) +
        // DEMO-ONLY exit — see S.restartDemo. Without it the last scene of the
        // scrollytelling flow has no controls at all and reads as a hang.
        '<div class="obw-success-actions">' +
          '<button type="button" class="obw-restart-btn" data-restart>' + bi(S.restartDemo) + '</button>' +
        '</div>' +
      '</div>';
    }

    // SOURCE: DateStep.vue — probingInitialMonth: on first landing (not on a
    // deliberate navigation) skip forward past leading empty months, so a
    // patient never opens on a dead calendar.
    function firstMonthWithSlots() {
      var offset = 0;
      while (offset < MAX_MONTH_OFFSET && !availabilityFor(offset).length) offset++;
      return offset;
    }

    // ---- event wiring ----
    function wire() {
      root.querySelectorAll('[data-card]').forEach(function (b) {
        b.addEventListener('click', function () {
          var card = CARDS[+b.getAttribute('data-card')];
          st.practitioner = card.practitioner;
          st.treatments = card.treatments;
          st.step = 'treatment';
          render();
        });
      });
      root.querySelectorAll('[data-treatment]').forEach(function (b) {
        b.addEventListener('click', function () {
          st.treatment = st.treatments[+b.getAttribute('data-treatment')];
          st.monthOffset = firstMonthWithSlots();
          st.step = 'date';
          render();
        });
      });
      var chatEntry = root.querySelector('[data-chat]');
      if (chatEntry) chatEntry.addEventListener('click', function () {
        if (!st.chat.length) st.chat = [{ role: 'agent', he: DEMO_CHAT.opening[0], en: DEMO_CHAT.opening[1] }];
        st.step = 'chat'; render();
      });
      var chatForm = root.querySelector('[data-chat-form]');
      if (chatForm) chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = chatForm.querySelector('[data-chat-input]');
        var text = input.value.trim();
        if (!text || st.chatPending) return;
        st.chat.push({ role: 'patient', he: text, en: text });
        st.chatPending = true; render();
        setTimeout(function () {
          var turn = st.chat.filter(function (m) { return m.role === 'patient'; }).length - 1;
          var reply = DEMO_CHAT.replies[Math.min(turn, DEMO_CHAT.replies.length - 1)];
          var vars = { time: DEMO_PREFILL.time };
          var filled = fill(reply, vars);
          st.chat.push({ role: 'agent', he: filled[0], en: filled[1], bookingLink: turn >= 1 });
          st.chatPending = false; render();
          var list = root.querySelector('.obw-chat-list');
          if (list) list.scrollTop = list.scrollHeight;
        }, 700);
      });
      var chatBook = root.querySelector('[data-chat-book]');
      if (chatBook) chatBook.addEventListener('click', function () {
        // SOURCE: App.vue applyBookingLink — the wizard opens on the time
        // step with the practitioner, treatment and slot already chosen.
        var card = CARDS[DEMO_PREFILL.cardIndex];
        st.practitioner = card.practitioner;
        st.treatments = card.treatments;
        st.treatment = card.treatments[DEMO_PREFILL.treatmentIndex];
        st.day = { date: DEMO_PREFILL.day.date, slots: DEMO_PREFILL.day.slots.filter(function (s) { return s.start === DEMO_PREFILL.time; }) };
        st.time = DEMO_PREFILL.time;
        st.step = 'time'; render();
      });
      var backEl = root.querySelector('[data-back]');
      if (backEl) backEl.addEventListener('click', function () {
        var prev = { treatment: 'practitioner', date: 'treatment', time: 'date', patient: 'time', confirm: 'patient', chat: 'practitioner' }[st.step];
        st.step = prev; render();
      });
      root.querySelectorAll('[data-month]').forEach(function (b) {
        b.addEventListener('click', function () {
          st.monthOffset = Math.min(MAX_MONTH_OFFSET, Math.max(0, st.monthOffset + Number(b.getAttribute('data-month'))));
          render();
        });
      });
      root.querySelectorAll('[data-obw-date]:not([disabled])').forEach(function (b) {
        b.addEventListener('click', function () {
          var key = b.getAttribute('data-obw-date');
          var day = st._days.filter(function (d) { return d.date === key; })[0];
          if (!day) return;
          st.day = day; st.step = 'time'; render();
        });
      });
      root.querySelectorAll('[data-time]').forEach(function (b) {
        b.addEventListener('click', function () { st.time = b.getAttribute('data-time'); st.step = 'patient'; render(); });
      });
      var pform = root.querySelector('[data-patient]');
      if (pform) {
        FIELDS.forEach(function (f) {
          var inp = pform.querySelector('[data-field="' + f.name + '"]');
          inp.addEventListener('input', function () { st[f.name] = inp.value; refreshField(f); });
          inp.addEventListener('blur', function () { st.touched[f.name] = true; refreshField(f); });
        });
        var consent = pform.querySelector('[data-field="consent"]');
        consent.addEventListener('change', function () { st.consent = consent.checked; });
        pform.addEventListener('submit', function (e) {
          e.preventDefault();
          FIELDS.forEach(function (f) { st.touched[f.name] = true; refreshField(f); });
          if (!FIELDS.every(fieldValid)) return;
          FIELDS.forEach(function (f) { st[f.name] = String(st[f.name]).trim(); });
          // SOURCE: App.vue submitPatient — only a genuinely new email resets
          // the code state; coming back with the same one must not re-demand
          // a code that was already sent.
          if (st.email !== st.confirmedEmail) { st.otpSent = false; st.otp = ''; }
          st.confirmedEmail = st.email;
          st.step = 'confirm'; render();
        });
      }
      var otp = root.querySelector('[data-otp]');
      if (otp) otp.addEventListener('input', function () {
        st.otp = otp.value.replace(/\D/g, '').slice(0, 6);
        otp.value = st.otp;
        var cb = root.querySelector('[data-confirm]');
        if (cb) cb.disabled = st.submitting || !/^\d{6}$/.test(st.otp);
      });
      var sendOtpBtn = root.querySelector('[data-send-otp]');
      if (sendOtpBtn) sendOtpBtn.addEventListener('click', function () {
        st.sendingOtp = true; render();
        setTimeout(function () {
          st.sendingOtp = false; st.otpSent = true; render(); startResend();
        }, 500);
      });
      var resend = root.querySelector('[data-resend]');
      if (resend) resend.addEventListener('click', function () { st.otp = ''; render(); startResend(); });
      var restartBtn = root.querySelector('[data-restart]');
      if (restartBtn) restartBtn.addEventListener('click', function () {
        reset();
        render();
        // Hand control back to whatever is hosting us. The pointerdown that
        // opened this click has already told scrolly.js the visitor took over,
        // and without this the scroll narrative would stay switched off and
        // the widget would sit on the first step doing nothing.
        root.dispatchEvent(new CustomEvent('orli:restart', { bubbles: true }));
      });
      var langBtn = root.querySelector('[data-lang]');
      if (langBtn) langBtn.addEventListener('click', function () {
        LANG = LANG === 'he' ? 'en' : 'he';
        render();
      });
      var confirm = root.querySelector('[data-confirm]');
      if (confirm) confirm.addEventListener('click', function () {
        if (!/^\d{6}$/.test(st.otp.trim())) return;
        st.submitting = true; render();
        setTimeout(function () {
          st.submitting = false;
          st.bookingId = DEMO_PREFILL.bookingId;
          clearInterval(timer);
          st.step = 'success'; render();
        }, 900);
      });
    }

    // Scroll-driven "scenes": jump the widget to a given step with all the
    // prior selections pre-made, so a scrollytelling section can walk it
    // through the whole booking flow without any clicks.
    // SOURCE: App.vue — the `?demo` postMessage handler (search DEMO_PREFILL
    // there). Same idea: jump to a step with every prior selection already
    // made. 'treatment' has no scene of its own: scene 0's copy narrates
    // picking a practitioner and a treatment as one beat, and the treatment
    // step is one click away from it. Keep the two in step when App.vue's
    // handler changes.
    function setScene(i) {
      reset();
      var order = ['practitioner', 'date', 'time', 'patient', 'confirm', 'success'];
      st.step = order[Math.max(0, Math.min(order.length - 1, i))];
      if (st.step !== 'practitioner') {
        var card = CARDS[DEMO_PREFILL.cardIndex];
        st.practitioner = card.practitioner;
        st.treatments = card.treatments;
        st.treatment = card.treatments[DEMO_PREFILL.treatmentIndex];
      }
      if (['time', 'patient', 'confirm', 'success'].indexOf(st.step) >= 0) {
        st.day = DEMO_PREFILL.day;
        st.time = DEMO_PREFILL.time;
      }
      if (['confirm', 'success'].indexOf(st.step) >= 0) {
        // The real demo handler only marks the code as sent; the scene here
        // also pre-fills it so the confirm button reads as live, not dimmed.
        st.otpSent = true; st.otp = '123456'; st.confirmedEmail = st.email;
      }
      if (st.step === 'success') st.bookingId = DEMO_PREFILL.bookingId;
      // Scroll and the numbered stepper drive this; neither may steal focus.
      hostDriven = true;
      try { render(); } finally { hostDriven = false; }
    }

    var handle = { setScene: setScene, render: render, onStep: null };
    render();
    return handle;
  }

  function mountOne(el) {
    if (el.__orli) return el.__orli;
    el.classList.add('orli-live');
    // [data-scrolly] makes the widget fill the pinned #demo card instead of
    // style.css's own 400x580 frame (see widget.css), and steps the heading
    // levels down to fit inside a page that already has an h1. A widget
    // embedded anywhere else renders exactly as the real one does.
    if (el.closest && el.closest('#demo')) el.setAttribute('data-scrolly', '');
    el.__orli = mount(el);
    return el.__orli;
  }

  function init() {
    [].slice.call(document.querySelectorAll('[data-orli-widget]')).forEach(mountOne);
    // No <html lang> observer: the site is Hebrew-only and nothing flips it.
    // The widget's own [data-lang] button is the only language control.
  }
  // For widgets created after load: scrolly.js builds the phone layout's
  // six step cards at runtime and mounts a widget into each.
  window.OrliWidget = { mount: mountOne };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
