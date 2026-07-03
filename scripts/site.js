/* ============================================================
   ATV 25 — Interaction Engine
   NOTE ON THEME PERSISTENCE:
   This artifact keeps the chosen theme in memory only.
   When you self-host, you can persist it by swapping the two
   marked lines below for localStorage.getItem/setItem('atv-theme').
   ============================================================ */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!reduced) doc.style.scrollBehavior = 'smooth';

  /* ---------------- Theme toggle (in-memory) ---------------- */
  var theme = 'dark'; // self-host: localStorage.getItem('atv-theme') || 'dark'
  var starColor = '#F5A800';

  function readStarColor() {
    var c = getComputedStyle(doc).getPropertyValue('--gold').trim();
    if (c) starColor = c;
  }
  function applyTheme(t) {
    theme = t;
    doc.setAttribute('data-theme', t);
    // self-host: localStorage.setItem('atv-theme', t)
    readStarColor();
  }
  readStarColor();

  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------------- Preloader ---------------- */
  var loader = document.getElementById('loader');
  var introDone = false;
  function finishLoad() {
    if (introDone) return;
    introDone = true;
    if (loader) loader.classList.add('done');
    heroIntro();
  }
  window.addEventListener('load', finishLoad);
  document.addEventListener('DOMContentLoaded', function () { setTimeout(finishLoad, 300); });
  setTimeout(finishLoad, 1200); // hard failsafe — never trap the page behind the loader

  /* ---------------- Scroll: progress / nav / toTop ---------------- */
  var progress = document.getElementById('progress');
  var nav = document.getElementById('nav');
  var toTop = document.getElementById('toTop');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || doc.scrollTop;
      var max = doc.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
      if (nav) nav.classList.toggle('scrolled', y > 24);
      if (toTop) toTop.classList.toggle('show', y > 640);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- Scrollspy ---------------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));
  var spyMap = {};
  spyLinks.forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    var sec = document.getElementById(id);
    if (sec) spyMap[id] = a;
  });
  if ('IntersectionObserver' in window && Object.keys(spyMap).length) {
    var spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          spyLinks.forEach(function (a) { a.classList.remove('active'); });
          var link = spyMap[en.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-38% 0px -55% 0px' });
    Object.keys(spyMap).forEach(function (id) {
      spyObs.observe(document.getElementById(id));
    });
  }

  /* ---------------- Mobile menu ---------------- */
  var burger = document.getElementById('burger');
  var mMenu = document.getElementById('mMenu');
  function setMenu(open) {
    if (!burger || !mMenu) return;
    burger.classList.toggle('open', open);
    mMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && mMenu) {
    burger.addEventListener('click', function () {
      setMenu(!mMenu.classList.contains('open'));
    });
    mMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------------- Custom cursor ---------------- */
  var dot = document.getElementById('cursorDot');
  var halo = document.getElementById('cursorHalo');
  if (finePointer && !reduced && dot && halo) {
    var mx = innerWidth / 2, my = innerHeight / 2, hx = mx, hy = my;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    }, { passive: true });
    (function haloLoop() {
      hx += (mx - hx) * 0.16;
      hy += (my - hy) * 0.16;
      halo.style.left = hx + 'px';
      halo.style.top = hy + 'px';
      requestAnimationFrame(haloLoop);
    })();
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a, button, [data-tilt]');
      halo.classList.toggle('is-hover', !!t);
    });
  }

  /* ---------------- Starfield canvas ---------------- */
  var canvas = document.getElementById('stars');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var lite = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    var stars = [];
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5);
    var pmx = -9999, pmy = -9999;
    var running = true, heroVisible = true;

    function sizeCanvas() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    }
    function seed() {
      var n = lite ? Math.min(46, Math.floor((W * H) / 16000)) : Math.min(110, Math.floor((W * H) / 12000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.7 + 0.5,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          tw: Math.random() * Math.PI * 2
        });
      }
    }
    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = starColor;
      stars.forEach(function (s) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var i, j, s;
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        s.x += s.vx; s.y += s.vy; s.tw += 0.03;
        if (s.x < -10) s.x = W + 10; if (s.x > W + 10) s.x = -10;
        if (s.y < -10) s.y = H + 10; if (s.y > H + 10) s.y = -10;
        var dx = s.x - pmx, dy = s.y - pmy;
        var d2 = dx * dx + dy * dy;
        if (d2 < 16900 && d2 > 1) { // gentle repel within 130px
          var d = Math.sqrt(d2);
          s.x += (dx / d) * 0.6;
          s.y += (dy / d) * 0.6;
        }
        ctx.globalAlpha = 0.35 + Math.abs(Math.sin(s.tw)) * 0.55;
        ctx.fillStyle = starColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!lite) { // constellation lines are desktop-only (O(n²) is too heavy for phones)
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = starColor;
        ctx.lineWidth = 1;
        for (i = 0; i < stars.length; i++) {
          for (j = i + 1; j < stars.length; j++) {
            var ax = stars[i].x - stars[j].x, ay = stars[i].y - stars[j].y;
            var dd = ax * ax + ay * ay;
            if (dd < 12100) { // link within 110px
              ctx.beginPath();
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
              ctx.stroke();
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    if (reduced) {
      drawStatic();
    } else {
      canvas.parentElement.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        pmx = e.clientX - r.left; pmy = e.clientY - r.top;
      }, { passive: true });
      canvas.parentElement.addEventListener('mouseleave', function () {
        pmx = -9999; pmy = -9999;
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          heroVisible = en[0].isIntersecting;
          running = heroVisible && !document.hidden;
        }).observe(canvas);
      }
      document.addEventListener('visibilitychange', function () {
        running = heroVisible && !document.hidden;
      });
      (function loop() { // draw only when the hero is on screen & tab is active
        if (running) frame();
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ---------------- Count-up stats ---------------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cObs.unobserve(en.target);
        var el = en.target;
        var end = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = parseInt(el.textContent, 10) || 0;
        if (reduced) { el.textContent = end; return; }
        var t0 = null, dur = 1600;
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(start + (end - start) * e);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* ---------------- 3D tilt cards ---------------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var rAF = null;
      card.addEventListener('pointermove', function (e) {
        if (rAF) return;
        rAF = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', (px * 100) + '%');
          card.style.setProperty('--my', (py * 100) + '%');
          card.style.transform =
            'perspective(900px) rotateX(' + ((0.5 - py) * 8).toFixed(2) + 'deg)' +
            ' rotateY(' + ((px - 0.5) * 10).toFixed(2) + 'deg) translateY(-4px)';
          rAF = null;
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.28 + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transition = 'transform .5s cubic-bezier(.2,.9,.25,1.4)';
        btn.style.transform = '';
        setTimeout(function () { btn.style.transition = ''; }, 500);
      });
    });
  }

  /* ---------------- Footer year ---------------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ================================================================
     GSAP layer — runs after deferred CDN scripts. Everything below
     is progressive enhancement: content is fully visible without it.
     ================================================================ */
  var heroIntro = function () {}; // replaced below when GSAP is ready

  function initGSAP() {
    if (reduced || typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

    /* --- hero: split headline into characters --- */
    var rows = document.querySelectorAll('[data-split]:not(.shimmer)'); // never split the gradient row — splitting breaks background-clip and makes it unreadable
    rows.forEach(function (row) {
      var text = row.textContent;
      row.textContent = '';
      row.style.display = 'inline-block';
      for (var i = 0; i < text.length; i++) {
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.style.display = 'inline-block';
        ch.style.willChange = 'transform';
        ch.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        row.appendChild(ch);
      }
    });

    heroIntro = function () {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('#heroTitle .ch', {
        yPercent: 115,
        rotate: 6,
        opacity: 0,
        duration: 0.9,
        stagger: 0.028
      });
      tl.from('#heroTitle .shimmer', {
        y: 46,
        opacity: 0,
        duration: 0.9
      }, '-=0.7');
      tl.from('[data-hero-fade]', {
        y: 26,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12
      }, '-=0.45');
    };
    // If the page already finished loading before GSAP initialised, fire now.
    if (introDone) heroIntro();

    if (typeof ScrollTrigger === 'undefined') return;

    /* --- generic reveals --- */
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var isGroup = el.getAttribute('data-reveal') === 'group';
      var targets = isGroup ? el.children : el;
      gsap.from(targets, {
        y: 26,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        stagger: isGroup ? 0.1 : 0,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* --- timeline: spine draw + node check-off --- */
    var tl = document.getElementById('tl');
    var tlProg = document.getElementById('tlProgress');
    if (tl && tlProg) {
      gsap.fromTo(tlProg, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: tl,
          start: 'top 72%',
          end: 'bottom 55%',
          scrub: 0.4
        }
      });
      tl.querySelectorAll('.tl-item').forEach(function (item) {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 62%',
          onEnter: function () { item.classList.add('done'); },
          onLeaveBack: function () { item.classList.remove('done'); }
        });
      });
    }

    /* --- decorative parallax --- */
    document.querySelectorAll('[data-speed]').forEach(function (el) {
      var spd = parseFloat(el.getAttribute('data-speed')) || 0;
      gsap.to(el, {
        y: spd * 12,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGSAP);
  } else {
    initGSAP();
  }
})();
