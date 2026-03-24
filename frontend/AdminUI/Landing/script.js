/* ════════════════════════════════════════════════════
   LoanPro Admin Landing — script.js
   Theme: Deep Teal (#0d7c6e / #14a899 / #ccfbf1)
   Three.js particle grid | GSAP parallax | Counters | Tilt
════════════════════════════════════════════════════ */

/* ─── Navbar scroll effect ─── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ─── Mobile nav ─── */
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

/* ─── Smooth scroll for # links ─── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ════════════════════════════════
   THREE.JS — Hero Particle Grid
   Deep Teal colour palette
════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.parentElement.offsetWidth;
  const H = canvas.parentElement.offsetHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.set(0, 0, 5);

  /* ── Particle grid — teal gradient ── */
  const COLS = 55, ROWS = 28;
  const positions = [], colors = [];

  // Deep teal range: #032620 → #14a899
  const col1 = new THREE.Color(0x0d7c6e);   // primary teal
  const col2 = new THREE.Color(0x14a899);   // light teal
  const col3 = new THREE.Color(0xccfbf1);   // tint (very light)

  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const px = (x / COLS - 0.5) * 18;
      const py = (y / ROWS - 0.5) * 9;
      const pz = (Math.random() - 0.5) * 2.5;
      positions.push(px, py, pz);

      // Vertical gradient: dark teal at bottom, tint at top
      const t = y / ROWS;
      let c;
      if (t < 0.5) {
        c = col1.clone().lerp(col2, t * 2);
      } else {
        c = col2.clone().lerp(col3, (t - 0.5) * 2);
      }
      // Slightly randomize brightness for sparkle
      const brightness = 0.5 + Math.random() * 0.5;
      colors.push(c.r * brightness, c.g * brightness, c.b * brightness);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ── Grid lines — subtle teal ── */
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x14a899,
    transparent: true,
    opacity: 0.07
  });
  const lineVerts = [];
  const posArr = geo.attributes.position.array;
  // Horizontal connections
  for (let col = 0; col < COLS - 1; col++) {
    for (let row = 0; row < ROWS; row++) {
      const i = (col * ROWS + row) * 3;
      const j = ((col + 1) * ROWS + row) * 3;
      lineVerts.push(
        posArr[i],   posArr[i+1],   posArr[i+2],
        posArr[j],   posArr[j+1],   posArr[j+2]
      );
    }
  }
  // Vertical connections
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS - 1; row++) {
      const i = (col * ROWS + row) * 3;
      const j = (col * ROWS + row + 1) * 3;
      lineVerts.push(
        posArr[i],   posArr[i+1],   posArr[i+2],
        posArr[j],   posArr[j+1],   posArr[j+2]
      );
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  /* ── Mouse parallax ── */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Animate ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;

    points.rotation.y = mouseX * 0.06 + Math.sin(t * 0.25) * 0.04;
    points.rotation.x = -mouseY * 0.04 + Math.cos(t * 0.18) * 0.025;

    // Subtle z-depth breathing
    const p = geo.attributes.position.array;
    for (let i = 2; i < p.length; i += 3) {
      p[i] += Math.sin(t + i * 0.1) * 0.0006;
    }
    geo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    const w = canvas.parentElement.offsetWidth;
    const h = canvas.parentElement.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}

/* ════════════════════════════════
   THREE.JS — CTA Mini Canvas
════════════════════════════════ */
function initCtaCanvas() {
  const canvas = document.getElementById('ctaCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const w = canvas.parentElement.offsetWidth;
  const h = canvas.parentElement.offsetHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(w, h);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 4;

  const pts = [], pColors = [];
  const c1 = new THREE.Color(0x0d7c6e);
  const c2 = new THREE.Color(0xccfbf1);
  for (let i = 0; i < 1000; i++) {
    pts.push((Math.random()-0.5)*12, (Math.random()-0.5)*7, (Math.random()-0.5)*3);
    const c = c1.clone().lerp(c2, Math.random());
    pColors.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute('color',    new THREE.Float32BufferAttribute(pColors, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.05, vertexColors: true, transparent: true, opacity: 0.55
  })));

  let ct = 0;
  (function anim() {
    requestAnimationFrame(anim);
    ct += 0.004;
    scene.rotation.z = Math.sin(ct * 0.25) * 0.08;
    scene.rotation.y = Math.cos(ct * 0.15) * 0.05;
    renderer.render(scene, camera);
  })();
}

/* ════════════════════════════════
   Scroll Reveal
════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ════════════════════════════════
   Animated Counters
════════════════════════════════ */
function animateCounter(el) {
  const target   = parseFloat(el.dataset.count);
  const suffix   = el.dataset.suffix || '';
  const duration = 1800;
  const start    = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const val      = Math.round(target * ease);
    el.textContent = val.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

/* ════════════════════════════════
   GSAP Scroll Animations
════════════════════════════════ */
function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero text gentle upward parallax
  gsap.to('.hero-text', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end:   'bottom top',
      scrub: true
    }
  });

  // Hero cards parallax (slower)
  gsap.to('.hero-cards', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end:   'bottom top',
      scrub: 1.5
    }
  });

  // Feature cards stagger from below
  gsap.utils.toArray('.feat-card').forEach((card, i) => {
    gsap.from(card, {
      y: 40, opacity: 0, duration: 0.7,
      delay: i * 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start:   'top 88%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Tool rows slide from right
  gsap.utils.toArray('.tool-row').forEach((row, i) => {
    gsap.from(row, {
      x: 50, opacity: 0, duration: 0.65,
      delay: i * 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: row,
        start:   'top 86%',
        toggleActions: 'play none none none'
      }
    });
  });
}

/* ════════════════════════════════
   CSS 3D Hover Tilt on Feature Cards
════════════════════════════════ */
function initTilt() {
  document.querySelectorAll('.feat-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      card.style.transform  = `perspective(700px) rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg) translateY(-6px)`;
      card.style.transition = 'transform 0.08s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.35s ease, box-shadow 0.28s, border-color 0.28s';
    });
  });
}

/* ─── Bootstrap ─── */
document.addEventListener('DOMContentLoaded', () => {
  console.log("Admin Landing Page initializing...");

  const initSteps = [
    { name: 'Hero Canvas', fn: initHeroCanvas },
    { name: 'CTA Canvas', fn: initCtaCanvas },
    { name: 'Scroll Reveal', fn: initReveal },
    { name: 'Counters', fn: initCounters },
    { name: 'GSAP', fn: initGSAP },
    { name: '3D Tilt', fn: initTilt }
  ];

  initSteps.forEach(step => {
    try {
      console.log(`Initializing ${step.name}...`);
      step.fn();
      console.log(`${step.name} initialized successfully.`);
    } catch (err) {
      console.error(`Error initializing ${step.name}:`, err);
    }
  });

  // Fallback for reveals if intersection observer fails or takes too long
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      console.warn("Forcing visibility for element:", el);
      el.classList.add('visible');
    });
  }, 3000);
});
