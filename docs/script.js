(function () {
  'use strict';
  const header = document.querySelector('.site-header');
  const reveal = document.querySelectorAll('.reveal');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    reveal.forEach(function (node) { observer.observe(node); });
  } else {
    reveal.forEach(function (node) { node.classList.add('is-visible'); });
  }
})();
