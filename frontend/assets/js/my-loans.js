/* =====================================================
   MY LOANS — my-loans.js
   Loads loan applications from MongoDB dynamically.
   No static demo data.
===================================================== */

let allLoans = [];
let currentTab = 'pending';

document.addEventListener('DOMContentLoaded', () => {
  loadUserLoans();
});

async function loadUserLoans() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    renderEmpty('pending');
    return;
  }

  const wrap = document.getElementById('loans-table-wrap');
  if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">Loading your loans…</div>';

  try {
    const res = await fetch(`../../backend/api/get-user-loans.php?userId=${userId}`);
    const json = await res.json();

    if (json.status === 'success') {
      console.log("Loans API Response:", json.data);
      // Normalize statuses to lowercase for robust matching
      allLoans = json.data.map(l => ({
        ...l,
        status: (l.status || 'pending').toLowerCase()
      }));
      renderLoansTable(currentTab);
      updateTabCounts();
    } else {
      if (wrap) wrap.innerHTML = `<div style="text-align:center;padding:40px;color:red">Error: ${json.message}</div>`;
    }
  } catch (e) {
    console.error(e);
    if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:40px;color:red">Failed to connect to server.</div>';
  }
}

function switchLoanTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLoansTable(tab);
}

function updateTabCounts() {
  const counts = { pending: 0, approved: 0, rejected: 0, closed: 0 };
  allLoans.forEach(l => {
    if (counts[l.status] !== undefined) counts[l.status]++;
  });
  const p = document.getElementById('tab-count-pending');
  const a = document.getElementById('tab-count-approved');
  const r = document.getElementById('tab-count-rejected');
  const c = document.getElementById('tab-count-closed');
  if (p) p.textContent = counts.pending;
  if (a) a.textContent = counts.approved;
  if (r) r.textContent = counts.rejected;
  if (c) c.textContent = counts.closed;

  console.log("Filtered Counts:", counts);
}

