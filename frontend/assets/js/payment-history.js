/* ═══════════════════════════════════════════════
   PAYMENT HISTORY LOGIC
═══════════════════════════════════════════════ */

function initPaymentRows() {
  document.querySelectorAll('.data-table tbody tr').forEach(row => {
    row.classList.add('txn-row');
  });
}

async function loadPaymentHistory() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  const tbody = document.querySelector('.data-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading payment history...</td></tr>';

  try {
    const response = await fetch(`../../backend/api/get-emi-payments.php?userId=${userId}`);
    const result = await response.json();
    
    if (result.status === 'success') {
      const payments = result.data;
      
      if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">No payment history found.</td></tr>';
        return;
      }

      tbody.innerHTML = payments.map(payment => {
        const statusVal = (payment.status || 'success').toLowerCase();
        let label = statusVal === 'completed' ? 'Completed' : statusVal === 'failed' ? 'Failed' : statusVal === 'pending' ? 'Pending' : 'Paid';
        const badgeClass = label === 'Completed' ? 'badge-blue' : label === 'Failed' ? 'badge-red' : label === 'Pending' ? 'badge-yellow' : 'badge-green';
        const amt = payment.amount ?? payment.emi_amount ?? 0;
        const dateVal = payment.date || payment.payment_date || payment.created_at || '-';

        return `
          <tr class="txn-row">
            <td><span class="loan-id num-font">${payment.transaction_id || '-'}</span></td>
            <td><span class="loan-id num-font">${(payment.loan_id || '').toString().slice(-8)}</span></td>
            <td class="num-font">${typeof dateVal === 'string' && dateVal !== '-' ? new Date(dateVal).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : dateVal}</td>
            <td class="amount-col num-font">₹${Math.round(amt).toLocaleString('en-IN')}</td>
            <td>${payment.method || payment.payment_method || '—'}</td>
            <td><span class="badge ${badgeClass}">${label}</span></td>
          </tr>
        `;
      }).join('');
      
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--red);">Error: ${result.message}</td></tr>`;
    }
  } catch (error) {
    console.error('Failed to load payment history:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--red);">System error loading history.</td></tr>';
  }
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
async function loadActiveLoanBanner() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`../../backend/api/get-dashboard-data.php?userId=${userId}`);
        const result = await response.json();
        
        const bannerContainer = document.querySelector('.active-loan-banner');
        if (!bannerContainer) return;

        if (result.status === 'success' && result.data.activeLoans && result.data.activeLoans.length > 0) {
            const loans = result.data.activeLoans;
            bannerContainer.innerHTML = loans.map(loan => {
              const emiAmount = loan.emi_amount || (loan.amount / loan.tenure);
              const paid = loan.total_emis_paid || 0;
              const total = loan.tenure || 0;
              return `
              <div class="card" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                  <div>
                    <div class="font-bold" style="font-size:15px">Loan <span class="num-font">${loan.id}</span></div>
                    <div class="text-sm text-muted mt-8">EMI: <span class="num-font">₹${Math.round(emiAmount).toLocaleString('en-IN')}</span></div>
                    <div class="text-xs text-muted mt-4">EMIs Paid: <span class="num-font">${paid} / ${total}</span></div>
                  </div>
                  <div style="text-align:right; font-size:11px; color:var(--text3);">
                    <div style="text-transform: uppercase;">Loan Status</div>
                    <div class="font-bold" style="font-size:14px; color: ${loan.emi_status === 'overdue' ? 'var(--red)' : (loan.emi_status === 'paid' ? 'var(--green)' : 'var(--yellow)')}; text-transform: capitalize;">${loan.emi_status || 'Pending'}</div>
                  </div>
                </div>
                <div style="margin-top:10px; text-align:right;">
                  <button class="btn btn-primary" data-emi-pay-btn data-loan-id="${loan.id}" onclick="startEmiFlow('${loan.id}')" ${loan.remaining_emis === 0 || loan.emi_status === 'paid' ? 'disabled' : ''}>
                    <i class="ph ph-credit-card"></i> ${loan.remaining_emis === 0 ? 'Loan Completed' : (loan.emi_status === 'paid' ? 'Paid for Cycle' : (loan.emi_status === 'overdue' ? 'Overdue - Pay Now' : 'Pay EMI'))}
                  </button>
                </div>
              </div>`;
            }).join('');

            bannerContainer.style.display = 'block';
            bannerContainer.style.marginBottom = '20px';

            initEmiTimers();
        } else {
            bannerContainer.style.display = 'none';
        }
    } catch(err) {
        console.error('Failed to load active loan banner:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPaymentHistory();
  loadActiveLoanBanner();
});

// Shared with dashboard.js
window.startEmiFlow = function(loanId) {
  if (!loanId) return;
  sessionStorage.setItem('payEmiLoanId', loanId);
  window.location.href = "../borrower/emi-payment.html";
};

function initEmiTimers() {
  // empty legacy function as timers are no longer used
}
