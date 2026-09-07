/* ============================================================
   TaPasCity — inventory site
   Theme toggle · scroll progress · reveal · counters · bars · nav
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  var SUN =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.2M12 20.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.5 12h2.2M20.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>';
  var MOON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  var toggle = document.querySelector('[data-theme-toggle]');
  var mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  function paint() {
    root.setAttribute('data-theme', mode);
    if (!toggle) return;
    toggle.innerHTML = mode === 'dark' ? SUN : MOON;
    toggle.setAttribute(
      'aria-label',
      'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode'
    );
  }
  paint();
  if (toggle) {
    toggle.addEventListener('click', function () {
      mode = mode === 'dark' ? 'light' : 'dark';
      paint();
    });
  }

  /* ---------- scroll progress + header state ---------- */
  var bar = document.getElementById('progress');
  var header = document.getElementById('header');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (header) header.classList.toggle('header--scrolled', y > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- counters ---------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    if (reduce) {
      el.textContent = target.toLocaleString('en-GB');
      return;
    }
    var dur = 1200;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-GB');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- bars ---------- */
  function runBars(list) {
    var max = parseFloat(list.getAttribute('data-max')) || 1;
    var fills = list.querySelectorAll('.bars__fill');
    Array.prototype.forEach.call(fills, function (f, i) {
      var v = parseFloat(f.getAttribute('data-val')) || 0;
      var pct = Math.max(1.5, (v / max) * 100);
      if (reduce) {
        f.style.width = pct + '%';
      } else {
        setTimeout(function () {
          f.style.width = pct + '%';
        }, 60 * i);
      }
    });
  }

  /* ---------- observers ---------- */
  var seen = new WeakSet();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting || seen.has(e.target)) return;
          seen.add(e.target);
          var el = e.target;
          if (el.classList.contains('reveal')) el.classList.add('is-in');
          if (el.hasAttribute('data-count')) runCounter(el);
          if (el.hasAttribute('data-bars')) runBars(el);
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 }
    );

    document
      .querySelectorAll('.reveal, [data-count], [data-bars]')
      .forEach(function (el) {
        io.observe(el);
      });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-in');
    });
    document.querySelectorAll('[data-count]').forEach(runCounter);
    document.querySelectorAll('[data-bars]').forEach(runBars);
  }

  /* ---------- active nav link ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links
    .map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && targets.length) {
    var navIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) {
            a.setAttribute(
              'aria-current',
              a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'
            );
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    targets.forEach(function (t) {
      navIo.observe(t);
    });
  }
})();

/* ---------------- Lightbox for gallery images ---------------- */
(function () {
  var lb = document.getElementById('lb');
  if (!lb) return;
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbClose = document.getElementById('lbClose');
  var lastFocus = null;

  function open(btn) {
    var img = btn.querySelector('img');
    if (!img) return;
    lastFocus = btn;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    var cap = btn.getAttribute('data-cap') || '';
    var fig = btn.closest('figure');
    var title = fig && fig.querySelector('figcaption b');
    lbCap.innerHTML = (title ? '<b>' + title.textContent + '</b>' : '') + cap;
    lb.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close() {
    lb.removeAttribute('data-open');
    lbImg.src = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('button.shot').forEach(function (btn) {
    btn.addEventListener('click', function () {
      open(btn);
    });
  });
  lbClose.addEventListener('click', close);
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb__inner')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.getAttribute('data-open') === 'true') close();
  });
})();
