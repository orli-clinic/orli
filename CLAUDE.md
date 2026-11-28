# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketing site for **Orli**, ready-made AI and clinic-management solutions for
clinics running the legacy **Optima** scheduling system (AI on the phone, AI on the
website, online booking, messages and forms, and the admin around them). Plain static HTML/CSS/JS — no build step, no package
manager, no dependencies, no tests — plus one small Cloudflare Worker (`worker.js`)
for the demo form and Cal.com webhook.

Ten pages, all sharing the same header/footer shell and `styles.css`:

- **`index.html`** — the story, written for the clinic owner/office manager
  deciding whether to adopt Orli. Since 2026-11-27 it leads with Orli as a set
  of solutions on one Optima calendar, not with booking alone, and borrows its
  order from Hormozi's sales pages (acquisition.com), with few words and the
  pictures doing the telling (2026-11-28: "too literal, too much text"): hero
  (a short line, the trial's terms under the button, and a reel: one card
  plays the chat, the booking widget, a call and a form, folding each into
  its tile, and ends on one calendar day; `hero-reel.js`), everything in one calendar view
  (`#one-calendar`: call, chat, website and form streaming into one day of the
  calendar), one sentence on the teal plate (`#pain`), the four
  solutions (`#solutions`: AI בטלפון leads in the dark with
  the sample call, then AI באתר, קביעת פגישות, הודעות וטפסים, each a card
  linking to its page; old `/features#phone|agent|booking|automations` links
  land on these cards), the admin from anywhere (`#anywhere`: a doctor on a
  sales call was most taken by seeing and changing her calendar from anywhere;
  a phone that works, `phone.js`: lock screen, home screen with Orli among
  the phone's apps, the admin inside with its real phone bar and appointment
  actions, the patient's texts, and a call Orli answers that plays the sample
  call and lands in the calendar; labels from the admin's `i18n.ts` and
  `shellNav.ts`, made-up numbers only under "דוגמה"),
  three steps onto Optima (`#how`), the testimonial, the offer
  (`#offer`: the risk off the table, priced by the number of doctors), the FAQ and the
  closing band. Prices wait for the offer; no invented numbers, no scarcity.
  The FAQ and its JSON-LD were generated from one list; keep them word for word.
