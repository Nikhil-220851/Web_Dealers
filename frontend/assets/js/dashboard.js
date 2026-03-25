
/* ═══════════════════════════════════════════════
   BORROWER DASHBOARD — REAL-TIME DATA INTEGRATION
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('--- Borrower Dashboard Initializing ---');
    initDashboard();
});

async function initDashboard() {
    // Attempt to get userId from localStorage
    let userId = localStorage.getItem('userId');
    
    // Fallback search if userId not found (sometimes it might be stored differently)
    if (!userId) {
        const userEmail = localStorage.getItem('userEmail');
        console.warn('User ID not found, attempting to recover...');
        // In a real app we might fetch by email, but for now we expect userId
    }

    if (!userId) {
        console.error('User ID not found in localStorage');
        return;
    }

    console.log('Fetching dashboard data for user:', userId);

    // Fetch Notifications
    fetchNotifications(userId);

    try {
        const response = await fetch(`../../backend/api/get-dashboard-data.php?userId=${userId}`);
        const result = await response.json();
        
        console.log('Dashboard API Result:', result);

        if (result.status === 'success') {
            const data = result.data;
            updateWelcomeHeader(data.user);
            updateSummaryCards(data.summary);
            renderActiveLoansCarousel(data.activeLoans);
            renderRecentApplications(data.recentApplications);
            renderRecommendations(data.recommendations);
            updateEMIWidget(data.summary);
            initDashChart(data.activeLoans);
        } else {
            console.error('Failed to fetch dashboard data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function updateWelcomeHeader(user) {
    const welcomeSub = document.getElementById('page-sub');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarAvatar = document.getElementById('sidebar-avatar-letter');

    if (welcomeSub) {
        welcomeSub.innerHTML = `Welcome back, ${user.firstname} <i class="ph ph-hand-waving"></i>`;
    }
    if (sidebarName) {
        sidebarName.textContent = `${user.firstname} ${user.lastname}`;
    }
    if (sidebarAvatar && user.firstname) {
        sidebarAvatar.textContent = user.firstname.charAt(0).toUpperCase();
    }
}

function updateSummaryCards(summary) {
    if(document.getElementById('stat-total-loans')) document.getElementById('stat-total-loans').textContent = summary.totalLoans;
    if(document.getElementById('stat-active-loans')) document.getElementById('stat-active-loans').textContent = summary.activeLoans;
    if(document.getElementById('stat-pending-loans')) document.getElementById('stat-pending-loans').textContent = summary.pendingLoans;
    if(document.getElementById('stat-total-borrowed')) document.getElementById('stat-total-borrowed').textContent = `₹${Math.round(summary.totalAmount).toLocaleString('en-IN')}`;
}

/* ═══════════════════════════════════════════════
   ACTIVE LOANS CAROUSEL
═══════════════════════════════════════════════ */

let _carouselLoans = [];
let _currentLoanIndex = 0;

/**
 * Main entry point. Replaces the old renderActiveLoan().
 * Builds the carousel or the "no loan" placeholder as appropriate.
 */
