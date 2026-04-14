/* =============================================
   HAWK ACADEMY - Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Nav Toggle ---
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // --- Testimonial Carousel ---
  const carousel = document.querySelector('.testimonials__carousel');
  const prevBtn = document.querySelector('.testimonials__carousel-btn--prev');
  const nextBtn = document.querySelector('.testimonials__carousel-btn--next');

  if (carousel && prevBtn && nextBtn) {
    const scrollAmount = 364; // card width + gap

    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // --- Header scroll effect ---
  const header = document.querySelector('.header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // --- Active nav link highlighting ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentPath = window.location.pathname;
  const isResourcePage = currentPath.includes('/resources') || currentPath.includes('/tools/') || currentPath.includes('/blog/');

  document.querySelectorAll('.header__nav > a, .header__nav-item > a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefPage = href.split('#')[0];
    if (hrefPage === currentPage || (currentPage === '' && hrefPage === 'index.html')) {
      link.classList.add('active');
    }
    // Mark Resources as active when on any resource sub-page
    if (isResourcePage && (hrefPage === 'resources.html' || hrefPage === '../resources.html')) {
      link.classList.add('active');
    }
  });

});
