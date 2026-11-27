(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!toggle || !sidebar) return;

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      sidebar.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('is-open'));
    });
    if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('[data-nav]')) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
    window.addEventListener('hashchange', function () { setOpen(false); });
  });
})();
