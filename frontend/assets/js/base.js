        /* ═══════════════════════════════════════════════
           DATA
        ═══════════════════════════════════════════════ */
        const PRODUCTS = [
          { id: 1, bank: 'SBI', bankColor: '#1E40AF', bankBg: '#DBEAFE', type: 'Home Loan', rate: '8.40%', max: '₹75L', tenure: '30 yrs', featured: true },
          { id: 2, bank: 'HDFC', bankColor: '#065F46', bankBg: '#D1FAE5', type: 'Personal Loan', rate: '10.50%', max: '₹40L', tenure: '7 yrs', featured: false },
          { id: 3, bank: 'ICICI', bankColor: '#92400E', bankBg: '#FEF3C7', type: 'Education Loan', rate: '9.00%', max: '₹20L', tenure: '15 yrs', featured: false },
          { id: 4, bank: 'Axis', bankColor: '#6D28D9', bankBg: '#EDE9FE', type: 'Home Loan', rate: '8.75%', max: '₹60L', tenure: '25 yrs', featured: false },
          { id: 5, bank: 'Kotak', bankColor: '#BE185D', bankBg: '#FCE7F3', type: 'Personal Loan', rate: '10.99%', max: '₹35L', tenure: '5 yrs', featured: false },
          { id: 6, bank: 'PNB', bankColor: '#1D4ED8', bankBg: '#DBEAFE', type: 'Car Loan', rate: '7.90%', max: '₹15L', tenure: '7 yrs', featured: false },
        ];

        const LOANS = [
          { id: 'LN-2024-001', bank: 'SBI', type: 'Home Loan', amount: '₹45,00,000', date: 'Jan 15, 2024', status: 'accepted' },
          { id: 'LN-2024-008', bank: 'HDFC', type: 'Personal Loan', amount: '₹5,00,000', date: 'Mar 02, 2024', status: 'pending' },
          { id: 'LN-2024-011', bank: 'ICICI', type: 'Car Loan', amount: '₹8,50,000', date: 'Mar 18, 2024', status: 'pending' },
          { id: 'LN-2023-098', bank: 'Axis', type: 'Education Loan', amount: '₹12,00,000', date: 'Oct 05, 2023', status: 'rejected' },
          { id: 'LN-2023-055', bank: 'Kotak', type: 'Personal Loan', amount: '₹3,00,000', date: 'Jul 12, 2023', status: 'accepted' },
        ];

        const PAGE_META = {
          dashboard: { title: 'Dashboard', sub: 'Welcome back, User <i class="ph ph-hand-waving"></i>' },
          apply: { title: 'Apply for Loans', sub: 'Find the best loan for you' },
          loans: { title: 'My Loans', sub: 'Track your applications' },
          payments: { title: 'Payment History', sub: 'All your transactions' },
          emi: { title: 'EMI Calculator', sub: 'Plan your finances' },
          profile: { title: 'Profile', sub: 'Manage your account' },
          notifications: { title: 'Notifications', sub: 'Your alerts and updates' },
          help: { title: 'Help Center', sub: 'Find answers and guides' },
          contact: { title: 'Contact Us', sub: 'Get in touch with support' },
        };

        let currentLoan = null;
        let applyCurrentStep = 0;
        let loanTab = 'accepted';

        /* ═══════════════════════════════════════════════
           NAVIGATION & LAYOUT
        ═══════════════════════════════════════════════ */
        function toggleSidebar() {
          document.querySelector('.sidebar').classList.toggle('collapsed');
        }

        function initSidebarToggle() {
          const logo = document.querySelector('.sidebar-logo');
          if (logo) logo.addEventListener('click', toggleSidebar);
          
          document.querySelectorAll('.nav-item').forEach(item => {
            const label = item.querySelector('.nav-label');
            if(label) item.setAttribute('data-tooltip', label.textContent.trim());
          });
        }

        function showPage(id, btn) {
          document.querySelectorAll('.page-body').forEach(p => p.classList.remove('active'));
          document.getElementById('page-' + id).classList.add('active');
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          if (btn) btn.classList.add('active');
          const m = PAGE_META[id];
          document.getElementById('page-title').textContent = m.title;
          document.getElementById('page-sub').textContent = m.sub;
          if (id === 'apply') renderProducts();
          if (id === 'loans') renderLoansTable(loanTab);
          if (id === 'emi') { calcEMI(); setTimeout(renderEmiBarChart, 50); }
        }

        /* ═══════════════════════════════════════════════
           INTERVAL PILLS
        ═══════════════════════════════════════════════ */
        function selectInterval(el) {
          el.closest('.interval-group').querySelectorAll('.iv-pill').forEach(p => p.classList.remove('active'));
          el.classList.add('active');
        }


        function prefillApplyForm() {
  const map = {
    'app-fullname': [localStorage.getItem('firstname'), localStorage.getItem('lastname')].filter(Boolean).join(' '),
    'app-phone': localStorage.getItem('phoneno'),
    'app-email': localStorage.getItem('userEmail')
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  });
}/* ═══════════════════════════════════════════════
           MODAL & DROPDOWN HELPERS
        ═══════════════════════════════════════════════ */
        function openModal(id) { document.getElementById(id).classList.add('open'); }
        function closeModal(id) { document.getElementById(id).classList.remove('open'); }
        document.querySelectorAll('.modal-overlay').forEach(o => {
          o.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); });
        });

        function toggleNotifications() {
          const drop = document.getElementById('notif-drop');
          drop.style.display = drop.style.display === 'none' ? 'block' : 'none';
        }

        // Close dropdown if clicking outside
        document.addEventListener('click', function (event) {
          const drop = document.getElementById('notif-drop');
          const btn = event.target.closest('.icon-btn');
          if (drop && drop.style.display === 'block' && !drop.contains(event.target) && !btn) {
            drop.style.display = 'none';
          }
        });


        /* ═══════════════════════════════════════════════
           GLOBAL UI UPDATES (from localStorage)
        ═══════════════════════════════════════════════ */
        function updateUserUI() {
          const firstname = localStorage.getItem('firstname') || '';
          const lastname  = localStorage.getItem('lastname')  || '';
          const email     = localStorage.getItem('userEmail') || '';
          const fullName  = [firstname, lastname].filter(Boolean).join(' ') || 'User';
          const initial   = (firstname[0] || lastname[0] || '?').toUpperCase();

          // Sidebar Elements
          const sbName    = document.getElementById('sidebar-user-name');
          const sbAvatar  = document.getElementById('sidebar-avatar-letter');
          if (sbName)   sbName.textContent   = fullName;
          if (sbAvatar) sbAvatar.textContent  = initial;

          // Topbar Elements
          const tbSub     = document.getElementById('page-sub');
          if (tbSub) {
            // Only update welcome message if it looks like the default or is empty
            if (tbSub.innerHTML.includes('Welcome back') || tbSub.innerHTML === '') {
              tbSub.innerHTML = `Welcome back, ${firstname || 'User'} <i class="ph ph-hand-waving"></i>`;
            }
          }
        }

        /* ═══════════════════════════════════════════════
           ANIMATIONS — wired in on DOMContentLoaded
        ═══════════════════════════════════════════════ */

        /* ── 1. RIPPLE EFFECT ── */
        function addRipple(e) {
          const btn = e.currentTarget;
          const circle = document.createElement('span');
          circle.className = 'ripple-circle';
          const rect = btn.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height) * 2;
          circle.style.width = size + 'px';
          circle.style.height = size + 'px';
          circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
          circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
          btn.appendChild(circle);
          circle.addEventListener('animationend', () => circle.remove());
        }
        function initRipples() {
          document.querySelectorAll('.btn').forEach(btn => {
            btn.removeEventListener('click', addRipple);
            btn.addEventListener('click', addRipple);
          });
        }

        /* ── 2. DASHBOARD PAGE-LOAD STAGGER ── */
        function runDashboardStagger() {
          const groups = [
            '.stats-grid .stat-card',          // group 1 — stat cards
            '#page-dashboard .loan-hero',      // group 2 — loan hero
            '#page-dashboard .card',           // group 3 — other cards
          ];
          let delay = 0;
          const base = 80;  // ms between cards
          groups.forEach((selector, gi) => {
            document.querySelectorAll(selector).forEach((el, i) => {
              // avoid double-animating elements already staggered
              if (el.dataset.animated) return;
              el.dataset.animated = '1';
              el.classList.remove('anim-card');
              void el.offsetWidth; // reflow
              el.style.animationDelay = delay + 'ms';
              el.classList.add('anim-card');
              delay += base;
            });
            delay += 40; // extra gap between groups
          });
        }

        /* ── 3. PROGRESS BAR ANIMATE-IN ── */
        function animateProgBar() {
          const fill = document.querySelector('#page-dashboard .prog-fill');
          if (!fill) return;
          // Store current width, reset, then animate to it
          const targetW = fill.style.width || '18%';
          fill.style.width = '0%';
          fill.style.transition = 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
          setTimeout(() => { fill.style.width = targetW; }, 80);
        }

        /* ── 4. BELL SHAKE on load ── */
        function shakeBell() {
          const bell = document.querySelector('.topbar-right .icon-btn');
          if (!bell) return;
          bell.classList.remove('bell-shake');
          void bell.offsetWidth;
          bell.classList.add('bell-shake');
          bell.addEventListener('animationend', () => bell.classList.remove('bell-shake'), { once: true });
        }

        /* ── 5. TXN-ROW CLASS on dashboard transaction items ── */
        function initTxnRows() {
          document.querySelectorAll('#page-dashboard [style*="border-bottom"][style*="padding:12px 0"]').forEach(row => {
            row.classList.add('txn-row');
          });
        }

        /* ── 6. DATA TABLE ROW HOVER ANIMATION (My Loans / Payments) ── */
        function initTableRowHover() {
          document.querySelectorAll('.data-table tbody tr').forEach(tr => {
            tr.style.transition = 'background 0.15s ease, transform 0.15s ease';
            tr.addEventListener('mouseenter', () => { tr.style.transform = 'translateX(3px)'; });
            tr.addEventListener('mouseleave', () => { tr.style.transform = ''; });
          });
        }

        /* ── 7. CHART DRAW ANIMATION (Chart.js animation config already handles this; 
                ensure animation is ON for the dashboard chart) ── */
        // We patch initDashChart to add animation options — done via Chart defaults below:
        try {
          Chart.defaults.animation = Chart.defaults.animation || {};
          Chart.defaults.animation.duration = 1400;
          Chart.defaults.animation.easing = 'easeInOutQuart';
        } catch (e) { }

        /* ── INIT ALL ANIMATIONS ── */
        document.addEventListener('DOMContentLoaded', () => {
          updateUserUI(); // Populate global UI elements
          initRipples();
          runDashboardStagger();
          animateProgBar();
          shakeBell();
          initTxnRows();
          initSidebarToggle();
          // Re-run ripple init after dynamic content renders too
          setTimeout(initRipples, 800);
        });

        /* Re-init ripples whenever a new page is shown (dynamic buttons) */
        const _origShowPage = showPage;
        window.showPage = function (id, btn) {
          _origShowPage(id, btn);
          setTimeout(() => {
            initRipples();
            if (id === 'payments' || id === 'loans') setTimeout(initTableRowHover, 60);
            if (id === 'dashboard') {
              runDashboardStagger();
              animateProgBar();
            }
          }, 60);
        };

        
