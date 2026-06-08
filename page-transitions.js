(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hide page immediately so the fade-in plays on every load
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.3s ease-out';

  // Fade in once the DOM is ready
  window.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
      document.documentElement.style.opacity = '1';
    });
  });

  // Restore opacity when page is restored from bfcache (back/forward)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) document.documentElement.style.opacity = '1';
  });

  // Fade out before navigating to an internal page
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#') return;
    if (/^(mailto|tel|javascript):/.test(href)) return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, different hash only — let the browser handle it
      if (url.pathname === window.location.pathname &&
          url.search === window.location.search) return;
    } catch (_) { return; }

    e.preventDefault();
    document.documentElement.style.opacity = '0';
    setTimeout(function () { window.location.href = href; }, 300);
  });
})();
