(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Auto-tag key elements that don't already have fade-in
  [
    '.product-card', '.sf-item', '.comp-col', '.collection-head',
    '.newsletter-inner', '.page-hero-inner', '.comparatif-title',
    '.journal-card', '.lookbook-img', '.editorial-content',
    '.reassurance-item', '.upsell-card',
  ].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (!el.classList.contains('fade-in')) el.classList.add('fade-in');
    });
  });

  // Show elements already in viewport on load
  document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right').forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, {threshold: 0.1});

  document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right').forEach(el => observer.observe(el));
})();
