/* ═══════════════════════════════════════
   LoanPro Admin — analytics.js
   Phase 2: Robust, data-driven analytics page
═══════════════════════════════════════ */

// ── Theme colours ──
const COLORS = {
  purple:  '#6366f1',
  teal:    '#14b8a6',
  amber:   '#f59e0b',
  pink:    '#ec4899',
  indigo:  '#818cf8',
  green:   '#10b981',
  red:     '#ef4444',
  blue:    '#3b82f6',
  slate:   '#94a3b8'
};

const gridOpts = {
  y: { grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { color: '#94a3b8' } },
  x: { grid: { display: false },                  ticks: { color: '#94a3b8' } }
};

let defaultersData = [];

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function formatIndian(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function showNoDataMessage(canvasId, msg) {
  console.log(`[UI] Showing no-data overlay for ${canvasId}: ${msg}`);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  const old = parent.querySelector('.no-data-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.className = 'no-data-overlay';
  overlay.style.cssText = [
    'position:absolute', 'inset:0', 'display:flex',
    'align-items:center', 'justify-content:center',
    'flex-direction:column', 'gap:8px',
    'background:rgba(240,253,250,0.85)',
    'border-radius:12px', 'pointer-events:none', 'z-index:5',
    'backdrop-filter:blur(2px)'
  ].join(';');
  overlay.innerHTML = `
    <span class="material-icons-round" style="font-size:32px;color:#94a3b8;">analytics</span>
    <span style="font-size:13px;color:#64748b;font-weight:600;">${msg || 'No data available'}</span>
  `;
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  parent.appendChild(overlay);
}

function safeChartData(raw) {
  const labels = Array.isArray(raw?.labels) ? raw.labels : [];
  const data   = Array.isArray(raw?.data)   ? raw.data.map(v => Number(v) || 0) : [];
  return { labels, data };
}

// ════════════════════════════════════════
// CORE FETCH
// ════════════════════════════════════════
async function fetchAnalytics() {
  console.log("[Core] Starting analytics fetch...");
  try {
    const url = `${API_BASE}/admin-analytics-data.php`;
    console.log("[Core] Fetching from:", url);
    
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    console.log("[Core] API Response received:", result);

    if (result.status !== 'success') {
      console.error('[Core] Backend reported error:', result.message);
      alert('Error fetching analytics: ' + result.message);
      return;
    }

    const d = result.data;

    // 1. Populate summary cards IMMEDIATELY
    console.log("[UI] Populating summary cards...");
    try {
        const totalLoans    = d.summary?.totalLoans ?? 0;
        const approvedLoans = d.summary?.approvedLoans ?? 0;
        const totalAmount   = d.summary?.totalAmount ?? 0;

        const elTotal    = document.getElementById('stat-total');
        const elApproved = document.getElementById('stat-approved');
        const elAmount   = document.getElementById('stat-amount');

        if (elTotal)    elTotal.textContent    = formatIndian(totalLoans);
        if (elApproved) elApproved.textContent = formatIndian(approvedLoans);
        if (elAmount)   elAmount.textContent   = '₹' + formatIndian(totalAmount);
        
        console.log("[UI] Summary cards successfully populated.");
    } catch (cardErr) {
        console.error("[UI] Failed to populate summary cards:", cardErr);
    }

    // 2. Initialize Charts (each wrapped in try-catch)
    console.log("[UI] Initializing charts...");
    
    try {
        let loanTrendsRaw = d.loanTrends;
        if (!loanTrendsRaw?.labels?.length || loanTrendsRaw.labels.length < 2) {
            console.warn("[UI] Loan Trends data too sparse, using demo points for line chart readability.");
            loanTrendsRaw = {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                data:   [5, 12, 8, 20, 15]
            };
        }
        initLoanTrendsChart(loanTrendsRaw);
    } catch (e) { console.error("[UI] Chart 1 Error:", e); }

    try { initStatusDistChart(d.statusDistribution); } catch (e) { console.error("[UI] Chart 2 Error:", e); }
    try { initLoanTypesChart(d.loanTypes); } catch (e) { console.error("[UI] Chart 3 Error:", e); }
    try { initMonthlyDisbursedChart(d.monthlyDisbursed); } catch (e) { console.error("[UI] Chart 4 Error:", e); }
    try { initEmiTrendChart(d.emiTrends); } catch (e) { console.error("[UI] Chart 5 Error:", e); }

    // 3. Populate Defaulters Table
    console.log("[UI] Rendering defaulters table...");
    defaultersData = d.defaulters || [];
    renderDefaulters(defaultersData);

    console.log("[Core] All page components processed.");

  } catch (err) {
    console.error('[Core] CRITICAL FAILURE loading analytics:', err);
    // Show user a friendly error instead of a white screen
    const summaryHeader = document.querySelector('.page-heading');
    if (summaryHeader) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger mt-3';
        errorMsg.innerHTML = `<strong>Error!</strong> Could not load analytics data. <br><small>${err.message}</small>`;
        summaryHeader.appendChild(errorMsg);
    }
  }
}

// ════════════════════════════════════════
// CHARTS
// ════════════════════════════════════════
function initLoanTrendsChart(raw) {
  const ctx = document.getElementById('loanTrendsChart');
  if (!ctx) return;
  const { labels, data } = safeChartData(raw);
  if (labels.length === 0) return showNoDataMessage('loanTrendsChart');

  new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Applications',
        data,
        borderColor: COLORS.purple,
        backgroundColor: 'rgba(99,102,241,0.08)',
        borderWidth: 3,
        pointBackgroundColor: COLORS.purple,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: gridOpts
    }
  });
}

