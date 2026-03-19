/* =====================================================
   APPLY LOANS MARKETPLACE — apply-loan.js
   Fetches products from MongoDB and renders the grid.
   Cards show basic info only; "See More" opens details.
===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Wire amount slider display
  const amtSlider  = document.getElementById('filter-amount');
  const amtDisplay = document.getElementById('filter-amt-display');
  if (amtSlider && amtDisplay) {
    amtSlider.addEventListener('input', () => {
      amtDisplay.textContent = '₹' + parseInt(amtSlider.value).toLocaleString('en-IN');
    });
  }

  // Wire search button
  const searchBtn = document.getElementById('btn-search-loans');
  if (searchBtn) searchBtn.addEventListener('click', fetchLoans);

  // Load on page open
  fetchLoans();
});

async function fetchLoans() {
  const grid = document.getElementById('loanCardsGrid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text2)"><i class="ph ph-spinner" style="font-size:28px;display:inline-block;animation:spin 1s linear infinite"></i><br><br>Loading loan offers…</div>';

  try {
    const loanType = document.getElementById('filter-loan-type')?.value || 'All Types';
    const bankName = document.getElementById('filter-bank')?.value    || 'All Banks';

    const params = new URLSearchParams({ loanType, bankName });
    const res    = await fetch('../../backend/api/get-loan-products.php?' + params);
    const json   = await res.json();

    if (json.status === 'success') {
      renderLoanCards(json.data);
    } else {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:red">Error: ${json.message}</div>`;
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:red">Failed to connect to server. Is XAMPP running?</div>';
  }
}

function renderLoanCards(loans) {
  const grid = document.getElementById('loanCardsGrid');
  if (!loans || loans.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;border:1px dashed var(--border);border-radius:12px">
        <i class="ph ph-magnifying-glass" style="font-size:40px;color:var(--text3);display:inline-block;margin-bottom:12px"></i>
        <h3 style="color:var(--text1);margin-bottom:8px">No loans found</h3>
        <p style="color:var(--text2);font-size:14px">Try changing the filters.</p>
      </div>`;
    return;
  }

  grid.innerHTML = loans.map(loan => {
    const maxLakhs  = ((loan.max_amount || 0) / 100000).toFixed(0);
    const tenureYrs = loan.tenure ? (loan.tenure >= 12 ? Math.round(loan.tenure / 12) + ' Yrs' : loan.tenure + ' Mo') : '—';

    let badge = '';
    if (loan.interest_rate <= 8.5)   badge = '<span class="loan-card-badge badge-low">Low Rate</span>';
    else if (loan.max_amount >= 5e6) badge = '<span class="loan-card-badge badge-high">High Value</span>';

    const logoSrc = getBankLogo(loan.bank_name);

    return `
    <div class="loan-card">
      <div class="loan-card-header">
        <div class="loan-card-bank-avatar" style="overflow:hidden">
          <img src="${logoSrc}" alt="${loan.bank_name}" class="bank-logo-img" style="width:100%;height:100%;object-fit:contain;display:block" onerror="this.style.display='none';this.parentElement.textContent='${loan.bank_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}'">
        </div>
        <div class="loan-card-info">
          <div class="loan-card-bank-name">${loan.bank_name}</div>
          <div class="loan-card-type">${loan.loan_type}</div>
        </div>
        ${badge}
      </div>

      <div class="loan-card-stats">
        <div class="loan-card-stat">
          <div class="loan-card-stat-label">Interest Rate</div>
          <div class="loan-card-stat-value text-primary">${loan.interest_rate}% p.a.</div>
        </div>
        <div class="loan-card-stat">
          <div class="loan-card-stat-label">Max Amount</div>
          <div class="loan-card-stat-value">₹${maxLakhs}L</div>
        </div>
        <div class="loan-card-stat">
          <div class="loan-card-stat-label">Tenure</div>
          <div class="loan-card-stat-value">${tenureYrs}</div>
        </div>
      </div>

      <button class="btn btn-primary w-full loan-card-btn" onclick="window.location.href='loan-details.html?loanId=${loan.id}'">
        See More <i class="ph ph-arrow-right"></i>
      </button>
    </div>`;
  }).join('');
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

async function checkProfileBeforeLoan() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../auth/login.html';
        return false;
    }

    const res  = await fetch(`../../backend/api/check-profile-complete.php?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();

    if (!data.complete) {
        const missing = data.missing.join(', ');
        const go = confirm(
            `⚠️ Your profile is incomplete.\n\nMissing: ${missing}\n\n` +
            `You must complete your profile before applying for a loan.\n\nGo to Profile now?`
        );
        if (go) window.location.href = 'profile.html';
        return false;
    }
    return true;
}

// Call on page load
window.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../auth/login.html';
        return;
    }
    const allowed = await checkProfileBeforeLoan();
    if (!allowed) {
        // Hide the form if incomplete
        document.querySelector('.apply-form-container')?.style.setProperty('display', 'none');
    }
});