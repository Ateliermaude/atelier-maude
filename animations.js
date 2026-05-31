(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ANIM_CLASSES = ['fade-in', 'fade-in-up', 'fade-in-left', 'fade-in-right'];
  var ANIM_SELECTOR = '.fade-in, .fade-in-up, .fade-in-left, .fade-in-right';

  function hasAnim(el) {
    return ANIM_CLASSES.some(function (c) { return el.classList.contains(c); });
  }

  // Auto-tag elements on pages without inline animation classes
  var AUTO = [
    '.product-card',
    '.sf-item',
    '.comp-col',
    '.collection-head',
    '.newsletter-inner',
    '.page-hero-inner',
    '.comparatif-title',
    '.journal-card',
    '.lookbook-img',
  ];

  AUTO.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (hasAnim(el)) return;
      el.classList.add('fade-in');
      if (el.parentElement) {
        var siblings = Array.from(el.parentElement.children).filter(function (c) {
          return c.matches && c.matches(sel);
        });
        var idx = siblings.indexOf(el);
        if (siblings.length > 1 && idx >= 1 && idx <= 3) {
          el.classList.add('stagger-' + idx);
        }
      }
    });
  });

  var els = document.querySelectorAll(ANIM_SELECTOR);
  if (!els.length) return;

  function activate(el) { el.classList.add('visible'); }

  // Show elements already in viewport on load
  els.forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) activate(el);
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { activate(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) {
      if (!el.classList.contains('visible')) obs.observe(el);
    });
  } else {
    els.forEach(activate);
  }
})();