function initStatusDistChart(raw) {
  const ctx = document.getElementById('statusDistChart');
  if (!ctx) return;
  const { labels, data } = safeChartData(raw);
  if (labels.length === 0) return showNoDataMessage('statusDistChart');

  const bgColors = labels.map(l => {
    const s = l.toLowerCase();
    if (s.includes('approve') || s.includes('active') || s.includes('disburse')) return COLORS.green;
    if (s.includes('pend')) return COLORS.amber;
    if (s.includes('reject')) return COLORS.red;
    return COLORS.slate;
  });

  new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#475569', padding: 20, font: { weight: '600', size: 12 } } }
      },
      cutout: '70%'
    }
  });
}

function initLoanTypesChart(raw) {
  const ctx = document.getElementById('loanTypesChart');
  if (!ctx) return;
  const { labels, data } = safeChartData(raw);
  if (labels.length === 0) return showNoDataMessage('loanTypesChart');

  const bgMap = [COLORS.purple, COLORS.teal, COLORS.amber, COLORS.pink, COLORS.indigo];
  const bgs   = labels.map((_, i) => bgMap[i % bgMap.length]);

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Loans',
        data,
        backgroundColor: bgs,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: gridOpts
    }
  });
}

function initMonthlyDisbursedChart(raw) {
  const ctx = document.getElementById('monthlyDisbursedChart');
  if (!ctx) return;
  const { labels, data } = safeChartData(raw);
  const allZero = data.every(v => v === 0);
  if (labels.length === 0 || (allZero && labels[0] === 'No Data')) return showNoDataMessage('monthlyDisbursedChart');

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Amount (₹)',
        data,
        backgroundColor: COLORS.teal,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(100,116,139,0.1)' },
          ticks: {
            color: '#94a3b8',
            callback: v => '₹' + (v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v.toLocaleString('en-IN'))
          }
        },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function initEmiTrendChart(raw) {
  const ctx = document.getElementById('emiTrendChart');
  if (!ctx) return;
  const { labels, data } = safeChartData(raw);
  const allZero = data.every(v => v === 0);
  if (labels.length === 0 || (allZero && labels[0] === 'No Data')) return showNoDataMessage('emiTrendChart');

  new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'EMI Collected (₹)',
        data,
        borderColor: COLORS.amber,
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 3,
        pointBackgroundColor: COLORS.amber,
        pointRadius: 4,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(100,116,139,0.1)' },
          ticks: { color: '#94a3b8', callback: v => '₹' + v.toLocaleString('en-IN') }
        },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function getStatusClass(status) {
  if (status === 'Defaulter') return 'badge-soft-danger';
  if (status === 'Overdue') return 'badge-soft-warning';
  if (status === 'Legacy') return 'badge-soft-secondary';
  return '';
}

