/* ============================================================
   CALAJÒ HAIR STYLIST — main.js
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce-motion');

  /* ---------- INTRO ---------- */
  (function intro () {
    var el = document.getElementById('intro');
    if (!el || reduce) { root.classList.add('intro-done'); return; }
    var done = false;
    function finish () {
      if (done) return; done = true;
      root.classList.add('intro-done');
      window.removeEventListener('scroll', finish);
      window.removeEventListener('keydown', finish);
      el.removeEventListener('click', finish);
    }
    // auto-dismiss after the bloom + mark settle
    setTimeout(finish, 2500);
    window.addEventListener('scroll', finish, { passive: true });
    window.addEventListener('keydown', finish);
    el.addEventListener('click', finish);
  })();

  /* ---------- HEADER scroll state ---------- */
  var head = document.querySelector('.site-head');
  function onScroll () {
    if (window.scrollY > 12) head.classList.add('scrolled');
    else head.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- MOBILE NAV ---------- */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mobile-nav');
  function openNav () {
    mnav.hidden = false;
    requestAnimationFrame(function () { mnav.classList.add('open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Chiudi menu');
    document.body.classList.add('nav-open');
  }
  function closeNav () {
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Apri menu');
    document.body.classList.remove('nav-open');
    setTimeout(function () { if (!mnav.classList.contains('open')) mnav.hidden = true; }, 420);
    burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') closeNav(); else openNav();
    });
    mnav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && burger.getAttribute('aria-expanded') === 'true') closeNav();
    });
  }

  /* ---------- REVEALS + watchdog ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll () { reveals.forEach(function (r) { r.classList.add('is-visible'); }); }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (r) { io.observe(r); });
    // watchdog: if IO never fires, reveal everything
    var fired = false;
    var probe = new IntersectionObserver(function () { fired = true; probe.disconnect(); });
    probe.observe(document.body);
    setTimeout(function () { if (!fired) showAll(); }, 1500);
  }

  /* ---------- DYNAMIC HOURS (Europe/Rome) ---------- */
  var HOURS = { 0: null, 1: null, 2: [570, 1080], 3: [570, 1080], 4: [660, 1170], 5: [570, 1080], 6: [570, 1020] };
  // minutes from midnight; Tue-Wed 9:30-18, Thu 11-19:30, Fri 9:30-18, Sat 9:30-17

  function romeNow () {
    try {
      var s = new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' });
      return new Date(s);
    } catch (e) { return new Date(); }
  }
  function fmt (mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  }
  function updateHours (lang) {
    var now = romeNow();
    var day = now.getDay();
    var cur = now.getHours() * 60 + now.getMinutes();
    var box = document.getElementById('hours-now');
    var label = document.getElementById('hours-status');
    if (!box || !label) return;
    var t = I18N_HOURS[lang] || I18N_HOURS.it;
    var open = false, msg = '';
    var today = HOURS[day];
    if (today && cur >= today[0] && cur < today[1]) {
      open = true;
      msg = t.openUntil.replace('{t}', fmt(today[1]));
    } else {
      // find next opening day
      var found = null, offset = 0;
      for (var i = 0; i <= 7; i++) {
        var d = (day + i) % 7;
        var h = HOURS[d];
        if (h) {
          if (i === 0 && cur < h[0]) { found = { d: d, t: h[0], same: true }; offset = 0; break; }
          if (i > 0) { found = { d: d, t: h[0], same: false }; offset = i; break; }
        }
      }
      if (found) {
        var dayName = found.same ? t.today : (offset === 1 ? t.tomorrow : t.days[found.d]);
        msg = t.closedOpens.replace('{day}', dayName).replace('{t}', fmt(found.t));
      } else {
        msg = t.closed;
      }
    }
    box.classList.toggle('is-open', open);
    box.classList.toggle('is-closed', !open);
    label.textContent = msg;
    // highlight today's row
    document.querySelectorAll('.hours__table tr').forEach(function (tr) {
      tr.classList.toggle('today', parseInt(tr.getAttribute('data-day'), 10) === day);
    });
  }

  var I18N_HOURS = {
    it: {
      openUntil: 'Aperto ora · chiude alle {t}',
      closedOpens: 'Chiuso · apre {day} alle {t}',
      closed: 'Chiuso',
      today: 'oggi', tomorrow: 'domani',
      days: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
    },
    en: {
      openUntil: 'Open now · closes at {t}',
      closedOpens: 'Closed · opens {day} at {t}',
      closed: 'Closed',
      today: 'today', tomorrow: 'tomorrow',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  };

  /* ---------- I18N (EN overlay; IT is the DOM default) ---------- */
  var EN = {
    'nav.salon': 'The salon', 'nav.services': 'Services', 'nav.work': 'Our work',
    'nav.about': 'Marinella', 'nav.where': 'Find us', 'nav.reviews': 'Reviews', 'nav.faq': 'FAQ',
    'cta.book': 'Book', 'cta.bookOnline': 'Book online', 'cta.whatsapp': 'Message us on WhatsApp', 'cta.call': '02 89151590',

    'hero.eyebrow': 'Hair Stylist · Lookmaker · Navigli, Milan',
    'hero.t1': 'Your image,', 'hero.t2': 'in full light.',
    'hero.lead': 'A total-white salon overlooking the Naviglio Grande. Cut, colour and image consulting: caring for your hair and for you, with light and measure.',
    'hero.m1': '76 reviews · Treatwell', 'hero.m2': 'Google reviews', 'hero.m3': 'steps from Romolo',
    'hero.chip': 'Colour &amp; light', 'hero.scroll': 'Enter',

    'salon.kicker': 'The salon',
    'salon.t1': 'Total white,', 'salon.t2': 'a touch of lavender.',
    'salon.p1': 'Large, bright and elegant spaces designed for your relaxation. At Calajò the team gives you all the attention you deserve and takes every wish into account, for a flawless result — from the first consultation to the final blow-dry.',
    'salon.a1': '3 independent stations', 'salon.a2': '2 wash areas', 'salon.a3': 'Manicure &amp; pedicure corner',
    'salon.a4': 'Air conditioning', 'salon.a5': 'Ambient music', 'salon.a6': 'Wi-Fi',

    'svc.kicker': 'Services &amp; price list',
    'svc.t1': 'Every gesture,', 'svc.t2': 'made to measure.',
    'svc.lead': 'Real prices from the Calajò list. Choose your service and book in a tap.',
    'svc.cat1': 'Cut, blow-dry &amp; form', 'svc.cat2': 'Colour', 'svc.cat3': 'Hair treatments',
    'svc.i1': 'Blow-dry', 'svc.i2': "Women's cut", 'svc.i3': 'Cut &amp; blow-dry', 'svc.i4': 'Fringe trim',
    'svc.i5': 'Perm', 'svc.i6': "Men's cut", 'svc.i7': "Kids' cut (up to 12)",
    'svc.c1': 'Gloss / toner', 'svc.c2': 'Root colour', 'svc.c3': '10-minute express colour',
    'svc.c4': 'Highlights with spatula', 'svc.c5': 'Modern balayage', 'svc.c6': 'Foil mèches', 'svc.c7': 'Colour removal',
    'svc.t3a': 'Collagen', 'svc.t3b': 'Restructuring + blow-dry', 'svc.t3c': 'Nubeà detox gommage + blow-dry',
    'svc.t3d': 'Anti-frizz', 'svc.t3e': 'Hair Spa with massage + blow-dry',
    'svc.from': 'from € 20', 'svc.from2': 'from € 40', 'svc.from3': 'from € 50', 'svc.from4': 'from € 65',
    'svc.from5': 'from € 40', 'svc.from6': 'from € 30', 'svc.from7': 'from € 60',
    'svc.extra': 'On request also <strong>bridal service</strong>, <strong>Great Lengths extensions</strong>, <strong>make-up</strong> and <strong>image consulting</strong>.',
    'svc.book': 'Book your service',
    'svc.fine': 'Prices as listed on Treatwell; “from €” = starting rate depending on length and technique.',

    'work.kicker': 'Our work', 'work.t1': 'Colour, movement,', 'work.t2': 'light.',
    'work.note': 'Real photos of the salon’s work (source: Calajò’s Treatwell profile).',

    'about.kicker': 'The lookmaker',
    'about.t1': 'Marinella,', 'about.t2': 'not just hair.',
    'about.p1': 'Hair stylist, image consultant and make-up artist: Marinella works on the whole person, not just the cut. She reads the face, the colour, the style — and builds a look that suits you every day, not only on wash day.',
    'about.p2': 'A tailored care that has also taken her backstage at events and on the red carpet, and that in the salon becomes concrete advice: the right products, gestures you can repeat at home, results that last.',
    'about.q': '“Lovely staff, stunning styling… the owner is brilliant at cutting and so kind. Highly recommended.”',

    'src.google': 'Google', 'src.tw': 'Treatwell',

    'rev.kicker': 'Reviews', 'rev.t1': 'In the words', 'rev.t2': 'of our clients.',
    'rev.tw': '76 reviews on Treatwell', 'rev.gg': 'reviews on Google',
    'rev.1': '“Kind, punctual, precise. Delighted with my new cut, the anti-frizz treatment and the advice on caring for my hair.”',
    'rev.2': '“Perfect as always. Cut and colour exactly as I wanted.”',
    'rev.3': '“Professional and friendly. Great products and… the best Collagen in town! Warm, bright atmosphere.”',
    'rev.4': '“Marinella always perfect! Highly recommended.”',
    'rev.5': '“I took my mum to Marinella: very professional, super organised and brilliant. Highly recommended.”',
    'rev.6': '“Booked same day. Happy to work around my times so I could use my lunch break.”',
    'rev.note': 'Real, verified reviews, quoted verbatim from Treatwell and Google.',

    'book.kicker': 'Book', 'book.t1': 'Your next look', 'book.t2': 'is waiting.',
    'book.lead': 'Book online 24/7 on Treatwell, or drop us a message: we’ll reply ourselves.',

    'where.kicker': 'Find us', 'where.t1': 'On the Navigli,', 'where.t2': 'total white.',
    'where.zone': 'Navigli district', 'where.metro': 'Steps from Romolo and Porta Genova (M2)',
    'where.checking': 'Checking hours…', 'where.closed': 'Closed',

    'day.mon': 'Monday', 'day.tue': 'Tuesday', 'day.wed': 'Wednesday', 'day.thu': 'Thursday',
    'day.fri': 'Friday', 'day.sat': 'Saturday', 'day.sun': 'Sunday',

    'foot.tag': 'Hair stylist &amp; lookmaker — Navigli, Milan',
    'foot.visit': 'Come and see us', 'foot.contact': 'Contact', 'foot.follow': 'Follow &amp; book',
    'foot.demo': 'Demo website by Bespoke Studio · public data (Treatwell, Google). Photos © Calajò Hair Stylist.',
    'foot.up': 'Back to top ↑',

    'bar.call': 'Call', 'bar.wa': 'WhatsApp', 'bar.book': 'Book',

    'faq.kicker': 'FAQ', 'faq.t1': 'The answers,', 'faq.t2': 'before you even ask.',
    'faq.q1': 'How do I book an appointment at Calajò?',
    'faq.a1': 'You can book online 24/7 on Treatwell, or message us on WhatsApp at +39 329 073 4380 or call 02 89151590 during opening hours.',
    'faq.q2': 'Where is the salon and how do I get there?',
    'faq.a2': 'We are at Via Lodovico il Moro 3, on the Navigli (20143 Milan), steps from the Romolo and Porta Genova stops on the M2 line.',
    'faq.q3': 'What are your opening hours?',
    'faq.a3': 'Tuesday, Wednesday and Friday 9:30–18:00, Thursday 11:00–19:30, Saturday 9:30–17:00. Closed on Monday and Sunday.',
    'faq.q4': 'Do you do colour, balayage and highlights?',
    'faq.a4': 'Yes: from gloss to root colour, spatula highlights, modern balayage, foil mèches and colour removal. Real prices are in the list; “from €” rates vary with length and technique.',
    'faq.q5': 'Do you cut men and children too?',
    'faq.a5': 'Yes. Men’s cut €24 and kids’ cut (up to 12) €18.',
    'faq.q6': 'Beyond hair, what else do you offer?',
    'faq.a6': 'Marinella is also an image consultant and make-up artist: alongside cut and colour you’ll find make-up, image consulting and a manicure &amp; pedicure corner.',
    'faq.q7': 'Do you offer a bridal service?',
    'faq.a7': 'Yes, on request — together with Great Lengths extensions and make-up. Message us on WhatsApp for a tailored quote.'
  };

  var i18nEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  i18nEls.forEach(function (el) { el.dataset.it = el.innerHTML; });
  var lang = 'it';
  function setLang (l) {
    lang = l;
    i18nEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (l === 'en' && EN[key] != null) el.innerHTML = EN[key];
      else el.innerHTML = el.dataset.it;
    });
    root.setAttribute('lang', l);
    var btn = document.getElementById('lang');
    if (btn) {
      btn.querySelector('.lang__it').classList.toggle('is-on', l === 'it');
      btn.querySelector('.lang__en').classList.toggle('is-on', l === 'en');
    }
    updateHours(l);
  }
  var langBtn = document.getElementById('lang');
  if (langBtn) langBtn.addEventListener('click', function () { setLang(lang === 'it' ? 'en' : 'it'); });

  updateHours('it');
  setInterval(function () { updateHours(lang); }, 60000);

  /* ---------- LIGHTBOX ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var triggers = Array.prototype.slice.call(document.querySelectorAll('.ph'));
  var idx = 0, lastFocus = null;
  function openLb (i) {
    idx = (i + triggers.length) % triggers.length;
    var src = triggers[idx].getAttribute('data-full');
    var alt = triggers[idx].querySelector('img').getAttribute('alt');
    lbImg.setAttribute('src', src);
    lbImg.setAttribute('alt', alt);
    lb.hidden = false;
    document.body.classList.add('lb-open');
    lastFocus = document.activeElement;
    document.getElementById('lb-close').focus();
  }
  function closeLb () {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  }
  triggers.forEach(function (t, i) { t.addEventListener('click', function () { openLb(i); }); });
  if (lb) {
    document.getElementById('lb-close').addEventListener('click', closeLb);
    document.getElementById('lb-next').addEventListener('click', function () { openLb(idx + 1); });
    document.getElementById('lb-prev').addEventListener('click', function () { openLb(idx - 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') openLb(idx + 1);
      else if (e.key === 'ArrowLeft') openLb(idx - 1);
    });
  }

  /* ---------- Footer year is static; nothing else needed ---------- */
})();
