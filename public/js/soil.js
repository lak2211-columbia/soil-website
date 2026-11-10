/* SOIL public site. Plain JavaScript, no dependencies. */
(function () {
  /* Photo loader: try each candidate URL in turn; if all fail the drawing stays visible. */
  document.querySelectorAll('img[data-cands]').forEach(function (img) {
    var cands;
    try { cands = JSON.parse(img.getAttribute('data-cands')); } catch (e) { return; }
    var i = 0;
    function tryNext() {
      if (i >= cands.length) { img.removeAttribute('src'); return; }
      var url = cands[i++];
      var probe = new Image();
      probe.onload = function () { img.src = url; img.classList.add('loaded'); };
      probe.onerror = tryNext;
      probe.referrerPolicy = 'no-referrer';
      probe.src = url;
    }
    tryNext();
  });

  /* Header hides while scrolling down and returns on scroll up. */
  var header = document.getElementById('site-header');
  var last = window.pageYOffset;
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    if (y > last && y > 120) header.classList.add('hidden'); else header.classList.remove('hidden');
    last = y;
  }, { passive: true });

  /* Sections fade in as they scroll into view. */
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* Palette switcher, remembered for this visitor. */
  var buttons = document.querySelectorAll('.palette-bar .swatch');
  function setPalette(p) {
    document.documentElement.setAttribute('data-palette', p);
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-p') === p ? 'true' : 'false'); });
  }
  try { var saved = localStorage.getItem('soil-palette'); if (saved) setPalette(saved); } catch (e) {}
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = btn.getAttribute('data-p');
      setPalette(p);
      try { localStorage.setItem('soil-palette', p); } catch (e) {}
    });
  });

  /* Newsletter signup without leaving the page (the form also works without JavaScript). */
  document.querySelectorAll('form[data-subscribe]').forEach(function (form) {
    var status = form.parentNode.querySelector('.news-status');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var button = form.querySelector('button');
      button.disabled = true;
      status.textContent = '';
      fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email: form.email.value, website: form.website.value }),
      }).then(function (r) { return r.json(); }).then(function (res) {
        status.textContent = res.message || (res.ok ? 'Thank you — you’re on the list.' : 'Something went wrong. Please try again.');
        if (res.ok) form.reset();
      }).catch(function () {
        status.textContent = 'Something went wrong. Please try again.';
      }).finally(function () { button.disabled = false; });
    });
  });
})();