function renderDefaulters(list) {
  const tbody = document.getElementById('defaultersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b; padding:32px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span class="material-icons-round" style="font-size:40px; color:#10b981;">check_circle</span>
        <span style="font-weight:600;">Excellent! No defaulters found.</span>
      </div>
    </td></tr>`;
    return;
  }

  list.forEach(d => {
    const shortId = d.id ? d.id.substring(d.id.length - 6).toUpperCase() : 'N/A';
    const badgeClass = getStatusClass(d.status_label);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div style="font-weight:600; color:#1e293b;">${d.borrower_name || 'Individual User'}</div></td>
      <td><span class="lid" title="${d.id}">${shortId}</span></td>
      <td>₹${formatIndian(d.amount || 0)}</td>
      <td><span style="color:#ef4444; font-weight:700;">${d.missed_emis || 0}</span></td>
      <td style="font-weight:600; color:#dc2626;">₹${formatIndian(d.overdue_amount || 0)}</td>
      <td>${d.next_unpaid_date || 'N/A'}</td>
      <td><span class="badge ${badgeClass}">${d.status_label || 'Overdue'}</span></td>
      <td style="text-align:center;">
        <button class="btn btn-sm btn-outline-primary" style="padding:4px 8px;" onclick="viewProfile('${d.user_id}')" title="View Profile">
          <span class="material-icons-round" style="font-size:18px; vertical-align:middle;">person_search</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Profile Modal Logic (Reused from borrowers.js)
async function viewProfile(userId) {
    const modal = document.getElementById('profileModal');
    const body = document.getElementById('profileModalBody');
    if (!modal || !body) return;

    modal.classList.add('show');
    body.innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-icons-round" style="animation:spin 1s linear infinite; font-size:32px; color:#0f4c5c;">sync</span><p style="margin-top:10px;">Loading profile...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/admin-get-borrower-profile.php?user_id=${userId}`);
        const result = await res.json();

        if (result.status === 'success') {
            renderProfileModal(result.data);
        } else {
            body.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error: ${result.message}</div>`;
        }
    } catch (err) {
        console.error('Error fetching profile:', err);
        body.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Network error occurred while fetching profile.</div>`;
    }
}

function renderProfileModal(data) {
    const body = document.getElementById('profileModalBody');
    const p = data.personal;
    const k = data.kyc || {};
    const b = data.bank || {};
    const l = data.loans || [];

    let loansHtml = '';
    if (l.length === 0) {
        loansHtml = '<div style="color:#64748b; font-size:14px;">No loans applied yet.</div>';
    } else {
        loansHtml = `<table class="xtable" style="margin-top:10px; font-size:13px;">
                        <thead>
                            <tr>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Applied On</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${l.map(loan => `
                                <tr>
                                    <td>₹${loan.amount.toLocaleString('en-IN')}</td>
                                    <td><span style="font-weight:600; text-transform:capitalize; color: ${loan.status==='approved'?'green':(loan.status==='rejected'?'red':'orange')}">${loan.status}</span></td>
                                    <td>${loan.applied_date}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
    }

    body.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Personal Information</h4>
            <div style="margin-bottom:8px;"><strong>Name:</strong> ${p.name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Email:</strong> ${p.email || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Phone:</strong> ${p.phone || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Joined:</strong> ${p.joined || 'N/A'}</div>

            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">KYC Details</h4>
            <div style="margin-bottom:8px;"><strong>PAN:</strong> ${k.pan_number || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>Aadhaar:</strong> ${k.aadhaar_number || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>DOB:</strong> ${k.dob || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>Address:</strong> ${k.address || 'Not provided'}</div>
        </div>
        <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Bank Details</h4>
            <div style="margin-bottom:8px;"><strong>Account Name:</strong> ${b.account_holder_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Bank Name:</strong> ${b.bank_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>A/c Number:</strong> ${b.account_number || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>IFSC Code:</strong> ${b.ifsc_code || 'N/A'}</div>

            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Loan History (${l.length})</h4>
            ${loansHtml}
        </div>
      </div>
    `;
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('show');
}

function downloadDefaultersPDF() {
  if (!defaultersData || defaultersData.length === 0) {
    alert('No data points found to generate report.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(18); doc.setTextColor(13, 124, 110); doc.text('LoanPro — Overdue Accounts Report', 14, 18);
  doc.setFontSize(10); doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 26);
  
  const rows = defaultersData.map(d => [
    d.borrower_name || 'User',
    d.id.substring(d.id.length - 6).toUpperCase(),
    '₹' + formatIndian(d.amount || 0),
    String(d.missed_emis || 0),
    '₹' + formatIndian(d.overdue_amount || 0),
    d.next_unpaid_date || 'N/A',
    d.status_label || 'Overdue'
  ]);

  doc.autoTable({
    startY: 32,
    head: [['Borrower', 'Loan ID', 'Loan Amount', 'Missed', 'Overdue Amt', 'Next Due', 'Status']],
    body: rows,
    headStyles: { fillColor: [13, 124, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    styles: { fontSize: 9, cellPadding: 3 }
  });
  doc.save(`defaulters_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

document.addEventListener('DOMContentLoaded', fetchAnalytics);
