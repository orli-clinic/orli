# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Clinic decision-makers** — owners and office managers at clinics running the
legacy Optima scheduling system. They land here evaluating whether to add
online booking, already living with the pain the copy names directly: patients
who can only book by phone or in person, a secretary keying every appointment
into Optima by hand, and requests piling up after hours. They read in Hebrew
(primary) and decide whether to request a demo — they are not booking an
appointment for themselves here. `index.html` is written for this reader:
story only, no code, no implementation detail.

**The decision-maker's web person or IT contact** — a secondary audience, reached
only once the decision-maker hands them a link, not by browsing the site
themselves. `integration.html` exists for them: the embed snippet and
surface-level facts about scope, data handling, and the Optima sync, verified
against `orli-calendar`'s real code rather than written speculatively. It is
deliberately not promoted in primary nav — a technical reference isn't part of
the persuasion story, it's a follow-up once the decision-maker is already sold.

## Product Purpose

This site is the marketing front door for **Orli**: ready-made solutions that
plug into a clinic's existing Optima calendar and take the manual work around it
off the staff. Since 2026-11-27 the site leads with the whole set, not with
booking alone (Ron: booking is one of many solutions; the main message is that
Orli fits whatever the clinic needs and already offers plug-and-play solutions
that sit on Optima). Four solutions, each sold on its own or together
(`pricing.html`): **AI בטלפון** (answers the clinic's calls and books),
**AI באתר** (answers patients from the clinic's own information),
**קביעת פגישות** (online booking straight into Optima) and **הודעות וטפסים**
(forms and health statements signed on the phone, SMS reminders, follow-ups).
Each is priced by the number of doctors in the clinic (2026-11-28). Around them, in every
plan: the admin, which works on a phone as well as a computer, so the calendar
is seen and changed from anywhere. Orli is growing into the system a clinic
is run from (more is planned, e.g. prescriptions), but the site says only what
is shipped.

The site has two jobs: make the value felt (the clinic answers every call,
fills the calendar after hours, has patients arrive with forms signed and come
back on time) and convert a decision-maker into a signup or a conversation.
The CTA band (`#contact`) offers two ways in: starting the trial, and WhatsApp
for whoever would rather talk first.

### How the home page sells (2026-11-27)

Borrowed from Hormozi's sales pages (acquisition.com), adapted to clinics:
the reader's own symptoms first, then the turn ("not six problems: one kind of
manual work"); a countable mechanism ("four solutions, one calendar"); the
trial's terms right under the hero button and again as the offer (nothing charged at the end, monthly, a full refund within 14 days of
any charge); proof after the offer; the price after the value; one CTA,
repeated. Not borrowed: invented numbers, testimonials or scarcity. Orli has
none to show, and the rule below stands.

## Operating Context

- This site **is** orliclinic.com, the product's live landing page — its own
  design tokens in `styles.css` are the source of truth, not a copy of an
  external reference. `orli-calendar`'s PRODUCT.md treats this site's tokens
  as binding for the whole product; changes here are upstream of that, not
  downstream.
- The only backend is `worker.js`, a Cloudflare Worker with two routes: the
  contact form (`#demoForm`, a `<dialog>` on `index.html` opened from the CTA
  band and the footer link, posted by `script.js`) and Cal.com's booking
  webhook, both forwarded into Slack's `#website-contact`. See `README.md` for
  the secrets it needs. The Worker also serves `404.html` for any path with
  no file behind it.
- Every page loads one third party, Cal.com's embed script, which receives the
  visitor's IP, user agent and referring page on every view. The typeface
  (Heebo) is served from the site itself since 2026-10-18, no longer from
  Google Fonts. `privacy.html` discloses both facts; no surface may claim the
  site has "no tracking" without accounting for Cal.com.
- `panel.html` shows the other half of the product: a static mock of the clinic
  admin, walked through in nine screens in the admin's own order (calendar, AI
  agent, analytics, practitioners and services, automations, widget design, email
  templates, settings, support). It exists because the site otherwise only ever
  shows the patient's side, and the owner's real question is whether opening the
  calendar costs her control of it. The mock mirrors `orli-calendar/admin`'s own
  labels and navigation (v1.7.0); nothing on it is marked "בקרוב" any more, because
  nothing it shows is unshipped.
- The "See it in action" section (`#demo`, driven by `scrolly.js`) shows a
  static, backend-less replica of the real product's booking widget so a
  visitor can follow the flow without a real clinic or calendar behind it.
  It briefly embedded the live service by iframe
  (`https://booking.orliclinic.com/?demo=true`); that was replaced because the
  landing page must not depend on a deployed service being reachable. The
  replica is derived from `orli-calendar/widget/src/`, and each part carries a
  source-path comment naming the file it mirrors, so refreshing it against the
  real widget is a lookup rather than an investigation.
- **Hebrew-only, permanently.** A whole-site language toggle (`site-i18n.js`
  plus `data-i18n` attributes) was built and then deliberately removed in
  commit `4d07431`, where it was found to be dead code the page never loaded.
  Do not reintroduce one. The booking widget's own Hebrew/English toggle is a
  property of that product, not of this site.

