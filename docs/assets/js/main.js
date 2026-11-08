/* =========================================================================
   AZYRON CLIENT — front-end behaviour
   Zero dependencies. Everything below is progressive and motion-safe.
   ========================================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var raf = window.requestAnimationFrame.bind(window);

  /* ---------------------------------------------------------------------
     1. LOADING SCREEN
     ------------------------------------------------------------------ */
  var Loader = (function () {
    var el = $('#loader');
    var fill = $('#loaderFill');
    var pctEl = $('#loaderPct');
    var statusEl = $('#loaderStatus');
    if (!el) return { done: function () {} };

    var started = performance.now();
    var loaded = false;
    var finished = false;
    var progress = 0;
    var MIN_TIME = reduceMotion ? 150 : 1750;
    var phases = [
      { at: 0, label: 'BOOTING CORE' },
      { at: 26, label: 'LOADING MODULES' },
      { at: 52, label: 'OPTIMIZING FRAMES' },
      { at: 76, label: 'SYNCING HUD' },
      { at: 94, label: 'READY TO LAUNCH' }
    ];

    window.addEventListener('load', function () { loaded = true; });
    // safety: never hold the page hostage longer than 6s
    setTimeout(function () { loaded = true; }, 6000);

    function paint() {
      fill.style.width = progress.toFixed(1) + '%';
      pctEl.textContent = (progress < 10 ? '0' : '') + Math.round(progress) + '%';
      for (var i = phases.length - 1; i >= 0; i--) {
        if (progress >= phases[i].at) { statusEl.textContent = phases[i].label; break; }
      }
    }

    function tick() {
      if (finished) return;
      var elapsed = performance.now() - started;
      var timeRatio = clamp(elapsed / MIN_TIME, 0, 1);
      var target;
      if (elapsed < MIN_TIME) {
        target = 10 + timeRatio * 84;            // creep to 94% while booting
      } else {
        target = loaded ? 100 : 95;              // only finish once loaded
      }
      progress = lerp(progress, target, 0.13);
      if (progress > 99.5) progress = 100;
      paint();
      if (progress >= 100) {
        setTimeout(finish, reduceMotion ? 60 : 300);
        return;
      }
      raf(tick);
    }

    function finish() {
      if (finished) return;
      finished = true;
      el.classList.add('is-done');
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      // kick the hero reveal once the curtain is gone
      setTimeout(function () {
        el.setAttribute('aria-hidden', 'true');
        el.style.display = 'none';
      }, reduceMotion ? 100 : 800);
      document.dispatchEvent(new CustomEvent('azyron:ready'));
    }

    // Skip / emergency exit
    el.addEventListener('click', function () {
      loaded = true;
      if (progress < 100) { progress = 100; paint(); finish(); }
    });

    paint();
    raf(tick);
    return { done: finish };
  })();

  /* ---------------------------------------------------------------------
     2. GLOWING PARTICLE FIELD
     ------------------------------------------------------------------ */
  (function particles() {
    var canvas = $('#particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var items = [];
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    var running = true;
    var t = 0;

    // pre-rendered glow sprites (fast)
    function sprite(rgb) {
      var c = doc.createElement('canvas');
      var s = 96;
      c.width = c.height = s;
      var g = c.getContext('2d');
      var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, 'rgba(' + rgb + ',1)');
      grad.addColorStop(0.28, 'rgba(' + rgb + ',.55)');
      grad.addColorStop(0.6, 'rgba(' + rgb + ',.12)');
      grad.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    }
    var sprites = {
      purple: sprite('168,85,247'),
      violet: sprite('124,58,237'),
      silver: sprite('214,218,232')
    };

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var count = clamp(Math.round(w / 22), 18, 64);
      items = [];
      for (var i = 0; i < count; i++) {
        var depth = Math.random();
        items.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (depth < 0.6 ? 1.2 : 3.2) + Math.random() * (depth < 0.6 ? 2 : 9),
          vy: -(0.08 + Math.random() * 0.34) * (0.5 + depth),
          vx: (Math.random() - 0.5) * 0.16,
          alpha: 0.12 + Math.random() * 0.55,
          depth: depth,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.78 ? 'silver' : (Math.random() > 0.5 ? 'purple' : 'violet'),
          twinkle: 0.4 + Math.random() * 1.6
        });
      }
    }

    function frame() {
      if (!running) return;
      t += 0.016;
      mouse.x = lerp(mouse.x, mouse.tx, 0.045);
      mouse.y = lerp(mouse.y, mouse.ty, 0.045);
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 0.6 + p.phase) * 0.18 * p.depth;
        if (p.y < -40) { p.y = h + 30; p.x = Math.random() * w; }
        if (p.x < -40) p.x = w + 30;
        if (p.x > w + 40) p.x = -30;

        var px = p.x + (mouse.x - 0.5) * 46 * p.depth;
        var py = p.y + (mouse.y - 0.5) * 30 * p.depth;
        var tw = 0.65 + Math.sin(t * p.twinkle + p.phase) * 0.35;
        var size = p.r * 4;
        ctx.globalAlpha = p.alpha * tw;
        ctx.drawImage(sprites[p.color], px - size / 2, py - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      raf(frame);
    }

    window.addEventListener('resize', function () {
      clearTimeout(canvas._rt);
      canvas._rt = setTimeout(resize, 180);
    }, { passive: true });
    window.addEventListener('pointermove', function (e) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }, { passive: true });
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) { running = false; }
      else if (!running) { running = true; raf(frame); }
    });

    resize();
    if (reduceMotion) {
      // one static frame, no motion
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var s = p.r * 4;
        ctx.globalAlpha = p.alpha * 0.8;
        ctx.drawImage(sprites[p.color], p.x - s / 2, p.y - s / 2, s, s);
      }
    } else {
      raf(frame);
    }
  })();

  /* ---------------------------------------------------------------------
     3. CURSOR GLOW
     ------------------------------------------------------------------ */
  (function cursor() {
    var el = $('#cursor');
    if (!el || !finePointer || reduceMotion) return;
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var tx = x, ty = y;
    var shown = false;
    var hot = false;

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { x = tx; y = ty; shown = true; el.classList.add('is-on'); }
      var isHot = e.target.closest && e.target.closest('a, button, .feat, .shot, .acc__btn, .perf-tab, .ver-pill');
      if (!!isHot !== hot) { hot = !!isHot; el.classList.toggle('is-hot', hot); }
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { el.classList.remove('is-on'); shown = false; });
    window.addEventListener('blur', function () { el.classList.remove('is-on'); shown = false; });

    (function loop() {
      x = lerp(x, tx, 0.16);
      y = lerp(y, ty, 0.16);
      el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      raf(loop);
    })();
  })();

  /* ---------------------------------------------------------------------
     4. HEADER · NAV · SCROLL SPY · PAGE TRANSITIONS
     ------------------------------------------------------------------ */
  (function navigation() {
    var head = $('#siteHead');
    var nav = $('#nav');
    var burger = $('#burger');
    var progressBar = $('#scrollProgress').firstElementChild;
    var curtain = $('#curtain');
    var sections = $$('main > section[id]');
    var links = $$('.nav__link');
    var ticking = false;
    var transitioning = false;

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      var max = doc.body.scrollHeight - vh;
      progressBar.style.transform = 'scaleX(' + clamp(y / (max || 1), 0, 1) + ')';
      head.classList.toggle('is-stuck', y > 30);

      // scroll spy
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        if (s.offsetTop - vh * 0.35 <= y) current = s;
      }
      if (current) {
        var id = current.id;
        for (var j = 0; j < links.length; j++) {
          var isActive = links[j].getAttribute('href') === '#' + id;
          if (isActive !== links[j].classList.contains('is-active')) {
            links[j].classList.toggle('is-active', isActive);
          }
        }
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; raf(onScroll); }
    }, { passive: true });
    onScroll();

    // mobile drawer
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      root.classList.toggle('is-locked', open);
      if (open) { nav.querySelector('.nav__link').focus({ preventScroll: true }); }
    }
    if (burger) {
      burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    }
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });

    // smooth anchor navigation with a curtain wipe
    function goTo(target) {
      if (transitioning) return;
      var top = target.getBoundingClientRect().top + window.scrollY - 10;
      if (reduceMotion) { window.scrollTo({ top: top, behavior: 'auto' }); return; }
      transitioning = true;
      curtain.classList.remove('is-out');
      curtain.classList.add('is-in');
      setTimeout(function () {
        window.scrollTo({ top: top, behavior: 'auto' });
        curtain.classList.remove('is-in');
        curtain.classList.add('is-out');
        setTimeout(function () {
          curtain.classList.remove('is-out');
          transitioning = false;
        }, 460);
      }, 300);
    }

    $$('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      a.addEventListener('click', function (e) {
        var target = doc.getElementById(href.slice(1));
        if (!target) return;
        e.preventDefault();
        var wasOpen = nav.classList.contains('is-open');
        if (wasOpen) {
          nav.classList.remove('is-open');
          burger.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          root.classList.remove('is-locked');
        }
        goTo(target);
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });
  })();

  /* ---------------------------------------------------------------------
     5. SCROLL REVEAL
     ------------------------------------------------------------------ */
  (function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    // stagger siblings with a temporary inline delay (removed afterwards so
    // hover / tilt transitions stay instant once the element has revealed)
    var groups = new Map();
    items.forEach(function (el) {
      var p = el.parentElement;
      if (!groups.has(p)) groups.set(p, 0);
      var idx = groups.get(p);
      var delay = Math.min(idx, 6) * 65;
      el.dataset.delay = String(delay);
      groups.set(p, idx + 1);
    });

    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.dataset.delay || '0', 10);
        if (delay) el.style.animationDelay = delay + 'ms';
        el.classList.add('is-in');
        setTimeout(function () { el.style.animationDelay = ''; }, delay + 1200);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------------
     6. 3D CARD TILT
     ------------------------------------------------------------------ */
  (function tilt() {
    if (!finePointer || reduceMotion) return;
    $$('[data-tilt]').forEach(function (card) {
      var rect = null;
      card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); });
      card.addEventListener('pointermove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        card.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        rect = null;
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  })();

  /* ---------------------------------------------------------------------
     7. PARALLAX
     ------------------------------------------------------------------ */
  (function parallax() {
    var layers = $$('[data-parallax]');
    var heroInner = $('.hero__inner');
    if (!layers.length || reduceMotion) return;
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      if (y < vh * 1.3) {
        for (var i = 0; i < layers.length; i++) {
          var el = layers[i];
          var f = parseFloat(el.getAttribute('data-parallax')) || 0;
          el.style.transform = 'translate3d(0,' + (y * f).toFixed(2) + 'px,0)';
        }
        if (heroInner) {
          var p = clamp(y / (vh * 0.9), 0, 1);
          heroInner.style.opacity = String(1 - p * 0.75);
          heroInner.style.transform = 'translate3d(0,' + (p * -34).toFixed(2) + 'px,0)';
        }
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; raf(update); }
    }, { passive: true });
    update();
  })();

  /* ---------------------------------------------------------------------
     8. ANIMATED COUNTERS
     ------------------------------------------------------------------ */
  var formatNumber = function (v, decimals) {
    return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
  };
  function countUp(el, duration) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var start = performance.now();
    if (reduceMotion) {
      el.textContent = prefix + formatNumber(target, decimals) + suffix;
      return;
    }
    function step(now) {
      var p = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + formatNumber(target * eased, decimals) + suffix;
      if (p < 1) raf(step);
    }
    raf(step);
  }
  (function counters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { countUp(el, 1600); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target, 1800);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------------
     9. PERFORMANCE BENCHMARK DEMO
     ------------------------------------------------------------------ */
  (function benchmark() {
    var canvas = $('#perfChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var fpsEl = $('#perfFps');
    var gainEl = $('#perfGain');
    var lowEl = $('#perfLow');
    var frameEl = $('#perfFrame');
    var barVanilla = $('#barVanilla');
    var barAzyron = $('#barAzyron');
    var valVanilla = $('#valVanilla');
    var valAzyron = $('#valAzyron');
    var tabs = $$('.perf-tab');

    var MAX_FPS = 320;
    var POINTS = 64;

    var profiles = {
      competitive: { fps: 247, vanilla: 61, low: 198, frame: '4.0', gain: '+305%', label: 'Competitive' },
      balanced: { fps: 168, vanilla: 58, low: 132, frame: '5.9', gain: '+190%', label: 'Balanced' },
      cinematic: { fps: 96, vanilla: 52, low: 78, frame: '10.4', gain: '+85%', label: 'Cinematic' }
    };

    // deterministic noise (so the graph never "jumps" between redraws)
    function seeded(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function makeSeries(profile, seed) {
      var rnd = seeded(seed);
      var out = [];
      for (var i = 0; i < POINTS; i++) {
        var t = i / (POINTS - 1);
        var wave = Math.sin(t * 9.2) * 0.028 + Math.sin(t * 23.4 + 1.2) * 0.016;
        var noise = (rnd() - 0.5) * 0.055;
        out.push(profile.fps * (1 + wave + noise));
      }
      // a couple of demanding moments (render burst)
      out[22] = profile.fps * 0.87;
      out[45] = profile.fps * 0.9;
      return out;
    }
    function makeVanilla(profile, seed) {
      var rnd = seeded(seed + 77);
      var out = [];
      for (var i = 0; i < POINTS; i++) {
        var t = i / (POINTS - 1);
        var wave = Math.sin(t * 6.1) * 0.09;
        var noise = (rnd() - 0.5) * 0.16;
        out.push(profile.vanilla * (1 + wave + noise));
      }
      // stutters
      out[14] = profile.vanilla * 0.45;
      out[33] = profile.vanilla * 0.38;
      out[52] = profile.vanilla * 0.55;
      return out;
    }

    var state = { key: 'competitive', progress: 0, azy: [], van: [] };
    function setSeries(key) {
      state.key = key;
      state.azy = makeSeries(profiles[key], 1337);
      state.van = makeVanilla(profiles[key], 1337);
    }
    setSeries('competitive');

    function sizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var h = rect.height || 210;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: rect.width, h: h };
    }

    function drawLine(pts, x0, y0, w, h, progress, opts) {
      var n = Math.floor((pts.length - 1) * progress);
      if (n < 1) return null;
      var stepX = w / (pts.length - 1);
      var yFor = function (v) { return y0 + h - (v / MAX_FPS) * h; };
      ctx.beginPath();
      ctx.moveTo(x0, yFor(pts[0]));
      for (var i = 1; i <= n; i++) {
        var cx = x0 + i * stepX - stepX / 2;
        var cy = yFor(pts[i - 1]);
        var x = x0 + i * stepX;
        var y = yFor(pts[i]);
        ctx.quadraticCurveTo(cx, cy, (cx + x) / 2, (cy + y) / 2);
      }
      ctx.strokeStyle = opts.color;
      ctx.lineWidth = opts.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (opts.dash) ctx.setLineDash(opts.dash); else ctx.setLineDash([]);
      if (opts.glow) { ctx.shadowColor = opts.color; ctx.shadowBlur = opts.glow; }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
      return { x: x0 + n * stepX, y: yFor(pts[n]) };
    }

    function draw(progress) {
      var dims = sizeCanvas();
      var w = dims.w, h = dims.h;
      if (!w) return;
      ctx.clearRect(0, 0, w, h);

      var padL = 30, padR = 4, padT = 8, padB = 4;
      var plotW = w - padL - padR;
      var plotH = h - padT - padB;

      // grid
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var g = 0; g <= 4; g++) {
        var val = (MAX_FPS / 4) * g;
        var y = padT + plotH - (val / MAX_FPS) * plotH;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.strokeStyle = g === 0 ? 'rgba(198,204,226,.16)' : 'rgba(198,204,226,.055)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(127,133,160,.55)';
        ctx.fillText(String(Math.round(val)), padL - 7, y);
      }

      // area under azyron
      var stepX = plotW / (POINTS - 1);
      var n = Math.floor((POINTS - 1) * progress);
      if (n > 1) {
        var yFor = function (v) { return padT + plotH - (v / MAX_FPS) * plotH; };
        ctx.beginPath();
        ctx.moveTo(padL, padT + plotH);
        ctx.lineTo(padL, yFor(state.azy[0]));
        for (var i = 1; i <= n; i++) {
          var cx = padL + i * stepX - stepX / 2;
          var cy = yFor(state.azy[i - 1]);
          var x = padL + i * stepX;
          var y = yFor(state.azy[i]);
          ctx.quadraticCurveTo(cx, cy, (cx + x) / 2, (cy + y) / 2);
        }
        ctx.lineTo(padL + n * stepX, padT + plotH);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        grad.addColorStop(0, 'rgba(168,85,247,.30)');
        grad.addColorStop(0.55, 'rgba(139,63,226,.10)');
        grad.addColorStop(1, 'rgba(109,40,217,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // vanilla (dashed silver)
      drawLine(state.van, padL, padT, plotW, plotH, progress, {
        color: 'rgba(198,204,226,.5)', width: 1.4, dash: [4, 4]
      });
      // azyron (glowing purple)
      var end = drawLine(state.azy, padL, padT, plotW, plotH, progress, {
        color: '#B06BFF', width: 2.1, glow: 14
      });
      if (end) {
        ctx.beginPath();
        ctx.arc(end.x, end.y, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = '#F1E4FF';
        ctx.shadowColor = '#A855F7';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(end.x, end.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(192,132,252,.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    var currentProgress = 0;
    function animateChart(duration) {
      if (reduceMotion) { currentProgress = 1; draw(1); return; }
      var from = 0;
      var start = performance.now();
      function step(now) {
        var p = clamp((now - start) / (duration || 950), 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        currentProgress = from + (1 - from) * eased;
        draw(currentProgress);
        if (p < 1) raf(step);
      }
      raf(step);
    }

    var animVal = { fps: 0, low: 0, van: 0 };
    function tweenValues(p, quick) {
      var start = performance.now();
      var from = { fps: animVal.fps, low: animVal.low, van: animVal.van };
      var dur = quick ? 520 : 900;
      function step(now) {
        var t = clamp((now - start) / dur, 0, 1);
        var e = 1 - Math.pow(1 - t, 3);
        var fps = Math.round(lerp(from.fps, p.fps, e));
        var low = Math.round(lerp(from.low, p.low, e));
        var van = Math.round(lerp(from.van, p.vanilla, e));
        fpsEl.textContent = fps;
        lowEl.textContent = low;
        valAzyron.textContent = fps;
        valVanilla.textContent = van;
        animVal.fps = fps; animVal.low = low; animVal.van = van;
        barAzyron.style.width = clamp(fps / MAX_FPS * 100, 3, 100) + '%';
        barVanilla.style.width = clamp(van / MAX_FPS * 100, 3, 100) + '%';
        if (t < 1) raf(step);
      }
      raf(step);
    }

    function applyProfile(key, quick) {
      var p = profiles[key];
      setSeries(key);
      gainEl.textContent = p.gain;
      frameEl.innerHTML = p.frame + '<em>ms</em>';
      tweenValues(p, quick);
      animateChart(900);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (tab.classList.contains('is-active')) return;
        tabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute("aria-pressed", "false");
        });
        tab.classList.add('is-active');
        tab.setAttribute("aria-pressed", "true");
        applyProfile(tab.getAttribute('data-profile'), true);
      });
    });

    // initial paint when in view
    var started = false;
    function start() {
      if (started) return;
      started = true;
      applyProfile('competitive', false);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { start(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(canvas);
    } else { start(); }

    window.addEventListener('resize', function () {
      if (started) draw(currentProgress || 1);
    }, { passive: true });
  })();

  /* ---------------------------------------------------------------------
     10. LIVE HUD DEMO
     ------------------------------------------------------------------ */
  (function hudDemo() {
    var hud = $('.hud');
    if (!hud || reduceMotion) return;
    var fpsEl = $('#hudFps');
    var cpsEl = $('#hudCps');
    var keys = $$('.hud__keys i');
    var visible = true;
    var timers = [];

    function every(fn, ms) {
      var id = setInterval(function () { if (visible && !doc.hidden) fn(); }, ms);
      timers.push(id);
      return id;
    }

    every(function () {
      if (!fpsEl) return;
      var base = 247;
      fpsEl.textContent = String(base + Math.round((Math.random() - 0.5) * 14));
    }, 620);

    every(function () {
      if (!cpsEl) return;
      cpsEl.textContent = String(7 + Math.floor(Math.random() * 5));
    }, 900);

    every(function () {
      var map = ['W', 'W', 'A', 'S', 'D', 'LMB', 'RMB', 'W'];
      var pick = map[Math.floor(Math.random() * map.length)];
      var el = keys.filter(function (k) { return k.getAttribute('data-key') === pick; })[0];
      if (!el) return;
      el.classList.add('is-down');
      setTimeout(function () { el.classList.remove('is-down'); }, 110 + Math.random() * 160);
    }, 240);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hud);
    }

    var toggle = $('#hudToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var off = hud.classList.toggle('is-off');
        toggle.setAttribute('aria-pressed', off ? 'false' : 'true');
        toggle.querySelector('.btn__label').textContent = off ? 'HUD OFF' : 'HUD ON';
      });
    }

    // hotbar slot cycling
    var slots = $$('.hud__hotbar .slot');
    var slotIdx = 4;
    every(function () {
      if (!slots.length) return;
      slots[slotIdx].classList.remove('is-active');
      slotIdx = (slotIdx + 1) % 9;
      slots[slotIdx].classList.add('is-active');
    }, 2600);
  })();

  /* ---------------------------------------------------------------------
     11. GALLERY LIGHTBOX
     ------------------------------------------------------------------ */
  (function lightbox() {
    var shots = $$('.shot');
    var box = $('#lightbox');
    if (!shots.length || !box) return;
    var img = $('#lightboxImg');
    var cap = $('#lightboxCap');
    var count = $('#lightboxCount');
    var idx = 0;
    var lastFocus = null;

    function show(i) {
      idx = (i + shots.length) % shots.length;
      var shot = shots[idx];
      img.src = shot.getAttribute('data-full');
      img.alt = shot.querySelector('img') ? shot.querySelector('img').alt : '';
      cap.textContent = shot.getAttribute('data-caption') || '';
      count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(shots.length).padStart(2, '0');
    }
    function open(i) {
      lastFocus = doc.activeElement;
      show(i);
      box.hidden = false;
      root.classList.add('is-locked');
      setTimeout(function () { $('#lbNext').focus(); }, 60);
    }
    function close() {
      box.hidden = true;
      root.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    shots.forEach(function (shot, i) {
      shot.addEventListener('click', function () { open(i); });
    });
    $$('[data-lb-close]', box).forEach(function (el) { el.addEventListener('click', close); });
    $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
    $('#lbNext').addEventListener('click', function () { show(idx + 1); });
    doc.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    // swipe
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
  })();

  /* ---------------------------------------------------------------------
     12. FAQ ACCORDION
     ------------------------------------------------------------------ */
  (function accordion() {
    var buttons = $$('.acc__btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        buttons.forEach(function (other) {
          if (other === btn) return;
          other.setAttribute('aria-expanded', 'false');
          var item = other.closest('.acc');
          if (item) item.classList.remove('is-open');
        });
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        var father = btn.closest('.acc');
        if (father) father.classList.toggle('is-open', !isOpen);
      });
    });
  })();

  /* ---------------------------------------------------------------------
     13. TOAST · COPY · VERSION PILLS
     ------------------------------------------------------------------ */
  var toastTimer = null;
  function toast(message) {
    var el = $('#toast');
    if (!el) return;
    $('#toastText').textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  (function clipboard() {
    var btn = $('#copyChecksum');
    var code = $('#checksum');
    if (!btn || !code) return;
    btn.addEventListener('click', function () {
      var text = code.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { toast('SHA-256 checksum copied'); })
          .catch(function () { toast('Copy failed — select it manually'); });
      } else {
        var range = doc.createRange();
        range.selectNodeContents(code);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        toast('Checksum selected — press Ctrl+C');
      }
    });
  })();

  (function pills() {
    var REL = 'downloads/';
    var main = $('#dlMain'), core = $('#dlCore'), code = $('#checksum');
    var nameEl = $('#dlFileName'), sizeEl = $('#dlFileSize');

    $$('.ver-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        $$('.ver-pill').forEach(function (p) { p.classList.remove('is-active'); });
        pill.classList.add('is-active');

        var file = pill.getAttribute('data-file');
        var size = pill.getAttribute('data-size');
        var sha  = pill.getAttribute('data-sha');
        var label = pill.firstChild ? pill.firstChild.textContent.trim() : pill.textContent.trim();

        if (file) {
          [main, core].forEach(function (a) {
            if (a) { a.href = REL + file; a.setAttribute('download', file); }
          });
          if (nameEl) nameEl.textContent = file;
          if (sizeEl) sizeEl.textContent = size || '';
        }
        if (sha && code) code.textContent = sha;

        toast('AZYRON Core ' + label + ' selected');
      });
    });
  })();

  /* ---------------------------------------------------------------------
     14. MAGNETIC BUTTONS
     ------------------------------------------------------------------ */
  (function magnetic() {
    if (!finePointer || reduceMotion) return;
    $$('[data-magnetic]').forEach(function (btn) {
      var rect = null;
      btn.addEventListener('pointerenter', function () { rect = btn.getBoundingClientRect(); });
      btn.addEventListener('pointermove', function (e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        var dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        btn.style.transform = 'translate3d(' + (dx * 7).toFixed(2) + 'px,' + (dy * 5 - 2).toFixed(2) + 'px,0)';
      });
      btn.addEventListener('pointerleave', function () {
        rect = null;
        btn.style.transform = '';
      });
    });
  })();

  /* ---------------------------------------------------------------------
     15. YEAR + MISC
     ------------------------------------------------------------------ */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Pause heavy CSS animation off-screen for battery friendliness
  if ('IntersectionObserver' in window) {
    var pauseables = $$('.marquee');
    pauseables.forEach(function (el) {
      var track = el.querySelector('.marquee__track');
      if (!track) return;
      new IntersectionObserver(function (entries) {
        track.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
      }, { threshold: 0 }).observe(el);
    });
  }
})();
