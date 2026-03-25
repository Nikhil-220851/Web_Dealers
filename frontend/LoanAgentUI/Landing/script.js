/* ════════════════════════════════════════════════════
   LoanPro Agent Landing — script.js
   Dynamic interactions & Count-up animations
════════════════════════════════════════════════════ */

// 1. Scroll Reveal Logic
function initReveal() {
  const options = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); 
      }
    });
  }, options);

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

// 2. Count-Up Animation Logic
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  
  const animate = (counter) => {
    const target = +counter.getAttribute('data-target');
    const prefix = counter.getAttribute('data-prefix') || '';
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 2000; // 2 seconds
    const start = performance.now();

    const updateCount = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Power3 easeOut function
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;

      if (target % 1 === 0) {
        counter.innerText = prefix + Math.floor(current).toLocaleString() + suffix;
      } else {
        counter.innerText = prefix + current.toFixed(1) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        counter.innerText = prefix + target.toLocaleString() + suffix;
      }
    };

    requestAnimationFrame(updateCount);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

// 3. Navbar Scroll Effects
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.height = '74px';
      navbar.style.boxShadow = '0 10px 40px rgba(0,0,0,0.12)';
      navbar.style.background = 'rgba(255, 255, 255, 0.98)';
      navbar.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
    } else {
      navbar.style.height = '84px';
      navbar.style.boxShadow = 'none';
      navbar.style.background = 'rgba(255, 255, 255, 0.85)';
      navbar.style.borderBottom = '1px solid #e2e8f0';
    }
  });
}

// 4. Smooth Anchor Scrolling
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 84,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 5. Hero Button Hover Effects (additional scale)
function initInteractions() {
    const btns = document.querySelectorAll('.primary-btn, .secondary-btn');
    btns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-3px) scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCounters();
  initNavbar();
  initSmoothScroll();
  initInteractions();
});
