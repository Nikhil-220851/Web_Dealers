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
    const res  = await fetch(`../../backend/api/get-user-loans.php?userId=${userId}`);
    const json = await res.json();

    if (json.status === 'success') {
      allLoans = json.data;
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
  const counts = { pending: 0, approved: 0, rejected: 0 };
  allLoans.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });

  const pendingBadge   = document.getElementById('tab-count-pending');
  const approvedBadge  = document.getElementById('tab-count-approved');
  const rejectedBadge  = document.getElementById('tab-count-rejected');
  if (pendingBadge)  pendingBadge.textContent  = counts.pending;
  if (approvedBadge) approvedBadge.textContent = counts.approved;
  if (rejectedBadge) rejectedBadge.textContent = counts.rejected;
}

function renderLoansTable(tab) {
  const filtered = allLoans.filter(l => l.status === tab);
  const wrap = document.getElementById('loans-table-wrap');
  if (!wrap) return;

  if (!filtered.length) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <i class="ph ph-clipboard-text" style="font-size:40px;color:var(--text3);display:inline-block;margin-bottom:12px"></i>
        <h3 style="color:var(--text1);margin-bottom:6px">No ${tab} loans</h3>
        <p style="color:var(--text2);font-size:14px">${tab === 'pending' ? '<a href="apply-loan.html" class="btn btn-primary" style="margin-top:12px;display:inline-block">Browse Loans</a>' : 'Nothing here yet.'}</p>
      </div>`;
    return;
  }

  const badgeStyle = {
    pending:  'background:#fef3c7;color:#92400e',
    approved: 'background:var(--green-bg);color:var(--green)',
    rejected: 'background:#fee2e2;color:#991b1b',
  };

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;padding:10px 0">
      ${filtered.map(l => `
        <div class="card" style="padding:20px;border:1px solid var(--border);border-radius:14px;background:var(--surface);display:flex;flex-direction:column;gap:16px;position:relative">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:46px;height:46px;border-radius:10px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:4px;overflow:hidden">
                <img src="${getBankLogo(l.bank_name)}" alt="${l.bank_name}" class="bank-logo-img" style="max-width:100%;max-height:100%;object-fit:contain;display:block" onerror="this.style.display='none';this.parentElement.textContent='${l.bank_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}'">
              </div>
              <div>
                <div style="font-size:12px;color:var(--text2);margin-bottom:2px">${l.bank_name}</div>
                <div style="font-size:18px;font-weight:700;color:var(--text1);font-family:var(--font-d)">${l.loan_type}</div>
              </div>
            </div>
            <span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;${badgeStyle[l.status] || ''}">
              ${l.status.toUpperCase()}
            </span>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="background:var(--bg);border-radius:8px;padding:10px">
              <div style="font-size:11px;color:var(--text2);margin-bottom:2px">Loan Amount</div>
              <div style="font-weight:700;color:var(--primary);font-size:15px">₹${parseInt(l.loan_amount).toLocaleString('en-IN')}</div>
            </div>
            <div style="background:var(--bg);border-radius:8px;padding:10px">
              <div style="font-size:11px;color:var(--text2);margin-bottom:2px">Tenure</div>
              <div style="font-weight:700;color:var(--text1);font-size:15px">${l.loan_tenure} Months</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border);font-size:12px">
            <div style="color:var(--text2)">Applied on: <span style="font-weight:600;color:var(--text1)">${l.applied_date || '—'}</span></div>
            <button class="btn btn-ghost" style="padding:6px 12px;font-size:12px;height:auto">View Details</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function getBankLogo(bankName) {
  const map = {
    'HDFC Bank':           'HDFC',
    'State Bank of India': 'SBI',
    'ICICI Bank':          'ICICI',
    'Axis Bank':           'AXIS',
    'Kotak Mahindra Bank': 'KOTAK',
    'Canara Bank':         'CANARA',
  };
  const key = map[bankName] || bankName.split(' ')[0].toUpperCase();
  return `../assets/images/banks/${key}.png`;
}