function renderActiveLoansCarousel(activeLoans) {
    const wrapper  = document.getElementById('loan-cards-wrapper');
    const dotsRow  = document.getElementById('carousel-dots');
    const prevBtn  = document.getElementById('carousel-prev');
    const nextBtn  = document.getElementById('carousel-next');

    if (!wrapper) return;

    _carouselLoans = activeLoans || [];
    _currentLoanIndex = 0;

    /* ── 0 active loans ── */
    if (_carouselLoans.length === 0) {
        wrapper.innerHTML = `
            <div class="loan-hero" style="min-height:200px; display:flex; flex-direction:column; justify-content:space-between;">
                <div class="lh-top">
                    <span class="lh-badge">No Active Loan</span>
                </div>
                <div>
                    <div class="lh-amt-lbl">Ready to grow?</div>
                    <div class="lh-amt">Get a Loan</div>
                    <div style="margin-top:15px;">
                        <a href="apply-loan.html" class="btn btn-white btn-sm">Apply Now</a>
                    </div>
                </div>
            </div>`;
        if (prevBtn) prevBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        if (dotsRow)  dotsRow.classList.add('hidden');
        return;
    }

    /* ── 1 active loan (no navigation needed) ── */
    if (_carouselLoans.length === 1) {
        const track = document.createElement('div');
        track.className = 'loan-carousel-track';
        track.innerHTML = `<div class="loan-card-slide active-slide">${buildActiveLoanCard(_carouselLoans[0])}</div>`;
        wrapper.innerHTML = '';
        wrapper.appendChild(track);
        if (prevBtn) prevBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        if (dotsRow)  dotsRow.classList.add('hidden');
        return;
    }

    /* ── 2+ active loans — full carousel ── */
    if (prevBtn) prevBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (dotsRow)  dotsRow.classList.remove('hidden');

    // Build the sliding track
    const track = document.createElement('div');
    track.className = 'loan-carousel-track';
    track.id = 'carousel-track';

    _carouselLoans.forEach((loan, i) => {
        const slide = document.createElement('div');
        slide.className = 'loan-card-slide';
        slide.dataset.index = i;

        if (i === 0) {
            slide.innerHTML = buildActiveLoanCard(loan);
            slide.classList.add('active-slide');
        } else {
            slide.innerHTML = buildPlaceholderCard(loan, i);
            slide.classList.add('placeholder-slide');
            slide.addEventListener('click', () => {
                _currentLoanIndex = i;
                updateCarousel();
            });
        }
        track.appendChild(slide);
    });

    wrapper.innerHTML = '';
    wrapper.appendChild(track);

    // Build dot indicators
    dotsRow.innerHTML = _carouselLoans.map((_, i) =>
        `<span class="carousel-dot${i === 0 ? ' active-dot' : ''}" 
               data-i="${i}" 
               onclick="_currentLoanIndex=${i}; updateCarousel();"
               title="Loan ${i+1}"></span>`
    ).join('');

    // Touch / swipe support
    _initCarouselSwipe(wrapper);

    updateCarousel(false); // initial paint without animation
}

/**
 * Syncs visual state — slides the track, swaps classes, updates dots.
 * @param {boolean} [animate=true]  pass false for first paint
 */
function updateCarousel(animate = true) {
    const track  = document.getElementById('carousel-track');
    const dotsRow = document.getElementById('carousel-dots');
    const n = _carouselLoans.length;
    if (!track || n < 2) return;

    // Slide the track
    const offset = -(_currentLoanIndex * 100);
    track.style.transition = animate ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
    track.style.transform  = `translateX(${offset}%)`;

    // Update slide classes & rebuild card content for active → full card
    const slides = track.querySelectorAll('.loan-card-slide');
    slides.forEach((slide, i) => {
        const loan = _carouselLoans[i];
        if (i === _currentLoanIndex) {
            slide.classList.remove('placeholder-slide');
            slide.classList.add('active-slide');
            slide.innerHTML = buildActiveLoanCard(loan);
            slide.onclick = null;
        } else {
            slide.classList.remove('active-slide');
            slide.classList.add('placeholder-slide');
            slide.innerHTML = buildPlaceholderCard(loan, i);
            slide.onclick = () => { _currentLoanIndex = i; updateCarousel(); };
        }
    });

    // Update dots
    if (dotsRow) {
        dotsRow.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active-dot', i === _currentLoanIndex);
        });
    }
}

/** Navigate to next loan (loops) */
function carouselNext() {
    _currentLoanIndex = (_currentLoanIndex + 1) % _carouselLoans.length;
    updateCarousel();
}

/** Navigate to previous loan (loops) */
function carouselPrev() {
    _currentLoanIndex = (_currentLoanIndex - 1 + _carouselLoans.length) % _carouselLoans.length;
    updateCarousel();
}

/** Wire up touch swipe on the wrapper element */
function _initCarouselSwipe(el) {
    let startX = 0;
    el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) {
            dx < 0 ? carouselNext() : carouselPrev();
        }
    }, { passive: true });
}

/**
 * Builds the full gradient active loan card HTML (reuses existing .loan-hero styles).
 */
