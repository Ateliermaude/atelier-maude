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

  // Close on Escape key — menu AND any visible popup
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenu();
      var popup = document.querySelector('.popup-overlay.show');
      if (popup) popup.classList.remove('show');
    }
  });
})();

// Keyboard-accessible nav dropdowns
// Note: focusin is skipped on touch devices — the touch IIFE handles those.
(function () {
  var isTouch = window.matchMedia('(hover: none)');

  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var trigger = dropdown.querySelector(':scope > a');
    var menu = dropdown.querySelector('.dropdown-menu');
    if (!trigger || !menu) return;

    function openDropdown() {
      dropdown.classList.add('nav-dropdown--open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    function closeDropdown() {
      dropdown.classList.remove('nav-dropdown--open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    dropdown.addEventListener('focusin', function () {
      if (!isTouch.matches) openDropdown();
    });
    dropdown.addEventListener('focusout', function (e) {
      if (!dropdown.contains(e.relatedTarget)) closeDropdown();
    });
    dropdown.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDropdown(); trigger.focus(); }
    });
  });
})();

// Touch dropdown toggle (tablettes tactiles ≥ 769px)
// Sur ces appareils le CSS :hover ne se déclenche pas fiablement ;
// on bascule .nav-dropdown--open au tap, et on laisse le second tap naviguer.
(function () {
  var isTouch = window.matchMedia('(hover: none)');

  function closeAll(except) {
    document.querySelectorAll('.nav-dropdown--open').forEach(function (d) {
      if (d === except) return;
      d.classList.remove('nav-dropdown--open');
      var t = d.querySelector(':scope > a');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var trigger = dropdown.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      // Only intercept on touch devices wider than the mobile nav breakpoint
      if (!isTouch.matches || window.innerWidth <= 768) return;

      if (dropdown.classList.contains('nav-dropdown--open')) {
        // Already open — close and let navigation happen
        dropdown.classList.remove('nav-dropdown--open');
        trigger.setAttribute('aria-expanded', 'false');
        // Do NOT preventDefault: allow the link to navigate
      } else {
        // Not open — open the dropdown first
        e.preventDefault();
        closeAll(dropdown);
        dropdown.classList.add('nav-dropdown--open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close all dropdowns when tapping outside
  document.addEventListener('click', function (e) {
    if (!isTouch.matches) return;
    if (!e.target.closest('.nav-dropdown')) closeAll(null);
  });
})();