## Capabilities and Constraints

- Static HTML/CSS/JS, no build step, no framework, no dependencies (see
  `CLAUDE.md` for the script architecture).
- The widget demo walks the real product's flow (practitioner → treatment → date → time →
  patient → OTP confirm, any 6 digits works → success) against local mock
  data; it must keep faithfully mirroring the real widget's flow, steps, and
  copy as that product evolves — see this repo's and `orli-calendar`'s
  CLAUDE.md "Related project" sections.
- The contact form asks for name, email and message only. It deliberately does
  **not** ask for the clinic's name (decided 2026-09-07). **Undecided:** whether
  the confirmation promises a response time; until decided it promises none.
- The hero's widget picture (`.orli-live` in `index.html`, `aria-hidden`) is
  **decoration only**. It is not held to the real widget's appearance and may
  diverge freely; only the `#demo` replica carries the fidelity constraint.
- The roadmap section is gone (2026-10-13): the AI agent, the automations and the
  analytics page shipped in `orli-calendar` v1.7.0 (`orli-outreach/product/features.md`
  is the inventory), so the home page now shows eight capability cards instead, each a
  link to `features.html` or the admin / customisation pages. Still load-bearing: say
  only what is shipped. Not built, so never promised: SMS or WhatsApp, a day-before
  reminder, payments, intake forms, patient accounts, multi-location clinics.

## Tone toward Optima

**Optima is a partner, not a foil.** A tie-up is plausible, so no surface may
argue Orli's value by naming something Optima lacks — no "was never opened to
patients", no "without the obstacles", no "must you replace it?". The framing
is additive: Optima runs the clinic and its calendar; Orli extends that same
calendar to the clinic's website as an extra channel. The pain the copy names
belongs to the **phone-and-transcription workflow**, which is fair game, never
to Optima's product.

**Status (confirmed 2026-09-07): in talks, nothing signed.** Until that changes,
no surface may state or imply an approval, a partnership, or that Orli is
"built on" Optima's platform — the footer names no relationship at all
(Ron dropped "עובד עם אופטימה" on 2026-09-08). Revisit this section the day
something is signed.

## Brand Commitments

- Name: **Orli** (אורלי), positioned against the legacy system **Optima**
  (אופטימה) by name throughout the copy.
- Warm editorial palette (cream canvas, teal `#0f8a86` identity, dark-green ink,
  Heebo, pill buttons, 18px radius) per `styles.css` and `orli-calendar`'s
  PRODUCT.md — this site is that palette's origin, so changes here are brand
  decisions, not local styling choices.
- Wordmark assets (including a dedicated Hebrew variant) live in
  `assets/brand/`.

## Evidence on Hand

- **Verner Clinic** is the product's only real customer (per `orli-calendar`'s
  PRODUCT.md); the site names no clinic customers and shows no testimonials,
  logos, or usage metrics.
- **Absent — do not fabricate:** customer count beyond one, testimonials,
  logos, or usage/performance metrics. Reconfirmed 2026-09-07: still
  one customer, still not nameable.
- **Pricing is set by Ron, not invented:** three monthly plans on
  `pricing.html`, by what sits on the clinic's site — Booking ₪299 (the
  booking button), AI agent ₪399 (the chat: answers and callbacks, never
  books), Full ₪599 (both, and the agent books). Reminders, sequences and
  the matching analytics are in every package. Change the numbers only on
  his word. orli-calendar knows `booking`, `chat` and `full`
  plans; every clinic is on `full` for the launch, so nothing is gated yet.

## Product Principles

1. **The pitch is the set on one calendar.** Every section should trace back to
   "ready-made solutions that plug into the Optima calendar you already run":
   the one claim a generic scheduling or AI-receptionist SaaS can't truthfully
   make. Each solution is sold by its outcome, not its feature list.
2. **Nothing changes for staff.** The recurring reassurance across hero, FAQ,
   and comparison ("nothing to replace," "the secretary keeps working in
   Optima exactly as today") is the primary objection this page exists to
   defuse — don't let new copy contradict it.
3. **Show, don't just tell.** The widget demo carries more persuasive weight
   than the copy around it; keeping it faithful to the real product is a
   marketing requirement, not just a documentation nicety. Faithful never
   means live, though — the demo must still work with the booking service
   unreachable.
4. **Say only what's shipped.** Roadmap items are explicitly labeled "coming
   soon" and never presented as available today, matching the real product's
   own "say only what is true" principle.
5. **Hebrew-only, RTL-native.** The audience reads Hebrew; the site is written
   and laid out in Hebrew RTL with no translation layer. English appears only
   inside the booking widget's own toggle.

## Accessibility & Inclusion

No product-specific conformance standard has been established. Absent one,
hold to WCAG AA contrast and keyboard operability as the working floor,
matching `orli-calendar`'s stated floor for the product itself.