function buildActiveLoanCard(loan) {
    const repayPct = Math.min(100, Math.max(5, Math.round(
        (new Date() - new Date(loan.applied_date)) / (loan.tenure * 30.44 * 24 * 3600 * 1000) * 100 // Approximation using days in a month
    )));

    return `
        <div class="loan-hero">
            <div class="lh-top">
                <span class="lh-badge" style="text-transform:uppercase;">${loan.loan_type}</span>
                <span class="lh-status">Active</span>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top:20px;">
                <div>
                    <div class="lh-amt-lbl">Current Loan Amount</div>
                    <div class="lh-amt font-bold num-font" style="font-size:24px;">₹${Math.round(loan.amount).toLocaleString('en-IN')}</div>
                </div>
                <div>
                    <div class="lh-amt-lbl" style="text-align:right;">EMI Amount</div>
                    <div class="lh-amt font-bold text-primary num-font" style="font-size:24px; text-align:right;">₹${Math.round(loan.emi_amount || 0).toLocaleString('en-IN')}</div>
                </div>
            </div>

            <div class="lh-meta" style="margin-top:15px; background:rgba(255,255,255,0.05); padding:12px; border-radius:8px;">
                <div class="lh-meta-item"><label>Bank</label><span>${loan.bank_name}</span></div>
                <div class="lh-meta-item"><label>EMIs Paid</label><span class="num-font">${loan.total_emis_paid || 0} / ${loan.tenure}</span></div>
                <div class="lh-meta-item"><label>Remaining Bal.</label><span class="num-font">₹${Math.round(loan.remaining_balance !== undefined ? loan.remaining_balance : loan.amount).toLocaleString('en-IN')}</span></div>
            </div>
            
            <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div style="font-size:11px; color:var(--text3);">
                  <div style="text-transform: uppercase;">Loan Status</div>
                  <div class="font-bold" style="font-size:14px; color: ${loan.emi_status === 'overdue' ? 'var(--red)' : (loan.emi_status === 'paid' ? 'var(--green)' : 'var(--yellow)')}; text-transform: capitalize;">${loan.emi_status || 'Pending'}</div>
                </div>
                <button 
                  class="btn btn-primary w-full" 
                  style="width:auto; min-width:140px;" 
                  data-emi-pay-btn 
                  data-loan-id="${loan.id}"
                  onclick="startEmiFlow('${loan.id}')"
                  ${loan.remaining_emis === 0 || loan.emi_status === 'paid' ? 'disabled' : ''}>
                    ${loan.remaining_emis === 0 ? 'Loan Completed' : (loan.emi_status === 'paid' ? 'Paid for Cycle' : (loan.emi_status === 'overdue' ? 'Overdue - Pay Now' : 'Pay EMI'))}
                </button>
            </div>
        </div>`;
}

let currentLoanId = null;
let currentEmiAmount = null;

window.startEmiFlow = function(loanId) {
    if (!loanId) return;
    sessionStorage.setItem('payEmiLoanId', loanId);
    window.location.href = "../borrower/emi-payment.html";
};

// Timers removed in favor of strict status checking
function initEmiTimers() {
    // legacy function empty
}

// Re-init timers after carousel render
const _origUpdateCarousel = updateCarousel;
updateCarousel = function(animate = true) {
    _origUpdateCarousel(animate);
};

/**
 * Builds a ghost placeholder card for non-active slides.
 * Clicking it navigates to that loan.
 */
function buildPlaceholderCard(loan, idx) {
    return `
        <div class="loan-placeholder-card">
            <div>
                <div class="lp-badge">
                    <i class="ph ph-credit-card"></i>
                    ${loan.loan_type}
                </div>
                <div class="lp-lbl">Loan Amount</div>
                <div class="lp-amt num-font">₹${Math.round(loan.amount).toLocaleString('en-IN')}</div>
                <div class="lp-meta">
                    <div class="lp-meta-item"><label>Bank</label><span>${loan.bank_name}</span></div>
                    <div class="lp-meta-item"><label>Rate</label><span class="num-font">${loan.interest_rate}%</span></div>
                    <div class="lp-meta-item"><label>Tenure</label><span class="num-font">${loan.tenure} Yrs</span></div>
                </div>
            </div>
            <div class="lp-hint">
                <i class="ph ph-arrow-circle-right"></i>
                Click to view this loan
            </div>
        </div>`;
}



