(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  // Inject cursor:none before first render — runs synchronously in <head>
  var style = document.createElement('style');
  style.textContent = '* { cursor: none !important; }';
  document.head.appendChild(style);

  window.addEventListener('DOMContentLoaded', function () {
    var el = document.createElement('div');
    el.style.cssText =
      'position:fixed;top:-20px;left:-20px;' +
      'width:10px;height:10px;border-radius:50%;' +
      'background:#8B4A3A;pointer-events:none;z-index:99999;' +
      'transform:translate(-50%,-50%);opacity:0;' +
      'transition:width .2s ease-out,height .2s ease-out,opacity .15s ease-out;';
    document.body.appendChild(el);

    var visible = false;

    document.addEventListener('mousemove', function (e) {
      el.style.left = e.clientX + 'px';
      el.style.top  = e.clientY + 'px';
      if (!visible) { el.style.opacity = '1'; visible = true; }
      var over = !!e.target.closest('a, button, [role="button"], input, select, textarea, label');
      el.style.width  = over ? '20px' : '10px';
      el.style.height = over ? '20px' : '10px';
    });

    document.addEventListener('mouseleave', function () { el.style.opacity = '0'; visible = false; });
    document.addEventListener('mouseenter', function () { el.style.opacity = '1'; visible = true; });
  });
})();
