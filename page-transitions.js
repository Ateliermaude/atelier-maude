(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hide page immediately so the fade-in plays on every load
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.15s ease-out';

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
    setTimeout(function () { window.location.href = href; }, 150);
  });
})();

// Hover prefetch — preload internal pages after 65ms hover (instant.page technique)
(function () {
  var prefetched = new Set();
  var timer = null;
  var pendingUrl = null;

  function prefetch(url) {
    if (prefetched.has(url)) return;
    prefetched.add(url);
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  function resolveInternal(href) {
    if (!href) return null;
    if (href.charAt(0) === '#') return null;
    if (/^(mailto|tel|javascript):/.test(href)) return null;
    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      // Skip same-page navigations
      if (url.pathname === window.location.pathname &&
          url.search === window.location.search) return null;
      return url.href;
    } catch (_) { return null; }
  }

  document.addEventListener('mouseover', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var url = resolveInternal(link.getAttribute('href'));
    if (!url) return;
    pendingUrl = url;
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (pendingUrl === url) prefetch(url);
    }, 65);
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    if (!e.target.closest('a[href]')) return;
    clearTimeout(timer);
    pendingUrl = null;
  }, { passive: true });
})();
