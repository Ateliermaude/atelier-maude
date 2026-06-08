(function () {
  function shimmer(container, img) {
    if (!container || !img) return;
    // Already loaded from cache — skip
    if (img.complete && img.naturalWidth > 0) return;

    container.classList.add('img-loading');

    img.addEventListener('load', function () {
      container.classList.add('img-loaded');
    }, { once: true });

    img.addEventListener('error', function () {
      container.classList.remove('img-loading');
    }, { once: true });
  }

  // Collection pages: each .product-img wraps one visible img
  document.querySelectorAll('.product-img').forEach(function (c) {
    shimmer(c, c.querySelector('img'));
  });

  // Product pages: main gallery (use the .active img as the trigger)
  var main = document.querySelector('.gallery-main');
  if (main) {
    shimmer(main, main.querySelector('img.active') || main.querySelector('img'));
  }

  // Product pages: each thumbnail
  document.querySelectorAll('.gallery-thumb').forEach(function (c) {
    shimmer(c, c.querySelector('img'));
  });
})();
