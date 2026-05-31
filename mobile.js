(function () {
  var menuBtn = document.querySelector('.header-btn[aria-label="Menu"]');
  var nav = document.querySelector('.site-nav');
  if (!menuBtn || !nav) return;

  // Inject close button inside nav
  var closeBtn = document.createElement('button');
  closeBtn.className = 'nav-close-btn';
  closeBtn.setAttribute('aria-label', 'Fermer le menu');
  closeBtn.innerHTML = '&times;';
  nav.insertBefore(closeBtn, nav.firstChild);

  function openMenu() {
    nav.classList.add('nav-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('nav-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', function () {
    nav.classList.contains('nav-open') ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();