function renderLoansTable(tab) {
  const filtered = allLoans.filter(l => l.status === tab);
  const wrap = document.getElementById('loans-table-wrap');
  if (!wrap) return;

  if (!filtered.length) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <i class="ph ph-clipboard-text"
           style="font-size:40px;color:var(--text3);display:inline-block;margin-bottom:12px"></i>
        <h3 style="color:var(--text1);margin-bottom:6px">No ${tab} loans</h3>
        <p style="color:var(--text2);font-size:14px">
          ${tab === 'pending'
            ? '<a href="apply-loan.html" class="btn btn-primary" style="margin-top:12px;display:inline-block">Browse Loans</a>'
            : tab === 'rejected'
            ? 'No rejected loans. <a href="apply-loan.html" class="btn btn-primary btn-sm" style="margin-left:8px;">Apply Again</a>'
            : tab === 'closed'
            ? 'No fully paid loans yet.'
            : 'Nothing here yet.'}
        </p>
      </div>`;
    return;
  }

  // Badge styles per status
  const badgeStyle = {
    pending:  'background:#fef3c7;color:#92400e',
    approved: 'background:var(--green-bg);color:var(--green)',
    rejected: 'background:#fee2e2;color:#991b1b',
    closed:   'background:#f1f5f9;color:#475569',
  };
  const badgeLabel = {
    pending:  'Pending',
    approved: 'Active ✓',
    rejected: 'Rejected',
    closed:   'Closed ✓',
  };

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;padding:10px 0">
      ${filtered.map(l => {
        const amount   = parseInt(l.loan_amount || 0).toLocaleString('en-IN');
        const initials = (l.bank_name || 'BK').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const logoSrc  = getBankLogo(l.bank_name);

        // Remarks bubble color
        const remarksBg    = l.status === 'approved' ? '#f0fdf4'
                           : l.status === 'rejected'  ? '#fff5f5'
                           : '#f8fafc';
        const remarksBorder = l.status === 'approved' ? '#bbf7d0'
                            : l.status === 'rejected'  ? '#fecaca'
                            : '#e2e8f0';
        const remarksColor  = l.status === 'approved' ? '#166534'
                            : l.status === 'rejected'  ? '#991b1b'
                            : '#475569';

        // Action buttons
        let actionHtml = '';
        if (l.status === 'approved') {
         
        } else if (l.status === 'rejected') {

           

        } else if (l.status === 'pending') {
          actionHtml = `
            <span style="font-size:12px;color:var(--text3);
                display:flex;align-items:center;gap:4px;">
              <i class="ph ph-hourglass" style="color:var(--yellow)"></i>
              Under Review
            </span>`;
        } else if (l.status === 'closed') {
          actionHtml = `
            <span style="font-size:12px;color:#16a34a;
                display:flex;align-items:center;gap:4px;font-weight:600;">
              <i class="ph ph-check-circle"></i>
              Fully Paid ✓
            </span>`;
        }

        return `
        <div class="card"
             style="padding:20px;border:1px solid var(--border);border-radius:14px;
                    background:var(--surface);display:flex;flex-direction:column;gap:16px;">

          <!-- Header: Bank + Status Badge -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:46px;height:46px;border-radius:10px;background:var(--bg);
                   border:1px solid var(--border);display:flex;align-items:center;
                   justify-content:center;flex-shrink:0;padding:4px;overflow:hidden">
                <img src="${logoSrc}" alt="${l.bank_name}"
                     style="max-width:100%;max-height:100%;object-fit:contain;display:block"
                     onerror="this.style.display='none';
                              this.parentElement.textContent='${initials}'">
              </div>
              <div>
                <div style="font-size:12px;color:var(--text2);margin-bottom:2px">
                  ${l.bank_name}
                </div>
                <div style="font-size:18px;font-weight:700;color:var(--text1);
                     font-family:var(--font-d)">
                  ${l.loan_type}
                </div>
              </div>
            </div>
            <span style="padding:4px 12px;border-radius:20px;font-size:11px;
                 font-weight:700;white-space:nowrap;${badgeStyle[l.status]||''}">
              ${badgeLabel[l.status] || l.status}
            </span>
          </div>

          <!-- Amount + Tenure -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="background:var(--bg);border-radius:8px;padding:10px">
              <div style="font-size:11px;color:var(--text2);margin-bottom:2px">
                Loan Amount
              </div>
              <div class="num-font" style="font-weight:700;color:var(--primary);font-size:15px">
                ₹${amount}
              </div>
            </div>
            <div style="background:var(--bg);border-radius:8px;padding:10px">
              <div style="font-size:11px;color:var(--text2);margin-bottom:2px">
                Tenure
              </div>
              <div class="num-font" style="font-weight:700;color:var(--text1);font-size:15px">
                ${l.loan_tenure} Months
              </div>
            </div>
          </div>

          <!-- Admin Remarks bubble -->
          ${l.remarks ? `
          <div style="background:${remarksBg};border:1px solid ${remarksBorder};
               border-radius:8px;padding:10px 12px;font-size:12.5px;
               font-style:italic;color:${remarksColor};">
            <i class="ph ph-chat-circle-text" style="margin-right:5px;"></i>
            "${l.remarks}"
          </div>` : ''}

          <!-- Reviewed date for approved/rejected -->
          ${l.reviewed_at && l.status !== 'pending' ? `
          <div style="font-size:11px;color:var(--text3);">
            ${l.status === 'approved' ? '✅ Approved' :
              l.status === 'rejected' ? '❌ Rejected' :
              '🔒 Closed'} on <span class="num-font">${l.reviewed_at}</span>
          </div>` : ''}

          <!-- Footer: Applied date + Action button -->
          <div style="display:flex;justify-content:space-between;align-items:center;
               padding-top:12px;border-top:1px solid var(--border);font-size:12px">
            <div style="color:var(--text2)">
              Applied:
              <span class="num-font" style="font-weight:600;color:var(--text1)">
                ${l.applied_date || '—'}
              </span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="btn btn-ghost" style="padding:6px 12px;font-size:12px;height:auto">View Details</button>
              ${actionHtml}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function getBankLogo(bankName) {
  const map = {
    'HDFC Bank': 'HDFC',
    'State Bank of India': 'SBI',
    'ICICI Bank': 'ICICI',
    'Axis Bank': 'AXIS',
    'Kotak Mahindra Bank': 'KOTAK',
    'Canara Bank': 'CANARA',
    'IndusInd Bank': 'INDUSLAND',
    'Punjab National Bank': 'PUNJABNATIONALBANK',
    'Bank of Baroda': 'BANKOFBARODA',
  };
  const key = map[bankName] || bankName.split(' ')[0].toUpperCase();
  return `../assets/images/banks/${key}.png`;
}