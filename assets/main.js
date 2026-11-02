/* Cats in Care · "Chalk and whiskers" interactions: chalk drawn over daylight photographs. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vh = window.innerHeight;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---------- header state */
  var bar = document.querySelector('[data-bar]');

  /* ---------- mobile menu: a paper sheet under the header */
  var menuBtn = document.querySelector('[data-menu]');
  var nav = document.querySelector('[data-nav]');
  if (menuBtn && nav) {
    var setMenu = function (open, refocus) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.querySelector('.menu-word').textContent = open ? 'Close' : 'Menu';
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) { var f = nav.querySelector('a'); if (f) f.focus(); }
      else if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    // keep Tab inside the open sheet (links, then the close button)
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
      var items = nav.querySelectorAll('a'), last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); menuBtn.focus(); }
    });
    menuBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey && nav.classList.contains('is-open')) { e.preventDefault(); nav.querySelector('a').focus(); }
    });
    window.matchMedia('(min-width: 981px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- parallax: [data-speed] layers move relative to their section centre.
     Hosts marked .hero or [data-top] are anchored at rest (no offset at the top of the page).
     [data-var] layers write a --py custom property so they can keep their own rotation. */
  var layers = [].slice.call(document.querySelectorAll('[data-speed]')).map(function (el) {
    var host = el.closest('section, footer');
    return { el: el, speed: parseFloat(el.getAttribute('data-speed')) || 0, host: host,
      top: host.classList.contains('hero') || host.hasAttribute('data-top'), useVar: el.hasAttribute('data-var') };
  });
  var scrubs = [].slice.call(document.querySelectorAll('[data-scrub]')).map(function (el) {
    var p = el.querySelector('[data-scrub-path]'); if (p && !reduce) p.style.strokeDashoffset = '1';
    return { el: el, path: p };
  });
  var fade = document.querySelector('[data-fade]');

  /* ---------- story: scroll-drawn chalk line */
  var story = document.querySelector('[data-story]');
  var segs = story ? [].slice.call(story.querySelectorAll('[data-seg]')).map(function (p) {
    var r = p.getAttribute('data-seg').split(' ').map(parseFloat);
    return { el: p, a: r[0], b: r[1], last: -1 };
  }) : [];
  var beats = story ? [].slice.call(story.querySelectorAll('.beat')) : [];
  var meter = story && story.querySelector('[data-meter]');
  var glow = story && story.querySelector('[data-glow]');
  var hearth = story && story.querySelector('[data-hearth]');
  var drawSvg = story && story.querySelector('.drawing');
  var mq = window.matchMedia('(max-width: 760px)');
  var pspeed = story ? [].slice.call(story.querySelectorAll('[data-pspeed]')) : [];
  var paws = [];

  // paw prints along the lane
  var lane = document.getElementById('lane');
  var pawHost = story && story.querySelector('[data-paws]');
  if (lane && pawHost && lane.getTotalLength) {
    var L = lane.getTotalLength(), ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 9; i++) {
      var t = 0.08 + i * 0.1, pt = lane.getPointAtLength(L * t), pt2 = lane.getPointAtLength(L * Math.min(1, t + 0.01));
      var ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      var g = document.createElementNS(ns, 'g');
      var off = i % 2 ? 9 : -9;
      g.setAttribute('class', 'paw');
      g.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') translate(0 ' + (off - 16) + ') scale(.75)');
      g.setAttribute('fill', '#F4F1E4');
      g.setAttribute('stroke', 'none');
      g.innerHTML = '<ellipse cx="0" cy="0" rx="5" ry="4.2"/><circle cx="6" cy="-5" r="2"/><circle cx="7.5" cy="0" r="2"/><circle cx="6" cy="5" r="2"/>';
      pawHost.appendChild(g);
      paws.push({ el: g, at: 0.29 + (0.53 - 0.29) * t });
    }
  }

  function storyProgress() {
    var r = story.getBoundingClientRect();
    var span = r.height - vh;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 1;
  }

  function renderStory(p) {
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i], k = clamp((p - s.a) / (s.b - s.a), 0, 1);
      if (k !== s.last) { s.el.style.strokeDashoffset = (1 - k).toFixed(4); s.last = k; }
    }
    for (var j = 0; j < paws.length; j++) paws[j].el.classList.toggle('on', p >= paws[j].at);
    var idx = p < 0.27 ? 0 : p < 0.54 ? 1 : p < 0.8 ? 2 : 3;
    for (var b = 0; b < beats.length; b++) beats[b].classList.toggle('is-on', b === idx);
    if (glow) glow.setAttribute('opacity', (0.85 * clamp((p - 0.8) / 0.12, 0, 1)).toFixed(3));
    // the photograph under the chalk turns from the open down to a cat asleep by a stove
    if (hearth) hearth.style.opacity = clamp((p - 0.5) / 0.3, 0, 1).toFixed(3);
    if (drawSvg && mq.matches) {
      // small screens: the camera follows the chalk along the line
      var focus = p < 0.27 ? 170 : p < 0.55 ? 250 + (p - 0.27) / 0.28 * 700 : p < 0.8 ? 950 + (p - 0.55) / 0.25 * 60 : 1050;
      var W = drawSvg.getBoundingClientRect().width, vw = drawSvg.parentNode.clientWidth;
      var cx = (focus - 40) * W / 1130;
      drawSvg.style.transform = 'translate3d(' + clamp(vw / 2 - cx, vw - W, 0).toFixed(1) + 'px,0,0)';
    } else if (drawSvg) drawSvg.style.transform = '';
    if (meter) meter.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    for (var q = 0; q < pspeed.length; q++) {
      var sp = parseFloat(pspeed[q].getAttribute('data-pspeed'));
      pspeed[q].style.transform = 'translate3d(0,' + (p * sp).toFixed(1) + 'px,0)';
    }
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY;
    if (bar) bar.classList.toggle('is-solid', y > 40);
    if (!reduce) {
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i], r = l.host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var d = l.top ? r.top : (r.top + r.height / 2) - vh / 2;
        var v = (-d * l.speed).toFixed(1) + 'px';
        if (l.useVar) l.el.style.setProperty('--py', v);
        else l.el.style.transform = 'translate3d(0,' + v + ',0)';
      }
      for (var s = 0; s < scrubs.length; s++) {
        var sr0 = scrubs[s].el.getBoundingClientRect();
        if (!scrubs[s].path || sr0.bottom < 0 || sr0.top > vh) continue;
        var k = clamp((vh * 0.78 - sr0.top) / (sr0.height * 0.9), 0, 1);
        scrubs[s].path.style.strokeDashoffset = (1 - k).toFixed(4);
      }
      if (fade) fade.style.opacity = clamp(1 - y / (vh * 0.7), 0, 1).toFixed(3);
      if (story) {
        var sr = story.getBoundingClientRect();
        if (sr.bottom > -100 && sr.top < vh + 100) renderStory(storyProgress());
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); sizeBoard(); }, { passive: true });
  if (reduce && story) renderStory(1);
  frame();

  /* ---------- reveal: slate writes itself, cards draw themselves */
  var cards = [].slice.call(document.querySelectorAll('.card'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('card') ? 'is-drawn' : 'is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
    cards.forEach(function (c) { io.observe(c); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    cards.forEach(function (c) { c.classList.add('is-drawn'); });
  }
  cards.forEach(function (c) {
    c.addEventListener('click', function () {
      if (reduce) return;
      c.classList.remove('is-drawn'); c.classList.add('is-reset');
      void c.offsetWidth;
      c.classList.remove('is-reset'); c.classList.add('is-drawn');
    });
  });

  /* ---------- slate cat watches the pointer */
  var watcher = document.querySelector('[data-watch]');
  if (watcher && !reduce) {
    var eyes = watcher.querySelectorAll('.eye');
    window.addEventListener('pointermove', function (e) {
      var r = watcher.getBoundingClientRect();
      var cx = r.left + r.width * 0.62, cy = r.top + r.height * 0.24;
      var dx = e.clientX - cx, dy = e.clientY - cy, m = Math.hypot(dx, dy) || 1;
      var tx = (dx / m) * 3.2, ty = (dy / m) * 2.6;
      eyes.forEach(function (eye) { eye.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)'; });
    }, { passive: true });
  }

  /* ---------- chalk board */
  var canvas = document.querySelector('[data-board]');
  var ctx = canvas && canvas.getContext('2d');
  var hint = document.querySelector('[data-hint]');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var cw = 0, ch = 0, drawing = false, last = null, autoTimer = null;

  function sizeBoard() {
    if (!canvas) return;
    var r = canvas.getBoundingClientRect();
    if (Math.abs(r.width - cw) < 2 && Math.abs(r.height - ch) < 2) return;
    var keep = cw ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (keep) ctx.putImageData(keep, 0, 0);
  }
  // chalk: a scatter of tiny grains along each segment
  function chalkSeg(x0, y0, x1, y1, w) {
    var dist = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(dist / 1.4));
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (var g = 0; g < 4; g++) {
        var a = Math.random() * Math.PI * 2, rr = Math.random() * w;
        ctx.globalAlpha = 0.25 + Math.random() * 0.55;
        ctx.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.3, 1.3);
      }
    }
    ctx.globalAlpha = 1;
  }
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function hideHint() { if (hint) hint.classList.add('gone'); }

  if (canvas) {
    sizeBoard();
    ctx.fillStyle = '#F4F1E4';
    canvas.addEventListener('pointerdown', function (e) {
      stopAuto(); drawing = true; last = pos(e); hideHint();
      canvas.setPointerCapture(e.pointerId);
      chalkSeg(last.x, last.y, last.x + 0.1, last.y, 2.6);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e); chalkSeg(last.x, last.y, p.x, p.y, 2.6); last = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { canvas.addEventListener(n, function () { drawing = false; }); });

    document.querySelector('[data-clear]').addEventListener('click', function () {
      stopAuto(); ctx.clearRect(0, 0, cw, ch); if (hint) hint.classList.remove('gone');
    });
    document.querySelector('[data-auto]').addEventListener('click', function () { autoCat(); });
  }

  // the lying chalk cat, the same figure as on the hill, drawn by the board itself
  var CAT = [
    'M44 132C22 128 20 88 58 78C100 68 150 72 180 70C186 58 190 44 196 36L194 8L212 24C218 22 224 22 230 24L246 10L246 38C254 50 252 66 238 74C236 90 238 108 246 122C256 124 266 126 266 132L44 132',
    'M42 112C8 106 4 64 34 56',
    'M206 128C210 112 208 100 200 92',
    'M150 132C160 112 150 92 128 86',
    'M208 46q5 4 10 0',
    'M228 45q5 4 10 0'
  ];
  function stopAuto() { if (autoTimer) { cancelAnimationFrame(autoTimer); autoTimer = null; } }
  function autoCat() {
    stopAuto(); sizeBoard(); hideHint();
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0');
    document.body.appendChild(svg);
    var paths = CAT.map(function (d) { var p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); svg.appendChild(p); return { p: p, L: p.getTotalLength() }; });
    var total = paths.reduce(function (s, x) { return s + x.L; }, 0);
    var scale = Math.min(cw * 0.78 / 270, ch * 0.6 / 140);
    var ox = (cw - 270 * scale) / 2 + Math.random() * 20 - 10, oy = ch * 0.62 - 132 * scale;
    var done = 0, pi = 0, prev = null, speed = reduce ? total : total / 110;
    function step() {
      var budget = speed;
      while (budget > 0 && pi < paths.length) {
        var cur = paths[pi], take = Math.min(budget, cur.L - done);
        var n = Math.max(1, Math.ceil(take / 3));
        for (var k = 1; k <= n; k++) {
          var pt = cur.p.getPointAtLength(done + take * k / n);
          var q = { x: ox + pt.x * scale, y: oy + pt.y * scale };
          if (prev) chalkSeg(prev.x, prev.y, q.x, q.y, 2.2); prev = q;
        }
        done += take; budget -= take;
        if (done >= cur.L - 0.01) { pi++; done = 0; prev = null; }
      }
      if (pi < paths.length) autoTimer = requestAnimationFrame(step); else { autoTimer = null; svg.remove(); }
    }
    step();
  }
  /* ---------- partners: the panel cuts itself into the down like a hill figure */
  var cut = document.querySelector('[data-cut]');
  if (cut) {
    var cutLine = cut.querySelector('.cut-line');
    var dustHost = cut.querySelector('.cut-dust');
    var scuffHost = cut.querySelector('.cut-scuffs');
    var VB_W = 480, VB_H = 270;
    var puff = function (x, y, n, spread) {
      if (reduce || !dustHost) return;
      for (var i = 0; i < n; i++) {
        var s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = (0.35 + Math.random() * 0.65) * spread;
        s.style.left = x.toFixed(1) + 'px'; s.style.top = y.toFixed(1) + 'px';
        s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
        s.style.setProperty('--dy', (Math.sin(a) * d * 0.7 - 6).toFixed(1) + 'px');
        s.style.setProperty('--s', (0.6 + Math.random() * 1.1).toFixed(2));
        s.style.animationDelay = Math.round(Math.random() * 90) + 'ms';
        s.addEventListener('animationend', function () { this.remove(); });
        dustHost.appendChild(s);
      }
    };
    var smudge = function (x, y) {
      if (reduce || !scuffHost || scuffHost.childElementCount > 6) return;
      var b = document.createElement('b');
      b.style.left = x.toFixed(1) + 'px'; b.style.top = y.toFixed(1) + 'px';
      b.style.setProperty('--r', (Math.random() * 50 - 25).toFixed(0) + 'deg');
      b.addEventListener('animationend', function () { this.remove(); });
      scuffHost.appendChild(b);
    };
    // a point along the chalk line, in px inside the (unrotated) panel
    var along = function (t) {
      var L = cutLine.getTotalLength(), p = cutLine.getPointAtLength(L * t);
      return { x: p.x / VB_W * cut.offsetWidth, y: p.y / VB_H * cut.offsetHeight };
    };
    // pointer position inside the panel, undoing its small tilt closely enough for chalk dust
    var local = function (e) {
      var r = cut.getBoundingClientRect();
      return { x: e.clientX - r.left - (r.width - cut.offsetWidth) / 2, y: e.clientY - r.top - (r.height - cut.offsetHeight) / 2 };
    };

    if ('IntersectionObserver' in window && !reduce) {
      cut.classList.add('is-armed');
      var co = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        co.disconnect();
        cut.classList.add('is-cut');
        // dust kicks up where the chalk is being cut, in step with the line
        for (var k = 0; k <= 16; k++) (function (t) {
          setTimeout(function () { var p = along(t); puff(p.x, p.y, 3, 16); }, 150 + 1700 * t);
        })(k / 16);
        setTimeout(function () { var p = along(1); puff(p.x, p.y, 12, 36); }, 1900);
      }, { threshold: 0.6 });
      co.observe(cut);
    }

    var lastScuff = 0;
    cut.addEventListener('pointermove', function (e) {
      var now = Date.now();
      if (now - lastScuff < 70) return;
      lastScuff = now;
      var p = local(e); puff(p.x, p.y, 2, 14);
      if (Math.random() < 0.35) smudge(p.x, p.y);
    });
    cut.addEventListener('pointerdown', function (e) { var p = local(e); puff(p.x, p.y, 12, 40); smudge(p.x, p.y); });
    cut.addEventListener('focus', function () {
      if (!cut.matches(':focus-visible')) return;
      [0.42, 0.6, 0.78, 0.96].forEach(function (t) { var p = along(t); puff(p.x, p.y, 5, 22); });
    });
  }

  // draw one on first view so the board is never empty for long
  if (canvas && 'IntersectionObserver' in window) {
    var bo = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { bo.disconnect(); setTimeout(autoCat, reduce ? 0 : 400); }
    }, { threshold: 0.5 });
    bo.observe(canvas);
  }
})();