function renderRecentApplications(apps) {
    const list = document.getElementById('recent-apps-list');
    if (!list) return;
    
    if (!apps || apps.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-muted text-sm">No recent applications found.</div>';
        return;
    }

    list.innerHTML = apps.map(app => `
        <div class="txn-row" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px; height:36px; border-radius:10px; background:${getStatusBg(app.status)}; color:${getStatusColor(app.status)}; display:flex; align-items:center; justify-content:center; font-size:16px;">
                    <i class="ph ${getStatusIcon(app.status)}"></i>
                </div>
                <div>
                    <div class="font-semi text-sm">${app.loan_type} — ${app.bank_name}</div>
                    <div class="text-xs text-muted mt-8">${app.applied_date}</div>
                </div>
            </div>
            <div style="text-align:right">
                <div class="font-bold num-font">₹${Math.round(app.amount).toLocaleString('en-IN')}</div>
                <div class="text-xs" style="color:${getStatusColor(app.status)}; text-transform:capitalize">${app.status}</div>
            </div>
        </div>
    `).join('');
}

function renderRecommendations(recs) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    if (!recs || recs.length === 0) {
        container.innerHTML = '<div class="text-xs text-muted">No recommendations available.</div>';
        return;
    }

    container.innerHTML = recs.map(rec => `
        <div class="rec-card" onclick="window.location.href='apply-loan.html'">
            <div class="rec-icon" style="background:rgba(108,71,255,0.1); color:var(--primary);"><i class="ph ph-sparkle"></i></div>
            <div style="flex:1">
                <div class="font-semi text-sm">${rec.loan_type}</div>
                <div class="text-xs text-muted">${rec.bank_name}</div>
            </div>
            <div class="rec-rate">${rec.interest_rate}%</div>
        </div>
    `).join('');
}

function updateEMIWidget(summary) {
    const amountDisplay = document.getElementById('emi-amount-display');
    const badge = document.getElementById('emi-monthly-badge');
    const dateDisplay = document.getElementById('emi-date-display');

    if (summary.monthlyEMI > 0) {
        const formattedEMI = `₹${Math.round(summary.monthlyEMI).toLocaleString('en-IN')}`;
        if(amountDisplay) {
            amountDisplay.textContent = formattedEMI;
            amountDisplay.classList.add('num-font');
            amountDisplay.classList.remove('d-family');
        }
        if(badge) {
            badge.textContent = `${formattedEMI}/mo`;
            badge.classList.add('num-font');
        }
        
        let nextDueDate = 'N/A';
        // Check if there's any active loan to calculate the next date 
        // We'll rely on the global `_carouselLoans` that has standard structure
        let primaryLoan = _carouselLoans.find(l => l.status === 'active' || l.status === 'approved');
        if (primaryLoan && primaryLoan.loan_start_date) {
            let startDate = new Date(primaryLoan.loan_start_date);
            let totalMonths = primaryLoan.tenure * 12;
            let remaining = primaryLoan.remaining_emis !== undefined ? primaryLoan.remaining_emis : totalMonths;
            let paid = totalMonths - remaining;
            
            // Due date is next month after paid EMIs (mocking to 5th)
            startDate.setMonth(startDate.getMonth() + paid + 1);
            startDate.setDate(5);
            
            if (remaining > 0) {
               nextDueDate = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            } else {
               nextDueDate = 'Completed';
            }
        } else {
            // Fallback
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(5);
            nextDueDate = nextMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        
        if(dateDisplay) dateDisplay.textContent = nextDueDate;
    }
}

function initDashChart(activeLoans) {
    const ctx = document.getElementById('emiChart');
    if (!ctx) return;

    // Default data if no active loans
    let labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    if (activeLoans && activeLoans.length > 0) {
        // Simple projection: same EMI for next 12 months
        const monthlyEMI = activeLoans.reduce((sum, loan) => {
            const P = loan.amount;
            const r = (loan.interest_rate / 100) / 12;
            const n = loan.tenure * 12;
            if (r > 0 && n > 0) {
                return sum + ((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
            }
            return sum;
        }, 0);
        
        values = values.map(() => Math.round(monthlyEMI));
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderColor: '#6C47FF', borderWidth: 2.5,
                pointRadius: 2, pointHoverRadius: 5,
                pointHoverBackgroundColor: '#6C47FF',
                pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
                fill: true,
                backgroundColor: (ctx2) => {
                    const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 160);
                    g.addColorStop(0, 'rgba(108,71,255,0.18)');
                    g.addColorStop(1, 'rgba(108,71,255,0.01)');
                    return g;
                },
                tension: 0.4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, 
                tooltip: {
                    backgroundColor: '#fff', titleColor: '#1A1433', bodyColor: '#6C47FF',
                    borderColor: '#E4E0F5', borderWidth: 1, padding: 10,
                    callbacks: { label: ctx3 => '  ₹' + ctx3.raw.toLocaleString('en-IN') }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9B94B8', font: { size: 10 } } },
                y: { 
                    grid: { color: '#E4E0F5', borderDash: [5, 5] }, 
                    ticks: { color: '#9B94B8', font: { size: 10 }, callback: v => '₹' + (v / 1000).toFixed(1) + 'K' } 
                }
            }
        }
    });
}

