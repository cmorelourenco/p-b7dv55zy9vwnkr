/* C-MORE — interactions
   - mobile nav
   - reveal-on-scroll (all breakpoints)
   - scroll choreography (desktop only, behind the same media query as the CSS)
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var seg = function (v, a, b) { return clamp((v - a) / (b - a), 0, 1); };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  /* ---------------------------------------------------------------- nav */
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav__toggle');
  var links = nav.querySelector('.nav__links');
  var tryToggle = document.getElementById('try-toggle');
  var tryPanel = document.getElementById('try-panel');
  var scrim = document.querySelector('.scrim');
  var lastFocus = null;

  function navOpen() { return nav.classList.contains('is-open'); }
  function tryOpen() { return nav.classList.contains('is-try-open'); }

  /* The links menu and the trial panel share one surface, so opening either
     closes the other. */
  function setNav(open) {
    if (open && tryOpen()) setTry(false);
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  function setTry(open) {
    if (!tryToggle) return;
    if (open && navOpen()) setNav(false);

    nav.classList.toggle('is-try-open', open);
    tryToggle.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.classList.toggle('is-on', open);
    /* `overflow:hidden` on the root rather than the body — the body version
       would propagate to the viewport and break every sticky section. */
    root.classList.toggle('is-locked', open);

    if (open) {
      lastFocus = document.activeElement;
      if (tryPanel) {
        tryPanel.setAttribute('tabindex', '-1');
        tryPanel.focus({ preventScroll: true });
      }
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }
  }

  toggle.addEventListener('click', function () { setNav(!navOpen()); });

  if (tryToggle) {
    tryToggle.addEventListener('click', function () { setTry(!tryOpen()); });
  }

  document.querySelectorAll('[data-try-open]').forEach(function (el) {
    el.addEventListener('click', function () { setTry(true); });
  });
  document.querySelectorAll('[data-try-close]').forEach(function (el) {
    el.addEventListener('click', function () { setTry(false); });
  });

  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (tryOpen()) setTry(false);
    else setNav(false);
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) setNav(false);
  });

  /* Declared before the observer below, which consults it from its callback. */
  var desktop = window.matchMedia('(min-width: 1024px) and (min-height: 620px) and (pointer: fine)');

  /* ------------------------------------------------------------ reveals */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reveals = document.querySelectorAll('.reveal');
  var bars = document.getElementById('bars');

  if ('IntersectionObserver' in window && !reduced.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        /* On desktop the bars sit in a fixed frame and are on screen from the
           first paint, so intersection means nothing — update() fills them once
           they have finished fading in instead. */
        if (entry.target === bars) {
          if (desktop.matches) return;
          bars.classList.add('is-on');
        }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { io.observe(el); });
    /* the bars fade with their section, but still fill on first sight */
    if (bars) io.observe(bars);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    if (bars) bars.classList.add('is-on');
  }

  /* -------------------------------------------- desktop choreography */
  var problem = document.getElementById('problem');
  var hero = document.querySelector('.hero');
  var spacer = document.querySelector('.hero__spacer');
  var whatPin = document.querySelector('.what-pin');
  var whatSec = document.querySelector('.what');
  var creationPin = document.querySelector('.creation-pin');
  var creation = document.querySelector('.creation');
  var cards = document.querySelector('.risk-cards');
  var dataset = document.querySelector('.dataset');
  var howPin = document.querySelector('.how-pin');
  var rail = document.querySelector('.rail');
  var steps = [].slice.call(document.querySelectorAll('[data-step]'));
  var openStep = 0;
  /* both in viewport heights: when the step sequence starts (just after the
     entrance finishes at 0.42) and how much scroll each step gets */
  var STEP_START = 0.36;
  var STEP_SPAN = 0.55;
  var STEP_GAP = 24;
  var STEP_SQUARE = 44;
  var cardH = 0;

  /* Place every step. Total height is constant whichever one is open, so the
     group stays optically centred and only --y changes. */
  function layoutSteps() {
    if (!rail || !steps.length) return;
    var total = cardH + (steps.length - 1) * (STEP_SQUARE + STEP_GAP);
    var y = Math.max(0, (rail.clientHeight - total) / 2);
    steps.forEach(function (el, i) {
      el.style.setProperty('--y', y.toFixed(1) + 'px');
      y += (i === openStep ? cardH : STEP_SQUARE) + STEP_GAP;
    });
  }

  /* Measure the tallest card and place everything, with transitions suppressed
     across the whole pass. Reading offsetHeight mid-pass forces a style commit,
     so without `no-anim` the steps would visibly animate back out of the
     measuring state afterwards. */
  function relayoutRail() {
    if (!desktop.matches || !rail || !steps.length) return;

    rail.classList.add('no-anim');
    rail.classList.add('is-measuring');

    var max = 0;
    steps.forEach(function (el) {
      /* each body keeps its own height — the cards share one outer height but
         their copy runs to different lengths */
      var body = el.querySelector('.step__body');
      if (body) el.style.setProperty('--body-h', body.offsetHeight + 'px');
      max = Math.max(max, el.offsetHeight);
    });

    rail.classList.remove('is-measuring');
    cardH = Math.ceil(max);
    rail.style.setProperty('--card-h', cardH + 'px');
    layoutSteps();

    void rail.offsetHeight;   // commit the restored values while still frozen
    rail.classList.remove('no-anim');
  }
  /* Types across several elements in sequence. Each part keeps its own markup
     and styling, which a single sliced string could not — textContent would
     flatten it. Captures the copy once, up front. */
  function makeTyper(els) {
    var texts = els.map(function (el) {
      return el.textContent.replace(/\s+/g, ' ').trim();
    });
    /* +1 per part for the break, so the pause between them costs a keystroke */
    var total = texts.reduce(function (n, str) { return n + str.length + 1; }, -1);

    return function (t) {
      var n = Math.round(t * total);
      var used = 0;
      els.forEach(function (el, i) {
        var str = texts[i];
        var out = str.slice(0, clamp(n - used, 0, str.length));
        if (el.textContent !== out) el.textContent = out;
        used += str.length + 1;
      });
    };
  }

  var quoteWrap = document.querySelector('.what__quote');
  var quote = document.querySelector('[data-quote]');
  var typeQuote = makeTyper(
    quote ? [].slice.call(quote.querySelectorAll('.quote__line')) : []);
  var typeStatement = makeTyper(
    [].slice.call(document.querySelectorAll('[data-statement-line]')));

  var vars = ['--blur-q', '--problem-in', '--what-top',
              '--what-bottom', '--what-fade', '--what-out', '--quote-in', '--learn-in',
              '--creation-in', '--merge-cards', '--merge-grow', '--merge-fill',
              '--merge-text', '--merge-settle', '--wipe-offset', '--dataset-h', '--creation-exit', '--dataset-close', '--how-in'];

  function reset() {
    vars.forEach(function (name) { root.style.removeProperty(name); });
    if (problem) problem.classList.remove('is-live');
    if (hero) hero.classList.remove('is-faded');
    if (quoteWrap) quoteWrap.classList.remove('is-gone');
    typeQuote(1);
    typeStatement(1);
    /* unpinned breakpoints render every step as an open card regardless, but
       keep the class state honest */
    steps.forEach(function (el, i) {
      el.classList.toggle('is-open', i === 0);
      el.style.removeProperty('--y');
      el.style.removeProperty('--body-h');
    });
    openStep = 0;
    if (rail) rail.style.removeProperty('--card-h');
  }

  var ticking = false;

  function update() {
    ticking = false;
    if (!desktop.matches) return;

    var vh = window.innerHeight;

    /* Hero hands over to section 2 across the hero spacer. Section 2 is fixed
       in place, so its progress comes from the scroll position, not its rect. */
    if (problem && spacer) {
      var sp = clamp(window.pageYOffset / Math.max(1, spacer.offsetHeight), 0, 1);
      /* Strictly sequential: the backdrop finishes settling at sp 0.45, and
         only then (0.48) do the section's elements begin to arrive. */
      var blurQ = ease(seg(sp, 0, 0.45));
      var pIn = ease(seg(sp, 0.48, 1));

      root.style.setProperty('--blur-q', blurQ.toFixed(3));
      root.style.setProperty('--problem-in', pIn.toFixed(3));
      problem.classList.toggle('is-live', pIn > 0.5);
      if (hero) hero.classList.toggle('is-faded', blurQ > 0.4);

      /* The last element to arrive is the bar block: --d 0.28 over a 1/3-wide
         ramp, so it reaches full opacity at pIn 0.613. Only then do the bars
         fill. Hysteresis either side of the threshold keeps them from
         flickering when the user hovers around that scroll position. */
      if (bars) {
        if (pIn >= 0.62) bars.classList.add('is-on');
        else if (pIn < 0.45) bars.classList.remove('is-on');
      }
    }

    /* "What C-MORE is" — content fades out, quote types in */
    if (whatPin) {
      var wr = whatPin.getBoundingClientRect();

      /* The navy band spans exactly where the panel's box would have been, as
         clip insets rather than a moving element. Top edge follows the pin in;
         bottom edge follows it out. */
      root.style.setProperty('--what-top',
        (clamp(wr.top / vh, 0, 1) * 100).toFixed(2) + '%');
      root.style.setProperty('--what-bottom',
        (clamp(1 - wr.bottom / vh, 0, 1) * 100).toFixed(2) + '%');
      var wq = clamp(-wr.top / Math.max(1, wr.height - vh), 0, 1);

      root.style.setProperty('--what-fade', ease(seg(wq, 0.08, 0.28)).toFixed(3));
      root.style.setProperty('--quote-in', ease(seg(wq, 0.28, 0.38)).toFixed(3));
      root.style.setProperty('--learn-in', seg(wq, 0.84, 0.95).toFixed(3));

      /* Exit: the quote fades as the next section climbs into frame. The navy
         panel behind it keeps sliding away on its own. */
      if (creationPin && quoteWrap) {
        var mt = creationPin.getBoundingClientRect().top;
        /* Measured against how much of the screen the beige section has taken.
           It finishes at 0.35 — while that edge is still below the quote — so
           the text is gone before the two ever meet. */
        var out = ease(seg(1 - mt / vh, 0, 0.35));
        root.style.setProperty('--what-out', out.toFixed(3));
        quoteWrap.classList.toggle('is-gone', out > 0.9);
      }

      typeQuote(seg(wq, 0.32, 0.8));
    }

    /* Category creation — cards merge, green wipe, statement, dataset */
    if (creationPin) {
      var cr = creationPin.getBoundingClientRect();
      var p = clamp(-cr.top / Math.max(1, cr.height - vh), 0, 1);

      /* The sequence runs on q, which reaches 1 with TAIL of the pin still to
         go — that remainder is dead scroll holding the finished composition on
         screen before the section releases. Raise TAIL for a longer hold; the
         pin height above absorbs it so the animation itself keeps its pace. */
      var TAIL = 0.25;
      var q = clamp(p / (1 - TAIL), 0, 1);

      /* Measured in pixels past the moment the beige panel locks (negative
         while it is still arriving). The entrance opens a little before the
         lock — by then the panel already covers everything below ~0.18vh, so
         the content is over beige throughout — and runs half a viewport, which
         is roughly twice as long as it used to take. */
      var d = -cr.top;
      root.style.setProperty('--creation-in',
        ease(seg(d, -0.18 * vh, 0.32 * vh)).toFixed(3));

      /* The entrance finishes around p 0.11; the wipe holds off until 0.22 so
         the composed section gets a beat to be read before anything moves. */
      root.style.setProperty('--merge-grow', ease(seg(q, 0.22, 0.34)).toFixed(3));
      root.style.setProperty('--merge-cards', ease(seg(q, 0.30, 0.56)).toFixed(3));
      root.style.setProperty('--merge-fill', ease(seg(q, 0.46, 0.62)).toFixed(3));
      /* The box fades in first, then types into it — linear, so the keystrokes
         land at an even rate — and finishes just before the settle begins. */
      root.style.setProperty('--merge-text', ease(seg(q, 0.54, 0.58)).toFixed(3));

      typeStatement(seg(q, 0.58, 0.72));
      var settle = ease(seg(q, 0.73, 0.90));
      root.style.setProperty('--merge-settle', settle.toFixed(3));

      /* Exit. Once the pin releases, the beige panel scrolls away as normal but
         the group is counter-translated to stay put, and the dataset closes
         back toward its own centre. The title is left on screen until the next
         section climbs over it — it never slides off under its own steam. */
      if (creation) {
        var exitPx = clamp(-creation.getBoundingClientRect().top, 0, vh);
        root.style.setProperty('--creation-exit', exitPx.toFixed(1) + 'px');
        root.style.setProperty('--dataset-close',
          (1 - ease(seg(exitPx / vh, 0, 0.5))).toFixed(3));
      }

      /* the slot is clipped, so the dataset keeps its natural height here */
      if (dataset) {
        root.style.setProperty('--dataset-h', dataset.offsetHeight + 'px');
      }

      /* anchor the green wipe on the gap between the two card rows, so it
         starts there rather than at the middle of the frame */
      if (cards && creation) {
        var cRect = cards.getBoundingClientRect();
        var fRect = creation.getBoundingClientRect();
        var offset = (cRect.top + cRect.height / 2) - (fRect.top + fRect.height / 2);
        root.style.setProperty('--wipe-offset', offset.toFixed(1) + 'px');
      }
    }

    /* "How it works" — pixels past the moment the navy panel locks. Strictly
       sequential: the ramp starts at 0, so nothing appears until the panel has
       stopped, and every element fades where it already sits. */
    if (howPin) {
      var hd = -howPin.getBoundingClientRect().top;
      root.style.setProperty('--how-in',
        ease(seg(hd, 0, 0.42 * vh)).toFixed(3));

      /* Step 1 is open on arrival and holds through the entrance; each
         subsequent beat of STEP_SPAN promotes the next one, so exactly one is
         ever open. The pin is long enough to land all four before it releases. */
      if (steps.length) {
        var idx = clamp(
          Math.floor((hd - STEP_START * vh) / (STEP_SPAN * vh)), 0, steps.length - 1);
        if (idx !== openStep) {
          steps[openStep].classList.remove('is-open');
          steps[idx].classList.add('is-open');
          openStep = idx;
          layoutSteps();
        }
      }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  function sync() {
    if (desktop.matches) {
      window.addEventListener('scroll', onScroll, { passive: true });
      relayoutRail();
      onScroll();
    } else {
      window.removeEventListener('scroll', onScroll);
      reset();
    }
  }

  /* Web fonts change the cards' natural height, so re-measure once they land */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(relayoutRail);
  }

  if (desktop.addEventListener) desktop.addEventListener('change', sync);
  else desktop.addListener(sync);

  window.addEventListener('resize', function () { sync(); onScroll(); }, { passive: true });
  window.addEventListener('orientationchange', function () { sync(); onScroll(); });

  sync();
})();