- **The solution pages** — `phone.html` (AI בטלפון, the call film and its
  sample call), `chat.html` (AI באתר, the chat film), `booking.html` (קביעת
  פגישות: the home page's booking hero, journey film and six-step demo as
  they were until 2026-11-27, one screen each, kept as one flow on purpose; then the six-step demo with the live widget, the embed,
  the outage film; it loads `widget.css`, `widget.js` and `scrolly.js`) and
  `forms.html` (הודעות וטפסים: a form a patient signs and the reminder SMS,
  both drawn from the product's own strings, and the follow-up film). Each is a
  head with the price line (the lowest step, "מ־X ₪ לחודש לפי מספר הרופאים"), the film(s), what changes at the clinic, the other
  three solutions, and the closing band. The films are `films.js` +
  `films.css` (`[data-film="call|chat|remind|outage"]`); the booking film is
  `[data-bridge]`, driven by `script.js`. They replaced `features.html`, which
  `_redirects` (and the LAN preview's Caddyfile) send to `/`.
- **`pricing.html`** — the four solutions and all four together, priced by the
  number of doctors in the clinic (2026-11-28): a tab bar (רופא אחד, 2–3, 4–6,
  7 ומעלה, with a counter past six) switches every card's price, and a price
  list under the cards gives every step without script. Booking 450 / 800 /
  1,300 and +200 a doctor beyond six; Messaging 350 / 600 / 1,000 / +150 with
  400 / 1,100 / 2,200 / +370 texts; AI on the website 400 / 500 / 600 / +100; Phone
  600 / 1,000 / 1,600 / +250 with 300 / 700 / 1,400 / +225 minutes; all four
  1,560 / 2,440 / 3,760 and a custom quote beyond six (never computed). The
  cards, the list and the comparison are generated together; `script.js`
  "price by doctors" holds the rule. Prices are written `X ₪ לחודש` with **no
  מע״מ**: clinics pay through Paddle, the merchant of record, which adds no
  Israeli VAT, so the figure shown is the figure charged. The same figures must
  be in `orli-calendar/api/packages/booking/billing.py` (`LIST_PRICES_ILS`,
  still the old flat 550/750/950/2,100 on 2026-11-28) and in Paddle.
  `כל ארבעת הפתרונות, וגם:` for the bundle delta.
  The offer is a 14-day trial from the day the clinic finishes setup with its
  calendar connected, with no payment details and nothing charged when it ends
  (`TRIAL_DAYS` in the same `billing.py`). The copy calls it
  `תקופת ניסיון של 14 יום`, with no `בחינם`, and names that day as it is, never
  `עולה לאוויר`. `terms.html` states its rules, and the app's `TERMS_VERSION`
  (`booking/terms.py`) names that page's version line.
- **`terms.html`** and **`refund.html`** — the terms, and the refund policy Paddle's
  domain review requires (a full refund within 14 days of any charge, requested at
  paddle.net or from us). Both name Paddle as reseller and Merchant of Record with
  Paddle's own English sentence; keep it word for word. The seller is named "אורלי" /
  Orli; when the company is registered, its exact legal name (and, in `privacy.html`,
  its registered address) must match the Paddle account.
- **`integration.html`** — customization (branding presets, email content, all done
  through the clinic's own admin panel, no code) plus the embed snippet and
  scope/security/Optima-sync facts. Linked from primary nav (`התאמה אישית`) since the
  branding content is decision-maker-relevant, not just for whoever handles the embed.
  Keep technical claims here verified against `orli-calendar`'s actual code, not
  aspirational — see `PRODUCT.md` for why this page exists and what it must not claim.
- **`panel.html`** — a walkthrough of the clinic admin, answering the objection an
  owner actually holds: opening the calendar to patients does not mean losing control
  of it. Ten rows, one per admin screen, ordered most impressive first (סוכן
  AI, טלפון, יומן, אוטומציות, נתונים, התראות, then the rest; clinic settings and
  in-app support were taken off on 2026-11-28 as not worth a row). Each row is a text column
  (step number, title, two bullets) beside a **static mock** of `orli-calendar/admin`
  drawn inside the admin's own shell (topbar with bell and account circle, the
  sidebar in its two groups with its icons, the open screen marked); text and mock
  trade sides on every row, each column slides in from its side the first time the
  row is seen, and the mock then **loops a demo** while on screen: a cursor presses
  a control and the screen answers (`panel-rows.js` + `panel-rows.css`; the mock
  pieces are `panel.css`, scoped under `.orli-panel`). The loops are CSS keyframes
  named by class (`a-show-28` = rises in at 28% of the loop), **generated** by
  `tools/gen-panel-rows-css.py` into the bottom of `panel-rows.css` — edit the
  script and rerun it, never the generated part. Every mock rests on its finished
  screen, so no JS, reduced motion and the a11y menu's motion off all show it done.
  The mocks are `role="img"` pictures: not selectable, not clickable. Every label,
  the sidebar grouping and the icons are copied from the real admin's `i18n.ts` and
  `AppShell.vue` (v1.7.0: יומן, סוכן AI, נתונים וביצועים, מטפלים ושירותים,
  אוטומציות ומעקב, עיצוב קביעת פגישה, תבניות אימייל, then הגדרות and עזרה ותמיכה
  from the account menu, which open without the sidebar) — refresh them against
  those, don't invent screens or labels. Made-up numbers appear only with the
  admin's own "דוגמה" mark. The screens new in v1.7.0 carry a "חדש" tag
  (`.prow-new`); drop it once they are old news.
- **`about.html`** — mission/principles only. Orli has exactly one real customer
  (`PRODUCT.md`), so there is no team, funding, or customer-count content here to write
  yet — don't invent any.
- **`privacy.html`** — a structural **draft**, explicitly marked as such on the page
  (`noindex`, a visible banner, and `[להשלמה משפטית]` placeholders). Built around the
  disclosure categories Israel's Protection of Privacy Law Amendment 13 (effective
  2025-08-14) requires, but several fields (legal basis, retention period, DPO
  requirement) need real legal review, not more guessing — appointment/treatment-type
  data tied to an identified patient likely qualifies as "sensitive information" under
  that law, which is a live open question for Orli itself, not just for clinic
  customers. Don't fill in the placeholders without an actual legal decision.
- **`404.html`** — not one of the five: `worker.js` serves it, with status 404, for
  any path that matches no file. It renders at whatever path was typed, so every
  URL in it is root-absolute; a relative `styles.css` would resolve against a
  directory that doesn't exist. Linked from nowhere, `noindex`.

All the pages are footer-linked to each other (the footer's פתרונות column
lists the four solutions). Primary nav: `ראשי`, `הפתרונות` (a menu of the four
solution pages: opens on hover or focus on a computer, sits indented in the
phone menu), `מסך הניהול` (panel.html), `חבילות` (pricing.html) and `אודות`
(about.html), plus the CTA. The integration reference and the FAQ are reached
from the page flow and the footer, not the nav.

## Related project

This is the landing page for **`orli-calendar`** (sibling repo, checked out
alongside this one), the actual booking product (FastAPI + Vue widget). Keep
the two aligned when shipping features:

- `widget.js` here is a hand-maintained vanilla-JS mirror of the real Vue widget at
  `orli-calendar/widget/src/App.vue` + its step components — when the real widget's
  booking flow, steps, or copy change, update this mock to match.
- Bilingual strings in `widget.js`'s `S` table mirror `orli-calendar/widget/src/i18n.ts`.
- If a feature changes what the product can actually do (new booking capability,
  changed flow, new provider), check whether this landing page's marketing copy,
  demo widget, or FAQ need updating too, and vice versa — check whether
  landing-page promises (features, screenshots, copy) still hold after backend/widget
  changes in `orli-calendar`.

## Running locally

```bash
python -m http.server 8899
# then open http://localhost:8899/
```

`file://` also works. Heebo is self-hosted (`assets/fonts/`, two variable woff2
subsets from Google Fonts v28, OFL licence beside them, `@font-face` at the top
of `styles.css`, preloaded in every page's head): no page may link Google Fonts,
because `privacy.html` says the font is served from the site itself.

There is no lint, build, or test command — verify changes by loading the page in a
browser.

## Architecture

Independent, self-contained scripts, each owning one concern. `index.html`
loads `script.js`, `hero-gradient.js`, `films.js` (for the sample call),
`hero-reel.js` and `phone.js`. `hero-gradient.js` lifts its canvas to a fixed
background behind the whole page (`html.bg-flow`) that drifts with scrolling.
Page switches are cross-document view transitions plus speculation-rules
prerender; never give the fixed background a `view-transition-name`: named
layers paint above the page, so the switch showed only the background.
`booking.html` adds `widget.js` and `scrolly.js` for the demo; `panel.html`
loads `script.js` and its own `panel-rows.js`.
They talk to the DOM, not to each other directly (with one exception: `scrolly.js`
drives `widget.js` through a controller handle):

- **`script.js`** — misc page glue: footer year, the contact form — name, email,
  message, in a `<dialog>` opened from the CTA band and the footer link (validated
  client-side, then posted to `worker.js`'s `/api/demo`), the Cal.com popup button
  (gated on `CAL_LINK`), scroll-reveal via `IntersectionObserver`, the FAQ
  accordion, and on phones the hero's widget picture scaled to fit whole under
  the copy (down to 60%; on a phone shorter than that the picture steps aside).
- **`worker.js`** — the one piece of backend: a Cloudflare Worker behind the static
  assets (`wrangler.jsonc`) with two routes, the contact form and Cal.com's booking
  webhook, both posting into Slack's `#website-contact`. Secrets and setup are in
  `README.md`. Listed in `.assetsignore` so it is never served as a file.
- **`widget.js`** — the live interactive booking widget shown in the "See it in
  action" section. A faithful vanilla-JS reproduction of the real Vue widget
  (`orli-calendar/widget/src/App.vue` + step components) driven by in-browser mock data
  (`CARDS`), with no backend: practitioner → treatment → date → time → patient details → OTP confirm
  (any 6 digits works) → success. The widget itself is bilingual (Hebrew/English toggle
  in its own UI) with strings in its own `S` table, mirroring `widget/src/i18n.ts` from
  the real app — this is a property of the widget product, not of the marketing site
  around it. It mounts onto any `[data-orli-widget]` element, exposing a controller on
  `el.__orli` with `setScene(i)` and `render()`. Scoped entirely under `.orli-live` in
  `widget.css` so it never leaks into the marketing site's own styles.
- **`scrolly.js`** — drives the "See it in action" section. On wide screens the
  widget is pinned while numbered `.scrolly-step` elements scroll past, and it
  calls `mountEl.__orli.setScene(i)` to advance the widget to the matching
  booking state (read from the page's own geometry on every scroll, at a
  reading line 35% down the screen, and again once the snap settles: an
  `IntersectionObserver` missed steps that a snap crossed in one frame; the
  visitor's own clicks inside the widget bring the page to the matching step,
  and scrolling keeps driving afterwards). Below 921px the same mechanism
  runs in one screen: the widget and a short list of all six steps above it
  are pinned under the nav, the step list becomes invisible scroll distance,
  and every step change opens the current step's text in that list and ticks
  the ones passed (`setCaption`); tapping a step jumps to it. The list has
  one fixed height (`--cap-h`) so the widget never moves. The widget card is
  drawn for 580×400px, which a phone lacks room for, so `fitFrame` zooms the
  whole card (CSS `zoom`) until its tallest step fits the frame with nothing
  scrolling inside it; a swipe over the widget then always moves the page. `widget.js` also exposes
  `window.OrliWidget.mount()` for widgets created after load.
- **`hero-gradient.js`** — dependency-free vanilla-WebGL animated gradient (simplex
  noise, GLSL inline as JS strings) for the hero `<canvas id="heroGradient">`. Falls
  back to a static CSS gradient (`.hero--nogl` class) when WebGL is unavailable, and
  freezes on `prefers-reduced-motion`.
- **`films.js` / `films.css`** — the self-playing films on the solution pages
  (agent chat, reminder, analytics, outage). Each is one 640×420 frame that plays
  while mostly on screen, holds, replays, and clears when scrolled away; under
  reduced motion or the accessibility menu's motion off it shows its finished
  frame once (`orli:motion-still` / `orli:motion-go`, like the journey film in
  `script.js`). A film is a list of timed beats that only add classes; the look is
  all in `films.css`. Without JS the frames show the full conversation / tiles.
  The call film (`phone.html`) also plays a sample call aloud from its own button:
  `assets/audio/sample-call.mp3`, a scripted reenactment voiced by Telnyx Ultra text to speech
  (Orli in "Talia", the phone agent's own voice; the caller "Gil"),.
  The film's `PICK` / `STARTS` / `TEXT` / `BOOK` are the line start times of that recording, so
  a new recording comes with new times and the film's lines rewritten to its words. The home page's
  phone card (`[data-call-play]`) plays the same file. Names in it stay neutral (no Cohen, no Mizrahi).
- **`a11y.js` / `a11y.css`** — the accessibility menu every page carries: a
  floating button opening a panel with text size and spacing, three colour
  modes (light, dark, greyscale), highlighted links and headings, a plain
  typeface, a large cursor, loud keyboard focus, motion off and read-aloud
  (Web Speech). Choices are classes on `<html>` kept in `localStorage`, and
  `a11y.js` is loaded in `<head>` so they apply before the first paint.
  Deliberately ours rather than a hosted overlay (patient contact details on
  these pages, and an overlay cannot be audited). Motion off is broadcast as
  `orli:motion-still` / `orli:motion-go`, which `hero-gradient.js` and the
  bridge film in `script.js` listen for.
- **`styles.css`** — all styling: theme tokens (light/dark) and responsive layout.
- **`widget.css`** — styling for the live widget only, scoped under `.orli-live`.

## Conventions worth knowing

- **Design rules: read `DESIGN.md` before styling anything.** Above all:
  flat surfaces separated by the hairline, no drop shadows on cards, mocks
  or demos. Ron keeps having to ask for shadows to be removed.
- No build tooling: files are loaded as plain `<script>` tags directly by
  `index.html`, in dependency order (scrolly/widget wire together via `__orli`, etc.) —
  keep that order if you add or reorder scripts.
- Scripts wrap themselves in an IIFE (`(function () { 'use strict'; ... })()`) rather
  than using ES modules.
- Every cache-busting query string (`styles.css?v=…`, `script.js?v=…`, the wordmark)
  carries the **same** token on every page (`?v=20261127a` today). Bump them all
  together with one search-and-replace when any asset changes; a per-file counter
  drifted across pages and left stale copies in caches. The token is load-bearing:
  `_headers` caches every `.css` and `.js` for a year as `immutable`, so a CSS or
  JS file linked without it, or changed without a bump, stays stale in browsers.
  Images under `assets/brand/` and `/favicon.ico` are cached for a week; fonts
  under `assets/fonts/` for a year (a new copy gets a new file name). HTML keeps
  Cloudflare's default, revalidated on every view.
- On desktop (≥921px wide, ≥700px tall, no reduced motion) `index.html` snaps one
  section per screen, and each section scrolls inside itself if it outgrows the
  screen: every `main > section` and the footer carry `data-lock-stop="start"`,
  the demo's steps `data-lock-stop="center"`; a new top-level section needs the
  attribute or it will not be a stop. Phones (≤920px) snap the same stops,
  but nothing snaps there at all: the sections are each one screen tall, so
  scrolling lands on them without the page pulling against the finger. Mandatory snapping had to land on a stop, so a small
  drag was answered with a screen of teleport, worst at the demo's last step,
  where the pinned widget vanished in a single frame. The demo's own steps are
  scroll distance on a phone, not stops. Every home section is sized to fit one
  phone screen (the
  "One screen per section" block in `styles.css`): the hero's feed card
  scales to the room under the copy (script.js; below 60% it steps aside), the
  FAQ rows drop their topic tags,
  the footer's links sit in two columns, and a short-phone tier (≤740px tall)
  tightens type, shrinks the bridge film and drops the comparison's cell labels.
  The hero's buttons are hidden on phones; the nav CTA covers them.
- Page-level layout lives in `styles.css` modifiers (`.page-head`, `.display--page`,
  `.display--sub`, `.section--tail`, `.section-lead--intro`, `.code-inline`, …), not in
  `style=""` attributes. The only inline styles left are the colour swatches on
  `integration.html` and `panel.html`, which are data, not layout.
- The marketing site itself is Hebrew-only (`<html lang="he" dir="rtl">`), no runtime
  language switch — copy lives directly in `index.html`, no i18n table to keep in sync.
  The live booking widget (`widget.js`) is a separate case: it has its own
  Hebrew/English toggle mirroring the real product, kept in its own `S` table.
- `assets/brand/` holds logo/wordmark source + exported PNGs (including a Hebrew
  wordmark variant). Deploys go through `wrangler.jsonc`: Cloudflare Workers with
  static assets, `worker.js` as the fallthrough for paths with no file behind them.
- Cloudflare serves every page without its extension: `/panel.html` answers
  with a 307 to `/panel`, and only `/panel` returns a 200. Canonicals,
  `og:url`, `sitemap.xml`, `llms.txt` and the JSON-LD all use the extensionless
  address (the home page is `/`); internal links may keep `.html`.
- Search and answer engines read `robots.txt` (allows every crawler, AI ones
  included; only `/api/` is kept out), `sitemap.xml`, `llms.txt` / `llms-full.txt`
  (English and Hebrew fact sheets) and one `application/ld+json` block in each
  public page's head. `_headers` gives the `.txt`/`.xml` files a UTF-8 charset.
  When a page is added, or copy changes what the product is said to do, update
  them together: the sitemap entry and its `lastmod`, the llms files, and the
  JSON-LD. The FAQ in `index.html`'s JSON-LD must match the visible FAQ word for
  word, and the offers in `pricing.html`'s must match the visible prices. Facts
  in these files follow the same rule as the copy: shipped only.
