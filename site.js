// «Середина» — site interactions: reveal, nav, dropdowns, accordions, reviews.
(function () {
  // Announcement dismiss (blue strip scrolls away with the page — not pinned)
  var ann = document.getElementById('announce');
  var annX = document.getElementById('announceX');
  var header = document.getElementById('siteHeader');
  if (annX) annX.addEventListener('click', function () { ann.classList.add('hide'); });

  // Floating "Забронировать" button — hide it while the booking widget is on screen
  var booking = document.getElementById('booking');
  var fab = document.getElementById('bookFab');
  if (booking && fab && window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      fab.classList.toggle('hide', entries[0].isIntersecting);
    }, { threshold: 0.12 }).observe(booking);
  }

  // Award logos: until a PNG is uploaded to assets/logos/, gracefully fall back
  // to the text wordmark, so a missing file never shows a broken image.
  document.querySelectorAll('#awards img.logo[data-fallback]').forEach(function (img) {
    var fb = function () {
      var span = document.createElement('span');
      span.className = 'logo-ph';
      span.textContent = img.getAttribute('data-fallback');
      img.replaceWith(span);
    };
    img.addEventListener('error', fb);
    if (img.complete && img.naturalWidth === 0) fb();
  });

  // In-page anchor links: smooth-scroll WITHOUT changing location.hash.
  // The homereserve booking widget re-mounts on every hashchange and blanks out,
  // so any click on #o-nas / #booking / … would wipe it. We scroll by JS instead
  // and never touch the hash, leaving the widget untouched.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    if (a.target === '_blank') return; // placeholder links open in a new tab
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    var headH = header ? header.getBoundingClientRect().height : 0;
    var y = target.getBoundingClientRect().top + window.scrollY - headH - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, false);

  // Mobile nav
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var setMenu = function (open) {
    nav.classList.toggle('open', open);
    if (open && header) header.classList.remove('nav-hidden');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  if (burger) burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav && nav.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  // Hero parallax is now pure CSS (sticky left frame while the taller right scrolls)

  // Мария photo: gentle intra-frame parallax (image drifts inside its frame on scroll)
  var mariaFrame = document.querySelector('.about-photo');
  if (mariaFrame) {
    var mImg = mariaFrame.querySelector('img');
    var mTravel = 0, mTick = false;
    var mMeasure = function () { mTravel = mImg ? Math.max(0, mImg.offsetHeight - mariaFrame.offsetHeight) : 0; };
    var mApply = function () {
      mTick = false;
      if (!mImg || mTravel === 0) return;
      var r = mariaFrame.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh - r.top) / (vh + r.height);
      p = Math.max(0, Math.min(1, p));
      mImg.style.transform = 'translateY(' + (-p * mTravel).toFixed(1) + 'px)';
    };
    var mScroll = function () { if (!mTick) { mTick = true; requestAnimationFrame(mApply); } };
    window.addEventListener('scroll', mScroll, { passive: true });
    window.addEventListener('resize', function () { mMeasure(); mApply(); });
    mMeasure(); mApply();
  }

  // Nav: always fixed; flies up on scroll-down, returns with solid backing on scroll-up
  if (header) {
    var last = window.scrollY;
    var onScroll = function () {
      if (nav && nav.classList.contains('open')) return;
      var y = window.scrollY;
      if (y <= 80) {
        header.classList.remove('nav-hidden', 'nav-solid', 'nav-fixed');
      } else if (y > last + 4) {
        header.classList.add('nav-fixed', 'nav-hidden');
        header.classList.remove('nav-solid');
      } else if (y < last - 4) {
        header.classList.add('nav-fixed', 'nav-solid');
        header.classList.remove('nav-hidden');
      }
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // Custom selects (booking bar)
  var selects = document.querySelectorAll('[data-select]');
  selects.forEach(function (sel) {
    var toggle = sel.querySelector('[data-toggle]');
    var valEl = sel.querySelector('[data-value]');
    var opts = sel.querySelectorAll('[data-opt]');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = sel.classList.contains('open');
      closeAll();
      if (!wasOpen) sel.classList.add('open');
    });
    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        valEl.textContent = o.textContent;
        opts.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        o.setAttribute('aria-selected', 'true');
        sel.classList.remove('open');
      });
    });
  });
  function closeAll() { selects.forEach(function (s) { s.classList.remove('open'); }); }
  document.addEventListener('click', closeAll);

  // Accordions
  document.querySelectorAll('[data-acc]').forEach(function (acc) {
    acc.querySelectorAll('.acc-row').forEach(function (row) {
      var head = row.querySelector('.head');
      var panel = row.querySelector('.panel');
      head.addEventListener('click', function () {
        var open = row.classList.contains('open');
        if (open) { row.classList.remove('open'); panel.style.maxHeight = null; }
        else { row.classList.add('open'); panel.style.maxHeight = panel.scrollHeight + 'px'; }
      });
    });
  });

  // Interactive concept scale (− 0 +)
  var scale = document.getElementById('scale');
  if (scale) {
    var desc = document.getElementById('scaleDesc');
    var dTitle = desc.querySelector('[data-desc-title]');
    var dText = desc.querySelector('[data-desc-text]');
    var nodes = scale.querySelectorAll('.scale-node');
    var CENTER = nodes[1];
    var activate = function (node) {
      nodes.forEach(function (n) { n.classList.remove('on'); });
      node.classList.add('on');
      desc.classList.add('swap');
      setTimeout(function () {
        dTitle.textContent = node.getAttribute('data-title');
        dText.textContent = node.getAttribute('data-desc');
        desc.classList.remove('swap');
      }, 200);
    };
    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { activate(n); });
      n.addEventListener('focus', function () { activate(n); });
      n.addEventListener('click', function () { activate(n); });
    });
    scale.addEventListener('mouseleave', function () { activate(CENTER); });
  }

  // Simple plot galleries (plain scrolling frames, click / arrows)
  document.querySelectorAll('[data-gal]').forEach(function (gal) {
    var track = gal.querySelector('.sg-track');
    if (!track) return;
    var kids = track.children;
    var slides = kids.length;
    var i = 0;
    var loadSg = function (idx) {
      [idx - 1, idx, idx + 1].forEach(function (k) {
        k = (k + slides) % slides;
        var s = kids[k]; if (!s) return;
        var im = s.querySelector('img'); if (im && !im.getAttribute('src') && im.dataset.src) im.src = im.dataset.src;
        var bg = s.querySelector('.sg-bg'); if (bg && !bg.style.backgroundImage && bg.dataset.bg) bg.style.backgroundImage = 'url(' + bg.dataset.bg + ')';
      });
    };
    function go(n) { i = (n + slides) % slides; track.style.transform = 'translateX(' + (-i * 100) + '%)'; loadSg(i); }
    var prev = gal.querySelector('[data-sg-prev]');
    var next = gal.querySelector('[data-sg-next]');
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); go(i - 1); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); go(i + 1); });
    track.addEventListener('click', function () { go(i + 1); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { loadSg(0); ob.disconnect(); } }, { rootMargin: '300px' }).observe(gal);
    } else { loadSg(0); }
  });

  // Cabin "подробнее" toggles
  document.querySelectorAll('[data-plot-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var plot = btn.closest('.plot');
      if (!plot) return;
      var open = plot.classList.toggle('open');
      btn.childNodes[0].nodeValue = open ? 'Свернуть ' : 'Подробнее о домике ';
    });
  });

  // iOS-style coverflow galleries: центр — крупно, соседние мельче по бокам
  document.querySelectorAll('[data-gallery]').forEach(function (gal) {
    var frame = gal.querySelector('.gal-frame');
    if (!frame) return;
    var slides = Array.prototype.slice.call(frame.querySelectorAll('.gslide'));
    var caps = Array.prototype.slice.call(gal.querySelectorAll('.gcap'));
    var n = slides.length;
    var idx = Math.max(0, slides.findIndex(function (s) { return s.classList.contains('active'); }));
    var seen = false;
    var loadVisible = function () {
      [idx, (idx - 1 + n) % n, (idx + 1) % n].forEach(function (i) {
        var im = slides[i] && slides[i].querySelector('img');
        if (im && im.getAttribute('loading') === 'lazy') im.setAttribute('loading', 'eager');
      });
    };
    var render = function () {
      var prevI = (idx - 1 + n) % n, nextI = (idx + 1) % n;
      slides.forEach(function (s, i) {
        s.classList.remove('active', 'side', 'left', 'right');
        if (i === idx) { s.style.display = 'flex'; s.classList.add('active'); }
        else if (i === prevI) { s.style.display = 'flex'; s.classList.add('side', 'left'); }
        else if (i === nextI) { s.style.display = 'flex'; s.classList.add('side', 'right'); }
        else { s.style.display = 'none'; }
      });
      caps.forEach(function (c, i) { c.classList.toggle('active', i === idx); });
      if (seen) loadVisible();
    };
    var go = function (d) { idx = (idx + d + n) % n; render(); };
    slides.forEach(function (s, i) { s.addEventListener('click', function () { if (i !== idx) { idx = i; render(); } }); });
    var prev = gal.querySelector('[data-prev]'), next = gal.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    var x0 = null;
    frame.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; }, { passive: true });
    window.addEventListener('resize', render);
    render();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { seen = true; loadVisible(); ob.disconnect(); } }, { rootMargin: '300px' }).observe(gal);
    } else { seen = true; loadVisible(); }
  });

  // Universal gallery: scroll-snap carousel, full photo (no crop), synced captions
  document.querySelectorAll('[data-ugal]').forEach(function (g) {
    var utrack = g.querySelector('.ugal-track');
    var slides = Array.prototype.slice.call(utrack.querySelectorAll('.ugal-slide'));
    var caps = Array.prototype.slice.call(g.querySelectorAll('.ugal-cap'));
    if (!slides.length) return;
    var idx = 0;
    var loadNear = function (i) {
      [i - 1, i, i + 1].forEach(function (k) {
        if (k >= 0 && k < slides.length) {
          var im = slides[k].querySelector('img');
          if (im && !im.getAttribute('src') && im.dataset.src) im.src = im.dataset.src;
          var bg = slides[k].querySelector('.ugal-bg');
          if (bg && !bg.style.backgroundImage && bg.dataset.bg) bg.style.backgroundImage = 'url(' + bg.dataset.bg + ')';
        }
      });
    };
    var markActive = function (i) {
      idx = i;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      caps.forEach(function (c, k) { c.classList.toggle('active', k === i); });
    };
    var setActive = function (i) { markActive(i); loadNear(i); };
    var centerOn = function (i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var s = slides[i];
      utrack.scrollTo({ left: s.offsetLeft - (utrack.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' });
    };
    var raf = false;
    utrack.addEventListener('scroll', function () {
      if (raf) return; raf = true;
      requestAnimationFrame(function () {
        raf = false;
        var c = utrack.scrollLeft + utrack.clientWidth / 2, best = 0, bd = 1e9;
        slides.forEach(function (s, k) { var sc = s.offsetLeft + s.offsetWidth / 2, d = Math.abs(sc - c); if (d < bd) { bd = d; best = k; } });
        if (best !== idx) setActive(best);
      });
    }, { passive: true });
    var uprev = g.querySelector('.ugal-arrow.prev'), unext = g.querySelector('.ugal-arrow.next');
    uprev && uprev.addEventListener('click', function () { centerOn(idx - 1); });
    unext && unext.addEventListener('click', function () { centerOn(idx + 1); });
    slides.forEach(function (s, k) { s.addEventListener('click', function () { if (k !== idx) centerOn(k); }); });
    markActive(0);
    requestAnimationFrame(function () { utrack.scrollLeft = slides[0].offsetLeft - (utrack.clientWidth - slides[0].offsetWidth) / 2; });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { loadNear(idx); ob.disconnect(); } }, { rootMargin: '400px' }).observe(g);
    } else { loadNear(0); }
  });

  // Reviews carousel arrows
  var track = document.getElementById('revTrack');
  if (track) {
    var step = function () {
      var card = track.querySelector('.rev-card');
      return card ? card.getBoundingClientRect().width + 24 : 360;
    };
    var prev = document.querySelector('[data-rev-prev]');
    var next = document.querySelector('[data-rev-next]');
    prev && prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next && next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  }
})();

// line icons
if(window.lucide&&window.lucide.createIcons){lucide.createIcons();}

// Cookie strip — stores consent in a real first-party cookie (so «мы используем cookie» is accurate)
(function(){
  var c=document.getElementById('cookie'), ok=document.getElementById('cookieOk');
  if(!c) return;
  var NAME='seredina_consent';
  function hasCookie(n){ return document.cookie.split('; ').indexOf(n+'=1') > -1; }
  function setCookie(n,v,days){ var d=new Date(); d.setTime(d.getTime()+days*864e5); document.cookie=n+'='+v+'; expires='+d.toUTCString()+'; path=/; SameSite=Lax'; }
  if(hasCookie(NAME)) c.classList.add('hide');
  ok&&ok.addEventListener('click',function(){ c.classList.add('hide'); setCookie(NAME,'1',365); });
})();