// Helpers for status styling
function getStatusBg(status) {
    if (!status) return 'var(--border)';
    status = status.toLowerCase();
    if (status === 'active' || status === 'approved') return 'var(--green-bg)';
    if (status === 'pending') return 'var(--yellow-bg)';
    if (status === 'rejected') return 'var(--red-bg)';
    return 'var(--border)';
}

function getStatusColor(status) {
    if (!status) return 'var(--text3)';
    status = status.toLowerCase();
    if (status === 'active' || status === 'approved') return 'var(--green)';
    if (status === 'pending') return 'var(--yellow)';
    if (status === 'rejected') return 'var(--red)';
    return 'var(--text3)';
}

function getStatusIcon(status) {
    if (!status) return 'ph-question';
    status = status.toLowerCase();
    if (status === 'active' || status === 'approved') return 'ph-check-circle';
    if (status === 'pending') return 'ph-clock';
    if (status === 'rejected') return 'ph-x-circle';
    return 'ph-question';
}

/* ═══════════════════════════════════════════════
   NOTIFICATIONS LOGIC
═══════════════════════════════════════════════ */
async function fetchNotifications(userId) {
    try {
        const response = await fetch(`../../backend/api/get-notifications.php?userId=${userId}`);
        const result = await response.json();
        if (result.status === 'success') {
            renderNotifications(result.data, result.unread_count);
            renderNotificationsPage(result.data);
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

function renderNotifications(notifications, unreadCount) {
    const notifDrop = document.getElementById('notif-drop');
    const notifDot = document.querySelector('.notif-dot');
    
    if (notifDot) {
        if (unreadCount > 0) {
            notifDot.style.display = 'block';
        } else {
            notifDot.style.display = 'none';
        }
    }
    
    if (!notifDrop) return;
    
    const listContainer = notifDrop.querySelector('div[style*="max-height"]');
    if (!listContainer) return;
    
    if (!notifications || notifications.length === 0) {
        listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">No new notifications.</div>';
        return;
    }
    
    listContainer.innerHTML = notifications.slice(0, 5).map(notif => {
        let icon = 'ph-bell';
        let bg = 'var(--surface)';
        let color = 'var(--text)';
        
        if (notif.type === 'approval') { icon = 'ph-check-circle'; bg = 'rgba(34, 197, 94, 0.1)'; color = '#22C55E'; }
        else if (notif.type === 'rejection') { icon = 'ph-x-circle'; bg = 'rgba(239, 68, 68, 0.1)'; color = '#EF4444'; }
        else if (notif.type === 'loan_applied') { icon = 'ph-file-text'; bg = 'rgba(59, 130, 246, 0.1)'; color = '#3B82F6'; }
        else if (notif.type.includes('emi')) { icon = 'ph-calendar-blank'; bg = 'rgba(108, 71, 255, 0.1)'; color = '#6C47FF'; }
        
        return `
        <div style="padding:14px 18px; border-bottom:1px solid var(--border); display:flex; gap:12px; cursor:pointer;" class="notif-item" onclick="markNotificationRead('${notif.id}')">
            <div style="width:36px; height:36px; border-radius:50%; background:${bg}; color:${color}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="ph ${icon}"></i>
            </div>
            <div style="flex:1;">
                <div class="text-sm font-semi" style="${!notif.is_read ? 'font-weight:700;' : 'font-weight:500; opacity:0.8;'}">${notif.type.replace('_', ' ').toUpperCase()}</div>
                <div class="text-xs" style="margin-top:4px; ${!notif.is_read ? 'color:var(--text);' : 'color:var(--text-muted);'}">${notif.message}</div>
                ${(notif.type === 'approval' || notif.type === 'rejection') && notif.remarks && notif.remarks !== 'None' ? `<div class="text-xs" style="margin-top:4px; color:var(--text3); font-style:italic;">Note: ${notif.remarks}</div>` : ''}
                <div class="text-xs text-muted" style="margin-top:6px">${notif.created_at}</div>
            </div>
            ${!notif.is_read ? '<div style="width:8px; height:8px; border-radius:50%; background:var(--primary); margin-top:5px; flex-shrink:0;"></div>' : ''}
        </div>
        `;
    }).join('');
}

function renderNotificationsPage(notifications) {
    const pageContainer = document.getElementById('notifications-list');
    if (!pageContainer) return;

    if (!notifications || notifications.length === 0) {
        pageContainer.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">You have no notifications yet.</div>';
        return;
    }

    pageContainer.innerHTML = notifications.map(notif => {
        let icon = 'ph-bell';
        let bg = 'var(--surface)';
        let color = 'var(--text)';
        
        if (notif.type === 'approval') { icon = 'ph-check-circle'; bg = 'rgba(34, 197, 94, 0.1)'; color = '#22C55E'; }
        else if (notif.type === 'rejection') { icon = 'ph-x-circle'; bg = 'rgba(239, 68, 68, 0.1)'; color = '#EF4444'; }
        else if (notif.type === 'loan_applied') { icon = 'ph-file-text'; bg = 'rgba(59, 130, 246, 0.1)'; color = '#3B82F6'; }
        else if (notif.type.includes('emi')) { icon = 'ph-calendar-blank'; bg = 'rgba(108, 71, 255, 0.1)'; color = '#6C47FF'; }

        return `
        <div class="notif-page-item" style="padding:20px; border-bottom:1px solid var(--border); display:flex; gap:16px; align-items:flex-start; cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background='transparent'" onclick="markNotificationRead('${notif.id}')">
            <div style="width:48px; height:48px; border-radius:12px; background:${bg}; color:${color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size: 24px;">
                <i class="ph ${icon}"></i>
            </div>
            <div style="flex:1;">
                <div class="text-base font-bold" style="${!notif.is_read ? 'color:var(--text);' : 'color:var(--text-muted); font-weight:600;'}">${notif.type.replace('_', ' ').toUpperCase()}</div>
                <div class="text-sm" style="margin-top:6px; ${!notif.is_read ? 'color:var(--text-secondary);' : 'color:var(--text-muted);'}">${notif.message}</div>
                ${(notif.type === 'approval' || notif.type === 'rejection') ? `
                    <div class="text-sm" style="margin-top:12px; padding:12px; background:var(--surface2); border-radius:8px; border-left:4px solid ${color};">
                        <span class="font-bold" style="display:block; margin-bottom:4px; font-size:12px; opacity:0.7;">ADMIN REMARKS</span>
                        <div style="line-height:1.5;">${notif.remarks || 'None'}</div>
                    </div>
                ` : ''}
                <div class="text-xs font-semi" style="margin-top:10px; color:var(--text-muted);">${notif.created_at}</div>
            </div>
            ${!notif.is_read ? '<div class="badge badge-purple" style="font-size: 10px;">New</div>' : ''}
        </div>
        `;
    }).join('');
}

async function markNotificationRead(notifId) {
    let userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const response = await fetch('../../backend/api/mark-notification-read.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({notification_id: notifId, user_id: userId})
        });
        const result = await response.json();
        if (result.status === 'success') {
            fetchNotifications(userId); // Refresh the lists
        }
    } catch(err) {
        console.error('Error marking notification read:', err);
    }
}
